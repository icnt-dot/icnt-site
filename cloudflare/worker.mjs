/* ICNT gateway. No records or credentials are persisted in this Worker. */
const ACTIONS = new Set(['catalog','requestCode','verifyCode','state','availability','availabilityWeek','book','shortenBooking','extendBooking','extensionOptions','cancel','logout','queue','decide','reschedule','saveEquipment','saveUser','export','reports','saveReport','uploadReportFile','downloadReportFile','reportHistory']);
const PUBLIC = new Set(['catalog','requestCode','verifyCode']);
const MAX_BODY = 7 * 1024 * 1024;
const encoder = new TextEncoder();
const hex = bytes => [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2,'0')).join('');
function fail(code) { throw new Error(code); }
async function boundedText(message, maximum) {
  const length = Number(message.headers.get('content-length'));
  if (length > maximum) fail('FILE_SIZE');
  const reader = message.body?.getReader();
  if (!reader) return '';
  let size=0; const chunks=[];
  try { while (true) { const {done,value}=await reader.read(); if(done)break; size+=value.byteLength; if(size>maximum)fail('FILE_SIZE'); chunks.push(value); } }
  catch(error) { await reader.cancel().catch(()=>{}); throw error; }
  finally { reader.releaseLock(); }
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
function upstreamURL(value) {
  let url;try{url=new URL(value);}catch(_){fail('GATEWAY_SETUP');}
  if(url.protocol!=='https:' || url.hostname!=='script.google.com' || url.username || url.password || url.port || url.search || url.hash || !/^\/macros\/s\/[\w-]+\/exec$/.test(url.pathname))fail('GATEWAY_SETUP');
  return url.href;
}
export async function handle(request,env,fetcher=fetch) {
  let origin='',headers;
  const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
  try {
    const allowed=String(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
    origin=request.headers.get('origin')||'';
    headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','Vary':'Origin','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
    if(!origin || !allowed.includes(origin))return respond({ok:false,error:'FORBIDDEN'},403);
    headers['Access-Control-Allow-Origin']=origin;
    if(new URL(request.url).pathname!=='/api/booking')return respond({ok:false,error:'NOT_FOUND'},404);
    if(request.method==='OPTIONS') {
      if(request.headers.get('access-control-request-method')!=='POST')return respond({ok:false,error:'FORBIDDEN'},403);
      return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}});
    }
    if(request.method!=='POST')return respond({ok:false,error:'ACTION'},405);
    if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return respond({ok:false,error:'INPUT'},415);
    if(!/^[a-f0-9]{64}$/.test(env.GATEWAY_SECRET||'') || !env.API_LIMITER || !env.AUTH_LIMITER)fail('GATEWAY_SETUP');
    const upstream=upstreamURL(env.APPS_SCRIPT_URL);
    // Coarse burst protection before reading a potentially large upload. Shared NATs get a generous limit.
    const ip=request.headers.get('cf-connecting-ip')||'unknown';
    const ipKey=hex(await crypto.subtle.digest('SHA-256',encoder.encode('ip:'+ip)));
    if(!(await env.API_LIMITER.limit({key:ipKey})).success)return respond({ok:false,error:'RATE'},429);
    let input;try{input=JSON.parse(await boundedText(request,MAX_BODY));}catch(error){if(error.message==='FILE_SIZE')throw error;fail('INPUT');}
    if(!input || typeof input!=='object' || Array.isArray(input) || !ACTIONS.has(input.action) || !input.payload || typeof input.payload!=='object' || Array.isArray(input.payload))fail('INPUT');
    if(!PUBLIC.has(input.action) && !/^[a-f0-9]{64}$/.test(input.token||''))return respond({ok:false,error:'AUTH'},401);
    if(['requestCode','verifyCode'].includes(input.action)) {
      const email=String(input.payload.email||'').trim().toLowerCase();
      const key=hex(await crypto.subtle.digest('SHA-256',encoder.encode(input.action+':'+email)));
      if(!(await env.AUTH_LIMITER.limit({key})).success)return respond({ok:false,error:'RATE'},429);
    }
    // Rebuild the allowlisted envelope: browser-supplied signatures/URLs are never forwarded.
    const body=JSON.stringify({action:input.action,payload:input.payload,token:typeof input.token==='string'?input.token:''});
    const timestamp=Date.now(),nonce=crypto.randomUUID().replace(/-/g,'');
    const key=await crypto.subtle.importKey('raw',encoder.encode(env.GATEWAY_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const signature=hex(await crypto.subtle.sign('HMAC',key,encoder.encode(timestamp+'\n'+nonce+'\n'+body)));
    const signal=AbortSignal.timeout(60000);
    let response=await fetcher(upstream,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({timestamp,nonce,body,signature}),redirect:'manual',signal});
    // ContentService redirects to a one-use Google content URL. Never forward POST body or secret there.
    if([301,302,303].includes(response.status)) {
      const next=new URL(response.headers.get('location')||'',upstream);
      if(next.protocol!=='https:'||next.hostname!=='script.googleusercontent.com'||next.username||next.password||next.port)fail('GATEWAY_DEPLOYMENT');
      await response.body?.cancel();
      // Use manual here too: Workers runtimes may reject the Fetch 'error' mode.
      // Any further 3xx fails the response.ok check below; no unchecked redirects.
      response=await fetcher(next.href,{method:'GET',redirect:'manual',signal});
    }
    if(!response.ok || !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')||''))fail('GATEWAY_DEPLOYMENT');
    let result;try{result=JSON.parse(await boundedText(response,10*1024*1024));}catch(_){fail('SERVER');}
    if(!result || typeof result.ok!=='boolean')fail('SERVER');
    if(!result.ok && !/^[A-Z_]{2,40}$/.test(result.error||''))fail('SERVER');
    return respond(result.ok?{ok:true,data:result.data}:{ok:false,error:result.error});
  } catch(error) {
    const code=['INPUT','FILE_SIZE','GATEWAY_SETUP','GATEWAY_DEPLOYMENT'].includes(error.message)?error.message:['TimeoutError','AbortError'].includes(error.name)?'TIMEOUT':'SERVER';
    return respond({ok:false,error:code},code==='INPUT'?400:code==='FILE_SIZE'?413:503);
  }
}
export default {fetch:(request,env)=>handle(request,env)};

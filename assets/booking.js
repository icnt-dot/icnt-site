(function () {
  'use strict';
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const root = $('#booking-app'); if (!root) return;
  const C = ICNTCore, live = Boolean(window.google && google.script && google.script.run);
  const initial = window.ICNT_INITIAL || {};
  const query = new URLSearchParams(location.search);
  let lang = document.documentElement.lang === 'hy' ? 'hy' : 'en';
  if (live) lang = initial.lang === 'hy' ? 'hy' : 'en';
  let equipment = [], user = null, token = '', bookings = [], users = [], queue = [];
  let equipmentId = initial.equipment || query.get('equipment') || 'afm', selectedDate = C.day(Date.now()), selectedTime = '', duration = 60, tab = 'calendar', group = 'all', busy = [], loadId = 0, requestId = '', liveUrl = '';
  let portalLoaded = false;
  let availabilityReady = false, availabilityError = '';
  const words = {
    eyebrow:['ICNT / RESEARCH ACCESS','ICNT / ՀԵՏԱԶՈՏԱԿԱՆ ՀԱՍԱՆԵԼԻՈՒԹՅՈՒՆ'],heading:['Make time for discovery.','Ժամանակ՝ բացահայտումների համար։'],intro:['Find your instrument, choose a time and send a request to the Center. All times are shown in Yerevan time.','Ընտրեք սարքը, գտեք հարմար ժամը և հայտ ուղարկեք կենտրոնին։ Բոլոր ժամերը Երևանի ժամանակով են։'],
    tabs:['Booking sections','Ամրագրման բաժիններ'],calendar:['Book equipment','Ամրագրել սարքը'],mine:['My requests','Իմ հայտերը'],manage:['Manage bookings','Կառավարել ամրագրումները'],signIn:['Sign in','Մուտք'],signOut:['Sign out','Ելք'],findEquipment:['01 / Choose equipment','01 / Ընտրեք սարքը'],search:['Search instruments…','Որոնել սարքը…'],all:['All','Բոլորը'],fabrication:['Fabrication','Ֆաբրիկացում'],characterization:['Characterization','Բնութագրում'],date:['Date','Ամսաթիվ'],previous:['Previous day','Նախորդ օրը'],next:['Next day','Հաջորդ օրը'],today:['Today','Այսօր'],availableTimes:['02 / Choose your time','02 / Ընտրեք ժամը'],duration:['Duration','Տևողություն'],free:['Available','Ազատ'],pending:['Awaiting approval','Սպասում է հաստատման'],approved:['Approved','Հաստատված'],rejected:['Rejected','Մերժված'],cancelled:['Cancelled','Չեղարկված'],past:['Unavailable','Անհասանելի'],requestStep:['03 / YOUR REQUEST','03 / ՁԵՐ ՀԱՅՏԸ'],chooseTime:['Select an available time','Ընտրեք ազատ ժամ'],requestHelp:['A request holds the selected time while a manager reviews it. Wait for approval in “My requests” before using the equipment.','Հայտը զբաղեցնում է ընտրված ժամը՝ մինչև պատասխանատուի որոշումը։ Սարքից օգտվելուց առաջ սպասեք հաստատմանը «Իմ հայտերը» բաժնում։'],name:['Full name','Անուն, ազգանուն'],organization:['Organization / group','Կազմակերպություն / խումբ'],purpose:['Experiment and sample details','Փորձի և նմուշի տվյալներ'],purposePlaceholder:['Describe the planned work and sample requirements.','Նկարագրեք նախատեսվող աշխատանքը և նմուշի պահանջները։'],confirm:['I understand that this request needs approval and does not replace equipment training.','Հասկանում եմ, որ հայտը պետք է հաստատվի և չի փոխարինում սարքով աշխատելու ուսուցմանը։'],submit:['Send booking request →','Ուղարկել ամրագրման հայտը →'],mineHelp:['Track your requests here. Pending and approved requests reserve the selected time.','Այստեղ հետևեք ձեր հայտերի կարգավիճակին։ Սպասող և հաստատված հայտերը զբաղեցնում են ընտրված ժամը։'],refresh:['Refresh','Թարմացնել'],manager:['MANAGER WORKSPACE','ՊԱՏԱՍԽԱՆԱՏՈՒԻ ԲԱԺԻՆ'],export:['Export CSV','Արտահանել CSV'],requests:['Requests','Հայտեր'],equipmentSettings:['Equipment schedules','Սարքերի ժամացույց'],members:['Members','Օգտատերեր'],status:['Status','Կարգավիճակ'],scheduleHelp:['Confirm each instrument’s working hours before enabling bookings. Existing requests keep their times when you edit a schedule.','Ամրագրումները միացնելուց առաջ հաստատեք յուրաքանչյուր սարքի աշխատանքային ժամերը։ Ժամացույցի փոփոխությունը չի փոխում արդեն ուղարկված հայտերի ժամերը։'],equipment:['Equipment','Սարքավորում'],open:['Opens at','Սկիզբ'],close:['Closes at','Ավարտ'],weekdays:['Working days','Աշխատանքային օրեր'],slot:['Time step (minutes)','Քայլը (րոպե)'],maxMinutes:['Maximum duration (minutes)','Առավելագույն տևողությունը (րոպե)'],maxDays:['Days ahead','Քանի օր առաջ'],enable:['Enable booking requests','Միացնել ամրագրման հայտերը'],save:['Save schedule','Պահպանել ժամացույցը'],membersHelp:['Invite a researcher by adding their email. Only active invited members can receive a sign-in code. Edit a member to revoke access or change their role.','Ավելացրեք հետազոտողի էլփոստը՝ նրան հրավիրելու համար։ Մուտքի կոդ ստանում են միայն ակտիվ հրավիրված օգտատերերը։ Խմբագրելով՝ կարող եք դադարեցնել հասանելիությունը կամ փոխել դերը։'],email:['Email','Էլփոստ'],role:['Role','Դեր'],member:['Researcher','Հետազոտող'],active:['Active access','Ակտիվ հասանելիություն'],saveUser:['Save member','Պահպանել օգտատիրոջը'],privateData:['Your name and booking time are visible to signed-in ICNT members. Experiment details are visible to you and the Center’s managers.','Ձեր անունն ու ամրագրման ժամը տեսանելի են մուտք գործած ICNT օգտատերերին։ Փորձի տվյալները տեսանելի են ձեզ և կենտրոնի պատասխանատուներին։'],closeDialog:['Close sign-in','Փակել մուտքի պատուհանը'],sendCode:['Send sign-in code','Ուղարկել մուտքի կոդը'],code:['Six-digit code','Վեցանիշ կոդ'],verify:['Verify and sign in','Հաստատել և մուտք գործել'],
    liveBanner:['Equipment bookings · Your requests are stored in the Center’s private Google account.','Սարքերի ամրագրում · Ձեր հայտերը պահվում են կենտրոնի փակ Google հաշվում։'],openPortal:['Open booking portal','Բացել ամրագրման համակարգը'],connectedBanner:['View available times and send a booking request using your invited email address.','Ազատ ժամերը դիտելու և հայտ ուղարկելու համար մուտք գործեք ձեզ համար գրանցված էլփոստով։'],authHelp:['Use the email invited by an ICNT manager. A sign-in code will be valid for 10 minutes.','Օգտագործեք ICNT պատասխանատուի հրավիրած էլփոստը։ Մուտքի կոդը կգործի 10 րոպե։'],codeSent:['If this email is invited, a code has been sent. Check your inbox and spam folder.','Եթե այս էլփոստը հրավիրված է, կոդն ուղարկվել է։ Ստուգեք նաև սպամի պանակը։'],noEquipment:['No matching equipment.','Համապատասխան սարք չի գտնվել։'],disabled:['Bookings are not enabled for this instrument yet. Contact ICNT for access.','Այս սարքի ամրագրումները դեռ միացված չեն։ Հասանելիության համար կապ հաստատեք ICNT-ի հետ։'],closed:['The instrument is closed on this date. Choose another day.','Այս օրը սարքը հասանելի չէ։ Ընտրեք այլ օր։'],loginTimes:['Sign in to view current availability and request a time.','Մուտք գործեք՝ ազատ ժամերը դիտելու և հայտ ուղարկելու համար։'],loading:['Loading…','Բեռնվում է…'],minutes:['min','րոպե'],noRequests:['No requests to show.','Ցուցադրվող հայտեր չկան։'],cancel:['Cancel request','Չեղարկել հայտը'],approve:['Approve','Հաստատել'],reject:['Reject','Մերժել'],edit:['Edit','Խմբագրել'],inactive:['Inactive','Անջատված'],confirmCancel:['Cancel this booking request?','Չեղարկե՞լ այս ամրագրման հայտը։'],confirmReject:['Reject this booking request?','Մերժե՞լ այս ամրագրման հայտը։'],saved:['Saved.','Պահպանված է։'],requested:['Request sent. You can track its approval in “My requests”.','Հայտն ուղարկված է։ Հաստատմանը հետևեք «Իմ հայտերը» բաժնում։'],expired:['Please sign in again.','Խնդրում ենք նորից մուտք գործել։'],
    portalEyebrow:['YOUR NEXT EXPERIMENT','ՁԵՐ ՀԱՋՈՐԴ ՓՈՐՁԸ'],portalTitle:['Reserve time. Keep discovering.','Ամրագրեք ժամանակ՝ նոր բացահայտումների համար։'],portalAccess:['For invited ICNT members','ICNT-ի գրանցված օգտատերերի համար'],portalNewTab:['Opens in a new tab','Կբացվի նոր ներդիրում'],portalSteps:['How booking works','Ինչպես ամրագրել'],portalStepSignIn:['Sign in with your email code','Մուտք գործեք էլփոստի կոդով'],portalStepTime:['Choose your instrument and time','Ընտրեք սարքն ու ժամը'],portalStepApproval:['Send your request for approval','Ուղարկեք հայտը հաստատման'],portalTimezone:['Yerevan time · UTC+04:00','Երևանի ժամանակ · UTC+04:00'],equipmentCondition:['Equipment condition','Սարքի վիճակ'],available:['Available','Հասանելի'],problem:['Problem','Խնդիր կա'],'out-of-order':['Out of order','Չի աշխատում'],problemHelp:['This instrument has a reported problem. Contact ICNT before planning your work. Requests still require manager approval.','Այս սարքի հետ կապված խնդիր է նշվել։ Աշխատանքը պլանավորելուց առաջ կապ հաստատեք ICNT-ի հետ։ Հայտերը ենթակա են պատասխանատուի հաստատմանը։'],outOfOrderHelp:['This instrument is out of order. New bookings and approvals are paused until the manager restores it.','Սարքը չի աշխատում։ Նոր ամրագրումներն ու հաստատումները դադարեցված են մինչև պատասխանատուի կողմից վերագործարկումը։'],conditionHelp:['Problem shows a warning. Out of order blocks new requests and approvals. Existing bookings are kept.','«Խնդիր կա» վիճակը ցույց է տալիս նախազգուշացում։ «Չի աշխատում» վիճակն արգելում է նոր հայտերն ու հաստատումները։ Նախկին ամրագրումները պահպանվում են։'],supportHelp:['Questions or problems? Email','Հարցերի կամ խնդիրների դեպքում գրեք՝'],supportTitle:['We’re here to help','Կօգնենք ձեր հարցերով']
  };
  words.portalUnavailable=['The booking portal is temporarily unavailable. Please try again later or contact ICNT.','Ամրագրման համակարգը ժամանակավորապես անհասանելի է։ Փորձեք ավելի ուշ կամ կապ հաստատեք ICNT-ի հետ։'];
  words.accepting=['Requests open','Ամրագրումը միացված է'];
  words.bookedBy=['Booked by','Ամրագրող'];
  words.dayBookings=['Reservations for this day','Այս օրվա ամրագրումները'];
  words.noDayBookings=['No reservations for this day.','Այս օրվա համար ամրագրումներ չկան։'];
  words.icntMember=['ICNT member','ICNT օգտատեր'];
  const badges={afm:'AFM',raman:'Raman',electrochemistry:'Zahner',dls:'DLS','high-speed-centrifuge':'HSC','freeze-dryer':'LYO'};
  words.preparation=['Sample preparation','Նմուշների պատրաստում'];
  words.combined=['AFM and Raman share a combined system and can be booked independently at the same time.','AFM-ը և Raman-ը համակցված համակարգի մաս են և կարող են անկախ ամրագրվել նույն ժամին։'];
  words.notBookable=['This instrument is not available for online booking. Contact ICNT.','Այս սարքն առցանց ամրագրման ցանկում չէ։ Կապ հաստատեք ICNT-ի հետ։'];
  const errors={EMAIL:['Enter a valid email.','Մուտքագրեք ճիշտ էլփոստ։'],INPUT:['Check the form fields.','Ստուգեք ձևի դաշտերը։'],DATE:['Choose a valid date.','Ընտրեք ճիշտ ամսաթիվ։'],TIME:['Choose a valid time.','Ընտրեք ճիշտ ժամ։'],SETTINGS:['Check opening hours, working days and duration limits.','Ստուգեք աշխատանքային ժամերը, օրերը և տևողության սահմանները։'],EQUIPMENT:['Choose an instrument.','Ընտրեք սարքը։'],DISABLED:words.disabled,PAST:['Choose a future time within the allowed booking period.','Ընտրեք ապագա ժամ՝ թույլատրելի ամրագրման ժամանակահատվածում։'],CLOSED:words.closed,HOURS:['Choose a time within the instrument’s hours and duration limits.','Ընտրեք սարքի աշխատանքային ժամերին և տևողության սահմաններին համապատասխան ժամ։'],CONFLICT:['This time was just reserved. Refresh and choose another time.','Այս ժամն արդեն զբաղեցված է։ Թարմացրեք և ընտրեք այլ ժամ։'],BUSY:['The system is busy. Try again shortly.','Համակարգը զբաղված է։ Քիչ անց կրկին փորձեք։'],AUTH:words.expired,FORBIDDEN:['You do not have permission for this action.','Այս գործողության իրավունքը չունեք։'],RATE:['Wait at least one minute before requesting another code.','Նոր կոդ խնդրելուց առաջ սպասեք առնվազն մեկ րոպե։'],QUOTA:['The email limit has been reached. Contact ICNT or try again later.','Էլփոստի ուղարկման սահմանը լրացել է։ Կապ հաստատեք ICNT-ի հետ կամ փորձեք ավելի ուշ։'],CODE:['The code is incorrect or expired. Request a new code.','Կոդը սխալ է կամ ժամկետանց։ Խնդրեք նոր կոդ։'],SETUP:['The Google account setup is not complete. Contact ICNT.','Google հաշվի կարգավորումն ավարտված չէ։ Կապ հաստատեք ICNT-ի հետ։'],STATUS:['This request has already changed. Refresh the list.','Այս հայտի կարգավիճակն արդեն փոխվել է։ Թարմացրեք ցանկը։'],OWNER:['The owner’s access must remain active.','Սեփականատիրոջ հասանելիությունը պետք է մնա ակտիվ։'],SERVER:['The operation failed. Try again; if it continues, contact ICNT.','Գործողությունը չհաջողվեց։ Կրկին փորձեք, իսկ խնդրի կրկնվելու դեպքում կապ հաստատեք ICNT-ի հետ։']};
  errors.NOT_BOOKABLE=words.notBookable;errors.OUT_OF_ORDER=words.outOfOrderHelp;
  const t=key=>(words[key]||[key,key])[lang==='hy'?1:0];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const name=e=>e?(lang==='hy'?e.nameHy:e.nameEn):'';
  const eq=()=>equipment.find(e=>e.id===equipmentId);
  const condition=e=>e?.condition||'available';
  const addDays=(d,n)=>new Date(Date.parse(d+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
  const dateLabel=d=>{const months=lang==='hy'?['հնվ','փտր','մրտ','ապր','մյս','հնս','հլս','օգս','սեպ','հոկ','նոյ','դեկ']:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return Number(d.slice(8))+' '+months[Number(d.slice(5,7))-1];};
  const weekday=(d,long=false)=>{const days=lang==='hy'?(long?['Կիրակի','Երկուշաբթի','Երեքշաբթի','Չորեքշաբթի','Հինգշաբթի','Ուրբաթ','Շաբաթ']:['Կիր','Երկ','Երք','Չրք','Հնգ','Ուրբ','Շբթ']):(long?['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']:['Sun','Mon','Tue','Wed','Thu','Fri','Sat']);return days[new Date(d+'T12:00:00Z').getUTCDay()];};
  const uuid=()=>window.crypto?.randomUUID?.()||('req-'+Date.now()+'-'+Math.random().toString(36).slice(2));
  let toastTimer;
  function toast(message,error=false){clearTimeout(toastTimer);const el=$('#booking-toast');el.textContent=message;el.classList.toggle('error',error);el.hidden=false;toastTimer=setTimeout(()=>{el.hidden=true;},7500);}
  function failure(error){const code=error.message||'SERVER';toast((errors[code]||errors.SERVER)[lang==='hy'?1:0],true);if(code==='AUTH'){token='';user=null;busy=[];availabilityReady=false;storeToken('');renderAccount();renderTimes();}}
  function storeToken(v){try{if(v)sessionStorage.setItem('icnt-booking-token',v);else sessionStorage.removeItem('icnt-booking-token');}catch(_){}}
  function rawCall(action,payload={}){
    if(!live)return Promise.reject(new Error('SETUP'));
    return new Promise((resolve,reject)=>{google.script.run.withSuccessHandler(r=>r.ok?resolve(r.data):reject(new Error(r.error))).withFailureHandler(()=>reject(new Error('SERVER'))).api(action,payload,token);});
  }
  async function perform(button,fn){if(button.disabled)return;button.disabled=true;try{await fn();}catch(e){failure(e);}finally{button.disabled=false;if(button.id==='booking-submit')updateSelection();}}
  function translate(){
    document.documentElement.lang=lang;
    clearTimeout(toastTimer);$('#booking-toast').hidden=true;
    $$('[data-b]').forEach(el=>{el.textContent=t(el.dataset.b);});$$('[data-bp]').forEach(el=>{el.placeholder=t(el.dataset.bp);});$$('[data-bl]').forEach(el=>{el.setAttribute('aria-label',t(el.dataset.bl));});
    $$('[data-booking-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.bookingLanguage===lang)));
    $('#booking-auth-help').textContent=t('authHelp');
    renderBanner();renderEquipment();renderAccount();renderWeek();renderTimes();renderMine();renderQueue();renderUsers();renderSettingsOptions();
    $('#booking-duration').innerHTML=durationOptions();
    $('#booking-duration').value=String(duration);updateSelection();
  }
  function renderBanner(){
    const el=$('#booking-banner');
    el.closest('.booking-intro').classList.toggle('booking-portal-intro',!live);
    if(!liveUrl){
      el.className=live?'booking-banner':'booking-portal-status';
      el.setAttribute('role','status');el.removeAttribute('aria-labelledby');
      el.textContent=t(live?'liveBanner':portalLoaded?'portalUnavailable':'loading');return;
    }
    el.className='booking-portal-card';el.setAttribute('role','region');el.setAttribute('aria-labelledby','booking-portal-title');
    const url=new URL(liveUrl);url.searchParams.set('lang',lang);url.searchParams.set('equipment',equipmentId);
    el.innerHTML=`<div class="bk-portal-copy"><div class="bk-portal-eyebrow"><span class="bk-portal-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3.5" y="5.5" width="17" height="15" rx="3"/><path d="M7.5 3v5m9-5v5M4 10.5h16m-12 4h2m4 0h2m-8 3h2"/></svg></span><span>${esc(t('portalEyebrow'))}</span></div><h2 id="booking-portal-title">${esc(t('portalTitle'))}</h2><p>${esc(t('connectedBanner'))}</p></div><div class="bk-portal-action"><span class="bk-portal-access"><span aria-hidden="true"></span>${esc(t('portalAccess'))}</span><a class="bk-portal-button" target="_blank" rel="noopener noreferrer" aria-describedby="booking-portal-tab"><span>${esc(t('openPortal'))}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a><span id="booking-portal-tab" class="bk-portal-tab">${esc(t('portalNewTab'))}</span></div><div class="bk-portal-foot"><ol aria-label="${esc(t('portalSteps'))}">${['portalStepSignIn','portalStepTime','portalStepApproval'].map((step,i)=>`<li><span aria-hidden="true">0${i+1}</span>${esc(t(step))}</li>`).join('')}</ol><span class="bk-portal-zone">${esc(t('portalTimezone'))}</span></div>`;
    el.querySelector('a').href=url.href;
  }
  function renderAccount(){
    $('#booking-identity').textContent=user?user.name:'';$('#booking-login').hidden=!!user;$('#booking-logout').hidden=!user;
    $('[data-tab=admin]').hidden=user?.role!=='admin';
    $('#booking-submit').disabled=!user||!selectedTime||!eq()?.enabled||condition(eq())==='out-of-order';
    if(!user && tab!=='calendar')setTab('calendar');
  }
  function renderEquipment(){
    const search=$('#booking-search').value.toLowerCase().trim();
    const list=equipment.filter(e=>(group==='all'||e.group===group)&&[e.nameEn,e.nameHy,e.id].some(v=>v.toLowerCase().includes(search)));
    $('#booking-equipment').innerHTML=list.length?list.map(e=>`<button class="bk-instrument ${e.id===equipmentId?'selected':''}" data-instrument="${esc(e.id)}" aria-pressed="${e.id===equipmentId}"><span>${esc(badges[e.id]||e.id)}</span><span>${esc(name(e))}<small class="bk-condition-label ${esc(condition(e))}">${esc(t(condition(e)))}${e.enabled?'':' · '+esc(t('inactive'))}</small></span></button>`).join(''):`<p>${esc(t('noEquipment'))}</p>`;
    const note=$('#booking-combined-note');note.hidden=!['afm','raman'].includes(equipmentId);note.textContent=t('combined');
    renderCondition();
    const e=eq();if(e){$('#booking-instrument-title').textContent=name(e);$('#booking-category').textContent=t(e.group);$('#booking-hours').textContent=`${e.open}–${e.close} · ${e.slot} ${t('minutes')}`;}
  }
  function renderCondition(){
    const e=eq(),state=condition(e),badge=$('#booking-condition'),notice=$('#booking-condition-notice');
    badge.textContent=t(state);badge.className='bk-condition '+state;badge.hidden=!e;badge.setAttribute('aria-label',t('equipmentCondition')+': '+t(state));
    notice.className='bk-condition-notice '+state;notice.hidden=!e||state==='available';
    notice.textContent=state==='problem'?t('problemHelp'):state==='out-of-order'?t('outOfOrderHelp'):'';
  }
  function renderWeek(){
    $('#booking-date').value=selectedDate;const start=addDays(selectedDate,-((new Date(selectedDate+'T12:00:00Z').getUTCDay()+6)%7));
    $('#booking-week').innerHTML=Array.from({length:7},(_,i)=>{const d=addDays(start,i);return `<button data-day="${d}" class="${d===selectedDate?'selected':''}" aria-pressed="${d===selectedDate}" aria-label="${esc(weekday(d,true)+' '+dateLabel(d))}"><span>${esc(weekday(d))}</span><strong>${Number(d.slice(8))}</strong></button>`;}).join('');
  }
  function durationOptions(){const e=eq();if(!e)return '';return Array.from({length:e.maxMinutes/e.slot},(_,i)=>{const m=(i+1)*e.slot;return `<option value="${m}">${m} ${esc(t('minutes'))}</option>`;}).join('');}
  function reservationName(b){return String(b.bookedBy||'').trim()||t('icntMember');}
  function renderDayBookings(){
    const panel=$('#booking-day-reservations'),list=$('#booking-day-list');
    panel.hidden=!user||!availabilityReady;
    if(panel.hidden){list.innerHTML='';return;}
    list.innerHTML=busy.length?[...busy].sort((a,b)=>a.start.localeCompare(b.start)).map(b=>`<li class="bk-day-reservation"><div><strong>${esc(b.start)}–${esc(b.end)}</strong><span class="bk-day-name">${esc(t('bookedBy'))}: ${esc(reservationName(b))}</span></div><span class="bk-status ${esc(b.status)}">${esc(t(b.status))}</span></li>`).join(''):`<li class="bk-day-empty">${esc(t('noDayBookings'))}</li>`;
  }
  function renderTimes(){
    renderDayBookings();
    const el=$('#booking-slots'),e=eq();
    if(!e)return;
    if(condition(e)==='out-of-order'){el.innerHTML=`<p class="bk-empty bk-out-of-order">${esc(t('outOfOrderHelp'))}</p>`;return;}
    if(!e.enabled){el.innerHTML=`<p class="bk-empty">${esc(t('disabled'))}</p>`;return;}
    if(!user){el.innerHTML=`<p class="bk-empty">${esc(t('loginTimes'))}</p>`;return;}
    if(!availabilityReady){el.innerHTML=`<p class="bk-empty">${esc(availabilityError?(errors[availabilityError]||errors.SERVER)[lang==='hy'?1:0]:t('loading'))}</p>`;return;}
    if(!e.days.split(',').map(Number).includes(new Date(selectedDate+'T12:00:00Z').getUTCDay())){el.innerHTML=`<p class="bk-empty">${esc(t('closed'))}</p>`;return;}
    const slots=[];
    for(let m=C.minutes(e.open);m+duration<=C.minutes(e.close);m+=e.slot){
      const start=C.clock(m),end=C.clock(m+duration),conflicts=busy.filter(b=>b.start<end&&start<b.end);
      const owners=[...new Set(conflicts.map(reservationName))],ownerLabel=owners.length?`${t('bookedBy')}: ${owners.join(', ')}`:'';
      let state=conflicts[0]?.status||'free';
      if(C.timestamp(selectedDate,start)<=Date.now()||(Date.parse(selectedDate)-Date.parse(C.day(Date.now())))/86400000>e.maxDays)state='past';
      const label=`${start}–${end} · ${t(state)}${ownerLabel?' · '+ownerLabel:''}`;
      slots.push(`<button class="bk-slot ${selectedTime===start?'selected':''}" data-start="${start}" data-state="${state}" ${state!=='free'?'disabled':''} aria-pressed="${selectedTime===start}" aria-label="${esc(label)}"><span>${start}–${end}</span><small>${esc(t(state))}</small>${ownerLabel?`<span class="bk-slot-owner">${esc(ownerLabel)}</span>`:''}</button>`);
    }
    el.innerHTML=slots.join('')||`<p class="bk-empty">${esc(t('closed'))}</p>`;
  }
  function updateSelection(){const e=eq();$('#booking-selection').textContent=selectedTime?`${dateLabel(selectedDate)} · ${selectedTime}–${C.clock(C.minutes(selectedTime)+duration)}`:t('chooseTime');$('#booking-submit').disabled=!user||!selectedTime||!e?.enabled||condition(e)==='out-of-order';}
  async function loadAvailability(){
    selectedTime='';requestId='';busy=[];availabilityReady=false;availabilityError='';updateSelection();const seq=++loadId;
    renderTimes();if(!user)return;
    try{const result=await rawCall('availability',{equipmentId,date:selectedDate});if(seq!==loadId)return;busy=result.busy;const e=eq();if(e){if(result.condition!==undefined)e.condition=result.condition;if(result.enabled!==undefined)e.enabled=result.enabled;}availabilityReady=true;renderEquipment();renderTimes();updateSelection();}catch(e){if(seq===loadId){availabilityError=e.message;renderTimes();failure(e);}}
  }
  function chooseEquipment(id){equipmentId=id;const e=eq();duration=Math.min(60,e.maxMinutes);duration=Math.max(e.slot,Math.floor(duration/e.slot)*e.slot);$('#booking-duration').innerHTML=durationOptions();$('#booking-duration').value=String(duration);renderEquipment();renderBanner();loadAvailability();}
  function chooseDate(value){try{selectedDate=C.date(value);renderWeek();loadAvailability();}catch(e){failure(e);}}
  function setTab(next){if(next!=='calendar'&&!user){openAuth();return;}tab=next;$$('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===next)));['calendar','mine','admin'].forEach(k=>{$('#booking-'+k).hidden=k!==next;});if(next==='admin')refresh().catch(failure);if(next==='mine')refresh().catch(failure);}
  function bookingRows(list,admin=false){
    if(!list.length)return `<p class="bk-empty">${esc(t('noRequests'))}</p>`;
    return [...list].sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start)).map(b=>{const e=equipment.find(x=>x.id===b.equipmentId),future=C.timestamp(b.date,b.start)>Date.now();return `<article class="bk-booking-row"><div class="bk-booking-info"><h3>${esc(name(e)||b.equipmentId)}${condition(e)!=='available'?`<span class="bk-condition ${esc(condition(e))}">${esc(t(condition(e)))}</span>`:''}<span class="bk-status ${esc(b.status)}">${esc(t(b.status))}</span></h3><strong>${esc(dateLabel(b.date))} · ${esc(b.start)}–${esc(b.end)}</strong>${admin?`<p>${esc(b.name)} · ${esc(b.email)}<br>${esc(b.organization)}</p>`:''}<p>${esc(b.purpose)}</p><small>#${esc(b.id.slice(0,8))}</small></div><div class="bk-booking-actions">${admin&&b.status==='pending'&&future?`<button class="bk-button bk-primary" data-decision="approved" data-id="${esc(b.id)}" ${condition(e)==='out-of-order'?'disabled':''}>${esc(t('approve'))}</button><button class="bk-button bk-outline" data-decision="rejected" data-id="${esc(b.id)}">${esc(t('reject'))}</button>`:''}${C.active(b)&&(future||admin)?`<button class="bk-button bk-outline" data-cancel="${esc(b.id)}">${esc(t('cancel'))}</button>`:''}</div></article>`;}).join('');
  }
  function renderMine(){$('#booking-mine-list').innerHTML=bookingRows(bookings);}
  function renderQueue(){const status=$('#booking-status-filter').value;$('#booking-queue').innerHTML=bookingRows(queue.filter(b=>status==='all'||b.status===status),true);}
  function renderUsers(){$('#booking-users').innerHTML=users.map(u=>`<div class="bk-user"><span>${esc(u.name)}<small>${esc(u.email)} · ${esc(t(u.role==='admin'?'manager':'member'))} · ${esc(t(u.active?'active':'inactive'))}</small></span><button class="bk-button bk-outline" data-edit-user="${esc(u.email)}">${esc(t('edit'))}</button></div>`).join('');}
  function renderSettingsOptions(){const sel=$('#booking-settings-equipment'),value=sel.value||equipmentId;sel.innerHTML=equipment.map(e=>`<option value="${esc(e.id)}">${esc(name(e))}</option>`).join('');sel.value=value;fillSettings();}
  function fillSettings(){const f=$('#booking-settings-form'),e=equipment.find(x=>x.id===f.elements.id.value);if(!e)return;['open','close','slot','maxMinutes','maxDays'].forEach(k=>{f.elements[k].value=e[k];});f.elements.condition.value=condition(e);f.elements.enabled.checked=e.enabled;$('#booking-weekdays').innerHTML=Array.from({length:7},(_,i)=>{const day=(i+1)%7;return `<label><input type="checkbox" name="weekday" value="${day}" ${e.days.split(',').includes(String(day))?'checked':''}><span>${esc(weekday(addDays('2026-10-18',day)))}</span></label>`;}).join('');}
  async function refresh(){if(!user)return;const r=await rawCall('state');user=r.user;equipment=r.equipment;bookings=r.bookings;users=r.users;renderAccount();renderEquipment();renderMine();renderUsers();if(user.role==='admin'){queue=(await rawCall('queue')).bookings;renderQueue();}}
  function openAuth(){if(!live)return;const d=$('#booking-auth');if(!d.open)d.showModal();}
  function csv(rows){const keys=['id','equipmentId','date','start','end','email','name','organization','purpose','status','createdAt','updatedAt','decisionBy'];const safe=v=>'"'+String(v??'').replace(/^[=+\-@\t\r\n]/,"'$&").replace(/"/g,'""')+'"';return '\ufeff'+[keys,...rows.map(r=>keys.map(k=>r[k]))].map(r=>r.map(safe).join(',')).join('\r\n');}

  $$('[data-tab]').forEach(b=>{b.id='booking-tab-'+b.dataset.tab;b.setAttribute('aria-controls','booking-'+b.dataset.tab);$('#booking-'+b.dataset.tab).setAttribute('aria-labelledby',b.id);b.addEventListener('click',()=>setTab(b.dataset.tab));b.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const buttons=$$('[data-tab]').filter(x=>!x.hidden),index=buttons.indexOf(b);const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[next].focus();setTab(buttons[next].dataset.tab);});});
  $('#booking-login').addEventListener('click',openAuth);$('#booking-auth-close').addEventListener('click',()=>$('#booking-auth').close());
  $('#booking-auth').addEventListener('click',e=>{if(e.target===$('#booking-auth'))$('#booking-auth').close();});
  $('#booking-logout').addEventListener('click',e=>perform(e.currentTarget,async()=>{await rawCall('logout');user=null;token='';storeToken('');bookings=[];users=[];queue=[];loadId++;busy=[];setTab('calendar');translate();}));
  $('#booking-auth-form').addEventListener('submit',e=>{e.preventDefault();perform($('#booking-send-code'),async()=>{await rawCall('requestCode',{email:e.target.elements.email.value,lang});$('#booking-code-step').hidden=false;$('#booking-auth-message').textContent=t('codeSent');e.target.elements.code.focus();});});
  $('#booking-verify').addEventListener('click',e=>perform(e.currentTarget,async()=>{const f=$('#booking-auth-form');const result=await rawCall('verifyCode',{email:f.elements.email.value,code:f.elements.code.value});token=result.token;user=result.user;storeToken(token);$('#booking-auth').close();$('#booking-form').elements.name.value=user.name;await refresh();await loadAvailability();}));
  $('#booking-equipment').addEventListener('click',e=>{const b=e.target.closest('[data-instrument]');if(b)chooseEquipment(b.dataset.instrument);});
  $('#booking-search').addEventListener('input',renderEquipment);$$('[data-group]').forEach(b=>b.addEventListener('click',()=>{group=b.dataset.group;$$('[data-group]').forEach(x=>x.classList.toggle('active',x===b));renderEquipment();}));
  $('#booking-date').addEventListener('change',e=>chooseDate(e.target.value));$('#booking-prev').addEventListener('click',()=>chooseDate(addDays(selectedDate,-1)));$('#booking-next').addEventListener('click',()=>chooseDate(addDays(selectedDate,1)));$('#booking-today').addEventListener('click',()=>chooseDate(C.day(Date.now())));
  $('#booking-week').addEventListener('click',e=>{const b=e.target.closest('[data-day]');if(b)chooseDate(b.dataset.day);});$('#booking-duration').addEventListener('change',e=>{duration=Number(e.target.value);loadAvailability();});
  $('#booking-slots').addEventListener('click',e=>{const b=e.target.closest('[data-start]');if(!b||b.disabled)return;selectedTime=b.dataset.start;requestId=uuid();renderTimes();updateSelection();});
  $('#booking-form').addEventListener('submit',e=>{e.preventDefault();const f=e.target;perform($('#booking-submit'),async()=>{await rawCall('book',{equipmentId,date:selectedDate,start:selectedTime,end:C.clock(C.minutes(selectedTime)+duration),name:f.elements.name.value,organization:f.elements.organization.value,purpose:f.elements.purpose.value,requestId});toast(t('requested'));f.elements.purpose.value='';f.elements.confirm.checked=false;await refresh();await loadAvailability();});});
  root.addEventListener('click',e=>{const cancel=e.target.closest('[data-cancel]'),decision=e.target.closest('[data-decision]');if(cancel||decision){const b=cancel||decision;if((cancel||decision.dataset.decision==='rejected')&&!window.confirm(t(cancel?'confirmCancel':'confirmReject')))return;perform(b,async()=>{await rawCall(cancel?'cancel':'decide',cancel?{id:b.dataset.cancel}:{id:b.dataset.id,status:b.dataset.decision});await refresh();await loadAvailability();toast(t('saved'));});}});
  $$('[data-refresh]').forEach(b=>b.addEventListener('click',()=>perform(b,async()=>{await refresh();await loadAvailability();})));
  $('#booking-status-filter').addEventListener('change',renderQueue);
  $$('[data-admin-tab]').forEach(b=>b.addEventListener('click',()=>{$$('[data-admin-tab]').forEach(x=>x.classList.toggle('active',x===b));['requests','equipment','members'].forEach(k=>{$('#booking-admin-'+k).hidden=k!==b.dataset.adminTab;});if(b.dataset.adminTab==='equipment')renderSettingsOptions();}));
  $('#booking-settings-equipment').addEventListener('change',fillSettings);
  $('#booking-settings-form').addEventListener('submit',e=>{e.preventDefault();const f=e.target;perform(f.querySelector('button'),async()=>{const data=Object.fromEntries(new FormData(f));data.enabled=f.elements.enabled.checked;data.days=[...f.querySelectorAll('[name=weekday]:checked')].map(x=>x.value).join(',');await rawCall('saveEquipment',data);await refresh();await loadAvailability();toast(t('saved'));});});
  $('#booking-user-form').addEventListener('submit',e=>{e.preventDefault();const f=e.target;perform(f.querySelector('button'),async()=>{const data=Object.fromEntries(new FormData(f));data.active=f.elements.active.checked;await rawCall('saveUser',data);await refresh();toast(t('saved'));});});
  $('#booking-users').addEventListener('click',e=>{const b=e.target.closest('[data-edit-user]');if(!b)return;const u=users.find(x=>x.email===b.dataset.editUser),f=$('#booking-user-form');['email','name','role'].forEach(k=>{f.elements[k].value=u[k];});f.elements.active.checked=u.active;f.elements.name.focus();});
  $('#booking-export').addEventListener('click',e=>perform(e.currentTarget,async()=>{const rows=(await rawCall('export')).bookings;const url=URL.createObjectURL(new Blob([csv(rows)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='ICNT-bookings-'+C.day(Date.now())+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}));
  document.addEventListener('icnt-language',e=>{lang=e.detail.language;translate();});
  $$('[data-booking-language]').forEach(b=>b.addEventListener('click',()=>{lang=b.dataset.bookingLanguage;translate();}));

  async function start(){
    root.hidden=true;
    translate();
    if(!live){
      try{const config=await fetch('assets/booking-config.json',{cache:'no-store'}).then(r=>r.json());if(/^https:\/\/script\.google\.com\/(?:macros\/s|a\/macros\/[a-z0-9.-]+\/s)\/[\w-]+\/exec$/i.test(config.webAppUrl||''))liveUrl=config.webAppUrl;}catch(_){}
      portalLoaded=true;renderBanner();return;
    }
    equipment=(await rawCall('catalog')).equipment;
    if(!equipment.some(e=>e.id===equipmentId))equipmentId=equipment[0]?.id;
    if(live){try{token=sessionStorage.getItem('icnt-booking-token')||'';}catch(_){}if(token){try{const result=await rawCall('state');user=result.user;}catch(_){token='';storeToken('');}}}
    root.hidden=false;translate();chooseEquipment(equipmentId);if(user){await refresh();$('#booking-form').elements.name.value=user.name;}
  }
  start().catch(failure);
})();

/* ICNT Bookings — shared validation used by Apps Script and the booking interface. */
var ICNTCore = (function () {
  'use strict';
  var BOOKABLE = ['afm','raman','electrochemistry','dls','high-speed-centrifuge','freeze-dryer'];
  function isBookable(id) { return BOOKABLE.includes(id); }
  function fail(code) { throw new Error(code); }
  function email(value) {
    var s = String(value || '').trim().toLowerCase();
    if (s.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) fail('EMAIL');
    return s;
  }
  function text(value, max, min) {
    var s = String(value || '').trim();
    if (s.length < (min || 0) || s.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s)) fail('INPUT');
    return s;
  }
  function date(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail('DATE');
    var d = new Date(value + 'T00:00:00Z');
    if (!isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== value) fail('DATE');
    return value;
  }
  function minutes(value) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(value))) fail('TIME');
    return Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
  }
  function clock(n) { return String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0'); }
  function day(now) { return new Date(Number(now) + 4 * 3600000).toISOString().slice(0, 10); }
  function timestamp(d, t) { return new Date(d + 'T' + t + ':00+04:00').getTime(); }
  function active(b) { return b.status === 'pending' || b.status === 'approved'; }
  function condition(value) {
    if(value===undefined || value===null || value==='') return 'available';
    if(!['available','problem','out-of-order'].includes(value)) fail('SETTINGS');
    return value;
  }
  function resource(id) { return ['afm','raman'].includes(id) ? 'afm-raman' : id; }
  function monday(value) {
    var d=new Date(date(value)+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);
  }
  function addDays(value,n) {return new Date(Date.parse(date(value)+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);}
  // Greedy interval packing within each connected overlap cluster.
  function layoutEvents(items) {
    var sorted=items.map(function(b,i){return {booking:b,index:i};}).sort(function(a,b){return a.booking.start.localeCompare(b.booking.start)||a.booking.end.localeCompare(b.booking.end);}),result=[],cluster=[],ends=[],until='';
    function finish(){cluster.forEach(function(x){x.columns=ends.length;result.push(x);});cluster=[];ends=[];until='';}
    sorted.forEach(function(x){
      if(cluster.length && x.booking.start>=until)finish();
      var lane=ends.findIndex(function(end){return end<=x.booking.start;});if(lane<0)lane=ends.length;
      ends[lane]=x.booking.end;x.column=lane;cluster.push(x);if(x.booking.end>until)until=x.booking.end;
    });finish();return result;
  }
  function conflicts(bookings, candidate, exceptId) {
    return bookings.some(function (b) {
      return b.id !== exceptId && resource(b.equipmentId) === resource(candidate.equipmentId) && b.date === candidate.date && active(b) && b.start < candidate.end && candidate.start < b.end;
    });
  }
  function settings(e) {
    if (!e || !/^[a-z0-9-]+$/.test(String(e.id))) fail('EQUIPMENT');
    var open = minutes(e.open), close = minutes(e.close);
    var slot = Number(e.slot), max = Number(e.maxMinutes), ahead = Number(e.maxDays);
    var days = String(e.days || '').split(',').map(Number);
    if (open >= close || ![15, 30, 60].includes(slot) || max < slot || max > close - open || max % slot || !Number.isInteger(ahead) || ahead < 1 || ahead > 180 || !/^[0-6](,[0-6])*$/.test(String(e.days)) || new Set(days).size !== days.length) fail('SETTINGS');
    return Object.assign({}, e, {condition:condition(e.condition), enabled: e.enabled === true || e.enabled === 'true', open:String(e.open), close:String(e.close), days:String(e.days), slot: slot, maxMinutes: max, maxDays: ahead});
  }
  function validate(raw, e, bookings, now) {
    if (!isBookable(raw.equipmentId)) fail('NOT_BOOKABLE');
    if (!e || raw.equipmentId !== e.id) fail('EQUIPMENT');
    e = settings(e);
    if (e.condition==='out-of-order') fail('OUT_OF_ORDER');
    if (!e.enabled) fail('DISABLED');
    var d = date(raw.date), start = minutes(raw.start), end = minutes(raw.end), today = day(now);
    var distance = (Date.parse(d) - Date.parse(today)) / 86400000;
    if (distance < 0 || distance > e.maxDays || timestamp(d, raw.start) <= now) fail('PAST');
    if (!e.days.split(',').map(Number).includes(new Date(d + 'T12:00:00Z').getUTCDay())) fail('CLOSED');
    var open = minutes(e.open);
    if (start < open || end > minutes(e.close) || end <= start || (start - open) % e.slot || (end - start) % e.slot || end - start > e.maxMinutes) fail('HOURS');
    var b = {equipmentId: e.id, date: d, start: clock(start), end: clock(end), purpose: text(raw.purpose, 600, 5), name: text(raw.name, 100, 2), organization: text(raw.organization, 120, 2), laboratory: text(raw.laboratory, 120, 0), requestId: text(raw.requestId, 100, 12)};
    if (!/^[\w-]+$/.test(b.requestId)) fail('INPUT');
    if (conflicts(bookings, b)) fail('CONFLICT');
    return b;
  }
  return {BOOKABLE:BOOKABLE, monday:monday, addDays:addDays, layoutEvents:layoutEvents, resource:resource, isBookable:isBookable, condition:condition, fail: fail, email: email, text: text, date: date, minutes: minutes, clock: clock, day: day, timestamp: timestamp, active: active, conflicts: conflicts, settings: settings, validate: validate};
})();

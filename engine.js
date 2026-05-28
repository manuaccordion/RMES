/* ============================================================
   REVENUE INTELLIGENCE DASHBOARD - JS
   ============================================================ */
/* -------- CONFIG -------- */
/* Budget fiscal year: May 2026 → April 2027 (12 months). Le chiavi budgetByMonth
   sono YYYYMM (es. 202605, 202606, ..., 202704). Ogni mese ha Revenue, OCC%, ADR target.
   Le altre sezioni (OTB anno intero, Storico, OCC by Room Type) restano su anno solare. */
const CFG = {
  fiscal: { startYM: 202605, endYM: 202704, label: 'May 2026 → Apr 2027' },
  structures: {
    firenze:  { key:'Firenze Suite', label:'Firenze Suite', color:'#8b6f47',
                rooms:{'Camera Matrimoniale Deluxe':4,'Suite con Terrazza':2,'Suite':2},
                baseRT:'Camera Matrimoniale Deluxe',
                roomsTotal:8, rnYear:2920,
                budgetTotal:501506.72,
                budgetByMonth:{
                  202605:{rev:60264.00,  occ:0.81, adr:300},
                  202606:{rev:52200.00,  occ:0.75, adr:290},
                  202607:{rev:35327.60,  occ:0.77, adr:185},
                  202608:{rev:28668.80,  occ:0.68, adr:170},
                  202609:{rev:68400.00,  occ:0.95, adr:300},
                  202610:{rev:68324.00,  occ:0.95, adr:290},
                  202611:{rev:32640.00,  occ:0.80, adr:170},
                  202612:{rev:29016.00,  occ:0.65, adr:180},
                  202701:{rev:23272.32,  occ:0.68, adr:138},
                  202702:{rev:22680.00,  occ:0.75, adr:135},
                  202703:{rev:36890.00,  occ:0.85, adr:175},
                  202704:{rev:43824.00,  occ:0.83, adr:220},
                } },
    condotta: { key:'Condotta 16',   label:'Condotta 16',   color:'#3b6b6b',
                rooms:{'Bilocale':3,'Trilocale':3,'Attico':1},
                baseRT:'Bilocale',
                roomsTotal:7, rnYear:2555,
                budgetTotal:557946.90,
                budgetByMonth:{
                  202605:{rev:63884.80,  occ:0.80, adr:368},
                  202606:{rev:67628.40,  occ:0.83, adr:388},
                  202607:{rev:43725.50,  occ:0.65, adr:310},
                  202608:{rev:39494.00,  occ:0.70, adr:260},
                  202609:{rev:66150.00,  occ:0.90, adr:350},
                  202610:{rev:68745.60,  occ:0.88, adr:360},
                  202611:{rev:37884.00,  occ:0.82, adr:220},
                  202612:{rev:33418.00,  occ:0.55, adr:280},
                  202701:{rev:25389.00,  occ:0.60, adr:195},
                  202702:{rev:22932.00,  occ:0.65, adr:180},
                  202703:{rev:42705.60,  occ:0.82, adr:240},
                  202704:{rev:45990.00,  occ:0.73, adr:300},
                } },
    alfani:   { key:'Palazzo Alfani', label:'Palazzo Alfani', color:'#8e5fa8',
                rooms:{'Classic':3,'Superior':4,'Junior Suite':1,'Deluxe':1},
                baseRT:'Classic',
                roomsTotal:9, rnYear:3285,
                budgetTotal:846863.56,
                budgetByMonth:{
                  202601:{rev:22000.00, occ:0.40, adr:197},
                  202602:{rev:27000.00, occ:0.62, adr:173},
                  202603:{rev:40000.00, occ:0.70, adr:205},
                  202604:{rev:60000.00, occ:0.68, adr:327},
                  202605:{rev:80000.00, occ:0.81, adr:354},
                  202606:{rev:85000.00, occ:0.86, adr:366},
                  202607:{rev:70000.00, occ:0.83, adr:302},
                  202608:{rev:51000.00, occ:0.80, adr:228},
                  202609:{rev:85000.00, occ:0.92, adr:342},
                  202610:{rev:81000.00, occ:0.89, adr:326},
                  202611:{rev:41000.00, occ:0.76, adr:200},
                  202612:{rev:43000.00, occ:0.65, adr:237},
                  202701:{rev:25110.00, occ:0.45, adr:200},
                  202702:{rev:29836.80, occ:0.64, adr:185},
                  202703:{rev:46436.76, occ:0.73, adr:228},
                  202704:{rev:60480.00, occ:0.70, adr:320},
                } },
    davids:   { key:"Florence David's Apartament", label:"Enis Guesthouse", color:'#c0392b',
                rooms:{'Verde':1,'Senape':1,'Blu':1},
                baseRT:'Senape',
                roomsTotal:3, rnYear:1095,
                budgetIsForecast:true,
                budgetTotal:0,
                budgetByMonth:{} },
  },
  monthsIT: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  monthsITLong: ['January','February','March','April','May','June','July','August','September','October','November','December'],
};
/* David's: budget = forecast (LY × growth). Vedi _davidsBudgetForecast(). */
const _DAVIDS_BUDGET_GROWTH = 1.08;
const PACE_WEEK_WEIGHTS = [0.10, 0.20, 0.30, 0.40];
/* -------- DATES -------- */
const TODAY = new Date();
TODAY.setHours(23,59,59,999);
const STLY  = new Date(TODAY.getTime() - 364*24*60*60*1000);  // -52 weeks
const TODAY_YMD = ymd(TODAY);
const STLY_YMD  = ymd(STLY);
const CUR_YEAR  = TODAY.getFullYear();
const PREV_YEAR = CUR_YEAR - 1;
function ymd(d){ return d.getFullYear()*10000 + (d.getMonth()+1)*100 + d.getDate(); }
function pad2(n){ return n<10?'0'+n:''+n; }
function fmtDateIT(d){ return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`; }
function parseDateIT(s){
  if(!s) return null;
  const t = s.trim().split(' ')[0];
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(!m) return null;
  return new Date(+m[3], +m[2]-1, +m[1]);
}
function daysInMonth(y,m){ return new Date(y,m,0).getDate(); }   // m 1-12
function startOfDay(d){ const x=new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
/* -------- FORMAT -------- */
const fmtEUR = (n)=> isFinite(n) ? '€'+Math.round(n).toLocaleString('en-GB') : '—';
const fmtEUR1 = (n)=> isFinite(n) ? '€'+(Math.round(n*10)/10).toLocaleString('en-GB',{minimumFractionDigits:0,maximumFractionDigits:0}) : '—';
const fmtPct = (n,dp=1)=> isFinite(n) ? (n*100).toFixed(dp)+'%' : '—';
const fmtPctPP = (n,dp=1)=> isFinite(n) ? ((n>=0?'+':'')+(n*100).toFixed(dp)+' pp') : '—';
const fmtPctVar = (n,dp=1)=> isFinite(n) ? ((n>=0?'+':'')+(n*100).toFixed(dp)+'%') : '—';
const fmtNum = (n)=> isFinite(n) ? Math.round(n).toLocaleString('en-GB') : '—';
const fmtAdr = (n)=> isFinite(n)&&n>0 ? '€'+Math.round(n).toLocaleString('en-GB') : '—';
const fmtDelta = (n)=> isFinite(n) ? ((n>=0?'+':'')+Math.round(n).toLocaleString('en-GB')) : '—';
/* -------- CSV PARSER (RFC 4180-ish) -------- */
function parseCSV(text){
  if (text.charCodeAt(0)===0xFEFF) text = text.slice(1);
  const rows=[]; let cur=[]; let val=''; let inQ=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(inQ){
      if(c==='"'){
        if(text[i+1]==='"'){ val+='"'; i++; }
        else inQ=false;
      } else val+=c;
    } else {
      if(c==='"') inQ=true;
      else if(c===','){ cur.push(val); val=''; }
      else if(c==='\n'){ cur.push(val); rows.push(cur); cur=[]; val=''; }
      else if(c==='\r'){ /* skip */ }
      else val+=c;
    }
  }
  if(val.length||cur.length){ cur.push(val); rows.push(cur); }
  if(!rows.length) return [];
  const head=rows[0].map(s=>s.trim());
  const out=[];
  for(let r=1;r<rows.length;r++){
    if(rows[r].length===1 && !rows[r][0]) continue;
    const o={};
    for(let c=0;c<head.length;c++) o[head[c]]=rows[r][c]??'';
    out.push(o);
  }
  return out;
}
/* -------- ROOM TYPE NORMALIZE -------- */
const ROOM_NORMALIZE = {
  'suite con terrazza':'Suite con Terrazza',
  'suite con terrazzo':'Suite con Terrazza',
  'camera matrimoniale deluxe':'Camera Matrimoniale Deluxe',
  'camera deluxe':'Camera Matrimoniale Deluxe',
  'matrimoniale deluxe':'Camera Matrimoniale Deluxe',
  'suite':'Suite',
  'bilocale':'Bilocale',
  'trilocale':'Trilocale',
  'attico':'Attico',
  'junior suite':'Junior Suite',
  'classic':'Classic',
  'superior':'Superior',
  'deluxe':'Deluxe',
  'appartamento classic':'Classic',
  'appartamento superior':'Superior',
  'appartamento deluxe':'Deluxe',
  'classic apartment':'Classic',
  'superior apartment':'Superior',
  'deluxe apartment':'Deluxe',
};
function normRoom(s){
  if(!s) return '';
  const k = s.trim().toLowerCase();
  if (ROOM_NORMALIZE[k]) return ROOM_NORMALIZE[k];
  if (k.indexOf(',') === -1){
    if (k.indexOf('junior suite') !== -1 || /\bjunior\b/.test(k)) return 'Junior Suite';
    if (k.indexOf('deluxe') !== -1 && (k.indexOf('appartamento') !== -1 || k.indexOf('apartment') !== -1 || k.indexOf('bedroom') !== -1 || k.indexOf('bedrooms') !== -1)) return 'Deluxe';
    if (k.indexOf('superior') !== -1) return 'Superior';
    if (k.indexOf('classic') !== -1) return 'Classic';
    if (k.indexOf('vista giardino') !== -1 || (k.indexOf('1 bedroom') !== -1 && k.indexOf('appartamento') !== -1)) return 'Classic';
  }
  return s.trim().replace(/\b\w/g, c=>c.toUpperCase());
}
/* -------- PROVENIENZA NORMALIZE -------- */
function normCanale(raw){
  // Normalize messy channel names coming from the property channel managers
  // (Beddy for Firenze/Condotta/Alfani, Krossbooking for Davids) so STLY vs
  // current-year comparisons can match. Examples:
  //   BOOKINGXML, MOBILESITE → Booking
  //   EXPEDIA, Expedia Affilia, Orbitz, Hotels.com → Expedia
  //   FrontOffice, Krossbooking, Booking Engine → Direct
  // Anything not matched is left as-is (capitalized).
  const t = (raw||'').trim();
  if (!t || t === '—') return '—';
  const u = t.toUpperCase();
  // Booking family (Booking.com OTA — NOT to be confused with PMS "Booking Engine")
  if (u === 'BOOKING' || u === 'BOOKINGXML' || u === 'MOBILESITE' || u === 'BOOKING.COM') return 'Booking';
  // Expedia family (includes brands owned by Expedia Group: Hotels.com, Orbitz, Travelocity, ...)
  if (u === 'EXPEDIA' || u === 'EXPEDIA AFFILIA' || u === 'HOTELS.COM' || u === 'ORBITZ' || u === 'TRAVELOCITY') return 'Expedia';
  // Ctrip family
  if (u === 'CTRIP' || u === 'CTRIPV4' || u === 'TRIP.COM') return 'Ctrip';
  // DIRECT = booking acquired through the property PMS directly (no OTA fees).
  // Both Beddy (Firenze/Condotta/Alfani PMS) and Krossbooking (Davids PMS) live here,
  // plus PrenMan/FrontOffice/Booking Engine/website/walk-in — all "no OTA" cases.
  if (u === 'BEDDY' || u === 'DIRETTO' || u === 'DIRECT' || u === 'PRENMAN' || u === 'FRONTOFFICE'
   || u === 'KROSSBOOKING' || u === 'BOOKING ENGINE' || u === 'SITO WEB' || u === 'WEBSITE'
   || u === 'WALK-IN' || u === 'WALK IN' || u === 'WALKIN') return 'Direct';
  if (u === 'SIMPLEBOOKING') return 'SimpleBooking';
  if (u === 'AIRBNB') return 'Airbnb';
  if (u === 'VRBO') return 'VRBO';
  if (u === 'ITALCAMEL') return 'Italcamel';
  if (u === 'GOOGLEHPA-ORGANIC' || u === 'GOOGLE') return 'Google';
  // Fallback: title-case
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}
function normProv(p, canale){
  const t = (p||'').trim();
  if (t && t!=='Non Specificato' && t!=='Non specificato'){
    return t;
  }
  const c = (canale||'').trim().toLowerCase();
  if (c==='booking' || c==='expedia' || c==='airbnb' || c==='vrbo' || c.indexOf('booking')>=0 || c.indexOf('expedia')>=0){
    return 'OTA';
  }
  return 'Sito web';
}
/* -------- BUILD BOOKINGS (one row per camera-night-block) --------
   We DON'T expand to per-night; we keep one record per "stay × room",
   carrying revenue/notti and computing month allocation at aggregation time.
*/
let RAW = [];        // raw CSV rows (Confermate only, valid)
let BOOKINGS = [];   // expanded per-room bookings
let MARKET_RATES = []; // [{date, ymd:'YYYYMMDD'(num), listings:int, adr:float}]
let EVENTS = {};     // ymd (number) -> event label string
function loadEvents(csvText){
  EVENTS = {};
  const rows = parseCSV(csvText);
  for (const r of rows){
    const ds = (r['Date']||'').trim();
    const lbl = (r['Event']||'').trim();
    if (!ds || !lbl) continue;
    const m = ds.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) continue;
    const y = +m[1], mo = +m[2], d = +m[3];
    const k = y*10000 + mo*100 + d;
    EVENTS[k] = lbl;
  }
}
function loadAirdna(csvText){
  MARKET_RATES = [];
  const rows = parseCSV(csvText);
  for (const r of rows){
    const ds = (r['Date']||'').trim();
    if (!ds) continue;
    const m = ds.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) continue;
    const y = +m[1], mo = +m[2], d = +m[3];
    const date = new Date(y, mo-1, d);
    const listings = parseInt((r['Booked Listings']||'0').toString().replace(/[^\d-]/g,''),10) || 0;
    const adr = parseFloat((r['Daily Rate']||'0').toString().replace(',', '.')) || 0;
    if (adr<=0) continue;
    MARKET_RATES.push({
      date, ymd: ymd(date), listings, adr,
      y, m: mo, d,
    });
  }
  MARKET_RATES.sort((a,b)=> a.ymd - b.ymd);
}
function loadData(csvText){
  const all = parseCSV(csvText);
  RAW = [];
  BOOKINGS = [];
  for (const r of all){
    const stato = r['Stato'];
    if (stato !== 'Confermate' && stato !== 'Cancellate') continue;
    const struct = r['Struttura'];
    if (struct !== CFG.structures.firenze.key &&
        struct !== CFG.structures.condotta.key &&
        struct !== CFG.structures.alfani.key &&
        struct !== CFG.structures.davids.key) continue;
    const dBook = parseDateIT(r['Data/ora prenotazione']);
    const dIn   = parseDateIT(r['Data inizio soggiorno']);
    const dOut  = parseDateIT(r['Data partenza']);
    if (!dBook || !dIn || !dOut) continue;
    const dCancel = (stato === 'Cancellate') ? parseDateIT(r['Data/ora ultima modifica']) : null;
    const notti = parseInt(r['Num. notti'],10);
    if (!notti || notti<=0) continue;
    const tot = parseFloat((r['Totale']||'0').toString().replace(',', '.'));
    if (!isFinite(tot)) continue;
    const tax = parseFloat((r['Tassa di soggiorno']||'0').toString().replace(',', '.')) || 0;
    const totNet = tot - tax;
    const _structKeyForRooms = (struct === CFG.structures.firenze.key) ? 'firenze'
                             : (struct === CFG.structures.condotta.key) ? 'condotta'
                             : (struct === CFG.structures.alfani.key) ? 'alfani'
                             : (struct === CFG.structures.davids.key) ? 'davids' : null;
    const _validRoomsForStruct = (_structKeyForRooms && typeof structRoomsFor === 'function')
      ? Object.keys(structRoomsFor(_structKeyForRooms) || {}) : null;
    let alloggi = (r['Alloggi']||'').split(',').map(s=>normRoom(s)).filter(Boolean);
    if (_validRoomsForStruct && _validRoomsForStruct.length){
      const _filtered = alloggi.filter(rm => _validRoomsForStruct.includes(rm));
      alloggi = _filtered;
    }
    if (!alloggi.length) continue;
    const numRooms = alloggi.length;
    const revPerRoomNight = (totNet / notti) / numRooms;
    const canaleRaw = (r['Canale']||'—').trim() || '—';
    const canale = normCanale(canaleRaw);
    const prov = normProv(r['Provenienza'], canale);
    const ref = r['numero di riferimento'] || '';
    const guest = (r['prenotante']||'').trim();
    const tariffa = (r['Piani tariffari']||'').trim();
    const tariffaLower = tariffa.toLowerCase();
    const hasNonRimb = tariffaLower.includes('non rimborsabile');
    const hasFlex = tariffaLower.includes('flessibile') || tariffaLower.includes('standard rate');
    const isNonRefundable = hasNonRimb && !hasFlex;
    const isDirect = (canale === 'Direct' || canale === 'Beddy' || canale === 'Diretto' || canale === '—' || canale === '');
    const _struct2Key = (struct === 'Firenze Suite') ? 'firenze'
                      : (struct === 'Condotta 16') ? 'condotta'
                      : (struct === 'Palazzo Alfani') ? 'alfani'
                      : (struct === "Florence David's Apartament") ? 'davids' : null;
    const _markupPct = (typeof fp_markupForChannel === 'function')
                    ? fp_markupForChannel(canale)
                    : ((_struct2Key && typeof fp_getOtaMarkup === 'function') ? fp_getOtaMarkup(_struct2Key) : 12);
    const channelMarkup = isDirect ? 0 : (_markupPct / 100);
    const revPerRoomNightCaricato = revPerRoomNight / (1 + channelMarkup);
    RAW.push(r);
    for (const room of alloggi){
      BOOKINGS.push({
        struct, structKey: _struct2Key, room, prov, canale, ref, guest, tariffa,
        dBook, dIn, dOut, notti,
        revPerNight: revPerRoomNight,
        revPerNightCaricato: revPerRoomNightCaricato,
        channelMarkup,
        isNonRefundable,                    // true se piano = "Non rimborsabile" (scontato -10%)
        revTotal: revPerRoomNight * notti,
        bookYmd: ymd(dBook),
        cancelled: stato === 'Cancellate',
        cancelYmd: dCancel ? ymd(dCancel) : null,
        stato,
      });
    }
  }
  BOOKINGS.sort((a,b)=> b.bookYmd - a.bookYmd);
}
/* Foundation Pricing: pre-compute al caricamento dati */
function fp_postLoadHook(){
  // --- ONE-SHOT MIGRATION to NewRMES system (Base Price + Acceptance) ---
  // Wipes the previous override-based system on first load, then sets a flag so it never runs again.
  try {
    const MIGRATION_FLAG = 'rmes_newrmes_migration_v1';
    if (!localStorage.getItem(MIGRATION_FLAG)){
      console.log('[NewRMES] First boot in NewRMES system → wiping legacy overrides…');
      const keysToWipe = [
        'rmes_base_rate_overrides_v1',     // legacy day-by-day base rate overrides
        'rmes_period_overrides_v1',
        'rmes_period_overrides',
        'sell_rmes_period_overrides',
        'rmes_event_overrides'
      ];
      for (const k of keysToWipe){ try { localStorage.removeItem(k); } catch(e){} }
      try { localStorage.setItem(MIGRATION_FLAG, '1'); } catch(e){}
      console.log('[NewRMES] Migration complete.');
    }
  } catch(e){ console.error('[NewRMES] migration failed', e); }

  // --- ONE-SHOT WIPE v2: clear ALL RMES accept/override (Manu, 27/05/2026) ---
  // Reason: stale accept entries causing "RMES price ≠ Base Price" on first day, then drifting.
  // After this wipe, every day starts fresh: reference = Base Price, RMES suggests delta from there.
  try {
    const WIPE2_FLAG = 'rmes_clear_overrides_v2_2026_05_27';
    if (!localStorage.getItem(WIPE2_FLAG)){
      console.log('[NewRMES] Wipe v2: clearing all RMES accept/override entries…');
      const keysToWipe = [
        'rmes_accepted_v1',                 // RMES suggestions accepted as new current reference
        'rmes_last_suggestion_v1',          // yesterday's snapshot
        'rmes_last_suggestion_date_v1',
        'rmes_frozen_base_override_v1'      // manual Base Price overrides
      ];
      for (const k of keysToWipe){ try { localStorage.removeItem(k); } catch(e){} }
      try { localStorage.setItem(WIPE2_FLAG, '1'); } catch(e){}
      console.log('[NewRMES] Wipe v2 complete. All days reset to Base Price as the active reference.');
    }
  } catch(e){ console.error('[NewRMES] wipe v2 failed', e); }

  // --- ONE-SHOT WIPE v3: re-freeze Base Price with the new Goal Value formula (Manu, 28/05/2026) ---
  // Reason: the Base Price formula changed (Step 3 is now the exact Expedia Goal Value cap, no +5%).
  // Frozen Base prices computed before today still hold the OLD value, so the Sell Strategy showed
  // a different Base than the Base Price tab (which recomputes live). Clearing the frozen store
  // forces a clean re-freeze with the current formula on next load. Accept/override are also cleared
  // because they sat on top of the old Base. After this, Sell Strategy == Base Price tab == modal.
  try {
    const WIPE3_FLAG = 'rmes_refreeze_base_v3_2026_05_28';
    if (!localStorage.getItem(WIPE3_FLAG)){
      console.log('[NewRMES] Wipe v3: re-freezing Base Price with the new Goal Value cap formula…');
      const keysToWipe = [
        'rmes_frozen_base_v1',          // frozen Base Price → will be recomputed with new formula
        'rmes_frozen_base_override_v1', // manual Base overrides (sat on old Base)
        'rmes_accepted_v1',             // accepted RMES (sat on old Base)
        'rmes_last_suggestion_v1',
        'rmes_last_suggestion_date_v1'
      ];
      for (const k of keysToWipe){ try { localStorage.removeItem(k); } catch(e){} }
      try { localStorage.setItem(WIPE3_FLAG, '1'); } catch(e){}
      console.log('[NewRMES] Wipe v3 complete. Base Price will be re-frozen with the Goal Value cap.');
    }
  } catch(e){ console.error('[NewRMES] wipe v3 failed', e); }


  try {
    if (typeof _invalidatePaceAggCache === 'function') _invalidatePaceAggCache();
    if (typeof fp_computeStruct === 'function' && typeof BOOKINGS !== 'undefined' && BOOKINGS.length > 0){
      const _bootStruct = (typeof CURRENT_STRUCT !== 'undefined' && CURRENT_STRUCT && CURRENT_STRUCT !== 'both') ? CURRENT_STRUCT : 'firenze';
      console.log('[Foundation] Pre-computing prices for ' + _bootStruct + ' (on-demand mode)…');
      const t0 = performance.now();
      fp_computeStruct(_bootStruct);
      const t1 = performance.now();
      console.log('[Foundation] Done in ' + Math.round(t1-t0) + 'ms');
      // NewRMES: freeze Base Price for all structures (only new dates not already frozen)
      if (typeof newrmesBootFreezeAll === 'function') newrmesBootFreezeAll();
      // NewRMES: take a snapshot of today's RMES deltas if the date has changed (rotates yesterday's column)
      if (typeof newrmesSnapshotIfNewDay === 'function') newrmesSnapshotIfNewDay();
    }
  } catch(e){
    console.error('[Foundation] pre-compute failed', e);
  }
}
/* -------- FILTER HELPERS -------- */
let CURRENT_STRUCT = 'firenze';   // 'firenze' | 'condotta' | 'alfani' | 'both'
function structKeysFor(sel){
  if (sel==='firenze')  return [CFG.structures.firenze.key];
  if (sel==='condotta') return [CFG.structures.condotta.key];
  if (sel==='alfani')   return [CFG.structures.alfani.key];
  if (sel==='davids')   return [CFG.structures.davids.key];
  return [CFG.structures.firenze.key, CFG.structures.condotta.key, CFG.structures.alfani.key, CFG.structures.davids.key];
}
function structRoomsFor(sel){
  if (sel==='firenze')  return CFG.structures.firenze.rooms;
  if (sel==='condotta') return CFG.structures.condotta.rooms;
  if (sel==='alfani')   return CFG.structures.alfani.rooms;
  if (sel==='davids')   return CFG.structures.davids.rooms;
  return {...CFG.structures.firenze.rooms, ...CFG.structures.condotta.rooms, ...CFG.structures.alfani.rooms, ...CFG.structures.davids.rooms};
}
/* Inventario time-aware per Palazzo Alfani:
   - Fino al 31/01/2025: 4 Classic, 4 Superior, 0 Junior Suite, 1 Deluxe (9 camere, JS faceva parte della Classic)
   - Dal 01/02/2025 in poi: 3 Classic, 4 Superior, 1 Junior Suite, 1 Deluxe (9 camere)
   roomsTotal resta sempre 9.
   ymdNum è la data come YYYYMMDD numerico.
   Per altre strutture l'inventario è statico. */
const ALFANI_JS_SPLIT_YMD = 20250201;  // 1 febbraio 2025 = data separazione JS dalla Classic
function structRoomsForAt(sel, ymdNum){
  if (sel !== 'alfani') return structRoomsFor(sel);
  if (ymdNum < ALFANI_JS_SPLIT_YMD){
    return {'Classic':4, 'Superior':4, 'Junior Suite':0, 'Deluxe':1};
  }
  return CFG.structures.alfani.rooms;  // post-split (current)
}
function structRoomsTotal(sel){
  if (sel==='firenze')  return CFG.structures.firenze.roomsTotal;
  if (sel==='condotta') return CFG.structures.condotta.roomsTotal;
  if (sel==='alfani')   return CFG.structures.alfani.roomsTotal;
  if (sel==='davids')   return CFG.structures.davids.roomsTotal;
  return CFG.structures.firenze.roomsTotal + CFG.structures.condotta.roomsTotal + CFG.structures.alfani.roomsTotal + CFG.structures.davids.roomsTotal;
}
/* Budget helpers — fiscal year May 2026 -> Apr 2027.
   ym is YYYYMM (e.g. 202605). 'metric' is 'rev', 'occ', or 'adr'.
   For 'both', revenues sum, OCC and ADR are weighted by rooms × days_in_month. */
/* David's budget = FORECAST: revenue confermato LY (stesso mese, anno precedente) × growth.
   Calcolato on-the-fly dai BOOKINGS storici. metric: 'rev' | 'occ' | 'adr'. */
function _davidsBudgetForecast(ym, metric){
  metric = metric || 'rev';
  const y = Math.floor(ym/100), m = ym%100;
  const lyY = y - 1;
  const dim = new Date(y, m, 0).getDate();
  const cap = CFG.structures.davids.roomsTotal * dim;  // room-nights disponibili nel mese
  let revLY = 0, rnLY = 0;
  for (const b of BOOKINGS){
    if (b.structKey !== 'davids') continue;
    if (b.cancelled) continue;
    const din = b.dIn, nights = b.notti;
    if (!din || !nights) continue;
    const rpn = (b.revPerNight != null && isFinite(b.revPerNight)) ? b.revPerNight : 0;
    for (let i=0;i<nights;i++){
      const d = new Date(din.getFullYear(), din.getMonth(), din.getDate()+i);
      if (d.getFullYear()===lyY && (d.getMonth()+1)===m){
        revLY += rpn;
        rnLY  += 1;
      }
    }
  }
  const revFc = revLY * _DAVIDS_BUDGET_GROWTH;
  if (metric==='rev') return revFc;
  if (metric==='occ') return cap>0 ? Math.min(1, (rnLY*_DAVIDS_BUDGET_GROWTH)/cap) : 0;
  if (metric==='adr') return rnLY>0 ? revFc/(rnLY*_DAVIDS_BUDGET_GROWTH) : 0;
  return 0;
}
function budgetMonthlyFor(sel, ym, metric){
  metric = metric || 'rev';
  if (sel==='both'){
    const fF = CFG.structures.firenze.budgetByMonth[ym];
    const fC = CFG.structures.condotta.budgetByMonth[ym];
    const fA = CFG.structures.alfani.budgetByMonth[ym];
    if (!fF || !fC || !fA) return 0;
    if (metric==='rev') return (fF.rev||0) + (fC.rev||0) + (fA.rev||0);
    const y = Math.floor(ym/100), m = ym%100;
    const dim = new Date(y, m, 0).getDate();
    const capF = CFG.structures.firenze.roomsTotal  * dim;
    const capC = CFG.structures.condotta.roomsTotal * dim;
    const capA = CFG.structures.alfani.roomsTotal   * dim;
    if (metric==='occ'){
      return (capF*fF.occ + capC*fC.occ + capA*fA.occ) / (capF + capC + capA);
    }
    if (metric==='adr'){
      const rnF = capF * fF.occ;
      const rnC = capC * fC.occ;
      const rnA = capA * fA.occ;
      const totRn = rnF + rnC + rnA;
      if (totRn <= 0) return 0;
      return ((fF.rev||0) + (fC.rev||0) + (fA.rev||0)) / totRn;
    }
    return 0;
  }
  if (sel==='davids' || (CFG.structures[sel] && CFG.structures[sel].budgetIsForecast)){
    return _davidsBudgetForecast(ym, metric);
  }
  const f = CFG.structures[sel].budgetByMonth[ym];
  if (!f) return 0;
  return f[metric] || 0;
}
function budgetTotalFor(sel){
  if (sel==='both') return CFG.structures.firenze.budgetTotal + CFG.structures.condotta.budgetTotal + CFG.structures.alfani.budgetTotal;
  if (sel==='davids' || (CFG.structures[sel] && CFG.structures[sel].budgetIsForecast)){
    let tot = 0;
    let ym = CFG.fiscal.startYM;
    for (let i=0;i<16;i++){
      tot += _davidsBudgetForecast(ym, 'rev');
      const y=Math.floor(ym/100), m=ym%100;
      ym = (m===12) ? (y+1)*100+1 : ym+1;
    }
    return tot;
  }
  return CFG.structures[sel].budgetTotal;
}
/* ============================================================
   BUDGET ADR PER ROOM TYPE
   Calcola un ADR di budget per ogni RT della struttura per quel mese.
   Logica: il budget mensile è dato a livello struttura (ADR_struct).
   Il mix tra RT è derivato dallo STORICO LY 2025 dello stesso mese:
     - calcolo il rapporto storico ADR_RT_LY / ADR_struct_LY
     - applico questo rapporto al budget struttura corrente:
       ADR_budget_RT = ADR_budget_struct × (ADR_RT_LY / ADR_struct_LY)
   Esempio: budget struttura €150, storico Bilocale €100 vs struttura €120
     → ratio Bilocale = 100/120 = 0.833
     → ADR budget Bilocale = 150 × 0.833 = €125
   ============================================================ */
const _budgetRtCache = {};   // sel:ym:rt → adr
const _budgetRtRatioCache = {};  // sel:ym → {rt: ratio}
function _computeRtRatiosFromLY(sel, ym){
  const cacheKey = `${sel}:${ym}`;
  if (_budgetRtRatioCache[cacheKey]) return _budgetRtRatioCache[cacheKey];
  const y = Math.floor(ym / 100);
  const m = ym % 100;
  const lyYm = (y - 1) * 100 + m;  // stesso mese, anno prima
  const lyYmStart = lyYm * 100 + 1;
  const lyDim = new Date(y - 1, m, 0).getDate();
  const lyYmEnd = lyYm * 100 + lyDim;
  const byRt = {};  // rt -> {rn, rev}
  const structKeys = new Set(structKeysFor(sel));
  for (const b of BOOKINGS){
    if (!structKeys.has(b.struct)) continue;
    if (b.stato !== 'Confermate') continue;
    const dIn = b.dIn, dOut = b.dOut;
    if (!dIn || !dOut) continue;
    let cur = new Date(dIn);
    while (cur < dOut){
      const ymd = cur.getFullYear() * 10000 + (cur.getMonth() + 1) * 100 + cur.getDate();
      if (ymd >= lyYmStart && ymd <= lyYmEnd){
        const rt = b.room || '—';
        if (!byRt[rt]) byRt[rt] = {rn: 0, rev: 0};
        byRt[rt].rn += 1;
        byRt[rt].rev += b.revPerNight || 0;
      }
      cur = new Date(cur.getTime() + 86400000);
    }
  }
  let totRn = 0, totRev = 0;
  for (const rt in byRt){
    totRn += byRt[rt].rn;
    totRev += byRt[rt].rev;
  }
  const structAdr = totRn > 0 ? totRev / totRn : 0;
  const ratios = {};
  if (structAdr > 0){
    for (const rt in byRt){
      const adrRt = byRt[rt].rn > 0 ? byRt[rt].rev / byRt[rt].rn : 0;
      ratios[rt] = adrRt > 0 ? adrRt / structAdr : 1.0;
    }
  }
  _budgetRtRatioCache[cacheKey] = ratios;
  return ratios;
}
function budgetAdrByRT(sel, ym, rt){
  if (sel === 'both') return 0;  // budget per RT solo a livello struttura singola
  const cacheKey = `${sel}:${ym}:${rt}`;
  if (_budgetRtCache[cacheKey] !== undefined) return _budgetRtCache[cacheKey];
  const adrStruct = budgetMonthlyFor(sel, ym, 'adr');
  if (!adrStruct || adrStruct <= 0){
    _budgetRtCache[cacheKey] = 0;
    return 0;
  }
  const ratios = _computeRtRatiosFromLY(sel, ym);
  const ratio = ratios[rt];
  let adrRt;
  if (ratio && ratio > 0){
    adrRt = adrStruct * ratio;
  } else {
    adrRt = adrStruct;
  }
  _budgetRtCache[cacheKey] = adrRt;
  return adrRt;
}
/* Returns the list of fiscal-year YM keys in order: [202605, 202606, ..., 202704] */
function fiscalMonths(){
  const out = [];
  let y = Math.floor(CFG.fiscal.startYM/100);
  let m = CFG.fiscal.startYM % 100;
  for (let i=0; i<12; i++){
    out.push(y*100 + m);
    m++;
    if (m > 12){ m = 1; y++; }
  }
  return out;
}
function structLabel(sel){
  if (sel==='both') return 'All properties';
  return CFG.structures[sel].label;
}
function filteredBookings(sel){
  const keys = new Set(structKeysFor(sel));
  return BOOKINGS.filter(b => keys.has(b.struct));
}
/* -------- MONTH ALLOCATION (split stay across months) --------
   For metrics by month-of-stay: distribute roomNights and revenue per night
   across calendar months touched by [dIn, dOut). Returns per-month {rn, rev}.
*/
function monthAllocate(dIn, dOut, revPerNight){
  const out = {};
  let cur = startOfDay(dIn);
  const end = startOfDay(dOut);
  while (cur < end){
    const y = cur.getFullYear();
    const m = cur.getMonth()+1;
    const key = y*100 + m;
    if (!out[key]) out[key] = {rn:0, rev:0};
    out[key].rn += 1;
    out[key].rev += revPerNight;
    cur = addDays(cur,1);
  }
  return out;
}
/* ============================================================
   AGGREGATORS
   ============================================================ */
/* OTB anno intero
   Per il confronto:
   - 2026 OTB:  prenotazioni con bookYmd <= TODAY  e  dIn nell'anno CUR
   - 2025 STLY: prenotazioni con bookYmd <= STLY   e  dIn nell'anno PREV
   Per i mesi: alloca rn e rev sui mesi del soggiorno usando monthAllocate.
   Capacità mensile = roomsTotal × days del mese.
*/
function aggOTBYearly(sel){
  const keys = new Set(structKeysFor(sel));
  const roomsTot = structRoomsTotal(sel);
  const cur = {};   // m -> {rn,rev}
  const prev = {};  // STLY
  const fly = {};   // Final LY (2025 chiusura)
  for (let m=1;m<=12;m++){ cur[m]={rn:0,rev:0}; prev[m]={rn:0,rev:0}; fly[m]={rn:0,rev:0}; }
  const provCur = {}, provPrev = {}, provFly = {};
  const canCur = {},  canPrev = {},  canFly = {};
  const provCurM = {}, provPrevM = {}, provFlyM = {};
  const canCurM = {},  canPrevM = {},  canFlyM = {};
  for (let m=1;m<=12;m++){
    provCurM[m]={}; provPrevM[m]={}; provFlyM[m]={};
    canCurM[m]={};  canPrevM[m]={};  canFlyM[m]={};
  }
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (!keys.has(b.struct)) continue;
    const isCurrentBkWindow = b.bookYmd <= TODAY_YMD;
    const isStlyBkWindow    = b.bookYmd <= STLY_YMD;
    const alloc = monthAllocate(b.dIn, b.dOut, b.revPerNight);
    for (const k in alloc){
      const ym = +k;
      const y  = Math.floor(ym/100);
      const m  = ym % 100;
      const a  = alloc[k];
      if (isCurrentBkWindow && y===CUR_YEAR){
        cur[m].rn += a.rn; cur[m].rev += a.rev;
      }
      if (isStlyBkWindow && y===PREV_YEAR){
        prev[m].rn += a.rn; prev[m].rev += a.rev;
      }
      if (y===PREV_YEAR){
        fly[m].rn += a.rn; fly[m].rev += a.rev;
      }
    }
    if (isCurrentBkWindow){
      let rn=0, rev=0;
      const perMonth = {};  // m -> {rn, rev}
      for (const k in alloc){
        const ym = +k;
        const y = Math.floor(ym/100);
        if (y===CUR_YEAR){
          rn += alloc[k].rn; rev += alloc[k].rev;
          const mm = ym % 100;
          if (!perMonth[mm]) perMonth[mm] = {rn:0, rev:0};
          perMonth[mm].rn += alloc[k].rn; perMonth[mm].rev += alloc[k].rev;
        }
      }
      if (rn>0){
        if (!provCur[b.prov]) provCur[b.prov]={rn:0,rev:0,bk:0};
        provCur[b.prov].rn += rn; provCur[b.prov].rev += rev; provCur[b.prov].bk += 1;
        if (!canCur[b.canale]) canCur[b.canale]={rn:0,rev:0,bk:0};
        canCur[b.canale].rn += rn; canCur[b.canale].rev += rev; canCur[b.canale].bk += 1;
        for (const mm in perMonth){
          const r = perMonth[mm];
          if (!provCurM[mm][b.prov]) provCurM[mm][b.prov] = {rn:0,rev:0,bk:0};
          provCurM[mm][b.prov].rn += r.rn; provCurM[mm][b.prov].rev += r.rev; provCurM[mm][b.prov].bk += 1;
          if (!canCurM[mm][b.canale]) canCurM[mm][b.canale] = {rn:0,rev:0,bk:0};
          canCurM[mm][b.canale].rn += r.rn; canCurM[mm][b.canale].rev += r.rev; canCurM[mm][b.canale].bk += 1;
        }
      }
    }
    if (isStlyBkWindow){
      let rn=0, rev=0;
      const perMonth = {};
      for (const k in alloc){
        const ym = +k;
        const y = Math.floor(ym/100);
        if (y===PREV_YEAR){
          rn += alloc[k].rn; rev += alloc[k].rev;
          const mm = ym % 100;
          if (!perMonth[mm]) perMonth[mm] = {rn:0, rev:0};
          perMonth[mm].rn += alloc[k].rn; perMonth[mm].rev += alloc[k].rev;
        }
      }
      if (rn>0){
        if (!provPrev[b.prov]) provPrev[b.prov]={rn:0,rev:0,bk:0};
        provPrev[b.prov].rn += rn; provPrev[b.prov].rev += rev; provPrev[b.prov].bk += 1;
        if (!canPrev[b.canale]) canPrev[b.canale]={rn:0,rev:0,bk:0};
        canPrev[b.canale].rn += rn; canPrev[b.canale].rev += rev; canPrev[b.canale].bk += 1;
        for (const mm in perMonth){
          const r = perMonth[mm];
          if (!provPrevM[mm][b.prov]) provPrevM[mm][b.prov] = {rn:0,rev:0,bk:0};
          provPrevM[mm][b.prov].rn += r.rn; provPrevM[mm][b.prov].rev += r.rev; provPrevM[mm][b.prov].bk += 1;
          if (!canPrevM[mm][b.canale]) canPrevM[mm][b.canale] = {rn:0,rev:0,bk:0};
          canPrevM[mm][b.canale].rn += r.rn; canPrevM[mm][b.canale].rev += r.rev; canPrevM[mm][b.canale].bk += 1;
        }
      }
    }
    {
      let rn=0, rev=0;
      const perMonth = {};
      for (const k in alloc){
        const ym = +k;
        const y = Math.floor(ym/100);
        if (y===PREV_YEAR){
          rn += alloc[k].rn; rev += alloc[k].rev;
          const mm = ym % 100;
          if (!perMonth[mm]) perMonth[mm] = {rn:0, rev:0};
          perMonth[mm].rn += alloc[k].rn; perMonth[mm].rev += alloc[k].rev;
        }
      }
      if (rn>0){
        if (!provFly[b.prov]) provFly[b.prov]={rn:0,rev:0,bk:0};
        provFly[b.prov].rn += rn; provFly[b.prov].rev += rev; provFly[b.prov].bk += 1;
        if (!canFly[b.canale]) canFly[b.canale]={rn:0,rev:0,bk:0};
        canFly[b.canale].rn += rn; canFly[b.canale].rev += rev; canFly[b.canale].bk += 1;
        for (const mm in perMonth){
          const r = perMonth[mm];
          if (!provFlyM[mm][b.prov]) provFlyM[mm][b.prov] = {rn:0,rev:0,bk:0};
          provFlyM[mm][b.prov].rn += r.rn; provFlyM[mm][b.prov].rev += r.rev; provFlyM[mm][b.prov].bk += 1;
          if (!canFlyM[mm][b.canale]) canFlyM[mm][b.canale] = {rn:0,rev:0,bk:0};
          canFlyM[mm][b.canale].rn += r.rn; canFlyM[mm][b.canale].rev += r.rev; canFlyM[mm][b.canale].bk += 1;
        }
      }
    }
  }
  const capCur = {}, capPrev = {};
  for (let m=1;m<=12;m++){
    capCur[m]  = roomsTot * daysInMonth(CUR_YEAR, m);
    capPrev[m] = roomsTot * daysInMonth(PREV_YEAR, m);
  }
  const monthRows = [];
  let totCur={rn:0,rev:0,cap:0}, totPrev={rn:0,rev:0,cap:0};
  for (let m=1;m<=12;m++){
    const c = cur[m], p = prev[m];
    const occC = c.rn / capCur[m];
    const occP = p.rn / capPrev[m];
    const adrC = c.rn>0 ? c.rev/c.rn : NaN;
    const adrP = p.rn>0 ? p.rev/p.rn : NaN;
    const f = fly[m];
    const occF = f.rn / capPrev[m];
    const adrF = f.rn>0 ? f.rev/f.rn : NaN;
    monthRows.push({
      m, occC, occP, adrC, adrP,
      revC:c.rev, revP:p.rev, rnC:c.rn, rnP:p.rn,
      revF:f.rev, rnF:f.rn, occF, adrF,
      dOccF: occC - occF,
      dAdrFEur: (isFinite(adrC)&&isFinite(adrF)) ? adrC-adrF : NaN,
      dAdrFPct: (isFinite(adrC)&&isFinite(adrF)&&adrF>0) ? (adrC-adrF)/adrF : NaN,
      dRevFPct: f.rev>0 ? (c.rev-f.rev)/f.rev : NaN,
      dOcc: occC - occP,
      dAdrEur: (isFinite(adrC)&&isFinite(adrP)) ? adrC-adrP : NaN,
      dAdrPct: (isFinite(adrC)&&isFinite(adrP)&&adrP>0) ? (adrC-adrP)/adrP : NaN,
      dRevPct: p.rev>0 ? (c.rev-p.rev)/p.rev : NaN,
    });
    totCur.rn += c.rn; totCur.rev += c.rev; totCur.cap += capCur[m];
    totPrev.rn += p.rn; totPrev.rev += p.rev; totPrev.cap += capPrev[m];
  }
  let totFly = {rn:0, rev:0};
  for (let m=1;m<=12;m++){ totFly.rn += fly[m].rn; totFly.rev += fly[m].rev; }
  const tot = {
    occC: totCur.rn/totCur.cap, occP: totPrev.rn/totPrev.cap,
    adrC: totCur.rn>0?totCur.rev/totCur.rn:NaN,
    adrP: totPrev.rn>0?totPrev.rev/totPrev.rn:NaN,
    revC: totCur.rev, revP: totPrev.rev, rnC: totCur.rn, rnP: totPrev.rn,
    capC: totCur.cap, capP: totPrev.cap,
    rnF: totFly.rn, revF: totFly.rev,
    occF: totFly.rn / totCur.cap,  // uso la stessa capacità di rif. (≈ 365 × rooms)
    adrF: totFly.rn>0 ? totFly.rev/totFly.rn : NaN,
  };
  tot.dOcc = tot.occC - tot.occP;
  tot.dAdrEur = (isFinite(tot.adrC)&&isFinite(tot.adrP)) ? tot.adrC-tot.adrP : NaN;
  tot.dAdrPct = (isFinite(tot.adrC)&&isFinite(tot.adrP)&&tot.adrP>0) ? (tot.adrC-tot.adrP)/tot.adrP : NaN;
  tot.dRevPct = tot.revP>0 ? (tot.revC-tot.revP)/tot.revP : NaN;
  tot.dOccF = tot.occC - tot.occF;
  tot.dAdrFEur = (isFinite(tot.adrC)&&isFinite(tot.adrF)) ? tot.adrC-tot.adrF : NaN;
  tot.dAdrFPct = (isFinite(tot.adrC)&&isFinite(tot.adrF)&&tot.adrF>0) ? (tot.adrC-tot.adrF)/tot.adrF : NaN;
  tot.dRevFPct = tot.revF>0 ? (tot.revC-tot.revF)/tot.revF : NaN;
  return { monthRows, tot, provCur, provPrev, canCur, canPrev, provFly, canFly,
           provCurM, provPrevM, provFlyM, canCurM, canPrevM, canFlyM };
}
/* OCC by Room Type
   Per ogni mese di soggiorno e per ogni room type, calcola RN, ADR.
   Capacità per room type = camere(rt) × days del mese.
*/
function aggRoomType(sel){
  const keys = new Set(structKeysFor(sel));
  const roomsMap = structRoomsFor(sel);     // rt -> count
  const rtList = Object.keys(roomsMap);
  const buc = {};
  for (const rt of rtList){
    buc[rt] = {};
    for (let m=1;m<=12;m++) buc[rt][m] = {rnC:0,revC:0,rnP:0,revP:0};
  }
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (!keys.has(b.struct)) continue;
    if (!(b.room in roomsMap)) continue;   // skip stray room-type assignments
    const isCurrentBk = b.bookYmd <= TODAY_YMD;
    const isStlyBk    = b.bookYmd <= STLY_YMD;
    if (!isCurrentBk && !isStlyBk) continue;
    const alloc = monthAllocate(b.dIn, b.dOut, b.revPerNight);
    for (const k in alloc){
      const ym = +k, y = Math.floor(ym/100), m = ym%100;
      const a = alloc[k];
      if (isCurrentBk && y===CUR_YEAR){
        buc[b.room][m].rnC += a.rn; buc[b.room][m].revC += a.rev;
      }
      if (isStlyBk && y===PREV_YEAR){
        buc[b.room][m].rnP += a.rn; buc[b.room][m].revP += a.rev;
      }
    }
  }
  function effectiveRoomsForMonth(rt, year, month){
    if (sel !== 'alfani') return roomsMap[rt];
    const ym = year*100 + month;
    if (ym < 202502){
      if (rt === 'Classic') return 4;
      if (rt === 'Junior Suite') return 0;
    }
    return roomsMap[rt];
  }
  const rtData = {};
  for (const rt of rtList){
    const rooms = roomsMap[rt];  // displayed reference rooms (current)
    const months = [];
    let totC={rn:0,rev:0,cap:0}, totP={rn:0,rev:0,cap:0};
    for (let m=1;m<=12;m++){
      const v = buc[rt][m];
      const roomsCur  = effectiveRoomsForMonth(rt, CUR_YEAR, m);
      const roomsPrev = effectiveRoomsForMonth(rt, PREV_YEAR, m);
      const capC = roomsCur  * daysInMonth(CUR_YEAR, m);
      const capP = roomsPrev * daysInMonth(PREV_YEAR, m);
      months.push({
        m,
        occC: capC>0 ? v.rnC/capC : 0,
        occP: capP>0 ? v.rnP/capP : 0,
        adrC: v.rnC>0?v.revC/v.rnC:NaN,
        adrP: v.rnP>0?v.revP/v.rnP:NaN,
        rnC:v.rnC, rnP:v.rnP, revC:v.revC, revP:v.revP,
      });
      totC.rn += v.rnC; totC.rev += v.revC; totC.cap += capC;
      totP.rn += v.rnP; totP.rev += v.revP; totP.cap += capP;
    }
    rtData[rt] = {
      rooms, months,
      occC: totC.cap>0 ? totC.rn/totC.cap : 0, occP: totP.cap>0 ? totP.rn/totP.cap : 0,
      adrC: totC.rn>0?totC.rev/totC.rn:NaN,
      adrP: totP.rn>0?totP.rev/totP.rn:NaN,
      rnC: totC.rn, rnP: totP.rn, revC: totC.rev, revP: totP.rev,
    };
  }
  return { rtList, rtData };
}
/* BUDGET 2026
   OTB cumulato per mese (al 30-aprile-style) vs target di budget.
   - OTB mese m = revenue allocato sul mese m da prenotazioni con bookYmd<=TODAY e dIn in CUR_YEAR.
*/
function aggBudget(sel){
  const keys = new Set(structKeysFor(sel));
  const fmonths = fiscalMonths(); // [202605, 202606, ..., 202704]
  const otb = {};
  const pk7 = {};
  const pk7S = {};
  for (const ym of fmonths){
    otb[ym] = {rev:0, rn:0};
    pk7[ym] = {rev:0, rn:0};
    pk7S[ym] = {rev:0, rn:0};
  }
  const _today = new Date(TODAY); _today.setHours(0,0,0,0);
  const pk7Start = new Date(_today.getTime() - 6*24*60*60*1000);
  const pk7StartYmd = ymd(pk7Start);
  const stlyEnd   = new Date(_today.getTime()  - 364*24*60*60*1000);
  const stlyStart = new Date(stlyEnd.getTime() - 6*24*60*60*1000);
  const pk7StlyStartYmd = ymd(stlyStart);
  const pk7StlyEndYmd   = ymd(stlyEnd);
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (!keys.has(b.struct)) continue;
    if (b.bookYmd > TODAY_YMD) continue;
    const alloc = monthAllocate(b.dIn, b.dOut, b.revPerNight);
    const inPk7    = (b.bookYmd >= pk7StartYmd     && b.bookYmd <= TODAY_YMD);
    const inPk7Stly = (b.bookYmd >= pk7StlyStartYmd && b.bookYmd <= pk7StlyEndYmd);
    for (const k in alloc){
      const ym = +k;
      if (otb[ym]){
        otb[ym].rev += alloc[k].rev;
        otb[ym].rn  += alloc[k].rn;
        if (inPk7){
          pk7[ym].rev += alloc[k].rev;
          pk7[ym].rn  += alloc[k].rn;
        }
      }
    }
    if (inPk7Stly){
      const dInS = new Date(b.dIn.getTime()  + 364*24*60*60*1000);
      const dOutS = new Date(b.dOut.getTime() + 364*24*60*60*1000);
      const allocS = monthAllocate(dInS, dOutS, b.revPerNight);
      for (const k in allocS){
        const ym = +k;
        if (pk7S[ym]){
          pk7S[ym].rev += allocS[k].rev;
          pk7S[ym].rn  += allocS[k].rn;
        }
      }
    }
  }
  const rooms = structRoomsTotal(sel);
  const todayY = TODAY.getFullYear();
  const todayM = TODAY.getMonth() + 1;
  const todayD = TODAY.getDate();
  const todayYM = todayY*100 + todayM;
  const dimCurrent = new Date(todayY, todayM, 0).getDate();
  const daysLeftThisMonth = Math.max(0, dimCurrent - todayD);
  const rows = [];
  let cumOtb=0, cumBud=0, totOtb=0, totBud=0;
  let cumGapToClose=0, cumDaysToYearEnd=0;
  let cumDaysToMonthEnd = 0;
  for (const ym of fmonths){
    const y = Math.floor(ym/100), m = ym%100;
    const dim = new Date(y, m, 0).getDate();
    const cap = rooms * dim;
    const targetRev = budgetMonthlyFor(sel, ym, 'rev');
    const targetOcc = budgetMonthlyFor(sel, ym, 'occ');
    const targetAdr = budgetMonthlyFor(sel, ym, 'adr');
    const actualOcc = cap>0 ? otb[ym].rn / cap : 0;
    const actualAdr = otb[ym].rn>0 ? otb[ym].rev / otb[ym].rn : 0;
    let monthState = 'past';
    let daysToMonthEnd = 0;       // cumulative days from today to end of this month
    let daysOwnMonth = 0;         // days in this month alone (0 if past, partial if current, full if future)
    if (ym < todayYM){
      monthState = 'past';
      daysToMonthEnd = 0;
      daysOwnMonth = 0;
    } else if (ym === todayYM){
      monthState = 'current';
      daysOwnMonth = daysLeftThisMonth;
      daysToMonthEnd = daysLeftThisMonth;
      cumDaysToMonthEnd = daysLeftThisMonth;
    } else {
      monthState = 'future';
      daysOwnMonth = dim;
      cumDaysToMonthEnd += dim;
      daysToMonthEnd = cumDaysToMonthEnd;
    }
    const gap = otb[ym].rev - targetRev;
    let runRate = NaN;
    if (gap >= 0){
      runRate = 0;
    } else if (daysToMonthEnd > 0){
      runRate = (-gap) / daysToMonthEnd;
    } // else past month with negative gap -> NaN
    const pk7Rate  = pk7[ym].rev  / 7;
    const pk7RateS = pk7S[ym].rev / 7;
    cumOtb += otb[ym].rev;
    cumBud += targetRev;
    totOtb += otb[ym].rev;
    totBud += targetRev;
    if (monthState !== 'past' && gap < 0){
      cumGapToClose += -gap;
    }
    rows.push({
      ym, y, m, dim, cap, monthState,
      daysToMonthEnd, daysOwnMonth,
      otb: otb[ym].rev,
      rn:  otb[ym].rn,
      target: targetRev,
      targetOcc, targetAdr,
      actualOcc, actualAdr,
      pct: targetRev>0 ? otb[ym].rev/targetRev : NaN,
      gap,
      gapOcc: actualOcc - targetOcc,
      gapAdr: actualAdr - targetAdr,
      cumOtb, cumBud,
      cumPct: cumBud>0 ? cumOtb/cumBud : NaN,
      runRate,        // €/giorno necessario fino a fine mese (cumulativo)
      pk7Rev: pk7[ym].rev,
      pk7Rate,        // €/giorno medio pickup ultimi 7 days allocato a questo mese
      pk7RevS: pk7S[ym].rev,
      pk7RateS,       // average €/day pickup STLY (same period last year)
    });
  }
  const lastRow = rows[rows.length-1];
  const yearDaysRemain = lastRow ? lastRow.daysToMonthEnd : 0;
  const yearRunRate = yearDaysRemain>0 ? cumGapToClose/yearDaysRemain : NaN;
  let totPk7=0, totPk7S=0;
  for (const r of rows){ totPk7 += r.pk7Rev; totPk7S += r.pk7RevS; }
  const yearPk7Rate  = totPk7  / 7;
  const yearPk7RateS = totPk7S / 7;
  return {
    rows, totOtb, totBud, totPct: totBud>0?totOtb/totBud:NaN,
    fmonths,
    yearRunRate, yearPk7Rate, yearPk7RateS,
    pk7WindowStart: pk7StartYmd,
    pk7WindowEnd:   TODAY_YMD,
    pk7StlyWindowStart: pk7StlyStartYmd,
    pk7StlyWindowEnd:   pk7StlyEndYmd,
  };
}
/* PICKUP MATRIX
   Ultime 4 settimane (lunedì → domenica), terminanti alla settimana che contiene OGGI.
   Per ogni settimana: pickup = booking effettuate in quella settimana (bookDate)
   con dIn nell'anno corrente (per CUR) o nell'anno scorso (per STLY).
*/
function getPickupWeeks(){
  const t = new Date(TODAY); t.setHours(0,0,0,0);
  const weeks = [];
  for (let i=3;i>=0;i--){
    const end   = addDays(t, -7*i);
    const start = addDays(end, -6);
    weeks.push({start, end, ymdStart:ymd(start), ymdEnd:ymd(end)});
  }
  return weeks;
}
function aggPickup(sel){
  const keys = new Set(structKeysFor(sel));
  const weeks = getPickupWeeks();
  const stlyWeeks = weeks.map(w=>({
    start: addDays(w.start, -364), end: addDays(w.end, -364),
    ymdStart: ymd(addDays(w.start,-364)), ymdEnd: ymd(addDays(w.end,-364))
  }));
  const rtSet = new Set(); const provSet = new Set();
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (!keys.has(b.struct)) continue;
    rtSet.add(b.room); provSet.add(b.prov);
  }
  const validRooms = new Set(Object.keys(structRoomsFor(sel)));
  const rtAxis = Array.from(rtSet).filter(r=>validRooms.has(r));
  const provAxis = Array.from(provSet);
  const stayMonthSet = new Set();
  const mkCell = ()=>({bk:0, rn:0, rev:0, rows:[]});
  const rt = {};   for (const r of rtAxis)   { rt[r]   = weeks.map(_=>mkCell()); }
  const rtS = {};  for (const r of rtAxis)   { rtS[r]  = weeks.map(_=>mkCell()); }
  const pr = {};   for (const p of provAxis) { pr[p]   = weeks.map(_=>mkCell()); }
  const prS = {};  for (const p of provAxis) { prS[p]  = weeks.map(_=>mkCell()); }
  const sm = {};   // 'YYYY-MM' -> [cell per week, ...]
  const smS = {};
  function ensureMonth(monthKey){
    if (!sm[monthKey]){
      sm[monthKey] = weeks.map(_=>mkCell());
      smS[monthKey] = weeks.map(_=>mkCell());
    }
    stayMonthSet.add(monthKey);
  }
  function stayMonthKey(d){
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
  }
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (!keys.has(b.struct)) continue;
    for (let i=0;i<weeks.length;i++){
      const w = weeks[i];
      if (b.bookYmd >= w.ymdStart && b.bookYmd <= w.ymdEnd){
        if (validRooms.has(b.room)){
          const c = rt[b.room][i];
          c.bk += 1; c.rn += b.notti; c.rev += b.revTotal; c.rows.push(b);
        }
        if (provAxis.includes(b.prov)){
          const c = pr[b.prov][i];
          c.bk += 1; c.rn += b.notti; c.rev += b.revTotal; c.rows.push(b);
        }
        if (b.dIn){
          const mk = stayMonthKey(b.dIn);
          ensureMonth(mk);
          const c = sm[mk][i];
          c.bk += 1; c.rn += b.notti; c.rev += b.revTotal; c.rows.push(b);
        }
      }
      const ws = stlyWeeks[i];
      if (b.bookYmd >= ws.ymdStart && b.bookYmd <= ws.ymdEnd){
        if (validRooms.has(b.room)){
          const c = rtS[b.room][i];
          c.bk += 1; c.rn += b.notti; c.rev += b.revTotal; c.rows.push(b);
        }
        if (provAxis.includes(b.prov)){
          const c = prS[b.prov][i];
          c.bk += 1; c.rn += b.notti; c.rev += b.revTotal; c.rows.push(b);
        }
        if (b.dIn){
          const mk = stayMonthKey(b.dIn);
          ensureMonth(mk);
          const c = smS[mk][i];
          c.bk += 1; c.rn += b.notti; c.rev += b.revTotal; c.rows.push(b);
        }
      }
    }
  }
  function shiftMonthForward(monthKey){
    const [y, m] = monthKey.split('-').map(s=>parseInt(s,10));
    return (y+1) + '-' + String(m).padStart(2,'0');
  }
  const allMonths = new Set();
  for (const k of stayMonthSet){
    if (sm[k] && sm[k].some(c=>c.bk>0)) allMonths.add(k);
    if (smS[k] && smS[k].some(c=>c.bk>0)) allMonths.add(shiftMonthForward(k));
  }
  const smOut = {};
  const smSOut = {};
  for (const mk of allMonths){
    smOut[mk] = weeks.map(_=>mkCell());
    smSOut[mk] = weeks.map(_=>mkCell());
  }
  for (const k of stayMonthSet){
    if (smOut[k]){
      for (let i=0; i<weeks.length; i++){
        const c = sm[k][i];
        smOut[k][i].bk = c.bk;
        smOut[k][i].rn = c.rn;
        smOut[k][i].rev = c.rev;
        smOut[k][i].rows = c.rows.slice();
      }
    }
  }
  for (const k of stayMonthSet){
    const shifted = shiftMonthForward(k);
    if (smSOut[shifted]){
      for (let i=0; i<weeks.length; i++){
        const c = smS[k][i];
        smSOut[shifted][i].bk = c.bk;
        smSOut[shifted][i].rn = c.rn;
        smSOut[shifted][i].rev = c.rev;
        smSOut[shifted][i].rows = c.rows.slice();
      }
    }
  }
  const smAxis = Array.from(allMonths).sort();
  return { weeks, stlyWeeks, rtAxis, provAxis, rt, rtS, pr, prS, smAxis, sm: smOut, smS: smSOut };
}
/* ============================================================
   RENDERING - SECTION 1: OTB YEARLY
   ============================================================ */
function deltaCell(val, kind, extraCls){
  const _ex = extraCls ? (' ' + extraCls) : '';
  if (!isFinite(val)) return '<td class="cell-flat' + _ex + '">—</td>';
  let cls = val>0 ? 'cell-pos' : (val<0 ? 'cell-neg' : 'cell-flat');
  cls += _ex;
  let txt = '';
  if (kind==='pp') txt = (val>=0?'+':'')+(val*100).toFixed(1)+' pp';
  else if (kind==='eur') txt = (val>=0?'+':'')+'€'+Math.round(val).toLocaleString('en-GB');
  else if (kind==='pct') txt = (val>=0?'+':'')+(val*100).toFixed(1)+'%';
  else txt = (val>=0?'+':'')+Math.round(val).toLocaleString('en-GB');
  return `<td class="${cls} cell-mono">${txt}</td>`;
}
/* Stato del filtro mese (Overview): null = totale anno, 1..12 = mese specifico */
let OTB_MONTH_FILTER = null;
function renderOTB(sel){
  const A = aggOTBYearly(sel);
  window._OTB_A = A;
  window._OTB_SEL = sel;
  const kpi = [
    {label:'Revenue OTB 2026', val:fmtEUR(A.tot.revC),
     sub:`STLY ${fmtEUR(A.tot.revP)}`, delta:A.tot.dRevPct, dkind:'pct', cls:'k-rev'},
    {label:'OCC% Year', val:fmtPct(A.tot.occC,1),
     sub:`STLY ${fmtPct(A.tot.occP,1)}`, delta:A.tot.dOcc, dkind:'pp', cls:'k-occ'},
    {label:'ADR Year', val:fmtAdr(A.tot.adrC),
     sub:`STLY ${fmtAdr(A.tot.adrP)}`, delta:A.tot.dAdrPct, dkind:'pct', cls:'k-adr'},
    {label:'Room Nights', val:fmtNum(A.tot.rnC),
     sub:`STLY ${fmtNum(A.tot.rnP)} · cap ${fmtNum(A.tot.capC)}`, delta:A.tot.rnC-A.tot.rnP, dkind:'num', cls:'k-rooms'},
  ];
  document.getElementById('otb-kpis').innerHTML = kpi.map(k=>{
    const d = isFinite(k.delta) ? `<span class="delta ${k.delta>0?'pos':k.delta<0?'neg':'flat'}">${
      k.dkind==='pp' ? ((k.delta>=0?'+':'')+(k.delta*100).toFixed(1)+' pp') :
      k.dkind==='pct' ? ((k.delta>=0?'+':'')+(k.delta*100).toFixed(1)+'%') :
      ((k.delta>=0?'+':'')+Math.round(k.delta).toLocaleString('en-GB'))
    }</span>` : '';
    return `<div class="kpi ${k.cls}">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-val">${k.val}</div>
      <div class="kpi-sub">${k.sub} ${d}</div>
    </div>`;
  }).join('');
  const head = `
    <thead>
      <tr>
        <th rowspan="2" style="text-align:left">Month</th>
        <th colspan="3" class="group g-26 ovg-start">2026 OTB</th>
        <th colspan="3" class="group g-25 ovg-start">2025 STLY</th>
        <th colspan="3" class="group g-25 ovg-start">Final LY (2025 close)</th>
        <th colspan="2" class="group g-var ovg-start">Δ vs STLY</th>
        <th colspan="2" class="group g-var ovg-start">Δ vs Final LY</th>
      </tr>
      <tr>
        <th class="ovg-start">OCC%</th><th>ADR</th><th>Revenue</th>
        <th class="ovg-start">OCC%</th><th>ADR</th><th>Revenue</th>
        <th class="ovg-start">OCC%</th><th>ADR</th><th>Revenue</th>
        <th class="ovg-start">ΔOcc</th><th>ΔRev %</th>
        <th class="ovg-start">ΔOcc</th><th>ΔRev %</th>
      </tr>
    </thead>`;
  const rows = A.monthRows.map(r=>{
    return `<tr>
      <td>${CFG.monthsITLong[r.m-1]}</td>
      <td class="cell-mono ovg-otb ovg-start">${fmtPct(r.occC,1)}</td>
      <td class="cell-mono ovg-otb">${fmtAdr(r.adrC)}</td>
      <td class="cell-mono ovg-otb">${fmtEUR(r.revC)}</td>
      <td class="cell-mono cell-flat ovg-stly ovg-start">${fmtPct(r.occP,1)}</td>
      <td class="cell-mono cell-flat ovg-stly">${fmtAdr(r.adrP)}</td>
      <td class="cell-mono cell-flat ovg-stly">${fmtEUR(r.revP)}</td>
      <td class="cell-mono cell-flat ovg-fly ovg-start">${fmtPct(r.occF,1)}</td>
      <td class="cell-mono cell-flat ovg-fly">${fmtAdr(r.adrF)}</td>
      <td class="cell-mono cell-flat ovg-fly">${fmtEUR(r.revF)}</td>
      ${deltaCell(r.dOcc,'pp','ovg-d1 ovg-start')}
      ${deltaCell(r.dRevPct,'pct','ovg-d1')}
      ${deltaCell(r.dOccF,'pp','ovg-d2 ovg-start')}
      ${deltaCell(r.dRevFPct,'pct','ovg-d2')}
    </tr>`;
  }).join('');
  const tot = A.tot;
  const totRow = `<tr class="total">
    <td>Full year</td>
    <td class="cell-mono ovg-otb ovg-start">${fmtPct(tot.occC,1)}</td>
    <td class="cell-mono ovg-otb">${fmtAdr(tot.adrC)}</td>
    <td class="cell-mono ovg-otb">${fmtEUR(tot.revC)}</td>
    <td class="cell-mono cell-flat ovg-stly ovg-start">${fmtPct(tot.occP,1)}</td>
    <td class="cell-mono cell-flat ovg-stly">${fmtAdr(tot.adrP)}</td>
    <td class="cell-mono cell-flat ovg-stly">${fmtEUR(tot.revP)}</td>
    <td class="cell-mono cell-flat ovg-fly ovg-start">${fmtPct(tot.occF,1)}</td>
    <td class="cell-mono cell-flat ovg-fly">${fmtAdr(tot.adrF)}</td>
    <td class="cell-mono cell-flat ovg-fly">${fmtEUR(tot.revF)}</td>
    ${deltaCell(tot.dOcc,'pp','ovg-d1 ovg-start')}
    ${deltaCell(tot.dRevPct,'pct','ovg-d1')}
    ${deltaCell(tot.dOccF,'pp','ovg-d2 ovg-start')}
    ${deltaCell(tot.dRevFPct,'pct','ovg-d2')}
  </tr>`;
  document.getElementById('otb-monthly').innerHTML = head + '<tbody>' + rows + totRow + '</tbody>';
  _renderOTBMonthPills(A);
  _renderOTBDetailsByMonth(A);
}
/* Render dei pulsanti mese (Totale + Gen..Dic). Cliccando aggiorna OTB_MONTH_FILTER e ridisegna. */
function _renderOTBMonthPills(A){
  const pillsEl = document.getElementById('otb-month-pills');
  if (!pillsEl) return;
  const opts = [{v:null, label:'Full year'}];
  for (let m=1;m<=12;m++) opts.push({v:m, label:CFG.monthsIT[m-1]});
  pillsEl.innerHTML = opts.map(o => {
    const on = (OTB_MONTH_FILTER === o.v);
    const cls = on ? 'rt-pill' : 'rt-pill off';
    const style = on ? 'border-color:#c4823b;color:#7a4f1c;font-weight:600;background:#fdf3e6' : '';
    return `<button class="${cls}" data-otbm="${o.v==null?'all':o.v}" style="${style}">${o.label}</button>`;
  }).join('');
  pillsEl.querySelectorAll('button[data-otbm]').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.otbm;
      OTB_MONTH_FILTER = (v === 'all') ? null : parseInt(v, 10);
      _renderOTBMonthPills(A);
      _renderOTBDetailsByMonth(A);
    });
  });
}
/* Refresh tabelle Prov/Can in base a OTB_MONTH_FILTER (i 2 grafici restano sempre annuali) */
function _renderOTBDetailsByMonth(A){
  const m = OTB_MONTH_FILTER;
  const activeEl = document.getElementById('otb-month-active');
  if (activeEl) activeEl.textContent = m == null
    ? 'Source and Channel tables: full year'
    : `Source and Channel tables: ${CFG.monthsITLong[m-1]}`;
  document.getElementById('otb-chart-rev').innerHTML = lineChart(
    A.monthRows.map(r=>r.revC), A.monthRows.map(r=>r.revP),
    CFG.monthsIT, '#6b5b3f', '€', 'rev'
  );
  document.getElementById('otb-chart-occ').innerHTML = lineChart(
    A.monthRows.map(r=>r.occC*100), A.monthRows.map(r=>r.occP*100),
    CFG.monthsIT, '#3b5a78', '%', 'pct'
  );
  document.getElementById('otb-chart-rev-title').textContent = 'Monthly revenue';
  document.getElementById('otb-chart-occ-title').textContent = 'Monthly occupancy';
  if (m == null){
    document.getElementById('otb-prov-table').innerHTML = compareTable(A.provCur, A.provPrev, A.provFly, 'Source');
    document.getElementById('otb-prov-sub').textContent = `Top sources · 2026 OTB vs STLY vs Final LY · full year`;
    document.getElementById('otb-can-table').innerHTML  = compareTable(A.canCur,  A.canPrev,  A.canFly,  'Channel');
    document.getElementById('otb-can-sub').textContent  = `Channel distribution · 2026 OTB vs STLY vs Final LY · full year`;
  } else {
    const pc = (A.provCurM && A.provCurM[m]) || {};
    const pp = (A.provPrevM && A.provPrevM[m]) || {};
    const pf = (A.provFlyM && A.provFlyM[m]) || {};
    const cc = (A.canCurM && A.canCurM[m]) || {};
    const cp = (A.canPrevM && A.canPrevM[m]) || {};
    const cf = (A.canFlyM && A.canFlyM[m]) || {};
    document.getElementById('otb-prov-table').innerHTML = compareTable(pc, pp, pf, 'Source');
    document.getElementById('otb-prov-sub').textContent = `Top sources · ${CFG.monthsITLong[m-1]} 2026 OTB vs STLY vs Final LY`;
    document.getElementById('otb-can-table').innerHTML  = compareTable(cc, cp, cf, 'Channel');
    document.getElementById('otb-can-sub').textContent  = `Channel distribution · ${CFG.monthsITLong[m-1]} 2026 OTB vs STLY vs Final LY`;
  }
}
function compareTable(cur, prev, fly, labelCol){
  fly = fly || {};
  const keys = new Set([...Object.keys(cur), ...Object.keys(prev), ...Object.keys(fly)]);
  const rows = [];
  let totC={rn:0,rev:0,bk:0}, totP={rn:0,rev:0,bk:0}, totF={rn:0,rev:0,bk:0};
  for (const k of keys){
    const c = cur[k] || {rn:0,rev:0,bk:0};
    const p = prev[k] || {rn:0,rev:0,bk:0};
    const f = fly[k] || {rn:0,rev:0,bk:0};
    totC.rn+=c.rn; totC.rev+=c.rev; totC.bk+=c.bk;
    totP.rn+=p.rn; totP.rev+=p.rev; totP.bk+=p.bk;
    totF.rn+=f.rn; totF.rev+=f.rev; totF.bk+=f.bk;
    rows.push({k,c,p,f});
  }
  rows.sort((a,b)=> b.c.rev - a.c.rev);
  const head = `<thead><tr>
    <th>${labelCol}</th>
    <th class="g-26">RN '26</th><th class="g-26">Rev '26</th>
    <th class="g-25">RN STLY</th><th class="g-25">Rev STLY</th>
    <th class="g-25" style="background:rgba(142,95,168,.08)">RN Final LY</th><th class="g-25" style="background:rgba(142,95,168,.08)">Rev Final LY</th>
    <th class="g-var">Δ vs STLY</th><th class="g-var">Δ vs Final LY</th>
  </tr></thead>`;
  const body = rows.map(r=>{
    const dRev = r.c.rev - r.p.rev;
    const dPct = r.p.rev>0 ? dRev/r.p.rev : (r.c.rev>0?Infinity:NaN);
    const dRevF = r.c.rev - r.f.rev;
    const dPctF = r.f.rev>0 ? dRevF/r.f.rev : (r.c.rev>0?Infinity:NaN);
    return `<tr>
      <td>${escapeHtml(r.k)}</td>
      <td class="cell-mono">${fmtNum(r.c.rn)}</td>
      <td class="cell-mono">${fmtEUR(r.c.rev)}</td>
      <td class="cell-mono cell-flat">${fmtNum(r.p.rn)}</td>
      <td class="cell-mono cell-flat">${fmtEUR(r.p.rev)}</td>
      <td class="cell-mono cell-flat" style="background:rgba(142,95,168,.04)">${fmtNum(r.f.rn)}</td>
      <td class="cell-mono cell-flat" style="background:rgba(142,95,168,.04)">${fmtEUR(r.f.rev)}</td>
      ${(!isFinite(dPct)) ? '<td class="cell-flat">—</td>' : (dPct===Infinity ? '<td class="cell-pos cell-mono">new</td>' : deltaCell(dPct,'pct'))}
      ${(!isFinite(dPctF)) ? '<td class="cell-flat">—</td>' : (dPctF===Infinity ? '<td class="cell-pos cell-mono">new</td>' : deltaCell(dPctF,'pct'))}
    </tr>`;
  }).join('');
  const dPctTot = totP.rev>0 ? (totC.rev-totP.rev)/totP.rev : NaN;
  const dPctTotF = totF.rev>0 ? (totC.rev-totF.rev)/totF.rev : NaN;
  const totRow = `<tr class="total">
    <td>Total</td>
    <td class="cell-mono">${fmtNum(totC.rn)}</td>
    <td class="cell-mono">${fmtEUR(totC.rev)}</td>
    <td class="cell-mono cell-flat">${fmtNum(totP.rn)}</td>
    <td class="cell-mono cell-flat">${fmtEUR(totP.rev)}</td>
    <td class="cell-mono cell-flat" style="background:rgba(142,95,168,.04)">${fmtNum(totF.rn)}</td>
    <td class="cell-mono cell-flat" style="background:rgba(142,95,168,.04)">${fmtEUR(totF.rev)}</td>
    ${deltaCell(dPctTot,'pct')}
    ${deltaCell(dPctTotF,'pct')}
  </tr>`;
  return head + '<tbody>' + body + totRow + '</tbody>';
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
/* ============================================================
   SECTION 2: ROOM TYPE
   ============================================================ */
const RT_PALETTE = ['#2563eb','#dc2626','#16a34a','#ea580c','#7c3aed','#0891b2','#ca8a04','#be185d'];
let RT_VISIBLE = null;  // Set or null (null = all)
function renderRT(sel){
  const A = aggRoomType(sel);
  if (!A.rtList.length){
    document.getElementById('rt-kpis').innerHTML = '<div class="kpi"><div class="kpi-label">No room</div><div class="kpi-val">—</div></div>';
    document.getElementById('rt-monthly').innerHTML = '';
    document.getElementById('rt-chart-occ').innerHTML = '';
    document.getElementById('rt-chart-adr').innerHTML = '';
    document.getElementById('rt-filter').innerHTML = '';
    document.getElementById('rt-legend-occ').innerHTML='';
    document.getElementById('rt-legend-adr').innerHTML='';
    return;
  }
  if (!RT_VISIBLE || RT_VISIBLE._sel !== sel){
    RT_VISIBLE = new Set(A.rtList); RT_VISIBLE._sel = sel;
  }
  const kpis = A.rtList.slice(0,4).map((rt,i)=>{
    const d = A.rtData[rt];
    const dOcc = d.occC - d.occP;
    return `<div class="kpi" style="border-left-color:${RT_PALETTE[i%RT_PALETTE.length]}">
      <div class="kpi-label">${escapeHtml(rt)}</div>
      <div class="kpi-val">${fmtPct(d.occC,1)}</div>
      <div class="kpi-sub">ADR ${fmtAdr(d.adrC)} · STLY ${fmtPct(d.occP,1)} <span class="delta ${dOcc>0?'pos':dOcc<0?'neg':'flat'}">${(dOcc>=0?'+':'')+(dOcc*100).toFixed(1)} pp</span></div>
    </div>`;
  }).join('');
  document.getElementById('rt-kpis').innerHTML = kpis;
  document.getElementById('rt-filter').innerHTML = A.rtList.map((rt,i)=>{
    const on = RT_VISIBLE.has(rt);
    return `<button class="rt-pill ${on?'':'off'}" data-rt="${escapeHtml(rt)}" style="${on?'border-color:'+RT_PALETTE[i%RT_PALETTE.length]:''}">
      <span class="pdot" style="background:${RT_PALETTE[i%RT_PALETTE.length]}"></span>${escapeHtml(rt)}
    </button>`;
  }).join('');
  document.querySelectorAll('#rt-filter .rt-pill').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const rt = btn.dataset.rt;
      if (RT_VISIBLE.has(rt)) RT_VISIBLE.delete(rt); else RT_VISIBLE.add(rt);
      if (RT_VISIBLE.size===0) RT_VISIBLE = new Set(A.rtList);
      renderRT(CURRENT_STRUCT);
    });
  });
  const visList = A.rtList.filter(rt=>RT_VISIBLE.has(rt));
  const occSeries = visList.map((rt,i)=>({
    label: rt,
    color: RT_PALETTE[A.rtList.indexOf(rt)%RT_PALETTE.length],
    cur: A.rtData[rt].months.map(m=>m.occC*100),
    prev: A.rtData[rt].months.map(m=>m.occP*100),
  }));
  const adrSeries = visList.map((rt,i)=>({
    label: rt,
    color: RT_PALETTE[A.rtList.indexOf(rt)%RT_PALETTE.length],
    cur: A.rtData[rt].months.map(m=>isFinite(m.adrC)?m.adrC:0),
    prev: A.rtData[rt].months.map(m=>isFinite(m.adrP)?m.adrP:0),
  }));
  document.getElementById('rt-chart-occ').innerHTML = multiLineChart(occSeries, CFG.monthsIT, '%', 'pct');
  document.getElementById('rt-chart-adr').innerHTML = multiLineChart(adrSeries, CFG.monthsIT, '€', 'eur');
  document.getElementById('rt-legend-occ').innerHTML = visList.map((rt,i)=>{
    const c = RT_PALETTE[A.rtList.indexOf(rt)%RT_PALETTE.length];
    return `<span class="lg"><span class="swatch" style="background:${c}"></span>${escapeHtml(rt)}</span>`;
  }).join('') + '<span class="lg"><span class="swatch dashed"></span>STLY</span>';
  document.getElementById('rt-legend-adr').innerHTML = document.getElementById('rt-legend-occ').innerHTML;
  const cols = visList;
  let head = `<thead>
    <tr>
      <th rowspan="2">Month</th>
      ${cols.map((rt,i)=>`<th colspan="4" class="group rt-block-start" style="color:${RT_PALETTE[A.rtList.indexOf(rt)%RT_PALETTE.length]};text-align:center">${escapeHtml(rt)}</th>`).join('')}
    </tr>
    <tr>
      ${cols.map(_=>`<th class="rt-block-start">OCC '26</th><th>ADR '26</th><th class="cell-divider">OCC '25</th><th>ADR '25</th>`).join('')}
    </tr>
  </thead>`;
  const body = [];
  for (let m=1;m<=12;m++){
    let r = `<tr><td>${CFG.monthsITLong[m-1]}</td>`;
    for (const rt of cols){
      const md = A.rtData[rt].months[m-1];
      r += `
        <td class="cell-mono rt-block-start">${fmtPct(md.occC,1)}</td>
        <td class="cell-mono">${fmtAdr(md.adrC)}</td>
        <td class="cell-mono cell-flat cell-divider">${fmtPct(md.occP,1)}</td>
        <td class="cell-mono cell-flat">${fmtAdr(md.adrP)}</td>`;
    }
    r += '</tr>';
    body.push(r);
  }
  let trow = '<tr class="total"><td>Year</td>';
  for (const rt of cols){
    const d = A.rtData[rt];
    trow += `
      <td class="cell-mono rt-block-start">${fmtPct(d.occC,1)}</td>
      <td class="cell-mono">${fmtAdr(d.adrC)}</td>
      <td class="cell-mono cell-flat cell-divider">${fmtPct(d.occP,1)}</td>
      <td class="cell-mono cell-flat">${fmtAdr(d.adrP)}</td>`;
  }
  trow+='</tr>';
  document.getElementById('rt-monthly').innerHTML = head + '<tbody>' + body.join('') + trow + '</tbody>';
}
/* ============================================================
   SECTION 3: BUDGET 2026
   ============================================================ */
function renderBudget(sel){
  const A = aggBudget(sel);
  const totBud = A.totBud, totOtb = A.totOtb;
  const gap = totOtb - totBud;
  document.getElementById('bgt-kpis').innerHTML = `
    <div class="kpi k-rev">
      <div class="kpi-label">OTB Cumulato</div>
      <div class="kpi-val">${fmtEUR(totOtb)}</div>
      <div class="kpi-sub">su budget ${fmtEUR(totBud)}</div>
    </div>
    <div class="kpi k-budget">
      <div class="kpi-label">% Achievement</div>
      <div class="kpi-val">${fmtPct(A.totPct,1)}</div>
      <div class="kpi-sub">fiscal year target ${fmtEUR(totBud)}</div>
    </div>
    <div class="kpi k-pickup">
      <div class="kpi-label">Gap su Budget</div>
      <div class="kpi-val">${(gap>=0?'+':'')+fmtEUR(gap).replace('€','€ ')}</div>
      <div class="kpi-sub"><span class="delta ${gap>=0?'pos':'neg'}">${gap>=0?'sopra':'sotto'} target</span></div>
    </div>
    <div class="kpi k-occ">
      <div class="kpi-label">Da raggiungere</div>
      <div class="kpi-val">${fmtEUR(Math.max(0,totBud-totOtb))}</div>
      <div class="kpi-sub">to close the budget</div>
    </div>
  `;
  let html = '<table class="data bgt-table"><thead><tr>'
    + '<th>Month</th>'
    + '<th class="g-26">OCC actual</th>'
    + '<th class="g-25">OCC target</th>'
    + '<th class="g-var">Δ</th>'
    + '<th class="g-26">ADR actual</th>'
    + '<th class="g-25">ADR target</th>'
    + '<th class="g-var">Δ</th>'
    + '<th class="g-26">Revenue OTB</th>'
    + '<th class="g-25">Revenue target</th>'
    + '<th class="g-var">Δ</th>'
    + '<th class="g-26" title="€/day required from TODAY to the end of this month (cumulative). For June = remaining days of May + all of June">€/d to close</th>'
    + '<th class="g-25" title="Daily average revenue allocated to this month from the last 7 days of bookings">€/g pickup 7d</th>'
    + '<th class="g-25" title="Pickup 7 days STLY: daily average revenue allocated to this month, computed on bookings created 364 days ago in the same period">€/g pickup 7d STLY</th>'
    + '<th>% Ach.</th>'
    + '</tr></thead><tbody>';
  for (const r of A.rows){
    const pct = isFinite(r.pct)?r.pct:0;
    const cls = pct>=0.95 ? 'green' : pct>=0.70 ? 'amber' : 'red';
    const w = Math.max(0, Math.min(1, pct))*100;
    const monthLabel = `${CFG.monthsITLong[r.m-1]} ${r.y}`;
    const dOccCls = r.gapOcc>0?'cell-pos':(r.gapOcc<0?'cell-neg':'cell-flat');
    const dOccTxt = (r.gapOcc>=0?'+':'')+(r.gapOcc*100).toFixed(1)+' pp';
    const dAdrCls = r.gapAdr>0?'cell-pos':(r.gapAdr<0?'cell-neg':'cell-flat');
    const dAdrTxt = (r.gapAdr>=0?'+':'')+'€'+Math.round(r.gapAdr).toLocaleString('en-GB');
    const dRevCls = r.gap>0?'cell-pos':(r.gap<0?'cell-neg':'cell-flat');
    const dRevTxt = (r.gap>=0?'+':'')+'€'+Math.round(r.gap).toLocaleString('en-GB');
    let runRateHtml;
    if (r.monthState === 'past'){
      runRateHtml = '<span class="cell-flat" style="color:var(--ink-3)">—</span>';
    } else if (r.gap >= 0){
      runRateHtml = '<span class="cell-pos">✓ reached</span>';
    } else if (!isFinite(r.runRate)){
      runRateHtml = '<span class="cell-neg">closed below</span>';
    } else {
      runRateHtml = `<b>${fmtEUR(r.runRate)}</b><span style="color:var(--ink-3);font-size:10.5px">/g · ${r.daysToMonthEnd}d</span>`;
    }
    let pk7Html;
    if (r.pk7Rate <= 0){
      pk7Html = '<span class="cell-flat" style="color:var(--ink-3)">€0/g</span>';
    } else {
      let pk7Cls = '';
      if (r.monthState !== 'past' && r.gap < 0 && isFinite(r.runRate) && r.runRate > 0){
        pk7Cls = r.pk7Rate >= r.runRate ? 'cell-pos' : 'cell-neg';
      }
      pk7Html = `<span class="${pk7Cls}"><b>${fmtEUR(r.pk7Rate)}</b><span style="color:var(--ink-3);font-size:10.5px">/g</span></span>`;
    }
    let pk7SHtml;
    if (r.pk7RateS <= 0){
      pk7SHtml = '<span class="cell-flat" style="color:var(--ink-3)">€0/g</span>';
    } else {
      const dPct = (r.pk7Rate - r.pk7RateS) / r.pk7RateS;
      const dCls = (r.pk7Rate > r.pk7RateS) ? 'cell-pos' : (r.pk7Rate < r.pk7RateS ? 'cell-neg' : '');
      const dTxt = isFinite(dPct) ? ((dPct>=0?'+':'')+(dPct*100).toFixed(0)+'%') : '';
      pk7SHtml = `<b>${fmtEUR(r.pk7RateS)}</b><span style="color:var(--ink-3);font-size:10.5px">/g</span> <span class="${dCls}" style="font-size:10.5px">${dTxt}</span>`;
    }
    html += `<tr>
      <td>${monthLabel}</td>
      <td class="cell-mono">${fmtPct(r.actualOcc,1)}</td>
      <td class="cell-mono cell-flat">${fmtPct(r.targetOcc,1)}</td>
      <td class="cell-mono ${dOccCls}">${dOccTxt}</td>
      <td class="cell-mono">${r.rn>0?fmtEUR(r.actualAdr):'—'}</td>
      <td class="cell-mono cell-flat">${fmtEUR(r.targetAdr)}</td>
      <td class="cell-mono ${dAdrCls}">${r.rn>0?dAdrTxt:'—'}</td>
      <td class="cell-mono">${fmtEUR(r.otb)}</td>
      <td class="cell-mono cell-flat">${fmtEUR(r.target)}</td>
      <td class="cell-mono ${dRevCls}">${dRevTxt}</td>
      <td class="cell-mono">${runRateHtml}</td>
      <td class="cell-mono">${pk7Html}</td>
      <td class="cell-mono">${pk7SHtml}</td>
      <td>
        <div class="bgt-bar-wrap" style="min-width:90px">
          <div class="bgt-bar ${cls}" style="width:${w}%"></div>
          <div class="bgt-bar-label">${fmtPct(pct,0)}</div>
        </div>
      </td>
    </tr>`;
  }
  let totRn = 0, totCap = 0, totRevTarget = 0, totTargetRn = 0;
  for (const r of A.rows){
    totRn += r.rn;
    totCap += r.cap;
    totRevTarget += r.target;
    totTargetRn += r.cap * r.targetOcc;
  }
  const yearOccActual = totCap>0 ? totRn/totCap : 0;
  const yearOccTarget = totCap>0 ? totTargetRn/totCap : 0;
  const yearAdrActual = totRn>0 ? totOtb/totRn : 0;
  const yearAdrTarget = totTargetRn>0 ? totRevTarget/totTargetRn : 0;
  const dOccY = yearOccActual - yearOccTarget;
  const dAdrY = yearAdrActual - yearAdrTarget;
  const totGapCls = gap>=0?'cell-pos':'cell-neg';
  const totPct = isFinite(A.totPct)?A.totPct:0;
  const totW = Math.max(0,Math.min(1,totPct))*100;
  const totCls = totPct>=0.95?'green':totPct>=0.70?'amber':'red';
  html += `<tr class="total">
    <td>Total ${CFG.fiscal.label}</td>
    <td class="cell-mono">${fmtPct(yearOccActual,1)}</td>
    <td class="cell-mono cell-flat">${fmtPct(yearOccTarget,1)}</td>
    <td class="cell-mono ${dOccY>=0?'cell-pos':'cell-neg'}">${(dOccY>=0?'+':'')+(dOccY*100).toFixed(1)} pp</td>
    <td class="cell-mono">${totRn>0?fmtEUR(yearAdrActual):'—'}</td>
    <td class="cell-mono cell-flat">${fmtEUR(yearAdrTarget)}</td>
    <td class="cell-mono ${dAdrY>=0?'cell-pos':'cell-neg'}">${totRn>0?((dAdrY>=0?'+':'')+'€'+Math.round(dAdrY).toLocaleString('en-GB')):'—'}</td>
    <td class="cell-mono">${fmtEUR(totOtb)}</td>
    <td class="cell-mono cell-flat">${fmtEUR(totBud)}</td>
    <td class="cell-mono ${totGapCls}">${(gap>=0?'+':'')+'€'+Math.round(gap).toLocaleString('en-GB')}</td>
    <td class="cell-mono">${isFinite(A.yearRunRate)?'<b>'+fmtEUR(A.yearRunRate)+'</b><span style="color:var(--ink-3);font-size:10.5px">/g</span>':'<span class="cell-pos">✓</span>'}</td>
    <td class="cell-mono">${A.yearPk7Rate>0?'<b>'+fmtEUR(A.yearPk7Rate)+'</b><span style="color:var(--ink-3);font-size:10.5px">/g</span>':'<span class="cell-flat" style="color:var(--ink-3)">€0/g</span>'}</td>
    <td class="cell-mono">${A.yearPk7RateS>0?'<b>'+fmtEUR(A.yearPk7RateS)+'</b><span style="color:var(--ink-3);font-size:10.5px">/g</span>':'<span class="cell-flat" style="color:var(--ink-3)">€0/g</span>'}</td>
    <td>
      <div class="bgt-bar-wrap" style="min-width:90px">
        <div class="bgt-bar ${totCls}" style="width:${totW}%"></div>
        <div class="bgt-bar-label">${fmtPct(totPct,0)}</div>
      </div>
    </td>
  </tr>`;
  html += '</tbody></table>';
  document.getElementById('bgt-rows').innerHTML = html;
  const chartLabels = A.rows.map(r => `${CFG.monthsIT[r.m-1]} '${String(r.y).slice(2)}`);
  document.getElementById('bgt-chart-cum').innerHTML = lineChart(
    A.rows.map(r=>r.cumOtb), A.rows.map(r=>r.cumBud),
    chartLabels, '#4a7c59', '€', 'rev', '#b1432f', false
  );
  document.getElementById('bgt-chart-bars').innerHTML = barCompareChart(
    A.rows.map(r=>r.otb), A.rows.map(r=>r.target),
    chartLabels, '#6b5b3f', '#d8d2c5'
  );
}
/* ============================================================
   SECTION 4: PICKUP MATRIX
   ============================================================ */
let PK_WEEKS_SEL = [0,1,2,3];
function renderPickup(sel){
  const A = aggPickup(sel);
  const chip = `${fmtDateIT(A.weeks[0].start)} → ${fmtDateIT(A.weeks[3].end)}`;
  document.getElementById('pk-window').innerHTML = `<span class="dot"></span>Window: <strong>${chip}</strong>`;
  const pillsEl = document.getElementById('pk-week-pills');
  if (pillsEl){
    const allBtn = `<button class="rt-pill ${PK_WEEKS_SEL.length===4?'':'off'}" data-pkw="all" style="${PK_WEEKS_SEL.length===4?'border-color:var(--accent)':''}">All</button>`;
    let pillsHtml = allBtn;
    for (let i=0; i<4; i++){
      const isSel = PK_WEEKS_SEL.includes(i) && PK_WEEKS_SEL.length < 4;
      pillsHtml += `<button class="rt-pill ${isSel?'':'off'}" data-pkw="${i}" style="${isSel?'border-color:var(--accent)':''}">W${i+1} · ${pad2(A.weeks[i].start.getDate())}/${pad2(A.weeks[i].start.getMonth()+1)}</button>`;
    }
    pillsEl.innerHTML = pillsHtml;
    pillsEl.querySelectorAll('button[data-pkw]').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.pkw;
        if (v === 'all'){
          PK_WEEKS_SEL = [0,1,2,3];
        } else {
          const wi = +v;
          if (PK_WEEKS_SEL.length === 4){
            PK_WEEKS_SEL = [wi];
          } else if (PK_WEEKS_SEL.includes(wi)){
            const next = PK_WEEKS_SEL.filter(x => x !== wi);
            PK_WEEKS_SEL = next.length === 0 ? [0,1,2,3] : next;  // se vuoto, torna a "All"
          } else {
            PK_WEEKS_SEL = [...PK_WEEKS_SEL, wi].sort();
          }
        }
        renderPickup(CURRENT_STRUCT);
      });
    });
  }
  function sumSelectedRn(cells){
    let s = 0;
    for (const i of PK_WEEKS_SEL) s += cells[i].rn;
    return s;
  }
  let totBkC=0, totRnC=0, totRevC=0;
  let totBkP=0, totRnP=0, totRevP=0;
  for (const rt of A.rtAxis){
    A.rt[rt].forEach(c=>{ totBkC+=c.bk; totRnC+=c.rn; totRevC+=c.rev; });
    A.rtS[rt].forEach(c=>{ totBkP+=c.bk; totRnP+=c.rn; totRevP+=c.rev; });
  }
  const dRev = totRevC-totRevP, dBk = totBkC-totBkP;
  document.getElementById('pk-kpis').innerHTML = `
    <div class="kpi k-pickup">
      <div class="kpi-label">Pickup 4w · Bookings</div>
      <div class="kpi-val">${fmtNum(totBkC)}</div>
      <div class="kpi-sub">STLY ${fmtNum(totBkP)} <span class="delta ${dBk>0?'pos':dBk<0?'neg':'flat'}">${dBk>=0?'+':''}${dBk}</span></div>
    </div>
    <div class="kpi k-rooms">
      <div class="kpi-label">Pickup 4w · Room Nights</div>
      <div class="kpi-val">${fmtNum(totRnC)}</div>
      <div class="kpi-sub">STLY ${fmtNum(totRnP)} <span class="delta ${(totRnC-totRnP)>0?'pos':(totRnC-totRnP)<0?'neg':'flat'}">${(totRnC-totRnP)>=0?'+':''}${totRnC-totRnP}</span></div>
    </div>
    <div class="kpi k-rev">
      <div class="kpi-label">Pickup 4w · Revenue</div>
      <div class="kpi-val">${fmtEUR(totRevC)}</div>
      <div class="kpi-sub">STLY ${fmtEUR(totRevP)} <span class="delta ${dRev>0?'pos':dRev<0?'neg':'flat'}">${(dRev>=0?'+':'')+'€'+Math.round(dRev).toLocaleString('en-GB')}</span></div>
    </div>
    <div class="kpi k-adr">
      <div class="kpi-label">ADR pickup</div>
      <div class="kpi-val">${fmtAdr(totRnC>0?totRevC/totRnC:NaN)}</div>
      <div class="kpi-sub">STLY ${fmtAdr(totRnP>0?totRevP/totRnP:NaN)}</div>
    </div>
  `;
  function buildMatrix(axis, dataC, dataP, axisLabel, dimKey){
    if (!axis.length) return '<thead><tr><th>No data</th></tr></thead>';
    let maxRn = 1;
    for (const k of axis) for (const c of dataC[k]) if (c.rn>maxRn) maxRn = c.rn;
    let head = `<thead><tr><th rowspan="2">${axisLabel}</th>`;
    for (let i=0;i<A.weeks.length;i++){
      head += `<th colspan="2">W${i+1} · ${pad2(A.weeks[i].start.getDate())}/${pad2(A.weeks[i].start.getMonth()+1)}–${pad2(A.weeks[i].end.getDate())}/${pad2(A.weeks[i].end.getMonth()+1)}</th>`;
    }
    head += '<th colspan="2">Total</th></tr><tr>';
    for (let i=0;i<A.weeks.length;i++){
      head += '<th>2026</th><th class="cell-divider">STLY</th>';
    }
    head += '<th>2026</th><th class="cell-divider">STLY</th></tr></thead>';
    let body = '';
    for (const k of axis){
      let row = `<tr><td>${escapeHtml(k)}</td>`;
      let totC={bk:0,rn:0,rev:0}, totP={bk:0,rn:0,rev:0};
      for (let i=0;i<A.weeks.length;i++){
        const c = dataC[k][i], p = dataP[k][i];
        totC.bk+=c.bk; totC.rn+=c.rn; totC.rev+=c.rev;
        totP.bk+=p.bk; totP.rn+=p.rn; totP.rev+=p.rev;
        row += pkCellHtml(c, maxRn, dimKey, k, i, 'cur');
        row += pkCellHtml(p, maxRn, dimKey, k, i, 'stly', true);
      }
      row += pkCellHtml(totC, maxRn*4, dimKey, k, -1, 'cur-tot');
      row += pkCellHtml(totP, maxRn*4, dimKey, k, -1, 'stly-tot', true);
      row += '</tr>';
      body += row;
    }
    let trow = `<tr class="total"><td>Total</td>`;
    let gC={bk:0,rn:0,rev:0}, gP={bk:0,rn:0,rev:0};
    for (let i=0;i<A.weeks.length;i++){
      let cAgg={bk:0,rn:0,rev:0,rows:[]}, pAgg={bk:0,rn:0,rev:0,rows:[]};
      for (const k of axis){
        const c=dataC[k][i], p=dataP[k][i];
        cAgg.bk+=c.bk; cAgg.rn+=c.rn; cAgg.rev+=c.rev; cAgg.rows.push(...c.rows);
        pAgg.bk+=p.bk; pAgg.rn+=p.rn; pAgg.rev+=p.rev; pAgg.rows.push(...p.rows);
      }
      gC.bk+=cAgg.bk; gC.rn+=cAgg.rn; gC.rev+=cAgg.rev;
      gP.bk+=pAgg.bk; gP.rn+=pAgg.rn; gP.rev+=pAgg.rev;
      trow += pkCellHtml(cAgg, maxRn*axis.length, dimKey, '__ALL__', i, 'cur');
      trow += pkCellHtml(pAgg, maxRn*axis.length, dimKey, '__ALL__', i, 'stly', true);
    }
    trow += pkCellHtml(gC, maxRn*axis.length*4, dimKey, '__ALL__', -1, 'cur-tot');
    trow += pkCellHtml(gP, maxRn*axis.length*4, dimKey, '__ALL__', -1, 'stly-tot', true);
    trow += '</tr>';
    return head + '<tbody>' + body + trow + '</tbody>';
  }
  function pkCellHtml(c, maxRn, dim, key, weekIdx, mode, divider=false, extraCls=''){
    const clsArr = [];
    if (divider) clsArr.push('cell-divider');
    if (extraCls) clsArr.push(extraCls);
    const cls = clsArr.length ? ' class="'+clsArr.join(' ')+'"' : '';
    if (!c || (c.bk===0 && c.rn===0)){
      return `<td${cls}><span class="pk-cell zero">·</span></td>`;
    }
    const intensity = Math.min(0.85, c.rn / Math.max(1,maxRn) * 1.0 + 0.08);
    const heatBg = mode.startsWith('stly') ? `rgba(138,138,138,${intensity*0.4})` : `rgba(107,91,63,${intensity*0.55})`;
    const dataAttr = `data-dim="${dim}" data-key="${escapeHtml(key)}" data-week="${weekIdx}" data-mode="${mode}"`;
    return `<td${cls}><span class="pk-cell" ${dataAttr}><span class="heat" style="background:${heatBg}"></span><span class="pk-rn">${c.rn}</span></span></td>`;
  }
  const monLabIT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function smLabel(monthKey){
    const [y, m] = monthKey.split('-');
    return monLabIT[parseInt(m,10)-1] + ' ' + y;
  }
  const smAxisLabeled = A.smAxis.map(smLabel);
  function buildMatrixSM(axis, dataC, dataP){
    if (!axis.length) return '<thead><tr><th>No data</th></tr></thead>';
    let maxRn = 1;
    for (const k of axis) for (const c of dataC[k]) if (c.rn>maxRn) maxRn = c.rn;
    let head = `<thead><tr><th rowspan="2">Stay month</th>`;
    for (let i=0;i<A.weeks.length;i++){
      head += `<th colspan="2">W${i+1} · ${pad2(A.weeks[i].start.getDate())}/${pad2(A.weeks[i].start.getMonth()+1)}–${pad2(A.weeks[i].end.getDate())}/${pad2(A.weeks[i].end.getMonth()+1)}</th>`;
    }
    head += '<th colspan="2" class="pk-tot-cur">Total</th></tr><tr>';
    for (let i=0;i<A.weeks.length;i++){
      head += '<th class="pk-cur">2026</th><th class="pk-stly">STLY</th>';
    }
    head += '<th class="pk-tot-cur">2026</th><th class="pk-tot-stly">STLY</th></tr></thead>';
    let body = '';
    for (const k of axis){
      let row = `<tr><td>${escapeHtml(smLabel(k))}</td>`;
      let totC={bk:0,rn:0,rev:0}, totP={bk:0,rn:0,rev:0};
      for (let i=0;i<A.weeks.length;i++){
        const c = dataC[k][i], p = dataP[k][i];
        totC.bk+=c.bk; totC.rn+=c.rn; totC.rev+=c.rev;
        totP.bk+=p.bk; totP.rn+=p.rn; totP.rev+=p.rev;
        row += pkCellHtml(c, maxRn, 'sm', k, i, 'cur', false, 'pk-cur');
        row += pkCellHtml(p, maxRn, 'sm', k, i, 'stly', true, 'pk-stly');
      }
      row += pkCellHtml(totC, maxRn*4, 'sm', k, -1, 'cur-tot', false, 'pk-tot-cur');
      row += pkCellHtml(totP, maxRn*4, 'sm', k, -1, 'stly-tot', true, 'pk-tot-stly');
      row += '</tr>';
      body += row;
    }
    let trow = `<tr class="total"><td>Total</td>`;
    let gC={bk:0,rn:0,rev:0}, gP={bk:0,rn:0,rev:0};
    for (let i=0;i<A.weeks.length;i++){
      let cAgg={bk:0,rn:0,rev:0,rows:[]}, pAgg={bk:0,rn:0,rev:0,rows:[]};
      for (const k of axis){
        const c=dataC[k][i], p=dataP[k][i];
        cAgg.bk+=c.bk; cAgg.rn+=c.rn; cAgg.rev+=c.rev; cAgg.rows.push(...c.rows);
        pAgg.bk+=p.bk; pAgg.rn+=p.rn; pAgg.rev+=p.rev; pAgg.rows.push(...p.rows);
      }
      gC.bk+=cAgg.bk; gC.rn+=cAgg.rn; gC.rev+=cAgg.rev;
      gP.bk+=pAgg.bk; gP.rn+=pAgg.rn; gP.rev+=pAgg.rev;
      trow += pkCellHtml(cAgg, maxRn*axis.length, 'sm', '__ALL__', i, 'cur', false, 'pk-cur');
      trow += pkCellHtml(pAgg, maxRn*axis.length, 'sm', '__ALL__', i, 'stly', true, 'pk-stly');
    }
    trow += pkCellHtml(gC, maxRn*axis.length*4, 'sm', '__ALL__', -1, 'cur-tot', false, 'pk-tot-cur');
    trow += pkCellHtml(gP, maxRn*axis.length*4, 'sm', '__ALL__', -1, 'stly-tot', true, 'pk-tot-stly');
    trow += '</tr>';
    return head + '<tbody>' + body + trow + '</tbody>';
  }
  const rtTblEl = document.getElementById('pk-rt-table');
  if (rtTblEl) rtTblEl.innerHTML = buildMatrix(A.rtAxis,   A.rt, A.rtS, 'Room Type',   'rt');
  const provTblEl = document.getElementById('pk-prov-table');
  if (provTblEl) provTblEl.innerHTML = buildMatrix(A.provAxis, A.pr, A.prS, 'Source', 'prov');
  const smTableEl = document.getElementById('pk-sm-table');
  if (smTableEl) smTableEl.innerHTML = buildMatrixSM(A.smAxis, A.sm, A.smS);
  /* === CHARTS: barchart orizzontale ordinato per RN delle settimane selezionate ===
     Sostituisce il vecchio multi-line chart. Visualizzazione molto più leggibile per "chi vende di più":
     - Una barra per dimensione (Room Type, Provenienza, Mese Soggiorno)
     - Ordinate per RN decrescente sulle settimane selezionate
     - Barra split tra colori "2026" (pieno) e "STLY" (tratteggiato/grigino) per confronto
     - Etichetta a destra: numeri RN cur + STLY + Δ
  */
  const PK_PALETTE = ['#8b6f47','#3b6b6b','#a89274','#5a8c69','#7a5a8c','#c08838','#3b5a78','#b1432f'];
  function selectedWeeksLabel(){
    if (PK_WEEKS_SEL.length === 4) return 'All 4 weeks';
    return 'Solo W' + PK_WEEKS_SEL.map(i=>i+1).join(' + W');
  }
  function buildBarChart(axis, dataC, dataP, containerId, axisLabel, labelFn, sortMode){
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!axis.length){
      el.innerHTML = '<div class="panel-sub" style="padding:20px 0;text-align:center">No data</div>';
      return;
    }
    const lf = labelFn || ((k)=>k);
    const items = axis.map((k,idx) => {
      let rnCur = 0, rnSty = 0;
      for (const i of PK_WEEKS_SEL){
        rnCur += dataC[k][i].rn;
        rnSty += dataP[k][i].rn;
      }
      return {
        key: k,
        label: lf(k),
        idx,
        rnCur, rnSty,
        delta: rnCur - rnSty,
        color: PK_PALETTE[idx % PK_PALETTE.length],
      };
    }).filter(it => it.rnCur > 0 || it.rnSty > 0);
    if (sortMode === 'chrono'){
    } else {
      items.sort((a,b) => (b.rnCur - a.rnCur) || (b.rnSty - a.rnSty));
    }
    if (!items.length){
      el.innerHTML = '<div class="panel-sub" style="padding:20px 0;text-align:center">No pickup in these weeks</div>';
      return;
    }
    const byRn = items.slice().sort((a,b) => b.rnCur - a.rnCur);
    const rankOf = new Map();
    for (let i = 0; i < byRn.length && i < 3; i++){
      if (byRn[i].rnCur > 0) rankOf.set(byRn[i].key, i+1);
    }
    const maxRn = Math.max(...items.map(it => Math.max(it.rnCur, it.rnSty)), 1);
    const labelW = 22;  // % per la label
    const numW = 24;    // % per i numeri a dx
    const barW = 100 - labelW - numW;
    let html = `<div style="font-family:'DM Mono',monospace;font-size:11px">`;
    const sortLabel = sortMode === 'chrono' ? 'Chronological order' : 'Sorted by RN 2026 ↓';
    const filterInfo = `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0 10px;font-size:10px;color:var(--ink-3)">
      <span>Filter: <b style="color:var(--ink-2)">${selectedWeeksLabel()}</b></span>
      <span>${sortLabel}</span>
    </div>`;
    html += filterInfo;
    for (let r = 0; r < items.length; r++){
      const it = items[r];
      const wCur = (it.rnCur / maxRn) * 100;
      const wSty = (it.rnSty / maxRn) * 100;
      const deltaSign = it.delta > 0 ? '+' : '';
      const deltaCls = it.delta > 0 ? '#3d7a4b' : it.delta < 0 ? '#a83b3b' : 'var(--ink-3)';
      const rk = rankOf.get(it.key);
      const isTop = rk != null;
      const rankBadge = isTop ? `<span style="background:${it.color};color:#fff;padding:1px 5px;border-radius:8px;font-size:9px;font-weight:700;margin-right:6px">#${rk}</span>` : '';
      html += `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(0,0,0,.03)">
        <div style="width:${labelW}%;font-weight:${isTop?'600':'500'};color:${isTop?'var(--ink)':'var(--ink-2)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${rankBadge}${escapeHtml(it.label)}</div>
        <div style="width:${barW}%;position:relative;height:24px;background:rgba(0,0,0,.02);border-radius:3px;overflow:visible">
          <!-- Barra STLY tratteggiata di sfondo -->
          <div style="position:absolute;left:0;top:14px;height:9px;width:${wSty}%;background:repeating-linear-gradient(45deg,rgba(138,138,138,.30),rgba(138,138,138,.30) 3px,transparent 3px,transparent 6px);border:1px dashed rgba(138,138,138,.5);border-radius:2px" title="STLY: ${it.rnSty} RN"></div>
          <!-- Barra cur 2026 piena sopra -->
          <div style="position:absolute;left:0;top:1px;height:12px;width:${wCur}%;background:${it.color};border-radius:2px" title="2026: ${it.rnCur} RN"></div>
        </div>
        <div style="width:${numW}%;text-align:right;font-size:10px">
          <span style="color:var(--ink)"><b>${it.rnCur}</b></span>
          <span style="color:var(--ink-3)"> · STLY ${it.rnSty}</span>
          <span style="color:${deltaCls};font-weight:600;margin-left:4px">${deltaSign}${it.delta}</span>
        </div>
      </div>`;
    }
    html += `</div>`;
    html += `<div class="chart-legend" style="margin-top:10px;display:flex;gap:14px;justify-content:center;font-size:10px;color:var(--ink-3)">
      <span style="display:inline-flex;align-items:center;gap:5px"><span style="display:inline-block;width:18px;height:9px;background:#8b6f47;border-radius:2px"></span>2026 (current pickup)</span>
      <span style="display:inline-flex;align-items:center;gap:5px"><span style="display:inline-block;width:18px;height:7px;background:repeating-linear-gradient(45deg,rgba(138,138,138,.4),rgba(138,138,138,.4) 3px,transparent 3px,transparent 6px);border:1px dashed rgba(138,138,138,.5);border-radius:2px"></span>STLY (same weeks −364d)</span>
    </div>`;
    el.innerHTML = html;
  }
  buildBarChart(A.smAxis,   A.sm, A.smS, 'pk-sm-chart',   'Stay month', smLabel, 'chrono');
  buildBarChart(A.provAxis, A.pr, A.prS, 'pk-prov-chart', 'Source',    null,    'by-rn');
  buildBarChart(A.rtAxis,   A.rt, A.rtS, 'pk-rt-chart',   'Room Type',      null,    'by-rn');
  document.querySelectorAll('.pk-cell:not(.zero)').forEach(el=>{
    el.addEventListener('click', ()=>{
      const dim = el.dataset.dim, key = el.dataset.key;
      const wIdx = parseInt(el.dataset.week,10);
      const mode = el.dataset.mode;
      openPickupDrill(dim, key, wIdx, mode, A);
    });
  });
}
function openPickupDrill(dim, key, weekIdx, mode, A){
  const isCurr = mode.startsWith('cur');
  let dataset, axis, dimLabel;
  if (dim === 'rt'){
    dataset = isCurr ? A.rt : A.rtS;
    axis = A.rtAxis;
    dimLabel = 'Room Type';
  } else if (dim === 'prov'){
    dataset = isCurr ? A.pr : A.prS;
    axis = A.provAxis;
    dimLabel = 'Source';
  } else if (dim === 'sm'){
    dataset = isCurr ? A.sm : A.smS;
    axis = A.smAxis;
    dimLabel = 'Stay month';
  } else {
    return;  // dim sconosciuta
  }
  const weeks = isCurr ? A.weeks : A.stlyWeeks;
  const monLabIT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function smLabel(monthKey){
    const [y, m] = monthKey.split('-');
    return monLabIT[parseInt(m,10)-1] + ' ' + y;
  }
  function keyLabel(k){
    return (dim === 'sm') ? smLabel(k) : k;
  }
  let rows = [];
  let label='';
  let weekLabel='';
  if (key==='__ALL__'){
    if (weekIdx===-1){ // grand total
      for (const k of axis) for (const c of dataset[k]) rows.push(...c.rows);
      label = 'Totale ' + dimLabel;
      weekLabel = `4 weeks (${fmtDateIT(weeks[0].start)} → ${fmtDateIT(weeks[3].end)})`;
    } else {
      for (const k of axis) rows.push(...dataset[k][weekIdx].rows);
      label = 'Totale ' + dimLabel;
      weekLabel = `Week ${weekIdx+1} (${fmtDateIT(weeks[weekIdx].start)} → ${fmtDateIT(weeks[weekIdx].end)})`;
    }
  } else {
    if (weekIdx===-1){
      for (const c of dataset[key]) rows.push(...c.rows);
      label = keyLabel(key);
      weekLabel = `4 weeks (${fmtDateIT(weeks[0].start)} → ${fmtDateIT(weeks[3].end)})`;
    } else {
      rows = dataset[key][weekIdx].rows;
      label = keyLabel(key);
      weekLabel = `Week ${weekIdx+1} (${fmtDateIT(weeks[weekIdx].start)} → ${fmtDateIT(weeks[weekIdx].end)})`;
    }
  }
  rows = [...rows].sort((a,b)=> b.bookYmd - a.bookYmd);
  const totRev = rows.reduce((s,r)=>s+r.revTotal,0);
  const totRn  = rows.reduce((s,r)=>s+r.notti,0);
  document.getElementById('modal-title').textContent = label + (isCurr?' · 2026':' · STLY 2025');
  document.getElementById('modal-sub').textContent = `${weekLabel} · ${rows.length} bookings`;
  const aggRoom = {};
  const aggCan = {};
  for (const r of rows){
    const rk = r.room || '—';
    if (!aggRoom[rk]) aggRoom[rk] = {rn:0, rev:0, bk:0};
    aggRoom[rk].rn += r.notti; aggRoom[rk].rev += r.revTotal; aggRoom[rk].bk += 1;
    const ck = r.canale || '—';
    if (!aggCan[ck]) aggCan[ck] = {rn:0, rev:0, bk:0};
    aggCan[ck].rn += r.notti; aggCan[ck].rev += r.revTotal; aggCan[ck].bk += 1;
  }
  function buildAggTable(label, agg){
    const entries = Object.entries(agg).sort((a,b)=> b[1].rn - a[1].rn);
    if (!entries.length) return '';
    let h = `<table style="width:100%;font-size:12px;margin-bottom:14px">
      <thead><tr style="background:rgba(195,131,59,.08)"><th style="text-align:left;padding:8px 10px;width:46%">${label}</th><th class="num" style="padding:8px 10px">RN</th><th class="num" style="padding:8px 10px">ADR</th><th class="num" style="padding:8px 10px">Revenue</th></tr></thead><tbody>`;
    for (const [k, v] of entries){
      const adr = v.rn > 0 ? v.rev / v.rn : 0;
      h += `<tr><td style="padding:6px 10px">${escapeHtml(k)}</td><td class="num" style="padding:6px 10px">${v.rn}</td><td class="num" style="padding:6px 10px">${adr>0?fmtEUR(adr):'—'}</td><td class="num" style="padding:6px 10px">${fmtEUR(v.rev)}</td></tr>`;
    }
    h += '</tbody></table>';
    return h;
  }
  let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">';
  html += '<div><div style="font-size:11px;color:var(--ink-3);font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">By room</div>' + buildAggTable('Room', aggRoom) + '</div>';
  html += '<div><div style="font-size:11px;color:var(--ink-3);font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">By channel</div>' + buildAggTable('Channel', aggCan) + '</div>';
  html += '</div>';
  html += '<div style="font-size:11px;color:var(--ink-3);font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Booking detail</div>';
  html += `<table>
    <thead><tr>
      <th>Booking date</th><th>Room</th><th>Arrival</th><th>Nights</th><th>Source</th><th>Channel</th><th>Guest</th><th class="num">ADR</th><th class="num">Revenue</th>
    </tr></thead><tbody>`;
  for (const r of rows){
    const adrPerBk = (r.notti > 0) ? r.revTotal / r.notti : 0;
    html += `<tr>
      <td class="num">${fmtDateIT(r.dBook)}</td>
      <td>${escapeHtml(r.room)}</td>
      <td class="num">${fmtDateIT(r.dIn)}</td>
      <td class="num">${r.notti}</td>
      <td>${escapeHtml(r.prov)}</td>
      <td>${escapeHtml(r.canale)}</td>
      <td>${escapeHtml(r.guest||'—')}</td>
      <td class="num">${adrPerBk>0?fmtEUR(adrPerBk):'—'}</td>
      <td class="num">${fmtEUR(r.revTotal)}</td>
    </tr>`;
  }
  if (!rows.length) html += `<tr><td colspan="9" style="text-align:center;color:var(--ink-3);padding:30px">No bookings</td></tr>`;
  html += '</tbody>';
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-foot-l').textContent = `${rows.length} bookings · ${totRn} RN`;
  document.getElementById('modal-foot-r').textContent = fmtEUR(totRev);
  document.getElementById('modal').classList.add('show');
}
/* ============================================================
   SECTION 5: STORICO — totali 2025 e 2024 per struttura
   Allocazione per notti effettive (monthAllocate splits stay across
   years/months). Filtrabile per struttura corrente.
============================================================ */
function aggHistorico(sel){
  const targetKeys = structKeysFor(sel); // array of CFG keys we care about
  const years = [2024, 2025];
  const byYear = {};
  for (const y of years){
    byYear[y] = { _monthly: {} };
    for (let m=1;m<=12;m++) byYear[y]._monthly[m] = {rn:0, rev:0};
    for (const sk of [CFG.structures.firenze.key, CFG.structures.condotta.key, CFG.structures.alfani.key, CFG.structures.davids.key]){
      byYear[y][sk] = { rn:0, rev:0, bkSet:new Set(), _prov:{}, _can:{}, _monthly:{} };
      for (let m=1;m<=12;m++) byYear[y][sk]._monthly[m] = {rn:0, rev:0};
    }
  }
  const daysInYear = (y)=> ((y%4===0 && y%100!==0) || y%400===0) ? 366 : 365;
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (!targetKeys.includes(b.struct)) continue;
    const sk = b.struct;
    const alloc = monthAllocate(b.dIn, b.dOut, b.revPerNight);
    let touchedYears = new Set();
    for (const k in alloc){
      const ym = +k;
      const y  = Math.floor(ym/100);
      const m  = ym % 100;
      if (!byYear[y]) continue; // outside 2024/2025
      const a = alloc[k];
      byYear[y][sk].rn  += a.rn;
      byYear[y][sk].rev += a.rev;
      byYear[y][sk]._monthly[m].rn  += a.rn;
      byYear[y][sk]._monthly[m].rev += a.rev;
      byYear[y]._monthly[m].rn  += a.rn;
      byYear[y]._monthly[m].rev += a.rev;
      if (!byYear[y][sk]._prov[b.prov]) byYear[y][sk]._prov[b.prov] = {rn:0,rev:0, bkSet:new Set()};
      if (!byYear[y][sk]._can[b.canale]) byYear[y][sk]._can[b.canale] = {rn:0,rev:0, bkSet:new Set()};
      byYear[y][sk]._prov[b.prov].rn  += a.rn;
      byYear[y][sk]._prov[b.prov].rev += a.rev;
      byYear[y][sk]._prov[b.prov].bkSet.add(b.ref);
      byYear[y][sk]._can[b.canale].rn  += a.rn;
      byYear[y][sk]._can[b.canale].rev += a.rev;
      byYear[y][sk]._can[b.canale].bkSet.add(b.ref);
      touchedYears.add(y);
    }
    for (const y of touchedYears){
      byYear[y][sk].bkSet.add(b.ref);
    }
  }
  const keyToSel = {};
  keyToSel[CFG.structures.firenze.key]  = 'firenze';
  keyToSel[CFG.structures.condotta.key] = 'condotta';
  keyToSel[CFG.structures.alfani.key]   = 'alfani';
  keyToSel[CFG.structures.davids.key]   = 'davids';
  function daysInMonth(y, m){ return new Date(y, m, 0).getDate(); }
  const summary = []; // rows for the summary table
  for (const y of years){
    for (const sk of targetKeys){
      const d = byYear[y][sk];
      const rooms = structRoomsTotal(keyToSel[sk]);
      const cap = rooms * daysInYear(y);
      const occ = cap>0 ? d.rn/cap : 0;
      const adr = d.rn>0 ? d.rev/d.rn : 0;
      const months = [];
      for (let m=1;m<=12;m++){
        const md = d._monthly[m];
        const mcap = rooms * daysInMonth(y, m);
        months.push({
          m,
          rn: md.rn,
          rev: md.rev,
          occ: mcap>0 ? md.rn/mcap : 0,
          adr: md.rn>0 ? md.rev/md.rn : 0,
        });
      }
      summary.push({
        year: y,
        structKey: sk,
        structLabel: sk,
        rn: d.rn,
        rev: d.rev,
        bk: d.bkSet.size,
        cap,
        occ,
        adr,
        months,
      });
    }
  }
  function mergeMaps(year, field){
    const out = {};
    for (const sk of targetKeys){
      const m = byYear[year][sk][field];
      for (const k in m){
        if (!out[k]) out[k] = {rn:0, rev:0, bk:0};
        out[k].rn  += m[k].rn;
        out[k].rev += m[k].rev;
        out[k].bk  += m[k].bkSet.size;
      }
    }
    return out;
  }
  const provCur  = mergeMaps(2025, '_prov');
  const provPrev = mergeMaps(2024, '_prov');
  const canCur   = mergeMaps(2025, '_can');
  const canPrev  = mergeMaps(2024, '_can');
  const monthly = {2024: [], 2025: []};
  for (let m=1;m<=12;m++){
    monthly[2024].push(byYear[2024]._monthly[m].rev);
    monthly[2025].push(byYear[2025]._monthly[m].rev);
  }
  return { summary, provCur, provPrev, canCur, canPrev, monthly };
}
function renderHistorico(sel){
  const A = aggHistorico(sel);
  document.getElementById('hist-struct-chip').textContent = structLabel(sel);
  const tot = {2024:{rn:0,rev:0,cap:0,bk:0}, 2025:{rn:0,rev:0,cap:0,bk:0}};
  for (const r of A.summary){
    tot[r.year].rn  += r.rn;
    tot[r.year].rev += r.rev;
    tot[r.year].cap += r.cap;
    tot[r.year].bk  += r.bk;
  }
  for (const y of [2024,2025]){
    tot[y].occ = tot[y].cap>0 ? tot[y].rn/tot[y].cap : 0;
    tot[y].adr = tot[y].rn>0  ? tot[y].rev/tot[y].rn : 0;
  }
  const dRev = tot[2025].rev - tot[2024].rev;
  const dRevPct = tot[2024].rev>0 ? dRev/tot[2024].rev : NaN;
  const dOcc = (tot[2025].occ - tot[2024].occ); // pp
  const dAdr = tot[2025].adr - tot[2024].adr;
  const dAdrPct = tot[2024].adr>0 ? dAdr/tot[2024].adr : NaN;
  const kpiHtml = `
    <div class="kpi" style="border-left-color:#6b5b3f">
      <div class="kpi-lbl">Revenue 2025</div>
      <div class="kpi-val">${fmtEUR(tot[2025].rev)}</div>
      <div class="kpi-sub mono">${fmtNum(tot[2025].rn)} RN · OCC ${fmtPct(tot[2025].occ,1)} · ADR ${fmtEUR(tot[2025].adr)}</div>
    </div>
    <div class="kpi" style="border-left-color:#8a8a8a">
      <div class="kpi-lbl">Revenue 2024</div>
      <div class="kpi-val">${fmtEUR(tot[2024].rev)}</div>
      <div class="kpi-sub mono">${fmtNum(tot[2024].rn)} RN · OCC ${fmtPct(tot[2024].occ,1)} · ADR ${fmtEUR(tot[2024].adr)}</div>
    </div>
    <div class="kpi" style="border-left-color:${dRev>=0?'#3d7a4b':'#a83b3b'}">
      <div class="kpi-lbl">Δ Revenue YoY</div>
      <div class="kpi-val ${dRev>=0?'cell-pos':'cell-neg'}">${dRev>=0?'+':''}${fmtEUR(dRev)}</div>
      <div class="kpi-sub mono">${isFinite(dRevPct)?((dRevPct>=0?'+':'')+fmtPct(dRevPct,1)):'—'}</div>
    </div>
    <div class="kpi" style="border-left-color:${dOcc>=0?'#3d7a4b':'#a83b3b'}">
      <div class="kpi-lbl">Δ OCC YoY</div>
      <div class="kpi-val ${dOcc>=0?'cell-pos':'cell-neg'}">${dOcc>=0?'+':''}${(dOcc*100).toFixed(1)} pp</div>
      <div class="kpi-sub mono">ADR ${dAdr>=0?'+':''}${fmtEUR(dAdr)} ${isFinite(dAdrPct)?'('+(dAdrPct>=0?'+':'')+fmtPct(dAdrPct,1)+')':''}</div>
    </div>
  `;
  document.getElementById('hist-kpis').innerHTML = kpiHtml;
  const yearGroups = { 2025: [], 2024: [] };
  for (const r of A.summary) yearGroups[r.year].push(r);
  const sumHead = `<thead><tr>
    <th style="width:32px"></th>
    <th>Year</th>
    <th>Property</th>
    <th class="g-26">RN</th>
    <th class="g-26">OCC%</th>
    <th class="g-26">ADR</th>
    <th class="g-26">Revenue</th>
  </tr></thead>`;
  let sumBody = '';
  let rowIdx = 0;
  for (const y of [2025, 2024]){
    const rows = yearGroups[y];
    let yRn=0, yRev=0, yCap=0;
    let yMonthly = []; for (let i=0;i<12;i++) yMonthly.push({rn:0,rev:0,cap:0});
    for (const r of rows){
      yRn += r.rn; yRev += r.rev; yCap += r.cap;
      for (let i=0;i<12;i++){
        yMonthly[i].rn  += r.months[i].rn;
        yMonthly[i].rev += r.months[i].rev;
        const _sd = Object.values(CFG.structures).find(s=>s.key===r.structKey);
        const rooms = _sd ? _sd.roomsTotal : CFG.structures.condotta.roomsTotal;
        yMonthly[i].cap += rooms * (new Date(y, i+1, 0).getDate());
      }
      const rid = 'hist-row-' + (rowIdx++);
      sumBody += `<tr class="hist-parent" data-target="${rid}" style="cursor:pointer">
        <td class="cell-mono hist-toggle"><span class="hist-caret">▶</span></td>
        <td class="cell-mono">${y}</td>
        <td>${escapeHtml(r.structLabel)}</td>
        <td class="cell-mono">${fmtNum(r.rn)}</td>
        <td class="cell-mono">${fmtPct(r.occ,1)}</td>
        <td class="cell-mono">${fmtEUR(r.adr)}</td>
        <td class="cell-mono">${fmtEUR(r.rev)}</td>
      </tr>`;
      for (const md of r.months){
        sumBody += `<tr class="hist-child ${rid}" style="display:none">
          <td></td>
          <td class="cell-mono cell-flat" style="color:var(--ink-3)">${y}</td>
          <td class="cell-flat" style="color:var(--ink-3);padding-left:24px">${CFG.monthsIT[md.m-1]}</td>
          <td class="cell-mono cell-flat">${fmtNum(md.rn)}</td>
          <td class="cell-mono cell-flat">${md.rn>0?fmtPct(md.occ,1):'—'}</td>
          <td class="cell-mono cell-flat">${md.rn>0?fmtEUR(md.adr):'—'}</td>
          <td class="cell-mono cell-flat">${fmtEUR(md.rev)}</td>
        </tr>`;
      }
    }
    const yOcc = yCap>0 ? yRn/yCap : 0;
    const yAdr = yRn>0 ? yRev/yRn : 0;
    if (rows.length > 1){
      const yrid = 'hist-totrow-' + y;
      sumBody += `<tr class="total hist-parent" data-target="${yrid}" style="cursor:pointer">
        <td class="cell-mono hist-toggle"><span class="hist-caret">▶</span></td>
        <td class="cell-mono">${y}</td>
        <td>Total</td>
        <td class="cell-mono">${fmtNum(yRn)}</td>
        <td class="cell-mono">${fmtPct(yOcc,1)}</td>
        <td class="cell-mono">${fmtEUR(yAdr)}</td>
        <td class="cell-mono">${fmtEUR(yRev)}</td>
      </tr>`;
      for (let i=0;i<12;i++){
        const md = yMonthly[i];
        const mocc = md.cap>0 ? md.rn/md.cap : 0;
        const madr = md.rn>0 ? md.rev/md.rn : 0;
        sumBody += `<tr class="hist-child ${yrid}" style="display:none">
          <td></td>
          <td class="cell-mono cell-flat" style="color:var(--ink-3)">${y}</td>
          <td class="cell-flat" style="color:var(--ink-3);padding-left:24px">${CFG.monthsIT[i]} <span class="mono" style="font-size:11px;opacity:.7">tot</span></td>
          <td class="cell-mono cell-flat">${fmtNum(md.rn)}</td>
          <td class="cell-mono cell-flat">${md.rn>0?fmtPct(mocc,1):'—'}</td>
          <td class="cell-mono cell-flat">${md.rn>0?fmtEUR(madr):'—'}</td>
          <td class="cell-mono cell-flat">${fmtEUR(md.rev)}</td>
        </tr>`;
      }
    }
  }
  document.getElementById('hist-summary-table').innerHTML = sumHead + '<tbody>' + sumBody + '</tbody>';
  document.querySelectorAll('#hist-summary-table .hist-parent').forEach(tr=>{
    tr.addEventListener('click', ()=>{
      const tgt = tr.dataset.target;
      const caret = tr.querySelector('.hist-caret');
      const children = document.querySelectorAll('#hist-summary-table tr.' + tgt);
      const isOpen = caret.textContent === '▼';
      caret.textContent = isOpen ? '▶' : '▼';
      children.forEach(c => c.style.display = isOpen ? 'none' : '');
    });
  });
  document.getElementById('hist-prov-table').innerHTML = histCompareTable(A.provCur, A.provPrev, 'Source');
  document.getElementById('hist-prov-sub').textContent = '2025 vs 2024 · ordinato per Revenue 2025';
  document.getElementById('hist-can-table').innerHTML  = histCompareTable(A.canCur,  A.canPrev,  'Channel');
  document.getElementById('hist-can-sub').textContent  = '2025 vs 2024 · ordinato per Revenue 2025';
  document.getElementById('hist-month-chart').innerHTML = lineChart(
    A.monthly[2025], A.monthly[2024], CFG.monthsIT,
    '#6b5b3f', '€', 'rev', '#8a8a8a', true
  );
}
/* compareTable variant with 2025/2024 column labels */
function histCompareTable(cur, prev, labelCol){
  const keys = new Set([...Object.keys(cur), ...Object.keys(prev)]);
  const rows = [];
  let totC={rn:0,rev:0,bk:0}, totP={rn:0,rev:0,bk:0};
  for (const k of keys){
    const c = cur[k] || {rn:0,rev:0,bk:0};
    const p = prev[k] || {rn:0,rev:0,bk:0};
    totC.rn+=c.rn; totC.rev+=c.rev; totC.bk+=c.bk;
    totP.rn+=p.rn; totP.rev+=p.rev; totP.bk+=p.bk;
    rows.push({k,c,p});
  }
  rows.sort((a,b)=> b.c.rev - a.c.rev);
  const head = `<thead><tr>
    <th>${labelCol}</th>
    <th class="g-26">RN '25</th><th class="g-26">Rev '25</th><th class="g-26">% mix</th>
    <th class="g-25">RN '24</th><th class="g-25">Rev '24</th>
    <th class="g-var">Δ Rev</th><th class="g-var">Δ %</th>
  </tr></thead>`;
  const body = rows.map(r=>{
    const mix = totC.rev>0 ? r.c.rev/totC.rev : 0;
    const dRev = r.c.rev - r.p.rev;
    const dPct = r.p.rev>0 ? dRev/r.p.rev : (r.c.rev>0?Infinity:NaN);
    return `<tr>
      <td>${escapeHtml(r.k)}</td>
      <td class="cell-mono">${fmtNum(r.c.rn)}</td>
      <td class="cell-mono">${fmtEUR(r.c.rev)}</td>
      <td class="cell-mono cell-flat">${fmtPct(mix,1)}</td>
      <td class="cell-mono cell-flat">${fmtNum(r.p.rn)}</td>
      <td class="cell-mono cell-flat">${fmtEUR(r.p.rev)}</td>
      ${deltaCell(dRev,'eur')}
      ${(!isFinite(dPct)) ? '<td class="cell-flat">—</td>' : (dPct===Infinity ? '<td class="cell-pos cell-mono">new</td>' : deltaCell(dPct,'pct'))}
    </tr>`;
  }).join('');
  const dRevTot = totC.rev-totP.rev;
  const dPctTot = totP.rev>0 ? dRevTot/totP.rev : NaN;
  const totRow = `<tr class="total">
    <td>Total</td>
    <td class="cell-mono">${fmtNum(totC.rn)}</td>
    <td class="cell-mono">${fmtEUR(totC.rev)}</td>
    <td class="cell-mono">100%</td>
    <td class="cell-mono cell-flat">${fmtNum(totP.rn)}</td>
    <td class="cell-mono cell-flat">${fmtEUR(totP.rev)}</td>
    ${deltaCell(dRevTot,'eur')}
    ${deltaCell(dPctTot,'pct')}
  </tr>`;
  return head + '<tbody>' + body + totRow + '</tbody>';
}
/* ============================================================
   SECTION 5: MERCATO (AirDNA future rates 180d)
   ============================================================ */
/* aggMarket: cross MARKET_RATES with own confirmed bookings.
   For every market day in [today .. today+180], compute:
   - market ADR (from CSV)
   - market booked listings (from CSV)
   - own ADR confirmed: total revenue allocated to that single day / total RN
     for that day, using the selected struct's BOOKINGS already room-expanded.
*/
function aggMarket(sel){
  if (!MARKET_RATES.length){
    return { rows: [], byMonth: [], hasOwn:false, hasMarket:false };
  }
  const keys = new Set(structKeysFor(sel));
  const ownByYmd = {}; // ymd -> {rev, rn}
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (!keys.has(b.struct)) continue;
    let cur = startOfDay(b.dIn);
    const end = startOfDay(b.dOut);
    while (cur < end){
      const k = ymd(cur);
      if (!ownByYmd[k]) ownByYmd[k] = {rev:0, rn:0};
      ownByYmd[k].rev += b.revPerNight;
      ownByYmd[k].rn  += 1;
      cur = addDays(cur, 1);
    }
  }
  const rows = [];
  for (const m of MARKET_RATES){
    const own = ownByYmd[m.ymd] || {rev:0, rn:0};
    const ownAdr = own.rn>0 ? own.rev/own.rn : NaN;
    const diff = isFinite(ownAdr) ? ownAdr - m.adr : NaN;
    const diffPct = isFinite(ownAdr) && m.adr>0 ? (ownAdr - m.adr)/m.adr : NaN;
    rows.push({
      date: m.date, ymd: m.ymd, y: m.y, mo: m.m, d: m.d,
      mktAdr: m.adr,
      mktListings: m.listings,
      ownRev: own.rev,
      ownRn:  own.rn,
      ownAdr,
      diff, diffPct,
    });
  }
  const byMonthMap = {};
  for (const r of rows){
    const ym = r.y*100 + r.mo;
    if (!byMonthMap[ym]){
      byMonthMap[ym] = {
        ym, y:r.y, m:r.mo,
        mktAdrSum:0, mktListingsSum:0, days:0,
        ownRev:0, ownRn:0,
      };
    }
    const b = byMonthMap[ym];
    b.mktAdrSum      += r.mktAdr;
    b.mktListingsSum += r.mktListings;
    b.days += 1;
    b.ownRev += r.ownRev;
    b.ownRn  += r.ownRn;
  }
  const byMonth = Object.values(byMonthMap).sort((a,b)=> a.ym - b.ym).map(b => ({
    ym: b.ym, y: b.y, m: b.m, days: b.days,
    mktAdr: b.mktAdrSum / b.days,
    mktListings: b.mktListingsSum / b.days,
    ownAdr: b.ownRn>0 ? b.ownRev/b.ownRn : NaN,
    ownRev: b.ownRev,
    ownRn:  b.ownRn,
    diff: (b.ownRn>0) ? (b.ownRev/b.ownRn) - (b.mktAdrSum/b.days) : NaN,
    diffPct: (b.ownRn>0 && b.mktAdrSum>0) ? (((b.ownRev/b.ownRn) - (b.mktAdrSum/b.days)) / (b.mktAdrSum/b.days)) : NaN,
  }));
  return {
    rows, byMonth,
    hasOwn: rows.some(r=>r.ownRn>0),
    hasMarket: true,
    rangeStart: rows[0]?.date,
    rangeEnd:   rows[rows.length-1]?.date,
  };
}
function renderMarket(sel){
  if (!document.getElementById('mkt-struct-chip')) return;
  const A = aggMarket(sel);
  const chipEl = document.getElementById('mkt-struct-chip');
  if (chipEl) chipEl.textContent = structLabel(sel);
  if (!A.hasMarket){
    document.getElementById('mkt-kpis').innerHTML = '<div class="kpi"><div class="kpi-val">—</div><div class="kpi-sub">Market data not available</div></div>';
    document.getElementById('mkt-monthly-table').innerHTML = '';
    document.getElementById('mkt-daily-table').innerHTML = '';
    document.getElementById('mkt-chart-daily').innerHTML = '';
    return;
  }
  const totMktAdr = A.rows.reduce((s,r)=>s+r.mktAdr,0)/A.rows.length;
  const totMktListings = A.rows.reduce((s,r)=>s+r.mktListings,0)/A.rows.length;
  let totOwnRev=0, totOwnRn=0;
  for (const r of A.rows){ totOwnRev+=r.ownRev; totOwnRn+=r.ownRn; }
  const totOwnAdr = totOwnRn>0 ? totOwnRev/totOwnRn : NaN;
  const adrDiff = isFinite(totOwnAdr) ? totOwnAdr - totMktAdr : NaN;
  const adrDiffPct = isFinite(totOwnAdr) && totMktAdr>0 ? adrDiff/totMktAdr : NaN;
  const daysWithOwn = A.rows.filter(r=>r.ownRn>0).length;
  document.getElementById('mkt-kpis').innerHTML = `
    <div class="kpi" style="border-left-color:#3b6b6b">
      <div class="kpi-label">Average market ADR</div>
      <div class="kpi-val">${fmtEUR(totMktAdr)}</div>
      <div class="kpi-sub mono">${A.rows.length}d · AirDNA Upscale+Luxury</div>
    </div>
    <div class="kpi" style="border-left-color:#6b5b3f">
      <div class="kpi-label">ADR ${structLabel(sel)}</div>
      <div class="kpi-val">${isFinite(totOwnAdr) ? fmtEUR(totOwnAdr) : '—'}</div>
      <div class="kpi-sub mono">${daysWithOwn}d with bookings</div>
    </div>
    <div class="kpi" style="border-left-color:${isFinite(adrDiff) ? (adrDiff>=0?'#3d7a4b':'#a83b3b') : '#8a8a8a'}">
      <div class="kpi-label">Δ vs Market</div>
      <div class="kpi-val ${isFinite(adrDiff) ? (adrDiff>=0?'cell-pos':'cell-neg') : ''}">${isFinite(adrDiff) ? ((adrDiff>=0?'+':'')+fmtEUR(adrDiff)) : '—'}</div>
      <div class="kpi-sub mono">${isFinite(adrDiffPct) ? ((adrDiffPct>=0?'+':'')+fmtPct(adrDiffPct,1)) : '—'}</div>
    </div>
    <div class="kpi" style="border-left-color:#a89274">
      <div class="kpi-label">Booked Listings medi</div>
      <div class="kpi-val">${Math.round(totMktListings).toLocaleString('en-GB')}</div>
      <div class="kpi-sub mono">market units already booked</div>
    </div>
  `;
  let html = '<thead><tr>'
    + '<th>Month</th>'
    + '<th class="g-26">Market ADR</th>'
    + '<th class="g-26">ADR ' + escapeHtml(structLabel(sel)) + '</th>'
    + '<th class="g-var">Δ €</th>'
    + '<th class="g-var">Δ %</th>'
    + '<th class="g-25">Booked Listings medi</th>'
    + '<th class="g-25">Tue RN</th>'
    + '<th class="g-25">Market days</th>'
    + '</tr></thead><tbody>';
  for (const r of A.byMonth){
    const dEur = isFinite(r.diff) ? ((r.diff>=0?'+':'')+'€'+Math.round(r.diff).toLocaleString('en-GB')) : '—';
    const dEurCls = isFinite(r.diff) ? (r.diff>=0?'cell-pos':'cell-neg') : 'cell-flat';
    const dPct = isFinite(r.diffPct) ? ((r.diffPct>=0?'+':'')+(r.diffPct*100).toFixed(1)+'%') : '—';
    const dPctCls = isFinite(r.diffPct) ? (r.diffPct>=0?'cell-pos':'cell-neg') : 'cell-flat';
    html += `<tr>
      <td>${CFG.monthsITLong[r.m-1]} ${r.y}</td>
      <td class="cell-mono">${fmtEUR(r.mktAdr)}</td>
      <td class="cell-mono">${isFinite(r.ownAdr) ? fmtEUR(r.ownAdr) : '—'}</td>
      <td class="cell-mono ${dEurCls}">${dEur}</td>
      <td class="cell-mono ${dPctCls}">${dPct}</td>
      <td class="cell-mono cell-flat">${Math.round(r.mktListings).toLocaleString('en-GB')}</td>
      <td class="cell-mono cell-flat">${r.ownRn}</td>
      <td class="cell-mono cell-flat">${r.days}</td>
    </tr>`;
  }
  html += '</tbody>';
  document.getElementById('mkt-monthly-table').innerHTML = html;
  const dayHtml = ['<thead><tr>',
    '<th>Date</th>',
    '<th>Day</th>',
    '<th class="g-26">Market ADR</th>',
    '<th class="g-26">Tua ADR</th>',
    '<th class="g-var">Δ €</th>',
    '<th class="g-var">Δ %</th>',
    '<th class="g-25">Booked Listings</th>',
    '<th class="g-25">Tue RN</th>',
    '</tr></thead><tbody>'].join('');
  const dowIT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let dayBody = '';
  const slice = A.rows.slice(0, 28);
  for (const r of slice){
    const dEur = isFinite(r.diff) ? ((r.diff>=0?'+':'')+'€'+Math.round(r.diff).toLocaleString('en-GB')) : '—';
    const dEurCls = isFinite(r.diff) ? (r.diff>=0?'cell-pos':'cell-neg') : 'cell-flat';
    const dPct = isFinite(r.diffPct) ? ((r.diffPct>=0?'+':'')+(r.diffPct*100).toFixed(1)+'%') : '—';
    const dPctCls = isFinite(r.diffPct) ? (r.diffPct>=0?'cell-pos':'cell-neg') : 'cell-flat';
    const dow = dowIT[r.date.getDay()];
    const dowStyle = (r.date.getDay()===5 || r.date.getDay()===6) ? ' style="color:var(--accent);font-weight:500"' : '';
    dayBody += `<tr>
      <td class="cell-mono">${pad2(r.d)}/${pad2(r.mo)}/${r.y}</td>
      <td${dowStyle}>${dow}</td>
      <td class="cell-mono">${fmtEUR(r.mktAdr)}</td>
      <td class="cell-mono">${isFinite(r.ownAdr) ? fmtEUR(r.ownAdr) : '—'}</td>
      <td class="cell-mono ${dEurCls}">${dEur}</td>
      <td class="cell-mono ${dPctCls}">${dPct}</td>
      <td class="cell-mono cell-flat">${r.mktListings.toLocaleString('en-GB')}</td>
      <td class="cell-mono cell-flat">${r.ownRn}</td>
    </tr>`;
  }
  document.getElementById('mkt-daily-table').innerHTML = dayHtml + dayBody + '</tbody>';
  const labels = A.rows.map((r,i) => (i % 15 === 0) ? `${pad2(r.d)}/${pad2(r.mo)}` : '');
  const mktSeries = A.rows.map(r => r.mktAdr);
  const ownSeries = A.rows.map(r => isFinite(r.ownAdr) ? r.ownAdr : null);
  document.getElementById('mkt-chart-daily').innerHTML = marketDualChart(
    mktSeries, ownSeries, labels, A.rows
  );
  const subEl = document.getElementById('mkt-chart-sub');
  if (subEl){
    const start = A.rows[0];
    const end = A.rows[A.rows.length-1];
    subEl.textContent = `Market (solid line) vs ${structLabel(sel)} (dots on days with bookings) · ${pad2(start.d)}/${pad2(start.mo)}/${start.y} → ${pad2(end.d)}/${pad2(end.mo)}/${end.y}`;
  }
}
/* Custom dual-line chart for Market: solid market line + own dots
   for days with bookings. Uses similar style to lineChart helper but
   accepts null values for own series. */
function marketDualChart(mktArr, ownArr, labels, rows){
  const W = 1080, H = 280;
  const padL = 50, padR = 16, padT = 14, padB = 30;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const N = mktArr.length;
  if (!N) return '';
  const ownVals = ownArr.filter(v=>v!=null);
  const allVals = mktArr.concat(ownVals);
  let yMin = Math.min(...allVals);
  let yMax = Math.max(...allVals);
  const yPad = (yMax - yMin) * 0.1 || 10;
  yMin = Math.max(0, yMin - yPad);
  yMax = yMax + yPad;
  const yNice = niceCeil(yMax);
  const x = (i) => padL + (i / Math.max(1, N-1)) * innerW;
  const y = (v) => padT + innerH - ((v - yMin) / (yNice - yMin)) * innerH;
  let yTicks = '';
  for (let i=0;i<=4;i++){
    const v = yMin + (yNice - yMin) * (i/4);
    const yy = padT + innerH - (i/4)*innerH;
    yTicks += `<line x1="${padL}" x2="${W-padR}" y1="${yy}" y2="${yy}" stroke="rgba(0,0,0,.06)" />`;
    yTicks += `<text x="${padL-6}" y="${yy+3}" text-anchor="end" font-size="10" fill="#8a8a8a" font-family="DM Mono,monospace">${tickFmt(v,'eur','€')}</text>`;
  }
  let xTicks = '';
  for (let i=0;i<N;i++){
    if (labels[i]){
      const xx = x(i);
      xTicks += `<line x1="${xx}" x2="${xx}" y1="${padT}" y2="${padT+innerH}" stroke="rgba(0,0,0,.04)" />`;
      xTicks += `<text x="${xx}" y="${H-8}" text-anchor="middle" font-size="10" fill="#8a8a8a" font-family="DM Mono,monospace">${labels[i]}</text>`;
    }
  }
  let weekends = '';
  for (let i=0;i<N;i++){
    const dow = rows[i].date.getDay();
    if (dow === 6){ // Saturday → start of weekend strip
      const x0 = x(i) - (innerW/(N-1))*0.5;
      const w = (innerW/(N-1)) * 1.0; // Sat only (Sun handled separately if needed)
      weekends += `<rect x="${x0}" y="${padT}" width="${w}" height="${innerH}" fill="rgba(107,91,63,.04)" />`;
    }
  }
  let mktPath = '';
  for (let i=0;i<N;i++){
    mktPath += (i===0?'M':'L') + x(i).toFixed(1) + ',' + y(mktArr[i]).toFixed(1) + ' ';
  }
  let ownDots = '';
  let ownPath = '';
  let inSeg = false;
  for (let i=0;i<N;i++){
    const v = ownArr[i];
    if (v != null){
      const xi = x(i), yi = y(v);
      if (!inSeg){ ownPath += `M${xi.toFixed(1)},${yi.toFixed(1)} `; inSeg = true; }
      else { ownPath += `L${xi.toFixed(1)},${yi.toFixed(1)} `; }
      ownDots += `<circle cx="${xi.toFixed(1)}" cy="${yi.toFixed(1)}" r="2.5" fill="#6b5b3f"><title>${pad2(rows[i].d)}/${pad2(rows[i].mo)} · Mia ADR ${fmtEUR(v)} · Market ${fmtEUR(mktArr[i])}</title></circle>`;
    } else {
      inSeg = false;
    }
  }
  let hover = '';
  const bandW = innerW / Math.max(1, N-1);
  for (let i=0;i<N;i++){
    const xi = x(i);
    const tt = `${pad2(rows[i].d)}/${pad2(rows[i].mo)}/${rows[i].y} · Market ${fmtEUR(mktArr[i])} · ${rows[i].mktListings} listings` + (ownArr[i]!=null ? ` · Tua ADR ${fmtEUR(ownArr[i])}` : '');
    hover += `<rect x="${xi - bandW/2}" y="${padT}" width="${bandW}" height="${innerH}" fill="transparent"><title>${tt}</title></rect>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet" style="font-family:'DM Sans',sans-serif">
    ${weekends}
    ${yTicks}
    ${xTicks}
    <path d="${mktPath}" fill="none" stroke="#3b6b6b" stroke-width="2"/>
    <path d="${ownPath}" fill="none" stroke="#6b5b3f" stroke-width="1.5" stroke-dasharray="4 3"/>
    ${ownDots}
    ${hover}
    <g font-family="DM Mono,monospace" font-size="10" fill="#8a8a8a">
      <rect x="${padL}" y="${padT-2}" width="14" height="2" fill="#3b6b6b"/>
      <text x="${padL+18}" y="${padT+5}" fill="#3b6b6b">AirDNA Market</text>
      <rect x="${padL+130}" y="${padT-2}" width="14" height="2" fill="#6b5b3f" stroke-dasharray="4 3"/>
      <text x="${padL+148}" y="${padT+5}" fill="#6b5b3f">Your confirmed ADR</text>
    </g>
  </svg>`;
}
/* ===========================================================================
   EXPEDIA RATE SHOPPER — helpers
   EXPEDIA_DATA = {
     as_of, condotta:{ymd:price}, compset_avg:{ymd:price},
     competitors:{name:{ymd:price}}, search_current:{ymd}, search_previous:{ymd}
   }
   Le date sono in formato 'YYYY-MM-DD'.
   La struttura cui si applica è SOLO Condotta 16 (Expedia copre solo quella).
   =========================================================================== */
function expYmdKey(ymdNum){
  const s = String(ymdNum);
  if (s.length !== 8) return null;
  return s.slice(0,4) + '-' + s.slice(4,6) + '-' + s.slice(6,8);
}
function expToBeddyFlex(expediaPrice, structKey, dateISO){
  if (expediaPrice == null || !isFinite(expediaPrice)) return null;
  const markupPct = (typeof fp_getChannelMarkups === 'function')
                  ? fp_getChannelMarkups().expedia
                  : ((structKey && typeof fp_getOtaMarkup === 'function') ? fp_getOtaMarkup(structKey) : 17);
  const markup = 1 + markupPct / 100;
  let suppl = 0;
  if (dateISO && structKey && typeof fp_expediaRoomSupplement === 'function'){
    try { suppl = fp_expediaRoomSupplement(structKey, dateISO) || 0; } catch(e){ suppl = 0; }
  }
  const beddy = expediaPrice / (markup * 0.90);
  return Math.max(0, beddy - suppl);
}
let _EXP_SUPP_AGG_CACHE = {};  // cache per-struttura dei campi struttura-level usati da fp_expediaRoomSupplement
function fp_expediaRoomSupplement(structKey, dateISO){
  if (typeof aggPricingDaily !== 'function') return 0;
  let Apri = _EXP_SUPP_AGG_CACHE[structKey];
  if (Apri === undefined){
    try { const ymdN = parseInt(dateISO.replace(/-/g,'')); Apri = aggPricingDaily(structKey, ymdN, 1); }
    catch(e){ Apri = null; }
    _EXP_SUPP_AGG_CACHE[structKey] = Apri;
  }
  if (!Apri || !Apri.baseRT) return 0;
  const baseRT = Apri.baseRT;
  const month = parseInt(dateISO.slice(5,7));
  const highSeason = new Set(Apri.highSeason || []);
  function suppOf(rt){
    if (rt === baseRT) return 0;
    const s = (Apri.supplementoStagione || {})[rt];
    if (!s) return 0;
    return highSeason.has(month) ? (s.alta||0) : (s.bassa||0);
  }
  const rts = (Apri.rtList || [baseRT]).slice().sort((a,b)=> suppOf(a) - suppOf(b));
  for (const rt of rts){
    const inv = (typeof fp_invForRT === 'function') ? fp_invForRT(structKey, rt) : 1;
    const otb = (typeof fp_rnOtbForDay === 'function') ? fp_rnOtbForDay(structKey, rt, dateISO) : 0;
    if (otb < inv){
      return suppOf(rt);
    }
  }
  return suppOf(rts[rts.length - 1]);
}
function fp_expToBeddyDivisor(structKey){
  const markupPct = (typeof fp_getChannelMarkups === 'function')
                  ? fp_getChannelMarkups().expedia
                  : ((typeof fp_getOtaMarkup === 'function') ? fp_getOtaMarkup(structKey) : 17);
  return (1 + markupPct/100) * 0.90;
}
function expContext(ymdNum, structSel){
  if (typeof EXPEDIA_DATA === 'undefined' || !EXPEDIA_DATA) return null;
  if (structSel !== 'condotta' && structSel !== 'alfani' && structSel !== 'firenze' && structSel !== 'davids') return null;
  const k = expYmdKey(ymdNum);
  if (!k) return null;
  // Sanitizer: any Expedia value < 10 € is treated as missing (it's a minimum-stay number
  // leaked into the price column, not a real rate). Floor across all properties is ≥ 100 €.
  const _sanePrice = (v) => (v != null && isFinite(v) && v >= 10) ? v : null;
  let myPrice, compAvg, searchCur, searchPrev;
  if (structSel === 'condotta'){
    myPrice = EXPEDIA_DATA.condotta[k];
    compAvg = EXPEDIA_DATA.compset_avg[k];
    searchCur = EXPEDIA_DATA.search_current[k];
    searchPrev = EXPEDIA_DATA.search_previous[k];
  } else if (structSel === 'alfani'){
    myPrice = EXPEDIA_DATA.alfani[k];
    compAvg = EXPEDIA_DATA.compset_avg_alfani[k];
    searchCur = EXPEDIA_DATA.search_current[k];
    searchPrev = EXPEDIA_DATA.search_previous[k];
  } else if (structSel === 'davids'){
    myPrice = EXPEDIA_DATA.davids ? EXPEDIA_DATA.davids[k] : null;
    compAvg = EXPEDIA_DATA.compset_avg_davids ? EXPEDIA_DATA.compset_avg_davids[k] : null;
    searchCur = EXPEDIA_DATA.search_current_davids ? EXPEDIA_DATA.search_current_davids[k] : null;
    searchPrev = EXPEDIA_DATA.search_previous_davids ? EXPEDIA_DATA.search_previous_davids[k] : null;
  } else { // firenze
    myPrice = EXPEDIA_DATA.firenze ? EXPEDIA_DATA.firenze[k] : null;
    compAvg = EXPEDIA_DATA.compset_avg_firenze ? EXPEDIA_DATA.compset_avg_firenze[k] : null;
    searchCur = EXPEDIA_DATA.search_current[k];
    searchPrev = EXPEDIA_DATA.search_previous[k];
  }
  myPrice = _sanePrice(myPrice);
  compAvg = _sanePrice(compAvg);
  return {
    ymd: k,
    myPriceExpedia: myPrice,
    myPriceBeddy: expToBeddyFlex(myPrice, structSel, k),
    compsetAvg: compAvg,
    compsetAvgBeddy: expToBeddyFlex(compAvg),
    searchCurrent: searchCur,
    searchPrevious: searchPrev,
    searchYoY: (searchCur != null && searchPrev != null && searchPrev > 0)
      ? (searchCur - searchPrev) / searchPrev
      : null,
  };
}
let _expSearchStats = null;
function expSearchStats(){
  if (_expSearchStats) return _expSearchStats;
  if (typeof EXPEDIA_DATA === 'undefined' || !EXPEDIA_DATA){
    _expSearchStats = {avg:0, p25:0, p50:0, p75:0, p90:0, max:0};
    return _expSearchStats;
  }
  const vals = Object.values(EXPEDIA_DATA.search_current).filter(v => v != null && isFinite(v)).sort((a,b)=>a-b);
  if (!vals.length){ _expSearchStats = {avg:0, p25:0, p50:0, p75:0, p90:0, max:0}; return _expSearchStats; }
  const pct = (q) => vals[Math.min(vals.length-1, Math.floor(q*vals.length))];
  const avg = vals.reduce((s,v)=>s+v, 0) / vals.length;
  _expSearchStats = {
    avg, p25: pct(0.25), p50: pct(0.50), p75: pct(0.75), p90: pct(0.90), max: vals[vals.length-1],
    min: vals[0], n: vals.length,
  };
  return _expSearchStats;
}
let _expSearchStatsByMonthCache = null;
function expSearchStatsByMonth(ym){
  if (!_expSearchStatsByMonthCache){
    _expSearchStatsByMonthCache = {};
    if (typeof EXPEDIA_DATA !== 'undefined' && EXPEDIA_DATA && EXPEDIA_DATA.search_current){
      const byMonth = {};
      for (const k in EXPEDIA_DATA.search_current){
        const v = EXPEDIA_DATA.search_current[k];
        if (v == null || !isFinite(v)) continue;
        const mKey = k.substring(0,7);  // 'YYYY-MM'
        if (!byMonth[mKey]) byMonth[mKey] = [];
        byMonth[mKey].push(v);
      }
      for (const mKey in byMonth){
        const vals = byMonth[mKey].slice().sort((a,b)=>a-b);
        const pct = (q) => vals[Math.min(vals.length-1, Math.floor(q*vals.length))];
        const avg = vals.reduce((s,v)=>s+v, 0) / vals.length;
        _expSearchStatsByMonthCache[mKey] = {
          avg, p25: pct(0.25), p50: pct(0.50), p75: pct(0.75), p90: pct(0.90),
          max: vals[vals.length-1], min: vals[0], n: vals.length,
        };
      }
    }
  }
  return _expSearchStatsByMonthCache[ym] || null;
}
function expDemandLevel(search){
  if (search == null) return null;
  const s = expSearchStats();
  if (search >= s.p90) return {level:'very_high', label:'🔥 Very high', color:'#a83b3b'};
  if (search >= s.p75) return {level:'high',      label:'↑ High',      color:'#c4823b'};
  if (search >= s.p25) return {level:'mid',       label:'·  Medium',   color:'#888'};
  return {level:'low', label:'↓ Low', color:'#3b6b6b'};
}
/* Background tint for a Sell Strategy row, based on the Expedia search pressure for that day.
   Uses a percentile-rank scale against the global search distribution for high contrast.
   Curve emphasised on the upper half (more visible differences for days that matter, peak season). */
function _searchPressureBg(search){
  if (search == null || !isFinite(search)) return '';
  const s = expSearchStats();
  if (!s || !s.p90 || !s.p25) return '';
  let t;
  if (search <= s.min) t = 0;
  else if (search <= s.p25) t = 0.05 * (search - s.min) / (s.p25 - s.min || 1);     // 0..0.05 (low: barely visible)
  else if (search <= s.p50) t = 0.05 + 0.15 * (search - s.p25) / (s.p50 - s.p25 || 1); // 0.05..0.20
  else if (search <= s.p75) t = 0.20 + 0.25 * (search - s.p50) / (s.p75 - s.p50 || 1); // 0.20..0.45
  else if (search <= s.p90) t = 0.45 + 0.30 * (search - s.p75) / (s.p90 - s.p75 || 1); // 0.45..0.75
  else if (search <= s.max) t = 0.75 + 0.25 * (search - s.p90) / (s.max - s.p90 || 1); // 0.75..1.00
  else t = 1.0;
  if (t < 0) t = 0;
  if (t > 1) t = 1;
  // Alpha 0 to 0.42 — applied only on Date/Event/DoW cells now, so a bit more visible is OK.
  const alpha = t * 0.42;
  return 'background:rgba(196,130,59,' + alpha.toFixed(2) + ')';
}
function expCheckBrake(proposedPrice, compsetAvg){
  if (!proposedPrice || !compsetAvg || compsetAvg <= 0) return null;
  const ratio = proposedPrice / compsetAvg;
  if (ratio >= 1.20){
    return {
      brake: true,
      ratio,
      suggestedMax: compsetAvg * 1.20,  // cap consigliato
      compsetAvg,
    };
  }
  return null;
}
/* ===========================================================================
   BEDDY DAILY PRICES — price realmente caricato sul PMS
   BEDDY_DATA = { asOf, rangeStart, rangeEnd, firenze:{YYYY-MM-DD: price}, condotta:{YYYY-MM-DD: price} }
   Periodo coperto: 12/05/2026 → 27/12/2026 (230 days). Sono i prezzi della baseRT:
   - Firenze Suite → Camera Matrimoniale Deluxe
   - Condotta 16  → Bilocale
   Palazzo Alfani non è coperto (nessun dato Beddy fornito).
   =========================================================================== */
function beddyPriceFor(sel, ymdNum){
  if (typeof BEDDY_DATA === 'undefined' || !BEDDY_DATA) return null;
  if (sel !== 'firenze' && sel !== 'condotta' && sel !== 'alfani') return null;
  const key = expYmdKey(ymdNum);
  if (!key) return null;
  const map = BEDDY_DATA[sel];
  if (!map) return null;
  const p = map[key];
  return (p != null && isFinite(p)) ? p : null;
}
/* Correlazione Beddy ↔ Expedia (rapporto price Beddy / price mio su Expedia).
   Restituisce il moltiplicatore medio osservato negli ultimi days con entrambi i dati disponibili.
   Utile per derivare il price Beddy implicito quando ho solo dati Expedia (days futuri non ancora caricati). */
function beddyExpediaRatio(sel, lookbackDays){
  if (sel !== 'firenze' && sel !== 'condotta' && sel !== 'alfani') return null;
  if (typeof BEDDY_DATA === 'undefined' || typeof EXPEDIA_DATA === 'undefined') return null;
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const ratios = [];
  for (let d = 0; d < (lookbackDays || 30); d++){
    const dt = new Date(today.getTime() + d * 86400000);
    const ymd = dt.getFullYear()*10000 + (dt.getMonth()+1)*100 + dt.getDate();
    const beddy = beddyPriceFor(sel, ymd);
    if (beddy == null) continue;
    const key = expYmdKey(ymd);
    const expMyMap = (sel === 'condotta') ? EXPEDIA_DATA.condotta
                    : (sel === 'alfani')   ? EXPEDIA_DATA.alfani
                    : (sel === 'firenze')  ? EXPEDIA_DATA.firenze
                    : null;
    if (!expMyMap) continue;
    const expMy = expMyMap[key];
    if (expMy == null || expMy <= 0) continue;
    const expBeddyEq = expToBeddyFlex(expMy, sel);
    if (!expBeddyEq) continue;
    ratios.push(beddy / expBeddyEq);
  }
  if (ratios.length === 0) return null;
  ratios.sort((a,b) => a-b);
  const median = ratios[Math.floor(ratios.length / 2)];
  return { median, n: ratios.length, min: ratios[0], max: ratios[ratios.length-1] };
}
/* ============================================================
   SECTION 6: SELL STRATEGY
   Daily forward-looking table.
   For each future day [startDate, startDate + rangeDays):
   - OTB current: revenue/RN allocated to that day from confirmed bookings
     with bookYmd <= TODAY_YMD
   - Pickup ΔN: difference between OTB current and OTB N days ago.
     Calculated as bookings with bookYmd in (snapshotDate, TODAY_YMD]
   - STLY: same day-of-week 364 days earlier; aggregated using bookings
     whose bookYmd <= (TODAY - 364)
   ============================================================ */
let SELL_START_YMD = null;       // chosen start date (YMD num)
let SELL_START_USER_SET = false; // true once the user manually picks a date in this session
let SELL_RANGE_DAYS = 180;        // 30 | 60 | 90 | 180 | 365
let SELL_PICKUP_DAYS = 1;        // N days for pickup snapshot
let SELL_LAST_AGG = null;        // last aggregation result (for drilldown lookups)
let SELL_RT_FILTER = null;       // null = tutte le RT (default); altrimenti nome RT specifica (es. "Bilocale")
let SELL_PKMONTH_FILTER = 'both'; // 'both' = aggregato (default quando CURRENT_STRUCT=both); 'firenze'|'condotta'|'alfani' = singola
/* === Pesi RMES per-struttura ===
   Ogni struttura ha la sua configurazione indipendente di pesi.
   Ordine nuovo: A=OCC, B=Price, C=Pace, D=Compset, E=AirDNA (interni A/B/C, esterni D/E) */
const SELL_RMES_W_DEFAULT = { occ: 0.20, price: 0.20, pace: 0.20, budget: 0.00, comp: 0.20, airdna: 0.20 };
const SELL_RMES_W_KEY = 'rmes_weights_per_struct_v4';
let SELL_RMES_W_ALL = (function(){
  try {
    const raw = localStorage.getItem(SELL_RMES_W_KEY);
    if (raw){
      const parsed = JSON.parse(raw);
      const out = {};
      const migKey = 'rmes_weights_migration_v5';
      const needsMig = !localStorage.getItem(migKey);
      for (const s of ['firenze','condotta','alfani','davids']){
        const p = parsed[s] || {};
        if (needsMig && p.budget != null && p.budget > 0){
          const budgetW = p.budget;
          const sumOthers = (p.occ||0) + (p.price||0) + (p.pace||0) + (p.comp||0) + (p.airdna||0);
          if (sumOthers > 0){
            const factor = 1 + budgetW / sumOthers;
            out[s] = {
              occ:    (p.occ||0) * factor,
              price:  (p.price||0) * factor,
              pace:   (p.pace||0) * factor,
              budget: 0,
              comp:   (p.comp||0) * factor,
              airdna: (p.airdna||0) * factor,
            };
          } else {
            out[s] = Object.assign({}, SELL_RMES_W_DEFAULT);
          }
        } else {
          out[s] = Object.assign({}, SELL_RMES_W_DEFAULT, p);
          if (out[s].budget == null) out[s].budget = 0;
        }
      }
      if (needsMig){
        try { localStorage.setItem(migKey, '1'); localStorage.setItem(SELL_RMES_W_KEY, JSON.stringify(out)); } catch(e){}
        console.log('[RMES] v5 migration: Budget=0, redistributed over the remaining 5 factors');
      }
      return out;
    }
    const oldRawV3 = localStorage.getItem('rmes_weights_per_struct_v3');
    if (oldRawV3){
      const parsed = JSON.parse(oldRawV3);
      const out = {};
      for (const s of ['firenze','condotta','alfani','davids']){
        out[s] = Object.assign({}, SELL_RMES_W_DEFAULT, parsed[s] || {});
      }
      return out;
    }
    const oldRawV2 = localStorage.getItem('rmes_weights_per_struct_v2');
    if (oldRawV2){
      const parsed = JSON.parse(oldRawV2);
      const out = {};
      for (const s of ['firenze','condotta','alfani','davids']){
        const old = parsed[s] || {};
        const sumOld = (old.occ||0)+(old.price||0)+(old.pace||0)+(old.comp||0)+(old.airdna||0);
        if (sumOld > 0){
          const factor = 0.85 / sumOld;
          out[s] = {
            occ: (old.occ||0.20) * factor,
            price: (old.price||0.20) * factor,
            pace: (old.pace||0.20) * factor,
            budget: 0.15,
            comp: (old.comp||0.20) * factor,
            airdna: (old.airdna||0.20) * factor,
          };
        } else {
          out[s] = Object.assign({}, SELL_RMES_W_DEFAULT);
        }
      }
      return out;
    }
    const oldRaw = localStorage.getItem('rmes_weights_v1');
    if (oldRaw){
      const oldW = JSON.parse(oldRaw);
      const seed = Object.assign({}, SELL_RMES_W_DEFAULT, oldW);
      return { firenze: Object.assign({}, seed), condotta: Object.assign({}, seed), alfani: Object.assign({}, seed), davids: Object.assign({}, seed) };
    }
  } catch(e){}
  return {
    firenze:  Object.assign({}, SELL_RMES_W_DEFAULT),
    condotta: Object.assign({}, SELL_RMES_W_DEFAULT),
    alfani:   Object.assign({}, SELL_RMES_W_DEFAULT),
    davids:   Object.assign({}, SELL_RMES_W_DEFAULT),
  };
})();
function saveRmesWeights(){
  try { localStorage.setItem(SELL_RMES_W_KEY, JSON.stringify(SELL_RMES_W_ALL)); } catch(e){}
}
function getCurrentWeights(){
  const sel = (typeof CURRENT_STRUCT !== 'undefined') ? CURRENT_STRUCT : 'condotta';
  if (sel === 'both'){
    const out = Object.assign({}, SELL_RMES_W_DEFAULT);
    for (const k of Object.keys(out)){
      out[k] = (SELL_RMES_W_ALL.firenze[k] + SELL_RMES_W_ALL.condotta[k] + SELL_RMES_W_ALL.alfani[k]) / 3;
    }
    return out;
  }
  return SELL_RMES_W_ALL[sel] || Object.assign({}, SELL_RMES_W_DEFAULT);
}
/* === Soglie e moltiplicatori RMES per-struttura === */
const RMES_TH_DEFAULT = {
  occ:    { lo: 0.9,  hi: 1.1,  multLow: 0.90, multMid: 1.00, multHigh: 1.10 },
  price:  { lo: 0.8,  hi: 1.1,  multLow: 1.10, multMid: 1.05, multHigh: 1.00 },
  pace:   { lo: 0.9,  hi: 1.1,  multLow: 0.90, multMid: 1.00, multHigh: 1.10 },
  budget: { lo: 0.9,  hi: 1.1,  multLow: 1.10, multMid: 1.05, multHigh: 1.00 },
  comp:   { lo: 0.8,  hi: 1.1,  multLow: 1.10, multMid: 1.00, multHigh: 0.90 },
  airdna: { lo: 0.50, hi: 0.75, multLow: 0.90, multMid: 1.00, multHigh: 1.10 },
};
const RMES_TH_KEY = 'rmes_thresholds_per_struct_v3';
const RMES_CAP_KEY = 'rmes_total_cap_v1';  // Cap totale sulla somma Σ(deviazione × peso) - default 0.30 (=30%)
function getRmesCap(structKey){
  try {
    const raw = localStorage.getItem(RMES_CAP_KEY);
    if (raw){
      const obj = JSON.parse(raw);
      if (obj && typeof obj[structKey] === 'number') return obj[structKey];
    }
  } catch(e){}
  return 0.30;  // default 30%
}
function setRmesCap(structKey, value){
  let obj = {};
  try { obj = JSON.parse(localStorage.getItem(RMES_CAP_KEY) || '{}'); } catch(e){}
  obj[structKey] = value;
  localStorage.setItem(RMES_CAP_KEY, JSON.stringify(obj));
}
/* Sistema lineare deviazione × peso (sostituisce le soglie discrete).
   - idx è già il rapporto cur/reference (es. occ_cur / occ_stly)
   - dev = (idx - 1), clampato a [-0.50, +0.50]
   - per fattori "invertiti" (budget, compset) si nega il dev
   Ritorna la deviazione finale 'dev' (un numero, non un moltiplicatore).
*/
function computeDeviation(idx, factorKey){
  if (idx == null || !isFinite(idx)) return 0;
  let dev = idx - 1;  // es. cur/stly = 1.40 → dev = +0.40 (sto vendendo il 40% in più)
  if (factorKey === 'budget' || factorKey === 'comp') dev = -dev;
  if (dev > 0.50) dev = 0.50;
  if (dev < -0.50) dev = -0.50;
  return dev;
}
/* Applica il cap totale alla somma Σ(deviazione × peso) e restituisce il moltiplicatore finale.
   Esempio: sumDev = +0.18, cap = 0.25 → totalDev = +0.18 → mult = 1.18
            sumDev = +0.45, cap = 0.25 → clampato a +0.25 → mult = 1.25
*/
function applyTotalCap(sumDev, capValue){
  const c = (capValue == null || !isFinite(capValue)) ? 0.40 : capValue;
  let d = sumDev;
  if (d > c) d = c;
  if (d < -c) d = -c;
  return { mult: 1 + d, clampedDev: d, hitCap: (Math.abs(sumDev) > c) };
}
let RMES_TH_ALL = (function(){
  function clone(){
    const out = {};
    for (const k of ['occ','price','pace','budget','comp','airdna']){
      out[k] = Object.assign({}, RMES_TH_DEFAULT[k]);
    }
    return out;
  }
  function emptyAll(){ return { firenze: clone(), condotta: clone(), alfani: clone() }; }
  try {
    const raw = localStorage.getItem(RMES_TH_KEY);
    if (raw){
      const parsed = JSON.parse(raw);
      const out = emptyAll();
      for (const s of ['firenze','condotta','alfani','davids']){
        if (parsed[s]){
          for (const k of ['occ','price','pace','budget','comp','airdna']){
            if (parsed[s][k]) out[s][k] = Object.assign({}, RMES_TH_DEFAULT[k], parsed[s][k]);
          }
        }
      }
      return out;
    }
    const oldRawV2 = localStorage.getItem('rmes_thresholds_per_struct_v2');
    if (oldRawV2){
      const parsed = JSON.parse(oldRawV2);
      const out = emptyAll();
      for (const s of ['firenze','condotta','alfani','davids']){
        if (parsed[s]){
          for (const k of ['occ','price','pace','comp','airdna']){
            if (parsed[s][k]) out[s][k] = Object.assign({}, RMES_TH_DEFAULT[k], parsed[s][k]);
          }
        }
      }
      return out;
    }
    const oldRaw = localStorage.getItem('rmes_thresholds_v1');
    if (oldRaw){
      const oldTh = JSON.parse(oldRaw);
      const seed = clone();
      for (const k of ['occ','price','pace','comp','airdna']){
        if (oldTh[k]) seed[k] = Object.assign({}, RMES_TH_DEFAULT[k], oldTh[k]);
      }
      return {
        firenze:  JSON.parse(JSON.stringify(seed)),
        condotta: JSON.parse(JSON.stringify(seed)),
        alfani:   JSON.parse(JSON.stringify(seed)),
      };
    }
  } catch(e){}
  return emptyAll();
})();
function saveRmesThresholds(){
  try { localStorage.setItem(RMES_TH_KEY, JSON.stringify(RMES_TH_ALL)); } catch(e){}
}
function resetRmesThresholds(structKey){
  function clone(){
    const out = {};
    for (const k of ['occ','price','pace','budget','comp','airdna']) out[k] = Object.assign({}, RMES_TH_DEFAULT[k]);
    return out;
  }
  if (structKey){
    RMES_TH_ALL[structKey] = clone();
  } else {
    RMES_TH_ALL = { firenze: clone(), condotta: clone(), alfani: clone() };
  }
  saveRmesThresholds();
}
function getCurrentThresholds(){
  const sel = (typeof CURRENT_STRUCT !== 'undefined') ? CURRENT_STRUCT : 'condotta';
  if (sel === 'both') return RMES_TH_ALL.condotta;
  return RMES_TH_ALL[sel] || RMES_TH_ALL.condotta;
}
/* Vincola input nel range valido */
function clampMult(v){
  v = parseFloat(v);
  if (!isFinite(v)) return 1.00;
  if (v < 0.5) return 0.5;
  if (v > 1.5) return 1.5;
  return v;
}
function clampBreakpoint(v){
  v = parseFloat(v);
  if (!isFinite(v) || v <= 0) return 1.0;
  if (v > 10) return 10;
  return v;
}
/* SOSTITUITO: ora usa sistema lineare deviazione × peso (no più soglie).
   Ritorna 1 + deviazione, così il codice esistente (somma pesata) produce direttamente
   il moltiplicatore finale corretto via Σ wX × (1 + dev_X) = 1 + Σ wX × dev_X.
   N.B. Il cap totale viene applicato a parte (vedi applyTotalCap), perché qui non
   conosciamo ancora i pesi degli altri fattori. */
function applyThresholds(idx, factorKey){
  return 1 + computeDeviation(idx, factorKey);
}
function aggSellStrategy(sel, startYmdNum, rangeDays, pickupDaysAgo){
  const keys = new Set(structKeysFor(sel));
  const startDate = ymdToDate(startYmdNum);
  const snapDate = new Date(TODAY); snapDate.setHours(0,0,0,0);
  snapDate.setDate(snapDate.getDate() - pickupDaysAgo);
  const snapYmd = ymd(snapDate);
  const stlyToday = new Date(TODAY); stlyToday.setHours(0,0,0,0);
  stlyToday.setDate(stlyToday.getDate() - 364);
  const stlyTodayYmd = ymd(stlyToday);
  const snapStly = new Date(stlyToday); snapStly.setDate(snapStly.getDate() - pickupDaysAgo);
  const snapStlyYmd = ymd(snapStly);
  const bucketsCur  = {}; // confermate, OTB attuale
  const bucketsCurByRT = {}; // {ymd: {rt: rn_venduti}} — per disponibilità per RT
  const bucketsCurByRTRev = {}; // {ymd: {rt: rev_venduto}} — per ADR per RT
  const bucketsSnap = {}; // confermate alla snapshot
  const bucketsStly = {}; // STLY (-364), filtrato per bookYmd <= stlyTodayYmd
  const bucketsStlyByRT = {}; // {ymd: {rt: rn}} STLY per RT
  const bucketsStlyByRTRev = {}; // {ymd: {rt: rev}} STLY per RT
  const bucketsSnapStly = {}; // STLY snapshot: confermate STLY filtrate per bookYmd <= (stlyTodayYmd - pickupDaysAgo)
  const bucketsFinalLy = {}; // FINAL LY (-364): tutte le prenotazioni 2025 senza filtro pari-data
  const bucketsFinalLyOta = {}; // FINAL LY: RN su canali OTA (per calcolo Markup OTA)
  const bucketsCancel = {}; // ymd -> {rev, rn} cancellate avvenute nel pickup window
  const pkRowsByDay = {};   // pickup confermate (lordo) — cur
  const pkRowsStlyByDay = {}; // pickup STLY confermate — bookYmd nel pickup window STLY, stay shiftato +364
  const cancelRowsByDay = {}; // cancellate del pickup window cur
  const cancelRowsStlyByDay = {}; // cancellate del pickup window STLY (-364)
  const _rtFilter = (typeof SELL_RT_FILTER !== 'undefined') ? SELL_RT_FILTER : null;
  const _allRoomsByRT = (typeof structRoomsFor === 'function') ? structRoomsFor(sel) : null;
  const rooms = (_rtFilter && _allRoomsByRT && _allRoomsByRT[_rtFilter] != null)
    ? _allRoomsByRT[_rtFilter]
    : structRoomsTotal(sel);
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (!keys.has(b.struct)) continue;
    if (b.bookYmd > TODAY_YMD) continue;
    if (_rtFilter && b.room !== _rtFilter) continue;
    const isPickup = (b.bookYmd > snapYmd && b.bookYmd <= TODAY_YMD);
    let cur = startOfDay(b.dIn);
    const end = startOfDay(b.dOut);
    while (cur < end){
      const k = ymd(cur);
      if (!bucketsCur[k]) bucketsCur[k] = {rev:0, rn:0, revBeddyEq:0};
      bucketsCur[k].rev += b.revPerNight;
      bucketsCur[k].rn  += 1;
      bucketsCur[k].revBeddyEq += b.revPerNightCaricato;  // = revPerNight / 1.12 se OTA, identico se sito diretto
      if (b.room){
        if (!bucketsCurByRT[k]) bucketsCurByRT[k] = {};
        bucketsCurByRT[k][b.room] = (bucketsCurByRT[k][b.room] || 0) + 1;
        if (!bucketsCurByRTRev[k]) bucketsCurByRTRev[k] = {};
        bucketsCurByRTRev[k][b.room] = (bucketsCurByRTRev[k][b.room] || 0) + b.revPerNight;
      }
      if (b.bookYmd <= snapYmd){
        if (!bucketsSnap[k]) bucketsSnap[k] = {rev:0, rn:0};
        bucketsSnap[k].rev += b.revPerNight;
        bucketsSnap[k].rn  += 1;
      }
      if (isPickup){
        if (!pkRowsByDay[k]) pkRowsByDay[k] = [];
        pkRowsByDay[k].push(b);
      }
      cur = addDays(cur, 1);
    }
    if (b.bookYmd <= stlyTodayYmd){
      const dInS  = addDays(b.dIn,  364);
      const dOutS = addDays(b.dOut, 364);
      const isPickupStly = (b.bookYmd > snapStlyYmd && b.bookYmd <= stlyTodayYmd);
      let cs = startOfDay(dInS);
      const ce = startOfDay(dOutS);
      while (cs < ce){
        const k = ymd(cs);
        if (!bucketsStly[k]) bucketsStly[k] = {rev:0, rn:0};
        bucketsStly[k].rev += b.revPerNight;
        bucketsStly[k].rn  += 1;
        if (b.room){
          if (!bucketsStlyByRT[k]) bucketsStlyByRT[k] = {};
          bucketsStlyByRT[k][b.room] = (bucketsStlyByRT[k][b.room] || 0) + 1;
          if (!bucketsStlyByRTRev[k]) bucketsStlyByRTRev[k] = {};
          bucketsStlyByRTRev[k][b.room] = (bucketsStlyByRTRev[k][b.room] || 0) + b.revPerNight;
        }
        if (isPickupStly){
          if (!pkRowsStlyByDay[k]) pkRowsStlyByDay[k] = [];
          pkRowsStlyByDay[k].push(b);
        }
        cs = addDays(cs, 1);
      }
    }
    if (b.bookYmd <= snapStlyYmd){
      const dInS  = addDays(b.dIn,  364);
      const dOutS = addDays(b.dOut, 364);
      let cs = startOfDay(dInS);
      const ce = startOfDay(dOutS);
      while (cs < ce){
        const k = ymd(cs);
        if (!bucketsSnapStly[k]) bucketsSnapStly[k] = {rev:0, rn:0};
        bucketsSnapStly[k].rev += b.revPerNight;
        bucketsSnapStly[k].rn  += 1;
        cs = addDays(cs, 1);
      }
    }
    {
      const dInS  = addDays(b.dIn,  364);
      const dOutS = addDays(b.dOut, 364);
      const isOTA = (b.channelMarkup && b.channelMarkup > 0);
      let cs = startOfDay(dInS);
      const ce = startOfDay(dOutS);
      while (cs < ce){
        const k = ymd(cs);
        if (!bucketsFinalLy[k]) bucketsFinalLy[k] = {rev:0, rn:0};
        bucketsFinalLy[k].rev += b.revPerNight;
        bucketsFinalLy[k].rn  += 1;
        if (isOTA){
          if (!bucketsFinalLyOta[k]) bucketsFinalLyOta[k] = {rn:0};
          bucketsFinalLyOta[k].rn += 1;
        }
        cs = addDays(cs, 1);
      }
    }
  }
  for (const b of BOOKINGS){
    if (!b.cancelled) continue;
    if (!keys.has(b.struct)) continue;
    if (!b.cancelYmd) continue;
    if (b.bookYmd > TODAY_YMD) continue;
    if (_rtFilter && b.room !== _rtFilter) continue;
    const wasInSnap = (b.bookYmd <= snapYmd && b.cancelYmd > snapYmd);
    const cancelledInPickup = (b.cancelYmd > snapYmd && b.cancelYmd <= TODAY_YMD && b.bookYmd <= snapYmd);
    if (!wasInSnap && !cancelledInPickup) continue;
    let cur = startOfDay(b.dIn);
    const end = startOfDay(b.dOut);
    while (cur < end){
      const k = ymd(cur);
      if (wasInSnap){
        if (!bucketsSnap[k]) bucketsSnap[k] = {rev:0, rn:0};
        bucketsSnap[k].rev += b.revPerNight;
        bucketsSnap[k].rn  += 1;
      }
      if (cancelledInPickup){
        if (!bucketsCancel[k]) bucketsCancel[k] = {rev:0, rn:0};
        bucketsCancel[k].rev += b.revPerNight;
        bucketsCancel[k].rn  += 1;
        if (!cancelRowsByDay[k]) cancelRowsByDay[k] = [];
        cancelRowsByDay[k].push(b);
      }
      cur = addDays(cur, 1);
    }
    const cancelledInPickupStly = (b.cancelYmd > snapStlyYmd && b.cancelYmd <= stlyTodayYmd && b.bookYmd <= snapStlyYmd);
    if (cancelledInPickupStly){
      const dInS  = addDays(b.dIn,  364);
      const dOutS = addDays(b.dOut, 364);
      let cs = startOfDay(dInS);
      const ce = startOfDay(dOutS);
      while (cs < ce){
        const k = ymd(cs);
        if (!cancelRowsStlyByDay[k]) cancelRowsStlyByDay[k] = [];
        cancelRowsStlyByDay[k].push(b);
        cs = addDays(cs, 1);
      }
    }
  }
  const rows = [];
  let cum = { cur:{rev:0,rn:0}, pk:{rev:0,rn:0}, stly:{rev:0,rn:0}, cancel:{rev:0,rn:0}, pkStly:{rev:0,rn:0} };
  for (let i=0; i<rangeDays; i++){
    const d = addDays(startDate, i);
    const k = ymd(d);
    const c = bucketsCur[k]  || {rev:0, rn:0};
    const s = bucketsSnap[k] || {rev:0, rn:0};
    const t = bucketsStly[k] || {rev:0, rn:0};
    const tSnap = bucketsSnapStly[k] || {rev:0, rn:0};
    const fly = bucketsFinalLy[k] || {rev:0, rn:0};
    const x = bucketsCancel[k] || {rev:0, rn:0};
    const pkRn  = c.rn  - s.rn;
    const pkRev = c.rev - s.rev;
    const pkRnStly  = t.rn  - tSnap.rn;
    const pkRevStly = t.rev - tSnap.rev;
    const pkRnLordo  = pkRn + x.rn;
    const pkRevLordo = pkRev + x.rev;
    const pkAdr = pkRn>0 ? pkRev/pkRn : (pkRn<0 ? pkRev/pkRn : NaN);
    const pkAdrStly = pkRnStly>0 ? pkRevStly/pkRnStly : (pkRnStly<0 ? pkRevStly/pkRnStly : NaN);
    cum.cur.rev  += c.rev; cum.cur.rn  += c.rn;
    cum.pk.rev   += pkRev; cum.pk.rn   += pkRn;
    cum.stly.rev += t.rev; cum.stly.rn += t.rn;
    cum.pkStly.rev += pkRevStly; cum.pkStly.rn += pkRnStly;
    cum.cancel.rev += x.rev; cum.cancel.rn += x.rn;
    rows.push({
      date: d, ymd: k,
      y: d.getFullYear(), mo: d.getMonth()+1, day: d.getDate(),
      dow: d.getDay(),
      cap: rooms,
      curRn: c.rn, curRev: c.rev,
      curRevBeddyEq: c.revBeddyEq || 0,  // revenue OTB con markup OTA sottratto (Beddy_eq)
      curOcc: rooms>0 ? c.rn/rooms : 0,
      curAdr: c.rn>0 ? c.rev/c.rn : NaN,
      curAdrBeddyEq: c.rn>0 ? (c.revBeddyEq||0)/c.rn : NaN,  // ADR OTB Beddy_eq
      pkRn, pkRev,
      pkAdr,
      pkRnStly, pkRevStly, pkAdrStly,
      pkRnLordo, pkRevLordo,         // nuove prenotazioni (lordo, prima di cancellate)
      cancelRn: x.rn, cancelRev: x.rev,  // cancellate nel pickup
      pkRows: pkRowsByDay[k] || [],
      pkRowsStly: pkRowsStlyByDay[k] || [],
      cancelRows: cancelRowsByDay[k] || [],
      cancelRowsStly: cancelRowsStlyByDay[k] || [],
      stlyRn: t.rn, stlyRev: t.rev,
      stlyAdr: t.rn>0 ? t.rev/t.rn : NaN,
      stlyOcc: rooms>0 ? t.rn/rooms : 0,
      finalLyRn: fly.rn, finalLyRev: fly.rev,
      finalLyAdr: fly.rn>0 ? fly.rev/fly.rn : NaN,
      finalLyOcc: rooms>0 ? fly.rn/rooms : 0,
      finalLyOtaRn: (bucketsFinalLyOta[k] || {rn:0}).rn,
      finalLyOtaShare: fly.rn>0 ? ((bucketsFinalLyOta[k] || {rn:0}).rn / fly.rn) : NaN,
      curByRT: bucketsCurByRT[k] || {},  // sold RN per RT
      curByRTRev: bucketsCurByRTRev[k] || {},  // rev per RT
      stlyByRT: bucketsStlyByRT[k] || {},  // STLY RN per RT
      stlyByRTRev: bucketsStlyByRTRev[k] || {},  // STLY rev per RT
    });
  }
  const totRn = cum.cur.rn, totRev = cum.cur.rev;
  const totCap = rooms * rangeDays;
  const totals = {
    cap: totCap,
    curRn: totRn, curRev: totRev,
    curOcc: totCap>0 ? totRn/totCap : 0,
    curAdr: totRn>0 ? totRev/totRn : NaN,
    pkRn: cum.pk.rn, pkRev: cum.pk.rev,
    pkAdr: cum.pk.rn>0 ? cum.pk.rev/cum.pk.rn : NaN,
    pkRnStly: cum.pkStly.rn, pkRevStly: cum.pkStly.rev,
    pkAdrStly: cum.pkStly.rn>0 ? cum.pkStly.rev/cum.pkStly.rn : NaN,
    stlyRn: cum.stly.rn, stlyRev: cum.stly.rev,
    stlyOcc: totCap>0 ? cum.stly.rn/totCap : 0,
    stlyAdr: cum.stly.rn>0 ? cum.stly.rev/cum.stly.rn : NaN,
  };
  return { rows, totals, snapYmd, snapStlyYmd, stlyTodayYmd, startYmd: startYmdNum, rangeDays, pickupDaysAgo, structSel: sel };
}
/* helper to build a YYYY-MM-DD string from YMD num */
function ymdNumToIso(n){
  const y = Math.floor(n/10000), m = Math.floor((n/100)%100), d = n%100;
  return y + '-' + pad2(m) + '-' + pad2(d);
}
/* helper to convert <input type=date> string YYYY-MM-DD to YMD num */
function isoToYmdNum(iso){
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return (+m[1])*10000 + (+m[2])*100 + (+m[3]);
}
/* helper: convert YMD num to Date */
function ymdToDate(n){
  const y = Math.floor(n/10000), m = Math.floor((n/100)%100), d = n%100;
  return new Date(y, m-1, d);
}
/* Cache pace aggregato strutture (calcolato 1 volta, riusato da computeRMESPriceMap di
   ogni struttura come fallback intermedio quando il pace month-specific di struttura non c'è).
   Le strutture sono nella stessa area (Firenze centro) e fascia qualità/price simile,
   quindi il pace aggregato è un proxy ragionevole della domanda di mercato locale per quel mese. */
let _PACE_AGG_BOTH_CACHE = null;
function _getPaceAggBoth(){
  if (_PACE_AGG_BOTH_CACHE) return _PACE_AGG_BOTH_CACHE;
  if (typeof aggPickup !== 'function') return null;
  const pkAgg = aggPickup('both');
  const PACE_WEEK_INDEXES = [0, 1, 2, 3];
  const _PW = (typeof PACE_WEEK_WEIGHTS !== 'undefined' && PACE_WEEK_WEIGHTS.length===4) ? PACE_WEEK_WEIGHTS : [0.10,0.20,0.30,0.40];
  const byStayMonth = {};  // ym → { rawMult, ratio, pickupCur, pickupStly }
  if (pkAgg && pkAgg.sm && pkAgg.smS){
    const allMonths = new Set([...Object.keys(pkAgg.sm), ...Object.keys(pkAgg.smS)]);
    for (const ym of allMonths){
      let mCur = 0, mStly = 0;          // RN reali (per display)
      let wCur = 0, wStly = 0;          // RN pesati (per il ratio)
      for (const i of PACE_WEEK_INDEXES){
        if (pkAgg.sm[ym] && pkAgg.sm[ym][i]) { mCur  += pkAgg.sm[ym][i].rn;  wCur  += pkAgg.sm[ym][i].rn  * _PW[i]; }
        if (pkAgg.smS[ym] && pkAgg.smS[ym][i]) { mStly += pkAgg.smS[ym][i].rn; wStly += pkAgg.smS[ym][i].rn * _PW[i]; }
      }
      if (mStly > 0 && mCur > 0){
        const ratio = (wStly > 0) ? (wCur / wStly) : (mCur / mStly);
        const rawMult = (typeof applyThresholds === 'function') ? applyThresholds(ratio, 'pace') : 1;
        byStayMonth[ym] = { rawMult, ratio, pickupCur: mCur, pickupStly: mStly };
      }
    }
  }
  _PACE_AGG_BOTH_CACHE = byStayMonth;
  return byStayMonth;
}
function _invalidatePaceAggCache(){ _PACE_AGG_BOTH_CACHE = null; if (typeof _APD_CACHE !== 'undefined') _APD_CACHE = {}; if (typeof _EXP_SUPP_AGG_CACHE !== 'undefined') _EXP_SUPP_AGG_CACHE = {}; if (typeof _ANCHOR_LY_CACHE !== 'undefined') _ANCHOR_LY_CACHE = {}; }
/* ============================================================
   computeRMESPriceMap(sel, startYmd, rangeDays)
   ============================================================
   Compute the RMES price for each day del range.
   SORGENTE DEL PREZZO (importante):
   1. SEMPRE Foundation Pricing del giorno (storico LY × target × pace × curva × cap × floor)
   2. SOLO se Foundation non riesce (rarissimo, dati LY assenti) → fallback cascata vecchia
      (My Expedia → Compset → OTB → Final LY)
   Sopra la sorgente si applica il moltiplicatore composto dai 5 fattori:
   prezzo_finale = sorgente × (1 + Σ peso_i × deviazione_i), capped a ±cap totale.
   Per le RT non-base: sorgente = price baseRT + supplemento storico mensile della RT.
   Ritorna: { ymdNum: { price, source, suppApplied, multFinale, pricesByRT, mlosByRT, multsByRT } }
   Usa SELL_RMES_W (pesi correnti per struttura).
*/
let _RMESMAP_TICK = {};  // cache per-render di computeRMESPriceMap, svuotata a inizio renderAll (zero rischio stantio)
let _SELL_RENDER_TOKEN = 0;  // token per annullare render Sell Strategy obsoleti (cambio struttura rapido)

/* Event Factor — per-event-name weight in localStorage (-10..+10 %), applied as price multiplier on
   days where EVENTS[ymd] matches the event name. Returns 1.0 if no event or no weight set. */
const EVENT_WEIGHTS_KEY = 'rmes_event_weights_v1';
function _getEventWeights(){
  try { const raw = localStorage.getItem(EVENT_WEIGHTS_KEY); return raw ? JSON.parse(raw) : {}; }
  catch(e){ return {}; }
}
function _setEventWeights(obj){
  try { localStorage.setItem(EVENT_WEIGHTS_KEY, JSON.stringify(obj || {})); } catch(e){}
}
function _getEventBoost(ymd){
  if (typeof EVENTS === 'undefined' || !EVENTS[ymd]) return 1.0;
  const label = EVENTS[ymd]; if (!label) return 1.0;
  const weights = _getEventWeights();
  const pct = weights[label]; if (pct == null || !isFinite(+pct)) return 1.0;
  return 1 + (+pct)/100;
}
/* List all distinct event labels that appear in EVENTS, sorted alphabetically */
function _listEventLabels(){
  if (typeof EVENTS === 'undefined') return [];
  const s = new Set();
  for (const k in EVENTS){ if (EVENTS[k]) s.add(EVENTS[k]); }
  return Array.from(s).sort((a,b)=>a.localeCompare(b));
}

function computeRMESPriceMap(sel, startYmd, rangeDays){
  const out = {};
  if (sel === 'both') return out;  // RMES non significativo aggregato
  const _rmKey = sel + '|' + startYmd + '|' + rangeDays;
  if (_RMESMAP_TICK && _RMESMAP_TICK[_rmKey] !== undefined) return _RMESMAP_TICK[_rmKey];
  const _structFloor = (typeof fp_getFloor === 'function') ? fp_getFloor(sel) : 0;
  const A = aggSellStrategy(sel, startYmd, rangeDays, 1);
  const _occByMonth = {};      // ym → {curRn, stlyRn, cap_sum, curOcc, stlyOcc}
  for (const r of A.rows){
    const ym = `${r.y}-${pad2(r.mo)}`;
    if (!_occByMonth[ym]) _occByMonth[ym] = {curRn:0, stlyRn:0, capSum:0};
    _occByMonth[ym].curRn  += r.curRn || 0;
    _occByMonth[ym].stlyRn += r.stlyRn || 0;
    _occByMonth[ym].capSum += r.cap || 0;
  }
  for (const ym in _occByMonth){
    const o = _occByMonth[ym];
    o.curOcc  = o.capSum > 0 ? o.curRn  / o.capSum : 0;
    o.stlyOcc = o.capSum > 0 ? o.stlyRn / o.capSum : 0;
  }
  let _beddyExpediaRatio = null;
  if ((sel === 'firenze' || sel === 'condotta') && typeof beddyExpediaRatio === 'function'){
    const corr = beddyExpediaRatio(sel, 90);
    if (corr && corr.n >= 5) _beddyExpediaRatio = corr.median;
  }
  let _paceMult = 1, _paceRatio = null;
  const _paceMultByRT = {};         // legacy
  const _paceMultByStayMonth = {};  // paceMult per mese di soggiorno
  if (typeof aggPickup === 'function'){
    const pkAgg = aggPickup(sel);
    let curRn = 0, stlyRn = 0;
    const PACE_WEEK_INDEXES = [0, 1, 2, 3];  // tutte le 4 settimane (28 days)
    for (const rt of pkAgg.rtAxis){
      let rtCur = 0, rtStly = 0;
      for (const i of PACE_WEEK_INDEXES){
        if (pkAgg.rt[rt] && pkAgg.rt[rt][i]) rtCur  += pkAgg.rt[rt][i].rn;
        if (pkAgg.rtS[rt] && pkAgg.rtS[rt][i]) rtStly += pkAgg.rtS[rt][i].rn;
      }
      curRn  += rtCur;
      stlyRn += rtStly;
      _paceMultByRT[rt] = (rtStly > 0 && rtCur > 0) ? applyThresholds(rtCur / rtStly, 'pace') : 1;
    }
    if (stlyRn > 0 && curRn > 0){
      _paceRatio = curRn / stlyRn;
      _paceMult = applyThresholds(_paceRatio, 'pace');
    }
    const _paceStateByStayMonth = {};  // ym → {state, rawMult, ratio}
    if (pkAgg.sm && pkAgg.smS){
      const allMonths = new Set([...Object.keys(pkAgg.sm), ...Object.keys(pkAgg.smS)]);
      for (const ym of allMonths){
        let mCur = 0, mStly = 0;
        for (const i of PACE_WEEK_INDEXES){
          if (pkAgg.sm[ym] && pkAgg.sm[ym][i]) mCur  += pkAgg.sm[ym][i].rn;
          if (pkAgg.smS[ym] && pkAgg.smS[ym][i]) mStly += pkAgg.smS[ym][i].rn;
        }
        if (mStly > 0 && mCur > 0){
          const paceRatio = mCur / mStly;
          const rawMult = applyThresholds(paceRatio, 'pace');
          if (paceRatio >= 1){
            _paceStateByStayMonth[ym] = {state:'tutto_su', rawMult, ratio:paceRatio, pickupCur: mCur, pickupStly: mStly};
            _paceMultByStayMonth[ym] = rawMult;  // legacy field (per backward compat)
          } else {
            const occMo = _occByMonth[ym];
            if (occMo && occMo.curOcc >= occMo.stlyOcc && occMo.curOcc > 0){
              _paceStateByStayMonth[ym] = {state:'ambiguo', rawMult, ratio:paceRatio, pickupCur: mCur, pickupStly: mStly};
              _paceMultByStayMonth[ym] = 1;  // placeholder per backward compat
            } else {
              _paceStateByStayMonth[ym] = {state:'tutto_giù', rawMult, ratio:paceRatio, pickupCur: mCur, pickupStly: mStly};
              _paceMultByStayMonth[ym] = rawMult;
            }
          }
        } else {
          _paceStateByStayMonth[ym] = {state:'fallback', rawMult:_paceMult, ratio:null, pickupCur: mCur, pickupStly: mStly};
          _paceMultByStayMonth[ym] = _paceMult;
        }
      }
    }
  }
  function _paceMultForRow(r, verbose){
    const ym = `${r.y}-${pad2(r.mo)}`;
    const st = (typeof _paceStateByStayMonth !== 'undefined') ? _paceStateByStayMonth[ym] : null;
    if (!st){
      const aggPaceByMonth = (typeof _getPaceAggBoth === 'function') ? _getPaceAggBoth() : null;
      const aggForMonth = aggPaceByMonth ? aggPaceByMonth[ym] : null;
      if (aggForMonth && isFinite(aggForMonth.rawMult)){
        const aggRatio = aggForMonth.ratio;
        const aggRaw = aggForMonth.rawMult;
        let aggMult = aggRaw;
        let aggState = 'fallback_agg_tutto_su';
        let aggSource = 'properties-aggregate pace (month ' + ym + ', ' + aggForMonth.pickupCur + ' RN vs ' + aggForMonth.pickupStly + ' RN STLY)';
        if (aggRatio >= 1){
          aggMult = aggRaw;  // alza
          aggState = 'fallback_agg_tutto_su';
        } else {
          const occMo = _occByMonth[ym];
          if (occMo && occMo.curOcc >= occMo.stlyOcc && occMo.curOcc > 0){
            if (r.curOcc != null && r.curOcc >= 0.90){
              aggMult = 1;
              aggState = 'fallback_agg_ambiguous_neutralized_OCC90';
              aggSource += ' · day OCC≥90%: neutralized';
            } else {
              const dev = aggRaw - 1;
              aggMult = 1 + dev * 0.5;
              aggState = 'fallback_agg_ambiguo_freno_50pct';
              aggSource += ' · ambiguous month, 50% brake';
            }
          } else {
            aggMult = aggRaw;
            aggState = 'fallback_agg_tutto_giù';
          }
        }
        return verbose ? {
          mult: aggMult, naReason: null, state: aggState, rawMult: aggRaw,
          ratio: aggRatio, pickupCur: aggForMonth.pickupCur, pickupStly: aggForMonth.pickupStly,
          source: aggSource, fromAggregate: true
        } : aggMult;
      }
      const fbDev = (_paceMult != null && isFinite(_paceMult)) ? Math.abs(_paceMult - 1) : 0;
      if (fbDev > 0.15){
        return verbose ? {
          mult: 1, naReason: 'monthly pace unavailable for property or properties-aggregate; extreme annual fallback (' + ((_paceMult-1)*100).toFixed(0) + '%): factor neutralized',
          state: 'neutralizzato_no_dati', rawMult: 1,
          source: 'pace 4w month-specific unavailable for this property or the others · property annual fallback would be ' + (_paceMult>1?'+':'') + ((_paceMult-1)*100).toFixed(0) + '% (extreme): factor neutralized and weight redistributed to the others'
        } : 1;
      }
      return verbose ? {
        mult: _paceMult, naReason: null, state: 'fallback_annuale_struct', rawMult: _paceMult,
        source: 'annual pace of this property (month-specific unavailable for this property or the other 3, but the annual fallback is moderate)'
      } : _paceMult;
    }
    if (st.state === 'ambiguo'){
      if (r.curOcc != null && r.curOcc >= 0.90){
        return verbose ? { mult: 1, naReason: null, state: 'ambiguo_neutralizzato_OCC90', rawMult: st.rawMult, pickupCur: st.pickupCur, pickupStly: st.pickupStly, source: 'ambiguous month but day with OCC ≥90%, neutralized to 1.0' } : 1;
      }
      const dev = st.rawMult - 1;
      const mFinal = 1 + dev * 0.5;
      return verbose ? { mult: mFinal, naReason: null, state: 'ambiguo_freno_50pct', rawMult: st.rawMult, pickupCur: st.pickupCur, pickupStly: st.pickupStly, source: 'ambiguous month (pace down but month OCC above LY), 50% brake' } : mFinal;
    }
    return verbose ? { mult: st.rawMult, naReason: null, state: st.state, rawMult: st.rawMult, pickupCur: st.pickupCur, pickupStly: st.pickupStly, source: st.state === 'tutto_giù' ? 'month declining (pace and OCC ↓), full brake' : (st.state === 'tutto_su' ? 'month rising (pickup ≥ LY), raise' : 'pace current month vs STLY') } : st.rawMult;
  }
  const AIRDNA_TOTAL_LISTINGS = 2948;
  const _airdnaIdx = {};
  let _airdnaAvg = 0;
  let _airdnaQ_lo = null, _airdnaQ_hi = null;  // quantili dinamici in base ai breakpoint utente
  if (typeof MARKET_RATES !== 'undefined' && MARKET_RATES.length){
    let sum = 0, n = 0;
    const values = [];
    for (const m of MARKET_RATES){
      if (m.ymd >= TODAY_YMD){
        const idx = m.listings / AIRDNA_TOTAL_LISTINGS;
        _airdnaIdx[m.ymd] = idx;
        values.push(idx);
        sum += idx; n += 1;
      }
    }
    _airdnaAvg = n > 0 ? sum / n : 0;
    if (values.length){
      values.sort((a,b) => a-b);
      function pct(p){
        const i = Math.max(0, Math.min(values.length-1, Math.floor(p * (values.length-1))));
        return values[i];
      }
      _airdnaQ_lo = pct(getCurrentThresholds().airdna.lo);
      _airdnaQ_hi = pct(getCurrentThresholds().airdna.hi);
    }
  }
  let _suppData = null, _inventoryByRT = null, _rtCheapToExp = null;
  if (typeof aggPricingDaily === 'function'){
    try {
      const Apri = aggPricingDaily(sel, startYmd, 1);
      _suppData = {
        supp: Apri.supplementoStagione,
        highSeason: new Set(Apri.highSeason),
        baseRT: Apri.baseRT,
        rtList: Apri.rtList,
      };
      _inventoryByRT = structRoomsFor(sel);
      _rtCheapToExp = [Apri.baseRT].concat(
        Apri.rtList.filter(r => r !== Apri.baseRT)
          .sort((a,b) => (Apri.supplementoStagione[a]?.alta || 0) - (Apri.supplementoStagione[b]?.alta || 0))
      );
    } catch(e){ _suppData = null; }
  }
  function _cheapestAvailableRT(row){
    if (!_rtCheapToExp || !_inventoryByRT) return null;
    for (const rt of _rtCheapToExp){
      const sold = (row.curByRT && row.curByRT[rt]) ? row.curByRT[rt] : 0;
      const avail = (_inventoryByRT[rt] || 0) - sold;
      if (avail > 0) return rt;
    }
    return null;
  }
  function _supplementForRT(rt, month){
    if (!_suppData || rt === _suppData.baseRT) return 0;
    const s = _suppData.supp[rt];
    if (!s) return 0;
    return _suppData.highSeason.has(month) ? s.alta : s.bassa;
  }
  const W = getCurrentWeights();
  const wSum = (W.occ + W.price + W.comp + W.pace + (W.budget||0) + W.airdna) || 1;
  const wOcc = W.occ/wSum, wPrice = W.price/wSum, wPace = W.pace/wSum, wComp = W.comp/wSum, wAir = W.airdna/wSum;
  const wA = wOcc, wB = wPrice, wC = wPace, wD = wComp, wE = wAir;
  const wBudget = (W.budget != null ? W.budget : 0) / wSum;
  const _invByRT = (_inventoryByRT || {});
  const _rtList = Object.keys(_invByRT);
  const _RT_COLOR_PALETTE = ['#3b6b9a','#a83b3b','#4a7c59','#c4823b','#8e5fa8','#3b6b6b','#c47d7d','#5e8a3a'];
  const _RT_COLORS = {};
  _rtList.forEach((rt, i) => { _RT_COLORS[rt] = _RT_COLOR_PALETTE[i % _RT_COLOR_PALETTE.length]; });
  for (const r of A.rows){
    const exp2 = (typeof expContext === 'function') ? expContext(r.ymd, sel) : null;
    const ym = r.y * 100 + r.mo;
    let _sourceExpediaBeddyEq = null;
    if (exp2 && exp2.myPriceExpedia != null){
      _sourceExpediaBeddyEq = exp2.myPriceExpedia / fp_expToBeddyDivisor(sel);
    }
    const _mults_byRT = {};
    function _occMultForRT(rt){
      const curRn = (r.curByRT[rt] || 0);
      const stlyRn = (r.stlyByRT[rt] || 0);
      const cap = _invByRT[rt] || 0;
      if (cap <= 0) return 1;
      const curOcc = curRn / cap;
      const stlyOcc = stlyRn / cap;
      if (stlyOcc > 0 && curOcc > 0){
        return applyThresholds(curOcc / stlyOcc, 'occ');
      }
      return 1;
    }
    function _priceMultForRT(rt){
      const curRn = (r.curByRT[rt] || 0);
      const curRev = (r.curByRTRev[rt] || 0);
      const stlyRn = (r.stlyByRT[rt] || 0);
      const stlyRev = (r.stlyByRTRev[rt] || 0);
      const curAdr = curRn > 0 ? curRev / curRn : 0;
      const stlyAdr = stlyRn > 0 ? stlyRev / stlyRn : 0;
      if (stlyAdr > 0 && curAdr > 0){
        return applyThresholds(curAdr / stlyAdr, 'price');
      }
      return 1;
    }
    function _paceMultForRT(rt){
      return _paceMultForRow(r);  // r è del loop esterno; tutti gli RT dello stesso giorno hanno lo stesso pace mese
    }
    function _budgetMultForRT(rt){
      if (_sourceExpediaBeddyEq == null) return 1;
      const adrBudgetRt = (typeof budgetAdrByRT === 'function') ? budgetAdrByRT(sel, ym, rt) : 0;
      if (!adrBudgetRt || adrBudgetRt <= 0) return 1;
      const D_idx = _sourceExpediaBeddyEq / adrBudgetRt;
      return applyThresholds(D_idx, 'budget');
    }
    let occ_mult = 1, A_idx = null, _A_naReason = null;
    if (r.stlyOcc > 0 && r.curOcc > 0){
      A_idx = r.curOcc / r.stlyOcc;
      occ_mult = applyThresholds(A_idx, 'occ');
    } else {
      _A_naReason = (r.stlyOcc <= 0 && r.curOcc <= 0) ? 'OCC today and STLY both zero'
                  : (r.stlyOcc <= 0) ? 'OCC STLY (day -364) not available'
                  : 'OCC today is zero';
    }
    let price_mult = 1, B_idx = null, _B_dev_signed = 0, _B_case = null, _B_naReason = null;
    if (r.stlyAdr > 0 && r.curAdr > 0 && isFinite(r.curAdr) && isFinite(r.stlyAdr)){
      B_idx = r.curAdr / r.stlyAdr;
      const adrDev = B_idx - 1;  // es. cur=180, STLY=195 → -0.077
      if (adrDev < 0){
        _B_dev_signed = -adrDev;  // positivo
        _B_case = 'recover_below_LY';
      } else {
        if (r.stlyOcc > 0 && r.curOcc > 0 && r.curOcc >= r.stlyOcc){
          _B_dev_signed = 0;
          _B_case = 'all_good';
        } else {
          const tgPct = (typeof fp_getTargetGrowth === 'function') ? fp_getTargetGrowth(sel, r.mo) : 5;
          const tgFrac = (tgPct || 0) / 100;
          const effective = Math.max(0, adrDev - tgFrac);  // mai negativo → mai dev positivo nel Caso 3
          _B_dev_signed = -effective;  // dev ≤ 0 (freno o neutro)
          _B_case = 'brake_softened';
        }
      }
      if (_B_dev_signed > 0.50) _B_dev_signed = 0.50;
      if (_B_dev_signed < -0.50) _B_dev_signed = -0.50;
      price_mult = 1 + _B_dev_signed;
    } else {
      _B_naReason = (r.stlyAdr <= 0 && r.curAdr <= 0) ? 'ADR today and STLY both missing'
                  : (r.stlyAdr <= 0 || !isFinite(r.stlyAdr)) ? 'ADR STLY (day -364) not available'
                  : 'ADR today not available (0 bookings)';
    }
    const _paceResult = _paceMultForRow(r, true);  // chiedo modalità verbosa per flag n/d
    const pace_mult = (typeof _paceResult === 'object' && _paceResult !== null) ? _paceResult.mult : _paceResult;
    const _C_naReason = (typeof _paceResult === 'object' && _paceResult !== null) ? _paceResult.naReason : null;
    let budget_mult = 1, D_budget_idx = null;
    if (_sourceExpediaBeddyEq != null){
      const adrBudgetStruct = (typeof budgetMonthlyFor === 'function') ? budgetMonthlyFor(sel, ym, 'adr') : 0;
      if (adrBudgetStruct > 0){
        D_budget_idx = _sourceExpediaBeddyEq / adrBudgetStruct;
        budget_mult = applyThresholds(D_budget_idx, 'budget');
      }
    }
    let comp_mult = 1;
    let _C_compAvg = null, _C_compSource = '', _E_naReason = null;
    let _D_myBeddy = null, _D_compsetBeddy = null;
    if (exp2 && exp2.myPriceExpedia != null){
      const isoK = `${r.y}-${pad2(r.mo)}-${pad2(r.day)}`;
      _D_myBeddy = exp2.myPriceExpedia / fp_expToBeddyDivisor(sel);
      if (typeof compsetWeightedAvg === 'function'){
        const w = compsetWeightedAvg(sel, isoK, /*applyOffset=*/false);
        if (w && w.avg != null && w.avg > 0){
          _D_compsetBeddy = w.avg;
          _C_compAvg = _D_compsetBeddy;  // alias per _debug
          _C_compSource = 'weighted, no offset';
        }
      }
      if (_D_compsetBeddy == null && exp2.compsetAvg != null && exp2.compsetAvg > 0){
        _D_compsetBeddy = exp2.compsetAvg / fp_expToBeddyDivisor(sel);
        _C_compAvg = _D_compsetBeddy;
        _C_compSource = 'aritmetica (no offset)';
      }
      if (_D_compsetBeddy != null && _D_compsetBeddy > 0){
        const C_idx = _D_myBeddy / _D_compsetBeddy;
        comp_mult = applyThresholds(C_idx, 'comp');
      } else {
        _E_naReason = 'No compset competitor with a price for the day';
      }
    } else {
      _E_naReason = 'My Expedia price unavailable for the day';
    }
    let air_mult = 1, _F_naReason = null;
    const _isoK_search = `${r.y}-${pad2(r.mo)}-${pad2(r.day)}`;
    const _ymKey_search = `${r.y}-${pad2(r.mo)}`;
    const _searchCur = (typeof EXPEDIA_DATA !== 'undefined' && EXPEDIA_DATA && EXPEDIA_DATA.search_current)
      ? EXPEDIA_DATA.search_current[_isoK_search] : null;
    const _searchStatsMo = (typeof expSearchStatsByMonth === 'function') ? expSearchStatsByMonth(_ymKey_search) : null;
    if (_searchCur != null && _searchStatsMo && _searchStatsMo.p50 > 0){
      const _searchDev = (_searchCur - _searchStatsMo.p50) / _searchStatsMo.p50;
      air_mult = applyThresholds(1 + _searchDev, 'airdna');
    } else {
      _F_naReason = (_searchCur == null) ? 'Daily Expedia searches not available'
                  : 'Monthly search median not computable';
    }
    const A_mult = occ_mult, B_mult = price_mult, C_mult = comp_mult, D_mult = pace_mult, E_mult = air_mult;
    const F_mult = air_mult;  // alias per il nuovo schema ABCDEF
    function _normalizeWeights(){
      const naFlags = {
        occ:   (_A_naReason != null),
        price: (_B_naReason != null),
        pace:  (_C_naReason != null),
        comp:  (_E_naReason != null),
        air:   (_F_naReason != null),
      };
      const wRaw = { occ: wOcc, price: wPrice, pace: wPace, budget: wBudget, comp: wComp, air: wAir };
      let activeSum = wBudget;  // budget è sempre "attivo" (no naReason)
      if (!naFlags.occ)   activeSum += wOcc;
      if (!naFlags.price) activeSum += wPrice;
      if (!naFlags.pace)  activeSum += wPace;
      if (!naFlags.comp)  activeSum += wComp;
      if (!naFlags.air)   activeSum += wAir;
      if (activeSum <= 0.001) return wRaw;
      return {
        occ:    naFlags.occ   ? 0 : wOcc   / activeSum,
        price:  naFlags.price ? 0 : wPrice / activeSum,
        pace:   naFlags.pace  ? 0 : wPace  / activeSum,
        budget: wBudget / activeSum,
        comp:   naFlags.comp  ? 0 : wComp  / activeSum,
        air:    naFlags.air   ? 0 : wAir   / activeSum,
      };
    }
    const _wNorm = _normalizeWeights();
    const _multFinaleRaw = _wNorm.occ*occ_mult + _wNorm.price*price_mult + _wNorm.pace*pace_mult + _wNorm.budget*budget_mult + _wNorm.comp*comp_mult + _wNorm.air*air_mult;
    const _capStruct = (typeof getRmesCap === 'function') ? getRmesCap(sel) : 0.25;
    const _cappedStruct = applyTotalCap(_multFinaleRaw - 1, _capStruct);
    const multFinale = _cappedStruct.mult;
    for (const rt of _rtList){
      const occ_rt = occ_mult;       // OCC struttura del giorno
      const price_rt = price_mult;   // ADR struttura del giorno
      const pace_rt = pace_mult;     // Pace mese di stay (struttura)
      const budget_rt = budget_mult; // Budget struttura
      const _mfin_rt_raw = _wNorm.occ*occ_rt + _wNorm.price*price_rt + _wNorm.pace*pace_rt + _wNorm.budget*budget_rt + _wNorm.comp*comp_mult + _wNorm.air*air_mult;
      const _capRT = applyTotalCap(_mfin_rt_raw - 1, _capStruct);
      const mfin_rt = _capRT.mult;
      _mults_byRT[rt] = {
        occ_mult: occ_rt, price_mult: price_rt, pace_mult: pace_rt,
        budget_mult: budget_rt, comp_mult, air_mult,
        multFinale: mfin_rt,
        _rawSumDev: _mfin_rt_raw - 1,
        _hitCap: _capRT.hitCap,
        _paceFromAggregate: (_paceResult && _paceResult.fromAggregate === true),
        _paceState: (_paceResult && _paceResult.state) ? _paceResult.state : null,
        _naReasons: {
          occ: _A_naReason,
          price: _B_naReason,
          pace: _C_naReason,
          comp: _E_naReason,
          air: _F_naReason,
        },
        _weightsApplied: _wNorm,
        _debug: {
          occCur: r.curOcc, occStly: r.stlyOcc, occIdx: A_idx,
          rnCur: r.curRn, capCur: r.cap, rnStly: r.stlyRn, capStly: r.cap,
          adrCur: r.curAdr, adrStly: r.stlyAdr, priceIdx: B_idx, priceCase: _B_case, priceDevSigned: _B_dev_signed,
          targetGrowthMo: (typeof fp_getTargetGrowth === 'function') ? fp_getTargetGrowth(sel, r.mo) : null,
          paceInfo: (typeof _paceResult === 'object' && _paceResult !== null) ? _paceResult : null,
          myExpedia: (exp2 && exp2.myPriceExpedia != null) ? exp2.myPriceExpedia : null,
          myBeddy: _D_myBeddy,
          compsetBeddy: _D_compsetBeddy,
          compsetAvg: _C_compAvg, compsetSource: _C_compSource,
          searchCur: _searchCur,
          searchP50Mo: (_searchStatsMo && _searchStatsMo.p50) ? _searchStatsMo.p50 : null,
          searchDev: (_searchCur != null && _searchStatsMo && _searchStatsMo.p50 > 0) ? ((_searchCur - _searchStatsMo.p50) / _searchStatsMo.p50) : null,
        },
      };
    }
    const expedia_rt_shown = _cheapestAvailableRT(r);
    const supp_to_subtract = (expedia_rt_shown && _suppData && expedia_rt_shown !== _suppData.baseRT)
      ? _supplementForRT(expedia_rt_shown, r.mo) * 0.5 : 0;
    // === NewRMES system: base = current reference (accepted | base override | frozen base) ===
    let basePrice = null;
    let baseSource = null;
    let baseSuppApplied = 0;
    if (typeof newrmesGetCurrentReference === 'function'){
      const ref = newrmesGetCurrentReference(sel, r.ymd);
      if (ref != null && isFinite(ref) && ref > 0){
        basePrice = ref;
        // determine origin label
        if (typeof newrmesGetAccepted === 'function' && newrmesGetAccepted(sel, r.ymd) != null) baseSource = 'accepted';
        else if (typeof newrmesGetFrozenBaseOverride === 'function' && newrmesGetFrozenBaseOverride(sel, r.ymd) != null) baseSource = 'base_override';
        else baseSource = 'frozen_base';
      }
    }
    // Fallbacks (rare): if no NewRMES data yet for this date (e.g. very far in future), use legacy chain
    if (basePrice == null){
      const beddyReal = (typeof beddyPriceFor === 'function') ? beddyPriceFor(sel, r.ymd) : null;
      if (beddyReal != null){
        basePrice = beddyReal;
        baseSource = 'beddy_fallback';
      } else if (exp2 && exp2.myPriceBeddy != null){
        basePrice = exp2.myPriceBeddy - supp_to_subtract;
        baseSource = 'mine_fallback';
        baseSuppApplied = supp_to_subtract;
      } else if (exp2 && exp2.compsetAvgBeddy != null){
        basePrice = exp2.compsetAvgBeddy - supp_to_subtract;
        baseSource = 'compset_fallback';
        baseSuppApplied = supp_to_subtract;
      } else if (r.curAdr > 0 && isFinite(r.curAdr)){
        basePrice = r.curAdr;
        baseSource = 'otb_fallback';
      } else if (r.finalLyAdr > 0 && isFinite(r.finalLyAdr)){
        basePrice = r.finalLyAdr;
        baseSource = 'finalLy_fallback';
      }
    }
    if (basePrice != null){
      const pricesByRT = {};
      const rmesSuggestedByRT = {};  // Snapshot del prezzo RMES suggerito (NON il riferimento corrente)
      const overrideUsedByRT = {};   // true se quella RT ha override attivo
      const rmesDeltaByRT = {};      // delta RMES vs reference, in €
      for (const rt of _rtList){
        let baseRT = basePrice;  // default per baseRT (riferimento corrente)
        if (_suppData && rt !== _suppData.baseRT){
          baseRT = basePrice + _supplementForRT(rt, r.mo);
        }
        const multRT = (_mults_byRT[rt] && _mults_byRT[rt].multFinale != null) ? _mults_byRT[rt].multFinale : multFinale;
        let _lmfPct = 0;
        if (typeof fp_lmfLookup === 'function'){
          const _ymdN = r.ymd;
          const _dt = new Date(Math.floor(_ymdN/10000), Math.floor((_ymdN%10000)/100)-1, _ymdN%100);
          const _daysToArr = Math.round((_dt.getTime() - new Date(TODAY).setHours(0,0,0,0)) / 86400000);
          _lmfPct = fp_lmfLookup(sel, r.curOcc, Math.max(0, _daysToArr));
        }
        const _eventBoost = _getEventBoost(r.ymd);
        let _priceAfterFactors = baseRT * multRT * (1 + _lmfPct/100) * _eventBoost;
        // NewRMES cap ±20% rispetto al riferimento (baseRT) per evitare scossoni forti
        const _capMin = baseRT * 0.80;
        const _capMax = baseRT * 1.20;
        if (_priceAfterFactors < _capMin) _priceAfterFactors = _capMin;
        if (_priceAfterFactors > _capMax) _priceAfterFactors = _capMax;
        const priceSuggested = Math.max(_priceAfterFactors, _structFloor);
        rmesSuggestedByRT[rt] = priceSuggested;
        rmesDeltaByRT[rt] = priceSuggested - baseRT;   // delta in € rispetto al riferimento corrente
        // NewRMES: il prezzo "in tabella" è il suggerimento RMES; l'eventuale "accettato" è già dentro
        // baseRT (via newrmesGetCurrentReference). Niente override legacy.
        pricesByRT[rt] = priceSuggested;
        overrideUsedByRT[rt] = false;
      }
      const baseRT = _suppData ? _suppData.baseRT : _rtList[0];
      const mainPrice = pricesByRT[baseRT] != null ? pricesByRT[baseRT] : Math.max(basePrice * multFinale, _structFloor);
      out[r.ymd] = {
        price: mainPrice,
        source: baseSource,
        suppApplied: baseSuppApplied,
        suppRT: expedia_rt_shown,
        multFinale,
        curRn: r.curRn,
        cap: r.cap,
        curOcc: r.cap > 0 ? r.curRn / r.cap : 0,
        multsByRT: _mults_byRT,
        pricesByRT,
        rmesSuggestedByRT,
        rmesDeltaByRT,
        overrideUsedByRT,
        foundationByRT: (function(){
          const out2 = {};
          for (const rt of _rtList){
            let bRT = basePrice;
            if (_suppData && rt !== _suppData.baseRT){
              bRT = basePrice + _supplementForRT(rt, r.mo);
            }
            out2[rt] = bRT;
          }
          return out2;
        })(),
      };
    }
    r._multsByRT = _mults_byRT;
  }
  if (_RMESMAP_TICK) _RMESMAP_TICK[_rmKey] = out;
  return out;
}
/* ============================================================
   FOUNDATION PRICING — calcolo del price di apertura
   ============================================================
   Sorgente di price basata su storico LY × target × pace × curva
   × cap mercato compset. I 6 fattori RMES si applicano sopra.
   FASE: STEP A — Calcolo in modalità SHADOW (visualizzato come
   colonna informativa accanto al price RMES). Lo step B
   sostituirà la cascata di sorgenti.
   Spec: FOUNDATION_PRICING_SPEC.md (26 decisioni cumulative).
   ============================================================ */
const FP_TARGET_GROWTH_KEY = 'rmes_target_growth_v1';
const FP_FLOOR_KEY = 'rmes_floor_v1';
const FP_COMPSET_OFFSETS_KEY = 'rmes_compset_offsets_v1';  // SOLO offset (pesi vengono da rmes_compset_weights_v1 = box ③ esistente)
const FP_BASE_PRICE_KEY = 'rmes_base_price_v1';  // Base price annuale per struttura (= Anchor Price nel nuovo sistema)
const FP_BASE_RATE_OVERRIDES_KEY = 'rmes_base_rate_overrides_v1';  // [LEGACY, wiped at migration]

/* ============================================================
   NEW RMES SYSTEM — Frozen Base Price + Acceptance
   ============================================================
   - Frozen Base Price: prezzo per data congelato dopo il primo calcolo (365gg)
     storage: { struct: { ymd: { price, frozenAt } } }
   - Frozen Base Override: override manuale del Base (giorno o periodo)
     storage: { struct: { ymd: price } }   // sovrascrive il calcolato
   - Acceptance: prezzo RMES accettato per data (diventa il riferimento corrente)
     storage: { struct: { ymd: price } }
   - Last suggestion: snapshot del delta RMES suggerito ieri (per la colonna "RMES last update")
     storage: { struct: { ymd: { delta, date } } }
*/
const NEWRMES_FROZEN_BASE_KEY = 'rmes_frozen_base_v1';
const NEWRMES_FROZEN_BASE_OVR_KEY = 'rmes_frozen_base_override_v1';
const NEWRMES_ACCEPTED_KEY = 'rmes_accepted_v1';
const NEWRMES_LAST_SUGGESTION_KEY = 'rmes_last_suggestion_v1';
const NEWRMES_LAST_SUGGESTION_DATE_KEY = 'rmes_last_suggestion_date_v1';

function _newrmesLoadObj(key){
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : {}; }
  catch(e){ return {}; }
}
function _newrmesSaveObj(key, obj){
  try { localStorage.setItem(key, JSON.stringify(obj || {})); } catch(e){}
}

/* === FROZEN BASE PRICE === */
function newrmesGetFrozenBase(structKey, ymd){
  const all = _newrmesLoadObj(NEWRMES_FROZEN_BASE_KEY);
  return (all[structKey] && all[structKey][ymd] != null) ? all[structKey][ymd].price : null;
}
function newrmesSetFrozenBase(structKey, ymd, price){
  const all = _newrmesLoadObj(NEWRMES_FROZEN_BASE_KEY);
  if (!all[structKey]) all[structKey] = {};
  all[structKey][ymd] = { price: Math.round(price), frozenAt: new Date().toISOString().slice(0,10) };
  _newrmesSaveObj(NEWRMES_FROZEN_BASE_KEY, all);
}
function newrmesGetFrozenBaseOverride(structKey, ymd){
  const all = _newrmesLoadObj(NEWRMES_FROZEN_BASE_OVR_KEY);
  return (all[structKey] && all[structKey][ymd] != null) ? all[structKey][ymd] : null;
}
function newrmesSetFrozenBaseOverride(structKey, ymd, price){
  const all = _newrmesLoadObj(NEWRMES_FROZEN_BASE_OVR_KEY);
  if (!all[structKey]) all[structKey] = {};
  if (price == null) delete all[structKey][ymd];
  else all[structKey][ymd] = Math.round(price);
  _newrmesSaveObj(NEWRMES_FROZEN_BASE_OVR_KEY, all);
}
function newrmesClearFrozenBaseOverrideRange(structKey, ymdFrom, ymdTo){
  const all = _newrmesLoadObj(NEWRMES_FROZEN_BASE_OVR_KEY);
  if (!all[structKey]) return;
  for (const k in all[structKey]){ const n = +k; if (n >= ymdFrom && n <= ymdTo) delete all[structKey][k]; }
  _newrmesSaveObj(NEWRMES_FROZEN_BASE_OVR_KEY, all);
}
function newrmesSetFrozenBaseOverrideRange(structKey, ymdFrom, ymdTo, price){
  const all = _newrmesLoadObj(NEWRMES_FROZEN_BASE_OVR_KEY);
  if (!all[structKey]) all[structKey] = {};
  // iterate days
  const dFrom = new Date(Math.floor(ymdFrom/10000), Math.floor((ymdFrom%10000)/100)-1, ymdFrom%100);
  const dTo = new Date(Math.floor(ymdTo/10000), Math.floor((ymdTo%10000)/100)-1, ymdTo%100);
  for (let dd = new Date(dFrom); dd <= dTo; dd.setDate(dd.getDate()+1)){
    const y = dd.getFullYear()*10000 + (dd.getMonth()+1)*100 + dd.getDate();
    all[structKey][y] = Math.round(price);
  }
  _newrmesSaveObj(NEWRMES_FROZEN_BASE_OVR_KEY, all);
}

/* Effective Base Price for a date: override if present, otherwise frozen calculated. */
function newrmesGetEffectiveBase(structKey, ymd){
  const ovr = newrmesGetFrozenBaseOverride(structKey, ymd);
  if (ovr != null) return ovr;
  return newrmesGetFrozenBase(structKey, ymd);
}

/* === ACCEPTANCE === */
function newrmesGetAccepted(structKey, ymd){
  const all = _newrmesLoadObj(NEWRMES_ACCEPTED_KEY);
  const v = all[structKey] && all[structKey][ymd];
  if (v == null) return null;
  if (typeof v === 'number') return v;            // legacy: numero secco
  if (typeof v === 'object' && v.price != null) return v.price;  // nuovo: {price, ts}
  return null;
}
function newrmesGetAcceptedMeta(structKey, ymd){
  // Returns {price, ts} or null. ts is the ISO date of when the accept was made.
  const all = _newrmesLoadObj(NEWRMES_ACCEPTED_KEY);
  const v = all[structKey] && all[structKey][ymd];
  if (v == null) return null;
  if (typeof v === 'number') return { price: v, ts: null };
  if (typeof v === 'object' && v.price != null) return { price: v.price, ts: v.ts || null };
  return null;
}
function newrmesSetAccepted(structKey, ymd, price){
  const all = _newrmesLoadObj(NEWRMES_ACCEPTED_KEY);
  if (!all[structKey]) all[structKey] = {};
  if (price == null) delete all[structKey][ymd];
  else all[structKey][ymd] = { price: Math.round(price), ts: new Date().toISOString() };
  _newrmesSaveObj(NEWRMES_ACCEPTED_KEY, all);
}
function newrmesSetAcceptedRange(structKey, ymdFrom, ymdTo, price){
  const all = _newrmesLoadObj(NEWRMES_ACCEPTED_KEY);
  if (!all[structKey]) all[structKey] = {};
  const dFrom = new Date(Math.floor(ymdFrom/10000), Math.floor((ymdFrom%10000)/100)-1, ymdFrom%100);
  const dTo = new Date(Math.floor(ymdTo/10000), Math.floor((ymdTo%10000)/100)-1, ymdTo%100);
  const ts = new Date().toISOString();
  for (let dd = new Date(dFrom); dd <= dTo; dd.setDate(dd.getDate()+1)){
    const y = dd.getFullYear()*10000 + (dd.getMonth()+1)*100 + dd.getDate();
    all[structKey][y] = { price: Math.round(price), ts };
  }
  _newrmesSaveObj(NEWRMES_ACCEPTED_KEY, all);
}

/* Current reference = if accepted exists, use it; otherwise effective base (override or frozen). */
function newrmesGetCurrentReference(structKey, ymd){
  const acc = newrmesGetAccepted(structKey, ymd);
  if (acc != null) return acc;
  return newrmesGetEffectiveBase(structKey, ymd);
}

/* === FROZEN BASE PRICE CALCULATION (4 steps) ===
   Step 1: Historical anchor = median LY ADR (same day-of-week + same month, years 2024-2025;
           falls back to whole-month median if fewer than 3 observations). Robust to outliers.
   Step 2: Target revenue growth → anchor × (1 + targetGrowth% for that month)
   Step 3: Expedia Goal Value cap → price capped at the weighted compset price (WITH per-competitor
           offsets), i.e. the desired online positioning. Base Price can never exceed it.
   Step 4: Anchor Price guard-rail → result bounded within ±50% of the annual Anchor Price
   Step 5: Floor → hard minimum (never below the property Floor Rate)
*/
function newrmesCalculateBasePrice(structKey, isoDate){
  const baseRT = (CFG.structures[structKey] && CFG.structures[structKey].baseRT) || null;
  if (!baseRT) return null;
  const anchor = (typeof fp_computeAnchorLY === 'function') ? fp_computeAnchorLY(structKey, baseRT, isoDate) : null;
  const month = (new Date(isoDate + 'T00:00:00')).getMonth() + 1;
  const anchorPrice = fp_getBasePrice(structKey);  // l'annual base = Anchor Price del nuovo sistema
  const floor = fp_getFloor(structKey);
  // Step 1+2: ADR storico × (1 + targetGrowth%). L'anchor LY è il riferimento principale, ma
  // se è troppo basso rispetto all'Anchor Price (es. periodo storicamente debole o pochi dati),
  // diamo un floor minimo del 70% dell'Anchor Price per evitare crolli irrealistici.
  const targetGrowth = (typeof fp_getTargetGrowth === 'function') ? fp_getTargetGrowth(structKey, month) : 5;
  const adrLY = (anchor && anchor.medianADR > 0) ? anchor.medianADR : 0;
  const adrLYsafe = Math.max(adrLY, anchorPrice * 0.70);  // floor anchor LY a 70% dell'Anchor Price
  const adrBaseSource = adrLYsafe > 0 ? adrLYsafe : anchorPrice;
  let price = adrBaseSource * (1 + targetGrowth/100);
  // Step 4: Expedia Goal Value cap (posizionamento-obiettivo online, CON pesi % e offset).
  // Il Base Price non può MAI superare il Goal Value (cap massimo esatto, niente +5%).
  // Il minimo resta il Floor Rate (step 5).
  if (typeof compsetWeightedAvg === 'function'){
    try {
      const c = compsetWeightedAvg(structKey, isoDate, /*applyOffset=*/true);
      const goalValue = (c && typeof c === 'object' && isFinite(c.avg)) ? c.avg : (isFinite(c) ? c : null);
      if (goalValue != null && goalValue > 0){
        if (price > goalValue) price = goalValue;  // cap esatto al Goal Value
      }
    } catch(e){}
  }
  // Anchor Price guard-rail: ±50% dall'annual Anchor Price (limita scossoni)
  const minAnchor = anchorPrice * 0.5;
  const maxAnchor = anchorPrice * 1.5;
  if (price < minAnchor) price = minAnchor;
  if (price > maxAnchor) price = maxAnchor;
  // Step 5: Floor (hard minimum)
  if (price < floor) price = floor;
  return Math.round(price);
}

/* Verbose version of newrmesCalculateBasePrice: returns all intermediate steps
   for the Base Price breakdown tab. Same math as newrmesCalculateBasePrice. */
function newrmesCalculateBasePriceVerbose(structKey, isoDate){
  const baseRT = (CFG.structures[structKey] && CFG.structures[structKey].baseRT) || null;
  if (!baseRT) return null;
  const anchor = (typeof fp_computeAnchorLY === 'function') ? fp_computeAnchorLY(structKey, baseRT, isoDate) : null;
  const month = (new Date(isoDate + 'T00:00:00')).getMonth() + 1;
  const anchorPrice = fp_getBasePrice(structKey);
  const floor = fp_getFloor(structKey);
  const targetGrowth = (typeof fp_getTargetGrowth === 'function') ? fp_getTargetGrowth(structKey, month) : 5;
  const adrLY = (anchor && anchor.medianADR > 0) ? anchor.medianADR : 0;
  const adrLYsafe = Math.max(adrLY, anchorPrice * 0.70);
  const adrBaseSource = adrLYsafe > 0 ? adrLYsafe : anchorPrice;
  const afterGrowth = adrBaseSource * (1 + targetGrowth/100);
  let price = afterGrowth;
  // Goal Value cap
  let goalValue = null;
  if (typeof compsetWeightedAvg === 'function'){
    try {
      const c = compsetWeightedAvg(structKey, isoDate, /*applyOffset=*/true);
      goalValue = (c && typeof c === 'object' && isFinite(c.avg)) ? c.avg : null;
    } catch(e){}
  }
  let cappedByGoal = false;
  let goalN = 0, goalNames = null;
  if (typeof compsetWeightedAvg === 'function'){
    try {
      const c = compsetWeightedAvg(structKey, isoDate, /*applyOffset=*/true);
      if (c && typeof c === 'object'){ goalN = c.n || 0; goalNames = c.contributingNames || null; }
    } catch(e){}
  }
  if (goalValue != null && goalValue > 0 && price > goalValue){ price = goalValue; cappedByGoal = true; }
  // Anchor guard-rail
  const minAnchor = anchorPrice * 0.5;
  const maxAnchor = anchorPrice * 1.5;
  let guardRail = null;
  if (price < minAnchor){ price = minAnchor; guardRail = 'min'; }
  else if (price > maxAnchor){ price = maxAnchor; guardRail = 'max'; }
  // Floor
  let flooredBy = false;
  if (price < floor){ price = floor; flooredBy = true; }
  return {
    isoDate,
    lyMedianADR: adrLY > 0 ? Math.round(adrLY) : null,
    lyObs: anchor ? anchor.nObs : 0,
    lyFallback: anchor ? anchor.fallbackUsed : 'none',
    lyAdrMin: anchor ? anchor.adrMin : null,
    lyAdrMax: anchor ? anchor.adrMax : null,
    lySetDesc: anchor ? anchor.setDesc : null,
    adrUsed: Math.round(adrBaseSource),
    adrFlooredTo70: (adrLY > 0 && adrLYsafe > adrLY) || (adrLY === 0),
    anchor70: Math.round(anchorPrice * 0.70),
    targetGrowth,
    afterGrowth: Math.round(afterGrowth),
    goalValue: goalValue != null ? Math.round(goalValue) : null,
    goalN, goalNames,
    cappedByGoal,
    anchorPrice,
    minAnchor: Math.round(minAnchor),
    maxAnchor: Math.round(maxAnchor),
    guardRail,
    floor,
    flooredBy,
    finalBase: Math.round(price)
  };
}

const BP_BREAKDOWN_STATE = { struct: 'all', from: null, to: null };

function renderBasePriceBreakdown(){
  const wrap = document.getElementById('bp-table-wrap');
  if (!wrap) return;
  // Pills struttura
  const pillsEl = document.getElementById('bp-struct-pills');
  const structOpts = [
    { v:'all', label:'All', color:'#6b5b3f' },
    { v:'firenze', label:'Firenze Suite', color:'#3b6b9a' },
    { v:'condotta', label:'Condotta 16', color:'#3d7a4b' },
    { v:'alfani', label:'Palazzo Alfani', color:'#8e5fa8' },
    { v:'davids', label:'Enis Guesthouse', color:'#c0392b' },
  ];
  if (pillsEl && !pillsEl.dataset.wired){
    pillsEl.dataset.wired = '1';
    pillsEl.addEventListener('click', function(e){
      const b = e.target.closest('button[data-bpfilter]');
      if (!b) return;
      BP_BREAKDOWN_STATE.struct = b.dataset.bpfilter;
      renderBasePriceBreakdown();
    });
  }
  if (pillsEl){
    pillsEl.innerHTML = structOpts.map(o => {
      const on = (BP_BREAKDOWN_STATE.struct === o.v);
      return `<button class="rt-pill ${on?'':'off'}" data-bpfilter="${o.v}" style="${on?'border-color:'+o.color+';color:'+o.color+';font-weight:600':''}">${o.label}</button>`;
    }).join('');
  }
  // Date defaults: oggi → +120 giorni
  const fromInp = document.getElementById('bp-date-from');
  const toInp = document.getElementById('bp-date-to');
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  if (fromInp && !fromInp.value){
    fromInp.value = today.toISOString().slice(0,10);
  }
  if (toInp && !toInp.value){
    const t2 = new Date(today.getTime() + 120*86400000);
    toInp.value = t2.toISOString().slice(0,10);
  }
  // wire apply/export una volta
  const applyBtn = document.getElementById('bp-apply');
  if (applyBtn && !applyBtn.dataset.wired){
    applyBtn.dataset.wired = '1';
    applyBtn.addEventListener('click', () => renderBasePriceBreakdown());
  }
  const exportBtn = document.getElementById('bp-export');
  if (exportBtn && !exportBtn.dataset.wired){
    exportBtn.dataset.wired = '1';
    exportBtn.addEventListener('click', () => _bpExportCSV());
  }
  const fromISO = fromInp ? fromInp.value : today.toISOString().slice(0,10);
  const toISO = toInp ? toInp.value : new Date(today.getTime()+120*86400000).toISOString().slice(0,10);
  const dFrom = new Date(fromISO + 'T00:00:00');
  const dTo = new Date(toISO + 'T00:00:00');
  if (isNaN(dFrom.getTime()) || isNaN(dTo.getTime()) || dTo < dFrom){
    wrap.innerHTML = '<div style="padding:20px;color:#a83b3b">Invalid date range.</div>';
    return;
  }
  const structsToShow = (BP_BREAKDOWN_STATE.struct === 'all')
    ? ['firenze','condotta','alfani','davids']
    : [BP_BREAKDOWN_STATE.struct];
  const structLabels = { firenze:'Firenze Suite', condotta:'Condotta 16', alfani:'Palazzo Alfani', davids:'Enis Guesthouse' };

  const rows = [];
  for (const sk of structsToShow){
    for (let d = new Date(dFrom); d <= dTo; d.setDate(d.getDate()+1)){
      const iso = d.toISOString().slice(0,10);
      const v = newrmesCalculateBasePriceVerbose(sk, iso);
      if (!v) continue;
      rows.push({ struct: sk, structLabel: structLabels[sk], ...v });
    }
  }
  _BP_LAST_ROWS = rows;

  // Costruisco tabella con header STICKY (resta visibile scrollando) + tooltip per cella.
  // Il wrapper deve avere altezza limitata e overflow per attivare lo sticky.
  let h = '<div style="max-height:70vh;overflow:auto;border:1px solid #eee;border-radius:6px">';
  h += '<table class="data-table" style="width:100%;font-size:12px;border-collapse:separate;border-spacing:0">';
  h += '<thead><tr>';
  const colDefs = [
    { t:'Property', al:'left',  tip:'Property' },
    { t:'Date',     al:'left',  tip:'Stay date' },
    { t:'DoW',      al:'right', tip:'Day of week' },
    { t:'LY median ADR', al:'right', tip:'Step 1 — historical anchor: median of the ADR actually earned on the BASE room type only, in past years (same weekday & month). Each booking is net of OTA markup (Booking/Expedia/Airbnb prices are divided by their markup so everything is in Beddy-equivalent; direct/Beddy/Krossbooking bookings are used as-is).' },
    { t:'obs',      al:'right', tip:'Total number of bookings (room-stays) that fed the median — NOT the number of days. One day can contribute several bookings (one per occupied room).' },
    { t:'ADR used', al:'right', tip:'The anchor actually used (may be lifted by the 70% protection)' },
    { t:'× growth', al:'right', tip:'Step 2 — monthly target growth applied to the anchor' },
    { t:'= after growth', al:'right', tip:'Anchor × (1 + growth%)' },
    { t:'Goal Value (cap)', al:'right', tip:'Step 3 — Expedia Goal Value: weighted compset WITH offsets. Maximum cap on the Base Price' },
    { t:'Anchor ±50%', al:'right', tip:'Step 4 — guard-rail: result bounded within ±50% of the annual Anchor Price' },
    { t:'Floor', al:'right', tip:'Step 5 — Floor Rate: the absolute minimum' },
    { t:'→ Base Price', al:'right', tip:'Final frozen Base Price for the day' },
  ];
  h += colDefs.map((c,i)=>`<th title="${escapeHtml(c.tip)}" style="position:sticky;top:0;z-index:2;background:#efe9df;padding:8px 9px;border-bottom:2px solid #d8cfbf;text-align:${c.al};white-space:nowrap;cursor:help">${c.t}</th>`).join('');
  h += '</tr></thead><tbody>';
  const dowNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  for (const r of rows){
    const dt = new Date(r.isoDate + 'T00:00:00');
    const dow = dowNames[dt.getDay()];
    const dmy = pad2(dt.getDate())+'/'+pad2(dt.getMonth()+1)+'/'+dt.getFullYear();
    // --- Tooltip LY median ADR ---
    let lyTip;
    if (r.lyMedianADR != null){
      lyTip = 'Median earned ADR = €'+r.lyMedianADR
        + '\nBase room type only · net of OTA markup (Beddy-equivalent)'
        + '\nSet: ' + (r.lySetDesc || 'same weekday & month, 2024-2025')
        + '\nObservations: ' + r.lyObs + ' bookings (room-stays, not days)'
        + (r.lyAdrMin!=null ? ('\nRange of earned ADR: €'+r.lyAdrMin+' – €'+r.lyAdrMax) : '')
        + '\n\nThe median (middle value) is used so a single odd booking cannot skew the anchor.';
    } else {
      lyTip = 'No historical bookings found for this weekday & month. The anchor falls back to the 70% protection (70% of the annual Anchor Price).';
    }
    // --- Tooltip obs ---
    const obsTip = (r.lyFallback === 'monthWide')
      ? ('Total bookings (room-stays), NOT days. Fewer than 3 on the exact weekday → widened to ALL days of the month. Considered: ' + (r.lySetDesc||'whole month') + '. Bookings: ' + r.lyObs)
      : ('Total bookings (room-stays), NOT days — one day can hold several bookings (one per occupied room). Considered: ' + (r.lySetDesc||'same weekday & month') + '. Bookings: ' + r.lyObs);
    // --- Tooltip ADR used ---
    const adrUsedTip = r.adrFlooredTo70
      ? ('History was too low (or missing), so the anchor was lifted up to 70% of the annual Anchor Price (€'+r.anchorPrice+' × 70% = €'+r.anchor70+'). This prevents an unrealistically low Base Price.')
      : ('Anchor used as-is: €'+r.adrUsed+' (above the 70% protection of €'+r.anchor70+').');
    // --- Tooltip Goal Value ---
    let goalTip;
    if (r.goalValue != null){
      goalTip = 'Expedia Goal Value = €'+r.goalValue+' (weighted compset WITH offsets, '+r.goalN+' competitors).'
        + (r.cappedByGoal
            ? '\n\n✓cap (red): the price after growth (€'+r.afterGrowth+') was ABOVE the Goal Value, so it was capped DOWN to €'+r.goalValue+'.'
            : '\n\nNot capping here: the price after growth (€'+r.afterGrowth+') is already at or below the Goal Value, so it passes through unchanged.');
    } else {
      goalTip = 'No valid compset for this date (no competitor prices, or only your own properties). No cap applied.';
    }
    // --- Tooltip guard-rail ---
    let grTip;
    if (r.guardRail === 'max'){
      grTip = '↓ max: the price exceeded the upper guard-rail (Anchor Price +50% = €'+r.maxAnchor+'), so it was pulled DOWN to €'+r.maxAnchor+'.';
    } else if (r.guardRail === 'min'){
      grTip = '↑ min: the price was below the lower guard-rail (Anchor Price −50% = €'+r.minAnchor+'), so it was pushed UP to €'+r.minAnchor+'.';
    } else {
      grTip = 'Within the ±50% band (€'+r.minAnchor+' – €'+r.maxAnchor+' around the annual Anchor Price). No adjustment.';
    }
    // --- Tooltip floor ---
    const floorTip = r.flooredBy
      ? ('Floor applied: the price was below the Floor Rate (€'+r.floor+'), so it was raised to the floor.')
      : ('Above the Floor Rate (€'+r.floor+'). No adjustment.');

    const goalTxt = r.goalValue != null ? ('€'+r.goalValue + (r.cappedByGoal?' ✓cap':'')) : '—';
    const grTxt = r.guardRail ? (r.guardRail==='min'?'↑ min':'↓ max') : '–';
    const floorTxt = r.flooredBy ? ('€'+r.floor+' ✓') : ('€'+r.floor);
    const lyTxt = r.lyMedianADR != null ? ('€'+r.lyMedianADR) : '—';
    const adrUsedTxt = '€'+r.adrUsed + (r.adrFlooredTo70?' ⬆70%':'');
    h += '<tr style="border-bottom:1px solid #f0eee9">';
    h += `<td style="padding:6px 9px;text-align:left;white-space:nowrap;color:#666;border-bottom:1px solid #f0eee9">${r.structLabel}</td>`;
    h += `<td style="padding:6px 9px;text-align:left;white-space:nowrap;font-family:'DM Mono',monospace;border-bottom:1px solid #f0eee9">${dmy}</td>`;
    h += `<td style="padding:6px 9px;text-align:right;color:#999;border-bottom:1px solid #f0eee9">${dow}</td>`;
    h += `<td title="${escapeHtml(lyTip)}" style="padding:6px 9px;text-align:right;font-family:'DM Mono',monospace;cursor:help;border-bottom:1px solid #f0eee9">${lyTxt}</td>`;
    h += `<td title="${escapeHtml(obsTip)}" style="padding:6px 9px;text-align:right;color:#999;cursor:help;border-bottom:1px solid #f0eee9">${r.lyObs}${r.lyFallback==='monthWide'?'*':''}</td>`;
    h += `<td title="${escapeHtml(adrUsedTip)}" style="padding:6px 9px;text-align:right;font-family:'DM Mono',monospace;color:#888;cursor:help;border-bottom:1px solid #f0eee9">${adrUsedTxt}</td>`;
    h += `<td style="padding:6px 9px;text-align:right;color:#888;border-bottom:1px solid #f0eee9">+${r.targetGrowth}%</td>`;
    h += `<td style="padding:6px 9px;text-align:right;font-family:'DM Mono',monospace;color:#888;border-bottom:1px solid #f0eee9">€${r.afterGrowth}</td>`;
    h += `<td title="${escapeHtml(goalTip)}" style="padding:6px 9px;text-align:right;font-family:'DM Mono',monospace;cursor:help;color:${r.cappedByGoal?'#a83b3b':'#888'};border-bottom:1px solid #f0eee9">${goalTxt}</td>`;
    h += `<td title="${escapeHtml(grTip)}" style="padding:6px 9px;text-align:right;color:${r.guardRail?'#a83b3b':'#999'};cursor:help;border-bottom:1px solid #f0eee9">${grTxt}</td>`;
    h += `<td title="${escapeHtml(floorTip)}" style="padding:6px 9px;text-align:right;font-family:'DM Mono',monospace;color:${r.flooredBy?'#a83b3b':'#999'};cursor:help;border-bottom:1px solid #f0eee9">${floorTxt}</td>`;
    h += `<td style="padding:6px 9px;text-align:right;font-family:'DM Mono',monospace;font-weight:700;color:#2c5c3c;border-bottom:1px solid #f0eee9">€${r.finalBase}</td>`;
    h += '</tr>';
  }
  h += '</tbody></table></div>';
  h += '<div style="font-size:10.5px;color:#999;margin-top:10px;line-height:1.5">';
  h += 'Hover any number to see how it was obtained. Columns left→right: <b>LY median ADR</b> (median earned ADR on the base room type only, net of OTA markup, same weekday & month, 2024-2025) · <b>obs</b> (number of bookings/room-stays, not days; <b>*</b> = widened to whole month) · <b>ADR used</b> (⬆70% = lifted to the 70%-of-Anchor-Price protection) · <b>× growth</b> · <b>after growth</b> · <b>Goal Value cap</b> (red ✓cap = it capped the price down) · <b>Anchor ±50%</b> (↓max / ↑min = guard-rail acted) · <b>Floor</b> (✓ = floor applied) · <b>Base Price</b>.';
  h += '</div>';
  wrap.innerHTML = h;
}

let _BP_LAST_ROWS = [];
function _bpExportCSV(){
  if (!_BP_LAST_ROWS || !_BP_LAST_ROWS.length){ alert('Nothing to export — apply a range first.'); return; }
  const header = ['Property','Date','DoW','LY_median_ADR','observations','fallback_monthWide','ADR_used','ADR_lifted_to_70pct','target_growth_pct','after_growth','goal_value_cap','capped_by_goal','anchor_price','guard_rail','floor','floored','base_price'];
  const dowNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const lines = [header.join(',')];
  for (const r of _BP_LAST_ROWS){
    const dt = new Date(r.isoDate + 'T00:00:00');
    const row = [
      '"'+r.structLabel+'"',
      r.isoDate,
      dowNames[dt.getDay()],
      r.lyMedianADR != null ? r.lyMedianADR : '',
      r.lyObs,
      r.lyFallback==='monthWide' ? 'yes' : 'no',
      r.adrUsed,
      r.adrFlooredTo70 ? 'yes':'no',
      r.targetGrowth,
      r.afterGrowth,
      r.goalValue != null ? r.goalValue : '',
      r.cappedByGoal ? 'yes':'no',
      r.anchorPrice,
      r.guardRail || '',
      r.floor,
      r.flooredBy ? 'yes':'no',
      r.finalBase
    ];
    lines.push(row.join(','));
  }
  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0,10).replace(/-/g,'');
  a.href = url;
  a.download = 'base_price_breakdown_' + stamp + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


function newrmesFreezeBasePriceHorizon(structKey, horizonDays){
  horizonDays = horizonDays || 365;
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const existing = _newrmesLoadObj(NEWRMES_FROZEN_BASE_KEY);
  if (!existing[structKey]) existing[structKey] = {};
  let added = 0;
  for (let off = 0; off < horizonDays; off++){
    const d = new Date(today.getTime() + off * 86400000);
    const ymdN = d.getFullYear()*10000 + (d.getMonth()+1)*100 + d.getDate();
    if (existing[structKey][ymdN] != null) continue;  // già congelato, non ricalcolo
    const iso = d.toISOString().slice(0,10);
    const price = newrmesCalculateBasePrice(structKey, iso);
    if (price != null && isFinite(price)){
      existing[structKey][ymdN] = { price: price, frozenAt: today.toISOString().slice(0,10) };
      added++;
    }
  }
  _newrmesSaveObj(NEWRMES_FROZEN_BASE_KEY, existing);
  return added;
}

/* Boot: freeze Base Price for all 4 structures at first access of NewRMES system.
   Called once at fp_postLoadHook after migration is done. */
function newrmesBootFreezeAll(){
  if (typeof CFG === 'undefined' || !CFG.structures) return;
  const structs = Object.keys(CFG.structures);
  let totalAdded = 0;
  for (const s of structs){
    try {
      const n = newrmesFreezeBasePriceHorizon(s, 365);
      if (n > 0) totalAdded += n;
      if (n > 0) console.log('[NewRMES] Frozen Base Price for ' + s + ': +' + n + ' days');
    } catch(e){ console.error('[NewRMES] freeze failed for ' + s, e); }
  }
  if (totalAdded > 0) console.log('[NewRMES] Total Base Price days frozen: ' + totalAdded);
}

/* === RMES LAST SUGGESTION === */
/* Returns the delta (in €) from yesterday's snapshot for a given struct/ymd. Null if missing. */
function newrmesGetLastSuggestion(structKey, ymd){
  const all = _newrmesLoadObj(NEWRMES_LAST_SUGGESTION_KEY);
  return (all[structKey] && all[structKey][ymd] != null) ? all[structKey][ymd] : null;
}
/* Snapshot today's RMES deltas → save as "last suggestion" only if the date has changed since the
   last snapshot. So when you open the dashboard tomorrow, today's suggestion becomes "yesterday's". */
function newrmesSnapshotIfNewDay(){
  try {
    const todayStr = (new Date(TODAY)).toISOString().slice(0,10);
    const lastDate = localStorage.getItem(NEWRMES_LAST_SUGGESTION_DATE_KEY);
    if (lastDate === todayStr) return;  // already snapshotted today
    // a snapshot is needed: copy CURRENT computed deltas into LAST storage (rotate)
    // we re-compute RMES for each struct over the next 365 days and save deltas (base RT only)
    if (typeof CFG === 'undefined' || !CFG.structures) return;
    if (typeof computeRMESPriceMap !== 'function') return;
    const newLast = {};
    const today0 = new Date(TODAY); today0.setHours(0,0,0,0);
    const startYmd = today0.getFullYear()*10000 + (today0.getMonth()+1)*100 + today0.getDate();
    for (const sk of Object.keys(CFG.structures)){
      try {
        const map = computeRMESPriceMap(sk, startYmd, 365);
        const baseRT = CFG.structures[sk].baseRT;
        newLast[sk] = {};
        for (const ymdK in map){
          const m = map[ymdK];
          if (m && m.rmesDeltaByRT && m.rmesDeltaByRT[baseRT] != null){
            newLast[sk][ymdK] = Math.round(m.rmesDeltaByRT[baseRT]);
          }
        }
      } catch(e){ console.error('[NewRMES] snapshot failed for ' + sk, e); }
    }
    _newrmesSaveObj(NEWRMES_LAST_SUGGESTION_KEY, newLast);
    localStorage.setItem(NEWRMES_LAST_SUGGESTION_DATE_KEY, todayStr);
    console.log('[NewRMES] Snapshot of yesterday\'s suggestions saved for ' + Object.keys(newLast).length + ' structs');
  } catch(e){ console.error('[NewRMES] snapshotIfNewDay failed', e); }
}


const FP_OTA_MARKUP_KEY = 'rmes_ota_markup_v1';  // Markup OTA percentuale (default 12)
const FP_ELASTICITY_KEY = 'rmes_elasticity_v1';  // Price elasticity↔RN (default 1.0 = 1:1)
const FP_ELASTICITY_DEFAULTS = { firenze: 1.0, condotta: 1.0, alfani: 1.0 };
function fp_getElasticity(structKey){
  try {
    const raw = localStorage.getItem(FP_ELASTICITY_KEY);
    if (raw){
      const obj = JSON.parse(raw);
      if (obj && obj[structKey] != null && isFinite(obj[structKey])) return +obj[structKey];
    }
  } catch(e){}
  return FP_ELASTICITY_DEFAULTS[structKey] != null ? FP_ELASTICITY_DEFAULTS[structKey] : 1.0;
}
function fp_setElasticity(structKey, value){
  let obj = {};
  try { obj = JSON.parse(localStorage.getItem(FP_ELASTICITY_KEY) || '{}'); } catch(e){}
  obj[structKey] = +value;
  try { localStorage.setItem(FP_ELASTICITY_KEY, JSON.stringify(obj)); } catch(e){}
}
/* ============================================================
   STIMA ELASTICITÀ DAI DATI STORICI (v2 — finestra di pickup)
   ============================================================
   Migliora la stima usando il PICKUP in finestre temporali specifiche
   prima del check-in, invece dell'ADR finale del giorno chiuso.
   Rationale: un giorno chiuso a €200 con 4 RN totali può essere il
   risultato di prezzi diversi nel tempo (€180 a 60d, €220 a 7d).
   Confrontare ADR finali è "fondere" segnali. Più pulito: per la
   stessa finestra "30-15d prima del check-in", confronto (RN_pickup,
   ADR_pickup) di days simili.
   Algoritmo:
   1. Per ogni giorno chiuso (stay), per ogni finestra di pickup
      definita (es. 30-15d, 14-7d, 6-0d), raccolgo:
        - rn_pickup = RN prenotate IN QUELLA FINESTRA per quel giorno
        - rev_pickup = revenue Beddy_eq di quei RN
        - adr_pickup = rev / rn
        - occ_pre = OCC raggiunta PRIMA dell'inizio finestra (per filtro)
   2. Raggruppo per (mese, DOW, finestra). Per ogni gruppo con ≥4 obs,
      calcolo mediane ADR_pickup e RN_pickup.
   3. Filtri:
      - Escludo occ_pre ≥ 0.80 (già pieno, no più spazio di domanda)
      - Escludo |Δ%ADR_pickup| < 5% (segnale troppo debole)
      - Escludo elasticità raw fuori da [-3, +5] (outlier)
   4. Per ogni osservazione: e = -Δ%RN_pickup / Δ%ADR_pickup.
   5. Trimmed mean 10%, peso = log(1+nObs_gruppo) per dare più peso ai
      gruppi con più dati.
   ============================================================ */
function fp_estimateElasticity(structKey){
  if (typeof BOOKINGS === 'undefined' || !BOOKINGS.length) return null;
  const structName = (structKey === 'condotta') ? 'Condotta 16'
                   : (structKey === 'alfani')   ? 'Palazzo Alfani'
                   : (structKey === 'davids')   ? "Florence David's Apartament"
                   : 'Firenze Suite';
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const todayYmd = ymd(today);
  const rooms = (typeof structRoomsFor === 'function') ? structRoomsFor(structKey) : {};
  let invTotal = 0;
  for (const rt in rooms) invTotal += (rooms[rt] || 0);
  if (invTotal <= 0) invTotal = 8;
  const PICKUP_WINDOWS = [
    {name:'60-31d', max:60, min:31},
    {name:'30-15d', max:30, min:15},
    {name:'14-7d',  max:14, min:7},
    {name:'6-0d',   max:6,  min:0},
  ];
  const horizonStart = new Date(today);
  horizonStart.setMonth(horizonStart.getMonth() - 24);
  const horizonStartYmd = ymd(horizonStart);
  const stayDayPickup = {};
  for (const b of BOOKINGS){
    if (b.struct !== structName) continue;
    if (b.stato !== 'Confermate') continue;
    if (!b.dIn || !b.dOut || !b.dBook) continue;
    const d = new Date(b.dIn);
    while (d < b.dOut){
      const stayYmd = ymd(d);
      if (stayYmd < todayYmd && stayYmd >= horizonStartYmd){
        const dStayCopy = new Date(d); dStayCopy.setHours(0,0,0,0);
        const dBookCopy = new Date(b.dBook); dBookCopy.setHours(0,0,0,0);
        const ggBefore = Math.floor((dStayCopy - dBookCopy) / 86400000);
        if (ggBefore >= 0){
          for (const w of PICKUP_WINDOWS){
            if (ggBefore >= w.min && ggBefore <= w.max){
              if (!stayDayPickup[stayYmd]) stayDayPickup[stayYmd] = {};
              if (!stayDayPickup[stayYmd][w.name]) stayDayPickup[stayYmd][w.name] = {rn:0, rev:0};
              stayDayPickup[stayYmd][w.name].rn += 1;
              stayDayPickup[stayYmd][w.name].rev += (b.revPerNightCaricato != null) ? b.revPerNightCaricato : b.revPerNight;
              break;
            }
          }
        }
      }
      d.setDate(d.getDate() + 1);
    }
  }
  const stayDayCumRN = {};  // stayYmd → array di {windowIdx, cumRnBeforeWin}
  for (const stayYmd in stayDayPickup){
    const wins = stayDayPickup[stayYmd];
    stayDayCumRN[stayYmd] = {};
  }
  for (const b of BOOKINGS){
    if (b.struct !== structName) continue;
    if (b.stato !== 'Confermate') continue;
    if (!b.dIn || !b.dOut || !b.dBook) continue;
    const d = new Date(b.dIn);
    while (d < b.dOut){
      const stayYmd = ymd(d);
      if (stayYmd < todayYmd && stayYmd >= horizonStartYmd){
        const dStayCopy = new Date(d); dStayCopy.setHours(0,0,0,0);
        const dBookCopy = new Date(b.dBook); dBookCopy.setHours(0,0,0,0);
        const ggBefore = Math.floor((dStayCopy - dBookCopy) / 86400000);
        if (ggBefore > 60){
          if (!stayDayCumRN[stayYmd]) stayDayCumRN[stayYmd] = {early:0};
          if (stayDayCumRN[stayYmd].early == null) stayDayCumRN[stayYmd].early = 0;
          stayDayCumRN[stayYmd].early += 1;
        }
      }
      d.setDate(d.getDate() + 1);
    }
  }
  const observations = [];
  for (const stayYmd in stayDayPickup){
    const wins = stayDayPickup[stayYmd];
    const earlyRn = (stayDayCumRN[stayYmd] && stayDayCumRN[stayYmd].early) ? stayDayCumRN[stayYmd].early : 0;
    let cumBefore = earlyRn;
    for (let i = 0; i < PICKUP_WINDOWS.length; i++){
      const w = PICKUP_WINDOWS[i];
      const pick = wins[w.name];
      if (!pick || pick.rn <= 0){
        continue;
      }
      const adrPickup = pick.rev / pick.rn;
      if (!isFinite(adrPickup) || adrPickup <= 0){
        cumBefore += pick.rn;
        continue;
      }
      const yStr = stayYmd.toString().padStart(8,'0');
      const yY = parseInt(yStr.substring(0,4));
      const yM = parseInt(yStr.substring(4,6));
      const yD = parseInt(yStr.substring(6,8));
      const dDate = new Date(yY, yM-1, yD);
      const dow = dDate.getDay();
      observations.push({
        stayYmd: stayYmd,
        win: w.name,
        winIdx: i,
        adrPickup: adrPickup,
        rnPickup: pick.rn,
        occPre: cumBefore / invTotal,
        mo: yM,
        dow: dow,
      });
      cumBefore += pick.rn;
    }
  }
  if (observations.length < 50) return null;
  const median = (arr) => {
    const s = arr.slice().sort((a,b)=>a-b);
    const n = s.length;
    if (n === 0) return 0;
    if (n % 2) return s[(n-1)/2];
    return (s[n/2 - 1] + s[n/2]) / 2;
  };
  const groups = {};
  for (const o of observations){
    const k = o.mo + '-' + o.dow + '-' + o.win;
    if (!groups[k]) groups[k] = [];
    groups[k].push(o);
  }
  const elasticitiesWeighted = [];  // {value, weight}
  const elasticities = [];  // valori raw (per stats)
  let nFilteredOccPre = 0, nFilteredSmallAdr = 0, nFilteredOutlier = 0;
  for (const k in groups){
    const grp = groups[k];
    if (grp.length < 4) continue;
    const medAdr = median(grp.map(g=>g.adrPickup));
    const medRn = median(grp.map(g=>g.rnPickup));
    if (medAdr <= 0 || medRn <= 0) continue;
    const weight = Math.log(1 + grp.length);  // peso log(n) per gruppi più "grandi"
    for (const o of grp){
      if (o.occPre >= 0.80){ nFilteredOccPre++; continue; }
      const dAdr = (o.adrPickup - medAdr) / medAdr;
      const dRn = (o.rnPickup - medRn) / medRn;
      if (Math.abs(dAdr) < 0.05){ nFilteredSmallAdr++; continue; }
      const e = -dRn / dAdr;
      if (e < -3 || e > 5){ nFilteredOutlier++; continue; }
      elasticities.push(e);
      elasticitiesWeighted.push({value: e, weight: weight});
    }
  }
  if (elasticities.length < 30) return null;
  elasticities.sort((a,b)=>a-b);
  const n = elasticities.length;
  const trimLo = elasticities[Math.floor(n*0.10)];
  const trimHi = elasticities[Math.floor(n*0.90)];
  let totW = 0, totV = 0;
  for (const e of elasticitiesWeighted){
    if (e.value < trimLo || e.value > trimHi) continue;
    totW += e.weight;
    totV += e.weight * e.value;
  }
  const mean = totW > 0 ? totV / totW : 0;
  const estimate = Math.max(0, Math.min(3, mean));
  return {
    estimate: estimate,
    nObservations: elasticities.length,
    nGroups: Object.keys(groups).filter(k => groups[k].length >= 4).length,
    nObservationsTotal: observations.length,
    median: median(elasticities),
    p25: elasticities[Math.floor(n*0.25)],
    p75: elasticities[Math.floor(n*0.75)],
    nFilteredOccPre: nFilteredOccPre,
    nFilteredSmallAdr: nFilteredSmallAdr,
    nFilteredOutlier: nFilteredOutlier,
    method: 'pickup-window v2',
  };
}
const FP_OTA_MARKUP_DEFAULTS = { firenze: 12, condotta: 12, alfani: 12, davids: 12 };
const FP_CHANNEL_MARKUP_KEY = 'rmes_channel_markup_v1';
const FP_LMF_KEY = 'rmes_lastminute_factor_v1';
const FP_LMF_OCC_BANDS = [10,20,30,40,50,60,70,80,100];
const FP_LMF_DAY_BANDS = [[0,10],[11,30],[31,60],[61,365]];
const FP_LMF_DEFAULT = [
  [-15,-10,-5,0],   // <=10%
  [-15,-10,-5,0],   // <=20%
  [-10,-5,-5,0],    // <=30%
  [-5,-5,0,0],      // <=40%
  [-5,0,0,0],       // <=50%
  [0,0,0,0],        // <=60%
  [0,0,5,10],       // <=70%
  [0,5,10,15],      // <=80%
  [0,10,15,20],     // <=100%
];
function fp_getLmfMatrix(structKey){
  try {
    const raw = localStorage.getItem(FP_LMF_KEY);
    if (raw){
      const obj = JSON.parse(raw);
      if (obj && obj[structKey] && Array.isArray(obj[structKey]) && obj[structKey].length === FP_LMF_OCC_BANDS.length){
        return obj[structKey];
      }
    }
  } catch(e){}
  return FP_LMF_DEFAULT.map(r => r.slice());
}
function fp_setLmfMatrix(structKey, matrix){
  let obj = {};
  try { const raw = localStorage.getItem(FP_LMF_KEY); if (raw) obj = JSON.parse(raw) || {}; } catch(e){}
  obj[structKey] = matrix;
  try { localStorage.setItem(FP_LMF_KEY, JSON.stringify(obj)); } catch(e){}
}
function fp_lmfLookup(structKey, occFrac, daysToArrival){
  const m = fp_getLmfMatrix(structKey);
  const occPct = (occFrac != null && isFinite(occFrac)) ? occFrac * 100 : 0;
  let ri = FP_LMF_OCC_BANDS.findIndex(th => occPct <= th);
  if (ri < 0) ri = FP_LMF_OCC_BANDS.length - 1;
  let ci = FP_LMF_DAY_BANDS.findIndex(([lo,hi]) => daysToArrival >= lo && daysToArrival <= hi);
  if (ci < 0) ci = FP_LMF_DAY_BANDS.length - 1;
  const v = (m[ri] && m[ri][ci] != null) ? m[ri][ci] : 0;
  return isFinite(v) ? v : 0;
}
const FP_CHANNEL_MARKUP_DEFAULTS = {
  expedia: 17,   // Expedia e canali non specificati sotto (anche posizionamento online)
  booking: 13,   // Booking
  airbnb: 10     // Airbnb / VRBO
};
function fp_getChannelMarkups(){
  let obj = {};
  try { const raw = localStorage.getItem(FP_CHANNEL_MARKUP_KEY); if (raw) obj = JSON.parse(raw) || {}; } catch(e){}
  return {
    expedia: (obj.expedia != null && isFinite(obj.expedia)) ? +obj.expedia : FP_CHANNEL_MARKUP_DEFAULTS.expedia,
    booking: (obj.booking != null && isFinite(obj.booking)) ? +obj.booking : FP_CHANNEL_MARKUP_DEFAULTS.booking,
    airbnb:  (obj.airbnb  != null && isFinite(obj.airbnb))  ? +obj.airbnb  : FP_CHANNEL_MARKUP_DEFAULTS.airbnb
  };
}
function fp_setChannelMarkup(kind, pct){
  let obj = {};
  try { const raw = localStorage.getItem(FP_CHANNEL_MARKUP_KEY); if (raw) obj = JSON.parse(raw) || {}; } catch(e){}
  obj[kind] = +pct;
  try { localStorage.setItem(FP_CHANNEL_MARKUP_KEY, JSON.stringify(obj)); } catch(e){}
}
function fp_markupForChannel(canale){
  const c = (canale || '').toLowerCase();
  if (c === 'beddy' || c === 'diretto' || c === '—' || c === '' || c.indexOf('diret') !== -1 ||
      c.indexOf('sito web') !== -1 || c.indexOf('front') !== -1 || c.indexOf('booking engine') !== -1){
    return 0;  // canale diretto: nessun markup OTA
  }
  const m = fp_getChannelMarkups();
  if (c.indexOf('booking') !== -1) return m.booking;       // Booking.com
  if (c.indexOf('airbnb') !== -1 || c.indexOf('vrbo') !== -1) return m.airbnb;  // Airbnb/VRBO
  return m.expedia;  // Expedia + tutti gli altri OTA non specificati
}
function fp_getOtaMarkup(structKey){
  try {
    const raw = localStorage.getItem(FP_OTA_MARKUP_KEY);
    if (raw){
      const obj = JSON.parse(raw);
      if (obj && obj[structKey] != null && isFinite(obj[structKey])) return +obj[structKey];
    }
  } catch(e){}
  return FP_OTA_MARKUP_DEFAULTS[structKey] != null ? FP_OTA_MARKUP_DEFAULTS[structKey] : 12;
}
function fp_setOtaMarkup(structKey, value){
  let obj = {};
  try { obj = JSON.parse(localStorage.getItem(FP_OTA_MARKUP_KEY) || '{}'); } catch(e){}
  obj[structKey] = +value;
  try { localStorage.setItem(FP_OTA_MARKUP_KEY, JSON.stringify(obj)); } catch(e){}
}
function fp_recalcMarkupOnBookings(){
  if (typeof BOOKINGS === 'undefined') return;
  for (const b of BOOKINGS){
    if (!b.structKey) continue;
    const markupPct = (typeof fp_markupForChannel === 'function')
                    ? fp_markupForChannel(b.canale)
                    : fp_getOtaMarkup(b.structKey);
    const newMarkup = markupPct / 100;
    b.channelMarkup = newMarkup;
    b.revPerNightCaricato = b.revPerNight / (1 + newMarkup);
  }
}
function fp_getOverrides(){
  try {
    const raw = localStorage.getItem(FP_BASE_RATE_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch(e){ return {}; }
}
function fp_setOverride(structKey, dateISO, rt, price, snapshot){
  const all = fp_getOverrides();
  if (!all[structKey]) all[structKey] = {};
  if (!all[structKey][dateISO]) all[structKey][dateISO] = {};
  if (price == null || price === '' || !isFinite(price)){
    delete all[structKey][dateISO][rt];
    if (Object.keys(all[structKey][dateISO]).length === 0) delete all[structKey][dateISO];
  } else {
    all[structKey][dateISO][rt] = {
      price: +price,
      snapshot: snapshot || null,
      savedAt: new Date().toISOString(),
    };
  }
  localStorage.setItem(FP_BASE_RATE_OVERRIDES_KEY, JSON.stringify(all));
}
function fp_getOverride(structKey, dateISO, rt){
  try {
    const all = fp_getOverrides();
    if (all[structKey] && all[structKey][dateISO] && all[structKey][dateISO][rt] != null){
      const v = all[structKey][dateISO][rt];
      if (typeof v === 'number') return { price: v, snapshot: null, savedAt: null };
      return v;
    }
  } catch(e){}
  return null;
}
function fp_getOverridePrice(structKey, dateISO, rt){
  const o = fp_getOverride(structKey, dateISO, rt);
  return (o && o.price != null && isFinite(o.price)) ? +o.price : null;
}
/* === FOUNDATION OVERRIDE — chiave separata ===
   Diverso dall'override del price finale (sopra):
   - Override Foundation: sostituisce il price Foundation. I 5 fattori si applicano comunque
     SOPRA questo valore (override × moltiplicatore). Usato per periodi grandi quando vuoi
     forzare un price base diverso ma lasciare che RMES reagisca alle variazioni.
   - Override price finale (chiave sopra): sostituisce il price finale RMES. Usato per
     correzioni puntuali, di solito di 1 giorno.
   Struttura: { structKey: { 'YYYY-MM-DD': { rt: { price: <Beddy_eq>, savedAt } } } }
   Per i days futuri lontani senza override puntuale price finale, se c'è override Foundation
   per quel (struct, date, rt) → il price Foundation usato diventa quello.
*/
/* ============================================================
   FOUNDATION STATE — Stato di approvazione del price Foundation
   ============================================================
   Per ogni (struttura, data, room type), Foundation ha uno di 3 stati:
   - 'proposed' (default, NON salvato): valore calcolato dal sistema, 
     non rivisto dall'utente. È sempre il foundation_calcolato dinamico.
   - 'accepted': l'utente ha confermato il valore calcolato in un dato momento.
     Il valore viene CONGELATO al momento dell'accept. Anche se il foundation
     calcolato dovesse cambiare (es. nuovi dati storici), foundation_effettivo
     resta il valore congelato.
   - 'override': l'utente ha sovrascritto Foundation con un valore manuale.
     foundation_effettivo = quel valore, congelato.
   Schema storage (chiave: 'rmes_foundation_overrides_v1' — mantenuta dalla
   versione precedente per backward-compat. Il nome "overrides" è legacy:
   ora contiene sia 'accepted' che 'override').
   Struttura:
   {
     <structKey>: {
       'YYYY-MM-DD': {
         <rt>: {
           status: 'accepted' | 'override',
           value: <number>,                       // Foundation effective frozen
           calculatedAtSave: <number|null>,       // foundation_calcolato al momento dello save
           savedAt: <ISO timestamp>
         }
       }
     }
   }
   Backward-compat: vecchie entry erano {price, savedAt} → vengono lette come
   {status:'override', value:price, ...} automaticamente in fp_getFoundationState.
*/
const FP_FOUNDATION_OVERRIDES_KEY = 'rmes_foundation_overrides_v1';
function fp_getAllFoundationStates(){
  try {
    const raw = localStorage.getItem(FP_FOUNDATION_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch(e){ return {}; }
}
function fp_getFoundationState(structKey, dateISO, rt){
  try {
    const all = fp_getAllFoundationStates();
    const entry = all && all[structKey] && all[structKey][dateISO] && all[structKey][dateISO][rt];
    if (entry == null) return null;
    if (typeof entry === 'number'){
      return { status: 'override', value: entry, calculatedAtSave: null, savedAt: null };
    }
    if (entry.price != null && entry.status == null){
      return { status: 'override', value: +entry.price, calculatedAtSave: null, savedAt: entry.savedAt || null };
    }
    if (entry.status && entry.value != null){
      if (entry.status !== 'override') return null;
      return { status: 'override', value: +entry.value, calculatedAtSave: (entry.calculatedAtSave != null ? +entry.calculatedAtSave : null), savedAt: entry.savedAt || null };
    }
  } catch(e){}
  return null;
}
function fp_getFoundationEffectiveValue(structKey, dateISO, rt){
  const s = fp_getFoundationState(structKey, dateISO, rt);
  return s ? s.value : null;
}
function fp_getFoundationOverridePrice(structKey, dateISO, rt){
  return fp_getFoundationEffectiveValue(structKey, dateISO, rt);
}
function fp_setFoundationState(structKey, dateISO, rt, status, value, calculatedAtSnapshot){
  const all = fp_getAllFoundationStates();
  if (!all[structKey]) all[structKey] = {};
  if (!all[structKey][dateISO]) all[structKey][dateISO] = {};
  if (status == null){
    delete all[structKey][dateISO][rt];
    if (Object.keys(all[structKey][dateISO]).length === 0) delete all[structKey][dateISO];
  } else {
    if (status !== 'accepted' && status !== 'override') throw new Error('Invalid status: ' + status);
    if (value == null || !isFinite(value)) throw new Error('Invalid value');
    all[structKey][dateISO][rt] = {
      status: status,
      value: +value,
      calculatedAtSave: (calculatedAtSnapshot != null && isFinite(calculatedAtSnapshot)) ? +calculatedAtSnapshot : null,
      savedAt: new Date().toISOString(),
    };
  }
  try { localStorage.setItem(FP_FOUNDATION_OVERRIDES_KEY, JSON.stringify(all)); } catch(e){}
}
function fp_acceptFoundation(structKey, dateISO, rt, foundationCalculatedNow){
  fp_setFoundationState(structKey, dateISO, rt, 'accepted', foundationCalculatedNow, foundationCalculatedNow);
}
function fp_overrideFoundation(structKey, dateISO, rt, manualPrice, foundationCalculatedNow){
  fp_setFoundationState(structKey, dateISO, rt, 'override', manualPrice, foundationCalculatedNow);
}
function fp_resetFoundationState(structKey, dateISO, rt){
  fp_setFoundationState(structKey, dateISO, rt, null);
}
function fp_getFoundationOverrides(){
  return fp_getAllFoundationStates();
}
function fp_getFoundationOverride(structKey, dateISO, rt){
  return fp_getFoundationState(structKey, dateISO, rt);
}
function fp_setFoundationOverride(structKey, dateISO, rt, price){
  if (price == null || price === '' || !isFinite(price)){
    fp_resetFoundationState(structKey, dateISO, rt);
    return;
  }
  fp_setFoundationState(structKey, dateISO, rt, 'override', +price, null);
}
/* === FORECAST MONTHLY SNAPSHOT ===
   Salva uno snapshot del forecast per il "1° giorno del mese" per ogni mese × struttura.
   Permette di confrontare a chiusura mese il forecast iniziale vs come è effettivamente
   andato. Utile per misurare bias di previsione.
   Struttura storage:
     { structKey: { ymKey: { fcstRev, fcstRn, fcstOcc, fcstAdr, savedAt, savedAtYmd, lastSnapshotDay } } }
   ymKey = YYYYMM (es. 202606 per giugno 2026)
   Logica salvataggio automatico:
   - Quando renderForecast viene chiamato, controllo per ogni mese FUTURO o CURRENT:
     - Se non c'è snapshot → salvo (primo accesso al mese)
     - Se c'è snapshot ma è stato salvato in un giorno >= 2 del mese e siamo al giorno 1
       → ignoro (mantengo il più vecchio: il vero "1°")
   - Snapshot manuale: bottone "Salva snapshot" se voglio sovrascrivere.
*/
const FCST_MONTHLY_SNAP_KEY = 'fcst_monthly_snapshot_v1';
function fp_getFcstSnapshots(){
  try {
    const raw = localStorage.getItem(FCST_MONTHLY_SNAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch(e){ return {}; }
}
function fp_setFcstSnapshot(structKey, ymKey, snap){
  const all = fp_getFcstSnapshots();
  if (!all[structKey]) all[structKey] = {};
  all[structKey][ymKey] = Object.assign({}, snap, {savedAt: new Date().toISOString()});
  try { localStorage.setItem(FCST_MONTHLY_SNAP_KEY, JSON.stringify(all)); } catch(e){}
}
function fp_getFcstSnapshot(structKey, ymKey){
  try {
    const all = fp_getFcstSnapshots();
    if (all[structKey] && all[structKey][ymKey] != null) return all[structKey][ymKey];
  } catch(e){}
  return null;
}
function fp_deleteFcstSnapshot(structKey, ymKey){
  const all = fp_getFcstSnapshots();
  if (all[structKey] && all[structKey][ymKey]){
    delete all[structKey][ymKey];
    try { localStorage.setItem(FCST_MONTHLY_SNAP_KEY, JSON.stringify(all)); } catch(e){}
  }
}
function fp_maybeAutoSaveSnapshot(structKey, ymKey, fcstData, currentYmd){
  const existing = fp_getFcstSnapshot(structKey, ymKey);
  const monthYmd1 = Math.floor(ymKey/100)*10000 + (ymKey%100)*100 + 1;
  if (!existing){
    fp_setFcstSnapshot(structKey, ymKey, Object.assign({}, fcstData, {savedAtYmd: currentYmd}));
    return 'created';
  }
  if (existing.savedAtYmd && existing.savedAtYmd === monthYmd1) return 'preserved';
  if (currentYmd === monthYmd1){
    fp_setFcstSnapshot(structKey, ymKey, Object.assign({}, fcstData, {savedAtYmd: currentYmd}));
    return 'updated_to_day1';
  }
  return 'kept';
}
/* === AUDIT OVERRIDE post-chiusura ===
   Per ogni giorno passato con override attivo, confronta:
   - price reale praticato (= ADR OTB del giorno, Beddy_eq)
   - price che RMES avrebbe suggerito (snapshot salvato al momento dell'override)
   - RN finali vendute
   - revenue effective = ADR_reale × RN_finali
   - revenue ipotetico_RMES = RMES_snapshot × RN_finali (assume stesse RN)
   - winner: chi avrebbe portato più revenue
   Limitation: it assumes the SAME RN would have been sold at the RMES price.
   Reality: with a different price il pickup è diverso. Ma è l'unico calcolo possibile
   con i dati che abbiamo (storico Beddy del giorno chiuso).
*/
function fp_buildAuditOverrides(structKey){
  const out = [];
  if (typeof BOOKINGS === 'undefined') return out;
  const all = fp_getOverrides();
  const structOvrs = all[structKey];
  if (!structOvrs) return out;
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const structName = fp_structName(structKey);
  for (const dateISO in structOvrs){
    const dDate = new Date(dateISO + 'T00:00:00');
    if (isNaN(dDate.getTime())) continue;
    if (dDate >= today) continue;
    const rtMap = structOvrs[dateISO];
    for (const rt in rtMap){
      const ovr = rtMap[rt];
      if (typeof ovr === 'number') continue;  // backward-compat: senza snapshot non posso fare audit
      if (!ovr || ovr.price == null) continue;
      const rmesSuggested = (ovr.snapshot && ovr.snapshot.rmesSuggested != null && isFinite(ovr.snapshot.rmesSuggested))
                          ? ovr.snapshot.rmesSuggested : null;
      let rnFinali = 0;
      let revEffettivoBeddyEq = 0;
      const dYmd = ymd(dDate);
      for (const b of BOOKINGS){
        if (b.struct !== structName) continue;
        if (b.stato !== 'Confermate') continue;
        if (b.room !== rt) continue;
        if (!b.dIn || !b.dOut) continue;
        const ciYmd = ymd(b.dIn), coYmd = ymd(b.dOut);
        if (ciYmd <= dYmd && coYmd > dYmd){
          rnFinali++;
          revEffettivoBeddyEq += (b.revPerNightCaricato != null) ? b.revPerNightCaricato : b.revPerNight;
        }
      }
      const adrReale = (rnFinali > 0) ? (revEffettivoBeddyEq / rnFinali) : null;
      const revIpoteticoRMES = (rmesSuggested != null && rnFinali > 0) ? (rmesSuggested * rnFinali) : null;
      const deltaRev = (revIpoteticoRMES != null) ? (revEffettivoBeddyEq - revIpoteticoRMES) : null;
      const winner = (deltaRev == null) ? 'n/d'
                   : (Math.abs(deltaRev) < 1) ? 'pareggio'
                   : (deltaRev > 0) ? 'override' : 'rmes';
      out.push({
        date: dateISO,
        rt: rt,
        priceOverride: +ovr.price,
        priceRmesSuggested: rmesSuggested,
        priceRealeBeddyEq: adrReale,
        rnFinali: rnFinali,
        revEffettivo: revEffettivoBeddyEq,
        revIpoteticoRMES: revIpoteticoRMES,
        deltaRev: deltaRev,
        winner: winner,
        savedAt: ovr.savedAt,
      });
    }
  }
  out.sort((a,b) => b.date.localeCompare(a.date));
  return out;
}
/* Aggregato audit: ritorna stats su tutti i record */
function fp_auditAggregate(records){
  let nTot = records.length;
  let nWinRmes = 0, nWinOvr = 0, nPari = 0, nNd = 0;
  let deltaTot = 0;
  for (const r of records){
    if (r.winner === 'rmes') nWinRmes++;
    else if (r.winner === 'override') nWinOvr++;
    else if (r.winner === 'pareggio') nPari++;
    else nNd++;
    if (r.deltaRev != null && isFinite(r.deltaRev)) deltaTot += r.deltaRev;
  }
  return { nTot, nWinRmes, nWinOvr, nPari, nNd, deltaTot };
}
const FP_BASE_PRICE_DEFAULTS = { firenze: 220, condotta: 280, alfani: 270, davids: 145 };
function fp_getBasePrice(structKey){
  try {
    const raw = localStorage.getItem(FP_BASE_PRICE_KEY);
    if (raw){
      const obj = JSON.parse(raw);
      if (typeof obj[structKey] === 'number') return obj[structKey];
    }
  } catch(e){}
  return FP_BASE_PRICE_DEFAULTS[structKey] != null ? FP_BASE_PRICE_DEFAULTS[structKey] : 180;
}
function fp_setBasePrice(structKey, value){
  let obj = {};
  try { obj = JSON.parse(localStorage.getItem(FP_BASE_PRICE_KEY) || '{}'); } catch(e){}
  obj[structKey] = value;
  localStorage.setItem(FP_BASE_PRICE_KEY, JSON.stringify(obj));
}
function fp_getTargetGrowth(structKey, month){
  try {
    const raw = localStorage.getItem(FP_TARGET_GROWTH_KEY);
    if (raw){
      const obj = JSON.parse(raw);
      const s = obj[structKey];
      if (s && typeof s[month] === 'number') return s[month];
    }
  } catch(e){}
  return 5;
}
function fp_setTargetGrowth(structKey, month, pct){
  let obj = {};
  try { obj = JSON.parse(localStorage.getItem(FP_TARGET_GROWTH_KEY) || '{}'); } catch(e){}
  if (!obj[structKey]) obj[structKey] = {};
  obj[structKey][month] = pct;
  localStorage.setItem(FP_TARGET_GROWTH_KEY, JSON.stringify(obj));
}
function fp_getFloor(structKey){
  const FLOOR_DEFAULTS = { condotta: 200, alfani: 200, firenze: 150, davids: 100 };
  try {
    const raw = localStorage.getItem(FP_FLOOR_KEY);
    if (raw){
      const obj = JSON.parse(raw);
      if (typeof obj[structKey] === 'number') return obj[structKey];
    }
  } catch(e){}
  return (FLOOR_DEFAULTS[structKey] != null) ? FLOOR_DEFAULTS[structKey] : 100;
}
function fp_setFloor(structKey, value){
  let obj = {};
  try { obj = JSON.parse(localStorage.getItem(FP_FLOOR_KEY) || '{}'); } catch(e){}
  obj[structKey] = value;
  localStorage.setItem(FP_FLOOR_KEY, JSON.stringify(obj));
}
function fp_getCompsetConfig(structKey, competName){
  let peso = 100;
  try {
    if (typeof getWeight === 'function'){
      const w = getWeight(structKey, competName);  // 0..1
      peso = Math.round(w * 100);
    }
  } catch(e){}
  let offset = 0;
  let _offsetFound = false;
  try {
    const raw = localStorage.getItem(FP_COMPSET_OFFSETS_KEY);
    if (raw){
      const obj = JSON.parse(raw);
      const s = obj[structKey];
      if (s && typeof s[competName] === 'number'){ offset = s[competName]; _offsetFound = true; }
    }
  } catch(e){}
  if (!_offsetFound){
    const FP_COMPSET_OFFSET_DEFAULTS = {
      condotta: {"Residenza Marchesi Pontenani":50,"Palazzo Alfani al David":0,"Florence Art Apartments":0,"Casa del Sarto":50,"Granduomo Charming Accomodation":20,"Residence Hilda":0,"Ricasoli Garden Relais":0,"Residenza Della Signoria":20},
      firenze: {"Palazzo Alfani al David":-50,"Relais Condotta":50,"Residenza dei Pucci":50,"La Maison du Sage":-20,"Velona's Jungle Luxury Suites":0,"Residenza La Musa Amarcord":0,"Ricasoli Garden Relais":0},
      alfani: {"Chic Stay Boutique Apartments":0,"Martelli 6 Suites and Apartments":0,"Tornabuoni Suites Collection":-30,"Ricasoli Garden Relais":20,"Solo Experience Hotel":30,"Residenza Marchesi Pontenani":50,"Florence Art Apartments":0,"Granduomo Charming Accomodation":-20,"Residence Hilda":0,"Condotta 16 Apartments":0,"Casa del Sarto":0},
      davids: {"B&B Stanze Guelfe":10,"Residenza Fanti":-20,"RFC Repubblica Florence Core B&B":-100,"Althea Rooms":0,"Apollo Guest House":0,"Aramis Deluxe Rooms":-40,"Holiday Rooms Florence":0,"La Locandiera B&B":-20,"La Tana dei Leoni B&B":0,"Locanda il Salimbecco":0,"Residenza San Lorenzo":0}
    };
    if (FP_COMPSET_OFFSET_DEFAULTS[structKey] && typeof FP_COMPSET_OFFSET_DEFAULTS[structKey][competName] === 'number'){
      offset = FP_COMPSET_OFFSET_DEFAULTS[structKey][competName];
    }
  }
  return { peso: peso, offset: offset };
}
function fp_setCompsetOffset(structKey, competName, offset){
  let obj = {};
  try { obj = JSON.parse(localStorage.getItem(FP_COMPSET_OFFSETS_KEY) || '{}'); } catch(e){}
  if (!obj[structKey]) obj[structKey] = {};
  obj[structKey][competName] = offset;
  localStorage.setItem(FP_COMPSET_OFFSETS_KEY, JSON.stringify(obj));
}
function fp_setCompsetConfig(structKey, competName, peso, offset){
  try {
    if (typeof setWeight === 'function') setWeight(structKey, competName, peso/100);
  } catch(e){}
  fp_setCompsetOffset(structKey, competName, offset);
}
function fp_resetDefaults(structKey){
  try {
    const tg = JSON.parse(localStorage.getItem(FP_TARGET_GROWTH_KEY) || '{}');
    tg[structKey] = {};
    for (let m=1; m<=12; m++) tg[structKey][m] = 5;
    localStorage.setItem(FP_TARGET_GROWTH_KEY, JSON.stringify(tg));
    const bp = JSON.parse(localStorage.getItem(FP_BASE_PRICE_KEY) || '{}');
    bp[structKey] = FP_BASE_PRICE_DEFAULTS[structKey] != null ? FP_BASE_PRICE_DEFAULTS[structKey] : 180;
    localStorage.setItem(FP_BASE_PRICE_KEY, JSON.stringify(bp));
    const fl = JSON.parse(localStorage.getItem(FP_FLOOR_KEY) || '{}');
    fl[structKey] = 100;
    localStorage.setItem(FP_FLOOR_KEY, JSON.stringify(fl));
    const off = JSON.parse(localStorage.getItem(FP_COMPSET_OFFSETS_KEY) || '{}');
    off[structKey] = {};
    const compNames = fp_getCompetitorsForStruct(structKey);
    for (const cn of compNames) off[structKey][cn] = 0;
    localStorage.setItem(FP_COMPSET_OFFSETS_KEY, JSON.stringify(off));
  } catch(e){ console.error('fp_resetDefaults', e); }
}
function fp_getCompetitorsForStruct(structKey){
  if (typeof EXPEDIA_DATA === 'undefined' || !EXPEDIA_DATA) return [];
  const compMap = (structKey === 'alfani') ? EXPEDIA_DATA.competitors_alfani
                 : (structKey === 'firenze') ? EXPEDIA_DATA.competitors_firenze
                 : (structKey === 'davids') ? EXPEDIA_DATA.competitors_davids
                 : EXPEDIA_DATA.competitors;
  return compMap ? Object.keys(compMap) : [];
}
function fp_structName(structKey){
  return (structKey === 'condotta') ? 'Condotta 16'
       : (structKey === 'alfani')   ? 'Palazzo Alfani'
       : (structKey === 'davids')   ? "Florence David's Apartament"
       : 'Firenze Suite';
}
function fp_ratioForStruct(structKey){
  return (structKey === 'alfani') ? 0.823 : 0.775;  // davids/firenze/condotta = 0.775
}
function fp_invForRT(structKey, rt){
  if (typeof CFG === 'undefined' || !CFG.structures[structKey]) return 1;
  const rooms = CFG.structures[structKey].rooms || {};
  return rooms[rt] || 1;
}
function fp_isoDate(d){
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+dd;
}
function fp_ymdNumToDate(n){
  if (!n || typeof n !== 'number') return null;
  const y = Math.floor(n/10000);
  const m = Math.floor((n%10000)/100);
  const d = n%100;
  return new Date(y, m-1, d);
}
/* Sorgente RMES nuovo sistema: Base Price of the day for the property's baseRTa.
   Ritorna { price, source } con source = 'foundation' | 'fallback_<cascata>'.
   Usato dal calcolo RMES come price iniziale da aggiustare con i 5 fattori. */
function rmes_getSourcePrice(structKey, ymdNum, fallbackPrice){
  if (typeof FOUNDATION_PRICES === 'undefined' || !FOUNDATION_PRICES) return { price: fallbackPrice, source: 'fallback' };
  const d = fp_ymdNumToDate(ymdNum);
  if (!d) return { price: fallbackPrice, source: 'fallback' };
  const iso = fp_isoDate(d);
  const baseRT = (typeof CFG !== 'undefined' && CFG.structures && CFG.structures[structKey])
    ? CFG.structures[structKey].baseRT : null;
  if (!baseRT) return { price: fallbackPrice, source: 'fallback' };
  const r = fp_getPrice(structKey, baseRT, iso);
  if (r && r.price > 0) return { price: r.price, source: 'foundation' };
  return { price: fallbackPrice, source: 'fallback' };
}
/* _globalSupplementForRT(structKey, rt, month)
   Versione GLOBALE di _supplementForRT (che invece è una closure di renderSellStrategy e computeRMESPriceMap).
   Necessaria per la modale RMES dettaglio (fp_showDetailModalFromResult) che deve calcolare
   Foundation per RT non-base allineato alla tabella.
   Ritorna il supplemento mensile (alta/bassa stagione) della RT vs baseRT, in € Beddy_eq.
*/
function _globalSupplementForRT(structKey, rt, month){
  if (typeof aggPricingDaily !== 'function') return 0;
  try {
    const today = new Date(TODAY); today.setHours(0,0,0,0);
    const todayNum = today.getFullYear()*10000 + (today.getMonth()+1)*100 + today.getDate();
    const A = aggPricingDaily(structKey, todayNum, 1);
    if (!A || !A.baseRT || rt === A.baseRT) return 0;
    const s = A.supplementoStagione[rt];
    if (!s) return 0;
    const isHigh = (A.highSeason || []).includes(month);
    return isHigh ? s.alta : s.bassa;
  } catch(e){ return 0; }
}
/* 3.1 + 3.2: Ancora storica (mediana ADR/RN, fallback mese intero) */
let _ANCHOR_LY_CACHE = {};  // cache di fp_computeAnchorLY, keyed su struct|rt|mese|dow (invalidata al reload dati)
function fp_computeAnchorLY(structKey, rt, targetDateISO){
  if (!targetDateISO) return null;
  const _td = new Date(targetDateISO + 'T00:00:00');
  if (isNaN(_td.getTime())) return _fp_computeAnchorLY_impl(structKey, rt, targetDateISO);
  const _ak = structKey + '|' + rt + '|' + (_td.getMonth()+1) + '|' + _td.getDay();
  if (_ANCHOR_LY_CACHE[_ak] !== undefined) return _ANCHOR_LY_CACHE[_ak];
  const _r = _fp_computeAnchorLY_impl(structKey, rt, targetDateISO);
  _ANCHOR_LY_CACHE[_ak] = _r;
  return _r;
}
function _fp_computeAnchorLY_impl(structKey, rt, targetDateISO){
  if (!targetDateISO || typeof BOOKINGS === 'undefined') return null;
  const td = new Date(targetDateISO + 'T00:00:00');
  if (isNaN(td.getTime())) return null;
  const targetMonth = td.getMonth() + 1;
  const targetDow = td.getDay();
  const structName = fp_structName(structKey);
  const yearsToCheck = [2024, 2025];
  const targetDays = new Set();
  for (const y of yearsToCheck){
    const monthEnd = new Date(y, targetMonth, 0);
    for (let d = new Date(y, targetMonth-1, 1); d <= monthEnd; d.setDate(d.getDate()+1)){
      if (d.getDay() === targetDow) targetDays.add(ymd(d));
    }
  }
  if (targetDays.size === 0){
    return { medianADR: null, medianRN: null, nObs: 0, fallbackUsed: 'none' };
  }
  function _gather(allowedDays){
    const adrObs = [];
    const rnByDay = {};
    for (const b of BOOKINGS){
      if (b.struct !== structName) continue;
      if (b.room !== rt) continue;
      if (b.stato === 'Cancellate'){
        if (!b.cancelYmd || !b.dIn) continue;
        const cancelDate = fp_ymdNumToDate(b.cancelYmd);
        if (!cancelDate) continue;
        const leadDays = Math.floor((b.dIn - cancelDate) / 86400000);
        if (leadDays < 30) continue;
      } else if (b.stato !== 'Confermate'){
        continue;
      }
      if (!b.dIn || !b.dOut) continue;
      let hits = 0;
      for (let d = new Date(b.dIn); d < b.dOut; d.setDate(d.getDate()+1)){
        const k = ymd(d);
        if (allowedDays.has(k)){
          hits++;
          rnByDay[k] = (rnByDay[k] || 0) + 1;
        }
      }
      if (hits === 0) continue;
      const adrEq = b.revPerNightCaricato;
      if (adrEq > 0 && isFinite(adrEq)) adrObs.push(adrEq);
    }
    return { adrObs: adrObs, rnByDay: rnByDay };
  }
  let result = _gather(targetDays);
  let fallbackUsed = 'none';
  if (result.adrObs.length < 3){
    const wideDays = new Set();
    for (const y of yearsToCheck){
      const me = new Date(y, targetMonth, 0);
      for (let d = new Date(y, targetMonth-1, 1); d <= me; d.setDate(d.getDate()+1)){
        wideDays.add(ymd(d));
      }
    }
    result = _gather(wideDays);
    fallbackUsed = 'monthWide';
  }
  if (result.adrObs.length === 0){
    return { medianADR: null, medianRN: null, nObs: 0, fallbackUsed: fallbackUsed };
  }
  const adrs = result.adrObs.slice().sort(function(a,b){return a-b;});
  const medianADR = adrs[Math.floor(adrs.length/2)];
  const rnVals = Object.values(result.rnByDay).sort(function(a,b){return a-b;});
  const medianRN = rnVals.length > 0 ? rnVals[Math.floor(rnVals.length/2)] : 0;
  const _dowNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const _monthNames = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
  const setDesc = (fallbackUsed === 'monthWide')
    ? ('all days of ' + _monthNames[targetMonth] + ' 2024+2025')
    : ('every ' + _dowNames[targetDow] + ' of ' + _monthNames[targetMonth] + ' 2024+2025');
  return {
    medianADR: medianADR, medianRN: medianRN, nObs: result.adrObs.length, fallbackUsed: fallbackUsed,
    adrMin: adrs.length ? Math.round(adrs[0]) : null,
    adrMax: adrs.length ? Math.round(adrs[adrs.length-1]) : null,
    setDesc: setDesc,
    dowName: _dowNames[targetDow],
    monthName: _monthNames[targetMonth]
  };
}
/* 3.5: Curva booking window per struttura */
let _FP_BOOKING_CURVE_CACHE = {};
function fp_computeBookingCurve(structKey){
  if (_FP_BOOKING_CURVE_CACHE[structKey]) return _FP_BOOKING_CURVE_CACHE[structKey];
  const structName = fp_structName(structKey);
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const cutoffEnd = new Date(firstOfMonth.getTime() - 86400000);
  const cutoffStart = new Date(cutoffEnd.getFullYear()-1, cutoffEnd.getMonth(), cutoffEnd.getDate()+1);
  const MAX_LEAD = 365;
  const bookedAtLead = new Array(MAX_LEAD+1).fill(0);
  let totalRN = 0;
  for (const b of BOOKINGS){
    if (b.struct !== structName) continue;
    if (b.stato !== 'Confermate') continue;
    if (!b.dIn || !b.dOut || !b.dBook) continue;
    if (b.dIn < cutoffStart || b.dIn > cutoffEnd) continue;
    const nights = Math.max(1, b.notti || 1);
    const leadDays = Math.max(0, Math.floor((b.dIn - b.dBook) / 86400000));
    if (leadDays > MAX_LEAD) continue;
    bookedAtLead[leadDays] += nights;
    totalRN += nights;
  }
  if (totalRN === 0){
    _FP_BOOKING_CURVE_CACHE[structKey] = { curve: null, totalRN: 0 };
    return _FP_BOOKING_CURVE_CACHE[structKey];
  }
  const cum = new Array(MAX_LEAD+1).fill(0);
  cum[0] = bookedAtLead[0];
  for (let k=1; k<=MAX_LEAD; k++) cum[k] = cum[k-1] + bookedAtLead[k];
  const curve = new Array(MAX_LEAD+1).fill(0);
  for (let k=0; k<=MAX_LEAD; k++){
    curve[k] = (totalRN - cum[k]) / totalRN;
  }
  _FP_BOOKING_CURVE_CACHE[structKey] = { curve: curve, totalRN: totalRN };
  return _FP_BOOKING_CURVE_CACHE[structKey];
}
function fp_invalidateBookingCurve(){
  _FP_BOOKING_CURVE_CACHE = {};
}
function fp_positionInCurve(structKey, daysToArrival){
  if (daysToArrival < 0) return 1;
  if (daysToArrival > 365) return 0;
  const data = fp_computeBookingCurve(structKey);
  if (!data || !data.curve) return 0.5;
  return data.curve[daysToArrival] || 0;
}
/* Pace + pickup atteso */
function fp_computePace(structKey, rt, targetDateISO){
  if (!targetDateISO || typeof BOOKINGS === 'undefined') return 1.0;
  const td = new Date(targetDateISO + 'T00:00:00');
  if (isNaN(td.getTime())) return 1.0;
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const tdLY = new Date(td.getTime() - 364*86400000);
  const todayLY = new Date(today.getTime() - 364*86400000);
  const structName = fp_structName(structKey);
  const tdYmd = ymd(td), tdLYYmd = ymd(tdLY);
  const todayYmd = ymd(today), todayLYYmd = ymd(todayLY);
  function weekOf(bookYmd, refTodayYmd){
    const by = new Date(parseInt(String(bookYmd).slice(0,4)), parseInt(String(bookYmd).slice(4,6))-1, parseInt(String(bookYmd).slice(6,8)));
    const ref = new Date(parseInt(String(refTodayYmd).slice(0,4)), parseInt(String(refTodayYmd).slice(4,6))-1, parseInt(String(refTodayYmd).slice(6,8)));
    const daysAgo = Math.floor((ref - by) / 86400000);
    if (daysAgo < 0) return -1;
    if (daysAgo <= 6) return 3;   // settimana più recente
    if (daysAgo <= 13) return 2;
    if (daysAgo <= 20) return 1;
    if (daysAgo <= 27) return 0;  // settimana più vecchia delle 4
    return -2;                    // più vecchio di 28gg (pickup "di fondo")
  }
  const W = (typeof PACE_WEEK_WEIGHTS !== 'undefined' && PACE_WEEK_WEIGHTS.length===4) ? PACE_WEEK_WEIGHTS : [0.10,0.20,0.30,0.40];
  let rnNow = 0, rnLY = 0;
  let wNow = 0, wLY = 0;          // somme pesate del pickup ultime 4 settimane
  let baseNow = 0, baseLY = 0;    // pickup "di fondo" (>28gg): contribuisce a peso pieno 1.0
  for (const b of BOOKINGS){
    if (b.struct !== structName) continue;
    if (b.stato !== 'Confermate') continue;
    if (b.room !== rt) continue;
    if (!b.dIn || !b.dOut || !b.bookYmd) continue;
    const ciYmd = ymd(b.dIn), coYmd = ymd(b.dOut);
    if (b.bookYmd <= todayYmd && ciYmd <= tdYmd && coYmd > tdYmd){
      rnNow++;
      const wk = weekOf(b.bookYmd, todayYmd);
      if (wk >= 0) wNow += W[wk]; else if (wk === -2) baseNow += 1.0;
    }
    if (b.bookYmd <= todayLYYmd && ciYmd <= tdLYYmd && coYmd > tdLYYmd){
      rnLY++;
      const wk = weekOf(b.bookYmd, todayLYYmd);
      if (wk >= 0) wLY += W[wk]; else if (wk === -2) baseLY += 1.0;
    }
  }
  if (rnLY === 0) return 1.0;
  const numNow = wNow + baseNow;
  const numLY  = wLY  + baseLY;
  let pace;
  if (numLY > 0 && numNow > 0){
    pace = numNow / numLY;
  } else {
    pace = rnNow / rnLY;   // fallback al pace non pesato
  }
  if (rnLY < 4){
    pace = Math.sqrt(pace);
  }
  return Math.max(0.70, Math.min(1.30, pace));
}
function fp_computePickupLYResiduo(structKey, rt, targetDateISO){
  if (!targetDateISO || typeof BOOKINGS === 'undefined') return 0;
  const td = new Date(targetDateISO + 'T00:00:00');
  if (isNaN(td.getTime())) return 0;
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const tdLY = new Date(td.getTime() - 364*86400000);
  const todayLY = new Date(today.getTime() - 364*86400000);
  const todayLYYmd = ymd(todayLY), tdLYYmd = ymd(tdLY);
  const structName = fp_structName(structKey);
  let pickupLY = 0;
  for (const b of BOOKINGS){
    if (b.struct !== structName) continue;
    if (b.stato !== 'Confermate') continue;
    if (b.room !== rt) continue;
    if (!b.dIn || !b.dOut || !b.bookYmd) continue;
    const ciYmd = ymd(b.dIn), coYmd = ymd(b.dOut);
    if (!(ciYmd <= tdLYYmd && coYmd > tdLYYmd)) continue;
    if (b.bookYmd <= todayLYYmd) continue;
    pickupLY++;
  }
  return pickupLY;
}
/* 3.7: Cap di mercato */
function fp_computeMarketCap(structKey, targetDateISO, daysToArrival){
  if (typeof EXPEDIA_DATA === 'undefined' || !EXPEDIA_DATA) return null;
  const compMap = (structKey === 'alfani') ? EXPEDIA_DATA.competitors_alfani
                : (structKey === 'firenze') ? EXPEDIA_DATA.competitors_firenze
                : (structKey === 'davids') ? EXPEDIA_DATA.competitors_davids
                : EXPEDIA_DATA.competitors;
  if (!compMap) return null;
  const divisor = fp_expToBeddyDivisor(structKey);
  let weightedSum = 0, weightSum = 0;
  const details = [];
  for (const name of Object.keys(compMap)){
    const cfg = fp_getCompsetConfig(structKey, name);
    if (cfg.peso <= 0) continue;
    const rawPrice = compMap[name][targetDateISO];
    if (rawPrice == null || !isFinite(rawPrice)) continue;
    const beddyEq = rawPrice / divisor;
    const adjusted = beddyEq + cfg.offset;
    weightedSum += cfg.peso * adjusted;
    weightSum += cfg.peso;
    details.push({ name: name, peso: cfg.peso, offset: cfg.offset, rawPrice: rawPrice, beddyEq: beddyEq, adjusted: adjusted });
  }
  if (weightSum === 0) return null;
  const ref = weightedSum / weightSum;
  const FP_CONSERV_WINDOW_DAYS = 60;
  const capHi = (typeof daysToArrival === 'number' && daysToArrival <= FP_CONSERV_WINDOW_DAYS) ? 0.90 : 1.20;
  return { ref: ref, min: ref * 0.80, max: ref * capHi, capHi: capHi, conservative: capHi < 1.20, nCompet: details.length, details: details };
}
/* Helpers ADR/RN OTB */
function fp_adrOtbForDay(structKey, rt, targetDateISO){
  if (typeof BOOKINGS === 'undefined') return null;
  const td = new Date(targetDateISO + 'T00:00:00');
  if (isNaN(td.getTime())) return null;
  const tdYmd = ymd(td);
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const todayYmd = ymd(today);
  const structName = fp_structName(structKey);
  let totADR = 0, totRN = 0;
  for (const b of BOOKINGS){
    if (b.struct !== structName) continue;
    if (b.stato !== 'Confermate') continue;
    if (b.room !== rt) continue;
    if (!b.dIn || !b.dOut || !b.bookYmd) continue;
    if (b.bookYmd > todayYmd) continue;
    const ciYmd = ymd(b.dIn), coYmd = ymd(b.dOut);
    if (!(ciYmd <= tdYmd && coYmd > tdYmd)) continue;
    if (b.revPerNightCaricato > 0 && isFinite(b.revPerNightCaricato)){
      totADR += b.revPerNightCaricato;
      totRN++;
    }
  }
  return totRN > 0 ? (totADR/totRN) : null;
}
function fp_rnOtbForDay(structKey, rt, targetDateISO){
  if (typeof BOOKINGS === 'undefined') return 0;
  const td = new Date(targetDateISO + 'T00:00:00');
  if (isNaN(td.getTime())) return 0;
  const tdYmd = ymd(td);
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const todayYmd = ymd(today);
  const structName = fp_structName(structKey);
  let cnt = 0;
  for (const b of BOOKINGS){
    if (b.struct !== structName) continue;
    if (b.stato !== 'Confermate') continue;
    if (b.room !== rt) continue;
    if (!b.dIn || !b.dOut || !b.bookYmd) continue;
    if (b.bookYmd > todayYmd) continue;
    const ciYmd = ymd(b.dIn), coYmd = ymd(b.dOut);
    if (ciYmd <= tdYmd && coYmd > tdYmd) cnt++;
  }
  return cnt;
}
/* Revenue OTB Beddy_eq della specifica RT in un giorno.
   Usa b.revPerNightCaricato che è già "Beddy_eq" (= revPerNight / 1.12 se OTA,
   identico al revPerNight se sito diretto/Beddy).
   Serve a Foundation per calcolare il "target del price per le residual RN":
   se ho già coperto il revenue target con le RN già vendute, non devo abbassare per quelle residue.
*/
function fp_revOtbBeddyEqForDay(structKey, rt, targetDateISO){
  if (typeof BOOKINGS === 'undefined') return 0;
  const td = new Date(targetDateISO + 'T00:00:00');
  if (isNaN(td.getTime())) return 0;
  const tdYmd = ymd(td);
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const todayYmd = ymd(today);
  const structName = fp_structName(structKey);
  let rev = 0;
  for (const b of BOOKINGS){
    if (b.struct !== structName) continue;
    if (b.stato !== 'Confermate') continue;
    if (b.room !== rt) continue;
    if (!b.dIn || !b.dOut || !b.bookYmd) continue;
    if (b.bookYmd > todayYmd) continue;
    const ciYmd = ymd(b.dIn), coYmd = ymd(b.dOut);
    if (ciYmd <= tdYmd && coYmd > tdYmd){
      rev += (b.revPerNightCaricato != null) ? b.revPerNightCaricato : b.revPerNight;
    }
  }
  return rev;
}
/* Calcolo price Foundation per (struct, RT, day) */
function fp_computePrice(structKey, rt, targetDateISO){
  if (!targetDateISO) return null;
  const td = new Date(targetDateISO + 'T00:00:00');
  if (isNaN(td.getTime())) return null;
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const daysToArrival = Math.floor((td - today) / 86400000);
  const month = td.getMonth() + 1;
  if (daysToArrival < 0) return null;
  const floor = fp_getFloor(structKey);
  const basePrice = fp_getBasePrice(structKey);
  const detail = { structKey: structKey, rt: rt, targetDateISO: targetDateISO,
                   daysToArrival: daysToArrival, month: month, floor: floor, basePrice: basePrice };
  const anchor = fp_computeAnchorLY(structKey, rt, targetDateISO);
  detail.anchor = anchor;
  if (daysToArrival > 180){
    detail.longHorizon = true;
    const targetGrowth = fp_getTargetGrowth(structKey, month);
    detail.targetGrowthPct = targetGrowth;
    if (!anchor || !anchor.medianADR){
      detail.priceSource = 'baseTimesGrowth';
      const p = basePrice * (1 + targetGrowth/100);
      detail.anchorOrBase = basePrice;
      detail.anchorOrBaseSource = 'base (no LY)';
      detail.priceFinal = Math.max(p, floor);
      return { price: detail.priceFinal, detail: detail };
    }
    const anchorOrBase = Math.max(basePrice, anchor.medianADR);
    detail.priceSource = (anchorOrBase === basePrice && basePrice > anchor.medianADR) ? 'baseTimesGrowth' : 'anchorTimesGrowth';
    detail.anchorOrBase = anchorOrBase;
    detail.anchorOrBaseSource = (anchorOrBase === basePrice && basePrice > anchor.medianADR) ? 'base (> LYmedian)' : 'LYmedian (≥ base)';
    const p = anchorOrBase * (1 + targetGrowth/100);
    detail.priceFinal = Math.max(p, floor);
    return { price: detail.priceFinal, detail: detail };
  }
  detail.longHorizon = false;
  if (!anchor || !anchor.medianADR || anchor.nObs < 1){
    detail.priceSource = 'fallback_no_anchor';
    const otb = fp_adrOtbForDay(structKey, rt, targetDateISO);
    const p = (otb && otb > 0) ? otb : floor;
    detail.priceFinal = Math.max(p, floor);
    return { price: detail.priceFinal, detail: detail };
  }
  const adrLY = anchor.medianADR;
  const rnLY = anchor.medianRN || 1;
  const revLY = adrLY * rnLY;
  detail.adrLY = adrLY;
  detail.rnLY = rnLY;
  detail.revLY = revLY;
  const targetGrowth = fp_getTargetGrowth(structKey, month);
  detail.targetGrowthPct = targetGrowth;
  const revTarget = revLY * (1 + targetGrowth/100);
  detail.revTarget = revTarget;
  const pace = fp_computePace(structKey, rt, targetDateISO);
  const rnOtb = fp_rnOtbForDay(structKey, rt, targetDateISO);
  const inv = fp_invForRT(structKey, rt);
  const rnAtteseChiusura = (isFinite(rnLY) && rnLY > 0 ? rnLY : rnOtb) * pace;
  const rnAttese = Math.max(0, Math.min(inv, Math.max(rnOtb, rnAtteseChiusura)));
  const pickupAtteso = Math.max(0, rnAttese - rnOtb);
  const pickupLYResiduo = fp_computePickupLYResiduo(structKey, rt, targetDateISO);
  detail.pace = pace;
  detail.pickupLYResiduo = pickupLYResiduo;
  detail.pickupAtteso = pickupAtteso;
  detail.rnOtb = rnOtb;
  detail.rnAttese = rnAttese;
  detail.rnAtteseChiusura = rnAtteseChiusura;
  detail.rnLY = rnLY;
  detail.inv = inv;
  const revYaFattoBeddyEq = fp_revOtbBeddyEqForDay(structKey, rt, targetDateISO);
  const adrOtbBeddyEq = (rnOtb > 0) ? (revYaFattoBeddyEq / rnOtb) : 0;
  const tettoStorico = adrLY * (1 + targetGrowth/100);  // = ADR LY × (1 + growth%)
  detail.revYaFattoBeddyEq = revYaFattoBeddyEq;
  detail.adrOtbBeddyEq = adrOtbBeddyEq;
  detail.tettoStorico = tettoStorico;
  let adrTargetChiusura;
  let _adrTargetCase = null;
  if (revYaFattoBeddyEq >= revTarget){
    adrTargetChiusura = Math.max(adrOtbBeddyEq, tettoStorico);
    _adrTargetCase = 'target_superato';
  } else if (revYaFattoBeddyEq >= 0.95 * revTarget){
    adrTargetChiusura = Math.max(adrOtbBeddyEq, tettoStorico);
    _adrTargetCase = 'vicino_target';
  } else {
    const rnResidue = Math.max(1, rnAttese - rnOtb);
    const revResiduo = revTarget - revYaFattoBeddyEq;
    const adrFormula = (rnResidue > 0) ? (revResiduo / rnResidue) : adrLY;
    const occOtb = (inv > 0) ? (rnOtb / inv) : 0;
    let floorPrezzo = tettoStorico;
    if (occOtb >= 0.50 && adrOtbBeddyEq > 0){
      floorPrezzo = Math.max(floorPrezzo, adrOtbBeddyEq);
    }
    adrTargetChiusura = Math.max(adrFormula, floorPrezzo);
    detail.floorPrezzoCasoC = floorPrezzo;
    detail.occOtbForFloor = occOtb;
    _adrTargetCase = 'sotto_target';
  }
  detail.adrTargetChiusura = adrTargetChiusura;
  detail.adrTargetCase = _adrTargetCase;
  const pGrezzo = adrTargetChiusura;
  detail.pGrezzo = pGrezzo;
  detail.pos = fp_positionInCurve(structKey, daysToArrival);
  const mcap = fp_computeMarketCap(structKey, targetDateISO, daysToArrival);
  detail.marketCap = mcap;
  let pCapped = pGrezzo;
  if (mcap && mcap.nCompet > 0){
    pCapped = Math.max(mcap.min, Math.min(mcap.max, pGrezzo));
  }
  detail.pCapped = pCapped;
  const pFloored = Math.max(pCapped, floor);
  detail.pFloored = pFloored;
  let pBaseLifted = pFloored;
  if (pFloored < basePrice){
    pBaseLifted = (pFloored + basePrice) / 2;
    detail.baseLiftApplied = true;
    detail.baseLiftFrom = pFloored;
  } else {
    detail.baseLiftApplied = false;
  }
  detail.pBaseLifted = pBaseLifted;
  if (pBaseLifted < adrTargetChiusura * 0.92){
    detail.retargetTriggered = true;
    const revTargetEffettivo = pBaseLifted * rnAttese;
    detail.targetGrowthEffettivo = (revLY > 0) ? (revTargetEffettivo/revLY - 1)*100 : 0;
  } else {
    detail.retargetTriggered = false;
  }
  detail.priceFinal = pBaseLifted;
  return { price: pBaseLifted, detail: detail };
}
/* Pre-compute globale */
let FOUNDATION_PRICES = {};
function fp_computeStruct(sk){
  if (typeof FOUNDATION_PRICES === 'undefined' || FOUNDATION_PRICES === null) FOUNDATION_PRICES = {};
  if (!CFG.structures[sk]) return;
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const horizonDays = 365;
  const rts = Object.keys(CFG.structures[sk].rooms || {});
  FOUNDATION_PRICES[sk] = {};
  for (let day=0; day<horizonDays; day++){
    const d = new Date(today.getTime() + day*86400000);
    const iso = fp_isoDate(d);
    FOUNDATION_PRICES[sk][iso] = {};
    for (const rt of rts){
      try { const r = fp_computePrice(sk, rt, iso); if (r) FOUNDATION_PRICES[sk][iso][rt] = r; }
      catch(e){ /* skip */ }
    }
  }
  return FOUNDATION_PRICES[sk];
}
function fp_isStructComputed(sk){
  return !!(typeof FOUNDATION_PRICES !== 'undefined' && FOUNDATION_PRICES && FOUNDATION_PRICES[sk] && Object.keys(FOUNDATION_PRICES[sk]).length > 0);
}
function fp_ensureStruct(sk){
  if (sk === 'both'){
    for (const k of ['firenze','condotta','alfani','davids']) if (!fp_isStructComputed(k)) fp_computeStruct(k);
    return;
  }
  if (!fp_isStructComputed(sk)) fp_computeStruct(sk);
}
function fp_computeAll(progressCallback){
  FOUNDATION_PRICES = {};
  fp_invalidateBookingCurve();
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const horizonDays = 365;
  const structKeys = ['firenze', 'condotta', 'alfani', 'davids'];
  let totalCells = 0, doneCells = 0;
  for (const sk of structKeys){
    const rts = Object.keys(CFG.structures[sk].rooms || {});
    totalCells += rts.length * horizonDays;
  }
  for (const sk of structKeys){
    FOUNDATION_PRICES[sk] = {};
    const rts = Object.keys(CFG.structures[sk].rooms || {});
    for (let day=0; day<horizonDays; day++){
      const d = new Date(today.getTime() + day*86400000);
      const iso = fp_isoDate(d);
      FOUNDATION_PRICES[sk][iso] = {};
      for (const rt of rts){
        try {
          const r = fp_computePrice(sk, rt, iso);
          if (r) FOUNDATION_PRICES[sk][iso][rt] = r;
        } catch(e){
          console.error('fp_computePrice error', sk, rt, iso, e);
        }
        doneCells++;
      }
    }
    if (progressCallback) progressCallback(doneCells, totalCells);
  }
  if (progressCallback) progressCallback(totalCells, totalCells);
  return FOUNDATION_PRICES;
}
function fp_getPrice(structKey, rt, dateISO){
  const s = FOUNDATION_PRICES[structKey];
  if (!s) return null;
  const d = s[dateISO];
  if (!d) return null;
  return d[rt] || null;
}
/* ============================================================
   END FOUNDATION PRICING
   ============================================================ */
/* ============================================================
   FOUNDATION PRICING — UI: modale dettaglio + tab RMES sezione
   ============================================================ */
/* ---------- Mini-popup approvazione Foundation ----------
   Si apre cliccando una cella Foundation nella Sell Strategy.
   Mostra: data, RT, valore calcolato, stato corrente.
   Azioni: Accetta (congela il calcolato), Modifica (override manuale),
   Reset (torna a proposed), Vedi dettaglio 6 step (apre modale grossa).
*/
function fp_showFoundationApprovalPopup(structKey, rt, dateISO, fpCalcFromCell, anchorEl){
  const existing = document.getElementById('fp-approval-popup');
  if (existing) existing.remove();
  const calcResult = (typeof fp_getPrice === 'function') ? fp_getPrice(structKey, rt, dateISO) : null;
  const fpCalcNow = calcResult ? calcResult.price : (fpCalcFromCell != null ? fpCalcFromCell : null);
  const state = (typeof fp_getFoundationState === 'function') ? fp_getFoundationState(structKey, rt, dateISO) : null;
  const isOverride = !!(state && state.status === 'override');
  const status = isOverride ? 'override' : 'proposed';
  const effective = isOverride ? state.value : fpCalcNow;
  const td = new Date(dateISO + 'T00:00:00');
  const dowNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dateLbl = dowNames[td.getDay()] + ' ' + td.getDate() + '/' + (td.getMonth()+1) + '/' + td.getFullYear();
  const structLbl = (structKey === 'firenze') ? 'Firenze Suite'
                  : (structKey === 'condotta') ? 'Condotta 16'
                  : (structKey === 'alfani') ? 'Palazzo Alfani' : (structKey === 'davids') ? "Enis Guesthouse" : structKey;
  let statusBg, statusBorder, statusLabel, statusIcon, statusCol;
  if (isOverride){
    statusBg = 'rgba(59,107,154,.12)'; statusBorder = '#3b6b9a';
    statusLabel = 'OVERRIDE (valore manuale)'; statusIcon = '🖋'; statusCol = '#1e4a6b';
  } else {
    statusBg = 'rgba(195,131,59,.10)'; statusBorder = '#c4823b';
    statusLabel = 'COMPUTED (dynamic)'; statusIcon = '⚡'; statusCol = '#7a4f1c';
  }
  const popup = document.createElement('div');
  popup.id = 'fp-approval-popup';
  popup.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:\'DM Sans\',sans-serif';
  popup.onclick = (e) => { if (e.target === popup) popup.remove(); };
  let h = '<div style="background:#fff;border-radius:8px;max-width:480px;width:100%;font-size:13px;line-height:1.5;color:#222;box-shadow:0 8px 32px rgba(0,0,0,.3);overflow:hidden">';
  h += '<div style="padding:14px 18px;background:#f8f8f5;border-bottom:1px solid #e8e6df;display:flex;justify-content:space-between;align-items:flex-start">';
  h += '<div><div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#888;font-weight:700">Base Price</div>';
  h += '<div style="font-size:15px;font-weight:700;margin-top:2px">' + escapeHtml(structLbl) + ' · ' + escapeHtml(rt) + '</div>';
  h += '<div style="font-size:12px;color:#666;margin-top:2px;font-family:\'DM Mono\',monospace">' + dateLbl + '</div></div>';
  h += '<button onclick="document.getElementById(\'fp-approval-popup\').remove()" style="background:none;border:none;font-size:24px;color:#888;cursor:pointer;padding:0 4px;line-height:1">×</button>';
  h += '</div>';
  h += '<div style="padding:16px 18px">';
  h += '<div style="background:' + statusBg + ';border:1px solid ' + statusBorder + ';border-radius:6px;padding:12px 14px;margin-bottom:14px">';
  h += '<div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:' + statusCol + ';font-weight:700;margin-bottom:6px">' + statusIcon + ' ' + statusLabel + '</div>';
  h += '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:14px">';
  h += '<div><div style="font-size:11px;color:#888">Effective reference (used by factors)</div>';
  h += '<div style="font-size:26px;font-weight:700;font-family:\'DM Mono\',monospace;color:' + statusCol + '">' + (effective != null ? '€' + effective.toFixed(0) : '—') + '</div></div>';
  if (status !== 'proposed' && fpCalcNow != null && state){
    const driftAbs = fpCalcNow - state.value;
    const driftPct = state.value > 0 ? driftAbs / state.value : 0;
    const driftCol = Math.abs(driftPct) >= 0.03 ? '#c4823b' : '#888';
    h += '<div style="text-align:right"><div style="font-size:11px;color:#888">Computed today would be</div>';
    h += '<div style="font-size:16px;font-weight:600;font-family:\'DM Mono\',monospace;color:#888;text-decoration:line-through">€' + fpCalcNow.toFixed(0) + '</div>';
    if (Math.abs(driftPct) >= 0.01){
      h += '<div style="font-size:11px;color:' + driftCol + ';font-weight:600">' + (driftAbs >= 0 ? '+' : '') + '€' + Math.abs(driftAbs).toFixed(0) + ' (' + (driftPct >= 0 ? '+' : '') + (driftPct*100).toFixed(1) + '%)</div>';
    }
    h += '</div>';
  }
  h += '</div>';
  if (state && state.savedAt){
    const savedDate = new Date(state.savedAt);
    h += '<div style="font-size:10.5px;color:#888;margin-top:6px">Saved on ' + savedDate.getDate() + '/' + (savedDate.getMonth()+1) + '/' + savedDate.getFullYear() + '</div>';
  }
  h += '</div>';
  h += '<div style="margin-bottom:10px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.04em;font-weight:600">Actions</div>';
  h += '<div style="display:flex;flex-direction:column;gap:8px">';
  h += '<div id="fp-popup-override-block" style="display:flex;gap:6px;align-items:stretch">';
  h += '<input type="number" id="fp-popup-override-input" min="0" max="9999" step="5" placeholder="€" value="' + (status === 'override' && state ? state.value.toFixed(0) : (fpCalcNow != null ? fpCalcNow.toFixed(0) : '')) + '" style="flex:0 0 110px;padding:10px;border:1px solid #3b6b9a;background:#eef4fb;border-radius:5px;font-family:\'DM Mono\',monospace;text-align:right;font-size:14px;font-weight:700;color:#1e4a6b">';
  h += '<button id="fp-popup-override" style="flex:1;padding:10px 14px;border:1px solid #3b6b9a;background:#3b6b9a;color:#fff;border-radius:5px;font-family:\'DM Sans\',sans-serif;font-size:13px;font-weight:600;cursor:pointer;text-align:left">';
  h += '<div>🖋 Save override</div>';
  h += '<div style="font-size:10.5px;font-weight:400;opacity:.85;margin-top:3px">Manual value frozen. The 5 factors will start from here.</div>';
  h += '</button></div>';
  if (status !== 'proposed'){
    h += '<button id="fp-popup-reset" style="padding:8px 14px;border:1px solid #999;background:#fff;color:#666;border-radius:5px;font-family:\'DM Sans\',sans-serif;font-size:12px;cursor:pointer;text-align:left">';
    h += '↺ Reset Base Price override (back to frozen value)';
    h += '</button>';
  }
  h += '</div>';  // chiudo lista azioni
  h += '<div style="margin-top:14px;padding-top:12px;border-top:1px solid #e8e6df;text-align:center">';
  h += '<button id="fp-popup-detail" style="background:none;border:none;color:#7a4f1c;font-size:12px;font-weight:600;cursor:pointer;text-decoration:underline;font-family:\'DM Sans\',sans-serif">📖 See Base Price calculation detail</button>';
  h += '</div>';
  h += '</div>';  // chiudo body
  h += '</div>';  // chiudo box
  popup.innerHTML = h;
  document.body.appendChild(popup);
  const _refresh = () => {
    popup.remove();
    if (typeof renderSellStrategy === 'function' && typeof CURRENT_STRUCT !== 'undefined'){
      try { renderSellStrategy(CURRENT_STRUCT); } catch(e){}
    }
  };
  const btnOverride = document.getElementById('fp-popup-override');
  if (btnOverride){
    btnOverride.onclick = () => {
      const inp = document.getElementById('fp-popup-override-input');
      const v = parseFloat(inp.value);
      if (!isFinite(v) || v <= 0){
        alert('Enter a valid price > 0');
        return;
      }
      if (typeof fp_overrideFoundation === 'function'){
        fp_overrideFoundation(structKey, dateISO, rt, v, fpCalcNow);
        _refresh();
      }
    };
  }
  const btnReset = document.getElementById('fp-popup-reset');
  if (btnReset){
    btnReset.onclick = () => {
      if (!confirm("Reset Base Price override? It will revert to the frozen value.")) return;
      if (typeof fp_resetFoundationState === 'function'){
        fp_resetFoundationState(structKey, dateISO, rt);
        _refresh();
      }
    };
  }
  const btnDetail = document.getElementById('fp-popup-detail');
  if (btnDetail){
    btnDetail.onclick = () => {
      popup.remove();
      if (typeof fp_showFoundationOnlyModal === 'function') fp_showFoundationOnlyModal(structKey, rt, dateISO);
    };
  }
}
/* ---------- Modale dettaglio Foundation ---------- */
function fp_showDetailModal(structKey, rt, dateISO){
  const existing = document.getElementById('fp-detail-modal');
  if (existing) existing.remove();
  const r = fp_getPrice(structKey, rt, dateISO);
  if (!r){
    const c = fp_computePrice(structKey, rt, dateISO);
    if (!c){
      alert('Cannot compute Base Price for ' + structKey + ' / ' + rt + ' / ' + dateISO);
      return;
    }
    return fp_showDetailModalFromResult(c, structKey, rt, dateISO);
  }
  return fp_showDetailModalFromResult(r, structKey, rt, dateISO);
}
function fp_showDetailModalFromResult(r, structKey, rt, dateISO){
  const d = r.detail;
  const td = new Date(dateISO + 'T00:00:00');
  const dowNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dowLbl = dowNames[td.getDay()];
  const dateLbl = td.getDate() + '/' + (td.getMonth()+1) + '/' + td.getFullYear();
  const structLbl = (structKey === 'condotta') ? 'Condotta 16'
                  : (structKey === 'alfani')   ? 'Palazzo Alfani'
                  : (structKey === 'davids') ? "Enis Guesthouse"
                  : 'Firenze Suite';
  const ratio = fp_ratioForStruct(structKey);
  const fmt = function(n){
    if (n == null || !isFinite(n)) return '—';
    return '€' + (Math.round(n * 100) / 100).toFixed(0);
  };
  const fmt2 = function(n){
    if (n == null || !isFinite(n)) return '—';
    return (Math.round(n * 100) / 100).toFixed(2);
  };
  const fmtPct = function(n){
    if (n == null || !isFinite(n)) return '—';
    return (n >= 0 ? '+' : '') + (Math.round(n * 10) / 10).toFixed(1) + '%';
  };
  let h = '';
  h += '<div class="fp-modal-bg" id="fp-detail-modal" style="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto" onclick="if(event.target===this){this.remove()}">';
  h += '<div class="fp-modal" style="background:#fff;border-radius:8px;max-width:720px;width:100%;font-family:\'DM Sans\',sans-serif;font-size:13px;line-height:1.5;color:#222;box-shadow:0 8px 32px rgba(0,0,0,.3)">';
  h += '<div style="padding:16px 22px;border-bottom:1px solid #e5e5e5;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(180deg,#fafaf8,#fff)">';
  h += '<div>';
  h += '<div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.06em;font-weight:600;margin-bottom:4px">RMES · calculation detail</div>';
  h += '<div style="font-size:16px;font-weight:700">' + dateLbl + ' (' + dowLbl + ') · ' + rt + ' · ' + structLbl + '</div>';
  h += '</div>';
  h += '<button onclick="document.getElementById(\'fp-detail-modal\').remove()" style="font-size:20px;background:transparent;border:0;cursor:pointer;color:#888;padding:0 8px">×</button>';
  h += '</div>';
  h += '<div style="padding:18px 22px">';
  if (d.longHorizon){
    h += '<div style="padding:10px 14px;background:#fff8e8;border:1px solid #f0d090;border-radius:5px;margin-bottom:14px;font-size:12px;color:#7a5a14"><b>⚠ Distant horizon</b> (' + d.daysToArrival + ' days from today). Simplified mode: <b>max(Base, LY median) × target growth</b>. No pace/curve/market cap.</div>';
    if (d.anchorOrBase != null){
      h += '<div style="margin-bottom:14px;padding:10px 14px;background:#fef8ed;border:1px solid #c4823b;border-radius:5px;font-size:12px">';
      h += '<b style="color:#7a4f1c">Anchor used</b>: ' + fmt(d.anchorOrBase) + ' (' + (d.anchorOrBaseSource||'') + ')<br>';
      h += 'Base price (config): ' + fmt(d.basePrice) + ' · LY median: ' + (d.anchor && d.anchor.medianADR ? fmt(d.anchor.medianADR) : 'n/a');
      h += '</div>';
    }
  }
  let rmesSection = '';
  try {
    const targetYmdNum = parseInt(d.targetDateISO.replace(/-/g,''));
    const today = new Date(TODAY); today.setHours(0,0,0,0);
    const todayNum = today.getFullYear()*10000 + (today.getMonth()+1)*100 + today.getDate();
    const rangeMin = Math.max(1, Math.ceil((new Date(d.targetDateISO+'T00:00:00') - today)/86400000) + 1);
    const rmesMap = (typeof computeRMESPriceMap === 'function') ? computeRMESPriceMap(d.structKey, todayNum, rangeMin) : {};
    const dayData = rmesMap[targetYmdNum];
    if (dayData && dayData.multsByRT && dayData.multsByRT[d.rt]){
      const mults = dayData.multsByRT[d.rt];
      const foundationOvr = (typeof fp_getFoundationOverridePrice === 'function')
        ? fp_getFoundationOverridePrice(d.structKey, d.targetDateISO, d.rt) : null;
      // === FIX allineamento totale: la base mostrata nel modal DEVE essere identica a quella
      // usata dalla cella della tabella Sell Strategy. La tabella calcola:
      //   priceFinal = clamp(base × multFinale × LMF × event, ±20%, floor)
      // dove "base" = current reference (Frozen Base / accepted / override) OPPURE un fallback
      // (beddy/mine/compset) quando il Frozen Base non è ancora stato calcolato per quella data.
      // Per essere SEMPRE coerenti, ricaviamo la base effettiva direttamente da dayData. ===
      const _baseRTFp = (typeof CFG !== 'undefined' && CFG.structures && CFG.structures[d.structKey])
        ? CFG.structures[d.structKey].baseRT : null;
      const _isBaseRT = (_baseRTFp != null && d.rt === _baseRTFp);
      const _tgtYmdN = parseInt(d.targetDateISO.replace(/-/g,''));
      // 1) prova la current reference (la "verità" del sistema NewRMES)
      let _effBase = (typeof newrmesGetCurrentReference === 'function')
        ? newrmesGetCurrentReference(d.structKey, _tgtYmdN) : null;
      // 2) se non c'è (Frozen Base non ancora calcolato), ricostruisci la base che la TABELLA ha usato:
      //    base = priceFinal / multFinale (le altre componenti LMF/event sono già dentro multFinale? no:
      //    multFinale è solo i 5 fattori; ma per coerenza visiva usiamo la stessa pricesByRT come fonte)
      if (_effBase == null || !isFinite(_effBase) || _effBase <= 0){
        const _pf = (dayData.pricesByRT && dayData.pricesByRT[d.rt] != null) ? dayData.pricesByRT[d.rt] : null;
        const _mf = (mults && mults.multFinale) ? mults.multFinale : 1;
        if (_pf != null && _mf > 0){
          _effBase = _pf / _mf;   // base implicita usata dalla tabella
        } else {
          _effBase = d.priceFinal;
        }
      }
      // per RT diverse dal baseRT, aggiungi il supplemento mensile
      let fpPriceSourceCalc = _effBase;
      if (!_isBaseRT && _baseRTFp){
        const _mo = (new Date(d.targetDateISO + 'T00:00:00')).getMonth() + 1;
        const _suppVal = (typeof _globalSupplementForRT === 'function') ? _globalSupplementForRT(d.structKey, d.rt, _mo) : 0;
        fpPriceSourceCalc = _effBase + _suppVal;
      }
      const fpPriceSource = (foundationOvr != null) ? foundationOvr : fpPriceSourceCalc;
      const hasFoundationOverride = (foundationOvr != null);
      // Il prezzo finale "ufficiale" = quello della tabella (pricesByRT), così modal e tabella COINCIDONO.
      const priceRmesFinal = (dayData.pricesByRT && dayData.pricesByRT[d.rt] != null && isFinite(dayData.pricesByRT[d.rt]))
        ? dayData.pricesByRT[d.rt]
        : (fpPriceSource * mults.multFinale);
      const rmesSuggested = priceRmesFinal;  // would suggest == suggested price == cella tabella
      const overrideObj = (typeof fp_getOverride === 'function') ? fp_getOverride(d.structKey, d.targetDateISO, d.rt) : null;
      const hasOverride = !!(overrideObj && overrideObj.price != null);
      // Box dinamico in alto: se per questo giorno è stato accettato un RMES, mostriamo il
      // "Last update" (prezzo accettato = da cui parte il nuovo suggerimento). Altrimenti il Base Price.
      const _acceptedMeta = (typeof newrmesGetAcceptedMeta === 'function') ? newrmesGetAcceptedMeta(d.structKey, _tgtYmdN) : null;
      const _hasAccepted = (_acceptedMeta && _acceptedMeta.price != null);
      const fpBg = hasFoundationOverride ? '#eef4fb' : (_hasAccepted ? '#eef5f0' : '#fef8ed');
      const fpBorder = hasFoundationOverride ? '#3b6b9a' : (_hasAccepted ? '#3d7a4b' : '#c4823b');
      const fpLabelCol = hasFoundationOverride ? '#1e4a6b' : (_hasAccepted ? '#2c5c3c' : '#7a4f1c');
      const fpPriceCol = hasFoundationOverride ? '#1e4a6b' : (_hasAccepted ? '#2c5c3c' : '#5a3a14');
      const fpIcon = hasFoundationOverride ? '🖋' : (_hasAccepted ? '✓' : '⚡');
      const fpLabel = hasFoundationOverride ? 'Base Price (manual override)'
                    : (_hasAccepted ? 'Last update (accepted RMES)' : 'Base Price (computed)');
      let _fpSubAccepted = '';
      if (_hasAccepted && _acceptedMeta.ts){
        const _dt = new Date(_acceptedMeta.ts);
        if (!isNaN(_dt.getTime())){
          _fpSubAccepted = 'Accepted on ' + pad2(_dt.getDate())+'/'+pad2(_dt.getMonth()+1)+'/'+_dt.getFullYear();
        }
      }
      const fpSub = hasFoundationOverride
        ? 'Manual override active · the 5 factors apply on top of this price'
        : (_hasAccepted
            ? (_fpSubAccepted + ' · the new RMES suggestion starts from this price')
            : 'Structural starting price · LY median ADR × growth → Goal Value cap → Anchor guard-rail → floor');
      rmesSection += '<div style="padding:14px 16px;background:'+fpBg+';border:1px solid '+fpBorder+';border-radius:6px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">';
      rmesSection += '<div>';
      rmesSection += '<div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:'+fpLabelCol+';font-weight:700;margin-bottom:2px">'+fpIcon+' '+fpLabel+'</div>';
      rmesSection += '<div style="font-size:10.5px;color:#888">'+fpSub+'</div>';
      if (hasFoundationOverride){
        rmesSection += '<div style="font-size:10.5px;color:#888;margin-top:2px">Computed Base Price would be: <span style="font-family:\'DM Mono\',monospace;text-decoration:line-through">'+fmt(fpPriceSourceCalc)+'</span></div>';
      }
      rmesSection += '</div>';
      rmesSection += '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">';
      rmesSection += '<div style="font-size:20px;font-weight:700;color:'+fpPriceCol+';font-family:\'DM Mono\',monospace">' + fmt(fpPriceSource) + '</div>';
      rmesSection += '</div>';
      rmesSection += '</div>';
      const factors = [
        {key:'occ_mult',   naKey:'occ',   code:'A', name:'Demand (occ)',     color:'#3b6b9a', desc:'current-day OCC vs STLY -364d'},
        {key:'price_mult', naKey:'price', code:'B', name:'Demand (Price)',   color:'#c4823b', desc:'current-day ADR vs STLY (3 conditional cases)'},
        {key:'pace_mult',  naKey:'pace',  code:'C', name:'Pace Trend',    color:'#8e5fa8', desc:'Pickup 4w current month vs STLY (recent week weighted) + OCC check'},
        {key:'comp_mult',  naKey:'comp',  code:'D', name:'Online Pricing', color:'#1e6b4a', desc:'My Expedia vs compset average (invertito)'},
        {key:'air_mult',   naKey:'air',   code:'E', name:'Demand (Expedia)',  color:'#a83b3b', desc:'Expedia searches vs month median'}
      ];
      const naReasons = mults._naReasons || {};
      const dbg = mults._debug || {};
      const _fn = (v, d) => (v == null || !isFinite(v)) ? '—' : (Math.round(v * Math.pow(10, d||0)) / Math.pow(10, d||0)).toFixed(d||0);
      const _fpct = (v, d) => (v == null || !isFinite(v)) ? '—' : ((v >= 0 ? '+' : '') + (v * 100).toFixed(d||1) + '%');
      const _fmt2 = (v) => (v == null || !isFinite(v)) ? '—' : '€' + v.toFixed(0);
      function _buildFactorDetail(code){
        let h = '<div style="padding:8px 14px 10px 14px;background:#fbfaf7;border-left:3px solid #d4cdb8;font-family:\'DM Mono\',monospace;font-size:11px;line-height:1.7;color:#333">';
        if (code === 'A'){
          h += '<div style="color:#666;margin-bottom:4px;font-family:\'DM Sans\',sans-serif">Formula: <code>OCC_cur / OCC_STLY − 1</code></div>';
          h += '<div>OCC today: <b>'+_fn((dbg.occCur||0)*100, 1)+'%</b> &nbsp;<span style="color:#888">(RN '+(dbg.rnCur||0)+' / cap '+(dbg.capCur||0)+')</span></div>';
          h += '<div>OCC STLY (−364d): <b>'+_fn((dbg.occStly||0)*100, 1)+'%</b> &nbsp;<span style="color:#888">(RN '+(dbg.rnStly||0)+' / cap '+(dbg.capStly||0)+')</span></div>';
          if (dbg.occIdx != null){
            const dev = dbg.occIdx - 1;
            h += '<div style="margin-top:4px;padding-top:4px;border-top:1px dashed #ccc">Ratio: <b>'+(dbg.occIdx).toFixed(3)+'</b> · Raw dev: <b>'+_fpct(dev,1)+'</b></div>';
            h += '<div style="color:#888;font-family:\'DM Sans\',sans-serif;font-size:10.5px;font-style:italic;margin-top:3px">Applied dev (post user thresholds + clamp ±50%): '+_fpct((mults.occ_mult-1),1)+'</div>';
          }
        } else if (code === 'B'){
          h += '<div style="color:#666;margin-bottom:4px;font-family:\'DM Sans\',sans-serif">Conditional formula, 3 cases (see below)</div>';
          h += '<div>ADR today: <b>'+_fmt2(dbg.adrCur)+'</b> · ADR STLY: <b>'+_fmt2(dbg.adrStly)+'</b></div>';
          if (dbg.priceIdx != null){
            const adrDev = dbg.priceIdx - 1;
            h += '<div>Ratio ADR: <b>'+(dbg.priceIdx).toFixed(3)+'</b> · Δ%ADR: <b>'+_fpct(adrDev,1)+'</b></div>';
            h += '<div style="margin-top:4px;padding-top:4px;border-top:1px dashed #ccc">Case applied: <b style="color:#c4823b">';
            if (dbg.priceCase === 'recover_below_LY')
              h += 'CASE 1 — ADR below LY → recovery, raise</b><div style="color:#888;font-family:\'DM Sans\',sans-serif;font-size:10.5px;font-style:italic;margin-top:2px">Dev = −(ratio−1) = '+_fpct(-adrDev,1)+'</div>';
            else if (dbg.priceCase === 'all_good')
              h += 'CASE 2 — ADR ≥ LY and OCC ≥ LY → neutral</b><div style="color:#888;font-family:\'DM Sans\',sans-serif;font-size:10.5px;font-style:italic;margin-top:2px">All flat, keep current reference. Dev = 0%</div>';
            else if (dbg.priceCase === 'brake_softened'){
              const tg = (dbg.targetGrowthMo || 0) / 100;
              const eff = adrDev - tg;
              h += 'CASE 3 — ADR ≥ LY but OCC &lt; LY → softened brake</b><div style="color:#888;font-family:\'DM Sans\',sans-serif;font-size:10.5px;font-style:italic;margin-top:2px">Month target growth: '+(dbg.targetGrowthMo||0).toFixed(1)+'% · Effective = '+_fpct(adrDev,1)+' − '+(dbg.targetGrowthMo||0).toFixed(1)+'% = '+_fpct(eff,1)+' · Dev = −effective = '+_fpct(-eff,1)+'</div>';
            }
            h += '<div style="margin-top:4px;color:#888;font-family:\'DM Sans\',sans-serif;font-size:10.5px;font-style:italic">Dev applicata (post-clamp ±50%): '+_fpct((mults.price_mult-1),1)+'</div>';
          }
        } else if (code === 'C'){
          h += '<div style="color:#666;margin-bottom:4px;font-family:\'DM Sans\',sans-serif">How fast this month is booking vs last year — recent weeks count more.</div>';
          const pi = dbg.paceInfo || {};
          if (pi.pickupCur != null && pi.pickupStly != null){
            h += '<div>Pickup last 4 weeks: <b>'+pi.pickupCur+' RN</b> now vs <b>'+pi.pickupStly+' RN</b> same period last year <span style="color:#999">(real room nights)</span></div>';
            if (pi.ratio != null){
              const rawR = pi.pickupStly>0 ? (pi.pickupCur/pi.pickupStly) : null;
              h += '<div style="margin-top:3px">Weighted pace ratio: <b>'+pi.ratio.toFixed(3)+'</b> → dev <b>'+_fpct(pi.ratio-1,1)+'</b>';
              if (rawR!=null) h += ' <span style="color:#999">(unweighted would be '+rawR.toFixed(3)+')</span>';
              h += '</div>';
              h += '<div style="margin-top:3px;color:#888;font-size:11px">The 4 weeks are weighted W1 10% &middot; W2 20% &middot; W3 30% &middot; W4 40% (W4 = most recent), so a slow recent week pulls the pace down more than an old one. Below 1 = booking slower than last year &rarr; lower price; above 1 = faster &rarr; higher price.</div>';
            } else if (pi.pickupStly > 0){
              const ratio = pi.pickupCur / pi.pickupStly;
              h += '<div>Ratio pickup: <b>'+ratio.toFixed(3)+'</b> · Raw dev: <b>'+_fpct(ratio-1,1)+'</b></div>';
            }
          }
          h += '<div style="margin-top:4px;padding-top:4px;border-top:1px dashed #ccc">Decision state: <b style="color:#8e5fa8">'+(({'alza':'raise','ambiguo':'ambiguous','ambiguo_freno_50pct':'ambiguous · 50% brake','ambiguo_neutralizzato_OCC90':'ambiguous · neutralized (OCC90)','fallback':'fallback','fallback_annuale_struct':'annual fallback (property)','freno_pieno':'full brake','neutralizzato_no_dati':'neutralized (no data)','tutto_giù':'all down','tutto_su':'all up'}[pi.state]) || pi.state || '—')+'</b></div>';
          if (pi.source){
            h += '<div style="color:#888;font-family:\'DM Sans\',sans-serif;font-size:10.5px;font-style:italic;margin-top:2px">'+pi.source+'</div>';
          }
          h += '<div style="margin-top:4px;color:#888;font-family:\'DM Sans\',sans-serif;font-size:10.5px;font-style:italic">Dev applicata (post-clamp): '+_fpct((mults.pace_mult-1),1)+'</div>';
        } else if (code === 'D'){
          h += '<div style="color:#666;margin-bottom:4px;font-family:\'DM Sans\',sans-serif">Formula: <code>−(my_BeddyEq / weighted_compset_BeddyEq − 1)</code> · both in Beddy_eq · uses the <b>Weighted Expedia Compset</b> (weights only, <b>no</b> offset)</div>';
          h += '<div>My Expedia price (gross): <b>'+_fmt2(dbg.myExpedia)+'</b> → Beddy_eq: <b>'+_fmt2(dbg.myBeddy)+'</b></div>';
          h += '<div>Compset average (Beddy_eq + offset): <b>'+_fmt2(dbg.compsetBeddy)+'</b> &nbsp;<span style="color:#888">('+(dbg.compsetSource||'—')+')</span></div>';
          if (dbg.myBeddy != null && dbg.compsetBeddy != null && dbg.compsetBeddy > 0){
            const ratio = dbg.myBeddy / dbg.compsetBeddy;
            h += '<div style="margin-top:4px;padding-top:4px;border-top:1px dashed #ccc">My/compset ratio: <b>'+ratio.toFixed(3)+'</b> · Raw inverted dev: <b>'+_fpct(-(ratio-1),1)+'</b></div>';
          }
          h += '<div style="margin-top:4px;color:#888;font-family:\'DM Sans\',sans-serif;font-size:10.5px;font-style:italic">Applied dev (post-thresholds + clamp ±50%): '+_fpct((mults.comp_mult-1),1)+'</div>';
        } else if (code === 'E'){
          h += '<div style="color:#666;margin-bottom:4px;font-family:\'DM Sans\',sans-serif">Formula: <code>(search_cur − month_median) / month_median</code></div>';
          h += '<div>Expedia searches today: <b>'+(dbg.searchCur != null ? dbg.searchCur.toLocaleString('en-GB') : '—')+'</b></div>';
          h += '<div>Month search median: <b>'+(dbg.searchP50Mo != null ? Math.round(dbg.searchP50Mo).toLocaleString('en-GB') : '—')+'</b></div>';
          if (dbg.searchDev != null){
            h += '<div style="margin-top:4px;padding-top:4px;border-top:1px dashed #ccc">Raw dev: <b>'+_fpct(dbg.searchDev,1)+'</b></div>';
          }
          h += '<div style="margin-top:4px;color:#888;font-family:\'DM Sans\',sans-serif;font-size:10.5px;font-style:italic">Applied dev (post-thresholds + clamp ±50%): '+_fpct((mults.air_mult-1),1)+'</div>';
        }
        h += '</div>';
        return h;
      }
      rmesSection += '<div style="font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px">RMES factors (property level)</div>';
      var _notaRTLbl = _isBaseRT ? (rt + ' is the baseRT') : ('for ' + rt + ' = Base_baseRT + monthly supplement');
      rmesSection += '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#888;margin:14px 0 8px">Market Factors</div>';
      rmesSection += '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:10px">';
      rmesSection += '<thead style="background:#f8f8f5"><tr>';
      rmesSection += '<th style="padding:6px 10px;text-align:left;font-size:10.5px;color:#666">Factor</th>';
      rmesSection += '<th style="padding:6px 10px;text-align:right;font-size:10.5px;color:#666;width:70px">Weight</th>';
      rmesSection += '<th style="padding:6px 10px;text-align:right;font-size:10.5px;color:#666;width:85px">Dev %</th>';
      rmesSection += '</tr></thead><tbody>';
      const wApp = mults._weightsApplied || {};
      const wBase = (typeof SELL_RMES_W_ALL !== 'undefined' && SELL_RMES_W_ALL[d.structKey])
                  ? SELL_RMES_W_ALL[d.structKey]
                  : (typeof SELL_RMES_W_DEFAULT !== 'undefined' ? SELL_RMES_W_DEFAULT : {});
      const wMapKey = { occ:'occ', price:'price', pace:'pace', comp:'comp', air:'airdna' };
      for (const f of factors){
        const m = mults[f.key];
        const naReason = naReasons[f.naKey];
        const wK = wMapKey[f.naKey];
        const wAppV = (wApp[f.naKey] != null) ? wApp[f.naKey] : (wBase[wK] || 0);
        const wBaseV = wBase[wK] || 0;
        const wPct = (wAppV * 100);
        const wBasePct = (wBaseV * 100);
        const factorCell = '<td style="padding:5px 10px;border-bottom:1px solid #eee"><span style="background:'+f.color+';color:#fff;padding:2px 6px;border-radius:3px;font-family:\'DM Mono\',monospace;font-weight:700;font-size:11px;margin-right:6px">'+f.code+'</span>·'+f.name+'</td>';
        if (m == null || !isFinite(m) || naReason){
          const reasonTxt = naReason || 'no data';
          rmesSection += '<tr style="background:#fafafa">' + factorCell;
          rmesSection += '<td style="padding:5px 10px;border-bottom:1px solid #eee;text-align:right;color:#bbb;font-family:\'DM Mono\',monospace;font-size:11px;text-decoration:line-through">'+wBasePct.toFixed(0)+'%</td>';
          rmesSection += '<td style="padding:5px 10px;border-bottom:1px solid #eee;text-align:right;color:#bbb;font-size:11px">—</td>';
          rmesSection += '</tr>';
          rmesSection += '<tr style="background:#fafafa"><td colspan="3" style="padding:0;border-bottom:1px solid #eee">';
          rmesSection += '<details style="padding:0 10px"><summary style="cursor:pointer;padding:4px 0;font-size:10.5px;color:#999;font-weight:600;list-style:none;user-select:none">▸ Detail (missing data)</summary>';
          rmesSection += _buildFactorDetail(f.code);
          rmesSection += '<div style="padding:6px 14px 10px;background:#fbf6f6;border-left:3px solid #d4a8a8;font-size:10.5px;color:#a83b3b;font-family:\'DM Sans\',sans-serif;font-style:italic">Reason: '+reasonTxt+'. This factor weight has been redistributed to the other active factors.</div>';
          rmesSection += '</details></td></tr>';
          continue;
        }
        const devPct = (m - 1) * 100;
        const arrow = m > 1.001 ? '↑' : (m < 0.999 ? '↓' : '·');
        const arrowCol = m > 1.001 ? '#1e6b4a' : (m < 0.999 ? '#a83b3b' : '#666');
        const action = m > 1.001 ? 'raise' : (m < 0.999 ? 'lower' : 'unchanged');
        const actionCol = m > 1.001 ? '#1e6b4a' : (m < 0.999 ? '#a83b3b' : '#1e6b4a');
        const wRedistribuito = wAppV > wBaseV + 0.001;
        const extraPct = wRedistribuito ? (wPct - wBasePct) : 0;
        const wDisplay = wRedistribuito
          ? wBasePct.toFixed(0) + '%<span style="color:#3b6b9a;font-weight:600">+' + extraPct.toFixed(1) + '%</span>'
          : wPct.toFixed(0) + '%';
        const wTooltip = wRedistribuito ? 'Base weight ' + wBasePct.toFixed(0) + '% + ' + extraPct.toFixed(1) + '% redistributed from n/a factors' : 'Weight ' + wPct.toFixed(0) + '%';
        rmesSection += '<tr>' + factorCell;
        rmesSection += '<td style="padding:5px 10px;border-bottom:1px solid #eee;text-align:right;font-family:\'DM Mono\',monospace;font-size:11px;color:#666" title="'+wTooltip+'">'+wDisplay+'</td>';
        rmesSection += '<td style="padding:5px 10px;border-bottom:1px solid #eee;text-align:right;font-family:\'DM Mono\',monospace;color:'+arrowCol+';font-weight:600">'+arrow+' '+(devPct>=0?'+':'')+devPct.toFixed(1)+'%</td>';
        rmesSection += '</tr>';
        rmesSection += '<tr><td colspan="3" style="padding:0;border-bottom:1px solid #eee">';
        rmesSection += '<details style="padding:0 10px"><summary style="cursor:pointer;padding:4px 0;font-size:10.5px;color:'+f.color+';font-weight:600;list-style:none;user-select:none">▸ Calculation detail '+f.code+'·'+f.name+'</summary>';
        rmesSection += _buildFactorDetail(f.code);
        rmesSection += '</details></td></tr>';
      }
      rmesSection += '</tbody></table>';
      const multFinPct = (mults.multFinale - 1) * 100;
      const multFinCol = mults.multFinale > 1.001 ? '#1e6b4a' : (mults.multFinale < 0.999 ? '#a83b3b' : '#666');
      rmesSection += '<div style="display:flex;justify-content:space-between;padding:8px 14px;background:#f5f5f5;border-radius:4px;margin-bottom:10px;font-size:12px">';
      rmesSection += '<span style="color:#666;font-weight:600">Composite multiplier (Σ weight × dev, capped ±total cap)</span>';
      rmesSection += '<span style="font-family:\'DM Mono\',monospace;font-weight:700;color:'+multFinCol+'">×'+mults.multFinale.toFixed(3)+' ('+(multFinPct>=0?'+':'')+multFinPct.toFixed(1)+'%)</span>';
      rmesSection += '</div>';
      if (typeof fp_lmfLookup === 'function'){
        const _occCur = (dbg.occCur != null) ? dbg.occCur : 0;
        const _daysToArr = Math.max(0, Math.round((td.getTime() - new Date(TODAY).setHours(0,0,0,0)) / 86400000));
        const _lmfPct = fp_lmfLookup(structKey, _occCur, _daysToArr);
        const _lmfCol = _lmfPct > 0 ? '#1e6b4a' : (_lmfPct < 0 ? '#a83b3b' : '#666');
        rmesSection += '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#888;margin:14px 0 8px">Customizations</div>';
        rmesSection += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 14px;background:#fafafa;border:1px solid #eee;border-radius:4px;margin-bottom:10px;font-size:12px">';
        rmesSection += '<div><span style="font-weight:600;color:#555">⏱ Last Minute Price Factor</span>';
        rmesSection += '<div style="font-size:10px;color:#aaa;margin-top:2px">OCC '+(_occCur*100).toFixed(0)+'% · '+_daysToArr+' days to arrival</div></div>';
        rmesSection += '<span style="font-family:\'DM Mono\',monospace;font-weight:700;color:'+_lmfCol+'">'+(_lmfPct>=0?'+':'')+_lmfPct.toFixed(0)+'%</span>';
        rmesSection += '</div>';
      }
      {
        const _floor = (typeof fp_getFloor === 'function') ? fp_getFloor(structKey) : null;
        const _base = (typeof fp_getBasePrice === 'function') ? fp_getBasePrice(structKey) : null;
        const _cap = (typeof getRmesCap === 'function') ? getRmesCap(structKey) : null;
        rmesSection += '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#888;margin:14px 0 8px">Thresholds</div>';
        rmesSection += '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">';
        rmesSection += '<div style="flex:1;min-width:90px;padding:8px 12px;background:#fafafa;border:1px solid #eee;border-radius:4px"><div style="font-size:10px;color:#999;text-transform:uppercase">Floor rate</div><div style="font-family:\'DM Mono\',monospace;font-weight:700;color:#a83b3b">'+fmt(_floor)+'</div></div>';
        rmesSection += '<div style="flex:1;min-width:90px;padding:8px 12px;background:#fafafa;border:1px solid #eee;border-radius:4px"><div style="font-size:10px;color:#999;text-transform:uppercase">Base rate</div><div style="font-family:\'DM Mono\',monospace;font-weight:700;color:#555">'+fmt(_base)+'</div></div>';
        if (_cap != null){
          rmesSection += '<div style="flex:1;min-width:90px;padding:8px 12px;background:#fafafa;border:1px solid #eee;border-radius:4px"><div style="font-size:10px;color:#999;text-transform:uppercase">Cap ±</div><div style="font-family:\'DM Mono\',monospace;font-weight:700;color:#555">'+(_cap*100).toFixed(0)+'%</div></div>';
        }
        rmesSection += '</div>';
      }
      {
        let _mlosVal = null;
        if (r && r._mlosByRT && r._mlosByRT[rt] != null) _mlosVal = r._mlosByRT[rt];
        else if (d && d.mlos != null) _mlosVal = d.mlos;
        if (_mlosVal == null && typeof aggSellStrategy === 'function'){
          try {
            const _ymdNum = td.getFullYear()*10000 + (td.getMonth()+1)*100 + td.getDate();
            const _A = aggSellStrategy(structKey, _ymdNum, 2, 7);
            const _row = _A && _A.rows ? _A.rows.find(x => x.ymd === _ymdNum) : null;
            const _next = _A && _A.rows ? _A.rows.find(x => x.ymd === _ymdNum + 1) : null;
            const _today0 = new Date(TODAY); _today0.setHours(0,0,0,0);
            const _daysToChk = Math.round((td.getTime() - _today0.getTime()) / 86400000);
            if (_row){
              const _curOcc = _row.curOcc || 0;
              const _nextOcc = _next ? (_next.curOcc || 0) : 0;
              const _flyOcc = _row.finalLyOcc || 0;
              if (_daysToChk < 14) _mlosVal = 1;
              else if (_curOcc > 0.90 && _nextOcc < 1.0) _mlosVal = 2;
              else if (_curOcc < 0.90 && _flyOcc > 0.95) _mlosVal = 2;
              else _mlosVal = 1;
            }
          } catch(e){}
        }
        if (_mlosVal == null) _mlosVal = 1;
        rmesSection += '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#888;margin:14px 0 8px">Restrictions</div>';
        rmesSection += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 14px;background:#fafafa;border:1px solid #eee;border-radius:4px;margin-bottom:10px;font-size:12px">';
        rmesSection += '<span style="font-weight:600;color:#555">Minimum stay (MLOS)</span>';
        rmesSection += '<span style="font-family:\'DM Mono\',monospace;font-weight:700;color:'+(_mlosVal===2?'#a83b3b':'#555')+'">'+_mlosVal+' '+(_mlosVal===1?'night':'nights')+'</span>';
        rmesSection += '</div>';
      }
      const deltaSugg = rmesSuggested - fpPriceSource;
      const _rawSugg = fpPriceSource * mults.multFinale;
      const _capped = Math.abs(_rawSugg - rmesSuggested) >= 1;  // cap ±20% o floor ha agito
      rmesSection += '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:'+(hasOverride?'#f5f5f5':'#1e6b4a')+';border-radius:6px;color:'+(hasOverride?'#666':'#fff')+';margin-bottom:10px">';
      rmesSection += '<div><div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;opacity:.85">💡 RMES would suggest</div>';
      rmesSection += '<div style="font-size:10.5px;opacity:.7;margin-top:2px">Base '+fmt(fpPriceSource)+' × multiplier '+mults.multFinale.toFixed(3)+(_capped?' · capped ±20%/floor':'')+'</div></div>';
      rmesSection += '<div style="text-align:right"><div style="font-size:'+(hasOverride?'18px':'24px')+';font-weight:700;font-family:\'DM Mono\',monospace">'+fmt(rmesSuggested)+'</div>';
      if (Math.abs(deltaSugg) >= 0.5){
        rmesSection += '<div style="font-size:11px;opacity:.85;font-family:\'DM Mono\',monospace">Δ vs reference: '+(deltaSugg>0?'+':'')+fmt(deltaSugg)+'</div>';
      }
      rmesSection += '</div></div>';
      const elasticity = (typeof fp_getElasticity === 'function') ? fp_getElasticity(d.structKey) : 1.0;
      const rnAtt = (d.rnAttese != null && isFinite(d.rnAttese)) ? d.rnAttese : (d.inv || 4);
      const finalDataAttr = 'data-struct="'+d.structKey+'" data-rt="'+escapeHtml(d.rt)+'" data-date="'+d.targetDateISO+'" data-rmes-suggested="'+rmesSuggested.toFixed(4)+'" data-rn-attese="'+rnAtt+'" data-elasticity="'+elasticity+'" data-foundation="'+fpPriceSource.toFixed(4)+'" data-mult-finale="'+mults.multFinale.toFixed(6)+'"';
      const finalBoxColor = hasOverride ? '#c4823b' : '#1e6b4a';
      rmesSection += '<div id="fp-final-box" style="padding:14px 16px;background:#fff;border:2px solid '+finalBoxColor+';border-radius:8px;margin-bottom:14px">';
      rmesSection += '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px">';
      rmesSection += '<div>';
      rmesSection += '<div style="font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;color:'+finalBoxColor+';font-weight:700">💰 RMES suggested price</div>';
      rmesSection += '<div style="font-size:10.5px;color:#888;margin-top:2px">'+(hasOverride?'🖋 Manual override active':'= suggested price (no override)')+'</div>';
      rmesSection += '</div>';
      rmesSection += '<div style="display:flex;gap:6px;align-items:center">';
      rmesSection += '<input type="number" id="fp-final-input" min="0" max="9999" step="1" value="'+priceRmesFinal.toFixed(0)+'" '+finalDataAttr+' style="width:100px;padding:8px 10px;border:2px solid '+finalBoxColor+';border-radius:5px;font-family:\'DM Mono\',monospace;text-align:right;font-size:18px;font-weight:700;color:'+finalBoxColor+';background:#fff">';
      rmesSection += '<span style="color:'+finalBoxColor+';font-size:14px">€</span>';
      rmesSection += '<button id="fp-final-save" '+finalDataAttr+' style="padding:8px 14px;border:1px solid '+finalBoxColor+';background:'+finalBoxColor+';color:#fff;border-radius:5px;font-family:\'DM Sans\',sans-serif;font-size:12px;font-weight:700;cursor:pointer">💾 Save</button>';
      if (hasOverride){
        rmesSection += '<button id="fp-final-clear" data-struct="'+d.structKey+'" data-rt="'+escapeHtml(d.rt)+'" data-date="'+d.targetDateISO+'" style="padding:8px 10px;border:1px solid #a83b3b;background:#fff;color:#a83b3b;border-radius:5px;font-family:\'DM Sans\',sans-serif;font-size:11px;cursor:pointer">✕ Reset</button>';
      }
      rmesSection += '</div>';
      rmesSection += '</div>';
      rmesSection += '<div id="fp-sim-block" style="margin-top:10px;padding:10px 12px;background:#f9f8f3;border-radius:5px;font-size:11.5px;color:#555">';
      rmesSection += '<div style="font-weight:600;color:#666;margin-bottom:4px">📊 Revenue simulation (price elasticity ratio '+elasticity.toFixed(1)+':1)</div>';
      rmesSection += '<div id="fp-sim-content">Enter a price in the input above to see the impatto stimato.</div>';
      rmesSection += '<div style="margin-top:4px;font-size:10px;color:#999;font-style:italic">Expected RN at close: '+fmt2(rnAtt)+' · estimate: if Δprice is −X%, then ΔExpected RN ≈ +X% × elasticity.</div>';
      rmesSection += '</div>';
      rmesSection += '</div>';
    }
  } catch(e){ console.error('PARTE RMES rendering failed', e); }
  h += rmesSection;
  h += '</div>';  // /body
  h += '</div></div>';  // /modal /bg
  document.body.insertAdjacentHTML('beforeend', h);
  const _btn6step = document.getElementById('fp-show-6step');
  if (_btn6step){
    _btn6step.onclick = function(){
      if (typeof fp_showFoundationOnlyModal === 'function') fp_showFoundationOnlyModal(structKey, rt, dateISO);
    };
  }
  const finalInp = document.getElementById('fp-final-input');
  const finalSave = document.getElementById('fp-final-save');
  const finalClear = document.getElementById('fp-final-clear');
  function _updateSimulation(){
    const simContent = document.getElementById('fp-sim-content');
    if (!simContent || !finalInp) return;
    const newPrice = parseFloat(finalInp.value);
    const suggested = parseFloat(finalInp.dataset.rmesSuggested);
    const rnAttese = parseFloat(finalInp.dataset.rnAttese);
    const elasticity = parseFloat(finalInp.dataset.elasticity);
    if (!isFinite(newPrice) || !isFinite(suggested) || !isFinite(rnAttese)){
      simContent.innerHTML = '<span style="color:#bbb">Incomplete data for the simulation.</span>';
      return;
    }
    const deltaPrice = newPrice - suggested;
    const deltaPricePct = suggested > 0 ? (deltaPrice / suggested) : 0;
    const deltaRnPct = -deltaPricePct * elasticity;
    const rnNew = rnAttese * (1 + deltaRnPct);
    const revSuggested = suggested * rnAttese;
    const revNew = newPrice * rnNew;
    const deltaRev = revNew - revSuggested;
    if (Math.abs(deltaPrice) < 0.5){
      simContent.innerHTML = '<span style="color:#888">Price equal to the RMES suggestion — no estimated impact.</span>';
      return;
    }
    const sign = (n)=> (n >= 0 ? '+' : '');
    const col = (n)=> n > 0 ? '#1e6b4a' : (n < 0 ? '#a83b3b' : '#666');
    let html = '<table style="width:100%;font-size:11.5px;border-collapse:collapse">';
    html += '<tr><td style="padding:2px 6px;color:#666;width:40%">Δ price</td><td style="padding:2px 6px;text-align:right;font-family:\'DM Mono\',monospace;color:'+col(deltaPrice)+';font-weight:600">'+sign(deltaPrice)+'€'+deltaPrice.toFixed(2)+' ('+sign(deltaPricePct*100)+(deltaPricePct*100).toFixed(1)+'%)</td></tr>';
    html += '<tr><td style="padding:2px 6px;color:#666">Estimated RN (was '+rnAttese.toFixed(1)+')</td><td style="padding:2px 6px;text-align:right;font-family:\'DM Mono\',monospace;color:'+col(deltaRnPct)+';font-weight:600">'+rnNew.toFixed(1)+' ('+sign(deltaRnPct*100)+(deltaRnPct*100).toFixed(1)+'%)</td></tr>';
    html += '<tr><td style="padding:2px 6px;color:#666;border-top:1px solid #e0e0d8"><b>Estimated daily Δ Revenue</b></td><td style="padding:2px 6px;text-align:right;font-family:\'DM Mono\',monospace;color:'+col(deltaRev)+';font-weight:700;border-top:1px solid #e0e0d8">'+sign(deltaRev)+'€'+deltaRev.toFixed(2)+'</td></tr>';
    html += '<tr><td style="padding:2px 6px;font-size:10px;color:#888" colspan="2">Hypothetical RMES revenue: '+revSuggested.toFixed(0)+'€ · Hypothetical new-price revenue: '+revNew.toFixed(0)+'€</td></tr>';
    html += '</table>';
    simContent.innerHTML = html;
  }
  if (finalInp){
    finalInp.addEventListener('input', _updateSimulation);
    _updateSimulation();  // simulazione iniziale
  }
  if (finalSave){
    finalSave.onclick = function(){
      const struct = finalSave.dataset.struct;
      const rtN = finalSave.dataset.rt;
      const date = finalSave.dataset.date;
      const suggested = parseFloat(finalSave.dataset.rmesSuggested);
      const foundation = parseFloat(finalSave.dataset.foundation);
      const multFinale = parseFloat(finalSave.dataset.multFinale);
      const val = parseFloat(finalInp.value);
      if (!isFinite(val) || val <= 0){ alert('Invalid price'); return; }
      let azione;
      if (Math.abs(val - suggested) < 0.5){
        const existing = fp_getOverride(struct, date, rtN);
        if (existing == null){
          alert('The entered value equals the RMES suggested price. Nothing to save.');
          return;
        }
        fp_setOverride(struct, date, rtN, null);
        azione = 'rimosso';
      } else {
        const snapshot = { rmesSuggested: suggested, foundation: foundation, multFinale: multFinale, source: 'modale' };
        fp_setOverride(struct, date, rtN, val, snapshot);
        azione = 'salvato';
      }
      if (typeof renderSellStrategy === 'function' && typeof CURRENT_STRUCT !== 'undefined'){
        try { renderSellStrategy(CURRENT_STRUCT); } catch(e){}
      }
      const box = document.getElementById('fp-final-box');
      if (box){
        const fb = (azione === 'rimosso')
          ? '✓ Override removed — the day reverts to the RMES suggested price (€' + (isFinite(suggested) ? suggested.toFixed(0) : '—') + ').'
          : '✓ Override saved — published price €' + val.toFixed(0) + ' (RMES was suggesting €' + (isFinite(suggested) ? suggested.toFixed(0) : '—') + '). Visible in the table with a 🖋 badge.';
        let fbEl = document.getElementById('fp-final-feedback');
        if (!fbEl){
          fbEl = document.createElement('div');
          fbEl.id = 'fp-final-feedback';
          box.appendChild(fbEl);
        }
        fbEl.style.cssText = 'margin-top:10px;padding:8px 12px;background:#e8f4ec;border:1px solid #1e6b4a;border-radius:5px;font-size:11.5px;color:#1e6b4a;font-weight:600';
        fbEl.textContent = fb;
      }
      const box2 = document.getElementById('fp-final-box');
      if (box2){
        if (azione === 'salvato'){
          box2.style.borderColor = '#c4823b';
        } else {
          box2.style.borderColor = '#1e6b4a';
        }
      }
    };
  }
  if (finalClear){
    finalClear.onclick = function(){
      const struct = finalClear.dataset.struct;
      const rtN = finalClear.dataset.rt;
      const date = finalClear.dataset.date;
      if (!confirm('Remove override for ' + date + ' · ' + rtN + '? It will revert to the RMES suggested price.')) return;
      fp_setOverride(struct, date, rtN, null);
      if (typeof renderSellStrategy === 'function' && typeof CURRENT_STRUCT !== 'undefined'){
        try { renderSellStrategy(CURRENT_STRUCT); } catch(e){}
      }
      const modal = document.getElementById('fp-detail-modal');
      if (modal) modal.remove();
    };
  }
}
/* ---------- Modale dedicata SOLO al dettaglio Foundation (6 step) ----------
   Si apre dal click sulla cella Foundation (icona ⚡), dal bottone "📖 Vedi dettaglio Foundation"
   del popup approvazione, o dal bottone "Mostra calcolo Foundation" della modale RMES.
   Mostra: Ancora storica, Target Revenue, RN attese, Cap mercato, Floor + Base lift, Re-target.
   NON mostra i 5 fattori RMES (per quelli c'è fp_showDetailModal). */
function fp_showFoundationOnlyModal(structKey, rt, dateISO){
  const existing = document.getElementById('fp-fnd-only-modal');
  if (existing) existing.remove();
  let r = (typeof fp_getPrice === 'function') ? fp_getPrice(structKey, rt, dateISO) : null;
  if (!r){
    const c = (typeof fp_computePrice === 'function') ? fp_computePrice(structKey, rt, dateISO) : null;
    if (!c){ alert('Cannot compute Base Price for ' + structKey + ' / ' + rt + ' / ' + dateISO); return; }
    r = c;
  }
  const d = r.detail;
  const td = new Date(dateISO + 'T00:00:00');
  const dowNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dowLbl = dowNames[td.getDay()];
  const dateLbl = td.getDate() + '/' + (td.getMonth()+1) + '/' + td.getFullYear();
  const structLbl = (structKey === 'condotta') ? 'Condotta 16'
                  : (structKey === 'alfani')   ? 'Palazzo Alfani'
                  : (structKey === 'davids') ? "Enis Guesthouse"
                  : 'Firenze Suite';
  const fmt = function(n){ if (n == null || !isFinite(n)) return '—'; return '€' + (Math.round(n * 100) / 100).toFixed(0); };
  const fmt2 = function(n){ if (n == null || !isFinite(n)) return '—'; return (Math.round(n * 100) / 100).toFixed(2); };
  const fmtPct = function(n){ if (n == null || !isFinite(n)) return '—'; return (n >= 0 ? '+' : '') + (Math.round(n * 10) / 10).toFixed(1) + '%'; };
  const baseRT_struct = (typeof CFG !== 'undefined' && CFG.structures && CFG.structures[structKey])
                      ? CFG.structures[structKey].baseRT : null;
  const isBaseRT = (baseRT_struct && rt === baseRT_struct);
  let h = '';
  h += '<div class="fp-modal-bg" id="fp-fnd-only-modal" style="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10001;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto" onclick="if(event.target===this){this.remove()}">';
  h += '<div class="fp-modal" style="background:#fff;border-radius:8px;max-width:720px;width:100%;font-family:\'DM Sans\',sans-serif;font-size:13px;line-height:1.5;color:#222;box-shadow:0 8px 32px rgba(0,0,0,.3)">';
  h += '<div style="padding:16px 22px;border-bottom:1px solid #e5e5e5;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(180deg,#fef8ed,#fff)">';
  h += '<div>';
  h += '<div style="font-size:12px;color:#7a4f1c;text-transform:uppercase;letter-spacing:.06em;font-weight:600;margin-bottom:4px">⚡ Base Price · calculation detail</div>';
  h += '<div style="font-size:16px;font-weight:700">' + dateLbl + ' (' + dowLbl + ') · ' + rt + ' · ' + structLbl + '</div>';
  h += '</div>';
  h += '<button onclick="document.getElementById(\'fp-fnd-only-modal\').remove()" style="font-size:20px;background:transparent;border:0;cursor:pointer;color:#888;padding:0 8px">×</button>';
  h += '</div>';
  h += '<div style="padding:18px 22px">';
  if (!isBaseRT && baseRT_struct){
    const _stB = (typeof fp_getFoundationState === 'function') ? fp_getFoundationState(structKey, dateISO, baseRT_struct) : null;
    const _baseR = (typeof fp_getPrice === 'function') ? fp_getPrice(structKey, baseRT_struct, dateISO) : null;
    const _baseEff = (_stB && _stB.status !== 'proposed') ? _stB.value : (_baseR ? _baseR.price : null);
    const _mo = (new Date(dateISO + 'T00:00:00')).getMonth() + 1;
    const _suppVal = (typeof _globalSupplementForRT === 'function') ? _globalSupplementForRT(structKey, rt, _mo) : 0;
    const _fpRT = (_baseEff != null) ? (_baseEff + _suppVal) : d.priceFinal;
    h += '<div style="padding:14px 16px;background:#fef8ed;border:2px solid #c4823b;border-radius:6px;margin-bottom:18px">';
    h += '<div style="font-size:11px;font-weight:700;color:#7a4f1c;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Base Price derived</div>';
    h += '<p style="margin:0 0 10px 0;font-size:12.5px;color:var(--ink-2);line-height:1.55">' + rt + ' è una <b>RT non-base</b>. The Base Price is not recomputed for this RT; it inherits from the baseRT (<b>' + baseRT_struct + '</b>) via a historical monthly supplement:</p>';
    h += '<table style="width:100%;border-collapse:collapse;font-size:13px">';
    h += '<tr><td style="padding:5px 8px;color:#666">Base Price effective <b>' + baseRT_struct + '</b> (baseRT)</td><td style="padding:5px 8px;text-align:right;font-family:\'DM Mono\',monospace;font-weight:600">' + fmt(_baseEff) + '</td></tr>';
    h += '<tr><td style="padding:5px 8px;color:#666">+ Supplement <b>' + rt + '</b> month ' + monthNames[_mo-1] + ' (historical)</td><td style="padding:5px 8px;text-align:right;font-family:\'DM Mono\',monospace;font-weight:600">+' + fmt(_suppVal) + '</td></tr>';
    h += '<tr style="border-top:2px solid #c4823b"><td style="padding:8px;color:#5a3a14;font-weight:700">= Base Price ' + rt + '</td><td style="padding:8px;text-align:right;font-family:\'DM Mono\',monospace;font-weight:700;color:#5a3a14;font-size:16px">' + fmt(_fpRT) + '</td></tr>';
    h += '</table>';
    h += '<p style="margin:10px 0 0 0;font-size:11px;color:#888;font-style:italic">To change the Base Price for this day, act on the ' + baseRT_struct + ' row in the table (this is the baseRT, the other RTs follow automatically). Supplement table: RMES tab → Ⓔ.</p>';
    h += '<p style="margin:10px 0 0 0;font-size:11.5px;color:var(--ink-2)">📌 The detail below refers to <b>' + baseRT_struct + '</b> (the baseRT). The calculation is not run for ' + rt + ' directly — it inherits via the monthly supplement.</p>';
    h += '</div>';
    const r_base = (typeof fp_getPrice === 'function') ? fp_getPrice(structKey, baseRT_struct, dateISO) : null;
    if (r_base) {
      r = r_base;
    }
  }
  const dd = r.detail;
  if (dd.longHorizon){
    h += '<div style="padding:10px 14px;background:#fff8e8;border:1px solid #f0d090;border-radius:5px;margin-bottom:14px;font-size:12px;color:#7a5a14"><b>⚠ Distant horizon</b> (' + dd.daysToArrival + ' days from today). Simplified mode: <b>max(Base, LY median) × target growth</b>. No pace/curve/market cap.</div>';
    if (dd.anchorOrBase != null){
      h += '<div style="margin-bottom:14px;padding:10px 14px;background:#fef8ed;border:1px solid #c4823b;border-radius:5px;font-size:12px">';
      h += '<b style="color:#7a4f1c">Anchor used</b>: ' + fmt(dd.anchorOrBase) + ' (' + (dd.anchorOrBaseSource||'') + ')<br>';
      h += 'Base price (config): ' + fmt(dd.basePrice) + ' · LY median: ' + (dd.anchor && dd.anchor.medianADR ? fmt(dd.anchor.medianADR) : 'n/d');
      h += '</div>';
    }
  }
  h += '<div style="margin-bottom:14px"><div style="font-size:12px;font-weight:700;color:#c4823b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">① Historical anchor</div>';
  if (!dd.anchor || !dd.anchor.medianADR){
    h += '<div style="padding:8px 12px;background:#fff4f4;border:1px solid #e0a0a0;border-radius:4px;font-size:12px">No data LY disponibile per ' + (isBaseRT ? rt : baseRT_struct) + ' nel mese ' + monthNames[dd.month-1] + '. Fallback su ADR OTB o floor.</div>';
  } else {
    const fb = dd.anchor.fallbackUsed;
    const fbLbl = (fb === 'monthWide') ? ' <span style="color:#c4823b;font-style:italic">(widened to full month, &lt;3 same-DOW obs)</span>' : '';
    h += '<table style="width:100%;border-collapse:collapse;font-size:12px"><tr><td style="padding:3px 6px;color:#666;width:55%">Median ADR LY (Beddy_eq, 2024+2025 same-DOW)' + fbLbl + '</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace;font-weight:600">' + fmt(dd.anchor.medianADR) + '</td></tr>';
    h += '<tr><td style="padding:3px 6px;color:#666">Median RN sold / day LY</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace;font-weight:600">' + (dd.anchor.medianRN || 0) + '</td></tr>';
    h += '<tr><td style="padding:3px 6px;color:#666">Observations (n. bookings)</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace">' + dd.anchor.nObs + '</td></tr></table>';
  }
  h += '</div>';
  h += '<div style="margin-bottom:14px"><div style="font-size:12px;font-weight:700;color:#3d7a4b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">② Target Revenue</div>';
  h += '<table style="width:100%;border-collapse:collapse;font-size:12px"><tr><td style="padding:3px 6px;color:#666;width:55%">Target growth ' + monthNames[dd.month-1] + '</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace;font-weight:600">' + fmtPct(dd.targetGrowthPct) + '</td></tr>';
  if (dd.revLY != null){
    h += '<tr><td style="padding:3px 6px;color:#666">Revenue LY (ADR × RN)</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace">' + fmt(dd.revLY) + '</td></tr>';
    h += '<tr><td style="padding:3px 6px;color:#666">Revenue target</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace;font-weight:600">' + fmt(dd.revTarget) + '</td></tr>';
  }
  h += '</table></div>';
  if (!dd.longHorizon && dd.anchor && dd.anchor.medianADR){
    h += '<div style="margin-bottom:14px"><div style="font-size:12px;font-weight:700;color:#8e5fa8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">③ Expected RN + target ADR at close</div>';
    h += '<table style="width:100%;border-collapse:collapse;font-size:12px">';
    h += '<tr><td style="padding:3px 6px;color:#666;width:55%">RN OTB today (' + (isBaseRT ? rt : baseRT_struct) + ')</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace">' + dd.rnOtb + '</td></tr>';
    h += '<tr><td style="padding:3px 6px;color:#666">OTB Revenue Beddy_eq (OTA markup subtracted)</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace">' + fmt(dd.revYaFattoBeddyEq||0) + '</td></tr>';
    h += '<tr><td style="padding:3px 6px;color:#666">Average OTB ADR Beddy_eq</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace">' + fmt(dd.adrOtbBeddyEq||0) + '</td></tr>';
    h += '<tr><td style="padding:3px 6px;color:#666">Expected RN at close (LY fill × pace)</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace">' + fmt2(dd.rnLY != null ? dd.rnLY : 0) + ' × ' + fmt2(dd.pace) + ' = ' + fmt2(dd.rnAtteseChiusura != null ? dd.rnAtteseChiusura : 0) + '</td></tr>';
    h += '<tr><td style="padding:3px 6px;color:#666">Expected pickup (expected RN − OTB)</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace">' + fmt2(dd.pickupAtteso) + '</td></tr>';
    h += '<tr><td style="padding:3px 6px;color:#666">Expected RN at close (inventory cap ' + dd.inv + ')</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace;font-weight:600">' + fmt2(dd.rnAttese) + '</td></tr>';
    const caseLabel = dd.adrTargetCase === 'target_superato' ? 'TARGET ALREADY EXCEEDED'
                    : dd.adrTargetCase === 'vicino_target' ? '≥95% TARGET'
                    : 'BELOW 95% TARGET';
    const caseFormula = (dd.adrTargetCase === 'target_superato' || dd.adrTargetCase === 'vicino_target')
                        ? 'max(ADR OTB Beddy_eq, ADR_LY × growth)'
                        : '(Rev target − Rev OTB) / residual RN';
    const tettoStorico = dd.tettoStorico||0;
    h += '<tr><td colspan="2" style="padding:6px;background:rgba(142,95,168,.06);border-top:1px solid rgba(142,95,168,.15);font-size:11px;color:#8e5fa8;font-weight:600">Case: <b>' + caseLabel + '</b></td></tr>';
    h += '<tr><td style="padding:3px 6px;color:#666;font-size:11px">Historical ceiling (ADR LY × ' + (dd.targetGrowthPct||5) + '%)</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace;font-size:11px">' + fmt(tettoStorico) + '</td></tr>';
    h += '<tr><td style="padding:3px 6px;color:#666"><b>Target ADR at close</b> = ' + caseFormula + '</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace;font-weight:700">' + fmt(dd.adrTargetChiusura) + '</td></tr>';
    h += '</table></div>';
    h += '<div style="margin-bottom:14px"><div style="font-size:12px;font-weight:700;color:#c4823b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">④ Market cap (Expedia compset)</div>';
    if (!dd.marketCap || dd.marketCap.nCompet === 0){
      h += '<div style="padding:8px 12px;background:#f5f5f5;border-radius:4px;font-size:12px;color:#888">No competitor with a valid price for this date. Cap not applied.</div>';
    } else {
      const m = dd.marketCap;
      h += '<table style="width:100%;border-collapse:collapse;font-size:12px"><tr><td style="padding:3px 6px;color:#666;width:55%">Active competitors (weight > 0)</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace">' + m.nCompet + '</td></tr>';
      h += '<tr><td style="padding:3px 6px;color:#666">Compset reference Beddy_eq</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace;font-weight:600">' + fmt(m.ref) + '</td></tr>';
      h += '<tr><td style="padding:3px 6px;color:#666">Allowed range [×0.80, ×' + (m.capHi != null ? m.capHi.toFixed(2) : '1.20') + ']' + (m.conservative ? ' <span style="color:#c4823b;font-style:italic">(conservative ≤60d)</span>' : '') + '</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace">[' + fmt(m.min) + ', ' + fmt(m.max) + ']</td></tr>';
      const capped = (dd.pCapped !== dd.pGrezzo);
      h += '<tr><td style="padding:3px 6px;color:#666">P_capped' + (capped ? ' <span style="color:#c4823b;font-style:italic">(capped!)</span>' : '') + '</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace;font-weight:' + (capped?'700':'400') + '">' + fmt(dd.pCapped) + '</td></tr>';
      h += '</table>';
      h += '<details style="margin-top:6px;font-size:11px"><summary style="cursor:pointer;color:#888">Competitor detail</summary><table style="width:100%;border-collapse:collapse;margin-top:6px;font-size:11px"><thead style="background:#f5f5f5"><tr><th style="padding:4px 6px;text-align:left">Competitor</th><th style="padding:4px 6px;text-align:right">Weight</th><th style="padding:4px 6px;text-align:right">Raw €</th><th style="padding:4px 6px;text-align:right">Beddy_eq</th><th style="padding:4px 6px;text-align:right">Offset</th><th style="padding:4px 6px;text-align:right">Adjusted</th></tr></thead><tbody>';
      for (const c of m.details){
        h += '<tr><td style="padding:3px 6px">' + c.name + '</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace">' + c.peso + '</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace">' + fmt(c.rawPrice) + '</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace">' + fmt(c.beddyEq) + '</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace">' + (c.offset>=0?'+':'') + c.offset + '€</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace;font-weight:600">' + fmt(c.adjusted) + '</td></tr>';
      }
      h += '</tbody></table></details>';
    }
    h += '</div>';
  }
  h += '<div style="margin-bottom:14px"><div style="font-size:12px;font-weight:700;color:#3d7a4b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">⑤ Floor + Base lift + ⑥ Re-target</div>';
  h += '<table style="width:100%;border-collapse:collapse;font-size:12px">';
  h += '<tr><td style="padding:3px 6px;color:#666;width:55%">Property floor (hard)</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace">' + fmt(dd.floor) + '</td></tr>';
  h += '<tr><td style="padding:3px 6px;color:#666">Property base price (soft)</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace">' + fmt(dd.basePrice) + '</td></tr>';
  if (dd.pCapped != null && dd.pFloored != null){
    const floorApplied = (dd.pFloored !== dd.pCapped);
    h += '<tr><td style="padding:3px 6px;color:#666">P_floored' + (floorApplied ? ' <span style="color:#3d7a4b;font-style:italic">(floor applicato)</span>' : '') + '</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace">' + fmt(dd.pFloored) + '</td></tr>';
  }
  if (dd.baseLiftApplied){
    h += '<tr><td style="padding:3px 6px;color:#666"><b>Base lift applied</b> (P below Base): average between ' + fmt(dd.baseLiftFrom) + ' e ' + fmt(dd.basePrice) + '</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace;color:#7a4f1c;font-weight:700">' + fmt(dd.pBaseLifted) + '</td></tr>';
  } else if (dd.pBaseLifted != null){
    h += '<tr><td style="padding:3px 6px;color:#666">Base lift not applied (P ≥ Base)</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace;color:#999">—</td></tr>';
  }
  if (dd.retargetTriggered){
    h += '<tr><td style="padding:3px 6px;color:#666"><b>Re-target applied</b> (below target by &gt;8%)</td><td style="padding:3px 6px;text-align:right;font-family:\'DM Mono\',monospace;color:#c4823b;font-weight:600">' + fmtPct(dd.targetGrowthEffettivo) + ' effective</td></tr>';
  }
  h += '</table></div>';
  h += '<div style="margin-top:18px;padding:14px 16px;background:linear-gradient(180deg,#fef8ed,#fdf0d8);border:2px solid #c4823b;border-radius:6px">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center">';
  h += '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#7a4f1c">Base Price ' + (isBaseRT ? rt : baseRT_struct + ' (baseRT)') + '</div>';
  h += '<div style="font-size:22px;font-weight:700;font-family:\'DM Mono\',monospace;color:#5a3a14">' + fmt(dd.priceFinal) + '</div>';
  h += '</div></div>';
  h += '<div style="margin-top:14px;padding:8px 12px;background:#f5f5f5;border-radius:4px;font-size:11px;color:#666;line-height:1.4">';
  h += '<b>Note</b>: this is the <b>Base Price</b>, the structural price of the day. To see how the Base Price is adjusted by the 5 RMES factors (A · Demand (occ), B · Demand (Price), C · Pace Trend, D · Online Pricing, E · Demand (Expedia)) to produce the RMES suggested price, click the <b>RMES</b> cell on the right in the table.';
  h += '</div>';
  h += '</div>';  // /body
  h += '</div></div>';  // /modal /bg
  document.body.insertAdjacentHTML('beforeend', h);
}
/* ---------- Tab RMES: sezione Foundation Pricing Config ---------- */
function fp_renderFoundationConfigBox(structKey){
  const wrap = document.getElementById('fp-tab-wrap');
  if (!wrap) return;
  const structLbl = (structKey === 'condotta') ? 'Condotta 16'
                  : (structKey === 'alfani')   ? 'Palazzo Alfani'
                  : (structKey === 'davids') ? "Enis Guesthouse"
                  : 'Firenze Suite';
  let h = '';
  h += '<div class="panel" style="margin-bottom:16px">';
  h += '<div class="panel-head"><div><h3>Ⓐ Target Revenue growth by month <span class="mono" style="font-weight:400;font-size:11px;color:var(--ink-3);margin-left:6px">property: ' + structLbl + '</span></h3>';
  h += '<div class="panel-sub">Target revenue growth vs LY for each calendar month. Default +5% for all. Used as a multiplier on LY Revenue → target Revenue. E.g. +8% July means: the day\'s goal is to close at LY Revenue × 1.08.</div></div></div>';
  h += '<div class="panel-body" style="padding:12px 16px"><div id="fp-tg-grid" style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px"></div></div>';
  h += '</div>';
  h += '<div class="panel" style="margin-bottom:16px">';
  h += '<div class="panel-head"><div><h3>Ⓑ Base, Floor, OTA markup, Elasticity <span class="mono" style="font-weight:400;font-size:11px;color:var(--ink-3);margin-left:6px">property: ' + structLbl + '</span></h3>';
  h += '<div class="panel-sub"><b>Anchor Price</b>: the annual "fair" price (net Beddy_eq), used as a guard-rail in the Base Price calculation (the final Base never drifts more than ±50% from this Anchor). Default Firenze 220 / Condotta 280 / Alfani 270 / David\'s 145. <b>Floor</b>: the absolute minimum below which the Base Price never drops. Default €100. <b>OTA markup</b>: the percentage OTAs add to the net Beddy_eq price. Default 12%. Used for: (1) converting OTA booking revenue to Beddy_eq in the historical calculation (revPerNightCaricato = revLordo / (1+markup/100)); (2) converting My Expedia → Beddy_eq in the RMES factors; (3) computing the compset reference. On save the system recomputes revPerNightCaricato on the existing BOOKINGS. <b>Price elasticity</b>: the estimate used in override simulations (RMES modal). E.g. 1.0 = if I lower the price -10%, I sell +10% RN. Default 1.0. The "📊 Estimate from data" computes the estimate from your historical data (last 24 months, grouped by month × DOW).</div></div></div>';
  h += '<div class="panel-body" style="padding:12px 16px;display:flex;align-items:center;gap:24px;flex-wrap:wrap">';
  h += '<label style="font-size:12px;color:var(--ink-2)"><b style="color:#7a4f1c">Anchor Price</b>: <input type="number" id="fp-base-input" min="0" max="2000" step="10" style="width:80px;padding:6px 8px;border:1px solid #c4823b;border-radius:4px;font-family:\'DM Mono\',monospace;text-align:right;font-size:13px;background:#fef8ed"> €</label>';
  h += '<label style="font-size:12px;color:var(--ink-2)"><b>Floor rate</b>: <input type="number" id="fp-floor-input" min="0" max="1000" step="10" style="width:80px;padding:6px 8px;border:1px solid var(--line);border-radius:4px;font-family:\'DM Mono\',monospace;text-align:right;font-size:13px"> €</label>';
  h += '<label style="font-size:12px;color:var(--ink-2)"><b style="color:#3a6b6b">Markup Expedia/altri</b>: <input type="number" id="fp-mk-expedia" min="0" max="50" step="1" style="width:55px;padding:6px 8px;border:1px solid #3a6b6b;border-radius:4px;font-family:\'DM Mono\',monospace;text-align:right;font-size:13px;background:#eef6f6"> %</label>';
  h += '<label style="font-size:12px;color:var(--ink-2)" title="Booking.com markup for channel history"><b style="color:#1e4a6b">Markup Booking</b>: <input type="number" id="fp-mk-booking" min="0" max="50" step="1" style="width:55px;padding:6px 8px;border:1px solid #1e4a6b;border-radius:4px;font-family:\'DM Mono\',monospace;text-align:right;font-size:13px;background:#eef4fa"> %</label>';
  h += '<label style="font-size:12px;color:var(--ink-2)" title="Airbnb/VRBO markup for channel history"><b style="color:#a83b6b">Markup Airbnb/VRBO</b>: <input type="number" id="fp-mk-airbnb" min="0" max="50" step="1" style="width:55px;padding:6px 8px;border:1px solid #a83b6b;border-radius:4px;font-family:\'DM Mono\',monospace;text-align:right;font-size:13px;background:#faeef4"> %</label>';
  h += '<label style="font-size:12px;color:var(--ink-2)" title="Price elasticity: if the price changes by X%, expected RN change in the opposite direction by X% × elasticity. Default 1.0 (ratio 1:1). E.g.: 0.5 = low elasticity, 1.5 = high elasticity."><b style="color:#a83b3b">Price elasticity</b>: <input type="number" id="fp-elasticity-input" min="0" max="3" step="0.1" style="width:60px;padding:6px 8px;border:1px solid #a83b3b;border-radius:4px;font-family:\'DM Mono\',monospace;text-align:right;font-size:13px;background:#fdeef0"> :1</label>';
  h += '<button id="fp-elasticity-estimate" type="button" style="font-size:11px;padding:6px 10px;border:1px solid #a83b3b;border-radius:4px;background:#fff;color:#a83b3b;cursor:pointer;font-family:\'DM Sans\',sans-serif" title="Estimate elasticity from the last 24 months of history">📊 Estimate from data</button>';
  h += '<span style="font-size:11px;color:var(--ink-3);font-style:italic">Press "Recompute Base Price" below to apply</span>';
  h += '</div></div>';
  h += '<div class="panel" style="margin-bottom:16px">';
  h += '<div class="panel-head"><div><h3>Ⓒ Compset competitor weights and offsets <span class="mono" style="font-weight:400;font-size:11px;color:var(--ink-3);margin-left:6px">property: ' + structLbl + '</span></h3>';
  h += '<div class="panel-sub"><b>Weight</b> (0-100%, default 100): how much a competitor counts. Weight = 0 excludes it. <b>Offset €</b> (default 0): e.g. -10 = "I want to stay €10 below this competitor". Two numbers come out of this: the <b>Weighted Expedia Compset</b> (weights only, no offset) feeds the <b>D · Online Pricing</b> RMES factor; the <b>Expedia Goal Value</b> (weights + offsets, Σ(weight × (price_Beddy_eq + offset)) / Σ(weight)) is the desired positioning and caps the Base Price (max — never above it).</div></div>';
  h += '<button id="fp-reset-pesi-100" style="font-size:10px;padding:5px 10px;border:1px solid var(--line);border-radius:4px;background:#fff;color:var(--ink);cursor:pointer;font-family:\'DM Sans\',sans-serif;align-self:flex-start">reset weights to 100%</button>';
  h += '</div>';
  h += '<div class="panel-body" style="padding:8px 16px"><table id="fp-comp-table" style="width:100%;border-collapse:collapse;font-size:12px"><thead style="background:#f8f8f5"><tr><th style="padding:6px 10px;text-align:left;border-bottom:1px solid var(--line);font-size:11px;color:var(--ink-2)">Competitor</th><th style="padding:6px 10px;text-align:right;border-bottom:1px solid var(--line);font-size:11px;color:var(--ink-2);width:110px">Weight (0-100%)</th><th style="padding:6px 10px;text-align:right;border-bottom:1px solid var(--line);font-size:11px;color:var(--ink-2);width:120px">Offset €</th></tr></thead><tbody></tbody></table></div></div>';
  // Override audit panel: hidden in NewRMES (replaced by ✓ accept / 🖋 override per day or period; legacy comparison no longer meaningful)
  h += '<div class="panel" style="margin-bottom:16px;display:none">';
  h += '<div class="panel-head"><div><h3>Ⓓ Override audit (post-close) <span class="mono" style="font-weight:400;font-size:11px;color:var(--ink-3);margin-left:6px">property: ' + structLbl + '</span></h3>';
  h += '<div class="panel-sub">For each <b>closed</b> day with active override, comparison override vs RMES price it would have suggested at save time (snapshot). Shows: override price, RMES snapshot price, actual RN sold (Beddy), effective revenue (= Beddy_eq revenue collected), hypothetical revenue if you had followed RMES (= RMES_price × same RN sold). Δ Revenue shows who would have done better. <b>Limitation</b>: it assumes the SAME RN would have been sold at the RMES price. Necessary approximation — the true counterfactual pickup is impossible to measure. It serves as a historical signal: if RMES "vince" sistematicamente su override negative ones, you were too aggressive in discounting; if it "wins" on positive overrides, you were raising too much.</div></div></div>';
  h += '<div class="panel-body" style="padding:12px 16px">';
  h += '<div id="fp-audit-list" style="font-size:12px"></div>';
  h += '</div></div>';
  h += '<div class="panel" style="margin-bottom:16px">';
  h += '<div class="panel-head"><div><h3>Ⓔ RT supplements by month <span class="mono" style="font-weight:400;font-size:11px;color:var(--ink-3);margin-left:6px">property: ' + structLbl + '</span></h3>';
  h += '<div class="panel-sub">The Base Price is computed <b>only for the baseRT</b> (' + structLbl + ' → <b id="fp-supp-baseRT">—</b>). Other RTs inherit it via a monthly supplement: <code>Base_RT = Base_baseRT + RT_month_supplement</code>. The supplements are <b>derived from history</b> (average RT ADR minus baseRT ADR, split by high/low season, rounded to the nearest multiple of 5), and identical for all days of the same month. <b>Example</b>: if Suite con Terrazza has a May supplement of €70, and the Base Price for Camera Matrim. Deluxe that day is €318, so the Base Price for Suite con Terrazza = €318 + €70 = €388. The same RMES multiplier (×0.767 for the property) applies on top: final price Suite con Terrazza = €388 × 0.767 = €297. Information panel (read-only).</div></div></div>';
  h += '<div class="panel-body" style="padding:12px 16px">';
  h += '<div id="fp-supp-table-wrap" style="font-size:12px;overflow-x:auto"></div>';
  h += '</div></div>';
  h += '<div style="display:flex;gap:10px;justify-content:flex-end;padding:14px 0;border-top:1px solid var(--line);margin-top:18px">';
  h += '<button id="fp-reset-defaults" style="font-size:12px;padding:8px 16px;border:1px solid var(--line);border-radius:5px;background:#fff;color:var(--ink);cursor:pointer">↺ Reset Base Price defaults</button>';
  h += '<button id="fp-recompute" style="font-size:13px;padding:8px 22px;border:1px solid #c4823b;border-radius:5px;background:#c4823b;color:#fff;cursor:pointer;font-weight:700">↻ Recompute Base Price</button>';
  h += '</div>';
  wrap.innerHTML = h;
  const tgGrid = document.getElementById('fp-tg-grid');
  const monthLbls = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  for (let m=1; m<=12; m++){
    const v = fp_getTargetGrowth(structKey, m);
    const cell = document.createElement('div');
    cell.innerHTML = '<div style="font-size:10px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.06em;font-weight:600;margin-bottom:4px">' + monthLbls[m-1] + '</div>' +
                     '<div style="display:flex;align-items:center;gap:2px"><input type="number" data-fp-month="' + m + '" value="' + v + '" min="-50" max="100" step="1" style="width:55px;padding:5px 6px;border:1px solid var(--line);border-radius:4px;font-family:\'DM Mono\',monospace;text-align:right;font-size:12px"><span style="font-size:11px;color:var(--ink-3)">%</span></div>';
    tgGrid.appendChild(cell);
  }
  document.getElementById('fp-base-input').value = fp_getBasePrice(structKey);
  document.getElementById('fp-floor-input').value = fp_getFloor(structKey);
  const _mk = (typeof fp_getChannelMarkups === 'function') ? fp_getChannelMarkups() : {expedia:17,booking:13,airbnb:10};
  const _mkE = document.getElementById('fp-mk-expedia'); if (_mkE) _mkE.value = _mk.expedia;
  const _mkB = document.getElementById('fp-mk-booking'); if (_mkB) _mkB.value = _mk.booking;
  const _mkA = document.getElementById('fp-mk-airbnb');  if (_mkA) _mkA.value = _mk.airbnb;
  const elInp = document.getElementById('fp-elasticity-input');
  if (elInp) elInp.value = fp_getElasticity(structKey);
  const compNames = fp_getCompetitorsForStruct(structKey);
  const tbody = document.querySelector('#fp-comp-table tbody');
  for (const cn of compNames){
    const cfg = fp_getCompsetConfig(structKey, cn);
    const tr = document.createElement('tr');
    tr.innerHTML = '<td style="padding:6px 10px;border-bottom:1px solid #eee">' + cn + '</td>' +
                   '<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right"><input type="number" data-fp-comp-peso="' + cn.replace(/"/g,'&quot;') + '" value="' + cfg.peso + '" min="0" max="100" step="5" style="width:60px;padding:4px 6px;border:1px solid var(--line);border-radius:4px;font-family:\'DM Mono\',monospace;text-align:right;font-size:12px"></td>' +
                   '<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right"><input type="number" data-fp-comp-offset="' + cn.replace(/"/g,'&quot;') + '" value="' + cfg.offset + '" min="-200" max="200" step="5" style="width:70px;padding:4px 6px;border:1px solid var(--line);border-radius:4px;font-family:\'DM Mono\',monospace;text-align:right;font-size:12px"></td>';
    tbody.appendChild(tr);
  }
  document.getElementById('fp-reset-defaults').onclick = function(){
    if (!confirm('Reset Foundation parameters for ' + structLbl + ' to defaults? (target=+5% all months, base=' + (FP_BASE_PRICE_DEFAULTS[structKey]||180) + '€, floor=100€, offset=0). Compset WEIGHTS are NOT changed.')) return;
    fp_resetDefaults(structKey);
    fp_renderFoundationConfigBox(structKey);
  };
  function _renderAuditList(){
    const list = document.getElementById('fp-audit-list');
    if (!list) return;
    const all = fp_getOverrides();
    const overridesForStruct = all[structKey] || {};
    const today = new Date(TODAY); today.setHours(0,0,0,0);
    const todayYmd = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
    const structName = (structKey === 'condotta') ? 'Condotta 16'
                     : (structKey === 'alfani')   ? 'Palazzo Alfani'
                     : (structKey === 'davids') ? "Florence David's Apartament"
                     : 'Firenze Suite';
    const auditRows = [];
    for (const dateISO in overridesForStruct){
      if (dateISO >= todayYmd) continue;
      const rtMap = overridesForStruct[dateISO];
      for (const rtN in rtMap){
        const ovrObj = rtMap[rtN];
        const ovrPrice = (typeof ovrObj === 'number') ? ovrObj : (ovrObj && ovrObj.price);
        const snapshot = (typeof ovrObj === 'object' && ovrObj) ? ovrObj.snapshot : null;
        if (ovrPrice == null || !isFinite(ovrPrice)) continue;
        let rnFinal = 0, revFinal = 0;
        if (typeof BOOKINGS !== 'undefined'){
          const td = new Date(dateISO + 'T00:00:00');
          if (!isNaN(td.getTime())){
            const tdYmd = td.getFullYear() + '-' + String(td.getMonth()+1).padStart(2,'0') + '-' + String(td.getDate()).padStart(2,'0');
            for (const b of BOOKINGS){
              if (b.struct !== structName) continue;
              if (b.stato !== 'Confermate') continue;
              if (b.room !== rtN) continue;
              if (!b.dIn || !b.dOut) continue;
              const ciYmd = b.dIn.getFullYear() + '-' + String(b.dIn.getMonth()+1).padStart(2,'0') + '-' + String(b.dIn.getDate()).padStart(2,'0');
              const coYmd = b.dOut.getFullYear() + '-' + String(b.dOut.getMonth()+1).padStart(2,'0') + '-' + String(b.dOut.getDate()).padStart(2,'0');
              if (ciYmd <= tdYmd && coYmd > tdYmd){
                rnFinal++;
                revFinal += (b.revPerNightCaricato != null) ? b.revPerNightCaricato : b.revPerNight;
              }
            }
          }
        }
        const rmesSugg = (snapshot && snapshot.rmesSuggested != null) ? +snapshot.rmesSuggested : null;
        const revIpotetico = (rmesSugg != null) ? rmesSugg * rnFinal : null;
        const deltaRev = (revIpotetico != null) ? revFinal - revIpotetico : null;
        auditRows.push({ dateISO, rtN, ovrPrice, rmesSugg, rnFinal, revFinal, revIpotetico, deltaRev });
      }
    }
    const futureOverrides = [];
    for (const dateISO in overridesForStruct){
      if (dateISO < todayYmd) continue;  // solo futuri/oggi
      const rtMap = overridesForStruct[dateISO];
      for (const rtN in rtMap){
        const ovrObj = rtMap[rtN];
        const ovrPrice = (typeof ovrObj === 'number') ? ovrObj : (ovrObj && ovrObj.price);
        const snapshot = (typeof ovrObj === 'object' && ovrObj) ? ovrObj.snapshot : null;
        if (ovrPrice == null || !isFinite(ovrPrice)) continue;
        const rmesSugg = (snapshot && snapshot.rmesSuggested != null) ? +snapshot.rmesSuggested : null;
        const savedAt = (typeof ovrObj === 'object' && ovrObj) ? ovrObj.savedAt : null;
        futureOverrides.push({ dateISO, rtN, ovrPrice, rmesSugg, savedAt });
      }
    }
    futureOverrides.sort((a,b) => a.dateISO.localeCompare(b.dateISO));
    let h = '';
    if (futureOverrides.length > 0){
      h += '<div style="margin-bottom:18px">';
      h += '<div style="font-size:12px;font-weight:700;color:#1e4a6b;margin-bottom:8px">🖋 Active overrides on future days (' + futureOverrides.length + ')</div>';
      h += '<div style="font-size:11px;color:#888;margin-bottom:8px;font-style:italic">Active overrides not yet closed (day ≥ today). No revenue comparison yet. To remove an override use the ↺ button in the Base Price cell or the "Reset period" button.</div>';
      h += '<table style="width:100%;border-collapse:collapse;font-size:11px"><thead style="background:#eef4fb"><tr>';
      h += '<th style="padding:6px 8px;text-align:left;color:#1e4a6b;font-weight:600">Date</th>';
      h += '<th style="padding:6px 8px;text-align:left;color:#1e4a6b;font-weight:600">RT</th>';
      h += '<th style="padding:6px 8px;text-align:right;color:#1e4a6b;font-weight:600">Override</th>';
      h += '<th style="padding:6px 8px;text-align:right;color:#1e4a6b;font-weight:600">RMES sugg. (snapshot)</th>';
      h += '<th style="padding:6px 8px;text-align:right;color:#1e4a6b;font-weight:600">Δ vs RMES</th>';
      h += '<th style="padding:6px 8px;text-align:left;color:#1e4a6b;font-weight:600">Impostato il</th>';
      h += '</tr></thead><tbody>';
      for (const r of futureOverrides){
        const dParts = r.dateISO.split('-');
        const ddMmYyyy = dParts[2]+'/'+dParts[1]+'/'+dParts[0];
        const delta = (r.rmesSugg != null) ? (r.ovrPrice - r.rmesSugg) : null;
        const dCol = (delta != null) ? (delta > 0 ? '#1e6b4a' : (delta < 0 ? '#a83b3b' : '#666')) : '#bbb';
        const dSign = (delta != null && delta >= 0) ? '+' : '';
        let savedLbl = '—';
        if (r.savedAt){
          try { const sd = new Date(r.savedAt); savedLbl = String(sd.getDate()).padStart(2,'0')+'/'+String(sd.getMonth()+1).padStart(2,'0')+'/'+sd.getFullYear(); } catch(e){}
        }
        h += '<tr style="background:rgba(59,107,154,.03)">';
        h += '<td style="padding:5px 8px;border-bottom:1px solid #e8eef5;font-family:\'DM Mono\',monospace">'+ddMmYyyy+'</td>';
        h += '<td style="padding:5px 8px;border-bottom:1px solid #e8eef5">'+r.rtN+'</td>';
        h += '<td style="padding:5px 8px;border-bottom:1px solid #e8eef5;text-align:right;font-family:\'DM Mono\',monospace;color:#1e4a6b;font-weight:700">€'+r.ovrPrice.toFixed(0)+'</td>';
        h += '<td style="padding:5px 8px;border-bottom:1px solid #e8eef5;text-align:right;font-family:\'DM Mono\',monospace;color:#666">'+(r.rmesSugg!=null?'€'+r.rmesSugg.toFixed(0):'<span style="color:#bbb">n/d</span>')+'</td>';
        h += '<td style="padding:5px 8px;border-bottom:1px solid #e8eef5;text-align:right;font-family:\'DM Mono\',monospace;color:'+dCol+';font-weight:600">'+(delta!=null?dSign+'€'+delta.toFixed(0):'<span style="color:#bbb">—</span>')+'</td>';
        h += '<td style="padding:5px 8px;border-bottom:1px solid #e8eef5;font-family:\'DM Mono\',monospace;color:#999;font-size:10.5px">'+savedLbl+'</td>';
        h += '</tr>';
      }
      h += '</tbody></table>';
      h += '</div>';
    }
    if (auditRows.length === 0 && futureOverrides.length === 0){
      list.innerHTML = '<div style="padding:10px 12px;background:#f8f8f5;border-radius:4px;color:#888;font-style:italic">No active override. When you accept an RMES suggestion or override a Base Price (clicking ✓ or 🖋 in the Sell Strategy), it will appear here: first in the "future" section, then in the audit once the day is closed.</div>';
      return;
    }
    if (auditRows.length === 0){
      h += '<div style="padding:10px 12px;background:#f8f8f5;border-radius:4px;color:#888;font-style:italic;font-size:11px">No overrides on already-closed days. The revenue comparison will appear once the days with overrides have passed.</div>';
      list.innerHTML = h;
      return;
    }
    auditRows.sort((a,b) => b.dateISO.localeCompare(a.dateISO));
    let totDelta = 0, nValid = 0, nVintoOverride = 0, nVintoRMES = 0;
    for (const r of auditRows){
      if (r.deltaRev != null){
        totDelta += r.deltaRev; nValid++;
        if (r.deltaRev > 0.5) nVintoOverride++;
        else if (r.deltaRev < -0.5) nVintoRMES++;
      }
    }
    h += '<div style="font-size:12px;font-weight:700;color:#666;margin-bottom:8px;padding-top:8px;border-top:1px solid var(--line)">📊 Audit overrides on closed days (historic)</div>';
    if (nValid > 0){
      const sign = totDelta >= 0 ? '+' : '';
      const col = totDelta > 0 ? '#1e6b4a' : (totDelta < 0 ? '#a83b3b' : '#666');
      h += '<div style="padding:10px 14px;background:#f8f8f5;border-radius:5px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;font-size:12px">';
      h += '<div><b>'+auditRows.length+' overrides on closed days</b> · '+nVintoOverride+' in favour of override · '+nVintoRMES+' in favour of RMES · '+(nValid - nVintoOverride - nVintoRMES)+' ties</div>';
      h += '<div>Total Δ Revenue (override vs RMES): <b style="font-family:\'DM Mono\',monospace;color:'+col+'">'+sign+'€'+totDelta.toFixed(2)+'</b></div>';
      h += '</div>';
    }
    h += '<table style="width:100%;border-collapse:collapse;font-size:11px"><thead style="background:#f8f8f5"><tr>';
    h += '<th style="padding:6px 8px;text-align:left;color:#666;font-weight:600">Date</th>';
    h += '<th style="padding:6px 8px;text-align:left;color:#666;font-weight:600">RT</th>';
    h += '<th style="padding:6px 8px;text-align:right;color:#666;font-weight:600">Override</th>';
    h += '<th style="padding:6px 8px;text-align:right;color:#666;font-weight:600">RMES sugg.</th>';
    h += '<th style="padding:6px 8px;text-align:right;color:#666;font-weight:600">RN sold</th>';
    h += '<th style="padding:6px 8px;text-align:right;color:#666;font-weight:600">Actual rev</th>';
    h += '<th style="padding:6px 8px;text-align:right;color:#666;font-weight:600">Rev ipotetico RMES</th>';
    h += '<th style="padding:6px 8px;text-align:right;color:#666;font-weight:600">Δ Rev</th>';
    h += '<th style="padding:6px 8px;text-align:center;color:#666;font-weight:600">Vincitore</th>';
    h += '</tr></thead><tbody>';
    for (const r of auditRows){
      const dParts = r.dateISO.split('-');
      const ddMmYyyy = dParts[2]+'/'+dParts[1]+'/'+dParts[0];
      h += '<tr>';
      h += '<td style="padding:5px 8px;border-bottom:1px solid #eee;font-family:\'DM Mono\',monospace">'+ddMmYyyy+'</td>';
      h += '<td style="padding:5px 8px;border-bottom:1px solid #eee">'+r.rtN+'</td>';
      h += '<td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:right;font-family:\'DM Mono\',monospace;color:#7a4f1c;font-weight:600">€'+r.ovrPrice.toFixed(0)+'</td>';
      h += '<td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:right;font-family:\'DM Mono\',monospace;color:#1e6b4a">'+(r.rmesSugg!=null?'€'+r.rmesSugg.toFixed(0):'<span style="color:#bbb">n/d</span>')+'</td>';
      h += '<td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:right;font-family:\'DM Mono\',monospace">'+r.rnFinal+'</td>';
      h += '<td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:right;font-family:\'DM Mono\',monospace">€'+r.revFinal.toFixed(0)+'</td>';
      h += '<td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:right;font-family:\'DM Mono\',monospace">'+(r.revIpotetico!=null?'€'+r.revIpotetico.toFixed(0):'<span style="color:#bbb">n/d</span>')+'</td>';
      if (r.deltaRev != null){
        const dCol = r.deltaRev > 0 ? '#1e6b4a' : (r.deltaRev < 0 ? '#a83b3b' : '#666');
        const dSign = r.deltaRev >= 0 ? '+' : '';
        h += '<td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:right;font-family:\'DM Mono\',monospace;color:'+dCol+';font-weight:700">'+dSign+'€'+r.deltaRev.toFixed(0)+'</td>';
        const vincitore = r.deltaRev > 0.5 ? '<span style="color:#7a4f1c;font-weight:600">🖋 Override</span>'
                       : r.deltaRev < -0.5 ? '<span style="color:#1e6b4a;font-weight:600">💡 RMES</span>'
                       : '<span style="color:#888">pari</span>';
        h += '<td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:center;font-size:10.5px">'+vincitore+'</td>';
      } else {
        h += '<td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:right;color:#bbb">—</td>';
        h += '<td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:center;color:#bbb">—</td>';
      }
      h += '</tr>';
    }
    h += '</tbody></table>';
    h += '<div style="margin-top:8px;font-size:10px;color:#999;font-style:italic">Note: hypothetical revenue assumes the same RN would have been sold at the RMES price. Approximation: it does not account for the possibility that a different price would have changed pickup.</div>';
    list.innerHTML = h;
  }
  _renderAuditList();
  function _renderSuppTable(){
    const wrap = document.getElementById('fp-supp-table-wrap');
    if (!wrap) return;
    if (typeof aggPricingDaily !== 'function'){
      wrap.innerHTML = '<div style="color:var(--ink-3);font-style:italic">Data not available yet.</div>';
      return;
    }
    try {
      const today = new Date(TODAY); today.setHours(0,0,0,0);
      const todayNum = today.getFullYear()*10000 + (today.getMonth()+1)*100 + today.getDate();
      const A = aggPricingDaily(structKey, todayNum, 1);
      if (!A || !A.baseRT){
        wrap.innerHTML = '<div style="color:var(--ink-3);font-style:italic">No supplement data available.</div>';
        return;
      }
      const baseRT = A.baseRT;
      const rtList = A.rtList || [];
      const supp = A.supplementoStagione || {};
      const highSeasonSet = new Set(A.highSeason || []);
      const baseLblEl = document.getElementById('fp-supp-baseRT');
      if (baseLblEl) baseLblEl.textContent = baseRT;
      const monthLbls = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      let html = '<table style="width:100%;border-collapse:collapse;font-size:11.5px">';
      html += '<thead style="background:#f8f8f5"><tr>';
      html += '<th style="padding:6px 10px;text-align:left;border-bottom:1px solid var(--line);font-size:11px;color:var(--ink-2);min-width:170px">Room Type</th>';
      for (let m=1; m<=12; m++){
        const isHigh = highSeasonSet.has(m);
        const bg = isHigh ? '#fff4e0' : '#f8f8f5';
        const col = isHigh ? '#a06820' : 'var(--ink-2)';
        const tip = isHigh ? 'HIGH season' : 'LOW season';
        html += '<th title="' + tip + '" style="padding:6px 6px;text-align:center;border-bottom:1px solid var(--line);font-size:11px;color:' + col + ';background:' + bg + ';width:54px">' + monthLbls[m-1] + '</th>';
      }
      html += '</tr></thead>';
      html += '<tbody>';
      html += '<tr style="background:rgba(195,131,59,.06)">';
      html += '<td style="padding:7px 10px;border-bottom:1px solid #f0eee8;font-family:\'DM Mono\',monospace;font-weight:700;color:#5a3a14"><b>' + baseRT + '</b> <span style="font-size:10px;font-weight:400;color:#888">(baseRT)</span></td>';
      for (let m=1; m<=12; m++){
        html += '<td style="padding:7px 6px;text-align:center;border-bottom:1px solid #f0eee8;font-family:\'DM Mono\',monospace;color:#5a3a14">€0</td>';
      }
      html += '</tr>';
      for (const rt of rtList){
        if (rt === baseRT) continue;
        const s = supp[rt] || { alta: 0, bassa: 0 };
        html += '<tr>';
        html += '<td style="padding:7px 10px;border-bottom:1px solid #f0eee8;font-family:\'DM Mono\',monospace;font-weight:600">' + rt + '</td>';
        for (let m=1; m<=12; m++){
          const isHigh = highSeasonSet.has(m);
          const v = isHigh ? s.alta : s.bassa;
          const bg = isHigh ? 'rgba(255,200,120,.13)' : 'transparent';
          const sign = v >= 0 ? '+' : '';
          html += '<td style="padding:7px 6px;text-align:center;border-bottom:1px solid #f0eee8;font-family:\'DM Mono\',monospace;background:' + bg + '">' + sign + '€' + v.toFixed(0) + '</td>';
        }
        html += '</tr>';
      }
      html += '</tbody></table>';
      const altaMesi = [];
      for (let m=1; m<=12; m++){ if (highSeasonSet.has(m)) altaMesi.push(monthLbls[m-1]); }
      const bassaMesi = [];
      for (let m=1; m<=12; m++){ if (!highSeasonSet.has(m)) bassaMesi.push(monthLbls[m-1]); }
      html += '<div style="margin-top:10px;font-size:10.5px;color:#888;display:flex;gap:18px;flex-wrap:wrap">';
      html += '<div><span style="display:inline-block;width:12px;height:12px;background:#fff4e0;border:1px solid #f0d090;border-radius:2px;vertical-align:middle;margin-right:4px"></span><b style="color:#a06820">HIGH</b> season (' + altaMesi.join(', ') + ')</div>';
      html += '<div><span style="display:inline-block;width:12px;height:12px;background:#f8f8f5;border:1px solid var(--line);border-radius:2px;vertical-align:middle;margin-right:4px"></span><b>LOW</b> season (' + bassaMesi.join(', ') + ')</div>';
      html += '</div>';
      html += '<div style="margin-top:10px;font-size:10.5px;color:#999;font-style:italic;line-height:1.5">';
      html += 'Supplements are computed automatically by <code>aggPricingDaily</code>: for each RT, average historical RT ADR minus average historical baseRT ADR, split by high/low season, rounded to the nearest multiple of 5. Any manual override (e.g. Firenze Suite set to €20 in high season) is applied on top.';
      html += '</div>';
      wrap.innerHTML = html;
    } catch(e){
      wrap.innerHTML = '<div style="color:#a83b3b;font-style:italic">Error loading supplements: ' + (e.message || 'unknown') + '</div>';
    }
  }
  _renderSuppTable();
  const btnResetPesi = document.getElementById('fp-reset-pesi-100');
  if (btnResetPesi){
    btnResetPesi.onclick = function(){
      if (!confirm('Reset all competitor weights of ' + structLbl + ' to 100%? It affects both the D · Online Pricing RMES factor and the Base Price compset cap.')) return;
      const compNames = fp_getCompetitorsForStruct(structKey);
      for (const cn of compNames){
        if (typeof setWeight === 'function') setWeight(structKey, cn, 1.0);
      }
      fp_renderFoundationConfigBox(structKey);
    };
  }
  const btnEstE = document.getElementById('fp-elasticity-estimate');
  if (btnEstE){
    btnEstE.onclick = function(){
      btnEstE.disabled = true;
      btnEstE.textContent = '⏳ Calcolo...';
      setTimeout(function(){
        try {
          const result = fp_estimateElasticity(structKey);
          btnEstE.disabled = false;
          btnEstE.textContent = '📊 Estimate from data';
          if (!result){
            alert('Not enough data to estimate elasticity (at least 20 observations and 30 closed days in the last 24 months needed).');
            return;
          }
          const msg = 'ELASTICITY ESTIMATE — ' + structLbl + '\n'
                    + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'
                    + 'Method: ' + (result.method || 'standard') + '\n'
                    + '(comparison of pickup in specific time windows before check-in,\n'
                    + ' not the closed-day final ADR)\n\n'
                    + 'Estimate (clamped 0-3): ' + result.estimate.toFixed(2) + ' :1\n'
                    + 'Raw median: ' + result.median.toFixed(2) + '\n'
                    + 'P25-P75 range: [' + result.p25.toFixed(2) + ', ' + result.p75.toFixed(2) + ']\n\n'
                    + 'Based on:\n'
                    + '  • ' + result.nObservations + ' valid observations (out of ' + (result.nObservationsTotal||0) + ' total)\n'
                    + '  • ' + result.nGroups + ' groups (month × DOW × pickup window)\n\n'
                    + 'Filters applied:\n'
                    + '  • ' + (result.nFilteredOccPre||0) + ' observations discarded (pre-window OCC ≥80%)\n'
                    + '  • ' + (result.nFilteredSmallAdr||0) + ' observations discarded (Δ%ADR <5%)\n'
                    + '  • ' + (result.nFilteredOutlier||0) + ' outliers discarded (elasticity outside [-3, +5])\n\n'
                    + 'INTERPRETATION:\n'
                    + '  • value near 0: the price was already dynamically adjusted to demand → masked signal\n'
                    + '  • value 0.5-1: inelastic market (demand barely responds to price)\n'
                    + '  • value 1-2: elastic market (typical urban hospitality)\n'
                    + '  • value >2: highly elastic (leisure market, weekenders)\n\n'
                    + 'Apply estimate to the input?\n'
                    + '(Proposed value: ' + result.estimate.toFixed(1) + ')';
          if (confirm(msg)){
            const inp = document.getElementById('fp-elasticity-input');
            if (inp) inp.value = result.estimate.toFixed(1);
          }
        } catch(e){
          btnEstE.disabled = false;
          btnEstE.textContent = '📊 Estimate from data';
          alert('Errore nel calcolo: ' + e.message);
        }
      }, 50);
    };
  }
  document.getElementById('fp-recompute').onclick = function(){
    document.querySelectorAll('input[data-fp-month]').forEach(function(inp){
      const m = parseInt(inp.dataset.fpMonth, 10);
      const v = parseFloat(inp.value);
      if (isFinite(v)) fp_setTargetGrowth(structKey, m, v);
    });
    const baseVal = parseFloat(document.getElementById('fp-base-input').value);
    if (isFinite(baseVal)) fp_setBasePrice(structKey, baseVal);
    const floorVal = parseFloat(document.getElementById('fp-floor-input').value);
    if (isFinite(floorVal)) fp_setFloor(structKey, floorVal);
    const _mkExpVal = parseFloat((document.getElementById('fp-mk-expedia')||{}).value);
    const _mkBokVal = parseFloat((document.getElementById('fp-mk-booking')||{}).value);
    const _mkAirVal = parseFloat((document.getElementById('fp-mk-airbnb')||{}).value);
    let _mkChanged = false;
    if (isFinite(_mkExpVal) && _mkExpVal >= 0 && _mkExpVal <= 50){ fp_setChannelMarkup('expedia', _mkExpVal); _mkChanged = true; }
    if (isFinite(_mkBokVal) && _mkBokVal >= 0 && _mkBokVal <= 50){ fp_setChannelMarkup('booking', _mkBokVal); _mkChanged = true; }
    if (isFinite(_mkAirVal) && _mkAirVal >= 0 && _mkAirVal <= 50){ fp_setChannelMarkup('airbnb', _mkAirVal); _mkChanged = true; }
    if (_mkChanged && typeof fp_recalcMarkupOnBookings === 'function') fp_recalcMarkupOnBookings();
    const elVal = parseFloat((document.getElementById('fp-elasticity-input')||{}).value);
    if (isFinite(elVal) && elVal >= 0 && elVal <= 3) fp_setElasticity(structKey, elVal);
    document.querySelectorAll('input[data-fp-comp-peso]').forEach(function(inp){
      const cn = inp.dataset.fpCompPeso;
      const peso = parseFloat(inp.value);
      if (isFinite(peso) && typeof setWeight === 'function'){
        setWeight(structKey, cn, peso/100);  // setWeight vuole fraction 0..1
      }
    });
    document.querySelectorAll('input[data-fp-comp-offset]').forEach(function(inp){
      const cn = inp.dataset.fpCompOffset;
      const offset = parseFloat(inp.value);
      if (isFinite(offset)) fp_setCompsetOffset(structKey, cn, offset);
    });
    const btn = document.getElementById('fp-recompute');
    btn.disabled = true;
    btn.textContent = '⏳ Calcolo in corso...';
    setTimeout(function(){
      fp_computeAll(function(done, total){
        const pct = Math.round((done/total)*100);
        btn.textContent = '⏳ ' + pct + '% (' + done + '/' + total + ')';
      });
      btn.textContent = '✓ Ricalcolato (' + Object.keys(FOUNDATION_PRICES.firenze || {}).length + ' days × strutture)';
      setTimeout(function(){
        btn.textContent = '↻ Ricalcola Base Price';
        btn.disabled = false;
      }, 2500);
      if (typeof CURRENT_STRUCT !== 'undefined' && typeof renderSellStrategy === 'function'){
        try { renderSellStrategy(CURRENT_STRUCT); } catch(e){}
      }
    }, 30);
  };
}
/* ============================================================
   END FOUNDATION PRICING — UI
   ============================================================ */
/* market position for a day in Sell Strategy — same logic as Big Picture / mobile app:
   rank = (competitors priced below my Expedia price) + 1, out of (competitors priced + me). 1 = cheapest. */
function _sellCompRank(structKey, iso, myExpedia){
  if (myExpedia == null || !isFinite(myExpedia)) return null;
  if (typeof EXPEDIA_DATA === 'undefined' || !EXPEDIA_DATA) return null;
  const compMap = (structKey === 'alfani') ? EXPEDIA_DATA.competitors_alfani
                : (structKey === 'firenze') ? EXPEDIA_DATA.competitors_firenze
                : (structKey === 'davids') ? EXPEDIA_DATA.competitors_davids
                : EXPEDIA_DATA.competitors;
  if (!compMap) return null;
  const prices = [];
  for (const cn in compMap){ const v = compMap[cn] ? compMap[cn][iso] : null; if (v != null && isFinite(v) && v >= 10) prices.push(v); }
  if (!prices.length) return null;
  const rank = prices.filter(p => p < myExpedia).length + 1;
  return { rank, total: prices.length + 1 };
}
function renderSellStrategy(sel){
  const chipEl = document.getElementById('sell-struct-chip');
  if (chipEl) chipEl.textContent = structLabel(sel);
  const _cfBtn = document.getElementById('sell-compute-foundation');
  if (_cfBtn){
    const _isComp = (sel === 'both')
      ? ['firenze','condotta','alfani','davids'].every(function(k){ return fp_isStructComputed(k); })
      : fp_isStructComputed(sel);
    if (_isComp){
      _cfBtn.textContent = '✓ Base Price ready';
      _cfBtn.style.background = 'transparent';
      _cfBtn.style.color = 'var(--ink-3)';
      _cfBtn.style.borderColor = 'var(--line)';
    } else {
      _cfBtn.textContent = '⚡ Compute Base Price';
      _cfBtn.style.background = 'var(--accent)';
      _cfBtn.style.color = '#fff';
      _cfBtn.style.borderColor = 'var(--accent)';
    }
    _cfBtn.onclick = function(){
      _cfBtn.textContent = '… computing';
      _cfBtn.disabled = true;
      var _sk = CURRENT_STRUCT;
      setTimeout(function(){
        try { fp_ensureStruct(_sk); } catch(e){ console.error('compute foundation', e); }
        _cfBtn.disabled = false;
        renderSellStrategy(_sk);
      }, 30);
    };
  }
  if (!SELL_START_USER_SET){
    const d = new Date(TODAY); d.setHours(0,0,0,0);
    SELL_START_YMD = ymd(d);
  }
  const inp = document.getElementById('sell-start-date');
  if (inp && SELL_START_YMD) inp.value = ymdNumToIso(SELL_START_YMD);
  const rangeBtns = [
    {n:30, label:'30d'}, {n:60, label:'60d'},
    {n:90, label:'90d'}, {n:180, label:'180d'}, {n:365, label:'365d'}
  ];
  const pillsEl = document.getElementById('sell-range-pills');
  if (pillsEl){
    pillsEl.innerHTML = rangeBtns.map(b =>
      `<button class="rt-pill ${b.n===SELL_RANGE_DAYS?'':'off'}" data-range="${b.n}" style="${b.n===SELL_RANGE_DAYS?'border-color:var(--accent)':''}">${b.label}</button>`
    ).join('');
    pillsEl.querySelectorAll('button[data-range]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        SELL_RANGE_DAYS = +btn.dataset.range;
        renderSellStrategy(CURRENT_STRUCT);
      });
    });
  }
  const dateInp = document.getElementById('sell-start-date');
  if (dateInp){
    dateInp.onchange = () => {
      const v = isoToYmdNum(dateInp.value);
      if (v) {
        SELL_START_YMD = v;
        SELL_START_USER_SET = true;
        renderSellStrategy(CURRENT_STRUCT);
      }
    };
  }
  const pkInp = document.getElementById('sell-pickup-days');
  if (pkInp){
    pkInp.onchange = () => {
      const v = parseInt(pkInp.value,10);
      if (v>=1 && v<=365){ SELL_PICKUP_DAYS = v; renderSellStrategy(CURRENT_STRUCT); }
    };
  }
  const availEl = document.getElementById('sell-rmes-availability');
  if (availEl){
    availEl.textContent = '· source: Base Price (frozen)';
    availEl.style.color = 'var(--ink-3)';
  }
  const A = aggSellStrategy(sel, SELL_START_YMD, SELL_RANGE_DAYS, SELL_PICKUP_DAYS);
  const _occByMonth = {};
  for (const r of A.rows){
    const ym = `${r.y}-${pad2(r.mo)}`;
    if (!_occByMonth[ym]) _occByMonth[ym] = {curRn:0, stlyRn:0, capSum:0};
    _occByMonth[ym].curRn  += r.curRn || 0;
    _occByMonth[ym].stlyRn += r.stlyRn || 0;
    _occByMonth[ym].capSum += r.cap || 0;
  }
  for (const ym in _occByMonth){
    const o = _occByMonth[ym];
    o.curOcc  = o.capSum > 0 ? o.curRn  / o.capSum : 0;
    o.stlyOcc = o.capSum > 0 ? o.stlyRn / o.capSum : 0;
  }
  let _suppData = null;
  let _inventoryByRT = null;
  let _rtCheapToExp = null;  // ordine: cheap → expensive (la prima è la base)
  if (sel !== 'both' && typeof aggPricingDaily === 'function'){
    try {
      const Apri = aggPricingDaily(sel, SELL_START_YMD, 1);
      _suppData = {
        supp: Apri.supplementoStagione,    // {rt: {alta:€, bassa:€}}
        highSeason: new Set(Apri.highSeason),  // mesi alta stagione
        baseRT: Apri.baseRT,
        rtList: Apri.rtList,
      };
      _inventoryByRT = structRoomsFor(sel);
      _rtCheapToExp = [Apri.baseRT].concat(
        Apri.rtList
          .filter(r => r !== Apri.baseRT)
          .sort((a,b) => (Apri.supplementoStagione[a]?.alta || 0) - (Apri.supplementoStagione[b]?.alta || 0))
      );
    } catch(e){ _suppData = null; }
  }
  const _rtList = _inventoryByRT ? Object.keys(_inventoryByRT) : [];
  const _RT_COLOR_PALETTE = ['#3b6b9a','#a83b3b','#4a7c59','#c4823b','#8e5fa8','#3b6b6b','#c47d7d','#5e8a3a'];
  const _RT_COLORS = {};
  _rtList.forEach((rt, i) => { _RT_COLORS[rt] = _RT_COLOR_PALETTE[i % _RT_COLOR_PALETTE.length]; });
  const _showAllRT = false;
  function _cheapestAvailableRT(row){
    if (!_rtCheapToExp || !_inventoryByRT) return null;
    for (const rt of _rtCheapToExp){
      const sold = (row.curByRT && row.curByRT[rt]) ? row.curByRT[rt] : 0;
      const avail = (_inventoryByRT[rt] || 0) - sold;
      if (avail > 0) return rt;
    }
    return null;  // tutto sold-out
  }
  function _supplementForRT(rt, month){
    if (!_suppData || rt === _suppData.baseRT) return 0;
    const s = _suppData.supp[rt];
    if (!s) return 0;
    return _suppData.highSeason.has(month) ? s.alta : s.bassa;
  }
  const startD = A.rows[0]?.date, endD = A.rows[A.rows.length-1]?.date;
  const rangeLbl = startD && endD
    ? `${pad2(startD.getDate())}/${pad2(startD.getMonth()+1)}/${startD.getFullYear()} → ${pad2(endD.getDate())}/${pad2(endD.getMonth()+1)}/${endD.getFullYear()}`
    : '—';
  const rngLbl = document.getElementById('sell-range-label');
  if (rngLbl) rngLbl.textContent = rangeLbl;
  const T = A.totals;
  const stlyDelta = isFinite(T.curRev) && T.stlyRev>0 ? (T.curRev - T.stlyRev) / T.stlyRev : NaN;
  document.getElementById('sell-kpis').innerHTML = `
    <div class="kpi" style="border-left-color:#6b5b3f">
      <div class="kpi-label">OTB Revenue</div>
      <div class="kpi-val">${fmtEUR(T.curRev)}</div>
      <div class="kpi-sub mono">${T.curRn} RN · OCC ${fmtPct(T.curOcc,1)} · ADR ${isFinite(T.curAdr)?fmtEUR(T.curAdr):'—'}</div>
    </div>
    <div class="kpi" style="border-left-color:#3b6b6b">
      <div class="kpi-label">Pickup ${A.pickupDaysAgo}d</div>
      <div class="kpi-val ${T.pkRev>=0?'cell-pos':'cell-neg'}">${T.pkRev>=0?'+':''}${fmtEUR(T.pkRev)}</div>
      <div class="kpi-sub mono">${T.pkRn>=0?'+':''}${T.pkRn} RN · ADR ${isFinite(T.pkAdr)?fmtEUR(T.pkAdr):'—'}</div>
    </div>
    <div class="kpi" style="border-left-color:#8e7a5e">
      <div class="kpi-label">Pickup STLY ${A.pickupDaysAgo}d</div>
      <div class="kpi-val ${T.pkRevStly>=0?'cell-pos':'cell-neg'}" style="opacity:.85">${T.pkRevStly>=0?'+':''}${fmtEUR(T.pkRevStly)}</div>
      <div class="kpi-sub mono">${T.pkRnStly>=0?'+':''}${T.pkRnStly} RN · ADR ${isFinite(T.pkAdrStly)?fmtEUR(T.pkAdrStly):'—'}</div>
    </div>
    <div class="kpi" style="border-left-color:#8a8a8a">
      <div class="kpi-label">STLY (-364d)</div>
      <div class="kpi-val">${fmtEUR(T.stlyRev)}</div>
      <div class="kpi-sub mono">${T.stlyRn} RN · OCC ${fmtPct(T.stlyOcc,1)} · ADR ${isFinite(T.stlyAdr)?fmtEUR(T.stlyAdr):'—'}</div>
    </div>
    <div class="kpi" style="border-left-color:${isFinite(stlyDelta)?(stlyDelta>=0?'#3d7a4b':'#a83b3b'):'#8a8a8a'}">
      <div class="kpi-label">Δ Revenue YoY</div>
      <div class="kpi-val ${isFinite(stlyDelta)?(stlyDelta>=0?'cell-pos':'cell-neg'):''}">${isFinite(stlyDelta)?((stlyDelta>=0?'+':'')+fmtPct(stlyDelta,1)):'—'}</div>
      <div class="kpi-sub mono">${fmtEUR(T.curRev - T.stlyRev)} difference</div>
    </div>
  `;
  const subEl = document.getElementById('sell-table-sub');
  if (subEl){
    const snapDateD = ymdToDate(A.snapYmd);
    const stlyDateD = ymdToDate(A.stlyTodayYmd);
    subEl.innerHTML = `OTB to date vs Pickup last ${A.pickupDaysAgo}d (snapshot ${pad2(snapDateD.getDate())}/${pad2(snapDateD.getMonth()+1)}) · STLY (snapshot ${pad2(stlyDateD.getDate())}/${pad2(stlyDateD.getMonth()+1)})`;
  }
  SELL_LAST_AGG = A;
  const dowIT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const showExp = (sel === 'condotta' || sel === 'alfani' || sel === 'firenze' || sel === 'davids');
  const showBeddy = false;
  let _paceIdx = null, _paceMult = 1, _paceCurRn = 0, _paceStlyRn = 0;
  const _paceMultByRT = {};
  const _paceMultByStayMonth = {};
  if (typeof aggPickup === 'function'){
    const pkAgg = aggPickup(sel);
    let curRn = 0, stlyRn = 0;
    const PACE_WEEK_INDEXES = [0, 1, 2, 3];  // tutte le 4 settimane (28 days)
    for (const rt of pkAgg.rtAxis){
      let rtCur = 0, rtStly = 0;
      for (const i of PACE_WEEK_INDEXES){
        if (pkAgg.rt[rt] && pkAgg.rt[rt][i]) rtCur  += pkAgg.rt[rt][i].rn;
        if (pkAgg.rtS[rt] && pkAgg.rtS[rt][i]) rtStly += pkAgg.rtS[rt][i].rn;
      }
      curRn += rtCur;
      stlyRn += rtStly;
      _paceMultByRT[rt] = (rtStly > 0 && rtCur > 0) ? applyThresholds(rtCur / rtStly, 'pace') : 1;
    }
    _paceCurRn = curRn;
    _paceStlyRn = stlyRn;
    if (stlyRn > 0 && curRn > 0){
      _paceIdx = curRn / stlyRn;
      _paceMult = applyThresholds(_paceIdx, 'pace');
    }
    var _paceStateByStayMonthRender = {};
    if (pkAgg.sm && pkAgg.smS){
      const allMonths = new Set([...Object.keys(pkAgg.sm), ...Object.keys(pkAgg.smS)]);
      for (const ym of allMonths){
        let mCur = 0, mStly = 0;
        for (const i of PACE_WEEK_INDEXES){
          if (pkAgg.sm[ym] && pkAgg.sm[ym][i]) mCur += pkAgg.sm[ym][i].rn;
          if (pkAgg.smS[ym] && pkAgg.smS[ym][i]) mStly += pkAgg.smS[ym][i].rn;
        }
        if (mStly > 0 && mCur > 0){
          const paceRatio = mCur / mStly;
          const rawMult = applyThresholds(paceRatio, 'pace');
          if (paceRatio >= 1){
            _paceStateByStayMonthRender[ym] = {state:'alza', rawMult};
            _paceMultByStayMonth[ym] = rawMult;
          } else {
            const occMo = _occByMonth[ym];
            if (occMo && occMo.curOcc >= occMo.stlyOcc && occMo.curOcc > 0){
              _paceStateByStayMonthRender[ym] = {state:'ambiguo', rawMult};
              _paceMultByStayMonth[ym] = 1;
            } else {
              _paceStateByStayMonthRender[ym] = {state:'freno_pieno', rawMult};
              _paceMultByStayMonth[ym] = rawMult;
            }
          }
        } else {
          _paceStateByStayMonthRender[ym] = {state:'fallback', rawMult:_paceMult};
          _paceMultByStayMonth[ym] = _paceMult;
        }
      }
    }
  }
  function _paceMultForRowRender(r){
    const ym = `${r.y}-${pad2(r.mo)}`;
    const st = _paceStateByStayMonthRender[ym];
    if (!st) return _paceMult;
    if (st.state === 'ambiguo'){
      if (r.curOcc != null && r.curOcc >= 0.90) return 1;
      const dev = st.rawMult - 1;
      return 1 + dev * 0.5;
    }
    return st.rawMult;
  }
  let _beddyExpediaRatio_render = null;
  if (typeof beddyExpediaRatio === 'function'){
    const _corr = beddyExpediaRatio(sel, 90);
    if (_corr && _corr.n >= 5) _beddyExpediaRatio_render = _corr.median;
  }
  const AIRDNA_TOTAL_LISTINGS = 2948;
  const _airdnaIdx = {};      // ymd → indice (booked / total)
  let _airdnaAvg = 0;
  let _airdnaQ_lo = null, _airdnaQ_hi = null;
  if (typeof MARKET_RATES !== 'undefined' && MARKET_RATES.length){
    let sum = 0, n = 0;
    const values = [];
    for (const m of MARKET_RATES){
      if (m.ymd >= TODAY_YMD){
        const idx = m.listings / AIRDNA_TOTAL_LISTINGS;
        _airdnaIdx[m.ymd] = idx;
        values.push(idx);
        sum += idx; n += 1;
      }
    }
    _airdnaAvg = n > 0 ? sum/n : 0;
    if (values.length){
      values.sort((a,b) => a-b);
      function pct(p){
        const i = Math.max(0, Math.min(values.length-1, Math.floor(p * (values.length-1))));
        return values[i];
      }
      _airdnaQ_lo = pct(getCurrentThresholds().airdna.lo);
      _airdnaQ_hi = pct(getCurrentThresholds().airdna.hi);
    }
  }
  function airdnaMultFor(ymdNum, _unused){
    const d = fp_ymdNumToDate(ymdNum);
    if (!d) return { mult: 1, idx: null, ratio: null };
    const iso = fp_isoDate(d);
    const ymKey = iso.substring(0,7);
    const searchCur = (typeof EXPEDIA_DATA !== 'undefined' && EXPEDIA_DATA && EXPEDIA_DATA.search_current)
      ? EXPEDIA_DATA.search_current[iso] : null;
    const stats = (typeof expSearchStatsByMonth === 'function') ? expSearchStatsByMonth(ymKey) : null;
    if (searchCur == null || !stats || !stats.p50 || stats.p50 <= 0){
      return { mult: 1, idx: searchCur, ratio: null };
    }
    const dev = (searchCur - stats.p50) / stats.p50;
    const mult = applyThresholds(1 + dev, 'airdna');
    const ratio = stats.avg > 0 ? searchCur / stats.avg : null;
    return { mult, idx: searchCur, ratio, dev, searchCur, searchP50Mese: stats.p50 };
  }
  const _rtFilter = (typeof SELL_RT_FILTER !== 'undefined') ? SELL_RT_FILTER : null;
  const _nonBaseRTs = _suppData && _suppData.baseRT ? _rtList.filter(rt => rt !== _suppData.baseRT) : [];
  const _rmesGroupCols = (_rtFilter
    ? 1
    : 1 + (_showAllRT ? _nonBaseRTs.length : 0));
  let html = '<table class="data sell-table"><thead>'
    + '<tr class="sell-thead-groups">'
    + '<th rowspan="2">Date</th>'
    + '<th rowspan="2" class="sell-ev-col">Event</th>'
    + '<th rowspan="2">DoW</th>'
    + '<th colspan="3" class="sell-grp sell-grp-otb">OTB to date</th>'
    + '<th colspan="4" class="sell-grp sell-grp-pickup">Pickup ' + A.pickupDaysAgo + 'd</th>'
    + '<th colspan="3" class="sell-grp sell-grp-stly">STLY (-364)</th>'
    + '<th colspan="4" class="sell-grp sell-grp-pkstly">Pickup STLY ' + A.pickupDaysAgo + 'd</th>'
    + '<th rowspan="2" class="sell-grp sell-grp-rmes-last" title="Last update — the price currently active for this stay-date. Equals Base Price if RMES has never been accepted, or the most recent RMES suggestion accepted with ✓. This is the reference the next RMES suggestion will be compared against.">Last update<br><span class="sell-th-sub">active price</span></th>'
    + '<th rowspan="2" class="sell-grp sell-grp-rmes-today" title="RMES — today\'s pricing engine suggestion. Click anywhere on the cell to see the calculation detail (5 factors + LMF + Event Factor). The ✓ button accepts this price as the new Last update for that date. Capped ±20% vs Last update.">RMES<br><span class="sell-th-sub">price · Δ€ · ✓ accept</span></th>'
    + (showBeddy ? '<th rowspan="2" class="sell-grp sell-grp-beddy" title="Actual price loaded on the Beddy PMS for the baseRT (days covered: 12/5/2026 → 27/12/2026)">Beddy<br><span class="sell-th-sub">Actual PMS</span></th>' : '')
    + (showExp ? '<th colspan="3" class="sell-grp sell-grp-expedia">Rate Shopper</th>' : '')
    + '<th rowspan="2" class="sell-grp sell-grp-fp" title="Base Price — the structural starting price for each stay-date. It is ACCEPTED BY DEFAULT (✓ green = already active). You only need to touch it occasionally if something looks off: click 🖋 to override a single day, or use Override by period for a range; ↺ to reset. Other RTs show baseRT + monthly supplement (read-only).">Base Price<br><span class="sell-th-sub">accepted by default</span></th>'
    + '</tr>'
    + '<tr class="sell-thead-subs">'
    + '<th class="sell-grp-otb-sub" title="OTB to date · RN sold">RN</th>'
    + '<th class="sell-grp-otb-sub" title="OTB to date · OCC%">OCC</th>'
    + '<th class="sell-grp-otb-sub" title="OTB to date · ADR">ADR</th>'
    + '<th class="sell-grp-pickup-sub" title="Pickup · new room-bookings (click for detail)">New</th>'
    + '<th class="sell-grp-pickup-sub" title="Pickup · room-bookings cancelled (click for detail)">Cancel.</th>'
    + '<th class="sell-grp-pickup-sub" title="Pickup · net ΔRN = new − cancelled">ΔRN</th>'
    + '<th class="sell-grp-pickup-sub" title="Pickup · ADR of new bookings">ADR</th>'
    + '<th class="sell-grp-stly-sub" title="STLY (-364d) · RN">RN</th>'
    + '<th class="sell-grp-stly-sub" title="STLY · OCC%">OCC</th>'
    + '<th class="sell-grp-stly-sub" title="STLY · ADR">ADR</th>'
    + '<th class="sell-grp-pkstly-sub" title="Pickup STLY · new room-bookings a year ago (clickable)">New</th>'
    + '<th class="sell-grp-pkstly-sub" title="Pickup STLY · room-bookings cancelled a year ago (clickable)">Cancel.</th>'
    + '<th class="sell-grp-pkstly-sub" title="Pickup STLY · net ΔRN STLY">ΔRN</th>'
    + '<th class="sell-grp-pkstly-sub" title="Pickup STLY · ADR of new STLY bookings">ADR</th>'
    + (showExp
       ? '<th class="sell-grp-expedia-sub" style="background:rgba(210,105,30,.10);border-left:2px solid rgba(210,105,30,.35)" title="Mine with RMES applied: (current reference + RMES today delta) converted to Expedia space, with the market position vs compset (1 = cheapest)">Mine w/RMES</th>'
         + '<th class="sell-grp-expedia-sub" title="My current Expedia price, with the market position vs compset (1 = cheapest)">Mine</th>'
         + '<th class="sell-grp-expedia-sub" title="Weighted Expedia compset average (weights only, no offset) — in Expedia space, to compare with my Expedia price">Compset</th>'
       : '')
    + '</tr></thead><tbody>';
  let _rmesMapForAlignment = null;
  if (typeof computeRMESPriceMap === 'function' && sel !== 'both'){
    try { _rmesMapForAlignment = computeRMESPriceMap(sel, SELL_START_YMD, SELL_RANGE_DAYS); }
    catch(e){ _rmesMapForAlignment = null; }
  }
  for (let i=0; i<A.rows.length; i++){
    const r = A.rows[i];
    const isWE = (r.dow===5 || r.dow===6 || r.dow===0);
    const dateStyle = isWE ? ' style="color:var(--accent);font-weight:500"' : '';
    const dRn = r.pkRn;
    const dRev = r.pkRev;
    const pkAdrTxt = (r.pkRn>0 && isFinite(r.pkAdr)) ? fmtEUR(r.pkAdr) : '—';
    const pkRnCls = dRn>0?'cell-pos':(dRn<0?'cell-neg':'cell-flat');
    const pkRevCls = dRev>0?'cell-pos':(dRev<0?'cell-neg':'cell-flat');
    const rnCmpCls  = (r.stlyRn>0)  ? (r.curRn  >= r.stlyRn  ? 'cell-pos' : 'cell-neg') : '';
    const revCmpCls = (r.stlyRev>0) ? (r.curRev >= r.stlyRev ? 'cell-pos' : 'cell-neg') : '';
    const adrCmpCls = (r.stlyRn>0 && isFinite(r.stlyAdr) && isFinite(r.curAdr)) ? (r.curAdr >= r.stlyAdr ? 'cell-pos' : 'cell-neg') : '';
    const yoyRn  = r.curRn  - r.stlyRn;
    const yoyRev = r.curRev - r.stlyRev;
    const yoyRnCls  = yoyRn>0?'cell-pos':(yoyRn<0?'cell-neg':'cell-flat');
    const yoyRevCls = yoyRev>0?'cell-pos':(yoyRev<0?'cell-neg':'cell-flat');
    const pkRnCellInner = (r.pkRows && r.pkRows.length>0)
      ? `<span class="sell-pickup-link" data-row="${i}" data-kind="pk" style="cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px">${dRn>0?'+':''}${dRn||0}</span>`
      : (dRn>0?'+':'') + (dRn||0);
    const nuoveCount = (r.pkRows||[]).length;
    const cancelCount = (r.cancelRows||[]).length;
    const nuoveCellInner = nuoveCount>0
      ? `<span class="sell-pickup-link" data-row="${i}" data-kind="pk" style="cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px">+${nuoveCount}</span>`
      : '0';
    const cancelCellInner = cancelCount>0
      ? `<span class="sell-pickup-link" data-row="${i}" data-kind="cancel" style="cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px;color:#a83b3b">-${cancelCount}</span>`
      : '0';
    let expCells = '';
    if (showExp){
      const exp = expContext(r.ymd, sel);
      if (exp){
        const myP = exp.myPriceExpedia;
        let cAvg = null;
        let avgIsWeighted = false;
        const isoK = `${r.y}-${pad2(r.mo)}-${pad2(r.day)}`;
        if (typeof compsetWeightedAvg === 'function'){
          const w = compsetWeightedAvg(sel, isoK, false, {rawExpedia:true});
          if (w && w.avg != null && w.avg > 0){
            cAvg = w.avg;
            avgIsWeighted = true;
          }
        }
        if (cAvg == null && exp.compsetAvg != null){
          cAvg = exp.compsetAvg;
        }
        let diffTxt = '—', diffCls = 'cell-flat';
        if (myP != null && cAvg != null && cAvg > 0){
          const d = (myP - cAvg) / cAvg;
          diffTxt = (d>=0?'+':'') + (d*100).toFixed(0) + '%';
          if (d > 0.20) diffCls = 'cell-neg';
          else if (d < -0.15) diffCls = 'cell-pos';
        }
        const myTxt = myP != null ? fmtEUR(myP) : '—';
        const avgTxt = cAvg != null ? fmtEUR(cAvg) : '—';
        const avgBadge = avgIsWeighted ? '<sup style="font-size:8px;color:var(--accent);font-weight:700;margin-left:2px" title="Weighted average (weights from the Rate Shopper tab)">w</sup>' : '';
        const avgTooltip = avgIsWeighted
          ? `Weighted compset average (weights configured in Rate Shopper) · diff vs mine: ${diffTxt}`
          : `Arithmetic compset average · diff vs mine: ${diffTxt}`;
        const dem = expDemandLevel(exp.searchCurrent);
        let myTooltip = 'My price on Expedia';
        if (exp.searchCurrent != null && dem){
          myTooltip += ` · Search: ${dem.label} (${Math.round(exp.searchCurrent).toLocaleString('en-GB')})`;
          if (exp.searchYoY != null){
            myTooltip += ` · YoY ${(exp.searchYoY>=0?'+':'')}${(exp.searchYoY*100).toFixed(0)}%`;
          }
        }
        // RMES today price (in Expedia space): (current reference + delta RMES today) × divisor
        let mineWithRmesCell;
        {
          const rmesBeddy = (_rmesMapForAlignment && _rmesMapForAlignment[r.ymd] && isFinite(_rmesMapForAlignment[r.ymd].price)) ? _rmesMapForAlignment[r.ymd].price : null;
          const divisor = (typeof fp_expToBeddyDivisor === 'function') ? fp_expToBeddyDivisor(sel) : 1.053;
          const rmesExp = (rmesBeddy != null) ? rmesBeddy * divisor : null;
          if (rmesExp != null){
            const rmesExpTxt = fmtEUR(rmesExp);
            let posTxt = '', posCls = '';
            const rk = _sellCompRank(sel, r.ymd.toString().slice(0,4)+'-'+r.ymd.toString().slice(4,6)+'-'+r.ymd.toString().slice(6,8), rmesExp);
            if (rk){ posTxt = rk.rank + '/' + rk.total; }
            if (cAvg != null && isFinite(cAvg)){
              const d = rmesExp - cAvg;
              posCls = (Math.abs(d) < 0.5) ? '' : (d < 0 ? 'cell-pos' : 'cell-neg');
            }
            const tip = 'Mine if I applied RMES today (current reference + RMES delta), in Expedia space' + (rk ? ' · position ' + posTxt + ' (1 = cheapest)' : '');
            mineWithRmesCell = '<td class="cell-mono ' + posCls + '" style="background:rgba(210,105,30,.08);border-left:2px solid rgba(210,105,30,.35)" title="' + tip + '">' + rmesExpTxt + (posTxt ? '<br><span style="font-size:9px;font-weight:400">' + posTxt + '</span>' : '') + '</td>';
          } else {
            mineWithRmesCell = '<td class="cell-mono cell-flat" style="background:rgba(210,105,30,.08);border-left:2px solid rgba(210,105,30,.35);text-align:center">\u2014</td>';
          }
        }
        // Mine current with compset rank
        let myCellWithRank;
        {
          if (myP != null){
            let posTxtMine = '', posClsMine = diffCls;
            const rkMine = _sellCompRank(sel, r.ymd.toString().slice(0,4)+'-'+r.ymd.toString().slice(4,6)+'-'+r.ymd.toString().slice(6,8), myP);
            if (rkMine){ posTxtMine = rkMine.rank + '/' + rkMine.total; }
            const tipMineFull = myTooltip + (rkMine ? ' · position ' + posTxtMine + ' (1 = cheapest)' : '');
            myCellWithRank = `<td class="cell-mono sell-block-expedia ${posClsMine}" style="background:rgba(58,107,107,.04)" title="${tipMineFull}">${myTxt}${posTxtMine ? '<br><span style="font-size:9px;font-weight:400">'+posTxtMine+'</span>' : ''}</td>`;
          } else {
            myCellWithRank = `<td class="cell-mono sell-block-expedia" style="background:rgba(58,107,107,.04)" title="${myTooltip}">${myTxt}</td>`;
          }
        }
        // Compset cell (unchanged)
        const compsetCell = `<td class="cell-mono ${diffCls}" style="background:rgba(58,107,107,.04)" title="${avgTooltip}">${avgTxt}${avgBadge}<br><span style="font-size:9px;font-weight:400">${diffTxt}</span></td>`;
        // New order: Mine w/RMES → Mine → Compset
        expCells = mineWithRmesCell + myCellWithRank + compsetCell;
      } else {
        expCells = `<td class="cell-mono cell-flat sell-block-expedia" colspan="3" style="background:rgba(58,107,107,.04);text-align:center">—</td>`;
      }
    }
    let cellMercato = '';
    let _prezzoRMES_row = null;       // Hoisted: usato anche per il calcolo della Variazione
    let _expedia_rt_shown_row = null; // Hoisted: per il supplemento da sottrarre nella Variazione
    {
      const exp2 = (typeof expContext === 'function') ? expContext(r.ymd, sel) : null;
      let A_idx = null, A_mult = 1;
      if (r.stlyOcc > 0 && r.curOcc > 0){
        A_idx = r.curOcc / r.stlyOcc;
        A_mult = applyThresholds(A_idx, 'occ');
      }
      let B_idx = null, B_mult = 1, _B_caseRender = null;
      if (r.stlyAdr > 0 && r.curAdr > 0 && isFinite(r.curAdr) && isFinite(r.stlyAdr)){
        B_idx = r.curAdr / r.stlyAdr;
        const adrDev = B_idx - 1;
        let bDev = 0;
        if (adrDev < 0){
          bDev = -adrDev;
          _B_caseRender = 'recover_below_LY';
        } else if (r.stlyOcc > 0 && r.curOcc > 0 && r.curOcc >= r.stlyOcc){
          bDev = 0;
          _B_caseRender = 'all_good';
        } else {
          const tgPct = (typeof fp_getTargetGrowth === 'function') ? fp_getTargetGrowth(sel, r.mo) : 5;
          const tgFrac = (tgPct || 0) / 100;
          bDev = -(adrDev - tgFrac);
          _B_caseRender = 'brake_softened';
        }
        if (bDev > 0.50) bDev = 0.50;
        if (bDev < -0.50) bDev = -0.50;
        B_mult = 1 + bDev;
      }
      let C_idx = null, C_mult = 1;
      let _C2_compAvg = null;
      if (exp2 && exp2.myPriceExpedia != null){
        const isoK = `${r.y}-${pad2(r.mo)}-${pad2(r.day)}`;
        if (typeof compsetWeightedAvg === 'function'){
          const w = compsetWeightedAvg(sel, isoK, false, {rawExpedia:true});
          if (w && w.avg != null && w.avg > 0) _C2_compAvg = w.avg;
        }
        if (_C2_compAvg == null && exp2.compsetAvg != null && exp2.compsetAvg > 0){
          _C2_compAvg = exp2.compsetAvg;
        }
        if (_C2_compAvg != null && _C2_compAvg > 0){
          C_idx = exp2.myPriceExpedia / _C2_compAvg;
          C_mult = applyThresholds(C_idx, 'comp');
        }
      }
      const _paceMonthMult = _paceMultForRowRender(r);
      const D_idx = _paceIdx;  // display globale (legacy), il calcolo usa il per-mese
      const D_mult = _paceMonthMult;
      const ym_row = r.y * 100 + r.mo;
      let Budget_idx = null, Budget_mult = 1;
      let _sourceExpediaBeddyEq_render = null;
      if (exp2 && exp2.myPriceExpedia != null){
        _sourceExpediaBeddyEq_render = exp2.myPriceExpedia / fp_expToBeddyDivisor(sel);
        const adrBudgetStruct = (typeof budgetMonthlyFor === 'function') ? budgetMonthlyFor(sel, ym_row, 'adr') : 0;
        if (adrBudgetStruct > 0){
          Budget_idx = _sourceExpediaBeddyEq_render / adrBudgetStruct;
          Budget_mult = applyThresholds(Budget_idx, 'budget');
        }
      }
      const airE = airdnaMultFor(r.ymd, r.curOcc);
      const E_idx = airE.idx;       // listings_quel_giorno / 2948
      const E_mult = airE.mult;
      const E_ratio = airE.ratio;   // E_idx / media (per tooltip)
      const W = getCurrentWeights();
      const wSum = (W.occ + W.price + W.comp + W.pace + (W.budget||0) + W.airdna) || 1;
      const wA = W.occ/wSum;
      const wB = W.price/wSum;
      const wC = W.pace/wSum;
      const wD = (W.budget||0)/wSum;  // NUOVO: Budget
      const wE = W.comp/wSum;
      const wF = W.airdna/wSum;
      const _multFinaleRaw = wA * A_mult + wB * B_mult + wC * D_mult + wD * Budget_mult + wE * C_mult + wF * E_mult;
      const _capSell = (typeof getRmesCap === 'function') ? getRmesCap(sel) : 0.30;
      const _cappedSell = (typeof applyTotalCap === 'function') ? applyTotalCap(_multFinaleRaw - 1, _capSell) : { mult: _multFinaleRaw, hitCap: false };
      const multFinale = _cappedSell.mult;
      const _multsByRT_render = {};
      for (const rt of _rtList){
        const A_rt = A_mult;       // OCC giorno vs STLY (struttura)
        const B_rt = B_mult;       // ADR giorno vs STLY (struttura)
        const C_rt = D_mult;       // Pace mese di stay (struttura)
        const Budget_rt = Budget_mult;  // Budget (struttura)
        const _mfin_rt_raw = wA * A_rt + wB * B_rt + wC * C_rt + wD * Budget_rt + wE * C_mult + wF * E_mult;
        const _capRT_sell = (typeof applyTotalCap === 'function') ? applyTotalCap(_mfin_rt_raw - 1, _capSell) : { mult: _mfin_rt_raw };
        const mfin_rt = _capRT_sell.mult;
        _multsByRT_render[rt] = { occ_mult: A_rt, price_mult: B_rt, pace_mult: C_rt, budget_mult: Budget_rt, comp_mult: C_mult, air_mult: E_mult, multFinale: mfin_rt };
      }
      r._multsByRT = _multsByRT_render;
      if (_rmesMapForAlignment){
        const _ddAlign = _rmesMapForAlignment[r.ymd];
        if (_ddAlign && _ddAlign.multsByRT){
          for (const rt in _ddAlign.multsByRT){
            if (r._multsByRT[rt] && _ddAlign.multsByRT[rt].multFinale != null){
              r._multsByRT[rt].multFinale = _ddAlign.multsByRT[rt].multFinale;
            }
          }
        }
      }
      const expedia_rt_shown = _cheapestAvailableRT(r);  // RT a cui si riferisce il price Expedia
      const supp_to_subtract = (expedia_rt_shown && _suppData && expedia_rt_shown !== _suppData.baseRT)
        ? _supplementForRT(expedia_rt_shown, r.mo) * 0.5
        : 0;
      let basePrice = null;
      let baseSource = null;
      let baseColor = '#c4823b';
      let baseSuppApplied = 0;
      if (typeof rmes_getSourcePrice === 'function'){
        const sp = rmes_getSourcePrice(sel, r.ymd, null);
        if (sp.source === 'foundation' && sp.price > 0){
          basePrice = sp.price;
          baseSource = 'foundation';
          baseColor = '#7a4f1c';  // ambra Foundation
          baseSuppApplied = 0;
        }
      }
      if (basePrice == null){
        const beddyReal = (typeof beddyPriceFor === 'function') ? beddyPriceFor(sel, r.ymd) : null;
        if (beddyReal != null){
          basePrice = beddyReal;
          baseSource = 'beddy_fallback';
          baseColor = '#1e6b4a';
        } else if (exp2 && exp2.myPriceBeddy != null){
          basePrice = exp2.myPriceBeddy - supp_to_subtract;
          baseSource = 'mine_fallback';
          baseSuppApplied = supp_to_subtract;
        } else if (exp2 && exp2.compsetAvgBeddy != null){
          basePrice = exp2.compsetAvgBeddy - supp_to_subtract;
          baseSource = 'compset_fallback';
          baseSuppApplied = supp_to_subtract;
        } else if (r.curAdr > 0 && isFinite(r.curAdr)){
          basePrice = r.curAdr;
          baseSource = 'otb_fallback';
          baseColor = '#3d7a4b';
        } else if (r.finalLyAdr > 0 && isFinite(r.finalLyAdr)){
          basePrice = r.finalLyAdr;
          baseSource = 'finalLy_fallback';
          baseColor = '#8e5fa8';
        }
      }
      let prezzoRMES = null;
      if (basePrice != null){
        prezzoRMES = basePrice * multFinale;
        const _fl = (typeof fp_getFloor === 'function') ? fp_getFloor(sel) : 0;
        if (isFinite(_fl) && prezzoRMES < _fl) prezzoRMES = _fl;
      }
      _prezzoRMES_row = prezzoRMES;
      _expedia_rt_shown_row = expedia_rt_shown;
      const baseRT = _suppData ? _suppData.baseRT : null;
      const pricesByRT_row = {};
      const mlosByRT_row = {};
      const _multsForThisRow = r._multsByRT || {};
      const _isoDateForOvr = `${r.y}-${pad2(r.mo)}-${pad2(r.day)}`;
      const _foundationBaseEffective = (baseRT && typeof fp_getFoundationOverridePrice === 'function')
        ? fp_getFoundationOverridePrice(sel, _isoDateForOvr, baseRT)
        : null;  // null = proposed → uso basePrice calcolato
      const _foundationForCalc = (_foundationBaseEffective != null) ? _foundationBaseEffective : basePrice;
      if (_foundationForCalc != null && baseRT){
        for (const rt of _rtList){
          const mults = _multsForThisRow[rt];
          if (!mults) continue;
          const supp = (rt === baseRT) ? 0 : _supplementForRT(rt, r.mo);
          const sourcePriceForRt = _foundationForCalc + supp;
          const _flRow = (typeof fp_getFloor === 'function') ? fp_getFloor(sel) : 0;
          const calcPrice = Math.max(sourcePriceForRt * mults.multFinale, (isFinite(_flRow) ? _flRow : 0));
          const _ovrFinal = (typeof fp_getOverride === 'function') ? fp_getOverride(sel, _isoDateForOvr, rt) : null;
          if (_ovrFinal && _ovrFinal.price != null && isFinite(_ovrFinal.price) && _ovrFinal.price > 0){
            pricesByRT_row[rt] = _ovrFinal.price;
          } else {
            pricesByRT_row[rt] = calcPrice;
          }
        }
      }
      r._pricesByRT = pricesByRT_row;
      const fmtMult = (m) => m.toFixed(3);
      const fmtIdx = (i) => i != null ? i.toFixed(2) : '—';
      const fmtIdx3 = (i) => i != null ? i.toFixed(3) : '—';
      const sourceLabel = baseSource === 'beddy'   ? 'Beddy PMS (actual price loaded in the system)'
                        : baseSource === 'mine'    ? 'My Expedia price × ratio Beddy↔Expedia'
                        : baseSource === 'compset' ? 'Expedia compset average (Beddy eq.)'
                        : baseSource === 'otb'     ? 'OTB ADR of the day (revenue/RN booked, gross)'
                        : baseSource === 'finalLy' ? 'ADR Final LY (2025 close, same day -364d = -52 weeks)'
                        : '—';
      let stepSorgente = '';
      if (baseSource === 'beddy'){
        stepSorgente = `[1] SORGENTE: Beddy PMS\n` +
                       `    Actual price loaded today (${pad2(r.day)}/${pad2(r.mo)}/${r.y}) = ${fmtEUR(beddyReal)}\n` +
                       `    → Starting base price: ${fmtEUR(basePrice)}\n`;
      } else if (baseSource === 'mine'){
        const expRaw = exp2.myPriceExpedia;
        const expBeddyEq = exp2.myPriceBeddy;
        stepSorgente = `[1] SORGENTE: My Expedia price\n` +
                       `    Price visible on Expedia: ${fmtEUR(expRaw)}\n` +
                       `    Conversione a Beddy_eq: ${fmtEUR(expRaw)} ÷ markup Expedia ÷ 0.90 (sconto non rimb.) = ${fmtEUR(expBeddyEq)}\n`;
        if (baseSuppApplied > 0 && expedia_rt_shown){
          const isHigh = _suppData && _suppData.highSeason.has(r.mo);
          const stagionLbl = isHigh ? 'alta' : 'bassa';
          stepSorgente += `    Bilocale sold-out → Expedia shows ${expedia_rt_shown} (suppl. ${stagionLbl})\n` +
                          `    Sottrazione 50% suppl.: ${fmtEUR(expBeddyEq)} − ${fmtEUR(baseSuppApplied)} = ${fmtEUR(basePrice)}\n`;
        }
        stepSorgente += `    → Starting base price: ${fmtEUR(basePrice)}\n`;
      } else if (baseSource === 'compset'){
        const csRaw = exp2.compsetAvg;
        const csBeddyEq = exp2.compsetAvgBeddy;
        stepSorgente = `[1] SOURCE: Expedia compset (no own price available)\n` +
                       `    Expedia compset average: ${fmtEUR(csRaw)}\n` +
                       `    Conversione a Beddy eq.: ${fmtEUR(csRaw)} ÷ markup Expedia ÷ 0.90 = ${fmtEUR(csBeddyEq)}\n`;
        if (baseSuppApplied > 0 && expedia_rt_shown){
          const isHigh = _suppData && _suppData.highSeason.has(r.mo);
          const stagionLbl = isHigh ? 'alta' : 'bassa';
          stepSorgente += `    Bilocale sold-out → suppl. ${expedia_rt_shown} ${stagionLbl}: −${fmtEUR(baseSuppApplied)}\n`;
        }
        stepSorgente += `    → Starting base price: ${fmtEUR(basePrice)}\n`;
      } else if (baseSource === 'otb'){
        stepSorgente = `[1] SOURCE: ADR OTB of the day (no Expedia, no Beddy)\n` +
                       `    Revenue prenotato: ${fmtEUR(r.curRev)} / RN: ${r.curRn} = ${fmtEUR(basePrice)}\n` +
                       `    → Starting base price: ${fmtEUR(basePrice)}\n`;
      } else if (baseSource === 'finalLy'){
        stepSorgente = `[1] SOURCE: ADR Final LY (2025 close, same day)\n` +
                       `    Revenue 2025: ${fmtEUR(r.finalLyRev)} / RN: ${r.finalLyRn} = ${fmtEUR(basePrice)}\n` +
                       `    → Starting base price: ${fmtEUR(basePrice)}\n`;
      }
      const stepMolt =
        `[2] 6 MOLTIPLICATORI RMES (media pesata):\n` +
        `    Internal data (per RT, here property values for the baseRT):\n` +
        `      A · Demand (occ)      idx ${fmtIdx(A_idx)}  → mult ${fmtMult(A_mult)}  × weight ${(wA*100).toFixed(0)}%\n` +
        `      B · Demand (Price)    idx ${fmtIdx(B_idx)}  → mult ${fmtMult(B_mult)}  × weight ${(wB*100).toFixed(0)}%\n` +
        `      C · Pace Trend     idx ${fmtIdx(D_idx)}  → mult ${fmtMult(D_mult)}  × weight ${(wC*100).toFixed(0)}% [pickup ${_paceCurRn} RN cur vs ${_paceStlyRn} STLY]\n` +
        `      D · Budget   idx ${fmtIdx(Budget_idx)}  → mult ${fmtMult(Budget_mult)}  × weight ${(wD*100).toFixed(0)}% [mio expedia vs ADR budget mensile]\n` +
        `    External data (property, same for all RTs):\n` +
        `      E · Compset  idx ${fmtIdx(C_idx)}  → mult ${fmtMult(C_mult)}  × weight ${(wE*100).toFixed(0)}%\n` +
        `      F · Search   ${E_idx!=null?Math.round(E_idx).toLocaleString('en-GB'):'n/a'} searches  → mult ${fmtMult(E_mult)}  × weight ${(wF*100).toFixed(0)}% [${E_ratio!=null?(E_ratio*100).toFixed(0)+'% vs period average':'n/a'}]\n` +
        `\n` +
        `    Calcolo: ${fmtMult(A_mult)}×${(wA).toFixed(2)} + ${fmtMult(B_mult)}×${(wB).toFixed(2)} + ${fmtMult(D_mult)}×${(wC).toFixed(2)} + ${fmtMult(Budget_mult)}×${(wD).toFixed(2)} + ${fmtMult(C_mult)}×${(wE).toFixed(2)} + ${fmtMult(E_mult)}×${(wF).toFixed(2)}\n` +
        `    → Final multiplier: ${fmtMult(multFinale)}\n`;
      const stepFinale =
        `[3] SUGGESTED BASE PRICE:\n` +
        `    ${fmtEUR(basePrice)} × ${fmtMult(multFinale)} = ${fmtEUR(prezzoRMES)}`;
      const tipMercato = (basePrice != null)
        ? `═══ RMES BASE PRICE CALCULATION ═══\n` +
          `Sorgente usata: ${sourceLabel}\n\n` +
          stepSorgente + `\n` +
          stepMolt + `\n` +
          stepFinale
        : 'No price source available (no Beddy, no Expedia, no OTB, no Final LY)';
      if (prezzoRMES != null){
        const dTrend = basePrice > 0 ? (prezzoRMES/basePrice - 1) : 0;
        const trendArrow = dTrend > 0.005 ? '<span style="color:#3d7a4b">▲</span>' : (dTrend < -0.005 ? '<span style="color:#a83b3b">▼</span>' : '<span style="color:var(--ink-3)">●</span>');
        let sourceBadge = '';
        if (baseSource === 'beddy')        sourceBadge = '<sup style="color:#1e6b4a;font-size:8px;font-weight:700;margin-left:2px">B</sup>';
        else if (baseSource === 'compset') sourceBadge = '<sup style="color:#3b6b9a;font-size:8px;font-weight:700;margin-left:2px">cs</sup>';
        else if (baseSource === 'otb')     sourceBadge = '<sup style="color:#3d7a4b;font-size:8px;font-weight:700;margin-left:2px">otb</sup>';
        else if (baseSource === 'finalLy') sourceBadge = '<sup style="color:#8e5fa8;font-size:8px;font-weight:700;margin-left:2px">ly</sup>';
        const adjBadge = baseSuppApplied > 0
          ? `<sup style="color:#a83b3b;font-size:8px;font-weight:700;margin-left:2px" title="Bilocale sold-out">⊖${expedia_rt_shown ? expedia_rt_shown.charAt(0).toLowerCase() : ''}</sup>`
          : '';
        cellMercato = `<td class="cell-mono sell-block-rmes" style="background:rgba(195,131,59,.06);text-align:center;cursor:help" title="${tipMercato}"><b style="color:${baseColor}">${fmtEUR(prezzoRMES)}</b>${sourceBadge}${adjBadge}</td>`;
      } else {
        cellMercato = `<td class="cell-mono cell-flat sell-block-rmes" style="background:rgba(195,131,59,.06);color:var(--ink-3);text-align:center" title="${tipMercato}">—</td>`;
      }
    }
    const dCheckin = startOfDay(r.date);
    const today0 = startOfDay(new Date(TODAY));
    const daysToCheckin = Math.round((dCheckin - today0) / 86400000);
    const nextRow = A.rows[i+1] || null;
    const nextOcc = nextRow ? nextRow.curOcc : 0;
    const dFinalLY = addDays(dCheckin, -364);
    const finalLyDateStr = `${pad2(dFinalLY.getDate())}/${pad2(dFinalLY.getMonth()+1)}/${dFinalLY.getFullYear()}`;
    const finalLyDow = dowIT[dFinalLY.getDay()];
    let mlos = 1, mlosReason = '';
    if (daysToCheckin < 14){
      mlos = 1; mlosReason = `< 14d to check-in (${daysToCheckin}d)`;
    } else if (r.curOcc > 0.90 && nextOcc < 1.0){
      mlos = 2; mlosReason = `OCC today ${(r.curOcc*100).toFixed(0)}% &gt; 90% AND OCC tomorrow ${(nextOcc*100).toFixed(0)}% &lt; 100%`;
    } else if (r.curOcc < 0.90 && r.finalLyOcc > 0.95){
      mlos = 2; mlosReason = `OCC today ${(r.curOcc*100).toFixed(0)}% &lt; 90% BUT OCC Final LY ${(r.finalLyOcc*100).toFixed(0)}% &gt; 95%`;
    } else {
      mlos = 1; mlosReason = `default (OCC today ${(r.curOcc*100).toFixed(0)}%, OCC Final LY ${(r.finalLyOcc*100).toFixed(0)}%, ${daysToCheckin}d al check-in)`;
    }
    const mlosTip = `MLOS = ${mlos}\n${mlosReason}\nFinal LY ref: ${finalLyDow} ${finalLyDateStr} (same DoW, -364d = -52 weeks)`;
    const mlosColor = mlos === 2 ? '#a83b3b' : 'var(--ink-2)';
    const cellMlos = `<td class="cell-mono sell-block-mlos" style="background:rgba(255,255,255,.4);text-align:center;color:${mlosColor}" title="${mlosTip}"><b>${mlos}</b></td>`;
    const _mlosByRT = {};
    for (const rt of _rtList){
      const cap = (_inventoryByRT && _inventoryByRT[rt]) || 0;
      const rtCurRn = (r.curByRT && r.curByRT[rt]) || 0;
      const rtOcc = cap > 0 ? rtCurRn / cap : 0;
      const rtFinalLyRn = (typeof r.finalLyByRT !== 'undefined' && r.finalLyByRT && r.finalLyByRT[rt]) || 0;
      const rtFinalLyOcc = cap > 0 ? rtFinalLyRn / cap : r.finalLyOcc;  // fallback al globale
      const nextRtRn = (nextRow && nextRow.curByRT) ? (nextRow.curByRT[rt] || 0) : 0;
      const nextRtOcc = cap > 0 ? nextRtRn / cap : 0;
      let mlosRt = 1;
      if (daysToCheckin < 14){
        mlosRt = 1;
      } else if (rtOcc > 0.90 && nextRtOcc < 1.0){
        mlosRt = 2;
      } else if (rtOcc < 0.90 && rtFinalLyOcc > 0.95){
        mlosRt = 2;
      } else {
        mlosRt = 1;
      }
      _mlosByRT[rt] = mlosRt;
    }
    r._mlosByRT = _mlosByRT;
    let beddyCell = '';
    if (showBeddy){
      const beddyP = (typeof beddyPriceFor === 'function') ? beddyPriceFor(sel, r.ymd) : null;
      if (beddyP != null){
        const _expBeddy = (typeof expContext === 'function') ? expContext(r.ymd, sel) : null;
        let trend = '';
        let trendCls = 'cell-flat';
        if (_expBeddy && _expBeddy.myPriceBeddy != null && _expBeddy.myPriceBeddy > 0){
          const d = (beddyP - _expBeddy.myPriceBeddy) / _expBeddy.myPriceBeddy;
          if (d > 0.02){ trendCls = 'cell-pos'; trend = ` <span style="font-size:9px;color:#1e6b4a">+${(d*100).toFixed(0)}%</span>`; }
          else if (d < -0.02){ trendCls = 'cell-neg'; trend = ` <span style="font-size:9px;color:#a83b3b">${(d*100).toFixed(0)}%</span>`; }
        }
        const beddyTip = 'Beddy PMS · actual loaded price' + (_expBeddy && _expBeddy.myPriceBeddy != null ? ` · Expedia mio (Beddy eq.): ${fmtEUR(_expBeddy.myPriceBeddy)}` : '');
        beddyCell = `<td class="cell-mono ${trendCls}" style="background:rgba(30,107,74,.05);color:#1e6b4a;font-weight:600" title="${beddyTip}">${fmtEUR(beddyP)}${trend}</td>`;
      } else {
        beddyCell = `<td class="cell-mono cell-flat" style="background:rgba(30,107,74,.03);color:var(--ink-3)" title="Beddy price not loaded for this date (out of range)">—</td>`;
      }
    }
    const pkStlyNewCount = (r.pkRowsStly || []).length;
    const pkStlyCancelCount = (r.cancelRowsStly || []).length;
    const pkStlyNewCell = pkStlyNewCount > 0
      ? `<span class="sell-pickup-link" data-row="${i}" data-kind="pkStly" style="cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px">+${pkStlyNewCount}</span>`
      : `0`;
    const pkStlyCancelCell = pkStlyCancelCount > 0
      ? `<span class="sell-pickup-link" data-row="${i}" data-kind="cancelStly" style="cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px;color:#a83b3b">−${pkStlyCancelCount}</span>`
      : `0`;
    let pkStlyAdrTxt = '—';
    if (pkStlyNewCount > 0){
      const totRev = r.pkRowsStly.reduce((s,b)=>s+b.revPerNight, 0);
      pkStlyAdrTxt = fmtEUR(totRev / pkStlyNewCount);
    }
    let cellFoundation = '';
    let _fpPriceVal = null;
    if (_suppData && _suppData.baseRT){
      const baseRT_fp = _suppData.baseRT;
      const fpRT = _rtFilter || baseRT_fp;
      const fpDateISO = `${r.y}-${pad2(r.mo)}-${pad2(r.day)}`;
      const isBaseRT = (fpRT === baseRT_fp);
      // === NewRMES: la cella "Base Price" mostra il Frozen Base Price (con eventuale override) ===
      const fpRTAttr = escapeHtml(fpRT);
      const ymdNumLocal = r.ymd;
      let nrmFrozen = null, nrmOverride = null, nrmEffective = null;
      if (typeof newrmesGetFrozenBase === 'function'){
        nrmFrozen = newrmesGetFrozenBase(sel, ymdNumLocal);
        nrmOverride = (typeof newrmesGetFrozenBaseOverride === 'function') ? newrmesGetFrozenBaseOverride(sel, ymdNumLocal) : null;
        nrmEffective = (nrmOverride != null) ? nrmOverride : nrmFrozen;
      }
      let fpEffective = null;
      if (isBaseRT){
        fpEffective = nrmEffective;
      } else if (nrmEffective != null){
        const supp = (typeof _supplementForRT === 'function') ? _supplementForRT(fpRT, r.mo) : 0;
        fpEffective = nrmEffective + supp;
      }
      const fpStatus = (nrmOverride != null) ? 'override' : 'frozen';
      if (fpEffective == null){
        cellFoundation = `<td class="cell-mono sell-block-fp" style="background:rgba(195,131,59,.04);text-align:center;color:var(--ink-3);font-style:italic">—</td>`;
      } else {
        _fpPriceVal = fpEffective;
        const fpPriceTxt = isFinite(fpEffective) ? fmtEUR(fpEffective) : '—';
        if (!isBaseRT){
          // RT non-base: derivato (sola visualizzazione)
          let cellBg, cellBorder, textStyle, derivedTipPrefix;
          if (nrmOverride != null){
            cellBg = 'rgba(59,107,154,.06)'; cellBorder = 'rgba(59,107,154,.3)';
            textStyle = 'color:#1e4a6b;font-weight:600';
            derivedTipPrefix = `Base Price DERIVED from ${baseRT_fp} (manual override)`;
          } else {
            cellBg = 'rgba(195,131,59,.05)'; cellBorder = 'rgba(195,131,59,.25)';
            textStyle = 'color:#7a4f1c;font-weight:600';
            derivedTipPrefix = `Base Price DERIVED from ${baseRT_fp} (frozen)`;
          }
          const supp = (typeof _supplementForRT === 'function') ? _supplementForRT(fpRT, r.mo) : 0;
          const derivedTip = derivedTipPrefix + `\n${fpRT} · ${pad2(r.day)}/${pad2(r.mo)}/${r.y}\n\n` +
            `= Base ${baseRT_fp} + supplement ${fpRT} month ${r.mo}\n` +
            `= €${(fpEffective - supp).toFixed(0)} + €${supp.toFixed(0)} = €${fpEffective.toFixed(0)}\n\n` +
            `Overrides apply ONLY to the baseRT (${baseRT_fp}). To change this price, go to the baseRT row.`;
          cellFoundation = `<td class="cell-mono sell-block-fp" style="background:${cellBg};text-align:center;border-left:2px solid ${cellBorder};white-space:nowrap" title="${escapeHtml(derivedTip)}"><b style="${textStyle}">↳ ${fpPriceTxt}</b></td>`;
        } else {
          // baseRT: cella con stile diverso a seconda dello stato + bottoni inline override/reset
          let cellBg, cellBorder, textStyle, statusIcon, fpTipPrefix;
          if (fpStatus === 'override'){
            cellBg = 'rgba(59,107,154,.14)'; cellBorder = 'rgba(59,107,154,.6)';
            textStyle = 'color:#1e4a6b;font-weight:700'; statusIcon = '🖋 ';
            fpTipPrefix = `Base Price OVERRIDE (manual)\n${fpRT} · ${pad2(r.day)}/${pad2(r.mo)}/${r.y}\n\nManual value: €${fpEffective.toFixed(0)}\nOriginal frozen value: ${nrmFrozen != null ? '€'+nrmFrozen.toFixed(0) : '—'}\n\nRMES will suggest deltas vs this new Base.\nOther RTs inherit this value + monthly supplement.`;
          } else {
            // FROZEN = "accepted by default": the structural Base Price is what we use unless we explicitly override it.
            cellBg = 'rgba(74,124,89,.10)'; cellBorder = 'rgba(74,124,89,.45)';
            textStyle = 'color:#2f5538;font-weight:700';
            statusIcon = '✓ ';
            fpTipPrefix = `Base Price ACTIVE (accepted by default)\n${fpRT} · ${pad2(r.day)}/${pad2(r.mo)}/${r.y}\n\nActive value: €${fpEffective.toFixed(0)}\n\nThis is the structural Base Price for the day, frozen at first calc. It is treated as ALREADY ACCEPTED — no action needed unless you want to override it.\n\nComputed once with: LY median ADR (same DoW & month) × target growth, capped at the Expedia Goal Value (weighted compset + offsets), bounded ±50% from Anchor Price, ≥ floor.\n\nRMES suggests daily deltas (±20%) on top of this Base.\nOther RTs inherit Base + monthly supplement.`;
          }
          const fpTip = fpTipPrefix + `\n\nClick 🖋 to override · ↺ to reset.`;
          const btnOvr = `<button class="fp-inline-btn fp-inline-override" data-iso="${fpDateISO}" data-rt="${fpRTAttr}" title="Manual override" style="border:1px solid #3b6b9a;background:#fff;color:#3b6b9a;border-radius:3px;padding:0 4px;font-size:10px;font-weight:700;cursor:pointer;line-height:1.5">🖋</button>`;
          const btnReset = (fpStatus === 'override')
            ? `<button class="fp-inline-btn fp-inline-reset" data-iso="${fpDateISO}" data-rt="${fpRTAttr}" title="Remove override (revert to frozen)" style="border:1px solid #999;background:#fff;color:#666;border-radius:3px;padding:0 4px;font-size:10px;cursor:pointer;line-height:1.5">↺</button>`
            : '';
          const inlineBtns = `<span style="display:inline-flex;gap:2px;margin-left:6px;vertical-align:middle">${btnOvr}${btnReset}</span>`;
          cellFoundation = `<td class="cell-mono sell-block-fp" data-fp-struct="${sel}" data-fp-rt="${fpRTAttr}" data-fp-date="${fpDateISO}" data-fp-status="${fpStatus}" style="background:${cellBg};text-align:center;border-left:2px solid ${cellBorder};white-space:nowrap" title="${escapeHtml(fpTip)}"><b style="${textStyle}">${statusIcon}${fpPriceTxt}</b>${inlineBtns}</td>`;
        }
      }
    }
    const rmesRtCells = (function(){
      if (!_suppData || !_suppData.baseRT) return '';
      let cells = '';
      const baseRT = _suppData.baseRT;
      const mainRT = _rtFilter || baseRT;
      const mainP = r._pricesByRT ? r._pricesByRT[mainRT] : null;
      const mainM = r._mlosByRT ? r._mlosByRT[mainRT] : (typeof mlos !== 'undefined' ? mlos : 1);
      const mainMults = r._multsByRT ? r._multsByRT[mainRT] : null;
      const mainMCol = mainM === 2 ? '#a83b3b' : 'var(--ink-2)';
      let mainPriceTxt;
      if (mainRT === baseRT){
        mainPriceTxt = (mainP != null && isFinite(mainP)) ? fmtEUR(mainP) : (typeof prezzoRMES !== 'undefined' && prezzoRMES != null ? fmtEUR(prezzoRMES) : '—');
      } else {
        mainPriceTxt = (mainP != null && isFinite(mainP)) ? fmtEUR(mainP) : '—';
      }
      const mainColor = (mainRT === baseRT && typeof baseColor !== 'undefined') ? baseColor : 'var(--ink)';
      const mainTip = `${mainRT} · ${pad2(r.day)}/${pad2(r.mo)}/${r.y}  →  Click for the full detail (Foundation 6-step + RMES factors)`;
      let mainPNum = (mainP != null && isFinite(mainP)) ? mainP : null;
      if (mainPNum == null && mainRT === baseRT && typeof prezzoRMES !== 'undefined' && prezzoRMES != null && isFinite(prezzoRMES)){
        mainPNum = prezzoRMES;
      }
      let cellBgRgba = 'rgba(195,131,59,.10)';  // default ambra RMES (= Foundation invariato)
      if (mainPNum != null && _fpPriceVal != null && isFinite(_fpPriceVal)){
        const delta = mainPNum - _fpPriceVal;
        if (Math.abs(delta) >= 0.5){
          const isUp = delta > 0;
          cellBgRgba = isUp ? 'rgba(30,107,74,.10)' : 'rgba(168,59,59,.10)';
        }
      }
      const fpDateAttrISO = `${r.y}-${pad2(r.mo)}-${pad2(r.day)}`;
      const fpRTAttrCell = escapeHtml(mainRT);
      const ovrObjMain = (typeof fp_getOverride === 'function') ? fp_getOverride(sel, fpDateAttrISO, mainRT) : null;
      const hasOverride = !!(ovrObjMain && ovrObjMain.price != null && isFinite(ovrObjMain.price));
      const overrideBadge = hasOverride ? `<span title="RMES final-price override active for ${mainRT}: published price set manually (click for detail)" style="font-size:10px;color:#1e4a6b;font-weight:700;margin-right:2px">🖋</span>` : '';
      let cellBorderStyle = '';
      if (hasOverride){
        cellBgRgba = 'rgba(59,107,154,.12)';
        cellBorderStyle = 'border:1.5px solid rgba(59,107,154,.55);';
      }
      const paceFromAgg = (mainMults && mainMults._paceFromAggregate === true);
      const paceAggBadge = paceFromAgg ? `<span title="Factor C · Pace Trend: property month-specific data unavailable, using the properties-aggregate pace (marked: similar local market, area and quality tier) as a proxy." style="font-size:9px;color:#8e5fa8;font-weight:700;margin-right:2px;font-family:'DM Mono',monospace">P̄</span>` : '';
      cells += `<td class="cell-mono sell-block-rmes sell-rmes-baseRT" data-rmes-struct="${sel}" data-rmes-rt="${fpRTAttrCell}" data-rmes-date="${fpDateAttrISO}" style="background:${cellBgRgba};${cellBorderStyle}text-align:center;cursor:pointer" title="${escapeHtml(mainTip)}">${overrideBadge}${paceAggBadge}<b style="color:${mainColor}">${mainPriceTxt}</b> <span style="color:${mainMCol};font-weight:700;font-size:10.5px">M${mainM}</span></td>`;
      if (!_rtFilter && _showAllRT){
        for (const rt of _rtList){
          if (rt === baseRT) continue;
          const p = r._pricesByRT[rt];
          const m = r._mlosByRT ? r._mlosByRT[rt] : 1;
          const mults = r._multsByRT ? r._multsByRT[rt] : null;
          const mCol = m === 2 ? '#a83b3b' : 'var(--ink-2)';
          const priceTxt = (p != null && isFinite(p)) ? fmtEUR(p) : '—';
          const rtCol = _RT_COLORS[rt] || '#888';
          const cellTip = `${rt} · ${pad2(r.day)}/${pad2(r.mo)}/${r.y}  →  Click for RMES detail`;
          let rtCellBg = rtCol + '10';
          if (p != null && isFinite(p) && mults && mults.multFinale && mults.multFinale > 0){
            const priceNeutro = p / mults.multFinale;
            const delta = p - priceNeutro;
            if (Math.abs(delta) >= 0.5){
              const isUp = delta > 0;
              rtCellBg = isUp ? 'rgba(30,107,74,.08)' : 'rgba(168,59,59,.08)';
            }
          }
          const rtDateAttrISO = `${r.y}-${pad2(r.mo)}-${pad2(r.day)}`;
          const rtNameAttr = escapeHtml(rt);
          cells += `<td class="cell-mono sell-block-rt" data-rmes-struct="${sel}" data-rmes-rt="${rtNameAttr}" data-rmes-date="${rtDateAttrISO}" style="background:${rtCellBg};text-align:center;cursor:pointer" title="${escapeHtml(cellTip)}">${priceTxt} <span style="color:${mCol};font-weight:700;font-size:10.5px">M${m}</span></td>`;
        }
      }
      return cells;
    })();
    // Background della riga basato sulla pressione di ricerca Expedia (più ricerche = arancione più forte)
    let _rowBgStyle = '';
    try {
      const _expRow = (typeof expContext === 'function') ? expContext(r.ymd, sel) : null;
      const _searchCur = (_expRow && _expRow.searchCurrent != null && isFinite(_expRow.searchCurrent)) ? _expRow.searchCurrent : null;
      if (_searchCur != null && typeof _searchPressureBg === 'function'){
        _rowBgStyle = _searchPressureBg(_searchCur);
      }
    } catch(e){}
    const _trStyle = _rowBgStyle ? ` style="${_rowBgStyle}"` : '';
    const _searchTipVal = (function(){
      try {
        const _expRow = (typeof expContext === 'function') ? expContext(r.ymd, sel) : null;
        const sc = (_expRow && _expRow.searchCurrent != null) ? Math.round(_expRow.searchCurrent) : null;
        if (sc == null) return '';
        const lvl = expDemandLevel(sc);
        return ` title="Expedia search pressure for this day: ${sc.toLocaleString('en-GB')} searches · ${lvl ? lvl.label : ''}"`;
      } catch(e){ return ''; }
    })();
    // Build dateBg style: combine _rowBgStyle (search pressure) with weekend dateStyle for the DoW cell
    const _bgInline = _rowBgStyle ? ' style="' + _rowBgStyle + '"' : '';
    let _dowInline;
    if (_rowBgStyle && dateStyle){
      // both present: merge — _rowBgStyle is "background:..", dateStyle is ' style="color:..;font-weight:.."'
      const dsInner = dateStyle.replace(/^\s*style="/, '').replace(/"\s*$/, '');
      _dowInline = ' style="' + _rowBgStyle + ';' + dsInner + '"';
    } else if (_rowBgStyle){
      _dowInline = ' style="' + _rowBgStyle + '"';
    } else {
      _dowInline = dateStyle;  // ' style="..."' or ''
    }
    html += `<tr${_searchTipVal}>
      <td class="cell-mono"${_bgInline}>${pad2(r.day)}/${pad2(r.mo)}/${r.y}</td>
      <td class="sell-ev-col"${_bgInline}>${EVENTS[r.ymd] ? escapeHtml(EVENTS[r.ymd]) : ''}</td>
      <td${_dowInline}>${dowIT[r.dow]}</td>
      <!-- OTB -->
      <td class="cell-mono ${rnCmpCls} sell-grp-otb-cell">${r.curRn>0?`<span class="sell-pickup-link" data-row="${i}" data-kind="otb" style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:2px">${r.curRn}</span>`:r.curRn}</td>
      <td class="cell-mono">${fmtPct(r.curOcc,0)}</td>
      <td class="cell-mono ${adrCmpCls}">${isFinite(r.curAdr)?fmtEUR(r.curAdr):'—'}</td>
      <!-- Pickup OTB (4 colonne, niente ΔRev) -->
      <td class="cell-mono sell-grp-pickup-cell ${nuoveCount>0?'cell-pos':'cell-flat'}">${nuoveCellInner}</td>
      <td class="cell-mono cell-flat" style="text-align:right">${cancelCellInner}</td>
      <td class="cell-mono ${pkRnCls}">${pkRnCellInner}</td>
      <td class="cell-mono">${pkAdrTxt}</td>
      <!-- STLY (RN, OCC, ADR — no Revenue) -->
      <td class="cell-mono cell-flat sell-grp-stly-cell">${r.stlyRn>0?`<span class="sell-pickup-link" data-row="${i}" data-kind="otbStly" style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:2px">${r.stlyRn}</span>`:r.stlyRn}</td>
      <td class="cell-mono cell-flat">${fmtPct(r.stlyOcc,0)}</td>
      <td class="cell-mono cell-flat">${isFinite(r.stlyAdr)?fmtEUR(r.stlyAdr):'—'}</td>
      <!-- Pickup STLY (4 colonne) -->
      <td class="cell-mono sell-grp-pkstly-cell ${pkStlyNewCount>0?'cell-pos':'cell-flat'}" style="background:rgba(138,138,138,.04)">${pkStlyNewCell}</td>
      <td class="cell-mono ${pkStlyCancelCount>0?'cell-neg':'cell-flat'}" style="background:rgba(138,138,138,.04);text-align:right">${pkStlyCancelCell}</td>
      <td class="cell-mono ${r.pkRnStly>0?'cell-pos':(r.pkRnStly<0?'cell-neg':'cell-flat')}" style="background:rgba(138,138,138,.04)">${r.pkRnStly>=0?'+':''}${r.pkRnStly}</td>
      <td class="cell-mono ${pkStlyNewCount>0?'':'cell-flat'}" style="background:rgba(138,138,138,.04)">${pkStlyAdrTxt}</td>
      <!-- Last update: price currently active for this date (Base Price OR last accepted RMES) -->
      ${(function(){
        const baseRTKey = (CFG.structures[sel] && CFG.structures[sel].baseRT) || null;
        if (!baseRTKey) return '<td class="cell-mono cell-flat" style="background:rgba(195,131,59,.03);text-align:center">—</td>';
        const meta = (typeof newrmesGetAcceptedMeta === 'function') ? newrmesGetAcceptedMeta(sel, r.ymd) : null;
        const accepted = meta ? meta.price : null;
        const activePrice = (accepted != null)
          ? accepted
          : ((typeof newrmesGetEffectiveBase === 'function') ? newrmesGetEffectiveBase(sel, r.ymd) : null);
        if (activePrice == null || !isFinite(activePrice)){
          return '<td class="cell-mono cell-flat" style="background:rgba(195,131,59,.03);text-align:center">—</td>';
        }
        // Tooltip: spiega da cosa viene il prezzo attivo
        let tip;
        if (accepted != null){
          const dt = (meta && meta.ts) ? new Date(meta.ts) : null;
          const dtTxt = dt ? `${pad2(dt.getDate())}/${pad2(dt.getMonth()+1)}/${dt.getFullYear()} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}` : 'unknown date';
          tip = `Active price: €${Math.round(activePrice)}\nSource: accepted RMES suggestion\nLast updated: ${dtTxt}`;
        } else {
          tip = `Active price: €${Math.round(activePrice)}\nSource: Base Price (accepted by default — RMES never explicitly accepted for this day)`;
        }
        return `<td class="cell-mono cell-flat" style="background:rgba(195,131,59,.03);text-align:center" title="${escapeHtml(tip)}">${Math.round(activePrice)}</td>`;
      })()}
      <!-- RMES today (today's suggested price + variation + ✓ accept, clickable for detail) -->
      ${(function(){
        const mapEntry = (_rmesMapForAlignment && _rmesMapForAlignment[r.ymd]) ? _rmesMapForAlignment[r.ymd] : null;
        const baseRTKey = (CFG.structures[sel] && CFG.structures[sel].baseRT) || null;
        if (!mapEntry || !baseRTKey || !mapEntry.rmesDeltaByRT){
          return '<td class="cell-mono cell-flat" style="background:rgba(195,131,59,.05);text-align:center">—</td>';
        }
        const delta = mapEntry.rmesDeltaByRT[baseRTKey];
        const sugg = mapEntry.rmesSuggestedByRT[baseRTKey];
        if (delta == null || !isFinite(delta) || sugg == null || !isFinite(sugg)){
          return '<td class="cell-mono cell-flat" style="background:rgba(195,131,59,.05);text-align:center">—</td>';
        }
        const ref = (typeof newrmesGetCurrentReference === 'function') ? newrmesGetCurrentReference(sel, r.ymd) : null;
        const variationPct = (ref != null && ref > 0) ? (delta / ref * 100) : 0;
        const cls = (delta > 0.5) ? 'cell-pos' : (delta < -0.5 ? 'cell-neg' : 'cell-flat');
        const sign = delta > 0 ? '+' : '';
        const acc = (typeof newrmesGetAccepted === 'function') ? newrmesGetAccepted(sel, r.ymd) : null;
        const accBadge = (acc != null) ? '<span style="font-size:9px;color:#3d7a4b;font-weight:700;display:block">✓ already active</span>' : '';
        const acceptBtn = (Math.abs(delta) >= 0.5)
          ? `<button class="rmes-accept-btn" data-rmes-accept="${r.ymd}" title="Accept this RMES suggestion as the new current reference for ${r.ymd}" style="margin-top:2px;font-size:9px;padding:1px 6px;border:1px solid #3d7a4b;border-radius:3px;background:#fff;color:#3d7a4b;cursor:pointer;font-weight:700;display:inline-block">✓</button>`
          : '';
        const fpDateISO = String(r.ymd).slice(0,4)+'-'+String(r.ymd).slice(4,6)+'-'+String(r.ymd).slice(6,8);
        return `<td class="cell-mono ${cls}" data-rmes-struct="${sel}" data-rmes-rt="${escapeHtml(baseRTKey)}" data-rmes-date="${fpDateISO}" style="background:rgba(195,131,59,.05);cursor:pointer;text-align:center" title="RMES suggestion\nSuggested price: €${Math.round(sugg)}\nLast update (active price): €${ref!=null?Math.round(ref):'—'}\nΔ vs Last update: ${sign}€${Math.round(delta)} (${sign}${variationPct.toFixed(1)}%)\n\nClick anywhere on the cell to see the full calculation detail (5 factors + LMF + Event Factor).\nThe ✓ button accepts this price as the new Last update.">${Math.round(sugg)}<br><span style="font-size:10px;font-weight:600">${sign}€${Math.round(delta)}</span> ${acceptBtn}${accBadge}</td>`;
      })()}
      ${beddyCell}
      ${expCells}
      <!-- Base Price cell (with override 🖋 / reset ↺ buttons) -->
      ${cellFoundation}
    </tr>`;
  }
  const totDRev = T.pkRev;
  const totDRn  = T.pkRn;
  const totRnCmpCls  = (T.stlyRn>0)  ? (T.curRn  >= T.stlyRn  ? 'cell-pos' : 'cell-neg') : '';
  const totRevCmpCls = (T.stlyRev>0) ? (T.curRev >= T.stlyRev ? 'cell-pos' : 'cell-neg') : '';
  const totAdrCmpCls = (T.stlyRn>0 && isFinite(T.stlyAdr) && isFinite(T.curAdr)) ? (T.curAdr >= T.stlyAdr ? 'cell-pos' : 'cell-neg') : '';
  const totYoyRn  = T.curRn  - T.stlyRn;
  const totYoyRev = T.curRev - T.stlyRev;
  const totYoyRnCls  = totYoyRn>0?'cell-pos':(totYoyRn<0?'cell-neg':'cell-flat');
  const totYoyRevCls = totYoyRev>0?'cell-pos':(totYoyRev<0?'cell-neg':'cell-flat');
  let totNewN = 0, totCancelN = 0;
  for (const r of A.rows){
    totNewN += (r.pkRows||[]).length;
    totCancelN += (r.cancelRows||[]).length;
  }
  let totPkStlyNew = 0, totPkStlyCancel = 0, totPkStlyNewRev = 0;
  for (const r of A.rows){
    totPkStlyNew += (r.pkRowsStly || []).length;
    totPkStlyCancel += (r.cancelRowsStly || []).length;
    totPkStlyNewRev += (r.pkRowsStly || []).reduce((s,b)=>s+b.revPerNight, 0);
  }
  const totPkStlyAdr = totPkStlyNew > 0 ? totPkStlyNewRev / totPkStlyNew : NaN;
  html += `<tr class="total">
    <td class="cell-mono">Total</td>
    <td class="sell-ev-col"></td>
    <td>${A.rangeDays}d</td>
    <!-- OTB (RN, OCC, ADR — niente Revenue) -->
    <td class="cell-mono ${totRnCmpCls}">${T.curRn}</td>
    <td class="cell-mono">${fmtPct(T.curOcc,1)}</td>
    <td class="cell-mono ${totAdrCmpCls}">${isFinite(T.curAdr)?fmtEUR(T.curAdr):'—'}</td>
    <!-- Pickup OTB (4 colonne) -->
    <td class="cell-mono cell-pos">${totNewN>0?'+'+totNewN:'0'}</td>
    <td class="cell-mono cell-flat" style="text-align:right;color:#a83b3b">${totCancelN>0?'-'+totCancelN:'0'}</td>
    <td class="cell-mono ${totDRn>=0?'cell-pos':'cell-neg'}">${totDRn>=0?'+':''}${totDRn}</td>
    <td class="cell-mono">${isFinite(T.pkAdr)?fmtEUR(T.pkAdr):'—'}</td>
    <!-- STLY (RN, OCC, ADR — niente Revenue) -->
    <td class="cell-mono cell-flat">${T.stlyRn}</td>
    <td class="cell-mono cell-flat">${fmtPct(T.stlyOcc,1)}</td>
    <td class="cell-mono cell-flat">${isFinite(T.stlyAdr)?fmtEUR(T.stlyAdr):'—'}</td>
    <!-- Pickup STLY (4 colonne) -->
    <td class="cell-mono ${totPkStlyNew>0?'cell-pos':'cell-flat'}" style="background:rgba(138,138,138,.04)">${totPkStlyNew>0?'+'+totPkStlyNew:'0'}</td>
    <td class="cell-mono ${totPkStlyCancel>0?'cell-neg':'cell-flat'}" style="background:rgba(138,138,138,.04);text-align:right">${totPkStlyCancel>0?'-'+totPkStlyCancel:'0'}</td>
    <td class="cell-mono ${T.pkRnStly>=0?'cell-pos':'cell-neg'}" style="background:rgba(138,138,138,.04)">${T.pkRnStly>=0?'+':''}${T.pkRnStly}</td>
    <td class="cell-mono ${isFinite(totPkStlyAdr)?'':'cell-flat'}" style="background:rgba(138,138,138,.04)">${isFinite(totPkStlyAdr)?fmtEUR(totPkStlyAdr):'—'}</td>
    <!-- RMES last update -->
    <td class="cell-flat" style="background:rgba(195,131,59,.03);text-align:center;color:var(--ink-3);font-size:10px">— per date —</td>
    <!-- RMES today -->
    <td class="cell-flat" style="background:rgba(195,131,59,.05);text-align:center;color:var(--ink-3);font-size:10px">— per date —</td>
    ${showBeddy ? '<td class="cell-flat" style="background:rgba(30,107,74,.04);text-align:center;color:var(--ink-3);font-size:10px">— per date —</td>' : ''}
    ${showExp ? '<td class="cell-flat" colspan="3" style="background:rgba(58,107,107,.04);text-align:center;color:var(--ink-3);font-size:10px">— per date —</td>' : ''}
    <!-- Base Price -->
    <td class="cell-flat" style="background:rgba(195,131,59,.06);text-align:center;color:var(--ink-3);font-size:10px">— per date —</td>
  </tr>`;
  html += '</tbody></table>';
  document.getElementById('sell-table-wrap').innerHTML = html;
  _renderSellRtFilterPills(sel);
  (function _renderAuditBanner(){
    const banner = document.getElementById('sell-audit-banner');
    if (!banner) return;
    // NewRMES: il banner audit del sistema legacy non è più rilevante. Tenuto nascosto.
    banner.style.display = 'none';
    return;
    if (typeof fp_getOverrides !== 'function'){ banner.style.display = 'none'; return; }
    const all = fp_getOverrides();
    const today = new Date(TODAY); today.setHours(0,0,0,0);
    const todayYmd = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
    const structKeysCheck = sel === 'both' ? ['firenze','condotta','alfani','davids'] : [sel];
    let totDelta = 0, nValid = 0, nVintoOvr = 0, nVintoRMES = 0;
    for (const sk of structKeysCheck){
      const o = all[sk]; if (!o) continue;
      const structName = (sk === 'condotta') ? 'Condotta 16' : (sk === 'alfani') ? 'Palazzo Alfani' : (sk === 'davids') ? "Enis Guesthouse" : 'Firenze Suite';
      for (const dateISO in o){
        if (dateISO >= todayYmd) continue;
        for (const rtN in o[dateISO]){
          const ovrObj = o[dateISO][rtN];
          if (!ovrObj || typeof ovrObj !== 'object' || !ovrObj.snapshot) continue;
          const rmesSugg = +ovrObj.snapshot.rmesSuggested;
          if (!isFinite(rmesSugg)) continue;
          let rn=0, rev=0;
          if (typeof BOOKINGS !== 'undefined'){
            const td = new Date(dateISO + 'T00:00:00');
            if (!isNaN(td.getTime())){
              const tdYmd = dateISO;
              for (const b of BOOKINGS){
                if (b.struct !== structName) continue;
                if (b.stato !== 'Confermate') continue;
                if (b.room !== rtN) continue;
                if (!b.dIn || !b.dOut) continue;
                const ciYmd = b.dIn.getFullYear() + '-' + String(b.dIn.getMonth()+1).padStart(2,'0') + '-' + String(b.dIn.getDate()).padStart(2,'0');
                const coYmd = b.dOut.getFullYear() + '-' + String(b.dOut.getMonth()+1).padStart(2,'0') + '-' + String(b.dOut.getDate()).padStart(2,'0');
                if (ciYmd <= tdYmd && coYmd > tdYmd){
                  rn++;
                  rev += (b.revPerNightCaricato != null) ? b.revPerNightCaricato : b.revPerNight;
                }
              }
            }
          }
          if (rn === 0) continue;
          const revIpot = rmesSugg * rn;
          const delta = rev - revIpot;
          totDelta += delta; nValid++;
          if (delta > 0.5) nVintoOvr++;
          else if (delta < -0.5) nVintoRMES++;
        }
      }
    }
    if (nValid === 0){ banner.style.display = 'none'; return; }
    const sign = totDelta >= 0 ? '+' : '';
    const col = totDelta > 0 ? '#1e6b4a' : (totDelta < 0 ? '#a83b3b' : '#666');
    const winner = totDelta > 0 ? '🖋 Override' : totDelta < 0 ? '💡 RMES' : 'parità';
    banner.style.display = 'block';
    banner.innerHTML = '<div style="padding:10px 16px;background:#f8f8f5;border-top:1px solid var(--line);border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;font-size:12px">' +
      '<div><b>📊 Audit override</b> · ' + nValid + ' closed days with override · ' + nVintoOvr + ' 🖋 vs ' + nVintoRMES + ' 💡 · Total Δ Revenue <b style="font-family:\'DM Mono\',monospace;color:' + col + '">' + sign + '€' + totDelta.toFixed(2) + '</b></div>' +
      '<div style="font-size:11px;color:#666">Trend: <b>' + winner + '</b> · Detail in the tab <a href="#" onclick="document.querySelector(\'.tab[data-tab=pri]\').click();return false" style="color:#7a4f1c;font-weight:600;text-decoration:underline">RMES</a> → Audit override</div>' +
      '</div>';
  })();
  document.getElementById('sell-table-wrap').querySelectorAll('.sell-pickup-link').forEach(el=>{
    el.addEventListener('click', (ev)=>{
      ev.stopPropagation();
      const idx = +el.dataset.row;
      const kind = el.dataset.kind || 'pk';
      openSellPickupDrill(idx, kind);
    });
  });
  // NewRMES: listener bottoni ✓ accept (data-rmes-accept = ymd numerico)
  document.getElementById('sell-table-wrap').querySelectorAll('.rmes-accept-btn').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const ymdN = +btn.dataset.rmesAccept;
      if (!ymdN || !isFinite(ymdN)) return;
      // recupera il prezzo suggerito RMES today dalla mappa
      const sk = CURRENT_STRUCT;
      if (!sk || sk === 'both') { alert('Select a property first.'); return; }
      const baseRTKey = (CFG.structures[sk] && CFG.structures[sk].baseRT) || null;
      if (!baseRTKey) return;
      let rmesMap = null;
      try { rmesMap = computeRMESPriceMap(sk, SELL_START_YMD, SELL_RANGE_DAYS); } catch(e){}
      const mapEntry = rmesMap && rmesMap[ymdN];
      if (!mapEntry || !mapEntry.rmesSuggestedByRT || mapEntry.rmesSuggestedByRT[baseRTKey] == null){
        alert('No RMES suggestion for this date.');
        return;
      }
      const newPrice = Math.round(mapEntry.rmesSuggestedByRT[baseRTKey]);
      const curRef = (typeof newrmesGetCurrentReference === 'function') ? newrmesGetCurrentReference(sk, ymdN) : null;
      const ymdStr = String(ymdN);
      const dateLbl = ymdStr.slice(6,8) + '/' + ymdStr.slice(4,6) + '/' + ymdStr.slice(0,4);
      if (!confirm('Accept RMES suggestion?\n\nDate: ' + dateLbl + '\nCurrent reference: ' + (curRef!=null?curRef+' €':'—') + '\nNew accepted price: ' + newPrice + ' €\n\nFrom now on RMES will start from this price for this date.')) return;
      newrmesSetAccepted(sk, ymdN, newPrice);
      // re-render Sell Strategy (così la cella si aggiorna)
      if (typeof renderSellStrategy === 'function') renderSellStrategy(sk);
    });
  });
  const _refreshSellAfterFp = () => {
    if (typeof renderSellStrategy === 'function' && typeof CURRENT_STRUCT !== 'undefined'){
      try { renderSellStrategy(CURRENT_STRUCT); } catch(e){}
    }
  };
  document.getElementById('sell-table-wrap').querySelectorAll('.fp-inline-override').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const iso = btn.getAttribute('data-iso');
      const rt = btn.getAttribute('data-rt');
      if (!iso || !rt) return;
      // NewRMES: l'override del Base Price funziona per la base RT (singolo numero per data)
      const ymdN = +(iso.replaceAll('-',''));
      const sk = sel;
      const curBase = (typeof newrmesGetEffectiveBase === 'function') ? newrmesGetEffectiveBase(sk, ymdN) : null;
      const frozenOnly = (typeof newrmesGetFrozenBase === 'function') ? newrmesGetFrozenBase(sk, ymdN) : null;
      const dateLbl = iso.split('-').reverse().join('/');
      const v = prompt('Override Base Price for ' + dateLbl + '\nProperty: ' + sk + '\n\nCurrent Base Price: ' + (curBase!=null?curBase+' €':'—') + (frozenOnly!=null?'\nFrozen (computed): '+frozenOnly+' €':'') + '\n\nEnter the new Base Price (€):', curBase != null ? Math.round(curBase) : (frozenOnly != null ? Math.round(frozenOnly) : ''));
      if (v == null) return;
      const num = parseFloat(v);
      if (!isFinite(num) || num <= 0){ alert('Invalid value'); return; }
      if (typeof newrmesSetFrozenBaseOverride === 'function'){
        newrmesSetFrozenBaseOverride(sk, ymdN, num);
        // se accettato per quel giorno, anche l'accettato non ha più senso → lo cancello
        if (typeof newrmesSetAccepted === 'function') newrmesSetAccepted(sk, ymdN, null);
        _refreshSellAfterFp();
      }
    });
  });
  document.getElementById('sell-table-wrap').querySelectorAll('.fp-inline-reset').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const iso = btn.getAttribute('data-iso');
      const rt = btn.getAttribute('data-rt');
      if (!iso || !rt) return;
      const ymdN = +(iso.replaceAll('-',''));
      const sk = sel;
      const dateLbl = iso.split('-').reverse().join('/');
      if (!confirm('Reset Base Price override for ' + dateLbl + '?\nProperty: ' + sk + '\n\nThe Base Price will revert to the originally frozen value.')) return;
      if (typeof newrmesSetFrozenBaseOverride === 'function'){
        newrmesSetFrozenBaseOverride(sk, ymdN, null);
        _refreshSellAfterFp();
      }
    });
  });
  // NewRMES: il vecchio popup Foundation (fp-price-click) è stato sostituito dai bottoni inline
  // 🖋/↺ nella cella Base Price + il pannello "Override by period". Niente listener qui.
  document.getElementById('sell-table-wrap').querySelectorAll('td[data-rmes-struct]').forEach(el=>{
    el.addEventListener('click', (ev)=>{
      ev.stopPropagation();
      const struct = el.dataset.rmesStruct;
      const rt = el.dataset.rmesRt;
      const dateISO = el.dataset.rmesDate;
      if (struct && rt && dateISO && typeof fp_showDetailModal === 'function'){
        fp_showDetailModal(struct, rt, dateISO);
      }
    });
  });
  (function _wireFpApprovalBar(){
    const barEl = document.getElementById('sell-fp-approval-bar');
    const labelEl = document.getElementById('sell-fp-baseRT-label');
    if (!barEl) return;
    const baseRT = _suppData ? _suppData.baseRT : null;
    const isFilterCompatible = (!_rtFilter) || (_rtFilter === baseRT);
    if (sel === 'both' || !baseRT || !isFilterCompatible){
      barEl.style.display = 'none';
      return;
    }
    barEl.style.display = 'block';
    if (labelEl) labelEl.textContent = '— baseRT: ' + baseRT;
    const _refreshSell = () => {
      if (typeof renderSellStrategy === 'function') renderSellStrategy(sel);
    };
    function _fpPeriodDays(){
      const fromInp = document.getElementById('fp-period-from');
      const toInp   = document.getElementById('fp-period-to');
      const msgEl   = document.getElementById('fp-period-msg');
      const setMsg  = (t,err)=>{ if(msgEl){ msgEl.textContent=t; msgEl.style.color = err ? '#c0392b' : '#8e5fa8'; } };
      if (!fromInp || !toInp){ return null; }
      const fromV = fromInp.value, toV = toInp.value;
      if (!fromV || !toV){ setMsg('Select start and end date.', true); return null; }
      const d0 = new Date(fromV + 'T00:00:00'), d1 = new Date(toV + 'T00:00:00');
      if (isNaN(d0.getTime()) || isNaN(d1.getTime())){ setMsg('Invalid dates.', true); return null; }
      if (d1 < d0){ setMsg('End date is before start date.', true); return null; }
      const days = [];
      for (let d = new Date(d0); d <= d1; d.setDate(d.getDate()+1)){
        const iso = d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate());
        let calc = null;
        try {
          if (typeof fp_computePrice === 'function'){
            const r = fp_computePrice(sel, baseRT, iso);
            if (r && r.detail && isFinite(r.detail.priceFinal)) calc = r.detail.priceFinal;
          }
        } catch(e){}
        days.push({ iso, calc });
      }
      return { days, setMsg };
    }
    const btnPeriodFp = document.getElementById('fp-period-foundation');
    if (btnPeriodFp){
      btnPeriodFp.onclick = function(){
        const priceInp = document.getElementById('fp-period-price');
        const price = priceInp ? parseFloat(priceInp.value) : NaN;
        const r = _fpPeriodDays(); if (!r) return;
        if (!isFinite(price) || price <= 0){ r.setMsg('Enter a valid price (>0).', true); return; }
        if (!confirm('Override BASE PRICE of €' + price.toFixed(0) + ' on ' + r.days.length + ' days (baseRT: ' + baseRT + ')?\n\nRMES will keep suggesting deltas vs this new Base. Other RTs inherit base + supplement.')) return;
        for (const d of r.days){
          const ymdN = +(d.iso.replaceAll('-',''));
          if (typeof newrmesSetFrozenBaseOverride === 'function') newrmesSetFrozenBaseOverride(sel, ymdN, price);
          // un override del Base annulla l'accettazione precedente
          if (typeof newrmesSetAccepted === 'function') newrmesSetAccepted(sel, ymdN, null);
        }
        r.setMsg('✓ Base Price €' + price.toFixed(0) + ' applied to ' + r.days.length + ' days.');
        _refreshSell();
      };
    }
    const btnPeriodFinal = document.getElementById('fp-period-final');
    if (btnPeriodFinal){
      btnPeriodFinal.onclick = function(){
        const priceInp = document.getElementById('fp-period-price');
        const price = priceInp ? parseFloat(priceInp.value) : NaN;
        const r = _fpPeriodDays(); if (!r) return;
        if (!isFinite(price) || price <= 0){ r.setMsg('Enter a valid price (>0).', true); return; }
        if (!confirm('ACCEPT RMES of €' + price.toFixed(0) + ' on ' + r.days.length + ' days (baseRT: ' + baseRT + ')?\n\nThis becomes the current reference for those dates. Tomorrow\'s RMES will start from this price.')) return;
        for (const d of r.days){
          const ymdN = +(d.iso.replaceAll('-',''));
          if (typeof newrmesSetAccepted === 'function') newrmesSetAccepted(sel, ymdN, price);
        }
        r.setMsg('✓ Accepted €' + price.toFixed(0) + ' on ' + r.days.length + ' days.');
        _refreshSell();
      };
    }
    const btnPeriodReset = document.getElementById('fp-period-reset');
    if (btnPeriodReset){
      btnPeriodReset.onclick = function(){
        const r = _fpPeriodDays(); if (!r) return;
        if (!confirm('Reset Base Price override AND Accepted price on ' + r.days.length + ' days (baseRT: ' + baseRT + ')?')) return;
        for (const d of r.days){
          const ymdN = +(d.iso.replaceAll('-',''));
          if (typeof newrmesSetFrozenBaseOverride === 'function') newrmesSetFrozenBaseOverride(sel, ymdN, null);
          if (typeof newrmesSetAccepted === 'function') newrmesSetAccepted(sel, ymdN, null);
        }
        r.setMsg('↺ Reset on ' + r.days.length + ' days.');
        _refreshSell();
      };
    }
  })();
  if (typeof renderPickupByMonth === 'function'){
    try { renderPickupByMonth(sel); } catch(e) { console.error('renderPickupByMonth:', e); }
  }
}
/* Drilldown modal for Sell Strategy pickup/cancel cell.
   kind: 'pk' (nuove prenotazioni) | 'cancel' (cancellazioni nel pickup window) */
function _sellBookingsForNight(r, isStly){
  const out = [];
  if (typeof BOOKINGS === 'undefined') return out;
  const sel = (SELL_LAST_AGG && SELL_LAST_AGG.structSel) ? SELL_LAST_AGG.structSel : CURRENT_STRUCT;
  const keys = (typeof structKeysFor === 'function') ? new Set(structKeysFor(sel)) : null;
  const _rtFilter = (typeof SELL_RT_FILTER !== 'undefined') ? SELL_RT_FILTER : null;
  let nightDate = new Date(r.date);
  if (isStly) nightDate.setDate(nightDate.getDate() - 364);
  const nightStart = startOfDay(nightDate).getTime();
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (keys && !keys.has(b.struct)) continue;
    if (!keys && b.struct !== sel) continue;
    if (_rtFilter && b.room !== _rtFilter) continue;
    const inT = startOfDay(b.dIn).getTime();
    const outT = startOfDay(b.dOut).getTime();
    if (inT <= nightStart && nightStart < outT){
      out.push(b);
    }
  }
  return out;
}
function openSellPickupDrill(rowIdx, kind){
  if (!SELL_LAST_AGG) return;
  const r = SELL_LAST_AGG.rows[rowIdx];
  if (!r) return;
  kind = kind || 'pk';
  let sourceRows;
  if (kind === 'cancel') sourceRows = r.cancelRows || [];
  else if (kind === 'pkStly') sourceRows = r.pkRowsStly || [];
  else if (kind === 'cancelStly') sourceRows = r.cancelRowsStly || [];
  else if (kind === 'otb' || kind === 'otbStly'){
    sourceRows = _sellBookingsForNight(r, kind === 'otbStly');
  }
  else sourceRows = r.pkRows || [];
  const rows = [...sourceRows].sort((a,b)=> b.bookYmd - a.bookYmd);
  const totRev = rows.reduce((s,b)=>s+b.revPerNight,0);
  const totRn  = rows.length;
  const dateLbl = `${pad2(r.day)}/${pad2(r.mo)}/${r.y}`;
  let titleLbl, subLbl;
  if (kind === 'cancel'){
    titleLbl = `Cancelled · night ${dateLbl}`;
    subLbl = `${rows.length} room-bookings CANCELLED in the last ${SELL_LAST_AGG.pickupDaysAgo}d that included this night`;
  } else if (kind === 'pkStly'){
    const stlyDate = new Date(r.date); stlyDate.setDate(stlyDate.getDate() - 364);
    const stlyDateLbl = `${pad2(stlyDate.getDate())}/${pad2(stlyDate.getMonth()+1)}/${stlyDate.getFullYear()}`;
    titleLbl = `Pickup STLY · night ${stlyDateLbl}`;
    subLbl = `${rows.length} room-bookings that came in during the STLY pickup window (last ${SELL_LAST_AGG.pickupDaysAgo}d, but a year ago) that included the STLY night`;
  } else if (kind === 'cancelStly'){
    const stlyDate = new Date(r.date); stlyDate.setDate(stlyDate.getDate() - 364);
    const stlyDateLbl = `${pad2(stlyDate.getDate())}/${pad2(stlyDate.getMonth()+1)}/${stlyDate.getFullYear()}`;
    titleLbl = `Cancelled STLY · night ${stlyDateLbl}`;
    subLbl = `${rows.length} room-bookings CANCELLED in the STLY pickup window (last ${SELL_LAST_AGG.pickupDaysAgo}d, but a year ago) that included the STLY night`;
  } else if (kind === 'otb'){
    titleLbl = `On the books · night ${dateLbl}`;
    subLbl = `${rows.length} room-bookings confirmed (OTB) that include this night`;
  } else if (kind === 'otbStly'){
    const stlyDate = new Date(r.date); stlyDate.setDate(stlyDate.getDate() - 364);
    const stlyDateLbl = `${pad2(stlyDate.getDate())}/${pad2(stlyDate.getMonth()+1)}/${stlyDate.getFullYear()}`;
    titleLbl = `On the books STLY · night ${stlyDateLbl}`;
    subLbl = `${rows.length} room-bookings that were confirmed (OTB) on the STLY night, one year ago`;
  } else {
    titleLbl = `Pickup · night ${dateLbl}`;
    subLbl = `${rows.length} room-bookings that came in during the last ${SELL_LAST_AGG.pickupDaysAgo}d that include this night`;
  }
  document.getElementById('modal-title').textContent = titleLbl;
  document.getElementById('modal-sub').textContent = subLbl;
  const dateColLbl = (kind === 'cancel' || kind === 'cancelStly') ? 'Data cancel.' : 'Data bk';
  let html;
  if (kind === 'otb' || kind === 'otbStly'){
    function _aggBy(keyFn){
      const m = {};
      for (const b of rows){
        const k = keyFn(b) || '—';
        if (!m[k]) m[k] = {rn:0, rev:0};
        m[k].rn  += 1;
        m[k].rev += b.revPerNight;
      }
      return Object.entries(m)
        .map(([k,v]) => ({ k, rn:v.rn, rev:v.rev, avg: v.rn>0 ? v.rev/v.rn : 0 }))
        .sort((a,b) => b.rev - a.rev);
    }
    const byChannel = _aggBy(b => b.canale);
    const byRoom    = _aggBy(b => b.room);
    function _aggTable(title, label, arr){
      let t = `<table style="margin-bottom:18px"><thead><tr>`
            + `<th>${label}</th><th class="num">RN</th><th class="num">Revenue</th><th class="num">Avg/night</th>`
            + `</tr></thead><tbody>`;
      for (const r2 of arr){
        t += `<tr><td>${escapeHtml(r2.k)}</td>`
           + `<td class="num">${r2.rn}</td>`
           + `<td class="num">${fmtEUR(r2.rev)}</td>`
           + `<td class="num">${fmtEUR(r2.avg)}</td></tr>`;
      }
      if (!arr.length) t += `<tr><td colspan="4" style="text-align:center;color:var(--ink-3);padding:24px">No data for this night</td></tr>`;
      t += `<tr style="font-weight:700;border-top:2px solid var(--line)"><td>Total</td>`
         + `<td class="num">${totRn}</td><td class="num">${fmtEUR(totRev)}</td>`
         + `<td class="num">${fmtEUR(totRn>0?totRev/totRn:0)}</td></tr>`;
      t += `</tbody></table>`;
      return `<div style="font-size:12px;font-weight:700;color:var(--ink-2);margin:0 0 6px 0;text-transform:uppercase;letter-spacing:.05em">${title}</div>` + t;
    }
    html = _aggTable('By channel', 'Channel', byChannel) + _aggTable('By room type', 'Room', byRoom);
  } else {
    html = `<table>
    <thead><tr>
      <th>${dateColLbl}</th><th>Property</th><th>Room</th><th>Arrival</th><th>Nights</th><th>Source</th><th>Channel</th><th>Guest</th><th class="num">Rev/night</th>
    </tr></thead><tbody>`;
    for (const b of rows){
      const dateShown = ((kind === 'cancel' || kind === 'cancelStly') && b.cancelYmd) ? ymdToDate(b.cancelYmd) : b.dBook;
      const arrivoShown = (kind === 'pkStly' || kind === 'cancelStly') ? addDays(b.dIn, 364) : b.dIn;
      html += `<tr>
        <td class="num">${fmtDateIT(dateShown)}</td>
        <td>${escapeHtml(b.struct)}</td>
        <td>${escapeHtml(b.room)}</td>
        <td class="num">${fmtDateIT(arrivoShown)}</td>
        <td class="num">${b.notti}</td>
        <td>${escapeHtml(b.prov)}</td>
        <td>${escapeHtml(b.canale)}</td>
        <td>${escapeHtml(b.guest||'—')}</td>
        <td class="num">${fmtEUR(b.revPerNight)}</td>
      </tr>`;
    }
    if (!rows.length) html += `<tr><td colspan="9" style="text-align:center;color:var(--ink-3);padding:30px">No data for this night</td></tr>`;
    html += '</tbody>';
  }
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-foot-l').textContent = `${rows.length} bookings · ${totRn} RN on this night`;
  document.getElementById('modal-foot-r').textContent = fmtEUR(totRev);
  document.getElementById('modal').classList.add('show');
}
/* ============================================================
   PICKUP per MESE DI SOGGIORNO — confronto OTB vs STLY
   Aggrega le prenotazioni confermate (cur + STLY) entrate nel pickup window
   (= ultimi pickupDaysAgo days di booking) per mese di check-in.
   ============================================================ */
function renderPickupByMonth(sel){
  const wrapEl = document.getElementById('pkmonth-chart-wrap');
  const legendEl = document.getElementById('pkmonth-legend');
  const labelEl = document.getElementById('pkmonth-window-label');
  if (!wrapEl) return;
  const filterWrap = document.getElementById('pkmonth-filter-wrap');
  if (filterWrap){
    if (sel === 'both'){
      filterWrap.style.display = 'flex';
      const filters = [
        { key:'both',     label:'All (aggregato)', color:'#5e4a32' },
        { key:'firenze',  label:'Firenze Suite',    color:'#3b6b9a' },
        { key:'condotta', label:'Condotta 16',      color:'#3d7a4b' },
        { key:'alfani',   label:'Palazzo Alfani',   color:'#8e5fa8' },
      ];
      const pillsEl = document.getElementById('pkmonth-filter-pills');
      if (pillsEl){
        pillsEl.innerHTML = filters.map(f => {
          const on = (SELL_PKMONTH_FILTER === f.key);
          const style = on
            ? `border-color:${f.color};background:${f.color};color:#fff;font-weight:700`
            : `border-color:${f.color};background:#fff;color:${f.color}`;
          return `<button class="pkmonth-filter-pill" data-pkmonth="${f.key}" style="${style};padding:4px 12px;border-radius:14px;border-width:1.5px;border-style:solid;cursor:pointer;font-size:11px;font-family:'DM Sans',sans-serif">${f.label}</button>`;
        }).join('');
        pillsEl.querySelectorAll('button[data-pkmonth]').forEach(btn => {
          btn.onclick = () => {
            SELL_PKMONTH_FILTER = btn.dataset.pkmonth;
            renderPickupByMonth('both');  // re-render
          };
        });
      }
      renderPickupByMonth._renderOne(SELL_PKMONTH_FILTER, 'pkmonth-chart-wrap', 'pkmonth-legend');
      return;
    } else {
      filterWrap.style.display = 'none';
    }
  }
  renderPickupByMonth._renderOne(sel, 'pkmonth-chart-wrap', 'pkmonth-legend');
}
renderPickupByMonth._renderOne = function(sel, wrapId, legendId){
  const wrapEl = document.getElementById(wrapId);
  const legendEl = document.getElementById(legendId);
  const labelEl = document.getElementById('pkmonth-window-label');
  if (!wrapEl) return;
  const pickupDays = (typeof SELL_PICKUP_DAYS === 'number' && SELL_PICKUP_DAYS > 0) ? SELL_PICKUP_DAYS : 1;
  const keys = new Set(structKeysFor(sel));
  const today0 = new Date(TODAY); today0.setHours(0,0,0,0);
  const snapDate = new Date(today0); snapDate.setDate(snapDate.getDate() - pickupDays);
  const snapYmdN = ymd(snapDate);
  const todayYmdN = TODAY_YMD;
  const stlyToday = new Date(today0); stlyToday.setDate(stlyToday.getDate() - 364);
  const stlyTodayYmdN = ymd(stlyToday);
  const stlySnap = new Date(stlyToday); stlySnap.setDate(stlySnap.getDate() - pickupDays);
  const stlySnapYmdN = ymd(stlySnap);
  if (labelEl){
    const lbl = `pickup ${pickupDays}d · booking window ${pad2(snapDate.getDate())}/${pad2(snapDate.getMonth()+1)} → today`;
    labelEl.textContent = lbl;
  }
  function monthKey(d){
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
  }
  function shiftMonthForward(monthK){
    const [y, m] = monthK.split('-').map(s=>parseInt(s,10));
    return (y+1) + '-' + String(m).padStart(2,'0');
  }
  const cur = {};   // monthK → {rn, rev, dayPicks: {ymd: rn}}
  const sty = {};   // monthK → {rn, rev, dayPicks: {ymd: rn}} (con ymd shiftato +364)
  function bump(map, mk, rn, rev){
    if (!map[mk]) map[mk] = {rn:0, rev:0, dayPicks:{}};
    map[mk].rn += rn;
    map[mk].rev += rev;
  }
  function bumpDay(map, mk, ymdN, rn){
    if (!map[mk]) map[mk] = {rn:0, rev:0, dayPicks:{}};
    map[mk].dayPicks[ymdN] = (map[mk].dayPicks[ymdN] || 0) + rn;
  }
  const isAgg = (sel === 'both');
  const _structFullToShort = {};
  _structFullToShort[CFG.structures.firenze.key]  = 'firenze';
  _structFullToShort[CFG.structures.condotta.key] = 'condotta';
  _structFullToShort[CFG.structures.alfani.key]   = 'alfani';
  _structFullToShort[CFG.structures.davids.key]   = 'davids';
  function bumpByStruct(map, mk, structFullKey, rn, rev){
    const sk = _structFullToShort[structFullKey];
    if (!sk) return;
    if (!map[mk]) map[mk] = {};
    if (!map[mk][sk]) map[mk][sk] = {rn:0, rev:0};
    map[mk][sk].rn += rn;
    map[mk][sk].rev += rev;
  }
  const curByStruct = {};  // monthK → {firenze:{rn,rev}, condotta:{rn,rev}, alfani:{rn,rev}}
  const styByStruct = {};
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (!keys.has(b.struct)) continue;
    if (b.bookYmd > snapYmdN && b.bookYmd <= todayYmdN){
      const mk = monthKey(b.dIn);
      bump(cur, mk, b.notti, b.revTotal);
      if (isAgg) bumpByStruct(curByStruct, mk, b.struct, b.notti, b.revTotal);
      let curD = startOfDay(b.dIn);
      const endD = startOfDay(b.dOut);
      while (curD < endD){
        const yN = ymd(curD);
        const nightMk = monthKey(curD);
        bumpDay(cur, nightMk, yN, 1);
        curD = addDays(curD, 1);
      }
    }
    if (b.bookYmd > stlySnapYmdN && b.bookYmd <= stlyTodayYmdN){
      const mkOrig = monthKey(b.dIn);  // es. 2025-05
      const mkShifted = shiftMonthForward(mkOrig);  // → 2026-05
      bump(sty, mkShifted, b.notti, b.revTotal);
      if (isAgg) bumpByStruct(styByStruct, mkShifted, b.struct, b.notti, b.revTotal);
      let curD = startOfDay(b.dIn);
      const endD = startOfDay(b.dOut);
      while (curD < endD){
        const shiftedD = addDays(curD, 364);
        const yN = ymd(shiftedD);
        const nightMk = monthKey(shiftedD);
        bumpDay(sty, nightMk, yN, 1);
        curD = addDays(curD, 1);
      }
    }
  }
  const allMonths = new Set([...Object.keys(cur), ...Object.keys(sty)]);
  const monthAxis = Array.from(allMonths).sort();
  if (monthAxis.length === 0){
    wrapEl.innerHTML = '<div class="panel-sub" style="padding:20px;text-align:center">No pickup in the period</div>';
    if (legendEl) legendEl.innerHTML = '';
    return;
  }
  const monLabIT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function smLabel(mk){
    const [y, m] = mk.split('-');
    return monLabIT[parseInt(m,10)-1] + " '" + y.slice(2);
  }
  const data = monthAxis.map(mk => {
    const c = cur[mk] || {rn:0, rev:0, dayPicks:{}};
    const s = sty[mk] || {rn:0, rev:0, dayPicks:{}};
    function peakOf(dayPicks){
      let bestYmd = null, bestRn = 0;
      for (const yN in dayPicks){
        if (dayPicks[yN] > bestRn){
          bestRn = dayPicks[yN];
          bestYmd = +yN;
        }
      }
      return { ymd: bestYmd, rn: bestRn };
    }
    return {
      mk, label: smLabel(mk),
      curRn: c.rn, curRev: c.rev,
      styRn: s.rn, styRev: s.rev,
      deltaRn: c.rn - s.rn,
      deltaRev: c.rev - s.rev,
      curPeak: peakOf(c.dayPicks),
      styPeak: peakOf(s.dayPicks),
      curByStruct: isAgg ? (curByStruct[mk] || {}) : null,
      styByStruct: isAgg ? (styByStruct[mk] || {}) : null,
    };
  });
  const W = Math.max(900, wrapEl.clientWidth || 1000);
  const H = 360;
  const MARGIN = { top: 30, right: 70, bottom: 60, left: 60 };
  const innerW = W - MARGIN.left - MARGIN.right;
  const innerH = H - MARGIN.top - MARGIN.bottom;
  const N = data.length;
  const groupW = innerW / N;
  const barW = Math.min(28, Math.max(6, (groupW - 12) / 2));
  let maxRn = 0;
  let maxRev = 0;
  for (const d of data){
    if (d.curRn > maxRn) maxRn = d.curRn;
    if (d.styRn > maxRn) maxRn = d.styRn;
    if (d.curRev > maxRev) maxRev = d.curRev;
    if (d.styRev > maxRev) maxRev = d.styRev;
  }
  if (maxRn < 5) maxRn = 5;
  if (maxRev < 500) maxRev = 500;
  const xCenter = i => MARGIN.left + groupW * (i + 0.5);
  const yRn = v => MARGIN.top + innerH - (v / maxRn) * innerH;
  const yRev = v => MARGIN.top + innerH - (v / maxRev) * innerH;
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet" style="display:block;font-family:'DM Mono',monospace;font-size:10px">`;
  for (let i = 0; i <= 5; i++){
    const v = maxRn * i / 5;
    const y = yRn(v);
    svg += `<line x1="${MARGIN.left}" y1="${y}" x2="${W - MARGIN.right}" y2="${y}" stroke="rgba(0,0,0,.05)" stroke-width="1"/>`;
    svg += `<text x="${MARGIN.left - 6}" y="${y + 3}" text-anchor="end" fill="var(--ink-3)" font-size="9">${Math.round(v)}</text>`;
    const vRev = maxRev * i / 5;
    svg += `<text x="${W - MARGIN.right + 6}" y="${y + 3}" text-anchor="start" fill="rgba(127,76,40,.7)" font-size="9">€${Math.round(vRev/1000)}k</text>`;
  }
  svg += `<text x="${MARGIN.left - 6}" y="${MARGIN.top - 10}" text-anchor="end" fill="var(--ink-3)" font-size="9" font-weight="700">RN</text>`;
  svg += `<text x="${W - MARGIN.right + 6}" y="${MARGIN.top - 10}" text-anchor="start" fill="rgba(127,76,40,.85)" font-size="9" font-weight="700">€ Rev</text>`;
  const STRUCT_COLORS = {
    firenze:  { cur: '#3b6b9a', sty: '#7a9bbf' },
    condotta: { cur: '#3d7a4b', sty: '#85a78d' },
    alfani:   { cur: '#8e5fa8', sty: '#b698c6' },
  };
  const barColorCur = (sel !== 'both' && STRUCT_COLORS[sel]) ? STRUCT_COLORS[sel].cur : '#3b6b6b';
  const barColorSty = (sel !== 'both' && STRUCT_COLORS[sel]) ? STRUCT_COLORS[sel].sty : '#8e7a5e';
  for (let i = 0; i < N; i++){
    const d = data[i];
    const cx = xCenter(i);
    const yBase = MARGIN.top + innerH;
    if (d.curRn > 0){
      const x = cx - barW - 2;
      const y = yRn(d.curRn);
      const h = yBase - y;
      svg += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="${barColorCur}" rx="2"/>`;
      if (h > 18){
        svg += `<text x="${x + barW/2}" y="${y + 12}" text-anchor="middle" fill="#fff" font-size="9" font-weight="700">${d.curRn}</text>`;
      }
    }
    if (d.styRn > 0){
      const x = cx + 2;
      const y = yRn(d.styRn);
      const h = yBase - y;
      svg += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="${barColorSty}" rx="2" opacity="0.85"/>`;
      if (h > 18){
        svg += `<text x="${x + barW/2}" y="${y + 12}" text-anchor="middle" fill="#fff" font-size="9" font-weight="700">${d.styRn}</text>`;
      }
    }
    if (d.curRev > 0){
      const yR = yRev(d.curRev);
      svg += `<circle cx="${cx - barW/2 - 2}" cy="${yR}" r="3.5" fill="#7f4c28" stroke="#fff" stroke-width="1"/>`;
    }
    if (d.styRev > 0){
      const yR = yRev(d.styRev);
      svg += `<circle cx="${cx + barW/2 + 2}" cy="${yR}" r="3.5" fill="#bfa57c" stroke="#fff" stroke-width="1"/>`;
    }
    svg += `<text x="${cx}" y="${yBase + 14}" text-anchor="middle" fill="var(--ink-2)" font-size="10" font-weight="500">${d.label}</text>`;
    const deltaSign = d.deltaRn >= 0 ? '+' : '';
    const deltaCol = d.deltaRn > 0 ? '#3d7a4b' : d.deltaRn < 0 ? '#a83b3b' : 'var(--ink-3)';
    svg += `<text x="${cx}" y="${yBase + 27}" text-anchor="middle" fill="${deltaCol}" font-size="9" font-weight="600">${deltaSign}${d.deltaRn}</text>`;
    const fmtPeakDate = (ymdN) => {
      if (!ymdN) return '—';
      const dt = ymdToDate(ymdN);
      const dowIT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      return dowIT[dt.getDay()] + ' ' + pad2(dt.getDate()) + '/' + pad2(dt.getMonth()+1);
    };
    const curPeakStr = d.curPeak.rn > 0 ? `${fmtPeakDate(d.curPeak.ymd)} (${d.curPeak.rn} RN)` : '—';
    const styPeakOrigStr = d.styPeak.rn > 0 ? (() => {
      const dt = ymdToDate(d.styPeak.ymd);
      const dtOrig = new Date(dt); dtOrig.setDate(dtOrig.getDate() - 364);
      const dowIT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      return `${dowIT[dtOrig.getDay()]} ${pad2(dtOrig.getDate())}/${pad2(dtOrig.getMonth()+1)}/${dtOrig.getFullYear()} (${d.styPeak.rn} RN)`;
    })() : '—';
    const tip = `${d.label}\n─────────────────\nPickup OTB:  ${d.curRn} RN · ${fmtEUR(d.curRev)}\n  top day: ${curPeakStr}\nPickup STLY: ${d.styRn} RN · ${fmtEUR(d.styRev)}\n  top day: ${styPeakOrigStr}\nΔ RN:        ${deltaSign}${d.deltaRn}\nΔ Revenue:   ${d.deltaRev >= 0 ? '+' : ''}${fmtEUR(d.deltaRev)}${(function(){
      if (!d.curByStruct && !d.styByStruct) return '';
      const labels = { firenze: 'Firenze Suite', condotta: 'Condotta 16', alfani: 'Palazzo Alfani', davids: "Enis Guesthouse" };
      let s = '\n─────────────────\nBreakdown by property:';
      for (const sk of ['firenze','condotta','alfani','davids']){
        const cs = (d.curByStruct && d.curByStruct[sk]) || {rn:0,rev:0};
        const ss = (d.styByStruct && d.styByStruct[sk]) || {rn:0,rev:0};
        if (cs.rn === 0 && ss.rn === 0) continue;
        s += `\n  ${labels[sk]}:`;
        s += `\n    OTB ${cs.rn} RN · ${fmtEUR(cs.rev)}`;
        s += `\n    STLY ${ss.rn} RN · ${fmtEUR(ss.rev)}`;
      }
      return s;
    })()}`;
    svg += `<rect x="${cx - groupW/2}" y="${MARGIN.top}" width="${groupW}" height="${innerH + 20}" fill="transparent"><title>${tip}</title></rect>`;
  }
  svg += `<line x1="${MARGIN.left}" y1="${MARGIN.top + innerH}" x2="${W - MARGIN.right}" y2="${MARGIN.top + innerH}" stroke="var(--ink-3)" stroke-width="1"/>`;
  svg += `</svg>`;
  wrapEl.innerHTML = svg;
  if (legendEl){
    const structLbl = (sel === 'both') ? 'All properties (aggregato)'
                    : (sel === 'firenze') ? 'Firenze Suite'
                    : (sel === 'condotta') ? 'Condotta 16'
                    : (sel === 'alfani') ? 'Palazzo Alfani' : (sel === 'davids') ? "Enis Guesthouse" : sel;
    legendEl.innerHTML = `
      <span style="display:inline-flex;align-items:center;gap:6px;font-weight:600;color:var(--ink);margin-right:8px">${structLbl}</span>
      <span style="display:inline-flex;align-items:center;gap:6px"><span style="display:inline-block;width:14px;height:12px;background:${barColorCur};border-radius:2px"></span>Pickup OTB · RN</span>
      <span style="display:inline-flex;align-items:center;gap:6px"><span style="display:inline-block;width:14px;height:12px;background:${barColorSty};border-radius:2px;opacity:.85"></span>Pickup STLY · RN</span>
      <span style="display:inline-flex;align-items:center;gap:6px"><span style="display:inline-block;width:9px;height:9px;background:#7f4c28;border-radius:50%;border:1px solid #fff"></span>Pickup OTB · Revenue (right axis)</span>
      <span style="display:inline-flex;align-items:center;gap:6px"><span style="display:inline-block;width:9px;height:9px;background:#bfa57c;border-radius:50%;border:1px solid #fff"></span>Pickup STLY · Revenue (right axis)</span>
    `;
  }
};
let PIRAMIDE_DAYS = 90;
let PIRAMIDE_STRUCTS = {firenze: true, condotta: true, alfani: true};
function renderPiramide(){
  const wrapEl = document.getElementById('piramide-chart-wrap');
  const legendEl = document.getElementById('piramide-legend');
  const searchEl = document.getElementById('piramide-search-wrap');
  const pillsEl = document.getElementById('piramide-range-pills');
  const structPillsEl = document.getElementById('piramide-struct-pills');
  const labelEl = document.getElementById('piramide-range-label');
  if (!wrapEl) return;
  const DAYS = (typeof PIRAMIDE_DAYS !== 'undefined' && PIRAMIDE_DAYS > 0) ? PIRAMIDE_DAYS : 90;
  const today0 = new Date(TODAY); today0.setHours(0,0,0,0);
  if (pillsEl){
    const opts = [60, 90, 120, 180];
    pillsEl.innerHTML = opts.map(n =>
      `<button class="rt-pill ${n===DAYS?'':'off'}" data-prange="${n}" style="${n===DAYS?'border-color:var(--accent)':''}">${n}d</button>`
    ).join('');
    pillsEl.querySelectorAll('button[data-prange]').forEach(btn => {
      btn.addEventListener('click', () => {
        PIRAMIDE_DAYS = +btn.dataset.prange;
        renderPiramide();
      });
    });
  }
  if (labelEl) labelEl.textContent = `${DAYS} days`;
  if (structPillsEl){
    const sd = [
      {key:'firenze',  label:'Firenze',  color:'#3b6b9a'},
      {key:'condotta', label:'Condotta', color:'#3d7a4b'},
      {key:'alfani',   label:'Alfani',   color:'#8e5fa8'},
    ];
    structPillsEl.innerHTML = sd.map(s => {
      const on = PIRAMIDE_STRUCTS[s.key];
      return `<button class="rt-pill ${on?'':'off'}" data-pstruct="${s.key}" style="${on?'border-color:'+s.color+';color:'+s.color+';font-weight:600':''}">${s.label}</button>`;
    }).join('');
    structPillsEl.querySelectorAll('button[data-pstruct]').forEach(btn => {
      btn.addEventListener('click', () => {
        const k = btn.dataset.pstruct;
        PIRAMIDE_STRUCTS[k] = !PIRAMIDE_STRUCTS[k];
        if (!PIRAMIDE_STRUCTS.firenze && !PIRAMIDE_STRUCTS.condotta && !PIRAMIDE_STRUCTS.alfani){
          PIRAMIDE_STRUCTS[k] = true;
        }
        renderPiramide();
      });
    });
  }
  const points = [];
  const myStructKeys = new Set([
    'Condotta 16 Apartments',     // = Condotta nei compset Alfani e Firenze
    'Palazzo Alfani al David',    // = Alfani nei compset Condotta e Firenze
    'Relais Condotta',            // CAUTELA: nome simile a Condotta ma è altra struttura — lo lascio nel compset
  ]);
  myStructKeys.delete('Relais Condotta');
  for (let d = 0; d < DAYS; d++){
    const dt = new Date(today0.getTime() + d * 86400000);
    const ymdNum = dt.getFullYear()*10000 + (dt.getMonth()+1)*100 + dt.getDate();
    const isoKey = dt.toISOString().slice(0,10);
    let priceFirenze = null;
    let priceCondotta = null;
    let priceAlfani = null;
    if (typeof EXPEDIA_DATA !== 'undefined' && EXPEDIA_DATA){
      if (EXPEDIA_DATA.firenze){
        const p = EXPEDIA_DATA.firenze[isoKey];
        if (p != null && isFinite(p) && p >= 10) priceFirenze = p;
      }
      if (EXPEDIA_DATA.condotta){
        const p = EXPEDIA_DATA.condotta[isoKey];
        if (p != null && isFinite(p) && p >= 10) priceCondotta = p;
      }
      if (EXPEDIA_DATA.alfani){
        const p = EXPEDIA_DATA.alfani[isoKey];
        if (p != null && isFinite(p) && p >= 10) priceAlfani = p;
      }
    }
    const compEntries = [];  // { name, price }
    const seenNames = new Set();
    if (typeof EXPEDIA_DATA !== 'undefined' && EXPEDIA_DATA){
      if (EXPEDIA_DATA.competitors){
        for (const name in EXPEDIA_DATA.competitors){
          if (myStructKeys.has(name)) continue;
          if (seenNames.has(name)) continue;
          const p = EXPEDIA_DATA.competitors[name][isoKey];
          if (p != null && isFinite(p) && p >= 10){
            compEntries.push({ name, price: p });
            seenNames.add(name);
          }
        }
      }
      if (EXPEDIA_DATA.competitors_alfani){
        for (const name in EXPEDIA_DATA.competitors_alfani){
          if (myStructKeys.has(name)) continue;
          if (seenNames.has(name)) continue;
          const p = EXPEDIA_DATA.competitors_alfani[name][isoKey];
          if (p != null && isFinite(p) && p >= 10){
            compEntries.push({ name, price: p });
            seenNames.add(name);
          }
        }
      }
      if (EXPEDIA_DATA.competitors_firenze){
        for (const name in EXPEDIA_DATA.competitors_firenze){
          if (myStructKeys.has(name)) continue;
          if (seenNames.has(name)) continue;
          const p = EXPEDIA_DATA.competitors_firenze[name][isoKey];
          if (p != null && isFinite(p) && p >= 10){
            compEntries.push({ name, price: p });
            seenNames.add(name);
          }
        }
      }
      if (EXPEDIA_DATA.competitors_davids){
        for (const name in EXPEDIA_DATA.competitors_davids){
          if (myStructKeys.has(name)) continue;
          if (seenNames.has(name)) continue;
          const p = EXPEDIA_DATA.competitors_davids[name][isoKey];
          if (p != null && isFinite(p) && p >= 10){
            compEntries.push({ name, price: p });
            seenNames.add(name);
          }
        }
      }
    }
    let compMin = null, compMax = null, compMed = null;
    let compMinName = null, compMaxName = null;
    if (compEntries.length > 0){
      compEntries.sort((a,b) => a.price - b.price);
      compMin = compEntries[0].price;
      compMinName = compEntries[0].name;
      compMax = compEntries[compEntries.length - 1].price;
      compMaxName = compEntries[compEntries.length - 1].name;
      compMed = compEntries[Math.floor(compEntries.length/2)].price;
    }
    points.push({
      d, ymdNum, dt, dow: dt.getDay(),
      firenze: priceFirenze,
      condotta: priceCondotta,
      alfani: priceAlfani,
      compMin, compMax, compMed, compN: compEntries.length,
      compMinName, compMaxName,
    });
  }
  const W = Math.max(900, wrapEl.clientWidth || 1000);
  const H = 360;
  const MARGIN = { top: 20, right: 16, bottom: 50, left: 56 };
  const innerW = W - MARGIN.left - MARGIN.right;
  const innerH = H - MARGIN.top - MARGIN.bottom;
  let yMin = Infinity, yMax = -Infinity;
  for (const p of points){
    for (const v of [p.firenze, p.condotta, p.alfani, p.compMin, p.compMax]){
      if (v != null && isFinite(v)){
        if (v < yMin) yMin = v;
        if (v > yMax) yMax = v;
      }
    }
  }
  if (!isFinite(yMin)){ yMin = 100; yMax = 400; }
  const range = yMax - yMin;
  yMin = Math.max(0, yMin - range * 0.10);
  yMax = yMax + range * 0.10;
  const xScale = i => MARGIN.left + (i / Math.max(1, DAYS - 1)) * innerW;
  const yScale = v => MARGIN.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  const yTicks = [];
  for (let i = 0; i <= 5; i++){
    const v = yMin + (yMax - yMin) * i / 5;
    yTicks.push({ v, y: yScale(v) });
  }
  const xTicks = [];
  let lastMonth = -1;
  for (let i = 0; i < points.length; i++){
    const p = points[i];
    const mo = p.dt.getMonth();
    if (mo !== lastMonth){
      lastMonth = mo;
      xTicks.push({ i, x: xScale(i), label: p.dt.toLocaleDateString('en-GB', {month:'short'}) + (i === 0 ? ' ' + p.dt.getFullYear() : '') });
    }
  }
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet" style="display:block;font-family:'DM Mono',monospace;font-size:10px">`;
  for (const t of yTicks){
    svg += `<line x1="${MARGIN.left}" y1="${t.y}" x2="${W - MARGIN.right}" y2="${t.y}" stroke="rgba(0,0,0,.06)" stroke-width="1"/>`;
    svg += `<text x="${MARGIN.left - 6}" y="${t.y + 3}" text-anchor="end" fill="var(--ink-3)" font-size="9">${'€' + Math.round(t.v)}</text>`;
  }
  for (let i = 0; i < points.length; i++){
    const p = points[i];
    if (p.dow === 5 || p.dow === 6){  // Fri+Sat (notti weekend)
      const x = xScale(i);
      const xNext = i+1 < points.length ? xScale(i+1) : x + innerW/DAYS;
      svg += `<rect x="${x}" y="${MARGIN.top}" width="${xNext - x}" height="${innerH}" fill="rgba(195,131,59,.025)"/>`;
    }
  }
  const compAreaPoints = [];
  for (let i = 0; i < points.length; i++){
    const p = points[i];
    if (p.compMax != null){
      compAreaPoints.push({x: xScale(i), y: yScale(p.compMax)});
    }
  }
  for (let i = points.length - 1; i >= 0; i--){
    const p = points[i];
    if (p.compMin != null){
      compAreaPoints.push({x: xScale(i), y: yScale(p.compMin)});
    }
  }
  if (compAreaPoints.length > 2){
    const pathStr = compAreaPoints.map((pt, i) => (i === 0 ? 'M' : 'L') + pt.x.toFixed(1) + ',' + pt.y.toFixed(1)).join(' ') + ' Z';
    svg += `<path d="${pathStr}" fill="rgba(245,158,90,.18)" stroke="none"/>`;
  }
  const compMedPath = [];
  for (let i = 0; i < points.length; i++){
    const p = points[i];
    if (p.compMed != null){
      compMedPath.push((compMedPath.length === 0 ? 'M' : 'L') + xScale(i).toFixed(1) + ',' + yScale(p.compMed).toFixed(1));
    }
  }
  if (compMedPath.length > 0){
    svg += `<path d="${compMedPath.join(' ')}" fill="none" stroke="rgba(195,100,30,.45)" stroke-width="1" stroke-dasharray="3 3"/>`;
  }
  function buildLine(key, color, strokeWidth){
    const segs = [];
    let cur = [];
    for (let i = 0; i < points.length; i++){
      const v = points[i][key];
      if (v != null){
        cur.push({x: xScale(i), y: yScale(v)});
      } else {
        if (cur.length) segs.push(cur);
        cur = [];
      }
    }
    if (cur.length) segs.push(cur);
    let s = '';
    for (const seg of segs){
      if (seg.length < 1) continue;
      const path = seg.map((pt, i) => (i === 0 ? 'M' : 'L') + pt.x.toFixed(1) + ',' + pt.y.toFixed(1)).join(' ');
      s += `<path d="${path}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"/>`;
    }
    return s;
  }
  if (PIRAMIDE_STRUCTS.alfani)   svg += buildLine('alfani',   '#8e5fa8', 2);  // viola
  if (PIRAMIDE_STRUCTS.firenze)  svg += buildLine('firenze',  '#3b6b9a', 2);  // blu
  if (PIRAMIDE_STRUCTS.condotta) svg += buildLine('condotta', '#3d7a4b', 2);  // verde
  for (const t of xTicks){
    svg += `<line x1="${t.x}" y1="${MARGIN.top + innerH}" x2="${t.x}" y2="${MARGIN.top + innerH + 4}" stroke="var(--ink-3)" stroke-width="1"/>`;
    svg += `<text x="${t.x}" y="${MARGIN.top + innerH + 16}" text-anchor="middle" fill="var(--ink-3)" font-size="10">${t.label}</text>`;
  }
  svg += `<line x1="${MARGIN.left}" y1="${MARGIN.top + innerH}" x2="${W - MARGIN.right}" y2="${MARGIN.top + innerH}" stroke="var(--ink-3)" stroke-width="1"/>`;
  for (let i = 0; i < points.length; i++){
    const p = points[i];
    const x = xScale(i);
    const w = innerW / DAYS;
    const dateLabel = pad2(p.dt.getDate()) + '/' + pad2(p.dt.getMonth()+1) + '/' + p.dt.getFullYear();
    const dowIT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][p.dow];
    let tip = `${dowIT} ${dateLabel}\n`;
    tip += '─────────────────\n';
    if (PIRAMIDE_STRUCTS.firenze  && p.firenze  != null) tip += `Firenze Suite:    €${Math.round(p.firenze)}\n`;
    if (PIRAMIDE_STRUCTS.condotta && p.condotta != null) tip += `Condotta 16:      €${Math.round(p.condotta)}\n`;
    if (PIRAMIDE_STRUCTS.alfani   && p.alfani   != null) tip += `Palazzo Alfani:   €${Math.round(p.alfani)}\n`;
    if (p.compMin != null){
      tip += '─────────────────\n';
      tip += `Compset: ${p.compN} competitor\n`;
      tip += `  max:  €${Math.round(p.compMax)}  (${p.compMaxName || ''})\n`;
      tip += `  med:  €${Math.round(p.compMed)}\n`;
      tip += `  min:  €${Math.round(p.compMin)}  (${p.compMinName || ''})\n`;
    }
    svg += `<rect x="${x - w/2}" y="${MARGIN.top}" width="${w}" height="${innerH}" fill="transparent"><title>${tip}</title></rect>`;
  }
  svg += `</svg>`;
  wrapEl.innerHTML = svg;
  if (searchEl){
    const searchData = [];
    let maxCur = 0;
    for (let i = 0; i < points.length; i++){
      const p = points[i];
      const isoK = p.dt.toISOString().slice(0,10);
      const cur = (EXPEDIA_DATA && EXPEDIA_DATA.search_current) ? EXPEDIA_DATA.search_current[isoK] : null;
      const prev = (EXPEDIA_DATA && EXPEDIA_DATA.search_previous) ? EXPEDIA_DATA.search_previous[isoK] : null;
      if (cur != null && isFinite(cur) && cur > maxCur) maxCur = cur;
      searchData.push({ cur, prev, dt: p.dt, dow: p.dow });
    }
    if (maxCur <= 0) maxCur = 1;  // fallback
    const SH = 90;
    const SUB_M = { top: 14, right: MARGIN.right, bottom: 18, left: MARGIN.left };
    const subInnerH = SH - SUB_M.top - SUB_M.bottom;
    const yBase = SUB_M.top + subInnerH;  // base (asse zero)
    const yScaleS = (cur) => yBase - (cur / maxCur) * subInnerH;
    let s2 = `<svg viewBox="0 0 ${W} ${SH}" width="100%" preserveAspectRatio="xMidYMid meet" style="display:block;font-family:'DM Mono',monospace;font-size:10px">`;
    for (let i = 0; i < searchData.length; i++){
      const sd = searchData[i];
      if (sd.dow === 5 || sd.dow === 6){
        const x = xScale(i);
        const xNext = i+1 < searchData.length ? xScale(i+1) : x + innerW/DAYS;
        s2 += `<rect x="${x}" y="${SUB_M.top}" width="${xNext - x}" height="${subInnerH}" fill="rgba(195,131,59,.03)"/>`;
      }
    }
    s2 += `<line x1="${SUB_M.left}" y1="${yBase}" x2="${W - SUB_M.right}" y2="${yBase}" stroke="rgba(0,0,0,.2)" stroke-width="1"/>`;
    const y50 = yScaleS(maxCur * 0.5);
    s2 += `<line x1="${SUB_M.left}" y1="${y50}" x2="${W - SUB_M.right}" y2="${y50}" stroke="rgba(0,0,0,.06)" stroke-width="1" stroke-dasharray="2 3"/>`;
    const barW = Math.max(1, (innerW / DAYS) * 0.85);
    for (let i = 0; i < searchData.length; i++){
      const sd = searchData[i];
      if (sd.cur == null || !isFinite(sd.cur) || sd.cur <= 0) continue;
      const x = xScale(i) - barW / 2;
      const yTop = yScaleS(sd.cur);
      const h = yBase - yTop;
      const intensity = sd.cur / maxCur;  // 0..1
      const r = Math.round(196 + (168 - 196) * intensity);
      const g = Math.round(130 + (59 - 130) * intensity);
      const b = Math.round(59 + (59 - 59) * intensity);
      const alpha = 0.45 + 0.35 * intensity;  // 0.45..0.80
      const color = `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
      s2 += `<rect x="${x}" y="${yTop}" width="${barW}" height="${h}" fill="${color}"/>`;
    }
    s2 += `<text x="${SUB_M.left - 6}" y="${yBase + 3}" text-anchor="end" fill="var(--ink-3)" font-size="9">0</text>`;
    s2 += `<text x="${SUB_M.left - 6}" y="${y50 + 3}" text-anchor="end" fill="var(--ink-3)" font-size="9">${Math.round(maxCur*0.5).toLocaleString('en-GB')}</text>`;
    s2 += `<text x="${SUB_M.left - 6}" y="${SUB_M.top + 9}" text-anchor="end" fill="rgba(168,59,59,.85)" font-size="9" font-weight="600">${Math.round(maxCur).toLocaleString('en-GB')}</text>`;
    s2 += `<text x="${W - SUB_M.right}" y="${SUB_M.top - 2}" text-anchor="end" fill="var(--ink-2)" font-size="10" font-weight="600">Search intensity · % vs peak</text>`;
    const dowITs = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    for (let i = 0; i < searchData.length; i++){
      const sd = searchData[i];
      const x = xScale(i);
      const w = innerW / DAYS;
      const dateLabel = pad2(sd.dt.getDate()) + '/' + pad2(sd.dt.getMonth()+1) + '/' + sd.dt.getFullYear();
      let tipS = `${dowITs[sd.dow]} ${dateLabel}\n─────────────────\n`;
      if (sd.cur != null) {
        const pctOfPeak = (sd.cur / maxCur * 100).toFixed(0);
        tipS += `Searches:       ${Math.round(sd.cur).toLocaleString('en-GB')}\n`;
        tipS += `% del picco:    ${pctOfPeak}%\n`;
      }
      if (sd.prev != null) tipS += `(2025 cumul.):  ${Math.round(sd.prev).toLocaleString('en-GB')}\n`;
      if (sd.cur == null) tipS += 'No data Expedia\n';
      s2 += `<rect x="${x - w/2}" y="${SUB_M.top}" width="${w}" height="${subInnerH}" fill="transparent"><title>${tipS}</title></rect>`;
    }
    s2 += `</svg>`;
    searchEl.innerHTML = s2;
  }
  legendEl.innerHTML = `
    <span style="display:inline-flex;align-items:center;gap:6px"><span style="display:inline-block;width:18px;height:2px;background:#3d7a4b"></span>Condotta 16 (price Expedia)</span>
    <span style="display:inline-flex;align-items:center;gap:6px"><span style="display:inline-block;width:18px;height:2px;background:#8e5fa8"></span>Palazzo Alfani (price Expedia)</span>
    <span style="display:inline-flex;align-items:center;gap:6px"><span style="display:inline-block;width:18px;height:2px;background:#3b6b9a"></span>Firenze Suite (price Expedia)</span>
    <span style="display:inline-flex;align-items:center;gap:6px"><span style="display:inline-block;width:18px;height:12px;background:rgba(245,158,90,.30);border:1px solid rgba(195,100,30,.40)"></span>Compset range (min-max competitor)</span>
    <span style="display:inline-flex;align-items:center;gap:6px"><span style="display:inline-block;width:18px;height:2px;background:rgba(195,100,30,.45);border-top:1px dashed rgba(195,100,30,.7)"></span>Compset median</span>
    <span style="display:inline-flex;align-items:center;gap:6px"><span style="display:inline-block;width:9px;height:9px;background:rgba(168,59,59,.7)"></span>Search intensity (dark = peak)</span>
  `;
}
/* ============================================================
   SELL STRATEGY: TOGGLE BLOCCHI COLONNE (utile su mobile)
   I 6 blocchi: event, pickup, stly, pkstly, expedia, mlos. RMES + OTB sempre visibili.
   ============================================================ */
const SELL_COLS_KEY = 'sell_cols_visibility_v3';
const SELL_COLS_DEFAULTS_DESKTOP = { event:true, pickup:true, stly:true, pkstly:true, expedia:true, allrt:false };
const SELL_COLS_DEFAULTS_MOBILE  = { event:false, pickup:true, stly:true, pkstly:false, expedia:false, allrt:false };
function _isMobileViewport(){
  return typeof window !== 'undefined' && window.innerWidth < 720;
}
function _loadSellColsState(){
  try {
    const raw = localStorage.getItem(SELL_COLS_KEY);
    if (raw){
      const parsed = JSON.parse(raw);
      const defaults = _isMobileViewport() ? SELL_COLS_DEFAULTS_MOBILE : SELL_COLS_DEFAULTS_DESKTOP;
      return Object.assign({}, defaults, parsed);
    }
  } catch(e){}
  return _isMobileViewport() ? Object.assign({}, SELL_COLS_DEFAULTS_MOBILE) : Object.assign({}, SELL_COLS_DEFAULTS_DESKTOP);
}
function _saveSellColsState(state){
  try { localStorage.setItem(SELL_COLS_KEY, JSON.stringify(state)); } catch(e){}
}
function _applySellColsState(){
  const state = _loadSellColsState();
  const tbl = document.querySelector('#sell-table-wrap table.sell-table');
  if (!tbl) return;
  tbl.setAttribute('data-hide-event',   state.event   ? '0' : '1');
  tbl.setAttribute('data-hide-pickup',  state.pickup  ? '0' : '1');
  tbl.setAttribute('data-hide-stly',    state.stly    ? '0' : '1');
  tbl.setAttribute('data-hide-pkstly',  state.pkstly  ? '0' : '1');
  tbl.setAttribute('data-hide-expedia', state.expedia ? '0' : '1');
}
function _renderSellColsPills(){
  const wrap = document.getElementById('sell-cols-pills');
  if (!wrap) return;
  const state = _loadSellColsState();
  const blocks = [
    { key:'event',   label:'Event' },
    { key:'pickup',  label:'Pickup' },
    { key:'stly',    label:'STLY' },
    { key:'pkstly',  label:'Pickup STLY' },
    { key:'expedia', label:'Expedia' },
    { key:'allrt',   label:'All RT', highlight:true },
  ];
  wrap.innerHTML = blocks.map(b => {
    const on = !!state[b.key];
    const extra = b.highlight ? 'style="border-color:#c4823b;background:'+(on?'rgba(195,131,59,0.18)':'rgba(195,131,59,0.04)')+';color:#7a4f1c;font-weight:600"' : '';
    const tooltip = b.key === 'allrt' ? ' title="Show extra columns inside the RMES group with price + MLOS for each non-base room type (Suite, Trilocale, Attico etc.). Prices are computed with RT-specific multipliers (A · Demand (occ), B · Demand (Price), C · Pace Trend, D · Online Pricing, E · Demand (Expedia) — tutti a livello struttura."' : '';
    return `<button class="sell-col-pill ${on?'on':''}" data-sell-col="${b.key}" ${extra}${tooltip}>${b.label}</button>`;
  }).join('');
  wrap.querySelectorAll('button[data-sell-col]').forEach(btn => {
    btn.onclick = () => {
      const key = btn.dataset.sellCol;
      const st = _loadSellColsState();
      st[key] = !st[key];
      _saveSellColsState(st);
      if (key === 'allrt'){
        if (typeof CURRENT_STRUCT !== 'undefined' && typeof renderSellStrategy === 'function'){
          renderSellStrategy(CURRENT_STRUCT);
        }
      } else {
        _applySellColsState();
        _renderSellColsPills();
      }
    };
  });
}
function _renderSellRtFilterPills(sel){
  const wrap = document.getElementById('sell-rt-filter-pills');
  if (!wrap) return;
  const rooms = (typeof structRoomsFor === 'function') ? structRoomsFor(sel) : null;
  if (!rooms){
    wrap.innerHTML = '';
    return;
  }
  const rtList = Object.keys(rooms);
  const palette = ['#3b6b9a','#a83b3b','#4a7c59','#c4823b','#8e5fa8','#3b6b6b','#c47d7d','#5e8a3a'];
  const rtColors = {};
  rtList.forEach((rt, i) => { rtColors[rt] = palette[i % palette.length]; });
  const pills = [
    { key:null, label:'All', color:'var(--ink)' }
  ];
  for (const rt of rtList){
    pills.push({ key:rt, label:rt, color:rtColors[rt] });
  }
  wrap.innerHTML = pills.map(p => {
    const on = (SELL_RT_FILTER === p.key);
    const style = on
      ? `border-color:${p.color};background:${p.color};color:#fff;font-weight:700`
      : `border-color:${p.color};background:#fff;color:${p.color}`;
    const dataVal = p.key === null ? 'all' : escapeHtml(p.key);
    return `<button class="sell-col-pill" data-sell-rt="${dataVal}" style="${style};padding:4px 12px;border-radius:14px;border-width:1.5px;border-style:solid;cursor:pointer;font-size:11px;font-family:'DM Sans',sans-serif">${escapeHtml(p.label)}</button>`;
  }).join('');
  wrap.querySelectorAll('button[data-sell-rt]').forEach(btn => {
    btn.onclick = () => {
      const v = btn.dataset.sellRt;
      SELL_RT_FILTER = (v === 'all') ? null : v;
      if (typeof renderSellStrategy === 'function'){
        renderSellStrategy(CURRENT_STRUCT);
      }
    };
  });
}
/* ============================================================
   PRICING IN PROCESS — daily per-RT residual pricing
   ============================================================ */
let PRI_OCC_DELTA_PP = 0;
let PRI_RANGE_DAYS = 60;
let PRI_START_YMD = null;
let PRI_START_USER_SET = false;
const PRI_BOOKING_MARKUP = 0.12;
const PRI_START_FACTOR   = 0.80;
function priceVsSoldHTML(newPrice, soldAdr, compact){
  if (!soldAdr || soldAdr <= 0) return '';
  if (!newPrice || newPrice <= 0) return '';
  const dEur = newPrice - soldAdr;
  const dPct = dEur / soldAdr;
  const isUp = dEur >= 0;
  const color = isUp ? '#3d7a4b' : '#a83b3b';
  const sign = isUp ? '+' : '';
  const fz = compact ? 9 : 9.5;
  const eurTxt = (Math.abs(dEur) < 1 ? '0' : Math.round(dEur).toLocaleString('en-GB'));
  const pctTxt = (dPct*100).toFixed(0);
  return `<br><small style="font-size:${fz}px;color:${color};font-weight:500">vs ${fmtEUR(soldAdr)} · ${sign}${eurTxt}€ ${sign}${pctTxt}%</small>`;
}
let _APD_CACHE = {};  // cache di aggPricingDaily, invalidata al reload dati (_invalidatePaceAggCache)
function aggPricingDaily(sel, startYmdNum, rangeDays){
  if (sel === 'both'){
    return { isBoth:true, perStruct:{
      firenze:  aggPricingDaily('firenze', startYmdNum, rangeDays),
      condotta: aggPricingDaily('condotta', startYmdNum, rangeDays),
      alfani:   aggPricingDaily('alfani', startYmdNum, rangeDays),
    }};
  }
  const _apdKey = sel + '|' + startYmdNum + '|' + rangeDays;
  if (_APD_CACHE && _APD_CACHE[_apdKey] !== undefined) return _APD_CACHE[_apdKey];
  const structKey = CFG.structures[sel].key;
  const roomsMap  = CFG.structures[sel].rooms;
  const rtList    = Object.keys(roomsMap);
  const histRev = {};
  const histRn  = {};
  const histByMoDow = {};
  for (const rt of rtList){
    histRev[rt] = 0;
    histRn[rt]  = 0;
    histByMoDow[rt] = {};
    for (let m=1; m<=12; m++){
      histByMoDow[rt][m] = {};
      for (let d=0; d<7; d++) histByMoDow[rt][m][d] = {rev:0, revCaricato:0, rn:0};
    }
  }
  const histRevCaricato = {};
  const histRevBooking = {}; // revenue lordo di prenotazioni con markup canale (qualunque OTA), per calcolare mix
  const histRnNonRimb = {};  // RN (notti) di prenotazioni "Non rimborsabile" (sconto -10% dalla flessibile)
  for (const rt of rtList){
    histRevCaricato[rt] = 0;
    histRevBooking[rt] = 0;
    histRnNonRimb[rt] = 0;
  }
  const histByMonth = {};
  for (const rt of rtList){
    histByMonth[rt] = {};
    for (let m=1; m<=12; m++) histByMonth[rt][m] = {rev:0, revCaricato:0, rn:0};
  }
  let histTot = 0;
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (b.struct !== structKey) continue;
    if (!(b.room in histRev)) continue;
    let cur = startOfDay(b.dIn);
    const end = startOfDay(b.dOut);
    while (cur < end){
      const yy = cur.getFullYear();
      if (yy === 2024 || yy === 2025){
        const mm = cur.getMonth()+1;
        const dow = cur.getDay();
        histRev[b.room] += b.revPerNight;
        histRevCaricato[b.room] += b.revPerNightCaricato;
        if (b.channelMarkup > 0){
          histRevBooking[b.room] += b.revPerNight;
        }
        if (b.isNonRefundable) histRnNonRimb[b.room] += 1;
        histRn[b.room]  += 1;
        histTot += b.revPerNight;
        histByMoDow[b.room][mm][dow].rev += b.revPerNight;
        histByMoDow[b.room][mm][dow].revCaricato += b.revPerNightCaricato;
        histByMoDow[b.room][mm][dow].rn  += 1;
        histByMonth[b.room][mm].rev += b.revPerNight;
        histByMonth[b.room][mm].revCaricato += b.revPerNightCaricato;
        histByMonth[b.room][mm].rn  += 1;
      }
      cur = addDays(cur, 1);
    }
  }
  const mixRev = {};
  const histAdr = {};       // ADR storico LORDO (incassato medio)
  const histAdrCar = {};    // ADR storico CARICATO (price effective caricato sul PMS)
  const adrFloor = {};      // floor in lordo (per coerenza col budget)
  const mixBookingByRT = {}; // % vendite via Booking per RT (per conversione lordo→caricato)
  const mixNonRimbByRT = {}; // % notti vendute con piano "Non rimborsabile" (sconto -10%)
  for (const rt of rtList){
    mixRev[rt] = histTot>0 ? histRev[rt]/histTot : (1/rtList.length);
    histAdr[rt] = histRn[rt]>0 ? histRev[rt]/histRn[rt] : 0;
    histAdrCar[rt] = histRn[rt]>0 ? histRevCaricato[rt]/histRn[rt] : 0;
    adrFloor[rt] = histAdr[rt];
    mixBookingByRT[rt] = histRev[rt]>0 ? histRevBooking[rt]/histRev[rt] : 0;
    mixNonRimbByRT[rt] = histRn[rt]>0 ? histRnNonRimb[rt]/histRn[rt] : 0;
  }
  const dowOccurrencesByMo = {};
  for (let m=1; m<=12; m++){
    dowOccurrencesByMo[m] = {0:0,1:0,2:0,3:0,4:0,5:0,6:0};
  }
  for (const yy of [2024, 2025]){
    for (let m=1; m<=12; m++){
      const dim = new Date(yy, m, 0).getDate();
      for (let dd=1; dd<=dim; dd++){
        const dow = new Date(yy, m-1, dd).getDay();
        dowOccurrencesByMo[m][dow]++;
      }
    }
  }
  function occHistForMoDow(rt, m, dow){
    const occ = dowOccurrencesByMo[m][dow];
    const rooms = roomsMap[rt];
    if (occ === 0 || rooms === 0) return 0;
    const rn = histByMoDow[rt][m][dow].rn;
    return rn / (rooms * occ);
  }
  const baseRT = CFG.structures[sel].baseRT || rtList[0];
  function histAdrForMoDow(rt, m, dow){
    const b1 = histByMoDow[rt][m][dow];
    if (b1.rn >= 3) return b1.rev / b1.rn;
    const b2 = histByMonth[rt][m];
    if (b2.rn >= 5) return b2.rev / b2.rn;
    return histAdr[rt];
  }
  function histAdrCarForMoDow(rt, m, dow){
    const b1 = histByMoDow[rt][m][dow];
    if (b1.rn >= 3) return b1.revCaricato / b1.rn;
    const b2 = histByMonth[rt][m];
    if (b2.rn >= 5) return b2.revCaricato / b2.rn;
    return histAdrCar[rt];
  }
  const supplementoStorico = {};
  for (const rt of rtList){
    supplementoStorico[rt] = histAdrCar[rt] - histAdrCar[baseRT];
  }
  const isFirenze  = (structKey === CFG.structures.firenze.key);
  const isCondotta = (structKey === CFG.structures.condotta.key);
  const isAlfani   = (structKey === CFG.structures.alfani.key);
  const HIGH_SEASON = isCondotta
    ? new Set([5,6,7,9,10])
    : new Set([5,6,9,10]);   // Firenze + Alfani
  const SUPP_OVERRIDE_FS = {
    'Suite': { alta: 20 },
  };
  const SUPP_OVERRIDE_C16 = {};
  const SUPP_OVERRIDE_ALF = {};
  const structOverride = isFirenze ? SUPP_OVERRIDE_FS : (isCondotta ? SUPP_OVERRIDE_C16 : SUPP_OVERRIDE_ALF);
  const supplementoStagione = {};  // {rt: {alta:€, bassa:€}}
  for (const rt of rtList){
    let altaRevC=0, altaRn=0, bassaRevC=0, bassaRn=0;
    let altaBaseRevC=0, altaBaseRn=0, bassaBaseRevC=0, bassaBaseRn=0;
    for (let m=1; m<=12; m++){
      const isHigh = HIGH_SEASON.has(m);
      const bRT = histByMonth[rt][m];
      const bBase = histByMonth[baseRT][m];
      if (isHigh){
        altaRevC += bRT.revCaricato; altaRn += bRT.rn;
        altaBaseRevC += bBase.revCaricato; altaBaseRn += bBase.rn;
      } else {
        bassaRevC += bRT.revCaricato; bassaRn += bRT.rn;
        bassaBaseRevC += bBase.revCaricato; bassaBaseRn += bBase.rn;
      }
    }
    const altaRtAdr   = altaRn>0    ? altaRevC/altaRn       : 0;
    const altaBaseAdr = altaBaseRn>0? altaBaseRevC/altaBaseRn : 0;
    const bassaRtAdr   = bassaRn>0    ? bassaRevC/bassaRn       : 0;
    const bassaBaseAdr = bassaBaseRn>0? bassaBaseRevC/bassaBaseRn : 0;
    const round5 = (v) => Math.round(v/5)*5;
    const rawAlta = (altaRtAdr>0 && altaBaseAdr>0) ? (altaRtAdr - altaBaseAdr) : supplementoStorico[rt];
    const rawBassa = (bassaRtAdr>0 && bassaBaseAdr>0) ? (bassaRtAdr - bassaBaseAdr) : supplementoStorico[rt];
    const ov = structOverride[rt] || {};
    supplementoStagione[rt] = {
      alta:  (ov.alta  !== undefined) ? ov.alta  : round5(rawAlta),
      bassa: (ov.bassa !== undefined) ? ov.bassa : round5(rawBassa),
    };
  }
  function suppForMonth(rt, m){
    if (rt === baseRT) return 0;
    return HIGH_SEASON.has(m) ? supplementoStagione[rt].alta : supplementoStagione[rt].bassa;
  }
  function suppStoricoForMoDow(rt, m, dow){
    if (rt === baseRT) return 0;
    const adrRT  = histAdrCarForMoDow(rt, m, dow);
    const adrBase = histAdrCarForMoDow(baseRT, m, dow);
    if (adrRT > 0 && adrBase > 0) return adrRT - adrBase;
    return supplementoStorico[rt];
  }
  function perfRatioForMoDow(rt, m, dow){
    if (rt === baseRT) return 1;
    const occRT = occHistForMoDow(rt, m, dow);
    const occBaseHist = occHistForMoDow(baseRT, m, dow);
    const ym = (() => {
      const fmonths = fiscalMonths();
      for (const x of fmonths){
        if ((x % 100) === m) return x;
      }
      return null;
    })();
    const occBudgetRaw = ym ? budgetMonthlyFor(sel, ym, 'occ') : 0;
    const occBudget = Math.max(0.01, Math.min(1.0, occBudgetRaw + PRI_OCC_DELTA_PP/100));
    let reference = 0;
    if (occBaseHist > 0 && occBudget > 0) reference = Math.min(occBaseHist, occBudget);
    else if (occBaseHist > 0) reference = occBaseHist;
    else if (occBudget > 0) reference = occBudget;
    if (occRT > 0 && reference > 0) return occRT / reference;
    const rnRT_m = histByMonth[rt][m].rn;
    const rnBase_m = histByMonth[baseRT][m].rn;
    const occBaseDays = (() => {
      let s=0; for (let dd=0; dd<7; dd++) s += dowOccurrencesByMo[m][dd]; return s;
    })();
    if (rnRT_m > 0 && occBaseDays > 0){
      const occRTm = rnRT_m / (roomsMap[rt] * occBaseDays);
      const occBaseHistM = rnBase_m > 0 ? (rnBase_m / (roomsMap[baseRT] * occBaseDays)) : 0;
      let refM = 0;
      if (occBaseHistM > 0 && occBudget > 0) refM = Math.min(occBaseHistM, occBudget);
      else if (occBaseHistM > 0) refM = occBaseHistM;
      else if (occBudget > 0) refM = occBudget;
      if (refM > 0) return occRTm / refM;
    }
    return 1.0;
  }
  const otbByDayRT = {};
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (b.struct !== structKey) continue;
    if (!(b.room in roomsMap)) continue;
    if (b.bookYmd > TODAY_YMD) continue;
    let cur = startOfDay(b.dIn);
    const end = startOfDay(b.dOut);
    while (cur < end){
      const k = ymd(cur);
      if (!otbByDayRT[k]) otbByDayRT[k] = {};
      if (!otbByDayRT[k][b.room]) otbByDayRT[k][b.room] = {rev:0, revCaricato:0, rn:0};
      otbByDayRT[k][b.room].rev += b.revPerNight;
      otbByDayRT[k][b.room].revCaricato += b.revPerNightCaricato;
      otbByDayRT[k][b.room].rn  += 1;
      cur = addDays(cur, 1);
    }
  }
  const fmonthsAll = fiscalMonths();
  const fmonthSetAll = new Set(fmonthsAll);
  const monthOtb = {}; // ym -> {rev, rn}
  for (const ym of fmonthsAll) monthOtb[ym] = {rev:0, rn:0};
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (b.struct !== structKey) continue;
    if (!(b.room in roomsMap)) continue;
    if (b.bookYmd > TODAY_YMD) continue;
    const alloc = monthAllocate(b.dIn, b.dOut, b.revPerNight);
    for (const k in alloc){
      const ym = +k;
      if (!fmonthSetAll.has(ym)) continue;
      monthOtb[ym].rev += alloc[k].rev;
      monthOtb[ym].rn  += alloc[k].rn;
    }
  }
  const startDate = ymdToDate(startYmdNum);
  const rows = [];
  for (let i=0; i<rangeDays; i++){
    const d = addDays(startDate, i);
    const k = ymd(d);
    const y = d.getFullYear(), mo = d.getMonth()+1, day = d.getDate();
    const dim = new Date(y, mo, 0).getDate();
    const ym = y*100 + mo;
    const monthRevTgt = budgetMonthlyFor(sel, ym, 'rev');
    const monthOccTgtRaw = budgetMonthlyFor(sel, ym, 'occ');
    const monthOccTgt = Math.max(0.01, Math.min(1.0, monthOccTgtRaw + PRI_OCC_DELTA_PP/100));
    const monthOtbInfo = monthOtb[ym] || {rev:0, rn:0};
    const monthTargetRev = monthRevTgt;
    const monthResidualRev = Math.max(0, monthTargetRev - monthOtbInfo.rev);
    const dayResidualRev = dim>0 ? monthResidualRev/dim : 0;
    const rtData = {};
    let totalAvail = 0;
    let weightSum = 0;
    const weights = {};
    for (const rt of rtList){
      const rooms = roomsMap[rt];
      const otb = (otbByDayRT[k] && otbByDayRT[k][rt]) || {rev:0, rn:0};
      const roomsAvailable = Math.max(0, rooms - otb.rn);
      const w = mixRev[rt] * roomsAvailable;
      weights[rt] = w;
      weightSum += w;
      totalAvail += roomsAvailable;
      rtData[rt] = { rooms, roomsAvailable, otb };
    }
    for (const rt of rtList){
      const slot = rtData[rt];
      const otb = slot.otb;
      const roomsAvailable = slot.roomsAvailable;
      const dayRevRTResidual = (weightSum>0 && roomsAvailable>0)
        ? dayResidualRev * (weights[rt] / weightSum)
        : 0;
      const MATH_CAP_MULTIPLIER = 2.5;
      const adrMathRaw = roomsAvailable>0 ? dayRevRTResidual/roomsAvailable : 0;
      const adrHistTmp = histAdr[rt] || 0;
      const adrMath = (adrHistTmp > 0 && adrMathRaw > adrHistTmp * MATH_CAP_MULTIPLIER)
        ? adrHistTmp * MATH_CAP_MULTIPLIER
        : adrMathRaw;
      const adrMathCapped = adrMath !== adrMathRaw;
      const adrHist = histAdr[rt] || 0;
      const floor = adrFloor[rt] || 0;
      const adrSold = otb.rn>0 ? otb.rev/otb.rn : 0;
      const adrSoldCaricato = otb.rn>0 ? otb.revCaricato/otb.rn : 0;
      let adrResidual = 0;
      let priceSource = 'none';
      if (roomsAvailable>0){
        const candMath = adrMath;
        const candFloor = floor;
        const candUpFromSold = adrSold>0 ? adrSold * 1.05 : 0;
        adrResidual = Math.max(candMath, candFloor, candUpFromSold);
        if (adrResidual === candUpFromSold && candUpFromSold > Math.max(candMath, candFloor)){
          priceSource = 'upFromSold';
        } else if (adrResidual === candFloor && candFloor > candMath){
          priceSource = 'floor';
        } else {
          priceSource = 'math';
        }
      }
      const flooredApplied = (priceSource === 'floor' || priceSource === 'upFromSold');
      const mixBookingRT = mixBookingByRT[rt] || 0;
      const mixNonRimbRT = mixNonRimbByRT[rt] || 0;
      const channelFactor = 1 + 0.12 * mixBookingRT;     // amplificatore OTA
      const nonRimbFactor = 1 - 0.10 * mixNonRimbRT;     // sconto non rimborsabile
      const totalFactor = channelFactor * nonRimbFactor;
      const adrCaricato = totalFactor>0 ? adrResidual / totalFactor : 0;
      const dayRevTgtRef = dim>0 ? (monthRevTgt * mixRev[rt]) / dim : 0;
      rtData[rt] = {
        rooms: slot.rooms,
        roomsAvailable,
        dayRevTgt: dayRevTgtRef,
        adrTarget: dayRevTgtRef>0 && slot.rooms>0 ? dayRevTgtRef/(slot.rooms) : 0,
        otbRn: otb.rn, otbRev: otb.rev,
        adrSold,                      // ADR già praticato LORDO (incassato medio)
        adrSoldCaricato,              // ADR già caricato sul PMS (netto markup canale)
        revResidual: dayRevRTResidual,
        rnResidual: roomsAvailable,
        adrMath,                      // matematica in lordo
        adrHist,
        adrFloor: floor,
        adrUpFromSold: adrSold>0 ? adrSold * 1.05 : 0,
        priceSource,
        flooredApplied,
        adrMathCapped,                // true se il target è stato cappato a 2.5x storico
        adrResidual,                  // target LORDO (= ADR media incassata che voglio)
        adrCaricato,                  // PREZZO DA CARICARE NEL PMS (Beddy-equivalente)
        mixBookingRT,                 // % storica vendite Booking per la RT
        mixNonRimbRT,                 // % storica notti vendute con piano "Non rimborsabile"
        priceLadder: (function(){
          const n = roomsAvailable;
          if (n <= 0 || adrCaricato <= 0) return [];
          if (n === 1) return [Math.max(adrCaricato, adrSoldCaricato)];
          const STEP = 1.05;
          const sumGeom = (Math.pow(STEP, n) - 1) / (STEP - 1);
          let p0 = (adrCaricato * n) / sumGeom;
          if (adrSoldCaricato > 0 && p0 < adrSoldCaricato) p0 = adrSoldCaricato;
          const out = [];
          for (let i=0; i<n; i++) out.push(p0 * Math.pow(STEP, i));
          return out;
        })(),
        adrStart: (function(){
          const n = roomsAvailable;
          if (n <= 0 || adrCaricato <= 0) return 0;
          if (n === 1) return Math.max(adrCaricato, adrSoldCaricato);
          const STEP = 1.05;
          const sumGeom = (Math.pow(STEP, n) - 1) / (STEP - 1);
          let p0 = (adrCaricato * n) / sumGeom;
          if (adrSoldCaricato > 0 && p0 < adrSoldCaricato) p0 = adrSoldCaricato;
          return p0;
        })(),
        supplemento: (function(){
          if (rt === baseRT) return 0;
          const dow = d.getDay();
          const suppHist = suppStoricoForMoDow(rt, mo, dow);
          const totalRooms = slot.rooms;
          if (totalRooms <= 1) return suppHist; // Attico → no progressione
          const perfRatio = perfRatioForMoDow(rt, mo, dow);
          const startFactor = Math.max(0.40, Math.min(0.85, 0.60 * perfRatio));
          const endFactor = 1.40;
          const soldRatio = otb.rn / totalRooms;
          const progFactor = startFactor + soldRatio * (endFactor - startFactor);
          return suppHist * progFactor;
        })(),
        supplementoBase: rt === baseRT ? 0 : suppStoricoForMoDow(rt, mo, d.getDay()),
        soldProgFactor: (function(){
          if (rt === baseRT) return 1;
          const totalRooms = slot.rooms;
          if (totalRooms <= 1) return 1;
          const perfRatio = perfRatioForMoDow(rt, mo, d.getDay());
          const startFactor = Math.max(0.40, Math.min(0.85, 0.60 * perfRatio));
          const endFactor = 1.40;
          const soldRatio = otb.rn / totalRooms;
          return startFactor + soldRatio * (endFactor - startFactor);
        })(),
        perfRatio: rt === baseRT ? 1 : perfRatioForMoDow(rt, mo, d.getDay()),
        isBaseRT: rt === baseRT,
      };
    }
    rows.push({
      date:d, ymd:k, y, mo, day, dow:d.getDay(),
      monthOccTgt,
      monthResidualRev, monthTargetRev,
      dayResidualRev,
      rt: rtData,
    });
  }
  const annualByRT = {};
  for (const rt of rtList) annualByRT[rt] = {
    rooms: roomsMap[rt],
    revTarget: 0, rnTarget: 0, capacity: 0,
    histRevShare: mixRev[rt],
    otbRev: 0, otbRn: 0,
  };
  for (const ym of fmonthsAll){
    const y = Math.floor(ym/100), m = ym%100;
    const dim = new Date(y, m, 0).getDate();
    const monthRev = budgetMonthlyFor(sel, ym, 'rev');
    const monthOccRaw = budgetMonthlyFor(sel, ym, 'occ');
    const monthOcc = Math.max(0.01, Math.min(1.0, monthOccRaw + PRI_OCC_DELTA_PP/100));
    for (const rt of rtList){
      const a = annualByRT[rt];
      a.revTarget += monthRev * mixRev[rt];
      a.rnTarget  += a.rooms * dim * monthOcc;
      a.capacity  += a.rooms * dim;
    }
  }
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (b.struct !== structKey) continue;
    if (!(b.room in roomsMap)) continue;
    if (b.bookYmd > TODAY_YMD) continue;
    const alloc = monthAllocate(b.dIn, b.dOut, b.revPerNight);
    const allocCar = monthAllocate(b.dIn, b.dOut, b.revPerNightCaricato);
    for (const k in alloc){
      const ym = +k;
      if (!fmonthSetAll.has(ym)) continue;
      annualByRT[b.room].otbRev += alloc[k].rev;
      annualByRT[b.room].otbRevCaricato = (annualByRT[b.room].otbRevCaricato||0) + (allocCar[k]?.rev || 0);
      annualByRT[b.room].otbRn  += alloc[k].rn;
    }
  }
  for (const rt of rtList){
    const a = annualByRT[rt];
    a.adrTarget = a.rnTarget>0 ? a.revTarget/a.rnTarget : 0;
    a.otbAdr = a.otbRn>0 ? a.otbRev/a.otbRn : 0;
    a.otbAdrCaricato = a.otbRn>0 ? (a.otbRevCaricato||0)/a.otbRn : 0;
    a.rnResidual  = Math.max(0, a.rnTarget - a.otbRn);
    a.revResidual = Math.max(0, a.revTarget - a.otbRev);
    a.adrResidual = a.rnResidual>0 ? a.revResidual/a.rnResidual : 0;
    const channelF = 1 + 0.12 * (mixBookingByRT[rt] || 0);
    const nrF = 1 - 0.10 * (mixNonRimbByRT[rt] || 0);
    const totF = channelF * nrF;
    a.adrResidualCaricato = totF>0 ? a.adrResidual / totF : 0;
    a.adrStart = a.adrResidualCaricato * PRI_START_FACTOR;
    a.mixBookingRT = mixBookingByRT[rt] || 0;
    a.mixNonRimbRT = mixNonRimbByRT[rt] || 0;
    a.occAvg = a.capacity>0 ? a.rnTarget/a.capacity : 0;
  }
  const yearTotals = {
    rooms: structRoomsTotal(sel),
    revTarget: budgetTotalFor(sel),
    rnTarget: 0, capacity: 0, otbRev: 0, otbRevCaricato: 0, otbRn: 0,
  };
  for (const rt of rtList){
    yearTotals.rnTarget += annualByRT[rt].rnTarget;
    yearTotals.capacity += annualByRT[rt].capacity;
    yearTotals.otbRev   += annualByRT[rt].otbRev;
    yearTotals.otbRevCaricato += annualByRT[rt].otbRevCaricato || 0;
    yearTotals.otbRn    += annualByRT[rt].otbRn;
  }
  yearTotals.adrTarget = yearTotals.rnTarget>0 ? yearTotals.revTarget/yearTotals.rnTarget : 0;
  yearTotals.otbAdr = yearTotals.otbRn>0 ? yearTotals.otbRev/yearTotals.otbRn : 0;
  yearTotals.otbAdrCaricato = yearTotals.otbRn>0 ? yearTotals.otbRevCaricato/yearTotals.otbRn : 0;
  yearTotals.rnResidual = Math.max(0, yearTotals.rnTarget - yearTotals.otbRn);
  yearTotals.revResidual = Math.max(0, yearTotals.revTarget - yearTotals.otbRev);
  yearTotals.adrResidual = yearTotals.rnResidual>0 ? yearTotals.revResidual/yearTotals.rnResidual : 0;
  yearTotals.mixBookingAvg = yearTotals.otbRn>0
    ? rtList.reduce((s,rt)=> s + (mixBookingByRT[rt]||0) * (annualByRT[rt].otbRn||0), 0) / yearTotals.otbRn
    : 0;
  yearTotals.mixNonRimbAvg = yearTotals.otbRn>0
    ? rtList.reduce((s,rt)=> s + (mixNonRimbByRT[rt]||0) * (annualByRT[rt].otbRn||0), 0) / yearTotals.otbRn
    : 0;
  yearTotals.occAvg = yearTotals.capacity>0 ? yearTotals.rnTarget/yearTotals.capacity : 0;
  const _apdResult = {
    isBoth:false, structSel:sel, structKey,
    rtList, mixRev, rows, annualByRT, yearTotals,
    baseRT, histAdr, histAdrCar, supplementoStorico, supplementoStagione, mixBookingByRT, mixNonRimbByRT,
    highSeason: [...HIGH_SEASON],
    rangeDays, startYmd: startYmdNum,
  };
  if (_APD_CACHE) _APD_CACHE[_apdKey] = _apdResult;
  return _apdResult;
}
function renderPricing(sel){
  const chipEl = document.getElementById('pri-struct-chip');
  if (chipEl) chipEl.textContent = structLabel(sel);
  if (!PRI_START_USER_SET){
    const t = new Date(TODAY); t.setHours(0,0,0,0);
    PRI_START_YMD = ymd(t);
  }
  const dateInp = document.getElementById('pri-start-date');
  if (dateInp){
    dateInp.value = ymdNumToIso(PRI_START_YMD);
    if (!dateInp._wired){
      dateInp._wired = true;
      dateInp.onchange = ()=>{
        const v = isoToYmdNum(dateInp.value);
        if (v){ PRI_START_YMD = v; PRI_START_USER_SET = true; renderPricing(CURRENT_STRUCT); }
      };
    }
  }
  const rangeBtns = [
    {n:30,label:'30d'}, {n:60,label:'60d'},
    {n:90,label:'90d'}, {n:180,label:'180d'}, {n:365,label:'1 year'}
  ];
  const pillsEl = document.getElementById('pri-range-pills');
  if (pillsEl){
    pillsEl.innerHTML = rangeBtns.map(b =>
      `<button class="rt-pill ${b.n===PRI_RANGE_DAYS?'':'off'}" data-range="${b.n}" style="${b.n===PRI_RANGE_DAYS?'border-color:var(--accent)':''}">${b.label}</button>`
    ).join('');
    pillsEl.querySelectorAll('button[data-range]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        PRI_RANGE_DAYS = +btn.dataset.range;
        renderPricing(CURRENT_STRUCT);
      });
    });
  }
  const slider = document.getElementById('pri-occ-slider');
  const lbl = document.getElementById('pri-occ-label');
  const resetBtn = document.getElementById('pri-occ-reset');
  if (slider){
    slider.value = String(PRI_OCC_DELTA_PP);
    if (lbl) lbl.textContent = (PRI_OCC_DELTA_PP>=0?'+':'')+PRI_OCC_DELTA_PP+' pp';
    if (!slider._wired){
      slider._wired = true;
      slider.addEventListener('input', ()=>{
        PRI_OCC_DELTA_PP = parseInt(slider.value,10);
        if (lbl) lbl.textContent = (PRI_OCC_DELTA_PP>=0?'+':'')+PRI_OCC_DELTA_PP+' pp';
        renderPricing(CURRENT_STRUCT);
      });
    }
  }
  if (resetBtn && !resetBtn._wired){
    resetBtn._wired = true;
    resetBtn.addEventListener('click', ()=>{
      PRI_OCC_DELTA_PP = 0;
      renderPricing(CURRENT_STRUCT);
    });
  }
  if (sel === 'both'){ renderPricingBoth(); return; }
  const A = aggPricingDaily(sel, PRI_START_YMD, PRI_RANGE_DAYS);
  const Y = A.yearTotals;
  const _rmesMap = (typeof computeRMESPriceMap === 'function')
    ? computeRMESPriceMap(sel, PRI_START_YMD, PRI_RANGE_DAYS)
    : {};
  document.getElementById('pri-kpis').innerHTML = `
    <div class="kpi" style="border-left-color:#6b5b3f">
      <div class="kpi-label">Annual residual revenue</div>
      <div class="kpi-val">${fmtEUR(Y.revResidual)}</div>
      <div class="kpi-sub mono">su target ${fmtEUR(Y.revTarget)} (lordo, mix Beddy + Booking)</div>
    </div>
    <div class="kpi" style="border-left-color:#3b6b6b">
      <div class="kpi-label">Target ADR gross (collected)</div>
      <div class="kpi-val">${Y.rnResidual>0?fmtEUR(Y.adrResidual):'—'}</div>
      <div class="kpi-sub mono">${Math.round(Y.rnResidual).toLocaleString('en-GB')} RN da vendere</div>
    </div>
    <div class="kpi" style="border-left-color:#a89274">
      <div class="kpi-label">ADR target da caricare PMS</div>
      <div class="kpi-val">${Y.rnResidual>0?fmtEUR(Y.adrResidual / ((1 + 0.12 * (Y.mixBookingAvg||0)) * (1 - 0.10 * (Y.mixNonRimbAvg||0)))):'—'}</div>
      <div class="kpi-sub mono">mix OTA ${Math.round((Y.mixBookingAvg||0)*100)}% (+12%) · mix non rimb. ${Math.round((Y.mixNonRimbAvg||0)*100)}% (-10%)</div>
    </div>
    <div class="kpi" style="border-left-color:#5a8c69">
      <div class="kpi-label">ADR already sold (gross)</div>
      <div class="kpi-val">${Y.otbRn>0?fmtEUR(Y.otbAdr):'—'}</div>
      <div class="kpi-sub mono">caricato ${Y.otbRn>0?fmtEUR(Y.otbAdrCaricato):'—'} · ${Math.round(Y.otbRn).toLocaleString('en-GB')} RN</div>
    </div>
  `;
  const dowIT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let html = '<table class="data pri-daily-table pri-daily-transposed"><thead><tr>'
    + '<th class="pri-rt-name-col" rowspan="2" style="text-align:left;background:var(--surface-2);position:sticky;left:0;z-index:3;min-width:180px;border-right:2px solid var(--accent)">Room Type</th>';
  for (const r of A.rows){
    const isWE = (r.dow===5 || r.dow===6 || r.dow===0);
    const dateStyle = isWE ? 'color:var(--accent);font-weight:600' : '';
    html += `<th class="pri-date-cell" style="text-align:center;font-size:10px;padding:4px 6px;${dateStyle}">${pad2(r.day)}/${pad2(r.mo)}</th>`;
  }
  html += '</tr><tr>';
  for (const r of A.rows){
    const isWE = (r.dow===5 || r.dow===6 || r.dow===0);
    const dateStyle = isWE ? 'color:var(--accent);font-weight:500' : 'color:var(--ink-3)';
    html += `<th class="pri-date-cell" style="text-align:center;font-size:9px;padding:2px 6px;font-weight:400;${dateStyle}">${dowIT[r.dow]}</th>`;
  }
  html += '</tr></thead><tbody>';
  for (const rt of A.rtList){
    const isBase = rt === A.baseRT;
    const baseTag = isBase ? ' <span style="font-size:9px;color:var(--accent);font-weight:600">[BASE]</span>' : '';
    html += `<tr><td class="cell-mono pri-rt-name-col" style="background:var(--surface-2);position:sticky;left:0;z-index:2;font-weight:500;border-right:2px solid var(--accent);min-width:180px">${escapeHtml(rt)}${baseTag}</td>`;
    for (const r of A.rows){
      const v = r.rt[rt];
      const soldOut = v.roomsAvailable<=0;
      const isWE = (r.dow===5 || r.dow===6 || r.dow===0);
      const weBg = isWE ? 'background:rgba(107,91,63,.04);' : '';
      if (isBase){
        const rmesEntry = _rmesMap[r.ymd];
        let prezzo;
        let usedRMES = false;
        if ((sel === 'condotta' || sel === 'alfani') && rmesEntry && rmesEntry.price > 0){
          price = rmesEntry.price;
          usedRMES = true;
        } else if (soldOut){
          price = v.adrSoldCaricato > 0
            ? v.adrSoldCaricato * 1.05
            : (A.histAdrCar[rt] || 0);
        } else {
          price = v.adrStart;
        }
        const exp = expContext(r.ymd, sel);
        let braked = false;
        let preBrake = prezzo;
        if (!usedRMES && exp && exp.compsetAvgBeddy){
          const brakeChk = expCheckBrake(prezzo, exp.compsetAvgBeddy);
          if (brakeChk){
            braked = true;
            price = brakeChk.suggestedMax;
          }
        }
        let mark = '';
        if (usedRMES){
          mark = '<sup style="color:#c4823b;font-size:8px;font-weight:700;margin-left:2px" title="RMES price (Revenue Manu Enis System)">R</sup>';
        }
        if (soldOut){
          mark += '<sup style="color:#888;font-size:7px;font-weight:700;margin-left:2px" title="Sold out — price if it freed up">∅</sup>';
        } else if (!usedRMES && v.priceSource === 'upFromSold'){
          mark += '<sup style="color:#3d7a4b;font-size:8px;font-weight:700">↑</sup>';
        } else if (!usedRMES && v.priceSource === 'floor'){
          mark += '<sup style="color:#a83b3b;font-size:8px;font-weight:700">⬇</sup>';
        }
        if (!usedRMES && v.adrMathCapped){
          mark += '<sup style="color:#c4823b;font-size:8px;font-weight:700" title="Target capped at 2.5x historical ADR">⚠</sup>';
        }
        if (braked){
          mark += '<sup style="color:#3b6b6b;font-size:8px;font-weight:700" title="Braked to compset+20%">🛑</sup>';
        }
        const lines = [];
        lines.push(`${pad2(r.day)}/${pad2(r.mo)}/${r.y} ${dowIT[r.dow]}`);
        lines.push(`Disp: ${v.roomsAvailable}/${v.rooms}${soldOut?' (SOLD OUT — price to set if a cancellation comes in)':''}`);
        if (usedRMES){
          const srcLbl = rmesEntry.source === 'mine'    ? 'My Expedia price'
                       : rmesEntry.source === 'compset' ? 'Compset avg Expedia'
                       : rmesEntry.source === 'otb'     ? 'ADR OTB del giorno'
                       : rmesEntry.source === 'finalLy' ? 'ADR Final LY 2025'
                       : 'sconosciuta';
          lines.push(`✦ RMES price = base × ${rmesEntry.multFinale.toFixed(3)} (weighted average of 5 factors)`);
          lines.push(`  Base source: ${srcLbl}`);
          if (rmesEntry.suppApplied > 0){
            lines.push(`  ⚠ Bilocale sold-out → −${fmtEUR(rmesEntry.suppApplied)} (suppl. ${rmesEntry.suppRT})`);
          }
        } else if (!soldOut){
          lines.push(`Gross target: ${fmtEUR(v.adrResidual)} · loaded: ${fmtEUR(v.adrCaricato)}`);
        } else {
          lines.push(v.adrSoldCaricato>0
            ? `Proposed price = last sold +5% (${fmtEUR(v.adrSoldCaricato)} → ${fmtEUR(preBrake)})`
            : `Proposed price = historical loaded ADR (${fmtEUR(preBrake)})`);
        }
        if (v.adrMathCapped){
          lines.push(`⚠ Target capped at 2.5x historical ADR (${fmtEUR(v.adrHist*2.5)}). The residual monthly budget is high vs available rooms.`);
        }
        lines.push(`Channel mix: ${Math.round(v.mixBookingRT*100)}% OTA · ${Math.round((1-v.mixBookingRT)*100)}% direct`);
        lines.push(`Rate mix: ${Math.round(v.mixNonRimbRT*100)}% non-refundable (-10%) · ${Math.round((1-v.mixNonRimbRT)*100)}% flexible`);
        if (v.priceLadder && v.priceLadder.length > 1){
          lines.push(`Price ladder: ${v.priceLadder.map(p => fmtEUR(p)).join(' → ')}`);
        }
        if (v.adrSoldCaricato > 0){
          lines.push(`Already loaded: ${fmtEUR(v.adrSoldCaricato)} (${v.otbRn}/${v.rooms})`);
        }
        if (exp){
          if (exp.myPriceBeddy != null) lines.push(`📊 My Expedia price: ${fmtEUR(exp.myPriceExpedia)} (≈ ${fmtEUR(exp.myPriceBeddy)} Beddy flex)`);
          if (exp.compsetAvgBeddy != null){
            const diffPct = (prezzo/exp.compsetAvgBeddy-1);
            lines.push(`📊 Compset avg: ${fmtEUR(exp.compsetAvg)} Expedia (≈ ${fmtEUR(exp.compsetAvgBeddy)} Beddy) · my proposed ${(diffPct>=0?'+':'')}${(diffPct*100).toFixed(0)}% vs avg`);
          }
          if (braked){
            lines.push(`🛑 BRAKED: original price ${fmtEUR(preBrake)} > +20% over Beddy-equiv compset (${fmtEUR(exp.compsetAvgBeddy)}). Limitato a ${fmtEUR(prezzo)}.`);
          }
          if (exp.searchCurrent != null){
            const dem = expDemandLevel(exp.searchCurrent);
            lines.push(`📊 Search demand: ${dem.label} (${Math.round(exp.searchCurrent).toLocaleString('en-GB')})${exp.searchYoY!=null?` · YoY ${(exp.searchYoY>=0?'+':'')}${(exp.searchYoY*100).toFixed(0)}%`:''}`);
          }
        }
        const tooltip = ` title="${lines.join('\n')}"`;
        const cellBg = soldOut ? 'background:rgba(150,150,150,.10);' : 'background:rgba(107,91,63,.10);';
        const txtCol = soldOut ? 'color:var(--ink-3);' : '';
        html += `<td class="cell-mono" style="text-align:center;${cellBg}${weBg}line-height:1.15;cursor:help;font-size:11px;${txtCol}"${tooltip}><b>${fmtEUR(prezzo)}</b>${mark}<br><span style="font-size:9px;color:var(--ink-3);font-weight:400">${v.roomsAvailable}/${v.rooms}${soldOut?' <span style="color:#a83b3b">●</span>':''}</span></td>`;
      } else {
        const isHigh = A.highSeason.indexOf(r.mo) !== -1;
        const supp = isHigh ? A.supplementoStagione[rt].alta : A.supplementoStagione[rt].bassa;
        const stagione = isHigh ? 'ALTA' : 'BASSA';
        const otherSupp = isHigh ? A.supplementoStagione[rt].bassa : A.supplementoStagione[rt].alta;
        const suppTxt = (supp>=0?'+':'') + fmtEUR(supp);
        const lines = [];
        lines.push(`${pad2(r.day)}/${pad2(r.mo)}/${r.y} ${dowIT[r.dow]}`);
        lines.push(`Disp: ${v.roomsAvailable}/${v.rooms}${soldOut?' (SOLD OUT — supplement to apply if it frees up)':''}`);
        lines.push(`Season ${stagione==='ALTA'?'HIGH':'LOW'} → supplement ${suppTxt}`);
        lines.push(`(${stagione === 'ALTA' ? 'LOW' : 'HIGH'} season: ${(otherSupp>=0?'+':'')}${fmtEUR(otherSupp)})`);
        if (v.adrSoldCaricato > 0) lines.push(`Already loaded: ${fmtEUR(v.adrSoldCaricato)} (${v.otbRn}/${v.rooms})`);
        const tooltip = ` title="${lines.join('\n')}"`;
        const seasonBadge = isHigh ? '<sup style="color:#a83b3b;font-size:7px;font-weight:700;margin-left:1px">A</sup>' : '<sup style="color:#3b6b6b;font-size:7px;font-weight:700;margin-left:1px">B</sup>';
        const soldMark = soldOut ? '<sup style="color:#888;font-size:7px;font-weight:700;margin-left:2px" title="Sold out">∅</sup>' : '';
        const cellBg = soldOut ? 'background:rgba(150,150,150,.06);' : 'background:rgba(107,91,63,.04);';
        const txtCol = soldOut ? 'color:var(--ink-3);' : 'color:var(--accent);';
        html += `<td class="cell-mono" style="text-align:center;${cellBg}${weBg}cursor:help;${txtCol}font-weight:600;font-size:11px;line-height:1.15"${tooltip}>${suppTxt}${seasonBadge}${soldMark}<br><span style="font-size:9px;color:var(--ink-3);font-weight:400">${v.roomsAvailable}/${v.rooms}${soldOut?' <span style="color:#a83b3b">●</span>':''}</span></td>`;
      }
    }
    html += '</tr>';
    if (isBase && (sel === 'condotta' || sel === 'alfani')){
      html += `<tr style="background:rgba(58,107,107,.04)"><td class="cell-mono pri-rt-name-col" style="background:rgba(58,107,107,.08);position:sticky;left:0;z-index:2;font-weight:500;border-right:2px solid #3b6b6b;font-size:10px;color:#3b6b6b" title="Base room price on Expedia, converted to flexible Beddy (= expedia_price ÷ Expedia markup ÷ 0.90)">📊 My price (Beddy eq.)</td>`;
      for (const r of A.rows){
        const exp = expContext(r.ymd, sel);
        const isWE = (r.dow===5 || r.dow===6 || r.dow===0);
        const weBg = isWE ? 'background:rgba(107,91,63,.04);' : '';
        if (exp && exp.myPriceBeddy != null){
          html += `<td class="cell-mono cell-flat" style="text-align:center;${weBg}font-size:10px;color:#3b6b6b" title="On Expedia: ${fmtEUR(exp.myPriceExpedia)} (non-ref. + markup +12%) → Beddy flex equiv: ${fmtEUR(exp.myPriceBeddy)}">${fmtEUR(exp.myPriceBeddy)}</td>`;
        } else {
          html += `<td class="cell-mono cell-flat" style="text-align:center;${weBg}font-size:10px;color:var(--ink-3)">—</td>`;
        }
      }
      html += '</tr>';
      html += `<tr style="background:rgba(58,107,107,.02)"><td class="cell-mono pri-rt-name-col" style="background:rgba(58,107,107,.06);position:sticky;left:0;z-index:2;font-weight:500;border-right:2px solid #3b6b6b;font-size:10px;color:#3b6b6b" title="Avg competitor su Expedia, riportato a Beddy flex">📊 Compset avg (Beddy eq.)</td>`;
      for (const r of A.rows){
        const exp = expContext(r.ymd, sel);
        const v = r.rt[A.baseRT];
        const isWE = (r.dow===5 || r.dow===6 || r.dow===0);
        const weBg = isWE ? 'background:rgba(107,91,63,.04);' : '';
        if (exp && exp.compsetAvgBeddy != null){
          let prop = v.adrStart;
          if (v.roomsAvailable<=0){
            prop = v.adrSoldCaricato > 0 ? v.adrSoldCaricato * 1.05 : (A.histAdrCar[A.baseRT] || 0);
          }
          const brakeChk = expCheckBrake(prop, exp.compsetAvgBeddy);
          if (brakeChk) prop = brakeChk.suggestedMax;
          const diff = exp.compsetAvgBeddy > 0 ? (prop - exp.compsetAvgBeddy)/exp.compsetAvgBeddy : null;
          let diffTxt = '', diffCol = '#666';
          if (diff != null){
            diffTxt = (diff>=0?'+':'') + (diff*100).toFixed(0) + '%';
            if (diff > 0.20) diffCol = '#a83b3b';
            else if (diff > 0.10) diffCol = '#c4823b';
            else if (diff < -0.15) diffCol = '#3d7a4b';
          }
          html += `<td class="cell-mono cell-flat" style="text-align:center;${weBg}font-size:10px;line-height:1.1" title="Compset Expedia ${fmtEUR(exp.compsetAvg)} → Beddy flex equiv ${fmtEUR(exp.compsetAvgBeddy)} · my proposed ${fmtEUR(prop)} → ${diffTxt}">${fmtEUR(exp.compsetAvgBeddy)}<br><span style="font-size:8px;color:${diffCol};font-weight:600">${diffTxt}</span></td>`;
        } else {
          html += `<td class="cell-mono cell-flat" style="text-align:center;${weBg}font-size:10px;color:var(--ink-3)">—</td>`;
        }
      }
      html += '</tr>';
      html += `<tr style="background:rgba(58,107,107,.02)"><td class="cell-mono pri-rt-name-col" style="background:rgba(58,107,107,.06);position:sticky;left:0;z-index:2;font-weight:500;border-right:2px solid #3b6b6b;font-size:10px;color:#3b6b6b">📊 Search demand</td>`;
      for (const r of A.rows){
        const exp = expContext(r.ymd, sel);
        const isWE = (r.dow===5 || r.dow===6 || r.dow===0);
        const weBg = isWE ? 'background:rgba(107,91,63,.04);' : '';
        if (exp && exp.searchCurrent != null){
          const dem = expDemandLevel(exp.searchCurrent);
          const yoyTxt = exp.searchYoY != null ? `${(exp.searchYoY>=0?'+':'')}${(exp.searchYoY*100).toFixed(0)}%` : '';
          html += `<td class="cell-mono cell-flat" style="text-align:center;${weBg}font-size:10px;line-height:1.1;color:${dem.color}" title="Search ${Math.round(exp.searchCurrent).toLocaleString('en-GB')} · ${dem.label} · YoY ${yoyTxt}"><b>${dem.label.split(' ')[0]}</b><br><span style="font-size:8px;color:var(--ink-3);font-weight:400">${Math.round(exp.searchCurrent/1000)}k${yoyTxt?' · '+yoyTxt:''}</span></td>`;
        } else {
          html += `<td class="cell-mono cell-flat" style="text-align:center;${weBg}font-size:10px;color:var(--ink-3)">—</td>`;
        }
      }
      html += '</tr>';
    }
  }
  html += '</tbody></table>';
  document.getElementById('pri-daily-wrap').innerHTML = html;
  const subEl = document.getElementById('pri-daily-sub');
  if (subEl){
    const start = A.rows[0]?.date, end = A.rows[A.rows.length-1]?.date;
    if (start && end){
      subEl.textContent = `${pad2(start.getDate())}/${pad2(start.getMonth()+1)}/${start.getFullYear()} → ${pad2(end.getDate())}/${pad2(end.getMonth()+1)}/${end.getFullYear()} · Target ADR on residual (in beige) = price da praticare to close the budget · Disp = camere libere`;
    }
  }
  let st = '<thead><tr>'
    + '<th rowspan="2">Room Type</th>'
    + '<th rowspan="2" class="g-25">Mix</th>'
    + '<th rowspan="2" class="g-25">Rooms</th>'
    + '<th colspan="3" class="g-26" style="text-align:center">Annual target</th>'
    + '<th colspan="3" class="g-25" style="text-align:center">Already sold</th>'
    + '<th colspan="2" class="g-var" style="text-align:center">Residual</th>'
    + '<th rowspan="2" class="g-26" style="background:rgba(107,91,63,.10)">ADR tgt<br>residual</th>'
    + '<th rowspan="2" class="g-26">Departure</th>'
    + '</tr><tr>'
    + '<th class="g-26">RN</th><th class="g-26">Rev</th><th class="g-26">ADR</th>'
    + '<th class="g-25">RN</th><th class="g-25">Rev</th><th class="g-25">ADR</th>'
    + '<th class="g-var">RN</th><th class="g-var">Rev</th>'
    + '</tr></thead><tbody>';
  for (const rt of A.rtList){
    const a = A.annualByRT[rt];
    st += `<tr>
      <td>${escapeHtml(rt)}</td>
      <td class="cell-mono cell-flat">${fmtPct(a.histRevShare,1)}</td>
      <td class="cell-mono cell-flat">${a.rooms}</td>
      <td class="cell-mono cell-flat">${Math.round(a.rnTarget).toLocaleString('en-GB')}</td>
      <td class="cell-mono cell-flat">${fmtEUR(a.revTarget)}</td>
      <td class="cell-mono cell-flat">${fmtEUR(a.adrTarget)}</td>
      <td class="cell-mono cell-flat">${Math.round(a.otbRn).toLocaleString('en-GB')}</td>
      <td class="cell-mono cell-flat">${fmtEUR(a.otbRev)}</td>
      <td class="cell-mono cell-flat">${a.otbRn>0?fmtEUR(a.otbAdr):'—'}</td>
      <td class="cell-mono cell-flat"><b>${Math.round(a.rnResidual).toLocaleString('en-GB')}</b></td>
      <td class="cell-mono cell-flat">${fmtEUR(a.revResidual)}</td>
      <td class="cell-mono" style="background:rgba(107,91,63,.10)"><b>${a.rnResidual>0?fmtEUR(a.adrResidual):'—'}</b></td>
      <td class="cell-mono">${a.rnResidual>0?fmtEUR(a.adrStart):'—'}</td>
    </tr>`;
  }
  st += `<tr class="total">
    <td>Total</td>
    <td class="cell-mono cell-flat">100%</td>
    <td class="cell-mono cell-flat">${Y.rooms}</td>
    <td class="cell-mono cell-flat">${Math.round(Y.rnTarget).toLocaleString('en-GB')}</td>
    <td class="cell-mono cell-flat">${fmtEUR(Y.revTarget)}</td>
    <td class="cell-mono cell-flat">${fmtEUR(Y.adrTarget)}</td>
    <td class="cell-mono cell-flat">${Math.round(Y.otbRn).toLocaleString('en-GB')}</td>
    <td class="cell-mono cell-flat">${fmtEUR(Y.otbRev)}</td>
    <td class="cell-mono cell-flat">${Y.otbRn>0?fmtEUR(Y.otbAdr):'—'}</td>
    <td class="cell-mono cell-flat"><b>${Math.round(Y.rnResidual).toLocaleString('en-GB')}</b></td>
    <td class="cell-mono cell-flat">${fmtEUR(Y.revResidual)}</td>
    <td class="cell-mono" style="background:rgba(107,91,63,.10)"><b>${Y.rnResidual>0?fmtEUR(Y.adrResidual):'—'}</b></td>
    <td class="cell-mono">${Y.rnResidual>0?fmtEUR(Y.adrResidual * PRI_START_FACTOR):'—'}</td>
  </tr>`;
  st += '</tbody>';
  const _summaryEl = document.getElementById('pri-summary-table');
  if (_summaryEl) _summaryEl.innerHTML = st;
  renderPricingChart();
}
function renderPricingBoth(){
  const aFs  = aggPricingDaily('firenze', PRI_START_YMD, PRI_RANGE_DAYS);
  const aC16 = aggPricingDaily('condotta', PRI_START_YMD, PRI_RANGE_DAYS);
  const aAlf = aggPricingDaily('alfani', PRI_START_YMD, PRI_RANGE_DAYS);
  const totRev = aFs.yearTotals.revTarget + aC16.yearTotals.revTarget + aAlf.yearTotals.revTarget;
  const totRn  = aFs.yearTotals.rnTarget + aC16.yearTotals.rnTarget + aAlf.yearTotals.rnTarget;
  const totOtbRev = aFs.yearTotals.otbRev + aC16.yearTotals.otbRev + aAlf.yearTotals.otbRev;
  const totOtbRn  = aFs.yearTotals.otbRn + aC16.yearTotals.otbRn + aAlf.yearTotals.otbRn;
  const totRevResidual = Math.max(0, totRev - totOtbRev);
  const totRnResidual  = Math.max(0, totRn - totOtbRn);
  const adrResidualAvg = totRnResidual>0 ? totRevResidual/totRnResidual : 0;
  const otbAdrAvg = totOtbRn>0 ? totOtbRev/totOtbRn : 0;
  document.getElementById('pri-kpis').innerHTML = `
    <div class="kpi" style="border-left-color:#6b5b3f">
      <div class="kpi-label">Group residual revenue</div>
      <div class="kpi-val">${fmtEUR(totRevResidual)}</div>
      <div class="kpi-sub mono">su target ${fmtEUR(totRev)}</div>
    </div>
    <div class="kpi" style="border-left-color:#3b6b6b">
      <div class="kpi-label">Target ADR on residual</div>
      <div class="kpi-val">${totRnResidual>0?fmtEUR(adrResidualAvg):'—'}</div>
      <div class="kpi-sub mono">${Math.round(totRnResidual).toLocaleString('en-GB')} RN da vendere</div>
    </div>
    <div class="kpi" style="border-left-color:#a89274">
      <div class="kpi-label">Average departure</div>
      <div class="kpi-val">${totRnResidual>0?fmtEUR(adrResidualAvg * PRI_START_FACTOR):'—'}</div>
      <div class="kpi-sub mono">80% of residual</div>
    </div>
    <div class="kpi" style="border-left-color:#5a8c69">
      <div class="kpi-label">ADR already sold</div>
      <div class="kpi-val">${totOtbRn>0?fmtEUR(otbAdrAvg):'—'}</div>
      <div class="kpi-sub mono">${Math.round(totOtbRn).toLocaleString('en-GB')} RN sold</div>
    </div>
  `;
  const dowIT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let html = '<table class="data pri-daily-table pri-daily-transposed"><thead><tr>'
    + '<th class="pri-rt-name-col" rowspan="2" style="text-align:left;background:var(--surface-2);position:sticky;left:0;z-index:3;min-width:230px;border-right:2px solid var(--accent)">Property · Room Type</th>';
  for (const r of aFs.rows){
    const isWE = (r.dow===5 || r.dow===6 || r.dow===0);
    const dateStyle = isWE ? 'color:var(--accent);font-weight:600' : '';
    html += `<th class="pri-date-cell" style="text-align:center;font-size:10px;padding:4px 6px;${dateStyle}">${pad2(r.day)}/${pad2(r.mo)}</th>`;
  }
  html += '</tr><tr>';
  for (const r of aFs.rows){
    const isWE = (r.dow===5 || r.dow===6 || r.dow===0);
    const dateStyle = isWE ? 'color:var(--accent);font-weight:500' : 'color:var(--ink-3)';
    html += `<th class="pri-date-cell" style="text-align:center;font-size:9px;padding:2px 6px;font-weight:400;${dateStyle}">${dowIT[r.dow]}</th>`;
  }
  html += '</tr></thead><tbody>';
  for (const ctx of [{A:aFs, rows:aFs.rows, structLbl:'FS', structFull:'Firenze Suite', bg:'rgba(107,91,63,.06)'},
                     {A:aC16, rows:aC16.rows, structLbl:'C16', structFull:'Condotta 16', bg:'rgba(59,107,107,.06)'}]){
    const A = ctx.A;
    html += `<tr><td colspan="${aFs.rows.length+1}" class="pri-rt-name-col" style="background:${ctx.bg};position:sticky;left:0;font-weight:600;font-size:11px;padding:6px 10px;border-right:2px solid var(--accent)">${ctx.structFull}</td></tr>`;
    for (const rt of A.rtList){
      const isBase = rt === A.baseRT;
      const baseTag = isBase ? ' <span style="font-size:9px;color:var(--accent);font-weight:600">[BASE]</span>' : '';
      html += `<tr><td class="cell-mono pri-rt-name-col" style="background:var(--surface-2);position:sticky;left:0;z-index:2;font-weight:500;border-right:2px solid var(--accent);min-width:230px;font-size:11px"><span style="color:var(--ink-3);font-size:10px;margin-right:6px">${ctx.structLbl}</span>${escapeHtml(rt)}${baseTag}</td>`;
      for (const r of ctx.rows){
        const v = r.rt[rt];
        const soldOut = v.roomsAvailable<=0;
        const isWE = (r.dow===5 || r.dow===6 || r.dow===0);
        const weBg = isWE ? 'background:rgba(107,91,63,.04);' : '';
        if (isBase){
          let prezzo;
          if (soldOut){
            price = v.adrSoldCaricato > 0 ? v.adrSoldCaricato * 1.05 : (A.histAdrCar[rt] || 0);
          } else {
            price = v.adrStart;
          }
          let mark = '';
          if (soldOut){
            mark = '<sup style="color:#888;font-size:7px;font-weight:700;margin-left:2px" title="Sold out">∅</sup>';
          } else if (v.priceSource === 'upFromSold'){
            mark = '<sup style="color:#3d7a4b;font-size:8px;font-weight:700">↑</sup>';
          } else if (v.priceSource === 'floor'){
            mark = '<sup style="color:#a83b3b;font-size:8px;font-weight:700">⬇</sup>';
          }
          if (v.adrMathCapped){
            mark += '<sup style="color:#c4823b;font-size:8px;font-weight:700">⚠</sup>';
          }
          const lines = [];
          lines.push(`${ctx.structFull} · ${pad2(r.day)}/${pad2(r.mo)}/${r.y} ${dowIT[r.dow]}`);
          lines.push(`Disp: ${v.roomsAvailable}/${v.rooms}${soldOut?' (SOLD OUT)':''}`);
          if (!soldOut){
            lines.push(`Gross target: ${fmtEUR(v.adrResidual)} · loaded: ${fmtEUR(v.adrCaricato)}`);
          } else {
            lines.push(v.adrSoldCaricato>0
              ? `Proposed price if it frees up = last sold +5% (${fmtEUR(prezzo)})`
              : `Proposed price = historical loaded ADR (${fmtEUR(prezzo)})`);
          }
          if (v.adrMathCapped){
            lines.push(`⚠ Target capped at 2.5x historical`);
          }
          lines.push(`Mix: ${Math.round(v.mixBookingRT*100)}% OTA · ${Math.round((1-v.mixBookingRT)*100)}% direct`);
          lines.push(`Rate: ${Math.round(v.mixNonRimbRT*100)}% non-ref. (-10%) · ${Math.round((1-v.mixNonRimbRT)*100)}% flex`);
          if (v.priceLadder && v.priceLadder.length > 1){
            lines.push(`Price ladder: ${v.priceLadder.map(p => fmtEUR(p)).join(' → ')}`);
          }
          if (v.adrSoldCaricato > 0) lines.push(`Already loaded: ${fmtEUR(v.adrSoldCaricato)} (${v.otbRn}/${v.rooms})`);
          const tooltip = ` title="${lines.join('\n')}"`;
          const cellBg = soldOut ? 'background:rgba(150,150,150,.10);' : 'background:rgba(107,91,63,.10);';
          const txtCol = soldOut ? 'color:var(--ink-3);' : '';
          html += `<td class="cell-mono" style="text-align:center;${cellBg}${weBg}line-height:1.15;cursor:help;font-size:11px;${txtCol}"${tooltip}><b>${fmtEUR(prezzo)}</b>${mark}<br><span style="font-size:9px;color:var(--ink-3);font-weight:400">${v.roomsAvailable}/${v.rooms}${soldOut?' <span style="color:#a83b3b">●</span>':''}</span></td>`;
        } else {
          const isHigh = A.highSeason.indexOf(r.mo) !== -1;
          const supp = isHigh ? A.supplementoStagione[rt].alta : A.supplementoStagione[rt].bassa;
          const stagione = isHigh ? 'ALTA' : 'BASSA';
          const otherSupp = isHigh ? A.supplementoStagione[rt].bassa : A.supplementoStagione[rt].alta;
          const suppTxt = (supp>=0?'+':'') + fmtEUR(supp);
          const lines = [];
          lines.push(`${ctx.structFull} · ${pad2(r.day)}/${pad2(r.mo)}/${r.y} ${dowIT[r.dow]}`);
          lines.push(`Disp: ${v.roomsAvailable}/${v.rooms}${soldOut?' (SOLD OUT)':''}`);
          lines.push(`Season ${stagione==='ALTA'?'HIGH':'LOW'} → supplement ${suppTxt}`);
          lines.push(`(${stagione === 'ALTA' ? 'LOW' : 'HIGH'} season: ${(otherSupp>=0?'+':'')}${fmtEUR(otherSupp)})`);
          if (v.adrSoldCaricato > 0) lines.push(`Already loaded: ${fmtEUR(v.adrSoldCaricato)} (${v.otbRn}/${v.rooms})`);
          const tooltip = ` title="${lines.join('\n')}"`;
          const seasonBadge = isHigh ? '<sup style="color:#a83b3b;font-size:7px;font-weight:700;margin-left:1px">A</sup>' : '<sup style="color:#3b6b6b;font-size:7px;font-weight:700;margin-left:1px">B</sup>';
          const soldMark = soldOut ? '<sup style="color:#888;font-size:7px;font-weight:700;margin-left:2px">∅</sup>' : '';
          const cellBg = soldOut ? 'background:rgba(150,150,150,.06);' : 'background:rgba(107,91,63,.04);';
          const txtCol = soldOut ? 'color:var(--ink-3);' : 'color:var(--accent);';
          html += `<td class="cell-mono" style="text-align:center;${cellBg}${weBg}cursor:help;${txtCol}font-weight:600;font-size:11px;line-height:1.15"${tooltip}>${suppTxt}${seasonBadge}${soldMark}<br><span style="font-size:9px;color:var(--ink-3);font-weight:400">${v.roomsAvailable}/${v.rooms}${soldOut?' <span style="color:#a83b3b">●</span>':''}</span></td>`;
        }
      }
      html += '</tr>';
    }
  }
  html += '</tbody></table>';
  document.getElementById('pri-daily-wrap').innerHTML = html;
  const subEl = document.getElementById('pri-daily-sub');
  if (subEl){
    const start = aFs.rows[0]?.date, end = aFs.rows[aFs.rows.length-1]?.date;
    if (start && end){
      subEl.textContent = `${pad2(start.getDate())}/${pad2(start.getMonth()+1)}/${start.getFullYear()} → ${pad2(end.getDate())}/${pad2(end.getMonth()+1)}/${end.getFullYear()} · both properties`;
    }
  }
  let st = '<thead><tr>'
    + '<th rowspan="2">Property</th>'
    + '<th rowspan="2">Room Type</th>'
    + '<th rowspan="2" class="g-25">Mix</th>'
    + '<th rowspan="2" class="g-25">Rooms</th>'
    + '<th colspan="3" class="g-26" style="text-align:center">Target</th>'
    + '<th colspan="3" class="g-25" style="text-align:center">Sold</th>'
    + '<th colspan="2" class="g-var" style="text-align:center">Residual</th>'
    + '<th rowspan="2" class="g-26" style="background:rgba(107,91,63,.10)">ADR tgt<br>residual</th>'
    + '<th rowspan="2" class="g-26">Part.</th>'
    + '</tr><tr>'
    + '<th class="g-26">RN</th><th class="g-26">Rev</th><th class="g-26">ADR</th>'
    + '<th class="g-25">RN</th><th class="g-25">Rev</th><th class="g-25">ADR</th>'
    + '<th class="g-var">RN</th><th class="g-var">Rev</th>'
    + '</tr></thead><tbody>';
  for (const A of [aFs, aC16]){
    for (let i=0; i<A.rtList.length; i++){
      const rt = A.rtList[i];
      const a = A.annualByRT[rt];
      const structCell = (i===0)
        ? `<td class="pri-month-cell" rowspan="${A.rtList.length}"><b>${escapeHtml(A.structKey)}</b></td>`
        : '';
      st += `<tr ${i===0?'class="pri-row-first"':''}>
        ${structCell}
        <td>${escapeHtml(rt)}</td>
        <td class="cell-mono cell-flat">${fmtPct(a.histRevShare,1)}</td>
        <td class="cell-mono cell-flat">${a.rooms}</td>
        <td class="cell-mono cell-flat">${Math.round(a.rnTarget).toLocaleString('en-GB')}</td>
        <td class="cell-mono cell-flat">${fmtEUR(a.revTarget)}</td>
        <td class="cell-mono cell-flat">${fmtEUR(a.adrTarget)}</td>
        <td class="cell-mono cell-flat">${Math.round(a.otbRn).toLocaleString('en-GB')}</td>
        <td class="cell-mono cell-flat">${fmtEUR(a.otbRev)}</td>
        <td class="cell-mono cell-flat">${a.otbRn>0?fmtEUR(a.otbAdr):'—'}</td>
        <td class="cell-mono cell-flat"><b>${Math.round(a.rnResidual).toLocaleString('en-GB')}</b></td>
        <td class="cell-mono cell-flat">${fmtEUR(a.revResidual)}</td>
        <td class="cell-mono" style="background:rgba(107,91,63,.10)"><b>${a.rnResidual>0?fmtEUR(a.adrResidual):'—'}</b></td>
        <td class="cell-mono">${a.rnResidual>0?fmtEUR(a.adrStart):'—'}</td>
      </tr>`;
    }
  }
  st += `<tr class="total">
    <td>Gruppo</td><td>—</td>
    <td class="cell-mono cell-flat">100%</td>
    <td class="cell-mono cell-flat">${aFs.yearTotals.rooms + aC16.yearTotals.rooms}</td>
    <td class="cell-mono cell-flat">${Math.round(totRn).toLocaleString('en-GB')}</td>
    <td class="cell-mono cell-flat">${fmtEUR(totRev)}</td>
    <td class="cell-mono cell-flat">${totRn>0?fmtEUR(totRev/totRn):'—'}</td>
    <td class="cell-mono cell-flat">${Math.round(totOtbRn).toLocaleString('en-GB')}</td>
    <td class="cell-mono cell-flat">${fmtEUR(totOtbRev)}</td>
    <td class="cell-mono cell-flat">${totOtbRn>0?fmtEUR(otbAdrAvg):'—'}</td>
    <td class="cell-mono cell-flat"><b>${Math.round(totRnResidual).toLocaleString('en-GB')}</b></td>
    <td class="cell-mono cell-flat">${fmtEUR(totRevResidual)}</td>
    <td class="cell-mono" style="background:rgba(107,91,63,.10)"><b>${totRnResidual>0?fmtEUR(adrResidualAvg):'—'}</b></td>
    <td class="cell-mono">${totRnResidual>0?fmtEUR(adrResidualAvg * PRI_START_FACTOR):'—'}</td>
  </tr>`;
  st += '</tbody>';
  const _summaryEl = document.getElementById('pri-summary-table');
  if (_summaryEl) _summaryEl.innerHTML = st;
  renderPricingChart();
}
/* Chart multi-line: price da caricare per ogni RT nel periodo selezionato.
   - Solid line = price the system recommends loading oggi
   - Linea tratteggiata = price già caricato in OTB
   Per le derivate: price = base.adrStart + supp_mensile, in caricato. */
function renderPricingChart(){
  const wrapEl = document.getElementById('pri-chart-wrap');
  if (!wrapEl) return;
  function buildSeries(A){
    const series = [];
    for (const rt of A.rtList){
      const isBase = rt === A.baseRT;
      const ptsRec = [];
      const ptsSold = [];
      for (const r of A.rows){
        const v = r.rt[rt];
        let prezzoRec = 0;
        if (v && v.roomsAvailable > 0){
          if (isBase){
            prezzoRec = v.adrStart;
          } else {
            const baseV = r.rt[A.baseRT];
            let basePart = baseV ? baseV.adrStart : 0;
            if (!baseV || baseV.roomsAvailable<=0 || basePart<=0){
              basePart = A.histAdrCar[A.baseRT] || 0;
            }
            const isHigh = A.highSeason.indexOf(r.mo) !== -1;
            const supp = isHigh ? A.supplementoStagione[rt].alta : A.supplementoStagione[rt].bassa;
            prezzoRec = basePart > 0 ? basePart + supp : 0;
            if (v.adrSoldCaricato > 0 && prezzoRec < v.adrSoldCaricato) prezzoRec = v.adrSoldCaricato;
          }
        }
        const sold = (v && v.adrSoldCaricato > 0) ? v.adrSoldCaricato : null;
        ptsRec.push({ymd: r.ymd, day:r.day, mo:r.mo, y:r.y, dow:r.dow, val: prezzoRec>0?prezzoRec:null});
        ptsSold.push({ymd: r.ymd, day:r.day, mo:r.mo, y:r.y, dow:r.dow, val: sold});
      }
      series.push({rt, isBase, ptsRec, ptsSold});
    }
    return series;
  }
  let allSeries = [];
  let dateRows = [];
  if (CURRENT_STRUCT === 'both'){
    const aFs  = aggPricingDaily('firenze', PRI_START_YMD, PRI_RANGE_DAYS);
    const aC16 = aggPricingDaily('condotta', PRI_START_YMD, PRI_RANGE_DAYS);
    const aAlf = aggPricingDaily('alfani', PRI_START_YMD, PRI_RANGE_DAYS);
    const sFs  = buildSeries(aFs).map(s => ({...s, structLbl:'FS'}));
    const sC16 = buildSeries(aC16).map(s => ({...s, structLbl:'C16'}));
    const sAlf = buildSeries(aAlf).map(s => ({...s, structLbl:'PA'}));
    allSeries = [...sFs, ...sC16, ...sAlf];
    dateRows = aFs.rows;
  } else {
    const A = aggPricingDaily(CURRENT_STRUCT, PRI_START_YMD, PRI_RANGE_DAYS);
    allSeries = buildSeries(A).map(s => ({...s, structLbl:''}));
    dateRows = A.rows;
  }
  if (!dateRows.length || !allSeries.length){
    wrapEl.innerHTML = '<div style="padding:30px;text-align:center;color:var(--ink-3)">No data available</div>';
    return;
  }
  let yMin = Infinity, yMax = -Infinity;
  for (const s of allSeries){
    for (const p of s.ptsRec) if (p.val!=null){ yMin = Math.min(yMin, p.val); yMax = Math.max(yMax, p.val); }
    for (const p of s.ptsSold) if (p.val!=null){ yMin = Math.min(yMin, p.val); yMax = Math.max(yMax, p.val); }
  }
  if (!isFinite(yMin)) { yMin = 0; yMax = 100; }
  const range = Math.max(20, yMax - yMin);
  yMin = Math.max(0, Math.floor((yMin - range*0.08)/10)*10);
  yMax = Math.ceil((yMax + range*0.08)/10)*10;
  const W = 1100;
  const H = Math.min(440, 240 + allSeries.length * 20);
  const pad = {l:55, r:200, t:24, b:60};
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
  const n = dateRows.length;
  const stepX = n>1 ? cw/(n-1) : 0;
  const palette = ['#6b5b3f','#3b6b6b','#a83b3b','#c4823b','#5a8c69','#7d5e9c','#a87b47','#3d7a4b'];
  const colorFor = (idx) => palette[idx % palette.length];
  function xFor(i){ return pad.l + i*stepX; }
  function yFor(v){ return pad.t + ch * (1 - (v - yMin)/(yMax - yMin)); }
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet" style="max-width:100%;display:block">`;
  for (let i=0; i<=5; i++){
    const y = pad.t + ch*i/5;
    const v = Math.round(yMax - (yMax-yMin)*i/5);
    svg += `<line x1="${pad.l}" y1="${y}" x2="${W-pad.r}" y2="${y}" stroke="#e8e3da" stroke-width="0.5"/>`;
    svg += `<text x="${pad.l-8}" y="${y+3}" font-size="10" fill="#888" text-anchor="end" font-family="DM Mono">${v}€</text>`;
  }
  const xStep = Math.max(1, Math.ceil(n/14));
  const dowIT = ['S','M','T','W','T','F','S'];
  for (let i=0; i<n; i+=xStep){
    const r = dateRows[i];
    const x = xFor(i);
    const isWE = (r.dow===5 || r.dow===6 || r.dow===0);
    const color = isWE ? 'var(--accent)' : '#666';
    svg += `<line x1="${x}" y1="${pad.t}" x2="${x}" y2="${pad.t+ch}" stroke="#f0ebe1" stroke-width="0.5"/>`;
    svg += `<text x="${x}" y="${pad.t+ch+15}" font-size="9" fill="${color}" text-anchor="middle" font-family="DM Mono">${pad2(r.day)}/${pad2(r.mo)}</text>`;
    svg += `<text x="${x}" y="${pad.t+ch+27}" font-size="8" fill="${color}" text-anchor="middle" font-family="DM Mono">${dowIT[r.dow]}</text>`;
  }
  for (let si=0; si<allSeries.length; si++){
    const s = allSeries[si];
    const color = colorFor(si);
    let path = '', started = false;
    for (let i=0; i<s.ptsRec.length; i++){
      const p = s.ptsRec[i];
      if (p.val == null){ started = false; continue; }
      const x = xFor(i), y = yFor(p.val);
      path += (started ? ' L' : 'M') + x + ' ' + y;
      started = true;
    }
    if (path){
      svg += `<path d="${path}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    let pathSold = '', startedS = false;
    for (let i=0; i<s.ptsSold.length; i++){
      const p = s.ptsSold[i];
      if (p.val == null){ startedS = false; continue; }
      const x = xFor(i), y = yFor(p.val);
      pathSold += (startedS ? ' L' : 'M') + x + ' ' + y;
      startedS = true;
    }
    if (pathSold){
      svg += `<path d="${pathSold}" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4 3" opacity="0.55"/>`;
    }
  }
  for (let i=0; i<n; i++){
    const r = dateRows[i];
    const cx = xFor(i);
    const stripW = stepX > 0 ? stepX : 30;
    const lines = [`${pad2(r.day)}/${pad2(r.mo)}/${r.y} ${dowIT[r.dow]}`];
    for (let si=0; si<allSeries.length; si++){
      const s = allSeries[si];
      const pRec = s.ptsRec[i];
      const pSold = s.ptsSold[i];
      const lblPrefix = s.structLbl ? `[${s.structLbl}] ` : '';
      const recTxt = (pRec && pRec.val!=null) ? Math.round(pRec.val)+'€' : '—';
      const soldTxt = (pSold && pSold.val!=null) ? ' (sold '+Math.round(pSold.val)+'€)' : '';
      lines.push(`${lblPrefix}${s.rt}${s.isBase?' ★':''}: ${recTxt}${soldTxt}`);
    }
    svg += `<rect x="${cx - stripW/2}" y="${pad.t}" width="${stripW}" height="${ch}" fill="rgba(0,0,0,0)" class="bw-hover-zone"><title>${lines.join('\n')}</title></rect>`;
  }
  const lgX = W - pad.r + 12;
  let lgY = pad.t;
  for (let si=0; si<allSeries.length; si++){
    const s = allSeries[si];
    const color = colorFor(si);
    const tag = s.structLbl ? `<tspan fill="#888">[${s.structLbl}] </tspan>` : '';
    const star = s.isBase ? ' ★' : '';
    svg += `<line x1="${lgX}" y1="${lgY+5}" x2="${lgX+18}" y2="${lgY+5}" stroke="${color}" stroke-width="2.5"/>`;
    svg += `<text x="${lgX+24}" y="${lgY+9}" font-size="10.5" fill="#3a2f24" font-family="DM Sans">${tag}${escapeHtml(s.rt)}${star}</text>`;
    lgY += 18;
  }
  if (lgY < pad.t + ch - 20){
    lgY += 8;
    svg += `<line x1="${lgX}" y1="${lgY+5}" x2="${lgX+18}" y2="${lgY+5}" stroke="#666" stroke-width="1.2" stroke-dasharray="4 3"/>`;
    svg += `<text x="${lgX+24}" y="${lgY+9}" font-size="10" fill="#666" font-family="DM Sans" font-style="italic">already loaded (OTB)</text>`;
    lgY += 16;
    svg += `<text x="${lgX}" y="${lgY+9}" font-size="9" fill="#888" font-family="DM Sans" font-style="italic">★ = base room</text>`;
  }
  svg += '</svg>';
  wrapEl.innerHTML = svg;
}
/* ===========================================================================
   FORECAST — tab "Forecast" (12 mesi avanti).
   Per ogni giorno futuro:
     forecast_RN_RT = (RN_FinalLY - RN_STLY + RN_OTB) × (RN_OTB/RN_STLY) × (Pickup4w_OTB/Pickup4w_STLY)
                      capped a inventory(RT)
   Per il prezzo:
     - parte dal price RMES del giorno (= calcolato come tab Sell Strategy con i 5 fattori)
     - applicato alla camera base; per RT non-base aggiunge supplemento stagionale
     - per ogni RN ancora da vendere oltre OTB: +5% scaletta geometrica
     - price medio realizzato = mix di canali (50% storico + 50% ultimi 3 mesi) e tariffe
   =========================================================================== */
function fcstMixFactor(structKey){
  const keys = new Set(structKeysFor(structKey));
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const cutoff3m = addDays(today, -90);
  let allRn=0, allOtaRn=0, allNrRn=0;
  let recRn=0, recOtaRn=0, recNrRn=0;
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (!keys.has(b.struct)) continue;
    if (b.bookYmd > TODAY_YMD) continue;
    const isOTA = (b.channelMarkup && b.channelMarkup > 0);  // canale che ha markup OTA
    const isNR  = !!b.isNonRefundable;
    const rn = b.notti || 0;
    allRn += rn;
    if (isOTA) allOtaRn += rn;
    if (isNR)  allNrRn  += rn;
    if (b.dBook >= cutoff3m){
      recRn += rn;
      if (isOTA) recOtaRn += rn;
      if (isNR)  recNrRn  += rn;
    }
  }
  const allMixOTA = allRn>0 ? allOtaRn/allRn : 0;
  const recMixOTA = recRn>0 ? recOtaRn/recRn : allMixOTA;
  const mixOTA = 0.5*allMixOTA + 0.5*recMixOTA;
  const allMixNR  = allRn>0 ? allNrRn/allRn : 0;
  const recMixNR  = recRn>0 ? recNrRn/recRn : allMixNR;
  const mixNR     = 0.5*allMixNR + 0.5*recMixNR;
  const markupFactor = (1 + 0.12*mixOTA) * (1 - 0.10*mixNR);
  return { mixOTA, mixNR, markupFactor, allRn, recRn };
}
function fcstSupplements(structKey){
  const A = aggPricingDaily(structKey, TODAY_YMD, 1);  // chiamata minima per ottenere i supplementi
  return { supp: A.supplementoStagione, highSeason: A.highSeason, baseRT: A.baseRT, rtList: A.rtList };
}
function fcstRoomsByRT(structKey){
  return structRoomsFor(structKey);  // {rt: numero camere}
}
function fcstFloorShare(structKey){
  const keys = new Set(structKeysFor(structKey));
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const ymdToday = TODAY_YMD;
  const ymdMinus90 = ymd(addDays(today, -90));
  const ymdMinus364 = ymd(addDays(today, -364));
  const ymdMinus454 = ymd(addDays(today, -454));  // -364 - 90
  let curRn = 0, lyRn = 0;
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (!keys.has(b.struct)) continue;
    let cur = startOfDay(b.dIn);
    const end = startOfDay(b.dOut);
    while (cur < end){
      const k = ymd(cur);
      if (k > ymdMinus90 && k <= ymdToday) curRn += 1;
      if (k > ymdMinus454 && k <= ymdMinus364) lyRn += 1;
      cur = addDays(cur, 1);
    }
  }
  const share = (lyRn > 0 && curRn > 0) ? curRn / lyRn : 1.0;
  return { share, curRn, lyRn };
}
function fcstShareByMonth(structKey){
  const keys = new Set(structKeysFor(structKey));
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const ymdToday = TODAY_YMD;
  const ymdMinus365 = ymd(addDays(today, -365));
  const ymdMinus728 = ymd(addDays(today, -728));
  const byMonth = {};  // 'MM' (1-12 padded) → { curRn, lyRn }
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (!keys.has(b.struct)) continue;
    let cur = startOfDay(b.dIn);
    const end = startOfDay(b.dOut);
    while (cur < end){
      const k = ymd(cur);
      const mm = pad2(cur.getMonth() + 1);
      if (!byMonth[mm]) byMonth[mm] = { curRn: 0, lyRn: 0 };
      if (k > ymdMinus365 && k <= ymdToday) byMonth[mm].curRn += 1;
      if (k > ymdMinus728 && k <= ymdMinus365) byMonth[mm].lyRn += 1;
      cur = addDays(cur, 1);
    }
  }
  const out = {};
  for (const mm in byMonth){
    const o = byMonth[mm];
    if (o.lyRn > 0 && o.curRn > 0){
      out[mm] = { share: o.curRn / o.lyRn, curRn: o.curRn, lyRn: o.lyRn };
    } else {
      out[mm] = { share: null, curRn: o.curRn, lyRn: o.lyRn };
    }
  }
  return out;
}
function fcstShareForMonth(globalShare, monthShareMap, mm){
  const m = monthShareMap[mm];
  if (m && m.share != null && isFinite(m.share)){
    if (m.curRn >= 30){
      return { share: m.share, source: 'mensile', curRn: m.curRn, lyRn: m.lyRn };
    }
    if (m.curRn >= 10){
      const blended = 0.6 * m.share + 0.4 * globalShare;
      return { share: blended, source: 'blend', curRn: m.curRn, lyRn: m.lyRn };
    }
  }
  return { share: globalShare, source: 'globale', curRn: (m ? m.curRn : 0), lyRn: (m ? m.lyRn : 0) };
}
function fcstPaceFactor(structKey){
  const pkAgg = aggPickup(structKey);
  let curRn=0, stlyRn=0;
  for (const rt of pkAgg.rtAxis){
    for (let i=0; i<pkAgg.weeks.length; i++){
      curRn  += pkAgg.rt[rt][i].rn;
      stlyRn += pkAgg.rtS[rt][i].rn;
    }
  }
  if (stlyRn>0 && curRn>0){
    const ratio = curRn/stlyRn;
    return { ratio, mult: ratio<0.9 ? 0.95 : (ratio>1.1 ? 1.05 : 1.00), curRn, stlyRn };
  }
  return { ratio: null, mult: 1, curRn, stlyRn };
}
function fcstAirdnaMap(){
  const AIRDNA_TOTAL_LISTINGS = 2948;
  const map = {}; let sum=0, n=0;
  for (const m of MARKET_RATES){
    if (m.ymd >= TODAY_YMD){
      const idx = m.listings/AIRDNA_TOTAL_LISTINGS;
      map[m.ymd] = idx;
      sum += idx; n += 1;
    }
  }
  const avg = n>0 ? sum/n : 0;
  return { map, avg, listings: AIRDNA_TOTAL_LISTINGS };
}
function fcstAdrGrowth(structKey){
  const keys = new Set(structKeysFor(structKey));
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const ymdToday = TODAY_YMD;
  const ymdMinus90 = ymd(addDays(today, -90));
  const ymdMinus364 = ymd(addDays(today, -364));
  const ymdMinus454 = ymd(addDays(today, -454));
  let curRn = 0, curRev = 0;
  let lyRn = 0, lyRev = 0;
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (!keys.has(b.struct)) continue;
    let cur = startOfDay(b.dIn);
    const end = startOfDay(b.dOut);
    while (cur < end){
      const k = ymd(cur);
      if (k > ymdMinus90 && k <= ymdToday){
        curRn += 1; curRev += b.revPerNight;
      }
      if (k > ymdMinus454 && k <= ymdMinus364){
        lyRn += 1; lyRev += b.revPerNight;
      }
      cur = addDays(cur, 1);
    }
  }
  const curAdr = curRn>0 ? curRev/curRn : 0;
  const lyAdr  = lyRn>0  ? lyRev/lyRn  : 0;
  const growth = (lyAdr>0 && curAdr>0) ? curAdr/lyAdr : 1.0;
  return { growth, curAdr, lyAdr, curRn, lyRn };
}
function aggForecast(structKey){
  const sel = (structKey === 'both') ? 'condotta' : structKey;
  const inventory = fcstRoomsByRT(sel);
  const rtList = Object.keys(inventory);
  const totRooms = Object.values(inventory).reduce((s,v)=>s+v, 0);
  const mix = fcstMixFactor(sel);                    // mix canali / tariffe
  const pace = fcstPaceFactor(sel);                  // pace 4-weeks (booking)
  const floorShare = fcstFloorShare(sel);            // share RN cur/LY ultimi 90d (stay-night, globale)
  const monthShareMap = (typeof fcstShareByMonth === 'function') ? fcstShareByMonth(sel) : {};  // share per mese di stay (12 mesi cur vs LY)
  const adrGrowth = fcstAdrGrowth(sel);              // growth ADR cur/LY ultimi 90d
  const supp = fcstSupplements(sel);
  const baseRT = supp.baseRT;
  const FCST_RANGE = [];
  for (let mo=1; mo<=12; mo++) FCST_RANGE.push({ y: 2026, mo });
  for (let mo=1; mo<=4;  mo++) FCST_RANGE.push({ y: 2027, mo });
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const today0 = today;
  const ymdToday = TODAY_YMD;
  const keys = new Set(structKeysFor(sel));
  function daysInMonth(y, m){ return new Date(y, m, 0).getDate(); }
  const monthly = {};
  for (const ym of FCST_RANGE){
    const ymKey = ym.y*100 + ym.mo;
    monthly[ymKey] = {
      y: ym.y, mo: ym.mo,
      days: daysInMonth(ym.y, ym.mo),
      otbRn: 0, otbRev: 0,
      actualPastRn: 0, actualPastRev: 0,
      finalLyRn: 0, finalLyRev: 0,
      stlyRn: 0, stlyRev: 0,                  // STLY: booking pace at -364d (only bookings acquired by today-364)
      pickupCurRev: 0, pickupCurRn: 0,
      pickupStlyRev: 0, pickupStlyRn: 0,
      byRt: {},
      lyByDate: {},     // ymd of stay-date (this year, mapped from LY) → LY nights count → used to spread monthly fcstRn over dates
      otbByDate: {},    // ymd of stay-date → OTB nights already on the books for that date
    };
    for (const rt of rtList){
      monthly[ymKey].byRt[rt] = {
        otbRn: 0, otbRev: 0,
        actualPastRn: 0, actualPastRev: 0,
        finalLyRn: 0, finalLyRev: 0,
        forecastRn: 0, forecastRev: 0,
      };
    }
  }
  const pickupCutoffYmd = ymd(addDays(today0, -7));     // last 7 days (cur) — 1-week window
  const stlyPickupEndYmd = ymd(addDays(today0, -364));
  const stlyPickupStartYmd = ymd(addDays(today0, -371)); // STLY: 7-day window ending at today−364
  function ymdNum(y, m, d){ return y*10000 + m*100 + d; }
  const EAST_APR26_START = ymdNum(2026, 4, 1);
  const EAST_APR26_END   = ymdNum(2026, 4, 5);
  const APR25_FILL_START = ymdNum(2025, 4, 1);
  const APR25_FILL_END   = ymdNum(2025, 4, 5);
  const easterCorrectionApplied = true;  // sempre attiva: usa solo dati 2025+2026 già disponibili
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (!keys.has(b.struct)) continue;
    if (!rtList.includes(b.room)) continue;
    let cur = startOfDay(b.dIn);
    const end = startOfDay(b.dOut);
    while (cur < end){
      const y = cur.getFullYear();
      const mo = cur.getMonth() + 1;
      const d = cur.getDate();
      const ymKey = y*100 + mo;
      const dymd = ymdNum(y, mo, d);
      if (y === 2025){
        const fcstYmKey = (y+1)*100 + mo;  // → 2026 stesso mese
        if (monthly[fcstYmKey] && monthly[fcstYmKey].byRt[b.room]){
          monthly[fcstYmKey].finalLyRn += 1;
          monthly[fcstYmKey].finalLyRev += b.revPerNight;
          monthly[fcstYmKey].byRt[b.room].finalLyRn += 1;
          monthly[fcstYmKey].byRt[b.room].finalLyRev += b.revPerNight;
          // map LY 2025 stay-night to matching date in fcst year 2026 (+364 days)
          const fcstStayDate = addDays(cur, 364);
          const fcstStayYmd = ymd(fcstStayDate);
          monthly[fcstYmKey].lyByDate[fcstStayYmd] = (monthly[fcstYmKey].lyByDate[fcstStayYmd] || 0) + 1;
          // STLY: count this LY night only if the booking was acquired by today-364
          if (b.bookYmd <= STLY_YMD){
            monthly[fcstYmKey].stlyRn += 1;
            monthly[fcstYmKey].stlyRev += b.revPerNight;
          }
        }
        if (dymd >= APR25_FILL_START && dymd <= APR25_FILL_END){
          const fillTarget = monthly[202704];
          if (fillTarget && fillTarget.byRt[b.room]){
            fillTarget.finalLyRn += 1;
            fillTarget.finalLyRev += b.revPerNight;
            fillTarget.byRt[b.room].finalLyRn += 1;
            fillTarget.byRt[b.room].finalLyRev += b.revPerNight;
          }
        }
      }
      if (y === 2026 && mo <= 4){
        const isInAprEaster26 = (dymd >= EAST_APR26_START && dymd <= EAST_APR26_END);
        let fcstYmKey;
        if (isInAprEaster26){
          fcstYmKey = 202703;
        } else {
          fcstYmKey = (y+1)*100 + mo;
        }
        if (monthly[fcstYmKey] && monthly[fcstYmKey].byRt[b.room]){
          monthly[fcstYmKey].finalLyRn += 1;
          monthly[fcstYmKey].finalLyRev += b.revPerNight;
          monthly[fcstYmKey].byRt[b.room].finalLyRn += 1;
          monthly[fcstYmKey].byRt[b.room].finalLyRev += b.revPerNight;
          // map this LY stay-night to the matching date in the forecast year (today−364 shift)
          // and accumulate "LY nights per fcst stay-date" → used to spread monthly fcstRn over dates
          const fcstStayDate = addDays(cur, 364);
          const fcstStayYmd = ymd(fcstStayDate);
          monthly[fcstYmKey].lyByDate[fcstStayYmd] = (monthly[fcstYmKey].lyByDate[fcstStayYmd] || 0) + 1;
          // STLY: count this LY night only if the booking was acquired by today-364
          if (b.bookYmd <= STLY_YMD){
            monthly[fcstYmKey].stlyRn += 1;
            monthly[fcstYmKey].stlyRev += b.revPerNight;
          }
        }
      }
      if (monthly[ymKey] && monthly[ymKey].byRt[b.room]){
        monthly[ymKey].otbRn += 1;
        monthly[ymKey].otbRev += b.revPerNight;
        monthly[ymKey].byRt[b.room].otbRn += 1;
        monthly[ymKey].byRt[b.room].otbRev += b.revPerNight;
        // OTB nights per stay-date inside the month (used to know "what's already on the books per date")
        const stayYmd = ymd(cur);
        monthly[ymKey].otbByDate[stayYmd] = (monthly[ymKey].otbByDate[stayYmd] || 0) + 1;
        if (cur < today0){
          monthly[ymKey].actualPastRn += 1;
          monthly[ymKey].actualPastRev += b.revPerNight;
          monthly[ymKey].byRt[b.room].actualPastRn += 1;
          monthly[ymKey].byRt[b.room].actualPastRev += b.revPerNight;
        }
      }
      cur = addDays(cur, 1);
    }
    if (b.bookYmd > pickupCutoffYmd && b.bookYmd <= ymdToday){
      let cur2 = startOfDay(b.dIn);
      const end2 = startOfDay(b.dOut);
      while (cur2 < end2){
        const y = cur2.getFullYear();
        const mo = cur2.getMonth() + 1;
        const ymKey = y*100 + mo;
        if (monthly[ymKey] && cur2 >= today0){
          monthly[ymKey].pickupCurRev += b.revPerNight;
          monthly[ymKey].pickupCurRn += 1;
        }
        cur2 = addDays(cur2, 1);
      }
    }
    if (b.bookYmd > stlyPickupStartYmd && b.bookYmd <= stlyPickupEndYmd){
      let cur2 = startOfDay(b.dIn);
      const end2 = startOfDay(b.dOut);
      while (cur2 < end2){
        const y = cur2.getFullYear();
        const mo = cur2.getMonth() + 1;
        const fcstYmKey = (y+1)*100 + mo;  // map to Forecast year
        if (monthly[fcstYmKey]){
          monthly[fcstYmKey].pickupStlyRev += b.revPerNight;
          monthly[fcstYmKey].pickupStlyRn += 1;
        }
        cur2 = addDays(cur2, 1);
      }
    }
  }
  const shareCapped = Math.max(0.70, Math.min(1.30, floorShare.share));
  const adrGrowthCapped = Math.max(0.70, Math.min(1.30, adrGrowth.growth || 1.0));
  const ADR_BOOST = {
    alfani: {
      202606: 1.07,  // giugno 2026 → ADR +7% (~metà strada vs budget)
      202607: 1.15,  // luglio 2026 → ADR +15% (~metà strada vs budget)
      202609: 1.08,  // settembre 2026 → ADR +8% (~metà strada vs budget)
      202612: 1.23,  // dicembre 2026 → ADR +23% per allineamento al budget (€43k)
    },
    firenze: {},
    condotta: {},
  };
  function adrBoostFor(sel, ymKey){
    const map = ADR_BOOST[sel] || {};
    return map[ymKey] || 1.0;
  }
  const OCC_TO_BUDGET = {
    alfani: {
      202607: true,  // luglio 2026 → OCC% al budget (83%)
      202609: true,  // settembre 2026 → OCC% al budget (92%)
    },
    firenze: {},
    condotta: {},
  };
  function occToBudgetFor(sel, ymKey){
    const map = OCC_TO_BUDGET[sel] || {};
    return !!map[ymKey];
  }
  const todayNum = today0.getFullYear()*10000 + (today0.getMonth()+1)*100 + today0.getDate();
  const lastFcstDate = new Date(2027, 3, 30);  // 30 aprile 2027 (ultimo giorno fcst)
  const rmesRangeDays = Math.max(1, Math.ceil((lastFcstDate - today0) / 86400000) + 5);
  let _rmesMapForFcst = null;
  try {
    if (typeof computeRMESPriceMap === 'function'){
      _rmesMapForFcst = computeRMESPriceMap(sel, todayNum, rmesRangeDays);
    }
  } catch(e){ _rmesMapForFcst = null; }
  function _rmesAdrPickupForMonth(y, mo, rt){
    if (!_rmesMapForFcst) return null;
    let weightedSum = 0, totWeight = 0;
    let fallbackSum = 0, fallbackCount = 0;  // backup non-pesato (se totWeight=0)
    const daysInMo = new Date(y, mo, 0).getDate();
    for (let d = 1; d <= daysInMo; d++){
      const dDate = new Date(y, mo-1, d);
      if (dDate < today0) continue;
      const ymdN = y*10000 + mo*100 + d;
      const dd = _rmesMapForFcst[ymdN];
      if (!dd) continue;
      let priceForRt = null;
      if (dd.pricesByRT && dd.pricesByRT[rt] != null && isFinite(dd.pricesByRT[rt])){
        priceForRt = dd.pricesByRT[rt];
      } else if (dd.rmesSuggestedByRT && dd.rmesSuggestedByRT[rt] != null && isFinite(dd.rmesSuggestedByRT[rt])){
        priceForRt = dd.rmesSuggestedByRT[rt];
      }
      if (priceForRt == null) continue;
      const cap = (dd.cap != null && isFinite(dd.cap)) ? dd.cap : 0;
      const otb = (dd.curRn != null && isFinite(dd.curRn)) ? dd.curRn : 0;
      const residual = Math.max(0, cap - otb);
      const weight = cap > 0 ? residual / cap : 1;
      weightedSum += priceForRt * weight;
      totWeight += weight;
      fallbackSum += priceForRt;
      fallbackCount += 1;
    }
    if (totWeight > 0) return weightedSum / totWeight;
    if (fallbackCount > 0) return fallbackSum / fallbackCount;
    return null;
  }
  for (const ymKey of Object.keys(monthly)){
    const m = monthly[ymKey];
    let totFcstRn = 0;
    let totFcstRev = 0;
    const lastDayDate = startOfDay(new Date(m.y, m.mo - 1, m.days));
    const firstDayDate = startOfDay(new Date(m.y, m.mo - 1, 1));
    const monthState = (lastDayDate < today0) ? 'PAST'
                     : (firstDayDate > today0) ? 'FUTURE'
                     : 'CURRENT';
    m.monthState = monthState;
    let occOverrideShare = null;  // { rt: rnTarget } per il mese
    if (monthState === 'FUTURE' && occToBudgetFor(sel, ymKey)){
      const budOcc = (typeof budgetMonthlyFor === 'function') ? budgetMonthlyFor(sel, ymKey, 'occ') : 0;
      if (budOcc > 0){
        const budRnTarget = budOcc * totRooms * m.days;
        let totLyForMix = 0;
        for (const rt of rtList) totLyForMix += m.byRt[rt].finalLyRn || 0;
        occOverrideShare = {};
        const rtCap = {}, rtCap98 = {};
        for (const rt of rtList){
          rtCap[rt] = inventory[rt] * m.days;
          rtCap98[rt] = rtCap[rt] * 0.98;
          if (totLyForMix > 0){
            const rtShare = m.byRt[rt].finalLyRn / totLyForMix;
            occOverrideShare[rt] = budRnTarget * rtShare;
          } else {
            occOverrideShare[rt] = budRnTarget * (inventory[rt] / totRooms);
          }
        }
        for (let iter = 0; iter < 5; iter++){
          let overflow = 0;
          const underUtilized = [];
          for (const rt of rtList){
            if (occOverrideShare[rt] > rtCap98[rt]){
              overflow += (occOverrideShare[rt] - rtCap98[rt]);
              occOverrideShare[rt] = rtCap98[rt];
            } else {
              const residual = rtCap98[rt] - occOverrideShare[rt];
              if (residual > 0.5) underUtilized.push({rt, residual});
            }
          }
          if (overflow < 0.5 || underUtilized.length === 0) break;
          const totResidual = underUtilized.reduce(function(s,x){return s+x.residual},0);
          for (const u of underUtilized){
            const add = overflow * (u.residual / totResidual);
            occOverrideShare[u.rt] += add;
          }
        }
      }
    }
    for (const rt of rtList){
      const rtData = m.byRt[rt];
      const cap = inventory[rt] * m.days;
      const capMaxOcc = cap * 0.98;
      const finalLyAdr = rtData.finalLyRn > 0 ? rtData.finalLyRev/rtData.finalLyRn : 0;
      const adrBoost = adrBoostFor(sel, ymKey);
      const effectiveAdrMult = adrGrowthCapped * adrBoost;
      let fcstRn, fcstAdr, fcstRev;
      if (monthState === 'PAST'){
        fcstRn = rtData.otbRn;
        fcstRev = rtData.otbRev;
        fcstAdr = fcstRn > 0 ? fcstRev/fcstRn : 0;
      } else if (monthState === 'CURRENT'){
        const todayDay = today0.getDate();
        const daysRemaining = Math.max(0, m.days - todayDay + 1);
        const daysPast = m.days - daysRemaining;
        const mmKey_cur = pad2(m.mo);
        const shareInfo_cur = (typeof fcstShareForMonth === 'function')
          ? fcstShareForMonth(floorShare.share, monthShareMap, mmKey_cur)
          : { share: floorShare.share, source: 'globale' };
        const shareCapped_month_cur = Math.max(0.70, Math.min(1.30, shareInfo_cur.share));
        rtData._shareSource = shareInfo_cur.source;
        rtData._shareValue = shareCapped_month_cur;
        const lyRnProRata = rtData.finalLyRn * (daysRemaining / m.days);
        const futureBase = lyRnProRata * shareCapped_month_cur;
        const otbFutureRn = rtData.otbRn - rtData.actualPastRn;
        const otbFutureRev = rtData.otbRev - rtData.actualPastRev;
        let futureForecastRn = Math.max(otbFutureRn, futureBase);
        const capResidual = inventory[rt] * daysRemaining * 0.98;
        futureForecastRn = Math.min(Math.max(capResidual, otbFutureRn), futureForecastRn);
        futureForecastRn = Math.min(inventory[rt] * daysRemaining, futureForecastRn);
        const pickupExpectedRn = Math.max(0, futureForecastRn - otbFutureRn);
        const rmesAdr = _rmesAdrPickupForMonth(m.y, m.mo, rt);
        const fallbackAdr = finalLyAdr > 0 ? finalLyAdr * effectiveAdrMult : 0;
        const pickupAdr = (rmesAdr != null && rmesAdr > 0) ? rmesAdr : fallbackAdr;
        rtData.pickupAdrSource = (rmesAdr != null && rmesAdr > 0) ? 'rmes' : 'ly_growth';
        rtData.pickupAdr = pickupAdr;
        const pickupRev = pickupExpectedRn * pickupAdr;
        const futureRev = otbFutureRev + pickupRev;
        fcstRn = Math.round(rtData.actualPastRn + futureForecastRn);
        fcstRev = rtData.actualPastRev + futureRev;
        fcstAdr = fcstRn > 0 ? fcstRev/fcstRn : 0;
      } else {
        let targetRn;
        const mmKey = pad2(m.mo);
        const shareInfo_fut = (typeof fcstShareForMonth === 'function')
          ? fcstShareForMonth(floorShare.share, monthShareMap, mmKey)
          : { share: floorShare.share, source: 'globale' };
        const shareCapped_month_fut = Math.max(0.70, Math.min(1.30, shareInfo_fut.share));
        rtData._shareSource = shareInfo_fut.source;
        rtData._shareValue = shareCapped_month_fut;
        if (occOverrideShare !== null){
          targetRn = occOverrideShare[rt];
        } else {
          targetRn = rtData.finalLyRn * shareCapped_month_fut;
        }
        fcstRn = Math.max(rtData.otbRn, targetRn);
        fcstRn = Math.min(Math.max(capMaxOcc, rtData.otbRn), fcstRn);
        fcstRn = Math.min(cap, fcstRn);
        fcstRn = Math.round(fcstRn);
        const pickupRn = Math.max(0, fcstRn - rtData.otbRn);
        const rmesAdr = _rmesAdrPickupForMonth(m.y, m.mo, rt);
        const fallbackAdr = finalLyAdr > 0 ? finalLyAdr * effectiveAdrMult : 0;
        const pickupAdr = (rmesAdr != null && rmesAdr > 0) ? rmesAdr : fallbackAdr;
        rtData.pickupAdrSource = (rmesAdr != null && rmesAdr > 0) ? 'rmes' : 'ly_growth';
        rtData.pickupAdr = pickupAdr;
        const pickupRev = pickupRn * pickupAdr;
        fcstRev = rtData.otbRev + pickupRev;
        fcstAdr = fcstRn > 0 ? fcstRev/fcstRn : 0;
      }
      rtData.forecastRn = fcstRn;
      rtData.forecastRev = fcstRev;
      rtData.forecastAdr = fcstAdr;
      rtData.finalLyAdr = finalLyAdr;
      totFcstRn += fcstRn;
      totFcstRev += fcstRev;
    }
    if (monthState === 'PAST'){
      m.fcstRn = m.otbRn;
      m.fcstRev = m.otbRev;
    } else {
      m.fcstRn = totFcstRn;
      m.fcstRev = totFcstRev;
    }
    m.adr = m.fcstRn > 0 ? m.fcstRev/m.fcstRn : 0;
    const cap = totRooms * m.days;
    m.occ = cap > 0 ? totFcstRn/cap : 0;
    m.otbOcc = cap > 0 ? m.otbRn/cap : 0;
    m.finalLyOcc = cap > 0 ? m.finalLyRn/cap : 0;
    m.finalLyAdr = m.finalLyRn > 0 ? m.finalLyRev/m.finalLyRn : 0;
    m.diffOtbFct = m.fcstRev - m.otbRev;
    const lastDayOfMonth = new Date(m.y, m.mo, 0).getDate();
    const monthEndDate = startOfDay(new Date(m.y, m.mo - 1, lastDayOfMonth));
    const daysToMonthEnd = Math.max(0, Math.round((monthEndDate - today0) / 86400000) + 1);
    m.daysRemaining = daysToMonthEnd;
    // --- EXACT time-aware pickup target (uses RN expected per stay-date, spread via STLY pattern) ---
    // Idea: residual RN per stay-date = fcstRn_month spread on dates with the STLY pattern (LY nights
    // per date), MINUS OTB already on the books for that date. On each future booking-day t (from
    // today to month-end), the sellable volume is the sum of residual RN on stay-dates d ≥ t. So:
    //   • today (t=0) → sum over the WHOLE month
    //   • day 29 (t close to end) → only the last few dates
    // Target of TODAY = residualRevenue * volumeToday / sum(volume over all future booking days).
    // If the LY pattern is missing (LY data thin), we fall back to the linear weights model.
    let targetTodayRev = 0;
    let exactComputed = false;
    if (daysToMonthEnd > 0 && m.diffOtbFct > 0 && m.fcstRn > m.otbRn){
      const lyByDate = m.lyByDate || {};
      const otbByDate = m.otbByDate || {};
      // 1) total LY weight across the WHOLE month (the denominator for normalising the spread)
      let totalLyWeight = 0;
      const monthYmdList = [];
      for (let dd = 1; dd <= m.days; dd++){
        const ymdD = m.y * 10000 + m.mo * 100 + dd;
        monthYmdList.push(ymdD);
        totalLyWeight += (lyByDate[ymdD] || 0);
      }
      if (totalLyWeight > 0){
        // 2) residual RN per stay-date = (fcstRn_month × lyByDate[d]/totalLy) − OTB[d], floored at 0
        const residualByDate = {};
        let totalResidualRn = 0;
        for (const ymdD of monthYmdList){
          const expectedRnOnDate = m.fcstRn * ((lyByDate[ymdD] || 0) / totalLyWeight);
          const otbOnDate = otbByDate[ymdD] || 0;
          const res = Math.max(0, expectedRnOnDate - otbOnDate);
          residualByDate[ymdD] = res;
          totalResidualRn += res;
        }
        if (totalResidualRn > 0){
          // 3) for each FUTURE booking day t (from today to month-end), compute sellable volume = sum
          //    of residualByDate[d] for d ≥ t. Today's volume = full sum; near month-end → tiny.
          const todayYmdNum = ymd(today0);
          let cumulativeVolumeAcrossBookingDays = 0;
          let volumeOnTodaysBookingDay = 0;
          for (let dd = 1; dd <= m.days; dd++){
            const bookingDayYmd = m.y * 10000 + m.mo * 100 + dd;
            // skip past booking days (we measure from TODAY onward)
            if (bookingDayYmd < todayYmdNum) continue;
            // sellable on this booking day: residual on stay-dates with stayDate ≥ bookingDay
            let vol = 0;
            for (let ee = dd; ee <= m.days; ee++){
              const stayYmd = m.y * 10000 + m.mo * 100 + ee;
              vol += (residualByDate[stayYmd] || 0);
            }
            cumulativeVolumeAcrossBookingDays += vol;
            if (bookingDayYmd === todayYmdNum) volumeOnTodaysBookingDay = vol;
          }
          // If today is BEFORE this month (we're looking at a future month), the whole month is open:
          // every future booking day from today through month-end has full sum of residual on day 1,
          // decreasing on later days. We handle this by using the first day's volume as "today's".
          if (volumeOnTodaysBookingDay === 0){
            // today is before month start → today sees all residual RN as sellable
            volumeOnTodaysBookingDay = totalResidualRn;
            // add booking-days from today to month-start, each with full month volume
            const monthStart = startOfDay(new Date(m.y, m.mo - 1, 1));
            const daysToMonthStart = Math.max(0, Math.round((monthStart - today0) / 86400000));
            cumulativeVolumeAcrossBookingDays += totalResidualRn * daysToMonthStart;
          }
          if (cumulativeVolumeAcrossBookingDays > 0){
            const todaysShare = volumeOnTodaysBookingDay / cumulativeVolumeAcrossBookingDays;
            targetTodayRev = m.diffOtbFct * todaysShare;
            exactComputed = true;
          }
        }
      }
    }
    if (!exactComputed){
      // FALLBACK: linear-weights model (decreasing weights over days). Used when LY pattern is thin
      // or when the gap is zero. Target_today = diffOtbFct × 2 / (D + 1).
      const D = daysToMonthEnd;
      targetTodayRev = D > 0 ? (m.diffOtbFct * 2 / (D + 1)) : 0;
    }
    m.eurPerDayToClose = targetTodayRev;       // kept name for back-compat (it's the target for TODAY)
    m.eurPerWeekToClose = targetTodayRev * 7;  // weekly equivalent (for comparison with 7d pickup)
    m.targetExactMode = exactComputed;          // for the tooltip
    // 1-week pickup windows (was 14 days → now 7, as requested)
    m.eurPerDayPickup7 = m.pickupCurRev / 7;
    m.eurPerDayPickupStly7 = m.pickupStlyRev / 7;
    m.achievement = m.fcstRev > 0 ? m.otbRev / m.fcstRev : 0;
    if (monthState === 'CURRENT' || monthState === 'FUTURE'){
      if (typeof fp_maybeAutoSaveSnapshot === 'function'){
        const snapData = {
          fcstRev: m.fcstRev,
          fcstRn: m.fcstRn,
          fcstOcc: m.occ,
          fcstAdr: m.adr,
          finalLyRev: m.finalLyRev,
          finalLyRn: m.finalLyRn,
        };
        try {
          const status = fp_maybeAutoSaveSnapshot(sel, ymKey, snapData, ymdToday);
          m.snapshotStatus = status;
        } catch(e){}
      }
    }
    if (typeof fp_getFcstSnapshot === 'function'){
      try {
        const snap = fp_getFcstSnapshot(sel, ymKey);
        if (snap){
          m.snapshot = snap;
          const liveValue = (monthState === 'FUTURE') ? m.fcstRev : m.otbRev;
          if (snap.fcstRev > 0){
            m.snapshotDeltaRev = liveValue - snap.fcstRev;
            m.snapshotDeltaRevPct = (liveValue - snap.fcstRev) / snap.fcstRev;
            m.snapshotCompareBase = (monthState === 'FUTURE') ? 'forecast' : 'otb';
          }
        }
      } catch(e){}
    }
  }
  return {
    sel, inventory, rtList, baseRT, totRooms,
    mix, pace, supp, airdna: fcstAirdnaMap(),
    floorShare, shareCapped,
    adrGrowth, adrGrowthCapped,
    monthly,
    horizon: 365,
    easterCorrectionApplied,
  };
}
/* ============ RENDER ============ */
let FCST_SHOW_PAST_2026 = false;
let FCST_HIDE_FUTURE_2027 = false;
function renderForecast(sel){
  const A = aggForecast(sel);
  const M = A.monthly;
  const monthsITLong = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const showPast = (typeof FCST_SHOW_PAST_2026 !== 'undefined') ? FCST_SHOW_PAST_2026 : false;
  const hideFuture = (typeof FCST_HIDE_FUTURE_2027 !== 'undefined') ? FCST_HIDE_FUTURE_2027 : false;
  function isVisibleMonth(ym){
    if (ym >= 202601 && ym <= 202604) return showPast;       // gen-apr 2026 → opzionale
    if (ym >= 202701 && ym <= 202704) return !hideFuture;    // gen-apr 2027 → opzionale (default visibili)
    return true;  // mag-dic 2026 sempre visibili
  }
  let totFcstRn=0, totFcstRev=0, totFLRn=0, totFLRev=0, totOtbRn=0, totOtbRev=0, totDays=0;
  let totStlyRn=0, totStlyRev=0;
  const ymOrderAll = Object.keys(M).map(x=>+x).sort((a,b)=>a-b);
  const ymOrder = ymOrderAll.filter(isVisibleMonth);
  for (const ym of ymOrder){
    const m = M[ym];
    totFcstRn += m.fcstRn; totFcstRev += m.fcstRev;
    totFLRn += m.finalLyRn; totFLRev += m.finalLyRev;
    totOtbRn += m.otbRn; totOtbRev += m.otbRev;
    totStlyRn += (m.stlyRn || 0); totStlyRev += (m.stlyRev || 0);
    totDays += m.days;
  }
  const totCap = A.totRooms * totDays;
  const fcstOcc = totCap>0 ? totFcstRn/totCap : 0;
  const fcstAdr = totFcstRn>0 ? totFcstRev/totFcstRn : 0;
  const flOcc   = totCap>0 ? totFLRn/totCap : 0;
  const flAdr   = totFLRn>0 ? totFLRev/totFLRn : 0;
  const dRev = (totFLRev > 0) ? (totFcstRev - totFLRev)/totFLRev : NaN;
  const dRn  = totFcstRn - totFLRn;
  const kpis = `
    <div class="kpi" style="border-left:3px solid #c4823b">
      <div class="kpi-label">YTD + Forecast Revenue</div>
      <div class="kpi-value">${fmtEUR(totFcstRev)}</div>
      <div class="kpi-sub mono">${totFcstRn} RN · OCC ${fmtPct(fcstOcc,1)} · ADR ${fmtEUR(fcstAdr)}</div>
    </div>
    <div class="kpi" style="border-left:3px solid #8e5fa8">
      <div class="kpi-label">Final LY 2025 (reference)</div>
      <div class="kpi-value">${fmtEUR(totFLRev)}</div>
      <div class="kpi-sub mono">${totFLRn} RN · OCC ${fmtPct(flOcc,1)} · ADR ${fmtEUR(flAdr)}</div>
    </div>
    <div class="kpi" style="border-left:3px solid ${dRev>=0?'#3d7a4b':'#a83b3b'}">
      <div class="kpi-label">Δ vs Final LY</div>
      <div class="kpi-value" style="color:${dRev>=0?'#3d7a4b':'#a83b3b'}">${isFinite(dRev)?(dRev>=0?'+':'')+fmtPct(dRev,1):'—'}</div>
      <div class="kpi-sub mono">${dRn>=0?'+':''}${dRn} RN · ${(totFcstRev-totFLRev>=0?'+':'')+fmtEUR(totFcstRev-totFLRev)}</div>
    </div>
    <div class="kpi" style="border-left:3px solid #6b5b3f">
      <div class="kpi-label">OTB already acquired</div>
      <div class="kpi-value">${fmtEUR(totOtbRev)}</div>
      <div class="kpi-sub mono">${totOtbRn} RN · ${totFcstRev>0?fmtPct(totOtbRev/totFcstRev,0):'—'} of forecast</div>
    </div>
  `;
  document.getElementById('fcst-kpis').innerHTML = kpis;
  let head = `
    <thead>
      <tr>
        <th rowspan="2" style="text-align:left">Month</th>
        <th colspan="3" class="g-26" style="text-align:center">Current OTB</th>
        <th colspan="3" class="g-25" style="background:rgba(142,95,168,.05);text-align:center" title="Same Time Last Year — what was already on the books exactly 364 days ago for this stay month (only bookings acquired by today−364).">STLY (−364d)</th>
        <th colspan="3" class="g-25" style="background:rgba(142,95,168,.10);text-align:center">Final LY 2025</th>
        <th colspan="3" class="g-26" style="background:rgba(195,131,59,.10);text-align:center" title="Past months: actuals. Current month: actuals up to yesterday + forecast from today to month-end. Future months: forecast.">YTD + Forecast (live)</th>
        <th colspan="2" class="g-26" style="background:rgba(59,107,154,.08);text-align:center" title="Forecast saved (frozen) on the 1st day of the month. The Δ% compares the initial snapshot with the actual OTB: for past months = actual close, for the current month = OTB accumulating. Measures how well the initial forecast matches the actual close. Only for months still futuri il confronto è col forecast live.">Month-1st snapshot</th>
        <th colspan="3" class="g-25" style="background:rgba(60,124,90,.08);text-align:center">Budget</th>
        <th colspan="5" class="g-26" style="background:rgba(195,131,59,.04);text-align:center">KPIs for Forecast achievement</th>
      </tr>
      <tr>
        <th>OCC%</th><th>ADR</th><th>Revenue</th>
        <th style="background:rgba(142,95,168,.03)">OCC%</th><th style="background:rgba(142,95,168,.03)">ADR</th><th style="background:rgba(142,95,168,.03)">Revenue</th>
        <th>OCC%</th><th>ADR</th><th>Revenue</th>
        <th>OCC%</th><th>ADR</th><th>Revenue</th>
        <th title="Revenue forecast saved on the 1st of the month">Rev snap</th>
        <th title="Δ% live vs initial snapshot (positive = doing better than forecast at the start of the month)">Δ% vs snap</th>
        <th>OCC%</th><th>ADR</th><th>Revenue</th>
        <th title="YTD+Forecast Revenue − OTB Revenue">Diff € (Fct−OTB)</th>
        <th title="Exact time-aware daily pickup target for TODAY. Uses RN expected per stay-date (monthly fcstRn spread with the STLY pattern, minus OTB). Today's target = residual revenue × today's sellable volume / total volume across all future booking-days. Higher with lead time, lower near month-end. Fallback to linear-weights formula if LY data is thin.">€/day to close</th>
        <th title="Revenue acquired in the last 7 days / 7. Green if ≥ the (time-aware) €/day target (on track), red if below.">€/day pickup 7d</th>
        <th title="STLY revenue acquired in the STLY 7-day window (−364d) / 7">€/day pickup STLY 7d</th>
        <th title="OTB / (YTD+Forecast) Revenue">% Achievement</th>
      </tr>
    </thead>`;
  let body = '';
  for (const ym of ymOrder){
    const m = M[ym];
    const achCls = m.achievement >= 0.95 ? 'cell-pos' : (m.achievement >= 0.70 ? '' : 'cell-neg');
    let pkCmpCls = 'cell-flat';
    if (m.daysRemaining > 0 && m.diffOtbFct > 0){
      pkCmpCls = m.eurPerDayPickup7 >= m.eurPerDayToClose ? 'cell-pos' : 'cell-neg';
    }
    const pkCmpTip = (m.daysRemaining > 0 && m.diffOtbFct > 0)
      ? `Pickup 7d cur (${fmtEUR(m.eurPerDayPickup7)}/g) vs target time-aware (${fmtEUR(m.eurPerDayToClose)}/g) → ${m.eurPerDayPickup7 >= m.eurPerDayToClose ? 'IN LINEA ✓' : 'SOTTO PASSO ✗'}`
      : 'No gap to close';
    const otbAdrM = m.otbRn>0 ? m.otbRev/m.otbRn : 0;
    const isEasterAdj = A.easterCorrectionApplied && m.y === 2027 && (m.mo === 3 || m.mo === 4);
    const easterBadge = isEasterAdj
      ? ` <sup style="color:#8e5fa8;font-size:9px;font-weight:700;cursor:help" title="Final LY corrected for Holy Week.&#10;Mar 2027 = Mar 2026 + days 1-5 April 2026 (Easter part fell in April).&#10;Apr 2027 = (Apr 2026 − days 1-5 April 2026) + days 1-5 April 2025 (filled with non-Easter period: Easter 2025 was 20 Apr).">🐣</sup>`
      : '';
    body += `<tr>
      <td><b>${monthsITLong[m.mo-1]} ${m.y}</b>${easterBadge}</td>
      <td class="cell-mono cell-flat" title="${m.otbRn} RN of ${A.totRooms*m.days} available">${fmtPct(m.otbOcc,1)}</td>
      <td class="cell-mono cell-flat">${m.otbRn>0 ? fmtEUR(otbAdrM) : '—'}</td>
      <td class="cell-mono cell-flat">${fmtEUR(m.otbRev)}</td>
      ${(() => {
        const stlyCap = A.totRooms * m.days;
        const stlyOcc = stlyCap > 0 ? (m.stlyRn || 0) / stlyCap : 0;
        const stlyAdr = (m.stlyRn || 0) > 0 ? (m.stlyRev / m.stlyRn) : 0;
        return `
          <td class="cell-mono cell-flat" style="background:rgba(142,95,168,.03)" title="STLY OCC: ${m.stlyRn||0} RN of ${stlyCap} available">${fmtPct(stlyOcc,1)}</td>
          <td class="cell-mono cell-flat" style="background:rgba(142,95,168,.03)">${m.stlyRn>0 ? fmtEUR(stlyAdr) : '—'}</td>
          <td class="cell-mono cell-flat" style="background:rgba(142,95,168,.03)">${fmtEUR(m.stlyRev || 0)}</td>`;
      })()}
      <td class="cell-mono cell-flat" style="background:rgba(142,95,168,.04)">${fmtPct(m.finalLyOcc,1)}</td>
      <td class="cell-mono cell-flat" style="background:rgba(142,95,168,.04)">${fmtEUR(m.finalLyAdr)}</td>
      <td class="cell-mono cell-flat" style="background:rgba(142,95,168,.04)"><b>${fmtEUR(m.finalLyRev)}</b></td>
      <td class="cell-mono" style="background:rgba(195,131,59,.04)">${fmtPct(m.occ,1)}</td>
      <td class="cell-mono" style="background:rgba(195,131,59,.04)">${fmtEUR(m.adr)}</td>
      <td class="cell-mono" style="background:rgba(195,131,59,.04)"><b>${fmtEUR(m.fcstRev)}</b></td>
      ${(() => {
        const snap = m.snapshot || null;
        if (!snap){
          return `<td class="cell-mono cell-flat" style="background:rgba(59,107,154,.04);color:var(--ink-3);font-style:italic" title="No snapshot available. It will be created on the 1st of next month.">—</td>
                  <td class="cell-mono cell-flat" style="background:rgba(59,107,154,.04);color:var(--ink-3)">—</td>`;
        }
        const snapDate = snap.savedAtYmd ? `${String(snap.savedAtYmd).slice(6,8)}/${String(snap.savedAtYmd).slice(4,6)}/${String(snap.savedAtYmd).slice(0,4)}` : '?';
        const dPct = m.snapshotDeltaRevPct;
        const dRev = m.snapshotDeltaRev;
        let dCls = 'cell-flat';
        if (dPct != null && isFinite(dPct)){
          dCls = dPct >= 0.02 ? 'cell-pos' : (dPct <= -0.02 ? 'cell-neg' : 'cell-flat');
        }
        const dText = (dPct != null && isFinite(dPct))
          ? `${dPct>=0?'+':''}${(dPct*100).toFixed(1)}%`
          : '—';
        const _cmpBase = m.snapshotCompareBase || ((m.monthState === 'FUTURE') ? 'forecast' : 'otb');
        const _liveLbl = (_cmpBase === 'otb') ? 'actual OTB' : 'live forecast';
        const _liveVal = (_cmpBase === 'otb') ? m.otbRev : m.fcstRev;
        const dTip = (dRev != null && isFinite(dRev))
          ? `Month-1st snapshot (${snapDate}): initial forecast €${snap.fcstRev.toFixed(0)} (${snap.fcstRn} RN). ${_liveLbl} now: €${Math.round(_liveVal)}. Δ ${dRev>=0?'+':''}€${Math.round(dRev)} (${dText}). ${_cmpBase==='otb' ? 'Measures how close the initial forecast is to the actual close.' : 'Future month: comparison with the live forecast.'}`
          : `Snapshot del 1° del mese (${snapDate})`;
        return `<td class="cell-mono cell-flat" style="background:rgba(59,107,154,.04);cursor:help" title="${dTip}">${fmtEUR(snap.fcstRev)}</td>
                <td class="cell-mono ${dCls}" style="background:rgba(59,107,154,.04);cursor:help" title="${dTip}"><b>${dText}</b></td>`;
      })()}
      ${(() => {
        const ymBud = m.y*100 + m.mo;
        const budRev = (typeof budgetMonthlyFor === 'function') ? budgetMonthlyFor(sel, ymBud, 'rev') : 0;
        const budOcc = (typeof budgetMonthlyFor === 'function') ? budgetMonthlyFor(sel, ymBud, 'occ') : 0;
        const budAdr = (typeof budgetMonthlyFor === 'function') ? budgetMonthlyFor(sel, ymBud, 'adr') : 0;
        const dvb = m.fcstRev - budRev;
        const revCls = !budRev ? 'cell-flat' : (dvb >= 0 ? 'cell-pos' : 'cell-neg');
        const revTip = budRev > 0 ? `YTD+Forecast vs Budget: ${(dvb>=0?'+':'')+fmtEUR(dvb)} (${(dvb>=0?'+':'')+fmtPct(dvb/budRev,1)})` : 'Budget not available';
        return `<td class="cell-mono cell-flat" style="background:rgba(60,124,90,.04)">${budOcc > 0 ? fmtPct(budOcc,0) : '—'}</td>
                <td class="cell-mono cell-flat" style="background:rgba(60,124,90,.04)">${budAdr > 0 ? fmtEUR(budAdr) : '—'}</td>
                <td class="cell-mono ${revCls}" style="background:rgba(60,124,90,.04)" title="${revTip}"><b>${budRev > 0 ? fmtEUR(budRev) : '—'}</b></td>`;
      })()}
      <td class="cell-mono" style="background:rgba(195,131,59,.04)"><b>${fmtEUR(m.diffOtbFct)}</b></td>
      <td class="cell-mono" style="background:rgba(195,131,59,.04)" title="${m.targetExactMode ? 'EXACT time-aware target for TODAY: residual RN per stay-date (fcstRn spread via the STLY pattern, minus OTB), summed from each future booking-day to month-end. Today gets the full month volume; near month-end only a few dates remain. D=' + m.daysRemaining + ' days left.' : 'Linear-weights fallback (no LY pattern available). Daily target = (Fct−OTB) × 2/(D+1), D=' + m.daysRemaining + '.'}">${m.daysRemaining > 0 ? fmtEUR(m.eurPerDayToClose) : '—'}</td>
      <td class="cell-mono ${pkCmpCls}" style="background:rgba(195,131,59,.04);cursor:help" title="${pkCmpTip}">${fmtEUR(m.eurPerDayPickup7)}</td>
      <td class="cell-mono cell-flat" style="background:rgba(195,131,59,.04)">${fmtEUR(m.eurPerDayPickupStly7)}</td>
      <td class="cell-mono ${achCls}" style="background:rgba(195,131,59,.04)"><b>${fmtPct(m.achievement,0)}</b></td>
    </tr>`;
  }
  const totDiff = totFcstRev - totOtbRev;
  const totDaysRem = ymOrder.reduce((s,ym)=> s + (M[ym].daysRemaining||0), 0);
  const totPickup7  = ymOrder.reduce((s,ym)=> s + (M[ym].pickupCurRev||0), 0);
  const totPickup7Stly = ymOrder.reduce((s,ym)=> s + (M[ym].pickupStlyRev||0), 0);
  const totAch = totFcstRev > 0 ? totOtbRev/totFcstRev : 0;
  const lastYm = ymOrder[ymOrder.length - 1];
  const totDaysToEnd = lastYm ? (M[lastYm].daysRemaining || 0) : 0;
  const totOtbAdr = totOtbRn>0 ? totOtbRev/totOtbRn : 0;
  const totOtbOcc = totCap>0 ? totOtbRn/totCap : 0;
  let totBudgetRev = 0;
  let totBudgetRn = 0;  // RN target derivato dal mix occ × inventario
  let totBudgetDaysWithBudget = 0;
  for (const ym of ymOrder){
    const budRev = (typeof budgetMonthlyFor === 'function') ? (budgetMonthlyFor(sel, ym, 'rev') || 0) : 0;
    const budOcc = (typeof budgetMonthlyFor === 'function') ? (budgetMonthlyFor(sel, ym, 'occ') || 0) : 0;
    totBudgetRev += budRev;
    if (budRev > 0 && budOcc > 0){
      const days = M[ym].days;
      totBudgetRn += budOcc * A.totRooms * days;
      totBudgetDaysWithBudget += days;
    }
  }
  const totBudgetOcc = totBudgetDaysWithBudget > 0 ? totBudgetRn / (A.totRooms * totBudgetDaysWithBudget) : 0;
  const totBudgetAdr = totBudgetRn > 0 ? totBudgetRev / totBudgetRn : 0;
  const totDvb = totFcstRev - totBudgetRev;
  const totBudgetRevCls = !totBudgetRev ? 'cell-flat' : (totDvb >= 0 ? 'cell-pos' : 'cell-neg');
  const totBudgetRevTip = totBudgetRev > 0 ? `YTD+Forecast vs Budget: ${(totDvb>=0?'+':'')+fmtEUR(totDvb)} (${(totDvb>=0?'+':'')+fmtPct(totDvb/totBudgetRev,1)})` : 'Budget not available';
  let totSnapRev = 0, totSnapAvail = 0, totSnapLiveRev = 0;
  for (const ym of ymOrder){
    const mm = M[ym];
    const sn = mm.snapshot;
    const liveForCmp = (mm.monthState === 'FUTURE') ? (mm.fcstRev || 0) : (mm.otbRev || 0);
    if (sn && isFinite(sn.fcstRev)){
      totSnapRev += sn.fcstRev;
      totSnapLiveRev += liveForCmp;
      totSnapAvail += 1;
    } else {
      totSnapRev += mm.fcstRev || 0;
      totSnapLiveRev += mm.fcstRev || 0;
    }
  }
  const totSnapDelta = totSnapRev > 0 ? (totSnapLiveRev - totSnapRev) / totSnapRev : null;
  const totSnapCls = (totSnapDelta != null && totSnapDelta >= 0.02) ? 'cell-pos'
                   : (totSnapDelta != null && totSnapDelta <= -0.02) ? 'cell-neg' : 'cell-flat';
  body += `<tr class="total">
    <td>Total ${ymOrder.length} months</td>
    <td class="cell-mono cell-flat" title="${totOtbRn} RN of ${totCap} available">${fmtPct(totOtbOcc,1)}</td>
    <td class="cell-mono cell-flat">${totOtbRn>0 ? fmtEUR(totOtbAdr) : '—'}</td>
    <td class="cell-mono cell-flat">${fmtEUR(totOtbRev)}</td>
    ${(() => {
      const stlyOccT = totCap > 0 ? totStlyRn / totCap : 0;
      const stlyAdrT = totStlyRn > 0 ? totStlyRev / totStlyRn : 0;
      return `
        <td class="cell-mono cell-flat" style="background:rgba(142,95,168,.03)">${fmtPct(stlyOccT,1)}</td>
        <td class="cell-mono cell-flat" style="background:rgba(142,95,168,.03)">${totStlyRn>0 ? fmtEUR(stlyAdrT) : '—'}</td>
        <td class="cell-mono cell-flat" style="background:rgba(142,95,168,.03)"><b>${fmtEUR(totStlyRev)}</b></td>`;
    })()}
    <td class="cell-mono cell-flat" style="background:rgba(142,95,168,.04)">${fmtPct(flOcc,1)}</td>
    <td class="cell-mono cell-flat" style="background:rgba(142,95,168,.04)">${fmtEUR(flAdr)}</td>
    <td class="cell-mono cell-flat" style="background:rgba(142,95,168,.04)"><b>${fmtEUR(totFLRev)}</b></td>
    <td class="cell-mono" style="background:rgba(195,131,59,.04)">${fmtPct(fcstOcc,1)}</td>
    <td class="cell-mono" style="background:rgba(195,131,59,.04)">${fmtEUR(fcstAdr)}</td>
    <td class="cell-mono" style="background:rgba(195,131,59,.04)"><b>${fmtEUR(totFcstRev)}</b></td>
    <td class="cell-mono cell-flat" style="background:rgba(59,107,154,.04)" title="${totSnapAvail} months with snapshot available out of ${ymOrder.length}">${fmtEUR(totSnapRev)}</td>
    <td class="cell-mono ${totSnapCls}" style="background:rgba(59,107,154,.04)" title="Δ live vs aggregate initial snapshot">${totSnapDelta != null ? '<b>'+(totSnapDelta>=0?'+':'')+(totSnapDelta*100).toFixed(1)+'%</b>' : '—'}</td>
    <td class="cell-mono cell-flat" style="background:rgba(60,124,90,.04)">${totBudgetOcc > 0 ? fmtPct(totBudgetOcc,1) : '—'}</td>
    <td class="cell-mono cell-flat" style="background:rgba(60,124,90,.04)">${totBudgetAdr > 0 ? fmtEUR(totBudgetAdr) : '—'}</td>
    <td class="cell-mono ${totBudgetRevCls}" style="background:rgba(60,124,90,.04)" title="${totBudgetRevTip}"><b>${totBudgetRev > 0 ? fmtEUR(totBudgetRev) : '—'}</b></td>
    <td class="cell-mono" style="background:rgba(195,131,59,.04)"><b>${fmtEUR(totDiff)}</b></td>
    <td class="cell-mono" style="background:rgba(195,131,59,.04)" title="${totDaysToEnd} days from today to end of forecast">${totDaysToEnd > 0 ? fmtEUR(totDiff/totDaysToEnd) : '—'}</td>
    <td class="cell-mono" style="background:rgba(195,131,59,.04)">${fmtEUR(totPickup7/14)}</td>
    <td class="cell-mono cell-flat" style="background:rgba(195,131,59,.04)">${fmtEUR(totPickup7Stly/14)}</td>
    <td class="cell-mono ${totAch >= 0.95 ? 'cell-pos' : (totAch >= 0.70 ? '' : 'cell-neg')}" style="background:rgba(195,131,59,.04)"><b>${fmtPct(totAch,0)}</b></td>
  </tr>`;
  document.getElementById('fcst-monthly-table').innerHTML = '<table class="data">' + head + '<tbody>' + body + '</tbody></table>';
  let rtHead = '<thead><tr><th rowspan="2" style="text-align:left">Room Type</th>';
  for (const ym of ymOrder){
    const m = M[ym];
    rtHead += `<th colspan="3" style="text-align:center">${monthsITLong[m.mo-1].slice(0,3)} ${String(m.y).slice(2)}</th>`;
  }
  rtHead += '<th colspan="3" style="text-align:center;background:rgba(0,0,0,.04)">Total</th></tr><tr>';
  for (let i=0; i<ymOrder.length; i++){
    rtHead += '<th>RN</th><th>ADR</th><th>Rev</th>';
  }
  rtHead += '<th style="background:rgba(0,0,0,.04)">RN</th><th style="background:rgba(0,0,0,.04)">ADR</th><th style="background:rgba(0,0,0,.04)">Rev</th>';
  rtHead += '</tr></thead>';
  let rtBody = '';
  for (const rt of A.rtList){
    let totRn=0, totRev=0;
    let row = `<tr><td><b>${escapeHtml(rt)}</b> <span style="color:var(--ink-3);font-size:10px">(${A.inventory[rt]})</span></td>`;
    for (const ym of ymOrder){
      const m = M[ym].byRt[rt];
      const adr = m.fcstRn>0 ? m.fcstRev/m.fcstRn : 0;
      row += `<td class="cell-mono">${m.fcstRn}</td><td class="cell-mono cell-flat">${fmtEUR(adr)}</td><td class="cell-mono">${fmtEUR(m.fcstRev)}</td>`;
      totRn += m.fcstRn;
      totRev += m.fcstRev;
    }
    const totAdr = totRn>0 ? totRev/totRn : 0;
    row += `<td class="cell-mono" style="background:rgba(0,0,0,.04)"><b>${totRn}</b></td><td class="cell-mono cell-flat" style="background:rgba(0,0,0,.04)">${fmtEUR(totAdr)}</td><td class="cell-mono" style="background:rgba(0,0,0,.04)"><b>${fmtEUR(totRev)}</b></td>`;
    row += '</tr>';
    rtBody += row;
  }
  const _rtTblEl = document.getElementById('fcst-rt-table');
  if (_rtTblEl) _rtTblEl.innerHTML = '<table class="data">' + rtHead + '<tbody>' + rtBody + '</tbody></table>';
  const subEl = document.getElementById('fcst-monthly-sub');
  if (subEl){
    const nMonths = ymOrder.length;
    let label;
    if (showPast && !hideFuture)       label = 'Jan 2026 → Apr 2027 (16 months)';
    else if (!showPast && !hideFuture) label = 'May 2026 → Apr 2027 (12 months)';
    else if (showPast && hideFuture)   label = 'Jan → Dec 2026 (12 months)';
    else                                label = 'May → Dec 2026 (8 months)';
    subEl.textContent = `${label} · Mix OTA ${(A.mix.mixOTA*100).toFixed(0)}% · Mix Non rimb ${(A.mix.mixNR*100).toFixed(0)}% · Markup factor ×${A.mix.markupFactor.toFixed(3)} · Pace ${A.pace.ratio?A.pace.ratio.toFixed(2):'—'} (${A.pace.curRn}/${A.pace.stlyRn} RN)`;
  }
  const cbPast = document.getElementById('fcst-show-past-cb');
  if (cbPast){
    cbPast.checked = FCST_SHOW_PAST_2026;
    if (!cbPast._wired){
      cbPast._wired = true;
      cbPast.addEventListener('change', function(){
        FCST_SHOW_PAST_2026 = cbPast.checked;
        renderForecast(CURRENT_STRUCT);
      });
    }
  }
  const cbHide = document.getElementById('fcst-hide-future-cb');
  if (cbHide){
    cbHide.checked = FCST_HIDE_FUTURE_2027;
    if (!cbHide._wired){
      cbHide._wired = true;
      cbHide.addEventListener('change', function(){
        FCST_HIDE_FUTURE_2027 = cbHide.checked;
        renderForecast(CURRENT_STRUCT);
      });
    }
  }
  renderForecastCharts(A, ymOrder);
}
function renderForecastCharts(A, ymOrder){
  const M = A.monthly;
  const monthsITShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  {
    const W = 720, H = 280;
    const margin = { top: 24, right: 12, bottom: 32, left: 60 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;
    const maxVal = Math.max(...ymOrder.map(ym => Math.max(M[ym].fcstRev, M[ym].finalLyRev || 0)));
    const xStep = innerW / ymOrder.length;
    const barW = xStep * 0.35;
    let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">`;
    for (let i=0; i<=4; i++){
      const yv = (maxVal*i/4);
      const y = margin.top + innerH - (yv/maxVal)*innerH;
      svg += `<line x1="${margin.left}" x2="${margin.left+innerW}" y1="${y}" y2="${y}" stroke="rgba(0,0,0,.06)"/>`;
      svg += `<text x="${margin.left-6}" y="${y+3}" text-anchor="end" font-size="9" font-family="DM Mono,monospace" fill="#888">${(yv/1000).toFixed(0)}k</text>`;
    }
    for (let i=0; i<ymOrder.length; i++){
      const m = M[ymOrder[i]];
      const x0 = margin.left + i*xStep + xStep/2;
      const hF = (m.fcstRev/maxVal)*innerH;
      const hL = ((m.finalLyRev||0)/maxVal)*innerH;
      svg += `<rect x="${x0-barW}" y="${margin.top+innerH-hF}" width="${barW*0.9}" height="${hF}" fill="#c4823b"/>`;
      svg += `<rect x="${x0+barW*0.05}" y="${margin.top+innerH-hL}" width="${barW*0.9}" height="${hL}" fill="#8e5fa8" opacity="0.8"/>`;
      svg += `<text x="${x0}" y="${margin.top+innerH+14}" text-anchor="middle" font-size="9" font-family="DM Mono,monospace" fill="#666">${monthsITShort[m.mo-1]}</text>`;
      svg += `<text x="${x0}" y="${margin.top+innerH+24}" text-anchor="middle" font-size="8" font-family="DM Mono,monospace" fill="#888">${String(m.y).slice(2)}</text>`;
    }
    svg += `</svg>`;
    document.getElementById('fcst-chart-rev').innerHTML = svg;
  }
  {
    const W = 720, H = 240;
    const margin = { top: 16, right: 12, bottom: 32, left: 50 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;
    const xStep = innerW / Math.max(1, ymOrder.length - 1);
    let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">`;
    for (let i=0; i<=4; i++){
      const yv = 25*i;
      const y = margin.top + innerH - (yv/100)*innerH;
      svg += `<line x1="${margin.left}" x2="${margin.left+innerW}" y1="${y}" y2="${y}" stroke="rgba(0,0,0,.06)"/>`;
      svg += `<text x="${margin.left-6}" y="${y+3}" text-anchor="end" font-size="9" font-family="DM Mono,monospace" fill="#888">${yv}%</text>`;
    }
    let pathF = 'M', pathL = 'M';
    for (let i=0; i<ymOrder.length; i++){
      const m = M[ymOrder[i]];
      const x = margin.left + i*xStep;
      const yF = margin.top + innerH - (m.occ)*innerH;
      const yL = margin.top + innerH - (m.finalLyOcc)*innerH;
      pathF += (i===0?'':' L') + ` ${x} ${yF}`;
      pathL += (i===0?'':' L') + ` ${x} ${yL}`;
      svg += `<circle cx="${x}" cy="${yF}" r="3" fill="#c4823b"/>`;
      svg += `<circle cx="${x}" cy="${yL}" r="2.5" fill="#8e5fa8"/>`;
      svg += `<text x="${x}" y="${margin.top+innerH+14}" text-anchor="middle" font-size="9" font-family="DM Mono,monospace" fill="#666">${monthsITShort[m.mo-1]}</text>`;
    }
    svg += `<path d="${pathF}" stroke="#c4823b" stroke-width="2" fill="none"/>`;
    svg += `<path d="${pathL}" stroke="#8e5fa8" stroke-width="1.5" fill="none" stroke-dasharray="4 3"/>`;
    svg += `</svg>`;
    document.getElementById('fcst-chart-occ').innerHTML = svg;
  }
}
/* ============================================================
   RATE SHOPPER TAB
   3 tabelle competitor (una per struttura) con peso % editabile per ogni competitor.
   I pesi sono salvati in localStorage e usati per calcolare la "media ponderata compset"
   che a sua volta determina il moltiplicatore C nel sistema RMES (Sell Strategy).
   Property filter: 'all' (default) | 'firenze' | 'condotta' | 'alfani'
   ============================================================ */
const RATE_WEIGHTS_KEY = 'rmes_compset_weights_v1';
let RATE_STRUCT_FILTER = 'all';  // default: mostra tutte
function loadRateWeights(){
  try {
    const raw = localStorage.getItem(RATE_WEIGHTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e){}
  return {};  // {struct: {compName: weight 0..1}}
}
function saveRateWeights(weights){
  try { localStorage.setItem(RATE_WEIGHTS_KEY, JSON.stringify(weights)); } catch(e){}
}
function getWeight(struct, compName){
  const w = loadRateWeights();
  if (w[struct] && w[struct][compName] != null) return w[struct][compName];
  const RATE_WEIGHT_DEFAULTS = {
    condotta: {"Residenza Marchesi Pontenani":0.5,"Palazzo Alfani al David":1.0,"Florence Art Apartments":1.0,"Casa del Sarto":0.2,"Granduomo Charming Accomodation":1.0,"Residence Hilda":1.0,"Ricasoli Garden Relais":0.0,"Residenza Della Signoria":0.5},
    firenze: {"Palazzo Alfani al David":0.5,"Relais Condotta":0.5,"Residenza dei Pucci":1.0,"La Maison du Sage":1.0,"Velona's Jungle Luxury Suites":1.0,"Residenza La Musa Amarcord":1.0,"Ricasoli Garden Relais":1.0},
    alfani: {"Chic Stay Boutique Apartments":0.0,"Martelli 6 Suites and Apartments":0.0,"Tornabuoni Suites Collection":1.0,"Ricasoli Garden Relais":0.9,"Solo Experience Hotel":0.9,"Residenza Marchesi Pontenani":0.9,"Florence Art Apartments":1.0,"Granduomo Charming Accomodation":0.9,"Residence Hilda":1.0,"Condotta 16 Apartments":1.0,"Casa del Sarto":1.0},
    davids: {"B&B Stanze Guelfe":1.0,"Residenza Fanti":0.9,"RFC Repubblica Florence Core B&B":0.1,"Althea Rooms":0.0,"Apollo Guest House":1.0,"Aramis Deluxe Rooms":0.7,"Holiday Rooms Florence":0.0,"La Locandiera B&B":0.8,"La Tana dei Leoni B&B":0.0,"Locanda il Salimbecco":0.0,"Residenza San Lorenzo":0.0}
  };
  if (RATE_WEIGHT_DEFAULTS[struct] && RATE_WEIGHT_DEFAULTS[struct][compName] != null){
    return RATE_WEIGHT_DEFAULTS[struct][compName];
  }
  return 1.0;  // default 100%
}
function setWeight(struct, compName, value){
  const w = loadRateWeights();
  if (!w[struct]) w[struct] = {};
  w[struct][compName] = value;
  saveRateWeights(w);
}
function compsetWeightedAvg(struct, isoKey, applyOffset, opts){
  // applyOffset=true  → Expedia GOAL VALUE: prezzo in spazio Beddy-eq + offset per competitor.
  //                     Usato SOLO nel Base Price come cap massimo (posizionamento-obiettivo).
  // applyOffset=false → WEIGHTED EXPEDIA COMPSET: prezzo in spazio Beddy-eq SENZA offset.
  //                     Usato nei fattori RMES (D·Online Pricing, E·Demand Expedia) per il
  //                     confronto "io vs mercato" — gli offset NON devono entrare qui.
  // opts.rawExpedia=true → prezzo Expedia lordo, senza divisor né offset (uso interno/debug).
  opts = opts || {};
  if (typeof EXPEDIA_DATA === 'undefined' || !EXPEDIA_DATA) return {avg: null, n: 0};
  let compMap = null;
  if (struct === 'condotta') compMap = EXPEDIA_DATA.competitors;
  else if (struct === 'alfani') compMap = EXPEDIA_DATA.competitors_alfani;
  else if (struct === 'firenze') compMap = EXPEDIA_DATA.competitors_firenze;
  else if (struct === 'davids') compMap = EXPEDIA_DATA.competitors_davids;
  if (!compMap) return {avg: null, n: 0};
  const myStructKeys = new Set([
    'Condotta 16 Apartments',     // = Condotta nei compset Alfani e Firenze
    'Palazzo Alfani al David',    // = Alfani nei compset Condotta e Firenze
  ]);
  // Il divisor (Expedia→Beddy) si applica sia per il Goal Value sia per il Weighted Compset RMES,
  // perché in entrambi i casi vogliamo confrontare in spazio Beddy. Solo rawExpedia lo salta.
  const wantDivisor = !opts.rawExpedia;
  const divisor = (wantDivisor && typeof fp_expToBeddyDivisor === 'function') ? fp_expToBeddyDivisor(struct) : null;
  let total = 0, n = 0;
  const names = [];
  for (const name in compMap){
    if (myStructKeys.has(name)) continue;  // escludo mie strutture mutuali
    const p = compMap[name][isoKey];
    if (p == null || !isFinite(p) || p < 10) continue;  // < 10€ = MLOS leaked, not a price
    const w = getWeight(struct, name);
    if (w <= 0) continue;  // peso 0 = competitor escluso, non conta nemmeno nel divisore
    let priceToUse = p;
    if (divisor){
      priceToUse = p / divisor;  // porto in spazio Beddy-eq
      if (applyOffset){
        // Goal Value: aggiungo l'offset di posizionamento del competitor
        let offset = 0;
        try {
          const cfg = (typeof fp_getCompsetConfig === 'function') ? fp_getCompsetConfig(struct, name) : null;
          if (cfg && typeof cfg.offset === 'number') offset = cfg.offset;
        } catch(e){}
        priceToUse = priceToUse + offset;
      }
    }
    total += priceToUse * w;
    n += 1;
    names.push(name);
  }
  if (n === 0) return {avg: null, n: 0};
  const unit = opts.rawExpedia ? 'expedia_lordo' : 'beddy_eq';
  return {avg: total / n, n, contributingNames: names, unit, withOffset: !!applyOffset};
}
function renderRateShopper(){
  const wrap = document.getElementById('rate-tables-wrap');
  if (!wrap) return;
  const structDefs = [
    { key: 'alfani',   label: 'Palazzo Alfani',  compMap: (EXPEDIA_DATA && EXPEDIA_DATA.competitors_alfani)  || null, color: '#8e5fa8' },
    { key: 'condotta', label: 'Condotta 16',     compMap: (EXPEDIA_DATA && EXPEDIA_DATA.competitors)         || null, color: '#3d7a4b' },
    { key: 'firenze',  label: 'Firenze Suite',   compMap: (EXPEDIA_DATA && EXPEDIA_DATA.competitors_firenze) || null, color: '#3b6b9a' },
    { key: 'davids',   label: "Enis Guesthouse", compMap: (EXPEDIA_DATA && EXPEDIA_DATA.competitors_davids) || null, color: '#c0392b' },
  ];
  const pillsEl = document.getElementById('rate-struct-pills');
  if (pillsEl){
    const opts = [
      { v: 'all',      label: 'All',            color: '#6b5b3f' },
      { v: 'alfani',   label: 'Palazzo Alfani',   color: '#8e5fa8' },
      { v: 'condotta', label: 'Condotta 16',      color: '#3d7a4b' },
      { v: 'firenze',  label: 'Firenze Suite',    color: '#3b6b9a' },
      { v: 'davids',   label: "Enis Guesthouse", color: '#c0392b' },
    ];
    pillsEl.innerHTML = opts.map(o => {
      const on = (RATE_STRUCT_FILTER === o.v);
      return `<button class="rt-pill ${on?'':'off'}" data-rfilter="${o.v}" style="${on?'border-color:'+o.color+';color:'+o.color+';font-weight:600':''}">${o.label}</button>`;
    }).join('');
    pillsEl.querySelectorAll('button[data-rfilter]').forEach(btn => {
      btn.addEventListener('click', () => {
        RATE_STRUCT_FILTER = btn.dataset.rfilter;
        renderRateShopper();
      });
    });
  }
  const visibleStructs = (RATE_STRUCT_FILTER === 'all')
    ? structDefs
    : structDefs.filter(s => s.key === RATE_STRUCT_FILTER);
  let html = '';
  for (const sd of visibleStructs){
    html += `<div class="panel" style="margin-bottom:18px;border-top:3px solid ${sd.color}">
      <div class="panel-head">
        <div>
          <h3 style="color:${sd.color}">${escapeHtml(sd.label)} · Compset Expedia</h3>
          <div class="panel-sub">${(() => {
            if (!sd.compMap) return '<i style="color:var(--ink-3)">No Expedia data available for this property</i>';
            const exclSet = new Set(['Condotta 16 Apartments', 'Palazzo Alfani al David']);
            const n = Object.keys(sd.compMap).filter(k => !exclSet.has(k)).length;
            return n + ' competitors monitored';
          })()}</div>
        </div>
      </div>
      <div class="panel-body flush">`;
    if (!sd.compMap || Object.keys(sd.compMap).length === 0){
      html += `<div style="padding:24px;text-align:center;color:var(--ink-3);font-size:12px;font-style:italic">
        Caricheremo i dati di ${escapeHtml(sd.label)} non appena saranno disponibili nel rate shopper Expedia.
      </div>`;
    } else {
      const allDates = new Set();
      for (const name in sd.compMap){
        for (const d in sd.compMap[name]) allDates.add(d);
      }
      const dateAxis = Array.from(allDates).sort();
      const today0 = new Date(TODAY); today0.setHours(0,0,0,0);
      const todayIso = today0.toISOString().slice(0,10);
      const cutoffDate = new Date(today0); cutoffDate.setDate(cutoffDate.getDate() + 180);
      const cutoffIso = cutoffDate.toISOString().slice(0,10);
      const displayDates = dateAxis.filter(d => d >= todayIso && d <= cutoffIso);
      const myStructKeysExcl = new Set(['Condotta 16 Apartments', 'Palazzo Alfani al David']);
      const compNames = Object.keys(sd.compMap).filter(n => !myStructKeysExcl.has(n)).sort();
      const myMap = (sd.key === 'condotta') ? (EXPEDIA_DATA && EXPEDIA_DATA.condotta)
                  : (sd.key === 'alfani')   ? (EXPEDIA_DATA && EXPEDIA_DATA.alfani)
                  : (sd.key === 'firenze')  ? (EXPEDIA_DATA && EXPEDIA_DATA.firenze)
                  : (sd.key === 'davids')   ? (EXPEDIA_DATA && EXPEDIA_DATA.davids)
                  : null;
      const myLabels = { firenze:'Firenze Suite', condotta:'Condotta 16 Apartments', alfani:'Palazzo Alfani al David', davids:"Enis Guesthouse" };
      html += `<div style="overflow-x:auto;max-height:60vh;overflow-y:auto"><table class="data" style="font-size:11px;white-space:nowrap">
        <thead>
          <tr>
            <th style="position:sticky;left:0;background:var(--bg);z-index:3;text-align:left;min-width:220px">Property / Competitor</th>`;
      for (const d of displayDates){
        const [y,m,da] = d.split('-');
        html += `<th style="text-align:center;min-width:48px">${da}/${m}</th>`;
      }
      html += '</tr></thead><tbody>';
      if (myMap){
        html += `<tr style="background:${sd.color}10">
          <td style="position:sticky;left:0;background:${sd.color}15;z-index:2;font-weight:700;color:${sd.color}">▸ ${escapeHtml(myLabels[sd.key])} <span style="font-weight:400;font-size:10px;color:var(--ink-3);font-style:italic">(my price)</span></td>`;
        for (const d of displayDates){
          const p = myMap[d];
          if (p != null && isFinite(p) && p >= 10){
            html += `<td class="cell-mono" style="text-align:center;background:${sd.color}10;font-weight:700;color:${sd.color}">€${Math.round(p)}</td>`;
          } else {
            html += `<td class="cell-mono cell-flat" style="text-align:center;background:${sd.color}10;color:var(--ink-3)">—</td>`;
          }
        }
        html += '</tr>';
      }
      for (const name of compNames){
        const w = getWeight(sd.key, name);
        const wPct = Math.round(w * 100);
        const isExcluded = (w <= 0);
        const labelStyle = isExcluded ? 'color:var(--ink-3);font-style:italic;text-decoration:line-through' : 'color:var(--ink)';
        const wBadge = isExcluded
          ? '<span style="font-size:9px;background:#aaa;color:#fff;padding:1px 4px;border-radius:3px;margin-left:6px">weight 0%</span>'
          : (wPct < 100 ? `<span style="font-size:9px;background:${sd.color}40;color:${sd.color};padding:1px 4px;border-radius:3px;margin-left:6px">weight ${wPct}%</span>` : '');
        html += `<tr>
          <td style="position:sticky;left:0;background:var(--bg);z-index:2;font-weight:500;${labelStyle}">${escapeHtml(name)}${wBadge}</td>`;
        for (const d of displayDates){
          const p = sd.compMap[name][d];
          if (p != null && isFinite(p) && p >= 10){
            const opacity = isExcluded ? 0.3 : (0.4 + 0.6 * w);
            html += `<td class="cell-mono" style="text-align:center;opacity:${opacity}">€${Math.round(p)}</td>`;
          } else {
            html += `<td class="cell-mono cell-flat" style="text-align:center;color:var(--ink-3)">—</td>`;
          }
        }
        html += '</tr>';
      }
      html += '</tbody></table></div>';
    }
    html += `</div></div>`;
  }
  wrap.innerHTML = html;
  wrap.querySelectorAll('.rate-weight-input').forEach(inp => {
    inp.addEventListener('change', (ev) => {
      const struct = inp.dataset.struct;
      const comp = inp.dataset.comp;
      let v = parseInt(inp.value, 10);
      if (isNaN(v) || v < 0) v = 0;
      if (v > 100) v = 100;
      inp.value = v;
      setWeight(struct, comp, v / 100);
      renderRateShopper();
      if (typeof renderPiramide === 'function') {
        try { renderPiramide(); } catch(e){}
      }
      if (typeof renderSellStrategy === 'function' && typeof CURRENT_STRUCT !== 'undefined') {
        try { renderSellStrategy(CURRENT_STRUCT); } catch(e){}
      }
    });
  });
  const resetBtn = document.getElementById('rate-reset-weights');
  if (resetBtn && !resetBtn._wired){
    resetBtn._wired = true;
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all weights to 100%?')){
        try { localStorage.removeItem(RATE_WEIGHTS_KEY); } catch(e){}
        renderRateShopper();
        if (typeof renderPiramide === 'function') {
          try { renderPiramide(); } catch(e){}
        }
        if (typeof renderSellStrategy === 'function' && typeof CURRENT_STRUCT !== 'undefined') {
          try { renderSellStrategy(CURRENT_STRUCT); } catch(e){}
        }
      }
    });
  }
  if (typeof renderPiramide === 'function') {
    try { renderPiramide(); } catch(e){}
  }
}
/* ============================================================
   RMES CONFIG TAB
   Property filter indipendente da CURRENT_STRUCT del topbar:
   è una scelta locale di "quale configurazione voglio modificare".
   ============================================================ */
let RMES_TAB_STRUCT = 'condotta';  // default
function renderRMESConfigTab(){
  if (typeof CURRENT_STRUCT !== 'undefined' && CURRENT_STRUCT !== 'both'){
    RMES_TAB_STRUCT = CURRENT_STRUCT;
  }
  const sel = RMES_TAB_STRUCT;
  const pillsEl = document.getElementById('rmes-tab-struct-pills');
  if (pillsEl){
    const opts = [
      { v: 'firenze',  label: 'Firenze Suite',   color: '#3b6b9a' },
      { v: 'condotta', label: 'Condotta 16',     color: '#3d7a4b' },
      { v: 'alfani',   label: 'Palazzo Alfani',  color: '#8e5fa8' },
      { v: 'davids',   label: "Enis Guesthouse", color: '#c0392b' },
    ];
    pillsEl.innerHTML = opts.map(o => {
      const on = (sel === o.v);
      return `<button class="rt-pill ${on?'':'off'}" data-rmesst="${o.v}" style="${on?'border-color:'+o.color+';color:'+o.color+';font-weight:600':''}">${o.label}</button>`;
    }).join('');
    pillsEl.querySelectorAll('button[data-rmesst]').forEach(btn => {
      btn.addEventListener('click', () => {
        const newSel = btn.dataset.rmesst;
        RMES_TAB_STRUCT = newSel;
        if (typeof setStructure === 'function' && typeof CURRENT_STRUCT !== 'undefined' && CURRENT_STRUCT !== newSel){
          setStructure(newSel);  // chiama setStructure che fa anche renderAll → renderRMESConfigTab
        } else {
          renderRMESConfigTab();
        }
      });
    });
  }
  const chipEl = document.getElementById('rmes-struct-chip');
  if (chipEl){
    const labels = { firenze: 'Firenze Suite', condotta: 'Condotta 16', alfani: 'Palazzo Alfani', davids: "Enis Guesthouse" };
    chipEl.textContent = labels[sel] || sel;
  }
  const labels = { firenze: 'Firenze Suite', condotta: 'Condotta 16', alfani: 'Palazzo Alfani', davids: "Enis Guesthouse" };
  const sublabel = `property: ${labels[sel]}`;
  ['rmes-tab-w-sub','rmes-tab-th-sub'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = sublabel;
  });
  _renderRmesWeightsBox(sel);
  _renderRmesThresholdsBox(sel);
  if (typeof _renderRmesLmfBox === 'function') _renderRmesLmfBox(sel);
  if (typeof _renderRmesEventsBox === 'function') _renderRmesEventsBox();
  if (typeof fp_renderFoundationConfigBox === 'function') fp_renderFoundationConfigBox(sel);
  _rmesTabClearDirty();
  const applyAllBtn = document.getElementById('rmes-tab-apply-all');
  if (applyAllBtn && !applyAllBtn._wired){
    applyAllBtn._wired = true;
    applyAllBtn.onclick = () => {
      if (applyAllBtn.disabled) return;
      const structLbl = (RMES_TAB_STRUCT === 'condotta') ? 'Condotta 16' : (RMES_TAB_STRUCT === 'firenze') ? 'Firenze Suite' : (RMES_TAB_STRUCT === 'davids') ? "Enis Guesthouse" : 'Palazzo Alfani';
      const ok = _rmesTabApplyAll();
      if (ok){
        const orig = applyAllBtn.textContent;
        applyAllBtn.textContent = '✓ Applicato a ' + structLbl;
        applyAllBtn.style.background = '#2d6a3e';
        setTimeout(() => {
          applyAllBtn.textContent = orig;
          applyAllBtn.style.background = '#4a7c59';
        }, 1500);
      }
    };
  }
}
/* === ① PESI === */
function _renderRmesWeightsBox(sel){
  const wrap = document.getElementById('rmes-tab-w-bar');
  if (!wrap) return;
  const W = SELL_RMES_W_ALL[sel] || SELL_RMES_W_DEFAULT;
  const factors = [
    { key:'occ',    letter:'A', label:'Demand (occ)',     color:'#3b6b9a', desc:'OCC today vs STLY -364d' },
    { key:'price',  letter:'B', label:'Demand (Price)',   color:'#c4823b', desc:'ADR OTB vs STLY (3 cases)' },
    { key:'pace',   letter:'C', label:'Pace Trend',    color:'#8e5fa8', desc:'pickup 4w month vs STLY (recent week weighted)' },
    { key:'comp',   letter:'D', label:'Online Pricing', color:'#1e6b4a', desc:'my Exp vs compset (inverted)' },
    { key:'airdna', letter:'E', label:'Demand (Expedia)',  color:'#a83b3b', desc:'Expedia searches vs month median' },
  ];
  let html = '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">';
  for (const f of factors){
    html += _wcard(f, W);
  }
  html += '<div style="margin-left:auto;display:flex;flex-direction:column;gap:4px"><div style="font-size:10px;color:var(--ink-3);font-weight:700;letter-spacing:.04em;text-transform:uppercase">Total</div><div id="rmes-tab-w-sum" style="padding:6px 14px;border:1px solid var(--line);border-radius:6px;background:#fff;font-family:\'DM Mono\',monospace;font-weight:700;font-size:14px">Σ —</div></div>';
  html += '</div>';
  wrap.innerHTML = html;
  wrap.querySelectorAll('.rmes-w-input').forEach(inp => {
    inp.addEventListener('input', () => {
      _rmesTabSyncWeights(sel);
      _rmesTabMarkDirty();  // segna che ci sono modifiche da applicare
    });
  });
  _rmesTabSyncWeights(sel);
  const resetBtn = document.getElementById('rmes-tab-w-reset');
  if (resetBtn && !resetBtn._wired){
    resetBtn._wired = true;
    resetBtn.onclick = () => {
      if (!confirm(`Reset the weights of ${RMES_TAB_STRUCT} to 20% × 5 factors?`)) return;
      SELL_RMES_W_ALL[RMES_TAB_STRUCT] = Object.assign({}, SELL_RMES_W_DEFAULT);
      saveRmesWeights();
      _renderRmesWeightsBox(RMES_TAB_STRUCT);
      if (typeof renderSellStrategy === 'function') renderSellStrategy(CURRENT_STRUCT);
      _rmesTabClearDirty();
    };
  }
  const resetBtnAll = document.getElementById('rmes-tab-w-reset-all');
  if (resetBtnAll && !resetBtnAll._wired){
    resetBtnAll._wired = true;
    resetBtnAll.onclick = () => {
      if (!confirm("Resettare i pesi a 20% × 5 fattori per TUTTE le strutture?")) return;
      for (const s of ['firenze','condotta','alfani','davids']){
        SELL_RMES_W_ALL[s] = Object.assign({}, SELL_RMES_W_DEFAULT);
      }
      saveRmesWeights();
      _renderRmesWeightsBox(RMES_TAB_STRUCT);
      if (typeof renderSellStrategy === 'function' && typeof CURRENT_STRUCT !== 'undefined') renderSellStrategy(CURRENT_STRUCT);
      _rmesTabClearDirty();
    };
  }
}
let _RMES_TAB_DIRTY = false;
function _rmesTabMarkDirty(){
  _RMES_TAB_DIRTY = true;
  const btn = document.getElementById('rmes-tab-apply-all');
  if (btn){
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    btn.textContent = '⚠ Apply changes (' + (RMES_TAB_STRUCT === 'condotta' ? 'Condotta 16' : RMES_TAB_STRUCT === 'firenze' ? 'Firenze Suite' : RMES_TAB_STRUCT === 'davids' ? "Enis Guesthouse" : 'Palazzo Alfani') + ')';
  }
}
function _rmesTabClearDirty(){
  _RMES_TAB_DIRTY = false;
  const btn = document.getElementById('rmes-tab-apply-all');
  if (btn){
    btn.disabled = true;
    btn.style.opacity = '0.55';
    btn.style.cursor = 'not-allowed';
    btn.textContent = 'Apply changes (' + (RMES_TAB_STRUCT === 'condotta' ? 'Condotta 16' : RMES_TAB_STRUCT === 'firenze' ? 'Firenze Suite' : RMES_TAB_STRUCT === 'davids' ? "Enis Guesthouse" : 'Palazzo Alfani') + ')';
  }
}
function _wcard(f, W){
  const v = Math.round((W[f.key] || 0) * 100);
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 10px;background:#fff;border:1px solid ${f.color}40;border-radius:6px;min-width:78px">
    <div style="display:flex;align-items:center;gap:4px">
      <span style="background:${f.color};color:#fff;width:18px;height:18px;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;font-family:'DM Mono',monospace">${f.letter}</span>
      <span style="font-size:11px;font-weight:600;color:${f.color}">${f.label}</span>
    </div>
    <input type="number" min="0" max="100" step="5" value="${v}" data-rmesw="${f.key}" class="rmes-w-input" style="width:50px;padding:4px 6px;border:1px solid var(--line);border-radius:3px;font-family:'DM Mono',monospace;font-size:13px;text-align:right;font-weight:700">
    <div style="font-size:9px;color:var(--ink-3);font-style:italic">${f.desc}</div>
  </div>`;
}
function _rmesTabSyncWeights(sel){
  const inputs = document.querySelectorAll('.rmes-w-input');
  let sum = 0;
  inputs.forEach(inp => {
    const v = Math.max(0, Math.min(100, parseInt(inp.value, 10) || 0));
    sum += v;
  });
  const sumEl = document.getElementById('rmes-tab-w-sum');
  if (sumEl){
    sumEl.textContent = `Σ ${sum}%`;
    sumEl.style.color = (sum === 100) ? '#4a7c59' : '#c4823b';
  }
}
function _rmesTabApplyWeights(sel){
  const inputs = document.querySelectorAll('.rmes-w-input');
  const newW = Object.assign({}, SELL_RMES_W_DEFAULT);
  inputs.forEach(inp => {
    const key = inp.dataset.rmesw;
    const v = Math.max(0, Math.min(100, parseInt(inp.value, 10) || 0));
    newW[key] = v / 100;
  });
  SELL_RMES_W_ALL[sel] = newW;
  saveRmesWeights();
  if (typeof renderSellStrategy === 'function' && (CURRENT_STRUCT === sel || CURRENT_STRUCT === 'both')){
    renderSellStrategy(CURRENT_STRUCT);
  }
}
/* === ② SOGLIE INDICI === */
function _renderRmesThresholdsBox(sel){
  const capInp = document.getElementById('rmes-tab-cap-input');
  if (capInp){
    const cap = (typeof getRmesCap === 'function') ? getRmesCap(sel) : 0.25;
    capInp.value = Math.round(cap * 100);  // converto fraction → %
    if (!capInp._wired){
      capInp._wired = true;
      capInp.addEventListener('input', () => { if (typeof _rmesTabMarkDirty === 'function') _rmesTabMarkDirty(); });
    }
  }
  const resetBtn = document.getElementById('rmes-tab-th-reset');
  if (resetBtn && !resetBtn._wired){
    resetBtn._wired = true;
    resetBtn.onclick = () => {
      if (confirm('Resettare il Cap di ' + RMES_TAB_STRUCT + ' al default 30%?')){
        if (typeof setRmesCap === 'function') setRmesCap(RMES_TAB_STRUCT, 0.30);
        _renderRmesThresholdsBox(RMES_TAB_STRUCT);
        if (typeof renderSellStrategy === 'function') renderSellStrategy(CURRENT_STRUCT);
        if (typeof _rmesTabClearDirty === 'function') _rmesTabClearDirty();
      }
    };
  }
}
function _rmesTabApplyAll(){
  const sel = RMES_TAB_STRUCT;
  const wInputs = document.querySelectorAll('.rmes-w-input');
  const newW = Object.assign({}, SELL_RMES_W_DEFAULT);
  wInputs.forEach(inp => {
    const key = inp.dataset.rmesw;
    const v = Math.max(0, Math.min(100, parseInt(inp.value, 10) || 0));
    newW[key] = v / 100;
  });
  SELL_RMES_W_ALL[sel] = newW;
  saveRmesWeights();
  const capInp = document.getElementById('rmes-tab-cap-input');
  if (capInp){
    let capPct = parseFloat(capInp.value);
    if (!isFinite(capPct)) capPct = 25;
    if (capPct < 0) capPct = 0;
    if (capPct > 100) capPct = 100;
    capInp.value = Math.round(capPct);
    if (typeof setRmesCap === 'function') setRmesCap(sel, capPct / 100);  // % → fraction
  }
  const lmfInputs = document.querySelectorAll('.rmes-lmf-input');
  if (lmfInputs.length && typeof fp_setLmfMatrix === 'function'){
    const mtx = FP_LMF_OCC_BANDS.map(() => FP_LMF_DAY_BANDS.map(() => 0));
    lmfInputs.forEach(inp => {
      const ri = parseInt(inp.dataset.lmfR, 10);
      const ci = parseInt(inp.dataset.lmfC, 10);
      let v = parseFloat(inp.value);
      if (!isFinite(v)) v = 0;
      if (v < -90) v = -90;
      if (v > 200) v = 200;
      if (mtx[ri]) mtx[ri][ci] = v;
    });
    fp_setLmfMatrix(sel, mtx);
  }
  const evInputs = document.querySelectorAll('.rmes-evw-input');
  if (evInputs.length){
    const w = {};
    evInputs.forEach(inp => {
      const lbl = inp.dataset.evw;
      let v = parseFloat(inp.value);
      if (!isFinite(v)) v = 0;
      if (v < -10) v = -10;
      if (v > 10) v = 10;
      if (lbl && v !== 0) w[lbl] = v;  // store only non-zero weights to keep storage clean
    });
    _setEventWeights(w);
  }
  if (typeof renderSellStrategy === 'function') renderSellStrategy(CURRENT_STRUCT);
  _rmesTabClearDirty();
  return true;
}
/* === ③ PESI COMPETITOR === */
function _renderRmesLmfBox(sel){
  const wrap = document.getElementById('rmes-lmf-wrap');
  if (!wrap) return;
  const m = (typeof fp_getLmfMatrix === 'function') ? fp_getLmfMatrix(sel) : [];
  const occBands = FP_LMF_OCC_BANDS;
  const dayBands = FP_LMF_DAY_BANDS;
  const colHead = dayBands.map(([lo,hi]) => `<th style="padding:6px 8px;font-size:11px;font-weight:600;color:var(--ink-2);text-align:center;border-bottom:1px solid var(--line)">${lo}\u2013${hi}<br><span style="font-weight:400;color:var(--ink-3)">days</span></th>`).join('');
  let rowsHtml = '';
  for (let ri=0; ri<occBands.length; ri++){
    const cells = dayBands.map((_,ci) => {
      const v = (m[ri] && m[ri][ci]!=null) ? m[ri][ci] : 0;
      return `<td style="padding:3px 4px;text-align:center"><input type="number" step="5" value="${v}" data-lmf-r="${ri}" data-lmf-c="${ci}" class="rmes-lmf-input" style="width:52px;padding:5px 6px;border:1px solid var(--line);border-radius:4px;font-family:'DM Mono',monospace;text-align:right;font-size:12px"> %</td>`;
    }).join('');
    rowsHtml += `<tr><td style="padding:6px 10px;font-size:12px;font-weight:600;color:var(--ink-2);white-space:nowrap">\u2264 ${occBands[ri]}%</td>${cells}</tr>`;
  }
  wrap.innerHTML =
    '<div style="border:1px solid var(--line);border-radius:8px;overflow:hidden">' +
      '<div style="padding:10px 14px;background:rgba(0,0,0,.02);border-bottom:1px solid var(--line)">' +
        '<div style="font-size:13px;font-weight:700;color:var(--ink-1)">\u23f1 Last Minute Price Factor</div>' +
        '<div style="font-size:11px;color:var(--ink-3);margin-top:2px">Discount/premium % based on the property occupancy that day (rows) and days to arrival (columns). Applied to the RMES suggested price (multiplier after the 5 factors). Negative values = discount, positive = premium.</div>' +
      '</div>' +
      '<div style="overflow-x:auto;padding:8px 10px">' +
        '<table style="border-collapse:collapse;margin:0 auto"><thead><tr>' +
          '<th style="padding:6px 8px;font-size:11px;font-weight:600;color:var(--ink-2);text-align:left">Occupancy</th>' + colHead +
        '</tr></thead><tbody>' + rowsHtml + '</tbody></table>' +
      '</div>' +
      '<div style="padding:8px 14px;border-top:1px solid var(--line);display:flex;gap:8px;align-items:center">' +
        '<button id="rmes-lmf-reset" style="font-size:11px;padding:5px 10px;border:1px solid var(--line);border-radius:4px;background:transparent;color:var(--ink-2);cursor:pointer">\u21ba Reset default</button>' +
        '<span style="font-size:11px;color:var(--ink-3)">Changes are saved with the \u201cApply changes\u201d button at the bottom of the tab.</span>' +
      '</div>' +
    '</div>';
  wrap.querySelectorAll('.rmes-lmf-input').forEach(inp => {
    inp.addEventListener('input', () => { if (typeof _rmesTabMarkDirty === 'function') _rmesTabMarkDirty(); });
  });
  const rb = document.getElementById('rmes-lmf-reset');
  if (rb) rb.addEventListener('click', () => {
    try { const raw = localStorage.getItem(FP_LMF_KEY); const obj = raw?JSON.parse(raw):{}; delete obj[sel]; localStorage.setItem(FP_LMF_KEY, JSON.stringify(obj)); } catch(e){}
    _renderRmesLmfBox(sel);
    if (typeof _rmesTabMarkDirty === 'function') _rmesTabMarkDirty();
  });
}
function _renderRmesEventsBox(){
  const wrap = document.getElementById('rmes-events-wrap');
  if (!wrap) return;
  const labels = _listEventLabels();
  const weights = _getEventWeights();
  if (!labels.length){
    wrap.innerHTML = '<div style="padding:14px;border:1px solid var(--line);border-radius:8px;color:var(--ink-3);font-size:12px">No events loaded. EVENTS_CSV missing or empty in data.js.</div>';
    return;
  }
  // build a row per event label, with a number input -10..+10
  const rows = labels.map(lbl => {
    const w = (weights[lbl] != null && isFinite(+weights[lbl])) ? +weights[lbl] : 0;
    const safeLbl = (typeof escapeHtml === 'function') ? escapeHtml(lbl) : lbl.replace(/[<>&"]/g, '');
    // count days affected
    let cnt = 0;
    if (typeof EVENTS !== 'undefined'){ for (const k in EVENTS){ if (EVENTS[k] === lbl) cnt++; } }
    return '<tr>' +
      '<td style="padding:6px 10px;font-size:12px;color:var(--ink-1);font-weight:600">' + safeLbl + '</td>' +
      '<td style="padding:6px 10px;font-size:11px;color:var(--ink-3);text-align:right;font-family:\'DM Mono\',monospace">' + cnt + ' day' + (cnt===1?'':'s') + '</td>' +
      '<td style="padding:3px 8px;text-align:center">' +
        '<input type="number" min="-10" max="10" step="1" value="' + w + '" data-evw="' + safeLbl + '" class="rmes-evw-input" style="width:60px;padding:5px 6px;border:1px solid var(--line);border-radius:4px;font-family:\'DM Mono\',monospace;text-align:right;font-size:12px"> %' +
      '</td></tr>';
  }).join('');
  wrap.innerHTML =
    '<div style="border:1px solid var(--line);border-radius:8px;overflow:hidden">' +
      '<div style="padding:10px 14px;background:rgba(0,0,0,.02);border-bottom:1px solid var(--line)">' +
        '<div style="font-size:13px;font-weight:700;color:var(--ink-1)">\u2728 Event Factor</div>' +
        '<div style="font-size:11px;color:var(--ink-3);margin-top:2px">Price multiplier per event name (\u221210%% to +10%%). Applied as a final multiplier to the RMES price on dates that match the event. Positive = premium, negative = discount, zero = no effect. Weights are shared across all properties.</div>' +
      '</div>' +
      '<div style="overflow-x:auto;max-height:340px;overflow-y:auto;padding:8px 10px">' +
        '<table style="border-collapse:collapse;width:100%"><thead><tr>' +
          '<th style="padding:6px 10px;font-size:11px;font-weight:600;color:var(--ink-2);text-align:left;border-bottom:1px solid var(--line)">Event</th>' +
          '<th style="padding:6px 10px;font-size:11px;font-weight:600;color:var(--ink-2);text-align:right;border-bottom:1px solid var(--line)">Days</th>' +
          '<th style="padding:6px 10px;font-size:11px;font-weight:600;color:var(--ink-2);text-align:center;border-bottom:1px solid var(--line)">Weight</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table>' +
      '</div>' +
      '<div style="padding:8px 14px;border-top:1px solid var(--line);display:flex;gap:8px;align-items:center">' +
        '<button id="rmes-evw-reset" style="font-size:11px;padding:5px 10px;border:1px solid var(--line);border-radius:4px;background:transparent;color:var(--ink-2);cursor:pointer">\u21ba Reset all to 0</button>' +
        '<span style="font-size:11px;color:var(--ink-3)">Changes are saved with the \u201cApply changes\u201d button at the bottom of the tab.</span>' +
      '</div>' +
    '</div>';
  wrap.querySelectorAll('.rmes-evw-input').forEach(inp => {
    inp.addEventListener('input', () => { if (typeof _rmesTabMarkDirty === 'function') _rmesTabMarkDirty(); });
  });
  const rb = document.getElementById('rmes-evw-reset');
  if (rb) rb.addEventListener('click', () => {
    _setEventWeights({});
    _renderRmesEventsBox();
    if (typeof _rmesTabMarkDirty === 'function') _rmesTabMarkDirty();
  });
}
function _renderRmesCompsetBox(sel){
  const wrap = document.getElementById('rmes-tab-comp-wrap');
  if (!wrap) return;
  const compMap = (sel === 'condotta') ? (EXPEDIA_DATA && EXPEDIA_DATA.competitors)
                : (sel === 'alfani')   ? (EXPEDIA_DATA && EXPEDIA_DATA.competitors_alfani)
                : (sel === 'firenze')  ? (EXPEDIA_DATA && EXPEDIA_DATA.competitors_firenze)
                : (sel === 'davids')   ? (EXPEDIA_DATA && EXPEDIA_DATA.competitors_davids)
                : null;
  if (!compMap || Object.keys(compMap).length === 0){
    wrap.innerHTML = '<div style="padding:24px;text-align:center;color:var(--ink-3);font-style:italic">No Expedia compset data available.</div>';
    return;
  }
  const myExcl = new Set(['Condotta 16 Apartments', 'Palazzo Alfani al David']);
  const names = Object.keys(compMap).filter(n => !myExcl.has(n)).sort();
  let html = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px">`;
  for (const name of names){
    const w = (typeof getWeight === 'function') ? getWeight(sel, name) : 1.0;
    const wPct = Math.round(w * 100);
    html += `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#fff;border:1px solid var(--line);border-radius:5px">
      <span style="flex:1;font-size:12px;font-weight:500">${escapeHtml(name)}</span>
      <input type="number" min="0" max="100" step="5" value="${wPct}"
        data-tabcomp="${escapeHtml(name)}" data-tabcomp-struct="${sel}"
        class="rmes-tab-comp-input"
        style="width:64px;padding:4px 6px;border:1px solid var(--line);border-radius:3px;font-family:'DM Mono',monospace;font-size:12px;text-align:right;font-weight:600">
      <span style="font-size:11px;color:var(--ink-3)">%</span>
    </div>`;
  }
  html += `</div>`;
  html += `<div style="margin-top:10px;font-size:10px;color:var(--ink-3);font-style:italic;text-align:center">Weight 0% = competitor excluded from the average · 100% = full weight · Daily prices are in the Rate Shopper tab.</div>`;
  wrap.innerHTML = html;
  wrap.querySelectorAll('.rmes-tab-comp-input').forEach(inp => {
    inp.addEventListener('change', () => {
      const name = inp.dataset.tabcomp;
      const structKey = inp.dataset.tabcompStruct;
      let v = parseInt(inp.value, 10);
      if (isNaN(v) || v < 0) v = 0;
      if (v > 100) v = 100;
      inp.value = v;
      if (typeof setWeight === 'function') setWeight(structKey, name, v / 100);
      if (typeof renderSellStrategy === 'function' && (CURRENT_STRUCT === structKey || CURRENT_STRUCT === 'both')){
        renderSellStrategy(CURRENT_STRUCT);
      }
      if (typeof renderRateShopper === 'function') renderRateShopper();
    });
  });
  const resetBtn = document.getElementById('rmes-tab-comp-reset');
  if (resetBtn && !resetBtn._wired){
    resetBtn._wired = true;
    resetBtn.onclick = () => {
      if (!confirm('Reset all compset weights to 100% (for all properties)?')) return;
      try { localStorage.removeItem('rmes_compset_weights_v1'); } catch(e){}
      _renderRmesCompsetBox(RMES_TAB_STRUCT);
      if (typeof renderSellStrategy === 'function') renderSellStrategy(CURRENT_STRUCT);
      if (typeof renderRateShopper === 'function') renderRateShopper();
    };
  }
}
/* ============================================================
   NOTES SYSTEM (append-only journal PER STRUTTURA)
   ============================================================ */
const NOTES_KEY = 'notes_journal_v2';
const NOTES_KEY_LEGACY = 'notes_journal_v1';
function loadNotes(){
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e){}
  try {
    const legacyRaw = localStorage.getItem(NOTES_KEY_LEGACY);
    if (legacyRaw){
      const legacy = JSON.parse(legacyRaw);
      const migrated = {};
      for (const k of Object.keys(legacy)){
        if (!Array.isArray(legacy[k])) continue;
        const [tab, struct] = k.split('__');
        if (!struct) continue;
        if (!migrated[struct]) migrated[struct] = [];
        for (const entry of legacy[k]){
          migrated[struct].push({
            ts: entry.ts,
            text: entry.text,
            tab: tab || 'unknown',
          });
        }
      }
      localStorage.setItem(NOTES_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch(e){}
  return {};
}
function saveNotes(data){
  try { localStorage.setItem(NOTES_KEY, JSON.stringify(data)); } catch(e){}
}
/* Determina la tab attiva dal DOM (cerca .tab-panel.active) */
function getCurrentTab(){
  const el = document.querySelector('.tab-panel.active');
  if (!el) return 'unknown';
  return (el.id || 'panel-unknown').replace(/^panel-/, '');
}
/* Struttura corrente: rispecchia CURRENT_STRUCT, tranne per tab RMES che usa RMES_TAB_STRUCT */
function getCurrentNotesStruct(){
  const tab = getCurrentTab();
  if (tab === 'pri' && typeof RMES_TAB_STRUCT !== 'undefined') return RMES_TAB_STRUCT;
  return (typeof CURRENT_STRUCT !== 'undefined') ? CURRENT_STRUCT : 'both';
}
const NOTES_TAB_LABELS = {
  otb: 'Overview',
  rt: 'OCC Room Type',
  cancel: 'CXLTrend',
  fcst: 'Forecast',
  pk: 'Pickup Matrix',
  mkt: 'AirDNA',
  rate: 'Rate Shopper',
  hist: 'Storici',
  pri: 'RMES',
  abnb: 'Airbnb',
  sell: 'Sell Strategy',
  unknown: '—',
};
const NOTES_TAB_COLORS = {
  sell: '#c4823b',
  otb: '#3b5a78',
  rt: '#7c3aed',
  cancel: '#a83b3b',
  fcst: '#4a7c59',
  pk: '#3b6b6b',
  mkt: '#a83b3b',
  rate: '#8e5fa8',
  hist: '#888',
  pri: '#c4823b',
  abnb: '#ea580c',
  unknown: '#999',
};
const NOTES_STRUCT_LABELS = {
  firenze: 'Firenze Suite',
  condotta: 'Condotta 16',
  alfani: 'Palazzo Alfani',
  davids: "Enis Guesthouse",
  both: 'All properties',
};
/* Format timestamp italiano */
function fmtTs(iso){
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2,'0');
    const mi = String(d.getMinutes()).padStart(2,'0');
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  } catch(e){ return iso; }
}
/* Apre il pannello note per la struttura corrente */
function openNotesPanel(){
  const struct = getCurrentNotesStruct();
  const panel = document.getElementById('notes-panel');
  if (!panel) return;
  panel.classList.add('show');
  renderNotesPanel(struct);
}
function closeNotesPanel(){
  const panel = document.getElementById('notes-panel');
  if (panel) panel.classList.remove('show');
}
function renderNotesPanel(struct){
  const all = loadNotes();
  const entries = (all[struct] || []).slice().sort((a,b)=> (b.ts||'').localeCompare(a.ts||''));
  const titleEl = document.getElementById('notes-panel-title');
  if (titleEl){
    const structLbl = NOTES_STRUCT_LABELS[struct] || struct;
    titleEl.innerHTML = `Note · <span style="font-weight:600">${escapeHtml(structLbl)}</span>`;
  }
  const countEl = document.getElementById('notes-panel-count');
  if (countEl) countEl.textContent = entries.length === 0 ? 'no notes' : (entries.length === 1 ? '1 nota' : `${entries.length} note`);
  const curTab = getCurrentTab();
  const curTabLbl = NOTES_TAB_LABELS[curTab] || curTab;
  const curTabColor = NOTES_TAB_COLORS[curTab] || '#999';
  const inputHintEl = document.getElementById('notes-input-hint');
  if (inputHintEl){
    inputHintEl.innerHTML = `Auto tag: <span style="background:${curTabColor};color:#fff;padding:2px 7px;border-radius:9px;font-size:10px;font-weight:600;margin-left:4px">${escapeHtml(curTabLbl)}</span>`;
  }
  const listEl = document.getElementById('notes-list');
  if (listEl){
    if (entries.length === 0){
      listEl.innerHTML = '<div style="text-align:center;color:var(--ink-3);padding:30px 12px;font-style:italic;font-size:13px">No notes here yet.<br>Write the first note below.</div>';
    } else {
      listEl.innerHTML = entries.map((e, i) => {
        const tabKey = e.tab || 'unknown';
        const tabLbl = NOTES_TAB_LABELS[tabKey] || tabKey;
        const tabColor = NOTES_TAB_COLORS[tabKey] || '#999';
        return `
        <div class="note-card" data-note-idx="${i}">
          <div class="note-meta">
            <span style="display:inline-flex;align-items:center;gap:6px">
              <span style="background:${tabColor};color:#fff;padding:2px 7px;border-radius:9px;font-size:10px;font-weight:600">${escapeHtml(tabLbl)}</span>
              <span class="mono" style="font-size:10.5px;color:var(--ink-3)">${fmtTs(e.ts)}</span>
            </span>
            <button class="note-del" data-note-ts="${escapeHtml(e.ts)}" title="Delete this note" style="background:transparent;border:none;color:var(--ink-3);cursor:pointer;font-size:13px;padding:2px 6px;border-radius:3px">🗑️</button>
          </div>
          <div class="note-text">${escapeHtml(e.text).replace(/\n/g,'<br>')}</div>
        </div>
      `}).join('');
      listEl.querySelectorAll('.note-del').forEach(btn => {
        btn.onclick = () => {
          if (!confirm('Delete this note?')) return;
          const ts = btn.dataset.noteTs;
          const cur = loadNotes();
          if (cur[struct]){
            cur[struct] = cur[struct].filter(x => x.ts !== ts);
            if (cur[struct].length === 0) delete cur[struct];
            saveNotes(cur);
            renderNotesPanel(struct);
            updateNotesBadge();
          }
        };
      });
    }
  }
}
/* Aggiunge una nuova nota dal textarea, taggata con la tab corrente */
function addNote(){
  const struct = getCurrentNotesStruct();
  const tab = getCurrentTab();
  const ta = document.getElementById('notes-input');
  if (!ta) return;
  const txt = ta.value.trim();
  if (!txt) return;
  const all = loadNotes();
  if (!all[struct]) all[struct] = [];
  all[struct].push({
    ts: new Date().toISOString(),
    text: txt,
    tab: tab,
  });
  saveNotes(all);
  ta.value = '';
  renderNotesPanel(struct);
  updateNotesBadge();
}
/* Export di tutte le note come JSON */
function exportNotes(){
  const data = loadNotes();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().slice(0,10);
  a.href = url;
  a.download = `dashboard-notes-${today}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
/* Import note da file JSON (merge: nuove note vengono aggiunte alle esistenti) */
function importNotes(){
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (typeof imported !== 'object' || imported === null) throw new Error('Formato non valido');
        const cur = loadNotes();
        let added = 0;
        for (const k of Object.keys(imported)){
          if (!Array.isArray(imported[k])) continue;
          let targetStruct, defaultTab;
          if (k.includes('__')){
            const [tab, structLegacy] = k.split('__');
            targetStruct = structLegacy;
            defaultTab = tab;
          } else {
            targetStruct = k;
            defaultTab = null;
          }
          if (!cur[targetStruct]) cur[targetStruct] = [];
          const seenTs = new Set(cur[targetStruct].map(x => x.ts));
          for (const entry of imported[k]){
            if (entry && entry.ts && entry.text && !seenTs.has(entry.ts)){
              cur[targetStruct].push({
                ts: entry.ts,
                text: entry.text,
                tab: entry.tab || defaultTab || 'unknown',
              });
              added += 1;
            }
          }
        }
        saveNotes(cur);
        alert(`Import completato. ${added} note aggiunte.`);
        renderNotesPanel(getCurrentNotesStruct());
        updateNotesBadge();
      } catch(err){
        alert("Errore durante l'import: " + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}
/* Refresh il badge sul FAB con il numero di note della struttura corrente */
function updateNotesBadge(){
  const struct = getCurrentNotesStruct();
  const all = loadNotes();
  const n = (all[struct] || []).length;
  const badgeEl = document.getElementById('notes-fab-badge');
  if (badgeEl){
    if (n > 0){
      badgeEl.style.display = 'inline-block';
      badgeEl.textContent = n;
    } else {
      badgeEl.style.display = 'none';
    }
  }
}
/* Wire iniziale del sistema note */
function initNotes(){
  const fab = document.getElementById('notes-fab');
  if (fab) fab.onclick = openNotesPanel;
  const closeBtn = document.getElementById('notes-close');
  if (closeBtn) closeBtn.onclick = closeNotesPanel;
  const addBtn = document.getElementById('notes-add-btn');
  if (addBtn) addBtn.onclick = addNote;
  const exportBtn = document.getElementById('notes-export');
  if (exportBtn) exportBtn.onclick = exportNotes;
  const importBtn = document.getElementById('notes-import');
  if (importBtn) importBtn.onclick = importNotes;
  const backdrop = document.getElementById('notes-backdrop');
  if (backdrop) backdrop.onclick = closeNotesPanel;
  const ta = document.getElementById('notes-input');
  if (ta){
    ta.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter'){
        e.preventDefault();
        addNote();
      }
    });
  }
  loadNotes();
  updateNotesBadge();
}
/* ===========================================================================
   TAB CANCELLAZIONI
   =========================================================================== */
function aggCancellations(sel){
  const keys = new Set(structKeysFor(sel));
  const startD = new Date(TODAY); startD.setHours(0,0,0,0);
  startD.setMonth(startD.getMonth() - 12);
  const startYmd = ymd(startD);
  const monthlyMap = {}; // ym -> {cancelRn, lostRev, leadSum, n}
  const channelMap = {}; // canale -> {cancelN, cancelRn, lostRev}
  const totalConfPlusCancel = {}; // canale -> totale prenotazioni (per calcolare tasso)
  let totCancelN = 0, totCancelRn = 0, totLostRev = 0, totLeadSum = 0, totLeadN = 0;
  let futureCancelN = 0, futureLostRev = 0;
  for (const b of BOOKINGS){
    if (!keys.has(b.struct)) continue;
    const refYmd = b.cancelYmd || b.bookYmd;
    if (refYmd >= startYmd){
      if (!totalConfPlusCancel[b.canale]) totalConfPlusCancel[b.canale] = 0;
      totalConfPlusCancel[b.canale] += 1;
    }
    if (!b.cancelled) continue;
    if (refYmd < startYmd) continue;
    const yy = Math.floor(refYmd/10000), mm = Math.floor(refYmd/100) % 100;
    const ym = yy*100 + mm;
    if (!monthlyMap[ym]) monthlyMap[ym] = {cancelN:0, cancelRn:0, lostRev:0, leadSum:0, leadN:0};
    monthlyMap[ym].cancelN += 1;
    monthlyMap[ym].cancelRn += b.notti;
    const lostRev = b.revPerNight * b.notti;
    monthlyMap[ym].lostRev += lostRev;
    if (b.cancelYmd && b.bookYmd){
      const dB = ymdToDate(b.bookYmd);
      const dC = ymdToDate(b.cancelYmd);
      const lead = Math.max(0, Math.round((dC - dB) / (1000*60*60*24)));
      monthlyMap[ym].leadSum += lead;
      monthlyMap[ym].leadN += 1;
      totLeadSum += lead;
      totLeadN += 1;
    }
    if (!channelMap[b.canale]) channelMap[b.canale] = {cancelN:0, cancelRn:0, lostRev:0};
    channelMap[b.canale].cancelN += 1;
    channelMap[b.canale].cancelRn += b.notti;
    channelMap[b.canale].lostRev += lostRev;
    totCancelN += 1;
    totCancelRn += b.notti;
    totLostRev += lostRev;
    if (ymd(b.dIn) > TODAY_YMD){
      futureCancelN += 1;
      futureLostRev += lostRev;
    }
  }
  const monthlyArr = Object.keys(monthlyMap).sort().map(k => {
    const m = monthlyMap[k];
    return {
      ym: +k,
      cancelN: m.cancelN,
      cancelRn: m.cancelRn,
      lostRev: m.lostRev,
      leadAvg: m.leadN>0 ? m.leadSum/m.leadN : 0,
    };
  });
  const channelArr = Object.keys(channelMap).map(c => {
    const m = channelMap[c];
    const total = totalConfPlusCancel[c] || 0;
    return {
      canale: c,
      cancelN: m.cancelN,
      cancelRn: m.cancelRn,
      lostRev: m.lostRev,
      totalN: total,
      rate: total>0 ? m.cancelN/total : 0,
    };
  }).sort((a,b)=> b.cancelN - a.cancelN);
  return {
    monthlyArr, channelArr,
    totCancelN, totCancelRn, totLostRev,
    leadAvg: totLeadN>0 ? totLeadSum/totLeadN : 0,
    futureCancelN, futureLostRev,
    startYmd,
  };
}
function renderCancellations(sel){
  const A = aggCancellations(sel);
  const kpiHtml = `
    <div class="kpi" style="border-left-color:#a83b3b">
      <div class="kpi-label">CXLTrend 12 months</div>
      <div class="kpi-val">${A.totCancelN.toLocaleString('en-GB')}</div>
      <div class="kpi-sub mono">${A.totCancelRn.toLocaleString('en-GB')} RN lost</div>
    </div>
    <div class="kpi" style="border-left-color:#c4823b">
      <div class="kpi-label">Revenue lost</div>
      <div class="kpi-val">${fmtEUR(A.totLostRev)}</div>
      <div class="kpi-sub mono">avg ${A.totCancelN>0?fmtEUR(A.totLostRev/A.totCancelN):'—'} per cancellation</div>
    </div>
    <div class="kpi" style="border-left-color:#3b6b6b">
      <div class="kpi-label">Average lead time</div>
      <div class="kpi-val">${A.leadAvg.toFixed(0)} <span style="font-size:14px;font-weight:400">d</span></div>
      <div class="kpi-sub mono">between booking and cancellation</div>
    </div>
    <div class="kpi" style="border-left-color:#8a6c45">
      <div class="kpi-label">Cancelled for future stay</div>
      <div class="kpi-val">${A.futureCancelN}</div>
      <div class="kpi-sub mono">${fmtEUR(A.futureLostRev)} of revenue lost for stay > today</div>
    </div>
  `;
  document.getElementById('cancel-kpis').innerHTML = kpiHtml;
  const months = A.monthlyArr;
  const maxN = Math.max(1, ...months.map(m=>m.cancelN));
  const W = 600, H = 220, pad = {l:40, r:10, t:10, b:42};
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
  const barW = months.length > 0 ? (cw / months.length) * 0.7 : 0;
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet" style="max-width:100%">`;
  for (let i=0; i<=4; i++){
    const y = pad.t + (ch * i / 4);
    const v = Math.round(maxN * (4-i) / 4);
    svg += `<line x1="${pad.l}" y1="${y}" x2="${W-pad.r}" y2="${y}" stroke="#e8e3da" stroke-width="0.5"/>`;
    svg += `<text x="${pad.l-6}" y="${y+3}" font-size="9" fill="#888" text-anchor="end" font-family="DM Mono">${v}</text>`;
  }
  for (let i=0; i<months.length; i++){
    const m = months[i];
    const x = pad.l + (cw / months.length) * i + (cw / months.length - barW)/2;
    const h = ch * m.cancelN / maxN;
    const y = pad.t + ch - h;
    svg += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="#a83b3b" opacity="0.85"/>`;
    svg += `<text x="${x+barW/2}" y="${y-3}" font-size="9" fill="#5a4a3a" text-anchor="middle" font-family="DM Mono" font-weight="600">${m.cancelN}</text>`;
    const yy = Math.floor(m.ym/100), mm = m.ym%100;
    const lblM = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][mm-1];
    svg += `<text x="${x+barW/2}" y="${pad.t+ch+14}" font-size="9" fill="#666" text-anchor="middle" font-family="DM Mono">${lblM}</text>`;
    svg += `<text x="${x+barW/2}" y="${pad.t+ch+25}" font-size="8" fill="#999" text-anchor="middle" font-family="DM Mono">'${(yy%100).toString().padStart(2,'0')}</text>`;
  }
  svg += '</svg>';
  document.getElementById('cancel-chart-month').innerHTML = svg;
  const ch2 = A.channelArr;
  const sumN = ch2.reduce((s,c)=>s+c.cancelN, 0);
  const W2 = 600, H2 = 50 + 38*ch2.length;
  let svg2 = `<svg viewBox="0 0 ${W2} ${H2}" width="100%" preserveAspectRatio="xMidYMid meet" style="max-width:100%">`;
  const palette = ['#8a6c45','#3b6b6b','#a83b3b','#c4823b','#5a8c69'];
  const maxBarW = W2 - 280;
  for (let i=0; i<ch2.length; i++){
    const c = ch2[i];
    const pct = sumN>0 ? c.cancelN/sumN : 0;
    const yT = 18 + i*38;
    const w = pct * maxBarW;
    const color = palette[i % palette.length];
    svg2 += `<text x="14" y="${yT+4}" font-size="11" fill="#3a2f24" font-family="DM Sans" font-weight="500">${c.canale}</text>`;
    svg2 += `<rect x="120" y="${yT-9}" width="${w}" height="18" fill="${color}" opacity="0.8" rx="2"/>`;
    svg2 += `<text x="${120+w+8}" y="${yT+4}" font-size="11" fill="#3a2f24" font-family="DM Mono" font-weight="600">${c.cancelN}</text>`;
    svg2 += `<text x="${120+w+8+50}" y="${yT+4}" font-size="10" fill="#888" font-family="DM Mono">${(pct*100).toFixed(0)}%</text>`;
  }
  svg2 += '</svg>';
  document.getElementById('cancel-chart-channel').innerHTML = svg2;
  const mIT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let mHtml = '<thead><tr><th>Month</th><th class="num">CXLTrend</th><th class="num">RN lost</th><th class="num">Revenue lost</th><th class="num">Average lead time</th></tr></thead><tbody>';
  for (const m of months){
    const yy = Math.floor(m.ym/100), mm = m.ym%100;
    mHtml += `<tr>
      <td>${mIT[mm-1]} ${yy}</td>
      <td class="cell-mono">${m.cancelN}</td>
      <td class="cell-mono cell-flat">${m.cancelRn}</td>
      <td class="cell-mono">${fmtEUR(m.lostRev)}</td>
      <td class="cell-mono cell-flat">${m.leadAvg.toFixed(0)} d</td>
    </tr>`;
  }
  if (!months.length) mHtml += `<tr><td colspan="5" style="text-align:center;color:var(--ink-3);padding:30px">No cancellations in the last 12 months</td></tr>`;
  mHtml += `<tr class="total">
    <td>12-month total</td>
    <td class="cell-mono">${A.totCancelN}</td>
    <td class="cell-mono">${A.totCancelRn}</td>
    <td class="cell-mono">${fmtEUR(A.totLostRev)}</td>
    <td class="cell-mono">${A.leadAvg.toFixed(0)} d</td>
  </tr></tbody>`;
  document.getElementById('cancel-monthly').innerHTML = mHtml;
  let cHtml = '<thead><tr><th>Channel</th><th class="num">Total bookings</th><th class="num">Cancelled</th><th class="num">Cancellation rate</th><th class="num">RN lost</th><th class="num">Revenue lost</th></tr></thead><tbody>';
  for (const c of A.channelArr){
    const rateCls = c.rate >= 0.30 ? 'cell-neg' : (c.rate >= 0.15 ? '' : 'cell-pos');
    cHtml += `<tr>
      <td>${escapeHtml(c.canale)}</td>
      <td class="cell-mono cell-flat">${c.totalN}</td>
      <td class="cell-mono">${c.cancelN}</td>
      <td class="cell-mono ${rateCls}"><b>${(c.rate*100).toFixed(1)}%</b></td>
      <td class="cell-mono cell-flat">${c.cancelRn}</td>
      <td class="cell-mono">${fmtEUR(c.lostRev)}</td>
    </tr>`;
  }
  cHtml += '</tbody>';
  document.getElementById('cancel-channel').innerHTML = cHtml;
}
/* ===========================================================================
   BOOKING WINDOW (lead time distribution + ADR per bucket)
   Used both in OTB tab (confermate) and CXLTrend tab (cancellate).
   Periodo: rolling 12 mesi che terminano all'ULTIMO MESE CHIUSO.
   =========================================================================== */
const BW_STATE = {
  otb:    { yms: null },
  cancel: { yms: null },
};
const BW_BUCKETS = [
  { id:'0-1',   label:'0-1 day',   min:0, max:1 },
  { id:'2-3',   label:'2-3 days',   min:2, max:3 },
  { id:'4-7',   label:'4-7 days',   min:4, max:7 },
  { id:'8-14',  label:'8-14 days',  min:8, max:14 },
  { id:'15-30', label:'15-30 days', min:15, max:30 },
  { id:'31-60', label:'31-60 days', min:31, max:60 },
  { id:'61-90', label:'61-90 days', min:61, max:90 },
  { id:'91+',   label:'90+ days', min:91, max:99999 },
];
function bucketLeadTime(days){
  if (days < 0) return null;
  for (const b of BW_BUCKETS) if (days >= b.min && days <= b.max) return b.id;
  return null;
}
function bwPeriod(){
  const t = new Date(TODAY); t.setHours(0,0,0,0);
  const firstOfThisMonth = new Date(t.getFullYear(), t.getMonth(), 1);
  const end = new Date(firstOfThisMonth); end.setDate(end.getDate()-1);
  end.setHours(23,59,59,999);
  const start = new Date(end.getFullYear()-1, end.getMonth()+1, 1);
  start.setHours(0,0,0,0);
  const startSTLY = new Date(start); startSTLY.setDate(startSTLY.getDate() - 365);
  const endSTLY   = new Date(end);   endSTLY.setDate(endSTLY.getDate() - 365);
  return { start, end, startSTLY, endSTLY };
}
function aggBookingWindow(sel, kind, ymFilter){
  const keys = new Set(structKeysFor(sel));
  const P = bwPeriod();
  const startYmd = ymd(P.start), endYmd = ymd(P.end);
  const startSTLYYmd = ymd(P.startSTLY), endSTLYYmd = ymd(P.endSTLY);
  let ymFilterSTLY = null;
  if (ymFilter){
    ymFilterSTLY = new Set();
    for (const ym of ymFilter){
      const y = Math.floor(ym/100), m = ym%100;
      ymFilterSTLY.add((y-1)*100 + m);
    }
  }
  const empty = () => {
    const o = {totN:0, totRev:0, totRn:0};
    for (const b of BW_BUCKETS) o[b.id] = {n:0, rev:0, rn:0};
    return o;
  };
  const cur = empty();
  const sty = empty();
  for (const b of BOOKINGS){
    if (!keys.has(b.struct)) continue;
    const bIsCancel = b.cancelled === true;
    if (kind === 'cancel' && !bIsCancel) continue;
    if (kind !== 'cancel' && bIsCancel) continue;
    const checkInYmd = ymd(b.dIn);
    const checkInYM = b.dIn.getFullYear()*100 + (b.dIn.getMonth()+1);
    const lead = Math.max(0, Math.floor((b.dIn - b.dBook) / (1000*60*60*24)));
    const bucket = bucketLeadTime(lead);
    if (!bucket) continue;
    const stayValue = b.revPerNight * b.notti;
    if (checkInYmd >= startYmd && checkInYmd <= endYmd){
      if (ymFilter && !ymFilter.has(checkInYM)) {
      } else {
        cur[bucket].n   += 1;
        cur[bucket].rev += stayValue;
        cur[bucket].rn  += b.notti;
        cur.totN += 1; cur.totRev += stayValue; cur.totRn += b.notti;
      }
    } else if (checkInYmd >= startSTLYYmd && checkInYmd <= endSTLYYmd){
      if (ymFilterSTLY && !ymFilterSTLY.has(checkInYM)) {
      } else {
        sty[bucket].n   += 1;
        sty[bucket].rev += stayValue;
        sty[bucket].rn  += b.notti;
        sty.totN += 1; sty.totRev += stayValue; sty.totRn += b.notti;
      }
    }
  }
  const buckets = BW_BUCKETS.map(B => {
    const c = cur[B.id], s = sty[B.id];
    return {
      id: B.id, label: B.label,
      curPct: cur.totN>0 ? c.n/cur.totN : 0,
      curN:   c.n,
      curAdr: c.rn>0 ? c.rev/c.rn : 0,
      styPct: sty.totN>0 ? s.n/sty.totN : 0,
      styN:   s.n,
      styAdr: s.rn>0 ? s.rev/s.rn : 0,
    };
  });
  return {
    period: P,
    buckets,
    totCur: cur.totN,
    totSty: sty.totN,
  };
}
function renderBookingWindowChart(containerId, A, opts){
  const W = 1100, H = 360;
  const pad = {l:50, r:60, t:18, b:60};
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
  const bw = A.buckets;
  const maxPct = Math.max(0.05, ...bw.map(b=>Math.max(b.curPct, b.styPct)));
  const maxAdr = Math.max(50, ...bw.map(b=>Math.max(b.curAdr, b.styAdr)));
  const niceMaxPct = Math.ceil(maxPct*100/5)*5/100; // step 5%
  const niceMaxAdr = Math.ceil(maxAdr/100)*100;     // step 100€
  const slotW = cw / bw.length;
  const barW = slotW * 0.30;
  const groupW = barW * 2 + 4;
  const colorBarCur = '#2266cc';
  const colorBarSty = '#83b4e9';
  const colorLineCur = '#e85a2c';
  const colorLineSty = '#f3c63a';
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet" style="max-width:100%;display:block">`;
  for (let i=0; i<=5; i++){
    const y = pad.t + ch * i / 5;
    const valPct = niceMaxPct * (5-i) / 5;
    const valAdr = niceMaxAdr * (5-i) / 5;
    svg += `<line x1="${pad.l}" y1="${y}" x2="${W-pad.r}" y2="${y}" stroke="#e8e3da" stroke-width="0.5"/>`;
    svg += `<text x="${pad.l-8}" y="${y+3}" font-size="10" fill="#888" text-anchor="end" font-family="DM Mono">${(valPct*100).toFixed(0)}%</text>`;
    svg += `<text x="${W-pad.r+8}" y="${y+3}" font-size="10" fill="#888" text-anchor="start" font-family="DM Mono">${valAdr.toLocaleString('en-GB')}</text>`;
  }
  svg += `<text x="${pad.l-38}" y="${pad.t+ch/2}" font-size="10" fill="#666" text-anchor="middle" font-family="DM Mono" transform="rotate(-90 ${pad.l-38} ${pad.t+ch/2})">Bookings (in %)</text>`;
  svg += `<text x="${W-pad.r+45}" y="${pad.t+ch/2}" font-size="10" fill="#666" text-anchor="middle" font-family="DM Mono" transform="rotate(-90 ${W-pad.r+45} ${pad.t+ch/2})">ADR (€)</text>`;
  for (let i=0; i<bw.length; i++){
    const b = bw[i];
    const cx = pad.l + slotW*(i+0.5);
    const xCur = cx - groupW/2;
    const xSty = xCur + barW + 4;
    const hCur = ch * (b.curPct / niceMaxPct);
    const hSty = ch * (b.styPct / niceMaxPct);
    svg += `<rect x="${xCur}" y="${pad.t+ch-hCur}" width="${barW}" height="${hCur}" fill="${colorBarCur}" opacity="0.95" pointer-events="none"/>`;
    svg += `<rect x="${xSty}" y="${pad.t+ch-hSty}" width="${barW}" height="${hSty}" fill="${colorBarSty}" opacity="0.95" pointer-events="none"/>`;
    svg += `<text x="${cx}" y="${pad.t+ch+18}" font-size="10" fill="#444" text-anchor="middle" font-family="DM Sans" pointer-events="none">${b.label}</text>`;
    const tipLines = [
      `${b.label}`,
      ``,
      `This year: ${(b.curPct*100).toFixed(1)}% (${b.curN} bk.) · ADR ${Math.round(b.curAdr).toLocaleString('en-GB')}€`,
      `Last year: ${(b.styPct*100).toFixed(1)}% (${b.styN} bk.) · ADR ${Math.round(b.styAdr).toLocaleString('en-GB')}€`,
    ];
    const dPct = (b.curPct - b.styPct)*100;
    const dAdr = b.curAdr - b.styAdr;
    if (b.styN > 0){
      tipLines.push('');
      tipLines.push(`Δ %prenot.: ${dPct>=0?'+':''}${dPct.toFixed(1)} pp`);
      if (b.curAdr > 0 && b.styAdr > 0){
        tipLines.push(`Δ ADR: ${dAdr>=0?'+':''}${Math.round(dAdr).toLocaleString('en-GB')}€ (${dAdr>=0?'+':''}${(dAdr/b.styAdr*100).toFixed(0)}%)`);
      }
    }
    svg += `<rect x="${pad.l + slotW*i}" y="${pad.t}" width="${slotW}" height="${ch}" fill="rgba(0,0,0,0)" class="bw-hover-zone"><title>${tipLines.join('\n')}</title></rect>`;
  }
  function pathFor(field, color){
    const pts = bw.map((b,i) => {
      const cx = pad.l + slotW*(i+0.5);
      const v = b[field];
      const y = pad.t + ch - ch*(v/niceMaxAdr);
      return [cx, y];
    });
    let path = '';
    for (let i=0; i<pts.length; i++){
      const [x,y] = pts[i];
      path += (i===0?'M':'L') + x + ' ' + y + ' ';
    }
    return `<path d="${path.trim()}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` +
           pts.map(([x,y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="${color}"/>`).join('');
  }
  svg += pathFor('curAdr', colorLineCur);
  svg += pathFor('styAdr', colorLineSty);
  const lgY = 6;
  const lg = [
    {label: opts.barCurLbl,  color: colorBarCur,  shape: 'rect'},
    {label: opts.barStyLbl,  color: colorBarSty,  shape: 'rect'},
    {label: opts.lineCurLbl, color: colorLineCur, shape: 'circle'},
    {label: opts.lineStyLbl, color: colorLineSty, shape: 'circle'},
  ];
  let lgX = pad.l + 8;
  for (const it of lg){
    if (it.shape === 'rect'){
      svg += `<rect x="${lgX}" y="${lgY}" width="11" height="11" fill="${it.color}"/>`;
    } else {
      svg += `<circle cx="${lgX+5.5}" cy="${lgY+5.5}" r="5" fill="${it.color}"/>`;
    }
    svg += `<text x="${lgX+16}" y="${lgY+10}" font-size="10.5" fill="#333" font-family="DM Sans">${it.label}</text>`;
    lgX += 16 + (it.label.length * 6.6) + 14;
  }
  svg += '</svg>';
  document.getElementById(containerId).innerHTML = svg;
}
function renderBwMonthFilter(containerId, stateKey, onChange){
  const mIT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const cont = document.getElementById(containerId);
  if (!cont) return;
  const st = BW_STATE[stateKey];
  const isAll = st.yms === null;
  const P = bwPeriod();
  const yms = [];
  let cy = P.start.getFullYear(), cm = P.start.getMonth()+1;
  for (let i=0; i<12; i++){
    yms.push(cy*100 + cm);
    cm++;
    if (cm > 12){ cm = 1; cy++; }
  }
  let html = `<span class="bw-mlabel">Check-in months filter:</span>`;
  html += `<span class="bw-mpill allnone ${isAll?'active':''}" data-act="all">All</span>`;
  for (const ym of yms){
    const m = ym%100, y = Math.floor(ym/100);
    const active = !isAll && st.yms.has(ym);
    const yy = (y%100).toString().padStart(2,'0');
    html += `<span class="bw-mpill ${active?'active':''}" data-ym="${ym}">${mIT[m-1]} '${yy}</span>`;
  }
  cont.innerHTML = html;
  cont.querySelectorAll('.bw-mpill').forEach(el => {
    el.addEventListener('click', () => {
      if (el.dataset.act === 'all'){
        BW_STATE[stateKey].yms = null;
      } else {
        const ym = +el.dataset.ym;
        if (BW_STATE[stateKey].yms === null){
          BW_STATE[stateKey].yms = new Set();
        }
        if (BW_STATE[stateKey].yms.has(ym)){
          BW_STATE[stateKey].yms.delete(ym);
          if (BW_STATE[stateKey].yms.size === 0) BW_STATE[stateKey].yms = null;
        } else {
          BW_STATE[stateKey].yms.add(ym);
        }
      }
      renderBwMonthFilter(containerId, stateKey, onChange);
      onChange();
    });
  });
}
function renderBookingWindowOTB(sel){
  const A = aggBookingWindow(sel, 'confirmed', BW_STATE.otb.yms);
  const P = A.period;
  const fmtD = (d) => d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  const subEl = document.getElementById('otb-bw-sub');
  if (subEl){
    let monthInfo = '';
    if (BW_STATE.otb.yms){
      const mIT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const sel = [...BW_STATE.otb.yms].sort((a,b)=>a-b).map(ym => {
        const m = ym%100, y = Math.floor(ym/100);
        return `${mIT[m-1]} '${(y%100).toString().padStart(2,'0')}`;
      }).join(', ');
      monthInfo = ` · solo: ${sel}`;
    }
    subEl.innerHTML = `Data ${fmtD(P.start)} → ${fmtD(P.end)} over ${A.totCur.toLocaleString('en-GB')} room-bookings. Last year: ${fmtD(P.startSTLY)} → ${fmtD(P.endSTLY)} (${A.totSty.toLocaleString('en-GB')} bk.).${monthInfo}`;
  }
  renderBwMonthFilter('otb-bw-mfilter', 'otb', () => renderBookingWindowOTB(CURRENT_STRUCT));
  renderBookingWindowChart('otb-bw-chart', A, {
    barCurLbl: 'Your property',
    barStyLbl: 'Your property (last year)',
    lineCurLbl: 'Your ADR',
    lineStyLbl: 'Your ADR (last year)',
  });
}
function renderBookingWindowCancel(sel){
  const A = aggBookingWindow(sel, 'cancel', BW_STATE.cancel.yms);
  const P = A.period;
  const fmtD = (d) => d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  const subEl = document.getElementById('cancel-bw-sub');
  if (subEl){
    let monthInfo = '';
    if (BW_STATE.cancel.yms){
      const mIT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const sel = [...BW_STATE.cancel.yms].sort((a,b)=>a-b).map(ym => {
        const m = ym%100, y = Math.floor(ym/100);
        return `${mIT[m-1]} '${(y%100).toString().padStart(2,'0')}`;
      }).join(', ');
      monthInfo = ` · solo: ${sel}`;
    }
    subEl.innerHTML = `Data ${fmtD(P.start)} → ${fmtD(P.end)} over ${A.totCur.toLocaleString('en-GB')} cancellations. Last year: ${fmtD(P.startSTLY)} → ${fmtD(P.endSTLY)} (${A.totSty.toLocaleString('en-GB')} canc.).${monthInfo}`;
  }
  renderBwMonthFilter('cancel-bw-mfilter', 'cancel', () => renderBookingWindowCancel(CURRENT_STRUCT));
  renderBookingWindowChart('cancel-bw-chart', A, {
    barCurLbl: 'CXLTrend',
    barStyLbl: 'CXLTrend (last year)',
    lineCurLbl: 'Cancelled ADR',
    lineStyLbl: 'Cancelled ADR (last year)',
  });
}
/* ===========================================================================
   TAB AIRBNB — riepilogo 5 listings, stile OTB anno intero (con OCC%/ADR/Rev).
   Ogni listing = 1 unità (1 stanza). OCC = RN venduti / days del mese.
   Confronto 2026 OTB vs 2025 STLY (-364d) come la tab OTB.
   =========================================================================== */
const ABNB_LISTINGS = [
  {key:'Nuovissimo e elegante appartamento a San Lorenzo', short:'Nuovissimo San Lorenzo', color:'#6b5b3f'},
  {key:'[San Lorenzo] Monolocale luminoso e silenzioso',   short:'Monolocale San Lorenzo', color:'#3b6b6b'},
  {key:'Nice cozy flat in Florence',                       short:'Nice cozy flat',       color:'#a83b3b'},
  {key:'Porta al Prato Appartamento Firenze',              short:'Porta al Prato',       color:'#c4823b'},
  {key:'Appartamento con terrazzo Firenze',                short:'App. con terrazzo',    color:'#5a8c69'},
];
const ABNB_STATE = {
  visibleListings: null,
};
function abnbVisibleSet(){
  if (ABNB_STATE.visibleListings && ABNB_STATE.visibleListings.size > 0){
    return ABNB_STATE.visibleListings;
  }
  const s = new Set();
  for (const L of ABNB_LISTINGS) s.add(L.key);
  return s;
}
function abnbShortName(listing){
  for (const l of ABNB_LISTINGS) if (l.key === listing) return l.short;
  return listing;
}
function abnbColor(listing){
  for (const l of ABNB_LISTINGS) if (l.key === listing) return l.color;
  return '#888';
}
function abnbDaysInMonth(y, m){ return new Date(y, m, 0).getDate(); }
function abnbExpand(r){
  const out = [];
  if (!r.start_ymd || !r.end_ymd || r.nights<=0) return out;
  const dIn = new Date(+r.start_ymd.slice(0,4), +r.start_ymd.slice(4,6)-1, +r.start_ymd.slice(6,8));
  const dOut = new Date(+r.end_ymd.slice(0,4), +r.end_ymd.slice(4,6)-1, +r.end_ymd.slice(6,8));
  const revPerNight = r.earnings / r.nights;
  let cur = new Date(dIn);
  while (cur < dOut){
    out.push({y: cur.getFullYear(), m: cur.getMonth()+1, d: cur.getDate(), rev: revPerNight});
    cur.setDate(cur.getDate()+1);
  }
  return out;
}
function abnbAggregate(){
  const stly = new Date(TODAY); stly.setHours(0,0,0,0);
  stly.setDate(stly.getDate() - 364);
  const stlyYmd = ymd(stly);
  const byListing = {};
  for (const L of ABNB_LISTINGS){
    byListing[L.key] = {
      key: L.key, short: L.short, color: L.color,
      months: {},
      totConfirmed: 0, totCancelled: 0,
      leadSum: 0, leadN: 0,
    };
    for (let m=1; m<=12; m++){
      byListing[L.key].months[m] = {curRn:0, curRev:0, prevRn:0, prevRev:0, finalRn:0, finalRev:0};
    }
  }
  for (const r of AIRBNB_DATA){
    const m = byListing[r.listing];
    if (!m) continue;
    if (r.cancelled){ m.totCancelled += 1; continue; }
    m.totConfirmed += 1;
    if (r.booked_ymd && r.start_ymd){
      const dB = new Date(+r.booked_ymd.slice(0,4), +r.booked_ymd.slice(4,6)-1, +r.booked_ymd.slice(6,8));
      const dS = new Date(+r.start_ymd.slice(0,4), +r.start_ymd.slice(4,6)-1, +r.start_ymd.slice(6,8));
      const lead = Math.max(0, Math.round((dS - dB) / 86400000));
      m.leadSum += lead; m.leadN += 1;
    }
    for (const n of abnbExpand(r)){
      const nYmd = n.y*10000 + n.m*100 + n.d;
      if (n.y === 2026 && nYmd <= TODAY_YMD){
        m.months[n.m].curRn += 1;
        m.months[n.m].curRev += n.rev;
      } else if (n.y === 2025){
        m.months[n.m].finalRn += 1;
        m.months[n.m].finalRev += n.rev;
        if (nYmd <= stlyYmd){
          m.months[n.m].prevRn += 1;
          m.months[n.m].prevRev += n.rev;
        }
      }
    }
  }
  for (const k of Object.keys(byListing)){
    const m = byListing[k];
    let totCurRn=0, totCurRev=0, totPrevRn=0, totPrevRev=0, totFinalRn=0, totFinalRev=0, totCurCap=0, totPrevCap=0;
    for (let mo=1; mo<=12; mo++){
      const x = m.months[mo];
      x.cap2026 = abnbDaysInMonth(2026, mo);
      x.cap2025 = abnbDaysInMonth(2025, mo);
      x.occC = x.cap2026>0 ? x.curRn/x.cap2026 : 0;
      x.occP = x.cap2025>0 ? x.prevRn/x.cap2025 : 0;
      x.occF = x.cap2025>0 ? x.finalRn/x.cap2025 : 0;
      x.adrC = x.curRn>0 ? x.curRev/x.curRn : 0;
      x.adrP = x.prevRn>0 ? x.prevRev/x.prevRn : 0;
      x.adrF = x.finalRn>0 ? x.finalRev/x.finalRn : 0;
      x.dOcc = x.occC - x.occP;
      x.dAdrEur = x.adrC - x.adrP;
      x.dAdrPct = x.adrP>0 ? (x.adrC-x.adrP)/x.adrP : NaN;
      x.dRevPct = x.prevRev>0 ? (x.curRev-x.prevRev)/x.prevRev : NaN;
      totCurRn += x.curRn; totCurRev += x.curRev;
      totPrevRn += x.prevRn; totPrevRev += x.prevRev;
      totFinalRn += x.finalRn; totFinalRev += x.finalRev;
      totCurCap += x.cap2026; totPrevCap += x.cap2025;
    }
    m.tot = {
      rnC: totCurRn, revC: totCurRev, capC: totCurCap,
      rnP: totPrevRn, revP: totPrevRev, capP: totPrevCap,
      rnF: totFinalRn, revF: totFinalRev,
      occC: totCurCap>0 ? totCurRn/totCurCap : 0,
      occP: totPrevCap>0 ? totPrevRn/totPrevCap : 0,
      occF: totPrevCap>0 ? totFinalRn/totPrevCap : 0,
      adrC: totCurRn>0 ? totCurRev/totCurRn : 0,
      adrP: totPrevRn>0 ? totPrevRev/totPrevRn : 0,
      adrF: totFinalRn>0 ? totFinalRev/totFinalRn : 0,
    };
    const t = m.tot;
    t.dOcc = t.occC - t.occP;
    t.dAdrEur = t.adrC - t.adrP;
    t.dAdrPct = t.adrP>0 ? (t.adrC - t.adrP)/t.adrP : NaN;
    t.dRevPct = t.revP>0 ? (t.revC - t.revP)/t.revP : NaN;
    m.cancelRate = (m.totConfirmed+m.totCancelled)>0 ? m.totCancelled/(m.totConfirmed+m.totCancelled) : 0;
    m.leadAvg = m.leadN>0 ? m.leadSum/m.leadN : 0;
  }
  const visibleSet = abnbVisibleSet();
  const allMonths = {};
  for (let mo=1; mo<=12; mo++){
    let cR=0, cV=0, pR=0, pV=0, fR=0, fV=0, cCap=0, pCap=0;
    for (const L of ABNB_LISTINGS){
      if (!visibleSet.has(L.key)) continue;
      const x = byListing[L.key].months[mo];
      cR += x.curRn; cV += x.curRev;
      pR += x.prevRn; pV += x.prevRev;
      fR += x.finalRn; fV += x.finalRev;
      cCap += x.cap2026;
      pCap += x.cap2025;
    }
    const obj = {
      curRn:cR, curRev:cV, prevRn:pR, prevRev:pV, finalRn:fR, finalRev:fV,
      cap2026:cCap, cap2025:pCap,
      occC: cCap>0 ? cR/cCap : 0,
      occP: pCap>0 ? pR/pCap : 0,
      occF: pCap>0 ? fR/pCap : 0,
      adrC: cR>0 ? cV/cR : 0,
      adrP: pR>0 ? pV/pR : 0,
      adrF: fR>0 ? fV/fR : 0,
    };
    obj.dOcc = obj.occC - obj.occP;
    obj.dAdrEur = obj.adrC - obj.adrP;
    obj.dAdrPct = obj.adrP>0 ? (obj.adrC-obj.adrP)/obj.adrP : NaN;
    obj.dRevPct = obj.prevRev>0 ? (obj.curRev-obj.prevRev)/obj.prevRev : NaN;
    allMonths[mo] = obj;
  }
  let totCurRn=0, totCurRev=0, totPrevRn=0, totPrevRev=0, totFinalRn=0, totFinalRev=0, totCurCap=0, totPrevCap=0;
  for (let mo=1; mo<=12; mo++){
    totCurRn += allMonths[mo].curRn;
    totCurRev += allMonths[mo].curRev;
    totPrevRn += allMonths[mo].prevRn;
    totPrevRev += allMonths[mo].prevRev;
    totFinalRn += allMonths[mo].finalRn;
    totFinalRev += allMonths[mo].finalRev;
    totCurCap += allMonths[mo].cap2026;
    totPrevCap += allMonths[mo].cap2025;
  }
  const allTot = {
    rnC: totCurRn, revC: totCurRev, capC: totCurCap,
    rnP: totPrevRn, revP: totPrevRev, capP: totPrevCap,
    rnF: totFinalRn, revF: totFinalRev,
    occC: totCurCap>0 ? totCurRn/totCurCap : 0,
    occP: totPrevCap>0 ? totPrevRn/totPrevCap : 0,
    occF: totPrevCap>0 ? totFinalRn/totPrevCap : 0,
    adrC: totCurRn>0 ? totCurRev/totCurRn : 0,
    adrP: totPrevRn>0 ? totPrevRev/totPrevRn : 0,
    adrF: totFinalRn>0 ? totFinalRev/totFinalRn : 0,
  };
  allTot.dOcc = allTot.occC - allTot.occP;
  allTot.dAdrEur = allTot.adrC - allTot.adrP;
  allTot.dAdrPct = allTot.adrP>0 ? (allTot.adrC-allTot.adrP)/allTot.adrP : NaN;
  allTot.dRevPct = allTot.revP>0 ? (allTot.revC-allTot.revP)/allTot.revP : NaN;
  return { byListing, allMonths, allTot, visibleSet };
}
function abnbDeltaCell(v, kind){
  if (!isFinite(v) || v === 0){
    return '<td class="cell-mono cell-flat">—</td>';
  }
  const cls = v>0 ? 'cell-pos' : 'cell-neg';
  let txt;
  if (kind === 'pp')        txt = (v>=0?'+':'') + (v*100).toFixed(1) + ' pp';
  else if (kind === 'pct')  txt = (v>=0?'+':'') + (v*100).toFixed(1) + '%';
  else if (kind === 'eur')  txt = (v>=0?'+':'') + fmtEUR(v);
  else                       txt = (v>=0?'+':'') + Math.round(v).toLocaleString('en-GB');
  return `<td class="cell-mono ${cls}">${txt}</td>`;
}
function abnbRenderVisibilityFilter(){
  const cont = document.getElementById('abnb-monthly-filter');
  if (!cont) return;
  const visible = abnbVisibleSet();
  let html = '';
  for (const L of ABNB_LISTINGS){
    const on = visible.has(L.key);
    html += `<button class="rt-pill ${on?'':'off'}" data-vis-listing="${escapeHtml(L.key)}" style="${on?'border-color:'+L.color:''}">${escapeHtml(L.short)}</button>`;
  }
  cont.innerHTML = html;
  cont.querySelectorAll('[data-vis-listing]').forEach(el => {
    el.addEventListener('click', () => {
      const v = el.dataset.visListing;
      if (ABNB_STATE.visibleListings === null){
        const s = new Set();
        for (const L of ABNB_LISTINGS) s.add(L.key);
        s.delete(v);
        ABNB_STATE.visibleListings = s.size > 0 ? s : null;
      } else {
        const s = new Set(ABNB_STATE.visibleListings);
        if (s.has(v)) s.delete(v); else s.add(v);
        if (s.size === 0) ABNB_STATE.visibleListings = null;
        else if (s.size === ABNB_LISTINGS.length) ABNB_STATE.visibleListings = null;
        else ABNB_STATE.visibleListings = s;
      }
      renderAirbnb();
    });
  });
}
function renderAirbnb(){
  if (typeof AIRBNB_DATA === 'undefined' || !AIRBNB_DATA.length){
    document.getElementById('abnb-kpis').innerHTML = '<div style="padding:30px;text-align:center;color:var(--ink-3);line-height:1.6">Airbnb data now lives in a <b>separate dashboard</b> to keep this file light.<br><span style="font-size:12px">Open <b>airbnb_dashboard.html</b> for the full Airbnb view.</span></div>';
    return;
  }
  const A = abnbAggregate();
  const T = A.allTot;
  const visible = A.visibleSet;
  const visN = visible.size;
  abnbRenderVisibilityFilter();
  const subEl = document.getElementById('abnb-monthly-sub');
  if (subEl){
    const lblParts = visN === ABNB_LISTINGS.length
      ? 'All 5 listings combined'
      : `${visN} listing selezionat${visN===1?'o':'i'}`;
    subEl.textContent = lblParts + ' — capacity = days in month × ' + visN + ' unità';
  }
  const kpis = [
    {label:'Revenue OTB 2026', val:fmtEUR(T.revC),
     sub:`STLY ${fmtEUR(T.revP)}`, delta:T.dRevPct, dkind:'pct', cls:'k-rev'},
    {label:'OCC% Year', val:fmtPct(T.occC,1),
     sub:`STLY ${fmtPct(T.occP,1)}`, delta:T.dOcc, dkind:'pp', cls:'k-occ'},
    {label:'ADR Year', val:fmtAdr(T.adrC),
     sub:`STLY ${fmtAdr(T.adrP)}`, delta:T.dAdrPct, dkind:'pct', cls:'k-adr'},
    {label:'Room Nights', val:fmtNum(T.rnC),
     sub:`STLY ${fmtNum(T.rnP)} · cap ${fmtNum(T.capC)}`, delta:T.rnC-T.rnP, dkind:'num', cls:'k-rooms'},
  ];
  document.getElementById('abnb-kpis').innerHTML = kpis.map(k=>{
    const d = isFinite(k.delta) ? `<span class="delta ${k.delta>0?'pos':k.delta<0?'neg':'flat'}">${
      k.dkind==='pp' ? ((k.delta>=0?'+':'')+(k.delta*100).toFixed(1)+' pp') :
      k.dkind==='pct' ? ((k.delta>=0?'+':'')+(k.delta*100).toFixed(1)+'%') :
      ((k.delta>=0?'+':'')+Math.round(k.delta).toLocaleString('en-GB'))
    }</span>` : '';
    return `<div class="kpi ${k.cls}">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-val">${k.val}</div>
      <div class="kpi-sub">${k.sub} ${d}</div>
    </div>`;
  }).join('');
  let lHead = `
    <thead>
      <tr>
        <th rowspan="2" style="text-align:left">Listing</th>
        <th colspan="3" class="group g-26">2026 OTB</th>
        <th colspan="3" class="group g-25">2025 STLY</th>
        <th colspan="3" class="group g-25" style="background:rgba(58,107,107,.10)">2025 Final LY</th>
        <th colspan="3" class="group g-var">Variazione</th>
      </tr>
      <tr>
        <th>OCC%</th><th>ADR</th><th>Revenue</th>
        <th>OCC%</th><th>ADR</th><th>Revenue</th>
        <th>OCC%</th><th>ADR</th><th>Revenue</th>
        <th>ΔOcc</th><th>ΔADR %</th><th>ΔRev %</th>
      </tr>
    </thead>`;
  let lBody = '';
  for (const L of ABNB_LISTINGS){
    const m = A.byListing[L.key];
    const t = m.tot;
    const isVisible = visible.has(L.key);
    const trStyle = isVisible ? '' : ' style="opacity:0.35"';
    lBody += `<tr${trStyle}>
      <td><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${L.color};margin-right:8px;vertical-align:middle"></span><b>${escapeHtml(L.short)}</b>${isVisible?'':' <span style="font-size:9px;color:var(--ink-3);font-weight:400">(excluded from totals)</span>'}</td>
      <td class="cell-mono">${fmtPct(t.occC,1)}</td>
      <td class="cell-mono">${fmtAdr(t.adrC)}</td>
      <td class="cell-mono">${fmtEUR(t.revC)}</td>
      <td class="cell-mono cell-flat">${fmtPct(t.occP,1)}</td>
      <td class="cell-mono cell-flat">${fmtAdr(t.adrP)}</td>
      <td class="cell-mono cell-flat">${fmtEUR(t.revP)}</td>
      <td class="cell-mono cell-flat" style="background:rgba(58,107,107,.05)">${fmtPct(t.occF,1)}</td>
      <td class="cell-mono cell-flat" style="background:rgba(58,107,107,.05)">${fmtAdr(t.adrF)}</td>
      <td class="cell-mono cell-flat" style="background:rgba(58,107,107,.05)">${fmtEUR(t.revF)}</td>
      ${abnbDeltaCell(t.dOcc, 'pp')}
      ${abnbDeltaCell(t.dAdrPct, 'pct')}
      ${abnbDeltaCell(t.dRevPct, 'pct')}
    </tr>`;
  }
  lBody += `<tr class="total">
    <td>Total ${visN} listing${visN===1?'':'s'}</td>
    <td class="cell-mono">${fmtPct(T.occC,1)}</td>
    <td class="cell-mono">${fmtAdr(T.adrC)}</td>
    <td class="cell-mono"><b>${fmtEUR(T.revC)}</b></td>
    <td class="cell-mono cell-flat">${fmtPct(T.occP,1)}</td>
    <td class="cell-mono cell-flat">${fmtAdr(T.adrP)}</td>
    <td class="cell-mono cell-flat"><b>${fmtEUR(T.revP)}</b></td>
    <td class="cell-mono cell-flat" style="background:rgba(58,107,107,.05)">${fmtPct(T.occF,1)}</td>
    <td class="cell-mono cell-flat" style="background:rgba(58,107,107,.05)">${fmtAdr(T.adrF)}</td>
    <td class="cell-mono cell-flat" style="background:rgba(58,107,107,.05)"><b>${fmtEUR(T.revF)}</b></td>
    ${abnbDeltaCell(T.dOcc, 'pp')}
    ${abnbDeltaCell(T.dAdrPct, 'pct')}
    ${abnbDeltaCell(T.dRevPct, 'pct')}
  </tr>`;
  document.getElementById('abnb-listings').innerHTML = lHead + '<tbody>' + lBody + '</tbody>';
  const monthlyHead = `
    <thead>
      <tr>
        <th rowspan="2" style="text-align:left">Month</th>
        <th colspan="3" class="group g-26">2026 OTB</th>
        <th colspan="3" class="group g-25">2025 STLY</th>
        <th colspan="3" class="group g-25" style="background:rgba(58,107,107,.10)">2025 Final LY</th>
        <th colspan="4" class="group g-var">Variazione</th>
      </tr>
      <tr>
        <th>OCC%</th><th>ADR</th><th>Revenue</th>
        <th>OCC%</th><th>ADR</th><th>Revenue</th>
        <th>OCC%</th><th>ADR</th><th>Revenue</th>
        <th>ΔOcc</th><th>ΔADR €</th><th>ΔADR %</th><th>ΔRev %</th>
      </tr>
    </thead>`;
  let mBody = '';
  for (let mo=1; mo<=12; mo++){
    const x = A.allMonths[mo];
    mBody += `<tr>
      <td>${CFG.monthsITLong[mo-1]}</td>
      <td class="cell-mono">${fmtPct(x.occC,1)}</td>
      <td class="cell-mono">${fmtAdr(x.adrC)}</td>
      <td class="cell-mono">${fmtEUR(x.curRev)}</td>
      <td class="cell-mono cell-flat">${fmtPct(x.occP,1)}</td>
      <td class="cell-mono cell-flat">${fmtAdr(x.adrP)}</td>
      <td class="cell-mono cell-flat">${fmtEUR(x.prevRev)}</td>
      <td class="cell-mono cell-flat" style="background:rgba(58,107,107,.05)">${fmtPct(x.occF,1)}</td>
      <td class="cell-mono cell-flat" style="background:rgba(58,107,107,.05)">${fmtAdr(x.adrF)}</td>
      <td class="cell-mono cell-flat" style="background:rgba(58,107,107,.05)">${fmtEUR(x.finalRev)}</td>
      ${abnbDeltaCell(x.dOcc, 'pp')}
      ${abnbDeltaCell(x.dAdrEur, 'eur')}
      ${abnbDeltaCell(x.dAdrPct, 'pct')}
      ${abnbDeltaCell(x.dRevPct, 'pct')}
    </tr>`;
  }
  mBody += `<tr class="total">
    <td>Full year</td>
    <td class="cell-mono">${fmtPct(T.occC,1)}</td>
    <td class="cell-mono">${fmtAdr(T.adrC)}</td>
    <td class="cell-mono"><b>${fmtEUR(T.revC)}</b></td>
    <td class="cell-mono cell-flat">${fmtPct(T.occP,1)}</td>
    <td class="cell-mono cell-flat">${fmtAdr(T.adrP)}</td>
    <td class="cell-mono cell-flat"><b>${fmtEUR(T.revP)}</b></td>
    <td class="cell-mono cell-flat" style="background:rgba(58,107,107,.05)">${fmtPct(T.occF,1)}</td>
    <td class="cell-mono cell-flat" style="background:rgba(58,107,107,.05)">${fmtAdr(T.adrF)}</td>
    <td class="cell-mono cell-flat" style="background:rgba(58,107,107,.05)"><b>${fmtEUR(T.revF)}</b></td>
    ${abnbDeltaCell(T.dOcc, 'pp')}
    ${abnbDeltaCell(T.adrC - T.adrP, 'eur')}
    ${abnbDeltaCell(T.dAdrPct, 'pct')}
    ${abnbDeltaCell(T.dRevPct, 'pct')}
  </tr>`;
  document.getElementById('abnb-monthly-all').innerHTML = monthlyHead + '<tbody>' + mBody + '</tbody>';
}
/* ============================================================
   SVG CHART HELPERS
   ============================================================ */
function svgEscape(s){ return String(s); }
/* Single-series line chart with current+stly comparison.
   curArr / prevArr same length, labels[] for x axis. */
function lineChart(curArr, prevArr, labels, color='#6b5b3f', unit='€', kind='rev', altColor='#8a8a8a', smooth=true){
  const W = 560, H = 220;
  const padL = 50, padR = 16, padT = 12, padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const all = [...curArr, ...prevArr].filter(v=>isFinite(v) && v!=null);
  let yMax = all.length ? Math.max(...all) : 1;
  if (yMax<=0) yMax = 1;
  yMax = niceCeil(yMax);
  const yMin = 0;
  const n = labels.length;
  const xStep = n>1 ? innerW/(n-1) : innerW;
  function xy(i,v){
    const x = padL + i*xStep;
    const yv = isFinite(v) ? v : 0;
    const y = padT + innerH * (1 - (yv-yMin)/(yMax-yMin));
    return [x,y];
  }
  function pathFor(arr, dashed=false){
    const pts = arr.map((v,i)=>xy(i, isFinite(v)?v:0));
    if (smooth && pts.length>1){
      let d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i=1;i<pts.length;i++){
        const [x0,y0] = pts[i-1], [x1,y1] = pts[i];
        const cx = (x0+x1)/2;
        d += ` C${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
      }
      return d;
    }
    return 'M' + pts.map(p=>p.join(' ')).join(' L');
  }
  const ticks = 4;
  let yTicks = '';
  for (let i=0;i<=ticks;i++){
    const v = yMin + (yMax-yMin)*i/ticks;
    const y = padT + innerH * (1 - i/ticks);
    yTicks += `<line x1="${padL}" x2="${W-padR}" y1="${y}" y2="${y}" stroke="#e6e1d8" stroke-dasharray="2,3"/>
      <text x="${padL-6}" y="${y+3}" text-anchor="end" font-size="9.5" font-family="DM Mono,monospace" fill="#8a8a8a">${tickFmt(v,kind,unit)}</text>`;
  }
  let xLab = '';
  for (let i=0;i<n;i++){
    const x = padL + i*xStep;
    xLab += `<text x="${x}" y="${H-8}" text-anchor="middle" font-size="10" font-family="DM Sans,sans-serif" fill="#8a8a8a">${labels[i]}</text>`;
  }
  const prevPath = pathFor(prevArr.map(v=>isFinite(v)?v:0));
  const curPath  = pathFor(curArr.map(v=>isFinite(v)?v:0));
  let curDots = '';
  curArr.forEach((v,i)=>{
    if (!isFinite(v)) return;
    const [x,y] = xy(i,v);
    curDots += `<circle cx="${x}" cy="${y}" r="3" fill="${color}" stroke="#fff" stroke-width="1.5"><title>${labels[i]}: ${tickFmt(v,kind,unit)}</title></circle>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" preserveAspectRatio="xMidYMid meet">
    ${yTicks}
    <path d="${prevPath}" fill="none" stroke="${altColor}" stroke-width="1.7" stroke-dasharray="4,4" opacity="0.85"/>
    <path d="${curPath}" fill="none" stroke="${color}" stroke-width="2.2"/>
    ${curDots}
    ${xLab}
  </svg>`;
}
function multiLineChart(series, labels, unit='%', kind='pct'){
  const W = 560, H = 240;
  const padL = 50, padR = 16, padT = 12, padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  let all=[];
  for (const s of series){ all = all.concat(s.cur, s.prev); }
  all = all.filter(v=>isFinite(v));
  let yMax = all.length? Math.max(...all) : 1;
  if (yMax<=0) yMax=1;
  yMax = niceCeil(yMax);
  const yMin = 0;
  const n = labels.length;
  const xStep = n>1 ? innerW/(n-1) : innerW;
  function xy(i,v){
    const x = padL + i*xStep;
    const yv = isFinite(v)?v:0;
    return [x, padT + innerH * (1 - (yv-yMin)/(yMax-yMin))];
  }
  function pathFor(arr){
    const pts = arr.map((v,i)=>xy(i,isFinite(v)?v:0));
    if (!pts.length) return '';
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i=1;i<pts.length;i++){
      const [x0,y0] = pts[i-1], [x1,y1] = pts[i];
      const cx = (x0+x1)/2;
      d += ` C${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    return d;
  }
  const ticks=4;
  let yTicks='';
  for (let i=0;i<=ticks;i++){
    const v = yMin + (yMax-yMin)*i/ticks;
    const y = padT + innerH*(1-i/ticks);
    yTicks += `<line x1="${padL}" x2="${W-padR}" y1="${y}" y2="${y}" stroke="#e6e1d8" stroke-dasharray="2,3"/>
      <text x="${padL-6}" y="${y+3}" text-anchor="end" font-size="9.5" font-family="DM Mono,monospace" fill="#8a8a8a">${tickFmt(v,kind,unit)}</text>`;
  }
  let xLab='';
  for (let i=0;i<n;i++){
    const x = padL + i*xStep;
    xLab += `<text x="${x}" y="${H-8}" text-anchor="middle" font-size="10" font-family="DM Sans,sans-serif" fill="#8a8a8a">${labels[i]}</text>`;
  }
  let lines = '';
  for (const s of series){
    lines += `<path d="${pathFor(s.prev)}" fill="none" stroke="${s.color}" stroke-width="1.6" stroke-dasharray="4,4" opacity="0.55"/>`;
    lines += `<path d="${pathFor(s.cur)}"  fill="none" stroke="${s.color}" stroke-width="2.2"/>`;
    s.cur.forEach((v,i)=>{
      if (!isFinite(v)||v<=0) return;
      const [x,y] = xy(i,v);
      const prev = isFinite(s.prev[i]) ? s.prev[i] : null;
      const delta = (prev != null && prev > 0) ? ((v - prev) / prev * 100) : null;
      const dStr = (delta != null) ? `\nΔ ${delta>=0?'+':''}${delta.toFixed(1)}%` : '';
      const prevStr = (prev != null && prev > 0) ? `\nSTLY: ${tickFmt(prev,kind,unit)}` : '\nSTLY: —';
      lines += `<circle cx="${x}" cy="${y}" r="2.8" fill="${s.color}" stroke="#fff" stroke-width="1.2"><title>${s.label} · ${labels[i]}\n2026: ${tickFmt(v,kind,unit)}${prevStr}${dStr}</title></circle>`;
    });
    s.prev.forEach((v,i)=>{
      if (!isFinite(v)||v<=0) return;
      const [x,y] = xy(i,v);
      const cur = isFinite(s.cur[i]) ? s.cur[i] : null;
      const curStr = (cur != null && cur > 0) ? `\n2026: ${tickFmt(cur,kind,unit)}` : '\n2026: —';
      lines += `<circle cx="${x}" cy="${y}" r="2.2" fill="#fff" stroke="${s.color}" stroke-width="1.4" opacity="0.7"><title>${s.label} · ${labels[i]}\nSTLY: ${tickFmt(v,kind,unit)}${curStr}</title></circle>`;
    });
  }
  return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" preserveAspectRatio="xMidYMid meet">
    ${yTicks}${lines}${xLab}
  </svg>`;
}
function barCompareChart(curArr, prevArr, labels, colorCur='#6b5b3f', colorPrev='#d8d2c5'){
  const W = 560, H = 220;
  const padL = 50, padR = 16, padT = 12, padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const all = [...curArr, ...prevArr];
  let yMax = Math.max(1, ...all);
  yMax = niceCeil(yMax);
  const n = labels.length;
  const groupW = innerW / n;
  const barW = (groupW * 0.8) / 2;
  let bars = '';
  let xLab = '';
  for (let i=0;i<n;i++){
    const cx = padL + groupW*i + groupW/2;
    const xC = cx - barW;
    const xP = cx;
    const hC = innerH * (curArr[i]/yMax);
    const hP = innerH * (prevArr[i]/yMax);
    bars += `<rect x="${xC}" y="${padT+innerH-hC}" width="${barW-1}" height="${hC}" fill="${colorCur}" rx="2"><title>${labels[i]} OTB: ${fmtEUR(curArr[i])}</title></rect>`;
    bars += `<rect x="${xP}" y="${padT+innerH-hP}" width="${barW-1}" height="${hP}" fill="${colorPrev}" rx="2"><title>${labels[i]} Budget: ${fmtEUR(prevArr[i])}</title></rect>`;
    xLab += `<text x="${cx}" y="${H-8}" text-anchor="middle" font-size="10" font-family="DM Sans,sans-serif" fill="#8a8a8a">${labels[i]}</text>`;
  }
  const ticks=4;
  let yTicks='';
  for (let i=0;i<=ticks;i++){
    const v = yMax*i/ticks;
    const y = padT + innerH*(1-i/ticks);
    yTicks += `<line x1="${padL}" x2="${W-padR}" y1="${y}" y2="${y}" stroke="#e6e1d8" stroke-dasharray="2,3"/>
      <text x="${padL-6}" y="${y+3}" text-anchor="end" font-size="9.5" font-family="DM Mono,monospace" fill="#8a8a8a">${tickFmt(v,'rev','€')}</text>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" preserveAspectRatio="xMidYMid meet">${yTicks}${bars}${xLab}</svg>`;
}
function tickFmt(v, kind, unit){
  if (kind==='pct') return Math.round(v)+'%';
  if (kind==='rev' || kind==='eur'){
    if (Math.abs(v)>=1000000) return '€'+(v/1000000).toFixed(1)+'M';
    if (Math.abs(v)>=1000)   return '€'+Math.round(v/1000)+'k';
    return '€'+Math.round(v);
  }
  return Math.round(v);
}
function niceCeil(v){
  if (v<=0) return 1;
  const exp = Math.floor(Math.log10(v));
  const f = v / Math.pow(10,exp);
  let nice;
  if (f<=1) nice=1;
  else if (f<=2) nice=2;
  else if (f<=2.5) nice=2.5;
  else if (f<=5) nice=5;
  else nice=10;
  return nice * Math.pow(10,exp);
}
/* ============================================================
   CHAT AI - rule-based revenue assistant
   ============================================================ */
const CHAT_SUGG = [
  'July revenue',
  'Top channel Firenze',
  'ADR Suite',
  'Pickup last week',
  'Budget gap Condotta',
  'Change vs STLY',
];
function initChat(){
  document.getElementById('chat-suggestions').innerHTML = CHAT_SUGG.map(s=>`<button class="chat-sugg">${s}</button>`).join('');
  document.querySelectorAll('.chat-sugg').forEach(b=>{
    b.addEventListener('click', ()=>{ document.getElementById('chat-input').value = b.textContent; sendChat(); });
  });
  document.getElementById('chat-fab').addEventListener('click', ()=>{
    const p = document.getElementById('chat-panel');
    p.classList.toggle('open');
    if (p.classList.contains('open') && !document.getElementById('chat-body').children.length){
      addBotMsg(welcomeMsg());
    }
  });
  document.getElementById('chat-close').addEventListener('click', ()=>{
    document.getElementById('chat-panel').classList.remove('open');
  });
  document.getElementById('chat-send').addEventListener('click', sendChat);
  document.getElementById('chat-input').addEventListener('keydown', e=>{
    if (e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendChat(); }
  });
}
function welcomeMsg(){
  return `Hi! I'm your Revenue AI. I can analyze bookings, OTB, ADR, OCC, pickup, budget and channels.<br>
  Current context: <b>${structLabel(CURRENT_STRUCT)}</b>.<br>
  <span style="font-size:11.5px;color:#8a8a8a">You can force the property in the question: <i>"July revenue Firenze"</i>, <i>"budget gap Condotta"</i>, <i>"top channel both"</i>.</span><br>
  Prova: <i>"revenue july", "top channel", "ADR by room type", "pickup", "budget gap", "vs STLY"</i>.`;
}
function addUserMsg(t){
  const el = document.createElement('div'); el.className='msg user'; el.textContent=t;
  const body = document.getElementById('chat-body'); body.appendChild(el); body.scrollTop = body.scrollHeight;
}
function addBotMsg(html){
  const el = document.createElement('div'); el.className='msg bot'; el.innerHTML=html;
  const body = document.getElementById('chat-body'); body.appendChild(el); body.scrollTop = body.scrollHeight;
}
function sendChat(){
  const inp = document.getElementById('chat-input');
  const q = inp.value.trim(); if (!q) return;
  inp.value=''; addUserMsg(q);
  setTimeout(()=>addBotMsg(answerChat(q)), 120);
}
/* Detect if user is asking about a specific structure.
   Returns {sel, override} where override=true means the user explicitly
   named a structure different from (or matching) CURRENT_STRUCT. */
function detectStructInQuery(Q){
  const reFs   = /\b(firenze\s*suite|firenze|fs)\b/;
  const reC16  = /\b(condotta\s*16|condotta|c16)\b/;
  const reBoth = /\b(entrambe|gruppo|tutte\s+le\s+strutture|both|tutte)\b/;
  const hitFs   = reFs.test(Q);
  const hitC16  = reC16.test(Q);
  const hitBoth = reBoth.test(Q);
  if (hitBoth) return { sel:'both', override: CURRENT_STRUCT!=='both' };
  if (hitFs && !hitC16) return { sel:'firenze', override: CURRENT_STRUCT!=='firenze' };
  if (hitC16 && !hitFs) return { sel:'condotta', override: CURRENT_STRUCT!=='condotta' };
  if (hitFs && hitC16)  return { sel:'both',     override: CURRENT_STRUCT!=='both' };
  return { sel: CURRENT_STRUCT, override:false };
}
function answerChat(q){
  const Q = q.toLowerCase();
  const det = detectStructInQuery(Q);
  const sel = det.sel;
  const A = aggOTBYearly(sel);
  const overrideBadge = det.override
    ? `<span style="display:inline-block;font-size:9.5px;background:#3b6b6b;color:#fff;padding:1px 6px;border-radius:8px;margin-left:6px;letter-spacing:.04em">FROM QUESTION</span>`
    : '';
  const ctx = `<div style="font-size:10.5px;color:#8a8a8a;margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em">${structLabel(sel)}${overrideBadge}</div>`;
  let monthHit = 0;
  for (let i=0;i<12;i++){
    const re = new RegExp('\\b' + CFG.monthsIT[i] + '\\b', 'i');
    if (re.test(Q)) { monthHit = i+1; break; }
  }
  if (!monthHit){
    for (let i=0;i<12;i++){
      const re = new RegExp('\\b' + CFG.monthsITLong[i].toLowerCase() + '\\b', 'i');
      if (re.test(Q)) { monthHit = i+1; break; }
    }
  }
  if (monthHit>0){
    const r = A.monthRows[monthHit-1];
    return ctx + `<b>${CFG.monthsITLong[monthHit-1]} 2026</b><br>
      Revenue OTB: <b>${fmtEUR(r.revC)}</b> (STLY ${fmtEUR(r.revP)}, ${fmtPctVar(r.dRevPct)})<br>
      OCC: <b>${fmtPct(r.occC,1)}</b> (${fmtPctPP(r.dOcc)})<br>
      ADR: <b>${fmtAdr(r.adrC)}</b> (${fmtPctVar(r.dAdrPct)})<br>
      Room nights: ${fmtNum(r.rnC)} su capacità.`;
  }
  if (Q.includes('canale') || Q.includes('canali')){
    const rows = Object.entries(A.canCur).sort((a,b)=>b[1].rev-a[1].rev).slice(0,5);
    let html = ctx + '<b>Top channels · 2026 OTB</b><table><tr><th>Channel</th><th>RN</th><th>Revenue</th><th>vs STLY</th></tr>';
    for (const [k,v] of rows){
      const p = A.canPrev[k] || {rev:0};
      const d = p.rev>0 ? (v.rev-p.rev)/p.rev : NaN;
      html += `<tr><td>${escapeHtml(k)}</td><td>${fmtNum(v.rn)}</td><td>${fmtEUR(v.rev)}</td><td>${isFinite(d)?fmtPctVar(d):'nuovo'}</td></tr>`;
    }
    html += '</table>';
    return html;
  }
  if (Q.includes('provenienz') || Q.includes('source') || Q.includes('origin')){
    const rows = Object.entries(A.provCur).sort((a,b)=>b[1].rev-a[1].rev);
    let html = ctx + '<b>Source · 2026 OTB</b><table><tr><th>Source</th><th>RN</th><th>Revenue</th></tr>';
    for (const [k,v] of rows){
      html += `<tr><td>${escapeHtml(k)}</td><td>${fmtNum(v.rn)}</td><td>${fmtEUR(v.rev)}</td></tr>`;
    }
    html += '</table>';
    return html;
  }
  if (Q.includes('adr') || Q.includes('room type') || Q.includes('tipologia') || Q.includes('camera') || Q.includes('suite') || Q.includes('bilocale') || Q.includes('trilocale') || Q.includes('attico') || Q.includes('deluxe')){
    const RT = aggRoomType(sel);
    let html = ctx + `<b>OCC and ADR by Room Type · 2026 vs STLY</b><table><tr><th>RT</th><th>OCC '26</th><th>ADR '26</th><th>OCC '25</th><th>ADR '25</th></tr>`;
    for (const rt of RT.rtList){
      const d = RT.rtData[rt];
      html += `<tr><td>${escapeHtml(rt)}</td><td>${fmtPct(d.occC,1)}</td><td>${fmtAdr(d.adrC)}</td><td>${fmtPct(d.occP,1)}</td><td>${fmtAdr(d.adrP)}</td></tr>`;
    }
    html += '</table>';
    return html;
  }
  if (Q.includes('budget') || Q.includes('gap') || Q.includes('target') || Q.includes('achievement')){
    const B = aggBudget(sel);
    let html = ctx + `<b>Budget ${CFG.fiscal.label} · ${fmtPct(B.totPct,1)} achievement</b><br>
      OTB: ${fmtEUR(B.totOtb)} / ${fmtEUR(B.totBud)}<br>
      Gap: <b>${(B.totOtb-B.totBud>=0?'+':'')+fmtEUR(B.totOtb-B.totBud).replace('€','€')}</b><br><br>
      <b>Top months below budget:</b><table><tr><th>Month</th><th>OTB</th><th>Target</th><th>%</th></tr>`;
    const sorted = [...B.rows].filter(r=>r.target>0).sort((a,b)=>(a.pct||0)-(b.pct||0)).slice(0,5);
    for (const r of sorted){
      const ml = `${CFG.monthsITLong[r.m-1]} ${r.y}`;
      html += `<tr><td>${ml}</td><td>${fmtEUR(r.otb)}</td><td>${fmtEUR(r.target)}</td><td>${fmtPct(r.pct,0)}</td></tr>`;
    }
    html += '</table>';
    return html;
  }
  if (Q.includes('pickup') || Q.includes('settiman')){
    const P = aggPickup(sel);
    let totC=0,totP=0,bkC=0,bkP=0;
    for (const k of P.rtAxis){ P.rt[k].forEach(c=>{totC+=c.rn; bkC+=c.bk;}); P.rtS[k].forEach(c=>{totP+=c.rn; bkP+=c.bk;}); }
    let html = ctx + `<b>Pickup last 4 weeks</b><br>
      RN 2026: <b>${totC}</b> · STLY: ${totP} (${fmtPctVar((totC-totP)/Math.max(totP,1))})<br>
      Bookings 2026: <b>${bkC}</b> · STLY: ${bkP}<br><br>
      <b>By week (RN 2026 vs STLY)</b><table><tr><th>W</th><th>2026</th><th>STLY</th></tr>`;
    for (let i=0;i<P.weeks.length;i++){
      let c=0,p=0;
      for (const k of P.rtAxis){ c+=P.rt[k][i].rn; p+=P.rtS[k][i].rn; }
      html += `<tr><td>W${i+1} ${pad2(P.weeks[i].start.getDate())}/${pad2(P.weeks[i].start.getMonth()+1)}</td><td>${c}</td><td>${p}</td></tr>`;
    }
    html += '</table>';
    return html;
  }
  if (Q.includes('stly') || Q.includes('confronto') || Q.includes('vs') || Q.includes('variazione')){
    return ctx + `<b>Full year · 2026 vs STLY</b><br>
      Revenue: <b>${fmtEUR(A.tot.revC)}</b> vs ${fmtEUR(A.tot.revP)} (${fmtPctVar(A.tot.dRevPct)})<br>
      OCC: <b>${fmtPct(A.tot.occC,1)}</b> vs ${fmtPct(A.tot.occP,1)} (${fmtPctPP(A.tot.dOcc)})<br>
      ADR: <b>${fmtAdr(A.tot.adrC)}</b> vs ${fmtAdr(A.tot.adrP)} (${fmtPctVar(A.tot.dAdrPct)})<br>
      RN: <b>${fmtNum(A.tot.rnC)}</b> vs ${fmtNum(A.tot.rnP)}`;
  }
  if (Q.includes('top') || Q.includes('best') || Q.includes('miglior')){
    const sorted = [...A.monthRows].sort((a,b)=>b.revC-a.revC).slice(0,5);
    let html = ctx + '<b>Top months by revenue 2026</b><table><tr><th>Month</th><th>Revenue</th><th>OCC</th><th>ADR</th></tr>';
    for (const r of sorted){
      html += `<tr><td>${CFG.monthsITLong[r.m-1]}</td><td>${fmtEUR(r.revC)}</td><td>${fmtPct(r.occC,1)}</td><td>${fmtAdr(r.adrC)}</td></tr>`;
    }
    html += '</table>';
    return html;
  }
  if (Q.includes('totale') || Q.includes('anno') || Q.includes('overall')){
    return ctx + `<b>Full year 2026</b><br>
      Revenue OTB: <b>${fmtEUR(A.tot.revC)}</b><br>
      OCC: <b>${fmtPct(A.tot.occC,1)}</b><br>
      ADR: <b>${fmtAdr(A.tot.adrC)}</b><br>
      Room Nights: <b>${fmtNum(A.tot.rnC)}</b> / capacità ${fmtNum(A.tot.capC)}<br>
      vs STLY: ${fmtPctVar(A.tot.dRevPct)} revenue, ${fmtPctPP(A.tot.dOcc)} OCC.`;
  }
  return ctx + `I can help with:<br>
  • <b>Month</b>: "July revenue", "August ADR"<br>
  • <b>Channel</b>: "top channel", "Booking vs Website"<br>
  • <b>Room type</b>: "ADR Suite", "OCC Bilocale"<br>
  • <b>Budget</b>: "budget gap", "achievement"<br>
  • <b>Pickup</b>: "weekly pickup", "last 4 weeks"<br>
  • <b>STLY</b>: "vs STLY", "year change"<br>
  • <b>Property</b>: add <i>"Firenze"</i>, <i>"Condotta"</i> or <i>"both"</i> to any question to switch property just for that answer.`;
}
/* ============================================================
   INIT & EVENT WIRING
   ============================================================ */
function updateChips(){
  document.getElementById('chip-struct-name').textContent = structLabel(CURRENT_STRUCT);
  const chip = document.getElementById('chip-struct');
  chip.classList.remove('struct-fs','struct-c16','struct-both');
  chip.classList.add(CURRENT_STRUCT==='firenze'?'struct-fs':CURRENT_STRUCT==='condotta'?'struct-c16':'struct-both');
  const _safeSet = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  _safeSet('chip-today', fmtDateIT(TODAY));
  _safeSet('foot-today', fmtDateIT(TODAY));
  _safeSet('topbar-sub', `${structLabel(CURRENT_STRUCT)} · OTB as of ${fmtDateIT(TODAY)} · STLY ${fmtDateIT(STLY)}`);
  _safeSet('otb-cur-date', fmtDateIT(TODAY));
  _safeSet('otb-stly-date', fmtDateIT(STLY));
  _safeSet('chat-ctx', 'Context: ' + structLabel(CURRENT_STRUCT));
}
function renderAll(){
  if (typeof _RMESMAP_TICK !== 'undefined') _RMESMAP_TICK = {};  // reset cache per-render
  updateChips();
  if (CURRENT_TAB === 'big' && typeof renderBigPicture === 'function'){
    try { renderBigPicture(); } catch(e){ console.error('renderBigPicture', e); }
  }
  if (typeof renderRMESConfigTab === 'function') renderRMESConfigTab();
  renderOTB(CURRENT_STRUCT);
  RT_VISIBLE = null;  // reset filter on struct change
  renderRT(CURRENT_STRUCT);
  _FCST_DIRTY = true;
  if (CURRENT_TAB === 'fcst' && typeof renderForecast === 'function'){
    renderForecast(CURRENT_STRUCT); _FCST_DIRTY = false;
  }
  renderPickup(CURRENT_STRUCT);
  if (typeof renderSellStrategy === 'function'){
    var _sk = CURRENT_STRUCT;
    var _wrap = document.getElementById('sell-table-wrap');
    if (_wrap){
      _wrap.innerHTML = '<div style="padding:40px;text-align:center;color:var(--ink-3);font-family:\'DM Mono\',monospace;font-size:13px">⏳ Computing prices…</div>';
    }
    _SELL_RENDER_TOKEN++;
    var _myToken = _SELL_RENDER_TOKEN;
    setTimeout(function(){
      if (_myToken !== _SELL_RENDER_TOKEN) return;
      try { renderSellStrategy(_sk); } catch(e){ console.error('renderSellStrategy', e); }
    }, 0);
  }
  renderHistorico(CURRENT_STRUCT);
  if (typeof renderCancellations === 'function') renderCancellations(CURRENT_STRUCT);
  if (typeof renderBookingWindowOTB === 'function') renderBookingWindowOTB(CURRENT_STRUCT);
  if (typeof renderBookingWindowCancel === 'function') renderBookingWindowCancel(CURRENT_STRUCT);
  if (typeof renderRateShopper === 'function') renderRateShopper();
  if (typeof renderAirbnb === 'function') renderAirbnb();
}
function setStructure(sel){
  if (CURRENT_STRUCT === sel) return;
  CURRENT_STRUCT = sel;
  if (typeof BIG_SELECTED_DAY !== 'undefined') BIG_SELECTED_DAY = null;
  document.querySelectorAll('.struct-pill').forEach(p=>{
    p.classList.toggle('active', p.dataset.s===sel);
  });
  renderAll();
  if (typeof updateNotesBadge === 'function') updateNotesBadge();
}
let CURRENT_TAB = 'big';
let _FCST_DIRTY = true;  // il Forecast va ricalcolato (struttura cambiata o dati ricaricati)
/* ============ BIG PICTURE TAB ============ */
let BIG_PICKUP_DAYS = 1;   // 1 (default) | 7
const BIG_CARD_THEMES = {
  sell:   {accent:'#c4823b', bg:'linear-gradient(135deg,#fff6ea,#fdeccf)', ink:'#7a4e16', icon:'📈'},
  otb:    {accent:'#3b6b9a', bg:'linear-gradient(135deg,#eef4fb,#dce9f6)', ink:'#244b6e', icon:'🗓️'},
  fcst:   {accent:'#3d7a4b', bg:'linear-gradient(135deg,#edf6ef,#d9eddf)', ink:'#235033', icon:'🎯'},
  cancel: {accent:'#b0464b', bg:'linear-gradient(135deg,#fdeded,#f8dada)', ink:'#7a2b2f', icon:'✖️'},
  rate:   {accent:'#8e5fa8', bg:'linear-gradient(135deg,#f6f0fa,#e9dcf2)', ink:'#5a3a7a', icon:'🏷️'},
  occpk:  {accent:'#1f8a8a', bg:'linear-gradient(135deg,#ebf7f7,#d4eded)', ink:'#155e5e', icon:'🛏️'}
};
const BIG_HERO_ICONS = ['⚡','💶','📊','🏆'];
function _bigProvLabel(p){ return (p==='Non Specificato' ? 'Sito web' : p); }
let BIG_SELECTED_DAY = null;   // ymd (number) del giorno cliccato nel grafico; null = ultimo giorno
function _bigPickupTreeForDay(sel, dayYmd){
  const ks = new Set(structKeysFor(sel));
  let lo=dayYmd, hi=dayYmd;
  if (dayYmd === 'all'){
    const today = new Date(TODAY); today.setHours(0,0,0,0);
    lo = +ymd(new Date(today.getTime()-6*864e5)); hi = +ymd(today);
  }
  const byMonth={}, byRoom={}, byChannel={}, byStayDay={}; let totRn=0, totRev=0;
  for (const b of BOOKINGS){
    if (b.cancelled || !ks.has(b.struct)) continue;
    if (dayYmd==='all' ? (b.bookYmd<lo || b.bookYmd>hi) : (b.bookYmd!==dayYmd)) continue;
    const rn=b.notti||0, rev=b.revTotal||0; totRn+=rn; totRev+=rev;
    const ch=(b.canale||'?'); byChannel[ch]=(byChannel[ch]||0)+rn;
    const rm=b.room||'?'; byRoom[rm]=(byRoom[rm]||0)+rn;
    if (b.dIn){
      const d=new Date(b.dIn);
      const ym=`${d.getUTCFullYear()}-${pad2(d.getUTCMonth()+1)}`; byMonth[ym]=(byMonth[ym]||0)+rn;
      const sd=+ymd(d); byStayDay[sd]=(byStayDay[sd]||0)+rn;
    }
  }
  const top=(obj,fn)=>Object.keys(obj).map(k=>({key:k,label:fn?fn(k):k,rn:obj[k]})).filter(x=>x.rn>0).sort((a,b)=>b.rn-a.rn);
  return {
    totRn, totRev,
    months: top(byMonth,(ym)=>{const p=ym.split('-');const mm=+p[1];return (CFG.monthsITLong?CFG.monthsITLong[mm-1]:ym)+' '+p[0];}),
    rooms: top(byRoom),
    channels: top(byChannel),
    stayDays: top(byStayDay,(sd)=>{const s=String(sd);return `${s.slice(6,8)}/${s.slice(4,6)}/${s.slice(0,4)}`;}),
  };
}
function _bigPickupAgg(sel, nDays){
  const ks = new Set(structKeysFor(sel));
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const hiYmd = +ymd(today);
  const loDate = new Date(today); loDate.setDate(loDate.getDate()-(nDays-1));
  const loYmd = +ymd(loDate);
  const byChannel={}, byMonth={}, byRoom={}, byStayDay={};
  let totRn=0, totRev=0;
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (!ks.has(b.struct)) continue;
    if (b.bookYmd < loYmd || b.bookYmd > hiYmd) continue;
    const rn = b.notti||0, rev = b.revTotal||0;
    totRn += rn; totRev += rev;
    const ch = _bigProvLabel(b.prov||b.canale||'?');
    byChannel[ch] = (byChannel[ch]||0) + rn;
    const rm = b.room||'?';
    byRoom[rm] = (byRoom[rm]||0) + rn;
    if (b.dIn){ const d=new Date(b.dIn); const ym=`${d.getUTCFullYear()}-${pad2(d.getUTCMonth()+1)}`; byMonth[ym]=(byMonth[ym]||0)+rn; }
  }
  const top = (obj,labelFn)=> Object.keys(obj).map(k=>({key:k,label:labelFn?labelFn(k):k,rn:obj[k]})).filter(x=>x.rn>0).sort((a,b)=>b.rn-a.rn);
  return {
    totRn, totRev,
    channels: top(byChannel),
    months: top(byMonth,(ym)=>{const p=ym.split('-'); const mm=+p[1]; return (CFG.monthsITLong?CFG.monthsITLong[mm-1]:ym)+' '+p[0];}),
    rooms: top(byRoom),
  };
}
const BIG_STRUCTS = [
  {k:'firenze',  name:'Firenze Suite',    color:'#3b6b9a'},
  {k:'condotta', name:'Condotta 16',      color:'#3d7a4b'},
  {k:'alfani',   name:'Palazzo Alfani',   color:'#8e5fa8'},
  {k:'davids',   name:"Enis Guesthouse", color:'#c0392b'}
];
function _bigStructKey(slug){ return CFG.structures[slug] ? CFG.structures[slug].key : slug; }
function _bigBreakdownData(kind, nDays, forceWindow){
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  if (kind === 'pickup'){
    let lo, hi, lbl;
    if (!forceWindow && typeof BIG_SELECTED_DAY === 'number'){
      lo = hi = BIG_SELECTED_DAY;
      const s=String(BIG_SELECTED_DAY); lbl = `${s.slice(6,8)}/${s.slice(4,6)}/${s.slice(0,4)}`;
    } else {
      hi=+ymd(today); lo=+ymd(new Date(today.getTime()-6*864e5)); lbl = 'last 7 days';
    }
    const tot={}; BIG_STRUCTS.forEach(s=>tot[_bigStructKey(s.k)]=0);
    for (const b of BOOKINGS){ if(b.cancelled)continue; const key=b.struct; if(tot[key]===undefined)continue; if(b.bookYmd>=lo&&b.bookYmd<=hi) tot[key]+=b.notti||0; }
    const total = Object.values(tot).reduce((a,b)=>a+b,0)||1;
    return { title:'Pickup by property', sub:`${lbl} · ${total} RN total`,
      rows: BIG_STRUCTS.map(s=>{const v=tot[_bigStructKey(s.k)]; return {name:s.name,color:s.color,main:`${v} RN`,pct:v/total*100,barPct:v/total*100};}) };
  }
  if (kind === 'cancel'){
    const tot={}; BIG_STRUCTS.forEach(s=>tot[s.k]=0);
    BIG_STRUCTS.forEach(s=>{ try{ tot[s.k]=_bigCancelByDay(s.k, nDays).totRn; }catch(e){} });
    const total = Object.values(tot).reduce((a,b)=>a+b,0)||1;
    const winLbl = nDays===1?'last day':`last ${nDays} days`;
    return { title:'Cancellations by property', sub:`${winLbl} · ${total} RN cancelled`,
      rows: BIG_STRUCTS.map(s=>({name:s.name,color:s.color,main:`${tot[s.k]} RN`,pct:tot[s.k]/total*100,barPct:tot[s.k]/total*100})) };
  }
  if (kind === 'forecast'){
    const curKey = `${today.getFullYear()}${pad2(today.getMonth()+1)}`;
    const rows=[]; let maxFc=1;
    BIG_STRUCTS.forEach(s=>{ let fc=0,otb=0; try{ const F=aggForecast(s.k); if(F&&F.monthly&&F.monthly[curKey]){ fc=F.monthly[curKey].fcstRev||0; otb=F.monthly[curKey].otbRev||0; } }catch(e){} maxFc=Math.max(maxFc,fc); rows.push({name:s.name,color:s.color,fc,otb}); });
    return { title:'Forecast by property', sub:'current month · OTB → forecast',
      rows: rows.map(r=>({name:r.name,color:r.color,main:`${fmtEUR(r.otb)} → ${fmtEUR(r.fc)}`,pct:null,barPct:r.fc/maxFc*100})) };
  }
  if (kind === 'rate'){
    const rows=[];
    BIG_STRUCTS.forEach(s=>{ let txt='—', bar=0; try{ const p=_bigCompsetRankOne(s.k,7); if(p&&p.rank){ txt=`${p.rank}° / ${p.total}`; bar=(p.total-p.rank+1)/p.total*100; } }catch(e){} rows.push({name:s.name,color:s.color,main:txt,pct:null,barPct:bar}); });
    return { title:'Compset position by property', sub:'next 7 days (1° = cheapest)', rows };
  }
  if (kind === 'revenue'){
    const rows=[]; let maxV=1;
    BIG_STRUCTS.forEach(s=>{ let v=0; try{ const A=aggOTBYearly(s.k); if(A&&A.tot)v=A.tot.revC||0; }catch(e){} maxV=Math.max(maxV,v); rows.push({name:s.name,color:s.color,v}); });
    const total = rows.reduce((a,r)=>a+r.v,0)||1;
    return { title:'Revenue 2026 by property', sub:`OTB · ${fmtEUR(total)} total`,
      rows: rows.map(r=>({name:r.name,color:r.color,main:fmtEUR(r.v),pct:r.v/total*100,barPct:r.v/maxV*100})) };
  }
  if (kind === 'occ'){
    const rows=[];
    BIG_STRUCTS.forEach(s=>{ let v=null; try{ const A=aggOTBYearly(s.k); if(A&&A.tot)v=A.tot.occC; }catch(e){} rows.push({name:s.name,color:s.color,v}); });
    return { title:'OCC 2026 by property', sub:'occupancy year-to-date',
      rows: rows.map(r=>({name:r.name,color:r.color,main:r.v!=null?fmtPct(r.v,1):'—',pct:null,barPct:r.v!=null?r.v*100:0})) };
  }
  if (kind === 'source'){
    const rows=[];
    BIG_STRUCTS.forEach(s=>{
      let txt='—', barPct=0;
      try{
        const A=aggOTBYearly(s.k);
        if(A&&A.provCur){
          const arr=Object.keys(A.provCur).map(k=>({name:_bigProvLabel(k),rev:A.provCur[k].rev||0})).filter(x=>x.rev>0).sort((a,b)=>b.rev-a.rev);
          const tot=arr.reduce((a,b)=>a+b.rev,0)||1;
          if(arr.length){ const topS=arr[0]; const pct=topS.rev/tot*100; txt=`${topS.name} ${pct.toFixed(0)}%`; barPct=pct; }
        }
      }catch(e){}
      rows.push({name:s.name,color:s.color,main:txt,pct:null,barPct});
    });
    return { title:'Top source by property', sub:'share of revenue · current year', rows };
  }
  return null;
}
function _bigShowBreakdown(kind, nDays){
  let forceWindow = false;
  if (kind === 'pickup7'){ kind = 'pickup'; nDays = 7; forceWindow = true; }
  const data = _bigBreakdownData(kind, nDays, forceWindow);
  if (!data) return;
  const existing = document.getElementById('big-breakdown-modal');
  if (existing) existing.remove();
  let rowsHtml = '';
  data.rows.forEach(d=>{
    const pctTxt = (d.pct!=null) ? ` <span style="color:#888;font-weight:500;font-size:11px">(${d.pct.toFixed(0)}%)</span>` : '';
    rowsHtml += '<div style="margin:10px 0">'
      + '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">'
      + '<span style="font-weight:700;color:'+d.color+'">'+d.name+'</span>'
      + '<span style="font-family:\'DM Mono\',monospace;font-weight:700;font-size:12px">'+d.main+pctTxt+'</span>'
      + '</div>'
      + '<div style="height:9px;background:#eee;border-radius:5px;overflow:hidden">'
      + '<div style="height:100%;width:'+Math.max(0,Math.min(100,d.barPct||0)).toFixed(1)+'%;background:'+d.color+';border-radius:5px"></div>'
      + '</div></div>';
  });
  let h = '<div class="fp-modal-bg" id="big-breakdown-modal" style="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:60px 20px;overflow-y:auto" onclick="if(event.target===this){this.remove()}">';
  h += '<div style="background:#fff;border-radius:12px;max-width:460px;width:100%;font-family:\'DM Sans\',sans-serif;box-shadow:0 8px 32px rgba(0,0,0,.3);overflow:hidden">';
  h += '<div style="padding:16px 22px;border-bottom:1px solid #e5e5e5;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(180deg,#faf7fc,#fff)">';
  h += '<div><div style="font-weight:800;font-size:15px;color:#5a3a7a">'+data.title+'</div>'
    + '<div style="font-size:11px;color:#888;margin-top:2px">'+data.sub+'</div></div>';
  h += '<div onclick="document.getElementById(\'big-breakdown-modal\').remove()" style="cursor:pointer;font-size:20px;color:#888;line-height:1;padding:2px 6px">×</div>';
  h += '</div>';
  h += '<div style="padding:18px 22px">'+rowsHtml+'</div>';
  h += '</div></div>';
  const wrap = document.createElement('div');
  wrap.innerHTML = h;
  document.body.appendChild(wrap.firstChild);
}
function _bigPickupByDay(sel, nDays){
  const ks = new Set(structKeysFor(sel));
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const days = [];
  for (let i=nDays-1; i>=0; i--){
    const d = new Date(today); d.setDate(d.getDate()-i);
    days.push({ ymdNum:+ymd(d), rn:0, rev:0, label:`${pad2(d.getDate())}/${pad2(d.getMonth()+1)}` });
  }
  const idx={}; days.forEach(x=>idx[x.ymdNum]=x);
  for (const b of BOOKINGS){
    if (b.cancelled) continue;
    if (!ks.has(b.struct)) continue;
    const slot = idx[b.bookYmd];
    if (slot){ slot.rn += (b.notti||0); slot.rev += (b.revTotal||0); }
  }
  return days;
}
function _bigPickupVsLY(sel, nDays){
  const ks = new Set(structKeysFor(sel));
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const hi=+ymd(today), lo=+ymd(new Date(today.getTime()-(nDays-1)*864e5));
  const hiLY=+ymd(new Date(today.getTime()-364*864e5)), loLY=+ymd(new Date(today.getTime()-(364+nDays-1)*864e5));
  let cur=0, ly=0;
  for (const b of BOOKINGS){
    if (b.cancelled || !ks.has(b.struct)) continue;
    if (b.bookYmd>=lo && b.bookYmd<=hi) cur += b.notti||0;
    if (b.bookYmd>=loLY && b.bookYmd<=hiLY) ly += b.notti||0;
  }
  return { cur, ly, deltaPct: ly>0 ? (cur-ly)/ly*100 : null };
}
function _bigCompsetRankOne(sk, horizonDays){
  if (typeof EXPEDIA_DATA === 'undefined' || !EXPEDIA_DATA) return null;
  const myMap = EXPEDIA_DATA[sk];
  let compMap = EXPEDIA_DATA['competitors_'+sk] || (sk==='condotta'?EXPEDIA_DATA.competitors:null);
  if (!myMap || !compMap) return null;
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  let rankSum=0, rankCnt=0, gapSum=0, gapCnt=0, totalComp=0;
  for (let off=0; off<horizonDays; off++){
    const d = new Date(today); d.setDate(d.getDate()+off);
    const iso = d.toISOString().slice(0,10);
    const mine = myMap[iso];
    if (mine == null) continue;
    const prices=[];
    for (const cn of Object.keys(compMap)){ const v=compMap[cn]?compMap[cn][iso]:null; if(v!=null)prices.push(v); }
    if (!prices.length) continue;
    totalComp = Math.max(totalComp, prices.length+1);
    rankSum += prices.filter(p=>p<mine).length + 1; rankCnt++;
    const avg = prices.reduce((a,b)=>a+b,0)/prices.length;
    if (avg>0){ gapSum += (mine-avg)/avg*100; gapCnt++; }
  }
  if (!rankCnt) return null;
  return { rank: Math.round(rankSum/rankCnt), total: totalComp, gapPct: gapCnt? gapSum/gapCnt : null };
}
function _bigCompsetRank(sel, horizonDays){
  if (sel !== 'both') return _bigCompsetRankOne(sel, horizonDays);
  const keys = ['firenze','condotta','alfani','davids'];
  let rankSum=0, totSum=0, gapSum=0, n=0, gn=0;
  for (const k of keys){
    const r = _bigCompsetRankOne(k, horizonDays);
    if (!r) continue;
    rankSum += r.rank; totSum += r.total; n++;
    if (r.gapPct!=null){ gapSum += r.gapPct; gn++; }
  }
  if (!n) return null;
  return { rank: Math.round(rankSum/n), total: Math.round(totSum/n), gapPct: gn? gapSum/gn : null, isAvg:true };
}
function _bigForecast14d(sel){
  const ks = new Set(structKeysFor(sel));
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const lo=+ymd(new Date(today.getTime()-13*864e5)), hi=+ymd(today);
  let rev=0;
  for (const b of BOOKINGS){
    if (b.cancelled || !ks.has(b.struct)) continue;
    if (b.bookYmd>=lo && b.bookYmd<=hi) rev += b.revTotal||0;
  }
  return rev;
}
function _bigCancelByDay(sel, nDays){
  const ks = new Set(structKeysFor(sel));
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const lo=+ymd(new Date(today.getTime()-(nDays-1)*864e5)), hi=+ymd(today);
  const byDay={}; let totRn=0;
  for (const b of BOOKINGS){
    if (!b.cancelled || !b.cancelYmd || !ks.has(b.struct)) continue;
    if (b.cancelYmd>=lo && b.cancelYmd<=hi){ byDay[b.cancelYmd]=(byDay[b.cancelYmd]||0)+(b.notti||0); totRn+=(b.notti||0); }
  }
  const arr = Object.keys(byDay).map(d=>({ymd:+d, rn:byDay[d]})).sort((a,b)=>b.rn-a.rn);
  return { arr, totRn };
}
function _bigForecastPickup7Mo(sel){
  const ks = new Set(structKeysFor(sel));
  const today = new Date(TODAY); today.setHours(0,0,0,0);
  const lo=+ymd(new Date(today.getTime()-6*864e5)), hi=+ymd(today);
  const moY = today.getFullYear(), moM = today.getMonth();           // mese corrente
  const moStart = new Date(moY, moM, 1), moEnd = new Date(moY, moM+1, 1);
  let rn = 0;
  for (const b of BOOKINGS){
    if (b.cancelled || !ks.has(b.struct)) continue;
    if (!(b.bookYmd>=lo && b.bookYmd<=hi)) continue;                  // prenotata negli ultimi 7gg
    if (!b.dIn || !b.dOut) continue;
    let d = new Date(b.dIn.getFullYear(), b.dIn.getMonth(), b.dIn.getDate());
    const out = new Date(b.dOut.getFullYear(), b.dOut.getMonth(), b.dOut.getDate());
    while (d < out){
      if (d >= moStart && d < moEnd) rn++;
      d = new Date(d.getTime()+864e5);
    }
  }
  return rn/7;
}
function _bigTop3(items, unit){
  const out = [];
  for (let i=0;i<3;i++){
    if (items[i]) out.push(items[i]);
    else out.push({k:`${i+1}.`, v:`0${unit?(' '+unit):''}`});
  }
  return out;
}
function _bigCard(o){
  const th = BIG_CARD_THEMES[o.theme] || {accent:'#888', bg:'#fff', ink:'#333', icon:''};
  const links = (o.tabs||[]).map(t=>`<span class="big-card-link" data-bigtab="${t.tab}" style="color:${th.accent}">${t.label} →</span>`).join('<span style="color:var(--ink-3);margin:0 4px">·</span>');
  let body;
  if (o.empty){
    body = `<div style="color:var(--ink-3);font-size:13px;padding:14px 0;text-align:center">no movement</div>`;
  } else {
    body = (o.lines||[]).map((l,i)=>{
      const big = (i===0 && o.big);
      const vStyle = big ? `font-size:24px;font-weight:800;color:${th.ink};line-height:1.1` : `font-size:14px;font-weight:700;color:${th.ink}`;
      const sub = l.sub ? `<span style="color:var(--ink-3);font-size:11px;font-weight:500;margin-left:5px">${l.sub}</span>` : '';
      return `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:${big?'2px 0 6px':'4px 0'};${(i>0||!o.big)?'border-top:1px solid rgba(0,0,0,.06)':''}">
        <span style="font-size:12px;color:var(--ink-2)">${l.k}</span>
        <span style="font-family:'DM Mono',monospace;${vStyle};text-align:right">${l.v}${sub}</span>
      </div>`;
    }).join('');
  }
  return `<div class="big-card" style="background:${th.bg};border:1px solid ${th.accent}33;border-left:4px solid ${th.accent}">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span style="font-size:18px">${th.icon}</span>
      <div style="font-weight:800;font-size:14px;color:${th.ink};letter-spacing:.01em">${o.title}</div>
      ${o.byProp?`<span class="big-byprop" data-bigbreakdown="${o.byProp}" style="margin-left:auto;font-size:10px;font-weight:700;color:${th.accent};background:${th.accent}1a;border:1px solid ${th.accent}55;border-radius:10px;padding:2px 8px;cursor:pointer">by property</span>`:''}
    </div>
    <div>${body}</div>
    <div style="margin-top:10px;font-size:11px;font-weight:700">${links}</div>
  </div>`;
}
function renderBigPicture(){
  const host = document.getElementById('big-tree');
  if (!host) return;
  const sel = (typeof CURRENT_STRUCT !== 'undefined') ? CURRENT_STRUCT : 'firenze';
  const n = (BIG_PICKUP_DAYS===7) ? 7 : 1;
  const winLbl = (n===7?'7d':'1d');
  const agg = _bigPickupAgg(sel, n);
  const isBoth = (sel === 'both');
  let revOtb=null, occYear=null, revP=null, occP=null;
  try { const A = aggOTBYearly(sel); if (A && A.tot){ revOtb=A.tot.revC; occYear=A.tot.occC; revP=A.tot.revP; occP=A.tot.occP; } } catch(e){}
  const rank = _bigCompsetRank(sel, 7);
  const pkVs = _bigPickupVsLY(sel, n);
  const _stly = (cur, prev, fmt)=>{
    if (prev==null || !isFinite(prev)) return '';
    const pct = (prev!==0) ? (cur-prev)/prev*100 : null;
    const arrow = (pct==null) ? '' : (pct>=0 ? '▲' : '▼');
    const col = (pct==null) ? 'var(--ink-3)' : (pct>=0 ? '#3d7a4b' : '#b0464b');
    const pctTxt = (pct==null) ? '' : ` ${arrow}${Math.abs(pct).toFixed(0)}%`;
    return `STLY ${fmt(prev)}<span style="color:${col}">${pctTxt}</span>`;
  };
  const heroItems = [
    {label:`Pickup (${winLbl})`, val:`+${agg.totRn} RN`, sub: _stly(pkVs.cur, pkVs.ly, (x)=>`${x} RN`), byProp: isBoth?'pickup':null},
    revOtb!=null ? {label:'Revenue 2026 (OTB)', val: fmtEUR(revOtb), sub:_stly(revOtb, revP, fmtEUR), byProp: isBoth?'revenue':null} : null,
    occYear!=null ? {label:'OCC 2026', val: fmtPct(occYear,1), sub:_stly(occYear, occP, (x)=>fmtPct(x,1)), byProp: isBoth?'occ':null} : null,
    rank ? {label:'Compset rank (7d)', val:`${rank.rank}° / ${rank.total}`, byProp: isBoth?'rate':null} : null
  ].filter(Boolean);
  const heroEl = document.getElementById('big-hero');
  if (heroEl) heroEl.innerHTML = heroItems.map((h,i)=>`<div class="big-hero-item">
      <div class="big-hero-icon">${BIG_HERO_ICONS[i]||''}</div>
      <div class="big-hero-txt" style="flex:1"><div class="big-hero-label">${h.label}${h.byProp?` <span class="big-byprop" data-bigbreakdown="${h.byProp}" style="font-size:9px;font-weight:700;color:var(--accent);background:rgba(0,0,0,.04);border:1px solid var(--line);border-radius:8px;padding:1px 6px;cursor:pointer;margin-left:4px;text-transform:none;letter-spacing:0">by property</span>`:''}</div>
      <div class="big-hero-val">${h.val}</div>${h.sub?`<div class="big-hero-sub">${h.sub}</div>`:''}</div>
    </div>`).join('');
  try { _bigRenderChart(sel); } catch(e){ const c=document.getElementById('big-chart'); if(c)c.innerHTML=''; }
  try { _bigRenderPie(sel); } catch(e){ const c=document.getElementById('big-pie'); if(c)c.innerHTML=''; }
  const allDays = _bigPickupByDay(sel, 7);
  let selDay = BIG_SELECTED_DAY;
  const isAll = (selDay === 'all');
  if (!isAll && (selDay==null || !allDays.some(d=>d.ymdNum===selDay))){
    selDay = allDays.length ? allDays[allDays.length-1].ymdNum : +ymd(new Date(TODAY));
  }
  const tree = _bigPickupTreeForDay(sel, isAll ? 'all' : selDay);
  const selLbl = isAll ? 'the last 7 days' : (()=>{ const s=String(selDay); return `${s.slice(6,8)}/${s.slice(4,6)}/${s.slice(0,4)}`; })();
  const maxRn = (arr)=> Math.max(1, ...(arr||[]).map(x=>x.rn));
  const barRow = (label, rn, max, color, big)=>{
    const pct = Math.round(rn/max*100);
    const fs = big?'13px':'12px';
    return `<div class="big-tree-row" style="flex-direction:column;align-items:stretch;gap:3px">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <span class="k" style="font-size:${fs}">${label}</span>
        <span class="v" style="font-size:${fs};color:${color}">${rn} RN</span>
      </div>
      <div style="height:6px;background:var(--surface-2);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${color};border-radius:4px"></div>
      </div>
    </div>`;
  };
  const stayTop = (tree.stayDays||[]).slice(0,3);
  const stayMax = maxRn(stayTop);
  const mainRows = stayTop.length
    ? stayTop.map((d,i)=>barRow(`${i+1}. ${d.label}`, d.rn, stayMax, 'var(--accent)', true)).join('')
    : '<div class="big-tree-row"><span class="k">no stays booked that day</span></div>';
  const branchHtml = (arr, color)=>{
    const top=(arr||[]).slice(0,3); const mx=maxRn(top);
    return top.length ? top.map((x,i)=>barRow(`${i+1}. ${x.label}`, x.rn, mx, color, false)).join('')
                      : '<div class="big-tree-row"><span class="k" style="font-size:12px;color:var(--ink-3)">—</span></div>';
  };
  const byPropBadge = isBoth ? ` <span class="big-byprop" data-bigbreakdown="pickup" style="font-size:9px;font-weight:700;color:#fff;background:var(--accent);border-radius:8px;padding:1px 7px;cursor:pointer;margin-left:6px">by property</span>` : '';
  const treeHtml = `
    <div class="big-tree">
      <div class="big-tree-main">
        <div class="big-tree-main-head">🏨 Top stay dates booked on <span style="color:var(--accent)">${selLbl}</span> — ${tree.totRn} RN total${(!isAll && BIG_SELECTED_DAY==null)?' <span style="font-weight:400;color:var(--ink-3);font-size:11px">(latest day — click a bar above, or “all 7 days”)</span>':''}${byPropBadge}</div>
        <div class="big-tree-main-rows">${mainRows}</div>
      </div>
      <div class="big-tree-branches">
        <div class="big-tree-branch" style="border-top:3px solid #3b6b9a">
          <div class="big-tree-branch-head"><span style="color:#3b6b9a">🗓️</span> Stay month</div>
          <div class="big-tree-branch-rows">${branchHtml(tree.months,'#3b6b9a')}</div>
        </div>
        <div class="big-tree-branch" style="border-top:3px solid #1f8a8a">
          <div class="big-tree-branch-head"><span style="color:#1f8a8a">🛏️</span> Room sold</div>
          <div class="big-tree-branch-rows">${branchHtml(tree.rooms,'#1f8a8a')}</div>
        </div>
        <div class="big-tree-branch" style="border-top:3px solid #c4823b">
          <div class="big-tree-branch-head"><span style="color:#c4823b">🔗</span> Channel sold</div>
          <div class="big-tree-branch-rows">${branchHtml(tree.channels,'#c4823b')}</div>
        </div>
      </div>
    </div>`;
  const treeEl = document.getElementById('big-tree');
  if (treeEl) treeEl.innerHTML = treeHtml;
  document.querySelectorAll('#panel-big [data-bigbreakdown]').forEach(el=>{
    el.addEventListener('click', (ev)=>{ ev.stopPropagation(); _bigShowBreakdown(el.dataset.bigbreakdown, n); });
  });
  _bigRenderWindowPills();
}
function _bigRenderChart(sel){
  const host = document.getElementById('big-chart');
  if (!host) return;
  const titleEl = document.getElementById('big-chart-title');
  if (titleEl){
    const base = 'Pickup — room nights booked per day (last 7 days)';
    const allActive = (BIG_SELECTED_DAY==='all');
    const allBtn = `<span data-bigallpick="1" style="font-size:10px;font-weight:700;border-radius:8px;padding:1px 8px;cursor:pointer;margin-left:8px;${allActive?'background:var(--accent);color:#fff':'background:rgba(0,0,0,.05);color:var(--ink-2);border:1px solid var(--line)'}">${allActive?'✓ all 7 days':'all 7 days'}</span>`;
    const propBadge = (sel==='both') ? ` <span class="big-byprop" data-bigbreakdown="pickup" style="font-size:10px;font-weight:700;color:var(--accent);background:rgba(0,0,0,.04);border:1px solid var(--line);border-radius:8px;padding:1px 7px;cursor:pointer;margin-left:6px">by property</span>` : '';
    titleEl.innerHTML = base + allBtn + propBadge;
  }
  const days = _bigPickupByDay(sel, 7);
  const maxRn = Math.max(1, ...days.map(d=>d.rn));
  const W=560, H=200, padL=30, padR=20, padTop=24, padBot=34;
  const plotW=W-padL-padR, plotH=H-padTop-padBot;
  const slot=plotW/days.length, bw=Math.min(46, slot*0.6);
  let bars='', grid='';
  let defs = `<defs>
    <linearGradient id="bigBarSel" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#d99a4e"/><stop offset="100%" stop-color="#c4823b"/></linearGradient>
    <linearGradient id="bigBarNorm" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e7d7b8"/><stop offset="100%" stop-color="#c9b89a"/></linearGradient>
    <linearGradient id="bigBarToday" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#bdd0e3"/><stop offset="100%" stop-color="#a9c0d8"/></linearGradient>
  </defs>`;
  for (let g=0; g<=2; g++){
    const val=Math.round(maxRn*(g/2)); const y=padTop+plotH-(plotH*(g/2));
    grid += `<line x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" stroke="var(--line)" stroke-width="1"/>`;
    grid += `<text x="${padL-6}" y="${y+3}" font-size="10" text-anchor="end" fill="var(--ink-3)" font-family="'DM Mono',monospace">${val}</text>`;
  }
  days.forEach((d,i)=>{
    const h = d.rn>0 ? (d.rn/maxRn)*plotH : 0;
    const x = padL + i*slot + (slot-bw)/2;
    const y = padTop + plotH - h;
    const isToday = i===days.length-1;
    const isSel = (BIG_SELECTED_DAY==='all') ? false : ((BIG_SELECTED_DAY!=null) ? (d.ymdNum===BIG_SELECTED_DAY) : isToday);
    const fill = isSel ? 'url(#bigBarSel)' : (isToday ? 'url(#bigBarToday)' : 'url(#bigBarNorm)');
    bars += `<rect class="big-bar-clickable${isSel?' big-bar-selected':''}" data-bigday="${d.ymdNum}" x="${x}" y="${y}" width="${bw}" height="${Math.max(h,2)}" rx="3" fill="${fill}" style="cursor:pointer"><title>${d.label}: ${d.rn} RN — click for detail</title></rect>`;
    bars += `<rect class="big-bar-clickable" data-bigday="${d.ymdNum}" x="${x-slot*0.2}" y="${padTop}" width="${bw+slot*0.4}" height="${plotH}" fill="transparent" style="cursor:pointer"></rect>`;
    if (d.rn>0) bars += `<text x="${x+bw/2}" y="${y-5}" font-size="11" text-anchor="middle" fill="var(--ink-2)" font-weight="600" font-family="'DM Mono',monospace">${d.rn}</text>`;
    bars += `<text x="${x+bw/2}" y="${H-12}" font-size="10" text-anchor="middle" fill="${isSel?'var(--accent)':'var(--ink-3)'}" font-weight="${isSel?'700':'400'}" font-family="'DM Mono',monospace">${d.label}</text>`;
  });
  host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:680px;height:auto;display:block;margin:0 auto">${defs}${grid}${bars}</svg>`;
  host.querySelectorAll('[data-bigday]').forEach(r=>{
    r.addEventListener('click', ()=>{ BIG_SELECTED_DAY = +r.dataset.bigday; renderBigPicture(); });
  });
  const allBtnEl = document.querySelector('#big-chart-title [data-bigallpick]');
  if (allBtnEl) allBtnEl.addEventListener('click', (ev)=>{ ev.stopPropagation(); BIG_SELECTED_DAY = (BIG_SELECTED_DAY==='all') ? null : 'all'; renderBigPicture(); });
}
function _bigRenderPie(sel){
  const host = document.getElementById('big-pie');
  const titleEl = document.getElementById('big-pie-title');
  if (!host) return;
  if (titleEl){
    const base = 'Channel share — by revenue (year) · inner = STLY';
    titleEl.innerHTML = (sel==='both')
      ? `${base} · <span style="font-size:10px;font-weight:700;color:var(--ink-3);background:rgba(0,0,0,.04);border:1px solid var(--line);border-radius:8px;padding:1px 7px;margin-left:6px">per property</span>`
      : base;
  }
  const palette = ['#3b6b9a','#3d7a4b','#c4823b','#8e5fa8','#b0464b','#1f8a8a','#c9a227','#7a7a7a'];
  const toArr = (obj)=> Object.keys(obj||{}).map(k=>({name:(k && k.trim()) ? k : "Direct", rev:(obj[k]&&obj[k].rev)||0})).filter(x=>x.rev>0).sort((a,b)=>b.rev-a.rev);
  const sum = (a)=>a.reduce((s,x)=>s+x.rev,0)||1;

  // helper: build one donut (outer = current year, inner = STLY) with its legend
  function buildOneDonut(structKey, structLabel, structColor){
    let A=null; try{ A=aggOTBYearly(structKey); }catch(e){}
    if (!A || !A.canCur) return `<div style="text-align:center;color:var(--ink-3);font-size:11px;padding:10px"><div style="font-weight:700;color:${structColor};margin-bottom:4px">${structLabel}</div><div style="margin-top:6px;font-style:italic">No bookings in dataset<br>for this property</div></div>`;
    const cur = toArr(A.canCur), prev = toArr(A.canPrev);
    if (!cur.length) return `<div style="text-align:center;color:var(--ink-3);font-size:11px;padding:10px"><div style="font-weight:700;color:${structColor};margin-bottom:4px">${structLabel}</div><div style="margin-top:6px;font-style:italic">No bookings in dataset<br>for this property</div></div>`;
    const colorOf={}; cur.forEach((x,i)=>colorOf[x.name]=palette[i%palette.length]);
    prev.forEach((x)=>{ if(!colorOf[x.name]) colorOf[x.name]=palette[Object.keys(colorOf).length%palette.length]; });
    const totCur=sum(cur), totPrev=sum(prev);
    const cx=80, cy=80, rOut=68, rOutIn=44, rInOut=38, rInIn=20;
    function arcs(arr, tot, ri, ro){
      let ang=-Math.PI/2, out='';
      arr.forEach(x=>{
        const frac=x.rev/tot, a2=ang+frac*2*Math.PI;
        const x1=cx+ro*Math.cos(ang), y1=cy+ro*Math.sin(ang), x2=cx+ro*Math.cos(a2), y2=cy+ro*Math.sin(a2);
        const x3=cx+ri*Math.cos(a2), y3=cy+ri*Math.sin(a2), x4=cx+ri*Math.cos(ang), y4=cy+ri*Math.sin(ang);
        const large=frac>0.5?1:0;
        out+=`<path d="M${x1} ${y1} A${ro} ${ro} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${ri} ${ri} 0 ${large} 0 ${x4} ${y4} Z" fill="${colorOf[x.name]}" stroke="var(--surface)" stroke-width="1.5"><title>${x.name}: ${fmtEUR(x.rev)} (${(frac*100).toFixed(0)}%)</title></path>`;
        ang=a2;
      });
      return out;
    }
    const outerArcs = arcs(cur, totCur, rOutIn, rOut);
    const innerArcs = (prev.length ? arcs(prev, totPrev, rInIn, rInOut) : '');
    const prevShare={}; prev.forEach(x=>prevShare[x.name]=x.rev/totPrev*100);
    const legend = cur.slice(0,5).map(x=>{
      const cs=x.rev/totCur*100, ps=prevShare[x.name];
      const delta = (ps!=null) ? (cs-ps) : null;
      const dTxt = (delta==null)?'':` <span style="color:${delta>=0?'#3d7a4b':'#b0464b'}">${delta>=0?'▲':'▼'}${Math.abs(delta).toFixed(0)}</span>`;
      return `<div style="display:flex;align-items:center;gap:5px;font-size:10px;margin-bottom:2px"><span style="width:8px;height:8px;border-radius:2px;background:${colorOf[x.name]};flex-shrink:0"></span><span style="flex:1;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${x.name}</span><span style="font-family:'DM Mono',monospace;font-weight:600">${cs.toFixed(0)}%${dTxt}</span></div>`;
    }).join('');
    return `<div style="text-align:center">
      <div style="font-weight:700;font-size:12px;color:${structColor};margin-bottom:4px">${structLabel}</div>
      <svg viewBox="0 0 160 160" style="width:130px;height:130px;display:block;margin:0 auto">${outerArcs}${innerArcs}</svg>
      <div style="min-width:140px;margin-top:6px;text-align:left">${legend}</div>
    </div>`;
  }

  if (sel === 'both'){
    // 4 mini-donuts, one per property
    const structs = [
      {k:'firenze',  label:'Firenze Suite',  color:'#3b6b9a'},
      {k:'condotta', label:'Condotta 16',    color:'#3d7a4b'},
      {k:'alfani',   label:'Palazzo Alfani', color:'#8e5fa8'},
      {k:'davids',   label:'Enis Guesthouse',color:'#c0392b'}
    ];
    const cards = structs.map(s => buildOneDonut(s.k, s.label, s.color)).join('');
    host.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;padding:6px 4px">${cards}</div>
      <div style="text-align:center;font-size:10px;color:var(--ink-3);margin-top:6px">outer = current year · inner = STLY</div>`;
    return;
  }

  // single-property view: full-size donut + legend (unchanged)
  let A=null; try{ A=aggOTBYearly(sel); }catch(e){}
  if (!A || !A.canCur){ host.innerHTML='<div style="color:var(--ink-3);font-size:12px;padding:20px;text-align:center;font-style:italic">No bookings in dataset for this property</div>'; return; }
  const cur = toArr(A.canCur), prev = toArr(A.canPrev);
  const colorOf={}; cur.forEach((x,i)=>colorOf[x.name]=palette[i%palette.length]);
  prev.forEach((x)=>{ if(!colorOf[x.name]) colorOf[x.name]=palette[Object.keys(colorOf).length%palette.length]; });
  const totCur=sum(cur), totPrev=sum(prev);
  const cx=110, cy=110, rOut=95, rOutIn=62, rInOut=55, rInIn=30;
  function arcs(arr, tot, ri, ro){
    let ang=-Math.PI/2, out='';
    arr.forEach(x=>{
      const frac=x.rev/tot, a2=ang+frac*2*Math.PI;
      const x1=cx+ro*Math.cos(ang), y1=cy+ro*Math.sin(ang), x2=cx+ro*Math.cos(a2), y2=cy+ro*Math.sin(a2);
      const x3=cx+ri*Math.cos(a2), y3=cy+ri*Math.sin(a2), x4=cx+ri*Math.cos(ang), y4=cy+ri*Math.sin(ang);
      const large=frac>0.5?1:0;
      out+=`<path d="M${x1} ${y1} A${ro} ${ro} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${ri} ${ri} 0 ${large} 0 ${x4} ${y4} Z" fill="${colorOf[x.name]}" stroke="var(--surface)" stroke-width="1.5"><title>${x.name}: ${fmtEUR(x.rev)} (${(frac*100).toFixed(0)}%)</title></path>`;
      ang=a2;
    });
    return out;
  }
  const outerArcs = arcs(cur, totCur, rOutIn, rOut);
  const innerArcs = arcs(prev, totPrev, rInIn, rInOut);
  const prevShare={}; prev.forEach(x=>prevShare[x.name]=x.rev/totPrev*100);
  const legend = cur.slice(0,6).map(x=>{
    const cs=x.rev/totCur*100, ps=prevShare[x.name]; 
    const delta = (ps!=null) ? (cs-ps) : null;
    const dTxt = (delta==null)?'':` <span style="color:${delta>=0?'#3d7a4b':'#b0464b'}">${delta>=0?'▲':'▼'}${Math.abs(delta).toFixed(0)}</span>`;
    return `<div style="display:flex;align-items:center;gap:6px;font-size:11px;margin-bottom:3px"><span style="width:10px;height:10px;border-radius:2px;background:${colorOf[x.name]};flex-shrink:0"></span><span style="flex:1;color:var(--ink-2)">${x.name}</span><span style="font-family:'DM Mono',monospace;font-weight:600">${cs.toFixed(0)}%${dTxt}</span></div>`;
  }).join('');
  host.innerHTML = `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center">
    <svg viewBox="0 0 220 220" style="width:160px;height:160px;flex-shrink:0">${outerArcs}${innerArcs}
      <text x="110" y="107" text-anchor="middle" font-size="9" fill="var(--ink-3)">outer: now</text>
      <text x="110" y="119" text-anchor="middle" font-size="9" fill="var(--ink-3)">inner: STLY</text>
    </svg>
    <div style="min-width:150px;flex:1">${legend}</div>
  </div>`;
}
function _bigRenderWindowPills(){ /* toggle 1/7 rimosso: default 1 giorno, selezione dal grafico */ }
function setTab(name){
  CURRENT_TAB = name;
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===name));
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active', p.id==='panel-'+name));
  if (name === 'big' && typeof renderBigPicture === 'function'){
    try { renderBigPicture(); } catch(e){ console.error('renderBigPicture', e); }
  }
  if (name === 'fcst' && _FCST_DIRTY && typeof renderForecast === 'function'){
    try { renderForecast(CURRENT_STRUCT); _FCST_DIRTY = false; } catch(e){ console.error('renderForecast', e); }
  }
  if (name === 'baseprice' && typeof renderBasePriceBreakdown === 'function'){
    try { renderBasePriceBreakdown(); } catch(e){ console.error('renderBasePriceBreakdown', e); }
  }
  if (typeof updateNotesBadge === 'function') updateNotesBadge();
}

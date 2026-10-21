/* ===========================================================================
   CONFIG SYNC — la configurazione per-struttura deve sopravvivere al cloud.
   Il caso che ha fatto nascere questi test: si cambiava il Floor rate di Alfani
   da 160 a 150, si premeva Recompute, si cambiava struttura e tornando il campo
   mostrava di nuovo 160. Il salvataggio locale era giusto; a rimettere il valore
   vecchio era _applyToLocal, che riscriveva l'intero oggetto arrivato dal cloud
   (il documento del server, rimbalzato indietro da Firestore dopo un push
   fallito). Ora ogni campo ha un timbro e vince il più recente.
   =========================================================================== */
const T = require('./t_lib');
const { w, X, D, ok, info, fine } = T.boot(['fp_getFloor','fp_setFloor','fp_getBasePrice','setStructure',
                                            'renderRMESConfigTab','RMES_CLOUD','ENGINE_BUILD','rmesCloudOnRemoteUpdate','renderSellStrategy','_remoteRedrawCount']);
/* RMES_CLOUD è un const dello scope dell'eval: non è una proprietà di window,
   si prende dai getter di t_lib. Le function dichiarate invece stanno su window. */
const C = X.RMES_CLOUD;
const LS = w.localStorage;
const TS = 'rmes_cfg_ts_v1';
const FLOOR = 'rmes_floor_v1';

/* ---------- 1. le funzioni di merge, da sole ---------- */
const m = (loc, rem, tsL, tsR) => JSON.parse(C._mergeConfigRaw(JSON.stringify(loc), JSON.stringify(rem), tsL, tsR).out);
const wins = (loc, rem, tsL, tsR) => C._mergeConfigRaw(JSON.stringify(loc), JSON.stringify(rem), tsL, tsR).localWins;

ok(m({alfani:150}, {alfani:160}, {alfani:2000}, {alfani:1000}).alfani === 150,
   'timbro locale più recente → vince il valore locale');
ok(m({alfani:150}, {alfani:160}, {alfani:1000}, {alfani:2000}).alfani === 160,
   'timbro remoto più recente → vince il cloud');
ok(m({alfani:150}, {alfani:160}, {}, {}).alfani === 160,
   'nessuno dei due timbrato → vince il cloud (come prima della modifica)');
ok(m({alfani:150}, {alfani:160}, {alfani:1000}, {alfani:1000}).alfani === 160,
   'stesso timbro → vince il cloud (nessun ping-pong)');
ok(m({alfani:150, firenze:150}, {alfani:160}, {alfani:2000}, {}).firenze === 150,
   'un campo che il cloud non ha non viene perso');
ok(wins({alfani:150}, {alfani:160}, {alfani:2000}, {alfani:1000}) === true,
   'se vince il locale, localWins segnala che va rispinto sul cloud');
ok(wins({alfani:160}, {alfani:160}, {}, {}) === false,
   'se è tutto allineato, niente push di ritorno');

const del = m({}, {alfani:160}, {alfani:2000}, {alfani:1000});
ok(!Object.prototype.hasOwnProperty.call(del, 'alfani'),
   'una cancellazione locale timbrata non viene resuscitata dal cloud');
ok(m({}, {alfani:160}, {}, {}).alfani === 160,
   'una chiave assente in locale e NON timbrata torna dal cloud (nessuna perdita)');

/* struttura nuova sui due lati, campi diversi: nessuno dei due sparisce */
const u = m({alfani:150}, {firenze:200}, {alfani:2000}, {firenze:1000});
ok(u.alfani === 150 && u.firenze === 200, 'due campi diversi convivono');

/* timbri: sempre il più recente, mai una sovrascrittura secca */
const mt = JSON.parse(C._mergeTsRaw(
  JSON.stringify({ [FLOOR]: { alfani: 500, firenze: 900 } }),
  JSON.stringify({ [FLOOR]: { alfani: 700, davids: 300 } })));
ok(mt[FLOOR].alfani === 700 && mt[FLOOR].firenze === 900 && mt[FLOOR].davids === 300,
   'i timbri si uniscono prendendo il massimo campo per campo');

/* roba sporca non deve far saltare niente */
ok(JSON.parse(C._mergeConfigRaw('non json', '{"alfani":160}', null, null).out).alfani === 160,
   'un valore locale illeggibile non blocca il merge');
ok(C._mergeConfigRaw('{"a":1}', '[1,2,3]', null, null).out === '{"a":1}',
   'un array al posto di un oggetto viene ignorato');

/* ---------- 2. il timbro si scrive da solo quando si salva ---------- */
LS.removeItem(TS);
w.fp_setFloor('alfani', 150);
let stamp = JSON.parse(LS.getItem(TS) || '{}');
ok(stamp[FLOOR] && stamp[FLOOR].alfani > 0, 'fp_setFloor timbra il campo alfani');
ok(!(stamp[FLOOR] || {}).firenze, 'non timbra le strutture che non ha toccato');

const t1 = stamp[FLOOR].alfani;
w.fp_setFloor('alfani', 150);   // stesso valore
stamp = JSON.parse(LS.getItem(TS) || '{}');
ok(stamp[FLOOR].alfani === t1, 'riscrivere lo STESSO valore non ritimbra');

/* ---------- 3. il giro completo: salvo, il cloud rimanda indietro il vecchio ---------- */
info('');
info('--- scenario reale: push fallito, Firestore rimanda il documento del server ---');
w.setStructure('alfani');
w.renderRMESConfigTab();
const inp = () => (D.getElementById('fp-floor-input') || {}).value;
info('floor di partenza:', inp());

D.getElementById('fp-floor-input').value = '150';
try { D.getElementById('fp-recompute').onclick(); } catch(e){ info('click err', e.message); }
ok(w.fp_getFloor('alfani') === 150, 'dopo Apply il floor è 150', w.fp_getFloor('alfani'));

// Il rollback di Firestore: arriva lo stato del server, che ha ancora 160.
const serverDoc = {};
serverDoc[FLOOR] = JSON.stringify({ alfani: 160, firenze: 150, condotta: 200 });
serverDoc['rmes_base_price_v1'] = JSON.stringify({ alfani: 270 });
C._applyToLocal(serverDoc);
ok(w.fp_getFloor('alfani') === 150, 'IL BUG: dopo il rimbalzo dal cloud il floor resta 150', w.fp_getFloor('alfani'));
ok(w.fp_getFloor('condotta') === 200, 'le strutture non toccate prendono comunque il valore del cloud', w.fp_getFloor('condotta'));
ok(w.fp_getBasePrice('alfani') === 270, 'una chiave di config non toccata in locale segue il cloud', w.fp_getBasePrice('alfani'));

// e cambiando struttura e tornando, il campo mostra ancora 150
w.setStructure('firenze'); w.renderRMESConfigTab();
w.setStructure('alfani');  w.renderRMESConfigTab();
ok(String(inp()) === '150', 'tornando su Alfani il campo mostra 150', inp());

/* ---------- 4. lo stesso per tutte le strutture ---------- */
info('');
info('--- stessa prova su ogni struttura ---');
const FLOORS = { firenze: 140, condotta: 190, alfani: 150, davids: 95, nazionale: 80, portenuove: 75 };
for (const s in FLOORS) w.fp_setFloor(s, FLOORS[s]);
const stale = {};
stale[FLOOR] = JSON.stringify({ firenze: 150, condotta: 200, alfani: 160, davids: 100, nazionale: 85, portenuove: 80 });
C._applyToLocal(stale);
for (const s in FLOORS){
  ok(w.fp_getFloor(s) === FLOORS[s], 'floor ' + s + ' resta ' + FLOORS[s], w.fp_getFloor(s));
}

/* ---------- 4b. quello che il campo Floor racconta deve essere vero ---------- */
info('');
info('--- la riga accanto al campo Floor ---');
w.setStructure('alfani'); w.renderRMESConfigTab();
const hint = D.getElementById('fp-floor-p15');
ok(!!hint && hint.textContent.trim().length > 0, 'accanto al campo Floor c\'è una riga');
const hintTxt = (hint ? hint.textContent : '') + ' ' + (hint ? (hint.querySelector('span')||{}).title || '' : '');
ok(!/takes over/i.test(hintTxt), 'non dice più che il p15 "takes over"');
ok(!/HIGHER of/i.test(D.getElementById('fp-floor-input').parentElement.getAttribute('title') || ''),
   'il tooltip del campo non parla più del massimo fra floor e p15');
// il numero mostrato deve essere quello davvero usato: floor / 0.85 + lift
const annNow = w.fp_getFloor('alfani');
let liftNow = 0;
try { liftNow = w.fpFloorLiftForBaseRT('alfani', new Date(w.TODAY || Date.now()).getMonth()+1) || 0; } catch(e){}
const effExp = Math.round(annNow / 0.85 + liftNow);
ok(hint.textContent.indexOf(String(effExp)) !== -1,
   'mostra il floor effettivo ' + effExp + ' € (floor ' + annNow + ' / 0.85' + (liftNow ? ' + ' + Math.round(liftNow) : '') + ')',
   hint.textContent.trim());

/* e deve coincidere con quello che il motore applica davvero */
(function(){
  if (typeof w.newrmesCalculateBasePriceVerbose !== 'function'){ info('(verbose non disponibile)'); return; }
  const d = new Date(w.TODAY || Date.now()); d.setDate(d.getDate() + 20);
  const iso = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const v = w.newrmesCalculateBasePriceVerbose('alfani', iso);
  if (!v){ info('(nessun verbose per ' + iso + ')'); return; }
  ok(v.floorSource === 'annual', 'il motore usa sempre il floor annuale, mai il p15', v.floorSource);
  ok(Math.abs(v.floorEff - (annNow/0.85 + (v.floorLift||0))) < 1.5,
     'floorEff del motore = floor / 0.85 + lift', v.floorEff + ' vs ' + Math.round(annNow/0.85 + (v.floorLift||0)));
})();

/* ---------- 4c. l'esito del salvataggio si vede ---------- */
const applyMsg = D.getElementById('fp-apply-msg');
ok(!!applyMsg, 'sotto il pulsante c\'è lo spazio per l\'esito del salvataggio');
try { D.getElementById('fp-recompute').onclick(); } catch(e){}
ok(/only|Saving|Saved/i.test((D.getElementById('fp-apply-msg')||{}).textContent || ''),
   'dopo Apply l\'esito viene scritto (qui senza cloud: "saved on this browser only")',
   (D.getElementById('fp-apply-msg')||{}).textContent);

/* ---------- 5. il cloud vince ancora quando è davvero più recente ---------- */
const tsMap = JSON.parse(LS.getItem(TS) || '{}');
const newer = {};
newer[FLOOR] = JSON.stringify({ alfani: 175 });
newer[TS] = JSON.stringify({ [FLOOR]: { alfani: (tsMap[FLOOR].alfani || 0) + 60000 } });
C._applyToLocal(newer);
ok(w.fp_getFloor('alfani') === 175, 'una modifica fatta DOPO da un altro browser arriva e vince', w.fp_getFloor('alfani'));
ok(w.fp_getFloor('firenze') === 140, 'e non tocca le altre strutture', w.fp_getFloor('firenze'));
/* ---------- 6. il ridisegno che arriva dal cloud non deve dare fastidio ---------- */
/* Prima, QUALUNQUE arrivo dal cloud rifaceva subito tutta la Sell Strategy:
   anche se riguardava un'altra struttura, anche col puntatore dentro la
   tabella. Ogni ridisegno e' un fermo di oltre un decimo di secondo piu' il
   riposizionamento dello scroll: ripetuto, la tabella va "a scatti". */
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const FLOORK = 'rmes_floor_v1';
  info('');
  info('--- arrivo dal cloud: quando ridisegna e quando no ---');
  ok(typeof C.getLastChangedKeys === 'function', 'il layer cloud dice quali chiavi ha toccato');

  /* a) un arrivo che tocca solo roba invisibile */
  C._applyToLocal({ 'rmes_audit_log_v1': JSON.stringify([{ts:1,author:'x',struct:'alfani',ymd:1,action:'t'}]) });
  let k = C.getLastChangedKeys();
  const QUIET = ['rmes_audit_log_v1','notes_journal_v2','_data_fingerprint_v1','rmes_cfg_ts_v1'];
  ok(k.indexOf('rmes_audit_log_v1') !== -1, 'il log risulta fra le chiavi cambiate', JSON.stringify(k));
  ok(k.length > 0 && k.every(x => QUIET.indexOf(x) !== -1),
     'e sono tutte chiavi che la tabella non mostra', JSON.stringify(k));

  let n0 = X._remoteRedrawCount;
  w.rmesCloudOnRemoteUpdate();
  await sleep(60);
  ok(X._remoteRedrawCount === n0, 'un arrivo di sola roba invisibile NON ridisegna', X._remoteRedrawCount - n0);

  /* b) un arrivo che cambia un prezzo deve ridisegnare */
  const doc = {};
  doc[FLOORK] = JSON.stringify({ alfani: 181 });
  doc['rmes_cfg_ts_v1'] = JSON.stringify({ [FLOORK]: { alfani: Date.now() + 120000 } });
  C._applyToLocal(doc);
  k = C.getLastChangedKeys();
  ok(k.indexOf(FLOORK) !== -1, 'un floor cambiato da un altro browser risulta fra le chiavi', JSON.stringify(k));
  ok(w.fp_getFloor('alfani') === 181, 'ed e stato applicato', w.fp_getFloor('alfani'));
  n0 = X._remoteRedrawCount;
  w.rmesCloudOnRemoteUpdate();
  await sleep(60);
  ok(X._remoteRedrawCount === n0 + 1, 'un arrivo che cambia un prezzo ridisegna, una volta', X._remoteRedrawCount - n0);

  /* c) tre arrivi ravvicinati = un ridisegno solo */
  n0 = X._remoteRedrawCount;
  w.rmesCloudOnRemoteUpdate();
  w.rmesCloudOnRemoteUpdate();
  w.rmesCloudOnRemoteUpdate();
  await sleep(80);
  ok(X._remoteRedrawCount === n0 + 1, 'tre arrivi ravvicinati producono UN ridisegno', X._remoteRedrawCount - n0);

  /* d) mentre si scrive in un campo, il ridisegno aspetta */
  const inp = D.getElementById('fp-period-price');
  ok(!!inp, 'il campo del prezzo override esiste');
  if (inp){
    try { inp.focus(); } catch(e){}
    if (D.activeElement === inp){
      n0 = X._remoteRedrawCount;
      w.rmesCloudOnRemoteUpdate();
      await sleep(250);
      ok(X._remoteRedrawCount === n0, 'col fuoco nel campo prezzo il ridisegno ASPETTA', X._remoteRedrawCount - n0);
      try { inp.blur(); } catch(e){}
      await sleep(600);
      ok(X._remoteRedrawCount === n0 + 1, 'e appena lasci il campo arriva, una volta sola', X._remoteRedrawCount - n0);
    } else {
      info('(in jsdom il campo non prende il fuoco: attesa non verificabile qui)');
    }
  }

  /* e) IL PUNTO: lo stesso stato applicato due volte deve assestarsi.
     Finche' la rete di sicurezza sui pesi scattava sempre, ogni arrivo dal
     cloud segnava una modifica, ridisegnava e faceva un push; il push
     svegliava l'altro browser, che faceva lo stesso. La tabella veniva rifatta
     circa una volta al secondo: era quello il "si muove a scatti". */
  const stabile = { 'rmes_weights_per_struct_v4': w.localStorage.getItem('rmes_weights_per_struct_v4') };
  C._applyToLocal(stabile);
  C._applyToLocal(stabile);
  const dopo = C.getLastChangedKeys();
  ok(dopo.length === 0, 'riapplicare lo stesso stato non cambia piu nulla', JSON.stringify(dopo));
  n0 = X._remoteRedrawCount;
  C._applyToLocal(stabile);
  w.rmesCloudOnRemoteUpdate();
  await sleep(60);
  ok(X._remoteRedrawCount === n0, 'e quindi non ridisegna: niente rimpallo', X._remoteRedrawCount - n0);
  const pesi = JSON.parse(w.localStorage.getItem('rmes_weights_per_struct_v4') || '{}');
  const somma = ['occ','price','pace','budget','comp','airdna','mkt']
    .reduce((t,f) => t + (+(pesi.firenze || {})[f] || 0), 0);
  ok(Math.abs(somma - 1) < 1e-6, 'e i pesi restano validi (somma 1.000)', somma.toFixed(3));

  /* ---------- 7. la versione del codice e dichiarata ---------- */
  ok(typeof X.ENGINE_BUILD === 'string' && /20\d\d-\d\d-\d\d/.test(X.ENGINE_BUILD),
     'engine.js dichiara la sua versione', X.ENGINE_BUILD);

  fine();
})();

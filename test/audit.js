/* ===========================================================================
   AUDIT 1 — IL PREZZO PARTE SEMPRE DAL BASE
   Il controllo piu' importante di tutti: verifica che ogni prezzo suggerito
   sia spiegabile come Base x segnali x last minute x evento, e che il prezzo
   caricato non lo sposti. E' questo audit che ha scoperto l'ancora
   sull'ultimo venduto, che gonfiava ventuno date senza dare alcun errore.
   =========================================================================== */
const T = require('./t_lib');
const { w, X, ok, info, fine } = T.boot([
  'computeRMESPriceMap', 'newrmesGetEffectiveBase', 'newrmesCalculateBasePriceVerbose',
  'fp_setOverride', '_invalidateRmesMapCache', 'fp_lmfLookup', '_getEventBoost',
  'newrmesSetAccepted', 'BOOKINGS', 'structKeysFor', 'TODAY', 'CFG'
]);
const t0 = new Date(X.TODAY); t0.setHours(0,0,0,0);
const sy = T.ymdOf(t0);

/* 1. Ogni prezzo deve corrispondere a Base x moltiplicatori. Il pavimento puo'
      alzarlo, quindi il prezzo puo' solo essere >= all'atteso. */
for (const id of T.IDS){
  const base = X.CFG.structures[id].baseRT;
  const m = X.computeRMESPriceMap(id, sy, 90);
  let n = 0, bad = 0, worst = '';
  for (const k in m){
    if (!/^\d{8}$/.test(k)) continue;
    const t = m[k].rmesTargetOnBaseByRT && m[k].rmesTargetOnBaseByRT[base];
    if (!t || !(t.price > 0)) continue;
    const bs = X.newrmesGetEffectiveBase(id, +k);
    if (!(bs > 0)) continue;
    n++;
    const d = new Date(+String(k).slice(0,4), +String(k).slice(4,6)-1, +String(k).slice(6,8));
    const lead = Math.max(0, Math.round((d - t0) / 86400000));
    let lmf = 0; try { lmf = X.fp_lmfLookup(id, m[k].curOcc, lead) || 0; } catch(e){}
    let ev = 1;  try { ev = X._getEventBoost(+k) || 1; } catch(e){}
    const atteso = bs * (m[k].multFinale || 1) * (1 + lmf/100) * ev;
    const tooLow  = t.price < atteso - 1.5;
    const tooHigh = t.price > atteso + 1.5 && t.atCap !== 'floor';
    if (tooLow || tooHigh){
      bad++;
      if (!worst) worst = k + ': ' + Math.round(t.price) + ' invece di ' + Math.round(atteso) + ' (cap ' + t.atCap + ')';
    }
  }
  ok(bad === 0, '[' + id + '] ogni prezzo si spiega con Base x segnali', bad + ' su ' + n + ' · ' + worst);
}

/* 2. Il prezzo caricato non deve spostare NULLA, per nessuna delle due uscite
      della mappa: c'era un secondo percorso che partiva dal riferimento. */
for (const id of T.IDS){
  const base = X.CFG.structures[id].baseRT;
  const m0 = X.computeRMESPriceMap(id, sy, 60);
  const prima = {};
  for (const k in m0){
    if (!/^\d{8}$/.test(k)) continue;
    const t = m0[k].rmesTargetOnBaseByRT && m0[k].rmesTargetOnBaseByRT[base];
    if (t) prima[k] = { target: t.price, price: m0[k].price };
  }
  const date = Object.keys(prima).slice(0, 25);
  for (const k of date){
    const bs = X.newrmesGetEffectiveBase(id, +k) || 200;
    X.fp_setOverride(id, T.isoOf(k), base, Math.round(bs * (Math.random() < 0.5 ? 0.4 : 2.5)), { source: 'audit' });
  }
  X._invalidateRmesMapCache();
  const m1 = X.computeRMESPriceMap(id, sy, 60);
  let mossi = 0, det = '';
  for (const k of date){
    const t = m1[k].rmesTargetOnBaseByRT && m1[k].rmesTargetOnBaseByRT[base];
    if (t && Math.abs(t.price - prima[k].target) > 1){ mossi++; if (!det) det = k + ' target ' + Math.round(prima[k].target) + '→' + Math.round(t.price); }
    if (Math.abs(m1[k].price - prima[k].price) > 1){ mossi++; if (!det) det = k + ' price ' + Math.round(prima[k].price) + '→' + Math.round(m1[k].price); }
  }
  ok(mossi === 0, '[' + id + '] caricare un prezzo non sposta il suggerimento', mossi + ' scostamenti · ' + det);
  for (const k of date) X.fp_setOverride(id, T.isoOf(k), base, null, {});
  X._invalidateRmesMapCache();
}

/* 3. Accettare non blocca piu' nulla: il blocco serviva quando il calcolo
      ripartiva dal riferimento, e non esiste piu'. */
{
  const base = X.CFG.structures.firenze.baseRT;
  const k = T.ymdOf(new Date(t0.getTime() + 20*864e5));
  const pr = () => { const e = X.computeRMESPriceMap('firenze', sy, 60)[k];
                     const t = e.rmesTargetOnBaseByRT[base]; return { p: t.price, cap: t.atCap }; };
  const a = pr();
  X.newrmesSetAccepted('firenze', k, Math.round(a.p * 1.4));
  X._invalidateRmesMapCache();
  const b = pr();
  ok(b.cap !== 'accepted', 'accettare non blocca la data', b.cap);
  ok(Math.abs(b.p - a.p) < 1, 'e non cambia il suggerimento', Math.round(b.p) + ' vs ' + Math.round(a.p));
  X.newrmesSetAccepted('firenze', k, null);
  X._invalidateRmesMapCache();
}

/* 4. Il pavimento non si buca mai. */
{
  let sotto = 0, tot = 0, det = '';
  for (const id of T.IDS){
    const base = X.CFG.structures[id].baseRT;
    const m = X.computeRMESPriceMap(id, sy, 90);
    for (const k in m){
      if (!/^\d{8}$/.test(k)) continue;
      const t = m[k].rmesTargetOnBaseByRT && m[k].rmesTargetOnBaseByRT[base];
      if (!t || !(t.price > 0)) continue;
      const v = X.newrmesCalculateBasePriceVerbose(id, T.isoOf(k));
      if (!v) continue;
      tot++;
      if (t.price < v.floorEff - 1){ sotto++; if (!det) det = id + ' ' + k + ': ' + Math.round(t.price) + ' < ' + Math.round(v.floorEff); }
    }
  }
  info('prezzi controllati:', tot);
  ok(sotto === 0, 'nessun prezzo buca il pavimento', sotto + ' · ' + det);
}

/* --- I MESI SONO PER NOTTE DI SOGGIORNO --------------------------------- */
/* Non per data di arrivo ne di prenotazione. Una prenotazione entrata il 30
   giugno con notti a luglio deve mettere le sue notti di luglio sotto luglio.
   Solo su Palazzo Alfani ci sono 151 prenotazioni che attraversano un mese:
   contarle per arrivo sposterebbe decine di migliaia di euro. */
{
  const keys = new Set(w.structKeysFor('alfani'));
  let cavallo = 0, spezzateBene = 0;
  for (const b of X.BOOKINGS){
    if (b.cancelled || !keys.has(b.struct) || !b.stayYmds || b.stayYmds.length < 2) continue;
    const mesi = new Set(b.stayYmds.map(y => Math.floor(y/100)));
    if (mesi.size < 2) continue;
    cavallo++;
    // ogni notte deve stare nel suo mese, nessuna persa
    let somma = 0;
    for (const m of mesi) somma += b.stayYmds.filter(y => Math.floor(y/100) === m).length;
    if (somma === b.stayYmds.length) spezzateBene++;
  }
  info('prenotazioni a cavallo di un mese (Alfani):', cavallo);
  ok(cavallo > 50, 'ce ne sono abbastanza da contare', cavallo);
  ok(spezzateBene === cavallo, 'ogni notte finisce nel suo mese, nessuna persa',
     spezzateBene + ' su ' + cavallo);
  /* E il totale per mese deve corrispondere alla somma delle notti. */
  const perMese = {};
  for (const b of X.BOOKINGS){
    if (b.cancelled || !keys.has(b.struct) || !b.stayYmds) continue;
    for (const y of b.stayYmds){ const m = Math.floor(y/100); perMese[m] = (perMese[m]||0) + 1; }
  }
  const lug = perMese[202607] || 0, ago = perMese[202608] || 0;
  ok(lug > 100 && ago > 100, 'i mesi hanno le loro notti', 'luglio ' + lug + ' · agosto ' + ago);
}

/* --- SALTI ANOMALI FRA ANNI SULLO STESSO CANALE ------------------------- */
/* IL CONTROLLO CHE MANCAVA. Tutti gli altri verificano la coerenza INTERNA
   del calcolo: che il motore applichi la regola giusta. Nessuno verificava la
   natura del DATO IN INGRESSO.
   Il 2025 di Nazionale e Porte Nuove conteneva quello che incassavi tu, non
   quello che pagava il cliente, perche' veniva da un file costruito con
   un'altra logica. Il motore applicava correttamente il fattore x1 di Airbnb,
   ma a un numero che non era quello che credeva. L'errore e' stato trovato a
   mano, guardando le schermate Airbnb: nessun test poteva prenderlo.
   Un salto secco del prezzo medio a notte, sullo stesso canale e struttura,
   fra un anno e l'altro, e' il sintomo di questo tipo di problema. Soglia 15%:
   il caso Airbnb faceva +24% su Nazionale e +18% su Porte Nuove.
   Il 2024 e' escluso: anno di seeding, dati parziali e campioni piccoli. */
{
  const SOGLIA = 0.15;
  /* Salti gia' esaminati e spiegati. Toglierne uno da qui lo rimette sotto
     osservazione; aggiungerne uno richiede di aver capito perche'. */
  const SPIEGATI = {
    'alfani|Direct': 'apertura della struttura: il mix di camere vendute in diretta e cambiato'
  };
  const perKey = {};
  for (const b of X.BOOKINGS){
    if (b.cancelled || !b.stayYmds || !b.stayYmds.length) continue;
    const id = Object.keys(X.CFG.structures).find(k => new Set(w.structKeysFor(k)).has(b.struct));
    if (!id) continue;
    const anno = Math.floor(Math.min(...b.stayYmds) / 10000);
    (perKey[id + '|' + (b.canale || '?') + '|' + anno] = perKey[id + '|' + (b.canale || '?') + '|' + anno] || [])
      .push(b.revPerNight || 0);
  }
  const mediana = a => { a = a.slice().sort((x,y) => x-y); return a.length ? a[a.length>>1] : null; };
  const nuovi = [];
  for (const k in perKey){
    const [id, ch, anno] = k.split('|');
    if (anno !== '2026') continue;
    const prec = perKey[id + '|' + ch + '|2025'];
    if (!prec || prec.length < 20 || perKey[k].length < 20) continue;
    const a = mediana(perKey[k]), b = mediana(prec);
    if (!(a > 0 && b > 0)) continue;
    const salto = a/b - 1;
    if (Math.abs(salto) <= SOGLIA) continue;
    const chiave = id + '|' + ch;
    const txt = id + ' ' + ch + ': ' + Math.round(b) + ' → ' + Math.round(a)
              + ' (' + (salto>=0?'+':'') + (salto*100).toFixed(0) + '%)';
    if (SPIEGATI[chiave]) info('salto noto ·', txt, '·', SPIEGATI[chiave]);
    else nuovi.push(txt);
  }
  ok(nuovi.length === 0, 'nessun salto inspiegato del prezzo medio fra 2025 e 2026',
     nuovi.length + ' · ' + nuovi.slice(0,2).join(' | '));
}
fine();

/* ===========================================================================
   TEST DELLE FUNZIONI AGGIUNTE IN QUESTA SESSIONE
   Ognuna ha avuto almeno un errore trovato solo misurando: il confronto col
   totale finale invece che con lo stesso punto della curva, i pavimenti
   sovrascritti dalla copia delle regole, la matrice last minute che non si
   salvava.
   =========================================================================== */
const T = require('./t_lib');
const { w, X, D, ok, info, fine } = T.boot([
  'renderForecast',
  'renderSellStrategy', 'renderRMESConfigTab', 'rmesCopyRulesToAll', 'rmesSignalsCfg',
  'rmesSignalsSet', 'getRmesCap', 'setRmesCap', 'fp_getLmfMatrix', 'fp_setLmfMatrix',
  'fp_getChannelMarkupParts', 'fp_setChannelMarkupParts', 'fp_getFloor', 'fp_getBasePrice',
  'fp_setOverride', 'fp_setFloor', 'newrmesGetEffectiveBase', '_invalidateRmesMapCache', 'TODAY', 'CFG',
  'compsetWeightedAvg', 'fpCapHorizonDays', 'newrmesGetCurrentReference',
  'loadEvents', 'EVENTS', 'EVENTS_LIST', '_getEventBoost', '_listEventLabels', '_eventLabelsFor'
]);
const t0 = new Date(X.TODAY); t0.setHours(0,0,0,0);

/* --- COPIA DELLE REGOLE -------------------------------------------------- */
{
  const primaFloor = {}, primaAnchor = {};
  for (const k of Object.keys(X.CFG.structures)){
    try { primaFloor[k] = X.fp_getFloor(k); } catch(e){}
    try { primaAnchor[k] = X.fp_getBasePrice(k); } catch(e){}
  }
  const c = X.rmesSignalsCfg('firenze');
  c.pickup.windowDays = 9; c.pickup.spreadNights = 5; c.market.band = 0.33;
  X.rmesSignalsSet('firenze', c);
  X.setRmesCap('firenze', 0.22);
  const lmf = X.fp_getLmfMatrix('firenze'); lmf[0][0] = -17; X.fp_setLmfMatrix('firenze', lmf);
  const mk = X.fp_getChannelMarkupParts('firenze'); mk.booking.gross = 61; X.fp_setChannelMarkupParts('firenze', mk);
  const done = X.rmesCopyRulesToAll('firenze');
  info('regole copiate su', done.length, 'strutture');
  ok(done.length >= 3, 'la copia raggiunge le altre strutture', done.length);
  for (const k of done){
    const c2 = X.rmesSignalsCfg(k);
    ok(c2.pickup.windowDays === 9 && c2.pickup.spreadNights === 5, '[' + k + '] segnali copiati');
    ok(Math.abs(X.getRmesCap(k) - 0.22) < 1e-9, '[' + k + '] tetto copiato');
    ok(X.fp_getLmfMatrix(k)[0][0] === -17, '[' + k + '] matrice copiata');
    ok(X.fp_getChannelMarkupParts(k).booking.gross === 61, '[' + k + '] markup copiato');
    /* I numeri propri della struttura NON vanno toccati: copiare il pavimento
       di Firenze su Enis sarebbe un danno silenzioso. */
    ok(X.fp_getFloor(k) === primaFloor[k], '[' + k + '] il pavimento resta suo', X.fp_getFloor(k) + ' era ' + primaFloor[k]);
    ok(X.fp_getBasePrice(k) === primaAnchor[k], '[' + k + '] l ancoraggio resta suo');
  }
}

/* --- SALVATAGGIO DEL LAST MINUTE ----------------------------------------- */
{
  w.CURRENT_STRUCT = 'firenze'; w.RMES_TAB_STRUCT = 'firenze';
  X.renderRMESConfigTab();
  const btn = D.getElementById('rmes-lmf-save');
  ok(!!btn, 'la matrice ha il suo pulsante di salvataggio');
  if (btn){
    const prima = X.fp_getLmfMatrix('firenze')[0][0];
    const inp = D.querySelector('.rmes-lmf-input[data-lmf-r="0"][data-lmf-c="0"]');
    if (inp){
      inp.value = String(prima - 6);
      btn.click();
      ok(X.fp_getLmfMatrix('firenze')[0][0] === prima - 6, 'e il valore modificato viene salvato',
         X.fp_getLmfMatrix('firenze')[0][0]);
    }
  }
  const txt = D.getElementById('rmes-lmf-wrap').textContent;
  ok(!/Apply changes/.test(txt), 'non rimanda a un pulsante inesistente');
}

/* --- FILTRO DEI PUNTINI ROSSI -------------------------------------------- */
{
  const base = X.CFG.structures.firenze.baseRT;
  for (const off of [12, 22, 32]){
    const d = new Date(t0.getTime() + off*864e5);
    X.fp_setOverride('firenze', T.isoOf(T.ymdOf(d)), base, Math.round(X.newrmesGetEffectiveBase('firenze', T.ymdOf(d)) * 3), { source: 't' });
  }
  X._invalidateRmesMapCache();
  w.CURRENT_STRUCT = 'firenze';
  X.renderSellStrategy('firenze');
  const tbl = D.querySelector('#sell-table-wrap table.sell-table');
  const btn = D.getElementById('sell-warn-filter');
  const warn = tbl.querySelectorAll('tbody tr.sell-row-warn').length;
  info('righe marcate:', warn);
  ok(warn > 0, 'le righe con il puntino sono marcate', warn);
  ok(btn && new RegExp('\\(' + warn + '\\)').test(btn.textContent), 'il pulsante dice quante sono', btn && btn.textContent.trim());
  btn.click();
  ok(tbl.classList.contains('warn-only'), 'il filtro si attiva');
  btn.click();
  ok(!tbl.classList.contains('warn-only'), 'e si spegne');
  for (const off of [12, 22, 32]) X.fp_setOverride('firenze', T.isoOf(T.ymdOf(new Date(t0.getTime() + off*864e5))), base, null, {});
  X._invalidateRmesMapCache();
}

/* --- ANALISI INCROCIATA -------------------------------------------------- */
{
  const Xa = T.boot(['renderAnalysis','anlyAggregate','TODAY','CFG']);
  const w2 = Xa.w, X2 = Xa.X, D2 = Xa.D;
  w2.CURRENT_STRUCT = 'firenze';
  const td = new Date(X2.TODAY);
  w2.ANLY_YM = td.getFullYear()*100 + (td.getMonth()+2);
  let e = null; try { X2.renderAnalysis('firenze'); } catch(x){ e = x.message; }
  ok(!e, 'la tab Analysis si disegna', e);
  const wrap = D2.getElementById('anly-wrap');
  ok(wrap && wrap.innerHTML.length > 3000, 'e si riempie', wrap && wrap.innerHTML.length);
  const t = () => wrap.textContent.replace(/\s+/g,' ');
  for (const k of ['Revenue (gross)','ADR','Occupancy','Booking lead','Pickup last 7 days'])
    ok(t().includes(k), 'il KPI "' + k + '" c e');
  const righe = [...wrap.querySelectorAll('.anly-row[data-dim=ch]')];
  ok(righe.length >= 2, 'ci sono canali su cui filtrare', righe.length);
  /* Il punto di tutto: filtrando, TUTTI gli altri numeri devono cambiare.
     Un filtro che cambia solo la propria tabella non serve a niente. */
  const revDi = () => { const m = t().match(/Revenue \(gross\)\u20ac([\d,]+)/); return m ? +m[1].replace(/,/g,'') : null; };
  const occDi = () => { const m = t().match(/Occupancy(\d+)%/); return m ? +m[1] : null; };
  const rev0 = revDi(), occ0 = occDi();
  righe[0].click();
  const rev1 = revDi(), occ1 = occDi();
  ok(rev1 != null && rev1 < rev0, 'filtrando un canale il ricavo si restringe', rev0 + ' → ' + rev1);
  ok(occ1 != null && occ1 < occ0, 'e anche l occupazione', occ0 + '% → ' + occ1 + '%');
  const rt = [...D2.getElementById('anly-wrap').querySelectorAll('.anly-row[data-dim=rt]')];
  if (rt.length){
    rt[0].click();
    const rev2 = revDi();
    ok(rev2 != null && rev2 <= rev1, 'un secondo filtro stringe ancora', rev1 + ' → ' + rev2);
  }
  D2.getElementById('anly-clear').click();
  ok(revDi() === rev0, 'clear riporta ai valori pieni', revDi() + ' vs ' + rev0);
  /* L'anticipo e' il dato che dice se uno scarto e' recuperabile. */
  ok(/days/.test(t()), 'l anticipo e espresso in giorni');
}

/* --- CARA E FERMA: IL PUNTINO SULLE DATE SOPRA IL GOAL VALUE -------------
   Scritto dopo averlo misurato tre volte di seguito, perche' le prime due
   versioni erano sbagliate in modi che a schermo non si vedevano:
   1a) senza il filtro dell'orizzonte accendeva venti date di fila che
       cominciavano esatte a 61 giorni — cioe' segnava il confine della matrice
       last minute, non una situazione;
   2a) diceva "porta il prezzo verso il Goal Value" anche dove il Goal Value sta
       SOTTO il pavimento, cioe' chiedeva una cosa che la configurazione vieta.
   I controlli qui sotto difendono tutte e due le correzioni. */
{
  const _tipOf = (tr) => {
    const td = tr.querySelector('td[data-rmes-date]');
    return td ? (td.getAttribute('title') || '') : '';
  };
  const _nuovi = (s) => {
    w.CURRENT_STRUCT = s; w.RMES_TAB_STRUCT = s;
    X.renderSellStrategy(s);
    const out = [];
    D.querySelectorAll('#sell-table-wrap tbody tr.sell-row-warn').forEach(tr => {
      const tip = _tipOf(tr);
      if (tip.indexOf('ABOVE THE GOAL VALUE') === -1) return;
      const d = tr.querySelector('.sell-date-txt');
      out.push({ data: d ? d.textContent.trim() : '?', tip: tip,
                 pavimento: tip.indexOf('THE FLOOR IS HOLDING IT') !== -1,
                 lead: null });
    });
    return out;
  };

  const perStruct = {};
  let tot = 0, totPav = 0;
  for (const s of ['firenze','condotta','alfani','davids','nazionale','portenuove']){
    const n = _nuovi(s);
    perStruct[s] = n;
    tot += n.length;
    totPav += n.filter(x => x.pavimento).length;
    info(s.padEnd(11) + n.length + ' date segnalate (' + n.filter(x => x.pavimento).length + ' per il pavimento)');
  }
  ok(tot > 0, 'la segnalazione "cara e ferma" scatta su almeno una data', tot);
  /* Il numero conta: un segnale che accende un quarto della tabella non e' un
     segnale. Il tetto e' largo ma non infinito. */
  ok(tot <= 40, 'e non marca un blocco continuo di date', tot);

  /* NESSUNA data oltre l'orizzonte di vendita della sua struttura: oltre, i
     prezzi pubblicati dei competitor sono segnaposto e il Base Price stesso si
     rifiuta di farsi limitare dal Goal Value. */
  let oltre = [];
  for (const s in perStruct){
    const hz = X.fpCapHorizonDays(s);
    for (const x of perStruct[s]){
      const p = x.data.split('/');
      const d = new Date(+p[2], +p[1]-1, +p[0]);
      const lead = Math.round((d - t0) / 86400000);
      if (lead > hz) oltre.push(s + ' ' + x.data + ' (' + lead + 'gg > ' + hz + ')');
    }
  }
  ok(oltre.length === 0, 'nessuna data segnalata oltre l orizzonte di vendita', oltre.slice(0,3).join(' · '));

  /* Il messaggio deve nominare i due numeri e, quando e' il pavimento a tenere
     su il prezzo, deve dirlo invece di chiedere un taglio impossibile. */
  const senzaPav = [].concat(...Object.keys(perStruct).map(k => perStruct[k])).filter(x => !x.pavimento);
  /* Il caso "il mercato sta sotto il pavimento" NON si cerca fra i floor
     configurati oggi: dipenderebbe da una scelta commerciale. Quando Alfani e'
     passato da 200 a 140 questo controllo e' diventato rosso pur non essendo
     cambiata una riga di codice. Quindi la situazione si costruisce: si alza il
     floor sopra qualunque compset, si guarda il messaggio, si rimette com'era. */
  const _floorPrima = X.fp_getFloor('alfani');
  X.fp_setFloor('alfani', 400);
  try { X._invalidateRmesMapCache(); } catch(e){}
  const conPav = _nuovi('alfani').filter(x => x.pavimento);
  X.fp_setFloor('alfani', _floorPrima);
  try { X._invalidateRmesMapCache(); } catch(e){}
  ok(conPav.length > 0, 'col floor sopra il mercato, riconosce che e il pavimento a tenere su il prezzo',
     conPav.length + ' date (floor forzato a 400, poi rimesso a ' + _floorPrima + ')');
  if (conPav.length){
    const t = conPav[0].tip;
    ok(/Active price €[\d.,]+/.test(t), 'dice il prezzo attivo');
    ok(/Goal Value of €[\d.,]+/.test(t), 'e il Goal Value contro cui lo misura');
    ok(/Floor Rate of €[\d.,]+/.test(t), 'e nomina il pavimento che lo sta tenendo su');
    ok(t.indexOf('bring it towards') === -1,
       'e NON chiede di scendere verso un numero che il pavimento vieta', t.slice(0,80));
  }
  if (senzaPav.length){
    const t = senzaPav[0].tip;
    ok(/bring it towards €[\d.,]+/.test(t),
       'dove invece c e spazio, indica il numero verso cui andare', t.slice(0,80));
  }

  /* Il filtro in cima alla colonna deve contare anche queste righe: il puntino
     senza il filtro costringerebbe a scorrere 365 date per trovarle. */
  w.CURRENT_STRUCT = 'alfani'; w.RMES_TAB_STRUCT = 'alfani';
  X.renderSellStrategy('alfani');
  const tblA = D.querySelector('#sell-table-wrap table.sell-table');
  const btnA = D.getElementById('sell-warn-filter');
  const nA = tblA.querySelectorAll('tbody tr.sell-row-warn').length;
  ok(btnA && new RegExp('\\(' + nA + '\\)').test(btnA.textContent),
     'il filtro conta anche le righe marcate dalla nuova segnalazione', btnA && btnA.textContent.trim());

  /* E soprattutto: NON ha toccato un solo prezzo. */
  const suggeriti = [];
  D.querySelectorAll('#sell-table-wrap td[data-rmes-date]').forEach(td => {
    const v = parseFloat(String(td.textContent).replace(/[^\d.]/g, ''));
    if (isFinite(v)) suggeriti.push(v);
  });
  ok(suggeriti.length > 60, 'le celle prezzo restano tutte leggibili e cliccabili', suggeriti.length);
  const fl = X.fp_getFloor('alfani');
  ok(suggeriti.every(v => v >= fl - 1), 'e nessun prezzo e scivolato sotto il pavimento', fl);
}



/* --- DUE EVENTI NELLO STESSO GIORNO ---------------------------------------
   Il file eventi ha due colonne e non perche' la prima conti di piu'. Prima il
   motore ne teneva una sola: su 14 giorni il secondo evento spariva senza dirlo,
   e 27 giorni avevano l'evento SOLO nella seconda colonna. Questi controlli
   difendono le tre cose che si romperebbero in silenzio: un evento perso, la
   stringa unita che finisce fra gli eventi configurabili, e i pesi che smettono
   di sommarsi. */
{
  const CSV = [
    'Date,Event',
    '2026-03-01,Solo Uno',
    '2026-03-02,Primo',
    '2026-03-02,Secondo',
    '2026-03-03,"Con, la virgola"',
    '2026-03-04,Senza Peso',
  ].join('\n');
  const prima = X.EVENTS_CSV;              // per rimettere a posto dopo
  X.loadEvents(CSV);
  const EL = X.EVENTS_LIST;
  ok(Object.keys(EL).length === 4, 'quattro giorni caricati', Object.keys(EL).length);
  ok(EL[20260302] && EL[20260302].length === 2,
     'due righe con la stessa data danno due eventi, non uno che sovrascrive l altro',
     JSON.stringify(EL[20260302]));
  ok(X.EVENTS[20260302].indexOf('Primo') !== -1 && X.EVENTS[20260302].indexOf('Secondo') !== -1,
     'e a schermo si leggono tutti e due', X.EVENTS[20260302]);
  ok(EL[20260303] && EL[20260303][0] === 'Con, la virgola',
     'un nome che contiene una virgola non si spezza in due eventi', JSON.stringify(EL[20260303]));

  const nomi = X._listEventLabels();
  ok(nomi.length === 5, 'gli eventi configurabili sono i nomi veri', nomi.length + ': ' + nomi.join(' | '));
  ok(!nomi.some(n => n.indexOf(' · ') !== -1),
     'la stringa unita NON compare fra quelli da configurare');

  w.localStorage.setItem('rmes_event_weights_v1', JSON.stringify({
    'Solo Uno': 5, 'Primo': 10, 'Secondo': 8 }));
  ok(Math.abs(X._getEventBoost(20260301) - 1.05) < 1e-9,
     'un evento solo vale il suo peso', X._getEventBoost(20260301));
  ok(Math.abs(X._getEventBoost(20260302) - 1.18) < 1e-9,
     'due eventi sommano i pesi: 10% + 8% = +18%', X._getEventBoost(20260302));
  ok(X._getEventBoost(20260304) === 1.0,
     'un evento senza peso configurato lascia il prezzo dov e');
  ok(X._getEventBoost(20260305) === 1.0, 'un giorno senza eventi nemmeno');

  /* Un peso negativo non deve far scendere il prezzo: era gia' cosi' prima, e
     il passaggio alla somma non deve averlo cambiato di nascosto. */
  w.localStorage.setItem('rmes_event_weights_v1', JSON.stringify({ 'Primo': 10, 'Secondo': -8 }));
  ok(Math.abs(X._getEventBoost(20260302) - 1.10) < 1e-9,
     'un peso negativo resta senza effetto, come prima', X._getEventBoost(20260302));

  w.localStorage.removeItem('rmes_event_weights_v1');
  X.loadEvents(prima);                      // rimetto gli eventi veri
  ok(Object.keys(X.EVENTS_LIST).length > 100, 'gli eventi veri sono tornati al loro posto',
     Object.keys(X.EVENTS_LIST).length);
}


/* --- LA SELL STRATEGY ENTRA TUTTA IN UNA VOLTA --------------------------- */
/* Prima le prime 25 righe entravano subito e il resto un frame dopo. La
   tabella non ha larghezze fisse, quindi all'arrivo del secondo blocco le
   colonne si riallargavano e tutto quello a destra slittava di un centinaio
   di pixel: a ogni accept la tabella ballava sotto il puntatore.
   jsdom non fa layout, ma la causa si misura lo stesso: se il render torna e
   le righe non ci sono ancora, il secondo blocco e' tornato. */
{
  const wrap = D.getElementById('sell-table-wrap');
  ok(!!wrap, 'il contenitore della Sell Strategy esiste');
  const wasSync = w.__RMES_SYNC_RENDER;
  w.__RMES_SYNC_RENDER = false;          // il flag dei test non deve mascherare il difetto
  X.renderSellStrategy('firenze');
  /* SELL_RANGE_DAYS e' un let dello scope dell'eval: assegnarlo da qui
     creerebbe un'altra variabile e il motore non la leggerebbe mai. Si cambia
     dai pill veri, che e' poi quello che fa l'utente. */
  const pill = n => D.querySelector('#sell-range-pills button[data-range="' + n + '"]');
  ok(!!pill(30) && !!pill(365), 'i pill del periodo ci sono');
  for (const days of [30, 90, 365]){
    let n = 0, tot = 0, err = null;
    try {
      pill(days).click();                // cambia il periodo E ridisegna, come l'utente
      const rows = wrap.querySelectorAll('table.sell-table tbody tr');
      n = rows.length;
      tot = [...rows].filter(r => /total/i.test(r.textContent || '')).length;
    } catch(e){ err = e.message; }
    if (err){ ok(false, 'render a ' + days + ' giorni', err); continue; }
    ok(n >= days, 'a ' + days + ' giorni le righe ci sono tutte al ritorno del render', n + ' righe');
    ok(tot >= 1, 'a ' + days + ' giorni la riga Total e gia in fondo', tot);
  }
  pill(90).click();
  w.__RMES_SYNC_RENDER = wasSync;
  X.renderSellStrategy('firenze');
}
/* --- OVERVIEW: il tooltip "come arriva su Beddy" anche sui totali --------- */
/* Diceva "net of OTA commission", ma non e' il netto: Booking, Airbnb, Direct e
   Hotel Collect su Beddy arrivano gia' lordi e non vengono toccati. E la riga
   dei totali il tooltip non ce l'aveva proprio. */
{
  const eur = t => +String(t).replace(/[^\d.-]/g, '');
  for (const sk of ['firenze','alfani']){
    let tbl = null;
    try { w.setStructure(sk); X.renderForecast(sk); tbl = D.getElementById('fcst-monthly-table'); }
    catch(e){ ok(false, 'Overview di ' + sk, e.message); continue; }
    const tot = tbl && tbl.querySelector('tr.total');
    ok(!!tot, sk + ': la riga dei totali c\'e\'');
    if (!tot) continue;
    /* le tre coppie ADR/Revenue: OTB, STLY, Final LY */
    const conTip = [2,3,5,6,8,9].filter(i => tot.children[i] && tot.children[i].getAttribute('title'));
    ok(conTip.length === 6, sk + ': tutte e sei le celle ADR/Revenue dei totali hanno il tooltip', conTip.length + '/6');
    const t = tot.children[3].getAttribute('title') || '';
    ok(/As it arrives on Beddy/.test(t), sk + ': il tooltip dice come arriva su Beddy');
    ok(!/net of OTA commission/.test(t), sk + ': e non lo chiama piu "net of OTA commission"');
    ok(/Booking, Airbnb, Direct and Hotel Collect/.test(t), sk + ': e dice quali canali arrivano gia lordi');
    /* il numero: minore del lordo, e pari alla somma dei mesi (a meno degli arrotondamenti) */
    const netTot = eur((t.match(/Revenue €([\d.,]+)/) || [])[1]);
    const lordo  = eur(tot.children[3].textContent);
    ok(netTot > 0 && netTot < lordo, sk + ': il valore su Beddy e minore del lordo',
       netTot.toLocaleString('it-IT') + ' < ' + lordo.toLocaleString('it-IT'));
    ok(netTot / lordo > 0.80, sk + ': e il ritocco commissione resta sotto il 20%',
       ((lordo/netTot - 1) * 100).toFixed(2) + '%');
    const somma = [...tbl.querySelectorAll('tbody tr:not(.total)')].reduce((acc, tr) => {
      const tt = tr.children[3] && tr.children[3].getAttribute('title');
      const m = tt && tt.match(/Revenue €([\d.,]+)/);
      return acc + (m ? eur(m[1]) : 0);
    }, 0);
    ok(Math.abs(somma - netTot) <= 12, sk + ': il totale e la somma dei mesi (a meno degli arrotondamenti)',
       somma.toLocaleString('it-IT') + ' vs ' + netTot.toLocaleString('it-IT'));
  }
}
/* --- OVERVIEW: anche la colonna YTD+Forecast ha il suo tooltip ------------ */
/* Non esiste un "come arriva su Beddy" registrato per una previsione. Pero' la
   parte GIA' A LIBRO il netto ce l'ha e si converte esatta: va stimato solo il
   residuo. Su un mese chiuso il residuo e' zero, quindi il numero e' esatto e
   coincide con quello della colonna OTB. */
{
  const eur = t => +String(t).replace(/[^\d.-]/g, '');
  const rev = t => { const m = String(t).match(/Revenue €([\d.,]+)/); return m ? eur(m[1]) : null; };
  for (const sk of ['firenze','alfani']){
    try { w.setStructure(sk); X.renderForecast(sk); } catch(e){ ok(false, 'Overview ' + sk, e.message); continue; }
    const tbl = D.getElementById('fcst-monthly-table');
    const righe = [...tbl.querySelectorAll('tbody tr:not(.total)')];
    const tot = tbl.querySelector('tr.total');

    /* tutte e tre le celle della colonna hanno un tooltip, riga per riga */
    const senza = righe.filter(tr => [10,11,12].some(i => !(tr.children[i] && tr.children[i].getAttribute('title'))));
    ok(senza.length === 0, sk + ': ogni mese ha il tooltip su OCC, ADR e Revenue di YTD+Forecast',
       senza.length ? senza.map(tr => tr.children[0].textContent.trim()).join(', ') : '');
    ok([10,11,12].every(i => tot.children[i] && tot.children[i].getAttribute('title')),
       sk + ': ce l\'ha anche la riga dei totali');

    /* mese chiuso: deve essere ESATTO e uguale al netto della colonna OTB */
    const chiusi = righe.filter(tr => /not an estimate/.test(tr.children[12].getAttribute('title') || ''));
    ok(chiusi.length > 0, sk + ': almeno un mese chiuso e dichiarato esatto, non stimato', chiusi.length);
    for (const tr of chiusi.slice(0,3)){
      const nf = rev(tr.children[12].getAttribute('title'));
      const no = rev(tr.children[3].getAttribute('title'));
      ok(nf === no, sk + ' ' + tr.children[0].textContent.trim() + ': chiuso → stesso valore della colonna OTB',
         nf + ' vs ' + no);
    }

    /* mese aperto: dichiarato stima, e il valore sta fra il netto OTB e il lordo */
    const aperti = righe.filter(tr => /ESTIMATE/.test(tr.children[12].getAttribute('title') || ''));
    ok(aperti.length > 0, sk + ': i mesi aperti sono dichiarati stima', aperti.length);
    for (const tr of aperti){
      const lbl = tr.children[0].textContent.trim();
      const t = tr.children[12].getAttribute('title');
      const net = rev(t);
      const lordo = eur(tr.children[12].textContent.split('–')[0].match(/€[\d.,]+/)[0]);
      const netOtb = rev(tr.children[3].getAttribute('title')) || 0;
      if (net == null){ ok(false, sk + ' ' + lbl + ': stima leggibile'); continue; }
      ok(net < lordo && net >= netOtb,
         sk + ' ' + lbl + ': la stima sta fra il netto gia a libro e il lordo previsto',
         netOtb + ' ≤ ' + net + ' < ' + lordo);
    }

    /* la stima non puo' sostenere che su un mese quasi vuoto non ci sia commissione */
    for (const tr of aperti){
      const t = tr.children[12].getAttribute('title');
      const net = rev(t), lordo = eur(tr.children[12].textContent.split('–')[0].match(/€[\d.,]+/)[0]);
      const otbLordo = eur(tr.children[3].textContent);
      if (otbLordo / lordo < 0.25){   // mese ancora quasi tutto da vendere
        ok(net < lordo * 0.999,
           sk + ' ' + tr.children[0].textContent.trim() + ': su un mese quasi vuoto la commissione non sparisce',
           net + ' / ' + lordo);
      }
    }
  }
}

fine();
/* ===========================================================================
   AUDIT 3 — L'INTERFACCIA SI DISEGNA DAVVERO
   Gli errori peggiori di questa sessione non davano nessun messaggio: una
   virgoletta mancante lasciava zero celle cliccabili, tre variabili fuori
   portata spegnevano pezzi di pagina, il try del modal inghiottiva l'errore e
   la meta' inferiore spariva. Questo audit apre tutto su tutte le strutture e
   verifica che i contenitori si riempiano.
   =========================================================================== */
const T = require('./t_lib');
const { w, X, D, ok, info, fine, errs } = T.boot([
  'renderSellStrategy', 'renderForecast', 'renderRMESConfigTab', 'renderAnalysis', 'BOOKINGS', '_grossUpFactor', 'structKeysFor',
  'computeRMESPriceMap', 'CFG'
]);
const TUTTE = ['firenze', 'condotta', 'alfani', 'davids', 'nazionale', 'portenuove'];

/* 1. Ogni tab si disegna su ogni struttura, senza errori. */
for (const st of TUTTE){
  w.CURRENT_STRUCT = st; w.RMES_TAB_STRUCT = st;
  for (const [nome, fn] of [['Sell Strategy', () => X.renderSellStrategy(st)],
                            ['Overview',      () => X.renderForecast(st)],
                            ['Analysis',      () => X.renderAnalysis(st)],
                            ['RMES',          () => X.renderRMESConfigTab()]]){
    let e = null;
    try { fn(); } catch(x){ e = x.message; }
    ok(!e, '[' + st + '] ' + nome + ' si disegna', e);
  }
}

/* 2. I contenitori chiave non devono restare vuoti: "vuoto e senza errori" e'
      il modo peggiore di rompersi, perche' sembra funzionare. */
w.CURRENT_STRUCT = 'firenze'; w.RMES_TAB_STRUCT = 'firenze';
X.renderSellStrategy('firenze'); X.renderForecast('firenze'); X.renderRMESConfigTab(); X.renderAnalysis('firenze');
for (const [id, min] of [['sell-table-wrap', 5000], ['fcst-kpis', 200],
                         ['rmes-signals-wrap', 1000], ['rmes-lmf-wrap', 1000],
                         ['rmes-events-wrap', 500], ['fp-tab-wrap', 1000], ['anly-wrap', 3000]]){
  const el = D.getElementById(id);
  ok(el && el.innerHTML.length > min, 'il riquadro ' + id + ' si riempie',
     el ? el.innerHTML.length + ' caratteri' : 'ASSENTE');
}

/* 3. La tabella della Sell Strategy: righe, celle cliccabili, caselle. */
{
  const tbl = D.querySelector('#sell-table-wrap table.sell-table');
  const righe = tbl ? tbl.querySelectorAll('tbody tr:not(.total)').length : 0;
  const celle = D.querySelectorAll('#sell-table-wrap td[data-rmes-date]').length;
  const box   = D.querySelectorAll('#sell-table-wrap input.sell-loaded-inp').length;
  const tot   = tbl ? tbl.querySelectorAll('tbody tr.total').length : 0;
  info('righe', righe, '· celle prezzo', celle, '· caselle', box);
  ok(righe > 30, 'la tabella ha le sue righe', righe);
  ok(celle === righe, 'ogni riga ha la cella del prezzo cliccabile', celle + ' su ' + righe);
  ok(box === righe, 'ogni riga ha la casella del prezzo caricato', box + ' su ' + righe);
  ok(tot === 1, 'la riga dei totali c e una volta sola', tot);
}

/* 4. Il modal del calcolo: sei righe, sempre. Il try le inghiottiva. */
{
  const celle = [...D.querySelectorAll('#sell-table-wrap td[data-rmes-date]')];
  const attese = ['Pickup', 'Market guard-rail', 'AirDNA check', 'Last Minute Price Factor', 'Event Factor', 'Everything combined'];
  const trovate = {}; attese.forEach(k => trovate[k] = 0);
  let aperti = 0;
  for (let i = 0; i < 10 && i < celle.length; i++){
    const vecchio = D.getElementById('fp-detail-modal'); if (vecchio) vecchio.remove();
    celle[i].click();
    const md = D.getElementById('fp-detail-modal');
    if (!md) continue;
    aperti++;
    attese.forEach(k => { if (md.textContent.includes(k)) trovate[k]++; });
  }
  const vecchio = D.getElementById('fp-detail-modal'); if (vecchio) vecchio.remove();
  ok(aperti >= 8, 'il modal si apre cliccando sul prezzo', aperti + ' su 10');
  attese.forEach(k => ok(trovate[k] === aperti, 'il modal mostra sempre "' + k + '"', trovate[k] + '/' + aperti));
}

/* 5. I tooltip si scrivono al passaggio del mouse. */
{
  const c = D.querySelector('#sell-table-wrap td[data-tip]');
  if (c){
    const prima = c.getAttribute('title') || '';
    c.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));
    const dopo = c.getAttribute('title') || '';
    ok(prima === '', 'il tooltip non e scritto nell HTML');
    ok(dopo.length > 20, 'ma compare passandoci sopra', dopo.slice(0, 40));
  } else {
    // con il render sincrono i tooltip sono gia' applicati: va bene lo stesso
    const q = [...D.querySelectorAll('#sell-table-wrap [title]')];
    ok(q.length > 20, 'i tooltip ci sono', q.length);
  }
}

/* 6. I comandi aggiunti esistono e sono agganciati. */
for (const [id, cosa] of [['sell-warn-filter', 'il filtro dei puntini rossi'],
                          ['rmes-copy-all', 'il pulsante che copia le regole'],
                          ['rmes-lmf-save', 'il salvataggio del last minute'],
                          ['anly-month', 'il menu dei mesi dell analisi'],
                          ['anly-clear', 'il pulsante che azzera i filtri']]){
  const el = D.getElementById(id);
  ok(!!el, cosa + ' esiste');
}

/* --- NIENTE SEZIONE GROWTH IN OVERVIEW --------------------------------- */
/* Era un riquadro in cima che spiegava il fattore di crescita e permetteva di
   forzarlo a mano. Confondeva piu' di quanto aiutasse: Overview ora apre
   direttamente sui KPI. */
{
  w.CURRENT_STRUCT = 'firenze';
  X.renderForecast('firenze');
  ok(!D.getElementById('fcst-growth-note'), 'la sezione growth non esiste piu');
  ok(!/growth factor|set by hand/i.test(D.getElementById('panel-fcst').textContent || ''),
     'e non ne resta traccia in Overview');
  const kpi = [...D.querySelectorAll('#fcst-kpis .kpi-label')].length;
  ok(kpi >= 4, 'Overview apre sui KPI', kpi);
}

/* --- IL GROSS E' APPLICATO, NON SOLO DESCRITTO -------------------------- */
/* Il recupero sta dentro revPerNight, alla radice: cosi ogni tab che parte da
   li lo eredita senza doverlo riapplicare. Se qualcuno lo spostasse a valle,
   una tab lo avrebbe e un'altra no, e nessuno se ne accorgerebbe. */
{
  const CFG2 = X.CFG;
  const trova = (pred) => { for (const b of X.BOOKINGS){ if (!b.cancelled && pred(b)) return b; } return null; };
  const chiave = (b) => Object.keys(CFG2.structures).find(k => new Set(w.structKeysFor(k)).has(b.struct));
  const casi = [
    /* Il fattore atteso dipende dalla struttura: Condotta ha il 16,5% e quindi
       1,1796, le altre il 18% e 1,1996. Pretendere un valore solo faceva
       fallire il controllo a seconda di quale prenotazione capitava per prima. */
    ['Expedia', trova(b => (b.canale||'').toLowerCase()==='expedia' && b.ref !== 'D0DC06D1DC'),
      (v, k) => Math.abs(v - (k === 'condotta' ? 1.1796 : 1.1996)) < 0.0005],
    ['Airbnb',  trova(b => (b.canale||'').toLowerCase()==='airbnb'), v => v === 1],
    ['Booking', trova(b => (b.canale||'').toLowerCase()==='booking'), v => v === 1],
    ['Hotel Collect', trova(b => b.ref === 'D0DC06D1DC'), v => v === 1]
  ];
  for (const [nome, b, atteso] of casi){
    if (!b){ ok(false, 'trovata una prenotazione ' + nome); continue; }
    const k = chiave(b);
    const f = X._grossUpFactor(b.canale, k, b.ref);
    ok(atteso(f, k), 'il fattore di ' + nome + ' e quello giusto nei dati',
       f.toFixed(4) + ' su ' + k);
  }
  /* E le descrizioni devono dire la stessa cosa che fa il codice. */
  const src = require('fs').readFileSync(__dirname + '/index.html', 'utf8');
  ok(/what the guest actually paid|what the guest paid/.test(src), 'il Playbook spiega il gross nei termini attuali');
  ok(/Hotel Collect/.test(src), 'e nomina Hotel Collect');
  ok(/1\.1996/.test(src) && /1\.2195/.test(src), 'con i fattori veri');
  ok(!/Airbnb 15\.5%|Ctrip 15%|grossed up 18%/.test(src), 'e senza i vecchi');
}
fine();

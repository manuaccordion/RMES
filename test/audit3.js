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
  'computeRMESPriceMap', 'CFG', 'expHasData', 'expSeriesFor', 'expContext', 'compsetWeightedAvg',
  'fpWirePlaybookSearch'
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

/* --- LA COLONNA RATE SHOPPER C'E' DOVE C'E' IL DATO, E SOLO LI' ----------
   Le strutture col rate shopper erano una lista scritta a mano in tre punti
   (la colonna, expContext, il compset). Chi guardava Porte Nuove o Nazionale
   non vedeva la colonna e non aveva modo di sapere se mancasse il dato o il
   codice. Ora si decide dal dato: questi controlli tengono insieme le due cose
   e falliscono sia se la colonna sparisce dove serve, sia se compare vuota. */
{
  for (const st of TUTTE){
    const ha = X.expHasData(st);
    w.CURRENT_STRUCT = st; w.RMES_TAB_STRUCT = st;
    X.renderSellStrategy(st);
    const col = [...D.querySelectorAll('#sell-table-wrap th')].some(t => /Rate shopper/i.test(t.textContent));
    ok(col === ha, st + ': la colonna Rate shopper c e esattamente dove ci sono prezzi Expedia',
       'dato ' + ha + ' / colonna ' + col);
    const ser = X.expSeriesFor(st);
    if (ha){
      /* Dove c'e' il dato devono esserci anche i competitor, altrimenti il
         fattore D e il tetto del Goal Value lavorano su niente. */
      ok(ser && ser.competitors && Object.keys(ser.competitors).length >= 3,
         st + ': ha un compset con almeno 3 competitor',
         ser && ser.competitors ? Object.keys(ser.competitors).length : 'nessuno');
    } else {
      /* Dove non c'e', tutto deve spegnersi in silenzio invece di rompersi. */
      ok(X.expContext(20261120, st) === null, st + ': expContext risponde null, non un oggetto vuoto');
      const r = X.compsetWeightedAvg(st, '2026-11-20', true);
      ok(r && r.avg == null && r.n === 0, st + ': il compset risponde vuoto senza esplodere', JSON.stringify(r));
    }
  }
  /* I tre modi del compset restano distinti: se gli offset smettessero di
     entrare nel Goal Value, il tetto del Base Price diventerebbe un altro
     numero senza che nulla lo segnali. */
  const iso = '2026-11-20';
  const g = X.compsetWeightedAvg('alfani', iso, true);
  const wt = X.compsetWeightedAvg('alfani', iso, false);
  const rw = X.compsetWeightedAvg('alfani', iso, false, {rawExpedia:true});
  info('Alfani ' + iso + ': Goal ' + (g.avg!=null?Math.round(g.avg):'-')
     + ' · Weighted ' + (wt.avg!=null?Math.round(wt.avg):'-')
     + ' · Raw ' + (rw.rawAvg!=null?Math.round(rw.rawAvg):'-'));
  ok(g.avg > 0 && wt.avg > 0 && rw.rawAvg > 0, 'i tre modi del compset rispondono tutti');
  ok(Math.round(g.avg) !== Math.round(wt.avg),
     'Goal Value e Weighted compset restano diversi (gli offset entrano solo nel primo)',
     Math.round(g.avg) + ' vs ' + Math.round(wt.avg));
  ok(Math.round(wt.avg) !== Math.round(rw.rawAvg),
     'Weighted e Raw restano diversi (il divisor Expedia→Beddy si applica solo al primo)',
     Math.round(wt.avg) + ' vs ' + Math.round(rw.rawAvg));
}



/* --- LE RISPOSTE RAPIDE DEL PLAYBOOK --------------------------------------
   Tredicimila parole in undici sezioni: la spiegazione c'era, trovarla no.
   Questi controlli difendono le tre cose che possono rompersi in silenzio: un
   link che punta a una sezione che non esiste piu', il filtro che smette di
   filtrare, e l'evidenziazione che entra dentro un href e spezza i link. */
{
  const inp = D.getElementById('qa-search');
  const righe = [...D.querySelectorAll('#qa-table tr.qa-row')];
  ok(!!inp && righe.length >= 15, 'le risposte rapide ci sono', righe.length);
  const rotti = righe.map(tr => {
    const a = tr.querySelector('a.qa-link');
    return (!a) ? 'riga senza link' : (D.getElementById(a.getAttribute('href').slice(1)) ? null : a.getAttribute('href'));
  }).filter(Boolean);
  ok(rotti.length === 0, 'ogni risposta rimanda a una sezione che esiste', rotti.join(' '));

  const vis = () => righe.filter(tr => !tr.classList.contains('qa-hide')).length;
  const scrivi = t => { inp.value = t; inp.dispatchEvent(new w.Event('input')); };
  ok(vis() === righe.length, 'a casella vuota si vedono tutte');
  scrivi('base price');
  ok(vis() > 0 && vis() < righe.length, 'il filtro stringe su "base price"', vis());
  ok(righe.some(tr => !tr.classList.contains('qa-hide') && /recalculate every day/i.test(tr.textContent)),
     'e la domanda sul ricalcolo giornaliero e fra i risultati');
  ok(righe.filter(tr => !tr.classList.contains('qa-hide')).every(tr => {
       const a = tr.querySelector('a.qa-link');
       return a && /^#instr-/.test(a.getAttribute('href'));
     }), 'evidenziando le parole i link restano interi');
  scrivi('qwerty');
  ok(vis() === 0 && D.getElementById('qa-none').style.display === 'block',
     'una ricerca senza risultati lo dice invece di mostrare una tabella vuota');
  scrivi('');
  ok(vis() === righe.length, 'svuotando tornano tutte');

  /* Le risposte devono dire un numero o un fatto, non rimandare e basta. */
  const vaghe = righe.filter(tr => (tr.querySelector('.qa-a').textContent || '').trim().length < 25);
  ok(vaghe.length === 0, 'nessuna risposta e troppo corta per dire qualcosa', vaghe.length);
}


fine();

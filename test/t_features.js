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
  'fp_setOverride', 'newrmesGetEffectiveBase', '_invalidateRmesMapCache', 'TODAY', 'CFG'
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
fine();

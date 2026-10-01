/* ===========================================================================
   AUDIT 2 — CONFIGURAZIONE E COSTANTI
   Controlla che le scelte fatte restino quelle: pavimento come tariffa piu'
   bassa, niente congelamento, markup nei suoi tre pezzi, fasce del last
   minute. Sono i numeri che qualcuno potrebbe cambiare senza accorgersi delle
   conseguenze.
   =========================================================================== */
const T = require('./t_lib');
const { w, X, ok, info, fine } = T.boot([
  'BASE_FREEZE_WINDOW_DAYS', 'FP_LONGSTAY_DISCOUNT', 'FP_LMF_OCC_BANDS', 'FP_LMF_DAY_BANDS',
  'newrmesGetFrozenBase', 'newrmesGetEffectiveBase', 'newrmesCalculateBasePrice',
  'newrmesCalculateBasePriceVerbose', 'fp_getFloor', 'fp_getChannelMarkupParts',
  'fp_getChannelMarkups', 'fp_markupForChannel', 'fpEffectiveMarkup', 'fp_getLmfMatrix',
  'rmesSignalsCfg', '_grossUpFactor', '_commissionFactor', 'TODAY', 'CFG'
]);
const t0 = new Date(X.TODAY); t0.setHours(0,0,0,0);

/* 1. Niente congelamento: il Base si ricalcola sempre. */
ok(X.BASE_FREEZE_WINDOW_DAYS === 0, 'il congelamento e disattivato', X.BASE_FREEZE_WINDOW_DAYS);
{
  let frozen = 0, diff = 0, tot = 0, det = '';
  for (const id of T.IDS) for (const off of [0, 1, 7, 14, 30, 90, 200, 364]){
    const d = new Date(t0.getTime() + off*864e5), k = T.ymdOf(d);
    if (X.newrmesGetFrozenBase(id, k) != null) frozen++;
    const eff = X.newrmesGetEffectiveBase(id, k), live = X.newrmesCalculateBasePrice(id, T.isoOf(k));
    if (eff > 0 && live > 0){ tot++; if (Math.abs(eff - live) > 1){ diff++; if (!det) det = id + ' +' + off + 'gg ' + Math.round(eff) + '!=' + Math.round(live); } }
  }
  ok(frozen === 0, 'nessuna data resta congelata', frozen);
  ok(diff === 0, 'il Base effettivo coincide sempre col ricalcolo', diff + '/' + tot + ' · ' + det);
}

/* 2. Il pavimento e' la tariffa PIU' BASSA che un cliente puo' pagare:
      soggiorno prolungato sulla camera piu' economica. */
ok(Math.abs(X.FP_LONGSTAY_DISCOUNT - 0.15) < 1e-9, 'lo sconto soggiorno prolungato e 15%', X.FP_LONGSTAY_DISCOUNT);
for (const id of T.IDS){
  const f = X.fp_getFloor(id);
  let v = null;
  for (let o = 5; o < 60 && !v; o++) v = X.newrmesCalculateBasePriceVerbose(id, T.isoOf(T.ymdOf(new Date(t0.getTime() + o*864e5))));
  if (!v) continue;
  const cheapFlex = v.floorEff - (v.floorLift || 0);
  const lowest = cheapFlex * (1 - X.FP_LONGSTAY_DISCOUNT);
  ok(Math.abs(lowest - f) < 1, '[' + id + '] la tariffa piu bassa atterra sul floor', Math.round(lowest) + ' vs ' + f);
  ok(v.floorSource === 'annual', '[' + id + '] il p15 storico non alza piu il pavimento', v.floorSource);
}

/* 3. Il markup e' fatto di tre pezzi e l'effettivo ne e' il prodotto. */
{
  const p = X.fp_getChannelMarkupParts('firenze');
  const m = X.fp_getChannelMarkups('firenze');
  ok(p.booking.gross === 57 && p.booking.campaign === 20 && p.booking.member === 10,
     'Booking +57% con campagna 20% e member 10%', JSON.stringify(p.booking));
  ok(p.expedia.gross === 62 && p.ctrip.gross === 62, 'Expedia e Ctrip +62%');
  ok(p.airbnb.gross === 10 && p.airbnb.campaign === 0 && p.airbnb.member === 0,
     'Airbnb senza campagne ne member deal', JSON.stringify(p.airbnb));
  info('effettivi: booking', (+m.booking).toFixed(2) + '%', '· expedia', (+m.expedia).toFixed(2) + '%');
  ok(Math.abs(m.booking - 13.04) < 0.01, 'Booking effettivo 13,04%', m.booking);
  ok(Math.abs(m.expedia - 16.64) < 0.01, 'Expedia effettivo 16,64%', m.expedia);
  for (const ch of ['booking','expedia','ctrip','airbnb'])
    ok(Math.abs(m[ch] - X.fpEffectiveMarkup(p[ch])) < 1e-9, 'l effettivo di ' + ch + ' e il prodotto dei tre pezzi');
  ok(Math.abs(X.fp_markupForChannel('Ctrip', 'firenze') - m.ctrip) < 1e-9, 'Ctrip ha il suo markup, non quello di Expedia');
  ok(X.fp_markupForChannel('Direct', 'firenze') === 0, 'il diretto non ha markup');
}

/* 4. Le fasce del last minute: dieci, compresa quella del 90%. */
ok(X.FP_LMF_OCC_BANDS.length === 10, 'dieci fasce di occupazione', X.FP_LMF_OCC_BANDS.length);
ok(X.FP_LMF_OCC_BANDS.includes(90), 'la fascia 90% esiste');
for (const id of T.IDS){
  const m = X.fp_getLmfMatrix(id);
  ok(m.length === X.FP_LMF_OCC_BANDS.length, '[' + id + '] la matrice ha una riga per fascia', m.length);
  ok(m.every(r => r.length === X.FP_LMF_DAY_BANDS.length), '[' + id + '] e una colonna per finestra');
}

/* 5. I segnali: i valori concordati e la coerenza fra loro. */
for (const id of T.IDS){
  const c = X.rmesSignalsCfg(id);
  ok(c.pickup.halfLifeDays <= c.pickup.windowDays,
     '[' + id + '] il half-life non supera la finestra', c.pickup.halfLifeDays + ' vs ' + c.pickup.windowDays);
  ok(c.pickup.nightHalfLife <= c.pickup.spreadNights,
     '[' + id + '] il half-life notti non supera lo spread', c.pickup.nightHalfLife + ' vs ' + c.pickup.spreadNights);
  ok(c.pickup.devFull > 0 && c.pickup.devFull <= 0.5, '[' + id + '] il max push e in un intervallo sensato', c.pickup.devFull);
  ok(c.smoothing.maxDailyStep > 0 && c.smoothing.maxDailyStep <= 0.3,
     '[' + id + '] il passo giornaliero e in un intervallo sensato', c.smoothing.maxDailyStep);
}

/* --- RECUPERO DELLA COMMISSIONE ----------------------------------------- */
/* Su Expedia Beddy registra il payout, non quello che paga il cliente. Il
   fattore di recupero deve tenere conto che l'IVA sta dentro il payout e non
   e' commissionabile: la formula ingenua 1/(1-c) sovrastima di circa il 2%.
   Verificato su una prenotazione reale: payout 575,52 → cliente 690,37. */
{
  const f18 = X._grossUpFactor('Expedia', 'alfani');
  ok(Math.abs(575.52 * f18 - 690.37) < 0.02,
     'il recupero riproduce la prenotazione reale di Alfani', (575.52 * f18).toFixed(2) + ' invece di 690,37');
  ok(Math.abs(f18 - 1.1996) < 0.0005, 'il fattore Expedia e 1,1996 (non 1,2195)', f18.toFixed(4));
  ok(X._grossUpFactor('Expedia', 'condotta') < f18, 'Condotta ha una commissione piu bassa',
     X._grossUpFactor('Expedia','condotta').toFixed(4));
  /* Booking incassa il cliente direttamente: Beddy ha gia' il lordo e
     applicare il recupero conterebbe la commissione due volte. */
  ok(X._grossUpFactor('Booking', 'alfani') === 1, 'Booking non viene ritoccato');
  ok(X._grossUpFactor('Direct', 'alfani') === 1, 'il diretto non viene ritoccato');
  for (const ch of ['Expedia','Vrbo','Ctrip'])
    ok(X._grossUpFactor(ch, 'alfani') > 1, ch + ' viene riportato al lordo');

  /* Ctrip lavora a "net rate": la tariffa che vedi e' quella che resta a te e
     la commissione si prende su tutto, IVA compresa. Formula diversa da
     Expedia a parita' di percentuale. Verificato sulla prenotazione reale:
     payout 523,75 → cliente 638,72, commissione dichiarata 114,95. */
  const fc = X._grossUpFactor('Ctrip', 'alfani');
  ok(Math.abs(523.75 * fc - 638.72) < 0.05, 'il recupero Ctrip riproduce la prenotazione reale',
     (523.75 * fc).toFixed(2) + ' invece di 638,72');
  ok(Math.abs((523.75 * fc - 523.75) - 114.95) < 0.05, 'e la commissione dichiarata',
     (523.75 * fc - 523.75).toFixed(2) + ' invece di 114,95');
  ok(Math.abs(fc - 1/0.82) < 0.0005, 'Ctrip usa 1/(1-c), non la formula di Expedia', fc.toFixed(4));
  ok(fc > X._grossUpFactor('Expedia', 'alfani'),
     'a parita di percentuale Ctrip recupera piu di Expedia, perche commissiona anche l IVA');
  ok(X._grossUpFactor('Ctrip', 'firenze') < fc, 'Ctrip e al 15% fuori da Alfani',
     X._grossUpFactor('Ctrip','firenze').toFixed(4));

  /* Airbnb registra gia' il lordo: il "room fee" di Beddy e' esattamente
     quello che il cliente paga per la camera, e la commissione te la
     trattengono dopo. Verificato: Beddy 179 = room fee Airbnb 179. */
  ok(X._grossUpFactor('Airbnb', 'nazionale') === 1, 'Airbnb non viene ritoccato: Beddy ha gia il lordo',
     X._grossUpFactor('Airbnb','nazionale'));

  /* Hotel Collect: il cliente paga in struttura, quindi il dato e' gia' lordo
     anche se il canale e' Expedia. Nessun campo dell'export le distingue, per
     questo esiste un elenco di riferimenti. */
  ok(X._grossUpFactor('Expedia', 'alfani', 'D0DC06D1DC') === 1,
     'una prenotazione Hotel Collect non viene ritoccata');
  ok(X._grossUpFactor('Expedia', 'alfani', 'NONESISTE') > 1,
     'mentre una Expedia normale si');
}

/* --- LE NOTE DEVONO DIRE LA VERITA ------------------------------------- */
/* Le descrizioni erano rimaste ai vecchi fattori: dicevano Airbnb +15,5% e
   Expedia ÷0,82 quando il codice faceva gia' altro. Una nota sbagliata e'
   peggio di nessuna nota, perche' viene creduta. */
{
  const src = require('fs').readFileSync(__dirname + '/engine.js', 'utf8')
            + require('fs').readFileSync(__dirname + '/index.html', 'utf8');
  for (const vecchio of ['÷0.82', '÷0.845', '÷0.85', 'Airbnb +15.5%', 'Ctrip +15%', 'Expedia 17%', 'Booking 13%'])
    ok(src.indexOf(vecchio) === -1, 'nessun testo cita piu "' + vecchio + '"');
  ok(/Expedia Hotel Collect|Hotel Collect/.test(src), 'le note nominano Hotel Collect');
  ok(/1\.1996/.test(src) && /1\.2195/.test(src), 'e i fattori attuali');
}
fine();

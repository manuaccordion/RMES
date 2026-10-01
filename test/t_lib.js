/* ===========================================================================
   BASE COMUNE DEI TEST
   Ogni test caricava la dashboard con quaranta righe di impalcatura copiate:
   quando una cosa cambiava (il prompt del nome utente, i tooltip pigri, la
   tabella in due blocchi) andavano corrette in trentotto file. Qui sta una
   volta sola.
   Uso:  const T = require('./t_lib');  const {w, X, ok, fine} = T.boot(['fp_getFloor', ...]);
   =========================================================================== */
const fs = require('fs');
const { JSDOM } = require('jsdom');
const P = __dirname + '/';

function boot(exports_, opts){
  opts = opts || {};
  const html = fs.readFileSync(P + 'index.html', 'utf8')
    .replace(/<script[^>]*src=["']https?:[^"']*["'][^>]*><\/script>/g, '')
    .replace(/<script[^>]*src=["'](data|engine)\.js["'][^>]*><\/script>/g, '');
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
  const w = dom.window;
  w.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
  w.alert = () => {};
  w.confirm = () => true;            // i test accettano le conferme
  w.prompt = () => '1';              // la dashboard chiede chi sta usando
  w.fetch = () => Promise.reject(new Error('offline'));
  w.matchMedia = w.matchMedia || (() => ({ matches:false, addListener(){}, removeListener(){},
                                           addEventListener(){}, removeEventListener(){} }));
  /* Gli errori che il codice cattura e stampa vanno raccolti: piu' di una
     volta un pezzo di interfaccia e' sparito senza che nulla lo segnalasse. */
  const errs = [];
  w.console.error = (...a) => errs.push(a.map(x => (x && x.message) ? x.message : String(x)).join(' '));

  const names = ['EMBEDDED_CSV', 'EVENTS_CSV'].concat(exports_ || []);
  const expr = names.map(n => {
    if (n === 'BOOKINGS' || n === 'TODAY' || n === 'CFG') return 'get ' + n + '(){return ' + n + '}';
    return n;
  }).join(',');
  w.eval(fs.readFileSync(P + 'data.js', 'utf8') + '\n;\n'
       + fs.readFileSync(P + 'engine.js', 'utf8')
       + '\n;window.__X={' + expr + '};');
  const X = w.__X;
  w.loadData(X.EMBEDDED_CSV);
  if (X.EVENTS_CSV && typeof w.loadEvents === 'function') w.loadEvents(X.EVENTS_CSV);
  try { w.fp_postLoadHook(); } catch(e){}
  // La tabella entra in due blocchi: i test la leggono subito, quindi tutta in una volta.
  w.__RMES_SYNC_RENDER = true;
  if (opts.struct) w.CURRENT_STRUCT = opts.struct;

  let pass = 0, fail = 0;
  const ok = (cond, msg, detail) => {
    if (cond){ pass++; console.log('OK   ' + msg); }
    else { fail++; console.log('FAIL ' + msg + (detail != null ? '  → ' + detail : '')); }
  };
  const info = (...a) => console.log('     ' + a.join(' '));
  const fine = () => {
    const swallowed = errs.filter(e => !/offline/.test(e));
    if (swallowed.length){
      fail++;
      console.log('FAIL errori catturati e nascosti dal codice  → ' + swallowed.slice(0,2).join(' | '));
    }
    console.log('--- ' + pass + ' ok, ' + fail + ' falliti');
    if (fail) process.exitCode = 1;
  };
  return { w, X, D: w.document, ok, info, fine, errs };
}

/* Scorciatoie usate da piu' test. */
const IDS = ['firenze', 'condotta', 'alfani', 'davids'];
const ymdOf = d => d.getFullYear()*10000 + (d.getMonth()+1)*100 + d.getDate();
const isoOf = k => String(k).slice(0,4) + '-' + String(k).slice(4,6) + '-' + String(k).slice(6,8);
const median = a => { a = a.filter(x => isFinite(x)).sort((x,y) => x-y); return a.length ? a[a.length>>1] : null; };

module.exports = { boot, IDS, ymdOf, isoOf, median, P };

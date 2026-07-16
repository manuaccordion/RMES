// cleaning.js — logica UNICA della 16ª colonna "cleaning" dello schema slim EMBEDDED_CSV.
// La usano SIA i build (build_freeze.js / build_merge6.js) SIA il post-processore add_cleaning.js,
// così la regola vive in un solo posto.
//
// REGOLA A TRE FASCE (solo Struttura ∈ {Nazionale 35 Apartments, Porte Nuove Apartments} E Canale == "Airbnb"),
// sulla DATA DI PRENOTAZIONE ("Data/ora prenotazione", NON la data soggiorno):
//   <= 07/07/2026            -> cleaning = 40, Totale INVARIATO (storico: già = sola camera).
//   08/07/2026 - 15/07/2026  -> cleaning = 30, Totale -= 30 (Beddy include la pulizia nel Totale).
//   >= 16/07/2026            -> cleaning = 0,  Totale INVARIATO (Airbnb non applica più la cleaning fee:
//                               il Totale grezzo è già sola camera, quindi NON si sottrae nulla).
//   Tutte le altre righe     -> cleaning = 0,  Totale invariato.
'use strict';

const TARGET_STRUCTS = new Set(['Nazionale 35 Apartments', 'Porte Nuove Apartments']);
const CUTOFF_YMD = '2026-07-07';     // <= questa data => cleaning 40 (storico)
const CUTOFF_NO_FEE_YMD = '2026-07-16'; // >= questa data => cleaning 0 (Airbnb non addebita più la pulizia)

// "dd/MM/yyyy [HH:mm]" -> "yyyy-mm-dd" (o null)
function bookYmd(s) {
  if (!s) return null;
  const m = String(s).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

// Ritorna { cleaning, totale } per una riga. `totaleStr` in ingresso è il Totale corrente (stringa/num).
// `totale` in uscita è il Totale (eventualmente decurtato di 30) come stringa.
function cleaningFor(struttura, canale, bookDateStr, totaleStr) {
  const strut = (struttura || '').trim();
  const canal = (canale || '').trim();
  const totOut = (totaleStr == null) ? '' : String(totaleStr);
  const isTarget = TARGET_STRUCTS.has(strut) && canal === 'Airbnb';
  if (!isTarget) return { cleaning: '0', totale: totOut };

  const ymd = bookYmd(bookDateStr);
  if (!ymd) return { cleaning: '0', totale: totOut }; // Airbnb target senza data: prudente, cleaning 0

  if (ymd <= CUTOFF_YMD) {
    return { cleaning: '40', totale: totOut }; // storico: Totale già = camera
  }
  if (ymd >= CUTOFF_NO_FEE_YMD) {
    return { cleaning: '0', totale: totOut }; // Airbnb non addebita più la pulizia: Totale già = camera
  }
  // 08/07/2026 - 15/07/2026: Beddy mette camera+30 nel Totale -> togli la pulizia dal Totale
  const tot = parseFloat(totOut.replace(',', '.'));
  const newTot = isNaN(tot) ? totOut : String(Math.round((tot - 30) * 100) / 100);
  return { cleaning: '30', totale: newTot };
}

// Aggiunge in-place la 16ª colonna "cleaning" a una matrice di righe slim.
//   rows[0] = header (15 col) -> gli si appende "cleaning".
//   rows[1..] = righe dati (array posizionali slim) -> a ognuna si appende il cleaning e si aggiorna il Totale.
// Indici di default = ordine SLIM_HEADER; sovrascrivibili via opts (per header quotati/riordinati).
function addCleaningColumn(rows, opts) {
  opts = opts || {};
  const iBook   = opts.iBook   != null ? opts.iBook   : 1;
  const iCanale = opts.iCanale != null ? opts.iCanale : 3;
  const iTot    = opts.iTot    != null ? opts.iTot    : 10;
  const iStrut  = opts.iStrut  != null ? opts.iStrut  : 11;
  const stats = { c40: 0, c30: 0, c0nofee: 0, zero: 0, noDate: 0 };
  if (!rows.length) return stats;

  // idempotenza: se "cleaning" è già l'ultima colonna dell'header, non ri-applicare (eviterebbe un doppio -30)
  const hdr = rows[0];
  if (hdr[hdr.length - 1] === 'cleaning') return stats;
  hdr.push('cleaning');

  for (let k = 1; k < rows.length; k++) {
    const r = rows[k];
    // riga vuota (artefatto: linea blank nel CSV) -> lasciala com'è, niente colonna cleaning
    if (r.length <= 1 && (r[0] == null || r[0] === '')) continue;
    const res = cleaningFor(r[iStrut], r[iCanale], r[iBook], r[iTot]);
    r[iTot] = res.totale;
    r.push(res.cleaning);
    if (res.cleaning === '40') stats.c40++;
    else if (res.cleaning === '30') stats.c30++;
    else {
      const isTarget = TARGET_STRUCTS.has((r[iStrut] || '').trim()) && (r[iCanale] || '').trim() === 'Airbnb';
      if (isTarget) {
        const b = bookYmd(r[iBook]);
        if (!b) stats.noDate++;
        else if (b >= CUTOFF_NO_FEE_YMD) stats.c0nofee++; // terza fascia: Airbnb senza cleaning fee
      }
      stats.zero++;
    }
  }
  return stats;
}

module.exports = { TARGET_STRUCTS, CUTOFF_YMD, bookYmd, cleaningFor, addCleaningColumn };

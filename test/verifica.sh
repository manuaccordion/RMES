#!/bin/bash
# =============================================================================
# LANCIA TUTTI I CONTROLLI
#   ./verifica.sh          tutto
#   ./verifica.sh audit    solo gli audit (piu' veloci)
#
# I file di test vanno tenuti nel repo insieme al codice: la volta scorsa
# vivevano solo nella cartella di lavoro e un azzeramento dell'ambiente li ha
# cancellati tutti.
# =============================================================================
cd "$(dirname "$0")" || exit 1
NODE="node --max-old-space-size=6144"
# I file NON si elencano a mano: si cercano. Elencandoli, un file di test nuovo
# che arriva nella cartella non viene eseguito e nessuno se ne accorge - e'
# successo con t_cfgsync.js, 52 controlli rimasti fermi per giorni senza un
# rosso. t_lib.js e' la base comune, non un test.
if [ "$1" = "audit" ]; then
  FILES=$(ls audit*.js 2>/dev/null | tr '\n' ' ')
else
  FILES=$(ls audit*.js t_*.js 2>/dev/null | grep -v '^t_lib\.js$' | tr '\n' ' ')
fi
[ -z "$FILES" ] && { echo "  nessun file di test trovato in $(pwd)"; exit 1; }

tot_ok=0; tot_ko=0; rotti=""
for f in $FILES; do
  [ -f "$f" ] || continue
  out=$(timeout 300 $NODE "$f" 2>&1)
  riga=$(echo "$out" | grep -E "^--- " | tail -1)
  n_ok=$(echo "$riga"  | grep -oE "[0-9]+ ok"      | grep -oE "[0-9]+")
  n_ko=$(echo "$riga"  | grep -oE "[0-9]+ falliti" | grep -oE "[0-9]+")
  [ -z "$n_ok" ] && { printf "  %-16s NON COMPLETATO\n" "$f"; rotti="$rotti $f"; continue; }
  tot_ok=$((tot_ok + n_ok)); tot_ko=$((tot_ko + n_ko))
  if [ "$n_ko" -gt 0 ]; then
    printf "  %-16s %3s ok · %s FALLITI\n" "$f" "$n_ok" "$n_ko"
    echo "$out" | grep "^FAIL" | sed 's/^/      /'
  else
    printf "  %-16s %3s ok\n" "$f" "$n_ok"
  fi
done

echo "  ────────────────────────────────"
if [ "$tot_ko" -eq 0 ] && [ -z "$rotti" ]; then
  echo "  ✅ $tot_ok controlli, tutti verdi"
else
  echo "  ⚠  $tot_ok verdi · $tot_ko falliti$([ -n "$rotti" ] && echo " · non completati:$rotti")"
  exit 1
fi

#!/usr/bin/env bash
# =============================================================================
# rmes_auto_update.sh  —  aggiornamento giornaliero automatico di data.js
#
# Ogni giorno:
#  1. SPOSTA da Download a RMES i soli report che servono (per nome),
#     sostituendo le versioni vecchie. Gli altri file in Download non si toccano.
#  2. Se ci sono report nuovi -> lancia Claude Code (headless) col prompt v3.
#     Se non c'e' niente di nuovo -> esce senza fare nulla.
#  3. Claude fa da solo commit + push + mail (pickup, o alert se bloccante).
# =============================================================================

set -uo pipefail

# ----------------------------- CONFIG (verifica) -----------------------------
DOWNLOADS="/mnt/c/Users/manu1/Downloads"    # cartella Download di Windows
RMES_INPUT="/mnt/g/My Drive/RMES"           # cartella report (Google Drive)
PROJECT_DIR="$HOME/RMES"                     # repo WSL: build script + data.js + git
PROMPT_FILE="$PROJECT_DIR/rmes_daily_prompt.txt"
SETTLE_MIN=1                                 # non spostare file toccati da meno di N min (ancora in download)
BEDDY_MIN_MASTER=800000                       # byte: soglia MASTER Beddy (~1.6MB) vs Alfani (~300KB)
MAILTO="manuaccordion@gmail.com"             # alert SOLO se Claude crasha (serve 'mail'/msmtp)
# CLAUDE_MODEL=""                            # es. "opus" per fissare il modello; vuoto = default

# Stato/log
STATE_DIR="$HOME/.rmes_auto"
MARKER="$STATE_DIR/last_run"                 # timestamp dell'ultimo aggiornamento RIUSCITO
LOG_DIR="$STATE_DIR/logs"

# ----------------------------- Ambiente per cron -----------------------------
export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
# se 'claude' e' altrove, aggiungilo qui, es: export PATH="$HOME/.npm-global/bin:$PATH"

# ----------------------------------------------------------------------------
DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1

mkdir -p "$STATE_DIR" "$LOG_DIR"
TS="$(date +%Y%m%d_%H%M%S)"
LOG="$LOG_DIR/run_$TS.log"
STATUS_FILE="$STATE_DIR/last_status.txt"
TODAY="$(date +%F)"
COLLECTED=0

# Considera SOLO i download nuovi: piu' recenti dell'ultimo aggiornamento riuscito
# (al primissimo giro, senza marker: solo quelli di oggi). Cosi' lo storico in
# Download viene ignorato e restano intatti.
if [ -f "$MARKER" ]; then DL_NEW=(-newer "$MARKER"); else DL_NEW=(-newermt "today 00:00"); fi

log() { echo "[$(date '+%F %T')] $*" | tee -a "$LOG"; }

# alert tecnico SOLO a $MAILTO (via msmtp, lo stesso della mail pickup; fallback 'mail')
# $1 = oggetto   $2 = testo introduttivo   (in coda: ultime 60 righe del log)
send_alert() {
  local subj="$1" body="$2"
  if command -v msmtp >/dev/null 2>&1; then
    { printf "From: RMES Dashboard <%s>\nTo: %s\nSubject: %s\nContent-Type: text/plain; charset=UTF-8\n\n" "$MAILTO" "$MAILTO" "$subj"
      printf "%s\n\n--- ultime righe del log (%s) ---\n" "$body" "$LOG"; tail -n 60 "$LOG"; } \
      | msmtp "$MAILTO" 2>>"$LOG" && log "Alert email inviato a $MAILTO." || log "Impossibile inviare l'alert email."
  elif command -v mail >/dev/null 2>&1; then
    { echo "$body"; echo; tail -n 60 "$LOG"; } | mail -s "$subj" "$MAILTO" 2>/dev/null \
      && log "Alert email inviato a $MAILTO." || log "Impossibile inviare l'alert email."
  else
    log "Né msmtp né mail disponibili: alert solo su log e su $STATUS_FILE."
  fi
}

fail_alert() {
  local msg="$1"
  log "✗ $msg"
  { echo "FAILED $TODAY $(date '+%T')"; echo "$msg"; echo "--- log ---"; tail -n 60 "$LOG"; } > "$STATUS_FILE"
  send_alert "⚠ RMES auto-update FALLITO ($TODAY)" "$msg"
}

find_reports() {
  find "$RMES_INPUT" -maxdepth 1 -type f \
    \( -iname 'elenco_prenotazioni*.csv' \
       -o -iname 'Prenotazioni_1_*.xlsx' \
       -o -iname 'expedia_revenue_management_*.xlsx' \
       -o -iname 'rateFuture_next_180_days*.csv' \) \
    "$@" 2>/dev/null
}

# sposta i candidati di UNO "slot" da Download a RMES (piu' vecchio->piu' nuovo),
# cancellando prima le versioni vecchie della stessa famiglia -> sopravvive il piu' recente.
# $1 = glob in Download   $2 = glob "famiglia" da ripulire in RMES
move_slot() {
  local dl_glob="$1" rmes_family="$2" files=() f
  mapfile -d '' -t files < <(find "$DOWNLOADS" -maxdepth 1 -type f -iname "$dl_glob" "${DL_NEW[@]}" -mmin +"$SETTLE_MIN" -printf '%T@\t%p\0' 2>/dev/null | sort -z -n | cut -z -f2-)
  for f in "${files[@]}"; do
    find "$RMES_INPUT" -maxdepth 1 -type f -iname "$rmes_family" -delete 2>/dev/null
    if mv -f "$f" "$RMES_INPUT"/ 2>>"$LOG"; then
      log "    ← $(basename "$f")"; COLLECTED=$((COLLECTED+1))
    fi
  done
}

# Expedia: uno slot PER PROPRIETA' (per non cancellare gli altri 3 file)
move_expedia() {
  local files=() f base id
  mapfile -d '' -t files < <(find "$DOWNLOADS" -maxdepth 1 -type f -iname 'expedia_revenue_management_*.xlsx' "${DL_NEW[@]}" -mmin +"$SETTLE_MIN" -printf '%T@\t%p\0' 2>/dev/null | sort -z -n | cut -z -f2-)
  for f in "${files[@]}"; do
    base="$(basename "$f")"
    id="$(printf '%s' "$base" | sed -n 's/^expedia_revenue_management_\([0-9]\+\)_.*/\1/p')"
    [ -n "$id" ] && find "$RMES_INPUT" -maxdepth 1 -type f -iname "expedia_revenue_management_${id}_*.xlsx" -delete 2>/dev/null
    if mv -f "$f" "$RMES_INPUT"/ 2>>"$LOG"; then
      log "    ← $base"; COLLECTED=$((COLLECTED+1))
    fi
  done
}

# Beddy sono DUE file distinti (entrambi elenco_prenotazioni*.csv): il MASTER grande
# (colonna Struttura, ~1.6MB) e l'ALFANI piccolo (~300KB). Vanno tenuti ENTRAMBI.
# Li distinguo per dimensione e li sostituisco separatamente (mai cancellare uno per l'altro).
move_beddy() {
  local f sz t master="" tm=0 alfani="" ta=0
  while IFS= read -r -d '' f; do
    sz="$(stat -c %s "$f")"; t="$(stat -c %Y "$f")"
    if [ "$sz" -ge "$BEDDY_MIN_MASTER" ]; then
      [ "$t" -gt "$tm" ] && { tm="$t"; master="$f"; }
    else
      [ "$t" -gt "$ta" ] && { ta="$t"; alfani="$f"; }
    fi
  done < <(find "$DOWNLOADS" -maxdepth 1 -type f -iname 'elenco_prenotazioni*.csv' "${DL_NEW[@]}" -mmin +"$SETTLE_MIN" -print0 2>/dev/null)

  if [ -n "$master" ]; then
    while IFS= read -r -d '' f; do [ "$(stat -c %s "$f")" -ge "$BEDDY_MIN_MASTER" ] && rm -f "$f"; done \
      < <(find "$RMES_INPUT" -maxdepth 1 -type f -iname 'elenco_prenotazioni*.csv' -print0 2>/dev/null)
    mv -f "$master" "$RMES_INPUT"/ 2>>"$LOG" && { log "    ← $(basename "$master") [Beddy MASTER]"; COLLECTED=$((COLLECTED+1)); }
  fi
  if [ -n "$alfani" ]; then
    while IFS= read -r -d '' f; do [ "$(stat -c %s "$f")" -lt "$BEDDY_MIN_MASTER" ] && rm -f "$f"; done \
      < <(find "$RMES_INPUT" -maxdepth 1 -type f -iname 'elenco_prenotazioni*.csv' -print0 2>/dev/null)
    mv -f "$alfani" "$RMES_INPUT"/ 2>>"$LOG" && { log "    ← $(basename "$alfani") [Beddy Alfani]"; COLLECTED=$((COLLECTED+1)); }
  fi
}

collect_from_downloads() {
  if [ ! -d "$DOWNLOADS" ]; then
    log "Cartella Download non trovata ($DOWNLOADS): salto la raccolta."; return
  fi
  log "Raccolgo i report da Download → RMES (sostituendo i vecchi)..."
  move_expedia
  move_beddy
  move_slot 'Prenotazioni_1_*.xlsx'         'Prenotazioni_1_*.xlsx'
  move_slot 'rateFuture_next_180_days*.csv' 'rateFuture_next_180_days*.csv'
  log "Report spostati da Download: $COLLECTED"
}

# ============================================================================
log "=== RMES auto-update avviato (dry-run=$DRY_RUN) ==="

if [ ! -d "$RMES_INPUT" ]; then
  fail_alert "Cartella RMES non trovata: $RMES_INPUT (Google Drive montato? WSL avviato?)"; exit 1
fi

# 1. Raccolta da Download (in dry-run NON sposta niente)
if [ "$DRY_RUN" = "1" ]; then
  log "DRY-RUN: mostro cosa sposterei da Download (senza spostare):"
  find "$DOWNLOADS" -maxdepth 1 -type f \
    \( -iname 'elenco_prenotazioni*.csv' -o -iname 'Prenotazioni_1_*.xlsx' \
       -o -iname 'expedia_revenue_management_*.xlsx' -o -iname 'rateFuture_next_180_days*.csv' \) \
    "${DL_NEW[@]}" -mmin +"$SETTLE_MIN" -printf '    ← %f\n' 2>/dev/null | tee -a "$LOG"
else
  collect_from_downloads
fi

# 2. Ci sono report NUOVI? (o abbiamo appena spostato qualcosa)
if [ -f "$MARKER" ]; then NEW="$(find_reports -newer "$MARKER")"; else NEW="$(find_reports)"; fi

if [ "$COLLECTED" -eq 0 ] && [ -z "$NEW" ]; then
  log "Nessun report nuovo (niente da Download, niente di nuovo in RMES). Esco."
  echo "SKIP $TODAY $(date '+%T') — nessun file nuovo" > "$STATUS_FILE"
  exit 0
fi

[ -n "$NEW" ] && { log "Report presenti/nuovi in RMES:"; echo "$NEW" | sed 's/^/    /' | tee -a "$LOG"; }

if [ "$DRY_RUN" = "1" ]; then
  log "DRY-RUN: mi fermo qui. Avrei spostato i file e lanciato Claude Code. Nessuna modifica fatta."
  exit 0
fi

# 3. Prerequisiti
command -v claude >/dev/null 2>&1 || { fail_alert "Comando 'claude' non trovato nel PATH del cron."; exit 1; }
[ -f "$PROMPT_FILE" ] || { fail_alert "Prompt non trovato: $PROMPT_FILE"; exit 1; }
cd "$PROJECT_DIR" || { fail_alert "PROJECT_DIR non trovata: $PROJECT_DIR"; exit 1; }

# Allinea il repo all'ultima versione (utile se il codice viene pubblicato da un'altra macchina)
log "Allineo il repo (git pull)..."
if ! git pull --rebase --autostash >> "$LOG" 2>&1; then
  # Mai lasciare il repo a meta' rebase con i marker <<<<<<< dentro engine.js/index.html:
  # annullo (l'abort ripristina anche l'autostash) e lascio decidere a Claude Code.
  if [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ]; then
    git rebase --abort >> "$LOG" 2>&1 && log "⚠ git pull in conflitto: rebase annullato, repo tornato com'era." \
      || log "⚠ git pull in conflitto e 'git rebase --abort' fallito: controlla il repo."
  else
    log "git pull non riuscito (continuo comunque)."
  fi
fi

# 4. Claude Code headless col prompt giornaliero
log "Avvio Claude Code (headless) da $PROJECT_DIR ..."
MODEL_ARG=()
[ -n "${CLAUDE_MODEL:-}" ] && MODEL_ARG=(--model "$CLAUDE_MODEL")

claude -p "$(cat "$PROMPT_FILE")" \
  --dangerously-skip-permissions \
  --add-dir "$RMES_INPUT" \
  "${MODEL_ARG[@]}" \
  >> "$LOG" 2>&1
CC_EXIT=$?
log "Claude Code exit code: $CC_EXIT"

# 5. Esito REALE: considero "aggiornato" solo se esiste un commit "data update <oggi>".
if [ "$CC_EXIT" -eq 0 ]; then
  LAST_MSG="$(git log -1 --pretty=%s 2>/dev/null)"
  if printf '%s' "$LAST_MSG" | grep -q "data update $TODAY"; then
    UP="$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || true)"
    if [ -n "$UP" ] && [ "$(git rev-parse HEAD 2>/dev/null)" != "$(git rev-parse @{u} 2>/dev/null)" ]; then
      log "Commit locale non allineato a origin: provo il push..."
      git push >> "$LOG" 2>&1 && log "Push ok." || log "⚠ push fallito (controlla il log)."
    fi
    log "✓ Aggiornato e pubblicato: '$LAST_MSG'."
    echo "DONE $TODAY $(date '+%T') — $LAST_MSG" > "$STATUS_FILE"
    touch "$MARKER"
    exit 0
  else
    # Claude e' uscito senza pubblicare: o dati mancanti/ALERT (ha gia' mandato la mail lui),
    # o nessuna modifica. NON avanzo il marker: ritentera' quando arrivano i file giusti.
    log "⚠ NON aggiornato: nessun nuovo 'data update $TODAY'. Ultimo commit resta '$LAST_MSG'. Motivo nel testo di Claude qui sopra (file mancanti, dati corrotti, permessi, conflitti git...)."
    echo "NO-UPDATE $TODAY $(date '+%T') — nessun nuovo commit; ultimo: $LAST_MSG" > "$STATUS_FILE"
    send_alert "⚠ RMES: report nuovi ma dashboard NON aggiornata ($TODAY)" \
      "C'erano report nuovi ma Claude Code non ha pubblicato. Il motivo è nel log qui sotto."
    exit 0
  fi
else
  fail_alert "Claude Code terminato con errore (exit $CC_EXIT): probabile crash / timeout / login scaduto. Controlla il log."
  exit 1
fi

# Controlli automatici della dashboard

## A cosa servono

Verificano il codice prima della pubblicazione. Trovano cose che a schermo non
si vedono: un prezzo che parte dal numero sbagliato, una cella che ha smesso di
essere cliccabile, un pezzo di pagina che resta vuoto senza errori.

In una sola sessione hanno intercettato: l'ancora sull'ultimo venduto che
contava due volte la stessa prenotazione, una virgoletta mancante che rendeva
**nessuna** cella cliccabile, tre variabili rimaste fuori portata dopo un
riordino, e un confronto che faceva apparire ogni mese futuro a −80%.

## Dove vanno tenuti

**Nel repo, insieme al codice.** La prima versione viveva solo nella cartella
di lavoro e un azzeramento dell'ambiente l'ha cancellata: trentotto file e
cinque audit persi in un colpo. Da qui in poi stanno accanto a `engine.js`.

## Come si lanciano

Servono `data.js`, `engine.js`, `index.html` nella stessa cartella, e jsdom:

```
npm install jsdom
./verifica.sh            tutti i controlli
./verifica.sh audit      solo gli audit, piu' rapidi
```

L'esito è una riga sola:

```
  audit.js          11 ok
  audit2.js         49 ok
  audit3.js         41 ok
  t_features.js     46 ok
  ────────────────────────────────
  ✅ 147 controlli, tutti verdi
```

Se qualcosa fallisce, stampa quale controllo e con quali numeri.

## Cosa copre

**audit.js** — il prezzo parte sempre dal Base Price. Per ogni struttura e 90
date verifica che il suggerito sia `Base × segnali × last minute × evento`,
che caricare un prezzo qualsiasi non lo sposti, e che il pavimento non si
buchi mai.

**audit2.js** — configurazione e costanti: niente congelamento, il pavimento
come tariffa più bassa, i markup nei loro tre pezzi, le dieci fasce del last
minute, la coerenza fra half-life e finestra.

**audit3.js** — l'interfaccia si disegna davvero: tutte le tab su tutte e sei
le strutture, i contenitori non restano vuoti, ogni riga ha la sua cella
cliccabile, il modal mostra sempre tutte e sei le righe.

**t_features.js** — le funzioni aggiunte di recente: analisi del mese, copia
delle regole (che non deve toccare pavimenti e ancoraggi), salvataggio del
last minute, filtro dei puntini rossi.

## Aggiungerne

`t_lib.js` contiene l'impalcatura comune. Un test nuovo comincia così:

```js
const T = require('./t_lib');
const { w, X, D, ok, info, fine } = T.boot(['nomeFunzione', 'CFG']);
ok(condizione, 'cosa si sta verificando', dettaglioSeFallisce);
fine();
```

Scrivere il messaggio di `ok()` in modo che si capisca **cosa** era sbagliato,
non solo che qualcosa lo era.

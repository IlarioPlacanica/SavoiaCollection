# SavoiaCollection

Landing page statica (HTML + CSS + JS, nessuna build) per Savoia Collection.

## Struttura

| File | Ruolo |
| --- | --- |
| `index.html` | Markup della pagina |
| `css.css` | Layout editoriale + "MOTION LAYER" in fondo al file |
| `script.js` | Interazioni e motion design (GSAP + ScrollTrigger + Lenis) |
| `assets/img/` | Immagini ottimizzate per il web (max 1800 px, JPEG progressivo). Gli originali ad alta risoluzione restano nella cronologia git (tag `checkpoint-pre-motion-2026-11-18`) |

Le librerie sono caricate da CDN (jsDelivr) con versione fissata:
`gsap@3.12.5`, `ScrollTrigger@3.12.5`, `lenis@1.1.18`.
Se il CDN non è raggiungibile, o se l'utente ha attivato "riduci movimento",
il sito funziona comunque con il comportamento originale (reveal semplici,
accordion e carousel funzionanti).

## Avvio in locale

Serve un qualsiasi server statico (aprire il file con doppio clic funziona,
ma un server evita problemi con i percorsi):

```bash
npx serve .
```

oppure

```bash
python -m http.server 8000
```

## Pubblicazione

Il sito è statico: basta pubblicare la cartella così com'è
(GitHub Pages, Netlify, Vercel, qualsiasi hosting). Su GitHub Pages:
Settings → Pages → Branch `main`, cartella `/ (root)`.

## Rigenerare le immagini ottimizzate

Prima di aggiungere nuove foto in `assets/img/`, ottimizzale
(es. con [squoosh](https://squoosh.app) o `sharp`): larghezza massima ~1800 px,
JPEG qualità ~80.

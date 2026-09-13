# Deploy (static + PWA)

## Build local

```bash
npm test
npm run build
```

Ieșire: `dist/` (HTML/JS/CSS + `public/` copiat, inclusiv `/packs` și `/content-packs`).

## Cloudflare Pages (recomandat, fără domeniu propriu)

Primești HTTPS pe un URL tip `https://bible-true-false.pages.dev`.

### Varianta A — conectezi repo GitHub (CI la fiecare push)

1. Push pe GitHub (repo-ul acestui proiect).
2. [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Alege repo-ul → setări:
   - **Framework preset:** Vite (sau None)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** 20 (Environment variables → `NODE_VERSION` = `20` dacă e nevoie)
4. **Save and Deploy**.
5. Deschide URL-ul `*.pages.dev` pe telefon → Add to Home Screen.

### Varianta B — deploy din terminal (Wrangler)

```bash
npx wrangler login          # o dată — deschide browser Cloudflare
npm run deploy:cf           # build + upload dist/
```

Proiectul Pages se numește `bible-true-false` (vezi scriptul din `package.json`).

## Web Analytics (trafic, fără cookie, fără Google)

Cloudflare Web Analytics: page views, vizitatori unici (aprox.), țară, device, referrer. Nu e Google Analytics și nu pune cookie.

```bash
npm run analytics:enable
```

Dacă token-ul de deploy n-are dreptul *Account Settings Write*, pornești din dashboard (un click):

1. [Workers & Pages](https://dash.cloudflare.com/) → proiectul `bible-true-false` → **Metrics** → **Enable** la Web Analytics.
2. Graficele: dashboard → **Web Analytics**.
3. `npm run deploy:cf` — Pages injectează beacon-ul în HTML la deploy (pagina trebuie să rămână HTML valid: `index.html` deja e).

`*.pages.dev` și (când îl lipim) `mishak.ro` raportează în același loc.

### Funnel de joc (4 evenimente)

Nu e tracking de reclame. App-ul trimite:

| Eveniment | Când |
|-----------|------|
| `page_open` | s-a deschis app-ul |
| `setup_complete` | amândoi au ales culoarea (jocul pornește) |
| `round_end` | s-a terminat o rundă (`/e/round_end/1` … `/3`) |
| `game_end` | ecranul final |

Până e Zaraz pe domeniu, aceleași nume apar în Web Analytics → **Top pages** ca `/e/setup_complete`, `/e/round_end/…`, `/e/game_end`. `page_open` e vizita obișnuită (`/`). Când pornești Zaraz, `zaraz.track` e deja apelat cu aceleași nume.

Raportul util: câte `setup_complete` la 100 de vizite.

## Zaraz (un dashboard, după `mishak.ro`)

Zaraz **nu pornește pe** `*.pages.dev`. Cloudflare cere un **domeniu custom** pe zonă orange-cloud, lipit de Pages. Contul acum nu are nicio zonă DNS.

Când ai `mishak.ro`:

1. Adaugă domeniul în Cloudflare (nameservere Rotld → Cloudflare) și **Proxy** (nor portocaliu).
2. Pages → `bible-true-false` → **Custom domains** → `mishak.ro` (și `www`).
3. Zona `mishak.ro` → **Zaraz** → Tag setup:
   - Auto-inject script: **on**
   - Single Page Application: **on**
   - **Monitoring**: on (Events / Triggers — funnel-ul de joc)
4. Triggers (Variable = **Event Name**, Equals):

   | Trigger | Match |
   |---------|--------|
   | Page open | `page_open` |
   | Setup complete | `setup_complete` |
   | Round end | `round_end` |
   | Game end | `game_end` |

5. Nu adăuga Google / Meta / pixeli. App-ul apelează deja `zaraz.track` cu numele de mai sus; când Zaraz e injectat, nu mai schimbă URL-ul (`/e/...` e doar fallback-ul de pe pages.dev).

Web Analytics rămâne pentru țară / device / referrer. Zaraz Monitoring e pentru cele 4 evenimente. Totul e tot Cloudflare.

## Alte host-uri

Netlify / Vercel: același `npm run build`, output `dist`, HTTPS pe subdomeniu gratuit.

## PWA

Configurat cu `vite-plugin-pwa` în [`vite.config.ts`](../vite.config.ts):

- Instalabil pe telefon („Add to Home Screen”)
- Cache shell + cache runtime pentru `/packs/*` (MP3-uri la cerere)

## Free vs full pe producție

Implicit doar `free-start` (**30** întrebări = 3 runde × 10). Deblocare QA (nu e plată):

```
https://YOUR-SUBDOMAIN.pages.dev/?unlock=batch-001
```

Vezi [`docs/monetization-packs.md`](monetization-packs.md) și [`docs/ship-checklist.md`](ship-checklist.md).

Plățile (Stripe / IAP) = **V2**.

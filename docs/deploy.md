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

`*.pages.dev` și (când îl lipim) `mishak.ro` raportează în același loc. Asta măsoară **deschideri**, nu dacă s-a jucat o partidă.

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

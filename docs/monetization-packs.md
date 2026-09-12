# Monetizare & pack-uri modulare

## Shell vs conținut

| Strat | Rol | Unde |
|-------|-----|------|
| **Game shell** | UI, FSM, audio player, scor, runde | `src/` |
| **Asset pack** | VO, feedback, SFX, fișiere MP3 întrebări | `public/packs/demo-v1/` |
| **Content packs** | Ce întrebări sunt disponibile (free / unlock) | `public/content-packs/` + [`catalog.json`](../public/content-packs/catalog.json) |
| **Entitlements** | Ce pack-uri are userul deblocate | `localStorage` (web) → Capacitor Preferences + IAP (store) |

```text
GameShell
   └─ loadPlayablePack()
         ├─ entitlements (free-start mereu)
         ├─ catalog (free vs unlock)
         └─ demo-v1 assets + întrebări filtrate după ID
```

## Catalog actual

| Pack ID | Tier | Conținut |
|---------|------|----------|
| `free-start` | **free** | 30 întrebări (q001–q030) — destul pentru 3 runde × 10 |
| `batch-001` | **unlock** | Toate cele 100 din batch-001 |

Free e mereu deblocat. `batch-001` se deblochează prin `entitlements.unlock('batch-001')` (web/local) sau IAP (store, mai târziu).

## Contract content pack

```json
{
  "id": "free-start",
  "title": "Start gratuit",
  "priceTier": "free",
  "questionIds": ["q001", "q002", "…"]
}
```

Unlock pack poate folosi `"allFromShell": true` ca să includă toate întrebările din manifestul `demo-v1`.

## Entitlements (web v1)

- Cheie: `btf.entitlements.v1` în `localStorage`
- API: `src/entitlements.ts` — `listUnlocked()`, `isUnlocked(id)`, `unlock(id)`, `lock(id)` (lock doar pentru debug)
- Fără conturi; pe device local

## Plăți (ulterior)

Vezi [`docs/capacitor-iap.md`](capacitor-iap.md): același shell, Capacitor + IAP; entitlement-urile se scriu după receipt valid.

## Deploy

1. `npm run build` → `dist/`
2. Host static HTTPS (Cloudflare Pages / Netlify / Vercel)
3. PWA: instalabil de pe telefon (manifest + service worker via `vite-plugin-pwa`)

## Ce se vinde ca module (exemple)

- +100 întrebări (`batch-002`, …)
- Dificultate grea / tematică
- Feature flags (ex. Runda 3) pe entitlement

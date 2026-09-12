# Ship checklist

## Gameplay (done)

- [x] R1 / R2 / R3 rules in engine
- [x] Setup: exclusive colors, no defaults
- [x] P0 recovery (audio fail, pause+timer, welcome, Din nou/Acasă)
- [x] Dev-only QA round picker (`import.meta.env.DEV`)

## Before public content claim

- [ ] Human review of `content/batch-001.json` (biblical accuracy / tone)
- [ ] Clear or keep `PLACEHOLDER` note in pack manifest after review
- [ ] Spot-check random MP3s vs `promptText`

## Deploy PWA

1. `npm run build` — confirm `dist/` OK
2. `npm test` — smoke checks pass
3. Host `dist/` on HTTPS (Cloudflare Pages / Netlify / Vercel) — see `docs/deploy.md`
4. Smoke on real iPhone Safari + Android Chrome: welcome VO, R1–R3, install PWA

## Monetization (not blocking first deploy)

| Canal | Status |
|-------|--------|
| Free 30 Q | Live via `free-start` |
| Full 100 Q | QA only: `?unlock=batch-001` (client-side; not payment) |
| Stripe / donații | Not wired — `src/purchases.ts` stub |
| Store IAP | Documented in `docs/capacitor-iap.md` — post-PWA |

**Production note:** do not advertise paid unlock until Stripe or IAP exists; remove or gate `?unlock=` if you ship a paid offer.

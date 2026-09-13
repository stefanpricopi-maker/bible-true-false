# Ship checklist

## Gameplay (done)

- [x] R1 / R2 / R3 rules in engine
- [x] Setup: exclusive colors, no defaults
- [x] P0 recovery (audio fail, pause+timer, welcome, Din nou/Acasă)
- [x] Dev-only QA round picker (`import.meta.env.DEV`)

## Before public content claim

- [x] Content review of `content/batch-001.json` (biblical accuracy / tone) — [`docs/content-review-batch-001.md`](content-review-batch-001.md)
- [x] PLACEHOLDER note updated in pack manifest after review
- [x] Spot-check regen MP3s vs `promptText` for wording edits (q002, q014, q018, q026, q032, q036, q038, q042, q050, q060, q076, q091)

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
| Donație părinți | PayPal.me on **end screen** only (`src/donate.ts`) — donor picks amount; does **not** unlock packs |
| Stripe / IAP unlock | Not wired — `src/purchases.ts` stub; store later (`docs/capacitor-iap.md`) |

**Production note:** do not advertise paid unlock until Stripe or IAP exists; remove or gate `?unlock=` if you ship a paid offer. Donation is optional and separate from entitlements.

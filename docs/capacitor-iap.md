# Capacitor + IAP (store) — când monetizezi pe telefon

Nu e activ în repo încă. Același build Vite (`dist/`) se împachetează cu [Capacitor](https://capacitorjs.com/).

## De ce IAP

Pe App Store / Play, conținutul digital deblocat **în** aplicație (pachete de întrebări) folosește de obicei **In-App Purchase**, nu Stripe în WebView.

## Pași (când e nevoie)

1. `npm i @capacitor/core @capacitor/cli` + `npx cap init`
2. `webDir: dist` în `capacitor.config`
3. `npx cap add ios` / `android`
4. Plugin IAP (ex. `@capacitor-community/in-app-purchases` sau RevenueCat)
5. Mapare `productId` store → `content-packs` id (ex. `pack_batch_001` → `batch-001`)
6. La cumpărare reușită: `entitlements.unlock('batch-001')` (persistă în Preferences, nu doar memory)
7. Opțional: validare receipt pe un backend minimal

## Interfață în cod

`src/purchases.ts` definește `PurchasePort`:

- `web`: unlock local / viitor Stripe Checkout pe site
- `native`: implementare IAP (de adăugat când există proiectul Capacitor)

Shell-ul **nu** depinde de store — doar de entitlements + catalog.

## PWA vs store

| Canal | Plată unlock |
|-------|----------------|
| Web / PWA | Stripe (sau promo code → `unlock`) |
| App store | IAP obligatoriu pentru același tip de conținut |

# Mishak Hub

Landing / catalog pentru jocurile Mishak. v0 — fără auth.

```text
Mishak
├── Biblia · Adevărat / Fals
└── Antrenament (neoficial) Talantul în Negoț
    ├── Clasic
    └── Memorare
```

## Local

```bash
npm install
npm run dev
```

Deschide `http://localhost:5174/`.

## Linkuri

Pe **localhost**, hub-ul rescrie automat către porturile locale. Pe Pages rămân URL-urile de producție.

| Card | Local | Producție |
|------|-------|-----------|
| Biblia · Adevărat / Fals | http://localhost:5173 | https://bible-true-false.pages.dev |
| Talantul → Clasic | http://localhost:5176 | https://mishak-talantul-clasic.pages.dev |
| Talantul → Memorare | http://localhost:5175 | https://mishak-memorare.pages.dev |

```bash
# din root repo, în terminale separate:
npm run dev                                          # T/F :5173
cd mishak-hub && npm run dev                         # hub :5174
cd mishak-talantul-clasic && npm run dev              # Clasic :5176
cd mishak-memorare && npm run dev                    # Memorare :5175
```

## Deploy

```bash
npm run deploy:cf
```

Live: https://mishak-hub.pages.dev · domain țintă: `mishak.ro` (vezi [`../docs/mishak-hub.md`](../docs/mishak-hub.md)).

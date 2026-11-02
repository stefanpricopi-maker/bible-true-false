# Mishak — hub jocuri

Platformă: **Mishak**. Quiz-urile sunt **produse separate** pe același brand — nu un singur shell care înglobează toate jocurile.

## Structură produs

```text
Mishak (hub)
├── Biblia · Adevărat / Fals          ← produs independent
└── Antrenament (neoficial) Talantul în Negoț  ← familie / linie
    ├── Clasic                       ← tipuri I–V
    └── Memorare                     ← Apocalipsa 1–5
```

| Produs | Rol | Cod / URL |
|--------|-----|-----------|
| **Mishak Hub** | Landing / catalog | [`mishak-hub/`](../mishak-hub/) · https://mishak-hub.pages.dev · domain țintă: `mishak.ro` |
| **Adevărat sau Fals?** | 2 jucători, T/F audio | root · https://bible-true-false.pages.dev |
| **Talantul → Clasic** | Coop, tipuri I–V, pliant **2027** | [`mishak-talantul-clasic/`](../mishak-talantul-clasic/) · Pages: `mishak-talantul-clasic` |
| **Talantul → Memorare** | Apocalipsa 1–5, moduri pe vârstă | [`mishak-memorare/`](../mishak-memorare/) · Pages: `mishak-memorare` |

Clasic / Memorare **nu** sunt aplicațiile oficiale. Link oficial: https://talantulinnegot.com/

## Decizie de produs (locked 2026-11-01)

| Alegere | Motiv |
|---------|--------|
| Hub nou + jocuri separate | UX / FSM diferite; un shell comun forțat e mai scump |
| Nu transformăm T/F în „platforma Mishak” | Risc pe app-ul playable |
| Talantul = familie pe hub; Clasic + Memorare = apps sibling | Reflectă secțiunile concursului; deploy independent |
| Nu creăm repo `intrebari-talantul-in-negot` ca app unic | Ar îngloba greșit Clasic + Memorare |
| Hub v0 = folder `mishak-hub/` | Pattern sibling |
| Auth / unlock platformă | **După** hub live + trafic |

## Status

Hub v0: catalog cu **T/F** + grup **Talantul** (Clasic | Memorare). Domain `mishak.ro` — lipire ulterioară.

```bash
cd mishak-hub && npm run deploy:cf
```

### Deploy produse

```bash
cd mishak-memorare && npm test && npm run deploy:cf
cd mishak-talantul-clasic && npm test && npm run deploy:cf
```

Necesită `CLOUDFLARE_API_TOKEN` (sau `wrangler login`). Pe Pages, branch-ul de Production trebuie să fie `main` (altfel deploy-ul ajunge în Preview).

## Non-goals acum

- Rescrierea T/F ca shell multi-game.
- Un singur app „Talantul” care amestecă Clasic + Memorare.
- Conturi pe hub v0.

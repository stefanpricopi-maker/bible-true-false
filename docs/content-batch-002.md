# Content batch-002 — 10 întrebări (goluri din review)

## Status

- Fișier: [`content/batch-002.json`](../content/batch-002.json)
- Locale: `ro`
- **`reviewStatus`:** PLACEHOLDER — pending human biblical review
- **Nu e încă în pack-ul de joc.** După review: audio ElevenLabs + sync în `demo-v1` + catalog.

## De ce aceste 10

Din [`docs/content-review-batch-001.md`](content-review-batch-001.md): batch-001 n-avea un **Adevărat** pentru Marea Roșie, iar Neemia / Barnaba / Apocalipsa (Ioan) / carul de foc al lui Ilie apăreau doar ca falși.

| ID | Cheie | Temă |
|----|--------|------|
| q101 | A | Marea Roșie |
| q102 | F | Marea Roșie |
| q103 | A | Neemia |
| q104 | F | Neemia |
| q105 | A | Barnaba |
| q106 | F | Barnaba |
| q107 | A | Ioan / Apocalipsa |
| q108 | F | Apocalipsa |
| q109 | A | Ilie, car de foc |
| q110 | F | Ilie |

## După review uman

1. Corectează `promptText` / `correct` dacă e nevoie.
2. `npm run gen:questions -- --batch content/batch-002.json --force`
3. Copiere MP3 + IDs în `demo-v1` + catalog (pas separat).

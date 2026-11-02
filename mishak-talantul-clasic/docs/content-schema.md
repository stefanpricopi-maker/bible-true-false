# Content schema — Clasic tipuri I–V

## Categorie (pliant 2027)

```ts
type ClassicCategory =
  | 'prescolari_clasa_1'
  | 'clase_2_3'
  | 'clase_4_5'
  | 'clase_6_7'
  | 'clase_8_9'
  | 'clase_10_11'
  | 'adulti_18_35'
  | 'adulti_35_plus'
```

Vezi [`edition-2027.md`](edition-2027.md) + `src/edition-2027.ts`.

## Întrebare (discriminated union)

Fiecare item are `id`, `category`, `type`, `prompt`, `books` (din bibliografia categoriei), opțional `chapter`, `ref`, `refText`, `reviewStatus` (`PLACEHOLDER` | `reviewed`).

La review, textul versetului vine din `refText` sau din `public/packs/<id>/verses.json` (cheie = `ref`), ediția Cornilescu SBR Oradea 2005.

- **true_false** — `correct: boolean`
- **single_choice** — `choices: [string, string, string]`, `correctIndex: 0|1|2`
- **matching** — `left: string[]`, `right: string[]`, `correctMap: number[]` (index în `right` pentru fiecare `left[i]`)
- **short_answer** — `accepted: string[]` (sinonime; match după normalizare)
- **multi_choice** — `choices: string[]`, `correctIndices: number[]` (ordine indiferentă; scor all-or-nothing)

## Pack

`public/packs/<packId>/manifest.json`:

```json
{
  "id": "clase-4-5",
  "title": "Clasele 4–5 — antrenament",
  "locale": "ro",
  "category": "clase_4_5",
  "questions": [ /* … */ ]
}
```

## Catalog

`public/content-packs/catalog.json` — free vs unlock, ca pattern-ul Mishak.

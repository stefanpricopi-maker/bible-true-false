# Content schema — Apocalipsa 1–5

## Pack

`public/packs/apocalipsa-1-5/manifest.json`

```json
{
  "id": "apocalipsa-1-5",
  "title": "Apocalipsa 1–5",
  "locale": "ro",
  "edition": "Cornilescu SBR Oradea 2005",
  "rightsStatus": "PLACEHOLDER",
  "verses": [
    {
      "id": "apoc-1-1",
      "chapter": 1,
      "verse": 1,
      "text": "…",
      "audioRef": null,
      "reviewStatus": "PLACEHOLDER"
    }
  ]
}
```

## Câmpuri

| Câmp | Tip | Note |
|------|-----|------|
| `id` | string | `apoc-{chapter}-{verse}` |
| `chapter` | 1–5 | |
| `verse` | number | |
| `text` | string | Text de antrenament; PLACEHOLDER până la rights |
| `audioRef` | string \| null | Path relativ opțional |
| `reviewStatus` | `PLACEHOLDER` \| `reviewed` | |

## Rights

- `rightsStatus: PLACEHOLDER` → UI arată banner că textul nu e încă ediția oficială de concurs.
- `rightsStatus: cleared` + versete `reviewed` → candidat pentru Pages public.

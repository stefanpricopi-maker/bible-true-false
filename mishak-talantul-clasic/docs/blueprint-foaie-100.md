# Blueprint foaie Clasic (~100 puncte)

Greutăți v1 (alineate la foaia tipică de concurs; ajustabile pe categorie în JSON):

| Cat. | Tip | Itemi | Puncte / item | Subtotal |
|------|-----|-------|---------------|----------|
| I | true_false | 10 | 2 | 20 |
| II | single_choice | 10 | 3 | 30 |
| III | matching | 1 set (5 perechi) | 10 pe set (2 / pereche) | 10 |
| IV | short_answer | 5 | 4 | 20 |
| V | multi_choice | 3 | 5 (0 sau 5) | 15 |
| | | | **Total** | **95** |

Pentru a ajunge la **100**, blueprint-ul default adaugă **+5 bonus** pe setul de asociere când toate cele 5 perechi sunt corecte (sau ridică Cat III la 15). Implementarea folosește:

```json
{
  "maxScore": 100,
  "sections": [
    { "type": "true_false", "count": 10, "pointsEach": 2 },
    { "type": "single_choice", "count": 10, "pointsEach": 3 },
    { "type": "matching", "count": 1, "pointsEach": 15 },
    { "type": "short_answer", "count": 5, "pointsEach": 4 },
    { "type": "multi_choice", "count": 3, "pointsEach": 5, "allOrNothing": true }
  ]
}
```

Ordinea în simulare: **I → II → III → IV → V**.  
Timer opțional: **60 minute** (ca durata tipică de concurs).

Cat V: răspunsul e corect doar dacă mulțimea de opțiuni bifate = mulțimea corectă.

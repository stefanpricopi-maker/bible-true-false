# Content batch-001 — 100 întrebări (sursă TTS)

## Status

- Fișier: [`content/batch-001.json`](../content/batch-001.json)
- Locale: `ro`
- Dificultate: povești biblice familiare, nivel **Mic** (~4–7, pre-literați; același nivel ca q001–q010 din demo)
- **`reviewStatus`:** reviewed 2026-09-12 — vezi [`docs/content-review-batch-001.md`](content-review-batch-001.md)
- Cablat în pack-ul de joc (`demo-v1`). Audio regenerat 2026-09-12 pentru textele retușate: q002, q014, q018, q026, q032, q036, q038, q042, q050, q060, q076, q091.

## Schema pe întrebare

| Câmp | Rol |
|------|-----|
| `id` | `q001` … `q100` |
| `correct` | `true` = Adevărat, `false` = Fals |
| `promptText` | Textul citit de ElevenLabs |
| `audioFile` | Numele MP3 de ieșire (ex. `q001-question.mp3`) |
| `topic` | Etichetă opțională pentru review / filtre |
| `ageBand` | `mic` / `copii` / `tineri` / `adulti` — batch-001 is **`mic`** (Copii waits for a harder set) |

## Generare audio (ElevenLabs API)

1. Copiază `.env.example` → `.env.local` și completează:
   - `ELEVENLABS_API_KEY`
   - `ELEVENLABS_VOICE_ID` (aceeași voce ca VO round 1)
   - opțional `ELEVENLABS_MODEL_ID`
2. Test pe un singur clip:

```bash
npm run gen:questions -- --limit 1
```

3. Batch complet (skip pe fișiere deja existente):

```bash
npm run gen:questions
```

4. Copiază MP3 + manifeste în pack-ul de joc:

```bash
npm run sync:batch
```

Motorul trage **10 întrebări random pe rundă** din pool-ul **deblocat** (implicit `free-start` = 30 întrebări pentru 3 runde; cu `?unlock=batch-001` = toate 100). Vezi `docs/monetization-packs.md`.

**Runde:** R1 pe rând · R2 buzz · R3 aceeași întrebare — P1 apoi P2 **fără spoil**, apoi reveal Adevărat/Fals și +1 fiecăruia corect (timeout = 0).

5. Regenerare forțată:

```bash
npm run gen:questions -- --force
```

Output: `generated/batch-001/audio/*.mp3`. După review, copiază în pack cu `npm run sync:batch`.

### VO de sistem + feedback (aceeași voce)

Sursă: [`content/system-vo.json`](../content/system-vo.json) (welcome, start, handoff pe culori, correct/incorrect, round-break).

```bash
# regenerare + instalare în pack-ul de joc
npm run gen:system-vo -- --force --pack
```

Output: `generated/system-vo/` și, cu `--pack`, `public/packs/demo-v1/vo/` + `feedback/`. SFX-urile (pop, click, chime…) nu se regenerează.

Clipuri Runda 2 (race): `vo/race-round-start.mp3`, `feedback/buzz-timeout.mp3` — în `content/system-vo.json`.

Fiecare clip VO/feedback are **mai multe texte** (`texts[]`); la generare apar `base.mp3`, `base-2.mp3`, … iar jocul alege **random** la fiecare redare.

## După review (2026-09-12)

Review: [`docs/content-review-batch-001.md`](content-review-batch-001.md). Cheile T/F sunt corecte; texte retușate + audio regenerat pentru:

`q002, q014, q018, q026, q032, q036, q038, q042, q050, q060, q076, q091`

```bash
npm run gen:questions -- --force --ids q002,q014,q018,q026,q032,q036,q038,q042,q050,q076,q091
npm run sync:batch
```

# Content specialist — Phase 1

## Facts

- Product needs questions + audio files as part of the product or loaded locally (`docs/brief.md`).
- Audio roles mentioned: question, feedback correct/incorrect, next-turn / handoff.
- No question text or scripture claims exist in-repo yet.

## Inferences

- A **pack** (manifest + assets) is the natural unit for v1 offline play.
- Display text may still help accessibility / parent oversight even when audio is primary — optional field.

## Recommendations

### Question record (schema draft)

```json
{
  "id": "q001",
  "correct": true,
  "promptText": "optional display string — PLACEHOLDER only until authored",
  "audio": {
    "question": "audio/q001-question.m4a",
    "correct": "audio/q001-correct.m4a",
    "incorrect": "audio/q001-incorrect.m4a"
  },
  "tags": {
    "topic": optional,
    "testament": optional,
    "ageBand": optional
  }
}
```

- `correct`: boolean — True means “Adevărat” is right.
- Do **not** treat any example prompt as real biblical content.

### Shared / pack-level cues (optional)

| Cue | v1 required? | Notes |
|-----|--------------|-------|
| `question` per item | **yes** | Primary prompt |
| `correct` feedback | **yes** | Per-item or shared pack SFX + short VO |
| `incorrect` feedback | **yes** | Same |
| `nextTurn` / handoff | **recommended** | Can be one shared pack file |
| `roundStart` / `roundEnd` | optional | Nice-to-have |

**Recommendation:** allow per-question feedback override; fall back to pack-level `feedback/correct.m4a` and `incorrect.m4a` to reduce recording cost.

### Pack layout (recommendation, not locked)

```text
packs/<packId>/
  manifest.json      # id, locale, title, questions[]
  audio/
    q001-question.m4a
    ...
  feedback/          # optional shared cues
    correct.m4a
    incorrect.m4a
    next-turn.m4a
```

`manifest.json` lists question objects and resolves relative paths.

### Authorship options (v1)

| Option | Pros | Cons |
|--------|------|------|
| **A. Static pack in repo** (recommended for v1) | Simple, offline, reviewable | Dev edits only |
| B. Drop-in folder on device | Flexible | Harder on web; support burden |
| C. Admin CMS / cloud | Scalable | Out of v1 scope |

### Age / tone guidelines (recommendations)

- Short sentences; one fact claim per item; avoid scary or contested theology for unknown age band.
- True and False items both used; avoid trick double-negatives.
- **Accuracy process:** unknown — needs a human review checklist before shipping real content (blocker for *content release*, not for app shell).

### Placeholder policy

Any sample Q&A in docs or fixtures must be labeled `PLACEHOLDER — not verified biblical content`.

## Unknowns

- Locale (RO inferred), age band, initial pack size, VO talent, audio format preference, who signs off accuracy.

## Blockers

- Cannot finalize real pack content without authorship + review process (does not block app architecture).

## Handoff to designer / architect

- Schema supports states: play `audio.question` → await T/F → play correct/incorrect → optional `next-turn` → next item.
- Paths are relative; client loads via pack root.

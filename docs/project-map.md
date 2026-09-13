# Project map

## Product

Întrebări din Biblie — Adevărat sau Fals? (name TBD). Greenfield. Evidence: `docs/brief.md`, folder name `bible-true-false`.

## Phase status

| Phase | Status |
|-------|--------|
| Setup (agents + brief + map) | done |
| Plan cascade | **done** — see `docs/decisions/` |
| Application code | **playable** — see `docs/ship-checklist.md` |

## Active workstreams (v1)

1. Single-device dual-player turn/scoring — **R1 / R2 buzz / R3 dual-answer + reveal** in engine
2. Kids T/F UI + audio — color UI + etichete Fals/Adevărat pe cerc
3. Question + audio asset pack — batch-001 + system VO; content review 2026-09-12 (`docs/content-review-batch-001.md`); audio regen for wording edits
4. Client/platform — **PWA first**; IAP later
5. QA round picker — **dev only** (`import.meta.env.DEV`)

## Explicit non-workstreams (v1)

- Multi-device / realtime sync
- Accounts / online leaderboards
- Live AI question generation

## Role graph

```text
orchestrator
    │
    ├─► product-owner ────────┐
    ├─► content-specialist ───┼─► reviewer ─► orchestrator merge
    ├─► product-designer ─────┤
    └─► client-architect ─────┘
              │
              └─► qa-engineer ─► reviewer ─► conditional go on code
```

## Feedback loops

See `.claude/workflows/feedback-loops.md`.

- **A — Scope creep:** clear after review
- **B — Audio/UX mismatch:** clear (shared FSM)
- **C — Stack undecided:** options retained; web/PWA recommendation only
- **D — Scoring/fairness:** interim defaults adopted; skip/tie/N revisit optional

## Unknowns / blockers

| Item | Status |
|------|--------|
| Product name | locked — [`docs/decisions/product-name.md`](decisions/product-name.md) |
| Platform (web / PWA / native) | unknown — web/PWA **recommended** |
| Language | unknown (RO inferred) |
| Audio delivery | bundled pack **recommended** |
| Question authorship model | static repo pack **recommended**; kids-level review process: `docs/content-review-batch-001.md` |
| Target age, N, tie/skip | unknown — **interim defaults in merge** |
| Content accuracy sign-off | kids-level review done (`docs/content-review-batch-001.md`); optional pastor spot-check |
| Empty repo before setup | resolved |
| Plan cascade | resolved |

## Decisions folder

| File | Role |
|------|------|
| `docs/decisions/product-owner.md` | Scope, scoring, turns |
| `docs/decisions/content-specialist.md` | Schema, pack, cues |
| `docs/decisions/product-designer.md` | Flows, FSM, screens |
| `docs/decisions/client-architect.md` | Platform options, modules |
| `docs/decisions/qa-engineer.md` | Risks, AC |
| `docs/decisions/reviewer.md` | Conflicts kept visible |
| `docs/decisions/orchestrator-merge.md` | Go/no-go + defaults |
| `docs/decisions/product-name.md` | v1 name lock |

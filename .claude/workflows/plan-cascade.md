# Plan cascade

Run after setup. Orchestrator executes phases; specialists write under `docs/decisions/`. No application code in this cascade.

## Inputs (read first)

1. `CLAUDE.md`
2. `docs/brief.md`
3. `docs/project-map.md`
4. `.claude/workflows/feedback-loops.md`
5. Relevant `.claude/agents/*.md`

## Phase 1 — parallel

Dispatch **product-owner** and **content-specialist**.

- PO: v1 scope checklist, turn/scoring rules options, non-negotiables, post-v1 parking lot.
- Content: question record shape, audio cue types, pack layout, age/tone guidelines without inventing scripture facts.

Outputs: `docs/decisions/product-owner.md`, `docs/decisions/content-specialist.md`.

## Phase 2 — parallel

Dispatch **product-designer** and **client-architect** using Phase 1 outputs.

- Designer: same-screen 2-player flows, T/F affordances, audio-driven states, accessibility for kids.
- Architect: platform options matrix, audio playback approach, local content loading; **no** multi-device sync design beyond a one-line post-v1 note.

Outputs: `docs/decisions/product-designer.md`, `docs/decisions/client-architect.md`.

## Phase 3

Dispatch **qa-engineer**.

- Risk matrix, acceptance criteria for scoring/turns/audio race conditions, kids misuse cases.

Output: `docs/decisions/qa-engineer.md`.

## Phase 4

Dispatch **reviewer** (read-only) on all Phase 1–3 artifacts.

- Agreements, conflicts (keep visible), scope-creep check, unknowns still open.

Output: `docs/decisions/reviewer.md`.

## Phase 5 — Merge

Orchestrator:

1. Update `docs/project-map.md` (blockers, phase status).
2. Write `docs/decisions/orchestrator-merge.md` (summary, loops needed, go/no-go on application code + rationale).
3. Report file list and remaining blockers to the user.

## Rules

- Facts / inferences / recommendations / unknowns / blockers in every artifact.
- If blocked, run the smallest loop from `feedback-loops.md`.
- Do not invent market stats, legal claims, or biblical content accuracy without a stated source.
- Do not start `src/` or app scaffolding in this cascade.

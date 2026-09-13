# CLAUDE.md — Întrebări din Biblie — Adevărat sau Fals?

Greenfield kids quiz: biblical culture, True/False, audio, points. Local multi-agent workflow lives under `.claude/`.

## Binding constraints

- **v1:** 2 players on **one device** + audio T/F + scoring.
- **Pre-literate UI:** game controls are **color-only** (no required reading): **green**=True, **red**=False, **blue**=Player 1, **yellow**=Player 2. Instructions via audio.
- **Post-v1:** multi-device sync — do not design or implement it in v1.
- **Do not copy** 2Wheel Tracker or mobilcab-cad (roles, phases, commands, stack).
- Prefer small, explicit docs under `docs/`. Separate facts / inferences / recommendations / unknowns / blockers.
- Application code is allowed after conditional go in `docs/decisions/orchestrator-merge.md` (done). First screen UI must follow `docs/setup-screen.md` + mockup.
- Batch-001 content review: `docs/content-review-batch-001.md` (2026-09-12). Keep PLACEHOLDER on any *new* unverified claims.
- **Modular packs / unlocks:** see `docs/monetization-packs.md`. Shell + content-packs + entitlements; deploy PWA first (`docs/deploy.md`); store IAP later (`docs/capacitor-iap.md`).

## Source of truth

1. `docs/brief.md` — product intent and v1 lock
2. `docs/project-map.md` — roles, loops, phase status
3. `.claude/workflows/plan-cascade.md` — planning cascade
4. `.claude/workflows/feedback-loops.md` — conflict loops
5. `.claude/agents/*.md` — role definitions

## Agent roles (minimal)

| Agent | Job |
|-------|-----|
| orchestrator | Dispatch, merge, go/no-go |
| product-owner | Scope, scoring, turns, non-goals |
| product-designer | Kids UX, same-screen dual play |
| content-specialist | Question + audio content model |
| client-architect | Client/platform/audio pipeline options |
| qa-engineer | Risks and acceptance criteria |
| reviewer | Read-only synthesis; keep conflicts visible |

## How to run planning

Paste and follow `docs/next-orchestrator-prompt.md`. Do not use next-step prompts from other repositories.

## Editing rules

- Plan phase: edit docs under `docs/` and `.claude/` only.
- Implementation phase (after go): application code as approved slices; keep multi-device out of v1.

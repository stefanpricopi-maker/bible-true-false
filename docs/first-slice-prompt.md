# First slice — implement playable shell

Lipește totul de sub linie în chat-ul deschis pe **bible-true-false** (acest repo).

---

You are implementing the **first vertical slice** for **Bible True/False Kids Quiz**.

Planning is done. Conditional GO is in `docs/decisions/orchestrator-merge.md`. Follow that merge and the brief; do not re-plan the product.

## Read first

1. `CLAUDE.md`
2. `docs/brief.md`
3. `docs/decisions/orchestrator-merge.md`
4. `docs/project-map.md`
5. `docs/decisions/product-designer.md` (FSM / screens)
6. `docs/decisions/content-specialist.md` (pack schema)
7. `docs/decisions/client-architect.md` (modules)
8. `docs/decisions/qa-engineer.md` (acceptance)

## Binding constraints

- **v1 only:** 2 players, **one device**, audio T/F + scores.
- **Pre-literate UI locked:** green = True, red = False, blue = Player 1, yellow = Player 2. No required reading on play controls.
- **No** multi-device sync, accounts, AI live questions.
- **No** real biblical claims as shipped truth — PLACEHOLDER questions/audio only until content review.
- Platform: start **web/PWA** (recommendation, not irreversible). Prefer a simple modern stack you can finish in one slice (e.g. Vite + TypeScript).
- Adopt interim defaults from the merge (alternate turns, +1/0, no skip, N = pack length, egalitate on tie).

## Build this slice

1. Scaffold the web app (if missing).
2. Static pack under `packs/<id>/` with `manifest.json` + PLACEHOLDER audio (or short silent/beep fixtures labeled PLACEHOLDER).
3. Pack loader + types.
4. Session FSM: setup → play (turns/scores) → end.
5. Single-channel audio player wired to FSM (stop before next; input disabled during question/feedback audio).
6. Minimal kids UI: color-only True/False + player indicators; scores without requiring literacy.
7. Smoke path: two players can finish a tiny pack (2–3 placeholders) and see scores / egalitate.

## Out of scope this slice

- Real biblical content authorship
- Polish animations beyond minimal feedback
- PWA install hardening / store listing
- Multi-device

## Done when

- [ ] App runs locally
- [ ] PLACEHOLDER pack loads
- [ ] Audio plays for question + feedback without overlap
- [ ] Alternate turns and scores work
- [ ] Color-only play controls (green/red/blue/yellow)
- [ ] Short note in `walkthrough.md` or README on how to run

Begin implementation. Prefer small, reviewable commits only if the user asks for commits.

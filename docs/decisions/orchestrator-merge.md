# Orchestrator merge — Phase 5

> **Status (live product):** superseded in part by the implemented shell. Authoritative rules are `src/session/engine.ts` + `docs/brief.md` + VO copy: **3 rounds** (R1 alternate +1; R2 buzz +2/steal; R3 dual-answer then reveal); setup colors **exclusive**, no defaults; T/F labels on circle allowed by product choice.

## Summary

Plan cascade Phases 1–5 completed for Bible True/False Kids Quiz. Specialists agree on a single-device, alternate-turn, audio-driven T/F loop with per-player scores and a static content pack. Reviewer found no high-severity conflicts; remaining gaps are open product choices with usable interim defaults.

## Adopted interim defaults (for implementation)

| Topic | Default (Phase 5) | **Current (shipped)** |
|-------|-------------------|------------------------|
| Turns | Alternate P1 ↔ P2 | R1 alternate; R2 buzz; R3 both answer then reveal |
| Scoring | +1 correct, 0 wrong; no steal | R1/R3 +1; R2 +2 / steal +1 on miss |
| Round length | N = pack length | 10 × 3 rounds from unlocked pool |
| UI literacy | No text on play buttons | Color + **Fals/Adevărat** labels (product choice) |
| Player colors | Fixed blue/yellow | Palette pick, **exclusive**, no preselect |

## Loops A–D

| Loop | Status |
|------|--------|
| A Scope creep | Clear — no re-run |
| B Audio/UX | Clear — FSM aligned across content + designer |
| C Stack | Clear — options matrix + labeled recommendation only |
| D Scoring/fairness | **Deferred, not blocking** — defaults above; revisit skip/tie/N when product locks |

## Go / no-go on application code

### Decision: **Conditional GO**

**May start** application scaffolding and a vertical slice:

1. Pack loader + PLACEHOLDER manifest/audio fixtures  
2. Session FSM (turns, scores)  
3. Single-channel audio player wired to FSM  
4. Minimal kids UI: setup → play → end — **color-only controls** (green/red/blue/yellow), no required reading  

**Must not:**

- Implement multi-device sync, accounts, or AI live questions  
- Ship real biblical claims without an explicit content review process  
- Treat web/PWA recommendation as an irreversible lock without revisiting tradeoffs  
- Require kids to **read** button labels to play

### Rationale

- Brief v1 is covered by agreed design.  
- Reviewer: no blocking contradictions.  
- Remaining unknowns (name, locale, age, platform lock, N, tie) do not prevent a thin playable shell.  
- CLAUDE.md allows code after this merge says go.

## Files in this cascade

- `docs/decisions/product-owner.md`
- `docs/decisions/content-specialist.md`
- `docs/decisions/product-designer.md`
- `docs/decisions/client-architect.md`
- `docs/decisions/qa-engineer.md`
- `docs/decisions/reviewer.md`
- `docs/decisions/orchestrator-merge.md` (this file)
- `docs/project-map.md` (updated)

## Remaining blockers (non-code)

1. Product name, locale, age band  
2. Content authorship + accuracy sign-off (blocks **content release**, not shell)  
3. Final platform lock (optional until distribution pressure)  
4. N / tie-break / skip if product rejects interim defaults  

## Next step for humans

Approve conditional go → implement first slice against defaults above → keep `docs/brief.md` v1 lock.

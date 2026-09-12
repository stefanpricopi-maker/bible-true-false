# Feedback loops

Use the smallest loop that resolves the conflict. Re-run only affected specialists, then reviewer, then orchestrator merge patch.

## Loop A — Scope creep

**Trigger:** Any artifact pulls multi-device, accounts, AI live content, or >2 same-screen players into v1.

**Actors:** product-owner → reviewer → orchestrator

**Done when:** v1 checklist matches `docs/brief.md`; extras moved to post-v1 parking lot.

## Loop B — Audio / UX mismatch

**Trigger:** Content pack or audio cues disagree with kids flow (who hears what, when buttons enable, turn handoff).

**Actors:** content-specialist + product-designer → reviewer

**Done when:** Shared state list (idle / playing question / awaiting answer / feedback / next turn) is consistent across both docs.

## Loop C — Stack undecided

**Trigger:** Pressure to lock a framework without evidence.

**Actors:** client-architect → product-owner (constraints only) → reviewer

**Done when:** Options matrix with tradeoffs; recommendation labeled as recommendation; unknown if insufficient evidence.

## Loop D — Scoring / fairness

**Trigger:** Ambiguous points, simultaneous taps, or tie rules.

**Actors:** product-owner + qa-engineer → reviewer

**Done when:** Explicit rules for award, dispute, and edge cases — or listed as open decisions with defaults proposed.

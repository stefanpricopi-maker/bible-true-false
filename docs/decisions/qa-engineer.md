# QA engineer — Phase 3

## Facts

- PO: alternate turns, +1/0, T/F disabled during question audio.
- Designer FSM: playingQuestion → awaitingAnswer → playingFeedback → nextTurn → …
- Architect: single-channel audio; stop before next; pack manifest load.
- **Pre-literate UI:** green=True, red=False, blue=P1, yellow=P2; no text required on play buttons.

## Inferences

- Highest risk is **input during audio** and **wrong-player taps**, not scoring math.
- Missing audio files will be common during content bring-up.

## Risk matrix

| ID | Risk | Severity | Likelihood | Mitigation |
|----|------|----------|------------|------------|
| R1 | Double-tap awards 2 points or skips state | High | High | Ignore input outside awaitingAnswer; debounce |
| R2 | Tap during question audio accepted | High | High | Disable T/F until `ended` |
| R3 | Overlapping audio (Q + feedback) | High | Med | Single AudioPlayer; stop-before-play |
| R4 | Score shown for wrong player | High | Med | Bind award to `activePlayerId` only |
| R5 | Missing/corrupt audio file | High | Med | Error state + skip/retry; no crash |
| R6 | Turn does not advance after feedback | Med | Med | Explicit transition on feedback `ended` |
| R7 | Round ends early / late vs N | Med | Low | Assert question index vs manifest length |
| R8 | Orientation / safe-area covers buttons | Med | Med | Manual device checklist |
| R9 | Autoplay blocked (web) | High | Med if web | Require user gesture before first play |
| R10 | Multi-device assumptions in code | Med | Low | Code review against brief; no sync APIs in v1 |
| R11 | Kids blocked by text-only UI | High | Med if ignored | No required labels on green/red/blue/yellow controls |
| R12 | Color confusion (P1 vs True both “cool” hues) | Med | Med | Teach mapping in welcome audio; keep T/F as large bottom pair, players as side chips |

## Acceptance criteria (v1)

1. Given round start, only the active player’s turn is indicated **by blue or yellow**; answering awards at most **one** point resolution per question.
2. While question audio plays, **green/red** controls are non-interactive; first valid tap after enable resolves exactly once.
3. Correct answer → correct feedback audio path; incorrect → incorrect path; score increments only on correct for active player.
4. After feedback completes, active player switches (blue↔yellow) for alternate-turn mode; handoff audio may say „albastru” / „galben”.
5. After configured N questions, end screen shows both scores **color-coded**; totals match event log of answers.
6. Missing audio: user-visible recovery; session does not soft-lock forever.
7. Background/resume: no stuck “playing” state without UI control (Continue or auto-recover).
8. No multi-device or account flows present in v1 build.
9. A tester who **does not read** can complete a round using only audio + colors (no dependence on button text).
10. Green always means True; red always means False; blue always P1; yellow always P2 — consistent across screens.

## Test approach outline (no test code in this cascade)

- **Manual:** phone + tablet; two children or simulated double-tap; headphones vs speakers.
- **Automated (later):** FSM unit tests (session engine); audio mock (`ended`/`error`); manifest fixture with PLACEHOLDER items.
- **Content gate:** separate checklist before shipping real biblical audio (accuracy) — out of eng AC but release blocker for *content*.

## Open gaps (Loop D adjacent)

- Exact N, tie-break UI, Skip control — AC should be updated when PO locks them.
- Platform-specific autoplay rules depend on web vs native choice.

## Unknowns

- Device matrix, CI target, whether automated UI tests are in scope for first slice.

## Blockers

None that prevent a **go on application shell** if defaults above are treated as interim AC.

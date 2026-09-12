# Product owner — Phase 1

> **Note:** Scoring/rounds in the table below are **Phase-1 interim**. Live rules: see `docs/brief.md` and `src/session/engine.ts` (3 rounds, R2 steal, R3 reveal).

## Facts (from brief)

- Kids app: biblical culture True/False, audio interaction, points.
- v1: 2 players on **same device**; audio for question (+ optional feedback); T/F choice; score per player; content + audio local or bundled.
- **Pre-literate (locked):** no required reading on play controls — **green**=True, **red**=False, **blue**=Player 1, **yellow**=Player 2.
- Not v1: multi-device sync, >2 same-screen players, accounts/cloud/AI live questions (undecided; not required for v1).

## Inferences

- Session is local and ephemeral unless we later choose light persistence.
- “Rândul următor” implies alternating turns is the intended default, not simultaneous answering on one shared T/F pair (simultaneous on one screen is ambiguous and fight-prone).

## Recommendations (defaults if no user override)

| Decision | Default | Alternatives |
|----------|---------|--------------|
| Turn model | **Alternate turns** (P1, P2, P1…) | Same question both answer in sequence; or buzz-to-claim (harder on one device) |
| Points | **+1** for correct; **0** for wrong | Streak bonus (park post-v1 polish) |
| Wrong answer | Show/play feedback; **no** point steal | Opponent gains on miss (park) |
| Round length | **Fixed N questions** from pack (N open) | Play until score target |
| Who starts | **Coin-flip / random** or parent picks on setup | Always P1 |
| Tie at end | Show both scores + “egalitate” / play one more (sudden death optional) | No tie-break |
| Player identity | **Color only:** P1 blue, P2 yellow (no typed names required in v1) | Optional parent labels later |
| Answer controls | **Green** = True, **Red** = False — **no text on buttons** | Icons/shapes without letters OK |
| Buttons during audio | **Disabled** until question audio ends (or skip control for adult) | Allow early answer |

### v1 checklist (must ship)

- [ ] Setup: two local players on one device (blue / yellow)
- [ ] Play: play question audio → enable green/red → record answer for active player
- [ ] Feedback audio (correct / incorrect) after answer
- [ ] Score per player visible via blue/yellow cues (not text-dependent)
- [ ] Advance turn / next question until round ends (audio names “albastru” / “galben”)
- [ ] End screen with scores (color-coded)
- [ ] Content pack loadable offline (bundled or local files)
- [ ] Playable without reading literacy

### Non-goals (v1)

- Multi-device sync, online accounts, leaderboards, AI-generated live questions, >2 players, rich content CMS/admin (unless tiny JSON edit by developer counts)

## Open decisions (unknowns)

- Product name, language, target age, N questions, exact tie-break, whether skip-audio is allowed.
- Name entry: **not required** for v1 (colors suffice); optional later.
- Authorship/editing of packs (see content-specialist).

## Post-v1 parking lot

- Multi-device sync (phone + tablet)
- >2 players, accounts, online ranks
- Live AI questions
- Advanced scoring (streaks, steals), rich avatars, CMS

## Blockers for implementation

None that prevent **planning**. Implementation should not start until merge go; stack still unknown (not a PO blocker for scope).

## Loop notes

- Defaults above address Loop D preemptively; QA should validate race cases (double-tap, tap during audio).
- No Loop A issues in this doc.

# Product designer — Phase 2

## Facts

- v1: 2 kids, one device, audio T/F, scores (`docs/brief.md`).
- PO default: alternate turns; buttons disabled during question audio; +1 / 0 scoring.
- Content: per-question question audio + correct/incorrect; optional shared next-turn cue.
- **Pre-literate UI (locked):** no required reading on play controls.
  - **Green** = True (Adevărat)
  - **Red** = False (Fals)
  - **Blue** = Player 1
  - **Yellow** = Player 2

## Inferences

- Portrait phone and landscape tablet both matter; layout should work without assuming landscape-only.
- Parents may start the session; kids dominate play screens.
- Audio must teach the color mapping once at start (“verde înseamnă adevărat…”).

## Recommendations

### Color system (binding)

| Role | Color | UI treatment |
|------|-------|--------------|
| True | Green | Large answer button — **no text** |
| False | Red | Large answer button — **no text** |
| Player 1 | Blue | Score chip, turn frame, avatar blob |
| Player 2 | Yellow | Score chip, turn frame, avatar blob |

Secondary (no reading): distinct **shape or side** (e.g. green left / red right; circle vs square) for color-vision support — still no letters.

### Screen inventory (v1)

1. **Home / Start** — iconographic play control (▶ or big colored start); optional logo; **no instruction paragraph kids must read**.
2. **Setup** — two color blobs (blue / yellow); start control; no name typing required.
3. **Play** — active player: thick blue or yellow frame; scores as blue/yellow counters (dots or big numerals OK — numerals are not “reading sentences”); huge green / red answer buttons.
4. **Feedback** — flash green-tint / red-tint + audio (not text “Corect”).
5. **Turn handoff** — fill screen with blue or yellow + audio (“e rândul jucătorului albastru / galben”).
6. **Round end** — both color scores; play-again / home as icons.

Multi-device UI: **out of scope**.

### Primary flow

```text
Home → Setup → Play loop → End → (again | home)
```

Play loop:

```text
idle
  → playingQuestion (green/red disabled)
  → awaitingAnswer (green/red enabled; active player frame blue|yellow)
  → playingFeedback (inputs disabled; score update on active color)
  → nextTurn (handoff color wash + audio)
  → (next question or roundEnd)
```

### State machine notes

| State | Audio | Input |
|-------|-------|--------|
| idle / handoff | next-turn (names blue/yellow) | none or icon Continue |
| playingQuestion | `audio.question` | green/red disabled |
| awaitingAnswer | none | green = true, red = false |
| playingFeedback | correct \| incorrect | disabled |
| scoreUpdate | none | — |
| roundEnd | optional | icon Play again / Home |

### Kids / accessibility

- Minimum large tap targets; **color is primary**; shape/position secondary; **no text on answer or player controls**.
- Active player: full-bleed blue/yellow border so the other child doesn’t steal the turn as easily.
- Audio-driven pacing; welcome VO explains colors once.
- Safe area: avoid notch/home-indicator overlap on green/red.
- Big score numerals allowed; avoid words like “Puncte” as the only cue.

### Open UX questions

- Skip-audio: parent-only gesture?
- Show optional `promptText` for parents only (hidden from kids mode)? Default: **off** for pre-literate v1.

## Unknowns

- Exact green/red/blue/yellow hex values; motion level for age band.

## Blockers

None for planning.

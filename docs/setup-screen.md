# Setup screen — visual source of truth

Tabletop / opposite seating (single device between two kids).

## 0. Host — age band (before colors)

The **adult holding the phone** picks **one band for the whole game**. The other player does not pick a band. This screen is **not** tabletop-mirrored (parent can read).

Screen heading: **Alege grupa**. 2×2 tiles: illustration + **title** + **caption** (all captions start with „Întrebări…”). Adulți: no age number on UI.

| Id | Image | Title | Caption | v1 content |
|----|-------|-------|---------|------------|
| `mic` | `/bands/mic.png` | Mic | Întrebări pentru cei mai mici (~4–7 ani) | empty until 30 Q + MP3 |
| `copii` | `/bands/copii.png` | Copii | Întrebări pentru școală (~8–12 ani) | all 100 from batch-001 |
| `tineri` | `/bands/tineri.png` | Tineri | Întrebări pentru adolescenți (~13–18 ani) | empty until content |
| `adulti` | `/bands/adulti.png` | Adulți | Întrebări pentru părinți și adulți | empty until content |

- Tap a **playable** band (currently only **Copii**) → color setup. No „Începe”.
- Tap an inactive tile → stay on the host screen (dimmed art + lock mark; `aria-label` includes „În curând”).
- A band is playable only when the entitled pool has at least 30 questions **with audio** for that `ageBand` (engine: `QUESTIONS_PER_ROUND * TOTAL_ROUNDS`).
- Welcome VO plays on the **color** setup screen, not here.
- **Acasă** returns to this host picker. **Din nou** keeps the band and returns to color setup.

## 1. Color pick

1. **Jucătorul 2** card (rotated 180°) — 2×2 swatches + chip + ✓
2. Split circle Fals / Adevărat (smaller) — text pe jumătăți
3. **Jucătorul 1** card — same

Each player sees all four swatches with **none selected**. After a tap, that color is exclusive (disabled + dimmed for the other player). Game starts when both have confirmed different colors.

## 2. After both players pick → game starts

- Circle **grows**
- Each player shows a **large chosen-color box** (P2 above circle, P1 below)
- Score is shown on the color box
- Circle halves become the True/False answer controls (etichete Fals / Adevărat)
- Countdown diamond only while waiting for buzz or T/F
- Tabletop turn guard: tap on the **top** half of the screen counts as P2; **bottom** as P1 — wrong side ignored during the other player's turn

## Removed

- Title „Adevărat sau Fals?”
- Buton „Începe”

# Walkthrough — first slice

## Ce există

- Vite + TypeScript web app
## Audio (ElevenLabs)

Clipurile din `audio/` sunt mapate în `public/packs/demo-v1/`:

| Clip | Path în pack |
|------|----------------|
| welcome | `vo/welcome-setup.mp3` |
| start joc | `vo/game-start.mp3` → handoff culoare → `vo/first-question-cue.mp3` |
| Q1–Q10 | `audio/q00x-question.mp3` |
| feedback | `feedback/correct.mp3`, `incorrect.mp3` |
| handoff | `feedback/next-turn-{albastru,galben,roz,mov}.mp3` |
| rundă | `feedback/round-break.mp3` |
| SFX | `sfx/` — variante auto: `waiting.mp3` + `waiting-2.mp3`…; `pop` + `pop-2`; random la fiecare play. Rulează `npm run sync:sfx` după ce adaugi fișiere în `audio/`. |

Runda 2 (`q011`–`q020`) încă folosește beep WAV până înregistrezi VO.
- Session FSM: setup → question → await → feedback → nextTurn → end
- Audio single-channel (stop înainte de următorul)
- Play: butoane color-only (roșu pătrat = Fals, verde cerc = Adevărat)
- End: scoruri + egalitate / câștigător pe culoare

## Cum verifici

1. `npm run dev`
2. Pe setup: alege culori, apasă **Începe** (necesită gesture pentru audio)
3. Așteaptă beep-ul întrebării → răspunde pe verde/roșu
4. Alternare jucători după feedback; la final vezi scoruri

## Limitări slice

- Audio = tonuri, nu voce
- Text pe setup pentru părinți; pe play răspunsurile sunt fără etichete text
- Fără multi-device

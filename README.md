# Întrebări din Biblie — Adevărat sau Fals?

Aplicație pentru copii: cultură biblică **Adevărat / Fals**, audio, scor pe 2 jucători pe același device.

## Rulează local

```bash
npm install
npm run gen:audio   # o dată — beep-uri PLACEHOLDER
npm run dev
```

Deschide `http://localhost:5173/`.

## v1 (locked)

- 2 jucători, un device
- Audio pe întrebare + feedback
- Culori: verde = Adevărat, roșu = Fals; jucătorii aleg din paletă (implicit albastru / galben)
- Primul ecran: vezi [`docs/setup-screen.md`](docs/setup-screen.md) + mockup

## Pack demo

`public/packs/demo-v1/` — 3 întrebări PLACEHOLDER + WAV-uri generate (nu conținut biblic real).

## Documentație

- Brief: [`docs/brief.md`](docs/brief.md)
- Go: [`docs/decisions/orchestrator-merge.md`](docs/decisions/orchestrator-merge.md)
- Walkthrough: [`walkthrough.md`](walkthrough.md)

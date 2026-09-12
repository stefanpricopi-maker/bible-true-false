# Client architect — Phase 2

## Facts

- Greenfield; no stack chosen in brief.
- v1 needs: load content pack, play audio without overlap bugs, local 2-player score/turn state, offline-capable content.
- Multi-device sync is post-v1 only.

## Inferences

- A single-client app with in-memory (or light local) session state is enough for v1.
- Bundled static packs match content-specialist option A.

## Platform options matrix

| Option | Fit for audio+kids | Offline packs | Effort to first playable | Notes |
|--------|--------------------|---------------|--------------------------|-------|
| **Web / PWA** (responsive) | Good (HTMLAudio/Web Audio); autoplay policies need gesture | Good if assets bundled/cached | Lower if team knows web | Install-to-home optional |
| **Native** (iOS/Android) | Excellent audio control | Excellent | Higher (two stores or cross-platform tool) | Better background/interrupt APIs |
| **Cross-platform UI kit** (e.g. RN/Flutter) | Good | Good | Medium | One codebase; still store friction |

### Recommendation (labeled)

**Start with responsive web or PWA** for fastest validation of audio+T/F+turns on a shared phone/tablet browser; revisit native if autoplay, performance, or store distribution becomes a blocker.

This is **not** a lock — insufficient team/constraint evidence (Loop C: options retained).

## Content + audio pipeline (v1 sketch)

```text
PackLoader → Manifest (questions[]) → SessionEngine
                                         ├─ Turn/Score state
                                         └─ AudioPlayer (single channel)
```

- **PackLoader:** fetch or import `packs/<id>/manifest.json`; resolve relative audio URLs.
- **AudioPlayer:** one active sound; `stop()` before next; queue forbidden for overlapping Q/feedback; on `ended` → state transition.
- **SessionEngine:** implements designer states; ignores input while `playingQuestion` / `playingFeedback`.
- **Preload:** recommendation — preload next question audio during feedback/handoff; full-pack preload if pack is small.

### Interruptions

- On app background: pause audio; on resume either restart question or show Continue (product choice; default **Continue**).

## v1 module boundaries

1. `pack` — types + load manifest/assets  
2. `session` — players, scores, turn index, question index, FSM  
3. `audio` — play/stop/ended/error  
4. `ui` — screens bound to session snapshots  

No network layer required for v1 beyond optional future CDN (unknown).

## Persistence

- **Recommendation:** none required for v1 (scores live for the round only). Optional `localStorage` last names — polish.

## Post-v1 (one line only)

Multi-device sync would add a transport + room/session authority — **not designed here**.

## Unknowns

- Final platform, audio codec, hosting, whether packs ship in-repo or as downloadable assets.

## Blockers

- Platform choice not required to begin a **thin vertical slice** if team accepts web-first recommendation; locking native-only without evidence would be Loop C.

## Alignment

- Consumes content schema and designer FSM without contradiction.

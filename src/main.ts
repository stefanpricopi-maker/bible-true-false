import './style.css'
import { resetPlayAnalytics, track } from './analytics'
import {
  isBandPlayable,
  loadEntitledPack,
  loadPlayablePack,
  type AgeBand,
} from './catalog'
import { createDonateLink } from './donate'
import { applyUnlockQueryParam } from './entitlements'
import {
  bandLabel,
  formatPlayedAt,
  getLastGame,
  saveGame,
} from './history'
import type { Pack } from './pack/types'
import {
  getSettings,
  setSkipWelcome,
  setSfxVolume,
  setVoVolume,
} from './settings'
import { SessionEngine, type SessionSnapshot, type StartRound } from './session/engine'

applyUnlockQueryParam()

/** Dev-only QA: which round to start. Stripped from prod UI via import.meta.env.DEV. */
const QA_ENABLED = import.meta.env.DEV
let qaStartRound: StartRound = 1

const SWATCHES = [
  { id: 'blue', color: '#3B82F6', label: 'Albastru' },
  { id: 'yellow', color: '#F5C542', label: 'Galben' },
  { id: 'pink', color: '#EC4899', label: 'Roz' },
  { id: 'purple', color: '#8B5CF6', label: 'Mov' },
] as const

/** Host (adult) picks one band before colors. Not tabletop-mirrored. */
const HOST_BANDS: readonly {
  id: AgeBand
  label: string
  caption: string
}[] = [
  {
    id: 'mic',
    label: 'Mic',
    caption: 'Întrebări pentru cei mai mici (~4–7 ani)',
  },
  {
    id: 'copii',
    label: 'Copii',
    caption: 'Întrebări pentru școală (~8–12 ani)',
  },
  {
    id: 'tineri',
    label: 'Tineri',
    caption: 'Întrebări pentru adolescenți (~13–18 ani)',
  },
  {
    id: 'adulti',
    label: 'Adulți',
    caption: 'Întrebări pentru părinți și adulți',
  },
]

/** Yellow (and other light swatches) need dark score text. */
function isLightColor(hex: string): boolean {
  const raw = hex.trim().replace('#', '')
  if (raw.length !== 6) return false
  const r = Number.parseInt(raw.slice(0, 2), 16)
  const g = Number.parseInt(raw.slice(2, 4), 16)
  const b = Number.parseInt(raw.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return false
  return (r * 299 + g * 587 + b * 114) / 1000 > 170
}

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app missing')

const ANSWER_SECONDS = 10

const engine = new SessionEngine()
{
  const s = getSettings()
  engine.setVoVolume(s.voVolume)
  engine.setSfxVolume(s.sfxVolume)
}
let starting = false
let launchScheduled = false
let roundBreakScheduled = false
let cachedPack: Pack | null = null
let entitledPack: Pack | null = null
let entitledLoading = false
/** Host choice — UI only, not an engine phase. */
let selectedBand: AgeBand | null = null
let welcomePlayed = false
let welcomePlaying = false
/** One localStorage write per finished match. */
let historySavedForGame = false
let answerCountdown: {
  key: string
  left: number
  intervalId: number
} | null = null

engine.subscribe(render)
track('page_open')

function clearAnswerCountdown(): void {
  if (answerCountdown) {
    window.clearInterval(answerCountdown.intervalId)
    answerCountdown = null
  }
}

function paintAnswerTimer(seconds: number): void {
  const el = document.querySelector('.answer-timer')
  if (el) el.textContent = String(seconds)
}

/** Counts down while awaiting buzz (R2) or True/False; survives re-renders. */
function syncAnswerCountdown(snap: SessionSnapshot): void {
  const timing =
    snap.phase === 'awaitingBuzz' || snap.phase === 'awaitingAnswer'
  if (!timing) {
    clearAnswerCountdown()
    return
  }

  const key = `${snap.round}:${snap.questionIndex}:${snap.phase}:${snap.activePlayer}`
  if (!answerCountdown || answerCountdown.key !== key) {
    clearAnswerCountdown()
    answerCountdown = {
      key,
      left: ANSWER_SECONDS,
      intervalId: window.setInterval(() => {
        if (!answerCountdown) return
        if (engine.isSessionPaused()) return
        answerCountdown.left -= 1
        paintAnswerTimer(Math.max(0, answerCountdown.left))
        if (answerCountdown.left <= 0) {
          const phase = engine.snapshot().phase
          clearAnswerCountdown()
          if (phase === 'awaitingBuzz') engine.buzzTimeout()
          else if (phase === 'awaitingAnswer') engine.timeout()
        }
      }, 1000),
    }
  }
  paintAnswerTimer(answerCountdown.left)
}

async function ensureEntitled(): Promise<Pack> {
  if (entitledPack) return entitledPack
  entitledPack = await loadEntitledPack()
  return entitledPack
}

async function ensurePack(): Promise<Pack> {
  if (cachedPack) return cachedPack
  if (!selectedBand) throw new Error('Alege o grupă')
  cachedPack = await loadPlayablePack(selectedBand)
  engine.bindAssets(cachedPack)
  return cachedPack
}

function playSetupColorHintIfNeeded(): void {
  if (!selectedBand || !cachedPack) return
  if (engine.snapshot().phase !== 'setup') return
  const hint = cachedPack.voiceover?.setupColorHint
  if (!hint) return
  const snap = engine.snapshot()
  // Skip if someone already picked during welcome.
  if (snap.colorChosen[0] || snap.colorChosen[1]) return
  engine.playClip(cachedPack, hint)
}

function playWelcomeIfNeeded(): void {
  if (!selectedBand) return
  if (welcomePlayed || welcomePlaying) return
  if (engine.snapshot().phase !== 'setup') return
  if (getSettings().skipWelcome) {
    welcomePlayed = true
    return
  }
  if (!cachedPack?.voiceover?.welcome) return
  welcomePlaying = true
  engine.playClip(
    cachedPack,
    cachedPack.voiceover.welcome,
    () => {
      welcomePlayed = true
      welcomePlaying = false
      playSetupColorHintIfNeeded()
    },
    () => {
      welcomePlaying = false
    },
  )
}

async function startGame(): Promise<void> {
  if (starting || !selectedBand) return
  starting = true
  engine.stopAudio()
  render(engine.snapshot())
  try {
    const pack = await ensurePack()
    await engine.start(pack, QA_ENABLED ? { startRound: qaStartRound } : {})
  } catch (err) {
    console.error(err)
    alert(err instanceof Error ? err.message : 'Nu am putut porni jocul')
    resetPlayAnalytics()
    engine.resetToSetup()
  } finally {
    starting = false
    launchScheduled = false
    render(engine.snapshot())
  }
}

async function pickBand(band: AgeBand): Promise<void> {
  const entitled = await ensureEntitled()
  if (!isBandPlayable(entitled.questions, band)) return
  selectedBand = band
  welcomePlayed = false
  welcomePlaying = false
  try {
    cachedPack = await loadPlayablePack(band)
    engine.bindAssets(cachedPack)
  } catch (err) {
    console.error(err)
    selectedBand = null
    cachedPack = null
    render(engine.snapshot())
    return
  }
  render(engine.snapshot())
  playWelcomeIfNeeded()
}

/** End-screen „Din nou”: keep the band, return to color setup (no auto-start). */
function playAgain(): void {
  clearAnswerCountdown()
  welcomePlayed = false
  welcomePlaying = false
  roundBreakScheduled = false
  launchScheduled = false
  starting = false
  historySavedForGame = false
  resetPlayAnalytics()
  engine.resetToSetup()
  playWelcomeIfNeeded()
}

function scheduleLaunch(): void {
  if (launchScheduled || starting) return
  launchScheduled = true
  // Same tick as the color tap so the browser allows voiceover (no delayed start).
  void startGame()
}

function scheduleRoundTwo(): void {
  if (roundBreakScheduled) return
  roundBreakScheduled = true
  // Fallback if round-break audio fails; engine advances on clip end
  window.setTimeout(() => {
    roundBreakScheduled = false
    if (engine.snapshot().phase === 'roundBreak') {
      engine.beginNextRound()
    }
  }, 20000)
}

function goHome(): void {
  clearAnswerCountdown()
  welcomePlayed = false
  welcomePlaying = false
  cachedPack = null
  selectedBand = null
  roundBreakScheduled = false
  launchScheduled = false
  starting = false
  historySavedForGame = false
  resetPlayAnalytics()
  engine.resetToSetup()
}

/** Confirm only once a round has started — setup can leave immediately. */
function needsExitConfirm(): boolean {
  if (!selectedBand) return false
  const phase = engine.snapshot().phase
  return phase !== 'setup' && phase !== 'roundEnd' && phase !== 'armed'
}

/** Stop audio/session chrome and leave the app for the Mishak hub. */
function exitToHub(): void {
  dismissExitConfirm()
  clearAnswerCountdown()
  try {
    if (!engine.isSessionPaused()) engine.toggleAudioPause()
  } catch {
    /* ignore */
  }
  window.location.assign(hubUrl())
}

function dismissExitConfirm(): void {
  const dlg = document.getElementById('exit-confirm')
  if (dlg instanceof HTMLDialogElement && dlg.open) dlg.close()
  dlg?.remove()
}

function showExitConfirm(): void {
  dismissExitConfirm()
  try {
    if (!engine.isSessionPaused()) engine.toggleAudioPause()
  } catch {
    /* ignore */
  }

  const dlg = document.createElement('dialog')
  dlg.id = 'exit-confirm'
  dlg.className = 'exit-confirm'
  dlg.setAttribute('aria-labelledby', 'exit-confirm-title')

  const card = document.createElement('div')
  card.className = 'exit-confirm__card'

  const title = document.createElement('h2')
  title.id = 'exit-confirm-title'
  title.className = 'exit-confirm__title'
  title.textContent = 'Ieși la hub?'

  const body = document.createElement('p')
  body.className = 'exit-confirm__body'
  body.textContent = 'Jocul se oprește. Scorul acestei partide se pierde.'

  const actions = document.createElement('div')
  actions.className = 'exit-confirm__actions'

  const stay = document.createElement('button')
  stay.type = 'button'
  stay.className = 'btn-start'
  stay.textContent = 'Rămâi'
  stay.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    dismissExitConfirm()
    syncChrome()
  })

  const leave = document.createElement('button')
  leave.type = 'button'
  leave.className = 'btn-start btn-start--hub'
  leave.value = 'leave'
  leave.textContent = 'Ieși'
  leave.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    exitToHub()
  })

  actions.append(stay, leave)
  card.append(title, body, actions)
  dlg.append(card)
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault()
    dismissExitConfirm()
    syncChrome()
  })
  document.body.append(dlg)
  dlg.showModal()
}

function render(snap: SessionSnapshot): void {
  const phone = document.createElement('div')
  phone.className = 'phone'
  phone.dataset.round = String(snap.round)
  phone.dataset.phase = snap.phase

  // Side effects must run AFTER this paint — scheduleLaunch/startGame call
  // render() again; doing that mid-build appended a second .phone (doubled UI).
  let afterPaint: (() => void) | null = null

  if (!selectedBand) {
    phone.classList.add('is-host')
    phone.append(renderHost())
  } else if (snap.phase === 'setup') {
    phone.append(renderSetup(snap))
    afterPaint = () => {
      void ensurePack().then(() => playWelcomeIfNeeded())
    }
  } else if (snap.phase === 'armed') {
    phone.append(renderArena(snap, { interactive: false }))
    afterPaint = () => scheduleLaunch()
  } else if (snap.phase === 'roundBreak') {
    phone.append(renderRoundBreak(snap))
    afterPaint = () => scheduleRoundTwo()
  } else if (snap.phase === 'roundEnd') {
    phone.append(renderEnd(snap))
  } else {
    phone.append(renderArena(snap, { interactive: true }))
  }

  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#163830')

  // Phone only inside #app — chrome FABs live on document.body so replaceChildren
  // never drops them and they stay above the playfield for clicks.
  app!.replaceChildren(phone)
  syncChrome()
  syncAnswerCountdown(snap)
  trackPlayFunnel(snap)
  afterPaint?.()
}

/** Fixed Hub + pause controls on document.body (survives #app re-renders). */
function syncChrome(): void {
  let wrap = document.getElementById('chrome-fabs')
  if (!wrap) {
    wrap = document.createElement('div')
    wrap.id = 'chrome-fabs'
    wrap.className = 'chrome-fabs'
    document.body.append(wrap)
  }

  wrap.replaceChildren()

  // Host topbar already has ← Hub; FAB on setup + play (+ end).
  if (selectedBand) {
    const exit = document.createElement('a')
    exit.className = 'exit-hub-btn'
    exit.href = hubUrl()
    exit.setAttribute('aria-label', 'Oprește și ieși la hub')
    exit.title = '← Hub'
    exit.textContent = '← Hub'
    exit.addEventListener('click', (e) => {
      // Mid-game: confirm first. Setup/end: let the browser follow href (reliable).
      if (!needsExitConfirm()) return
      e.preventDefault()
      e.stopPropagation()
      showExitConfirm()
      syncChrome()
    })
    wrap.append(exit)
  }

  if (engine.canReplayQuestion()) {
    const replay = document.createElement('button')
    replay.type = 'button'
    replay.className = 'replay-btn'
    replay.setAttribute('aria-label', 'Ascultă din nou întrebarea')
    replay.title = 'Ascultă din nou'
    replay.innerHTML =
      '<span class="transport-icon" aria-hidden="true">↻</span>'
    replay.addEventListener('click', (e) => {
      e.stopPropagation()
      engine.unlockAudio()
      engine.replayQuestion()
      syncChrome()
    })
    wrap.append(replay)
  }

  wrap.append(renderTransportButton())
}

function renderTransportButton(): HTMLElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'transport-btn'
  const paused = engine.isSessionPaused()
  btn.setAttribute('aria-label', paused ? 'Continuă' : 'Pauză')
  btn.title = paused ? 'Play' : 'Pauză'
  btn.innerHTML = paused
    ? '<span class="transport-icon" aria-hidden="true">▶</span>'
    : '<span class="transport-icon" aria-hidden="true">⏸</span>'
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    engine.toggleAudioPause()
    syncChrome()
  })
  return btn
}

function renderRoundBreak(snap: SessionSnapshot): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'play-shell setup-shell arena-shell'

  wrap.append(
    chosenColorCard(1, 'Jucătorul 2', snap.playerColors[1], snap.scores[1], {
      mirrored: true,
      active: false,
    }),
  )

  const banner = document.createElement('div')
  banner.className = 'round-break-banner'
  banner.setAttribute('aria-live', 'polite')
  banner.innerHTML = `<span class="round-break-num">${snap.round + 1}</span>`
  banner.setAttribute('aria-label', `Runda ${snap.round + 1}`)
  wrap.append(banner)

  wrap.append(
    chosenColorCard(0, 'Jucătorul 1', snap.playerColors[0], snap.scores[0], {
      mirrored: false,
      active: false,
    }),
  )

  return wrap
}

function hubUrl(): string {
  const h = window.location.hostname
  if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:5174/'
  return 'https://mishak-hub.pages.dev/'
}

/** Parent-facing 2×2 band picker — not mirrored, before color setup. */
function renderHost(): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'host-shell'

  const topbar = document.createElement('div')
  topbar.className = 'host-topbar'
  const brand = document.createElement('a')
  brand.className = 'host-brand'
  brand.href = hubUrl()
  brand.textContent = 'Mishak'
  brand.title = 'Înapoi la hub'
  const actions = document.createElement('div')
  actions.className = 'host-topbar__actions'
  const settingsBtn = document.createElement('button')
  settingsBtn.type = 'button'
  settingsBtn.className = 'host-hub-link'
  settingsBtn.textContent = 'Setări'
  settingsBtn.setAttribute('aria-label', 'Setări audio')
  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    openSettingsDialog()
  })
  const hub = document.createElement('a')
  hub.className = 'host-hub-link'
  hub.href = hubUrl()
  hub.textContent = '← Hub'
  actions.append(settingsBtn, hub)
  topbar.append(brand, actions)
  wrap.append(topbar)

  const heading = document.createElement('h1')
  heading.className = 'host-heading'
  heading.textContent = 'Alege grupa'
  wrap.append(heading)

  const last = renderLastGameCard()
  if (last) wrap.append(last)

  const grid = document.createElement('div')
  grid.className = 'host-grid'
  grid.setAttribute('role', 'group')
  grid.setAttribute('aria-label', 'Alege grupa')

  for (const band of HOST_BANDS) {
    const loaded = !!entitledPack
    const playable = entitledPack
      ? isBandPlayable(entitledPack.questions, band.id)
      : false
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className =
      'host-tile' +
      (playable ? ' is-playable' : loaded ? ' is-soon' : '')
    btn.dataset.band = band.id
    btn.setAttribute('aria-disabled', playable || !loaded ? 'false' : 'true')
    const ariaCore = `${band.label}. ${band.caption}`
    btn.setAttribute(
      'aria-label',
      loaded && !playable ? `${ariaCore}. În curând` : ariaCore,
    )

    const art = document.createElement('img')
    art.className = 'host-tile-art'
    art.src = `/bands/${band.id}.png`
    art.alt = ''
    art.draggable = false
    btn.append(art)

    const copy = document.createElement('span')
    copy.className = 'host-tile-copy'
    copy.setAttribute('aria-hidden', 'true')
    const title = document.createElement('span')
    title.className = 'host-tile-title'
    title.textContent = band.label
    const caption = document.createElement('span')
    caption.className = 'host-tile-caption'
    caption.textContent = band.caption
    copy.append(title, caption)
    btn.append(copy)

    if (loaded && !playable) {
      const soon = document.createElement('span')
      soon.className = 'host-soon'
      soon.setAttribute('aria-hidden', 'true')
      soon.innerHTML =
        '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2M9 6a3 3 0 0 1 6 0v2H9zm8 12H7v-8h10z"/></svg>'
      btn.append(soon)
    }

    btn.addEventListener('click', () => {
      void (async () => {
        let pack: Pack
        try {
          pack = await ensureEntitled()
        } catch (err) {
          console.error(err)
          return
        }
        if (!isBandPlayable(pack.questions, band.id)) {
          btn.classList.remove('is-nudge')
          void btn.offsetWidth
          btn.classList.add('is-nudge')
          return
        }
        await pickBand(band.id)
      })()
    })
    grid.append(btn)
  }

  wrap.append(grid)

  if (!entitledPack && !entitledLoading) {
    entitledLoading = true
    void ensureEntitled()
      .then(() => {
        entitledLoading = false
        if (!selectedBand) render(engine.snapshot())
      })
      .catch((err) => {
        entitledLoading = false
        console.error(err)
        if (!selectedBand) render(engine.snapshot())
      })
  }

  return wrap
}

function openSettingsDialog(): void {
  document.getElementById('settings-dialog')?.remove()
  const s = getSettings()

  const dlg = document.createElement('dialog')
  dlg.id = 'settings-dialog'
  dlg.className = 'settings-dialog'
  dlg.setAttribute('aria-labelledby', 'settings-title')

  const card = document.createElement('div')
  card.className = 'settings-dialog__card'

  const title = document.createElement('h2')
  title.id = 'settings-title'
  title.className = 'settings-dialog__title'
  title.textContent = 'Setări'

  const voLabel = document.createElement('label')
  voLabel.className = 'settings-dialog__row'
  const voText = document.createElement('span')
  voText.textContent = 'Volum voce'
  const vo = document.createElement('input')
  vo.type = 'range'
  vo.min = '0'
  vo.max = '100'
  vo.step = '5'
  vo.value = String(Math.round(s.voVolume * 100))
  vo.setAttribute('aria-label', 'Volum voce')
  vo.addEventListener('input', () => {
    const next = setVoVolume(Number(vo.value) / 100)
    engine.setVoVolume(next.voVolume)
  })
  voLabel.append(voText, vo)

  const sfxLabel = document.createElement('label')
  sfxLabel.className = 'settings-dialog__row'
  const sfxText = document.createElement('span')
  sfxText.textContent = 'Volum sunete'
  const sfx = document.createElement('input')
  sfx.type = 'range'
  sfx.min = '0'
  sfx.max = '100'
  sfx.step = '5'
  sfx.value = String(Math.round(s.sfxVolume * 100))
  sfx.setAttribute('aria-label', 'Volum sunete')
  sfx.addEventListener('input', () => {
    const next = setSfxVolume(Number(sfx.value) / 100)
    engine.setSfxVolume(next.sfxVolume)
  })
  sfxLabel.append(sfxText, sfx)

  const skipLabel = document.createElement('label')
  skipLabel.className = 'settings-dialog__check'
  const skip = document.createElement('input')
  skip.type = 'checkbox'
  skip.checked = s.skipWelcome
  skip.addEventListener('change', () => {
    setSkipWelcome(skip.checked)
  })
  const skipText = document.createElement('span')
  skipText.textContent = 'Sari peste bun venit'
  skipLabel.append(skip, skipText)

  const close = document.createElement('button')
  close.type = 'button'
  close.className = 'btn-start'
  close.textContent = 'Gata'
  close.addEventListener('click', () => {
    dlg.close()
    dlg.remove()
  })

  card.append(title, voLabel, sfxLabel, skipLabel, close)
  dlg.append(card)
  dlg.addEventListener('cancel', () => {
    dlg.remove()
  })
  document.body.append(dlg)
  dlg.showModal()
}

/** Parent-facing last match summary on the host screen. */
function renderLastGameCard(): HTMLElement | null {
  const game = getLastGame()
  if (!game) return null

  const card = document.createElement('section')
  card.className = 'last-game'
  card.setAttribute('aria-label', 'Ultima partidă')

  const kicker = document.createElement('p')
  kicker.className = 'last-game__kicker'
  kicker.textContent = 'Ultima partidă'

  const meta = document.createElement('p')
  meta.className = 'last-game__meta'
  const when = formatPlayedAt(game.at)
  meta.textContent = when
    ? `${bandLabel(game.band)} · ${when}`
    : bandLabel(game.band)

  const row = document.createElement('div')
  row.className = 'last-game__scores'

  const p1 = document.createElement('div')
  p1.className = 'last-game__side'
  const c1 = document.createElement('span')
  c1.className = 'last-game__swatch'
  c1.style.background = game.colors[0]
  c1.title = 'Jucătorul 1'
  const s1 = document.createElement('span')
  s1.className = 'last-game__score'
  s1.textContent = String(game.scores[0])
  p1.append(c1, s1)

  const vs = document.createElement('span')
  vs.className = 'last-game__vs'
  vs.setAttribute('aria-hidden', 'true')
  vs.textContent = '·'

  const p2 = document.createElement('div')
  p2.className = 'last-game__side'
  const s2 = document.createElement('span')
  s2.className = 'last-game__score'
  s2.textContent = String(game.scores[1])
  const c2 = document.createElement('span')
  c2.className = 'last-game__swatch'
  c2.style.background = game.colors[1]
  c2.title = 'Jucătorul 2'
  p2.append(s2, c2)

  row.append(p1, vs, p2)
  card.append(kicker, row, meta)
  return card
}

function renderSetup(snap: SessionSnapshot): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'play-shell setup-shell'

  if (snap.error) {
    const err = document.createElement('p')
    err.className = 'error'
    err.textContent = snap.error
    wrap.append(err)
  }

  wrap.append(
    playerPicker(1, 'Jucătorul 2', {
      color: snap.playerColors[1],
      chosen: snap.colorChosen[1],
      takenColor: snap.colorChosen[0] ? snap.playerColors[0] : '',
      mirrored: true,
    }),
  )

  wrap.append(
    splitCircle({
      large: false,
      interactive: false,
      enabled: false,
      showTimer: false,
      timerSeconds: ANSWER_SECONDS,
    }),
  )

  wrap.append(
    playerPicker(0, 'Jucătorul 1', {
      color: snap.playerColors[0],
      chosen: snap.colorChosen[0],
      takenColor: snap.colorChosen[1] ? snap.playerColors[1] : '',
      mirrored: false,
    }),
  )

  if (QA_ENABLED) {
    wrap.append(qaRoundPicker())
  }

  return wrap
}

function qaRoundPicker(): HTMLElement {
  const bar = document.createElement('div')
  bar.className = 'qa-round-bar'
  bar.setAttribute('aria-label', 'QA: alege runda de start')

  const label = document.createElement('span')
  label.className = 'qa-round-label'
  label.textContent = 'QA rundă'
  bar.append(label)

  for (const n of [1, 2, 3] as const) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'qa-round-btn' + (qaStartRound === n ? ' is-active' : '')
    btn.textContent = `R${n}`
    btn.setAttribute('aria-pressed', String(qaStartRound === n))
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      qaStartRound = n
      render(engine.snapshot())
    })
    bar.append(btn)
  }

  return bar
}

/** Grown circle + large chosen-color boxes (P2 top, P1 bottom). */
function renderArena(
  snap: SessionSnapshot,
  opts: { interactive: boolean },
): HTMLElement {
  const wrap = document.createElement('div')
  const buzzOpen = opts.interactive && snap.buzzEnabled
  const answerOpen =
    opts.interactive && snap.phase === 'awaitingAnswer' && snap.inputEnabled
  wrap.className =
    'play-shell setup-shell arena-shell' +
    (buzzOpen ? ' arena-shell--buzz' : '') +
    (answerOpen ? ' arena-shell--answer' : '')

  if (snap.error) {
    const err = document.createElement('p')
    err.className = 'error'
    err.textContent = snap.error
    wrap.append(err)
  }

  const blinkP2 =
    opts.interactive &&
    ((snap.phase === 'awaitingBuzz' && snap.round >= 2) ||
      (snap.phase === 'awaitingAnswer' && snap.activePlayer === 1))
  const blinkP1 =
    opts.interactive &&
    ((snap.phase === 'awaitingBuzz' && snap.round >= 2) ||
      (snap.phase === 'awaitingAnswer' && snap.activePlayer === 0))

  wrap.append(
    chosenColorCard(1, 'Jucătorul 2', snap.playerColors[1], snap.scores[1], {
      mirrored: true,
      active: blinkP2,
      buzzable: buzzOpen,
    }),
  )

  wrap.append(
    splitCircle({
      large: true,
      interactive: opts.interactive,
      enabled: snap.inputEnabled,
      showTimer:
        snap.phase === 'awaitingBuzz' || snap.phase === 'awaitingAnswer',
      timerSeconds: answerCountdown?.left ?? ANSWER_SECONDS,
      activePlayer: snap.activePlayer,
      mode: buzzOpen ? 'buzz' : answerOpen ? 'answer' : 'idle',
    }),
  )

  wrap.append(
    chosenColorCard(0, 'Jucătorul 1', snap.playerColors[0], snap.scores[0], {
      mirrored: false,
      active: blinkP1,
      buzzable: buzzOpen,
    }),
  )

  return wrap
}

function splitCircle(opts: {
  large: boolean
  interactive: boolean
  enabled: boolean
  showTimer: boolean
  timerSeconds: number
  /** When set, taps in the wrong tabletop half (P2 top / P1 bottom) are ignored. */
  activePlayer?: 0 | 1
  mode?: 'idle' | 'buzz' | 'answer'
}): HTMLElement {
  const circle = document.createElement('div')
  const mode = opts.mode ?? 'idle'
  circle.className =
    'split-circle' +
    (opts.large ? ' split-circle--large' : '') +
    (mode === 'buzz' ? ' split-circle--buzz-wait' : '') +
    (mode === 'answer' ? ' split-circle--answer-hot' : '')
  circle.setAttribute('role', opts.interactive ? 'group' : 'img')
  circle.setAttribute('aria-label', 'Fals sau Adevărat')

  /** Shape + optional text — shape carries meaning without reading (colorblind). */
  const face = (kind: 'fals' | 'adevarat', text: string) => {
    const wrap = document.createElement('span')
    wrap.className = 'split-face'
    const shape = document.createElement('span')
    shape.className = `split-shape split-shape--${kind}`
    shape.setAttribute('aria-hidden', 'true')
    if (kind === 'fals') {
      shape.innerHTML =
        '<svg viewBox="0 0 32 32" focusable="false"><rect x="3" y="3" width="26" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="3"/><path d="M10 10l12 12M22 10L10 22" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>'
    } else {
      shape.innerHTML =
        '<svg viewBox="0 0 32 32" focusable="false"><circle cx="16" cy="16" r="12.5" fill="none" stroke="currentColor" stroke-width="3"/><path d="M9.5 16.5l4.2 4.2L22.5 11" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    }
    const span = document.createElement('span')
    span.className = 'split-label'
    span.textContent = text
    wrap.append(shape, span)
    return wrap
  }

  const tryAnswer = (choice: boolean, e: MouseEvent) => {
    if (opts.activePlayer !== undefined) {
      const mid = window.innerHeight / 2
      const tappedPlayer: 0 | 1 = e.clientY < mid ? 1 : 0
      if (tappedPlayer !== opts.activePlayer) return
    }
    clearAnswerCountdown()
    engine.answer(choice)
  }

  if (opts.interactive) {
    const falsBtn = document.createElement('button')
    falsBtn.type = 'button'
    falsBtn.className = 'split-half fals'
    falsBtn.disabled = !opts.enabled
    falsBtn.setAttribute('aria-label', 'Fals')
    falsBtn.append(face('fals', 'Fals'))
    falsBtn.addEventListener('click', (e) => tryAnswer(false, e))

    const trueBtn = document.createElement('button')
    trueBtn.type = 'button'
    trueBtn.className = 'split-half adevarat'
    trueBtn.disabled = !opts.enabled
    trueBtn.setAttribute('aria-label', 'Adevărat')
    trueBtn.append(face('adevarat', 'Adevărat'))
    trueBtn.addEventListener('click', (e) => tryAnswer(true, e))

    circle.append(falsBtn, trueBtn)
  } else {
    const fals = document.createElement('span')
    fals.className = 'split-half fals'
    fals.append(face('fals', 'Fals'))
    const adevarat = document.createElement('span')
    adevarat.className = 'split-half adevarat'
    adevarat.append(face('adevarat', 'Adevărat'))
    circle.append(fals, adevarat)
  }

  if (opts.showTimer) {
    const timer = document.createElement('div')
    timer.className = 'answer-timer'
    timer.setAttribute('aria-hidden', 'true')
    timer.textContent = String(opts.timerSeconds)
    circle.append(timer)
  }

  return circle
}

function playerPicker(
  player: 0 | 1,
  label: string,
  opts: {
    color: string
    chosen: boolean
    /** Other player's confirmed color — disabled for this picker. */
    takenColor: string
    mirrored: boolean
  },
): HTMLElement {
  const card = document.createElement('section')
  card.className =
    'player-card' +
    (opts.mirrored ? ' player-card--mirror' : '') +
    (opts.chosen ? ' is-chosen' : ' is-picking')
  if (opts.chosen) {
    card.style.color = opts.color
  }

  const header = document.createElement('div')
  header.className = 'player-header'

  const chip = document.createElement('span')
  chip.className = 'player-color-chip' + (opts.chosen ? '' : ' is-empty')
  if (opts.chosen) chip.style.background = opts.color
  chip.setAttribute('aria-hidden', 'true')
  header.append(chip)

  const name = document.createElement('span')
  name.className = 'player-label'
  name.textContent = label
  if (opts.chosen) name.style.color = opts.color
  header.append(name)
  card.append(header)

  const grid = document.createElement('div')
  grid.className = 'swatches'
  grid.setAttribute('role', 'group')
  grid.setAttribute('aria-label', `Culoare ${label}`)

  const taken = opts.takenColor.trim().toLowerCase()

  for (const swatch of SWATCHES) {
    const key = swatch.color.toLowerCase()
    const isActive = opts.chosen && key === opts.color.trim().toLowerCase()
    const isTaken = taken !== '' && key === taken
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className =
      'swatch' + (isActive ? ' is-active' : '') + (isTaken ? ' is-taken' : '')
    btn.style.background = swatch.color
    btn.disabled = isTaken
    btn.setAttribute(
      'aria-label',
      isTaken ? `${swatch.label}, ocupat` : swatch.label,
    )
    btn.setAttribute('aria-pressed', String(isActive))
    if (isActive) {
      const tick = document.createElement('span')
      tick.className = 'swatch-tick'
      tick.setAttribute('aria-hidden', 'true')
      tick.textContent = '✓'
      btn.append(tick)
    }
    if (!isTaken) {
      btn.addEventListener('click', () => engine.setPlayerColor(player, swatch.color))
    }
    grid.append(btn)
  }

  card.append(grid)
  return card
}

function chosenColorCard(
  player: 0 | 1,
  label: string,
  color: string,
  score: number,
  opts: { mirrored: boolean; active: boolean; buzzable?: boolean },
): HTMLElement {
  const card = document.createElement('section')
  card.className =
    'player-card player-card--chosen' +
    (opts.mirrored ? ' player-card--mirror' : '') +
    (opts.active ? ' is-turn' : '') +
    (opts.buzzable ? ' is-buzzable' : '')
  card.style.color = color

  const name = document.createElement('span')
  name.className = 'player-label'
  name.textContent = label
  card.append(name)

  const swatch = document.createElement(opts.buzzable ? 'button' : 'div')
  if (opts.buzzable) {
    const btn = swatch as HTMLButtonElement
    btn.type = 'button'
    btn.className =
      'chosen-swatch chosen-swatch--buzz' + (isLightColor(color) ? ' on-light' : '')
    btn.setAttribute('aria-label', `${label}: apasă ca să răspunzi`)
    btn.addEventListener('click', () => {
      clearAnswerCountdown()
      engine.claim(player)
    })
  } else {
    swatch.className =
      'chosen-swatch' + (isLightColor(color) ? ' on-light' : '')
    swatch.setAttribute('aria-hidden', 'true')
  }
  swatch.style.background = color

  const scoreEl = document.createElement('span')
  scoreEl.className = 'chosen-score'
  scoreEl.textContent = String(score)
  swatch.append(scoreEl)

  card.append(swatch)
  return card
}

function scoreChip(player: 0 | 1, snap: SessionSnapshot): HTMLElement {
  const color = snap.playerColors[player]
  const chip = document.createElement('div')
  chip.className =
    'score-chip' +
    (snap.activePlayer === player && snap.phase !== 'roundEnd' ? ' is-active' : '') +
    (isLightColor(color) ? ' on-light' : '')
  chip.style.background = color

  const value = document.createElement('span')
  value.className = 'score-value'
  value.textContent = String(snap.scores[player])
  chip.append(value)
  return chip
}

function renderEnd(snap: SessionSnapshot): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'end-screen'

  const [a, b] = snap.scores
  const title = document.createElement('h2')
  title.className = 'end-title'
  if (a === b) title.textContent = 'Egalitate'
  else {
    title.innerHTML =
      a > b
        ? '<span class="sr-only">Jucătorul 1 câștigă</span>🏆'
        : '<span class="sr-only">Jucătorul 2 câștigă</span>🏆'
    title.style.color = a > b ? snap.playerColors[0] : snap.playerColors[1]
  }
  wrap.append(title)

  const scores = document.createElement('div')
  scores.className = 'score-row'
  scores.append(scoreChip(0, snap))
  scores.append(scoreChip(1, snap))
  wrap.append(scores)

  const again = document.createElement('button')
  again.type = 'button'
  again.className = 'btn-start'
  again.textContent = 'Din nou'
  again.addEventListener('click', () => {
    playAgain()
  })
  wrap.append(again)

  const home = document.createElement('button')
  home.type = 'button'
  home.className = 'btn-start btn-start--muted'
  home.textContent = 'Altă grupă'
  home.addEventListener('click', () => goHome())
  wrap.append(home)

  const hub = document.createElement('button')
  hub.type = 'button'
  hub.className = 'btn-start btn-start--hub'
  hub.textContent = '← Hub'
  hub.addEventListener('click', () => exitToHub())
  wrap.append(hub)

  wrap.append(createDonateLink())

  return wrap
}

function trackPlayFunnel(snap: SessionSnapshot): void {
  if (snap.phase === 'armed') {
    track('setup_complete', { once: 'setup_complete' })
    return
  }
  if (snap.phase === 'roundBreak') {
    track('round_end', { once: `round_end:${snap.round}`, round: snap.round })
    return
  }
  if (snap.phase === 'roundEnd') {
    track('round_end', { once: `round_end:${snap.round}`, round: snap.round })
    track('game_end', { once: 'game_end' })
    if (!historySavedForGame && selectedBand) {
      historySavedForGame = true
      saveGame({
        band: selectedBand,
        scores: [snap.scores[0], snap.scores[1]],
        colors: [snap.playerColors[0], snap.playerColors[1]],
      })
    }
  }
}

/** Unlock VO on every tap/key. Retry welcome while still on color setup. */
function onAudioGesture(): void {
  engine.unlockAudio()
  if (welcomePlayed) return
  if (!selectedBand || engine.snapshot().phase !== 'setup') return
  void ensurePack().then(() => playWelcomeIfNeeded())
}

document.addEventListener('pointerdown', onAudioGesture)
document.addEventListener('keydown', onAudioGesture)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') engine.unlockAudio()
})

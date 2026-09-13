import './style.css'
import { loadPlayablePack } from './catalog'
import { createDonateLink } from './donate'
import { applyUnlockQueryParam } from './entitlements'
import type { Pack } from './pack/types'
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
let starting = false
let launchScheduled = false
let roundBreakScheduled = false
let cachedPack: Pack | null = null
let welcomePlayed = false
let welcomePlaying = false
let answerCountdown: {
  key: string
  left: number
  intervalId: number
} | null = null

engine.subscribe(render)

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

async function ensurePack(): Promise<Pack> {
  if (cachedPack) return cachedPack
  cachedPack = await loadPlayablePack()
  engine.bindAssets(cachedPack)
  return cachedPack
}

function playWelcomeIfNeeded(): void {
  if (welcomePlayed || welcomePlaying || !cachedPack?.voiceover?.welcome) return
  if (engine.snapshot().phase !== 'setup') return
  welcomePlaying = true
  engine.playClip(
    cachedPack,
    cachedPack.voiceover.welcome,
    () => {
      welcomePlayed = true
      welcomePlaying = false
      document.removeEventListener('pointerdown', onWelcomeGesture)
    },
    () => {
      welcomePlaying = false
    },
  )
}

async function startGame(): Promise<void> {
  if (starting) return
  starting = true
  engine.stopAudio()
  render(engine.snapshot())
  try {
    const pack = await ensurePack()
    await engine.start(pack, QA_ENABLED ? { startRound: qaStartRound } : {})
  } catch (err) {
    console.error(err)
    alert(err instanceof Error ? err.message : 'Nu am putut porni jocul')
    engine.resetToSetup()
  } finally {
    starting = false
    launchScheduled = false
    render(engine.snapshot())
  }
}

async function rematchGame(): Promise<void> {
  if (starting) return
  starting = true
  clearAnswerCountdown()
  roundBreakScheduled = false
  engine.stopAudio()
  render(engine.snapshot())
  try {
    const pack = await ensurePack()
    await engine.rematch(pack, QA_ENABLED ? { startRound: qaStartRound } : {})
  } catch (err) {
    console.error(err)
    alert(err instanceof Error ? err.message : 'Nu am putut reporni jocul')
    engine.resetToSetup()
  } finally {
    starting = false
    launchScheduled = false
    render(engine.snapshot())
  }
}

function scheduleLaunch(): void {
  if (launchScheduled || starting) return
  launchScheduled = true
  window.setTimeout(() => {
    void startGame()
  }, 500)
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
  engine.resetToSetup()
  void ensurePack().then(() => playWelcomeIfNeeded())
}

function render(snap: SessionSnapshot): void {
  app!.innerHTML = ''
  const phone = document.createElement('div')
  phone.className = 'phone'

  if (snap.phase === 'setup') {
    phone.append(renderSetup(snap))
    void ensurePack().then(() => playWelcomeIfNeeded())
  } else if (snap.phase === 'armed') {
    phone.append(renderArena(snap, { interactive: false }))
    scheduleLaunch()
  } else if (snap.phase === 'roundBreak') {
    phone.append(renderRoundBreak(snap))
    scheduleRoundTwo()
  } else if (snap.phase === 'roundEnd') {
    phone.append(renderEnd(snap))
  } else {
    phone.append(renderArena(snap, { interactive: true }))
  }

  app!.append(phone)
  app!.append(renderTransportButton())
  syncAnswerCountdown(snap)
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
    // Refresh only the button, not the whole screen (avoids restarting timers)
    const next = renderTransportButton()
    btn.replaceWith(next)
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
  wrap.className = 'play-shell setup-shell arena-shell'

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
      buzzable: opts.interactive && snap.buzzEnabled,
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
    }),
  )

  wrap.append(
    chosenColorCard(0, 'Jucătorul 1', snap.playerColors[0], snap.scores[0], {
      mirrored: false,
      active: blinkP1,
      buzzable: opts.interactive && snap.buzzEnabled,
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
}): HTMLElement {
  const circle = document.createElement('div')
  circle.className = 'split-circle' + (opts.large ? ' split-circle--large' : '')
  circle.setAttribute('role', opts.interactive ? 'group' : 'img')
  circle.setAttribute('aria-label', 'Fals sau Adevărat')

  const label = (text: string) => {
    const span = document.createElement('span')
    span.className = 'split-label'
    span.textContent = text
    return span
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
    falsBtn.append(label('Fals'))
    falsBtn.addEventListener('click', (e) => tryAnswer(false, e))

    const trueBtn = document.createElement('button')
    trueBtn.type = 'button'
    trueBtn.className = 'split-half adevarat'
    trueBtn.disabled = !opts.enabled
    trueBtn.setAttribute('aria-label', 'Adevărat')
    trueBtn.append(label('Adevărat'))
    trueBtn.addEventListener('click', (e) => tryAnswer(true, e))

    circle.append(falsBtn, trueBtn)
  } else {
    const fals = document.createElement('span')
    fals.className = 'split-half fals'
    fals.append(label('Fals'))
    const adevarat = document.createElement('span')
    adevarat.className = 'split-half adevarat'
    adevarat.append(label('Adevărat'))
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
    void rematchGame()
  })
  wrap.append(again)

  const home = document.createElement('button')
  home.type = 'button'
  home.className = 'btn-start'
  home.style.background = '#64748b'
  home.textContent = 'Acasă'
  home.addEventListener('click', () => goHome())
  wrap.append(home)

  wrap.append(createDonateLink())

  return wrap
}

/** Retry welcome until it plays (or leave setup). Gesture unlocks autoplay on iOS. */
function onWelcomeGesture(): void {
  const phase = engine.snapshot().phase
  if (phase !== 'setup' || welcomePlayed) {
    document.removeEventListener('pointerdown', onWelcomeGesture)
    return
  }
  void ensurePack().then(() => playWelcomeIfNeeded())
}

document.addEventListener('pointerdown', onWelcomeGesture)

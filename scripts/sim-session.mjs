/**
 * Headless session simulation (no browser).
 * Happy path: clips end immediately → R1, R2, R3, 10 questions each.
 * Autoplay-block: every play() fails with NotAllowedError → must stay on round 1.
 */
import { pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/** @type {'end' | 'block'} */
let audioMode = 'end'

class FakeAudio {
  constructor(src) {
    this.src = src ?? ''
    this.paused = true
    this.ended = false
    this.muted = false
    this.preload = 'auto'
    this._ended = []
    this._error = []
  }

  get currentSrc() {
    return this.src
  }

  addEventListener(type, cb) {
    if (type === 'ended') this._ended.push(cb)
    if (type === 'error') this._error.push(cb)
  }

  play() {
    if (audioMode === 'block') {
      const err = new Error("play() failed because the user didn't interact with the document first.")
      err.name = 'NotAllowedError'
      return Promise.reject(err)
    }
    this.paused = false
    this.ended = false
    queueMicrotask(() => {
      this.ended = true
      this.paused = true
      for (const cb of this._ended) cb()
    })
    return Promise.resolve()
  }

  pause() {
    this.paused = true
  }

  load() {}

  removeAttribute() {
    this.src = ''
  }
}

globalThis.Audio = FakeAudio

const { SessionEngine } = await import(pathToFileURL(join(root, 'src/session/engine.ts')).href)

function makePack() {
  const questions = Array.from({ length: 30 }, (_, i) => ({
    id: `q${String(i + 1).padStart(3, '0')}`,
    correct: true,
    ageBand: 'mic',
    audio: { question: `audio/q${i + 1}.mp3` },
  }))
  return {
    id: 'sim',
    title: 'sim',
    baseUrl: '/packs/sim',
    voiceover: {
      gameStart: 'vo/game-start.mp3',
      firstQuestionCue: 'vo/first.mp3',
      raceRoundStart: 'vo/race.mp3',
      round3Start: 'vo/r3.mp3',
      answerIsTrue: 'vo/true.mp3',
      answerIsFalse: 'vo/false.mp3',
    },
    feedback: {
      correct: 'feedback/ok.mp3',
      incorrect: 'feedback/no.mp3',
      nextTurn: 'feedback/next.mp3',
      roundBreak: 'feedback/break.mp3',
      roundBreakTo3: 'feedback/break3.mp3',
    },
    sfx: {},
    questions,
  }
}

async function drain(n = 25) {
  for (let i = 0; i < n; i++) await Promise.resolve()
}

async function runGame(mode) {
  audioMode = mode
  const engine = new SessionEngine()
  const log = []
  engine.subscribe((snap) => {
    const line = `r${snap.round} ${snap.phase} qInRound=${snap.questionInRound}`
    if (log[log.length - 1] !== line) log.push(line)
  })

  engine.setPlayerColor(0, '#3B82F6')
  engine.setPlayerColor(1, '#F5C542')
  await engine.start(makePack())

  const seenRounds = new Set()
  const questionsPerRound = new Map()

  for (let step = 0; step < 400; step++) {
    await drain()
    const snap = engine.snapshot()
    seenRounds.add(snap.round)

    if (snap.phase === 'roundEnd') break

    if (snap.phase === 'awaitingBuzz') {
      engine.claim(0)
      continue
    }

    if (snap.phase === 'awaitingAnswer') {
      const key = snap.round
      questionsPerRound.set(key, (questionsPerRound.get(key) ?? 0) + (snap.round === 3 ? 0.5 : 1))
      engine.answer(true)
      continue
    }

    if (mode === 'block') break
  }

  return { snap: engine.snapshot(), seenRounds, questionsPerRound, log }
}

function fail(msg) {
  console.error(`FAIL ${msg}`)
  process.exit(1)
}

const happy = await runGame('end')
const happyCounts = Object.fromEntries([...happy.questionsPerRound.entries()])
console.log('AUDIO_MODE=end')
console.log(`final: r${happy.snap.round} ${happy.snap.phase}`)
console.log(`rounds seen: ${[...happy.seenRounds].join(',')}`)
console.log(`answers: ${JSON.stringify(happyCounts)}`)
if (
  happy.snap.phase !== 'roundEnd' ||
  happy.snap.round !== 3 ||
  !happy.seenRounds.has(1) ||
  !happy.seenRounds.has(2) ||
  !happy.seenRounds.has(3) ||
  (happyCounts[1] ?? 0) < 10 ||
  (happyCounts[2] ?? 0) < 10 ||
  (happyCounts[3] ?? 0) < 10
) {
  console.log(happy.log.join('\n'))
  fail('happy path: expected 10+10+10 questions then roundEnd at round 3')
}
console.log('PASS happy path: R1 → R2 → R3, 10 questions each')

const blocked = await runGame('block')
console.log('AUDIO_MODE=block')
console.log(`final: r${blocked.snap.round} ${blocked.snap.phase}`)
console.log(`rounds seen: ${[...blocked.seenRounds].join(',')}`)
console.log('phase log:')
for (const line of blocked.log) console.log(`  ${line}`)
if (
  blocked.seenRounds.has(3) ||
  blocked.snap.round >= 3 ||
  blocked.snap.phase === 'roundEnd'
) {
  fail('autoplay-block: engine skipped ahead to round 3 / end instead of waiting')
}
if (blocked.snap.round !== 1) {
  fail(`autoplay-block: expected to stay on round 1, got round ${blocked.snap.round} ${blocked.snap.phase}`)
}
console.log('PASS autoplay-block: stayed on round 1 (did not skip to round 3)')

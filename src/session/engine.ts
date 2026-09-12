import type { Answer, Pack, PackSfx, PlayerId } from '../pack/types'
import { assetUrl, clipUrl, nextTurnUrl, pickClip } from '../pack/types'
import { AudioPlayer } from '../audio/player'
import { SfxPlayer } from '../audio/sfx'

export type Phase =
  | 'setup'
  | 'armed'
  | 'playingQuestion'
  | 'awaitingBuzz'
  | 'awaitingAnswer'
  | 'playingFeedback'
  | 'nextTurn'
  | 'roundBreak'
  | 'roundEnd'

export type PlayerColors = [string, string]

/** Each round: 10 questions. R1 alternate · R2 buzz · R3 same-Q both. */
export const QUESTIONS_PER_PLAYER_PER_ROUND = 5
export const QUESTIONS_PER_ROUND = QUESTIONS_PER_PLAYER_PER_ROUND * 2
export const TOTAL_ROUNDS = 3

export type StartRound = 1 | 2 | 3

export type StartOptions = {
  /** QA only: begin at this round (skips prior decks). Default 1. */
  startRound?: StartRound
}

export type SessionSnapshot = {
  phase: Phase
  pack: Pack | null
  questionIndex: number
  questionInRound: number
  round: number
  activePlayer: PlayerId
  scores: [number, number]
  playerColors: PlayerColors
  colorChosen: [boolean, boolean]
  lastCorrect: boolean | null
  /** True/False halves enabled */
  inputEnabled: boolean
  /** Color squares act as buzzers (round 2) */
  buzzEnabled: boolean
  error: string | null
}

type Listener = (snap: SessionSnapshot) => void

const UNSET_COLOR = ''

function sameColor(a: string, b: string): boolean {
  if (!a.trim() || !b.trim()) return false
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

export class SessionEngine {
  private pack: Pack | null = null
  /** Pack kept for SFX/VO during setup (before `start`). */
  private assets: Pack | null = null
  private phase: Phase = 'setup'
  /** Remaining pack indices for this game (shuffled); rounds draw without replacement. */
  private sessionPool: number[] = []
  /** Pack indices for the current round. */
  private roundDeck: number[] = []
  private questionIndex = 0
  private questionInRound = 0
  private round = 1
  private activePlayer: PlayerId = 0
  /** Round 3: 0 = P1 still to answer this Q; 1 = P2 answering same Q. */
  private sameQuestionPass = 0
  /**
   * Round 3 locked choices before reveal.
   * `undefined` = not yet; `null` = timeout (0 pts); boolean = T/F.
   */
  private r3Locks: [Answer | null | undefined, Answer | null | undefined] = [
    undefined,
    undefined,
  ]
  private scores: [number, number] = [0, 0]
  private playerColors: PlayerColors = [UNSET_COLOR, UNSET_COLOR]
  private colorChosen: [boolean, boolean] = [false, false]
  private lastCorrect: boolean | null = null
  private error: string | null = null
  /** Freezes VO/SFX and the UI answer timer when true. */
  private sessionPaused = false
  private readonly audio = new AudioPlayer()
  private readonly sfx = new SfxPlayer()
  private readonly listeners = new Set<Listener>()

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    listener(this.snapshot())
    return () => this.listeners.delete(listener)
  }

  /** Bind pack early so setup SFX / welcome resolve paths. */
  bindAssets(pack: Pack): void {
    this.assets = pack
  }

  snapshot(): SessionSnapshot {
    return {
      phase: this.phase,
      pack: this.pack,
      questionIndex: this.questionIndex,
      questionInRound: this.questionInRound,
      round: this.round,
      activePlayer: this.activePlayer,
      scores: [...this.scores],
      playerColors: [...this.playerColors],
      colorChosen: [...this.colorChosen],
      lastCorrect: this.lastCorrect,
      inputEnabled: this.phase === 'awaitingAnswer',
      buzzEnabled: this.phase === 'awaitingBuzz',
      error: this.error,
    }
  }

  /** Play a pack-relative clip or a random variant from a ClipRef. */
  playClip(
    pack: Pack,
    relative: string | string[],
    onEnded?: () => void,
    onError?: (err: Error) => void,
  ): void {
    const rel = pickClip(relative)
    if (!rel) return
    this.audio.play(assetUrl(pack, rel), onEnded, onError)
  }

  playSfx(key: keyof PackSfx): void {
    const pack = this.pack ?? this.assets
    const entry = pack?.sfx?.[key]
    if (!pack || !entry) return
    const rel = Array.isArray(entry)
      ? entry[Math.floor(Math.random() * entry.length)]
      : entry
    if (!rel) return
    this.sfx.play(assetUrl(pack, rel))
  }

  private startWaitingLoop(): void {
    const pack = this.pack ?? this.assets
    const entry = pack?.sfx?.waiting
    if (!pack || !entry) return
    const rel = Array.isArray(entry)
      ? entry[Math.floor(Math.random() * entry.length)]
      : entry
    if (!rel) return
    this.sfx.playLoop(assetUrl(pack, rel))
  }

  private stopWaitingLoop(): void {
    this.sfx.stopLoop()
  }

  stopAudio(): void {
    this.stopWaitingLoop()
    this.audio.stop()
    this.sessionPaused = false
  }

  /** @returns true if now paused (session + timer) */
  toggleAudioPause(): boolean {
    const pausable =
      this.phase === 'playingQuestion' ||
      this.phase === 'awaitingBuzz' ||
      this.phase === 'awaitingAnswer' ||
      this.phase === 'playingFeedback' ||
      this.phase === 'nextTurn' ||
      this.phase === 'roundBreak'

    if (!pausable) {
      return this.sessionPaused
    }

    this.sessionPaused = !this.sessionPaused
    if (this.sessionPaused) {
      this.audio.pause()
      this.sfx.pauseLoop()
    } else {
      if (this.audio.hasActiveClip) this.audio.resume()
      if (this.phase === 'awaitingAnswer' || this.phase === 'awaitingBuzz') {
        this.sfx.resumeLoop()
      }
    }
    return this.sessionPaused
  }

  isAudioPaused(): boolean {
    return this.sessionPaused
  }

  isSessionPaused(): boolean {
    return this.sessionPaused
  }

  hasAudioClip(): boolean {
    return this.audio.hasActiveClip
  }

  private clearPause(): void {
    this.sessionPaused = false
  }

  setPlayerColor(player: PlayerId, color: string): void {
    if (this.phase !== 'setup') return
    const other: PlayerId = player === 0 ? 1 : 0
    // Exclusive: cannot take the other player's confirmed color
    if (this.colorChosen[other] && sameColor(this.playerColors[other], color)) {
      return
    }
    this.playerColors[player] = color
    this.colorChosen[player] = true
    this.playSfx('colorSelect')
    if (this.colorChosen[0] && this.colorChosen[1]) {
      this.phase = 'armed'
    }
    this.emit()
  }

  async start(pack: Pack, opts: StartOptions = {}): Promise<void> {
    this.stopWaitingLoop()
    this.audio.stop()
    this.clearPause()
    this.pack = pack
    this.ensurePackSize(pack)
    this.questionInRound = 0
    this.sameQuestionPass = 0
    this.r3Locks = [undefined, undefined]
    this.activePlayer = 0
    this.scores = [0, 0]
    this.lastCorrect = null
    this.error = null
    this.dealSessionPool(pack)
    this.beginAtRound(opts.startRound ?? 1)
  }

  /**
   * New game keeping chosen colors (end-screen „Din nou”).
   * Caller must already have colors chosen from the previous session.
   */
  async rematch(pack: Pack, opts: StartOptions = {}): Promise<void> {
    const colors: PlayerColors = [...this.playerColors]
    this.stopWaitingLoop()
    this.audio.stop()
    this.clearPause()
    this.pack = pack
    this.assets = pack
    this.ensurePackSize(pack)
    this.questionInRound = 0
    this.sameQuestionPass = 0
    this.r3Locks = [undefined, undefined]
    this.activePlayer = 0
    this.scores = [0, 0]
    this.playerColors = colors
    this.colorChosen = [true, true]
    this.lastCorrect = null
    this.error = null
    this.dealSessionPool(pack)
    this.beginAtRound(opts.startRound ?? 1)
  }

  /** Skip prior rounds' decks and jump to intro for `startRound`. */
  private beginAtRound(startRound: StartRound): void {
    const round = Math.min(TOTAL_ROUNDS, Math.max(1, startRound)) as StartRound
    const discard = QUESTIONS_PER_ROUND * (round - 1)
    if (this.sessionPool.length < discard + QUESTIONS_PER_ROUND) {
      throw new Error(
        `Not enough questions to start at round ${round}: need ${discard + QUESTIONS_PER_ROUND}, have ${this.sessionPool.length}`,
      )
    }
    if (discard > 0) {
      this.sessionPool.splice(0, discard)
    }
    this.round = round
    this.dealRoundDeck()
    if (round === 1) {
      this.playIntroThenFirstQuestion()
    } else if (round === 2) {
      this.playRaceIntroThenQuestion()
    } else {
      this.playRound3IntroThenQuestion()
    }
  }

  /** Continue into the next round after `roundBreak`. */
  beginNextRound(): void {
    if (this.phase !== 'roundBreak' || !this.pack) return
    this.clearPause()
    this.round += 1
    this.questionInRound = 0
    this.sameQuestionPass = 0
    this.r3Locks = [undefined, undefined]
    this.activePlayer = 0
    this.lastCorrect = null
    this.error = null
    this.dealRoundDeck()
    if (this.round === 2) {
      this.playRaceIntroThenQuestion()
    } else if (this.round === 3) {
      this.playRound3IntroThenQuestion()
    } else {
      this.playHandoffThenQuestion()
    }
  }

  resetToSetup(): void {
    this.stopWaitingLoop()
    this.audio.stop()
    this.clearPause()
    this.pack = null
    this.phase = 'setup'
    this.sessionPool = []
    this.roundDeck = []
    this.questionIndex = 0
    this.questionInRound = 0
    this.sameQuestionPass = 0
    this.r3Locks = [undefined, undefined]
    this.round = 1
    this.activePlayer = 0
    this.scores = [0, 0]
    this.colorChosen = [false, false]
    this.playerColors = [UNSET_COLOR, UNSET_COLOR]
    this.lastCorrect = null
    this.error = null
    this.emit()
  }

  /** Round 2: first player to tap their color square claims the question. */
  claim(player: PlayerId): void {
    if (this.phase !== 'awaitingBuzz' || !this.pack || this.sessionPaused) return
    this.activePlayer = player
    this.playSfx('colorSelect')
    this.phase = 'awaitingAnswer'
    this.emit()
  }

  answer(choice: Answer): void {
    if (this.phase !== 'awaitingAnswer' || !this.pack || this.sessionPaused) return
    const q = this.pack.questions[this.questionIndex]
    if (!q) return

    this.clearPause()
    this.stopWaitingLoop()
    this.playSfx('answerTap')

    if (this.round === 3) {
      this.lockRound3Choice(choice)
      return
    }

    const isCorrect = choice === q.correct
    this.lastCorrect = isCorrect
    this.applyAnswerScore(isCorrect)

    this.phase = 'playingFeedback'
    this.emit()

    this.playSfx(isCorrect ? 'correct' : 'incorrect')

    const feedbackPath = isCorrect
      ? (q.audio.correct ?? pickClip(this.pack.feedback.correct))
      : (q.audio.incorrect ?? pickClip(this.pack.feedback.incorrect))

    if (!feedbackPath) {
      this.afterFeedback()
      return
    }

    this.audio.play(
      assetUrl(this.pack, feedbackPath),
      () => this.afterFeedback(),
      (err) => this.fail(err),
    )
  }

  /**
   * Timer expired while waiting for T/F.
   * R1/R3: no points. R2 (after buzz): treat as wrong → +1 opponent.
   * R3 timeout: lock as no-answer (0 pts), continue to other player / reveal.
   */
  timeout(): void {
    if (this.phase !== 'awaitingAnswer' || !this.pack || this.sessionPaused) return
    const q = this.pack.questions[this.questionIndex]
    if (!q) return

    this.clearPause()
    this.stopWaitingLoop()

    if (this.round === 3) {
      this.lockRound3Choice(null)
      return
    }

    this.lastCorrect = false
    if (this.round === 2) {
      this.applyAnswerScore(false)
    }
    this.phase = 'playingFeedback'
    this.emit()

    this.playSfx('incorrect')
    const feedbackPath = q.audio.incorrect ?? pickClip(this.pack.feedback.incorrect)
    if (!feedbackPath) {
      this.afterFeedback()
      return
    }
    this.audio.play(
      assetUrl(this.pack, feedbackPath),
      () => this.afterFeedback(),
      (err) => this.fail(err),
    )
  }

  /** Round 2: nobody buzzed in time — 0 points, timeout VO, next question. */
  buzzTimeout(): void {
    if (this.phase !== 'awaitingBuzz' || !this.pack || this.sessionPaused) return

    this.clearPause()
    this.stopWaitingLoop()
    this.lastCorrect = null
    this.phase = 'playingFeedback'
    this.emit()

    this.playSfx('incorrect')
    const path =
      pickClip(this.pack.feedback.buzzTimeout) ?? pickClip(this.pack.feedback.incorrect)
    if (!path) {
      this.afterFeedback()
      return
    }
    this.audio.play(
      assetUrl(this.pack, path),
      () => this.afterFeedback(),
      (err) => this.fail(err),
    )
  }

  private applyAnswerScore(isCorrect: boolean): void {
    if (this.round === 2) {
      if (isCorrect) {
        this.scores[this.activePlayer] += 2
      } else {
        const other: PlayerId = this.activePlayer === 0 ? 1 : 0
        this.scores[other] += 1
      }
      return
    }
    // R1 (+ R3 via revealRound3): +1 if correct
    if (isCorrect) {
      this.scores[this.activePlayer] += 1
    }
  }

  /** Lock R3 choice without spoil; after both players → shared reveal. */
  private lockRound3Choice(choice: Answer | null): void {
    this.r3Locks[this.activePlayer] = choice
    this.lastCorrect = null
    this.emit()

    if (this.sameQuestionPass === 0) {
      this.sameQuestionPass = 1
      this.activePlayer = 1
      this.playHandoffThenAwaitAnswer()
      return
    }

    this.revealRound3()
  }

  /** Score both R3 locks, play „Răspunsul este Adevărat/Fals”, then advance. */
  private revealRound3(): void {
    if (!this.pack) return
    const q = this.pack.questions[this.questionIndex]
    if (!q) {
      this.afterFeedback()
      return
    }

    for (const player of [0, 1] as const) {
      const locked = this.r3Locks[player]
      if (locked === undefined || locked === null) continue
      if (locked === q.correct) {
        this.scores[player] += 1
      }
    }

    this.phase = 'playingFeedback'
    this.lastCorrect = null
    this.emit()

    const vo = this.pack.voiceover
    const revealRel = q.correct
      ? pickClip(vo?.answerIsTrue)
      : pickClip(vo?.answerIsFalse)

    if (!revealRel) {
      this.afterFeedback()
      return
    }

    this.audio.play(
      assetUrl(this.pack, revealRel),
      () => this.afterFeedback(),
      (err) => this.fail(err),
    )
  }

  private ensurePackSize(pack: Pack): void {
    const needed = QUESTIONS_PER_ROUND * TOTAL_ROUNDS
    if (pack.questions.length < needed) {
      throw new Error(
        `Pack needs at least ${needed} questions (${TOTAL_ROUNDS} rounds × ${QUESTIONS_PER_ROUND}); has ${pack.questions.length}`,
      )
    }
  }

  private dealSessionPool(pack: Pack): void {
    const indices = Array.from({ length: pack.questions.length }, (_, i) => i)
    this.sessionPool = shuffleInPlace(indices)
  }

  private dealRoundDeck(): void {
    if (this.sessionPool.length < QUESTIONS_PER_ROUND) {
      throw new Error(
        `Not enough unused questions for round ${this.round}: need ${QUESTIONS_PER_ROUND}, have ${this.sessionPool.length}`,
      )
    }
    this.roundDeck = this.sessionPool.splice(0, QUESTIONS_PER_ROUND)
    this.questionInRound = 0
    this.sameQuestionPass = 0
    this.r3Locks = [undefined, undefined]
    this.questionIndex = this.roundDeck[0]!
  }

  private playIntroThenFirstQuestion(): void {
    if (!this.pack) return
    const vo = this.pack.voiceover
    const chain: string[] = []
    const gameStart = pickClip(vo?.gameStart)
    if (gameStart) chain.push(gameStart)

    const colorKey = this.playerColors[this.activePlayer].trim().toLowerCase()
    const handoffRel =
      pickClip(this.pack.feedback.nextTurnByColor?.[colorKey]) ??
      pickClip(this.pack.feedback.nextTurn)
    if (handoffRel) chain.push(handoffRel)

    const firstCue = pickClip(vo?.firstQuestionCue)
    if (firstCue) chain.push(firstCue)

    const playNext = (i: number) => {
      if (!this.pack) return
      if (i >= chain.length) {
        this.playCurrentQuestion()
        return
      }
      this.phase = 'nextTurn'
      this.emit()
      this.audio.play(
        assetUrl(this.pack, chain[i]!),
        () => playNext(i + 1),
        (err) => this.fail(err),
      )
    }

    playNext(0)
  }

  private playRaceIntroThenQuestion(): void {
    if (!this.pack) return
    const url = clipUrl(this.pack, this.pack.voiceover?.raceRoundStart)
    if (!url) {
      this.playCurrentQuestion()
      return
    }
    this.phase = 'nextTurn'
    this.emit()
    this.audio.play(
      url,
      () => this.playCurrentQuestion(),
      (err) => this.fail(err),
    )
  }

  private playRound3IntroThenQuestion(): void {
    if (!this.pack) return
    const url = clipUrl(this.pack, this.pack.voiceover?.round3Start)
    if (!url) {
      this.activePlayer = 0
      this.sameQuestionPass = 0
      this.playCurrentQuestion()
      return
    }
    this.phase = 'nextTurn'
    this.emit()
    this.audio.play(
      url,
      () => {
        this.activePlayer = 0
        this.sameQuestionPass = 0
        this.playCurrentQuestion()
      },
      (err) => this.fail(err),
    )
  }

  private playHandoffThenQuestion(): void {
    if (!this.pack) return
    const url = nextTurnUrl(this.pack, this.playerColors[this.activePlayer])
    if (!url) {
      this.playCurrentQuestion()
      return
    }
    this.phase = 'nextTurn'
    this.emit()
    this.audio.play(
      url,
      () => this.playCurrentQuestion(),
      (err) => this.fail(err),
    )
  }

  /** Round 3: after P1, handoff to P2 without replaying the question. */
  private playHandoffThenAwaitAnswer(): void {
    if (!this.pack) return
    const url = nextTurnUrl(this.pack, this.playerColors[this.activePlayer])
    const goAwait = () => {
      this.phase = 'awaitingAnswer'
      this.lastCorrect = null
      this.emit()
      this.startWaitingLoop()
    }
    if (!url) {
      goAwait()
      return
    }
    this.phase = 'nextTurn'
    this.emit()
    this.audio.play(url, goAwait, (err) => this.fail(err))
  }

  private playCurrentQuestion(): void {
    if (!this.pack) return
    const q = this.pack.questions[this.questionIndex]
    if (!q) {
      this.phase = 'roundEnd'
      this.emit()
      return
    }

    if (this.round === 3) {
      this.sameQuestionPass = 0
      this.r3Locks = [undefined, undefined]
      this.activePlayer = 0
    }

    this.phase = 'playingQuestion'
    this.lastCorrect = null
    this.emit()

    this.audio.play(
      assetUrl(this.pack, q.audio.question),
      () => {
        if (this.round === 2) {
          this.phase = 'awaitingBuzz'
        } else {
          this.phase = 'awaitingAnswer'
        }
        this.emit()
        this.startWaitingLoop()
      },
      (err) => this.fail(err),
    )
  }

  private afterFeedback(): void {
    if (!this.pack) return
    this.clearPause()
    this.error = null

    // R3 dual-answer: after shared reveal, both passes are done (sameQuestionPass === 1).
    // Legacy early handoff removed — P2 is prompted before reveal via lockRound3Choice.

    const finishedQuestion =
      this.round !== 3 || this.sameQuestionPass === 1

    if (finishedQuestion && this.questionInRound >= QUESTIONS_PER_ROUND - 1) {
      if (this.round >= TOTAL_ROUNDS) {
        this.phase = 'roundEnd'
        this.emit()
        this.playSfx('victory')
        return
      }
      this.phase = 'roundBreak'
      this.emit()
      this.playSfx('roundBreak')
      const breakEntry =
        this.round === 1
          ? this.pack.feedback.roundBreak
          : (this.pack.feedback.roundBreakTo3 ?? this.pack.feedback.roundBreak)
      const breakAudio = pickClip(breakEntry)
      if (breakAudio) {
        this.audio.play(
          assetUrl(this.pack, breakAudio),
          () => this.beginNextRound(),
          () => this.beginNextRound(),
        )
      } else {
        this.beginNextRound()
      }
      return
    }

    // Advance to next question in round
    this.sameQuestionPass = 0
    this.r3Locks = [undefined, undefined]
    this.questionInRound += 1
    this.questionIndex = this.roundDeck[this.questionInRound]!

    if (this.round === 2) {
      this.playCurrentQuestion()
      return
    }

    if (this.round === 3) {
      this.activePlayer = 0
      this.playCurrentQuestion()
      return
    }

    // Round 1: alternate who starts the next question
    this.activePlayer = this.activePlayer === 0 ? 1 : 0
    this.playHandoffThenQuestion()
  }

  /** Skip current question with no score change (audio failed before a fair answer). */
  private skipQuestionNoScore(): void {
    this.stopWaitingLoop()
    this.audio.stop()
    this.lastCorrect = null
    this.afterFeedback()
  }

  private fail(err: Error): void {
    this.error = err.message
    if (this.phase === 'playingFeedback') {
      this.afterFeedback()
      return
    }
    // R3: handoff to P2 failed after P1 locked — still let P2 answer (no spoil).
    if (
      this.round === 3 &&
      this.r3Locks[0] !== undefined &&
      this.r3Locks[1] === undefined &&
      (this.phase === 'nextTurn' || this.phase === 'playingQuestion')
    ) {
      this.sameQuestionPass = 1
      this.activePlayer = 1
      this.phase = 'awaitingAnswer'
      this.lastCorrect = null
      this.emit()
      this.startWaitingLoop()
      return
    }
    if (this.phase === 'playingQuestion' || this.phase === 'nextTurn') {
      this.skipQuestionNoScore()
      return
    }
    this.emit()
  }

  private emit(): void {
    const snap = this.snapshot()
    for (const listener of this.listeners) listener(snap)
  }
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]!
    arr[i] = arr[j]!
    arr[j] = tmp
  }
  return arr
}

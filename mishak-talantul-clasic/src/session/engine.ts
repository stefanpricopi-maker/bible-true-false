import {
  buildDrillDeck,
  buildExamDeck,
  emptyDraft,
  gradeAnswer,
  isDraftComplete,
  sectionAllOrNothing,
  summarizeScores,
  type ScoreSummary,
} from '../score'
import type {
  ClassicCategory,
  DraftAnswer,
  ExamBlueprint,
  GradedItem,
  Pack,
  Question,
  SessionMode,
} from '../types'
import { DEFAULT_BLUEPRINT } from '../types'

export type Phase =
  | 'disclaimer'
  | 'home'
  | 'category'
  | 'biblio'
  | 'session'
  | 'drillPick'
  | 'playing'
  | 'review'
  | 'end'

export type DrillFilter = {
  book?: string
  chapter?: number
}

export type SessionSnapshot = {
  phase: Phase
  category: ClassicCategory | null
  mode: SessionMode | null
  drillFilter: DrillFilter | null
  timerEnabled: boolean
  timerSecondsLeft: number | null
  index: number
  total: number
  question: Question | null
  draft: DraftAnswer | null
  lastGrade: GradedItem | null
  summary: ScoreSummary | null
  error: string | null
}

type Listener = (snap: SessionSnapshot) => void

export class CoopSession {
  private phase: Phase = 'disclaimer'
  private category: ClassicCategory | null = null
  private mode: SessionMode | null = null
  private drillFilter: DrillFilter | null = null
  private timerEnabled = false
  private timerSecondsLeft: number | null = null
  private deck: Question[] = []
  private pointsMax: number[] = []
  private blueprint: ExamBlueprint = DEFAULT_BLUEPRINT
  private index = 0
  private draft: DraftAnswer | null = null
  private grades: GradedItem[] = []
  private lastGrade: GradedItem | null = null
  private summary: ScoreSummary | null = null
  private error: string | null = null
  private readonly listeners = new Set<Listener>()

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    fn(this.snapshot())
    return () => this.listeners.delete(fn)
  }

  snapshot(): SessionSnapshot {
    return {
      phase: this.phase,
      category: this.category,
      mode: this.mode,
      drillFilter: this.drillFilter,
      timerEnabled: this.timerEnabled,
      timerSecondsLeft: this.timerSecondsLeft,
      index: this.index,
      total: this.deck.length,
      question: this.deck[this.index] ?? null,
      draft: this.draft,
      lastGrade: this.lastGrade,
      summary: this.summary,
      error: this.error,
    }
  }

  acceptDisclaimer(): void {
    if (this.phase !== 'disclaimer') return
    this.phase = 'home'
    this.emit()
  }

  goToCategories(): void {
    if (this.phase !== 'home' && this.phase !== 'biblio') return
    this.phase = 'category'
    this.emit()
  }

  selectCategory(category: ClassicCategory): void {
    if (this.phase !== 'category' && this.phase !== 'session') return
    this.category = category
    this.phase = 'biblio'
    this.emit()
  }

  continueFromBiblio(): void {
    if (this.phase !== 'biblio' || !this.category) return
    this.phase = 'session'
    this.emit()
  }

  openDrillPicker(): void {
    if (this.phase !== 'session') return
    this.mode = 'drill'
    this.phase = 'drillPick'
    this.emit()
  }

  async startSession(
    pack: Pack,
    mode: SessionMode,
    opts: {
      timer?: boolean
      blueprint?: ExamBlueprint
      drill?: DrillFilter
    } = {},
  ): Promise<void> {
    if (!this.category) throw new Error('Alege categoria')
    this.mode = mode
    this.drillFilter = mode === 'drill' ? (opts.drill ?? {}) : null
    this.blueprint = opts.blueprint ?? DEFAULT_BLUEPRINT
    this.timerEnabled = mode === 'exam' && !!opts.timer
    this.timerSecondsLeft = this.timerEnabled
      ? this.blueprint.timerSeconds
      : null
    this.grades = []
    this.lastGrade = null
    this.summary = null
    this.error = null
    this.index = 0

    try {
      if (mode === 'exam') {
        const built = buildExamDeck(pack.questions, this.blueprint)
        this.deck = built.deck
        this.pointsMax = built.pointsMax
      } else {
        this.deck = buildDrillDeck(pack.questions, 8, opts.drill ?? {})
        this.pointsMax = this.deck.map(() => 1)
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err)
      this.emit()
      return
    }

    const q = this.deck[0]
    if (!q) {
      this.error =
        mode === 'drill'
          ? 'Nu există întrebări pentru filtrul ales'
          : 'Nu există întrebări în pachet'
      this.phase = mode === 'drill' ? 'drillPick' : 'session'
      this.emit()
      return
    }
    this.draft = emptyDraft(q)
    this.phase = 'playing'
    this.emit()
  }

  setDraft(draft: DraftAnswer, opts?: { quiet?: boolean }): void {
    if (this.phase !== 'playing') return
    this.draft = draft
    // Quiet: keep focus in text fields — no full DOM re-render.
    if (opts?.quiet && !this.error) return
    if (this.error) this.error = null
    this.emit()
  }

  confirm(): void {
    if (this.phase !== 'playing' || !this.draft) return
    const q = this.deck[this.index]
    if (!q) return
    if (!isDraftComplete(q, this.draft)) {
      this.error = 'Completează răspunsul înainte de a confirma'
      this.emit()
      return
    }
    this.error = null
    const max = this.pointsMax[this.index] ?? 1
    const allOrNothing = sectionAllOrNothing(this.blueprint, q.type)
    const grade = gradeAnswer(q, this.draft, max, allOrNothing)
    this.lastGrade = grade
    this.grades.push(grade)
    this.phase = 'review'
    this.emit()
  }

  continueAfterReview(): void {
    if (this.phase !== 'review') return
    this.lastGrade = null
    if (this.index >= this.deck.length - 1) {
      this.finish()
      return
    }
    this.index += 1
    const q = this.deck[this.index]!
    this.draft = emptyDraft(q)
    this.phase = 'playing'
    this.emit()
  }

  tickTimer(): void {
    if (!this.timerEnabled || this.timerSecondsLeft == null) return
    if (this.phase !== 'playing' && this.phase !== 'review') return
    if (this.timerSecondsLeft <= 0) {
      this.finish()
      return
    }
    this.timerSecondsLeft -= 1
    if (this.timerSecondsLeft <= 0) {
      this.finish()
      return
    }
    this.emit()
  }

  private finish(): void {
    const max =
      this.mode === 'exam' ? this.blueprint.maxScore : this.grades.length
    this.summary = summarizeScores(this.grades, max)
    this.phase = 'end'
    this.timerEnabled = false
    this.emit()
  }

  playAgain(): void {
    this.mode = null
    this.drillFilter = null
    this.deck = []
    this.grades = []
    this.summary = null
    this.lastGrade = null
    this.draft = null
    this.index = 0
    this.error = null
    this.phase = 'session'
    this.emit()
  }

  goHome(): void {
    this.category = null
    this.mode = null
    this.drillFilter = null
    this.deck = []
    this.grades = []
    this.summary = null
    this.lastGrade = null
    this.draft = null
    this.index = 0
    this.error = null
    this.timerEnabled = false
    this.timerSecondsLeft = null
    this.phase = 'home'
    this.emit()
  }

  backToSession(): void {
    if (this.phase !== 'drillPick') return
    this.mode = null
    this.error = null
    this.phase = 'session'
    this.emit()
  }

  private emit(): void {
    const snap = this.snapshot()
    for (const fn of this.listeners) fn(snap)
  }
}

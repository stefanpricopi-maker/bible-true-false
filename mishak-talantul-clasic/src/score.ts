import type { BibleBookId } from './edition-2027'
import type {
  DraftAnswer,
  ExamBlueprint,
  GradedItem,
  MatchingQuestion,
  MultiChoiceQuestion,
  Question,
  ShortAnswerQuestion,
  SingleChoiceQuestion,
  TrueFalseQuestion,
} from './types'

/** Normalize short answers: trim, lower, strip combining diacritics. */
export function normalizeAnswer(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
}

export function emptyDraft(q: Question): DraftAnswer {
  switch (q.type) {
    case 'true_false':
      return { type: 'true_false', value: null }
    case 'single_choice':
      return { type: 'single_choice', index: null }
    case 'matching':
      return { type: 'matching', map: q.left.map(() => null) }
    case 'short_answer':
      return { type: 'short_answer', text: '' }
    case 'multi_choice':
      return { type: 'multi_choice', indices: [] }
  }
}

export function isDraftComplete(q: Question, draft: DraftAnswer): boolean {
  switch (q.type) {
    case 'true_false':
      return draft.type === 'true_false' && draft.value !== null
    case 'single_choice':
      return draft.type === 'single_choice' && draft.index !== null
    case 'matching':
      return (
        draft.type === 'matching' &&
        draft.map.length === q.left.length &&
        draft.map.every((n) => n !== null)
      )
    case 'short_answer':
      return draft.type === 'short_answer' && draft.text.trim().length > 0
    case 'multi_choice':
      // Empty set is a valid attempt (all-or-nothing may award 0).
      return draft.type === 'multi_choice'
  }
}

function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  const sa = [...a].sort((x, y) => x - y)
  const sb = [...b].sort((x, y) => x - y)
  return sa.every((v, i) => v === sb[i])
}

export function gradeAnswer(
  q: Question,
  draft: DraftAnswer,
  pointsMax: number,
  allOrNothing = false,
): GradedItem {
  let correct = false

  switch (q.type) {
    case 'true_false': {
      const d = draft as Extract<DraftAnswer, { type: 'true_false' }>
      correct = d.value === (q as TrueFalseQuestion).correct
      break
    }
    case 'single_choice': {
      const d = draft as Extract<DraftAnswer, { type: 'single_choice' }>
      correct = d.index === (q as SingleChoiceQuestion).correctIndex
      break
    }
    case 'matching': {
      const d = draft as Extract<DraftAnswer, { type: 'matching' }>
      const mq = q as MatchingQuestion
      if (d.map.length !== mq.correctMap.length) {
        correct = false
      } else {
        // Partial credit: pointsMax * correctPairs / total
        const pairs = mq.correctMap.length
        let ok = 0
        for (let i = 0; i < pairs; i++) {
          if (d.map[i] === mq.correctMap[i]) ok += 1
        }
        const earned = pairs === 0 ? 0 : Math.round((pointsMax * ok) / pairs)
        return {
          questionId: q.id,
          type: q.type,
          correct: ok === pairs,
          pointsEarned: earned,
          pointsMax,
          draft,
        }
      }
      break
    }
    case 'short_answer': {
      const d = draft as Extract<DraftAnswer, { type: 'short_answer' }>
      const sq = q as ShortAnswerQuestion
      const norm = normalizeAnswer(d.text)
      correct = sq.accepted.some((a) => normalizeAnswer(a) === norm)
      break
    }
    case 'multi_choice': {
      const d = draft as Extract<DraftAnswer, { type: 'multi_choice' }>
      const mq = q as MultiChoiceQuestion
      correct = sameSet(d.indices, mq.correctIndices)
      if (allOrNothing) {
        return {
          questionId: q.id,
          type: q.type,
          correct,
          pointsEarned: correct ? pointsMax : 0,
          pointsMax,
          draft,
        }
      }
      break
    }
  }

  return {
    questionId: q.id,
    type: q.type,
    correct,
    pointsEarned: correct ? pointsMax : 0,
    pointsMax,
    draft,
  }
}

export type ScoreSummary = {
  total: number
  max: number
  byType: Partial<Record<Question['type'], { earned: number; max: number }>>
  items: GradedItem[]
}

export function summarizeScores(
  items: GradedItem[],
  maxScore: number,
): ScoreSummary {
  const byType: ScoreSummary['byType'] = {}
  let total = 0
  for (const item of items) {
    total += item.pointsEarned
    const slot = byType[item.type] ?? { earned: 0, max: 0 }
    slot.earned += item.pointsEarned
    slot.max += item.pointsMax
    byType[item.type] = slot
  }
  return { total: Math.min(total, maxScore), max: maxScore, byType, items }
}

/** Build ordered question list for an exam from pack + blueprint. */
export function buildExamDeck(
  questions: Question[],
  blueprint: ExamBlueprint,
): { deck: Question[]; pointsMax: number[] } {
  const pool = new Map<Question['type'], Question[]>()
  for (const q of questions) {
    const list = pool.get(q.type) ?? []
    list.push(q)
    pool.set(q.type, list)
  }

  const deck: Question[] = []
  const pointsMax: number[] = []

  for (const section of blueprint.sections) {
    const available = [...(pool.get(section.type) ?? [])]
    if (available.length < section.count) {
      throw new Error(
        `Blueprint needs ${section.count} ${section.type}, have ${available.length}`,
      )
    }
    for (let i = 0; i < section.count; i++) {
      const pick = available.splice(
        Math.floor(Math.random() * available.length),
        1,
      )[0]!
      deck.push(pick)
      pointsMax.push(section.pointsEach)
    }
  }

  return { deck, pointsMax }
}

export function sectionAllOrNothing(
  blueprint: ExamBlueprint,
  type: Question['type'],
): boolean {
  return blueprint.sections.find((s) => s.type === type)?.allOrNothing === true
}

/** Drill: up to `limit` questions, mixed types, equal weight 1 each (informal). */
export function buildDrillDeck(
  questions: Question[],
  limit = 8,
  opts: { book?: BibleBookId | string; chapter?: number } = {},
): Question[] {
  let pool = questions
  if (opts.book) {
    const book = opts.book as BibleBookId
    pool = pool.filter((q) => q.books.includes(book))
  }
  if (opts.chapter != null) {
    pool = pool.filter((q) => q.chapter === opts.chapter)
  }
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }
  return shuffled.slice(0, Math.min(limit, shuffled.length))
}

export function booksInPack(questions: Question[]): BibleBookId[] {
  const set = new Set<BibleBookId>()
  for (const q of questions) for (const b of q.books) set.add(b)
  return [...set]
}

export function chaptersForBook(
  questions: Question[],
  book: BibleBookId | string,
): number[] {
  const bid = book as BibleBookId
  const set = new Set<number>()
  for (const q of questions) {
    if (q.books.includes(bid) && q.chapter != null) {
      set.add(q.chapter)
    }
  }
  return [...set].sort((a, b) => a - b)
}

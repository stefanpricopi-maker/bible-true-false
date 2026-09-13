import { listUnlocked } from './entitlements'
import { QUESTIONS_PER_ROUND, TOTAL_ROUNDS } from './session/engine'
import { loadPack, type AgeBand, type Pack, type Question } from './pack/types'

export type { AgeBand }

export type PriceTier = 'free' | 'unlock'

export type CatalogPack = {
  id: string
  title: string
  priceTier: PriceTier
  description?: string
  questionIds?: string[]
  /** Use every question from the shell manifest. */
  allFromShell?: boolean
  productId?: string
}

export type PackCatalog = {
  version: number
  shellPackId: string
  packs: CatalogPack[]
}

/** Session length: 3 rounds × 10 questions. Inactive bands stay on the host screen. */
export function minQuestionsForSession(): number {
  return QUESTIONS_PER_ROUND * TOTAL_ROUNDS
}

export function hasQuestionAudio(q: Question): boolean {
  return typeof q.audio?.question === 'string' && q.audio.question.trim() !== ''
}

export function questionsInBand(questions: Question[], band: AgeBand): Question[] {
  return questions.filter((q) => q.ageBand === band && hasQuestionAudio(q))
}

export function isBandPlayable(questions: Question[], band: AgeBand): boolean {
  return questionsInBand(questions, band).length >= minQuestionsForSession()
}

let cachedCatalog: PackCatalog | null = null
let cachedEntitled: Pack | null = null

export async function loadCatalog(): Promise<PackCatalog> {
  if (cachedCatalog) return cachedCatalog
  const res = await fetch('/content-packs/catalog.json')
  if (!res.ok) throw new Error(`Failed to load catalog: ${res.status}`)
  cachedCatalog = (await res.json()) as PackCatalog
  return cachedCatalog
}

/**
 * Shell assets (VO/SFX/audio files) + questions from unlocked content packs only.
 * Does not filter by age band — host screen uses this to decide which tiles are live.
 */
export async function loadEntitledPack(): Promise<Pack> {
  if (cachedEntitled) return cachedEntitled

  const catalog = await loadCatalog()
  const shell = await loadPack(catalog.shellPackId)
  const unlocked = new Set(listUnlocked())
  const active = catalog.packs.filter((p) => unlocked.has(p.id))

  if (active.length === 0) {
    throw new Error('No unlocked content packs')
  }

  const byId = new Map(shell.questions.map((q) => [q.id, q]))
  const selected: Question[] = []
  const seen = new Set<string>()

  for (const pack of active) {
    if (pack.allFromShell) {
      for (const q of shell.questions) {
        if (!seen.has(q.id)) {
          seen.add(q.id)
          selected.push(q)
        }
      }
      continue
    }
    for (const id of pack.questionIds ?? []) {
      const q = byId.get(id)
      if (q && !seen.has(q.id)) {
        seen.add(q.id)
        selected.push(q)
      }
    }
  }

  if (selected.length === 0) {
    throw new Error('Unlocked packs have no questions')
  }

  cachedEntitled = {
    ...shell,
    id: `playable:${[...unlocked].sort().join('+')}`,
    title: shell.title,
    note: `Entitlements: ${[...unlocked].join(', ')} (${selected.length} questions)`,
    questions: selected,
  }
  return cachedEntitled
}

/**
 * Entitled questions for one age band. Throws if the band cannot fill a session
 * (engine also requires QUESTIONS_PER_ROUND * TOTAL_ROUNDS).
 */
export async function loadPlayablePack(ageBand: AgeBand): Promise<Pack> {
  const pack = await loadEntitledPack()
  const questions = questionsInBand(pack.questions, ageBand)
  const needed = minQuestionsForSession()
  if (questions.length < needed) {
    throw new Error(
      `Age band ${ageBand} needs at least ${needed} questions with audio; has ${questions.length}`,
    )
  }
  return {
    ...pack,
    id: `${pack.id}:${ageBand}`,
    note: `${pack.note}; band ${ageBand} (${questions.length} questions)`,
    questions,
  }
}

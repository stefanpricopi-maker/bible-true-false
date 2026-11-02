import type { BibleBookId } from './edition-2027'

export type ClassicCategory =
  | 'prescolari_clasa_1'
  | 'clase_2_3'
  | 'clase_4_5'
  | 'clase_6_7'
  | 'clase_8_9'
  | 'clase_10_11'
  | 'adulti_18_35'
  | 'adulti_35_plus'

export type QuestionType =
  | 'true_false'
  | 'single_choice'
  | 'matching'
  | 'short_answer'
  | 'multi_choice'

export type ReviewStatus = 'PLACEHOLDER' | 'reviewed'

type QuestionBase = {
  id: string
  category: ClassicCategory
  prompt: string
  /** Primary biblical reference shown after answer */
  ref?: string
  /** Optional verse excerpt (overrides pack verses map when set) */
  refText?: string
  /** Books from the 2027 bibliography this item trains */
  books: BibleBookId[]
  chapter?: number
  reviewStatus: ReviewStatus
}

export type TrueFalseQuestion = QuestionBase & {
  type: 'true_false'
  correct: boolean
}

export type SingleChoiceQuestion = QuestionBase & {
  type: 'single_choice'
  choices: [string, string, string]
  correctIndex: 0 | 1 | 2
}

export type MatchingQuestion = QuestionBase & {
  type: 'matching'
  left: string[]
  right: string[]
  /** For each left[i], index into right */
  correctMap: number[]
}

export type ShortAnswerQuestion = QuestionBase & {
  type: 'short_answer'
  accepted: string[]
}

export type MultiChoiceQuestion = QuestionBase & {
  type: 'multi_choice'
  choices: string[]
  correctIndices: number[]
}

export type Question =
  | TrueFalseQuestion
  | SingleChoiceQuestion
  | MatchingQuestion
  | ShortAnswerQuestion
  | MultiChoiceQuestion

export type BlueprintSection = {
  type: QuestionType
  count: number
  pointsEach: number
  allOrNothing?: boolean
}

export type ExamBlueprint = {
  maxScore: number
  sections: BlueprintSection[]
  timerSeconds: number
}

export type PackManifest = {
  id: string
  title: string
  locale: string
  category: ClassicCategory
  note?: string
  questions: Question[]
  /** Verse excerpts keyed by `question.ref` (Cornilescu SBR Oradea 2005) */
  verses?: Record<string, string>
}

export type Pack = PackManifest & { baseUrl: string }

export type CatalogPack = {
  id: string
  title: string
  priceTier: 'free' | 'unlock'
  category: ClassicCategory
  packId: string
  description?: string
}

export type PackCatalog = {
  version: number
  packs: CatalogPack[]
}

export type SessionMode = 'drill' | 'exam'

/** Draft answers before confirm */
export type DraftAnswer =
  | { type: 'true_false'; value: boolean | null }
  | { type: 'single_choice'; index: number | null }
  | { type: 'matching'; map: (number | null)[] }
  | { type: 'short_answer'; text: string }
  | { type: 'multi_choice'; indices: number[] }

export type GradedItem = {
  questionId: string
  type: QuestionType
  correct: boolean
  pointsEarned: number
  pointsMax: number
  draft: DraftAnswer
}

export const CATEGORY_LABELS: Record<ClassicCategory, string> = {
  prescolari_clasa_1: 'Preșcolari – Clasa 1',
  clase_2_3: 'Clasele 2–3',
  clase_4_5: 'Clasele 4–5',
  clase_6_7: 'Clasele 6–7',
  clase_8_9: 'Clasele 8–9',
  clase_10_11: 'Clasele 10–11',
  adulti_18_35: '18–35 ani',
  adulti_35_plus: '35+ ani',
}

export const DEFAULT_BLUEPRINT: ExamBlueprint = {
  maxScore: 100,
  timerSeconds: 60 * 60,
  sections: [
    { type: 'true_false', count: 10, pointsEach: 2 },
    { type: 'single_choice', count: 10, pointsEach: 3 },
    { type: 'matching', count: 1, pointsEach: 15 },
    { type: 'short_answer', count: 5, pointsEach: 4 },
    { type: 'multi_choice', count: 3, pointsEach: 5, allOrNothing: true },
  ],
}

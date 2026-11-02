export type AgeCategory =
  | 'prescolari_clasa_1'
  | 'clase_2_3'
  | 'clase_4_5'
  | 'clase_6_7'
  | 'clase_8_9'
  | 'clase_10_11'
  | 'adulti_18_35'
  | 'adulti_35_plus'

export type ReviewStatus = 'PLACEHOLDER' | 'reviewed'
export type RightsStatus = 'PLACEHOLDER' | 'cleared'

export type Verse = {
  id: string
  chapter: number
  verse: number
  text: string
  audioRef: string | null
  reviewStatus: ReviewStatus
}

export type VersePack = {
  id: string
  title: string
  locale: string
  edition: string
  rightsStatus: RightsStatus
  note?: string
  verses: Verse[]
}

export type DrillModeId =
  | 'listen_repeat'
  | 'chunk_show'
  | 'read_along'
  | 'cloze_easy'
  | 'cloze'
  | 'order_fragments'
  | 'scramble'
  | 'first_letters'
  | 'passage'
  | 'type_memory'
  | 'fade'
  | 'simulate_chapter'
  | 'simulate_all'

export type ProgressState = 'untouched' | 'fragile' | 'learned'

export type VerseProgress = {
  state: ProgressState
  lastAt?: string
}

export type ProgressStore = {
  version: 1
  byVerse: Record<string, VerseProgress>
}

export const CATEGORY_LABELS: Record<AgeCategory, string> = {
  prescolari_clasa_1: 'Preșcolari – Clasa 1',
  clase_2_3: 'Clasele 2–3',
  clase_4_5: 'Clasele 4–5',
  clase_6_7: 'Clasele 6–7',
  clase_8_9: 'Clasele 8–9',
  clase_10_11: 'Clasele 10–11',
  adulti_18_35: '18–35 ani',
  adulti_35_plus: '35+ ani',
}

export const ALL_CATEGORIES: AgeCategory[] = [
  'prescolari_clasa_1',
  'clase_2_3',
  'clase_4_5',
  'clase_6_7',
  'clase_8_9',
  'clase_10_11',
  'adulti_18_35',
  'adulti_35_plus',
]

/** Coop bands: parent helps / validates. */
export function isCoopCategory(cat: AgeCategory): boolean {
  return (
    cat === 'prescolari_clasa_1' ||
    cat === 'clase_2_3' ||
    cat === 'clase_4_5'
  )
}

export const MODE_LABELS: Record<DrillModeId, string> = {
  listen_repeat: 'Ascultă → repetă',
  chunk_show: 'Arată pe bucăți',
  read_along: 'Citește odată cu textul',
  cloze_easy: 'Completează (ușor)',
  cloze: 'Completează',
  order_fragments: 'Ordonează fragmente',
  scramble: 'Amestecă cuvintele',
  first_letters: 'Primele litere',
  passage: 'Pasaj (3–5 versete)',
  type_memory: 'Scrie din memorie',
  fade: 'Ascunde progresiv',
  simulate_chapter: 'Simulare capitol',
  simulate_all: 'Simulare Apocalipsa 1–5',
}

export function modesForCategory(cat: AgeCategory): DrillModeId[] {
  switch (cat) {
    case 'prescolari_clasa_1':
      return ['listen_repeat', 'chunk_show']
    case 'clase_2_3':
      return ['read_along', 'cloze_easy', 'order_fragments']
    case 'clase_4_5':
      return ['cloze', 'scramble', 'first_letters', 'listen_repeat']
    case 'clase_6_7':
      return ['passage', 'type_memory', 'cloze', 'scramble']
    case 'clase_8_9':
      return ['fade', 'type_memory', 'passage', 'simulate_chapter']
    case 'clase_10_11':
    case 'adulti_18_35':
    case 'adulti_35_plus':
      return [
        'type_memory',
        'fade',
        'simulate_chapter',
        'simulate_all',
        'passage',
      ]
  }
}

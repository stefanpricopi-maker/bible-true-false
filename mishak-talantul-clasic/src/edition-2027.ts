import type { ClassicCategory } from './types'

/** Cornilescu — text pe pliantul Organizare 2027. */
export const BIBLE_EDITION = 'Dumitru Cornilescu, ediția SBR Oradea 2005'

export const OFFICIAL_URL = 'https://talantulinnegot.com/'

export type BibleBookId =
  | '1_samuel'
  | '2_samuel'
  | 'iuda'
  | '1_petru'
  | 'filipeni'
  | 'galateni'
  | 'evrei'
  | 'apocalipsa'

export const BOOK_LABELS: Record<BibleBookId, string> = {
  '1_samuel': '1 Samuel',
  '2_samuel': '2 Samuel',
  iuda: 'Iuda',
  '1_petru': '1 Petru',
  filipeni: 'Filipeni',
  galateni: 'Galateni',
  evrei: 'Evrei',
  apocalipsa: 'Apocalipsa',
}

/** Număr de capitole (pentru picker drill). */
export const BOOK_CHAPTER_COUNT: Record<BibleBookId, number> = {
  '1_samuel': 31,
  '2_samuel': 24,
  iuda: 1,
  '1_petru': 5,
  filipeni: 4,
  galateni: 6,
  evrei: 13,
  apocalipsa: 22,
}

export type CategoryBiblio = {
  books: BibleBookId[]
  memoryVerses: string[]
}

/** Bibliografie Clasic 2027 — toate au 1–2 Samuel. */
export const CLASSIC_BIBLIO: Record<ClassicCategory, CategoryBiblio> = {
  prescolari_clasa_1: {
    books: ['1_samuel', '2_samuel', 'iuda'],
    memoryVerses: [
      'Ioan 15:7',
      'Luca 10:5',
      'Exodul 15:8',
      'Matei 5:8',
      'Romani 12:10',
      '1 Corinteni 13:13',
      'Efeseni 4:5',
      '1 Ioan 4:8',
      'Psalmii 128:1',
      'Proverbele 11:1',
    ],
  },
  clase_2_3: {
    books: ['1_samuel', '2_samuel', 'iuda'],
    memoryVerses: [
      'Ioan 15:7',
      'Luca 10:5',
      'Exodul 15:8',
      'Matei 5:8',
      'Romani 12:10',
      '1 Corinteni 13:13',
      'Efeseni 4:5',
      '1 Ioan 4:8',
      'Psalmii 128:1',
      'Proverbele 11:1',
    ],
  },
  clase_4_5: {
    books: ['1_samuel', '2_samuel', '1_petru'],
    memoryVerses: [
      'Isaia 65:24',
      'Marcu 10:31',
      'Romani 12:9',
      '1 Corinteni 15:57',
      'Efeseni 5:9',
      '1 Ioan 2:9',
      'Apocalipsa 3:11',
      'Iacov 1:27',
      'Psalmii 47:1',
      'Proverbele 14:23',
    ],
  },
  clase_6_7: {
    books: ['1_samuel', '2_samuel', 'filipeni'],
    memoryVerses: [
      '2 Timotei 2:13',
      'Luca 11:13',
      'Daniel 11:32',
      'Mica 6:8',
      'Romani 14:8',
      '1 Corinteni 1:18',
      'Efeseni 4:29',
      'Marcu 16:15-16',
      'Psalmii 27:1',
      'Proverbele 21:6',
    ],
  },
  clase_8_9: {
    books: ['1_samuel', '2_samuel', 'galateni'],
    memoryVerses: [
      'Matei 12:50',
      'Luca 8:18',
      '1 Ioan 1:5',
      'Apocalipsa 1:8',
      'Geneza 28:15',
      '1 Timotei 5:18',
      'Iacov 1:12',
      'Levitic 25:17',
      'Psalmii 22:24',
      'Proverbele 16:3',
    ],
  },
  clase_10_11: {
    books: ['1_samuel', '2_samuel', 'evrei'],
    memoryVerses: [
      'Marcu 9:37',
      'Habacuc 1:13',
      '1 Ioan 5:3-4',
      'Apocalipsa 22:17',
      'Iov 7:1',
      'Tit 2:11-12',
      'Ioel 2:21',
      'Leviticul 19:37',
      'Psalmii 32:5',
      'Proverbele 16:18',
    ],
  },
  adulti_18_35: {
    books: ['1_samuel', '2_samuel', 'evrei'],
    memoryVerses: [
      'Deuteronom 6:6-7',
      'Geneza 2:18',
      'Apocalipsa 21:4',
      'Exod 34:10',
      'Levitic 19:2',
      'Isaia 1:17',
      'Faptele Apostolilor 10:42',
      '2 Corinteni 7:10',
      'Psalmii 31:19',
      'Proverbele 13:11',
    ],
  },
  adulti_35_plus: {
    books: ['1_samuel', '2_samuel', 'evrei'],
    memoryVerses: [
      'Maleahi 3:9-10',
      'Deuteronom 32:39',
      'Ioel 2:13',
      'Apocalipsa 20:6',
      'Osea 2:19-20',
      'Daniel 4:35',
      'Ieremia 17:5',
      'Apocalipsa 22:18-19',
      'Psalmii 18:2',
      'Proverbele 19:18',
    ],
  },
}

/** Secțiunea Memorare — info only în v1 Clasic. */
export const MEMORARE_INFO = {
  books: ['apocalipsa'] as BibleBookId[],
  chapters: [1, 2, 3, 4, 5],
  label: 'Apocalipsa 1–5',
}

export type ContestPhase = {
  id: string
  label: string
  /** Start of phase (local date, midnight) */
  start: string
  /** Optional end (international multi-day) */
  end?: string
}

export const PHASES_2027: ContestPhase[] = [
  { id: 'biserica', label: 'Pe biserică', start: '2027-03-20' },
  { id: 'judetean', label: 'Județeană', start: '2027-04-10' },
  { id: 'regional', label: 'Regională', start: '2027-05-08' },
  { id: 'national', label: 'Națională', start: '2027-06-05' },
  {
    id: 'international',
    label: 'Internațională',
    start: '2027-08-06',
    end: '2027-08-08',
  },
]

export function nextPhase(
  now = new Date(),
): { phase: ContestPhase; daysLeft: number } | null {
  for (const phase of PHASES_2027) {
    const start = new Date(`${phase.start}T00:00:00`)
    const end = phase.end
      ? new Date(`${phase.end}T23:59:59`)
      : new Date(`${phase.start}T23:59:59`)
    if (now <= end) {
      const ms = start.getTime() - now.getTime()
      const daysLeft = Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
      return { phase, daysLeft }
    }
  }
  return null
}

export const ALL_CATEGORIES: ClassicCategory[] = [
  'prescolari_clasa_1',
  'clase_2_3',
  'clase_4_5',
  'clase_6_7',
  'clase_8_9',
  'clase_10_11',
  'adulti_18_35',
  'adulti_35_plus',
]

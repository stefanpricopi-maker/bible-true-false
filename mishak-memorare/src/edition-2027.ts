export const BIBLE_EDITION = 'Dumitru Cornilescu, ediția SBR Oradea 2005'
export const OFFICIAL_URL = 'https://talantulinnegot.com/'

export const MEMORARE_INFO = {
  chapters: [1, 2, 3, 4, 5] as const,
  label: 'Apocalipsa 1–5',
  verseCounts: { 1: 20, 2: 29, 3: 22, 4: 11, 5: 14 } as Record<
    number,
    number
  >,
}

export type ContestPhase = {
  id: string
  label: string
  start: string
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

import type { ProgressState, ProgressStore, VerseProgress } from './types'

const KEY = 'mishak-memorare-progress-v1'

export function loadProgress(): ProgressStore {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { version: 1, byVerse: {} }
    const parsed = JSON.parse(raw) as ProgressStore
    if (parsed?.version !== 1 || typeof parsed.byVerse !== 'object') {
      return { version: 1, byVerse: {} }
    }
    return parsed
  } catch {
    return { version: 1, byVerse: {} }
  }
}

export function saveProgress(store: ProgressStore): void {
  localStorage.setItem(KEY, JSON.stringify(store))
}

export function getVerseProgress(
  store: ProgressStore,
  verseId: string,
): VerseProgress {
  return store.byVerse[verseId] ?? { state: 'untouched' }
}

export function setVerseState(
  store: ProgressStore,
  verseId: string,
  state: ProgressState,
): ProgressStore {
  const next: ProgressStore = {
    version: 1,
    byVerse: {
      ...store.byVerse,
      [verseId]: { state, lastAt: new Date().toISOString() },
    },
  }
  saveProgress(next)
  return next
}

export function summarizeChapter(
  store: ProgressStore,
  verseIds: string[],
): { learned: number; fragile: number; untouched: number; total: number } {
  let learned = 0
  let fragile = 0
  let untouched = 0
  for (const id of verseIds) {
    const s = getVerseProgress(store, id).state
    if (s === 'learned') learned++
    else if (s === 'fragile') fragile++
    else untouched++
  }
  return { learned, fragile, untouched, total: verseIds.length }
}

/** Local match history (web). Parent-facing; not required for play. */

import type { AgeBand } from './pack/types'

const STORAGE_KEY = 'btf.history.v1'
const MAX_GAMES = 5

export type GameRecord = {
  at: string
  band: AgeBand
  scores: [number, number]
  colors: [string, string]
}

type HistoryState = {
  games: GameRecord[]
}

function readState(): HistoryState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { games: [] }
    const parsed = JSON.parse(raw) as HistoryState
    const games = Array.isArray(parsed.games) ? parsed.games : []
    return { games: games.filter(isGameRecord).slice(0, MAX_GAMES) }
  } catch {
    return { games: [] }
  }
}

function isGameRecord(g: unknown): g is GameRecord {
  if (!g || typeof g !== 'object') return false
  const r = g as GameRecord
  return (
    typeof r.at === 'string' &&
    typeof r.band === 'string' &&
    Array.isArray(r.scores) &&
    r.scores.length === 2 &&
    Array.isArray(r.colors) &&
    r.colors.length === 2
  )
}

function writeState(state: HistoryState): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ games: state.games.slice(0, MAX_GAMES) }),
  )
}

export function listGames(): GameRecord[] {
  return readState().games
}

export function getLastGame(): GameRecord | null {
  return listGames()[0] ?? null
}

export function saveGame(record: Omit<GameRecord, 'at'> & { at?: string }): void {
  const entry: GameRecord = {
    at: record.at ?? new Date().toISOString(),
    band: record.band,
    scores: [record.scores[0], record.scores[1]],
    colors: [record.colors[0], record.colors[1]],
  }
  const state = readState()
  state.games = [entry, ...state.games].slice(0, MAX_GAMES)
  writeState(state)
}

const BAND_LABEL: Record<AgeBand, string> = {
  mic: 'Mic',
  copii: 'Copii',
  tineri: 'Tineri',
  adulti: 'Adulți',
}

export function bandLabel(band: AgeBand): string {
  return BAND_LABEL[band] ?? band
}

/** Short Romanian relative time for parent UI. */
export function formatPlayedAt(iso: string, now = Date.now()): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const mins = Math.round((now - t) / 60000)
  if (mins < 1) return 'acum'
  if (mins < 60) return `acum ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `acum ${hours} h`
  const days = Math.round(hours / 24)
  if (days === 1) return 'ieri'
  if (days < 7) return `acum ${days} zile`
  return new Date(t).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
  })
}

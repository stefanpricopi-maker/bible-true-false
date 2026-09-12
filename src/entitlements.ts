/** Local entitlements for content packs (web). Store IAP writes here later. */

const STORAGE_KEY = 'btf.entitlements.v1'
const ALWAYS_FREE = ['free-start'] as const

export type EntitlementState = {
  unlocked: string[]
}

function readState(): EntitlementState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { unlocked: [...ALWAYS_FREE] }
    const parsed = JSON.parse(raw) as EntitlementState
    const unlocked = new Set([...(parsed.unlocked ?? []), ...ALWAYS_FREE])
    return { unlocked: [...unlocked] }
  } catch {
    return { unlocked: [...ALWAYS_FREE] }
  }
}

function writeState(state: EntitlementState): void {
  const unlocked = new Set([...state.unlocked, ...ALWAYS_FREE])
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ unlocked: [...unlocked] }))
}

export function listUnlocked(): string[] {
  return readState().unlocked
}

export function isUnlocked(packId: string): boolean {
  return listUnlocked().includes(packId)
}

/** Mark a content pack as owned (after purchase or promo). */
export function unlock(packId: string): void {
  const state = readState()
  if (!state.unlocked.includes(packId)) {
    state.unlocked.push(packId)
    writeState(state)
  }
}

/** Debug / support only — removes unlock (cannot remove free-start). */
export function lock(packId: string): void {
  if ((ALWAYS_FREE as readonly string[]).includes(packId)) return
  const state = readState()
  state.unlocked = state.unlocked.filter((id) => id !== packId)
  writeState(state)
}

/** Apply `?unlock=batch-001` once for QA, then strip from URL. */
export function applyUnlockQueryParam(): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const id = params.get('unlock')
  if (!id) return
  unlock(id)
  params.delete('unlock')
  const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`
  window.history.replaceState({}, '', next)
}

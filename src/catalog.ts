import { listUnlocked } from './entitlements'
import { loadPack, type Pack, type Question } from './pack/types'

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

let cachedCatalog: PackCatalog | null = null

export async function loadCatalog(): Promise<PackCatalog> {
  if (cachedCatalog) return cachedCatalog
  const res = await fetch('/content-packs/catalog.json')
  if (!res.ok) throw new Error(`Failed to load catalog: ${res.status}`)
  cachedCatalog = (await res.json()) as PackCatalog
  return cachedCatalog
}

/**
 * Shell assets (VO/SFX/audio files) + questions from unlocked content packs only.
 */
export async function loadPlayablePack(): Promise<Pack> {
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

  return {
    ...shell,
    id: `playable:${[...unlocked].sort().join('+')}`,
    title: shell.title,
    note: `Entitlements: ${[...unlocked].join(', ')} (${selected.length} questions)`,
    questions: selected,
  }
}

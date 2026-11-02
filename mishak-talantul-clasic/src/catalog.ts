import type {
  ClassicCategory,
  Pack,
  PackCatalog,
  PackManifest,
} from './types'
import { DEFAULT_BLUEPRINT } from './types'

let cachedCatalog: PackCatalog | null = null
const packCache = new Map<string, Pack>()

export async function loadCatalog(): Promise<PackCatalog> {
  if (cachedCatalog) return cachedCatalog
  const res = await fetch('/content-packs/catalog.json')
  if (!res.ok) throw new Error(`Catalog: ${res.status}`)
  cachedCatalog = (await res.json()) as PackCatalog
  return cachedCatalog
}

export async function loadPack(packId: string): Promise<Pack> {
  const hit = packCache.get(packId)
  if (hit) return hit
  const baseUrl = `/packs/${packId}`
  const res = await fetch(`${baseUrl}/manifest.json`)
  if (!res.ok) throw new Error(`Pack ${packId}: ${res.status}`)
  const manifest = (await res.json()) as PackManifest
  let verses = manifest.verses ?? {}
  try {
    const vRes = await fetch(`${baseUrl}/verses.json`)
    if (vRes.ok) {
      const extra = (await vRes.json()) as Record<string, string>
      verses = { ...extra, ...verses }
    }
  } catch {
    /* optional file */
  }
  const pack = { ...manifest, verses, baseUrl }
  packCache.set(packId, pack)
  return pack
}

export async function loadCategoryPack(
  category: ClassicCategory,
): Promise<Pack | null> {
  const catalog = await loadCatalog()
  const entry = catalog.packs.find(
    (p) => p.category === category && p.priceTier === 'free',
  )
  if (!entry) return null
  return loadPack(entry.packId)
}

export function isCategoryPlayable(
  catalog: PackCatalog,
  category: ClassicCategory,
): boolean {
  return catalog.packs.some(
    (p) => p.category === category && p.priceTier === 'free',
  )
}

export { DEFAULT_BLUEPRINT }

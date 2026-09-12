/**
 * Sync SFX from /audio into public/packs/demo-v1/sfx and write index.json.
 * Variants: waiting.mp3, waiting-1.mp3, pop.mp3, pop-2.mp3, …
 *
 * Usage: node scripts/sync-sfx.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'audio')
const destDir = join(root, 'public/packs/demo-v1/sfx')

/** Base stems used as SFX (not VO / questions). */
const SFX_STEMS = new Set([
  'pop',
  'click',
  'chime',
  'buzz',
  'fanfara',
  'victory',
  'waiting',
])

function isSfxVariant(filename) {
  if (!/\.mp3$/i.test(filename)) return false
  const base = filename.replace(/\.mp3$/i, '')
  // stem or stem-N
  const m = base.match(/^([a-z][a-z0-9]*)(?:-(\d+))?$/i)
  if (!m) return false
  return SFX_STEMS.has(m[1].toLowerCase())
}

mkdirSync(destDir, { recursive: true })

if (!existsSync(srcDir)) {
  console.error('Missing audio/ folder')
  process.exit(1)
}

const copied = []
for (const name of readdirSync(srcDir)) {
  if (!isSfxVariant(name)) continue
  copyFileSync(join(srcDir, name), join(destDir, name))
  copied.push(name)
  console.log('synced', name)
}

copied.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
writeFileSync(join(destDir, 'index.json'), JSON.stringify(copied, null, 2) + '\n')
console.log('wrote index.json with', copied.length, 'files')

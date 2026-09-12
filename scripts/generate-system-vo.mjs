/**
 * Generate system VO + feedback MP3s (multi-variant) via ElevenLabs.
 * Source: content/system-vo.json — each clip has texts[] → base.mp3, base-2.mp3, …
 *
 * Env: ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID [, ELEVENLABS_MODEL_ID]
 *
 * Flags:
 *   --force         overwrite existing
 *   --limit N       first N clip groups only
 *   --pack          write into public/packs/demo-v1/ + update manifest arrays
 *   --batch path    override JSON path
 *   --only-new      skip texts[0] if base file exists (generate only missing variants)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

loadEnvFiles([join(root, '.env.local'), join(root, '.env')])

const args = parseArgs(process.argv.slice(2))
const batchPath = resolve(root, args.batch ?? 'content/system-vo.json')
const outRoot = join(root, 'generated/system-vo')
const packRoot = join(root, 'public/packs/demo-v1')
const manifestPath = join(packRoot, 'manifest.json')
const apiKey = process.env.ELEVENLABS_API_KEY
const voiceId = process.env.ELEVENLABS_VOICE_ID
const modelId = process.env.ELEVENLABS_MODEL_ID ?? 'eleven_multilingual_v2'

if (!apiKey || !voiceId) {
  console.error(
    'Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID. Copy .env.example to .env.local.',
  )
  process.exit(1)
}

const batch = JSON.parse(readFileSync(batchPath, 'utf8'))
let clips = batch.clips ?? []
if (args.limit != null) clips = clips.slice(0, args.limit)

mkdirSync(outRoot, { recursive: true })

console.log(
  `System VO ${batch.id ?? ''}: ${clips.length} group(s) → ${outRoot}` +
    (args.pack ? ` + pack` : ''),
)

let done = 0
let skipped = 0
let failed = 0
/** @type {Map<string, string[]>} manifestKey → relative paths */
const manifestUpdates = new Map()

for (const clip of clips) {
  const baseRel = clip.audioFile
  if (!baseRel) {
    console.error(`fail  ${clip.id}: missing audioFile`)
    failed += 1
    continue
  }

  const texts = normalizeTexts(clip)
  if (texts.length === 0) {
    console.error(`fail  ${clip.id}: no texts`)
    failed += 1
    continue
  }

  const paths = []
  for (let i = 0; i < texts.length; i++) {
    const rel = variantRel(baseRel, i)
    paths.push(rel)
    const genPath = join(outRoot, rel)
    mkdirSync(dirname(genPath), { recursive: true })

    if (!args.force && existsSync(genPath)) {
      console.log(`skip  ${rel}`)
      skipped += 1
      if (args.pack) installPack(rel, genPath)
      continue
    }

    const text = texts[i]
    process.stdout.write(`gen   ${rel} … `)
    try {
      const audio = await synthesize(text)
      writeFileSync(genPath, audio)
      console.log('ok')
      done += 1
      if (args.pack) installPack(rel, genPath)
    } catch (err) {
      console.log('error')
      console.error(`  ${err instanceof Error ? err.message : err}`)
      failed += 1
    }
  }

  if (clip.manifestKey) {
    manifestUpdates.set(clip.manifestKey, paths)
  }
}

if (args.pack && manifestUpdates.size > 0) {
  patchManifest(manifestPath, manifestUpdates)
  console.log(`manifest updated (${manifestUpdates.size} keys)`)
}

console.log(`Done. generated=${done} skipped=${skipped} failed=${failed}`)
if (failed > 0) process.exit(1)

function normalizeTexts(clip) {
  if (Array.isArray(clip.texts) && clip.texts.length > 0) {
    return clip.texts.map((t) => String(t).trim()).filter(Boolean)
  }
  const single = String(clip.text ?? '').trim()
  return single ? [single] : []
}

/** base.mp3 → base.mp3; index 1 → base-2.mp3; index 2 → base-3.mp3 */
function variantRel(baseRel, index) {
  if (index === 0) return baseRel
  const m = baseRel.match(/^(.*)(\.[^.]+)$/)
  if (!m) return `${baseRel}-${index + 1}`
  return `${m[1]}-${index + 1}${m[2]}`
}

function installPack(rel, fromPath) {
  const dest = join(packRoot, rel)
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, readFileSync(fromPath))
  console.log(`pack  ${rel}`)
}

function patchManifest(path, updates) {
  const manifest = JSON.parse(readFileSync(path, 'utf8'))
  for (const [key, paths] of updates) {
    setByPath(manifest, key, paths.length === 1 ? paths[0] : paths)
  }
  writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n')
}

function setByPath(obj, path, value) {
  const parts = path.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]
    if (cur[p] == null || typeof cur[p] !== 'object') cur[p] = {}
    cur = cur[p]
  }
  cur[parts[parts.length - 1]] = value
}

async function synthesize(text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.75,
        style: 0.15,
        use_speaker_boost: true,
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`ElevenLabs ${res.status}: ${body.slice(0, 200)}`)
  }

  return Buffer.from(await res.arrayBuffer())
}

function parseArgs(argv) {
  const out = { force: false, limit: null, batch: null, pack: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--force') out.force = true
    else if (a === '--pack') out.pack = true
    else if (a === '--limit') out.limit = Number(argv[++i])
    else if (a === '--batch') out.batch = argv[++i]
    else if (a.startsWith('--limit=')) out.limit = Number(a.slice(8))
    else if (a.startsWith('--batch=')) out.batch = a.slice(8)
  }
  if (out.limit != null && (!Number.isFinite(out.limit) || out.limit < 1)) {
    throw new Error('--limit must be a positive number')
  }
  return out
}

function loadEnvFiles(paths) {
  for (const p of paths) {
    if (!existsSync(p)) continue
    for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (process.env[key] === undefined) process.env[key] = val
    }
  }
}

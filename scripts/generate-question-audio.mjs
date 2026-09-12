/**
 * Generate question MP3s from content/batch-001.json via ElevenLabs TTS API.
 *
 * Env (required): ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID
 * Env (optional): ELEVENLABS_MODEL_ID (default: eleven_multilingual_v2)
 *
 * Flags: --force  regenerate existing files
 *         --limit N  only first N questions
 *         --ids q036,q076,q091  only these question ids
 *         --batch path  override batch JSON (default content/batch-001.json)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

loadEnvFiles([
  join(root, '.env.local'),
  join(root, '.env'),
])

const args = parseArgs(process.argv.slice(2))
const batchPath = resolve(root, args.batch ?? 'content/batch-001.json')
const outDir = join(root, 'generated/batch-001/audio')
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
let questions = batch.questions ?? []
if (args.ids != null) {
  const want = new Set(args.ids)
  questions = questions.filter((q) => want.has(q.id))
  const found = new Set(questions.map((q) => q.id))
  const missingIds = args.ids.filter((id) => !found.has(id))
  if (missingIds.length) {
    throw new Error(`Unknown --ids: ${missingIds.join(', ')}`)
  }
}
if (args.limit != null) {
  questions = questions.slice(0, args.limit)
}

mkdirSync(outDir, { recursive: true })

console.log(
  `Batch ${batch.id ?? batchPath}: ${questions.length} question(s) → ${outDir}`,
)

let done = 0
let skipped = 0
let failed = 0

for (const q of questions) {
  const fileName = q.audioFile ?? `${q.id}-question.mp3`
  const outPath = join(outDir, fileName)

  if (!args.force && existsSync(outPath)) {
    console.log(`skip  ${fileName} (exists)`)
    skipped += 1
    continue
  }

  const text = String(q.promptText ?? '').trim()
  if (!text) {
    console.error(`fail  ${fileName}: empty promptText`)
    failed += 1
    continue
  }

  process.stdout.write(`gen   ${fileName} … `)
  try {
    const audio = await synthesize(text)
    writeFileSync(outPath, audio)
    console.log('ok')
    done += 1
  } catch (err) {
    console.log('error')
    console.error(`  ${err instanceof Error ? err.message : err}`)
    failed += 1
  }
}

console.log(`Done. generated=${done} skipped=${skipped} failed=${failed}`)
if (failed > 0) process.exit(1)

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

function parseIds(raw) {
  const ids = String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!ids.length) throw new Error('--ids needs at least one id (e.g. q036,q076)')
  return ids
}

function parseArgs(argv) {
  const out = { force: false, limit: null, batch: null, ids: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--force') out.force = true
    else if (a === '--limit') {
      out.limit = Number(argv[++i])
      if (!Number.isFinite(out.limit) || out.limit < 1) {
        throw new Error('--limit must be a positive number')
      }
    } else if (a === '--ids') {
      out.ids = parseIds(argv[++i])
    } else if (a === '--batch') {
      out.batch = argv[++i]
    } else if (a.startsWith('--limit=')) {
      out.limit = Number(a.slice('--limit='.length))
    } else if (a.startsWith('--ids=')) {
      out.ids = parseIds(a.slice('--ids='.length))
    } else if (a.startsWith('--batch=')) {
      out.batch = a.slice('--batch='.length)
    }
  }
  return out
}

/** Minimal KEY=VALUE loader (no dependency). Does not override existing env. */
function loadEnvFiles(paths) {
  for (const p of paths) {
    if (!existsSync(p)) continue
    const lines = readFileSync(p, 'utf8').split(/\r?\n/)
    for (const line of lines) {
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

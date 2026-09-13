/**
 * Sync content/batch-001.json + generated MP3s into public/packs/demo-v1.
 * Preserves voiceover / feedback / sfx on the manifest.
 *
 * If a generated MP3 is missing but the pack already has that file, keep the
 * pack copy (partial regen). Exits 1 only when a question has no audio at all.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const batchPath = join(root, 'content/batch-001.json')
const srcAudio = join(root, 'generated/batch-001/audio')
const packDir = join(root, 'public/packs/demo-v1')
const packAudio = join(packDir, 'audio')
const manifestPath = join(packDir, 'manifest.json')

const batch = JSON.parse(readFileSync(batchPath, 'utf8'))
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

mkdirSync(packAudio, { recursive: true })

let copied = 0
let kept = 0
let missing = 0

const questions = []
for (const q of batch.questions ?? []) {
  const file = q.audioFile ?? `${q.id}-question.mp3`
  const from = join(srcAudio, file)
  const to = join(packAudio, file)
  if (existsSync(from)) {
    copyFileSync(from, to)
    copied += 1
  } else if (existsSync(to)) {
    kept += 1
  } else {
    console.warn(`missing audio: ${file}`)
    missing += 1
  }
  questions.push({
    id: q.id,
    correct: q.correct,
    promptText: q.promptText,
    ageBand: q.ageBand,
    audio: { question: `audio/${file}` },
  })
}

manifest.questions = questions
const review = String(batch.reviewStatus ?? '').trim()
const pending = !review || /PLACEHOLDER|pending/i.test(review)
manifest.note = pending
  ? 'Questions from content/batch-001.json (PLACEHOLDER pending human review). Engine draws random 10 per round.'
  : `Questions from content/batch-001.json. Content review: ${review}. Engine draws random 10 per round.`
manifest.rounds = {
  questionsPerPlayer: 5,
  questionsPerRound: 10,
  totalRounds: 3,
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
console.log(
  `Synced ${questions.length} questions → manifest; copied ${copied} mp3; kept ${kept}; missing ${missing}`,
)
if (missing > 0) process.exit(1)

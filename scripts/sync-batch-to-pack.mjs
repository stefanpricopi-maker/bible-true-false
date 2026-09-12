/**
 * Sync content/batch-001.json + generated MP3s into public/packs/demo-v1.
 * Preserves voiceover / feedback / sfx on the manifest.
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
let missing = 0

const questions = []
for (const q of batch.questions ?? []) {
  const file = q.audioFile ?? `${q.id}-question.mp3`
  const from = join(srcAudio, file)
  const to = join(packAudio, file)
  if (!existsSync(from)) {
    console.warn(`missing audio: ${file}`)
    missing += 1
  } else {
    copyFileSync(from, to)
    copied += 1
  }
  questions.push({
    id: q.id,
    correct: q.correct,
    promptText: q.promptText,
    audio: { question: `audio/${file}` },
  })
}

manifest.questions = questions
manifest.note =
  'Questions from content/batch-001.json (PLACEHOLDER pending human review). Engine draws random 10 per round.'
manifest.rounds = {
  questionsPerPlayer: 5,
  questionsPerRound: 10,
  totalRounds: 3,
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
console.log(
  `Synced ${questions.length} questions → manifest; copied ${copied} mp3; missing ${missing}`,
)
if (missing > 0) process.exit(1)

/**
 * Repo smoke checks (no browser). Run: npm test
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
let failed = 0

function ok(cond, msg) {
  if (cond) {
    console.log(`ok  ${msg}`)
  } else {
    console.error(`FAIL  ${msg}`)
    failed += 1
  }
}

const catalog = JSON.parse(
  readFileSync(join(root, 'public/content-packs/catalog.json'), 'utf8'),
)
const free = catalog.packs.find((p) => p.id === 'free-start')
ok(!!free, 'catalog has free-start')
ok(free?.questionIds?.length === 30, `free-start has 30 questions (got ${free?.questionIds?.length})`)

const batch = JSON.parse(readFileSync(join(root, 'content/batch-001.json'), 'utf8'))
ok((batch.questions?.length ?? 0) === 100, `batch-001 has 100 questions (got ${batch.questions?.length})`)

const manifest = JSON.parse(
  readFileSync(join(root, 'public/packs/demo-v1/manifest.json'), 'utf8'),
)
ok(manifest.rounds?.totalRounds === 3, 'manifest totalRounds === 3')
ok(manifest.rounds?.questionsPerRound === 10, 'manifest questionsPerRound === 10')
ok(!!manifest.voiceover?.answerIsTrue, 'manifest has answerIsTrue')
ok(!!manifest.voiceover?.answerIsFalse, 'manifest has answerIsFalse')
ok((manifest.questions?.length ?? 0) >= 30, `manifest questions >= 30 (got ${manifest.questions?.length})`)

const trueClip = Array.isArray(manifest.voiceover.answerIsTrue)
  ? manifest.voiceover.answerIsTrue[0]
  : manifest.voiceover.answerIsTrue
const falseClip = Array.isArray(manifest.voiceover.answerIsFalse)
  ? manifest.voiceover.answerIsFalse[0]
  : manifest.voiceover.answerIsFalse
ok(existsSync(join(root, 'public/packs/demo-v1', trueClip)), `audio exists ${trueClip}`)
ok(existsSync(join(root, 'public/packs/demo-v1', falseClip)), `audio exists ${falseClip}`)

for (const id of free.questionIds.slice(0, 3)) {
  const q = manifest.questions.find((x) => x.id === id)
  ok(!!q, `manifest includes free id ${id}`)
  if (q?.audio?.question) {
    ok(
      existsSync(join(root, 'public/packs/demo-v1', q.audio.question)),
      `audio for ${id}`,
    )
  }
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log('\nAll smoke checks passed')

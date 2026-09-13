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

const indexHtml = readFileSync(join(root, 'index.html'), 'utf8')
ok(/<!doctype html>/i.test(indexHtml), 'index.html has doctype (Pages can inject Web Analytics)')
ok(/<html[\s>]/i.test(indexHtml) && /<head[\s>]/i.test(indexHtml) && /<body[\s>]/i.test(indexHtml), 'index.html has html/head/body')
ok(existsSync(join(root, 'scripts/enable-cf-web-analytics.mjs')), 'analytics enable script exists')
ok(readFileSync(join(root, 'package.json'), 'utf8').includes('analytics:enable'), 'package.json has analytics:enable')
ok(readFileSync(join(root, 'docs/deploy.md'), 'utf8').includes('Web Analytics'), 'deploy.md documents Web Analytics')
const analyticsSrc = readFileSync(join(root, 'src/analytics.ts'), 'utf8')
ok(analyticsSrc.includes("'page_open'"), 'analytics tracks page_open')
ok(analyticsSrc.includes("'setup_complete'"), 'analytics tracks setup_complete')
ok(analyticsSrc.includes("'round_end'"), 'analytics tracks round_end')
ok(analyticsSrc.includes("'game_end'"), 'analytics tracks game_end')
ok(analyticsSrc.includes('zaraz'), 'analytics calls zaraz.track when present')
const mainSrc = readFileSync(join(root, 'src/main.ts'), 'utf8')
ok(mainSrc.includes("track('page_open')"), 'main fires page_open')
ok(mainSrc.includes('trackPlayFunnel'), 'main maps phases to play events')
ok(mainSrc.includes("track('setup_complete'"), 'main fires setup_complete on armed')
ok(mainSrc.includes("track('game_end'"), 'main fires game_end on roundEnd')

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log('\nAll smoke checks passed')

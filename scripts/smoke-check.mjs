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

const BANDS = ['mic', 'copii', 'tineri', 'adulti']
ok(
  batch.questions.every((q) => q.ageBand === 'mic'),
  'batch-001 questions tagged ageBand mic',
)
ok(
  manifest.questions.every((q) => q.ageBand === 'mic'),
  'manifest questions tagged ageBand mic',
)
ok(
  manifest.questions.filter((q) => q.ageBand === 'mic').length === 100,
  'manifest has 100 mic questions',
)
for (const band of BANDS.filter((b) => b !== 'mic')) {
  const n = manifest.questions.filter((q) => q.ageBand === band).length
  ok(n === 0, `manifest has 0 ${band} questions (got ${n})`)
}

const typesSrc = readFileSync(join(root, 'src/pack/types.ts'), 'utf8')
ok(typesSrc.includes('export type AgeBand'), 'types export AgeBand')
ok(typesSrc.includes('ageBand: AgeBand'), 'Question has ageBand')
for (const band of BANDS) {
  ok(typesSrc.includes(`'${band}'`), `AgeBand includes ${band}`)
}

const catalogSrc = readFileSync(join(root, 'src/catalog.ts'), 'utf8')
ok(catalogSrc.includes('questionsInBand'), 'catalog filters questionsInBand')
ok(catalogSrc.includes('loadPlayablePack(ageBand: AgeBand)'), 'loadPlayablePack takes ageBand')
ok(catalogSrc.includes('isBandPlayable'), 'catalog exports isBandPlayable')
ok(catalogSrc.includes('minQuestionsForSession'), 'catalog uses session minimum')

const syncSrc = readFileSync(join(root, 'scripts/sync-batch-to-pack.mjs'), 'utf8')
ok(syncSrc.includes('ageBand: q.ageBand'), 'sync-batch copies ageBand')

const mainSrc = readFileSync(join(root, 'src/main.ts'), 'utf8')
ok(mainSrc.includes('let selectedBand'), 'main keeps selectedBand UI state')
ok(mainSrc.includes('function renderHost'), 'main has host band screen')
ok(mainSrc.includes('host-tile'), 'main renders host tiles')
ok(mainSrc.includes("id: 'mic'") && mainSrc.includes("id: 'copii'"), 'host tiles include Mic and Copii')
ok(mainSrc.includes("id: 'tineri'") && mainSrc.includes("id: 'adulti'"), 'host tiles include Tineri and Adulți')
ok(mainSrc.includes('/bands/${band.id}.png'), 'host tiles use band illustrations')
ok(!mainSrc.includes('host-label'), 'host tiles have no visible category names')
ok(!mainSrc.includes('18+'), 'adults tile has no 18+ age')
ok(mainSrc.includes('în curând'), 'inactive tiles keep în curând in aria-label')
for (const band of BANDS) {
  ok(
    existsSync(join(root, 'public/bands', `${band}.png`)),
    `public/bands/${band}.png exists`,
  )
}
ok(!mainSrc.includes('Începe'), 'no Începe button')
ok(mainSrc.includes('playWelcomeIfNeeded'), 'welcome helper exists')
ok(
  /function playWelcomeIfNeeded[\s\S]*?if \(!selectedBand\) return/.test(mainSrc),
  'welcome VO skipped on host (no selectedBand)',
)

const goHomeFn = mainSrc.split('function goHome')[1]?.split('\nfunction ')[0] ?? ''
ok(goHomeFn.includes('selectedBand = null'), 'goHome returns to band picker')
ok(!goHomeFn.includes('playWelcomeIfNeeded'), 'goHome does not play welcome on host')

ok(mainSrc.includes('function playAgain'), 'Din nou uses playAgain')
ok(!mainSrc.includes('rematchGame'), 'Din nou does not auto-start rematch')
const playAgainFn = mainSrc.split('function playAgain')[1]?.split('\nfunction ')[0] ?? ''
ok(!playAgainFn.includes('selectedBand = null'), 'Din nou keeps the selected band')
ok(playAgainFn.includes('resetToSetup'), 'Din nou returns to color setup')

const setupDoc = readFileSync(join(root, 'docs/setup-screen.md'), 'utf8')
ok(setupDoc.includes('## 0. Host'), 'setup-screen documents host step 0')
ok(setupDoc.includes('## 1. Color pick'), 'setup-screen keeps color pick as step 1')
ok(setupDoc.includes('## 2. After both players pick'), 'setup-screen keeps step 2')
ok(setupDoc.includes('not') && setupDoc.toLowerCase().includes('mirrored'), 'host is not tabletop-mirrored')

const cssSrc = readFileSync(join(root, 'src/style.css'), 'utf8')
ok(cssSrc.includes('.host-grid'), 'host 2×2 grid styles exist')
ok(cssSrc.includes('.host-tile'), 'host tile styles exist')

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log('\nAll smoke checks passed')

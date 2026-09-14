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

const donateSrc = readFileSync(join(root, 'src/donate.ts'), 'utf8')
ok(donateSrc.includes("https://paypal.me/stefanpricopi"), 'donate.ts has PayPal.me URL')
ok(donateSrc.includes('Invită-ne la o cafea'), 'donate label is Invită-ne la o cafea')
ok(donateSrc.includes("target = '_blank'"), 'donate link opens in a new tab')
ok(donateSrc.includes("noopener noreferrer"), 'donate link uses rel noopener noreferrer')
ok(!donateSrc.includes('entitlements'), 'donate.ts does not mention entitlements')
ok(!donateSrc.includes('unlock('), 'donate.ts does not call unlock')
ok(donateSrc.includes("track('donate_click')"), 'donate click is tracked')

ok(mainSrc.includes("from './donate'"), 'main.ts imports donate helper')
ok((mainSrc.match(/createDonateLink/g) || []).length === 2, 'donate used once (import + renderEnd)')
const endBlock = mainSrc.split('function renderEnd')[1]?.split('\nfunction ')[0] ?? ''
ok(endBlock.includes('createDonateLink()'), 'renderEnd appends donate link')
ok(!endBlock.includes('unlock('), 'renderEnd does not unlock packs')

const cssSrc = readFileSync(join(root, 'src/style.css'), 'utf8')
ok(cssSrc.includes('.host-grid'), 'host 2×2 grid styles exist')
ok(cssSrc.includes('.host-tile'), 'host tile styles exist')
const donateRule = cssSrc.match(/\.btn-donate\s*\{[^}]+\}/)?.[0] ?? ''
ok(donateRule.includes('background'), 'parent donate button styles exist')
ok(!donateRule.includes('--adevarat') && !donateRule.includes('--fals'), 'donate button avoids true/false colors')

const indexHtml = readFileSync(join(root, 'index.html'), 'utf8')
ok(/<!doctype html>/i.test(indexHtml), 'index.html has doctype (Pages can inject Web Analytics)')
ok(/<html[\s>]/i.test(indexHtml) && /<head[\s>]/i.test(indexHtml) && /<body[\s>]/i.test(indexHtml), 'index.html has html/head/body')
ok(existsSync(join(root, 'scripts/enable-cf-web-analytics.mjs')), 'analytics enable script exists')
ok(readFileSync(join(root, 'package.json'), 'utf8').includes('analytics:enable'), 'package.json has analytics:enable')
ok(readFileSync(join(root, 'docs/deploy.md'), 'utf8').includes('Web Analytics'), 'deploy.md documents Web Analytics')
ok(readFileSync(join(root, 'docs/deploy.md'), 'utf8').includes('## Zaraz'), 'deploy.md documents Zaraz after mishak.ro')
const analyticsSrc = readFileSync(join(root, 'src/analytics.ts'), 'utf8')
ok(analyticsSrc.includes("'page_open'"), 'analytics tracks page_open')
ok(analyticsSrc.includes("'setup_complete'"), 'analytics tracks setup_complete')
ok(analyticsSrc.includes("'round_end'"), 'analytics tracks round_end')
ok(analyticsSrc.includes("'game_end'"), 'analytics tracks game_end')
ok(analyticsSrc.includes('zaraz'), 'analytics calls zaraz.track when present')
ok(
  /if \(zaraz\?\.track\) \{[\s\S]*zaraz\.track\(name, props\)[\s\S]*return/.test(analyticsSrc),
  'zaraz.track skips /e/ URL fallback (one dashboard)',
)
ok(mainSrc.includes("track('page_open')"), 'main fires page_open')
ok(mainSrc.includes('trackPlayFunnel'), 'main maps phases to play events')
ok(mainSrc.includes("track('setup_complete'"), 'main fires setup_complete on armed')
ok(mainSrc.includes("track('game_end'"), 'main fires game_end on roundEnd')
ok(mainSrc.includes('resetPlayAnalytics'), 'Acasă / Din nou reset play funnel')
ok(mainSrc.includes('unlockAudio'), 'color/tap unlocks voiceover channel')
const launchFn = mainSrc.split('function scheduleLaunch')[1]?.split('\nfunction ')[0] ?? ''
ok(launchFn.includes('void startGame()'), 'scheduleLaunch starts the game')
ok(!/\bsetTimeout\b/.test(launchFn), 'game start stays in the color-tap turn (no delayed start)')
const playerSrc = readFileSync(join(root, 'src/audio/player.ts'), 'utf8')
ok(playerSrc.includes('isAutoplayBlock'), 'audio player detects autoplay blocks')
ok(playerSrc.includes('unlock()'), 'audio player can retry after a tap')
const engineSrc = readFileSync(join(root, 'src/session/engine.ts'), 'utf8')
ok(mainSrc.includes('dataset.round'), 'arena exposes data-round for play debugging')
ok(
  /if \(this\.phase === 'nextTurn'\) \{[\s\S]*playCurrentQuestion\(\)/.test(engineSrc),
  'missing intro/handoff clip still plays the question',
)

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log('\nAll smoke checks passed')

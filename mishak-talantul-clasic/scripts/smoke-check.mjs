import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
let failed = 0

function ok(cond, msg) {
  if (cond) console.log('ok ', msg)
  else {
    console.error('FAIL', msg)
    failed += 1
  }
}

const manifest = JSON.parse(
  readFileSync(join(root, 'public/packs/clase-4-5/manifest.json'), 'utf8'),
)
const catalog = JSON.parse(
  readFileSync(join(root, 'public/content-packs/catalog.json'), 'utf8'),
)
const qs = manifest.questions
const allowed = new Set(['1_samuel', '2_samuel', '1_petru'])

ok(manifest.category === 'clase_4_5', 'pack category clase_4_5')
ok(qs.length >= 29, `enough questions for blueprint (got ${qs.length})`)
ok(qs.filter((q) => q.type === 'true_false').length >= 10, '≥10 true_false')
ok(qs.filter((q) => q.type === 'single_choice').length >= 10, '≥10 single_choice')
ok(qs.filter((q) => q.type === 'matching').length >= 1, '≥1 matching')
ok(qs.filter((q) => q.type === 'short_answer').length >= 5, '≥5 short_answer')
ok(qs.filter((q) => q.type === 'multi_choice').length >= 3, '≥3 multi_choice')
ok(
  qs.every((q) => q.reviewStatus === 'PLACEHOLDER'),
  'all seed items PLACEHOLDER',
)
ok(
  qs.every(
    (q) =>
      Array.isArray(q.books) &&
      q.books.length > 0 &&
      q.books.every((b) => allowed.has(b)),
  ),
  'all items tagged only 1–2 Samuel / 1 Petru',
)
ok(
  catalog.packs.some((p) => p.packId === 'clase-4-5' && p.priceTier === 'free'),
  'catalog free-start for clase-4-5',
)

const versesPath = join(root, 'public/packs/clase-4-5/verses.json')
ok(existsSync(versesPath), 'verses.json present')
const verses = JSON.parse(readFileSync(versesPath, 'utf8'))
const missingRefs = [
  ...new Set(qs.map((q) => q.ref).filter(Boolean)),
].filter((r) => !verses[r] && !qs.find((q) => q.ref === r && q.refText))
ok(
  missingRefs.length === 0,
  missingRefs.length === 0
    ? 'every question.ref has verse text'
    : `missing verses for: ${missingRefs.join(', ')}`,
)
ok(
  readFileSync(join(root, 'src/main.ts'), 'utf8').includes('verseTextFor'),
  'review shows verse text helper',
)

const docs = [
  'docs/brief.md',
  'docs/content-schema.md',
  'docs/blueprint-foaie-100.md',
  'docs/setup-flow.md',
  'docs/deploy.md',
  'docs/content-review-clase-4-5.md',
  'docs/edition-2027.md',
]
for (const d of docs) ok(existsSync(join(root, d)), d)

const editionSrc = readFileSync(join(root, 'src/edition-2027.ts'), 'utf8')
ok(editionSrc.includes('prescolari_clasa_1'), 'edition has Preșcolari–Cl.1')
ok(editionSrc.includes('adulti_18_35'), 'edition has 18–35')
ok(editionSrc.includes('adulti_35_plus'), 'edition has 35+')
ok(editionSrc.includes('2027-03-20'), 'edition has church phase date')
ok(editionSrc.includes('SBR Oradea 2005'), 'edition locks Cornilescu SBR Oradea 2005')
ok(editionSrc.includes('1_petru'), 'clase 4–5 biblio includes 1 Petru')

const typesSrc = readFileSync(join(root, 'src/types.ts'), 'utf8')
ok(typesSrc.includes('prescolari_clasa_1'), 'types include prescolari_clasa_1')
ok(!typesSrc.includes('tineri_18_25'), 'old 18–25 category removed')
ok(!typesSrc.includes('adulti_25_plus'), 'old 25+ category removed')
ok(typesSrc.includes('books: BibleBookId[]'), 'questions carry books[]')

const mainSrc = readFileSync(join(root, 'src/main.ts'), 'utf8')
ok(mainSrc.includes('neoficial'), 'UI mentions neoficial')
ok(mainSrc.includes('talantulinnegot.com'), 'UI links official site')
ok(mainSrc.includes('renderHome'), 'home screen with phases')
ok(mainSrc.includes('renderBiblio'), 'bibliography screen')
ok(mainSrc.includes('renderDrillPick'), 'drill by book picker')
ok(mainSrc.includes('Am înțeles'), 'disclaimer gate')

const scoreSrc = readFileSync(join(root, 'src/score.ts'), 'utf8')
ok(scoreSrc.includes('opts.book'), 'drill filters by book')
ok(scoreSrc.includes('chaptersForBook'), 'drill lists chapters per book')

const engineSrc = readFileSync(join(root, 'src/session/engine.ts'), 'utf8')
ok(engineSrc.includes("'home'"), 'session has home phase')
ok(engineSrc.includes("'drillPick'"), 'session has drillPick phase')
ok(engineSrc.includes('timerSecondsLeft'), 'optional timer')

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log('\nAll smoke checks passed')

/**
 * Headless scoring checks for Cat V all-or-nothing + exam deck size.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { gradeAnswer, buildExamDeck, summarizeScores } = await import(
  pathToFileURL(join(root, 'src/score.ts')).href
)
const { DEFAULT_BLUEPRINT } = await import(
  pathToFileURL(join(root, 'src/types.ts')).href
)

const manifest = JSON.parse(
  readFileSync(join(root, 'public/packs/clase-4-5/manifest.json'), 'utf8'),
)

const { deck, pointsMax } = buildExamDeck(manifest.questions, DEFAULT_BLUEPRINT)
if (deck.length !== 29) {
  console.error(`FAIL exam deck length ${deck.length}, expected 29`)
  process.exit(1)
}
console.log('PASS exam deck has 29 items (10+10+1+5+3)')

const mc = deck.find((q) => q.type === 'multi_choice')
if (!mc) {
  console.error('FAIL no multi_choice in deck')
  process.exit(1)
}
const wrong = gradeAnswer(
  mc,
  { type: 'multi_choice', indices: [] },
  5,
  true,
)
const right = gradeAnswer(
  mc,
  { type: 'multi_choice', indices: [...mc.correctIndices] },
  5,
  true,
)
if (wrong.pointsEarned !== 0 || right.pointsEarned !== 5) {
  console.error('FAIL Cat V all-or-nothing', wrong, right)
  process.exit(1)
}
console.log('PASS Cat V all-or-nothing (0 or 5)')

const perfect = deck.map((q, i) => {
  let draft
  switch (q.type) {
    case 'true_false':
      draft = { type: 'true_false', value: q.correct }
      break
    case 'single_choice':
      draft = { type: 'single_choice', index: q.correctIndex }
      break
    case 'matching':
      draft = { type: 'matching', map: [...q.correctMap] }
      break
    case 'short_answer':
      draft = { type: 'short_answer', text: q.accepted[0] }
      break
    case 'multi_choice':
      draft = { type: 'multi_choice', indices: [...q.correctIndices] }
      break
  }
  return gradeAnswer(
    q,
    draft,
    pointsMax[i],
    q.type === 'multi_choice',
  )
})
const summary = summarizeScores(perfect, DEFAULT_BLUEPRINT.maxScore)
if (summary.total !== 100) {
  console.error(`FAIL perfect score ${summary.total}, expected 100`)
  process.exit(1)
}
console.log('PASS perfect exam scores 100 / 100')

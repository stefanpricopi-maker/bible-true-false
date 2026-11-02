#!/usr/bin/env node
/**
 * Generates PLACEHOLDER verse pack for Apocalipsa 1–5.
 * Not Cornilescu — training stubs until rights are cleared.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))
const out = join(__dir, '../public/packs/apocalipsa-1-5/manifest.json')

/** Standard verse counts (Revelation 1–5). */
const COUNTS = { 1: 20, 2: 29, 3: 22, 4: 11, 5: 14 }

const WORDS = [
  'Domnul',
  'cuvântul',
  'lumină',
  'cerul',
  'pământul',
  'îngerul',
  'biserica',
  'credința',
  'nădejdea',
  'dragostea',
  'tronul',
  'viața',
  'adevărul',
  'pacea',
  'harul',
]

function stubText(chapter, verse) {
  const a = WORDS[(chapter * 7 + verse) % WORDS.length]
  const b = WORDS[(chapter * 3 + verse * 5) % WORDS.length]
  const c = WORDS[(chapter + verse * 2) % WORDS.length]
  return `Antrenament PLACEHOLDER Apocalipsa ${chapter}:${verse} — ${a} și ${b} rămân în ${c} până la textul Cornilescu.`
}

const verses = []
for (const [ch, count] of Object.entries(COUNTS)) {
  const chapter = Number(ch)
  for (let v = 1; v <= count; v++) {
    verses.push({
      id: `apoc-${chapter}-${v}`,
      chapter,
      verse: v,
      text: stubText(chapter, v),
      audioRef: null,
      reviewStatus: 'PLACEHOLDER',
    })
  }
}

const manifest = {
  id: 'apocalipsa-1-5',
  title: 'Apocalipsa 1–5',
  locale: 'ro',
  edition: 'Cornilescu SBR Oradea 2005 (țintă)',
  rightsStatus: 'PLACEHOLDER',
  note: 'Stub-uri de antrenament — înlocuiește cu text Cornilescu după drepturi.',
  verses,
}

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n')
console.log(`Wrote ${verses.length} verses → ${out}`)

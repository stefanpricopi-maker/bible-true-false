#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const packPath = join(root, 'public/packs/apocalipsa-1-5/manifest.json')
if (!existsSync(packPath)) {
  console.error('Missing pack manifest')
  process.exit(1)
}
const pack = JSON.parse(readFileSync(packPath, 'utf8'))
const expected = 20 + 29 + 22 + 11 + 14
if (pack.verses?.length !== expected) {
  console.error(`Expected ${expected} verses, got ${pack.verses?.length}`)
  process.exit(1)
}
if (pack.rightsStatus !== 'PLACEHOLDER' && pack.rightsStatus !== 'cleared') {
  console.error('Invalid rightsStatus')
  process.exit(1)
}
console.log(`smoke ok: ${pack.verses.length} verses, rights=${pack.rightsStatus}`)

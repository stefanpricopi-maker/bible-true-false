import type { Verse } from './types'

const PUNCT = /[.,;:!?„”"«»()]/g

export function wordsOf(text: string): string[] {
  return text
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean)
}

export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(PUNCT, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function fidelityScore(expected: string, got: string): {
  score: number
  missing: string[]
  extra: string[]
} {
  const e = normalizeAnswer(expected).split(' ').filter(Boolean)
  const g = normalizeAnswer(got).split(' ').filter(Boolean)
  const eSet = new Set(e)
  const gSet = new Set(g)
  const missing = e.filter((w) => !gSet.has(w))
  const extra = g.filter((w) => !eSet.has(w))
  const hit = e.length - missing.length
  const score = e.length === 0 ? 0 : Math.round((hit / e.length) * 100)
  return { score, missing, extra }
}

/** Pick cloze indices — skip very short tokens. */
export function clozeIndices(text: string, count: number): number[] {
  const words = wordsOf(text)
  const candidates = words
    .map((w, i) => ({ w: w.replace(PUNCT, ''), i }))
    .filter((x) => x.w.length >= 4)
  const picks: number[] = []
  const pool = [...candidates]
  while (picks.length < count && pool.length) {
    const idx = Math.floor(Math.random() * pool.length)
    const [item] = pool.splice(idx, 1)
    if (item) picks.push(item.i)
  }
  return picks.sort((a, b) => a - b)
}

export function scrambleWords(text: string): string[] {
  const w = wordsOf(text)
  const out = [...w]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  // Avoid identical order when possible
  if (out.join(' ') === w.join(' ') && out.length > 1) {
    ;[out[0], out[1]] = [out[1]!, out[0]!]
  }
  return out
}

export function firstLettersCue(text: string): string {
  return wordsOf(text)
    .map((w) => {
      const clean = w.replace(PUNCT, '')
      const punct = w.slice(clean.length)
      if (!clean) return w
      return clean[0]!.toUpperCase() + '_'.repeat(Math.max(0, clean.length - 1)) + punct
    })
    .join(' ')
}

export function splitFragments(text: string, parts = 3): string[] {
  const w = wordsOf(text)
  if (w.length < parts) return [text]
  const size = Math.ceil(w.length / parts)
  const frags: string[] = []
  for (let i = 0; i < w.length; i += size) {
    frags.push(w.slice(i, i + size).join(' '))
  }
  return frags
}

export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

export function passageAround(
  verses: Verse[],
  centerId: string,
  span = 5,
): Verse[] {
  const idx = verses.findIndex((v) => v.id === centerId)
  if (idx < 0) return verses.slice(0, span)
  const start = Math.max(0, idx)
  return verses.slice(start, start + span)
}

export function speakText(text: string): void {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ro-RO'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

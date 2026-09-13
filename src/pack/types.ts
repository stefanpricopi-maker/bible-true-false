export type PlayerId = 0 | 1

export type Answer = boolean

/** One band per game; host picks before colors. */
export type AgeBand = 'mic' | 'copii' | 'tineri' | 'adulti'

export type QuestionAudio = {
  question: string
  correct?: string
  incorrect?: string
}

export type Question = {
  id: string
  correct: Answer
  promptText?: string
  audio: QuestionAudio
  ageBand: AgeBand
}

export type ClipRef = string | string[]

export type PackVoiceover = {
  welcome?: ClipRef
  gameStart?: ClipRef
  round1Start?: ClipRef
  firstQuestionCue?: ClipRef
  /** Round 2 race-mode intro (both may buzz). */
  raceRoundStart?: ClipRef
  /** Round 3: same question, both answer, then shared reveal. */
  round3Start?: ClipRef
  /** After both answered in R3: „Răspunsul este Adevărat”. */
  answerIsTrue?: ClipRef
  /** After both answered in R3: „Răspunsul este Fals”. */
  answerIsFalse?: ClipRef
}

export type PackFeedback = {
  correct: ClipRef
  incorrect: ClipRef
  nextTurn?: ClipRef
  roundBreak?: ClipRef
  /** After round 2, before round 3. */
  roundBreakTo3?: ClipRef
  /** Nobody buzzed in round 2 before the timer. */
  buzzTimeout?: ClipRef
  /** Map of lowercase hex color → next-turn clip(s) */
  nextTurnByColor?: Record<string, ClipRef>
}

export type PackSfx = {
  colorSelect?: string | string[]
  answerTap?: string | string[]
  correct?: string | string[]
  incorrect?: string | string[]
  roundBreak?: string | string[]
  victory?: string | string[]
  /** Loop while waiting for True/False after the question. */
  waiting?: string | string[]
}

export type PackManifest = {
  id: string
  title: string
  locale?: string
  note?: string
  voiceover?: PackVoiceover
  feedback: PackFeedback
  sfx?: PackSfx
  questions: Question[]
}

export type Pack = PackManifest & {
  baseUrl: string
}

export function assetUrl(pack: Pack, relative: string): string {
  return `${pack.baseUrl.replace(/\/$/, '')}/${relative.replace(/^\//, '')}`
}

/** Pick one path from a single clip or a variant list. */
export function pickClip(entry: ClipRef | undefined | null): string | null {
  if (!entry) return null
  if (Array.isArray(entry)) {
    if (entry.length === 0) return null
    return entry[Math.floor(Math.random() * entry.length)] ?? null
  }
  return entry
}

export function clipUrl(pack: Pack, entry: ClipRef | undefined | null): string | null {
  const rel = pickClip(entry)
  return rel ? assetUrl(pack, rel) : null
}

/** Resolve next-turn clip for the active player's color. */
export function nextTurnUrl(pack: Pack, playerColor: string): string | null {
  const key = playerColor.trim().toLowerCase()
  const byColor = pack.feedback.nextTurnByColor?.[key]
  return clipUrl(pack, byColor) ?? clipUrl(pack, pack.feedback.nextTurn)
}

function stemFromSfxPath(path: string): string {
  const file = path.split('/').pop() ?? path
  return file.replace(/\.mp3$/i, '').replace(/-\d+$/i, '').toLowerCase()
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Expand a manifest SFX entry to all on-disk variants from sfx/index.json.
 * e.g. waiting.mp3 + waiting-1.mp3 … waiting-6.mp3 → all paths under sfx/
 */
export function expandSfxVariants(
  entry: string | string[] | undefined,
  indexFiles: string[],
): string[] | undefined {
  if (!entry) return undefined
  const seeds = Array.isArray(entry) ? entry : [entry]
  const stems = new Set(seeds.map(stemFromSfxPath))
  const matches: string[] = []

  for (const file of indexFiles) {
    if (!/\.mp3$/i.test(file)) continue
    const base = file.replace(/\.mp3$/i, '')
    for (const stem of stems) {
      const re = new RegExp(`^${escapeRegExp(stem)}(-\\d+)?$`, 'i')
      if (re.test(base)) {
        matches.push(`sfx/${file}`)
      }
    }
  }

  if (matches.length === 0) return seeds
  // unique, stable order
  return [...new Set(matches)]
}

export async function loadPack(packId: string): Promise<Pack> {
  const baseUrl = `/packs/${packId}`
  const res = await fetch(`${baseUrl}/manifest.json`)
  if (!res.ok) {
    throw new Error(`Failed to load pack ${packId}: ${res.status}`)
  }
  const manifest = (await res.json()) as PackManifest

  let indexFiles: string[] = []
  try {
    const idxRes = await fetch(`${baseUrl}/sfx/index.json`)
    if (idxRes.ok) {
      indexFiles = (await idxRes.json()) as string[]
    }
  } catch {
    /* optional index */
  }

  if (manifest.sfx && indexFiles.length > 0) {
    const expanded: PackSfx = {}
    for (const key of Object.keys(manifest.sfx) as (keyof PackSfx)[]) {
      const value = manifest.sfx[key]
      expanded[key] = expandSfxVariants(value, indexFiles)
    }
    manifest.sfx = expanded
  }

  return { ...manifest, baseUrl }
}

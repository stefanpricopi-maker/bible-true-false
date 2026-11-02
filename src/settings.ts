/** Parent-facing audio / intro prefs (web localStorage). */

const STORAGE_KEY = 'btf.settings.v1'

export type AppSettings = {
  /** Voiceover / question clips, 0–1 */
  voVolume: number
  /** SFX + waiting loop, 0–1 */
  sfxVolume: number
  /** Skip welcome (+ color-hint) on color setup */
  skipWelcome: boolean
}

const DEFAULTS: AppSettings = {
  voVolume: 1,
  sfxVolume: 0.65,
  skipWelcome: false,
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

function readSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      voVolume: clamp01(
        typeof parsed.voVolume === 'number' ? parsed.voVolume : DEFAULTS.voVolume,
      ),
      sfxVolume: clamp01(
        typeof parsed.sfxVolume === 'number' ? parsed.sfxVolume : DEFAULTS.sfxVolume,
      ),
      skipWelcome:
        typeof parsed.skipWelcome === 'boolean'
          ? parsed.skipWelcome
          : DEFAULTS.skipWelcome,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

function writeSettings(next: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function getSettings(): AppSettings {
  return readSettings()
}

export function setVoVolume(v: number): AppSettings {
  const next = { ...readSettings(), voVolume: clamp01(v) }
  writeSettings(next)
  return next
}

export function setSfxVolume(v: number): AppSettings {
  const next = { ...readSettings(), sfxVolume: clamp01(v) }
  writeSettings(next)
  return next
}

export function setSkipWelcome(skip: boolean): AppSettings {
  const next = { ...readSettings(), skipWelcome: skip }
  writeSettings(next)
  return next
}

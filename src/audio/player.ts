export type AudioEndedHandler = () => void
export type AudioErrorHandler = (error: Error) => void

/** Tiny WAV so a user-gesture `play()` can unlock the VO channel. */
const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'

export function isAutoplayBlock(err: unknown): boolean {
  if (err == null) return false
  const name =
    typeof err === 'object' && err !== null && 'name' in err
      ? String((err as { name: unknown }).name)
      : ''
  const msg = err instanceof Error ? err.message : String(err)
  if (name === 'NotAllowedError') return true
  return /not allowed|user didn't interact|user hasn't interacted/i.test(msg)
}

type Pending = {
  url: string
  onEnded?: AudioEndedHandler
  onError?: AudioErrorHandler
}

/**
 * Single-channel player. Reuses one element so a tap can unlock later clips.
 * Autoplay blocks wait for `unlock()` instead of failing the clip (which used
 * to skip questions and burn through rounds).
 */
export class AudioPlayer {
  private readonly el: HTMLAudioElement
  private generation = 0
  private onEnded: AudioEndedHandler | null = null
  private onError: AudioErrorHandler | null = null
  private pending: Pending | null = null
  private blocked = false
  private intentionallyPaused = false
  private ended = true

  constructor() {
    this.el = new Audio()
    this.el.preload = 'auto'
    this.el.addEventListener('ended', () => {
      if (this.blocked) return
      this.ended = true
      this.intentionallyPaused = false
      const cb = this.onEnded
      this.onEnded = null
      this.onError = null
      this.pending = null
      cb?.()
    })
    this.el.addEventListener('error', () => {
      if (this.blocked) return
      this.handlePlayFailure(new Error(`Audio failed: ${this.el.currentSrc || this.el.src}`))
    })
  }

  play(url: string, onEnded?: AudioEndedHandler, onError?: AudioErrorHandler): void {
    this.generation += 1
    const gen = this.generation
    this.intentionallyPaused = false
    this.blocked = false
    this.ended = false
    this.onEnded = onEnded ?? null
    this.onError = onError ?? null
    this.pending = { url, onEnded, onError }
    this.el.pause()
    this.el.src = url
    void this.el.play().then(
      () => {
        if (gen !== this.generation) return
        this.blocked = false
      },
      (err: unknown) => {
        if (gen !== this.generation) return
        this.handlePlayFailure(err)
      },
    )
  }

  /** Call from a user gesture. Retries a blocked clip or warms the element. */
  unlock(): void {
    if (this.blocked && this.pending) {
      const { url, onEnded, onError } = this.pending
      this.play(url, onEnded, onError)
      return
    }
    if (this.pending) return
    const gen = this.generation
    this.el.muted = true
    const prev = this.el.src
    if (!prev) this.el.src = SILENT_WAV
    void this.el.play().then(
      () => {
        if (gen !== this.generation) {
          this.el.muted = false
          return
        }
        this.el.pause()
        this.el.muted = false
        if (this.el.src === SILENT_WAV) this.el.removeAttribute('src')
      },
      () => {
        if (gen !== this.generation) return
        this.el.muted = false
      },
    )
  }

  /** Pause current clip; keeps position for resume. */
  pause(): void {
    if (this.ended || this.el.paused) return
    this.intentionallyPaused = true
    this.el.pause()
  }

  /** Resume paused clip from the same position. */
  resume(): void {
    if (this.ended && !this.pending) return
    this.intentionallyPaused = false
    const gen = this.generation
    void this.el.play().then(
      () => undefined,
      (err: unknown) => {
        if (gen !== this.generation) return
        if (isAutoplayBlock(err)) {
          this.blocked = true
          return
        }
        /* ignore other resume failures */
      },
    )
  }

  togglePause(): boolean {
    if (this.ended && !this.pending) return false
    if (this.el.paused && this.intentionallyPaused) {
      this.resume()
      return false
    }
    if (!this.el.paused) {
      this.pause()
      return true
    }
    this.resume()
    return false
  }

  get isPaused(): boolean {
    return this.intentionallyPaused && this.el.paused
  }

  get hasActiveClip(): boolean {
    return !this.ended && !this.el.ended
  }

  stop(): void {
    this.generation += 1
    this.blocked = false
    this.intentionallyPaused = false
    this.ended = true
    this.onEnded = null
    this.onError = null
    this.pending = null
    this.el.pause()
    this.el.removeAttribute('src')
  }

  private handlePlayFailure(err: unknown): void {
    if (isAutoplayBlock(err)) {
      this.blocked = true
      this.ended = false
      return
    }
    this.ended = true
    this.blocked = false
    this.pending = null
    const cb = this.onError
    this.onEnded = null
    this.onError = null
    cb?.(err instanceof Error ? err : new Error(String(err)))
  }
}

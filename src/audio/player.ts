export type AudioEndedHandler = () => void
export type AudioErrorHandler = (error: Error) => void

/** Single-channel player: stop before next play; no overlapping sounds. */
export class AudioPlayer {
  private audio: HTMLAudioElement | null = null
  private onEnded: AudioEndedHandler | null = null
  private intentionallyPaused = false

  play(url: string, onEnded?: AudioEndedHandler, onError?: AudioErrorHandler): void {
    this.stop()
    this.intentionallyPaused = false
    const el = new Audio(url)
    this.audio = el
    this.onEnded = onEnded ?? null
    let settled = false

    const reportError = (err: Error) => {
      if (settled) return
      settled = true
      this.onEnded = null
      this.intentionallyPaused = false
      if (this.audio === el) {
        this.audio = null
      }
      onError?.(err)
    }

    el.addEventListener(
      'ended',
      () => {
        if (this.audio !== el || settled) return
        settled = true
        const cb = this.onEnded
        this.onEnded = null
        this.intentionallyPaused = false
        this.audio = null
        cb?.()
      },
      { once: true },
    )

    el.addEventListener(
      'error',
      () => {
        reportError(new Error(`Audio failed: ${url}`))
      },
      { once: true },
    )

    void el.play().catch((err: unknown) => {
      reportError(err instanceof Error ? err : new Error(String(err)))
    })
  }

  /** Pause current clip; keeps position for resume. */
  pause(): void {
    if (!this.audio || this.audio.paused) return
    this.intentionallyPaused = true
    this.audio.pause()
  }

  /** Resume paused clip from the same position. */
  resume(): void {
    if (!this.audio) return
    this.intentionallyPaused = false
    void this.audio.play().catch(() => {
      /* ignore gesture/autoplay issues on resume */
    })
  }

  togglePause(): boolean {
    if (!this.audio) return false
    if (this.audio.paused && this.intentionallyPaused) {
      this.resume()
      return false
    }
    if (!this.audio.paused) {
      this.pause()
      return true
    }
    // paused but not by us (e.g. ended) — try play
    this.resume()
    return false
  }

  get isPaused(): boolean {
    return this.intentionallyPaused && !!this.audio?.paused
  }

  get hasActiveClip(): boolean {
    return this.audio !== null && !this.audio.ended
  }

  stop(): void {
    if (!this.audio) return
    this.intentionallyPaused = false
    this.audio.pause()
    this.audio.removeAttribute('src')
    this.audio.load()
    this.audio = null
    this.onEnded = null
  }
}

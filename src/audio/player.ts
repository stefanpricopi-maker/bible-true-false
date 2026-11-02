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

function isBenignPlayInterrupt(err: unknown): boolean {
  if (err == null) return false
  const name =
    typeof err === 'object' && err !== null && 'name' in err
      ? String((err as { name: unknown }).name)
      : ''
  if (name === 'AbortError') return true
  const msg = err instanceof Error ? err.message : String(err)
  return /abort|interrupted|the play\(\) request was interrupted/i.test(msg)
}

type Pending = {
  url: string
  onEnded?: AudioEndedHandler
  onError?: AudioErrorHandler
}

type Slot = {
  el: HTMLAudioElement
  /** Generation last assigned to this element. */
  gen: number
}

/**
 * Single-channel VO player.
 * Uses two alternating elements so handoff→question does not reset media
 * engagement by swapping `src` on the element that just finished (a common
 * cause of mid-game silence until a gesture/`replay`).
 */
export class AudioPlayer {
  private readonly slots: [Slot, Slot]
  private active = 0
  private generation = 0
  private onEnded: AudioEndedHandler | null = null
  private onError: AudioErrorHandler | null = null
  private pending: Pending | null = null
  private blocked = false
  private intentionallyPaused = false
  private ended = true
  private volume = 1
  private retryTimer: number | null = null

  constructor() {
    this.slots = [this.makeSlot(), this.makeSlot()]
  }

  private makeSlot(): Slot {
    const el = new Audio()
    el.preload = 'auto'
    el.volume = this.volume
    const slot: Slot = { el, gen: 0 }
    el.addEventListener('ended', () => this.onSlotEnded(slot))
    el.addEventListener('error', () => this.onSlotError(slot))
    return slot
  }

  private clearRetry(): void {
    if (this.retryTimer != null) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
  }

  private onSlotEnded(slot: Slot): void {
    if (slot.gen !== this.generation) return
    if (this.blocked) return
    this.ended = true
    this.intentionallyPaused = false
    const cb = this.onEnded
    this.onEnded = null
    this.onError = null
    this.pending = null
    this.clearRetry()
    cb?.()
  }

  private onSlotError(slot: Slot): void {
    if (slot.gen !== this.generation) return
    if (this.blocked) return
    const mediaErr = slot.el.error
    // Src swaps / supersedes often surface as MEDIA_ERR_ABORTED — ignore.
    if (mediaErr && mediaErr.code === MediaError.MEDIA_ERR_ABORTED) return
    this.handlePlayFailure(
      new Error(`Audio failed: ${slot.el.currentSrc || slot.el.src}`),
    )
  }

  play(url: string, onEnded?: AudioEndedHandler, onError?: AudioErrorHandler): void {
    this.generation += 1
    const gen = this.generation
    this.clearRetry()
    this.intentionallyPaused = false
    this.blocked = false
    this.ended = false
    this.onEnded = onEnded ?? null
    this.onError = onError ?? null
    this.pending = { url, onEnded, onError }

    // Pause the previous slot; play on the other element (keeps unlock warmer).
    const prev = this.slots[this.active]!
    prev.el.pause()

    this.active = this.active === 0 ? 1 : 0
    const slot = this.slots[this.active]!
    slot.gen = gen
    const el = slot.el
    el.volume = this.volume
    el.pause()
    el.src = url
    el.load()

    const tryPlay = () => {
      if (gen !== this.generation) return
      void el.play().then(
        () => {
          if (gen !== this.generation) return
          this.blocked = false
          this.clearRetry()
        },
        (err: unknown) => {
          if (gen !== this.generation) return
          if (isBenignPlayInterrupt(err)) return
          this.handlePlayFailure(err)
        },
      )
    }

    if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      tryPlay()
    } else {
      const onReady = () => {
        el.removeEventListener('canplay', onReady)
        tryPlay()
      }
      el.addEventListener('canplay', onReady)
      // Fallback if canplay never fires (cached / odd UA).
      setTimeout(() => {
        if (gen !== this.generation) return
        el.removeEventListener('canplay', onReady)
        if (!this.ended && !this.blocked && el.paused) tryPlay()
      }, 400)
    }
  }

  /** Call from a user gesture. Retries a blocked clip or warms the element. */
  unlock(): void {
    if (this.blocked && this.pending) {
      const { url, onEnded, onError } = this.pending
      this.play(url, onEnded, onError)
      return
    }
    if (this.pending && !this.ended && this.current().paused && !this.intentionallyPaused) {
      // Stuck paused without intentional pause — nudge play from gesture.
      const gen = this.generation
      void this.current().play().then(
        () => undefined,
        (err: unknown) => {
          if (gen !== this.generation) return
          if (isAutoplayBlock(err)) this.handlePlayFailure(err)
        },
      )
      return
    }
    if (this.pending) return
    const gen = this.generation
    const el = this.current()
    el.muted = true
    const prev = el.src
    if (!prev) el.src = SILENT_WAV
    void el.play().then(
      () => {
        if (gen !== this.generation) {
          el.muted = false
          return
        }
        el.pause()
        el.muted = false
        if (el.src === SILENT_WAV) el.removeAttribute('src')
      },
      () => {
        if (gen !== this.generation) return
        el.muted = false
      },
    )
  }

  /** Pause current clip; keeps position for resume. */
  pause(): void {
    if (this.ended || this.current().paused) return
    this.intentionallyPaused = true
    this.current().pause()
  }

  /** Resume paused clip from the same position. */
  resume(): void {
    if (this.ended && !this.pending) return
    this.intentionallyPaused = false
    const gen = this.generation
    void this.current().play().then(
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
    if (this.current().paused && this.intentionallyPaused) {
      this.resume()
      return false
    }
    if (!this.current().paused) {
      this.pause()
      return true
    }
    this.resume()
    return false
  }

  get isPaused(): boolean {
    return this.intentionallyPaused && this.current().paused
  }

  get isBlocked(): boolean {
    return this.blocked
  }

  get hasActiveClip(): boolean {
    return !this.ended && !this.current().ended
  }

  stop(): void {
    this.generation += 1
    this.blocked = false
    this.intentionallyPaused = false
    this.ended = true
    this.onEnded = null
    this.onError = null
    this.pending = null
    this.clearRetry()
    for (const slot of this.slots) {
      slot.gen = 0
      slot.el.pause()
      slot.el.removeAttribute('src')
      try {
        slot.el.load()
      } catch {
        /* ignore */
      }
    }
  }

  setVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v))
    for (const slot of this.slots) slot.el.volume = this.volume
  }

  getVolume(): number {
    return this.volume
  }

  private current(): HTMLAudioElement {
    return this.slots[this.active]!.el
  }

  private handlePlayFailure(err: unknown): void {
    if (isBenignPlayInterrupt(err)) return

    if (isAutoplayBlock(err)) {
      this.blocked = true
      this.ended = false
      // Soft retries — sometimes the UA allows play a tick after `ended`.
      this.scheduleAutoplayRetries()
      return
    }

    this.ended = true
    this.blocked = false
    this.pending = null
    this.clearRetry()
    const cb = this.onError
    this.onEnded = null
    this.onError = null
    cb?.(err instanceof Error ? err : new Error(String(err)))
  }

  private scheduleAutoplayRetries(): void {
    this.clearRetry()
    const gen = this.generation
    const delays = [30, 120, 350]
    let i = 0
    const tick = () => {
      if (gen !== this.generation || !this.blocked || !this.pending) return
      const el = this.current()
      void el.play().then(
        () => {
          if (gen !== this.generation) return
          this.blocked = false
          this.clearRetry()
        },
        () => {
          if (gen !== this.generation) return
          i += 1
          if (i >= delays.length) return
          this.retryTimer = setTimeout(tick, delays[i]!) as unknown as number
        },
      )
    }
    this.retryTimer = setTimeout(tick, delays[0]!) as unknown as number
  }
}

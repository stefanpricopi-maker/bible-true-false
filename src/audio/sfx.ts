/** Fire-and-forget SFX; does not interrupt voiceover channel. */
export class SfxPlayer {
  private volume = 0.65
  private loopEl: HTMLAudioElement | null = null

  play(url: string): void {
    const el = new Audio(url)
    el.volume = this.volume
    void el.play().catch(() => {
      /* ignore autoplay / missing file */
    })
  }

  /** Loop until `stopLoop()` — used for wait-for-answer bed. */
  playLoop(url: string): void {
    this.stopLoop()
    const el = new Audio(url)
    el.loop = true
    el.volume = this.volume * 0.85
    this.loopEl = el
    void el.play().catch(() => {
      /* ignore */
    })
  }

  stopLoop(): void {
    if (!this.loopEl) return
    this.loopEl.pause()
    this.loopEl.removeAttribute('src')
    this.loopEl.load()
    this.loopEl = null
  }

  pauseLoop(): void {
    this.loopEl?.pause()
  }

  resumeLoop(): void {
    if (!this.loopEl) return
    void this.loopEl.play().catch(() => {
      /* ignore */
    })
  }

  setVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v))
    if (this.loopEl) this.loopEl.volume = this.volume * 0.85
  }
}

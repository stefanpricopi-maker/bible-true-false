/**
 * Play funnel, no ad pixels.
 *
 * - `zaraz.track` when Zaraz is on the zone (mishak.ro).
 * - History `pushState` to `/e/<name>` so Cloudflare Web Analytics SPA
 *   mode shows the same names under Top pages (Web Analytics has no custom events yet).
 */
export type PlayEvent =
  | 'page_open'
  | 'setup_complete'
  | 'round_end'
  | 'game_end'
  | 'donate_click'

type Zaraz = {
  track: (
    eventName: string,
    eventProperties?: Record<string, string | number | boolean>,
  ) => void
}

const sent = new Set<string>()

export function resetPlayAnalytics(): void {
  for (const key of [...sent]) {
    if (key !== 'page_open') sent.delete(key)
  }
}

export function track(
  name: PlayEvent,
  opts?: { once?: string; round?: number },
): void {
  const onceKey = opts?.once ?? name
  if (sent.has(onceKey)) return
  sent.add(onceKey)

  const props: Record<string, string | number | boolean> = {}
  if (opts?.round != null) props.round = opts.round

  const zaraz = (window as Window & { zaraz?: Zaraz }).zaraz
  zaraz?.track(name, props)

  if (name === 'page_open') return

  const url = new URL(location.href)
  url.pathname = opts?.round != null ? `/e/${name}/${opts.round}` : `/e/${name}`
  history.pushState(history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

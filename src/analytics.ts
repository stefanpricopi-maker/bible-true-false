/**
 * Play funnel, no ad pixels. All Cloudflare.
 *
 * 1. Zaraz (`zaraz.track`) — one dashboard (Monitoring → Events) after
 *    mishak.ro is on Cloudflare. No extra history URLs.
 * 2. Fallback — Cloudflare Web Analytics SPA Top pages via `/e/<name>`
 *    while the site is still only on *.pages.dev (Zaraz needs a custom domain).
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

function getZaraz(): Zaraz | undefined {
  return (window as Window & { zaraz?: Zaraz }).zaraz
}

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

  const zaraz = getZaraz()
  if (zaraz?.track) {
    zaraz.track(name, props)
    return
  }

  if (name === 'page_open') return

  const url = new URL(location.href)
  url.pathname = opts?.round != null ? `/e/${name}/${opts.round}` : `/e/${name}`
  history.pushState(history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

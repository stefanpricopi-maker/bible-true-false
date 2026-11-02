/** Local ports when hub runs on localhost; production keeps pages.dev hrefs in HTML. */
const LOCAL: Record<string, string> = {
  tf: 'http://localhost:5173/',
  clasic: 'http://localhost:5176/',
  memorare: 'http://localhost:5175/',
}

function isLocalHost(): boolean {
  const h = window.location.hostname
  return h === 'localhost' || h === '127.0.0.1'
}

function wireLocalLinks(): void {
  if (!isLocalHost()) return
  const map: Array<[string, string]> = [
    ['.game--tf', LOCAL.tf],
    ['.game--clasic', LOCAL.clasic],
    ['.game--memorare', LOCAL.memorare],
  ]
  for (const [sel, href] of map) {
    const el = document.querySelector<HTMLAnchorElement>(sel)
    if (el) el.href = href
  }
}

wireLocalLinks()

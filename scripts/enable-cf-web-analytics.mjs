/**
 * Enable Cloudflare Web Analytics on the Pages project (privacy-first, no cookies, no Google).
 *
 * Needs CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN in .env.local.
 * Creating a RUM site requires Account Settings Write. If the deploy token
 * cannot do that, the script prints the one-click dashboard path.
 *
 * After the project has web_analytics_tag + token, the next
 * `npm run deploy:cf` lets Pages inject the beacon into valid HTML.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const PROJECT = 'bible-true-false'
const HOST = 'bible-true-false.pages.dev'

loadEnvFiles([join(root, '.env.local'), join(root, '.env')])

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
const apiToken = process.env.CLOUDFLARE_API_TOKEN
if (!accountId || !apiToken) {
  console.error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in .env.local')
  process.exit(1)
}

const api = `https://api.cloudflare.com/client/v4/accounts/${accountId}`
const dashProject = `https://dash.cloudflare.com/${accountId}/pages/view/${PROJECT}`
const dashAnalytics = `https://dash.cloudflare.com/${accountId}/web-analytics`

const project = await cf('GET', `/pages/projects/${PROJECT}`)
const build = project.build_config ?? {}
if (build.web_analytics_tag && build.web_analytics_token) {
  console.log('Web Analytics is already enabled on the Pages project.')
  console.log(`View: ${dashAnalytics}`)
  console.log('If the live HTML has no beacon yet, run: npm run deploy:cf')
  process.exit(0)
}

let site
try {
  site = await cf('POST', '/rum/site_info', {
    auto_install: false,
    host: HOST,
  })
} catch (err) {
  if (isForbidden(err)) {
    printDashboardHelp()
    process.exit(1)
  }
  throw err
}

const tag = site.site_tag
const token = site.site_token
if (!tag || !token) {
  console.error('Cloudflare created a site but did not return tag/token')
  process.exit(1)
}

await cf('PATCH', `/pages/projects/${PROJECT}`, {
  build_config: {
    web_analytics_tag: tag,
    web_analytics_token: token,
  },
})

console.log('Web Analytics enabled for', HOST)
console.log(`Dashboard: ${dashAnalytics}`)
console.log('Next: npm run deploy:cf  (Pages injects the beacon on deploy)')

function printDashboardHelp() {
  console.error(`The API token can deploy Pages but cannot create a Web Analytics site.

Do this once (about 20 seconds), then re-run: npm run analytics:enable

1. Open: ${dashProject}
2. Tab Metrics → Enable under Web Analytics
   (privacy-first, no cookie, no Google)
3. Confirm here: ${dashAnalytics}
   You should see page views, visits, country, device, referrer.

Then: npm run deploy:cf
`)
}

function isForbidden(err) {
  const msg = String(err?.message ?? err)
  return msg.includes('403') || msg.includes('10000') || /Authentication error/i.test(msg)
}

async function cf(method, path, body) {
  const res = await fetch(`${api}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: body == null ? undefined : JSON.stringify(body),
  })
  const data = await res.json()
  if (!data.success) {
    const err = data.errors?.[0]
    throw new Error(
      `Cloudflare ${method} ${path}: HTTP ${res.status} ${err?.message ?? JSON.stringify(data.errors)}`,
    )
  }
  return data.result
}

function loadEnvFiles(paths) {
  for (const p of paths) {
    if (!existsSync(p)) continue
    const lines = readFileSync(p, 'utf8').split(/\r?\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (process.env[key] === undefined) process.env[key] = val
    }
  }
}

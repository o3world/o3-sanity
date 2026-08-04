/**
 * Generate the app's redirect table from the committed WordPress map (#24).
 *
 *   pnpm --filter @o3/migration redirects
 *
 * Reads `data/extract/site/redirects.json` (both plugins, raw) and the
 * committed corpus, resolves every chain to its terminal under ADR 0013, and
 * writes `apps/web/src/lib/redirects.generated.ts`.
 *
 * **The generated file is committed, and the app imports it — not this
 * package.** `tools/migration` is deleted when the migration ships
 * (ADR 0002/0003), so anything the running site depends on has to live in the
 * app. Regenerating is a build-out act with a reviewable diff, not something
 * `next build` does behind a network call.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { slugsByType } from './lib/corpus'
import { readManifest } from './lib/manifest'
import type { WpRedirectExport } from './lib/redirects'
import { EXTRACT_DIR, REPO_ROOT } from './lib/paths'
import { buildRedirectMap, sitePaths, type RedirectMap } from './map/redirects'

const OUTPUT = join(REPO_ROOT, 'apps/web/src/lib/redirects.generated.ts')

/**
 * A single-quoted TS string literal — the repo's Prettier style, so the
 * generated file is already formatted and `prettier --check` does not rewrite
 * it into something the test's parser no longer recognizes. No path or URL in
 * the map contains a quote; one that did would be a source-data problem worth
 * stopping for.
 */
function quote(value: string): string {
  if (/['"\\]/.test(value)) throw new Error(`redirect value contains a quote: ${value}`)
  return `'${value}'`
}

function render(map: RedirectMap, source: string): string {
  const rows = map.redirects
    .map(({ source: from, destination, via }) => {
      const chain = via && via.length > 1 ? `\n    // via ${via.join(' → ')}` : ''
      return `  {${chain}\n    source: ${quote(from)},\n    destination: ${quote(destination)},\n  },`
    })
    .join('\n')

  return `/**
 * GENERATED — do not edit. \`pnpm --filter @o3/migration redirects\` rewrites it.
 *
 * Every URL the WordPress site redirects today, resolved to where it ends up
 * (#24). Source: ${source} — the Redirection plugin's table plus Yoast
 * Premium's own redirect store, merged and collapsed so nothing chains.
 *
 * Two consumers, and they have to agree: \`next.config.ts\` serves these as
 * permanent redirects, and \`app/sitemap.ts\` refuses to advertise any path
 * that appears here. A URL that 301s and is also in the sitemap is a
 * contradiction search engines are entitled to punish.
 */

export interface GeneratedRedirect {
  readonly source: string
  readonly destination: string
}

export const GENERATED_REDIRECTS: readonly GeneratedRedirect[] = [
${rows}
]

/** Fast membership test for the sitemap. */
export const REDIRECTED_PATHS: ReadonlySet<string> = new Set(
  GENERATED_REDIRECTS.map((r) => r.source),
)
`
}

const wpFile = join(EXTRACT_DIR, 'site', 'redirects.json')
if (!existsSync(wpFile)) {
  console.error(
    `no redirect export at ${wpFile} — run: pnpm --filter @o3/migration extract -- --redirects`,
  )
  process.exit(1)
}

const wp = JSON.parse(readFileSync(wpFile, 'utf8')) as WpRedirectExport
const slugs = slugsByType()
const map = buildRedirectMap({
  wp,
  sitePaths: sitePaths({
    pageSlugs: slugs.page ?? [],
    insightSlugs: slugs.insight ?? [],
    caseStudySlugs: slugs.caseStudy ?? [],
  }),
})

// The source, without the extract timestamp: this file is generated and
// committed, so a run date in its header would rewrite it on every extract
// even when not one redirect had changed. `data/extract/_manifest.json` is
// where "when was this pulled" lives.
writeFileSync(OUTPUT, render(map, readManifest().source))

console.log(`wrote ${map.redirects.length} redirects → ${OUTPUT}`)
console.log(`  ${map.external.length} leave the site (o3xo.ai and friends)`)
console.log(`\ndropped ${map.dropped.length}:`)
const byReason = new Map<string, string[]>()
for (const row of map.dropped) {
  byReason.set(row.reason, [...(byReason.get(row.reason) ?? []), row.source])
}
for (const [reason, sources] of [...byReason].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${String(sources.length).padStart(3)}  ${reason}`)
  for (const s of sources.slice(0, 4)) console.log(`         ${s}`)
  if (sources.length > 4) console.log(`         …and ${sources.length - 4} more`)
}

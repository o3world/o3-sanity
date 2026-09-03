/**
 * Partner brand imagery, fetched from each vendor's own site.
 *
 * The platform panels and partner pages draw Sanity's, Vercel's and Lovable's
 * marks. Those files are not ours to author, and until now they arrived the way
 * borrowed files usually do — downloaded by hand, dropped in `seed/assets/`, no
 * record of which page they came off or what the vendor permits.
 *
 * This is that record, made executable. `sources.ts` declares where each file
 * comes from and on what basis we use it; this script re-fetches every entry and
 * reports what the vendor has changed since the last run.
 *
 * **The bytes stay committed.** The loader could fetch a vendor URL at load time
 * the way `_wpSrc` does, but vendors rewrite their marketing CDNs on their own
 * schedule, and `data/missing-media.json` already records what that costs when
 * the URL rots: a load that fails on a network condition instead of a diff. So
 * the download is a separate, deliberate step whose output is reviewed in git,
 * and `load` stays offline and reproducible — which is the promise ADR 0003
 * makes about rebuilding a dataset from this repo.
 *
 *     pnpm --filter @o3/migration brand-assets          # re-fetch, report drift
 *     pnpm --filter @o3/migration brand-assets --write  # accept what changed
 *
 * Without `--write` a changed file is reported and left alone, so a vendor
 * swapping their logo cannot quietly restyle the site through a routine run.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { BRAND_ASSETS } from './brand-assets-sources'
import { MAX_INK_LUMA, darkestInk, normalizeLogoSvg } from './lib/logoCanvas'
import { REPO_ROOT } from './lib/paths'

const write = process.argv.includes('--write')

const sha = (buf: Buffer) => createHash('sha256').update(buf).digest('hex').slice(0, 16)

/**
 * A vendor serving its own 404 or consent page as `text/html` is the failure
 * this catches: the bytes arrive, the write succeeds, and the site renders a
 * broken image nobody looks at again.
 */
function assertImage(buf: Buffer, contentType: string | null, url: string) {
  const head = buf.subarray(0, 512).toString('utf8').trimStart().toLowerCase()
  if (head.startsWith('<!doctype html') || head.startsWith('<html')) {
    throw new Error(`${url} served an HTML page, not an image`)
  }
  if (contentType && !/^(image\/|application\/(zip|octet-stream))/.test(contentType)) {
    throw new Error(`${url} served ${contentType}`)
  }
}

/**
 * A strip mark, centred on the partner canvas. Vector only, and loudly: the
 * fit exists to give the row one optical size, and a vendor swapping an SVG
 * for a PNG would quietly reintroduce the mismatch it removes.
 */
function fitToStrip(buf: Buffer, url: string): string {
  const svg = buf.toString('utf8')
  if (!/<svg\b/i.test(svg)) throw new Error(`${url} is not an SVG; the partner strip fit needs one`)
  const ink = darkestInk(svg)
  if (ink !== null && ink > MAX_INK_LUMA) {
    throw new Error(
      `${url} draws its darkest ink at luma ${ink.toFixed(2)} — too light for the bone surface.` +
        ' This is usually a dimmed variant of the mark; find the full-strength file.',
    )
  }
  return normalizeLogoSvg(svg)
}

async function main() {
  let changed = 0
  let added = 0

  for (const asset of BRAND_ASSETS) {
    const target = join(REPO_ROOT, asset.file)
    const res = await fetch(asset.url, {
      // Some vendor CDNs 403 a bare fetch. We are a browser asking for a file
      // the vendor publishes for exactly this purpose.
      headers: { 'user-agent': 'Mozilla/5.0 (o3-sanity brand-assets)', accept: 'image/*,*/*' },
    })
    if (!res.ok) throw new Error(`fetch ${asset.url}: ${res.status} ${res.statusText}`)
    let buf = Buffer.from(await res.arrayBuffer())
    assertImage(buf, res.headers.get('content-type'), asset.url)
    if (asset.fit === 'partner-strip') buf = Buffer.from(fitToStrip(buf, asset.url), 'utf8')

    const before = existsSync(target) ? readFileSync(target) : null
    if (before && sha(before) === sha(buf)) {
      console.log(`  = ${asset.file}`)
      continue
    }

    if (!before) added++
    else changed++

    if (write || !before) {
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, buf)
      console.log(`  ${before ? '~' : '+'} ${asset.file}  (${buf.length} bytes)`)
    } else {
      console.log(
        `  ! ${asset.file} — ${asset.vendor} changed this file` +
          ` (${sha(before)} → ${sha(buf)}); re-run with --write to accept`,
      )
    }
  }

  console.log(`\n${BRAND_ASSETS.length} declared, ${added} added, ${changed} changed upstream`)
  if (changed > 0 && !write) {
    console.log('nothing was overwritten — review the change, then re-run with --write')
    process.exitCode = 1
  }
}

await main()

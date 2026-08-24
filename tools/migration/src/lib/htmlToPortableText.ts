import { htmlToBlocks } from '@portabletext/block-tools'
import { Schema } from '@sanity/schema'
import { JSDOM } from 'jsdom'

import { schemaTypes } from '@o3/sanity/schemas'

const compiled = Schema.compile({ name: 'o3', types: schemaTypes })
const bodyTextType = compiled.get('bodyText')

/**
 * `photo-768x432.jpg` → `photo.jpg` — never migrate a thumbnail as an asset.
 *
 * Also upgrades `http:` to `https:`. WordPress hands out both schemes for the
 * same binary depending on which API produced the URL (`wp_get_attachment_url`
 * says http, Yoast says https), and `_wpSrc` is the identity `data/assets.json`
 * deduplicates uploads by — so leaving the scheme alone uploads the same file
 * twice and gives two documents two different assets for one image.
 */
export function normalizeUploadUrl(url: string): string {
  return url.replace(/^http:\/\//, 'https://').replace(/-\d+x\d+(?=\.\w+$)/, '')
}

export type ConversionIssue = { element: string; detail: string }

/**
 * A WordPress shortcode: a bare tag (`[gallery]`) or one with attributes
 * (`[contact_form id="4"]`).
 *
 * Deliberately NOT `\[[a-z_]+ [^\]]*\]` — that also matched editorial prose in
 * square brackets ("…named one of the best entrepreneurial companies [in the
 * E360 Index]"), which failed a post for a shortcode that was never there.
 */
const SHORTCODE = /\[[a-z][a-z0-9_]*(?:\s+[a-z_]+=[^\]]*|\s*)\]/

/**
 * Shortcodes that are dead on the live site and are stripped rather than
 * reported. `single_image` is the only one: it is **not registered** in
 * WordPress (visitors see the literal `[single_image title="…"]` text today)
 * and none of the image titles it references still exist in the media
 * library. Removing it is a fix, not a loss — but it is recorded as a note so
 * the removal is visible in the run report rather than silent.
 */
const DEAD_SHORTCODES = ['single_image']

function stripDeadShortcodes(html: string, notes: ConversionIssue[]): string {
  let out = html
  for (const tag of DEAD_SHORTCODES) {
    const pattern = new RegExp(`\\[${tag}(?:\\s+[^\\]]*)?\\]`, 'g')
    for (const match of html.match(pattern) ?? []) {
      notes.push({ element: 'shortcode', detail: `stripped dead shortcode ${match}` })
    }
    out = out.replace(pattern, '')
  }
  return out
}

/**
 * Embedded lead-capture forms — HubSpot and Gravity Forms — do not migrate.
 * There is no form block in the schema and adding one is a schema
 * conversation, not something a content pass decides on the way past
 * (#25 agreement 1).
 *
 * They are stripped and **reported as notes**, naming the post and the
 * provider, so an editor can re-add a CTA. That is the recorded drop decision
 * rather than a silent loss — and it was already a silent loss: block-tools
 * discards `<script>` and `<form>` without a word, so two of the three posts
 * had been converting "cleanly" while dropping their form.
 *
 * Stripping scripts first also un-breaks the shortcode scan: minified JS
 * (`gform.hooks[o][r]`) reads as a shortcode to any bracket-matching regex.
 */
function stripEmbeddedForms(html: string, notes: ConversionIssue[]): string {
  const provider = /hsforms|hbspt/i.test(html)
    ? 'HubSpot'
    : /gform|gravity/i.test(html)
      ? 'Gravity Forms'
      : null

  const before = html
  const out = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<form\b[\s\S]*?<\/form>/gi, '')
    .replace(/<div[^>]*\bclass=["'][^"']*gform_wrapper[^"']*["'][\s\S]*?<\/div>/gi, '')

  if (out !== before) {
    notes.push({
      element: 'embedded form',
      detail: `${provider ?? 'an inline script/form'} embed dropped — no form block in the schema; re-add a CTA`,
    })
  }
  return out
}

/**
 * A per-document `_key` sequence: `k0000`, `k0001`, …
 *
 * block-tools defaults to random keys, which made convert non-reproducible —
 * every run rewrote every block `_key` in the committed JSON, so "wipe and
 * rebuild reproduces the dataset" (ADR 0003) could not actually hold and no
 * golden-file test of a mapper was possible. Keys only have to be unique
 * within their document, so a counter is sufficient and stable.
 *
 * Create ONE generator per document and share it across that document's
 * `convertHtml` calls, so two modules in the same body cannot collide.
 */
export function createKeyGenerator(): () => string {
  let n = 0
  return () => `k${(n++).toString().padStart(4, '0')}`
}

/**
 * Deterministic HTML → bodyText Portable Text (ADR 0002). Images become
 * `figure` blocks carrying a URL marker the loader resolves to an asset ref at
 * upload time; iframes become `embed`. Unknown embeds/shortcodes are reported
 * as issues so nothing is silently dropped.
 *
 * `source` carries the two things that differ per extract source: the image
 * marker (`map/types.ts`) and how a URL on that host is reduced to the identity
 * of its full-size original. Everything else is shared, because the body of an
 * article is HTML wherever it was authored and a second copy of this
 * deserializer is how the two sources would drift.
 */
export interface HtmlImageSource {
  readonly marker: '_wpSrc' | '_srcUrl'
  readonly normalizeUrl: (url: string) => string
}

const WORDPRESS_IMAGES: HtmlImageSource = {
  marker: '_wpSrc',
  normalizeUrl: normalizeUploadUrl,
}

export function convertHtml(
  html: string,
  issues: ConversionIssue[],
  keyGenerator: () => string = createKeyGenerator(),
  notes: ConversionIssue[] = [],
  source: HtmlImageSource = WORDPRESS_IMAGES,
) {
  const cleaned = stripDeadShortcodes(stripEmbeddedForms(html, notes), notes)
  const shortcode = cleaned.match(SHORTCODE)
  if (shortcode) issues.push({ element: 'shortcode', detail: shortcode[0] })
  return htmlToBlocks(cleaned, bodyTextType, {
    keyGenerator,
    parseHtml: (h) => new JSDOM(h).window.document,
    rules: [
      {
        deserialize(el, _next, block) {
          const node = el as unknown as HTMLElement
          if (node.tagName === 'IMG') {
            const src = node.getAttribute('src')
            if (!src) return undefined
            return block({
              _type: 'figure',
              image: { _type: 'image', [source.marker]: source.normalizeUrl(src) },
              alt: node.getAttribute('alt') ?? '',
            })
          }
          if (node.tagName === 'IFRAME') {
            const src = node.getAttribute('src')
            if (!src) return undefined
            return block({ _type: 'embed', url: src })
          }
          // A self-hosted `<video>` from WordPress's [video] shortcode. The
          // file is an ordinary upload, so it migrates as an asset like any
          // image and the embed block renders it.
          if (node.tagName === 'VIDEO') {
            const src =
              node.getAttribute('src') ?? node.querySelector('source')?.getAttribute('src') ?? null
            if (src) return block({ _type: 'embed', url: src })
            issues.push({ element: 'VIDEO', detail: node.outerHTML.slice(0, 200) })
            return undefined
          }
          if (node.tagName === 'OBJECT' || node.tagName === 'SCRIPT') {
            issues.push({ element: node.tagName, detail: node.outerHTML.slice(0, 200) })
          }
          return undefined
        },
      },
    ],
  })
}

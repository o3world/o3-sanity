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
 * `figure` blocks carrying a `_wpSrc` marker the loader resolves to an asset
 * ref at upload time; iframes become `embed`. Unknown embeds/shortcodes are
 * reported as issues so nothing is silently dropped.
 */
export function convertHtml(
  html: string,
  issues: ConversionIssue[],
  keyGenerator: () => string = createKeyGenerator(),
) {
  if (/\[[a-z_]+ [^\]]*\]/.test(html)) {
    issues.push({ element: 'shortcode', detail: html.match(/\[[a-z_]+ [^\]]*\]/)![0] })
  }
  return htmlToBlocks(html, bodyTextType, {
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
              image: { _type: 'image', _wpSrc: normalizeUploadUrl(src) },
              alt: node.getAttribute('alt') ?? '',
            })
          }
          if (node.tagName === 'IFRAME') {
            const src = node.getAttribute('src')
            if (!src) return undefined
            return block({ _type: 'embed', url: src })
          }
          if (node.tagName === 'VIDEO' || node.tagName === 'OBJECT' || node.tagName === 'SCRIPT') {
            issues.push({ element: node.tagName, detail: node.outerHTML.slice(0, 200) })
          }
          return undefined
        },
      },
    ],
  })
}

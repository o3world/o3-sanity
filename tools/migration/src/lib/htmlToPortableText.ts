import { htmlToBlocks } from '@portabletext/block-tools'
import { Schema } from '@sanity/schema'
import { JSDOM } from 'jsdom'

import { schemaTypes } from '@o3/sanity/schemas'

const compiled = Schema.compile({ name: 'o3', types: schemaTypes })
const bodyTextType = compiled.get('bodyText')

/** `photo-768x432.jpg` → `photo.jpg` — never migrate a thumbnail as an asset. */
export function normalizeUploadUrl(url: string): string {
  return url.replace(/-\d+x\d+(?=\.\w+$)/, '')
}

export type ConversionIssue = { element: string; detail: string }

/**
 * Deterministic HTML → bodyText Portable Text (ADR 0002). Images become
 * `figure` blocks carrying a `_wpSrc` marker the loader resolves to an asset
 * ref at upload time; iframes become `embed`. Unknown embeds/shortcodes are
 * reported as issues so nothing is silently dropped.
 */
export function convertHtml(html: string, issues: ConversionIssue[]) {
  if (/\[[a-z_]+ [^\]]*\]/.test(html)) {
    issues.push({ element: 'shortcode', detail: html.match(/\[[a-z_]+ [^\]]*\]/)![0] })
  }
  return htmlToBlocks(html, bodyTextType, {
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

// Reads the approved site copy out of the seed JSON, for the calibration in
// `slop-lint.test.ts`: the linter's false-positive rate is pinned against the
// copy the seeds carry now, not a snapshot of it.
//
// Two lists, because slop.md splits one rule by surface and the linter follows
// it: headlines, CTAs, labels and eyebrows take no em dash at all, body prose
// takes one or two.
//
// Engineering prose in the seeds is not site copy and is excluded —
// `provisionalNote` is a note to the next agent about migration state, written
// to a different register entirely.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/** Fields a reader meets as short copy — a line, not a paragraph. */
const SHORT_FIELDS = [
  'heading',
  'headlineLines',
  'eyebrow',
  'label',
  'title',
  'shortTitle',
  'railLabel',
  'attribution',
  'consentLabel',
  'caption',
  'items',
  'reasons',
]

/**
 * Fields a reader meets as prose. `text` is a portable-text span.
 *
 * `subheading` is here rather than above on purpose. It sits next to a
 * headline in the layout, but what goes in it is a sentence in the body
 * register — and the one rule the surfaces divide, the em dash, is written for
 * headlines, CTAs and stats. Scoring a sentence as a headline is what would
 * make the fixture disagree with the guidance rather than measure it.
 */
const BODY_FIELDS = [
  'body',
  'text',
  'subheading',
  'intro',
  'note',
  'excerpt',
  'description',
  'quote',
  'alt',
]

export function collect(seedDir) {
  const short = []
  const body = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir).sort()) {
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) walk(path)
      else if (path.endsWith('.json')) visit(JSON.parse(readFileSync(path, 'utf8')), '')
    }
  }
  const visit = (node, key) => {
    if (typeof node === 'string') {
      if (SHORT_FIELDS.includes(key)) short.push(node)
      else if (BODY_FIELDS.includes(key)) body.push(node)
      return
    }
    if (Array.isArray(node)) {
      for (const item of node) visit(item, key)
      return
    }
    if (node && typeof node === 'object')
      for (const [name, value] of Object.entries(node)) visit(value, name)
  }
  walk(seedDir)
  return { short, body }
}

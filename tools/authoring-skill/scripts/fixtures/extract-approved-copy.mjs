#!/usr/bin/env node
// Rebuilds the calibration fixtures from the approved seed copy.
//
//   node extract-approved-copy.mjs [seed-dir]     default: tools/migration/data/seed
//
// The fixtures are what `slop-lint.test.ts` pins the linter's false-positive
// rate against, so they have to be regenerable rather than a snapshot nobody
// can reproduce. Run this after changing seed copy, then run the tests: a rule
// that starts firing has either found a real tell in new copy or is a rule the
// table should not carry.
//
// Two files, because slop.md splits one rule by surface and the linter follows
// it: headlines, CTAs, labels and eyebrows take no em dash at all, body prose
// takes one or two. Every string keeps its own line so a hit's line number
// names the field it came from.
//
// Engineering prose in the seeds is not site copy and is excluded —
// `provisionalNote` is a note to the next agent about migration state, written
// to a different register entirely.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { argv } from 'node:process'
import { fileURLToPath } from 'node:url'

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

if (argv[1] && fileURLToPath(import.meta.url) === argv[1]) {
  const here = dirname(fileURLToPath(import.meta.url))
  const seedDir = argv[2] ?? join(here, '../../../migration/data/seed')
  const { short, body } = collect(seedDir)
  // Nothing but copy goes in the files. A generated header would be text the
  // linter reads, and the first one written here put an em dash on line 1 of
  // the short-copy fixture and scored it — the tool measuring the harness.
  // Provenance is in README.md instead.
  writeFileSync(join(here, 'approved-short.md'), `${short.join('\n')}\n`)
  // Body strings are blank-line separated so the block-shaped rules — the
  // recap ending — see one field as one paragraph rather than reading across
  // two.
  writeFileSync(join(here, 'approved-body.md'), `${body.join('\n\n')}\n`)
  console.log(`wrote ${short.length} short strings and ${body.length} body strings`)
}

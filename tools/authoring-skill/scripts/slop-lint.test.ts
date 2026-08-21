import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { collect } from './fixtures/extract-approved-copy.mjs'
import { RULES, compare, lint, wordCount } from './slop-lint.mjs'

const fixtures = resolve(import.meta.dirname, 'fixtures')
const read = (name: string) => readFileSync(join(fixtures, name), 'utf8')
const seedDir = resolve(import.meta.dirname, '../../migration/data/seed')

/** Every hit of one rule, as the excerpts that produced them. */
const firedAs = (text: string, rule: string, surface: 'body' | 'short' = 'body') =>
  lint(text, { surface })
    .hits.filter((hit) => hit.rule === rule)
    .map((hit) => hit.excerpt)

const fired = (text: string, rule: string, surface: 'body' | 'short' = 'body') =>
  firedAs(text, rule, surface).length

describe('calibration against approved copy', () => {
  // The acceptance test for the whole tool (#143). A linter that marks copy
  // the house has already published is worse than no linter: the reviser
  // learns to scroll past it, and the one real finding goes with the rest.
  //
  // Both fixtures are generated from tools/migration/data/seed/ by
  // fixtures/extract-approved-copy.mjs. A failure here is a question about
  // which of the two is wrong — the rule or the copy — and it is answered on a
  // ticket, never by editing the fixture.
  it('scores zero tells over approved body prose', () => {
    const score = lint(read('approved-body.md'))
    expect(score.tells).toEqual([])
    expect(score.perHundred).toBe(0)
    expect(score.words).toBeGreaterThan(5000)
  })

  it('scores zero tells over approved short copy', () => {
    const score = lint(read('approved-short.md'), { surface: 'short' })
    expect(score.tells).toEqual([])
    expect(score.perHundred).toBe(0)
    expect(score.words).toBeGreaterThan(1000)
  })

  // The candidates are recorded rather than tuned away, because both are real
  // matches: one of a phrase slop.md lists conditionally, one of a rule
  // slop.md states categorically and a heading in page/live.json breaks.
  // fixtures/README.md says what to do when this list changes.
  it('records the two candidates the approved copy carries', () => {
    const short = lint(read('approved-short.md'), { surface: 'short' })
    expect(short.filler.map((hit) => [hit.rule, hit.excerpt])).toEqual([
      ['empty-phrase', 'in the age of'],
      ['em-dash-short-copy', '—'],
    ])
    expect(lint(read('approved-body.md')).filler).toEqual([])
  })

  // A calibration nobody can reproduce is a claim, not a measurement. The
  // fixtures are generated, so the test that matters is whether they still
  // match the seeds they were generated from — otherwise the zero above is
  // about copy the site stopped publishing months ago.
  //
  // A failure here is fixed by running the extractor, not by editing the
  // fixture. If a rule then starts firing, that is the finding.
  it('holds the copy the seeds currently carry', () => {
    const { short, body } = collect(seedDir)
    expect(read('approved-short.md')).toBe(`${short.join('\n')}\n`)
    expect(read('approved-body.md')).toBe(`${body.join('\n\n')}\n`)
  })
})

describe('the rule table', () => {
  it('pins every rule to a named section of slop.md', () => {
    for (const rule of RULES) {
      expect(rule.source, rule.id).toMatch(/^(Structural tells|Filler words) → .+/)
      expect(['tell', 'candidate'], rule.id).toContain(rule.kind)
      expect(['any', 'body', 'short'], rule.id).toContain(rule.surface)
    }
  })

  it('gives every rule a distinct id', () => {
    const ids = RULES.map((rule) => rule.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('structural tells', () => {
  it('catches the fixed throat-clearing and faux-insight openers', () => {
    expect(fired("Here's the thing. The model is the constraint.", 'throat-clearing')).toBe(1)
    expect(fired('The part everyone misses is the schema.', 'faux-insight')).toBe(1)
    expect(fired('What if I told you the schema was the problem?', 'rhetorical-setup')).toBe(1)
  })

  it('catches evidence-shaped language with no source in it', () => {
    expect(fired('Studies show that teams migrate twice.', 'weasel-attribution')).toBe(1)
    // The same claim with its source named in its own sentence is the fix the
    // style floor asks for, and it is not a hit.
    expect(fired('Our own two migrations took eleven weeks.', 'weasel-attribution')).toBe(0)
  })

  it('catches puffery and the verbs written in place of one', () => {
    expect(fired('The launch marks a pivotal moment.', 'importance-puffery')).toBe(1)
    expect(fired('The portal serves as a hub.', 'fake-strong-verb')).toBe(1)
    expect(fired('We made a decision to ship.', 'weak-verb-phrase')).toBe(1)
  })

  it('catches the trailing -ing clause but not the participle elsewhere', () => {
    expect(
      fired('We shipped in six weeks, underscoring our commitment.', 'superficial-analysis'),
    ).toBe(1)
    expect(fired('The report is underscoring the totals in red.', 'superficial-analysis')).toBe(0)
  })

  it('catches the stacked forms and not a single instance', () => {
    expect(fired('Not a redesign. Not a refresh. A rebuild.', 'negative-listing')).toBe(1)
    expect(fired('Not a redesign. The team rebuilt it.', 'negative-listing')).toBe(0)
    expect(fired('And it mattered. And it still does.', 'dramatic-fragmentation')).toBe(1)
    expect(fired('The seeds were stale. And it mattered.', 'dramatic-fragmentation')).toBe(0)
  })

  it('reads the recap only where a recap can be', () => {
    const opening = 'Ultimately, the schema decides.\n\nThe mappers came second.'
    const closing = 'The mappers came second.\n\nUltimately, the schema decides.'
    expect(fired(opening, 'summary-recap')).toBe(0)
    expect(fired(closing, 'summary-recap')).toBe(1)
  })

  it('reads bold as a tell only inside a sentence', () => {
    expect(fired('**Schema.** The mappers came second.', 'decorative-bold')).toBe(0)
    expect(fired('- **Schema** — the mappers came second.', 'decorative-bold')).toBe(0)
    // A wrapped paragraph is the case a line-based test gets wrong.
    expect(
      fired('The mappers came second and the\n**real** work was the schema.', 'decorative-bold'),
    ).toBe(1)
  })

  it('reads an emoji in a heading and not in prose', () => {
    expect(fired('## Shipping 🚀\n\nThe schema decides.', 'emoji-heading')).toBe(1)
    expect(fired('The schema decides 🚀 or so the sticker says.', 'emoji-heading')).toBe(0)
  })
})

describe('binary contrast', () => {
  it('catches the templates slop.md writes out', () => {
    expect(fired("It is not a tooling problem, it's a modelling one.", 'binary-contrast')).toBe(1)
    expect(fired("The question isn't the platform.", 'binary-contrast-question')).toBe(1)
    expect(fired('Not just a redesign, but a rebuild.', 'binary-contrast-not-just')).toBe(1)
  })

  it("leaves O3's tension → turn alone", () => {
    // Both halves assert. Deleting the first loses the reader's situation,
    // which is the test slop.md sets and no regex can run.
    const turn = "You see the problem in front of you. We're working on the one behind it."
    expect(lint(turn).tells).toEqual([])
  })

  it('leaves a negation with a concrete subject to the human', () => {
    // The rule takes a pronoun subject only. With a real noun in front of it
    // the negation is usually correcting an expectation the reader arrives
    // with — approved case-study copy does exactly this, twice.
    const corrected =
      'The Figma file is not an inspiration for the code; it is what the code is checked against.'
    expect(fired(corrected, 'binary-contrast')).toBe(0)
  })
})

describe('em dashes', () => {
  it('takes none in short copy and counts it as a candidate', () => {
    const score = lint('Built to go end to end — on purpose.', { surface: 'short' })
    expect(score.tells).toEqual([])
    expect(score.filler.map((hit) => hit.rule)).toEqual(['em-dash-short-copy'])
  })

  it('allows a parenthetical pair in body prose and breaks up the cluster', () => {
    expect(
      fired('A pod — strategy, design, engineering — takes the problem.', 'em-dash-cluster'),
    ).toBe(0)
    expect(
      fired('The work was elsewhere — the schema — the mappers — the seeds.', 'em-dash-cluster'),
    ).toBe(1)
  })
})

describe('filler is counted, never failed on', () => {
  it('keeps conditional phrases out of the tell count', () => {
    const score = lint("At the end of the day it's important to note that the schema decides.")
    expect(score.tells).toEqual([])
    expect(score.perHundred).toBe(0)
    expect(score.filler).toHaveLength(2)
    expect(score.fillerPerHundred).toBeGreaterThan(0)
  })
})

describe('scoring', () => {
  it('counts words and not markdown punctuation', () => {
    expect(wordCount('## The **schema** decides — mostly.')).toBe(4)
  })

  it('does not read fenced code as prose', () => {
    const withCode = ['The command is:', '', '```', "# Here's the thing", 'run --all', '```'].join(
      '\n',
    )
    expect(lint(withCode).hits).toEqual([])
  })

  it('is a density, so a longer draft is not automatically a worse one', () => {
    const once = 'Here is the thing. The schema decides.'
    const twice = `${once} ${'The mappers came second. '.repeat(20)}`
    expect(lint(once).perHundred).toBeGreaterThan(lint(twice).perHundred)
  })

  it('reports zero on an empty text rather than dividing by it', () => {
    expect(lint('')).toMatchObject({ words: 0, perHundred: 0, fillerPerHundred: 0 })
  })
})

describe('compare', () => {
  const draft = "Here's the thing. It is not a tooling problem, it's a modelling one."
  const revision = 'The content model decides more than the tooling does.'

  it('names which rule moved, and by how much', () => {
    const result = compare(draft, revision)
    expect(result.improved).toBe(true)
    expect(result.delta).toBeLessThan(0)
    expect(result.rules).toEqual([
      { rule: 'binary-contrast', draft: 1, revision: 0, delta: -1 },
      { rule: 'throat-clearing', draft: 1, revision: 0, delta: -1 },
    ])
  })

  it('reports a pass that added tells as not improved', () => {
    expect(compare(revision, draft).improved).toBe(false)
  })

  // The delta is the signal, so a revision that is merely still imperfect is
  // not a failure — only one that went backwards is.
  it('counts a revision that removed some of them as improved', () => {
    const partial = "It is not a tooling problem, it's a modelling one."
    expect(compare(draft, partial).improved).toBe(true)
  })
})

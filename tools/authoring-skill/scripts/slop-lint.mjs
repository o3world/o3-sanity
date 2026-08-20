#!/usr/bin/env node
// The mechanical half of the revision pass: count the machine tells that
// `docs/guidance/slop.md` names, so a reviser can see whether a pass removed
// them or moved them around.
//
//   node slop-lint.mjs <file> [--short]                 score one text
//   node slop-lint.mjs --delta <draft> <revision>       score the pair
//   node slop-lint.mjs --rules                          list the rule table
//
// **The signal is the delta, never the absolute.** A density is meaningless on
// its own — approved O3 copy and a generated draft can land on the same number
// for different reasons — so single-file mode reports and always exits 0.
// `--delta` is the mode with a verdict in it: a revision whose density rose
// exits 1, because a pass that adds tells is the failure this tool exists to
// catch.
//
// Rules come from `docs/guidance/slop.md` and nowhere else. The upstream
// no-slop register is calibrated for engineering prose and flags shapes the O3
// voice uses on purpose — the tension → turn, the flat delivery of a
// remarkable fact — so borrowing it would mark approved copy as slop. Every
// rule below is pinned to a named section of that document, and every rule
// scores zero over the approved seed copy in `fixtures/` (see the calibration
// note in that directory).
//
// A pattern slop.md names that no regex can decide is **out of the rule
// table**, not approximated in it. The tool is a floor under a human judgement
// and never a substitute for one: it cannot see whether both halves of a
// sentence carry information, whether a closing line holds a fact or a mood, or
// whether an adverb is doing work. Those stay with the `slop` gate in
// `skills/review/SKILL.md`.
import { readFileSync } from 'node:fs'
import { argv, exit } from 'node:process'
import { pathToFileURL } from 'node:url'

/**
 * Which surface a rule applies to. slop.md draws the line in one place only —
 * em dashes are banned outright in headlines, CTAs and stats, and allowed
 * sparingly in body prose — but the split also keeps paragraph-shaped rules off
 * single-line copy, where a colon is a label rather than a drumroll.
 */
const ANY = 'any'
const BODY = 'body'
const SHORT = 'short'

/** Words, for the density denominator. Markdown punctuation is not a word. */
export function wordCount(text) {
  return (text.match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g) ?? []).length
}

/** Fenced code is not prose; nothing in the rule table should read it. */
function stripCode(text) {
  return text.replace(/^```[\s\S]*?^```/gm, (block) => block.replace(/[^\n]/g, ' '))
}

/**
 * Two classes, and the reason the report carries two numbers rather than one.
 *
 * A **tell** is an absolute. slop.md's checks 1 to 8 read "zero binary
 * contrasts", "no summary-recap ending" — a hit is a defect, and the approved
 * seed copy in `fixtures/` scores zero of them. That zero is the calibration,
 * and it is what makes a tell worth acting on without reading around it.
 *
 * A **candidate** is counted and never failed on, for one of two reasons.
 * Either slop.md marks the rule conditional — the two filler lists are "the
 * softer cuts", cut where they add nothing and kept where they carry emphasis,
 * and no regex tells those apart. Or slop.md is categorical and the approved
 * copy disagrees with it, in which case one of the two is wrong and the
 * decision is a human's; demoting the rule keeps the count visible instead of
 * deleting the question. `em-dash-short-copy` is the second kind.
 */
const TELL = 'tell'
const CANDIDATE = 'candidate'

/** A rule that fires on a literal alternation, word-bounded and case-blind. */
function phrases(id, source, surface, alternatives, message, kind = TELL) {
  const pattern = new RegExp(`\\b(?:${alternatives.join('|')})\\b`, 'gi')
  return { id, source, surface, kind, message, find: (text) => matches(text, pattern) }
}

/** A rule that fires on a shape the alternation form cannot express. */
function shape(id, source, surface, pattern, message) {
  return { id, source, surface, kind: TELL, message, find: (text) => matches(text, pattern) }
}

function matches(text, pattern) {
  return [...text.matchAll(pattern)].map((match) => ({ index: match.index, text: match[0] }))
}

/**
 * Paragraphs, as blank-line-separated blocks with their offsets kept. Two rules
 * need the block rather than the sentence: the recap ending is only a tell in
 * the last one, and a colon is only a drumroll inside prose.
 */
function paragraphs(text) {
  const blocks = []
  let index = 0
  for (const block of text.split(/\n\s*\n/)) {
    if (block.trim())
      blocks.push({ index: index + (block.length - block.trimStart().length), block })
    index += block.length + 2
  }
  return blocks
}

/** Sentences, offsets kept, split on terminal punctuation followed by space. */
function sentences(text) {
  const found = []
  const pattern = /[^.!?\n]+(?:[.!?]+|$)/g
  for (const match of text.matchAll(pattern)) {
    if (match[0].trim()) found.push({ index: match.index, text: match[0] })
  }
  return found
}

/**
 * The rule table. `source` names the section of `docs/guidance/slop.md` the
 * rule is pinned to; changing a pattern without changing that section is how
 * the two drift.
 */
export const RULES = [
  // "Throat-clearing" — the run-up sentence that announces a claim is coming.
  // Understatement is the house register and is not this; the difference is
  // that these are fixed openers with no content of their own, which is what
  // makes the rule mechanical where the general shape is not.
  phrases(
    'throat-clearing',
    'Structural tells → Throat-clearing',
    ANY,
    [
      "here(?:'?s| is) the thing",
      "here(?:'?s| is) what I mean",
      'let me be clear',
      "I'?ll be honest",
      'to be honest',
      'the uncomfortable truth is',
      'let me explain',
      "here(?:'?s| is) the deal",
    ],
    'Cut the run-up and make the claim.',
  ),

  // "Faux-insight setup" — flatters the writer as the lone expert, against the
  // house stance. The setup is a fixed frame; the claim after it stands alone.
  phrases(
    'faux-insight',
    'Structural tells → Faux-insight setup',
    ANY,
    [
      'what most people get wrong',
      "here'?s what nobody tells you",
      'what nobody tells you',
      'the part everyone misses',
      'what everyone misses',
      'nobody talks about',
      "what they don'?t tell you",
    ],
    'Cut the setup and let the claim stand.',
  ),

  // "Rhetorical setup" — a frame around the point instead of the point.
  phrases(
    'rhetorical-setup',
    'Structural tells → Rhetorical setup',
    ANY,
    [
      'what if I told you',
      'think about it',
      'plot twist',
      'let that sink in',
      "here'?s a question",
    ],
    'Drop the frame and make the point.',
  ),

  // "Weasel attribution" — evidence-shaped language with no source in it.
  // slop.md's instruction is to name the source or cut the claim, and never to
  // invent one; a hit here is a question for the human, not an edit.
  phrases(
    'weasel-attribution',
    'Structural tells → Weasel attribution',
    ANY,
    [
      'experts agree',
      'experts say',
      'studies show',
      'research shows',
      'studies have shown',
      'industry reports suggest',
      'widely regarded as',
      'it is widely believed',
      'many believe',
      'some would argue',
    ],
    'Name the source or cut the claim — never invent one.',
  ),

  // "Importance puffery" — what gets written in place of the number. The four
  // forms slop.md names and their inflections, and nothing beyond them: an
  // earlier draft of this rule carried `revolutionizing`, which is a cliché the
  // voice skill's rule 7 owns rather than a slop.md pattern, and it marked a
  // live seed page on its first run.
  phrases(
    'importance-puffery',
    'Structural tells → Importance puffery',
    ANY,
    [
      'mark(?:s|ed|ing)? a pivotal moment',
      'stand(?:s|ing)? as a testament',
      'play(?:s|ed|ing)? a vital role',
      'solidif(?:y|ies|ied|ying) its position',
    ],
    'State the fact; the reader decides whether it is a big deal.',
  ),

  // "Fake-strong verbs" — the three copular stand-ins. slop.md also names
  // "enables" and "drives", which are conditional ("prefer the real verb when
  // there is one") and therefore not in the table: both have honest uses that
  // no regex can tell from the padded ones.
  phrases(
    'fake-strong-verb',
    'Structural tells → Fake-strong verbs',
    ANY,
    ['serves? as', 'served as', 'acts? as', 'acted as', 'functions? as', 'functioned as'],
    'Prefer "is" or "has", or the real verb when there is one.',
  ),

  // "Weak verb phrases" — a verb spread across a noun. Again only the three
  // slop.md writes out. `is able to` is the same family and is deliberately
  // absent: it is not on the list, and it is in approved seed copy.
  phrases(
    'weak-verb-phrase',
    'Structural tells → Weak verb phrases',
    ANY,
    ['made? an? decision', 'ha(?:s|ve|d) the ability to', 'provide(?:s|d)? support for'],
    'Use the verb: decided, can, supports.',
  ),

  // "Superficial analysis" — the trailing -ing clause that performs meaning
  // instead of carrying it. The comma is what makes it mechanical: these
  // participles are ordinary verbs anywhere else in a sentence.
  shape(
    'superficial-analysis',
    'Structural tells → Superficial analysis',
    ANY,
    /,\s*(?:highlight|underscor|reflect|showcas|demonstrat|underlin|emphasi[sz]|illustrat|signal|cement|solidif)\w*ing\b/gi,
    'Say what followed instead: the consequence, not the significance.',
  ),

  // "Binary contrast" — only the templates slop.md writes out, and only with a
  // pronoun subject. The general shape needs the deletion test slop.md sets out
  // (drop the first half; is anything lost?), and O3's tension → turn passes
  // that test while matching any loose pattern for it.
  //
  // The subject restriction is calibration, not caution. A pattern that took
  // any subject marked two sentences of approved case-study prose whose first
  // half corrects an expectation the reader arrives with — information, so the
  // deletion test clears them. A pronoun subject is the mechanical trace of the
  // strawman version: there is no antecedent for the reader to have an
  // expectation about.
  shape(
    'binary-contrast',
    'Structural tells → Binary contrast',
    ANY,
    /\b(?:it|this|that)(?:'?s| is)\s+not\s+(?:about\s+)?[^.?!\n]{1,60}?[,.;]\s*it(?:'?s|\s+is)\b/gi,
    'State the assertion; the negation carries no information.',
  ),
  shape(
    'binary-contrast-question',
    'Structural tells → Binary contrast',
    ANY,
    /\bthe\s+(?:question|point|problem|issue|answer)\s+(?:is\s+not|isn'?t)\b/gi,
    'State the assertion; the negation carries no information.',
  ),
  shape(
    'binary-contrast-not-just',
    'Structural tells → Binary contrast',
    ANY,
    /\bnot\s+(?:just|only|merely|simply)\s+[^.?!\n]{1,60}?,?\s+but\b/gi,
    'State the assertion; the negation carries no information.',
  ),

  // "Negative listing" — the tell is the stack, so one negation is not a hit
  // and two adjacent ones are.
  shape(
    'negative-listing',
    'Structural tells → Negative listing',
    ANY,
    /(?:^|[.!?]\s+)Not\s+(?:a|an|just|only|another)\b[^.!?\n]{0,80}[.!?]\s+Not\b/g,
    'Say what it is and stop.',
  ),

  // "Dramatic fragmentation" — consecutive sentences opening on a conjunction,
  // and the self-announcing full stop.
  shape(
    'dramatic-fragmentation',
    'Structural tells → Dramatic fragmentation',
    ANY,
    /(?:^|[.!?]\s+)(?:And|But|Or)\b[^.!?\n]{0,80}[.!?]\s+(?:And|But|Or)\b/g,
    'Short sentences are punctuation, not the diet.',
  ),
  shape(
    'dramatic-fragmentation-recap',
    'Structural tells → Dramatic fragmentation',
    ANY,
    /\bThat'?s it\.\s+That'?s\b/gi,
    'Short sentences are punctuation, not the diet.',
  ),

  // "Summary-recap ending" — a recap is only a recap at the end, so the rule
  // reads the last paragraph and nothing before it. `Ultimately` mid-argument
  // is a hinge; the same word opening the last paragraph is the tell.
  {
    id: 'summary-recap',
    source: 'Structural tells → Summary-recap ending',
    surface: BODY,
    kind: TELL,
    message: 'End on the last real point, consequence, or invitation.',
    find(text) {
      const blocks = paragraphs(text)
      const last = blocks.at(-1)
      if (!last) return []
      const opener =
        /^(?:#{1,6}\s+)?(?:In conclusion|In summary|To sum up|To summari[sz]e|All in all|Ultimately|Overall|In closing)\b[,:]?/i
      const match = last.block.match(opener)
      return match ? [{ index: last.index + match.index, text: match[0] }] : []
    },
  },

  // "Formatting slop" — the two forms a regex can decide. Bullets that want to
  // be prose and headers over two-sentence sections are judgement calls and
  // stay with the reviewer.
  {
    id: 'emoji-heading',
    source: 'Structural tells → Formatting slop',
    surface: ANY,
    kind: TELL,
    message: 'Format follows the content; it does not decorate it.',
    find(text) {
      const hits = []
      for (const match of text.matchAll(/^#{1,6}\s+.*$/gm)) {
        const emoji = match[0].match(/\p{Extended_Pictographic}/u)
        if (emoji) hits.push({ index: match.index + emoji.index, text: emoji[0] })
      }
      return hits
    },
  },
  {
    id: 'decorative-bold',
    source: 'Structural tells → Formatting slop',
    surface: BODY,
    kind: TELL,
    message: 'Bold mid-sentence decorates; it does not emphasise.',
    find(text) {
      const hits = []
      for (const { index, block } of paragraphs(text)) {
        // Bold that opens a paragraph or a list item is a label — a lead-in,
        // a term being defined — which is what the guidance leaves alone. The
        // tell is bold *inside* a sentence, so the test is whether prose runs
        // before it in the same block. A line-based test gets this wrong the
        // moment a paragraph wraps, which is most of the time.
        const opener = /^\s*(?:[-*+]|\d+\.|>|#{1,6})?\s*(?:\*\*[^*\n]+\*\*)?/
        const skip = block.match(opener)[0].length
        for (const match of block.slice(skip).matchAll(/\*\*(?!\s)[^*]{1,80}?\*\*/g)) {
          hits.push({ index: index + skip + match.index, text: match[0] })
        }
      }
      return hits
    },
  },

  // "Em dashes" — the one rule slop.md splits by surface. Short copy takes
  // none. Body prose takes one or two where they beat the alternatives, so the
  // rule fires on the cluster rather than on the character: three or more in a
  // sentence is past any parenthetical pair.
  //
  // There is no document-wide density rule here. slop.md sets no budget per
  // piece, and the one this file briefly invented marked two passages of
  // approved copy for a threshold no guidance document contains.
  {
    id: 'em-dash-short-copy',
    source: 'Structural tells → Em dashes',
    surface: SHORT,
    kind: CANDIDATE,
    message: 'No em dashes in headlines, CTAs, stats, or other short copy.',
    find: (text) => matches(text, /—/g),
  },
  {
    id: 'em-dash-cluster',
    source: 'Structural tells → Em dashes',
    surface: BODY,
    kind: TELL,
    message: 'Break up the cluster — a comma, a period, or parentheses.',
    find(text) {
      const hits = []
      for (const { index, text: sentence } of sentences(text)) {
        const found = [...sentence.matchAll(/—/g)]
        if (found.length >= 3) hits.push({ index: index + found[2].index, text: '—' })
      }
      return hits
    },
  },
  // "Filler words" — both lists are conditional in slop.md ("cut them when
  // they add nothing"), which is precisely why they belong in a delta rather
  // than in a verdict. A count here is a candidate for the reviser to look at,
  // and the number that means something is the one it fell to.
  phrases(
    'empty-adverb',
    'Filler words → Often-empty adverbs',
    ANY,
    [
      'literally',
      'fundamentally',
      'importantly',
      'crucially',
      'inherently',
      'inevitably',
      'undoubtedly',
      'arguably',
      'notably',
      'seamlessly',
      'effortlessly',
    ],
    'Cut it where it adds nothing; keep it where it carries emphasis.',
    CANDIDATE,
  ),
  phrases(
    'empty-phrase',
    'Filler words → Often-empty phrases',
    ANY,
    [
      "it'?s worth noting",
      "it'?s important to note",
      'at the end of the day',
      'when it comes to',
      'at its core',
      "in today'?s world",
      'in the age of',
      'in the world of',
      'the reality is',
      'the truth is',
      'in terms of',
      'with regard to',
      'going forward',
      'in this article',
      "let'?s dive in",
      "let'?s take a look",
      'needless to say',
    ],
    'Cut it where it delays the point.',
    CANDIDATE,
  ),
]

/** Rules that apply to one surface. `any` runs everywhere. */
function rulesFor(surface) {
  return RULES.filter((rule) => rule.surface === ANY || rule.surface === surface)
}

/** Line and column of an offset, for a report a human can navigate. */
function locate(text, index) {
  const before = text.slice(0, index)
  const line = before.split('\n').length
  return { line, column: index - before.lastIndexOf('\n') }
}

/**
 * Score one text. `surface` is `body` (the default — prose, essays, a drafted
 * body) or `short` (a headline, an excerpt, a CTA, a stat).
 */
export function lint(text, { surface = BODY } = {}) {
  const source = stripCode(text)
  const words = wordCount(source)
  const hits = []
  for (const rule of rulesFor(surface)) {
    for (const found of rule.find(source)) {
      hits.push({
        rule: rule.id,
        kind: rule.kind,
        source: rule.source,
        message: rule.message,
        excerpt: found.text.replace(/\s+/g, ' ').trim(),
        ...locate(source, found.index),
      })
    }
  }
  hits.sort((a, b) => a.line - b.line || a.column - b.column)
  const per = (count) => (words === 0 ? 0 : (count / words) * 100)
  const tells = hits.filter((hit) => hit.kind === TELL)
  const filler = hits.filter((hit) => hit.kind === CANDIDATE)
  return {
    surface,
    words,
    hits,
    tells,
    filler,
    // The headline number counts tells only. Filler is conditional by
    // slop.md's own words, so folding it in would make the density say a
    // draft got worse when a reviser kept an adverb that was doing work.
    perHundred: per(tells.length),
    fillerPerHundred: per(filler.length),
  }
}

/** Hits by rule id, so a delta can name which rule moved. */
function byRule(score) {
  const counts = new Map()
  for (const hit of score.hits) counts.set(hit.rule, (counts.get(hit.rule) ?? 0) + 1)
  return counts
}

/**
 * Score a draft against its revision. The `delta` is the number that means
 * something: a revision is better when its density fell, whatever either
 * absolute was.
 */
export function compare(draftText, revisionText, options = {}) {
  const draft = lint(draftText, options)
  const revision = lint(revisionText, options)
  const before = byRule(draft)
  const after = byRule(revision)
  const rules = [...new Set([...before.keys(), ...after.keys()])].sort()
  return {
    draft,
    revision,
    delta: revision.perHundred - draft.perHundred,
    improved: revision.perHundred <= draft.perHundred,
    rules: rules.map((rule) => ({
      rule,
      draft: before.get(rule) ?? 0,
      revision: after.get(rule) ?? 0,
      delta: (after.get(rule) ?? 0) - (before.get(rule) ?? 0),
    })),
  }
}

const round = (value) => Math.round(value * 100) / 100

function reportScore(label, score, detail = true) {
  const lines = [
    `${label}: ${score.tells.length} tell(s) / ${score.words} words = ${round(score.perHundred)} per 100` +
      `, ${score.filler.length} candidate(s) (${score.surface})`,
  ]
  if (!detail) return lines[0]
  for (const hit of score.hits) {
    lines.push(`  ${hit.line}:${hit.column}  [${hit.kind}] ${hit.rule}  “${hit.excerpt}”`)
    lines.push(`         ${hit.source} — ${hit.message}`)
  }
  return lines.join('\n')
}

function reportDelta(result) {
  // The draft's hit list is not printed. What a reviser needs from a delta is
  // the table below and what is *left*, and re-listing sixteen findings they
  // have already fixed buries the two they have not.
  const lines = [
    reportScore('draft   ', result.draft, false),
    reportScore('revision', result.revision),
    '',
    `delta: ${result.delta > 0 ? '+' : ''}${round(result.delta)} per 100 words`,
  ]
  if (result.rules.length > 0) {
    lines.push('', 'rule                        draft  revision  delta')
    for (const row of result.rules) {
      lines.push(
        `${row.rule.padEnd(26)}  ${String(row.draft).padStart(5)}  ${String(row.revision).padStart(8)}  ${
          row.delta > 0 ? '+' : ''
        }${row.delta}`,
      )
    }
  }
  lines.push(
    '',
    result.improved
      ? 'The revision did not add tells.'
      : 'The revision is denser than the draft — the pass added tells rather than removing them.',
  )
  return lines.join('\n')
}

if (argv[1] && import.meta.url === pathToFileURL(argv[1]).href) {
  const args = argv.slice(2)
  const surface = args.includes('--short') ? SHORT : BODY
  const json = args.includes('--json')
  const files = args.filter((arg) => !arg.startsWith('--'))

  if (args.includes('--rules')) {
    for (const rule of RULES)
      console.log(
        `${rule.id.padEnd(26)}  ${rule.kind.padEnd(6)}  ${rule.surface.padEnd(5)}  ${rule.source}`,
      )
  } else if (args.includes('--delta')) {
    if (files.length !== 2) {
      console.error('usage: slop-lint.mjs --delta <draft> <revision> [--short] [--json]')
      exit(1)
    }
    const result = compare(readFileSync(files[0], 'utf8'), readFileSync(files[1], 'utf8'), {
      surface,
    })
    console.log(json ? JSON.stringify(result, null, 2) : reportDelta(result))
    // The only failing condition in the tool. An absolute count is not one:
    // see the header — the delta is the signal.
    if (!result.improved) exit(1)
  } else if (files.length !== 1) {
    console.error(
      'usage: slop-lint.mjs <file> [--short] [--json] | slop-lint.mjs --delta <draft> <revision>',
    )
    exit(1)
  } else {
    const score = lint(readFileSync(files[0], 'utf8'), { surface })
    console.log(json ? JSON.stringify(score, null, 2) : reportScore(files[0], score))
  }
}

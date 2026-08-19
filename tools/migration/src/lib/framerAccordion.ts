/**
 * o3xo.ai's FAQ accordion, read out of the page's JavaScript.
 *
 * **The served HTML does not carry the answers.** Framer renders every
 * accordion row in its `Closed` variant and ships the opened variant's copy as
 * props inside the page module, so `lib/framerPage.ts` — which reads the DOM —
 * sees eight questions and one paragraph, and that paragraph is the component's
 * own default rather than any row's answer. Migrating the band from the DOM
 * alone would publish the same wrong answer eight times, which is why #220
 * dropped it instead.
 *
 * So this parse reads the module. Two facts about what Framer compiles make it
 * possible without executing anything:
 *
 * 1. **Every row is one instance of one component**, and the instance carries
 *    its question and its answer as backtick-quoted props.
 * 2. **A row whose answer was typed into the opened variant rather than into
 *    the prop carries it as hard-coded `children:` instead** — and that variant
 *    then has no `text:` binding to the prop. That is the discriminator below,
 *    and it is not a corner case: the live page's first two rows are both drawn
 *    that way, and the first one's prop holds the *second* one's answer.
 *
 * It is a parse of minified output, so it is fail-loud rather than best-effort:
 * a module that has moved returns nothing and the converter keeps the drop note
 * it already had, and two rows that resolve to one answer throw, because that
 * is exactly the failure this file exists to prevent.
 */

/** One accordion row, as the page's own JavaScript builds it. */
export interface FramerAccordionRow {
  readonly question: string
  readonly answer: string
}

/** Framework modules every page preloads. None of them builds a page's content. */
const LIBRARIES = /\/(react|motion|framer|rolldown-runtime|script_main|shared-lib)\.[^/]*\.mjs$/

/**
 * The page's own JavaScript modules, from its `modulepreload` links.
 *
 * Framer marks none of them as the page component, so the shared runtime is
 * excluded by name and the caller reads whichever of the rest answers. Ordered
 * as the document lists them.
 */
export function pageModuleUrls(html: string): string[] {
  const urls = [...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)]
    .map((match) => match[1]!)
    .filter((url) => url.endsWith('.mjs') && !LIBRARIES.test(url))
  return [...new Set(urls)]
}

/** Every backtick string that is the value of a `children:` key, in source order. */
function childrenRuns(source: string): string[] {
  return [...source.matchAll(/children:\s*\[?\s*`((?:[^`\\]|\\.)*)`/g)].map((match) => match[1]!)
}

/** The region of `source` that is the object literal opened at `from`, backticks respected. */
function objectAt(source: string, from: number): string {
  let depth = 0
  let index = from
  while (index < source.length) {
    const char = source[index]
    if (char === '`') {
      index += 1
      while (index < source.length && source[index] !== '`') {
        if (source[index] === '\\') index += 1
        index += 1
      }
    } else if (char === '{') {
      depth += 1
    } else if (char === '}') {
      depth -= 1
      if (depth === 0) return source.slice(from, index + 1)
    }
    index += 1
  }
  return source.slice(from)
}

/**
 * `Closed1` → the copy its `Opened1` variant draws, for every opened variant
 * that draws its own rather than binding the instance's prop.
 *
 * Keyed by the CLOSED variant's id, because that is what an instance names.
 * Framer numbers the pair with one suffix (`Closed2` opens into `Opened2`), and
 * the base pair takes the empty one.
 */
function hardCodedAnswers(source: string): Map<string, string> {
  const ids = new Map<string, string>()
  for (const match of source.matchAll(/\b(Closed\d*|Opened\d*):`(\w+)`/g)) {
    ids.set(match[1]!, match[2]!)
  }

  const answers = new Map<string, string>()
  for (const [name, id] of ids) {
    if (!name.startsWith('Opened')) continue
    const closed = ids.get(`Closed${name.slice('Opened'.length)}`)
    if (!closed) continue
    const at = source.indexOf(`${id}:{children:`)
    if (at < 0) continue
    const region = objectAt(source, source.indexOf('{', at + id.length))
    // A `text:` binding means the variant draws whatever the instance passed,
    // so there is nothing hard-coded here to prefer over the prop.
    if (/\btext:\s*\w/.test(region)) continue
    const answer = childrenRuns(region).join('').replace(/\s+/g, ' ').trim()
    if (answer) answers.set(closed, answer)
  }
  return answers
}

/**
 * The accordion rows one page module builds, in page order.
 *
 * Empty when the module builds no accordion, which is every module but one.
 */
export function parseAccordion(source: string): FramerAccordionRow[] {
  const answers = hardCodedAnswers(source)
  const rows: FramerAccordionRow[] = []

  // An instance opens `o(<Component>,{…})` and carries its question as the one
  // prop whose value is a question. Anchoring on the question rather than on a
  // prop name is what survives Framer re-minting its ids.
  for (const match of source.matchAll(/\b(\w+):`([^`]*\?)`/g)) {
    const question = match[2]!
    const region = objectAt(source, source.lastIndexOf('{', match.index))
    const variant = /variant:\s*\w+\(`(\w+)`\)/.exec(region)?.[1]
    // The instance's own answer prop: the other long prose value beside the
    // question. Short values are ids, classes and layout literals.
    const prop = [...region.matchAll(/\b\w+:`([^`]*)`/g)]
      .map((one) => one[1]!)
      .filter((value) => value !== question && value.length > 40 && / /.test(value))
      .at(0)
    const answer = (variant ? answers.get(variant) : undefined) ?? prop
    if (answer) rows.push({ question, answer })
  }

  const questions = new Set(rows.map((row) => row.question))
  if (questions.size !== rows.length) {
    throw new Error(
      'o3xo.ai: the same accordion question was read twice — the page module has moved, ' +
        'so this parse has to move with it',
    )
  }
  const distinct = new Set(rows.map((row) => row.answer))
  if (rows.length > 1 && distinct.size !== rows.length) {
    throw new Error(
      'o3xo.ai: two accordion rows read the same answer, which is what an unset prop falling ' +
        'back to the component default looks like. The page module has moved, so this parse has ' +
        'to move with it',
    )
  }
  return rows
}

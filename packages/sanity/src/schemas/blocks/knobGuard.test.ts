import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { patchableKnobRoots, visibleKnobs } from '@o3/block-spec'
import type { Knob, KnobRoot } from '@o3/block-spec'
import { describe, expect, it } from 'vitest'
import { BLOCK_KNOBS, OBJECT_KNOBS } from '../../knobs'
import * as sharedObjects from '../objects'
import * as baseBlocks from './base'
import * as sectionBlocks from './section'

/**
 * THE GUARD (#114, ADR 0020): **a control exists exactly when it does
 * something.**
 *
 * One test, both directions, every converted block, every state that block's
 * own knobs can reach:
 *
 * 1. every knob `visibleKnobs` offers is a field the Studio form also shows
 *    under that state — otherwise the toolbar draws a control that writes a
 *    field the editor cannot see;
 * 2. every design option the form shows is a knob `visibleKnobs` offers —
 *    otherwise there is a setting an editor can only reach by leaving the
 *    canvas and opening the form.
 *
 * Either direction alone permits one of the two failures the inversion exists
 * to design out, which is why neither is here on its own.
 *
 * **The form side is asked with the form's own predicate.** We build the real
 * block, find the field, and call the `hidden` callback Studio calls, with the
 * state under test as `parent`. Nothing is restated from the declaration, so
 * agreement is observed rather than asserted — and a hand-written `hidden:`
 * closure, which is the habit this guard is here to catch, is answered by
 * exactly the same call.
 *
 * **This test should be boring, and its being boring is the finding.** The
 * declaration generates the field, so agreement is the default rather than a
 * coincidence; the prior art needed roughly a dozen parity tests and frozen
 * fixtures to hold six hand-kept mirrors together. If this file ever grows a
 * second guard, or a special case for one block, that is the signal that a
 * mirror was rebuilt without anyone noticing — say so on the issue rather than
 * widening the test.
 *
 * **An array member is a root, so the walk runs twice** (#118, ADR 0021). A
 * member's knobs are relative to the member exactly as a block's are to the
 * block, so both directions are asked again of the member's own fields with
 * the member as `parent`. That is the change this file always expected the
 * item surface to need, not a second guard — and it closes ADR 0021's one
 * unguarded seam on the way past: a spec filed under an array name the schema
 * does not carry is reported here, which is the only place in the repo that
 * can see both halves of that key at once.
 *
 * **A shared object is a third root, so the walk runs over those too** (#145,
 * ADR 0023). Same two directions, asked of the object's own fields with the
 * instance as `parent`, because an instance is configured by its component and
 * its knobs are relative to it wherever it was placed. It carries one thing the
 * other two roots do not need: direction (2) runs over EVERY registered shared
 * object, declared or not. A block cannot exist without a declaration —
 * `defineSectionBlock` requires one — but a shared object can still reach for
 * `defineType` directly, so this is the enforcement point ADR 0023 names. An
 * object that publishes a closed value set nobody declared fails here rather
 * than offering an empty menu.
 *
 * WHAT IT DOES NOT COVER, deliberately:
 *
 * - **`nested`.** `visibleKnobs({nested: true})` drops band knobs because a
 *   nested block's host owns the strip. That is a fact about which chrome
 *   *delivers* a knob, not about whether the form shows the field — the form
 *   has no idea where the block sits — so folding it in here would assert a
 *   disagreement that is the design. No section block hosts another section
 *   block today (`layoutSection.items` takes base blocks), so the state is
 *   unreachable as well as out of scope.
 * - **the write leg (#123).** States are built in the shape the document
 *   honestly holds — `columns: 1`, a number, because `valueType` says so. The
 *   string the write leg currently stores is a live defect, and modelling it
 *   here would quietly certify it.
 * - **one named editorial closed set** (`EDITORIAL_CLOSED_SETS`, #120). Not a
 *   special case for a block and not a mirror: direction (2) is a suspicion,
 *   and this is the one place a human has answered it. See its own note.
 */

/** A schema field as this test reads it. `hidden` is `unknown` until called. */
type ReadableField = {
  name: string
  type: string
  options?: { list?: unknown }
  hidden?: unknown
  /** An array's members. Only the inline objects a member spec can name. */
  of?: { name?: string; fields?: ReadableField[] }[]
}

type ReadableBlock = { name: string; fields?: ReadableField[] }

/**
 * Every block schema, from the two block barrels rather than a list here — a
 * converted block is found by the name its own declaration answers to, so
 * adding one costs this file nothing.
 */
const BLOCK_SCHEMAS = [
  ...Object.values(sectionBlocks),
  ...Object.values(baseBlocks),
] as unknown as ReadableBlock[]

const blockNamed = (type: string) => BLOCK_SCHEMAS.find((block) => block.name === type)

/**
 * Every shared object, from its own barrel for the same reason — a registered
 * type is found by the name it answers to, and adding one costs this file
 * nothing. `figure`, `stat` and the rest are in here deliberately: an object
 * with no declaration is exactly what direction (2) has to be asked about.
 */
const OBJECT_SCHEMAS = Object.values(sharedObjects) as unknown as ReadableBlock[]

const objectNamed = (type: string) => OBJECT_SCHEMAS.find((object) => object.name === type)

/** A block value under test: what the document holds for this block. */
type State = Record<string, unknown>

/** Read a block-relative path, the way `hiddenUnless` and the toolbar both do. */
function readAt(state: State, path: string): unknown {
  return path.split('.').reduce<unknown>((node, segment) => {
    if (node === null || typeof node !== 'object') return undefined
    return (node as Record<string, unknown>)[segment]
  }, state)
}

/** The same state with one knob's path set, creating objects along the way. */
function withValue(state: State, path: string, value: unknown): State {
  const [head, ...rest] = path.split('.')
  if (!head) return state
  if (rest.length === 0) return { ...state, [head]: value }
  const child = state[head]
  const branch = (child !== null && typeof child === 'object' ? child : {}) as State
  return { ...state, [head]: withValue(branch, rest.join('.'), value) }
}

/**
 * What a knob's field can hold, **in the document's spelling**.
 *
 * `undefined` first, because unset is a state every knob reaches and the one
 * a gate is most often wrong about — Sanity never writes `initialValue` into
 * a document saved before the field existed.
 *
 * The values are converted on the knob's DECLARED `valueType`, so
 * `layoutSection.columns` is compared as `1` and not `'1'`. Both sides coerce
 * (`optionKey` on the query side, `Number()` at the schema boundary), so
 * feeding strings would still pass — and would prove agreement about a value
 * no document holds.
 */
function storedValues(knob: Knob): unknown[] {
  return [
    undefined,
    ...knob.options.map((option) =>
      knob.valueType === 'number' ? Number(option.value) : option.value,
    ),
  ]
}

/** Every combination of the root's own knob values: the states it can reach. */
function statesOf(spec: KnobRoot): State[] {
  return spec.knobs.reduce<State[]>(
    (states, knob) =>
      states.flatMap((state) =>
        storedValues(knob).map((value) => withValue(state, knob.name, value)),
      ),
    [{}],
  )
}

/**
 * Does the Studio form show this field under this state? Asked of the field's
 * own `hidden`, which is what Studio asks.
 *
 * A block's fields sit at the block root, so `parent` is the block value —
 * the same thing `document` would be for a gate that reaches for it, and what
 * `hiddenUnless` reads. A member's fields sit at the member, and Studio hands
 * the member as `parent` there, so the same call answers for both.
 */
function formShows(field: ReadableField, state: State): boolean {
  const gate = field.hidden
  if (typeof gate === 'boolean') return !gate
  if (typeof gate !== 'function') return true
  const ask = gate as (context: { parent: State; value: unknown; document: State }) => boolean
  return !ask({ parent: state, value: readAt(state, field.name), document: state })
}

/**
 * WHAT COUNTS AS "A DESIGN OPTION THE FORM SHOWS" — the rule direction (2)
 * turns on, and the one most likely to be got wrong later.
 *
 * **A design option is a field an editor PICKS from a closed set. An editorial
 * field is one an editor FILLS IN.** A published `options.list` is the tell,
 * because that is what a picker is; a string, a text, an array, an image or a
 * reference is not one however it is gated.
 *
 * **A declared gate is not the tell.** `heroSection.eyebrow` is band-only via
 * `hiddenUnless` and is still editorial — it is prose an editor types, and
 * `showWhen` says *when a field applies*, never *what kind of field it is*.
 * Writing a gate down (rather than closing over it) is a good habit for an
 * editorial field too, and this guard must not tax it by demanding a knob for
 * every field whose visibility is declared. So gating is read on neither side
 * of this rule: it decides visibility, and visibility is what we compare.
 *
 * **This is a suspicion, not a definition, and the difference is the whole
 * lesson of ADR 0020.** Enum-ness publishes nothing here — a field becomes a
 * control by being declared a knob and by nothing else — and that stays true,
 * because the only thing a closed set does in this file is FAIL A TEST and ask
 * a human which kind of field it is. The prior art let `options.list` mean
 * "publish this as an editor control" at runtime, so a list added for an
 * unrelated reason put a machine field in front of an editor; the fix was a
 * denylist of root names, which a differently-named field walked around a few
 * months later. A loud question costs one line of triage. A silent promotion
 * costs an editor a control that writes a value the contract rejects, and a
 * silent omission costs them a setting they can only reach by opening the
 * form. There is deliberately no exclusion list here: the day a converted
 * block wants a genuinely editorial closed set, that is a judgement someone
 * makes in the open, in the diff, and writes down.
 */
const offersAClosedSet = (field: ReadableField) => Array.isArray(field.options?.list)

/**
 * THE ANSWER TO THE QUESTION ABOVE, FOR THE ONE FIELD THAT HAS BEEN ASKED IT.
 *
 * The rule above promised that the day a converted block wants a genuinely
 * editorial closed set, someone makes that judgement in the open, in the diff,
 * and writes it down. #120 converted the last block and that day arrived with
 * it, so this is the writing down — not an exemption mechanism, and not the
 * denylist the prior art walked around.
 *
 * The difference is which way it fails. The prior art's list suppressed fields
 * from becoming controls, so a field it missed was silently PROMOTED and put a
 * machine value in front of an editor. This one suppresses nothing: a closed
 * set that is not named here still fails the guard and still asks a human. It
 * can only ever be too small, and too small is loud.
 *
 * **`listingSection.pageType`** names a content category — which pages the band
 * lists, via their card fieldset — from `PAGE_TYPES`, a list developers close
 * and editors do not extend. An editor changing it is choosing what the band is
 * about, not how it looks, which is the test ADR 0020 hands to the author.
 * CONTEXT.md and the ADR have both said so since the vocabulary existed; this
 * is where the guard is told.
 *
 * Keyed by the root the field sits on, so a member's field is spelled
 * `blockType.array[].field` and cannot be excused by a block-level entry.
 */
const EDITORIAL_CLOSED_SETS: ReadonlySet<string> = new Set(['listingSection.pageType'])

/** The state, spelled so a failure names the document it is talking about. */
const spell = (state: State) =>
  JSON.stringify(state, (_key, value: unknown) => (value === undefined ? '⟨unset⟩' : value))

/**
 * BOTH DIRECTIONS AT ONE ROOT — a block against its own fields, or one of its
 * array members against its own (#118, ADR 0021).
 *
 * Nothing here asks which it was handed. A knob path is relative to the root
 * either way, `visibleKnobs` takes either spec, and `parent` is whichever
 * object holds the fields — which is the property the item surface was built
 * to have, checked rather than assumed.
 *
 * `home` is the knobs file a missing declaration belongs in, so the failure
 * for a member names the block's file and not a file called `screen.ts`.
 */
function disagreementsAt({
  where,
  home,
  spec,
  fields,
}: {
  where: string
  home: string
  spec: KnobRoot
  fields: readonly ReadableField[]
}): string[] {
  const disagreements: string[] = []

  for (const state of statesOf(spec)) {
    const at = `${where} ${spell(state)}`
    const offered = new Set(
      visibleKnobs({ spec, read: (path) => readAt(state, path) }).all.map(
        (resolved) => resolved.knob.name,
      ),
    )

    // (1) Nothing the toolbar offers is missing from, or hidden in, the form.
    for (const name of offered) {
      const field = fields.find((candidate) => candidate.name === name)
      if (!field) {
        disagreements.push(`${at}: the toolbar offers "${name}"; the form has no such field.`)
      } else if (!formShows(field, state)) {
        disagreements.push(`${at}: the toolbar offers "${name}"; the form hides it.`)
      }
    }

    // (2) Nothing the form offers as a closed set is missing from the toolbar.
    // A knob's own generated field lands here too, which is what catches the
    // symmetric gate failure: the form showing "rail" where the toolbar drops it.
    for (const field of fields) {
      if (!offersAClosedSet(field)) continue
      if (EDITORIAL_CLOSED_SETS.has(`${where}.${field.name}`)) continue
      if (!formShows(field, state)) continue
      if (offered.has(field.name)) continue
      disagreements.push(
        `${at}: the form offers a closed value set at "${field.name}"; no knob answers for it. ` +
          `Declare it in ${home}, or say why it is editorial.`,
      )
    }
  }

  return disagreements
}

describe('the guard: a control exists exactly when it does something', () => {
  it('offers exactly the design options the form shows, in every state a block’s knobs can reach', () => {
    const disagreements: string[] = []

    for (const spec of Object.values(BLOCK_KNOBS)) {
      const block = blockNamed(spec.type)
      if (!block) {
        disagreements.push(
          `${spec.type}: declares knobs, and no block schema answers to that name.`,
        )
        continue
      }
      const fields = block.fields ?? []
      const home = `src/knobs/${spec.type}.ts`

      disagreements.push(...disagreementsAt({ where: spec.type, home, spec, fields }))

      // The member root. An `items` key names a block-relative array field and
      // the member spec names the member's `_type`; both are load-bearing and
      // nothing else in the repo sees them beside the schema (ADR 0021), so a
      // miss on either is a disagreement rather than a skipped walk.
      for (const [arrayField, item] of Object.entries(spec.items ?? {})) {
        const array = fields.find((candidate) => candidate.name === arrayField)
        const member = array?.of?.find((candidate) => candidate.name === item.type)
        if (!member) {
          disagreements.push(
            `${spec.type}: hangs "${item.type}" knobs off "${arrayField}"; the schema has no such ` +
              `array member. The knobs directory cannot see the schema, so this key agrees with it or nothing does.`,
          )
          continue
        }
        disagreements.push(
          ...disagreementsAt({
            where: `${spec.type}.${arrayField}[]`,
            home,
            spec: item,
            fields: member.fields ?? [],
          }),
        )
      }
    }

    expect(disagreements).toEqual([])
  })

  /**
   * THE OBJECT ROOT (#145, ADR 0023), in the same two directions.
   *
   * Its own `it` rather than a third branch inside the block walk, because the
   * subject is different: that one iterates DECLARATIONS and asks whether a
   * schema answers, and a shared object has to be iterated the other way round
   * as well — every registered object, whether or not anybody declared knobs
   * for it. Both directions still run, and neither is a special case for a
   * type.
   */
  it('offers exactly the design options a shared object’s form shows, wherever an instance is placed', () => {
    const disagreements: string[] = []

    for (const object of OBJECT_SCHEMAS) {
      const fields = object.fields ?? []
      const home = `src/knobs/${object.name}.ts`
      const spec = Object.prototype.hasOwnProperty.call(OBJECT_KNOBS, object.name)
        ? OBJECT_KNOBS[object.name]
        : undefined

      if (spec) {
        disagreementsAt({ where: object.name, home, spec, fields }).forEach((d) =>
          disagreements.push(d),
        )
        continue
      }

      // UNDECLARED, WHICH IS THE ANSWER FOR MOST OF THEM. `figure`, `stat` and
      // `chapter` carry editorial fields and nothing else, so there is no menu
      // to open and nothing to declare. A closed value set is the one thing
      // that cannot be silent: it is a picker the form draws and the canvas has
      // never heard of, and an editor reaches it only by leaving the canvas.
      // Gating is not read here for the reason it is not read anywhere in this
      // file — it decides visibility, not what kind of field something is.
      for (const field of fields) {
        if (!offersAClosedSet(field)) continue
        if (EDITORIAL_CLOSED_SETS.has(`${object.name}.${field.name}`)) continue
        disagreements.push(
          `${object.name}: the form offers a closed value set at "${field.name}"; the shared object ` +
            `declares no knobs, so a hovered instance offers nothing. Declare it in ${home} with ` +
            `defineObjectKnobs(), or say why it is editorial.`,
        )
      }
    }

    // And the other way: a declaration filed under a name no shared object
    // answers to. `OBJECT_KNOBS` is keyed on a GLOBAL type name (which is what
    // makes the registry safe at all, ADR 0023), so this is the one check that
    // the name is really registered.
    for (const spec of Object.values(OBJECT_KNOBS)) {
      if (!objectNamed(spec.type)) {
        disagreements.push(
          `${spec.type}: declares knobs, and no shared object schema answers to that name.`,
        )
      }
    }

    expect(disagreements).toEqual([])
  })
})

/**
 * Two pins the guard rests on, asserted separately because they are about the
 * knobs' reach rather than about form agreement (#114's "also worth pinning").
 */
describe('what the knob declarations reach', () => {
  const KNOBS_ENTRY = resolve(dirname(fileURLToPath(import.meta.url)), '../../knobs/index.ts')

  /** `sanity`, `sanity/…` and `@sanity/…` — except the icons the knobs carry. */
  const STUDIO_RUNTIME = /^(sanity(\/.*)?|@sanity\/(?!icons\/).*)$/
  const FROM_IMPORTS = /\b(?:import|export)\s+(type\s+)?[\s\S]*?\bfrom\s*'([^']+)'/g
  const SIDE_EFFECT_IMPORTS = /\bimport\s*'([^']+)'/g

  /**
   * Every module a file imports, and whether the import was **type-only**.
   *
   * `import type` is erased before anything is bundled, so it puts nothing in
   * the preview bundle and cannot be the edge this guard exists to catch. The
   * distinction became load-bearing with the placeholders (#112): each knobs
   * file names its block's generated type (`import type { HeroSection } from
   * '../types/generated'`), and `generated.ts` — a typegen artifact nobody
   * hand-writes — imports `@sanity/client` for its own reference types. Reading
   * that as a violation would mean a placeholder could not be typed against the
   * schema it writes into, which is the one guarantee it has.
   */
  const importsIn = (source: string): { specifier: string; typeOnly: boolean }[] => [
    ...[...source.matchAll(FROM_IMPORTS)].map((m) => ({
      specifier: m[2]!,
      typeOnly: Boolean(m[1]),
    })),
    ...[...source.matchAll(SIDE_EFFECT_IMPORTS)].map((m) => ({
      specifier: m[1]!,
      typeOnly: false,
    })),
  ]

  const resolveRelative = (fromFile: string, specifier: string): string | undefined => {
    const base = resolve(dirname(fromFile), specifier)
    for (const candidate of [base, `${base}.ts`, `${base}/index.ts`]) {
      if (candidate.endsWith('.ts') && existsSync(candidate)) return candidate
    }
    return undefined
  }

  /**
   * The knob barrel and everything it pulls in by relative import.
   *
   * The eslint rule is scoped to `src/knobs/**`, so `../constants` — which
   * `surfaceKnob` imports, and which sits outside that scope — is the one step
   * a Studio import could enter by without lint saying a word. The site bundle
   * reads this barrel (`apps/web/src/sanity/VisualEditing.tsx`), so the walk is
   * the cheap half of the bundle-cleanliness claim ADR 0020 makes; workspace
   * packages are not followed, because `@o3/block-spec` has no dependencies to
   * follow.
   */
  const walk = (entry: string): Map<string, string> => {
    const seen = new Map<string, string>()
    const queue = [entry]
    while (queue.length > 0) {
      const file = queue.pop() as string
      if (seen.has(file)) continue
      const source = readFileSync(file, 'utf8')
      seen.set(file, source)
      for (const { specifier, typeOnly } of importsIn(source)) {
        if (typeOnly || !specifier.startsWith('.')) continue
        const target = resolveRelative(file, specifier)
        if (target) queue.push(target)
      }
    }
    return seen
  }

  it('imports no Studio runtime, so the preview bundle can read them', () => {
    const offenders: string[] = []
    for (const [file, source] of walk(KNOBS_ENTRY)) {
      for (const { specifier, typeOnly } of importsIn(source)) {
        if (!typeOnly && STUDIO_RUNTIME.test(specifier)) {
          offenders.push(`${relative(process.cwd(), file)} imports "${specifier}"`)
        }
      }
    }

    expect(offenders).toEqual([])
  })

  /**
   * The optimistic overlay copies `patchableKnobRoots(...)` off the mutated
   * document onto the projected block so a pick repaints on the click
   * (`apps/web/src/content/blocks/optimisticOrder.ts`). The list is derived
   * from the declarations, so it cannot fall behind them — but the derivation
   * rests on a condition nothing checks: every one of those roots holds a
   * plain value. A root holding a reference is stored as `{_ref}` and projected
   * dereferenced, so overlaying it would swap resolved data for a bare ref.
   *
   * Checked against EVERY block, not only converted ones, because the overlay
   * applies the same root list to whatever block it is handed.
   */
  it('patches only plain-valued roots, which is what the optimistic overlay assumes', () => {
    const roots = patchableKnobRoots(Object.values(BLOCK_KNOBS))
    const plain = ['string', 'number', 'boolean']

    const offenders = BLOCK_SCHEMAS.flatMap((block) =>
      (block.fields ?? [])
        .filter((field) => roots.includes(field.name) && !plain.includes(field.type))
        .map((field) => `${block.name}.${field.name} is type "${field.type}"`),
    )

    expect(offenders).toEqual([])
  })
})

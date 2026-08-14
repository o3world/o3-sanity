import { showWhenSatisfied } from '@o3/block-spec'
import type { BlockKnobs, Knob, ShowWhen } from '@o3/block-spec'
import { defineField } from 'sanity'
import type { FieldDefinition } from 'sanity'

/**
 * THE SANITY ADAPTER (ADR 0020). A knob declaration in, a `defineField` out.
 *
 * This is the impure side of the line: it imports `sanity`, and the
 * declarations it reads may not. Everything a block offers as a design option
 * is authored once in `src/knobs/<blockName>.ts`, and the form an editor sees
 * is generated here — so the Studio cannot offer a value the toolbar has never
 * heard of, or hide a control the toolbar still shows.
 */

/**
 * Read a knob path — dot-separated, relative to the block root — out of a
 * form value. Returns `undefined` at the first segment that is not an object,
 * because a gate on an unfilled path must read as "nothing", not throw.
 */
function readRelative(root: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, segment) => {
    if (node === null || typeof node !== 'object') return undefined
    return (node as Record<string, unknown>)[segment]
  }, root)
}

/**
 * A declared `showWhen` as the Sanity form's `hidden` callback.
 *
 * **This is the conversion the whole ticket is for.** `hidden` is a closure,
 * and a closure is readable by exactly one consumer — the form that calls it.
 * The prior art tried to recover a gate's intent from its serialised source
 * and got a silently inverted condition (ADR 0020). Here the gate is data,
 * and the closure is generated from it, so the toolbar and the form evaluate
 * the same declaration with two evaluators that cannot disagree.
 *
 * `hidden` is the negation: the field shows exactly when the gate is
 * satisfied. `parent` is the enclosing object, which is the block root for
 * every field a section block declares.
 *
 * Exported because editorial fields want it too — `heroSection.eyebrow` is not
 * a design option, but its visibility is still a fact about `variant` and is
 * better written down than closed over.
 *
 * Ancestor gates are deliberately NOT folded in. `visibleKnobs` applies gate
 * inheritance at query time, and Sanity already hides a child field when its
 * parent object is hidden, so re-applying an ancestor's gate here would double
 * it up.
 */
export function hiddenUnless(gate: ShowWhen): (context: { parent?: unknown }) => boolean {
  return ({ parent }) => !showWhenSatisfied(gate, (path) => readRelative(parent, path))
}

/**
 * THE ONE PLACE A KNOB'S VALUE STOPS BEING A STRING (#119).
 *
 * Option values are strings throughout `@o3/block-spec` — declared as strings,
 * compared as strings, and coerced back to strings by `optionKey` when a
 * document hands one over as a number. That is deliberate: gates, args, data
 * attributes and check-marks all want one comparable type, and a knob that
 * carried two would make every consumer ask which it had.
 *
 * The document field underneath does not get that luxury. `layoutSection.columns`
 * is `type: 'number'` holding `1 | 2 | 3`, and typegen publishes that literal
 * union straight into `LayoutSection`'s props. Emitting `type: 'string'` here
 * would move `generated.ts` and change the renderer's props out from under
 * `apps/web` — which is the thing the conversion is not allowed to do.
 *
 * So the adapter converts, and it converts on a DECLARED type (`knob.valueType`)
 * rather than a sniffed one. `['1','2','3']` looks numeric; `['1','2','3']`
 * meaning a version, a grade or a zero-padded code looks identical, and the
 * difference between the two is only knowable at the declaration. See
 * `KnobValueType` for the full argument. `knob()` has already checked that a
 * number-valued option survives `String(Number(v)) === v`, so this conversion
 * is total and its inverse is `optionKey`.
 *
 * The two branches are spelled out rather than parameterised on
 * `type: knob.valueType`, because `defineField`'s overloads key on a LITERAL
 * type and a `'string' | 'number'` union silently resolves to one of them —
 * which typechecks the `options.list` of the wrong field shape. Two calls, and
 * each one is checked against the field it actually generates.
 */

/** A radio row, which is what every design option is drawn as. */
const RADIO = { layout: 'radio', direction: 'horizontal' } as const

/**
 * One knob as one field.
 *
 * A radio list either way, because that is what a design option is: a small
 * closed set the editor picks one of.
 */
function knobField(knob: Knob): FieldDefinition {
  if (knob.name.includes('.')) {
    throw new Error(
      `knobFields: "${knob.name}" is a nested path, and a nested knob has no flat field to generate. ` +
        `Declare the containing object as a schema field and give it its own knobs (#113).`,
    )
  }
  const shared = {
    name: knob.name,
    title: knob.title,
    ...(knob.description ? { description: knob.description } : {}),
    ...(knob.showWhen ? { hidden: hiddenUnless(knob.showWhen) } : {}),
  }

  if (knob.valueType === 'number') {
    return defineField({
      ...shared,
      type: 'number',
      options: {
        list: knob.options.map(({ value, title }) => ({ value: Number(value), title })),
        ...RADIO,
      },
      ...(knob.initialValue !== undefined ? { initialValue: Number(knob.initialValue) } : {}),
    })
  }

  return defineField({
    ...shared,
    type: 'string',
    options: {
      list: knob.options.map(({ value, title }) => ({ value, title })),
      ...RADIO,
    },
    ...(knob.initialValue !== undefined ? { initialValue: knob.initialValue } : {}),
  })
}

/**
 * Every knob a block declares, as Sanity fields, in declaration order.
 *
 * `defineSectionBlock` is the normal caller — it splices these in by name so
 * the block's field order stays authored where an author can see it. Call this
 * directly only when you need the whole set in spec order.
 */
export function knobFields(spec: BlockKnobs): FieldDefinition[] {
  return spec.knobs.map(knobField)
}

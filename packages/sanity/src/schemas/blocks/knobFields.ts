import { showWhenSatisfied } from '@o3/block-spec'
import type { Knob, KnobRoot, ShowWhen } from '@o3/block-spec'
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
 * Every knob a root declares, as Sanity fields, in declaration order.
 *
 * The root is a block or one of its array members (#122) — the generated field
 * is the same either way, because a member's knobs are paths relative to the
 * member exactly as a block's are relative to the block.
 *
 * `withKnobFields` is the normal caller — it splices these in by name so the
 * field order stays authored where an author can see it. Call this directly
 * only when you need the whole set in spec order.
 */
export function knobFields(spec: KnobRoot): FieldDefinition[] {
  return spec.knobs.map(knobField)
}

/**
 * An entry in a `fields` list: a hand-written editorial field, or the **name of
 * a knob** the spec declares.
 *
 * A bare string is how a type says where a generated field sits. Field order is
 * a fact about the form an editor reads, so it stays authored in one visible
 * list rather than falling out of "editorial first, knobs appended" — which
 * would have moved `heroSection.variant` from the top of the form to the middle
 * on the day it became a knob.
 */
export type KnobbedField = FieldDefinition | string

/**
 * Splice a spec's generated knob fields into an authored field list.
 *
 * A knob named in `fields` lands at that position; a knob that is not named is
 * appended after the editorial fields, in declaration order. The append rule is
 * what lets fifteen unconverted blocks keep their `surface` field in its old
 * last-position without any of them mentioning it.
 *
 * ONE SPLICE FOR BOTH ROOTS. An array member's fields are generated by the same
 * rule for the same reason: get it wrong there and the member's field order
 * moves, which moves `generated.ts` under the renderer. `where` names the
 * factory in the error so an author is told which call to fix, not which
 * helper.
 */
export function withKnobFields(
  where: string,
  typeName: string,
  fields: readonly KnobbedField[],
  spec: KnobRoot,
): FieldDefinition[] {
  // Keyed off the generated field's own name rather than the knob's, because
  // they are the same string by construction and one of them is already here.
  const generated = new Map(knobFields(spec).map((field) => [field.name, field]))

  const placed = new Set<string>()
  const resolved = fields.map((entry) => {
    if (typeof entry !== 'string') {
      if (generated.has(entry.name)) {
        throw new Error(
          `${where}: "${typeName}.${entry.name}" is declared as a knob and written again as a field. ` +
            `Delete the field and name the knob — "${entry.name}" — where it belongs in the list.`,
        )
      }
      return entry
    }
    const field = generated.get(entry)
    if (!field) {
      throw new Error(
        `${where}: "${typeName}" places a knob called "${entry}", which its knobs do not declare.`,
      )
    }
    placed.add(entry)
    return field
  })

  const appended = spec.knobs
    .filter((knob) => !placed.has(knob.name))
    .map((knob) => generated.get(knob.name) as FieldDefinition)

  return [...resolved, ...appended]
}

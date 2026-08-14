import { resolveKnobValue, storedValue, visibleKnobs } from '@o3/block-spec'
import type { BlockKnobs, Knob, KnobReader, ShowWhen } from '@o3/block-spec'

import { applyKnobs, FIXTURE_VALUE, getAtPath, knobId, setAtPath } from './knobs'

/**
 * Write an option key into a fixture AS THE DOCUMENT WOULD HOLD IT.
 *
 * A knob's options are strings; the field underneath may be a number
 * (`layoutSection.columns` is `1 | 2 | 3`). Every write in this module goes
 * through here rather than `setAtPath` directly, because `setAtPath<T>(…,
 * value: unknown): T` returns `T` whatever it was handed — so a story that put
 * `'2'` into a prop typed `1 | 2 | 3` compiled cleanly and rendered fine, and
 * the mismatch only showed up in a document (#123).
 */
function setKnob<T>(state: T, knob: Knob, optionValue: string): T {
  return setAtPath(state, knob.name, storedValue(knob, optionValue))
}

/**
 * The same conversion for a whole Storybook args map, which arrives keyed by
 * `knobId` rather than by knob. `FIXTURE_VALUE` and anything the spec does not
 * declare pass through untouched — the sentinel means "leave the fixture
 * alone", and converting it would write the literal string.
 */
function convertArgs(
  spec: BlockKnobs,
  args: Record<string, unknown>,
  idToPath: Record<string, string>,
): Record<string, unknown> {
  const byPath = new Map(spec.knobs.map((knob) => [knob.name, knob]))
  const out: Record<string, unknown> = { ...args }
  for (const [id, path] of Object.entries(idToPath)) {
    const value = out[id]
    const knob = byPath.get(path)
    if (!knob || typeof value !== 'string' || value === FIXTURE_VALUE) continue
    out[id] = storedValue(knob, value)
  }
  return out
}

/**
 * THE STORYBOOK ADAPTER for the knob vocabulary (ADR 0020) — knobs in,
 * Storybook `argTypes` and `args` out.
 *
 * Pure data in, pure data out, so every rule below is unit-testable in a
 * `.test.ts` (the `unit` project takes no `.tsx`). The rendering half lives in
 * `defineKnobStories.tsx`, which is covered by mounting its stories.
 */

/** A `KnobReader` over a plain fixture object. */
export function readFixture(data: unknown): KnobReader {
  return (relPath) => getAtPath(data, relPath)
}

/** Every path a gate reads, flattened across the two `ShowWhen` shapes. */
function gatePaths(gate: ShowWhen | undefined, into: Set<string>): void {
  if (!gate) return
  if (gate.mode === 'allOf') {
    for (const leaf of gate.all) into.add(leaf.at)
    return
  }
  into.add(gate.at)
}

/**
 * The knob paths some knob's gate reads — restricted to paths this block
 * actually declares as knobs, because only those have a control to read.
 *
 * A gate may name an editorial field instead (`heroSection.eyebrow` is gated
 * on `variant`, and `variant` is a knob while `eyebrow` is not — the gate can
 * also point the other way). Such a path has no arg, so it is not a source
 * here and its gate stays frozen at whatever the fixture says.
 */
export function gateSourcePaths(knobs: readonly Knob[]): ReadonlySet<string> {
  const declared = new Set(knobs.map((k) => k.name))
  const found = new Set<string>()
  for (const k of knobs) gatePaths(k.showWhen, found)
  return new Set([...found].filter((path) => declared.has(path)))
}

/**
 * Every document state this story's own controls can produce: the fixture, and
 * the fixture with each combination of gate-source values.
 *
 * The cross product is over gate sources only — knobs that some other knob's
 * visibility depends on — so it is one or two knobs on a real block, not the
 * whole spec. Computed once when the story module loads.
 */
function reachableStates<T>(fixture: T, sources: readonly Knob[]): T[] {
  const product = sources.reduce<T[]>(
    (states, source) =>
      states.flatMap((state) =>
        source.options.map((option) => setKnob(state, source, option.value)),
      ),
    [fixture],
  )
  return [fixture, ...product]
}

/**
 * THE ROSTER: which knobs this story offers a control for.
 *
 * Derived by asking `visibleKnobs` about every state the controls can reach,
 * rather than by re-deciding here what `visibleKnobs` already decides. That
 * matters for the gate: a knob shown only when `variant === 'band'` still
 * needs an arg while the fixture is `orbital`, or the control could never come
 * back — but a knob gated on something no control can change (an editorial
 * field the story does not offer) stays out, because the story genuinely
 * cannot reach it.
 *
 * `item`-surface knobs are the one exclusion. An item knob configures one
 * member of the block's array and its path names no single place on the block,
 * so there is nothing for a block-level control to set. #113 needs an
 * item-level story surface the first time a block declares one.
 *
 * Returned in spec order, which is the order an editor reads them in the form.
 */
export function rosterKnobs({
  spec,
  fixture,
  nested = false,
}: {
  spec: BlockKnobs
  fixture: unknown
  nested?: boolean
}): Knob[] {
  const sources = spec.knobs.filter((k) => gateSourcePaths(spec.knobs).has(k.name))
  const reachable = new Set<string>()
  for (const state of reachableStates(fixture, sources)) {
    for (const { knob } of visibleKnobs({ spec, read: readFixture(state), nested }).all) {
      reachable.add(knob.name)
    }
  }
  return spec.knobs.filter((k) => k.surface !== 'item' && reachable.has(k.name))
}

/** What a knob's control offers and where its value lands. */
export interface KnobArgType {
  name: string
  description?: string
  control: 'select'
  options: string[]
  table: { category: string }
  /** Storybook's conditional-control gate, when the declared one maps onto it. */
  if?: StorybookCondition
}

export type StorybookCondition = { arg: string; eq?: string; neq?: string; truthy?: boolean }

/**
 * A declared `showWhen` as Storybook's `if`, so a gated control DISAPPEARS
 * from the panel the way the field disappears from the form.
 *
 * Storybook's condition is one arg against one value, which covers the gates
 * blocks actually write. A compound gate (`allOf`), a multi-value set, or a
 * gate on a path with no control returns `undefined` — the control stays
 * visible, and `applyKnobArgs` still refuses to let it write. That is the
 * split worth holding: `if` is the affordance and can be approximate;
 * `visibleKnobs` at render time is the guarantee and never is.
 */
export function storybookCondition(
  gate: ShowWhen | undefined,
  hasControl: (path: string) => boolean,
): StorybookCondition | undefined {
  if (!gate || gate.mode === 'allOf') return undefined
  if (!hasControl(gate.at)) return undefined
  const arg = knobId(gate.at)
  switch (gate.mode) {
    case 'present':
      return { arg, truthy: true }
    case 'oneOf':
      return gate.values.length === 1 ? { arg, eq: gate.values[0] as string } : undefined
    case 'notOneOf':
      return gate.values.length === 1 ? { arg, neq: gate.values[0] as string } : undefined
  }
}

/** The Storybook controls for one block, and the args they start at. */
export interface KnobControls {
  knobs: readonly Knob[]
  argTypes: Record<string, KnobArgType>
  args: Record<string, string>
  /** Storybook arg key → block-relative knob path. */
  idToPath: Record<string, string>
}

/**
 * Every control this story offers, derived from the block's knobs and nothing
 * else — which is the point of the ticket: a new knob appears in Storybook
 * because it exists, not because someone edited a story file.
 *
 * `FIXTURE_VALUE` is the default for most knobs: "leave the fixture's own
 * value alone", so a story renders its fixture until you turn something.
 *
 * A **gate source** is the exception and has no `(fixture)` option. A gate is a
 * question about a value and a sentinel is not one — leaving `variant` on
 * `(fixture)` would make `if: { arg: 'variant', eq: 'band' }` false even for a
 * fixture that IS a band, and hide a control that should be showing. So a knob
 * some other knob's gate reads starts at the value `resolveKnobValue` reads off
 * the fixture, which is the same value the Studio form would be sitting on. A
 * gate source that resolves to nothing at all keeps the sentinel; there is no
 * value to pin it to.
 */
export function knobControls({
  spec,
  fixture,
  nested = false,
  category = 'Knobs',
}: {
  spec: BlockKnobs
  fixture: unknown
  nested?: boolean
  category?: string
}): KnobControls {
  const knobs = rosterKnobs({ spec, fixture, nested })
  const controlled = new Set(knobs.map((k) => k.name))
  const sources = gateSourcePaths(spec.knobs)
  const read = readFixture(fixture)

  const argTypes: Record<string, KnobArgType> = {}
  const args: Record<string, string> = {}
  const idToPath: Record<string, string> = {}

  for (const knob of knobs) {
    const id = knobId(knob.name)
    const values = knob.options.map((option) => option.value)
    const pinned = sources.has(knob.name)
      ? resolveKnobValue(knob, read(knob.name)).value
      : undefined
    const condition = storybookCondition(knob.showWhen, (path) => controlled.has(path))

    idToPath[id] = knob.name
    args[id] = pinned ?? FIXTURE_VALUE
    argTypes[id] = {
      name: knob.title,
      ...(knob.description ? { description: knob.description } : {}),
      control: 'select',
      options: pinned ? values : [FIXTURE_VALUE, ...values],
      table: { category },
      ...(condition ? { if: condition } : {}),
    }
  }

  return { knobs, argTypes, args, idToPath }
}

/**
 * THE GUARANTEE: a Storybook control cannot set a field the form hides.
 *
 * Two passes, because visibility depends on the very values being applied. The
 * first builds the state the editor asked for; `visibleKnobs` answers what is
 * offered under it; the second applies only those. A knob the answer excludes
 * is dropped, whatever its control says — which is the dead-control failure
 * ADR 0020 exists to prevent, closed on the Storybook side too.
 */
export function applyKnobArgs<T>({
  spec,
  fixture,
  args,
  idToPath,
  nested = false,
}: {
  spec: BlockKnobs
  fixture: T
  args: Record<string, unknown>
  idToPath: Record<string, string>
  nested?: boolean
}): T {
  // Storybook hands back the OPTION KEY, always a string. The fixture has to
  // carry what the document would — `columns` is `1 | 2 | 3`, not `'1'` — or a
  // derived story renders props the renderer is not typed for (#123).
  // `setAtPath<T>(…, value: unknown): T` erases that mismatch, so nothing would
  // have caught it at compile time.
  args = convertArgs(spec, args, idToPath)
  const candidate = applyKnobs(fixture, args, idToPath)
  const visible = new Set(
    visibleKnobs({ spec, read: readFixture(candidate), nested }).all.map((r) => r.knob.name),
  )
  const gated = Object.fromEntries(Object.entries(idToPath).filter(([, path]) => visible.has(path)))
  return applyKnobs(fixture, args, gated)
}

/** The two knobs a Matrix story grids against each other. */
export interface MatrixAxes {
  rows?: Knob
  cols?: Knob
}

/**
 * WHICH KNOBS THE MATRIX GRIDS, by default the first two the block declares
 * that offer a choice — for the hero, `variant` against `decoration`.
 *
 * Spec order rather than anything cleverer, because spec order is already the
 * order an editor meets the knobs in the form, and a block that wants a
 * different pair says so by name rather than by reordering its declaration.
 */
export function matrixAxes({
  knobs,
  matrix,
}: {
  knobs: readonly Knob[]
  matrix?: { rows?: string; cols?: string }
}): MatrixAxes {
  const pick = (path: string): Knob => {
    const found = knobs.find((k) => k.name === path)
    if (!found) {
      throw new Error(
        `defineKnobStories: matrix axis "${path}" is not a knob this story offers a control for ` +
          `(offered: ${knobs.map((k) => k.name).join(', ') || 'none'}).`,
      )
    }
    return found
  }
  if (matrix?.rows || matrix?.cols) {
    return {
      ...(matrix.rows ? { rows: pick(matrix.rows) } : {}),
      ...(matrix.cols ? { cols: pick(matrix.cols) } : {}),
    }
  }
  const [rows, cols] = knobs.filter((k) => k.options.length > 1)
  return { ...(rows ? { rows } : {}), ...(cols ? { cols } : {}) }
}

/** One rendered square of the Matrix: a labelled document state. */
export interface MatrixCell<T> {
  key: string
  label: string
  data: T
}

/**
 * The Matrix's cells, gates included.
 *
 * A row whose value hides the column knob collapses to a single cell rather
 * than repeating the same render once per column value — the grid shows the
 * gate instead of papering over it.
 */
export function matrixCells<T>({
  spec,
  fixture,
  axes,
  nested = false,
}: {
  spec: BlockKnobs
  fixture: T
  axes: MatrixAxes
  nested?: boolean
}): MatrixCell<T>[] {
  const { rows, cols } = axes
  if (!rows) return []
  const cells: MatrixCell<T>[] = []

  for (const rowOption of rows.options) {
    const rowState = setKnob(fixture, rows, rowOption.value)
    const rowLabel = `${rows.title}: ${rowOption.title}`
    const visible = new Set(
      visibleKnobs({ spec, read: readFixture(rowState), nested }).all.map((r) => r.knob.name),
    )
    if (!cols || !visible.has(cols.name)) {
      cells.push({ key: rowOption.value, label: rowLabel, data: rowState })
      continue
    }
    for (const colOption of cols.options) {
      cells.push({
        key: `${rowOption.value}·${colOption.value}`,
        label: `${rowLabel} · ${cols.title}: ${colOption.title}`,
        data: setKnob(rowState, cols, colOption.value),
      })
    }
  }

  return cells
}

import type { NodePatch } from '@sanity/mutate'

import { parseGroqPath } from './groqPath'

/**
 * WRITING ONE KNOB VALUE INTO THE DRAFT.
 *
 * `knobPatch('sections[_key=="a"]', 'media.ratio', 'wide')` →
 *
 *     { path: ['sections', {_key:'a'}, 'media'],            op: {type:'setIfMissing', value:{}} }
 *     { path: ['sections', {_key:'a'}, 'media', 'ratio'],   op: {type:'set', value:'wide'} }
 *
 * **THE PARENT GUARDS ARE THE WHOLE FIX, not defensive padding.** A bare `set`
 * at `…media.ratio` against a block with no `media` object does not create the
 * parent. The mutation applies to nothing, the block comes back byte-identical,
 * and the editor picks a value while the page does not change. Worse, the
 * failed apply can drive the document's mutator actor into its final state,
 * after which EVERY later edit to that document is dropped with "Event 'mutate'
 * was sent to stopped actor" — which reads as "the toolbar stopped working
 * entirely" and only a reload clears it. So every intermediate object on the
 * way to the field gets a `setIfMissing({})` first.
 *
 * Only the RELATIVE path is guarded. The block is the thing the pointer is on,
 * so it and its array exist by construction; a `setIfMissing({})` at a keyed
 * array item would be a guard for a state that cannot happen, aimed at a path
 * shape that does not take one. A top-level knob (`variant`) therefore emits
 * exactly one patch.
 *
 * WHY THE PATCH OBJECTS ARE BUILT AND NOT `at(path, set(v))`. `@sanity/mutate`
 * is a TYPE-ONLY dependency of this package (#108) and this keeps it that way —
 * the preview bundle gains nothing from a second copy of a path parser we
 * already have. `at()` also parses its string argument through a type-level
 * grammar that only resolves for a literal; every path here is assembled at
 * runtime, so the parse would happen at runtime anyway with the types looking
 * on. `parseGroqPath` is ours, it is tested, and the segments it emits (`string
 * | {_key}`) are exactly `@sanity/mutate`'s `PathElement`.
 */
export function knobPatch(
  blockPath: string,
  relPath: string,
  /**
   * What to STORE, already converted from the option key — `storedValue(knob,
   * option)` in `@o3/block-spec`. Deliberately not a bare `string`: that
   * signature is what let a numeric knob write `'2'` into a `type: 'number'`
   * field, silently, because nothing downstream typechecks a mutation (#123).
   * This function cannot do the conversion itself — it never sees the knob —
   * so the type is the reminder that somebody upstream must have.
   */
  value: string | number,
): NodePatch[] {
  const root = parseGroqPath(blockPath)
  if (root.length === 0) {
    // An unparseable block path would silently become a patch at the DOCUMENT
    // root — `set` at `variant` on the page itself. Refuse instead.
    throw new Error(`knobPatch: "${blockPath}" is not a resolvable block path.`)
  }

  const segments = relPath.split('.')
  if (segments.some((segment) => segment === '')) {
    // The empty relative path would `set` a string over the whole block, which
    // is not a failed edit but a destroyed one. There is no degraded answer
    // here worth returning, so this throws where a knob with no name is
    // declared rather than writing something.
    throw new Error(`knobPatch: "${relPath}" is not a field path relative to a block.`)
  }

  // Every intermediate object, outermost first — `a.b.c` guards `a` then `a.b`.
  const guards: NodePatch[] = segments.slice(0, -1).map((_, index) => ({
    path: [...root, ...segments.slice(0, index + 1)],
    op: { type: 'setIfMissing', value: {} },
  }))

  return [...guards, { path: [...root, ...segments], op: { type: 'set', value } }]
}

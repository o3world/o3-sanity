import type { ObjectKnobs } from '@o3/block-spec'

import { enclosingPaths } from './groqPath'

/**
 * WHICH INSTANCE THE CURSOR IS IN — the fourth knob root the canvas reaches
 * (#145, ADR 0023).
 *
 * A shared object declares its knobs once, keyed by its own type name, and
 * every placement of it exposes that declaration. Reaching one is the part the
 * other three roots do not need: a band and an item are recognisable from the
 * hovered path alone (`canvasSubject` is a pure function of it), but an
 * instance is not. `mark` is a field name on four blocks and a keyed member in
 * a layout column; neither spelling says "this is a mark". Only the stored
 * `_type` does.
 *
 * So resolution walks **outward from the hovered element to the nearest
 * enclosing object that has a declaration**, asking the draft snapshot for
 * `_type` at each step. That is why this is not in `subject.ts` and why the
 * overlay resolver cannot answer it: the resolver has the path and no document,
 * and the toolbar one level down has both.
 *
 * NEAREST, and the floor is the block. Stopping at the innermost match is what
 * "nearest enclosing" means; stopping above the block is what keeps a shared
 * object that doubles as a base block from answering for the band it stands in.
 */
export interface CanvasInstance {
  /**
   * The instance's own GROQ path — the ROOT every one of its knobs is relative
   * to, and what `knobPatch` takes. Handing it the block path instead is the
   * silent write ADR 0021 was filed for, one root over.
   */
  path: string
  spec: ObjectKnobs
}

export function nearestInstance({
  path,
  blockPath,
  typeAt,
  objectKnobs,
}: {
  /** The hovered element's own GROQ path. */
  path: string
  /** The enclosing block — the floor, and never itself an instance. */
  blockPath: string
  /** `_type` at a path in the draft snapshot. Undefined until it settles. */
  typeAt: (path: string) => unknown
  /**
   * Every shared object that declares design options, keyed by type name — the
   * site's own registry, handed in for the reason `blockKnobs` is (ADR 0020).
   */
  objectKnobs: Readonly<Record<string, ObjectKnobs>>
}): CanvasInstance | undefined {
  for (const candidate of enclosingPaths(path, blockPath)) {
    const type = typeAt(candidate)
    if (typeof type !== 'string') continue
    // Own-property guarded: the key is a `_type` read out of a document, so an
    // object stored as `constructor` would otherwise resolve to something off
    // `Object.prototype` and hand a function to a caller expecting a spec.
    if (!Object.prototype.hasOwnProperty.call(objectKnobs, type)) continue
    return { path: candidate, spec: objectKnobs[type] as ObjectKnobs }
  }
  return undefined
}

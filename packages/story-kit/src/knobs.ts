/** Sentinel select-option meaning "use the fixture's own value for this knob". */
export const FIXTURE_VALUE = '(fixture)'

export function getAtPath(obj: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (acc, key) =>
        acc != null && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined,
      obj,
    )
}

/**
 * A shallow copy that stays the shape it was.
 *
 * An array spread as an object becomes `{0: …, 1: …}` — same keys, no `map`,
 * no `length` — and a renderer handed one draws nothing while the state looks
 * right in a devtools panel. It matters since an item knob writes through an
 * array index (`screens.0.tone`, #122).
 */
function shallowCopy(node: unknown): Record<string, unknown> {
  if (Array.isArray(node)) return [...node] as unknown as Record<string, unknown>
  return node != null && typeof node === 'object' ? { ...(node as object) } : {}
}

/** Immutable deep-set along a dot path; clones only the touched spine. */
export function setAtPath<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.')
  const clone = shallowCopy(obj)
  let cursor = clone
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i] as string
    cursor[key] = shallowCopy(cursor[key])
    cursor = cursor[key] as Record<string, unknown>
  }
  cursor[keys[keys.length - 1] as string] = value
  return clone as T
}

/** Storybook arg keys must not contain dots (dots imply nested args in URL serialization). */
export function knobId(path: string): string {
  return path.replace(/\./g, '_')
}

export function applyKnobs<T>(
  base: T,
  args: Record<string, unknown>,
  knobIdToPath: Record<string, string>,
): T {
  return Object.entries(knobIdToPath).reduce<T>((acc, [id, path]) => {
    const value = args[id]
    if (value === undefined || value === FIXTURE_VALUE) return acc
    return setAtPath(acc, path, value)
  }, base)
}

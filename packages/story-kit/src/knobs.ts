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

/** Immutable deep-set along a dot path; clones only the touched spine. */
export function setAtPath<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.')
  const clone: Record<string, unknown> = { ...(obj as Record<string, unknown>) }
  let cursor = clone
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i] as string
    const next = cursor[key]
    cursor[key] = next != null && typeof next === 'object' ? { ...(next as object) } : {}
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

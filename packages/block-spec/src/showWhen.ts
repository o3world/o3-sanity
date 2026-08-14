import type { KnobReader, LeafShowWhen, ShowWhen } from './types'

/**
 * The empty set every mode agrees on. Sanity stores an unfilled string as
 * `undefined` on a fresh document and as `''` on one an editor cleared, and an
 * emptied array as `[]` — three spellings of "the editor gave us nothing",
 * which a gate must not tell apart.
 */
function isEmpty(value: unknown, extra: readonly string[] = []): boolean {
  if (value === undefined || value === null || value === '') return true
  if (Array.isArray(value)) return value.length === 0
  return typeof value === 'string' && extra.includes(value)
}

/**
 * A stored value as an option key. Numbers and booleans coerce because a
 * closed enum of numbers (`columns: 1 | 2 | 3`) is stored as a number and
 * declared as strings — everything downstream of a knob is a string. Anything
 * else (an object, an array) matches nothing rather than stringifying into a
 * value that could collide.
 */
export function optionKey(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return undefined
}

function leafSatisfied(gate: LeafShowWhen, read: KnobReader): boolean {
  const value = read(gate.at)
  switch (gate.mode) {
    case 'present':
      return !isEmpty(value, gate.emptyValues)
    case 'oneOf': {
      if (isEmpty(value)) return gate.emptyMatches ?? false
      const key = optionKey(value)
      return key !== undefined && gate.values.includes(key)
    }
    case 'notOneOf': {
      if (isEmpty(value)) return true
      const key = optionKey(value)
      return key === undefined || !gate.values.includes(key)
    }
  }
}

/**
 * Does the document satisfy this gate? An absent gate is satisfied — a knob
 * with nothing to say about its visibility is always visible.
 */
export function showWhenSatisfied(gate: ShowWhen | undefined, read: KnobReader): boolean {
  if (!gate) return true
  if (gate.mode === 'allOf') return gate.all.every((leaf) => leafSatisfied(leaf, read))
  return leafSatisfied(gate, read)
}

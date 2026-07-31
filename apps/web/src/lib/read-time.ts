/**
 * Read time computed at render, not stored (schema spec). Walks a Portable
 * Text array and counts words in text spans; 200 wpm, floor of 1 minute.
 */
export function readTimeMinutes(body: unknown): number {
  if (!Array.isArray(body)) return 1
  let words = 0
  for (const block of body) {
    if (!block || typeof block !== 'object') continue
    const children = (block as { children?: unknown }).children
    if (!Array.isArray(children)) continue
    for (const child of children) {
      const text = (child as { text?: unknown })?.text
      if (typeof text === 'string') {
        words += text.split(/\s+/).filter(Boolean).length
      }
    }
  }
  return Math.max(1, Math.round(words / 200))
}

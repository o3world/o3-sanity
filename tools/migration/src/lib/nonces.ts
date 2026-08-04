/**
 * Values WordPress regenerates on every render, normalized away at extract.
 *
 * These are not content. Gravity Forms emits an encrypted `gform_currency`
 * hidden input whose ciphertext changes per request — same length, same
 * meaning, different bytes. Two extracts run minutes apart on 2026-08-04
 * differed in 361 files: 360 by `_meta.extractedAt` alone, and one by exactly
 * this value. With the timestamp moved to `_manifest.json`, that single field
 * was the only thing standing between the snapshot and a clean diff.
 *
 * The point is not tidiness. `data/extract/` is the committed record of what
 * WordPress said, and `translated.test.ts` sha256s it to prove a translation
 * still matches its source. A field that changes on its own turns both of
 * those into noise generators — the hash fails for a reason no reviewer can
 * act on, and a real content change hides inside 361 meaningless diffs.
 *
 * Add a rule here only for something genuinely per-render. If a value changes
 * because WordPress changed, that is the diff doing its job.
 */

const PLACEHOLDER = '__O3_MIGRATION_RENDER_NONCE__'

interface NonceRule {
  /** What it is, for the reader of a diff that still shows the placeholder. */
  readonly what: string
  readonly apply: (html: string) => string
}

const RULES: readonly NonceRule[] = [
  {
    what: "Gravity Forms' encrypted gform_currency hidden input",
    // Match the whole input tag, then replace only its value attribute, so
    // attribute order does not matter and no neighbouring input is touched.
    apply: (html) =>
      html.replace(/<input\b[^>]*\bgform_currency\b[^>]*>/g, (tag) =>
        tag.replace(/(\bvalue=(["']))(?:(?!\2).)*\2/g, `$1${PLACEHOLDER}$2`),
      ),
  },
]

function normalizeString(value: string): string {
  // Cheap bail-out: the rules only ever fire on form markup.
  if (!value.includes('gform_')) return value
  return RULES.reduce((html, rule) => rule.apply(html), value)
}

/** Walk any extracted value, normalizing per-render nonces in every string. */
export function stripRenderNonces<T>(value: T): T {
  if (typeof value === 'string') return normalizeString(value) as T
  if (Array.isArray(value)) return value.map(stripRenderNonces) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, stripRenderNonces(v)]),
    ) as T
  }
  return value
}

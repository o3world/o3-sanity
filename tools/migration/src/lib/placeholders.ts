import { retainsPlaceholder } from '@o3/block-spec'
import { BLOCK_KNOBS } from '@o3/sanity/knobs'

/**
 * FINDING PLACEHOLDER SECTIONS IN THE DATASET (#112).
 *
 * A section inserted from the canvas arrives carrying its block's declared
 * placeholder — real content, safe to publish, and written by nobody. This is
 * how one is found again, and it reuses the `provisional` vocabulary rather
 * than inventing a second one: `verify` prints what this returns beside the
 * documents that declare `migration.provisional`, under the same "not
 * authoritative, clear before launch" claim, because it is the same claim about
 * a smaller thing.
 *
 * **The declaration is the fingerprint, and there is no marker field.** A
 * marker would have meant a schema change on all sixteen blocks — a field in
 * the form, in `generated.ts`, in every renderer's props — to record something
 * the content already says. It would also have gone stale in the one direction
 * that matters: an editor who writes the section is done with it, and nothing
 * would have cleared the flag.
 *
 * So the test is whether the item still holds, verbatim, everything its
 * placeholder declared (`retainsPlaceholder` — a subset match, keys ignored).
 * **An edited placeholder is content** and stops being reported, which is the
 * right answer: someone looked at it and made it theirs. What this finds is the
 * block nobody came back to.
 */

type AnyDoc = { _id: string; _type: string; [key: string]: unknown }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * One line per unwritten placeholder — the document, the block, and where it
 * sits — in the shape `verify`'s other reports use.
 *
 * The walk is over the whole document rather than over a list of known block
 * arrays, because a block can sit anywhere a schema puts one and this is a
 * report rather than a gate: missing one is worse than walking a few fields
 * that could never hold a section.
 */
export function untouchedPlaceholders(docs: readonly AnyDoc[]): string[] {
  const lines: string[] = []

  const walk = (node: unknown, doc: AnyDoc, path: string): void => {
    if (Array.isArray(node)) {
      node.forEach((entry, index) => walk(entry, doc, `${path}[${index}]`))
      return
    }
    if (!isRecord(node)) return

    const type = node._type
    if (typeof type === 'string' && Object.prototype.hasOwnProperty.call(BLOCK_KNOBS, type)) {
      const spec = BLOCK_KNOBS[type]!
      if (spec.placeholder && retainsPlaceholder(node, spec.placeholder)) {
        lines.push(`${doc._id} — ${type} at ${path}`)
        // No descent: a block inside an untouched placeholder is part of the
        // same unwritten thing, and reporting it twice says nothing new.
        return
      }
    }

    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('_')) continue
      walk(child, doc, path === '' ? key : `${path}.${key}`)
    }
  }

  for (const doc of docs) walk(doc, doc, '')
  return lines
}

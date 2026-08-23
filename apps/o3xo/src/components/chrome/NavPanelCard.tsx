import Link from 'next/link'

import { cn } from '@o3/ui'
import { resolveButtonHref } from '@o3/content-ui'

import type { NavGroupItem } from './navItems'

/**
 * One card in a dropdown panel — an eyebrow, a title, and the line that says
 * what is behind it.
 *
 * **Read off the live site, because the kit draws no panel.** The _O3XO: UI
 * kit_'s `Navigation` (`4404:4146`) is an HTML import of the collapsed bar: it
 * carries the caret on Industries, Case studies and About and stops there. So
 * o3xo.ai is the record for everything under it (ADR 0028, second addendum),
 * read on 2026-08-19 from the opened panels:
 *
 * | Part    | Live value                              | Here                       |
 * | ------- | --------------------------------------- | -------------------------- |
 * | Card    | `rgba(255,255,255,0.06)`, radius 12, 24 | `bg-white/5`, `rounded-xl` |
 * | Eyebrow | 14 / 400, `#BFBFBF`, set in caps        | `text-meta uppercase`      |
 * | Title   | 16 / 700, white                         | `text-body font-bold`      |
 * | Excerpt | 14 / 400, `#BFBFBF`                     | `text-meta`                |
 *
 * `#BFBFBF` is white at 75%, which no role sits at; `on-ink-muted` (65%) is the
 * nearest the palette names and is what a quiet line on this chrome is for, so
 * the two quiet lines take it rather than adding a fourth white alpha. The
 * 6% card fill rounds to `white/5` for the same reason — the kit's own
 * overlays are 5% and 20% (`tokens/color.css`).
 *
 * The caps are the renderer's: what is stored is the eyebrow in sentence case,
 * the way every other eyebrow in the model is.
 */
export function NavPanelCard({ item, className }: { item: NavGroupItem; className?: string }) {
  const { button, eyebrow, excerpt } = item
  if (!button?.label) return null

  return (
    <Link
      href={resolveButtonHref(button)}
      className={cn(
        'group/card focus-visible:ring-accent duration-(--duration-hover) flex flex-col gap-2 rounded-xl bg-white/5 p-6 transition-colors ease-out hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2',
        className,
      )}
    >
      {eyebrow ? (
        <span className="text-meta text-on-ink-muted uppercase tracking-[0.06em]">{eyebrow}</span>
      ) : null}
      <span className="text-body font-bold leading-tight text-white">{button.label}</span>
      {excerpt ? <span className="text-meta text-on-ink-muted">{excerpt}</span> : null}
    </Link>
  )
}

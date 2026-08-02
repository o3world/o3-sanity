import type { ReactNode } from 'react'

import { cn } from '../lib/utils'

export interface ArticleBylineProps {
  /** The author's real-world name — "Jay Forbes". */
  name?: string | null
  /** Their role. Joins the name with a comma on the first line. */
  role?: string | null
  /** The quieter second line — "Jun 2026 · 6 min read". */
  meta?: ReactNode
  /**
   * The 42px portrait. Omit it and the disc falls back to the author's
   * initial, which is what the frame itself draws.
   */
  headshot?: ReactNode
  className?: string
}

/** "Jay Forbes" → "J". Empty for an unnamed author, which drops the disc. */
function initial(name: string | null | undefined): string {
  return (name ?? '').trim().charAt(0).toUpperCase()
}

/**
 * The article byline — the perspective hero's author line (`1710:2946`), #45.
 *
 * ```
 * row, 12px above, gap 13, centre
 *   disc   42×42 round, brand red, the initial at 15px/500 white
 *   text   14px/21px
 *     name  "Jay Forbes, Director of Engineering"   white 75%
 *     meta  "Jun 2026 · 6 min read"                 white 45%
 * ```
 *
 * **The disc is a fallback the frame happens to be showing.** Its "J" belongs
 * to Jay Forbes, who is a real migrated `person` carrying a real headshot — so
 * the monogram is what an author without one gets, not the design. Pass the
 * portrait as `headshot` and it takes the disc's place at the same size.
 *
 * Ink-band only, so the two text tones are baked in rather than exposed as a
 * variant: both Insights frames draw this on `#0F100B` and nowhere else. The
 * 75%/45% pair is not on the token ramp (`on-ink` is 92%, `on-ink-muted` 65%)
 * — it appears once, which per `@o3/tailwind-config` is composition, not
 * vocabulary.
 */
export function ArticleByline({ name, role, meta, headshot, className }: ArticleBylineProps) {
  const monogram = initial(name)
  const line = [name, role].filter(Boolean).join(', ')
  if (!line && !meta) return null

  return (
    <div className={cn('flex items-center gap-[13px] pt-3', className)}>
      {headshot ? (
        <div className="size-[42px] shrink-0 overflow-hidden rounded-full">{headshot}</div>
      ) : monogram ? (
        <div
          aria-hidden="true"
          className="bg-brand flex size-[42px] shrink-0 items-center justify-center rounded-full text-[15px] font-medium text-white"
        >
          {monogram}
        </div>
      ) : null}

      <div className="flex flex-col text-[14px] leading-[21px]">
        {line ? <span className="text-white/75">{line}</span> : null}
        {meta ? <span className="text-white/45">{meta}</span> : null}
      </div>
    </div>
  )
}

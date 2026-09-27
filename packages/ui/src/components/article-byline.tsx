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

/** Current Blog Hero attribution (I3739:73191;3378:9190). Portraits stay data-owned. */
export function ArticleByline({ name, role, meta, headshot, className }: ArticleBylineProps) {
  const monogram = initial(name)
  const line = [name, role].filter(Boolean).join(', ')
  if (!line && !meta) return null

  return (
    <div className={cn('flex items-center gap-3', className)}>
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

      <div className="flex flex-col gap-0.5 text-[14px] leading-5 text-white">
        {line ? <span>{line}</span> : null}
        {meta ? <span>{meta}</span> : null}
      </div>
    </div>
  )
}

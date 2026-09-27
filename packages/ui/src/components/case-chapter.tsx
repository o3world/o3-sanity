import type { ReactNode } from 'react'

import { cn } from '../lib/utils'
import { Eyebrow } from './eyebrow'
import { RevealSequence } from './reveal-sequence'

export interface CaseChapterDetail {
  /**
   * A stable identity for the row — Sanity's array-member `_key` when the
   * caller has one. Optional so a hand-built fixture (a story) can leave it
   * out; the list falls back to the index there, which is safe because a
   * literal array never reorders.
   */
  key?: string
  /** The term in the fixed left column ("Strategy", "Design", "Research"). */
  label: ReactNode
  /** The description beside it. */
  body?: ReactNode
}

export interface CaseChapterProps {
  /**
   * The chapter's position, already formatted ("01"). Derived from array
   * order by the caller — chapters are not numbered in the content.
   */
  number?: string
  /** The label after the number ("Overview"). */
  kicker?: ReactNode
  title: ReactNode
  /** The chapter body — long-form prose, rendered by the caller. */
  children?: ReactNode
  /** Opt in to grouped chapter entry; static layout stays the default. */
  sequence?: boolean
  /** The hairline term/description rows under the body (`2274:4009`). */
  details?: readonly CaseChapterDetail[]
  className?: string
}

/** Current Case Study Text Block (3267:9701), with an 822px prose measure. */
export function CaseChapter({
  number,
  kicker,
  title,
  children,
  sequence = false,
  details,
  className,
}: CaseChapterProps) {
  const label = [number, kicker].filter(Boolean).join(' — ')
  const Group = sequence ? RevealSequence : 'div'
  const detailsList = details?.length ? (
    <dl data-reveal-step={sequence ? 'details' : undefined} className="flex flex-col lg:pt-6">
      {details.map((detail, index) => (
        <div
          key={detail.key ?? index}
          className="border-line flex flex-col gap-2 border-t py-6 first:border-t-0 lg:flex-row lg:gap-6"
        >
          <dt className="text-fg-muted text-body lg:w-[180px] lg:shrink-0">{detail.label}</dt>
          <dd className="text-ink text-body flex-1">{detail.body}</dd>
        </div>
      ))}
    </dl>
  ) : null

  return (
    <section className={cn('px-gutter py-band-sm lg:py-band-md bg-white', className)}>
      <Group className="max-w-article mx-auto flex w-full flex-col gap-8 lg:gap-2">
        <div
          data-reveal-step={sequence ? 'heading' : undefined}
          className="flex flex-col gap-2 lg:gap-6"
        >
          {label ? <Eyebrow size="lg">{label}</Eyebrow> : null}
          <h2 className="font-display text-ink text-body-heading lg:text-display-xl text-balance">
            {title}
          </h2>
        </div>
        {children ? <div className="text-fg-body text-lead">{children}</div> : null}
        {detailsList && (sequence ? <RevealSequence>{detailsList}</RevealSequence> : detailsList)}
      </Group>
    </section>
  )
}

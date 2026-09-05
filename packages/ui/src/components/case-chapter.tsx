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

/**
 * One numbered chapter of a case study. Desktop overview `2274:4004` and
 * chapter `2230:3267` use 128px vertical padding and Heading/h2 (48/58 Light).
 * Mobile chapters `1906:878`, `1906:947`, `1906:990` retain 96px padding
 * and the unbound 40/48 Regular title. The desktop treatment starts at `lg`.
 *
 * The 822px article measure, body type, details and mobile spacing remain
 * independent of the heading correction (#440). `band-article` still serves
 * media bands; chapters use the existing `band-sm` / `band-md` steps.
 *
 * The kicker holds at the 18px section step at both widths, following ADR
 * 0006's rule that small UI text does not scale — the mobile frame's 16px is
 * the same 2px drift it shows on the "next project" kicker.
 *
 * **`details` is the frame's breakdown table** (`2274:4009`, #97): rows of a
 * term against its description, each opened by a 1px `border-line` rule, 24px
 * of padding, and a **180px** term column at desktop. Both halves are set at
 * `text-body` — the frame's Body/Small is 20/32, which is exactly that step —
 * and the term takes `fg-muted` against the description's ink, which is the
 * only thing separating them typographically. Below `lg` the pair stacks: 180
 * of a 362px column would leave a description four words wide.
 *
 * A `<dl>`, not a table: this is a term list, and the frame draws no header
 * row, no second column of data, and nothing to align across rows.
 */
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
    <dl data-reveal-step={sequence ? 'details' : undefined} className="flex flex-col">
      {details.map((detail, index) => (
        <div
          key={detail.key ?? index}
          className="border-line flex flex-col gap-2 border-t py-6 lg:flex-row lg:gap-6"
        >
          <dt className="text-fg-muted text-body lg:w-[180px] lg:shrink-0">{detail.label}</dt>
          <dd className="text-ink text-body flex-1">{detail.body}</dd>
        </div>
      ))}
    </dl>
  ) : null

  return (
    <section className={cn('px-gutter py-band-sm lg:py-band-md bg-white', className)}>
      <Group className="max-w-article mx-auto flex w-full flex-col gap-8 lg:gap-6">
        <div
          data-reveal-step={sequence ? 'heading' : undefined}
          className="flex flex-col gap-2 lg:gap-3"
        >
          {label ? <Eyebrow size="lg">{label}</Eyebrow> : null}
          <h2 className="font-display text-ink text-body-heading lg:text-display-xl text-balance">
            {title}
          </h2>
        </div>
        {children ? <div className="text-fg text-body">{children}</div> : null}
        {detailsList && (sequence ? <RevealSequence>{detailsList}</RevealSequence> : detailsList)}
      </Group>
    </section>
  )
}

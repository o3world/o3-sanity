import type { ReactNode } from 'react'

import { cn } from '../lib/utils'
import { Eyebrow } from './eyebrow'

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
  /** The hairline term/description rows under the body (`2274:4009`). */
  details?: readonly CaseChapterDetail[]
  className?: string
}

/**
 * One numbered chapter of a case study — the frame's repeating article band
 * (`1647:1714`, `1890:3864`, `1894:3892`; mobile `1906:878`, `1906:947`,
 * `1906:990`), #44.
 *
 * ```
 *          402                     1440
 * band     96px 20px               164px 0        white
 * column   full width, gap 32      822px, gap 24  centred
 *   head   gap 8                   gap 12
 *   kicker 16px uppercase #636363  18px #757575
 *   title  40px                    36px
 *   body   16px / 1.6 #232323      20px / 1.6
 * ```
 *
 * **822px is the article measure**, not `--container-content` (1034): the
 * frame reserves the wider column for centred statements like the pull quote
 * and drops to 822 for anything meant to be read as prose.
 *
 * Everything here sits on tokens: the band on `band-article` (164px at 1440,
 * 96px at 402 — between `band-md` and `band-lg`), the measure on
 * `--container-article`, and the type on `text-body-heading` / `text-body` —
 * the steps #45 minted from the same frame family (`1894:3912` is a chapter
 * heading). `body-heading` is the design's one descending step: 40px at 402,
 * 36px at 1440, where the chapter title sits deliberately below the 48px
 * page title.
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
  details,
  className,
}: CaseChapterProps) {
  const label = [number, kicker].filter(Boolean).join(' — ')

  return (
    <section className={cn('px-gutter py-band-article bg-white', className)}>
      <div className="max-w-article mx-auto flex w-full flex-col gap-8 lg:gap-6">
        <div className="flex flex-col gap-2 lg:gap-3">
          {label ? <Eyebrow size="lg">{label}</Eyebrow> : null}
          <h2 className="font-display text-ink text-body-heading text-balance">{title}</h2>
        </div>
        {children ? <div className="text-fg text-body">{children}</div> : null}
        {details?.length ? (
          <dl className="flex flex-col">
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
        ) : null}
      </div>
    </section>
  )
}

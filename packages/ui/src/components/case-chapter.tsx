import type { ReactNode } from 'react'

import { cn } from '../lib/utils'
import { Eyebrow } from './eyebrow'

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
 * One value is a call-site literal because it occurs only on this frame:
 * the **164px band**, solved to reach 96px at 402 the way every other
 * rhythm token is (it sits between `band-md` and `band-lg`, matching
 * neither).
 *
 * Title and body sit on `text-body-heading` / `text-body` — the tokens #45
 * minted from the same frame family (`1894:3912` is a chapter heading).
 * `body-heading` is the design's one descending step: 40px at 402, 36px at
 * 1440, where the chapter title sits deliberately below the 48px page title.
 *
 * The kicker holds at the 18px section step at both widths, following ADR
 * 0006's rule that small UI text does not scale — the mobile frame's 16px is
 * the same 2px drift it shows on the "next project" kicker.
 */
export function CaseChapter({ number, kicker, title, children, className }: CaseChapterProps) {
  const label = [number, kicker].filter(Boolean).join(' — ')

  return (
    <section
      className={cn('px-gutter bg-white py-[clamp(96px,calc(6.55vw+69.7px),164px)]', className)}
    >
      <div className="mx-auto flex w-full max-w-[822px] flex-col gap-8 lg:gap-6">
        <div className="flex flex-col gap-2 lg:gap-3">
          {label ? <Eyebrow size="lg">{label}</Eyebrow> : null}
          <h2 className="font-display text-ink text-body-heading text-balance">{title}</h2>
        </div>
        {children ? <div className="text-fg text-body">{children}</div> : null}
      </div>
    </section>
  )
}

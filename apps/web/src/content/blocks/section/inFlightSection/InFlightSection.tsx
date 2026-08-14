import Link from 'next/link'
import { stegaClean } from '@sanity/client/stega'

import { ArrowIcon, DisplayHeading, Eyebrow, SectionShell } from '@o3/ui'

import { Mark, markProps } from '@/content/blocks/base/mark/Mark'
import { SanityImage } from '@/content/SanityImage'
import { resolveCtaHref } from '@/content/CtaLink'
import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'
import { fieldAttr } from '@/sanity/dataAttribute'

type InFlightSectionProps = SectionProps<'inFlightSection'>
type Entry = NonNullable<InFlightSectionProps['entries']>[number]

/**
 * Section block: the three middle bands of the Live frame (`1644:1889`,
 * mobile `1906:334`) — #50.
 *
 * The page's own deck names them: "the work in the studio, the rooms we'll be
 * in, and the ideas we're chasing before they reach you". All three are the
 * same entry — a kicker, a title, and a lead — in two compositions:
 *
 * ```
 * cards  1751:1994   96px 0, gap 48, white       the studio band
 *   header  0 96px, space-between, align-end   48px heading | 24px deck in 395
 *   row     starts on the gutter, gap 32, runs off the right edge
 *     card  394.67 wide, gap 24   square image | 13px kicker · 24px title
 *
 * rows   1710:1800 / 1732:1409   128px 0        appearances · ideas
 *   header  0 96px, gap 32     48px heading | 24px deck in 394
 *   row     48px 0, space-between, 1px rule at rgba(0,0,0,0.55)
 *     lead  55px date column in brand red + a 9px dot, OR a 113px disc
 *     text  16px kicker at 45% ink · 36px title
 *     right Icon / Surface, the 58px circular arrow
 * ```
 *
 * **The cards are not case-study references.** See the schema comment: the
 * frame draws them anonymous and unlinked on purpose.
 *
 * Two reads of the 402 frame worth stating, because they are decisions rather
 * than transcription:
 *
 * - The mobile rows drop the disc and the dot (`1906:680`, `1906:584`) and
 *   collapse the date onto one line. That is composition, so it switches at
 *   `lg` — ADR 0006.
 * - The mobile rows also drop the **arrow control**, in both bands. This
 *   renderer keeps it, shrunk, at every width: a row whose only affordance
 *   disappears at 402 is a link nobody can see. ADR 0006 already takes that
 *   position for the two treatments the mobile frames drop, and like those it
 *   is a one-line revert (`hidden lg:flex` on the control).
 *
 * The control is `Icon / Surface` (`778:1862`), the same part `CarouselControl`
 * draws. It is inlined rather than shared because that component is a
 * `<button>` with prev/next semantics and this one is a link; if a third use
 * appears, that is the moment to lift the circle out of both.
 */
export function InFlightSection({
  heading,
  subheading,
  layout,
  entries,
  surface,
  loc,
}: InFlightSectionProps) {
  const items = entries ?? []
  const asRows = stegaClean(layout) === 'rows'
  const onInk = resolveSurface(surface, 'white') === 'ink'

  if (asRows) {
    return (
      <SectionShell surface={resolveSurface(surface, 'white')} top="md" bottom="md">
        <div className="flex flex-col gap-8 lg:gap-16">
          <Header heading={heading} subheading={subheading} loc={loc} />
          <ul className="flex flex-col">
            {items.map((entry) => (
              <EntryRow key={entry._key} entry={entry} onInk={onInk} />
            ))}
          </ul>
        </div>
      </SectionShell>
    )
  }

  return (
    // The frame runs the card row off the right edge (the same bleed the Home
    // Blog band draws), but the bleed is not kept — see the carousel's note:
    // on wide screens a gutter-only band outgrows the content column. The row
    // scrolls *inside* the standard 1248px shell, clipping at its edges, and
    // at the design width rests at exactly three cards. At 402 the frame
    // stacks the cards instead (`1906:347`), so the row only overflows
    // from `lg`.
    <SectionShell surface={resolveSurface(surface, 'white')} top="sm" bottom="sm">
      <div className="flex flex-col gap-8 lg:gap-12">
        <Header heading={heading} subheading={subheading} loc={loc} />
        {/*
         * `tabIndex={0}` + a name, because from `lg` this row is a scrollable
         * region whose contents are **not focusable** — the frame draws these
         * cards anonymous and unlinked on purpose, so there is not a single
         * link or button inside to tab to. A mouse can scroll it and a
         * keyboard could not reach it at all: axe's
         * `scrollable-region-focusable`, found the moment this band got a
         * story.
         *
         * The usual fix — "there are links inside, so it is already
         * reachable" — is unavailable here precisely because of the design
         * decision above. Making the container itself focusable is the
         * remaining honest answer; `aria-label` is what stops it announcing as
         * an unnamed stop on the way past. If the cards ever become links,
         * both attributes should come back off.
         *
         * `jsx-a11y/no-noninteractive-tabindex` disagrees, and it is disabled
         * here rather than worked around: the two rules are in genuine
         * tension, one reasoning from element semantics and the other from
         * what a keyboard can actually reach. A region a keyboard cannot
         * scroll is a real failure; a `<ul>` in the tab order is a lint
         * preference. The real behaviour wins.
         */}
        <ul
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- keyboard-scrollable region with no focusable content; see above
          tabIndex={0}
          aria-label={stegaClean(heading) ?? 'In flight'}
          className="focus-visible:ring-brand flex flex-col gap-8 focus-visible:outline-none focus-visible:ring-2 lg:snap-x lg:snap-mandatory lg:flex-row lg:overflow-x-auto lg:pb-2 lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden"
        >
          {items.map((entry) => (
            <li key={entry._key} className="lg:w-[394px] lg:shrink-0 lg:snap-start">
              <EntryCard entry={entry} />
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  )
}

function Header({
  heading,
  subheading,
  loc,
}: Pick<InFlightSectionProps, 'heading' | 'subheading' | 'loc'>) {
  return (
    <header
      data-sanity={fieldAttr(loc, 'heading')}
      className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-8"
    >
      {heading ? <DisplayHeading className="lg:max-w-[571px]">{heading}</DisplayHeading> : null}
      {subheading ? (
        <p className="text-lead leading-[1.2] lg:w-[395px] lg:shrink-0">{subheading}</p>
      ) : null}
    </header>
  )
}

/** The studio band's card — the Blog card's composition, with a kicker in place of the meta row. */
function EntryCard({ entry }: { entry: Entry }) {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="bg-bone relative isolate aspect-square overflow-hidden">
        <SanityImage
          source={entry.media?.image}
          alt={entry.media?.alt ?? ''}
          ratio="fill"
          width={800}
          sizes="(min-width: 1024px) 395px, 100vw"
          className="h-full w-full"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        {entry.eyebrow ? (
          <p className="text-meta text-fg-muted uppercase">{entry.eyebrow}</p>
        ) : null}
        <h3 className="text-fg text-[24px] leading-[1.2]">{entry.heading}</h3>
      </div>
    </div>
  )
}

function EntryRow({ entry, onInk }: { entry: Entry; onInk: boolean }) {
  const href = entry.cta ? resolveCtaHref(entry.cta) : null
  // `aria-label` is the one place a stega'd string is NOT invisible: the
  // encoding rides in the attribute value, so a screen reader announces the
  // whole payload. Every other label in this block is rendered text, where
  // the characters are zero-width.
  const label = stegaClean(entry.cta?.label) ?? null

  return (
    <li className="relative flex items-center justify-between gap-8 border-b border-[rgba(0,0,0,0.55)] py-6 lg:py-12 lg:first:pt-0">
      {/* The frame fixes the lead+copy group's measure, and the two bands
          disagree: 1015px on the appearances rows (`1710:1806`), 684px on the
          ideas rows (`1732:1416`, disc + copy). The cap is what wraps the
          ideas title at two lines; without it the 36px heading runs the row.
          At 402 the row is one stacked column at 8px (`1906:586`): the date
          sits above the kicker, not beside the copy. */}
      <div
        className={`flex flex-1 flex-col items-start gap-2 lg:flex-row lg:items-center lg:gap-8 ${
          entry.date ? 'lg:max-w-[1015px]' : 'lg:max-w-[684px]'
        }`}
      >
        {entry.date ? (
          <>
            <DateMarker date={entry.date} />
            {/* The 9px dot between the date and the copy (`1710:1908`); the
                402 row drops it along with the rest of the lead. */}
            <span
              aria-hidden
              className="bg-ink-deep hidden size-[9px] shrink-0 rounded-full lg:block"
            />
          </>
        ) : (
          // The 113px slot (`1899:4245`) — the same mark the About careers
          // band draws at a different diameter, not a second graphic.
          <Mark {...markProps(entry.mark)} onInk={onInk} className="hidden w-[113px] lg:block" />
        )}
        <div className="flex flex-col justify-center gap-2">
          {entry.eyebrow ? (
            // 16px at 45% ink on the appearances band, 60% on the ideas band.
            // One treatment for both: the difference is a hair of alpha
            // between two bands of one frame, which reads as authoring drift.
            <Eyebrow className="text-fg-quiet">{entry.eyebrow}</Eyebrow>
          ) : null}
          <DisplayHeading as="h3" level="lg" className="tracking-[-0.0222em]">
            {entry.heading}
          </DisplayHeading>
        </div>
      </div>

      {href && label ? (
        <Link
          href={href}
          aria-label={label}
          // Stretched over the whole row (the `relative` is on the <li>): the
          // frame's only affordance is the circle, but a 58px target for a
          // 36px headline is not one.
          className="bg-surface-muted duration-(--duration-hover) focus-visible:ring-brand flex size-11 shrink-0 items-center justify-center rounded-full transition-opacity ease-out after:absolute after:inset-0 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 lg:size-[58px]"
        >
          <span className="bg-surface-muted border-surface-muted text-ink flex size-[26px] items-center justify-center rounded-[4.3px] border-[1.45px] lg:size-[34.8px] lg:rounded-[5.8px]">
            <ArrowIcon size={20} />
          </span>
        </Link>
      ) : null}
    </li>
  )
}

/**
 * The red date marker: "OCT" over "15" in a 55px column at 1440
 * (`1710:1865`), collapsed to a single "OCT 15" at 402 (`1906:587`).
 *
 * Parsed from the ISO string rather than `Date`, and formatted in UTC — a
 * `date` field carries no time, so anything timezone-aware can render the day
 * before west of Greenwich.
 */
function DateMarker({ date }: { date: string }) {
  const parsed = new Date(`${stegaClean(date)}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return null
  const month = parsed.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
  const day = parsed.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' })

  return (
    <p className="text-brand flex shrink-0 items-baseline gap-1.5 text-[24px] font-medium tracking-[-0.0333em] lg:w-[55px] lg:flex-col lg:items-center lg:gap-0">
      <span className="uppercase">{month}</span>
      <span className="lg:text-[56px] lg:leading-[50px] lg:tracking-[-0.0143em]">{day}</span>
    </p>
  )
}

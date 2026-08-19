import Link from 'next/link'

import { ArrowIcon, buttonVariants, Eyebrow } from '@o3/ui'
import { hrefForDoc } from '@o3/content-runtime/urls'
import type { SectionProps } from '@o3/content-runtime/blocks'

import { LogoKnockout } from '../LogoKnockout'
import { SanityImage } from '../SanityImage'

/**
 * The case-study card shape — the `CASE_STUDY_CARD` projection, pinned to
 * the caseShowcaseSection's dereferenced references.
 */
export type CaseStudyCardData = NonNullable<
  SectionProps<'caseShowcaseSection'>['caseStudies']
>[number]

/** Eyebrow first half: industry titles; second half: the industryDetail string. */
function caseEyebrow(card: Pick<CaseStudyCardData, 'industries' | 'industryDetail'>): string {
  const industries = (card.industries ?? []).map((industry) => industry.title).filter(Boolean)
  return [...industries, card.industryDetail].filter(Boolean).join(' · ')
}

/**
 * The case-study card, built to the Home frame's card (`1883:3555`) — #42.
 * The **same geometry** carries the Work index grid (#43), which is why it
 * lives on the card rather than inside either section.
 *
 * ```
 * 1248 × 556        padding 72px 72px 88px, content pinned via space-between
 *   background      the hero image, cover
 *   scrim           --gradient-card-scrim — 90deg, 0.8 ink → 0 by 84%
 *   top             the client logo, 185px wide, knocked out WHITE (1883:3556)
 *   bottom  gap 24  eyebrow 16px + narrative 28px in a 472px measure
 *                   stat 48px beside its label at 65% white, 24px apart
 *                   Button / Solid Size=Base, white fill
 * ```
 *
 * Nothing here is a text-beside-thumbnail card: the photograph **is** the
 * card, the scrim holds the left column legible, and the copy sits on the
 * floor. The pre-#42 version split it into a copy column and an image panel,
 * which is a different composition entirely.
 *
 * The trailing CTA is a styled `<span>`, not a `Button` — the whole card is
 * already the anchor, and a nested control would be a second tab stop to the
 * same href.
 */
export function CaseStudyCard(card: CaseStudyCardData) {
  const { _type, title, slug, narrativeHeadline, headlineStat, heroMedia, client } = card
  const eyebrow = caseEyebrow(card)

  return (
    <Link
      href={hrefForDoc({ _type, slug })}
      // 362 square at 402 with 32px padding (`1925:5734`); 1248 × 556 with
      // `72px 72px 88px` at 1440 (`1883:3555`). Both are FLOORS, not fixed
      // heights: the frame's demo narrative is two lines and a real one runs
      // to five, and a hard 362 clips the client logo off the top rather than
      // letting the card grow.
      //
      // `gap-6` is the floor `justify-between` doesn't give you. Once the copy
      // fills the card there is no free space left to distribute, and the
      // client mark ends up sitting directly on the eyebrow — 7 of the 9 cards
      // on /work measured a 0px separation at 402, and two of them at 1440. A
      // gap costs nothing on a card that still has slack (space-between hands
      // out the surplus either way) and holds the two groups apart on one that
      // doesn't.
      className="rounded-card group relative isolate flex min-h-[362px] flex-col justify-between gap-6 overflow-hidden p-8 text-white lg:min-h-[556px] lg:p-[72px] lg:pb-[88px]"
    >
      <div className="absolute inset-0 -z-20">
        <SanityImage
          source={heroMedia?.image}
          alt=""
          ratio="fill"
          width={1600}
          sizes="(min-width: 1024px) 1248px, 100vw"
          // Any ink laid over a photograph costs it chroma as well as
          // luminance, so the scrim reads as desaturation even where it is
          // only dimming. A tenth of saturation back is the compensation, not
          // a grade: it is sized to the scrim, and the image under no scrim at
          // all (`NextCaseBand`) deliberately doesn't carry it.
          className="duration-(--duration-reveal) saturate-110 h-full w-full transition-transform ease-out group-hover:scale-[1.03]"
        />
      </div>
      {/*
       * Two different treatments, both read rather than derived. At 1440 the
       * card is 1248 × 556 and the copy occupies a left column, so the frame
       * holds it legible with the 90° `--gradient-card-scrim` (`1883:3555`).
       * At 402 the card is a **362 square** and the copy spans it, so a
       * horizontal scrim would leave the end of every line on open
       * photograph — `1925:5734` answers that with a flat wash over the image.
       *
       * This is the responsive contract working as ADR 0006 describes it: the
       * frames are endpoints, and here they differ in kind, not in degree.
       *
       * Both tokens are retuned away from the frame's literal values, which
       * are heavy enough to read as a black-and-white treatment on real hero
       * photography — the reasoning is at the tokens in gradient.css, and the
       * departure is recorded in `drift`.
       */}
      <div className="bg-(image:--gradient-card-scrim-stacked) lg:bg-(image:--gradient-card-scrim) absolute inset-0 -z-10" />

      {/*
       * The knockout is a masked fill, so its separation from the photograph
       * is a drop-shadow rather than a text-shadow — `filter` follows the mask
       * alpha, and the logo has no glyphs to shadow. Same job as the shadow on
       * the copy below: it is what lets the scrim stay a wash. Invisible over
       * the ink the scrim actually lays down, and the whole reason a bright
       * patch of sky behind a logo doesn't have to be paid for in ink.
       */}
      {client?.logo ? (
        <LogoKnockout
          source={client.logo}
          alt={client.name}
          width={185}
          height={40}
          className="drop-shadow-[0_1px_10px_rgba(3,3,3,0.55)]"
        />
      ) : (
        <span className="eyebrow font-bold [text-shadow:0_1px_12px_rgba(3,3,3,0.5)]">
          {client?.name}
        </span>
      )}

      <div className="flex flex-col items-start gap-6">
        {/*
         * Targeted insurance in place of blanket ink. The scrim is sized for
         * the photography these cards actually carry; this shadow is what
         * covers the case it is NOT sized for — a blown-out highlight landing
         * under a line — without darkening the other 95% of the image to pay
         * for it. It reads as nothing over the scrim's ink and does not touch
         * the CTA, whose dark label sits on a white plate.
         */}
        <div className="flex flex-col gap-3 [text-shadow:0_1px_12px_rgba(3,3,3,0.5)]">
          {eyebrow ? <Eyebrow tone="inverse">{eyebrow}</Eyebrow> : null}
          <h3 className="text-display-md font-display max-w-[472px] text-balance">
            {narrativeHeadline ?? title}
          </h3>
        </div>

        {headlineStat?.value ? (
          <p className="flex items-center gap-6 [text-shadow:0_1px_12px_rgba(3,3,3,0.5)]">
            <span className="text-display-xl font-display tracking-[-0.0208em]">
              {headlineStat.value}
            </span>
            {headlineStat.label ? (
              <span className="text-on-ink-muted text-base">{headlineStat.label}</span>
            ) : null}
          </p>
        ) : null}

        <span className={buttonVariants({ variant: 'light', size: 'base' })}>
          View our work
          <ArrowIcon />
        </span>
      </div>
    </Link>
  )
}

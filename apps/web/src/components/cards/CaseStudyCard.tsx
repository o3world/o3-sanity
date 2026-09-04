import Link from 'next/link'

import {
  ArrowIcon,
  buttonVariants,
  cn,
  CARD_ARROW_NUDGE,
  CARD_LINK_FOCUS,
  CARD_MEDIA_ZOOM,
  Eyebrow,
} from '@o3/ui'
import { hrefForDoc } from '@o3/content-runtime/urls'
import { LogoKnockout, SanityImage } from '@o3/content-ui'
import type { CaseStudyCardData } from '@o3/content-ui/cards'
import { CONTENT_COLUMN } from '@o3/content-ui/image-sizes'

/** Eyebrow first half: industry titles; second half: the industryDetail string. */
function caseEyebrow(card: Pick<CaseStudyCardData, 'industries' | 'industryDetail'>): string {
  const industries = (card.industries ?? []).map((industry) => industry.title).filter(Boolean)
  return [...industries, card.industryDetail].filter(Boolean).join(' · ')
}

/**
 * O3's case-study card, built to the `Case Study Card` set (`2089:4169`) — the
 * one the /work index (`2107:1094`–`1096`) and the next-project band
 * (`2250:1564`) both instance. Its variant axis is which client the demo shows,
 * so it maps to no `cva` key.
 *
 * App-local rather than shared: the kit's `Case Study Cards` set (`4404:3072`)
 * is a different composition, not a variant of this one, so each app draws its
 * own over the shared `CaseStudyCardData` (`APP_FIRST_RENDERERS`).
 *
 * ```
 * 1246 × 550        radius 32, padding 64, content pinned via space-between
 *   background      the hero image, cover
 *   scrim           --gradient-card-scrim — 90deg, 0.8 ink → 0 by 84%
 *   top             the client logo in a 180 × 80 holder, knocked out WHITE
 *   bottom  gap 24  eyebrow 18/24 bold in the brand red, over a
 *                   narrative at 24/34 regular, in a 559px measure — the
 *                   content row is 559 text beside 559 of deadspace
 *                   stat 48px beside its label at 65% white, 24px apart
 *                   Button / Solid Theme=White, "View the work"
 * ```
 *
 * Nothing here is a text-beside-thumbnail card: the photograph **is** the
 * card, the scrim holds the left column legible, and the copy sits on the
 * floor.
 *
 * The trailing CTA is a styled `<span>`, not a `Button` — the whole card is
 * already the anchor, and a nested control would be a second tab stop to the
 * same href.
 */
export function CaseStudyCard(
  card: CaseStudyCardData & {
    /**
     * Preload this card's photograph. Only the container knows whether the
     * card is the route's LCP candidate — `/work` passes it for the first card
     * and the Home showcase band does not, because that band is below the
     * fold.
     */
    priority?: boolean
  },
) {
  const { _type, title, slug, narrativeHeadline, headlineStat, cardMedia, client, priority } = card
  const eyebrow = caseEyebrow(card)

  return (
    <Link
      href={hrefForDoc({ _type, slug })}
      // The photograph and its scrim ARE the card's ground, so the card
      // declares the surface it paints (tokens/color.css: whatever paints a
      // dark background sets `data-surface="ink"`). Nothing here names a role
      // the declaration moves — the copy is literal white and `on-ink-muted`
      // either way — but the bar overhead reads it: `NavInk` cannot judge a
      // picture from computed style, and without this it crossed a near-black
      // card wearing the white band's dark ink.
      data-surface="ink"
      // 550 tall at both widths — 1246 wide at 1440, 362 at 402
      // (`2975:8429`–`8431`).
      // A FLOOR, not a fixed height: the set's demo
      // narrative is three lines and a real one runs to five, and the /work
      // index's own first instance is already 592 for that reason.
      //
      // `gap-6` is the floor `justify-between` doesn't give you. Once the copy
      // fills the card there is no free space left to distribute, and the
      // client mark ends up sitting directly on the eyebrow — 7 of the 9 cards
      // on /work measured a 0px separation at 402, and two of them at 1440. A
      // gap costs nothing on a card that still has slack (space-between hands
      // out the surplus either way) and holds the two groups apart on one that
      // doesn't.
      //
      // Padding is 64 uniform in the set and only the sides step down at 402,
      // where the 362-wide instances (`2975:8429`–`8431`) override to 24 and
      // leave 64 top and bottom.
      //
      // The focus ring hugs the card's own radius with no offset: the
      // photograph runs to the edge, so a gap between ring and card would read
      // as a border the card doesn't have.
      className={cn(
        'rounded-case-card group relative isolate flex min-h-[550px] flex-col justify-between gap-6 overflow-hidden px-6 py-16 text-white lg:px-16',
        CARD_LINK_FOCUS,
        'focus-visible:ring-offset-0',
      )}
    >
      <div className="absolute inset-0 -z-20">
        <SanityImage
          source={cardMedia?.image}
          alt=""
          ratio="fill"
          width={1600}
          // The card is the content column at both widths — one per row in
          // the showcase band and on /work alike.
          sizes={CONTENT_COLUMN}
          priority={priority}
          // Any ink laid over a photograph costs it chroma as well as
          // luminance, so the scrim reads as desaturation even where it is
          // only dimming. A tenth of saturation back is the compensation, not
          // a grade: it is sized to the scrim, and the image under no scrim at
          // all (`NextCaseBand`) deliberately doesn't carry it.
          className={cn('saturate-110 h-full w-full', CARD_MEDIA_ZOOM)}
        />
      </div>
      {/*
       * At 1440 the card is 1246 × 550 and the copy occupies the left 559 of
       * it, so the set holds it legible with the near-horizontal
       * `--gradient-card-scrim` (`2089:4169`).
       *
       * At 402 the copy spans the card, where a horizontal scrim would leave
       * the end of every line on open photograph. The file answers nothing
       * here: the 402 instances (`2975:8429`–`8431`) carry the set's own
       * gradient unchanged, and no separate mobile scrim is drawn anywhere.
       * The stacked wash is therefore a CODE DECISION, not a read — its shape
       * is taken from the gen-1 stacked card `1925:5734` and reasoned at the
       * token.
       *
       * Both tokens are retuned away from the frame's literal values, which
       * are heavy enough to read as a black-and-white treatment on real hero
       * photography — the reasoning is at the tokens in gradient.css, and the
       * departure is recorded in `drift`.
       */}
      <div className="bg-(image:--gradient-card-scrim-stacked) lg:bg-(image:--gradient-card-scrim) absolute inset-0 -z-10" />

      {/*
       * The knockout is a shape, not glyphs, so its separation from the
       * photograph is a drop-shadow rather than a text-shadow — `filter`
       * follows the artwork's own alpha. Same job as the shadow on
       * the copy below: it is what lets the scrim stay a wash. Invisible over
       * the ink the scrim actually lays down, and the whole reason a bright
       * patch of sky behind a logo doesn't have to be paid for in ink.
       */}
      {client?.logo ? (
        <LogoKnockout
          source={client.logo}
          alt={client.name}
          width={180}
          height={80}
          className="drop-shadow-[0_1px_10px_rgba(3,3,3,0.55)]"
        />
      ) : (
        <span className="eyebrow font-bold [text-shadow:0_1px_12px_rgba(3,3,3,0.5)]">
          {client?.name}
        </span>
      )}

      {/*
       * The set's Content row is 559 of text beside 559 of deadspace
       * (`2089:4169`), so the measure belongs to the whole column — eyebrow,
       * narrative and stat line up on it. 560 rounds the read to the scale;
       * the extra pixel changes no line break. Below 1120 + padding the
       * column is simply the card's width.
       */}
      <div className="flex max-w-[560px] flex-col items-start gap-6">
        {/*
         * Targeted insurance in place of blanket ink. The scrim is sized for
         * the photography these cards actually carry; this shadow is what
         * covers the case it is NOT sized for — a blown-out highlight landing
         * under a line — without darkening the other 95% of the image to pay
         * for it. It reads as nothing over the scrim's ink and does not touch
         * the CTA, whose dark label sits on a white plate.
         */}
        <div className="flex flex-col gap-3 [text-shadow:0_1px_12px_rgba(3,3,3,0.5)]">
          {/*
           * `brand`, not the set's deeper red: `--color-brand-deep` lands
           * around 3.5:1 over the scrim's ink, under the 4.5:1 this 17px bold
           * line needs, and the brand tone is already the eyebrow treatment
           * every other ink surface draws.
           */}
          {eyebrow ? (
            <Eyebrow size="lg" tone="brand">
              {eyebrow}
            </Eyebrow>
          ) : null}
          <h3 className="text-display-sm font-display text-balance">
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

        {/*
         * The CTA is not a control, so it has no hover of its own to fire —
         * it borrows the set's own hover fill from the card instead, which is
         * what keeps it from sitting dead while the picture behind it moves.
         */}
        <span
          className={cn(
            buttonVariants({ variant: 'light', size: 'base' }),
            'group-hover:bg-brand group-hover:text-white',
            'group-focus-visible:bg-brand group-focus-visible:text-white',
          )}
        >
          View the work
          <ArrowIcon className={CARD_ARROW_NUDGE} />
        </span>
      </div>
    </Link>
  )
}

import { ArticleByline, Eyebrow, ReadingProgress, SectionShell } from '@o3/ui'
import type { INSIGHT_QUERY_RESULT } from '@o3/sanity/types/generated'

import { CarouselTrack, SanityImage } from '@o3/content-ui'
import { ARTICLE_COLUMN, FULL_BLEED } from '@o3/content-ui/image-sizes'
import { PortableTextBody } from '@o3/content-ui/portable-text'
import { getCard } from '@o3/content-ui/cards'
import { formatMonthYear } from '@o3/content-ui/format-date'

import { BackToInsights } from './BackToInsights'

type InsightViewProps = NonNullable<INSIGHT_QUERY_RESULT>

/**
 * The insight detail layer — Figma **Insights** `1710:2823` (1440) and
 * **Insights - Mobile** `1906:1046` (402), #45. The frame's "Insights" is this
 * project's **Insight** (CONTEXT.md); the other frame of that name is
 * About.
 *
 * ```
 * band          desktop      mobile       renders as
 * ────────────────────────────────────────────────────────────────────────
 * hero          2252:3554    2262:3859    <header>, photograph + scrim, 164/gutter/64
 *   back-link   —            —            <BackToInsights> (precursor 1379:2186)
 *   eyebrow     2252:3558    2262:3862    <Eyebrow tone="inverse"> — the category
 *   h1          2252:3559    2262:3863    text-display-xl (48 / 40)
 *   deck        2252:3560    2262:3864    text-lead, the document's excerpt
 *   byline      2252:3561    2262:3865    <ArticleByline>
 * body          1710:2836    1906:1053    white band, 822px measure, <PortableTextBody>
 * keep reading  2252:3675    2262:3905    bone band, the Home Blog row's carousel
 * ```
 *
 * ## The hero is photographic (#90)
 *
 * Both hero frames fill the band with an `IMAGE` paint under a `#030303`
 * linear gradient, left to right: opaque to 16.8% then clear at 1440
 * (`2252:3554`), opaque to 50% across the whole width at 402 (`2262:3859`) —
 * a narrow band has no clear side to keep legible, the same trade
 * `CaseStudyHero` makes. The photograph is the document's featured image; the
 * frames name no second image field and the schema has none.
 *
 * The band it replaces was a flat `bg-ink-warm` strip with the `OrbitalSphere`
 * hung off it (`1715:1549`, a node that no longer resolves). **No
 * sphere-equivalent exists anywhere in the new hero subtree**, so it is gone
 * from this view; the component still serves Home, the CTA band and the quote
 * band.
 *
 * `bg-ink-warm` stays on the `<header>` as the **no-image fallback**. The
 * field is optional in the schema and an editor can clear it, and a scrim
 * over nothing is a black band rather than a design — so with no image
 * neither the photograph nor the scrim is drawn, and the band renders exactly
 * as it did before this change. It is also what sits under the photograph
 * while it loads.
 *
 * "Keep reading" renders through the same `SectionShell` the Home Blog band
 * uses, so heading, controls and row all sit in the standard 1248px column and
 * the track's own `overflow-x-auto` clips scrolled cards at the gutter line.
 * It used to build a bare `<section>` with no gutter, which put the heading on
 * the viewport edge and ran the row off both sides — one carousel rendering
 * two different ways. `CarouselTrack` records why the 1440 frame's bleed past
 * the right edge is not kept in either place.
 *
 * Nav, footer and the closing CTA band are not this component's: the first two
 * come from `(site)/layout.tsx`, and the CTA band the desktop frame ends on is
 * `ctaSection` copy that the mobile frame drops — see the ticket notes.
 *
 * ## Three things the frames do not settle
 *
 * **The featured image keeps its own band as well as the hero.** Neither
 * frame draws a figure at the top of the article, but #45 requires the image
 * displayed and the 2026-08-13 sync re-confirmed the body band against both
 * frames, so it stays at the section measure. The hero shows the same asset
 * cropped to the band and the figure shows it whole, which is what the frames
 * ask for read literally — if the repetition is wrong, dropping the figure is
 * a one-block delete.
 *
 * **The hero's top padding is the pill's clearance, not the frame's 256.**
 * `2252:3554` puts the eyebrow 256px below the band top (64 frame padding +
 * 192 on `2252:3556`) and `2262:3859` puts it at 128 — but neither frame
 * draws the back-link, which the code hangs above the eyebrow with a 32px
 * gap, so the two cannot be compared directly. `pt-[164px]` is the floating
 * nav pill's clearance and is shared verbatim with `CaseStudyHero`,
 * `CollectionHero` and the Home hero; moving it here alone would break that
 * agreement to chase a number the composition does not license. Left as it
 * is, deliberately (#90).
 *
 * **Reading time is computed, never stored.** The value comes from the GROQ
 * projection (`INSIGHT_CARD.readingMinutes`), which is where the decision
 * and its arithmetic are recorded.
 */
export function InsightView({
  title,
  excerpt,
  author,
  categories,
  publishedAt,
  featuredImage,
  readingMinutes,
  body,
  related,
  latest,
}: InsightViewProps) {
  const category = (categories ?? [])
    .map((entry) => entry.title)
    .filter(Boolean)
    .join(' · ')

  // "Jun 2026 · 6 min read" — `1710:2951`.
  const meta = [formatMonthYear(publishedAt), readingMinutes ? `${readingMinutes} min read` : null]
    .filter(Boolean)
    .join(' · ')

  // Curated-by-category first, newest overall as the fallback — same shape the
  // Home carousel uses, so an insight in a one-article category still
  // closes on a full row.
  const keepReading = related?.length ? related : (latest ?? [])
  const Card = getCard('insight')

  // The hero photograph (#90). No second image field exists on the document,
  // and the frames name none — the featured image is the band's fill.
  const heroImage = featuredImage?.image ?? null

  return (
    <article>
      <ReadingProgress />

      {/* `bg-ink-warm` is the no-image case: the flat band this hero was
          before #90, drawn when the document has no featured image to fill
          it. With an image it is only what shows while the photograph
          loads. */}
      <header className="bg-ink-warm px-gutter relative isolate overflow-hidden pb-16 pt-[164px] text-white">
        {heroImage ? (
          <>
            <div className="absolute inset-0 -z-20">
              <SanityImage
                source={heroImage}
                alt=""
                ratio="fill"
                width={2400}
                sizes={FULL_BLEED}
                // The route's one priority image: the hero photograph fills
                // the opening band, so it is the LCP element on every insight
                // that has one.
                priority
              />
            </div>
            {/* The `#030303` scrim both frames lay over the photograph, left
                to right. At 1440 (`2252:3554`) it is opaque to 16.8% and
                clear by the right edge, which keeps the 588px copy column
                legible and leaves the picture open beside it. At 402
                (`2262:3859`) the copy is full-width, so the stop never falls
                below 50% — the same trade `CaseStudyHero` makes at that
                width. */}
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,3,3,1)_0%,rgba(3,3,3,0.5)_100%)] lg:bg-[linear-gradient(90deg,rgba(3,3,3,1)_16.83%,rgba(3,3,3,0)_100%)]" />
          </>
        ) : null}

        <div className="max-w-section relative mx-auto flex flex-col gap-8">
          <BackToInsights />

          <div className="flex flex-col gap-4">
            {category ? <Eyebrow tone="inverse">{category}</Eyebrow> : null}
            <h1 className="text-display-xl font-display text-balance lg:w-[588px]">{title}</h1>
          </div>

          {excerpt ? <p className="text-lead lg:w-[588px]">{excerpt}</p> : null}

          <ArticleByline
            name={author?.name}
            role={author?.title}
            meta={meta || null}
            // Passed only when there is one: an absent `headshot` is what tells
            // the byline to draw the frame's monogram disc instead.
            headshot={
              author?.headshot ? (
                <SanityImage source={author.headshot} alt="" ratio="fill" width={84} sizes="42px" />
              ) : undefined
            }
          />
        </div>
      </header>

      <div className="px-gutter py-band-sm lg:py-band-md bg-white">
        {/* `1894:3908` — the body sits in an 822px column, centred. The
            featured image shares that measure: it has no band in either frame
            (see the note above), so putting it anywhere wider would be
            inventing a composition rather than reading one, and the archive's
            lead images are square as often as they are landscape. */}
        <div className="max-w-article mx-auto">
          {featuredImage?.image ? (
            <figure className="mb-16">
              <SanityImage
                source={featuredImage.image}
                alt={featuredImage.alt ?? ''}
                width={1644}
                className="rounded-card w-full"
                sizes={ARTICLE_COLUMN}
                // Not `priority`: since #90 the same asset fills the hero,
                // which is the LCP element and holds the preload. Two
                // priority images of one picture only fight each other.
              />
              {featuredImage.caption ? (
                <figcaption className="text-fg-subtle mt-3 text-sm">
                  {featuredImage.caption}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          {/* The band above already sets the 822px article measure (1710:2836);
              max-w-none keeps the body from being narrowed a second time. */}
          <PortableTextBody value={body} className="max-w-none" />
        </div>
      </div>

      {keepReading.length ? (
        <SectionShell surface="bone" top="sm" bottom="sm">
          {/* `1751:1949` — the frame's own copy for this band. The mobile
              frame heads it "The thinking behind the work.", which is the
              /insights index's line; the desktop detail frame is the
              canonical read for a detail page. */}
          <CarouselTrack
            heading="Keep reading."
            cards={keepReading.map((item) => (
              <Card key={item._id} {...item} />
            ))}
          />
        </SectionShell>
      ) : null}
    </article>
  )
}

import { ArticleByline, Eyebrow, OrbitalSphere, ReadingProgress } from '@o3/ui'
import type { PERSPECTIVE_QUERY_RESULT } from '@o3/sanity/types/generated'

import { CarouselTrack } from '@/content/blocks/section/perspectivesCarouselSection/CarouselTrack'
import { SanityImage } from '@/content/SanityImage'
import { PortableTextBody } from '@/content/portable-text/PortableTextBody'
import { getCard } from '@/content/documents/card-registry'
import { formatMonthYear } from '@/lib/format-date'

import { BackToPerspectives } from './BackToPerspectives'

type PerspectiveViewProps = NonNullable<PERSPECTIVE_QUERY_RESULT>

/**
 * The perspective detail layer — Figma **Insights** `1710:2823` (1440) and
 * **Insights - Mobile** `1906:1046` (402), #45. The frame's "Insights" is this
 * project's **Perspective** (CONTEXT.md); the other frame of that name is
 * About.
 *
 * ```
 * band          desktop      mobile       renders as
 * ────────────────────────────────────────────────────────────────────────
 * hero          1710:2825    1906:1048    <header>, ink-warm, 164/gutter/64
 *   back-link   —            —            <BackToPerspectives> (precursor 1379:2186)
 *   eyebrow     1710:2827    1906:1050    <Eyebrow tone="inverse"> — the category
 *   h1          1710:2828    1906:1051    text-display-xl (48 / 40)
 *   deck        1710:2829    1906:1052    text-lead, the document's excerpt
 *   byline      1710:2946    1906:1254    <ArticleByline>
 *   orbital     1715:1549    —            <OrbitalSphere>, desktop only
 * body          1710:2836    1906:1053    white band, 822px measure, <PortableTextBody>
 * keep reading  1751:1947    1906:1213    bone band, the Home Blog row's carousel
 * ```
 *
 * Nav, footer and the closing CTA band are not this component's: the first two
 * come from `(site)/layout.tsx`, and the CTA band the desktop frame ends on is
 * `ctaSection` copy that the mobile frame drops — see the ticket notes.
 *
 * ## Two things the frames do not settle
 *
 * **The featured image has no band in either frame.** All 272 migrated
 * articles carry one and #45 requires it displayed, so it opens the body band
 * at the section measure — the only composition here not read off a frame.
 *
 * **Reading time is computed, never stored.** The value comes from the GROQ
 * projection (`PERSPECTIVE_CARD.readingMinutes`), which is where the decision
 * and its arithmetic are recorded.
 */
export function PerspectiveView({
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
}: PerspectiveViewProps) {
  const category = (categories ?? [])
    .map((entry) => entry.title)
    .filter(Boolean)
    .join(' · ')

  // "Jun 2026 · 6 min read" — `1710:2951`.
  const meta = [formatMonthYear(publishedAt), readingMinutes ? `${readingMinutes} min read` : null]
    .filter(Boolean)
    .join(' · ')

  // Curated-by-category first, newest overall as the fallback — same shape the
  // Home carousel uses, so a perspective in a one-article category still
  // closes on a full row.
  const keepReading = related?.length ? related : (latest ?? [])
  const Card = getCard('perspective')

  return (
    <article>
      <ReadingProgress />

      <header className="bg-ink-warm px-gutter relative isolate overflow-hidden pb-16 pt-[164px] text-white">
        {/* `1715:1549` — the wireframe globe, hung right of the copy and
            running off the band. The mobile frame drops it entirely. */}
        <OrbitalSphere className="left-[43%] top-[198px] hidden w-[1278px] lg:block" />

        <div className="max-w-section relative mx-auto flex flex-col gap-8">
          <BackToPerspectives />

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
                sizes="(min-width: 1024px) 822px, 100vw"
                priority
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
        <section className="bg-bone py-band-sm overflow-hidden">
          {/* `1751:1949` — the frame's own copy for this band. The mobile
              frame heads it "The thinking behind the work.", which is the
              /perspectives index's line; the desktop detail frame is the
              canonical read for a detail page. */}
          <CarouselTrack
            heading="Keep reading."
            cards={keepReading.map((item) => (
              <Card key={item._id} {...item} />
            ))}
          />
        </section>
      ) : null}
    </article>
  )
}

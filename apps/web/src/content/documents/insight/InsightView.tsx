import { ArticleByline, Eyebrow, ReadingProgress, SectionShell } from '@o3/ui'
import type { INSIGHT_QUERY_RESULT } from '@o3/sanity/types/generated'

import { CarouselTrack, CAROUSEL_BAND_CLASS, CtaSection, SanityImage } from '@o3/content-ui'
import { FULL_BLEED } from '@o3/content-ui/image-sizes'
import { PortableTextBody } from '@o3/content-ui/portable-text'
import { getCard } from '@o3/content-ui/cards'
import { formatLongDate } from '@o3/content-ui/format-date'

type InsightViewProps = NonNullable<INSIGHT_QUERY_RESULT>

/** Insight detail: current Blog Hero 3739:73191 / 3754:73244 and Body/Open prose. */
export function InsightView({
  title,
  excerpt,
  author,
  categories,
  publishedAt,
  heroMedia,
  cardMedia,
  readingMinutes,
  body,
  related,
  latest,
}: InsightViewProps) {
  const category = (categories ?? [])
    .map((entry) => entry.title)
    .filter(Boolean)
    .join(' · ')

  const meta = [formatLongDate(publishedAt), readingMinutes ? `${readingMinutes} min read` : null]
    .filter(Boolean)
    .join(' · ')

  // Curated-by-category first, newest overall as the fallback — same shape the
  // Home carousel uses, so an insight in a one-article category still
  // closes on a full row.
  const keepReading = related?.length ? related : (latest ?? [])
  const Card = getCard('insight')

  // THE HERO-SIDE FALLBACK, EXPRESSED ONCE (#416). Neither figure is required
  // and each stands in for the other: the band draws the lead figure, and an
  // article whose editor has not chosen one draws the picture it shows on
  // cards. The card side resolves in the projection (`CARD_MEDIA`) because it
  // has many consumers; the hero has this one.
  const heroImage = (heroMedia ?? cardMedia)?.image ?? null

  return (
    <article>
      <ReadingProgress />

      {/* `bg-ink-warm` is the no-image case: the flat band this hero was
          before #90, drawn when the document has no picture at all to fill
          it. With an image it is only what shows while the photograph
          loads. */}
      <header className="bg-ink-warm px-gutter relative isolate flex min-h-[540px] flex-col justify-end overflow-hidden pb-12 pt-36 text-white lg:min-h-[720px] lg:pb-16 lg:pt-44">
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
            {/* Current Blog Hero scrim: 3739:73191 / 3754:73244. */}
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,3,3,1)_28.846%,rgba(3,3,3,0.5)_100%)] lg:bg-[linear-gradient(90deg,rgba(3,3,3,1)_55%,rgba(3,3,3,0)_100%)]" />
          </>
        ) : null}

        <div
          data-route-foreground=""
          className="max-w-section relative mx-auto flex w-full flex-col gap-8"
        >
          <div className="flex w-full flex-col gap-2 lg:w-[608px]">
            {category ? (
              <Eyebrow size="lg" className="text-on-utility mb-4">
                {category}
              </Eyebrow>
            ) : null}
            <h1 className="text-interior-hero font-display text-balance">{title}</h1>
            {excerpt ? <p className="text-lead text-on-utility">{excerpt}</p> : null}
          </div>

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

      {/* `1710:2835` pads 128 and `2262:3818` pads 64 — the detail page's own
          step, which compresses where band-md does not. */}
      <div className="px-gutter py-band-detail bg-white">
        {/* `1894:3908` — the body sits in an 822px column, centred. */}
        <div data-route-foreground="" className="max-w-article mx-auto">
          {/* The band above already sets the 822px article measure (1710:2836);
              max-w-none keeps the body from being narrowed a second time. */}
          <PortableTextBody value={body} variant="article" className="max-w-none" />
        </div>
      </div>

      {keepReading.length ? (
        <div className="bg-bone">
          <SectionShell surface="bone" top="detail" bottom="detail" className={CAROUSEL_BAND_CLASS}>
            <CarouselTrack
              sequence
              eyebrow="Related Insights"
              heading="More ideas worth looking into."
              cards={keepReading.map((item) => (
                <Card key={item._id} {...item} />
              ))}
            />
          </SectionShell>
        </div>
      ) : null}
      <CtaSection
        heading="Let’s put some of this thinking to work."
        body="If something here sparked an idea, surfaced a challenge, or got you thinking differently, we’d love to talk about what could be next."
        decoration="orbs"
        button={{
          _type: 'button',
          label: 'Start the conversation',
          href: '/contact',
          contrast: 'light',
          target: null,
        }}
      />
    </article>
  )
}

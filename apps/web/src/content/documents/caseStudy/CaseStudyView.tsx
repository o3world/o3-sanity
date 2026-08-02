import { CaseChapter, CaseStudyHero, Eyebrow, Stat } from '@o3/ui'
import type { CASE_STUDY_QUERY_RESULT } from '@o3/sanity/types/generated'

import { Blocks } from '@/content/blocks/Blocks'
import { SanityImage } from '@/content/SanityImage'
import { PortableTextBody } from '@/content/portable-text/PortableTextBody'

import { NextCaseBand } from './NextCaseBand'

type CaseStudyDoc = NonNullable<CASE_STUDY_QUERY_RESULT>
export type CaseStudyViewProps = CaseStudyDoc

/**
 * Detail view for a case study — built to the canonical **Case Study** frame
 * `1710:2300` (mobile `1906:928`), #44.
 *
 * The document is fully structured, not section-built (CONTEXT.md), so each
 * band reads a fixed field rather than dispatching a block:
 *
 * | Band          | Frame (1440 / 402)         | Field                            |
 * | ------------- | -------------------------- | -------------------------------- |
 * | Hero          | `1710:2301` / `1906:922`   | `heroMedia`, `client`, `title`, `narrativeHeadline` |
 * | Stats         | — **no frame region**      | `stats`                          |
 * | Chapters      | `1647:1714` / `1906:878`   | `chapters` (numbered by order)   |
 * | What we shipped | — **no frame region**    | `deliverables`                   |
 * | Media / quote | `1647:1720`, `1899:4186`, `1899:4051` | `extraSections`       |
 * | Next project  | `1710:2609` / `1906:1039`  | `next`                           |
 * | Footer        | `1710:2463`                | the site layout's `SiteFooter`   |
 *
 * **The eyebrow is the client's name**, not the industry line. `1710:2304`
 * reads "IRONMAN" — the industry eyebrow ("Consumer Goods · Direct-to-Consumer
 * Coffee") is the card's, drawn by `CaseStudyCard` on `/work` and Home, and
 * the detail frame gives it no region.
 *
 * **Two bands here have no frame region at all**: `stats` and `deliverables`.
 * Both hold migrated fact (ADR 0007 — migration wins the facts), so they are
 * rendered in the frame's own vocabulary rather than dropped, and flagged on
 * #44 as a design conversation.
 *
 * **The frame alternates chapter → media → chapter → media**, which the
 * structure cannot express: a `chapter` is kicker + title + body, and
 * `extraSections` is a general section array appended after them. Positional
 * weaving would be wrong the moment a case appends anything that is not a
 * figure, so the order the schema documents is what ships, and the pairing is
 * raised on #44 as a schema conversation (`chapter.media`).
 */
export function CaseStudyView(props: CaseStudyViewProps) {
  const {
    _id,
    title,
    client,
    narrativeHeadline,
    stats,
    heroMedia,
    chapters,
    deliverables,
    extraSections,
    next,
  } = props

  return (
    <article>
      <CaseStudyHero
        eyebrow={client?.name}
        heading={title}
        subheading={narrativeHeadline}
        media={
          <SanityImage
            source={heroMedia?.image}
            alt=""
            ratio="fill"
            width={2400}
            sizes="100vw"
            priority
          />
        }
      />

      {/*
       * No frame region — see the note above. Set in the card's stat
       * vocabulary (the 48px figure beside its label, `1883:3565`) and hung on
       * the article measure so the page keeps one spine; the chapter band
       * below supplies the space beneath.
       */}
      {stats?.length ? (
        <section className="px-gutter pt-band-sm bg-white">
          <ul className="mx-auto flex w-full max-w-[822px] flex-col gap-6">
            {stats.map((stat) => (
              <li key={stat._key} className="border-line border-t pt-6 first:border-t-0 first:pt-0">
                <Stat value={stat.value ?? ''} label={stat.label ?? ''} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Numbering derives from order, never from the content (CONTEXT.md). */}
      {chapters?.map((chapter, index) => (
        <CaseChapter
          key={chapter._key}
          number={String(index + 1).padStart(2, '0')}
          kicker={chapter.kicker}
          title={chapter.title}
        >
          <PortableTextBody value={chapter.body} className="max-w-none" />
        </CaseChapter>
      ))}

      {/* No frame region — the schema's own "What we shipped" label. */}
      {deliverables?.length ? (
        <section className="px-gutter bg-white pb-[clamp(96px,calc(6.55vw+69.7px),164px)]">
          <div className="mx-auto flex w-full max-w-[822px] flex-col gap-6">
            <Eyebrow size="lg">What we shipped</Eyebrow>
            <ul className="grid gap-3 sm:grid-cols-2">
              {deliverables.map((deliverable) => (
                <li key={deliverable} className="border-line text-fg border-t pt-3">
                  {deliverable}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* The frame's media bands and its gradient quote band (`1899:4051`). */}
      {extraSections?.length ? (
        <Blocks
          blocks={extraSections}
          documentId={_id}
          documentType="caseStudy"
          fieldPath="extraSections"
        />
      ) : null}

      {next ? <NextCaseBand next={next} /> : null}
    </article>
  )
}

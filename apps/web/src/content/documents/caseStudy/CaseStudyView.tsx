import { CaseChapter, CaseStudyHero, Eyebrow, Stat } from '@o3/ui'
import type { CASE_STUDY_QUERY_RESULT } from '@o3/sanity/types/generated'

import { Blocks } from '@/content/blocks/Blocks'
import { SanityImage } from '@/content/SanityImage'
import { FULL_BLEED } from '@/content/imageSizes'
import { PortableTextBody } from '@/content/portable-text/PortableTextBody'

import { NextCaseBand } from './NextCaseBand'

type CaseStudyDoc = NonNullable<CASE_STUDY_QUERY_RESULT>
export type CaseStudyViewProps = CaseStudyDoc

type StoryMember = NonNullable<CaseStudyDoc['story']>[number]
type StoryChapter = Extract<StoryMember, { _type: 'chapter' }>
type StorySection = Exclude<StoryMember, { _type: 'chapter' }>

/**
 * The narrative in render order: a chapter, or an unbroken run of the section
 * blocks between two chapters.
 */
type StoryRun =
  | { kind: 'chapter'; chapter: StoryChapter; number: string }
  | { kind: 'sections'; key: string; blocks: StorySection[] }

/**
 * Walk `story` once, numbering chapters by their position **among the chapter
 * members** and collecting everything else into runs.
 *
 * The numbering rule is the point of ADR 0018: a band between two chapters
 * must not consume a number, so "01" and "02" stay the first and second
 * chapters no matter how much sits between them.
 */
function toRuns(story: readonly StoryMember[]): StoryRun[] {
  const runs: StoryRun[] = []
  let chapters = 0

  for (const member of story) {
    if (member._type === 'chapter') {
      chapters += 1
      runs.push({ kind: 'chapter', chapter: member, number: String(chapters).padStart(2, '0') })
      continue
    }
    const last = runs.at(-1)
    if (last?.kind === 'sections') last.blocks.push(member)
    else runs.push({ kind: 'sections', key: member._key, blocks: [member] })
  }

  return runs
}

/**
 * Detail view for a case study — built to the canonical **Case Study** frame
 * `1710:2300` (mobile `1906:928`), #44, reworked against the 2230-era frame
 * for #97.
 *
 * The document is **structured around a compositional middle** (ADR 0018): the
 * bands at either end read fixed fields, and everything between them comes out
 * of one `story` array that interleaves chapters with section blocks.
 *
 * | Band            | Frame (1440 / 402)         | Field                            |
 * | --------------- | -------------------------- | -------------------------------- |
 * | Hero            | `1710:2301` / `1906:922`   | `heroMedia`, `client`, `title`, `narrativeHeadline` |
 * | Stats           | — **no frame region**      | `stats`                          |
 * | Story           | `1647:1714` / `1906:878`   | `story` — chapters, numbered by their order among chapters |
 * | ↳ details rows  | `2274:4009`                | `chapter.details`                |
 * | ↳ screen grids  | `2230:3315`, `2230:7559`   | `screenGridSection`              |
 * | ↳ page capture  | `1647:1720`                | `mediaSection` (`variant: capture`) |
 * | ↳ quote         | `2250:1525`                | `quoteSection` (`decoration: molecule`) |
 * | What we shipped | — **no frame region**      | `deliverables`                   |
 * | Next project    | `1710:2609` / `1906:1039`  | `next`                           |
 * | Footer          | `1710:2463`                | the site layout's `SiteFooter`   |
 *
 * **The eyebrow is the client's name**, not the industry line. `1710:2304`
 * reads "IRONMAN" — the industry eyebrow ("Consumer Goods · Direct-to-Consumer
 * Coffee") is the card's, drawn by `CaseStudyCard` on `/work` and Home, and
 * the detail frame gives it no region.
 *
 * **Two bands here have no frame region at all**: `stats` and `deliverables`.
 * Both hold migrated fact (ADR 0007 — migration wins the facts), so they are
 * rendered in the frame's own vocabulary rather than dropped, and flagged on
 * #44 as a design conversation this rework does not close.
 *
 * **Why runs, and not one dispatcher.** `Blocks` is the only sanctioned entry
 * point to block rendering (an ESLint boundary says so), and a chapter is a
 * shared object rather than a registered block — putting one through the
 * registry would mean widening the `satisfies` clause that keeps schema and
 * renderers honest. So each unbroken run of sections gets its own `Blocks`,
 * all of them naming the same `story` field path: item-level `data-sanity`
 * attribution is keyed by `_key`, so Presentation still resolves every band to
 * its array item. `optimisticOrder` documents what a run costs mid-drag.
 */
export function CaseStudyView(props: CaseStudyViewProps) {
  const { _id, title, client, narrativeHeadline, stats, heroMedia, story, deliverables, next } =
    props

  const runs = toRuns(story ?? [])

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
            sizes={FULL_BLEED}
            // The route's one priority image: the hero photograph is the
            // band's fill and the LCP element on every case study.
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
          <ul className="max-w-article mx-auto flex w-full flex-col gap-6">
            {stats.map((stat) => (
              <li key={stat._key} className="border-line border-t pt-6 first:border-t-0 first:pt-0">
                <Stat value={stat.value ?? ''} label={stat.label ?? ''} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* The narrative, in the order it was authored (ADR 0018). */}
      {runs.map((run) =>
        run.kind === 'chapter' ? (
          <CaseChapter
            key={run.chapter._key}
            number={run.number}
            kicker={run.chapter.kicker}
            title={run.chapter.title}
            details={run.chapter.details?.map((detail) => ({
              // Sanity's array-member key, carried so a reordered row keeps
              // its React identity rather than inheriting the one at its
              // index (`CaseChapter` falls back to the index for fixtures).
              key: detail._key,
              label: detail.label,
              body: detail.body,
            }))}
          >
            <PortableTextBody value={run.chapter.body} className="max-w-none" />
          </CaseChapter>
        ) : (
          <Blocks
            key={run.key}
            blocks={run.blocks}
            documentId={_id}
            documentType="caseStudy"
            fieldPath="story"
          />
        ),
      )}

      {/* No frame region — the schema's own "What we shipped" label. */}
      {deliverables?.length ? (
        <section className="px-gutter pb-band-article bg-white">
          <div className="max-w-article mx-auto flex w-full flex-col gap-6">
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

      {next ? <NextCaseBand next={next} /> : null}
    </article>
  )
}

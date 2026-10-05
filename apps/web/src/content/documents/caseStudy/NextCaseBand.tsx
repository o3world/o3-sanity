import type { CASE_STUDY_QUERY_RESULT } from '@o3/sanity/types/generated'

import { CaseStudyCard } from '@o3/content-ui/cards'

type NextCase = NonNullable<NonNullable<CASE_STUDY_QUERY_RESULT>['next']>

/**
 * Current next-case composition (3267:9463); supporting copy comes from the next case.
 * The card is the Case Study Card set at every width — its Device=Mobile variant
 * (3813:91189) keeps the CTA.
 */
export function NextCaseBand({ next }: { next: NextCase }) {
  if (!next.slug) return null

  return (
    <section className="bg-bone px-gutter py-16">
      <div className="max-w-section mx-auto flex flex-col gap-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="font-display text-ink text-display-xl text-balance lg:max-w-[571px]">
            There’s more where that came from.
          </h2>
          {next.narrativeHeadline ? (
            <p className="text-lead text-fg-body lg:w-[385px]">{next.narrativeHeadline}</p>
          ) : null}
        </div>

        <CaseStudyCard {...next} />
      </div>
    </section>
  )
}

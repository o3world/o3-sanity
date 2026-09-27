import Link from 'next/link'

import { cn, CARD_LINK_FOCUS, CARD_MEDIA_ZOOM } from '@o3/ui'
import type { CASE_STUDY_QUERY_RESULT } from '@o3/sanity/types/generated'
import { hrefForDoc } from '@o3/content-runtime/urls'

import { SanityImage } from '@o3/content-ui'
import { CONTENT_COLUMN } from '@o3/content-ui/image-sizes'

import { CaseStudyCard } from '@o3/content-ui/cards'

type NextCase = NonNullable<NonNullable<CASE_STUDY_QUERY_RESULT>['next']>

/** Current next-case composition (3267:9463); supporting copy comes from the next case. */
export function NextCaseBand({ next }: { next: NextCase }) {
  if (!next.slug) return null
  const label = ['Next project', next.client?.name].filter(Boolean).join(' — ')
  const href = hrefForDoc({ _type: 'caseStudy', slug: next.slug })

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

        <Link
          href={href}
          aria-label={[label, next.title].filter(Boolean).join(': ')}
          // No offset on the ring: the photograph is the whole tap target, so a
          // gap between ring and picture would read as a border it doesn't
          // have.
          className={cn(
            'group relative block aspect-square overflow-hidden lg:hidden',
            CARD_LINK_FOCUS,
            'focus-visible:ring-offset-0',
          )}
        >
          <SanityImage
            source={next.cardMedia?.image}
            alt={next.cardMedia?.alt ?? ''}
            ratio="fill"
            width={1600}
            sizes={CONTENT_COLUMN}
            className={CARD_MEDIA_ZOOM}
          />
        </Link>

        <div className="hidden lg:block">
          <CaseStudyCard {...next} />
        </div>
      </div>
    </section>
  )
}

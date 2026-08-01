import Link from 'next/link'

import { SanityImage } from '@/content/SanityImage'
import { hrefForDoc } from '@/content/documents/urls'
import { formatMonthYear } from '@/lib/format-date'
import type { SectionProps } from '@/content/blocks/sectionTypes'

/**
 * The perspective card shape — the `PERSPECTIVE_CARD` projection. Pinned to
 * the carousel feed's element type; the listing page's items share the same
 * fragment so they're structurally assignable.
 */
export type PerspectiveCardData = NonNullable<
  SectionProps<'perspectivesCarouselSection'>['latest']
>[number]

export function PerspectiveCard({
  _type,
  title,
  slug,
  excerpt,
  publishedAt,
  featuredImage,
  author,
  categories,
}: PerspectiveCardData) {
  const category = categories?.[0]?.title
  const meta = [author?.name, formatMonthYear(publishedAt)].filter(Boolean).join(' · ')
  return (
    <Link
      href={hrefForDoc({ _type, slug })}
      className="rounded-card flex h-full flex-col overflow-hidden bg-white"
    >
      <SanityImage
        source={featuredImage?.image}
        alt={featuredImage?.alt ?? ''}
        ratio="3/2"
        width={800}
        className="bg-line"
        sizes="(min-width: 768px) 20rem, 80vw"
      />
      <div className="flex flex-1 flex-col gap-3 p-6">
        {category ? <p className="eyebrow text-brand">{category}</p> : null}
        <h3 className="text-fg text-lg font-medium">{title}</h3>
        {excerpt ? <p className="text-fg-muted line-clamp-3 text-sm">{excerpt}</p> : null}
        {meta ? (
          <p className="border-line-soft text-fg-subtle mt-auto border-t pt-4 text-sm">{meta}</p>
        ) : null}
      </div>
    </Link>
  )
}

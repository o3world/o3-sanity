import type { PERSPECTIVE_QUERY_RESULT } from '@o3/sanity/types/generated'

import { SanityImage } from '@/content/SanityImage'
import { PortableTextBody } from '@/content/portable-text/PortableTextBody'
import { formatLongDate } from '@/lib/format-date'
import { readTimeMinutes } from '@/lib/read-time'

type PerspectiveViewProps = NonNullable<PERSPECTIVE_QUERY_RESULT>

/** Detail view for a perspective (blog article): header, figure, PT body. */
export function PerspectiveView({
  title,
  excerpt,
  author,
  categories,
  publishedAt,
  featuredImage,
  body,
}: PerspectiveViewProps) {
  const meta = [author?.name, formatLongDate(publishedAt), `${readTimeMinutes(body)} min read`]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className="mx-auto max-w-3xl px-6 pb-24 pt-40">
      <header className="flex flex-col gap-5">
        {categories?.length ? (
          <p className="eyebrow text-brand">
            {categories.map((category) => category.title).join(' · ')}
          </p>
        ) : null}
        <h1 className="text-display-xl font-display text-balance">{title}</h1>
        {excerpt ? <p className="text-fg-muted text-lg">{excerpt}</p> : null}
        {meta ? <p className="text-fg-subtle text-sm">{meta}</p> : null}
      </header>
      {featuredImage?.image ? (
        <figure className="mt-12">
          <SanityImage
            source={featuredImage.image}
            alt={featuredImage.alt ?? ''}
            width={1600}
            className="rounded-card w-full"
            sizes="(min-width: 768px) 48rem, 100vw"
            priority
          />
          {featuredImage.caption ? (
            <figcaption className="text-fg-subtle mt-3 text-sm">{featuredImage.caption}</figcaption>
          ) : null}
        </figure>
      ) : null}
      <div className="mt-12">
        <PortableTextBody value={body} />
      </div>
    </article>
  )
}

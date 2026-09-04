import { PortableText, type PortableTextComponents } from 'next-sanity'

import { cn } from '@o3/ui'

import { SanityImage } from '../SanityImage'
import { ARTICLE_COLUMN } from '../imageSizes'
import { toEmbedSrc } from './embedSrc'

/**
 * The Portable Text renderer for insight bodies and case-study chapter
 * bodies (the `bodyText` schema type): standard marks + the closed inline
 * object set — figure, embed, pullQuote.
 *
 * Parameterised by the slot its figures occupy, because the same renderer
 * runs at two measures: the article column on a detail page, and a
 * `layoutSection` column when a `richText` block holds a figure (#268).
 */
function componentsFor(figureSizes: string): PortableTextComponents {
  return {
    block: {
      /*
       * The article measure's rhythm (`2252:3607`): blocks 32px apart, one
       * line of `Body/Small` leading, and an h2 that carries 32px of its own
       * padding above the container gap — 64 over it, 32 under. Margins
       * collapse between siblings here, so `my-8` is 32, not 64.
       */
      normal: ({ children }) => <p className="text-fg my-8">{children}</p>,
      h2: ({ children }) => <h2 className="text-display-md font-display mb-8 mt-16">{children}</h2>,
      h3: ({ children }) => <h3 className="mb-3 mt-8 text-xl font-medium">{children}</h3>,
      blockquote: ({ children }) => (
        <blockquote className="border-brand text-fg-muted my-8 border-l-2 pl-6 text-lg">
          {children}
        </blockquote>
      ),
    },
    list: {
      bullet: ({ children }) => <ul className="my-8 list-disc space-y-2 pl-6">{children}</ul>,
      number: ({ children }) => <ol className="my-8 list-decimal space-y-2 pl-6">{children}</ol>,
    },
    marks: {
      code: ({ children }) => (
        <code className="bg-bone rounded px-1.5 py-0.5 font-mono text-sm">{children}</code>
      ),
      link: ({ children, value }) => (
        <a
          href={(value as { href?: string } | undefined)?.href ?? '#'}
          className="decoration-brand underline underline-offset-4"
        >
          {children}
        </a>
      ),
    },
    types: {
      figure: ({ value }) => {
        const figure = value as { image?: unknown; alt?: string | null; caption?: string | null }
        return (
          <figure className="my-10">
            <SanityImage
              source={figure.image as never}
              alt={figure.alt}
              width={1600}
              className="rounded-card w-full"
              sizes={figureSizes}
            />
            {figure.caption ? (
              <figcaption className="text-fg-subtle mt-3 text-sm">{figure.caption}</figcaption>
            ) : null}
          </figure>
        )
      },
      embed: ({ value }) => {
        const embed = value as { url?: string | null; caption?: string | null }
        if (!embed.url) return null
        return (
          <figure className="my-10">
            <div className="rounded-card bg-ink aspect-video overflow-hidden">
              <iframe
                src={toEmbedSrc(embed.url)}
                title={embed.caption ?? 'Embedded media'}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {embed.caption ? (
              <figcaption className="text-fg-subtle mt-3 text-sm">{embed.caption}</figcaption>
            ) : null}
          </figure>
        )
      },
      pullQuote: ({ value }) => {
        const quote = value as { text?: string | null; attribution?: string | null }
        if (!quote.text) return null
        return (
          <blockquote className="my-12">
            <p className="text-display-md font-display text-balance">&ldquo;{quote.text}&rdquo;</p>
            {quote.attribution ? (
              <footer className="eyebrow text-brand mt-4">{quote.attribution}</footer>
            ) : null}
          </blockquote>
        )
      },
    },
  }
}

/** Both detail templates wrap this renderer in `max-w-article`. */
const ARTICLE_COMPONENTS = componentsFor(ARTICLE_COLUMN)

/**
 * `className` overrides the default measure. An insight body sets its own
 * ~65ch column, but a case-study chapter is already inside the frame's 822px
 * article measure (`1710:2631`) and would otherwise be narrowed twice — pass
 * `max-w-none` there. The type step is `body` — the token minted from this
 * body's own frame (`1894:3914`, 20/32 at 1440) — and it is set here rather
 * than by the band around it, so every `bodyText` field reads at the same
 * size wherever it lands.
 *
 * The body's outer margins are dropped at its first and last block. Every
 * block carries its own `my-*`, which spaces blocks from each other; but the
 * wrapper sits in a flex column, where a margin does not collapse into the
 * container's `gap` — it stacks on it, and a band header landed 20px further
 * from its paragraph than the frame draws (`2357:2690`: 48px).
 */
export function PortableTextBody({
  value,
  className,
  figureSizes,
}: {
  value: unknown
  className?: string
  /**
   * The slot a `figure` in this body occupies, when it is not the article
   * measure — a `richText` block passes its column's (#268).
   */
  figureSizes?: string
}) {
  if (!value || !Array.isArray(value) || value.length === 0) return null
  return (
    <div
      className={cn('text-body max-w-prose [&>:first-child]:mt-0 [&>:last-child]:mb-0', className)}
    >
      <PortableText
        value={value as Parameters<typeof PortableText>[0]['value']}
        components={figureSizes ? componentsFor(figureSizes) : ARTICLE_COMPONENTS}
      />
    </div>
  )
}

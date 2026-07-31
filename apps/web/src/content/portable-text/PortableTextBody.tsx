import { PortableText, type PortableTextComponents } from 'next-sanity'

import { SanityImage } from '@/content/SanityImage'
import { toEmbedSrc } from './embedSrc'

/**
 * The Portable Text renderer for perspective bodies and case-study chapter
 * bodies (the `bodyText` schema type): standard marks + the closed inline
 * object set — figure, embed, pullQuote.
 */
const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="text-fg my-5 leading-relaxed">{children}</p>,
    h2: ({ children }) => <h2 className="text-display-md font-display mb-4 mt-12">{children}</h2>,
    h3: ({ children }) => <h3 className="mb-3 mt-8 text-xl font-medium">{children}</h3>,
    blockquote: ({ children }) => (
      <blockquote className="border-brand text-fg-muted my-8 border-l-2 pl-6 text-lg">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="my-5 list-disc space-y-2 pl-6">{children}</ul>,
    number: ({ children }) => <ol className="my-5 list-decimal space-y-2 pl-6">{children}</ol>,
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
            sizes="(min-width: 768px) 720px, 100vw"
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

export function PortableTextBody({ value }: { value: unknown }) {
  if (!value || !Array.isArray(value) || value.length === 0) return null
  return (
    <div className="max-w-prose">
      <PortableText
        value={value as Parameters<typeof PortableText>[0]['value']}
        components={components}
      />
    </div>
  )
}

import { PortableText, type PortableTextComponents } from 'next-sanity'

import { SanityImage } from '@/content/SanityImage'
import { toEmbedSrc } from './embedSrc'

/**
 * The Portable Text renderer for perspective bodies and case-study chapter
 * bodies (the `bodyText` schema type): standard marks + the closed inline
 * object set — figure, embed, pullQuote. No `codeBlock`, ever (ADR 0005).
 *
 * ## Where the type comes from
 *
 * The Insights frames are the only canonical frames that specify body
 * typography, so they set it for every `bodyText` field:
 *
 * ```
 * paragraph  --text-body           20px/1.6 #232323, 16px between  (1894:3914 / 1906:1057)
 * h2         --text-body-heading   36px @1440, 40px @402           (1894:3912 / 1906:1056)
 * measure    822px                                                 (1894:3908)
 * ```
 *
 * **The measure is the call site's job, not this component's.** The frame
 * centres the body in an 822px column; a case-study chapter sits in a
 * narrower one. This renders full-width and lets whoever placed it decide.
 *
 * ## What the frame shows that Portable Text cannot say
 *
 * The frame's body is three heading-plus-prose groups, each its own 128px-tall
 * band. Portable Text is a flat array of blocks with no grouping construct,
 * and #45 is explicit that a body's inline-object set is closed — so the
 * grouping is rendered as heading rhythm rather than invented as a block type.
 * Consecutive-heading spacing has no frame read at all (the frame draws each
 * group once, with nothing above it), so `mt-12 lg:mt-16` is a **code
 * decision**, sized to read as a break without the 256px the stacked bands
 * would literally produce for a 20-heading migrated article.
 */
const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="text-body text-fg mt-4 first:mt-0">{children}</p>,
    h2: ({ children }) => (
      <h2 className="text-body-heading font-display text-ink mb-8 mt-12 text-balance first:mt-0 lg:mb-6 lg:mt-16">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lead font-display text-ink mb-4 mt-10 first:mt-0">{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-brand text-body text-fg-muted my-10 border-l-2 pl-6">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="text-body text-fg mt-4 list-disc space-y-2 pl-6">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="text-body text-fg mt-4 list-decimal space-y-2 pl-6">{children}</ol>
    ),
  },
  marks: {
    code: ({ children }) => (
      <code className="bg-bone rounded px-1.5 py-0.5 font-mono text-[0.9em]">{children}</code>
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
        <figure className="my-12">
          <SanityImage
            source={figure.image as never}
            alt={figure.alt}
            width={1600}
            className="rounded-card w-full"
            sizes="(min-width: 1024px) 822px, 100vw"
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
        <figure className="my-12">
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
        <blockquote className="my-16">
          <p className="text-display-md font-display text-balance">&ldquo;{quote.text}&rdquo;</p>
          {quote.attribution ? (
            <footer className="eyebrow text-fg-muted mt-4">{quote.attribution}</footer>
          ) : null}
        </blockquote>
      )
    },
  },
}

export function PortableTextBody({ value }: { value: unknown }) {
  if (!value || !Array.isArray(value) || value.length === 0) return null
  return (
    <PortableText
      value={value as Parameters<typeof PortableText>[0]['value']}
      components={components}
    />
  )
}

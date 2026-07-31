import { Eyebrow, SectionShell } from '@o3/ui'

import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'

type QuoteBlockProps = SectionProps<'quoteBlock'>

/** Section block: an inline pull-quote moment with optional attribution. */
export function QuoteBlock({ quote, attribution, surface }: QuoteBlockProps) {
  if (!quote) return null
  return (
    <SectionShell surface={resolveSurface(surface, 'bone')}>
      <blockquote className="mx-auto flex max-w-4xl flex-col gap-8 py-28 text-center">
        <p className="text-display-lg font-display text-balance">&ldquo;{quote}&rdquo;</p>
        {attribution ? (
          <footer>
            <Eyebrow>{attribution}</Eyebrow>
          </footer>
        ) : null}
      </blockquote>
    </SectionShell>
  )
}

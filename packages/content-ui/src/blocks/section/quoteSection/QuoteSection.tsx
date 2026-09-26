import { stegaClean } from '@sanity/client/stega'
import { cn } from '@o3/ui/lib/utils'
import { cva } from 'class-variance-authority'
import { OrbitalSphere, SURFACE_CLASS, SurfaceProvider, surfaceAttrs } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'

import { DECORATED_BAND_CLASS, resolveDecoration } from '../../decoration'
import { MoleculeDecoration } from '../../MoleculeDecoration'
import { resolveSurface } from '../../surface'

type QuoteSectionProps = SectionProps<'quoteSection'>

const quoteVariants = cva('text-fg text-balance font-sans', {
  variants: {
    size: { default: 'text-quote', small: 'text-quote-sm' },
  },
  defaultVariants: { size: 'default' },
})

/** Quote set 2748:4672; Home uses Small (3720:60563). Motion stays decoration-owned. */
export function QuoteSection({ quote, attribution, decoration, surface, size }: QuoteSectionProps) {
  if (!quote) return null
  const resolved = resolveSurface(surface, 'quoteSection')
  const cleanSize = stegaClean(size) ?? 'default'
  // The spheres and the molecule are alternatives: the band draws one or neither.
  const showOrbs = resolveDecoration(decoration, 'quoteSection') === 'orbs'

  return (
    <SurfaceProvider surface={resolved}>
      <section
        {...surfaceAttrs(resolved)}
        className={cn(
          SURFACE_CLASS[resolved],
          DECORATED_BAND_CLASS,
          'px-4 lg:px-24',
          cleanSize === 'small' ? 'py-16 lg:py-32' : 'py-band-lg',
        )}
      >
        <MoleculeDecoration
          decoration={decoration}
          block="quoteSection"
          surface={resolved}
          // 167 past the gutter and 546 below the band at 402; 128 and 374 at
          // 1440, where the band is taller and the glyph rides higher in it.
          className="bottom-[-546px] left-[-167px] w-[776px] opacity-10 lg:bottom-[-374px] lg:left-[-128px]"
          visibleFrom="base"
        />

        {showOrbs ? (
          <>
            {/*
             * Two spheres bleeding off opposite edges (`1683:2139` at −563/258,
             * `1683:2655` at 734/643). On bone they are fine dark line-art with
             * no bloom — OrbitalSphere's `line` preset. Hidden below `lg`, where
             * the 402 frame has room for neither.
             */}
            <OrbitalSphere
              preset="line"
              className="-z-10 hidden lg:left-[-563px] lg:top-[258px] lg:block lg:w-[1155px]"
            />
            <OrbitalSphere
              preset="line"
              className="-z-10 hidden lg:left-[734px] lg:top-[643px] lg:block lg:w-[1304px]"
            />
          </>
        ) : null}

        <blockquote
          className={cn(
            'relative mx-auto flex w-full flex-col gap-12 text-center',
            cleanSize === 'small' ? 'max-w-article' : 'max-w-content',
          )}
        >
          <p className={quoteVariants({ size: cleanSize })}>&ldquo;{quote}&rdquo;</p>
          {attribution ? <footer className="eyebrow-lg text-fg-muted">{attribution}</footer> : null}
        </blockquote>
      </section>
    </SurfaceProvider>
  )
}

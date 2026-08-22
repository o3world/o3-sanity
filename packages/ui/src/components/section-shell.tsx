import type { HTMLAttributes, ReactNode } from 'react'
import { cva } from 'class-variance-authority'

import { cn } from '../lib/utils'
import { SurfaceProvider } from './surface-context'

/** The three-surface system every section block renders on (docs/specs/schema.md). */
export const SURFACES = ['white', 'bone', 'ink'] as const
export type Surface = (typeof SURFACES)[number]

/**
 * Surface → band classes, exported so a band that has to build its own
 * `<section>` (anything bleeding past the gutter, or painting a gradient
 * behind the container) still resolves the surface the same way this shell
 * does. Text contrast rides on the surface; per-role tones stay the content's
 * job.
 */
export const SURFACE_CLASS: Record<Surface, string> = {
  white: 'bg-white text-fg',
  bone: 'bg-bone text-fg',
  ink: 'bg-ink text-white',
}

/**
 * The DOM half of declaring a surface, to spread onto the element that paints
 * it. `[data-surface='ink']` is what re-points the text-role tokens at the
 * on-ink alphas (tokens/color.css), so a renderer's `text-fg-muted` means
 * "muted against THIS band" rather than a fixed grey.
 *
 * IT WORKS NESTED, and only because a light surface declares itself too: the
 * roles inherit, so a light card inside an ink band keeps the band's white
 * alphas until `data-surface="white"` (or `bone`) on the card points them back
 * at the light values. A plate that is neither — O3XO's yellow accent card —
 * declares no surface and names `ink`, the role no band re-points.
 *
 * Its React half is `SurfaceProvider`, and they are one act: this shell does
 * both, and a band that builds its own `<section>` reaches for this beside
 * `SURFACE_CLASS`. Declaring only the provider leaves a button readable and
 * the copy above it invisible.
 */
export function surfaceAttrs(surface: Surface) {
  return { 'data-surface': surface } as const
}

/** How far a picture behind a band is muted so the band's copy stays legible. */
export const TINTS = ['dim', 'none'] as const
export type Tint = (typeof TINTS)[number]

/**
 * Surface → the wash laid over the picture, so a band's copy keeps the
 * contrast its surface promised it. The wash is the band's OWN colour: an ink
 * band darkens toward the white it writes in, a white band lightens toward the
 * ink it writes in, and neither names a colour outside the three roles every
 * brand's token package paints (ADR 0028).
 *
 * `bg-ink/40` is the kit's Banner Tint (`4406:6598`). The light surfaces carry
 * dark copy and need more of their own colour to do it; the kit draws no light
 * photographic band to measure one from.
 */
const TINT_CLASS: Record<Surface, string> = {
  white: 'bg-white/70',
  bone: 'bg-bone/70',
  ink: 'bg-ink/40',
}

/**
 * THE PICTURE A BAND SITS ON — the media layer plus its tint, laid full-bleed
 * behind everything the band draws.
 *
 * The media arrives as children rather than as a source, because this package
 * knows nothing about Sanity and because the layer outlives the format: a
 * still today, the kit's opener video (`4406:6597`) later, through the same
 * box. Whatever is passed is stretched to the layer, so hand it something that
 * fills its parent.
 *
 * `SectionShell` takes one of these as `background` and does the positioning
 * half. A band that builds its own `<section>` — anything bleeding past the
 * gutter or painting a gradient — renders one directly, the same way it
 * reaches for `SURFACE_CLASS` and `surfaceAttrs`, and adds `relative isolate`
 * to its own band element so the negative z-index lands under the copy and no
 * further.
 *
 * The band's surface still paints under all of this: a picture that fails to
 * load leaves the colour the band declared rather than nothing.
 */
export function SectionBackground({
  surface,
  tint = 'dim',
  children,
}: {
  /** The band's surface, which decides what colour the tint is. */
  surface: Surface
  /** How far the picture is muted. Defaults to `dim`. */
  tint?: Tint
  /** The media element — anything that fills its parent. */
  children: ReactNode
}) {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 [&>*]:h-full [&>*]:w-full [&>*]:object-cover">
        {children}
      </div>
      {tint === 'none' ? null : <div className={cn('absolute inset-0', TINT_CLASS[surface])} />}
    </div>
  )
}

/** The container measures the frames use (tokens/layout.css). */
export const SECTION_WIDTH_CLASS = {
  /** 1248px — the 1440 design width less two 96px gutters. The standard shell. */
  section: 'max-w-section',
  /** 1034px — the narrower measure for centred statements (the pull quote). */
  content: 'max-w-content',
  /** No measure — the band's own children decide. */
  full: 'max-w-none',
} as const
export type SectionWidth = keyof typeof SECTION_WIDTH_CLASS

/**
 * The vertical steps the canonical frames use (tokens/layout.css).
 * **Section rhythm is not one value** — the frames hand-tune each band, and
 * the two edges routinely differ (`96px 96px 128px` on partners,
 * `128px 96px 192px` on platforms). So they are separate keys, not one `py`.
 */
const PAD_TOP = {
  none: 'pt-0',
  sm: 'pt-band-sm',
  md: 'pt-band-md',
  lg: 'pt-band-lg',
} as const
const PAD_BOTTOM = {
  none: 'pb-0',
  sm: 'pb-band-sm',
  md: 'pb-band-md',
  lg: 'pb-band-lg',
} as const
export type BandStep = keyof typeof PAD_TOP

const sectionShellVariants = cva(
  // 96px at 1440, 20px at 402 — `--spacing-gutter`, not the prototype's 24px.
  'px-gutter',
  {
    variants: {
      surface: SURFACE_CLASS,
      top: PAD_TOP,
      bottom: PAD_BOTTOM,
    },
    defaultVariants: { surface: 'white', top: 'lg', bottom: 'lg' },
  },
)

export interface SectionShellProps extends HTMLAttributes<HTMLElement> {
  surface?: Surface
  /** Top band step. Defaults to `lg`; a band with a frame should name its own. */
  top?: BandStep
  /** Bottom band step. Defaults to `lg`. */
  bottom?: BandStep
  /** Inner container measure; defaults to the standard 1248px shell. */
  width?: SectionWidth
  /** Extra classes for the inner container (the outer band takes className). */
  contentClassName?: string
  /**
   * The picture the band sits on — a `SectionBackground`. The band's surface
   * still paints under it and still decides what colour the copy is, so a band
   * with a picture declares the same surface it would without one.
   */
  background?: ReactNode
}

/**
 * THE section organism: a full-bleed surface band carrying the frames' gutter
 * and vertical rhythm, wrapped around a centred container. Every section block
 * renders inside one — `surface` is a section-block field, not per-page.
 *
 * A band that has to **bleed past the gutter** (the partners logo row, the
 * case-study cards) or paint a **gradient** behind its container builds its own
 * `<section>` and reaches for `SURFACE_CLASS` instead. That is deliberate:
 * teaching this shell every exception would make it the union of all eight
 * bands rather than the shape they share. Such a band reaches for
 * `SurfaceProvider` and `surfaceAttrs` in the same breath — painting a surface
 * and declaring it are one act, and the bands that use this shell get all
 * three here.
 */
export function SectionShell({
  surface,
  top,
  bottom,
  width = 'section',
  className,
  contentClassName,
  background,
  children,
  ...rest
}: SectionShellProps) {
  return (
    // `?? 'white'` is the cva default spelled once more, because the band
    // declares what it PAINTS: an omitted prop draws white, so it declares
    // white.
    <SurfaceProvider surface={surface ?? 'white'}>
      <section
        {...surfaceAttrs(surface ?? 'white')}
        className={cn(
          sectionShellVariants({ surface, top, bottom }),
          // Only when there is something to position. A band with no picture
          // renders the markup it always did — `isolate` on every band would
          // be a new stacking context under every decoration that bleeds out
          // of one.
          background ? 'relative isolate' : undefined,
          className,
        )}
        {...rest}
      >
        {background}
        <div className={cn('mx-auto w-full', SECTION_WIDTH_CLASS[width], contentClassName)}>
          {children}
        </div>
      </section>
    </SurfaceProvider>
  )
}

export { sectionShellVariants }

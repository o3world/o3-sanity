import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../lib/utils'

const eyebrowVariants = cva('block', {
  variants: {
    /**
     * The two steps the frames read at. `eyebrow` / `eyebrow-lg` are the
     * tailwind-config utilities bundling size, weight, tracking and the
     * uppercase transform (tokens/typography.css).
     */
    size: {
      /** 16px — the card-level kicker ("HEALTHCARE", `1883:3561`). */
      base: 'eyebrow',
      /** 16 → 18px — the section-level kicker ("OUR PARTNERS", `1864:2392`). */
      lg: 'eyebrow-lg',
    },
    tone: {
      // muted — #636363 (Figma `text/tertiary`). The partners wall draws its
      // kicker this grey (`1864:2392`) and it is still the default, but it is
      // NOT the section-level rule it was recorded as: every section eyebrow
      // on the About frame is brand red — see `brand`.
      muted: 'text-fg-muted',
      // inverse — plain white, for an eyebrow on an ink band or over a card
      // scrim (`1883:3561`, `1634:1183`). One of two dark-surface treatments,
      // not the only one — see `brand`. The Case Study Card set (`2089:3963`)
      // is a third, in the deeper red, which that card names as a class rather
      // than a tone here: `--color-brand-deep` is O3's token alone and this
      // component is shared.
      inverse: 'text-white',
      // brand — the red kicker, #EB1000 (`2457:1854`), and the section-level
      // treatment the About frame draws throughout: the hero
      // (`I2960:6876;2960:6852`), "LEADERSHIP TEAM" (`1927:6436`), "CAREERS"
      // (`1928:6438`) and "BEYOND O3 WORLD" (`2960:7084`) — the last on ink,
      // so it carries across surfaces. The one grey kicker on that frame sits
      // in the imported "Why O3" band, whose DOM-ish layer names and #9A9A98
      // text are html.to.design residue rather than a drawn value.
      //
      // Not the cva default, because the default also serves the card-level
      // kicker: a section band names this tone at its own call site.
      brand: 'text-brand',
      // ink — the near-black kicker (`2975:9554`). The rail's breakdown label
      // takes it where the same row's promise label takes `brand`, so the two
      // labels read as a pair rather than as text and heading.
      ink: 'text-ink',
    },
  },
  // Flipped from `brand` in #42, the page layer that rebuilt the sections
  // these appear in. `docs/figma-components.md` recorded the old default as
  // contradicting every canonical frame; it turned out to have five call
  // sites, not the 52 the token pass estimated.
  defaultVariants: { size: 'base', tone: 'muted' },
})

export interface EyebrowProps
  extends HTMLAttributes<HTMLParagraphElement>, VariantProps<typeof eyebrowVariants> {}

/**
 * The uppercase kicker above headings and inside cards — "OUR PARTNERS",
 * "HEALTHCARE · PEDIATRIC SYSTEMS". Margins are the call site's job.
 */
export function Eyebrow({ className, size, tone, ...props }: EyebrowProps) {
  return <p className={cn(eyebrowVariants({ size, tone }), className)} {...props} />
}

export { eyebrowVariants }

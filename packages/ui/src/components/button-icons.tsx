import type { ComponentType, ReactNode, SVGProps } from 'react'

import { ArrowIcon } from './arrow-icon'

export interface ButtonIconProps extends SVGProps<SVGSVGElement> {
  /** Rendered width/height in px. The `Button` set draws its glyph at 20. */
  size?: number
}

/**
 * The shell every glyph in this set draws inside: a 24-unit box stroked with
 * `currentColor`, so an icon takes the colour of the label beside it and no
 * fill ever has to be told what band it is on.
 *
 * Inline SVG rather than a font, and vendored rather than installed (ADR 0009).
 * The paths are traced from **Lucide** (ISC), which is what Figma's `Icon` set
 * (`2177:1556`) draws — same 24-unit geometry, same round caps — but nothing is
 * imported: the shipped artifact is ours, and a design-system package that
 * pulls an icon library in for three glyphs pays for the whole library.
 */
function Glyph({ size = 20, children, ...rest }: ButtonIconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

/** `Icon=external-link` (`2177:1585`) — the button leaves the site. */
export function ExternalLinkIcon(props: ButtonIconProps) {
  return (
    <Glyph {...props}>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </Glyph>
  )
}

/** `Icon=chevron-down` (`2177:1567`) — the button jumps further down this page. */
export function ChevronDownIcon(props: ButtonIconProps) {
  return (
    <Glyph {...props}>
      <path d="m6 9 6 6 6-6" />
    </Glyph>
  )
}

/**
 * THE CURATED SET a button's icon knob picks from, keyed by the value an editor
 * stores.
 *
 * Short on purpose, and each entry answers one of the destinations a button can
 * already have: the arrow for an ordinary link, the external glyph for a URL
 * that leaves the site, the chevron for an anchor further down this page.
 * `none` is not in here — an icon nobody drew is the absence of an entry, which
 * is also what an unrecognised name resolves to.
 *
 * Read by two consumers that must not disagree: `ButtonLink` fills the button's
 * icon slot from it, and the canvas hands it to the knob control so the picker
 * shows the glyph rather than its name. The control gets the map from the app
 * (`createCanvasComponents({glyphs})`) rather than importing it, because the
 * knob declaration carries `optionPreview: 'glyph'` and a name — no component.
 */
export const BUTTON_ICONS: Readonly<Record<string, ComponentType<ButtonIconProps>>> = {
  arrow: ArrowIcon,
  external: ExternalLinkIcon,
  down: ChevronDownIcon,
}

import Link from 'next/link'
import { stegaClean } from '@sanity/client/stega'

import { ArrowIcon, Button, buttonVariants, cn, type ButtonProps } from '@o3/ui'

import { buttonDestination, type ButtonLinkData } from '@/content/buttonDestination'

const VARIANTS = ['dark', 'light', 'ghost'] as const
type ButtonVariant = (typeof VARIANTS)[number]

/**
 * The pre-#42 enum, mapped rather than dropped. `load` replaces every
 * pipeline-owned document, but a dataset that has not been rebuilt since the
 * rename still carries the old strings — and a locked document keeps them
 * forever. `brand` becomes `dark` because the canonical frames have no red
 * button (docs/figma-components.md); `inverse` was already the white fill.
 */
const LEGACY_VARIANTS: Record<string, ButtonVariant> = { brand: 'dark', inverse: 'light' }

function resolveVariant(value: string | null | undefined): ButtonVariant {
  const clean = stegaClean(value) ?? ''
  if (VARIANTS.includes(clean as ButtonVariant)) return clean as ButtonVariant
  return LEGACY_VARIANTS[clean] ?? 'dark'
}

/**
 * The one button renderer.
 *
 * **It picks its own element from its own data.** A button with a destination
 * is a link and renders one; a button with none acts on the page it is
 * standing on and renders a real `<button>`. Nothing is passed in to decide
 * that — the caller has no say, because a visitor's ability to middle-click a
 * link, and a screen reader's ability to announce one, follow from what the
 * editor filled in rather than from where the button was placed.
 *
 * That is why this is one element rather than a `<button>` inside an `<a>`:
 * nested interactive elements are what made the old markup announce twice and
 * swallow a cmd-click. `buttonVariants` is the shared drawing, applied to
 * whichever element wins.
 *
 * `arrow` is a render-side prop, not a schema field, for the reason #38 gives:
 * Figma's `Show right icon` toggles the presence of a child rather than the
 * button's appearance, so it is a prop everywhere — including here. The chrome
 * button sets it because the nav pill's button (`2225:2877`) carries a trailing
 * icon.
 */
export function ButtonLink({
  button,
  arrow = false,
  size,
  variant,
  className,
  buttonClassName,
  control,
}: {
  button: ButtonLinkData | null | undefined
  arrow?: boolean
  /** `Button`'s authored size step. Base is what the frames draw; section headers use Large. */
  size?: 'base' | 'large'
  /**
   * Force the fill, ignoring the editor's choice. For **chrome and section
   * shells that own their own background**: the nav pill is always a dark
   * scrim, so a `dark` button on it is unreadable no matter what a Site
   * Settings editor picks. Content bands leave this alone.
   */
  variant?: ButtonVariant
  /** Positioning and spacing on the rendered element — never the fill. */
  className?: string
  /**
   * Overrides on the rendered element's own fill classes, merged over its
   * variant.
   *
   * This is the seam for a caller whose surface changes underneath a button —
   * the nav's has to invert with the bar's ink flip — not a general escape
   * hatch; a fill a *document* chooses is `variant`.
   */
  buttonClassName?: string
  /**
   * Attributes for the control arm, applied only when there is no destination.
   * A link has no `type` and cannot be disabled, so a button that goes
   * somewhere ignores them.
   */
  control?: Pick<ButtonProps, 'type' | 'aria-disabled' | 'aria-describedby'>
}) {
  if (!button?.label) return null

  const fill = variant ?? resolveVariant(button.variant)
  const destination = buttonDestination(button)
  // One expression for both arms: the label and whatever trails it are the
  // same drawing whichever element is underneath.
  const content = (
    <>
      {button.label}
      {arrow ? <ArrowIcon /> : null}
    </>
  )

  if (destination.kind === 'none') {
    return (
      <Button
        variant={fill}
        size={size}
        className={cn(className, buttonClassName)}
        type="button"
        {...control}
      >
        {content}
      </Button>
    )
  }

  return (
    <Link
      href={destination.href}
      className={cn(buttonVariants({ variant: fill, size }), className, buttonClassName)}
      // A URL that leaves the site opens beside the page the visitor was
      // reading, and `noopener` keeps the opened page off `window.opener`.
      {...(destination.kind === 'external' && destination.offsite
        ? { target: '_blank', rel: 'noopener noreferrer' }
        : {})}
    >
      {content}
    </Link>
  )
}

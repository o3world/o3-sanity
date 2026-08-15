'use client'

import Link from 'next/link'
import { stegaClean } from '@sanity/client/stega'

import { resolveContrast } from '@o3/block-spec'
import { ArrowIcon, Button, buttonVariants, cn, useSurface, type ButtonProps } from '@o3/ui'

import { buttonDestination, type ButtonLinkData } from '@/content/buttonDestination'

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
 * **It also picks its own fill** (#147, ADR 0024). `contrast` defaults to
 * `auto`, and Auto reads the nearest declared surface — so a band changing
 * from white to ink repaints the buttons on it, and no caller forces a fill
 * past the editor's choice. This is the layer that knows about surfaces:
 * `resolveContrast` is the whole rule, `@o3/ui`'s `Button` still knows nothing
 * but `dark | light | ghost`, and `useSurface` is the only reason this
 * component is a client component at all.
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
  className,
  control,
}: {
  button: ButtonLinkData | null | undefined
  arrow?: boolean
  /** `Button`'s authored size step. Base is what the frames draw; section headers use Large. */
  size?: 'base' | 'large'
  /**
   * Positioning, spacing, and the responsive exceptions a composition owns —
   * merged over the resolved fill's own classes, which is how the rail panels
   * draw a ghost at 402 and the editor's fill from `lg` up.
   *
   * A fill a *document* chooses is `contrast`, and a fill a *band* implies is
   * the surface it declares. Neither is this.
   */
  className?: string
  /**
   * Attributes for the control arm, applied only when there is no destination.
   * A link has no `type` and cannot be disabled, so a button that goes
   * somewhere ignores them.
   */
  control?: Pick<ButtonProps, 'type' | 'aria-disabled' | 'aria-describedby'>
}) {
  // Before the early return: a hook cannot sit behind one.
  const surface = useSurface()

  if (!button?.label) return null

  // Cleaned here rather than inside `resolveContrast`, which lives in the
  // zero-dependency spec package and cannot import stega. A stega'd `"ghost"`
  // would otherwise match no fill and quietly resolve as Auto in draft mode.
  const fill = resolveContrast(stegaClean(button.contrast), surface)
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
      <Button variant={fill} size={size} className={className} type="button" {...control}>
        {content}
      </Button>
    )
  }

  return (
    <Link
      href={destination.href}
      className={cn(buttonVariants({ variant: fill, size }), className)}
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

'use client'

import Link from 'next/link'
import { stegaClean } from '@sanity/client/stega'

import { resolveContrast } from '@o3/block-spec'
import { BUTTON_ICONS, Button, buttonVariants, cn, useSurface, type ButtonProps } from '@o3/ui'

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
 * **It also picks its own fill** (#147, ADR 0026). `contrast` defaults to
 * `auto`, and Auto reads the nearest declared surface — so a band changing
 * from white to ink repaints the buttons on it, and no caller forces a fill
 * past the editor's choice. This is the layer that knows about surfaces:
 * `resolveContrast` is the whole rule, `@o3/ui`'s `Button` still knows nothing
 * but `dark | light | ghost`, and `useSurface` is the only reason this
 * component is a client component at all.
 *
 * **It also picks its own icon** (#151). `icon` is a knob on the component, so
 * the glyph is the editor's and no caller passes one: the arrow is the default,
 * which is what the nav pill (`2225:2877`) and every other frame draws, and
 * `none` is how an editor takes it away.
 */
export function ButtonLink({
  button,
  size,
  className,
  control,
}: {
  button: ButtonLinkData | null | undefined
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
  // ONE GLYPH NODE, drawn by whichever arm wins. An absent field is the knob's
  // default — Sanity writes `initialValue` only when the form creates the
  // instance, so every button saved before this field existed reads as `arrow`,
  // which is what all of them were passed by hand. A name the set does not hold
  // — `none`, or a value from a dataset the schema has moved past — draws
  // nothing, because a button with no icon is a real answer.
  const iconName = stegaClean(button.icon) || 'arrow'
  const Icon = Object.prototype.hasOwnProperty.call(BUTTON_ICONS, iconName)
    ? BUTTON_ICONS[iconName]
    : undefined
  const icon = Icon ? <Icon /> : null

  if (destination.kind === 'none') {
    return (
      <Button
        variant={fill}
        size={size}
        className={className}
        type="button"
        icon={icon}
        {...control}
      >
        {button.label}
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
      {button.label}
      {/* The same node the control arm hands to `Button`'s icon slot. This arm
          styles a `<Link>` with `buttonVariants` and never mounts `Button`, so
          there is no slot here to fill — the glyph is placed directly, in the
          position the same drawing puts it. */}
      {icon}
    </Link>
  )
}

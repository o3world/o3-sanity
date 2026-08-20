'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'

import { cn } from '@o3/ui'
import { ButtonLink, resolveButtonHref } from '@o3/content-ui'

import { NavPanel } from './NavPanel'
import { isNavGroup, type NavButton, type NavGroup, type NavItem } from './navItems'

/**
 * The desktop row: the links, the dropdowns, and the bar's button.
 *
 * `List` (`4404:3995`) is right-aligned with a 32px gap; each `Item`
 * (`4404:3997`) is 44px tall with 12px between its label and its caret, and
 * the label is Figtree Medium 14/20 — `--text-nav` under O3XO's ramp, to the
 * pixel (#238).
 *
 * **One panel at a time**, so the open key lives here rather than in each
 * dropdown: opening a second one has to close the first, and two components
 * holding independent booleans cannot agree on that.
 *
 * Pointer and keyboard reach the panel by different routes and both are real.
 * The live nav opens on hover, so hover opens; a trigger is a `<button>` with
 * `aria-expanded`, so Enter and Space open; Escape closes and puts focus back
 * on the trigger it came from. Leaving the row — with the mouse or with Tab —
 * closes whatever is open, which is what stops a panel outliving the
 * intention behind it.
 */
export function NavRow({
  items,
  button,
  className,
}: {
  items: readonly NavItem[]
  button: NavButton
  className?: string
}) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const rowRef = useRef<HTMLDivElement>(null)

  // The two ways out that are not "move away from the row", both on the
  // document because both are answers to something happening elsewhere.
  //
  // A pointer press outside is a dismissal — `pointerdown` rather than `click`
  // so the panel is gone before the press lands on whatever is under it, and
  // capture so a stopped-propagation handler cannot swallow it. Escape closes
  // from wherever focus is, and hands it back to the trigger that opened the
  // panel: an open trigger is the one reading `aria-expanded="true"`, so the
  // markup that tells a screen reader which control is open is the same markup
  // that says where focus goes.
  useEffect(() => {
    if (!openKey) return
    const dismiss = (event: PointerEvent) => {
      if (!rowRef.current?.contains(event.target as Node)) setOpenKey(null)
    }
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const trigger = rowRef.current?.querySelector<HTMLButtonElement>('[aria-expanded="true"]')
      setOpenKey(null)
      trigger?.focus()
    }
    document.addEventListener('pointerdown', dismiss, true)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', dismiss, true)
      document.removeEventListener('keydown', close)
    }
  }, [openKey])

  return (
    <div
      ref={rowRef}
      className={cn('items-center justify-end gap-8', className)}
      onMouseLeave={() => setOpenKey(null)}
      // Tabbing out of the row closes the panel. `focusout` bubbles where
      // `blur` does not, which is what lets one handler cover every control
      // inside an open panel.
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenKey(null)
      }}
    >
      <ul className="flex items-center gap-8">
        {items.map((item, index) => {
          const key = item._key ?? `nav-${index}`
          if (!isNavGroup(item)) {
            return (
              <li key={key}>
                <Link
                  href={resolveButtonHref(item)}
                  className="text-nav focus-visible:ring-accent duration-(--duration-hover) flex min-h-11 items-center text-white transition-opacity ease-out hover:opacity-70 focus-visible:outline-none focus-visible:ring-2"
                  onMouseEnter={() => setOpenKey(null)}
                >
                  {item.label}
                </Link>
              </li>
            )
          }
          return (
            <NavDropdown
              key={key}
              group={item}
              open={openKey === key}
              onOpen={(next) => setOpenKey(next ? key : null)}
            />
          )
        })}
      </ul>
      {button ? (
        // The bar's own `Button` (`4404:4036`) — the kit's action red with a
        // white label. `contrast` has no arm at that fill (the shared set draws
        // `dark | light | ghost`), so the composition paints it through the
        // `className` seam `ButtonLink` documents, and the button's own
        // geometry is left to the ticket that owns it (#237, story 10).
        <span onMouseEnter={() => setOpenKey(null)}>
          <ButtonLink button={button} className="bg-brand hover:bg-brand/90 text-white" />
        </span>
      ) : null}
    </div>
  )
}

function NavDropdown({
  group,
  open,
  onOpen,
}: {
  group: NavGroup
  open: boolean
  onOpen: (open: boolean) => void
}) {
  const panelId = useId()

  // `static` says out loud that the panel below escapes this item: its
  // containing block is the bar, which is what lets it span the full width
  // from a list item that is 90px wide.
  return (
    <li className="static">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpen(!open)}
        // Hover-open lives on the trigger rather than on the item, so the
        // handler is on the control a visitor is actually pointing at. Moving
        // down into the panel keeps it open — only leaving the whole row
        // closes it.
        onMouseEnter={() => onOpen(true)}
        className="text-nav focus-visible:ring-accent duration-(--duration-hover) flex min-h-11 items-center gap-3 text-white transition-opacity ease-out hover:opacity-70 focus-visible:outline-none focus-visible:ring-2"
      >
        {group.label}
        {/* `Component 1` (`4404:4002`) — a 6 × 3 caret in a 16px box, white,
            flipping when the panel is open the way the live trigger's does. */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          focusable="false"
          className={cn(
            'duration-(--duration-hover) transition-transform ease-out',
            open && '-scale-y-100',
          )}
        >
          <path
            d="M5 6.5 8 9.5l3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/*
       * The panel hangs under the bar rather than growing it. The live nav
       * expands its own fixed bar; ours is `sticky`, so expanding it would
       * push the page down every time a panel opened.
       *
       * Which is why the fill is opaque. o3xo.ai draws its panel at 90% black
       * over that expanded bar's own 95%, two fills that between them pass
       * half a percent of the page. Below the bar this is the only fill there
       * is, and one at 95% hands back 5% of whatever is behind it — 13/255 of
       * white type, which reads. Nor is there a `backdrop-filter`: the bar
       * carries one, so the bar is this panel's backdrop root, and what a
       * filter here would blur is the nothing painted inside it.
       *
       * `hidden` rather than unmounted: the markup is the same either way, and
       * a panel that exists in the DOM is one the render layer can assert on
       * without driving a pointer.
       */}
      <div
        id={panelId}
        hidden={!open}
        className={cn('bg-ink-deep absolute inset-x-0 top-full z-40', !open && 'hidden')}
      >
        <NavPanel group={group} />
      </div>
    </li>
  )
}

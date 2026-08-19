'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ButtonLink, resolveButtonHref } from '@o3/content-ui'
import { CloseIcon, cn } from '@o3/ui'

import { NavPanelCard } from './NavPanelCard'
import { isNavGroup, type NavButton, type NavItem } from './navItems'

/**
 * The narrow bar's menu — the trigger, and the panel it opens.
 *
 * **The bar below the desktop breakpoint is the mark and this control**, and
 * nothing else. That is what the kit's own import serves at its 810 and 390
 * widths (`.framer-2d4wdq` drops the list and keeps a 44px icon button), and
 * what o3xo.ai renders at 402: no inline Contact button, no links.
 *
 * Opened, the live site turns the bar into a full-height scrolling column in
 * the same near-black — `Mobile-opened`, `max-height: 100vh`, `overflow:
 * auto`, `overscroll-behavior: contain` — with every dropdown already
 * expanded under an accent heading rather than behind a second tap. Two
 * accordions deep on a phone is a menu you have to learn; the live one shows
 * everything and scrolls, and that is what this draws.
 *
 * The one thing invented from tokens: the heading's rule. The live headings
 * sit at `rgb(255,201,43)` over a hairline, which is `accent` and
 * `on-ink-line` here — O3XO's own roles, not a second yellow.
 */
export function MobileNav({
  items,
  button,
  className,
}: {
  items: readonly NavItem[]
  button: NavButton
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)

  // A menu that survives a route change is a menu covering the page the
  // visitor just asked for. Closing on the path rather than on each link is
  // one rule for every destination in here — the cards, the panel rows and the
  // button alike — and a client-side navigation does not unmount this layout,
  // so nothing else would close it.
  const pathname = usePathname()
  useEffect(() => setOpen(false), [pathname])

  // `open` also holds the body still while the panel owns the screen, and puts
  // Escape on the document — from wherever focus has got to inside a
  // full-height panel, the key means "close this", and focus goes back to the
  // control that opened it.
  useEffect(() => {
    if (!open) return
    const { style } = document.body
    const previous = style.overflow
    style.overflow = 'hidden'
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('keydown', close)
    return () => {
      style.overflow = previous
      document.removeEventListener('keydown', close)
    }
  }, [open])

  return (
    <div className={cn('flex items-center', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen(!open)}
        // `.framer-1dzkbx4` — a 44px square with a hairline, 10px of padding
        // around a 24px glyph.
        className="border-on-ink-line focus-visible:ring-accent duration-(--duration-hover) flex size-11 items-center justify-center rounded-lg border text-white transition-colors ease-out hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2"
      >
        {open ? <CloseIcon size={24} /> : <BarsIcon />}
      </button>

      <div
        id={panelId}
        hidden={!open}
        className={cn(
          // Below the 64px bar, down to the bottom of the screen, scrolling
          // inside itself.
          //
          // `absolute` and a computed height rather than `fixed inset-y`, and
          // that is not a preference: the bar carries `backdrop-filter`, which
          // makes it the containing block for every `position: fixed`
          // descendant — so a fixed panel resolves `bottom-0` against a 64px
          // bar and collapses to nothing. The bar is `sticky`, so an absolute
          // panel travels with it anyway.
          'bg-ink-deep/95 absolute inset-x-0 top-full z-40 h-[calc(100svh-4rem)] overflow-y-auto overscroll-contain backdrop-blur-[4px]',
          !open && 'hidden',
        )}
      >
        <nav aria-label="Menu" className="px-gutter flex flex-col gap-8 py-8">
          {items.map((item, index) => {
            const key = item._key ?? `nav-${index}`
            if (!isNavGroup(item)) {
              return (
                <Link
                  key={key}
                  href={resolveButtonHref(item)}
                  className="text-accent focus-visible:ring-accent text-nav border-on-ink-line border-b pb-3 font-semibold uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2"
                >
                  {item.label}
                </Link>
              )
            }
            return (
              <section key={key} className="flex flex-col gap-4">
                <h2 className="text-accent text-nav border-on-ink-line border-b pb-3 font-semibold uppercase tracking-[0.06em]">
                  {item.label}
                </h2>
                <div className="flex flex-col gap-2.5">
                  {(item.items ?? []).map((child, childIndex) => (
                    <NavPanelCard
                      key={child._key ?? `card-${childIndex}`}
                      item={child}
                      className="p-4"
                    />
                  ))}
                </div>
                {item.button?.label ? (
                  <Link
                    href={resolveButtonHref(item.button)}
                    className="text-nav focus-visible:ring-accent inline-flex w-fit items-center gap-2 text-white focus-visible:outline-none focus-visible:ring-2"
                  >
                    {item.button.label}
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                ) : null}
              </section>
            )
          })}
          {button ? (
            <ButtonLink button={button} className="bg-brand hover:bg-brand/90 w-full text-white" />
          ) : null}
        </nav>
      </div>
    </div>
  )
}

/**
 * The kit's trigger glyph — three bars on the 24 grid, not the two O3's frames
 * draw (`MenuIcon` in `packages/ui` is that other drawing, and belongs to that
 * other design).
 */
function BarsIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

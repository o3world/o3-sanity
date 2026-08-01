'use client'

import { useState } from 'react'
import Link from 'next/link'

import { MenuIcon, Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@o3/ui'
import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { CtaLink, resolveCtaHref } from '@/content/CtaLink'

type Settings = NonNullable<SITE_SETTINGS_QUERY_RESULT>

interface MobileNavMenuProps {
  items: readonly NonNullable<Settings['navItems']>[number][]
  cta?: Settings['primaryCta'] | null
}

/**
 * The 402 nav's menu, behind the "Open menu" affordance (`1814:1636`).
 *
 * **The opened panel has no Figma frame** — the mobile frames draw the closed
 * hamburger and stop (ADR 0006 records this as a genuine coverage gap). So
 * nothing here invents visual language: the panel reuses the bar's own
 * `ink-deep` surface, and the links keep the `text-button` treatment the 1440
 * pill gives them. Only the layout — a vertical stack — is a code decision,
 * and it is the one the closed affordance implies.
 *
 * The only interactive part of the chrome, hence the one client component.
 */
export function MobileNavMenu({ items, cta }: MobileNavMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open menu"
        className="focus-visible:ring-brand duration-(--duration-hover) -mr-2 text-white/85 transition-opacity ease-out hover:opacity-70 focus-visible:outline-none focus-visible:ring-2"
      >
        <MenuIcon />
      </SheetTrigger>

      <SheetContent side="right" className="bg-ink-deep w-full text-white sm:max-w-sm">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <nav aria-label="Menu" className="flex flex-col gap-8 px-5 pt-24">
          {items.map((item, i) => (
            // Closing on navigation is manual: a client-side route change does
            // not unmount the portal, so the panel would survive the link.
            <SheetClose asChild key={item._key ?? `nav-${i}`}>
              <Link href={resolveCtaHref(item)} className="text-button text-white">
                {item.label}
              </Link>
            </SheetClose>
          ))}
          {cta ? (
            <SheetClose asChild>
              <div className="mt-4 self-start">
                <CtaLink cta={cta} arrow />
              </div>
            </SheetClose>
          ) : null}
        </nav>
      </SheetContent>
    </Sheet>
  )
}

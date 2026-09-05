'use client'

import { useState } from 'react'

import {
  MenuIcon,
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  SurfaceProvider,
  surfaceAttrs,
} from '@o3/ui'
import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { ButtonLink } from '../ButtonLink'
import { resolveButtonHref } from '../buttonDestination'

import { NavLink } from './NavLink'

type Settings = NonNullable<SITE_SETTINGS_QUERY_RESULT>

interface MobileNavMenuProps {
  items: readonly NonNullable<Settings['navItems']>[number][]
  button?: Settings['primaryButton'] | null
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
export function MobileNavMenu({ items, button }: MobileNavMenuProps) {
  const [state, setState] = useState<'closed' | 'open' | 'navigated'>('closed')

  return (
    <Sheet open={state === 'open'} onOpenChange={(open) => setState(open ? 'open' : 'closed')}>
      <SheetTrigger
        aria-label="Open menu"
        // The frame draws the bars at `rgba(255,255,255,0.85)`. Expressed as
        // opacity on an inherited `currentColor` rather than as a white at an
        // alpha, so the 402 bar's ink flip (SiteNav) reaches the hamburger the
        // same way it reaches the links — 85% of whichever ink is live.
        className="focus-visible:ring-brand duration-(--duration-hover) opacity-85 transition-opacity ease-out hover:opacity-70 focus-visible:outline-none focus-visible:ring-2"
      >
        <MenuIcon />
      </SheetTrigger>

      {/* The panel is its own dark field, portalled out of the bar — so it
          declares the surface rather than inheriting the bar's. Navigation
          ends modal ownership immediately; manual closure retains the exit
          animation. A retained exit can swallow a rapid touch on the trigger. */}
      {state !== 'navigated' && (
        <SurfaceProvider surface="ink">
          <SheetContent
            side="right"
            {...surfaceAttrs('ink')}
            className="bg-ink-deep w-full text-white sm:max-w-sm"
          >
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <nav aria-label="Menu" className="flex flex-col gap-8 px-5 pt-24">
              {items.map((item, i) => (
                <NavLink
                  key={item._key ?? `nav-${i}`}
                  href={resolveButtonHref(item)}
                  className="text-button text-white"
                  onNavigate={() => setState('navigated')}
                >
                  {item.label}
                </NavLink>
              ))}
              {button ? (
                <div className="mt-4 self-start">
                  <ButtonLink button={button} onNavigate={() => setState('navigated')} />
                </div>
              ) : null}
            </nav>
          </SheetContent>
        </SurfaceProvider>
      )}
    </Sheet>
  )
}

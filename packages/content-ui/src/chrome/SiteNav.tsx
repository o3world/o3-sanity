import type { ReactNode } from 'react'

import { SurfaceProvider } from '@o3/ui'
import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { ButtonLink } from '../ButtonLink'
import { resolveButtonHref } from '../buttonDestination'

import { MobileNavMenu } from './MobileNavMenu'
import { NavLink } from './NavLink'
import { NavHomeLink } from './NavHomeLink'
import { NAV_INK_TARGET, NavInk } from './NavInk'

interface SiteNavProps {
  settings: SITE_SETTINGS_QUERY_RESULT
  brandMark: ReactNode
  menuUtilities?: ReactNode
}

const NAV_BUTTON_INK =
  'group-data-[ink=dark]:[--button-bg:var(--color-ink)] group-data-[ink=dark]:[--button-fg:var(--color-white)] group-data-[ink=dark]:[--button-hover:var(--color-btn-neutral-hover)] group-data-[ink=dark]:[--button-press:var(--color-utility)] group-data-[ink=dark]:[--button-focus:var(--color-line)]'

/** Homepage chrome: desktop 3720:60473 and mobile 1814:1618. */
export function SiteNav({ settings, brandMark, menuUtilities }: SiteNavProps) {
  const navItems = settings?.navItems ?? []
  const button = settings?.primaryButton ?? null

  return (
    <SurfaceProvider surface="ink">
      <header
        id={NAV_INK_TARGET}
        suppressHydrationWarning
        className="lg:top-(--spacing-nav-pinned) group fixed inset-x-0 top-0 z-50"
      >
        <NavInk />
        <nav
          aria-label="Primary"
          className="bg-scrim-pill group-data-[ink=dark]:bg-scrim-light group-data-[ink=dark]:text-fg duration-(--duration-ink) lg:rounded-nav relative flex min-h-20 items-center justify-between gap-4 p-4 text-white backdrop-blur-[16px] backdrop-saturate-[1.25] transition-[background-color,color] ease-out [view-transition-name:site-nav] lg:mx-auto lg:w-fit lg:pl-12"
        >
          <NavHomeLink
            aria-label={`${settings?.title ?? 'O3'} home`}
            className="focus-visible:ring-brand flex size-12 shrink-0 items-center justify-center focus-visible:outline-none focus-visible:ring-2 lg:hidden"
          >
            {brandMark}
          </NavHomeLink>
          <div className="hidden items-center lg:flex lg:gap-12">
            <ul className="contents">
              {navItems.map((item, i) => (
                <li key={item._key ?? `nav-${i}`}>
                  <NavLink
                    href={resolveButtonHref(item)}
                    className="text-button hover:text-brand focus-visible:ring-brand duration-(--duration-hover) transition-colors ease-out focus-visible:outline-none focus-visible:ring-2"
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            {button ? <ButtonLink button={button} className={NAV_BUTTON_INK} /> : null}
          </div>
          <div className="ml-auto flex items-center gap-4 lg:hidden">
            {button ? <ButtonLink button={button} className={NAV_BUTTON_INK} /> : null}
            <MobileNavMenu items={navItems} button={button} utilities={menuUtilities} />
          </div>
        </nav>
        <NavHomeLink
          aria-label={`${settings?.title ?? 'O3'} home`}
          className="bg-scrim-pill group-data-[ink=dark]:bg-scrim-light group-data-[ink=dark]:text-fg duration-(--duration-ink) focus-visible:ring-brand absolute left-8 top-0 hidden size-20 items-center justify-center rounded-full text-white backdrop-blur-[16px] transition-[background-color,color] ease-out focus-visible:outline-none focus-visible:ring-2 lg:flex"
        >
          {brandMark}
        </NavHomeLink>
      </header>
    </SurfaceProvider>
  )
}

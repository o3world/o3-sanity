import { getSiteSettings } from '@o3/content-runtime/site-settings'
import { UtilityNav } from '@o3/content-ui/chrome'

/**
 * The brand-property strip, on the home route and nowhere else.
 *
 * It is a parallel route rather than a check inside the layout because the
 * layout cannot read a path and a client hook cannot answer one during a
 * prerender: `usePathname` is null in the static shell, so a gate written that
 * way leaves the strip out of the HTML and pops it in at hydration, pushing
 * the page down 50px. A slot is matched by the router itself — this file for
 * `/`, `default.tsx` for every route under it — so the answer is in the HTML.
 */
export default async function UtilitySlot() {
  const settings = await getSiteSettings()
  return <UtilityNav settings={settings} />
}

/**
 * O3XO's own site chrome — the dropdown nav and the light footer the _O3XO: UI
 * kit_'s Navigation canvas (`4404:3961`) draws.
 *
 * **This is the fork ADR 0028's second addendum authorises**, and its whole
 * point is that it is not shared: `@o3/content-ui/chrome` is O3's pill and
 * orbital footer, unchanged and still O3's. Nothing here is promoted until o3
 * becomes a second consumer, which it will not be — these are two designs, not
 * one design with two skins.
 *
 * Authored entirely in Site Settings, like the shared chrome: the app mounts
 * these in its layout and hands them the document.
 */
export { MobileNav } from './MobileNav'
export { NavPanel } from './NavPanel'
export { NavPanelCard } from './NavPanelCard'
export { NavRow } from './NavRow'
export { SiteFooter } from './SiteFooter'
export { SiteNav } from './SiteNav'
export type { NavButton, NavGroup, NavGroupItem, NavItem, Settings } from './navItems'

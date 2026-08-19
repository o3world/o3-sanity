/**
 * Site chrome — the nav, the utility bar and the footer every page wears.
 * Authored entirely in Site Settings, so an app mounts these in its layout and
 * passes the document.
 *
 * Nothing here is brand-specific in code, and the brand mark is why that needs
 * saying: a mark is a drawing rather than a colour, so the nav and the footer
 * take one as a required prop and draw it (#228). Both brands render these
 * components, and neither one's logo is in them.
 */
export { MobileNavMenu } from './MobileNavMenu'
export { NavInk, NAV_INK_TARGET } from './NavInk'
export { SiteFooter } from './SiteFooter'
export { SiteNav } from './SiteNav'
export { UtilityNav } from './UtilityNav'

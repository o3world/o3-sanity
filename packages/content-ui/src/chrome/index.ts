/**
 * Site chrome — the nav, the utility bar and the footer every page wears.
 * Authored entirely in Site Settings, so an app mounts these in its layout and
 * passes the document.
 *
 * O3 is the one consumer: o3xo mounts its own app-local chrome (#243), and this
 * set stays here for as long as a brand uses it (ADR 0028). The brand mark is
 * a slot — a mark is a drawing rather than a colour, so the nav and the
 * footer take one as a required prop and draw it (#228).
 */
export { MobileNavMenu } from './MobileNavMenu'
export { NavLink, isCurrentSection } from './NavLink'
export { NavInk, NAV_INK_TARGET } from './NavInk'
export { NavPin } from './NavPin'
export { NavInkFirstPaint, NAV_INK_FIRST_PAINT_SCRIPT } from './NavInkFirstPaint'
export { SiteFooter } from './SiteFooter'
export { SiteNav } from './SiteNav'
export { UtilityNav } from './UtilityNav'

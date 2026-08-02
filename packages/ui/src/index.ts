// Shared UI components — shadcn base + O3 primitives extracted from
// prototype/O3 Homepage v2.dc.html. See components.json for shadcn config.
export { cn } from './lib/utils'

// ArrowIcon — the O3 arrow glyph shared by Button/ArrowLink
export { ArrowIcon } from './components/arrow-icon'
export type { ArrowIconProps } from './components/arrow-icon'

// ArrowLink
export { ArrowLink, arrowLinkVariants } from './components/arrow-link'
export type { ArrowLinkProps } from './components/arrow-link'

// BrandLogo — Figma's `Brand / Logo` set (264:50)
export { BrandLogo, brandLogoVariants } from './components/brand-logo'
export type { BrandLogoProps } from './components/brand-logo'

// CloseIcon / MenuIcon — the chrome glyphs (ADR 0009)
export { CloseIcon } from './components/close-icon'
export type { CloseIconProps } from './components/close-icon'
export { MenuIcon } from './components/menu-icon'
export type { MenuIconProps } from './components/menu-icon'

// Button
export { Button, buttonVariants } from './components/ui/button'
export type { ButtonProps } from './components/ui/button'

// CollectionHero — the Work frame's index hero (1634:1181)
export { CollectionHero } from './components/collection-hero'
export type { CollectionHeroProps } from './components/collection-hero'

// CaseStudyHero — the Case Study detail opener (1710:2301)
export { CaseStudyHero } from './components/case-study-hero'
export type { CaseStudyHeroProps } from './components/case-study-hero'

// CaseChapter — the numbered article band on a case study (1647:1714)
export { CaseChapter } from './components/case-chapter'
export type { CaseChapterProps } from './components/case-chapter'

// CarouselControl — Figma's `Icon / Surface` (778:1862)
export { CarouselControl } from './components/carousel-control'
export type { CarouselControlProps } from './components/carousel-control'

// Card
export {
  Card,
  CardMedia,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
} from './components/ui/card'
export type { CardProps } from './components/ui/card'

// DisplayHeading (+ the masked-line reveal it composes)
export { DisplayHeading, displayHeadingVariants } from './components/display-heading'
export type { DisplayHeadingProps } from './components/display-heading'
export { MaskedLines } from './components/masked-lines'
export type { MaskedLinesProps } from './components/masked-lines'

// Eyebrow
export { Eyebrow, eyebrowVariants } from './components/eyebrow'
export type { EyebrowProps } from './components/eyebrow'

// LogoTile
export { LogoTile } from './components/logo-tile'
export type { LogoTileProps } from './components/logo-tile'

// OrbitalSphere — the wireframe globe behind the hero and the CTA band
export { OrbitalSphere } from './components/orbital-sphere'
export type { OrbitalSphereProps } from './components/orbital-sphere'

// Reveal
export { Reveal } from './components/reveal'
export type { RevealProps } from './components/reveal'

// Sheet — the 402 nav's menu panel (ADR 0006)
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from './components/ui/sheet'

// SectionShell — the three-surface organism every section block renders inside
export {
  SectionShell,
  sectionShellVariants,
  SECTION_WIDTH_CLASS,
  SURFACE_CLASS,
  SURFACES,
} from './components/section-shell'
export type { BandStep, SectionShellProps, SectionWidth, Surface } from './components/section-shell'

// Stat
export { Stat, statLabelVariants } from './components/stat'
export type { StatProps } from './components/stat'

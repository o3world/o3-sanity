// Shared UI components — shadcn base + O3 primitives extracted from
// prototype/O3 Homepage v2.dc.html. See components.json for shadcn config.
export { cn } from './lib/utils'

// ArrowIcon — the O3 arrow glyph shared by Button/ArrowLink
export { ArrowIcon } from './components/arrow-icon'
export type { ArrowIconProps } from './components/arrow-icon'

// ArrowLink
export { ArrowLink, arrowLinkVariants } from './components/arrow-link'
export type { ArrowLinkProps } from './components/arrow-link'

// ArticleByline — the insight hero's author line (1710:2946)
export { ArticleByline } from './components/article-byline'
export type { ArticleBylineProps } from './components/article-byline'

// BrandLogo — Figma's `Brand / Logo` set (264:50)
// BrandMark — the same mark without its plate; no Figma set draws it
export { BrandLogo, BrandMark, brandLogoVariants } from './components/brand-logo'
export type { BrandLogoProps, BrandMarkProps } from './components/brand-logo'

// CloseIcon / MenuIcon — the chrome glyphs (ADR 0009)
export { CloseIcon } from './components/close-icon'
export type { CloseIconProps } from './components/close-icon'
export { MenuIcon } from './components/menu-icon'
export type { MenuIconProps } from './components/menu-icon'

// Button
export { Button, buttonVariants } from './components/ui/button'
export type { ButtonProps } from './components/ui/button'

// FilterChip — the Insights index filter bar's chip (2337:4486)
export { FilterChip, filterChipVariants } from './components/filter-chip'
export type { FilterChipProps } from './components/filter-chip'

// CollectionHero — the Work frame's index hero (1634:1181)
export { CollectionHero } from './components/collection-hero'
export type { CollectionHeroProps } from './components/collection-hero'

// CaseStudyHero — the Case Study detail opener (1710:2301)
export { CaseStudyHero } from './components/case-study-hero'
export type { CaseStudyHeroProps } from './components/case-study-hero'

// CaseChapter — the numbered article band on a case study (1647:1714)
export { CaseChapter } from './components/case-chapter'
export type { CaseChapterDetail, CaseChapterProps } from './components/case-chapter'

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

// FormField — the labelled-control primitive the inquiry form is built from (#58)
export { FormField, FIELD_CONTROL_CLASS } from './components/form-field'
export type { FormFieldControl, FormFieldProps } from './components/form-field'

// HalftoneDisc — the dotted disc beside a discipline (1925:5922) or a role (1925:6068)
export { HalftoneDisc } from './components/halftone-disc'
export type { HalftoneDiscProps } from './components/halftone-disc'

// LogoTile
export { LogoTile } from './components/logo-tile'
export type { LogoTileProps } from './components/logo-tile'

// MoleculeMark — the mark behind the 2026-08 quote band (2250:1498 / 2250:1525)
export { MoleculeMark } from './components/molecule-mark'
export type { MoleculeMarkProps } from './components/molecule-mark'

// OrbitalDiagram — the Solutions disciplines net (1928:6524). NOT the sphere.
export { OrbitalDiagram } from './components/orbital-diagram'
export type { OrbitalDiagramItem, OrbitalDiagramProps } from './components/orbital-diagram'

// OrbitalSphere — the wireframe globe behind the hero and the CTA band
export { OrbitalSphere } from './components/orbital-sphere'
export type { OrbitalSphereProps } from './components/orbital-sphere'

// PortraitTile — the black-and-red-arc tile a team headshot sits on (1925:5864)
export { PortraitTile } from './components/portrait-tile'
export type { PortraitTileProps } from './components/portrait-tile'

// ReadingProgress — the article scroll bar (precursor 1379:2367)
export { ReadingProgress } from './components/reading-progress'
export type { ReadingProgressProps } from './components/reading-progress'

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

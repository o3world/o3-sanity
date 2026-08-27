// Shared UI components — shadcn base + O3 primitives extracted from
// prototype/O3 Homepage v2.dc.html. See components.json for shadcn config.
export { cn } from './lib/utils'

// Motion recipes — the shared hover/focus class strings (see motion.ts)
export {
  CARD_ARROW_NUDGE,
  CARD_LINK_FOCUS,
  CARD_MEDIA_ZOOM,
  CARD_TITLE_FADE,
  HOVER_FADE_TRANSITION,
  HOVER_TRANSITION,
} from './motion'

// ArrowIcon — the O3 arrow glyph Button and the case-study chips draw
export { ArrowIcon } from './components/arrow-icon'
export type { ArrowIconProps } from './components/arrow-icon'

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

// The curated set that fills the button's icon slot — Figma's `Icon` (2177:1556)
export { BUTTON_ICONS, ChevronDownIcon, ExternalLinkIcon } from './components/button-icons'
export type { ButtonIconProps } from './components/button-icons'

// FilterChip — the Insights index filter bar's chip (2337:4486)
export { FilterChip, filterChipVariants } from './components/filter-chip'
export type { FilterChipProps } from './components/filter-chip'

// CollectionHero — the interior-page opener (2107:1051)
export { CollectionHero } from './components/collection-hero'
export type { CollectionHeroProps, CollectionHeroSurface } from './components/collection-hero'

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

// Entrance — the load-triggered fade-up (Reveal is the scroll-triggered one)
export { Entrance } from './components/entrance'
export type { EntranceProps } from './components/entrance'

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

// Skeleton — the block a streamed route holds while its data is in flight
export { Skeleton } from './components/skeleton'
export type { SkeletonProps } from './components/skeleton'

// MoleculeMark — the mark behind the 2026-08 quote band (2250:1498 / 2250:1525)
export { MoleculeMark } from './components/molecule-mark'
export type { MoleculeMarkProps } from './components/molecule-mark'

// OrbitalDiagram — the Solutions disciplines net (1928:6524). NOT the sphere.
export { OrbitalDiagram } from './components/orbital-diagram'
export type { OrbitalDiagramItem, OrbitalDiagramProps } from './components/orbital-diagram'

// OrbitalSphere — the wireframe globe behind the hero and the CTA band
export { OrbitalSphere } from './components/orbital-sphere'
export type { OrbitalSphereProps } from './components/orbital-sphere'

// ThinkingOrb — the `thinking-orbs` canvas orb, wrapped (orbs.jakubantalik.com)
export { ThinkingOrb } from './components/thinking-orb'
export type { OrbSize, OrbState, OrbTheme, ThinkingOrbProps } from './components/thinking-orb'

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
  SectionBackground,
  SectionShell,
  sectionShellVariants,
  SECTION_WIDTH_CLASS,
  SURFACE_CLASS,
  SURFACES,
  TINTS,
  surfaceAttrs,
} from './components/section-shell'
export type {
  BandStep,
  SectionShellProps,
  SectionWidth,
  Surface,
  Tint,
} from './components/section-shell'
// The band's surface, readable from inside it. `SectionShell` and
// `CollectionHero` declare their own; a bespoke band or a piece of chrome
// declares its own with this (#147, ADR 0026).
export { SurfaceProvider, useSurface } from './components/surface-context'

// Stat
export { Stat, statLabelVariants } from './components/stat'
export type { StatProps } from './components/stat'

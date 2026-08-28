/**
 * The block renderers and the support layer they are built from. An app
 * binds these into its own registry (ADR 0028) — nothing here reads a
 * registry, so a second brand can re-bind one block type without forking
 * the other fifteen.
 */

// ── Base tier ──────────────────────────────────────────────────────────────
// The base tier is the inline vocabulary a section renderer draws with, so the
// bindings ship with the renderers rather than per app. What each app adds is
// the app-first blocks (`APP_FIRST_RENDERERS`), which the shared table
// subtracts and `BaseComponentsSlot` makes it supply.
export { BASE_BLOCK_BINDINGS, BASE_BLOCK_COMPONENTS } from './blocks/base/baseComponents'
export type {
  AppFirstBaseComponents,
  AppFirstBaseName,
  BaseComponents,
  BaseComponentsSlot,
} from './blocks/base/baseComponents'
export { Button } from './blocks/base/button/Button'
export { ButtonGroup } from './blocks/base/buttonGroup/ButtonGroup'
export { Embed } from './blocks/base/embed/Embed'
export { Figure } from './blocks/base/figure/Figure'
export { Mark, markProps } from './blocks/base/mark/Mark'
export { MediaCard } from './blocks/base/mediaCard/MediaCard'
export type { MarkProps } from './blocks/base/mark/Mark'
export { RichText } from './blocks/base/richText/RichText'

// ── Section tier ───────────────────────────────────────────────────────────
export { CaseShowcaseSection } from './blocks/section/caseShowcaseSection/CaseShowcaseSection'
export { CtaSection } from './blocks/section/ctaSection/CtaSection'
export { FeatureGridSection } from './blocks/section/featureGridSection/FeatureGridSection'
export { FormSection } from './blocks/section/formSection/FormSection'
export { HeroSection } from './blocks/section/heroSection/HeroSection'
export { InFlightSection } from './blocks/section/inFlightSection/InFlightSection'
export { InsightsCarouselSection } from './blocks/section/insightsCarouselSection/InsightsCarouselSection'
export { CarouselTrack } from './blocks/section/insightsCarouselSection/CarouselTrack'
export { LayoutSection } from './blocks/section/layoutSection/LayoutSection'
export { ListingSection } from './blocks/section/listingSection/ListingSection'
export { LogoWallSection } from './blocks/section/logoWallSection/LogoWallSection'
export { MediaSection } from './blocks/section/mediaSection/MediaSection'
export { PersonGridSection } from './blocks/section/personGridSection/PersonGridSection'
export { QuoteSection } from './blocks/section/quoteSection/QuoteSection'
export { RailPanelsSection } from './blocks/section/railPanelsSection/RailPanelsSection'
// The shape the `cards` layout hands each card. Exported so an app can fill
// the band's cards slot with its own row (ADR 0028) — the band maps its panels
// once and either brand's cards read the same items.
export type { PanelCard } from './blocks/section/railPanelsSection/PanelCards'
export { RoleListSection } from './blocks/section/roleListSection/RoleListSection'
export { ScreenGridSection } from './blocks/section/screenGridSection/ScreenGridSection'

// ── Route furniture ────────────────────────────────────────────────────────
// Not a block — a collection index has no document to hold one. Every brand's
// index renders the same pager, so it lives here rather than in either app.
export { Pager, type PagerProps } from './Pager'

// ── Renderer support ───────────────────────────────────────────────────────
export { ButtonLink } from './ButtonLink'
export {
  buttonDestination,
  resolveButtonHref,
  type ButtonDestination,
  type ButtonLinkData,
} from './buttonDestination'
export { LogoKnockout } from './LogoKnockout'
export { SanityImage, type ImageBox, type ImageRatio, type SanityImageProps } from './SanityImage'
export { DECORATED_BAND_CLASS, resolveDecoration, type Decoration } from './blocks/decoration'
export { MoleculeDecoration, type MoleculeDecorationProps } from './blocks/MoleculeDecoration'
export { sectionBackground } from './blocks/sectionBackground'
export { SectionReveal } from './blocks/SectionReveal'
export { resolveSurface } from './blocks/surface'

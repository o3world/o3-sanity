// The client-safe block components: base blocks + every section block.
// Shared by the server BLOCK_MAP (registry.ts) and the client
// BLOCK_COMPONENTS (ClientBlockRenderer.tsx) so both derive from one
// satisfies-guarded source. Imports zero server-only code, so it is safe in
// the browser bundle. (Every o3 block is currently client-safe — reference
// data is expanded at query time, not fetched by renderers — so unlike
// vtx-web there is no server-only exclusion set yet.)
import type { ComponentType } from 'react'

import type { BaseBlockName, BrandSectionBlockName } from '@o3/sanity/schemas/registry'
import {
  bindingsToRecord,
  defineBlockRender,
  type BaseProps,
  type ClientBlockRenderBinding,
  type SectionProps,
} from '@o3/content-runtime/blocks'
import { fieldAttr } from '@o3/content-runtime/data-attribute'

import { O3xoMark } from '@/brand/O3xoMark'
import { FaqSection } from './faqSection/FaqSection'
import { KeyMetricCards } from '@/cards/KeyMetricCard'
import { YellowTextCards } from '@/cards/YellowTextCard'
import { HeaderPill } from '@/components/HeaderPill'
import { ICONS } from '@/icons/Icon'

// The renderers themselves are shared (@o3/content-ui); the binding below is
// this app's. Re-pointing one line here is what "O3XO adapts a block" costs.
import {
  BASE_BLOCK_COMPONENTS,
  CaseShowcaseSection,
  CtaSection,
  FeatureGridSection,
  FormSection,
  HeroSection,
  InFlightSection,
  InsightsCarouselSection,
  LayoutSection,
  ListingSection,
  LogoWallSection,
  MediaSection,
  PersonGridSection,
  QuoteSection,
  RailPanelsSection,
  RoleListSection,
  ScreenGridSection,
} from '@o3/content-ui'

/**
 * The section blocks THIS brand renders — core plus o3xo's own, which is
 * `faqSection` (ADR 0028, `BRAND_SECTION_BLOCKS`). Omitting a binding for one
 * of them is a type error at the record below, and binding a block no brand
 * lists is one at the array.
 */
type O3xoSectionBlockName = BrandSectionBlockName<'o3xo'>

/**
 * The hero, with this app's mark bound into it (#228).
 *
 * The partner lockup draws the brand's mark beside the partner's, and a
 * renderer's props arrive from Sanity — so the app's channel for a mark is
 * this binding rather than a field. `brandMark` being required is what makes
 * an app that binds the bare `HeroSection` a compile error at `registry.ts`'s
 * `satisfies`, instead of a page quietly wearing the other brand's logo.
 *
 * Plated and stacked at the 71px the lockup's frame sets (`2479:2205`), which
 * is where O3 draws its own tile: `Background=Yes` is a variant of this mark,
 * so the plate arrives with it rather than being fitted by the lockup.
 */
function HeroSectionWithMark(props: SectionProps<'heroSection'>) {
  return <HeroSection {...props} brandMark={<O3xoMark layout="stacked" background height={71} />} />
}

/**
 * The rail band, drawing the kit's `Yellow Text Card` where it lays panels out
 * as cards (#244).
 *
 * Only the card is this brand's — the band's shell, header and three other
 * layouts are the shared renderer's, so this fills its cards slot rather than
 * forking it. The card is app-local because its plate is `accent`, a role only
 * O3XO's token package declares (ADR 0028).
 */
function RailPanelsSectionWithYellowCards(props: SectionProps<'railPanelsSection'>) {
  return <RailPanelsSection {...props} panelCards={YellowTextCards} />
}

/**
 * The stat row, as the kit's `Key Metric Card Group` (#244) — a yellow plate
 * per figure where O3 sets the same numbers bare.
 */
function StatGroupAsKeyMetrics({ stats }: BaseProps<'statGroup'>) {
  return (
    <KeyMetricCards
      items={(stats ?? []).map((stat, index) => ({
        key: stat._key ?? String(index),
        value: stat.value ?? '',
        label: stat.label ?? '',
      }))}
    />
  )
}

/**
 * This app's BASE-tier roster — the shared one with `statGroup` re-pointed.
 *
 * Base bindings ship with the renderers rather than per app, because the base
 * tier is the vocabulary a section renderer draws with. Re-pointing one here
 * is the same act the section bindings below perform, and it has to be spelled
 * once and read three times: by the two dispatchers in this file, and by
 * `LayoutSection`, which is the one band that renders a base block itself.
 */
export const BASE_CLIENT_COMPONENTS = {
  ...BASE_BLOCK_COMPONENTS,
  statGroup: StatGroupAsKeyMetrics,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} satisfies Record<BaseBlockName, ComponentType<any>>

/**
 * The layout band, dispatching its columns through this app's base roster
 * (#244) — a `statGroup` in a column is where the homepage's key metrics
 * actually sit, and the band is the only place a base block renders outside
 * this app's own registry.
 */
function LayoutSectionWithAccentCards(props: SectionProps<'layoutSection'>) {
  return <LayoutSection {...props} baseComponents={BASE_CLIENT_COMPONENTS} />
}

/**
 * The feature band, with this app's icon set bound into it (#246).
 *
 * The same channel as the mark above, for the same reason: the eighteen glyphs
 * are the O3XO kit's (`4404:5589`) and O3 draws none of them, so the drawing
 * arrives from the app rather than from the document or the shared package.
 * `icons` is optional there — a band handed no map renders the dotted mark, and
 * that is what O3's binding of the bare component gets.
 */
function FeatureGridSectionWithIcons(props: SectionProps<'featureGridSection'>) {
  return <FeatureGridSection {...props} icons={ICONS} />
}

/**
 * The quote band, with its eyebrow drawn as the kit's pill (`4404:5107`).
 *
 * The band's own slot is empty in O3's binding — no O3 frame labels a quote —
 * so the two brands share the composition and diverge only in the chrome
 * around those words, which is what a slot is for.
 */
function QuoteSectionWithPill({ eyebrow, loc, ...props }: SectionProps<'quoteSection'>) {
  return (
    <QuoteSection
      {...props}
      loc={loc}
      eyebrowSlot={
        eyebrow ? <HeaderPill data-sanity={fieldAttr(loc, 'eyebrow')}>{eyebrow}</HeaderPill> : null
      }
    />
  )
}

/**
 * Render bindings for every client-safe SECTION block — the single authoring
 * point `SECTION_CLIENT_COMPONENTS` derives from.
 *
 * `satisfies` (not a `: ReadonlyArray<…>` annotation) on purpose — an
 * annotation would widen every element's `type` to the whole
 * roster union up front, so a missing/duplicated entry would no
 * longer be visible per-element to `bindingsToRecord`. Left inferred, each
 * entry keeps its own literal `type`, which is what lets the derived record
 * still catch a missing binding via its own `satisfies` clause.
 */
export const CLIENT_SECTION_BINDINGS = [
  defineBlockRender('heroSection', { component: HeroSectionWithMark }),
  defineBlockRender('logoWallSection', { component: LogoWallSection }),
  defineBlockRender('caseShowcaseSection', { component: CaseShowcaseSection }),
  defineBlockRender('railPanelsSection', { component: RailPanelsSectionWithYellowCards }),
  defineBlockRender('quoteSection', { component: QuoteSectionWithPill }),
  defineBlockRender('insightsCarouselSection', { component: InsightsCarouselSection }),
  defineBlockRender('ctaSection', { component: CtaSection }),
  defineBlockRender('featureGridSection', { component: FeatureGridSectionWithIcons }),
  defineBlockRender('personGridSection', { component: PersonGridSection }),
  defineBlockRender('roleListSection', { component: RoleListSection }),
  defineBlockRender('inFlightSection', { component: InFlightSection }),
  defineBlockRender('formSection', { component: FormSection }),
  defineBlockRender('layoutSection', { component: LayoutSectionWithAccentCards }),
  defineBlockRender('mediaSection', { component: MediaSection }),
  defineBlockRender('screenGridSection', { component: ScreenGridSection }),
  defineBlockRender('listingSection', { component: ListingSection }),
  defineBlockRender('faqSection', { component: FaqSection }),
] satisfies ReadonlyArray<ClientBlockRenderBinding<O3xoSectionBlockName>>

/**
 * Client-safe SECTION components, derived from `CLIENT_SECTION_BINDINGS`.
 * `satisfies Record<O3xoSectionBlockName, …>` makes "added a section block but
 * forgot its binding" a typecheck error.
 */
export const SECTION_CLIENT_COMPONENTS = bindingsToRecord(
  CLIENT_SECTION_BINDINGS,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) satisfies Record<O3xoSectionBlockName, ComponentType<any>>

/**
 * The full client-renderable map: base + section. The `satisfies` clause is
 * the schema-name completeness guard (the generated-type guard lives in
 * registry.ts).
 */
const CLIENT_BLOCK_COMPONENTS = {
  ...BASE_CLIENT_COMPONENTS,
  ...SECTION_CLIENT_COMPONENTS,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} satisfies Record<BaseBlockName | O3xoSectionBlockName, ComponentType<any>>

/**
 * Consumption-facing binding, widened to a generic string index — callers key
 * this by an arbitrary `_type: string` off live Sanity data. The `satisfies`
 * clause above is the completeness guard; this widening doesn't weaken it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BLOCK_COMPONENTS: Record<string, ComponentType<any>> = CLIENT_BLOCK_COMPONENTS

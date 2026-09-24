import { CaseStudyMediaSection, CaseStudyScreenGridSection } from './caseStudyMotion'
// The client-safe block components: base blocks + every section block.
// Shared by the server BLOCK_MAP (registry.ts) and the client
// BLOCK_COMPONENTS (ClientBlockRenderer.tsx) so both derive from one
// satisfies-guarded source. Imports zero server-only code, so it is safe in
// the browser bundle. (Every o3 block is currently client-safe — reference
// data is expanded at query time, not fetched by renderers — so unlike
// vtx-web there is no server-only exclusion set yet.)
import type { ComponentType } from 'react'

import type { BaseBlockName, SectionBlockName } from '@o3/sanity/schemas/registry'
import {
  bindingsToRecord,
  defineBlockRender,
  type ClientBlockRenderBinding,
  type SectionProps,
} from '@o3/content-runtime/blocks'
import { BrandLogo } from '@o3/ui'

import { StatsSection } from './statsSection/StatsSection'
import '@/components/work/work-cards.css'

// The renderers themselves live in @o3/content-ui; the binding below is this
// app's, and a wrapper here is how the app adds what a renderer cannot know.
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
  PersonGridSection,
  QuoteSection,
  RailPanelsSection,
  RoleListSection,
} from '@o3/content-ui'

/**
 * The hero, with this app's mark bound into it (#228).
 *
 * The partner lockup draws the brand's mark beside the partner's, and a
 * renderer's props arrive from Sanity — so the app's channel for a mark is
 * this binding rather than a field. `brandMark` being required is what makes
 * an app that binds the bare `HeroSection` a compile error at `registry.ts`'s
 * `satisfies`, instead of a page quietly drawing no mark.
 *
 * The tile is `2479:2205`'s: O3's mark on its red plate at 71px.
 */
function HeroSectionWithMark(props: SectionProps<'heroSection'>) {
  return <HeroSection {...props} brandMark={<BrandLogo color="red" size={71} />} />
}

/**
 * The layout band, sequencing its entrance on headed interior bands.
 */
function LayoutSectionWithSequence(props: SectionProps<'layoutSection'>) {
  return (
    <LayoutSection
      {...props}
      sequence={
        props.loc?.type !== 'caseStudy' &&
        Boolean(props.heading || props.eyebrow || props.subheading)
      }
    />
  )
}

/** The showcase band, inside the homepage stack's `work-showcase` scope. */
function CaseShowcaseSectionInStack(props: SectionProps<'caseShowcaseSection'>) {
  return (
    <div className="work-showcase">
      <CaseShowcaseSection {...props} />
    </div>
  )
}

function InsightsCarouselSectionWithHeading(props: SectionProps<'insightsCarouselSection'>) {
  return <InsightsCarouselSection {...props} headingSize="hero" />
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
  defineBlockRender('caseShowcaseSection', { component: CaseShowcaseSectionInStack }),
  defineBlockRender('railPanelsSection', { component: RailPanelsSection }),
  defineBlockRender('quoteSection', { component: QuoteSection }),
  defineBlockRender('insightsCarouselSection', { component: InsightsCarouselSectionWithHeading }),
  defineBlockRender('ctaSection', { component: CtaSection }),
  defineBlockRender('featureGridSection', { component: FeatureGridSection }),
  defineBlockRender('personGridSection', { component: PersonGridSection }),
  defineBlockRender('roleListSection', { component: RoleListSection }),
  defineBlockRender('inFlightSection', { component: InFlightSection }),
  defineBlockRender('formSection', { component: FormSection }),
  defineBlockRender('layoutSection', { component: LayoutSectionWithSequence }),
  defineBlockRender('mediaSection', { component: CaseStudyMediaSection }),
  defineBlockRender('screenGridSection', { component: CaseStudyScreenGridSection }),
  defineBlockRender('listingSection', { component: ListingSection }),
  defineBlockRender('statsSection', { component: StatsSection }),
] satisfies ReadonlyArray<ClientBlockRenderBinding<SectionBlockName>>

/**
 * Client-safe SECTION components, derived from `CLIENT_SECTION_BINDINGS`.
 * `satisfies Record<SectionBlockName, …>` makes "added a section block but
 * forgot its binding" a typecheck error.
 */
export const SECTION_CLIENT_COMPONENTS = bindingsToRecord(
  CLIENT_SECTION_BINDINGS,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) satisfies Record<SectionBlockName, ComponentType<any>>

/**
 * The full client-renderable map: base + section. The `satisfies` clause is
 * the schema-name completeness guard (the generated-type guard lives in
 * registry.ts).
 */
const CLIENT_BLOCK_COMPONENTS = {
  ...BASE_BLOCK_COMPONENTS,
  ...SECTION_CLIENT_COMPONENTS,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} satisfies Record<BaseBlockName | SectionBlockName, ComponentType<any>>

/**
 * Consumption-facing binding, widened to a generic string index — callers key
 * this by an arbitrary `_type: string` off live Sanity data. The `satisfies`
 * clause above is the completeness guard; this widening doesn't weaken it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BLOCK_COMPONENTS: Record<string, ComponentType<any>> = CLIENT_BLOCK_COMPONENTS

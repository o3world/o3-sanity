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
  type ClientBlockRenderBinding,
  type SectionProps,
} from '@o3/content-runtime/blocks'
import { BrandLogo } from '@o3/ui'

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
 * The section blocks THIS brand renders — core plus o3's own extensions, which
 * are none (ADR 0028, `BRAND_SECTION_BLOCKS`). Binding a block off this roster
 * is a type error here rather than a missing renderer at runtime, which is what
 * keeps o3xo's `faqSection` out of this app.
 */
type O3SectionBlockName = BrandSectionBlockName<'o3'>

/**
 * The hero, with this app's mark bound into it (#228).
 *
 * The partner lockup draws the brand's mark beside the partner's, and a
 * renderer's props arrive from Sanity — so the app's channel for a mark is
 * this binding rather than a field. `brandMark` being required is what makes
 * an app that binds the bare `HeroSection` a compile error at `registry.ts`'s
 * `satisfies`, instead of a page quietly wearing the other brand's logo.
 *
 * The tile is `2479:2205`'s: O3's mark on its red plate at 71px.
 */
function HeroSectionWithMark(props: SectionProps<'heroSection'>) {
  return <HeroSection {...props} brandMark={<BrandLogo color="red" size={71} />} />
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
  defineBlockRender('railPanelsSection', { component: RailPanelsSection }),
  defineBlockRender('quoteSection', { component: QuoteSection }),
  defineBlockRender('insightsCarouselSection', { component: InsightsCarouselSection }),
  defineBlockRender('ctaSection', { component: CtaSection }),
  defineBlockRender('featureGridSection', { component: FeatureGridSection }),
  defineBlockRender('personGridSection', { component: PersonGridSection }),
  defineBlockRender('roleListSection', { component: RoleListSection }),
  defineBlockRender('inFlightSection', { component: InFlightSection }),
  defineBlockRender('formSection', { component: FormSection }),
  defineBlockRender('layoutSection', { component: LayoutSection }),
  defineBlockRender('mediaSection', { component: MediaSection }),
  defineBlockRender('screenGridSection', { component: ScreenGridSection }),
  defineBlockRender('listingSection', { component: ListingSection }),
] satisfies ReadonlyArray<ClientBlockRenderBinding<O3SectionBlockName>>

/**
 * Client-safe SECTION components, derived from `CLIENT_SECTION_BINDINGS`.
 * `satisfies Record<O3SectionBlockName, …>` makes "added a section block but
 * forgot its binding" a typecheck error.
 */
export const SECTION_CLIENT_COMPONENTS = bindingsToRecord(
  CLIENT_SECTION_BINDINGS,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) satisfies Record<O3SectionBlockName, ComponentType<any>>

/**
 * The full client-renderable map: base + section. The `satisfies` clause is
 * the schema-name completeness guard (the generated-type guard lives in
 * registry.ts).
 */
const CLIENT_BLOCK_COMPONENTS = {
  ...BASE_BLOCK_COMPONENTS,
  ...SECTION_CLIENT_COMPONENTS,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} satisfies Record<BaseBlockName | O3SectionBlockName, ComponentType<any>>

/**
 * Consumption-facing binding, widened to a generic string index — callers key
 * this by an arbitrary `_type: string` off live Sanity data. The `satisfies`
 * clause above is the completeness guard; this widening doesn't weaken it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BLOCK_COMPONENTS: Record<string, ComponentType<any>> = CLIENT_BLOCK_COMPONENTS

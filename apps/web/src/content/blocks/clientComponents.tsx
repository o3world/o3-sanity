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

import {
  defineCardRender,
  type AppFirstCardComponents,
  type CardRenderBinding,
} from '@o3/content-ui/cards'

import { StatGroup } from '@/components/blocks/StatGroup'
import { CaseStudyCard } from '@/components/cards/CaseStudyCard'

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
 * This app's BASE-tier roster — the shared one plus O3's own `StatGroup`.
 *
 * The shared table is the roster MINUS the app-first blocks, so
 * `satisfies Record<BaseBlockName, …>` is the record biting: `statGroup` is
 * listed in `APP_FIRST_RENDERERS`, and this app does not compile until it
 * names its own drawing of it.
 *
 * Spelled once and read three times: by the two dispatchers in this file, and
 * by `LayoutSection`, which is the one band that renders a base block itself.
 */
export const BASE_CLIENT_COMPONENTS = {
  ...BASE_BLOCK_COMPONENTS,
  statGroup: StatGroup,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} satisfies Record<BaseBlockName, ComponentType<any>>

/**
 * The layout band, dispatching its columns through this app's base roster. The
 * band is the only place a base block renders outside this app's own registry,
 * and the slot is required: `statGroup` is app-first, so nothing draws a column
 * holding one until an app says what it is.
 */
function LayoutSectionWithBaseRoster(props: SectionProps<'layoutSection'>) {
  return <LayoutSection {...props} baseComponents={BASE_CLIENT_COMPONENTS} />
}

/**
 * This app's CARD-tier bindings — O3's own case-study card
 * (`apps/web/src/components/cards/`), which the kit's `Case Study Cards` set
 * (`4404:3072`) diverges structurally from.
 *
 * `satisfies AppFirstCardComponents` is the record biting: a card type listed
 * in `APP_FIRST_RENDERERS` has no shared card, so this app does not compile
 * until it binds one of its own.
 */
export const CARD_BINDINGS = [
  defineCardRender('caseStudy', { component: CaseStudyCard }),
] satisfies ReadonlyArray<CardRenderBinding>

/** This app's card table, derived from `CARD_BINDINGS`. */
export const CARD_COMPONENTS = bindingsToRecord(CARD_BINDINGS) satisfies AppFirstCardComponents

/**
 * The showcase band, drawing this app's case-study card. The band's shell,
 * heading row and washes are the shared renderer's; only the card is O3's.
 */
function CaseShowcaseSectionWithCard(props: SectionProps<'caseShowcaseSection'>) {
  return <CaseShowcaseSection {...props} cardComponents={CARD_COMPONENTS} />
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
  defineBlockRender('caseShowcaseSection', { component: CaseShowcaseSectionWithCard }),
  defineBlockRender('railPanelsSection', { component: RailPanelsSection }),
  defineBlockRender('quoteSection', { component: QuoteSection }),
  defineBlockRender('insightsCarouselSection', { component: InsightsCarouselSection }),
  defineBlockRender('ctaSection', { component: CtaSection }),
  defineBlockRender('featureGridSection', { component: FeatureGridSection }),
  defineBlockRender('personGridSection', { component: PersonGridSection }),
  defineBlockRender('roleListSection', { component: RoleListSection }),
  defineBlockRender('inFlightSection', { component: InFlightSection }),
  defineBlockRender('formSection', { component: FormSection }),
  defineBlockRender('layoutSection', { component: LayoutSectionWithBaseRoster }),
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
  ...BASE_CLIENT_COMPONENTS,
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

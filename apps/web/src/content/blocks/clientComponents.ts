// The client-safe block components: base blocks + every section block.
// Shared by the server BLOCK_MAP (registry.ts) and the client
// BLOCK_COMPONENTS (ClientBlockRenderer.tsx) so both derive from one
// satisfies-guarded source. Imports zero server-only code, so it is safe in
// the browser bundle. (Every o3 block is currently client-safe — reference
// data is expanded at query time, not fetched by renderers — so unlike
// vtx-web there is no server-only exclusion set yet.)
import type { ComponentType } from 'react'

import type { BaseBlockName, SectionBlockName } from '@o3/sanity/schemas/registry'

import { BASE_BLOCK_COMPONENTS } from './base/baseComponents'
import {
  bindingsToRecord,
  defineBlockRender,
  type ClientBlockRenderBinding,
} from './defineBlockRender'
import { CaseShowcaseBlock } from './section/caseShowcaseBlock/CaseShowcaseBlock'
import { CtaBlock } from './section/ctaBlock/CtaBlock'
import { HeroBlock } from './section/heroBlock/HeroBlock'
import { LayoutSection } from './section/layoutSection/LayoutSection'
import { ListingSection } from './section/listingSection/ListingSection'
import { LogoWallBlock } from './section/logoWallBlock/LogoWallBlock'
import { MediaSection } from './section/mediaSection/MediaSection'
import { PerspectivesCarouselBlock } from './section/perspectivesCarouselBlock/PerspectivesCarouselBlock'
import { QuoteBlock } from './section/quoteBlock/QuoteBlock'
import { RailPanelsBlock } from './section/railPanelsBlock/RailPanelsBlock'

/**
 * Render bindings for every client-safe SECTION block — the single authoring
 * point `SECTION_CLIENT_COMPONENTS` derives from.
 *
 * `satisfies` (not a `: ReadonlyArray<…>` annotation) on purpose — an
 * annotation would widen every element's `type` to the whole
 * `SectionBlockName` union up front, so a missing/duplicated entry would no
 * longer be visible per-element to `bindingsToRecord`. Left inferred, each
 * entry keeps its own literal `type`, which is what lets the derived record
 * still catch a missing binding via its own `satisfies` clause.
 */
export const CLIENT_SECTION_BINDINGS = [
  defineBlockRender('heroBlock', { component: HeroBlock }),
  defineBlockRender('logoWallBlock', { component: LogoWallBlock }),
  defineBlockRender('caseShowcaseBlock', { component: CaseShowcaseBlock }),
  defineBlockRender('railPanelsBlock', { component: RailPanelsBlock }),
  defineBlockRender('quoteBlock', { component: QuoteBlock }),
  defineBlockRender('perspectivesCarouselBlock', { component: PerspectivesCarouselBlock }),
  defineBlockRender('ctaBlock', { component: CtaBlock }),
  defineBlockRender('layoutSection', { component: LayoutSection }),
  defineBlockRender('mediaSection', { component: MediaSection }),
  defineBlockRender('listingSection', { component: ListingSection }),
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

import type { ComponentType } from 'react'

import { bindingsToRecord, type LayoutItem, type PageSection } from '@o3/content-runtime/blocks'
import type { BrandSectionBlockName } from '@o3/sanity/schemas/registry'

import { BASE_CLIENT_COMPONENTS, CLIENT_SECTION_BINDINGS } from './clientComponents'

/**
 * Union of every block the renderer can dispatch — base + section, sourced
 * from the GENERATED query-result types (@o3/content-runtime/blocks). This is the
 * guardrail ADR 0001 keeps in place of schema-parity test suites: a schema
 * block without a renderer (or a renderer whose props drift from the
 * generated shape) is a compile error at the `satisfies` clause below.
 *
 * The renderer is context-agnostic; placement constraints (which tier goes
 * where) are enforced at the schema layer.
 */
/**
 * The generated section union NARROWED TO THIS BRAND'S ROSTER (ADR 0028).
 * Typegen is one file over the whole content model, so `PageSection` holds
 * every brand's blocks; the roster is what says which of them this app has to
 * render, and the `satisfies` clause below is where the answer is checked.
 */
export type DispatchedBlock =
  Extract<PageSection, { _type: BrandSectionBlockName<'o3xo'> }> | LayoutItem
export type DispatchedBlockType = DispatchedBlock['_type']

type BlockComponentSlot<K extends DispatchedBlockType> = ComponentType<
  Omit<Extract<DispatchedBlock, { _type: K }>, '_key' | '_type'>
>

const BLOCK_MAP = {
  // Base blocks — this app's roster (clientComponents.ts), which is the shared
  // one with `statGroup` re-pointed at the kit's key metric cards. Widening
  // BaseBlockName forces a typecheck error there if a renderer is missing;
  // this satisfies clause then checks each component's props against the
  // generated block shape.
  ...BASE_CLIENT_COMPONENTS,
  // Section blocks — shared with ClientBlockRenderer's BLOCK_COMPONENTS
  // (clientComponents.ts). Server-only overrides would spread after this
  // (later keys win); none exist today.
  ...bindingsToRecord(CLIENT_SECTION_BINDINGS),
} satisfies { [K in DispatchedBlockType]: BlockComponentSlot<K> }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BLOCK_REGISTRY: Record<DispatchedBlockType, ComponentType<any>> = BLOCK_MAP

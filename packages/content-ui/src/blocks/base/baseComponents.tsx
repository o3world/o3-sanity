// The single typed registry of base-tier block components. Client-safe by
// construction (every base renderer is a pure presentational component), so
// both the server BLOCK_MAP and the client BLOCK_COMPONENTS derive from it.
import type { ComponentType } from 'react'

import type { AppFirstRendererName, BaseBlockName } from '@o3/sanity/schemas/registry'

import {
  bindingsToRecord,
  defineBlockRender,
  type ClientBlockRenderBinding,
} from '@o3/content-runtime/blocks'
import { Button } from './button/Button'
import { ButtonGroup } from './buttonGroup/ButtonGroup'
import { Embed } from './embed/Embed'
import { Figure } from './figure/Figure'
import { Mark } from './mark/Mark'
import { RichText } from './richText/RichText'

/**
 * The base blocks each app draws for itself (`APP_FIRST_RENDERERS`). No shared
 * renderer exists for one, which is why the tables below are cut around this
 * union rather than around a hand-kept list.
 */
export type AppFirstBaseName = AppFirstRendererName<'base'>

/** The base blocks the shared library still draws — the roster minus the demoted. */
type SharedBaseBlockName = Exclude<BaseBlockName, AppFirstBaseName>

/** See CLIENT_SECTION_BINDINGS for why this is `satisfies`, not an annotation. */
export const BASE_BLOCK_BINDINGS = [
  defineBlockRender('richText', { component: RichText }),
  defineBlockRender('figure', { component: Figure }),
  defineBlockRender('embed', { component: Embed }),
  defineBlockRender('button', { component: Button }),
  defineBlockRender('buttonGroup', { component: ButtonGroup }),
  defineBlockRender('mark', { component: Mark }),
] satisfies ReadonlyArray<ClientBlockRenderBinding<SharedBaseBlockName>>

/**
 * `satisfies Record<SharedBaseBlockName, …>` makes "added a base block but
 * forgot its renderer" a typecheck error; registry.ts then re-checks each
 * component's props against the generated block shapes.
 *
 * The roster is subtracted, not whole: a demoted block has no shared renderer
 * to put here, and binding one anyway fails at `defineBlockRender`.
 */
export const BASE_BLOCK_COMPONENTS = bindingsToRecord(
  BASE_BLOCK_BINDINGS,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) satisfies Record<SharedBaseBlockName, ComponentType<any>>

/**
 * What every app's base table must hold: one component per app-first block.
 * Recording a demotion fails each app's `satisfies` clause here until that app
 * binds its own, which is what makes the record bite before a test runs.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppFirstBaseComponents = Record<AppFirstBaseName, ComponentType<any>>

/**
 * An app's base table: the demoted blocks are required, the shared ones are an
 * optional re-point over `BASE_BLOCK_COMPONENTS`.
 */
export type BaseComponents = AppFirstBaseComponents &
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Partial<Record<BaseBlockName, ComponentType<any>>>

/**
 * The base-tier analogue of `CardSlot`: a band's base slot is required exactly
 * when some base block is app-first, because nothing shared draws it. With
 * none demoted the slot is optional again and the shared table is the default.
 */
export type BaseComponentsSlot = [AppFirstBaseName] extends [never]
  ? { baseComponents?: BaseComponents }
  : { baseComponents: BaseComponents }

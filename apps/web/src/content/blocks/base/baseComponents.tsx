// The single typed registry of base-tier block components. Client-safe by
// construction (every base renderer is a pure presentational component), so
// both the server BLOCK_MAP and the client BLOCK_COMPONENTS derive from it.
import type { ComponentType } from 'react'

import type { BaseBlockName } from '@o3/sanity/schemas/registry'

import {
  bindingsToRecord,
  defineBlockRender,
  type ClientBlockRenderBinding,
} from '../defineBlockRender'
import { Button } from './button/Button'
import { Embed } from './embed/Embed'
import { Figure } from './figure/Figure'
import { Mark } from './mark/Mark'
import { RichText } from './richText/RichText'
import { StatGroup } from './statGroup/StatGroup'

/** See CLIENT_SECTION_BINDINGS for why this is `satisfies`, not an annotation. */
export const BASE_BLOCK_BINDINGS = [
  defineBlockRender('richText', { component: RichText }),
  defineBlockRender('figure', { component: Figure }),
  defineBlockRender('embed', { component: Embed }),
  defineBlockRender('button', { component: Button }),
  defineBlockRender('statGroup', { component: StatGroup }),
  defineBlockRender('mark', { component: Mark }),
] satisfies ReadonlyArray<ClientBlockRenderBinding<BaseBlockName>>

/**
 * `satisfies Record<BaseBlockName, …>` makes "added a base block but forgot
 * its renderer" a typecheck error; registry.ts then re-checks each
 * component's props against the generated block shapes.
 */
export const BASE_BLOCK_COMPONENTS = bindingsToRecord(
  BASE_BLOCK_BINDINGS,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) satisfies Record<BaseBlockName, ComponentType<any>>

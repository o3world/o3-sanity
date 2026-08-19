import { defineCliConfig } from 'sanity/cli'

import { brandConfig } from '@o3/sanity/brand'

import { BRAND } from './brand'

/**
 * The Sanity CLI's view of this app — `sanity schema deploy`, `sanity cors add`
 * and anything else run from this directory. Content is not among them: the
 * migration pipeline owns every document in this dataset, and takes the brand
 * as a flag (`tools/migration/README.md`).
 *
 * `brandConfig(BRAND)` and not `resolveProjectId()`: the resolvers answer for
 * whichever brand `NEXT_PUBLIC_BRAND` names, and the CLI has no bundler to
 * inline what `next.config.ts` sets — so an unset variable here would point a
 * write at o3world.com's project. Asking brand config for this brand by name
 * cannot be wrong. `XO_SANITY_PROJECT_ID` / `XO_SANITY_DATASET` still override.
 */
const { projectId, dataset } = brandConfig(BRAND)

export default defineCliConfig({ api: { projectId, dataset } })

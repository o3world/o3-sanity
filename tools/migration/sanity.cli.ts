import { defineCliConfig } from 'sanity/cli'

import { brandConfig } from '@o3/sanity/brand'

import { brandArg } from './src/lib/brandArg'

/**
 * `load` and `verify` run through this config, so this is where the run's
 * `--brand` becomes a project and a dataset.
 *
 * Two things it must not go back to. It once read a `SANITY_DATASET` variable
 * nothing in the repo set, so every load wrote to `production` regardless of
 * what the app was pointed at. And it then resolved the brand through
 * `NEXT_PUBLIC_BRAND` alone, which made the target project depend on what a
 * shell happened to export — for a command that deletes and rewrites every
 * unlocked document it finds, that is the difference between two companies'
 * content. `brandArg` reads the flag first and the variable only as a fallback.
 *
 * `sanity exec` evaluates this file twice, once in the CLI process and once in
 * the child it spawns for the script; the flag is in both processes' argv.
 */
const { projectId, dataset } = brandConfig(brandArg())

export default defineCliConfig({
  api: { projectId, dataset },
})

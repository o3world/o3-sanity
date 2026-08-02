/**
 * Studio v6.8's `sanity` barrel opens with `import "sanity/bundle.css"` (and
 * pulls `@sanity-labs/ui-poc/dist/styles.css` behind it). `load` and `verify`
 * reach that barrel for `defineField`/`defineType` via `@o3/sanity/schemas`,
 * and under `sanity exec` the module graph is loaded by Node, which throws
 * `ERR_UNKNOWN_FILE_EXTENSION: ".css"` before a line of script runs.
 *
 * This is the `sanity exec` twin of the vitest workaround (`vitest.config.mts`
 * inlines the barrel so Vite's no-op CSS handling absorbs it): a load hook
 * that resolves any `.css` module to an empty export. Wired into the `load`
 * and `verify` scripts via `NODE_OPTIONS=--import`, which propagates to the
 * child process `sanity exec` spawns.
 *
 * The hook registers off-thread (`register`, not `registerHooks`): the
 * on-thread sync variant trips `ERR_VM_MODULE_LINK_FAILURE` inside
 * `sanity exec`'s vm evaluation, while worker hooks compose with its own
 * loader chain.
 */
import { register } from 'node:module'

register('./css-stub-hooks.mjs', import.meta.url)

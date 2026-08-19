/**
 * Fixture and assertion helpers the moved renderers' tests and stories stand
 * on, kept beside them so an app's `@/test` barrel and a package story reach
 * the same code. `./seedContent` is a separate entry (`@o3/content-ui/testing/seed`)
 * because it statically imports the whole committed seed tree.
 */
export { classTokens, unprefixedHorizontalScrollUtilities, variantsOf } from './responsive'
export {
  projectSeedPage,
  resolveAssetMarkers,
  type ResolveRef,
  type SeedDoc,
} from './seedProjection'

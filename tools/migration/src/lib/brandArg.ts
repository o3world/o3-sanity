import { BRANDS, type Brand } from '@o3/sanity/brand'

/**
 * Which brand a pipeline run is for, read as a **command-line parameter**.
 *
 *     pnpm --filter @o3/migration load                     # o3
 *     pnpm --filter @o3/migration load -- --brand o3xo     # O3XO
 *
 * Every command takes it — `extract` picks the source, `convert` picks the
 * mapper, `paths` picks the corpus tree, and `sanity.cli.ts` picks the project
 * and dataset. One flag, read in one place, so the four cannot disagree.
 *
 * It is a flag and not an exported variable because `load` deletes and rewrites
 * every unlocked pipeline-owned document in the dataset it lands on. Resolving
 * that through `NEXT_PUBLIC_BRAND` alone made the target depend on what a shell
 * happened to have exported — and the two brands are two Sanity projects, so
 * the failure is not a wrong flag but a wrong company's content.
 *
 * The environment is still honoured as the fallback, because the app-shaped
 * entry points (`apps/o3xo/sanity.cli.ts`, the Studio) have no argv to read and
 * `NEXT_PUBLIC_BRAND` is how they already say it. The flag wins where both are
 * present: the command is the more specific statement of intent.
 */
export function brandArg(
  argv: readonly string[] = process.argv,
  env: Readonly<Record<string, string | undefined>> = process.env,
): Brand {
  const at = argv.indexOf('--brand')
  if (at !== -1) {
    const named = argv[at + 1]
    if (!named || named.startsWith('-')) {
      throw new Error(`--brand needs a brand name after it. Use one of: ${BRANDS.join(', ')}.`)
    }
    return checked(named, '--brand')
  }
  const named = env.NEXT_PUBLIC_BRAND
  return named ? checked(named, 'NEXT_PUBLIC_BRAND') : 'o3'
}

function checked(named: string, source: string): Brand {
  if (!(BRANDS as readonly string[]).includes(named)) {
    throw new Error(`${source}="${named}" is not a brand. Use one of: ${BRANDS.join(', ')}.`)
  }
  return named as Brand
}

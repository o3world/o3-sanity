export const SEGMENT_TITLES: Record<string, string> = {
  'blocks/section': 'Content/Blocks/Section',
  'blocks/base': 'Content/Blocks/Base',
  objects: 'Content/Objects',
  cards: 'Content/Cards',
  documents: 'Content/Documents',
}

function pascal(name: string): string {
  return name.replace(/^[a-z]/, (c) => c.toUpperCase())
}

/**
 * Title for a story file inside apps/web's content tree. The folder name
 * (schema name, camelCase) is the source of truth, per the schema-symmetric
 * structure (docs/specs/schema.md — schema name === folder name in
 * `apps/web/src/content/{documents,blocks/{base,section}}`). Non-content
 * paths return undefined — those factories must pass an explicit `title`.
 */
export function titleFromPath(fileUrlOrPath: string): string | undefined {
  const path = fileUrlOrPath.replace(/^file:\/\//, '')
  const match = path.match(
    /apps\/web\/src\/content\/(blocks\/section|blocks\/base|objects|cards|documents)\/([^/]+)\//,
  )
  if (!match) return undefined
  const prefix = SEGMENT_TITLES[match[1] as string]
  return `${prefix}/${pascal(match[2] as string)}`
}

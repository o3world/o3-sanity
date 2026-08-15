/**
 * Schema drift → what the repo declares against what the dataset serves (#139).
 *
 * Field `description`s are a knowledge surface, not documentation: the
 * authoring skill reads them through `get_schema` and composes against them
 * (ADR 0024, ADR 0025). A stale deploy therefore does not error — it feeds
 * every MCP consumer a confident wrong picture, the same silent failure
 * `guidance:check` exists to catch on the guidance half.
 *
 * Both sides arrive in the studio-manifest shape: `sanity manifest extract`
 * for the repo, `sanity schemas list --json` for the dataset. This module is
 * the comparison and nothing else — no extraction, no fetch, no printing — so
 * it can be tested without either.
 */

/**
 * A type, a field, or an array member — the manifest gives all three the same
 * shape, which is what lets one walk cover the whole tree. `fields` descends
 * into an object, `of` into an array's member type.
 */
export interface SchemaNode {
  readonly name: string
  readonly type: string
  readonly description?: string
  readonly fields?: readonly SchemaNode[]
  readonly of?: readonly SchemaNode[]
}

/** One disagreement, addressed by its dotted path from the type down. */
export type Drift =
  | {
      readonly kind: 'field-missing'
      /** e.g. `railPanelsSection.panels.panel.mark` */
      readonly path: string
    }
  | {
      /** The field is deployed; what it tells an agent about itself is stale. */
      readonly kind: 'description'
      readonly path: string
      readonly repo?: string
      readonly deployed?: string
    }

/** Every way the deployed schema disagrees with the repo's. */
export function diffSchemas(repo: readonly SchemaNode[], deployed: readonly SchemaNode[]): Drift[] {
  const drift: Drift[] = []
  compare(repo, deployed, '', drift)
  return drift
}

/**
 * One level of the tree, matched by name, then the same again for whatever
 * each node contains. Nodes are matched by name rather than position because
 * the manifest's field order is the Studio's, and reordering a form is not
 * drift.
 */
function compare(
  repo: readonly SchemaNode[],
  deployed: readonly SchemaNode[],
  prefix: string,
  drift: Drift[],
): void {
  const deployedByName = new Map(deployed.map((node) => [node.name, node]))

  for (const node of repo) {
    const path = prefix ? `${prefix}.${node.name}` : node.name
    const actual = deployedByName.get(node.name)

    if (!actual) {
      // A whole type absent from the deploy is a different finding from a
      // field absent inside one, and has no slice yet.
      if (prefix) drift.push({ kind: 'field-missing', path })
      continue
    }

    if (node.description !== actual.description) {
      drift.push({
        kind: 'description',
        path,
        repo: node.description,
        deployed: actual.description,
      })
    }

    compare(node.fields ?? [], actual.fields ?? [], path, drift)
    compare(node.of ?? [], actual.of ?? [], path, drift)
  }
}

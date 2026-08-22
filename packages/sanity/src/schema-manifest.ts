/**
 * Getting the two schemas into the one shape `diffSchemas` compares (#139).
 *
 * Both sides are the studio manifest and both hide the types one indirection
 * down, in different ways: the repo's `sanity manifest extract` writes a
 * hash-named file per workspace and an index pointing at it, while the
 * dataset's `sanity schemas list --json` returns documents whose `schema` is
 * a JSON string. Neither indirection is visible in the happy path — a reader
 * that skips one gets an empty comparison rather than an error, which is the
 * same silent pass this whole check exists to stop.
 *
 * Both source commands are marked experimental by the Sanity CLI (7.15.1).
 */
import type { SchemaNode } from './schema-diff'

/** `create-manifest.json` — the index `sanity manifest extract` writes. */
interface CreateManifest {
  readonly workspaces?: readonly {
    readonly name?: string
    readonly schema?: string
    readonly dataset?: string
    readonly projectId?: string
  }[]
}

/**
 * What the CLI actually resolved to, for the header to report.
 *
 * Not `resolveDataset()`: the runner shells out to the Sanity CLI, which loads
 * `.env.local`, while the runner's own process does not — so the two disagree
 * and the report names a dataset nobody queried. The manifest is written by
 * the same invocation that answers the query, so it cannot drift from it.
 */
export function repoTarget(
  manifest: CreateManifest,
  workspaceName: string,
): { dataset: string; projectId: string } {
  const workspace = manifest.workspaces?.find((entry) => entry.name === workspaceName)
  if (!workspace?.dataset || !workspace.projectId) {
    throw new Error(`workspace "${workspaceName}" names no project and dataset in the manifest`)
  }
  return { dataset: workspace.dataset, projectId: workspace.projectId }
}

/** The schema file this workspace's types were written to, relative to the index. */
export function repoSchemaFile(manifest: CreateManifest, workspaceName: string): string {
  const workspace = manifest.workspaces?.find((entry) => entry.name === workspaceName)
  if (!workspace?.schema) {
    throw new Error(`no workspace "${workspaceName}" in the extracted manifest`)
  }
  return workspace.schema
}

/** One document from `sanity schemas list --json`. */
interface DeployedSchemaDocument {
  readonly workspace?: { readonly name?: string }
  readonly schema?: string
}

/**
 * Every deployed schema in one dataset that the expected workspace does not
 * account for.
 *
 * A dataset keeps each workspace's schema as its own document and a deploy
 * only ever upserts its own, so a workspace that stops being deployed — or was
 * deployed by hand under another name — stays behind, declaring types the
 * brand's roster does not. Whatever reads the project trusts any schema it
 * finds there, so the check has to fail on the document's existence, not just
 * diff the expected one.
 *
 * The ids must come from a query against the dataset under check
 * (`*[_id in path("_.schemas.**")]`): `sanity schemas list` aggregates every
 * workspace in the config, so its rows cannot say which dataset a document
 * lives in.
 */
export function straySchemaDocs(
  ids: readonly { readonly _id?: string }[],
  workspaceName: string,
): string[] {
  return ids
    .map((entry) => {
      if (!entry._id) {
        throw new Error(
          'a schema document came back without an `_id` — the query shape has shifted',
        )
      }
      return entry._id
    })
    .filter((id) => id !== `_.schemas.${workspaceName}`)
}

/** The deployed types for one workspace, parsed out of the stored document. */
export function deployedTypes(
  payload: readonly DeployedSchemaDocument[],
  workspaceName: string,
): SchemaNode[] {
  const document = payload.find((entry) => entry.workspace?.name === workspaceName)
  if (!document?.schema) {
    throw new Error(
      `no deployed schema for workspace "${workspaceName}" — run \`pnpm schema:deploy\` first`,
    )
  }
  return JSON.parse(document.schema) as SchemaNode[]
}

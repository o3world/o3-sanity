import { describe, expect, it } from 'vitest'

import { deployedTypes, repoSchemaFile, repoTarget, straySchemaDocs } from './schema-manifest'

describe('repoSchemaFile', () => {
  /* `sanity manifest extract` writes one hash-named schema file per workspace
   * plus an index naming them. The hash changes whenever the schema does, so
   * the filename cannot be hardcoded and the index is the only way in. */
  it('resolves the hash-named file the manifest index points at', () => {
    const manifest = {
      workspaces: [{ name: 'default', schema: 'ed1005b6.create-schema.json' }],
    }

    expect(repoSchemaFile(manifest, 'default')).toBe('ed1005b6.create-schema.json')
  })
})

describe('repoTarget', () => {
  /* The runner shells out to the Sanity CLI, which loads `.env.local`; the
   * runner's own process does not, so `resolveDataset()` there answers with
   * the default while the CLI queries something else. Reporting the dataset
   * from the same manifest the CLI just wrote is the only way the header can
   * name what was actually compared. */
  it('reads the queried dataset from the manifest rather than the environment', () => {
    const manifest = {
      workspaces: [
        { name: 'default', schema: 'x.json', dataset: 'production', projectId: 'naorcr6k' },
      ],
    }

    expect(repoTarget(manifest, 'default')).toEqual({
      dataset: 'production',
      projectId: 'naorcr6k',
    })
  })
})

describe('deployedTypes', () => {
  /* `sanity schemas list --json` answers with the stored documents, and each
   * one carries its whole schema as a JSON *string* rather than as JSON. A
   * reader that trusts the outer parse gets a string where it expects types
   * and compares nothing. */
  it('parses the schema the API stores as a string inside the document', () => {
    const payload = [
      {
        workspace: { name: 'default' },
        schema: JSON.stringify([{ name: 'insight', type: 'document' }]),
      },
    ]

    expect(deployedTypes(payload, 'default')).toEqual([{ name: 'insight', type: 'document' }])
  })

  /* Nothing deployed is the state `development` was actually in, and returning
   * `[]` for it is the worst available answer: every repo type goes unmatched,
   * `diffSchemas` reports no drift, and the check passes loudest exactly when
   * the dataset is emptiest. */
  it('throws when the workspace has no deployed schema, rather than comparing against nothing', () => {
    expect(() => deployedTypes([], 'default')).toThrow(/default/)
  })
})

describe('straySchemaDocs', () => {
  /* A dataset keeps every schema document ever deployed to it: switching the
   * deploy to brand-named workspaces leaves the old whole-model
   * `_.schemas.default` behind, still declaring `faqSection` to every
   * schema-driven writer that reads the project (#252). Comparing only the
   * expected workspace would pass right over it. The ids come from a GROQ
   * query against the one dataset under check — `sanity schemas list` walks
   * every workspace in the config, so it cannot say which dataset a document
   * actually lives in. */
  it('names every deployed schema the brand workspace does not account for', () => {
    const ids = [{ _id: '_.schemas.o3' }, { _id: '_.schemas.default' }]

    expect(straySchemaDocs(ids, 'o3')).toEqual(['_.schemas.default'])
  })

  it('answers empty when the only deployed schema is the expected one', () => {
    expect(straySchemaDocs([{ _id: '_.schemas.o3xo' }], 'o3xo')).toEqual([])
  })

  /* `--tag` deploys write `_.schemas.<workspace>.tag.<tag>` — a different
   * schema surface for the same project, which nothing in this repo does on
   * purpose. */
  it('treats a tagged deploy of the same workspace as a stray', () => {
    const ids = [{ _id: '_.schemas.o3' }, { _id: '_.schemas.o3.tag.experiment' }]

    expect(straySchemaDocs(ids, 'o3')).toEqual(['_.schemas.o3.tag.experiment'])
  })
})

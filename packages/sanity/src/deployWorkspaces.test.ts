import { afterEach, describe, expect, it, vi } from 'vitest'

import { BRANDS, brandConfig } from './brand'
import { SECTION_BLOCKS, sectionBlocksFor } from './schemas/blocks/registry'

/**
 * WHAT EACH PROJECT'S DEPLOY DECLARES (#252) — the seam between the roster
 * split and every schema-driven writer.
 *
 * #251 filtered what a Studio OFFERS, but `sanity schemas deploy` reads this
 * config, and a whole-model workspace deploys `faqSection` into the o3
 * project's DEPLOYED schema — where `get_schema`, the typeset skill and
 * `schema:check` all read it as a valid `page.sections` member. So the
 * `default` workspace — the name every schema-driven reader resolves when
 * given none — carries the roster of the brand the env names, the way each
 * app's Studio resolves its own brand.
 *
 * The `model` workspace is the other half of ADR 0028: one model, one typegen.
 * It exists to be extracted, never deployed.
 *
 * The config resolves the brand at import, so each case re-imports it under
 * that brand's environment.
 */

/** A workspace as this walk reads it: name, target, and one array's members. */
type ReadableField = { name: string; of?: { type?: string }[] }
type ReadableType = { name: string; fields?: ReadableField[] }
type ReadableWorkspace = {
  name?: string
  projectId?: string
  schema?: { types?: readonly unknown[] }
}

async function workspacesUnder(brand: string): Promise<ReadableWorkspace[]> {
  vi.stubEnv('NEXT_PUBLIC_BRAND', brand)
  vi.resetModules()
  const { default: config } = await import('../sanity.config')
  return (Array.isArray(config) ? config : [config]) as ReadableWorkspace[]
}

const named = (workspaces: ReadableWorkspace[], name: string): ReadableWorkspace | undefined =>
  workspaces.find((workspace) => workspace.name === name)

/** One array field's declared member types, read off the built schema. */
function sectionMembers(workspace: ReadableWorkspace | undefined): (string | undefined)[] {
  const types = (workspace?.schema?.types ?? []) as readonly ReadableType[]
  const page = types.find((type) => type.name === 'page')
  const field = page?.fields?.find((candidate) => candidate.name === 'sections')
  return (field?.of ?? []).map((member) => member.type)
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('the schema each project deploys', () => {
  it.each(BRANDS)(
    'deploys %s its own roster to its own project, as the workspace every reader resolves unnamed',
    async (brand) => {
      const workspace = named(await workspacesUnder(brand), 'default')
      expect(workspace?.projectId).toBe(brandConfig(brand).projectId)
      expect(sectionMembers(workspace)).toEqual([...sectionBlocksFor(brand)])
    },
  )

  it('keeps faqSection out of the o3 deploy and in the o3xo deploy', async () => {
    expect(sectionMembers(named(await workspacesUnder('o3'), 'default'))).not.toContain(
      'faqSection',
    )
    expect(sectionMembers(named(await workspacesUnder('o3xo'), 'default'))).toContain('faqSection')
  })

  it.each(BRANDS)(
    'keeps a whole-model workspace for typegen to extract, whichever brand (%s) is in play',
    async (brand) => {
      expect(sectionMembers(named(await workspacesUnder(brand), 'model'))).toEqual([
        ...SECTION_BLOCKS,
      ])
    },
  )
})

/**
 * Sync → push the repo's agent guidance into the dataset (#72).
 *
 * The authoring skill is a thin bootstrap that fetches its knowledge at
 * session start (#68), so the voice guide has to exist as a document an MCP
 * consumer can query — while staying editable as markdown in git. This is the
 * whole of that seam: markdown in, one published document per source out.
 *
 *   pnpm guidance:sync
 *
 * Documents are written **published** (no `drafts.` prefix): a consumer using
 * the default published insight has to see them without asking for
 * drafts. Ids are deterministic, so a re-run replaces rather than duplicates,
 * and a document whose source row is gone is deleted — the dataset holds what
 * the repo says and nothing else.
 */
import { getCliClient } from 'sanity/cli'

import { idFor, readGuidance } from './sources'

const client = getCliClient({ apiVersion: '2026-07-01' })

async function main() {
  const docs = readGuidance()
  const { projectId, dataset } = client.config()
  console.log(`syncing ${docs.length} guidance document(s) → ${projectId}/${dataset}\n`)

  const live = await client.fetch<{ _id: string; body?: string }[]>(
    '*[_type == "guidance" && !(_id in path("drafts.**"))]{_id, body}',
  )
  const liveById = new Map(live.map((doc) => [doc._id, doc]))

  const tx = client.transaction()
  for (const doc of docs) {
    const before = liveById.get(doc._id)
    const state = !before ? 'created' : before.body === doc.body ? 'unchanged' : 'updated'
    console.log(`  ${state.padEnd(9)} ${doc._id}  ← ${doc.sourcePath}`)
    tx.createOrReplace(doc)
  }

  /* A draft of a guidance document can only be an accident — every field is
   * readOnly in Studio — but it would shadow the synced copy for anything
   * reading with the drafts perspective, so it goes too. */
  const expected = new Set(docs.map((doc) => doc._id))
  const stale = live.filter((doc) => !expected.has(doc._id)).map((doc) => doc._id)
  for (const id of stale) {
    console.log(`  deleted   ${id}  ← no longer in GUIDANCE_SOURCES`)
    tx.delete(id)
    tx.delete(`drafts.${id}`)
  }
  for (const doc of docs) tx.delete(`drafts.${doc._id}`)

  await tx.commit({ visibility: 'sync' })
  console.log(`\ndone — query them with *[_type == "guidance"]{key, title, body}`)
  console.log(`the voice guide is ${idFor('o3-voice')}`)
}

await main()

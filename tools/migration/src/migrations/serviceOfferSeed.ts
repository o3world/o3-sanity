/**
 * Targeted migration: create the AI Visibility Review `serviceOffer` from its
 * committed seed, `data/seed/serviceOffer/ai-visibility-review.json`, so the
 * coded `/ai-visibility-review` route has a document to render (OWSW-122).
 * The plan is in `serviceOfferSeedPlan.ts`.
 *
 * It reads, raw, every `serviceOffer` at the seed's id (published or draft) or
 * its slug, and creates the published document only when there is none. The
 * write is `createIfNotExists`, so an offer that appears between the read and
 * the write is left alone rather than replaced. Nothing that exists is ever
 * patched, so a rerun reports the offer and writes nothing.
 *
 *   pnpm --filter @o3/migration service-offer-seed -- --dataset development           # report only
 *   pnpm --filter @o3/migration service-offer-seed -- --dataset development --apply   # write
 *
 * `--dataset` is required every time and must name the configured dataset.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { getCliClient } from 'sanity/cli'

import { SEED_DIR } from '../lib/paths'
import { planServiceOfferSeed, type ExistingOffer, type SeedOffer } from './serviceOfferSeedPlan'

const client = getCliClient({ apiVersion: '2026-07-01' })

const SEED_FILE = join(SEED_DIR, 'serviceOffer', 'ai-visibility-review.json')
const QUERY = /* groq */ `*[_type == "serviceOffer" && (_id in $ids || slug.current == $slug)]{
  _id, "slug": slug.current
} | order(_id asc)`

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--')
  const apply = args.includes('--apply')
  const dataset = client.config().dataset
  const named = args.includes('--dataset') ? args[args.indexOf('--dataset') + 1] : undefined
  if (!named || named !== dataset)
    throw new Error(
      `refusing to touch "${dataset}" — pass --dataset ${dataset} to say so out loud.`,
    )

  const seed = JSON.parse(readFileSync(SEED_FILE, 'utf8')) as SeedOffer
  const existing = await client.fetch<ExistingOffer[]>(
    QUERY,
    { ids: [seed._id, `drafts.${seed._id}`], slug: seed.slug.current },
    { perspective: 'raw' },
  )
  console.log(
    `${client.config().projectId}/${dataset} — found ${existing.map((doc) => doc._id).join(', ') || 'nothing'}\n`,
  )

  const plan = planServiceOfferSeed(seed, existing)
  if (plan.kind === 'skip') {
    console.log(`  skip   ${plan.reason}\n\nnothing to do`)
    return
  }

  console.log(
    `  ${apply ? 'create' : 'would '}  ${plan.document._id} (slug "${seed.slug.current}") from ${SEED_FILE}`,
  )
  if (!apply) {
    console.log('\n1 document would be created. Re-run with --apply.')
    return
  }

  await client.createIfNotExists(plan.document as SeedOffer & { _type: string })
  console.log(`\ncreated ${plan.document._id} in ${dataset}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

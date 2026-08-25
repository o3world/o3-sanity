import { createClient } from '@sanity/client'

/**
 * THE WEBHOOK, STOOD IN FOR LOCALLY.
 *
 * In production a Sanity webhook POSTs `/api/revalidate` when a document
 * publishes, and the route flushes that document's cache tags. Locally that
 * never fires, because Sanity posts to a public URL and `localhost` is not
 * one — so a published edit sat behind a cached read until someone knew to
 * `curl` the route by hand. Presentation hid the problem for anyone who
 * happened to be in it (it reads drafts live) and left it for everyone else,
 * which is the shape of a trap rather than a limitation.
 *
 * So the dev server listens to the dataset itself and calls its own webhook.
 * It is the SAME route with the SAME payload, which is the point: local
 * revalidation behaves like production revalidation rather than approximating
 * it, and a bug in the tag scheme shows up here instead of after a deploy.
 *
 * **Published documents only.** Draft mutations fire on every keystroke, and
 * the draft path is already live through Presentation — revalidating on them
 * would be a flush per character to refresh content this read cannot see.
 *
 * Brand facts arrive as arguments and are never read here: this package is
 * engine, and `purity.test.ts` enforces that.
 */
export interface DevRevalidateOptions {
  readonly projectId: string
  readonly dataset: string
  /** A read token. Without one the listener does not start. */
  readonly token: string | undefined
  /** The app's own revalidate endpoint, e.g. `http://localhost:3600/api/revalidate`. */
  readonly endpoint: string
  /** Defaults to `console`; injectable so a test can read what was said. */
  readonly log?: Pick<Console, 'log' | 'warn'>
}

/** A publish is two mutations — the draft going away and the document landing. */
const COALESCE_MS = 300

export function startDevRevalidate(options: DevRevalidateOptions): () => void {
  const log = options.log ?? console
  if (!options.token) {
    log.warn(
      '[dev-revalidate] no read token, so published edits will not refresh. Run `pnpm env:pull`.',
    )
    return () => {}
  }

  const client = createClient({
    projectId: options.projectId,
    dataset: options.dataset,
    apiVersion: '2024-10-01',
    token: options.token,
    useCdn: false,
  })

  // Keyed by `_type`, because that is what the payload carries and what the
  // route tags on; the slug rides along so the per-document tag is flushed too.
  const pending = new Map<string, { _type: string; _id: string; slug?: string }>()
  let timer: ReturnType<typeof setTimeout> | undefined

  const flush = () => {
    timer = undefined
    const batch = [...pending.values()]
    pending.clear()
    for (const payload of batch) {
      void fetch(options.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((response) => {
          if (!response.ok) {
            log.warn(`[dev-revalidate] ${payload._type} → ${response.status}`)
            return
          }
          log.log(`[dev-revalidate] flushed ${payload._type} (${payload._id})`)
        })
        .catch((error: unknown) => {
          // The dev server restarting mid-listen is the ordinary case here.
          log.warn(`[dev-revalidate] ${payload._type} failed: ${String(error)}`)
        })
    }
  }

  const subscription = client
    .listen('*[!(_id in path("drafts.**"))]', {}, { includeResult: true, visibility: 'query' })
    .subscribe({
      next: (event) => {
        if (event.type !== 'mutation') return
        const doc = event.result as
          { _id?: string; _type?: string; slug?: { current?: string } } | undefined
        const type = doc?._type
        const id = doc?._id ?? event.documentId
        if (!type || !id) return

        pending.set(type, { _type: type, _id: id, slug: doc?.slug?.current })
        if (timer) clearTimeout(timer)
        timer = setTimeout(flush, COALESCE_MS)
      },
      error: (error: unknown) => {
        log.warn(`[dev-revalidate] listener stopped: ${String(error)}`)
      },
    })

  log.log(`[dev-revalidate] watching ${options.projectId}/${options.dataset} → ${options.endpoint}`)

  return () => {
    if (timer) clearTimeout(timer)
    subscription.unsubscribe()
  }
}

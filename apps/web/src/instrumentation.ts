/**
 * Dev-only: stand in for the publish webhook Sanity cannot deliver to
 * `localhost`, so a published edit refreshes the page the way it does in
 * production (#347 follow-up).
 *
 * `register()` runs once per server process, before the first request. The
 * listener is imported dynamically inside the Node.js guard so `@sanity/client`
 * never reaches the Edge bundle, and the whole module is inert outside
 * development — a production server has a real webhook and must not hold a
 * socket open to the dataset.
 */
export async function register() {
  if (process.env.NODE_ENV !== 'development') return
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { startDevRevalidate } = await import('@o3/content-runtime/dev-revalidate')
  const { brandConfig } = await import('@o3/sanity/brand')

  const { projectId, dataset } = brandConfig()
  // `dev.sh` exports WEB_PORT from the worktree's own `.env` before booting,
  // so this is the port this server is actually on rather than a guess.
  const port = process.env.WEB_PORT ?? process.env.PORT ?? '3000'

  startDevRevalidate({
    projectId,
    dataset,
    token: process.env.SANITY_API_READ_TOKEN,
    endpoint: `http://localhost:${port}/api/revalidate`,
  })
}

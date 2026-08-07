import { Writable } from 'node:stream'
import type { ReactElement } from 'react'
import type { Metadata } from 'next'
import { renderToPipeableStream } from 'react-dom/server'

import { __setDraftMode } from './stubs/next-headers'
import {
  fetchCalls,
  installDataset,
  type DatasetResolver,
  type FetchCall,
} from './stubs/sanity-live'

/**
 * The `render` layer's entry point: take a route shim exactly as a `page.tsx`
 * re-exports it, feed it fixture documents, and get back the HTML a visitor
 * would receive plus the `<head>` metadata Next would emit.
 *
 *   const { html, metadata } = await renderRoute(buildDetailRoute(insight), {
 *     data: anInsight(),
 *     params: { slug: 'hello' },
 *   })
 *   expect(html).toContain('Hello world')
 *   expect(metadata.title).toBe('Hello world')
 *
 * No Sanity project, no token, no network, no dev server.
 */

/** The shape every route builder in `@/lib/content-routes/build` returns. */
export interface RouteShimLike {
  generateMetadata: (props: never) => Promise<Metadata>
  Page: (props: never) => Promise<ReactElement>
}

export interface RenderRouteOptions {
  /**
   * What `sanityFetch` returns. Pass a value to answer every query with it
   * (the common case — one route, one document), or a resolver to vary the
   * answer by query, e.g. when a route fetches both a doc and site settings.
   */
  data: unknown | DatasetResolver
  params?: Record<string, string | string[] | undefined>
  searchParams?: Record<string, string | string[] | undefined>
  /** Render the Presentation/draft path (`Blocks` picks ClientBlockRenderer). */
  draft?: boolean
}

export interface RenderRouteResult {
  readonly html: string
  readonly metadata: Metadata
  /** Every sanityFetch the route made — assert cache tags and stega here. */
  readonly calls: readonly FetchCall[]
}

function toResolver(data: unknown): DatasetResolver {
  return typeof data === 'function' ? (data as DatasetResolver) : () => data
}

/** Next's `notFound()` throws rather than returning; this recognizes it. */
function isNotFoundError(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest
  return typeof digest === 'string' && digest.startsWith('NEXT_HTTP_ERROR_FALLBACK;404')
}

/**
 * Assert a route 404s for the given input.
 *
 *   await expectNotFound(route, { data: null, params: { slug: 'nope' } })
 */
export async function expectNotFound(
  route: RouteShimLike,
  options: RenderRouteOptions,
): Promise<void> {
  try {
    await renderRoute(route, options)
  } catch (error) {
    if (isNotFoundError(error)) return
    throw error
  }
  throw new Error('Expected the route to call notFound(), but it rendered.')
}

export async function renderRoute(
  route: RouteShimLike,
  options: RenderRouteOptions,
): Promise<RenderRouteResult> {
  installDataset(toResolver(options.data))
  __setDraftMode(options.draft ?? false)

  // Next hands route segments as promises; mirror that exactly so the shim's
  // own `await params` is what runs.
  const props = {
    params: Promise.resolve(options.params ?? {}),
    searchParams: Promise.resolve(options.searchParams ?? {}),
  } as never

  // generateMetadata first, matching Next's order — and because a route that
  // 404s should do so before we spend a render on it.
  const metadata = await route.generateMetadata(props)
  const element = await route.Page(props)
  const html = await renderToHtml(element)

  return { html, metadata, calls: fetchCalls() }
}

/**
 * `renderToStaticMarkup` cannot render this tree: `Blocks` is an async server
 * component, and only the streaming renderers await those. `onAllReady` waits
 * for every boundary to settle, so the result is the complete document rather
 * than a shell with pending fallbacks.
 */
function renderToHtml(element: ReactElement): Promise<string> {
  return new Promise((resolvePromise, rejectPromise) => {
    const chunks: Buffer[] = []
    let renderError: unknown = null

    const sink = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.from(chunk))
        callback()
      },
    })
    sink.on('finish', () => {
      if (renderError) rejectPromise(renderError)
      else resolvePromise(Buffer.concat(chunks).toString('utf8'))
    })
    sink.on('error', rejectPromise)

    const { pipe } = renderToPipeableStream(element, {
      onAllReady() {
        pipe(sink)
      },
      onError(error) {
        // Recorded rather than thrown: React continues past recoverable
        // errors, and rejecting here would lose the shell error's context.
        renderError = error
      },
      onShellError(error) {
        rejectPromise(error)
      },
    })
  })
}

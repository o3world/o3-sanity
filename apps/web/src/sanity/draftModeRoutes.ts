import { safeReturnPath, SANITY_PROJECT_ID } from './draftPreview'

/**
 * The two draft-mode route handlers, lifted out of `app/api/` so they can be
 * unit-tested (#60). Every effect they have is injected: `draftMode` and the
 * token verifier come in as dependencies, and the result is a plain `Response`
 * — so nothing here imports `next/headers` or `next/server`, and a test needs
 * no request scope.
 *
 * **The security rule this file exists to hold:** draft mode reveals every
 * unpublished document in the dataset, so it is never enabled because the
 * browser said so. The client sends the Studio token it found in
 * `localStorage`; this module asks Sanity whether that token is a member of
 * *this* project, and only then enables. A forged, expired, or foreign token
 * gets a 401 and no cookie.
 */

/** The subset of Next's `DraftMode` these handlers touch. */
export interface DraftModeHandle {
  enable(): void
  disable(): void
}

/**
 * The **project-scoped** users endpoint — `<projectId>.api.sanity.io`, not the
 * global `api.sanity.io`. That host binds the session to the project: a valid
 * Sanity token belonging to some other project is rejected there with
 * `SIO-401-AWH "Session does not match project host"`, which is exactly the
 * membership question we need answered and cannot ask of the global endpoint.
 *
 * Pinned API version: the response shape (`id`, `roles`) is what's checked.
 */
const USERS_ME_API_VERSION = 'v2021-06-07'

export function studioUsersMeUrl(projectId: string): string {
  return `https://${projectId}.api.sanity.io/${USERS_ME_API_VERSION}/users/me`
}

export interface VerifyStudioTokenOptions {
  projectId?: string
  /** Injected in tests; defaults to the platform `fetch`. */
  fetchImpl?: typeof fetch
}

interface SanityUser {
  id?: unknown
  roles?: unknown
}

/**
 * Does this token belong to a member of this Sanity project?
 *
 * Two traps this deliberately does not fall into:
 *
 * - **`res.ok` is not the answer.** An *unauthenticated* request to the
 *   project-scoped `users/me` returns `200 {}`, not a 401 — so a naive
 *   `if (response.ok)` fails open for a caller who sends no token at all.
 *   A non-empty `id` is the real signal.
 * - **Identity is not membership.** The project host also returns the caller's
 *   roles *within this project*; a member always has at least one. Requiring a
 *   non-empty `roles` array keeps the check about "may read this dataset"
 *   rather than "is a Sanity user somewhere".
 *
 * Anything unexpected — a network error, a non-JSON body — is `false`. An auth
 * check fails closed.
 */
export async function verifyStudioToken(
  token: string,
  { projectId = SANITY_PROJECT_ID, fetchImpl = fetch }: VerifyStudioTokenOptions = {},
): Promise<boolean> {
  if (!token) return false

  try {
    const response = await fetchImpl(studioUsersMeUrl(projectId), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!response.ok) return false

    const user = (await response.json()) as SanityUser | null
    if (typeof user?.id !== 'string' || user.id.length === 0) return false
    return Array.isArray(user.roles) && user.roles.length > 0
  } catch {
    return false
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

async function readToken(request: Request): Promise<string | null> {
  try {
    const body = (await request.json()) as { token?: unknown } | null
    return typeof body?.token === 'string' && body.token.length > 0 ? body.token : null
  } catch {
    return null
  }
}

export interface EnableDraftModeDeps {
  draftMode: () => Promise<DraftModeHandle>
  verifyToken: (token: string) => Promise<boolean>
}

/**
 * `POST /api/draft-mode/enable` — the preview switcher's way in.
 *
 * Distinct from the `GET` on the same route, which is next-sanity's
 * `defineEnableDraftMode` and validates a Presentation preview-URL secret.
 * Both are "enable draft mode"; they differ only in which credential the
 * caller can produce, which is why they share a URL rather than inventing a
 * second one.
 *
 * The response carries the draft-mode cookie, so the caller's `router.refresh()`
 * re-renders the very URL it was on — no redirect, no lost scroll position.
 */
export async function enableDraftModeForStudioSession(
  request: Request,
  deps: EnableDraftModeDeps,
): Promise<Response> {
  const token = await readToken(request)
  if (!token) {
    return json(401, { error: 'A Sanity Studio session token is required.' })
  }

  if (!(await deps.verifyToken(token))) {
    return json(401, { error: 'That token is not a member of this Sanity project.' })
  }

  const draft = await deps.draftMode()
  draft.enable()
  return json(200, { draft: true })
}

export interface DisableDraftModeDeps {
  draftMode: () => Promise<DraftModeHandle>
}

/**
 * `GET /api/draft-mode/disable` — the way out, and deliberately unauthenticated:
 * the worst a stranger can do is see published content, which is what they
 * were already entitled to.
 *
 * A plain link rather than a fetch, so leaving draft mode works with no
 * JavaScript and the navigation itself is the refresh. `?to=` is sanitised by
 * `safeReturnPath`, which is what stops it being an open redirect.
 */
export async function disableDraftModeAndReturn(
  request: Request,
  deps: DisableDraftModeDeps,
): Promise<Response> {
  const draft = await deps.draftMode()
  draft.disable()

  const requestUrl = new URL(request.url)
  const destination = new URL(safeReturnPath(requestUrl.searchParams.get('to')), requestUrl.origin)

  return new Response(null, {
    status: 307,
    headers: { location: destination.toString(), 'cache-control': 'no-store' },
  })
}

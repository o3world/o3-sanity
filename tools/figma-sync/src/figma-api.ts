/**
 * The one network seam (#78). Everything else in this package is pure, so the
 * tests never need a token, a fixture server, or the API's rate limit — they
 * feed node trees straight to `normalize`/`hash`.
 *
 * The REST API directly, not MCP: this has to be deterministic and runnable in
 * CI, and the official MCP server is rate-limited to uselessness on this
 * account (`docs/agents/figma.md`).
 */

import { readFigmaTokenWithSource } from './env'
import type { SectionChild } from './probe'
import type { AssetFormat } from './types'

const API_ROOT = 'https://api.figma.com/v1'

/** How many node ids go in one `/nodes` request — full page frames are large. */
const NODE_BATCH_SIZE = 3

export interface FileMeta {
  readonly name: string
  readonly version: string
  readonly lastModified: string
}

export interface FigmaClient {
  /** One cheap call: `?depth=1` returns the file's metadata, not its tree. */
  getFileMeta(fileKey: string): Promise<FileMeta>
  /** nodeId → subtree document. A node the file does not have is omitted. */
  getNodeDocuments(fileKey: string, nodeIds: readonly string[]): Promise<Map<string, unknown>>
  /**
   * The section's **direct** children, for the new-frame probe (#79) —
   * `depth=1`, so one small call whatever the section holds. `null` when the
   * file has no such node.
   */
  getSectionChildren(fileKey: string, sectionNodeId: string): Promise<SectionChild[] | null>
  /**
   * `/v1/images` — nodeId → a URL for that node **drawn** at `format`/`scale`
   * (#81). Figma answers `null` for an id it will not export rather than
   * failing the call, so the map's value is nullable and the caller decides
   * what a missing image means.
   */
  getRenderUrls(
    fileKey: string,
    nodeIds: readonly string[],
    options: { format: AssetFormat; scale: number; absoluteBounds?: boolean; version?: string },
  ): Promise<Map<string, string | null>>
  /**
   * `/v1/files/:key/images` — the file's image library, `imageRef` → URL of the
   * **uploaded original**. Figma keys a fill by the SHA-1 of its bytes, so this
   * is the one way to get an `imageFill` asset's exact source back (#80, #81).
   */
  getImageFillUrls(fileKey: string): Promise<Map<string, string>>
  /**
   * Any URL the API handed back, as bytes. No token: these are pre-signed
   * links to Figma's bucket, and they expire.
   */
  downloadBinary(url: string): Promise<Uint8Array>
}

type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<Response>

export interface FigmaClientOptions {
  readonly fetchImpl?: FetchLike
  /**
   * How many times a 429 is re-asked before it becomes an error, and how long
   * the first wait is (doubling after that). A brand whose manifest spreads
   * over sixteen canvases makes sixteen probe calls back to back where O3's
   * makes one, and Figma answers the tail of that burst with a rate limit
   * rather than a failure (#242). Zero in tests: a retry there would only
   * spend the wall clock proving the same throw.
   */
  readonly retries?: number
  readonly retryDelayMs?: number
  /** Where the token came from, named in a 401/403 so the reader fixes the
   * file the key actually came from. */
  readonly tokenSource?: string
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export function createFigmaClient(
  token: string,
  { fetchImpl = fetch, retries = 4, retryDelayMs = 5_000, tokenSource }: FigmaClientOptions = {},
): FigmaClient {
  async function get<T>(path: string): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      const response = await fetchImpl(`${API_ROOT}${path}`, {
        headers: { 'X-Figma-Token': token },
      })
      if (response.ok) return (await response.json()) as T
      // Only the rate limit is retried. Every other status is a fact about
      // the request — a dead node, an expired token — and asking again just
      // spends the wall clock on it.
      if (response.status !== 429 || attempt >= retries) {
        const body = (await response.text()).slice(0, 400)
        const provenance =
          tokenSource && (response.status === 401 || response.status === 403)
            ? `\nToken came from ${tokenSource}.`
            : ''
        throw new Error(
          `Figma API ${response.status} ${response.statusText} for ${path}\n${body}${provenance}`,
        )
      }
      const after = Number(response.headers.get('retry-after'))
      await wait(Number.isFinite(after) && after > 0 ? after * 1000 : retryDelayMs * 2 ** attempt)
    }
  }

  return {
    async getFileMeta(fileKey) {
      const file = await get<FileMeta>(`/files/${fileKey}?depth=1`)
      return { name: file.name, version: file.version, lastModified: file.lastModified }
    },

    async getNodeDocuments(fileKey, nodeIds) {
      const documents = new Map<string, unknown>()
      for (let i = 0; i < nodeIds.length; i += NODE_BATCH_SIZE) {
        const batch = nodeIds.slice(i, i + NODE_BATCH_SIZE)
        const ids = batch.map(encodeURIComponent).join(',')
        const { nodes } = await get<{ nodes: Record<string, { document?: unknown } | null> }>(
          `/files/${fileKey}/nodes?ids=${ids}`,
        )
        for (const nodeId of batch) {
          const entry = nodes[nodeId]
          if (entry?.document !== undefined) documents.set(nodeId, entry.document)
        }
      }
      return documents
    },

    async getSectionChildren(fileKey, sectionNodeId) {
      const { nodes } = await get<{
        nodes: Record<string, { document?: { children?: SectionChild[] } } | null>
      }>(`/files/${fileKey}/nodes?ids=${encodeURIComponent(sectionNodeId)}&depth=1`)
      const document = nodes[sectionNodeId]?.document
      if (!document) return null
      return document.children ?? []
    },

    async getRenderUrls(fileKey, nodeIds, { format, scale, absoluteBounds, version }) {
      const ids = nodeIds.map(encodeURIComponent).join(',')
      const bounds = absoluteBounds ? '&use_absolute_bounds=true' : ''
      const revision = version ? `&version=${encodeURIComponent(version)}` : ''
      const { err, images } = await get<{
        err: string | null
        images: Record<string, string | null>
      }>(`/images/${fileKey}?ids=${ids}&format=${format}&scale=${scale}${bounds}${revision}`)
      // A 200 with `err` set is how this endpoint reports a bad request.
      if (err) throw new Error(`Figma /images returned an error: ${err}`)
      return new Map(nodeIds.map((nodeId) => [nodeId, images[nodeId] ?? null]))
    },

    async getImageFillUrls(fileKey) {
      const { meta } = await get<{ meta?: { images?: Record<string, string> } }>(
        `/files/${fileKey}/images`,
      )
      return new Map(Object.entries(meta?.images ?? {}))
    },

    async downloadBinary(url) {
      const response = await fetchImpl(url)
      if (!response.ok) {
        throw new Error(`download failed: ${response.status} ${response.statusText} for ${url}`)
      }
      return new Uint8Array(await response.arrayBuffer())
    },
  }
}

/**
 * The everyday constructor: the repo-provisioned token, with its source
 * carried into any auth failure it raises.
 */
export function createFigmaClientFromEnv(options: FigmaClientOptions = {}): FigmaClient {
  const token = readFigmaTokenWithSource()
  return createFigmaClient(token.value, { ...options, tokenSource: token.source })
}

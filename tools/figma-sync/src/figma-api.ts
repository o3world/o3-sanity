/**
 * The one network seam (#78). Everything else in this package is pure, so the
 * tests never need a token, a fixture server, or the API's rate limit — they
 * feed node trees straight to `normalize`/`hash`.
 *
 * The REST API directly, not MCP: this has to be deterministic and runnable in
 * CI, and the official MCP server is rate-limited to uselessness on this
 * account (`docs/agents/figma.md`).
 */

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
    options: { format: AssetFormat; scale: number },
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

export function createFigmaClient(token: string, fetchImpl: FetchLike = fetch): FigmaClient {
  async function get<T>(path: string): Promise<T> {
    const response = await fetchImpl(`${API_ROOT}${path}`, { headers: { 'X-Figma-Token': token } })
    if (!response.ok) {
      const body = (await response.text()).slice(0, 400)
      throw new Error(`Figma API ${response.status} ${response.statusText} for ${path}\n${body}`)
    }
    return (await response.json()) as T
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

    async getRenderUrls(fileKey, nodeIds, { format, scale }) {
      const ids = nodeIds.map(encodeURIComponent).join(',')
      const { err, images } = await get<{
        err: string | null
        images: Record<string, string | null>
      }>(`/images/${fileKey}?ids=${ids}&format=${format}&scale=${scale}`)
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

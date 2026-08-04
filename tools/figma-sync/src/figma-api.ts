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
  }
}

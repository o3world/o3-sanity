import { stegaClean } from '@sanity/client/stega'

interface PanelIdSource {
  _key?: string | null
  anchor?: string | null
}

interface PanelIdScope {
  /** The section's own `_key`. */
  sectionKey?: string
  /** The section's resolved anchor — absent when another band on the page holds the name. */
  sectionAnchor?: string | null
  /** Ids already claimed on the page. Each id this mints is added to it. */
  taken?: Set<string>
}

const clean = (value: string | null | undefined) => (stegaClean(value) ?? '').trim()

/**
 * The DOM id of every panel in a rail band — what each rail link's hash points at.
 *
 * An anchored panel in an anchored band reads `<band anchor>-<panel anchor>`, so
 * the homepage platforms band names its tabs `#tech-platforms-sanity` and its
 * siblings. Anything less falls back to `rail-panel-<section key>-…`. The
 * section key is there because panel keys alone are not unique on a page:
 * duplicating a band in the Studio copies its panels' keys verbatim, and two
 * bands minting one id cross-wire both rails' observers and every link.
 *
 * A name already in `taken` — a band's anchor, or a panel id minted before this
 * one — stays where it is, and this panel keeps its key-based id.
 */
export function panelIds(
  panels: readonly PanelIdSource[],
  { sectionKey, sectionAnchor, taken = new Set() }: PanelIdScope,
): string[] {
  const band = clean(sectionAnchor)
  const fallback = `rail-panel-${sectionKey ? `${sectionKey}-` : ''}`

  return panels.map((panel, index) => {
    const anchor = clean(panel.anchor)
    const named = anchor ? (band ? `${band}-${anchor}` : `${fallback}${anchor}`) : undefined
    const id = named && !taken.has(named) ? named : `${fallback}${panel._key ?? index}`
    taken.add(id)
    return id
  })
}

/**
 * Every band's panel ids, resolved for the page at once (#149's rule, carried
 * down a level).
 *
 * A joined name can only collide with something outside its own band — another
 * band's anchor, or another band's joined name — so it is only answerable from
 * the whole array. Band anchors are claimed first, wherever they sit: they are
 * what a button jumps to, and a panel id is not.
 */
export function pagePanelIds(
  blocks: readonly { _key: string }[],
  sections: ReadonlyMap<string, string>,
): Map<string, string[]> {
  const taken = new Set(sections.values())
  const byKey = new Map<string, string[]>()

  for (const block of blocks) {
    const panels = (block as { panels?: PanelIdSource[] | null }).panels
    if (!Array.isArray(panels)) continue
    byKey.set(
      block._key,
      panelIds(panels, { sectionKey: block._key, sectionAnchor: sections.get(block._key), taken }),
    )
  }

  return byKey
}

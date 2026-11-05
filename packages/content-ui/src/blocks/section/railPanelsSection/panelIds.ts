import { stegaClean } from '@sanity/client/stega'

interface PanelIdSource {
  _key?: string | null
  anchor?: string | null
}

interface PanelIdScope {
  /** The section's own `_key`, read out of `loc`. */
  sectionKey?: string
  /** The section's resolved anchor — absent when another band on the page holds the name. */
  sectionAnchor?: string | null
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
 * A panel anchor repeated inside one band goes to the first panel, the way a
 * repeated section anchor does (`sectionAnchors`); the later panel keeps its
 * key-based id.
 */
export function panelIds(
  panels: readonly PanelIdSource[],
  { sectionKey, sectionAnchor }: PanelIdScope,
): string[] {
  const band = clean(sectionAnchor)
  const fallback = `rail-panel-${sectionKey ? `${sectionKey}-` : ''}`
  const claimed = new Set<string>()

  return panels.map((panel, index) => {
    const anchor = clean(panel.anchor)
    if (anchor && !claimed.has(anchor)) {
      claimed.add(anchor)
      return band ? `${band}-${anchor}` : `${fallback}${anchor}`
    }
    return `${fallback}${panel._key ?? index}`
  })
}

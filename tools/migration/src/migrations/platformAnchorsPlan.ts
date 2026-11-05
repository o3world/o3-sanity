/**
 * What `platformAnchors` sets on the homepage: the anchor on the platforms
 * rail band and on its Sanity, Vercel and Lovable panels, so the tabs link as
 * `#tech-platforms-sanity`, `-vercel` and `-lovable` (OWSW-117).
 *
 * Panels are found by their tab label, not their `_key`: the Vercel panel was
 * recreated in the Studio and carries a random key.
 *
 * Only an empty anchor is written. One that already holds a different name is
 * an editor's, and is reported and left alone.
 *
 * The names come from outside the document, so a locked document stops the
 * run (AGENTS.md → Changing a dataset).
 */
export const BAND_KEY = 'platforms'
export const BAND_ANCHOR = 'tech-platforms'
export const PANEL_ANCHORS: Record<string, string> = {
  Sanity: 'sanity',
  Vercel: 'vercel',
  Lovable: 'lovable',
}

type Panel = { _key: string; _type: string; railLabel?: string; anchor?: string }
type Section = { _key: string; _type: string; anchor?: string; panels?: Panel[] | null }

export type AnchorRow = {
  _id: string
  _rev: string
  migration?: { locked?: boolean } | null
  sections?: Section[] | null
}

export type AnchorPlan = {
  id: string
  /** The revision the plan was read at; the patch is guarded on it. */
  revision: string
  /** Patch path → the anchor written there. */
  set: Record<string, string>
  /** What the plan found and would not write, for the report. */
  kept: string[]
}

export function planPlatformAnchors(row: AnchorRow): AnchorPlan | null {
  if (row.migration?.locked)
    throw new Error(`${row._id} is locked — the anchors come from outside it, so the run stops.`)

  const plan: AnchorPlan = { id: row._id, revision: row._rev, set: {}, kept: [] }
  const band = row.sections?.find((s) => s._type === 'railPanelsSection' && s._key === BAND_KEY)
  if (!band) {
    plan.kept.push(`no railPanelsSection keyed "${BAND_KEY}"`)
    return plan
  }

  const bandPath = `sections[_key=="${BAND_KEY}"]`
  const claim = (path: string, current: string | undefined, name: string) => {
    if (!current?.trim()) plan.set[path] = name
    else if (current !== name) plan.kept.push(`${path} is "${current}", not "${name}"`)
  }

  claim(`${bandPath}.anchor`, band.anchor, BAND_ANCHOR)
  for (const [label, name] of Object.entries(PANEL_ANCHORS)) {
    const panel = band.panels?.find((p) => p.railLabel?.trim() === label)
    if (!panel) plan.kept.push(`no panel labelled "${label}" in the ${BAND_KEY} band`)
    else claim(`${bandPath}.panels[_key=="${panel._key}"].anchor`, panel.anchor, name)
  }

  return Object.keys(plan.set).length || plan.kept.length ? plan : null
}

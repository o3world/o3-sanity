/**
 * The GTM container a request loads, if any. Never in draft mode: Presentation
 * previews the live site in draft mode, so an editor's preview would otherwise
 * count as a visit and reach every tag.
 */
export function gtmContainerFor({
  isDraft,
  gtmId,
}: {
  isDraft: boolean
  gtmId: string | undefined
}): string | undefined {
  return isDraft ? undefined : gtmId
}

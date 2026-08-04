/**
 * The design file every canonical frame and component set lives in — the same
 * key `tools/figma-sync/data/tracked-nodes.json` is pinned to. Figma is the
 * design source of record (AGENTS.md → Design source of record), so a story
 * that claims to match a frame should be one click from it.
 */
export const FIGMA_FILE_KEY = 'RvraLJaZ0zWm8UaD5AJf43'

/**
 * `parameters.design` for `@storybook/addon-designs` — the "Design" tab that
 * puts the source-of-record frame beside the built component.
 *
 * Takes a node id in the **colon** form the manifest and `docs/figma-*.md`
 * write (`1680:2134`) and emits the **dash** form a Figma URL needs, so an id
 * can be pasted from either document without editing it. Passing the dash
 * form already works too.
 *
 * The addon renders whatever URL it is given, so a wrong id fails silently as
 * an empty tab. When adding one, take it from the manifest rather than from a
 * browser URL — the manifest's ids are verified as frames (#79), and a URL
 * copied mid-selection is usually a child node, which is the mistake
 * `docs/agents/figma.md` opens by warning about.
 */
export function figmaDesign(nodeId: string) {
  return {
    type: 'figma' as const,
    url: `https://www.figma.com/design/${FIGMA_FILE_KEY}/?node-id=${nodeId.replaceAll(':', '-')}`,
  }
}

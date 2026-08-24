/**
 * O3's design file — the same key `tools/figma-sync/data/tracked-nodes.json`
 * is pinned to. Figma is the design source of record (AGENTS.md → Design
 * source of record), so a story that claims to match a frame should be one
 * click from it.
 */
export const FIGMA_FILE_KEY = 'RvraLJaZ0zWm8UaD5AJf43'

/**
 * O3XO's, the _O3XO: UI kit_ (ADR 0028's second addendum) — the key
 * `tracked-nodes-o3xo.json` is pinned to, and the file
 * `docs/figma-components-o3xo.md` maps. A component whose source is that kit
 * takes its node id from there and passes this.
 */
export const O3XO_FIGMA_FILE_KEY = 'G6M2gu5qKFvhGxwj3W365b'

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
 *
 * `fileKey` defaults to O3's, which is where most of the repo's components
 * come from. A component built against the O3XO kit passes
 * `O3XO_FIGMA_FILE_KEY` — the two files hold different designs and a node id
 * from one means nothing in the other (#242).
 */
export function figmaDesign(nodeId: string, fileKey: string = FIGMA_FILE_KEY) {
  return {
    type: 'figma' as const,
    url: `https://www.figma.com/design/${fileKey}/?node-id=${nodeId.replaceAll(':', '-')}`,
  }
}

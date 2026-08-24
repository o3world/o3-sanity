/**
 * Reading `data-sanity` back out of rendered HTML (#107).
 *
 * The attribute is an encoded location, not a path:
 *
 *     id=page-index;type=page;path=sections:aaa.panels:bbb;base=%2Fstudio
 *
 * `createDataAttribute` writes `[_key=="x"]` as `:x`, so the paths these
 * helpers return are that compact form — `sections:aaa` for a band,
 * `sections:aaa.heading` for its header, `sections:aaa.panels:bbb` for one of
 * its items. Which is convenient for assertions: a band path has no `.` in it
 * and every sub-block path does.
 */

const ATTR = /data-sanity="([^"]*)"/g

/** Every `data-sanity` path in the HTML, in document order. */
function sanityPaths(html: string): string[] {
  return [...html.matchAll(ATTR)].flatMap((match) => {
    const path = (match[1] ?? '')
      .split(';')
      .find((part) => part.startsWith('path='))
      ?.slice('path='.length)
    return path ? [path] : []
  })
}

/**
 * The band-level paths — one per dispatched block, stamped by the dispatch
 * seam. Everything below a band is a path *under* one, so the dot is the
 * whole test.
 */
export function bandPaths(html: string): string[] {
  return sanityPaths(html).filter((path) => !path.includes('.'))
}

/** The paths below the bands — headers and keyed items. */
export function subBlockPaths(html: string): string[] {
  return sanityPaths(html).filter((path) => path.includes('.'))
}

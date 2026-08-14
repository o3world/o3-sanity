import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { canvasComponents, canvasSubject, CanvasToolbarView } from '@o3/editor-chrome/canvas'

import { buildSingletonRoute } from '@/lib/content-routes/build'
import { home } from '@/content/documents/page/entry'
import {
  aSeededPage,
  bandPaths,
  renderRoute,
  siteSettings,
  subBlockPaths,
  withSettings,
} from '@/test'

/**
 * The canvas toolbar (#108), from this app's side of the seam.
 *
 * Two things are worth asserting here and nowhere else. The **view** renders
 * through `react-dom/server`, which is the only way this repo's render layer
 * can mount a client component — no DOM, no effects, no Presentation context —
 * so what it proves is what the markup says, not how it behaves under a
 * pointer. And the **wiring**: every element #107 attributes on a real page,
 * fed to the real resolver, has to come back with the enclosing band.
 *
 * What this cannot prove, and no test in this repo can: that the bar appears
 * where it should in a live Presentation session. Docking reads
 * `getBoundingClientRect`, hover survival is the overlay controller's grace
 * period, and both need a browser with a Studio on the other end of the
 * comlink. The geometry itself is pinned in `dock.test.ts`.
 */

const route = buildSingletonRoute(home)

const rendered = await renderRoute(route, {
  data: withSettings(aSeededPage('index'), siteSettings()),
})

/** `sections:abc.panels:p1` → the GROQ form Presentation hands the resolver. */
const toGroq = (attrPath: string) => attrPath.replace(/:([A-Za-z0-9_-]+)/g, '[_key=="$1"]')

describe('what the resolver attaches, and where', () => {
  it('names the enclosing band for every attributed element on a real page', () => {
    const bands = bandPaths(rendered.html).map(toGroq)
    expect(bands.length).toBeGreaterThan(0)

    for (const band of bands) {
      expect(canvasSubject(band)).toEqual({ level: 'band', blockPath: band, nested: false })
    }

    for (const path of subBlockPaths(rendered.html).map(toGroq)) {
      const subject = canvasSubject(path)
      // The cold-start property: each of these resolves on its own path, with
      // no hover on the band first and nothing cached from one.
      expect(subject?.blockPath, path).toBeDefined()
      expect(bands, path).toContain(subject!.blockPath)
    }
  })

  it('calls a keyed item an item and a header a field', () => {
    const paths = subBlockPaths(rendered.html)
    // #107 attributes the header at `.heading`; there is no `header` object in
    // the schema, so the header is a field of its block rather than an item.
    const header = paths.find((path) => path.endsWith('.heading'))
    expect(canvasSubject(toGroq(header!))).toMatchObject({ level: 'field' })

    const panel = paths.find((path) => path.includes('.panels:'))
    expect(canvasSubject(toGroq(panel!))).toMatchObject({
      level: 'item',
      itemPath: toGroq(panel!),
    })
  })

  it('attaches nothing to the sections container or a document field', () => {
    // The container is Presentation's own reorder target and `seo.title` is
    // not on the canvas — neither has a component to name.
    expect(canvasComponents({ node: { path: 'sections' } } as never)).toBeUndefined()
    expect(canvasComponents({ node: { path: 'seo.title' } } as never)).toBeUndefined()
  })

  it('hands the toolbar the subject rather than a component to look up', () => {
    const resolved = canvasComponents({
      node: { path: 'sections[_key=="a"].panels[_key=="p1"].heading' },
    } as never)
    expect(resolved).toMatchObject({
      props: {
        level: 'item',
        blockPath: 'sections[_key=="a"]',
        itemPath: 'sections[_key=="a"].panels[_key=="p1"]',
      },
    })
  })
})

describe('what the two surfaces say', () => {
  const view = (props: Parameters<typeof CanvasToolbarView>[0]) =>
    renderToStaticMarkup(<CanvasToolbarView {...props} />)

  it('names the component on the bar and the item on the chip', () => {
    const html = view({ componentName: 'Rail panels section', subjectName: 'Panel' })
    expect(html).toContain('Rail panels section')
    expect(html).toContain('Panel')
  })

  it('renders no bar until something can name the component', () => {
    // A bar naming nothing is worse than no bar. The chip still gives the
    // editor an anchor while the draft snapshot settles.
    const html = view({ subjectName: 'Panel' })
    expect(html).not.toContain('canvas-toolbar')
    expect(html).toContain('canvas-identity')
  })

  it('renders nothing at all when nothing is known', () => {
    expect(view({})).toBe('')
  })

  it('spaces the bar with padding, never a margin', () => {
    // The overlay drops the hover the moment the pointer crosses ground that
    // is not chrome, so a margin below the bar is a strip the pointer cannot
    // survive on its way down to the band.
    const html = view({ componentName: 'Hero section' })
    expect(html).toContain('pb-1')
    expect(html).not.toContain('mb-1')
  })

  it('leaves the chip inert so it cannot swallow a click on what it names', () => {
    const html = view({ componentName: 'Hero section', subjectName: 'Heading' })
    expect(html).toContain('pointer-events-none')
    // The bar is the half that takes the pointer — #109 puts knobs on it.
    expect(html).toContain('pointer-events-auto')
  })

  it('pins the chip at the hovered element’s own corner by default', () => {
    // Its class position IS the overlay wrapper's corner, which is the right
    // answer whenever the item it wants is not attributed in this subtree.
    const html = view({ subjectName: 'Heading' })
    expect(html).toContain('right-0')
    expect(html).toContain('top-0')
  })
})

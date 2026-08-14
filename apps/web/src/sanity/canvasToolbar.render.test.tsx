import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  barKnobs,
  blockKnobReader,
  canvasSubject,
  CanvasToolbarView,
  createCanvasComponents,
  KnobControl,
} from '@o3/editor-chrome/canvas'
import { BLOCK_KNOBS, heroSectionKnobs } from '@o3/sanity/knobs'

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

/** The site's own resolver, wired the way `VisualEditing.tsx` wires it. */
const canvasComponents = createCanvasComponents({ blockKnobs: BLOCK_KNOBS })

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

  it('carries the site’s knob declarations across the seam', () => {
    // The overlay package knows the vocabulary and none of our blocks
    // (ADR 0020), so the registry travels on the props. The resolver cannot do
    // the lookup itself — the block's `_type` comes from the draft snapshot.
    const resolved = canvasComponents({ node: { path: 'sections[_key=="a"]' } } as never) as {
      props: { blockKnobs: Record<string, unknown> }
    }
    expect(resolved.props.blockKnobs).toBe(BLOCK_KNOBS)
    expect(resolved.props.blockKnobs.heroSection).toBeDefined()
  })
})

describe('what the hero offers on the bar', () => {
  /** A hero block in a page's `sections`, as the mutator's draft snapshot has it. */
  const heroAt = (hero: Record<string, unknown>) => ({
    sections: [{ _key: 'h', _type: 'heroSection', ...hero }],
  })

  const heroKnobs = (hero: Record<string, unknown>, nested = false) =>
    barKnobs({
      spec: heroSectionKnobs,
      read: blockKnobReader(heroAt(hero), 'sections[_key=="h"]'),
      nested,
    })

  it('shows Surface and Composition, and leaves Decoration to the menu', () => {
    // Not a table in the app: `bar: true` on the declaration is the whole rule
    // (ADR 0020), and `decoration` does not declare it.
    expect(heroKnobs({ variant: 'band' }).map((resolved) => resolved.knob.title)).toEqual([
      'Surface',
      'Composition',
    ])
  })

  it('names the stored option, and the default’s own title when nothing is stored', () => {
    const chosen = heroKnobs({ variant: 'band' }).find((r) => r.knob.name === 'variant')
    expect(chosen!.current).toEqual({ value: 'band', title: 'Band', isDefault: false })

    // Unset and explicitly-default draw the same page, so the title is the
    // same — `isDefault` is the only thing that says the value is inherited.
    const inherited = heroKnobs({}).find((r) => r.knob.name === 'variant')
    expect(inherited!.current).toEqual({ value: 'orbital', title: 'Orbital', isDefault: true })
  })

  it('renders one control per bar knob, on the bar, beside the component name', () => {
    const html = renderToStaticMarkup(
      <CanvasToolbarView componentName="Hero section" knobs={heroKnobs({ variant: 'band' })} />,
    )
    expect(html.match(/data-testid="canvas-knob"/g)).toHaveLength(2)
    expect(html).toContain('Hero section')
    expect(html).toContain('Composition')
    expect(html).toContain('Band')
    expect(html).not.toContain('Decoration')
  })

  it('marks an inherited value on the trigger rather than hiding it', () => {
    const html = renderToStaticMarkup(
      <CanvasToolbarView componentName="Hero section" knobs={heroKnobs({})} />,
    )
    expect(html).toContain('Orbital')
    expect(html).toContain('(inherited)')
  })

  it('renders no bar knobs for a block with no declaration yet', () => {
    // ADR 0020 is a migration: a block absent from the registry declares its
    // design options as plain fields, and the bar is silent about them rather
    // than claiming the block has none.
    const html = renderToStaticMarkup(<CanvasToolbarView componentName="Media section" />)
    expect(html).toContain('Media section')
    expect(html).not.toContain('data-testid="canvas-knob"')
  })
})

describe('what one knob’s menu says', () => {
  const variant = () =>
    barKnobs({
      spec: heroSectionKnobs,
      read: blockKnobReader(
        { sections: [{ _key: 'h', _type: 'heroSection', variant: 'band' }] },
        'sections[_key=="h"]',
      ),
      nested: false,
    }).find((resolved) => resolved.knob.name === 'variant')!

  const menu = (open: boolean) =>
    renderToStaticMarkup(
      <KnobControl knob={variant()} open={open} onToggle={() => {}} onPick={() => {}} />,
    )

  it('offers every declared option, and only those', () => {
    const html = menu(true)
    expect(html).toContain('Orbital')
    expect(html).toContain('Band')
    expect(html.match(/role="menuitemradio"/g)).toHaveLength(2)
  })

  it('checks the option the trigger names — one resolution, every surface', () => {
    // The trigger label and the check mark both read `resolveKnobValue`, which
    // is what stops them from disagreeing about what is set.
    const html = menu(true)
    expect(html).toContain('aria-checked="true"')
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1)
    expect(html).toContain('✓')
  })

  it('tags the declared default, so an editor can tell it from a choice', () => {
    expect(menu(true)).toContain('default')
  })

  it('stays closed until it is opened', () => {
    expect(menu(false)).not.toContain('role="menu"')
  })

  it('opens with padding and to the right, where the bar is docked', () => {
    // A margin below the trigger is dead ground the pointer cannot cross, and
    // a left-aligned menu on a bar docked at the band's right corner opens
    // past the edge of the preview — both drop the overlay hover mid-reach.
    const html = menu(true)
    expect(html).toContain('pt-1')
    expect(html).not.toContain('mt-1')
    expect(html).toContain('right-0')
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

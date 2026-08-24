import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  barKnobs,
  blockKnobReader,
  canvasSubject,
  CanvasToolbarView,
  createCanvasComponents,
  KnobControl,
  KnobMenu,
  knobMenuModel,
} from '@o3/editor-chrome/canvas'
import {
  BLOCK_KNOBS,
  buttonKnobs,
  heroSectionKnobs,
  railPanelsSectionKnobs,
} from '@o3/sanity/knobs'
import { BUTTON_ICONS } from '@o3/ui'
import { blockArraysFor, sectionBlocksFor } from '@o3/sanity/schemas/registry'

import { buildSingletonRoute } from '@o3/content-runtime/routes'
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

/** This app's roster, taken the way `VisualEditing.tsx` takes it. */
const blockArrays = blockArraysFor('o3')

/** The site's own resolver, wired the way `VisualEditing.tsx` wires it. */
const canvasComponents = createCanvasComponents({
  blockKnobs: BLOCK_KNOBS,
  blockArrays,
})

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

  it('carries the site’s array declarations across the same seam (#112)', () => {
    // What an array accepts is a schema fact, and the overlay knows no schema.
    // Same argument as the knobs beside it: the site hands it in.
    const resolved = canvasComponents({ node: { path: 'sections[_key=="a"]' } } as never) as {
      props: { blockArrays: Record<string, readonly string[]> }
    }
    expect(resolved.props.blockArrays).toBe(blockArrays)
    // O3'S ROSTER, not every registered block. The section tier is a core list
    // plus per-brand extensions (ADR 0028), and this app's canvas offers the
    // blocks this app can render — o3xo's `faqSection` is not among them.
    expect(resolved.props.blockArrays['page.sections']).toEqual([...sectionBlocksFor('o3')])
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

  it('shows Composition, and leaves Decoration to the menu', () => {
    // Not a table in the app: `bar: true` on the declaration is the whole rule
    // (ADR 0020), and `decoration` does not declare it.
    //
    // No Surface either, and that is the second half of the same rule: the
    // orbital band paints its own ink, so the hero declares
    // `paintsOwnSurface` and offers no knob for a control to draw.
    expect(heroKnobs({ variant: 'band' }).map((resolved) => resolved.knob.title)).toEqual([
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
    expect(html.match(/data-testid="canvas-knob"/g)).toHaveLength(1)
    expect(html).toContain('Hero section')
    expect(html).toContain('Composition')
    expect(html).toContain('Band')
    expect(html).not.toContain('Decoration')
    expect(html).not.toContain('Surface')
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

/**
 * THE KNOB MENU (#110) — the right-click surface, against the real declarations.
 *
 * Rows are located by ROLE and not by markup: an option is a `menuitemradio`
 * (one member of a closed set, the same role the bar's dropdown uses) and an
 * action is a `menuitem`. `role="menuitem"` with its closing quote cannot match
 * inside `role="menuitemradio"`, so the two counts stay honest.
 */
const rolesIn = (html: string, role: string) => html.match(new RegExp(`role="${role}"`, 'g')) ?? []

describe('what the knob menu carries that the bar does not', () => {
  const blockPath = 'sections[_key=="h"]'
  const snapshot = (type: string, block: Record<string, unknown>) => ({
    sections: [{ _key: 'h', _type: type, ...block }],
  })

  const menuFor = (
    spec: typeof heroSectionKnobs,
    block: Record<string, unknown>,
    subject: Parameters<typeof knobMenuModel>[0]['subject'],
    componentName: string,
  ) =>
    knobMenuModel({
      spec,
      read: blockKnobReader(snapshot(spec.type, block), blockPath),
      nested: false,
      subject,
      componentName,
    })

  const render = (model: ReturnType<typeof knobMenuModel>) =>
    renderToStaticMarkup(<KnobMenu model={model} onPick={() => {}} onAction={() => {}} />)

  it('reaches Decoration, which rides no bar and was reachable from nowhere', () => {
    // The live example the split exists for: `heroSection.decoration` resolves
    // and applies and declares no `bar`. Not a table in the app — `bar: true`
    // on the declaration is still the whole rule (ADR 0020).
    const bar = barKnobs({
      spec: heroSectionKnobs,
      read: blockKnobReader(snapshot('heroSection', { variant: 'band' }), blockPath),
      nested: false,
    }).map((resolved) => resolved.knob.title)
    expect(bar).toEqual(['Composition'])

    const html = render(
      menuFor(
        heroSectionKnobs,
        { variant: 'band' },
        { kind: 'block', title: 'Hero section' },
        'Hero section',
      ),
    )
    expect(html).toContain('Decoration')
    expect(html).toContain('Composition')
    // And nothing for a surface the block does not offer.
    expect(html).not.toContain('Surface')
  })

  it('offers every option of every knob the hero declares, and nothing else', () => {
    const html = render(
      menuFor(
        heroSectionKnobs,
        { variant: 'band' },
        { kind: 'block', title: 'Hero section' },
        'Hero section',
      ),
    )
    // orbital|band + orbs|none + white|bone|ink.
    const declared = heroSectionKnobs.knobs.reduce((n, knob) => n + knob.options.length, 0)
    expect(rolesIn(html, 'menuitemradio')).toHaveLength(declared)
    // One resolution per knob, so exactly one row per knob is checked.
    expect(rolesIn(html, 'menuitemradio').length).toBeGreaterThan(0)
    expect(html.match(/aria-checked="true"/g)).toHaveLength(heroSectionKnobs.knobs.length)
  })

  it('puts the jump last, after every knob row', () => {
    const html = render(
      menuFor(heroSectionKnobs, {}, { kind: 'block', title: 'Hero section' }, 'Hero section'),
    )
    expect(rolesIn(html, 'menuitem')).toHaveLength(1)
    expect(html).toContain('open form')
    expect(html.lastIndexOf('role="menuitemradio"')).toBeLessThan(html.indexOf('role="menuitem"'))
  })

  it('titles each group with the container it configures, so no group lies', () => {
    // A block knob shown under a menu headed "Panel" would claim the panel is
    // what it changes. The group heading is what keeps that honest.
    const html = render(
      menuFor(
        railPanelsSectionKnobs,
        { layout: 'rail' },
        { kind: 'item', title: 'Panel' },
        'Rail panels section',
      ),
    )
    expect(html).toContain('aria-label="Band"')
    expect(html).toContain('aria-label="Rail panels section"')
    // Layout and Rail ride no bar either — right-clicking a panel is the only
    // place in the product they can be reached.
    expect(html).toContain('Layout')
    expect(html).toContain('Rail')
  })

  it('drops a gated knob exactly where the form drops it', () => {
    // `rail` is `notOneOf: ['cards', 'rows', 'grid']` — the layouts that draw
    // no rail. The menu asks `visibleKnobs`, which is the same declaration the
    // Studio field's predicate is generated from.
    const at = (layout: string) =>
      render(
        menuFor(
          railPanelsSectionKnobs,
          { layout },
          { kind: 'block', title: 'Rail panels section' },
          'Rail panels section',
        ),
      )
    // Surface (3) + Layout (4) + Rail (2) on the rail layout; Rail's two rows
    // are gone on the other three. Counted by role rather than matched by
    // label, because "Rail" is also one of Layout's own option titles.
    expect(rolesIn(at('rail'), 'menuitemradio')).toHaveLength(9)
    expect(rolesIn(at('cards'), 'menuitemradio')).toHaveLength(7)
    expect(rolesIn(at('rows'), 'menuitemradio')).toHaveLength(7)
    expect(rolesIn(at('grid'), 'menuitemradio')).toHaveLength(7)
  })

  it('marks the inherited value for a screen reader, not only for an eye', () => {
    const html = render(
      menuFor(heroSectionKnobs, {}, { kind: 'block', title: 'Hero section' }, 'Hero section'),
    )
    expect(html).toContain('(inherited)')
    expect(html).toContain('default')
  })

  it('marks itself as chrome, so a pointerdown inside it is not outside', () => {
    const html = render(
      menuFor(heroSectionKnobs, {}, { kind: 'block', title: 'Hero section' }, 'Hero section'),
    )
    expect(html).toContain('data-canvas-chrome')
  })
})

/**
 * ITEM ACTIONS (#111) — Duplicate, Remove and Move, back after #110 preempted
 * the stock menu that used to carry them.
 *
 * Located by ROLE like every other row: an action is a `menuitem`, the same
 * role the jump uses, because both are a single command rather than one member
 * of a closed set. What separates them in a test is the testid, and what
 * separates them on screen is that the jump is always last.
 */
describe('what the knob menu can do to the subject', () => {
  /** A page as the mutator's draft snapshot has it: three sections, three panels. */
  const draft = {
    sections: [
      { _key: 'h', _type: 'heroSection', variant: 'band' },
      {
        _key: 'r',
        _type: 'railPanelsSection',
        layout: 'rail',
        panels: [
          { _key: 'p1', _type: 'panel' },
          { _key: 'p2', _type: 'panel' },
          { _key: 'p3', _type: 'panel' },
        ],
      },
      { _key: 'm', _type: 'mediaSection' },
    ],
  }

  const render = (subjectPath: string, subject: Parameters<typeof knobMenuModel>[0]['subject']) =>
    renderToStaticMarkup(
      <KnobMenu
        model={knobMenuModel({
          spec: railPanelsSectionKnobs,
          read: blockKnobReader(draft, 'sections[_key=="r"]'),
          nested: false,
          subject,
          componentName: 'Rail panels section',
          snapshot: draft,
          subjectPath,
        })}
        onPick={() => {}}
        onAction={() => {}}
        onItemAction={() => {}}
      />,
    )

  const panel = () =>
    render('sections[_key=="r"].panels[_key=="p2"]', { kind: 'item', title: 'Panel' })

  it('offers duplicate, remove and every move that moves something', () => {
    const html = panel()
    expect(html).toContain('Duplicate')
    expect(html).toContain('Remove')
    // A middle panel can go all four ways.
    for (const label of ['To top', 'Up', 'Down', 'To bottom']) {
      expect(html, label).toContain(`>${label}</button>`)
    }
    // Six rows plus the jump, and not one `menuitemradio` among them.
    expect(html.match(/data-testid="canvas-menu-item-action"/g)).toHaveLength(6)
    expect(rolesIn(html, 'menuitem')).toHaveLength(7)
  })

  it('keeps the jump last, after the actions as well as after the knobs', () => {
    const html = panel()
    expect(html.lastIndexOf('data-testid="canvas-menu-item-action"')).toBeLessThan(
      html.indexOf('data-testid="canvas-menu-action"'),
    )
    expect(html.lastIndexOf('role="menuitemradio"')).toBeLessThan(
      html.indexOf('data-testid="canvas-menu-item-action"'),
    )
  })

  it('drops the move rows that would move nothing', () => {
    // The no-dead-control rule, at the two ends of the array. `>Up<` and not
    // `Up`, because "Up" is a substring of nothing here but "To top" is a
    // substring of the group heading's own words in other layouts.
    const first = render('sections[_key=="r"].panels[_key=="p1"]', { kind: 'item', title: 'Panel' })
    expect(first).not.toContain('>To top</button>')
    expect(first).not.toContain('>Up</button>')
    expect(first).toContain('>Down</button>')

    const last = render('sections[_key=="r"].panels[_key=="p3"]', { kind: 'item', title: 'Panel' })
    expect(last).toContain('>Up</button>')
    expect(last).not.toContain('>Down</button>')
    expect(last).not.toContain('>To bottom</button>')
  })

  it('names the untitled group for a screen reader, and titles Move for an eye', () => {
    // Duplicate and Remove carry no visible heading — the menu header one line
    // above already names what Remove would remove — so the label is the only
    // thing that says it aloud.
    const html = panel()
    expect(html).toContain('aria-label="Panel"')
    expect(html).toContain('aria-label="Move"')
    expect(html).toContain('>Move</div>')
  })

  it('acts on the block when the block is the subject', () => {
    // One subject rule, both levels. A section in `page.sections` is a keyed
    // array member exactly the way a panel is.
    const html = render('sections[_key=="r"]', { kind: 'block', title: 'Rail panels section' })
    expect(html).toContain('Duplicate')
    // The rail section is in the middle of three, so it can go all four ways.
    expect(html.match(/data-testid="canvas-menu-item-action"/g)).toHaveLength(6)
  })

  it('offers no actions at all while the draft snapshot has not settled', () => {
    // The frame between the first hover and the snapshot arriving. The knobs
    // and the jump still render; a row that would patch nothing does not.
    const html = renderToStaticMarkup(
      <KnobMenu
        model={knobMenuModel({
          spec: heroSectionKnobs,
          read: () => undefined,
          nested: false,
          subject: { kind: 'block', title: 'Hero section' },
          componentName: 'Hero section',
          snapshot: undefined,
          subjectPath: 'sections[_key=="h"]',
        })}
        onPick={() => {}}
        onAction={() => {}}
      />,
    )
    expect(html).not.toContain('data-testid="canvas-menu-item-action"')
    expect(rolesIn(html, 'menuitem')).toHaveLength(1)
    expect(html).toContain('open form')
  })
})

describe('at most one menu open, and none until asked', () => {
  it('renders no knob menu until a right-click opens one', () => {
    // The view is mounted through `react-dom/server`, which runs no effects —
    // so this is the closed state by construction, which is also the state
    // every first render is in.
    const html = renderToStaticMarkup(
      <CanvasToolbarView
        componentName="Hero section"
        menu={knobMenuModel({
          spec: heroSectionKnobs,
          read: () => undefined,
          nested: false,
          subject: { kind: 'block', title: 'Hero section' },
          componentName: 'Hero section',
        })}
      />,
    )
    expect(html).not.toContain('data-testid="canvas-menu"')
  })

  it('marks the bar as chrome too, so a click on a trigger cannot dismiss its own menu', () => {
    // The exemption sits on the BAR rather than on each trigger: one mark
    // covers every opener and every dropdown it holds.
    const html = renderToStaticMarkup(<CanvasToolbarView componentName="Hero section" />)
    expect(html).toContain('data-canvas-chrome')
  })
})

/**
 * THE INSERT MENU (#112) — "add a section above this one", against the real
 * schema's real member list.
 *
 * The claim under test is the derived one. `blockArrays['page.sections']` is
 * this brand's roster, the schema's own `of:` is built from the same entry, and
 * every block declares a placeholder — so the rows the menu draws and the
 * members the form offers are the same set by construction, and the assertions
 * below compare the menu against the registry rather than against a list
 * written here.
 */
describe('what the knob menu can add beside the subject', () => {
  const draft = {
    _type: 'page',
    sections: [
      { _key: 'h', _type: 'heroSection', variant: 'band' },
      { _key: 'm', _type: 'mediaSection' },
    ],
  }

  const model = (subjectPath: string, members: readonly string[] | undefined) =>
    knobMenuModel({
      spec: heroSectionKnobs,
      read: blockKnobReader(draft, 'sections[_key=="h"]'),
      nested: false,
      subject: { kind: 'block', title: 'Hero section' },
      componentName: 'Hero section',
      snapshot: draft,
      subjectPath,
      ...(members ? { insert: { members, specs: BLOCK_KNOBS } } : {}),
    })

  const render = (subjectPath: string, members: readonly string[] | undefined) =>
    renderToStaticMarkup(
      <KnobMenu
        model={model(subjectPath, members)}
        onPick={() => {}}
        onAction={() => {}}
        onItemAction={() => {}}
      />,
    )

  const hero = () => render('sections[_key=="h"]', blockArrays['page.sections'])

  it('offers every section block the page array accepts, above and below', () => {
    const html = hero()
    expect(html).toContain('>Add above</div>')
    expect(html).toContain('>Add below</div>')

    // Derived, not listed: one row per registered section block, per position.
    // The four beside them are what this hero already had — duplicate, remove,
    // and the two moves a first-of-two section can make.
    const rows = html.match(/data-testid="canvas-menu-item-action"/g) ?? []
    expect(rows).toHaveLength(sectionBlocksFor('o3').length * 2 + 4)
  })

  it('names each row with the block’s own title, not its type', () => {
    const html = hero()
    for (const type of sectionBlocksFor('o3')) {
      expect(html, type).toContain(`>${BLOCK_KNOBS[type]!.title}</button>`)
    }
    expect(html).not.toContain('heroSection<')
  })

  it('offers nothing in an array the site declared nothing for', () => {
    // `railPanelsSection.panels` holds panels, not blocks — there is no entry
    // for it, so the menu says so by having no rows rather than by guessing.
    const html = render('sections[_key=="h"]', undefined)
    expect(html).not.toContain('Add above')
  })

  it('keeps the jump last, after the insert rows as well', () => {
    const html = hero()
    expect(html.lastIndexOf('data-testid="canvas-menu-item-action"')).toBeLessThan(
      html.indexOf('data-testid="canvas-menu-action"'),
    )
  })

  it('inserts a real block with placeholder content, not an empty shell', () => {
    // The definition of done, asserted on the patch the row carries: adding a
    // section above the hero writes a `quoteSection` with the quote its
    // declaration says a new one starts with, and the surface its knob says.
    const groups = model('sections[_key=="h"]', blockArrays['page.sections']).insertActions
    const above = groups.find((group) => group.id === 'insert-before')!
    const quote = above.actions.find((action) => action.id === 'insert-before-quoteSection')!
    const op = quote.patches[0]!.op as { position: string; items: Record<string, unknown>[] }

    expect(quote.patches[0]!.path).toEqual(['sections'])
    expect(op.position).toBe('before')
    expect(op.items[0]).toMatchObject({
      ...BLOCK_KNOBS.quoteSection!.placeholder!,
      surface: 'bone',
    })
    expect(op.items[0]!._key).toMatch(/^[0-9a-f]{12}$/)
  })
})

/**
 * THE ICON PICKER (#151) — an editor choosing an icon has to see the shape,
 * not read its name.
 *
 * The chain under test is the whole of the mechanism: `button.icon` declares
 * `optionPreview: 'glyph'` and option values that are icon NAMES, the site
 * hands `BUTTON_ICONS` to the overlay, and the control resolves one against the
 * other. Nothing in `@o3/block-spec` names a component, which is why this can
 * only be asserted from the app's side of the seam — the same side that owns
 * the drawings.
 */
describe('what the icon picker shows', () => {
  const instance = {
    spec: buttonKnobs,
    read: blockKnobReader({ button: { _type: 'button', label: 'View our work' } }, 'button'),
  }

  const model = knobMenuModel({
    spec: undefined,
    read: () => undefined,
    nested: false,
    instance,
    subject: { kind: 'block', title: 'Button' },
  })

  const render = (glyphs?: Parameters<typeof KnobMenu>[0]['glyphs']) =>
    renderToStaticMarkup(
      <KnobMenu model={model} onPick={() => {}} onAction={() => {}} glyphs={glyphs} />,
    )

  it('draws a glyph for every icon option the site has one for', () => {
    const html = render(BUTTON_ICONS)
    // Three named glyphs; `None` names no drawing, and its row is a title.
    expect(html.match(/<svg/g)).toHaveLength(3)
    expect(html).toContain('None')
  })

  it('draws nothing for a knob that describes no preview', () => {
    // `contrast` sits in the same menu with the same option rows. A control
    // that drew glyphs for it would be resolving something nobody declared.
    expect(render(BUTTON_ICONS)).toContain('Ghost')
    const contrastOnly = knobMenuModel({
      spec: undefined,
      read: () => undefined,
      nested: false,
      instance: {
        spec: { ...buttonKnobs, knobs: buttonKnobs.knobs.filter((k) => k.name === 'contrast') },
        read: instance.read,
      },
      subject: { kind: 'block', title: 'Button' },
    })
    expect(
      renderToStaticMarkup(
        <KnobMenu
          model={contrastOnly}
          onPick={() => {}}
          onAction={() => {}}
          glyphs={BUTTON_ICONS}
        />,
      ),
    ).not.toContain('<svg')
  })

  it('lists the options by title when the site hands in no glyphs at all', () => {
    // The overlay is shareable, and a project that declares knobs and ships no
    // icons is a real configuration rather than a broken one.
    const html = render(undefined)
    expect(html).not.toContain('<svg')
    expect(html).toContain('Arrow')
  })
})

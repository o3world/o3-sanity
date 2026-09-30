import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { defineBlockKnobs, knob } from '@o3/block-spec'

import { barKnobs, blockKnobReader } from './barKnobs'
import { CanvasToolbarView } from './CanvasToolbarView'
import { KnobControl } from './KnobControl'
import { knobMenuModel } from './menuModel'

/**
 * The canvas toolbar's pixels (#108) — the bar, the chip, one knob's dropdown
 * and the closed knob menu — from synthetic props.
 *
 * Rendered through `react-dom/server`, which runs no effects and provides no
 * Presentation context, so what this proves is what the markup says, not how
 * it behaves under a pointer. The site's own declarations on these surfaces
 * are asserted in `apps/web/src/sanity/canvasToolbar.render.test.tsx`.
 */

/** One bar knob with a declared default: the shape a trigger and its dropdown read. */
const hero = defineBlockKnobs({
  type: 'heroSection',
  title: 'Hero',
  tier: 'section',
  knobs: [
    knob({
      name: 'variant',
      title: 'Composition',
      options: ['orbital', 'band'],
      initialValue: 'orbital',
      bar: true,
    }),
  ],
})

describe('what one knob’s menu says', () => {
  const variant = () =>
    barKnobs({
      spec: hero,
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

  it('renders no bar knobs for a block with no declaration yet', () => {
    // ADR 0020 is a migration: a block absent from the registry declares its
    // design options as plain fields, and the bar is silent about them rather
    // than claiming the block has none.
    const html = view({ componentName: 'Media section' })
    expect(html).toContain('Media section')
    expect(html).not.toContain('data-testid="canvas-knob"')
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

describe('at most one menu open, and none until asked', () => {
  it('renders no knob menu until a right-click opens one', () => {
    // The view is mounted through `react-dom/server`, which runs no effects —
    // so this is the closed state by construction, which is also the state
    // every first render is in.
    const html = renderToStaticMarkup(
      <CanvasToolbarView
        componentName="Hero section"
        menu={knobMenuModel({
          spec: hero,
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

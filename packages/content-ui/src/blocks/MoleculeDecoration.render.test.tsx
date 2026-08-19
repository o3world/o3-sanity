import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import type { Surface } from '@o3/sanity/constants'
import { classTokens } from '../testing/responsive'

import { MoleculeDecoration } from './MoleculeDecoration'

/** MoleculeMark's own markup — the one thing that says the glyph is on the page. */
const MARK = 'viewBox="0 0 699 699"'

function render(props: {
  decoration?: string | null
  block?: 'quoteSection' | 'ctaSection'
  surface?: Surface
  className?: string
  visibleFrom?: 'lg' | 'base'
}) {
  return renderToStaticMarkup(
    <MoleculeDecoration decoration="molecule" block="quoteSection" surface="white" {...props} />,
  )
}

describe('the molecule decoration', () => {
  it('draws nothing unless the band asked for it', () => {
    expect(render({ decoration: 'orbs' })).toBe('')
    expect(render({ decoration: 'none' })).toBe('')
    expect(render({ decoration: null })).toBe('')
  })

  /**
   * An unset knob is the BLOCK's declared default, not one shared literal
   * (#163). The quote band declares `orbs` and draws nothing; the CTA band
   * declares `molecule` and draws — from the same absent value.
   */
  it('reads an unset knob as the block’s own default', () => {
    expect(render({ decoration: null, block: 'quoteSection' })).toBe('')
    expect(render({ decoration: null, block: 'ctaSection' })).toContain(MARK)
  })

  it('takes the band’s own ink', () => {
    expect(render({ surface: 'ink' })).toContain('text-white')
    expect(render({ surface: 'white' })).toContain('text-ink')
    expect(render({ surface: 'bone' })).toContain('text-ink')
  })

  it('sits behind the copy and catches nothing', () => {
    const html = render({})
    expect(html).toContain('pointer-events-none')
    expect(html).toContain('-z-10')
    expect(html).toContain('aria-hidden="true"')
  })

  it('is hidden below `lg` by default', () => {
    // `classTokens`, not the raw markup: `aria-hidden` carries the substring
    // `hidden`, so the question cannot be asked of the whole string.
    expect(classTokens(render({}))).toEqual(expect.arrayContaining(['hidden', 'lg:block']))
  })

  it('draws at every width when the band sizes it in its own terms', () => {
    const html = render({ visibleFrom: 'base' })
    expect(html).toContain(MARK)
    expect(classTokens(html)).not.toContain('hidden')
    expect(classTokens(html)).not.toContain('lg:block')
  })

  it('leaves the per-frame offsets to the call site', () => {
    const html = render({ className: 'right-[-203px] top-[181px] w-[699px] opacity-10' })
    expect(html).toContain('right-[-203px]')
    expect(html).toContain('top-[181px]')
    expect(html).toContain('w-[699px]')
    expect(html).toContain('opacity-10')
  })

  it('lets the call site override the tone it resolved', () => {
    // A band painting something the three surfaces do not name spells its own
    // colour. tailwind-merge has to let the later class win, or the seam is a
    // ceiling rather than a floor.
    expect(render({ surface: 'white', className: 'text-white' })).not.toContain('text-ink')
  })
})

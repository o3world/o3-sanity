// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'

import { NAV_INK_FIRST_PAINT_SCRIPT } from './NavInkFirstPaint'

/**
 * The script, run rather than read. It decides the bar's skin before the
 * first paint from the declarations the arriving page carries, and it is a
 * string, so the only way to know what it does is to run it against a page.
 *
 * jsdom has no layout engine, so every box here is scripted: the pill's and
 * each band's.
 */
const run = () => new Function(NAV_INK_FIRST_PAINT_SCRIPT)()

const PILL = { top: 64, bottom: 144, left: 270, right: 1170, width: 900, height: 80 }

let header: HTMLElement
let main: HTMLElement

function band(surface: string, { left = 0, right = 1440 } = {}) {
  const element = document.createElement('section')
  element.dataset.surface = surface
  element.getBoundingClientRect = () => ({ top: 0, bottom: 2000, left, right }) as DOMRect
  main.append(element)
}

beforeEach(() => {
  document.body.innerHTML = ''
  header = document.createElement('header')
  header.id = 'site-nav'
  const pill = document.createElement('nav')
  pill.getBoundingClientRect = () => PILL as DOMRect
  header.append(pill)
  main = document.createElement('main')
  document.body.append(header, main)
})

describe('the bar’s skin on arrival', () => {
  it('keeps the server’s dark skin over an ink opener', () => {
    band('ink')
    run()

    expect(header.dataset.ink).toBeUndefined()
  })

  it('flips before first paint over a light opener', () => {
    band('paper')
    run()

    expect(header.dataset.ink).toBe('dark')
  })

  it('leaves a page that declares nothing to the hit-test', () => {
    run()

    expect(header.dataset.ink).toBeUndefined()
  })

  it('takes the majority of the columns, not the first band it finds', () => {
    // A bone band with three ink cards across most of the pill.
    band('bone')
    band('ink', { left: 176, right: 560 })
    band('ink', { left: 592, right: 976 })
    band('ink', { left: 1008, right: 1392 })
    run()

    expect(header.dataset.ink).toBeUndefined()
  })

  it('does nothing on a page without the bar', () => {
    header.remove()

    expect(run).not.toThrow()
  })
})

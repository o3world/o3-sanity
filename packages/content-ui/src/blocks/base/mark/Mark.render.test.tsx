import { expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { Mark } from './Mark'

it('draws a Dot Circle as server-rendered dots, with no canvas and no script', () => {
  const markup = renderToStaticMarkup(<Mark kind="dotCircle" icon="network" />)
  expect(markup).toContain('data-dot-circle="network"')
  expect(markup.match(/<circle/g)?.length ?? 0).toBeGreaterThan(200)
  expect(markup).not.toContain('<canvas')
  expect(markup).not.toContain('<script')
  expect(markup).not.toContain('<img')
})

it('draws the arrow when a Dot Circle has no icon yet', () => {
  expect(renderToStaticMarkup(<Mark kind="dotCircle" />)).toContain('data-dot-circle="arrow"')
})

it('gives two Dot Circles on one page their own knockout masks', () => {
  const markup = renderToStaticMarkup(
    <>
      <Mark kind="dotCircle" icon="arrow" />
      <Mark kind="dotCircle" icon="heart" />
    </>,
  )
  const ids = [...markup.matchAll(/<mask id="([^"]+)"/g)].map((match) => match[1])
  expect(ids).toHaveLength(2)
  expect(new Set(ids).size).toBe(2)
})

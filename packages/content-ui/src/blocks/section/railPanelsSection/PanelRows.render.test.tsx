import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { PanelRows } from './PanelRows'

const html = renderToStaticMarkup(
  <PanelRows
    items={[
      {
        key: 'migrations',
        heading: 'Migrations',
        body: 'Move to Sanity without the chaos.',
        details: [
          { _key: 'breakdown', label: "Migration targets we've handled:", items: ['Drupal'] },
          { _key: 'promise', label: 'what you get:', items: ['A dataset you can read'] },
        ],
      },
    ]}
  />,
)

/** The opening tag of the `<p>` that carries `text`. Apostrophes render escaped. */
function labelTag(text: string) {
  const index = html.indexOf(text.replaceAll("'", '&#x27;'))
  expect(index, `${text} is not rendered`).toBeGreaterThan(-1)
  const upToLabel = html.slice(0, index)
  return upToLabel.slice(upToLabel.lastIndexOf('<p'))
}

describe('a service row’s detail labels', () => {
  const breakdown = labelTag("Migration targets we've handled:")
  const promise = labelTag('what you get:')

  it('draws the breakdown label in supporting copy', () => {
    expect(breakdown).toContain('text-fg-body')
  })

  it('draws the promise label in brand red', () => {
    expect(promise).toContain('text-brand')
  })

  it('leaves neither label in the muted grey', () => {
    expect(breakdown).not.toContain('text-fg-muted')
    expect(promise).not.toContain('text-fg-muted')
  })
})

it('keeps every detail in the breakdown when the content has no outcome', () => {
  const markup = renderToStaticMarkup(
    <PanelRows
      lastDetailIsOutcome={false}
      items={[
        {
          key: 'engineering',
          details: [
            { label: 'Frontend', items: ['React'] },
            { label: 'Backend', items: ['Node'] },
          ],
        },
      ]}
    />,
  )
  expect(markup).toContain('React')
  expect(markup).toContain('Node')
  expect(markup).not.toContain('text-brand')
})

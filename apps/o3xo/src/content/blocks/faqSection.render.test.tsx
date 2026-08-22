import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { BLOCK_REGISTRY } from './registry'

/**
 * THE FAQ BAND'S CLOSED CONTRACT — the markup a reader who has not touched
 * anything gets, and the one an assistive technology reads (#248).
 *
 * Reached through `BLOCK_REGISTRY` rather than by importing the component,
 * because the claim includes the binding: `faqSection` is on o3xo's half of the
 * section roster and nothing in the shared package knows it exists (ADR 0028).
 *
 * The turn itself — clicking a row open and shut — is the story's `play`
 * (`FaqSection.stories.tsx`). This layer renders on the server, where there is
 * no DOM to click and no state to change.
 */
const Faq = BLOCK_REGISTRY.faqSection

const html = () =>
  renderToStaticMarkup(
    <Faq
      heading="AI Implementation FAQ"
      subheading="Quick answers to the questions we hear most."
      surface="ink"
      questions={[
        {
          _key: 'a',
          _type: 'question',
          heading: 'Should we build or buy AI?',
          body: 'It depends.',
        },
        { _key: 'b', _type: 'question', heading: 'How soon will we see results?', body: 'Weeks.' },
      ]}
    />,
  )

describe('the FAQ band on o3xo', () => {
  it('gives every question a button that says whether it is open', () => {
    const markup = html()
    expect(markup.match(/<button type="button" aria-expanded="false"/g)).toHaveLength(2)
  })

  it('points each button at the panel it opens', () => {
    const markup = html()
    const controls = [...markup.matchAll(/aria-controls="([^"]+)"/g)].map((match) => match[1])
    expect(controls).toHaveLength(2)
    // Distinct, so opening one row cannot address another's answer.
    expect(new Set(controls).size).toBe(2)
    for (const id of controls) expect(markup).toContain(`id="${id}" hidden`)
  })

  it('starts every row closed, with its answer in the markup and out of the page', () => {
    // The kit draws the band closed and nothing else, so this is the whole
    // drawn state. `hidden` rather than unmounted: the answer is in the
    // document for a reader who searches the page.
    const markup = html()
    expect(markup).toContain('It depends.')
    expect(markup).not.toContain('aria-expanded="true"')
    expect(markup.match(/ hidden=""/g)).toHaveLength(2)
  })

  it('sits on the picture the band declares', () => {
    const withPicture = renderToStaticMarkup(
      <Faq
        heading="AI Implementation FAQ"
        surface="ink"
        backgroundMedia={{
          _type: 'backgroundMedia',
          image: { _type: 'image', asset: { _ref: 'image-abc-1440x900-png', _type: 'reference' } },
        }}
        questions={[{ _key: 'a', _type: 'question', heading: 'Why?', body: 'Because.' }]}
      />,
    )
    expect(withPicture).toContain('isolate')
    expect(withPicture).toMatch(/<img[^>]*alt=""/)
  })
})

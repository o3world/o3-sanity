import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { PreviewSwitcher } from './PreviewSwitcher'
import { PreviewSwitcherView } from './PreviewSwitcherView'

/**
 * The preview switcher's states (#60).
 *
 * The shell and the view are rendered separately on purpose: the shell's whole
 * job is to render nothing, and the view is the only part with anything to
 * look at. Between them they cover every state a visitor or an editor can be
 * in — the third, "inside Presentation", is a decision rather than a rendering,
 * and lives in `draftPreview.test.ts` (shouldShowPreviewSwitcher).
 */

const noop = () => {}

describe('the shell an ordinary visitor gets', () => {
  it('renders nothing at all for a published page', () => {
    // No session is known during SSR or on first paint, so there is nothing to
    // hydrate away and nothing that could shift the page.
    expect(renderToStaticMarkup(<PreviewSwitcher isDraft={false} />)).toBe('')
  })

  it('renders nothing on the server even in draft mode', () => {
    // The chip is `ssr: false` — it decides whether it is inside Presentation
    // in the browser, where that question has an answer.
    expect(renderToStaticMarkup(<PreviewSwitcher isDraft />)).toBe('')
  })
})

describe('published mode', () => {
  const html = renderToStaticMarkup(
    <PreviewSwitcherView isDraft={false} returnTo="/work" status="idle" onEnableDrafts={noop} />,
  )

  it('says which mode the page is in', () => {
    expect(html).toContain('Published')
    expect(html).toContain('aria-current="true"')
  })

  it('offers drafts as the one action', () => {
    expect(html).toContain('<button')
    expect(html).toContain('Drafts')
  })

  it('does not link to the disable route — there is nothing to disable', () => {
    expect(html).not.toContain('/api/draft-mode/disable')
  })

  it('is fixed chrome at the nav’s stacking level, so it cannot shift layout', () => {
    expect(html).toContain('fixed')
    expect(html).toContain('z-50')
  })

  it('sits bottom-right, where #60 asked for it', () => {
    expect(html).toContain('bottom-4')
    expect(html).toContain('right-4')
    expect(html).not.toContain('left-4')
  })

  it('names itself for assistive tech without claiming to be site navigation', () => {
    expect(html).toContain('aria-label="Preview mode"')
    expect(html).toContain('<aside')
  })
})

describe('draft mode', () => {
  const html = renderToStaticMarkup(
    <PreviewSwitcherView isDraft returnTo="/insights?page=3" status="idle" onEnableDrafts={noop} />,
  )

  it('says the page is showing drafts', () => {
    expect(html).toContain('Drafts')
    expect(html).toContain('aria-current="true"')
  })

  it('leaves through a plain link, so it works with no JavaScript', () => {
    expect(html).toContain('<a')
    expect(html).toContain('href="/api/draft-mode/disable?to=')
  })

  it('carries the exact URL you were on, query string included', () => {
    expect(html).toContain('to=%2Finsights%3Fpage%3D3')
  })

  it('offers no way to re-enter draft mode it is already in', () => {
    expect(html).not.toContain('<button')
  })
})

describe('a token the server refused', () => {
  const html = renderToStaticMarkup(
    <PreviewSwitcherView isDraft={false} returnTo="/" status="error" onEnableDrafts={noop} />,
  )

  it('says where to fix it rather than failing silently', () => {
    expect(html).toContain('/studio')
    expect(html).toContain('role="status"')
  })

  it('stays in published mode — the client never decides it is in drafts', () => {
    expect(html).toContain('Published')
  })
})

describe('while the token is being verified', () => {
  it('disables the action so a second click cannot race the first', () => {
    const html = renderToStaticMarkup(
      <PreviewSwitcherView isDraft={false} returnTo="/" status="working" onEnableDrafts={noop} />,
    )
    expect(html).toContain('disabled')
  })
})

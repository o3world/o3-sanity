import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { EditorToolbar, EditorToolbarView, presentationHref } from '@o3/editor-chrome/toolbar'

import { editorToolbarConfig } from './editorToolbar'

/**
 * The editor toolbar's states (#60, #99).
 *
 * The shell and the view are rendered separately on purpose: the shell's whole
 * job is to render nothing, and the view is the only part with anything to
 * look at. Between them they cover every state a visitor or an editor can be
 * in — the third, "inside Presentation", is a decision rather than a rendering,
 * and lives in the package's `draftPreview.test.ts` (shouldShowEditorToolbar).
 *
 * It stays in `apps/web` even though the components moved to
 * `@o3/editor-chrome`, because what it is really asserting is that this app's
 * wiring produces a working toolbar — `editorToolbarConfig` included.
 */

const noop = () => {}
const { disablePath, studioUrl } = editorToolbarConfig

function view(props: Partial<Parameters<typeof EditorToolbarView>[0]> = {}) {
  return renderToStaticMarkup(
    <EditorToolbarView
      isDraft={false}
      returnTo="/"
      disablePath={disablePath}
      editHref={presentationHref({ studioUrl, previewPath: '/' })}
      status="idle"
      onEnableDrafts={noop}
      {...props}
    />,
  )
}

describe('the shell an ordinary visitor gets', () => {
  it('renders nothing at all for a published page', () => {
    // No session is known during SSR or on first paint, so there is nothing to
    // hydrate away and nothing that could shift the page.
    expect(
      renderToStaticMarkup(<EditorToolbar isDraft={false} config={editorToolbarConfig} />),
    ).toBe('')
  })

  it('renders nothing on the server even in draft mode', () => {
    // The chip is `ssr: false` — it decides whether it is inside Presentation
    // in the browser, where that question has an answer.
    expect(renderToStaticMarkup(<EditorToolbar isDraft config={editorToolbarConfig} />)).toBe('')
  })
})

describe('published mode', () => {
  const html = view({ returnTo: '/work' })

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

  it('names itself for assistive tech without claiming to be site navigation', () => {
    expect(html).toContain('aria-label="Editor toolbar"')
    expect(html).toContain('<aside')
  })
})

describe('draft mode', () => {
  const html = view({ isDraft: true, returnTo: '/insights?page=3' })

  it('says the page is showing drafts', () => {
    expect(html).toContain('Drafts')
    expect(html).toContain('aria-current="true"')
  })

  it('leaves through a plain link, so it works with no JavaScript', () => {
    expect(html).toContain('<a')
    expect(html).toContain('href="/api/draft-mode/disable?to=')
  })

  it('offers no way to re-enter draft mode it is already in', () => {
    expect(html).not.toContain('<button')
  })
})

/**
 * The half the toolbar grew for (#99): a way into the Studio from the page
 * you are reading, which is the trip editors were making by hand.
 */
describe('the edit affordance', () => {
  it('is offered in draft mode too — the point is the page, not the perspective', () => {
    const html = view({ isDraft: true, returnTo: '/insights', editHref: '/edit/insights' })
    expect(html).toContain('Edit this page')
    expect(html).toContain('href="/edit/insights"')
  })

  it('still points at the Studio when the token was refused', () => {
    // Signing in is exactly what a refused editor needs to do next.
    const html = view({ status: 'error' })
    expect(html).toContain('Edit this page')
    expect(html).toContain('role="status"')
  })
})

describe('a token the server refused', () => {
  const html = view({ status: 'error' })

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
    expect(view({ status: 'working' })).toContain('disabled')
  })
})

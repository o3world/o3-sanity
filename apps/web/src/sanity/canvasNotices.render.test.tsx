import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  canvasNotices,
  CanvasNoticesView,
  createCanvasNoticeQueue,
  reportCanvasFailure,
} from '@o3/editor-chrome/canvas'

/**
 * The canvas notice (#124), from this app's side of the seam.
 *
 * A rejected mutation used to reach `console.error` and nowhere else, which is
 * how "the patch vanished" becomes a support ticket. It now reaches a surface
 * mounted BESIDE `<VisualEditing />` — the mount is the ticket, because an
 * overlay component renders only while its element is hovered and an editor
 * moves the pointer the instant something goes wrong.
 *
 * What this file can prove is the markup and the wiring: what the surface says,
 * what an editor can do to it, and that `reportCanvasFailure` is what fills it.
 * What it cannot prove is the part the mount exists for — that the notice
 * SURVIVES the pointer leaving the element. That needs a live Presentation
 * session, and #121 means there has not been one.
 */

/** A rejection in the shape the mutator actually produces. */
const notFound = new Error('Document "page-index" not found')

const render = (queue: ReturnType<typeof createCanvasNoticeQueue>) =>
  renderToStaticMarkup(<CanvasNoticesView notices={queue.notices()} />)

describe('what an editor sees when the draft refuses an edit', () => {
  // The live region is there from the first render and the notices are not.
  // A screen reader announces a change inside a region it was already
  // watching; a region that arrives carrying its first notice announces
  // nothing, which would make this surface silent for exactly the editor least
  // able to see a red box appear in a corner.
  it('is watching before anything fails, and says nothing yet', () => {
    const html = render(createCanvasNoticeQueue())

    expect(html).toContain('aria-live="polite"')
    expect(html).not.toContain('data-testid="canvas-notice"')
    expect(html).not.toContain('<ul')
  })

  it('names the action, the path and the reason', () => {
    const queue = createCanvasNoticeQueue()
    queue.publish('could not remove sections[_key=="a"]', notFound)

    const html = render(queue)

    // The headline reads as a sentence; the path keeps its own case.
    expect(html).toContain('Could not remove sections[_key==&quot;a&quot;]')
    expect(html).toContain('Document &quot;page-index&quot; not found')
  })

  it('says nothing where the rejection carried no reason', () => {
    const queue = createCanvasNoticeQueue()
    queue.publish('could not duplicate sections[_key=="a"]', { statusCode: 409 })

    const html = render(queue)

    expect(html).toContain('Could not duplicate')
    expect(html).not.toContain('[object Object]')
  })

  it('shows how many times it has happened, and only once it has happened twice', () => {
    const queue = createCanvasNoticeQueue()
    queue.publish('could not remove sections[_key=="a"]', notFound)
    expect(render(queue)).not.toContain('data-testid="canvas-notice-count"')

    queue.publish('could not remove sections[_key=="a"]', notFound)
    const html = render(queue)
    expect(html).toContain('data-testid="canvas-notice-count"')
    expect(html).toContain('×2')
    expect(html).toContain('aria-label="Reported 2 times"')
  })

  it('stacks the newest nearest the corner', () => {
    const queue = createCanvasNoticeQueue()
    queue.publish('could not remove first', notFound)
    queue.publish('could not remove second', notFound)

    const html = render(queue)

    // Anchored bottom-left and rendered in arrival order, so the last row in
    // the markup is the one closest to the corner — and the newest.
    expect(html.match(/data-testid="canvas-notice"/g)).toHaveLength(2)
    expect(html.indexOf('Could not remove first')).toBeLessThan(
      html.indexOf('Could not remove second'),
    )
  })

  it('holds three, then drops the oldest rather than covering the page', () => {
    const queue = createCanvasNoticeQueue()
    for (const what of ['a', 'b', 'c', 'd']) queue.publish(`could not remove ${what}`, notFound)

    const html = render(queue)

    expect(html.match(/data-testid="canvas-notice"/g)).toHaveLength(3)
    expect(html).not.toContain('Could not remove a')
    expect(html).toContain('Could not remove d')
  })
})

describe('how it goes away', () => {
  // It does not time out: a notice that dismisses itself is a notice an editor
  // can miss, and missing it is the bug this ticket exists to end. So every
  // notice carries its own way out.
  it('gives every notice a dismiss control with a name a screen reader can use', () => {
    const queue = createCanvasNoticeQueue()
    queue.publish('could not remove a', notFound)
    queue.publish('could not remove b', notFound)

    const html = render(queue)

    expect(html.match(/aria-label="Dismiss notice"/g)).toHaveLength(2)
  })

  it('offers "Dismiss all" only once there is more than one to dismiss', () => {
    const queue = createCanvasNoticeQueue()
    queue.publish('could not remove a', notFound)
    expect(render(queue)).not.toContain('Dismiss all')

    queue.publish('could not remove b', notFound)
    expect(render(queue)).toContain('Dismiss all')
  })
})

describe('where it sits', () => {
  const html = () => {
    const queue = createCanvasNoticeQueue()
    queue.publish('could not remove a', notFound)
    return render(queue)
  }

  // Bottom right belongs to the editor toolbar, which is on screen in
  // Presentation too; the top corners belong to the canvas toolbar and
  // Presentation's own element tab.
  it('takes the one corner nothing else claims', () => {
    expect(html()).toContain('bottom-4 left-4')
  })

  // `Overlays.tsx:62` paints the visual-editing root at z-index 9999999. A
  // notice under it is a notice an element overlay can cover.
  it('stacks above the visual-editing overlay', () => {
    expect(html()).toContain('z-[10000000]')
  })

  it('announces itself politely rather than interrupting', () => {
    expect(html()).toContain('aria-live="polite"')
    expect(html()).toContain('aria-label="Canvas notices"')
  })
})

describe('the seam the toolbar writes through', () => {
  // `reportCanvasFailure` is the one function every canvas failure passes
  // through (#111 left it as the place to attach this). The chain, end to end:
  // a refused patch → reportCanvasFailure → the queue → these pixels.
  it('puts a refused patch on the surface', () => {
    // The console half of the report is asserted in `draftPatch.test.ts`; here
    // it is only noise on the test output.
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    canvasNotices.clear()

    reportCanvasFailure('could not move sections[_key=="a"]', notFound)
    const html = renderToStaticMarkup(<CanvasNoticesView notices={canvasNotices.notices()} />)

    expect(html).toContain('Could not move sections[_key==&quot;a&quot;]')
    canvasNotices.clear()
    logged.mockRestore()
  })
})

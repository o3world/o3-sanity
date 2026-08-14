import { describe, expect, it, vi } from 'vitest'

import {
  CANVAS_NOTICE_LIMIT,
  createCanvasNoticeQueue,
  failureDetail,
  noticeHeadline,
} from './notices'

/**
 * The notice queue (#124) — every rule the surface has, tested where the rules
 * are rather than through a component nothing in this repo can mount with a
 * store behind it.
 *
 * What these cannot prove is the one thing the ticket is about: that a notice
 * SURVIVES the pointer leaving the element. That is the overlay controller's
 * behaviour in a live Presentation session, and #121 means no session has run
 * yet. What is provable here is the property the survival rests on — the queue
 * is a module, not React state in the toolbar's tree — and that is what every
 * test below is really about.
 */

/** The two shapes a rejected mutation actually arrives in. */
const notFound = new Error('Document "page-index" not found')
const stoppedActor = new Error('Event "mutate" was sent to stopped actor')

describe('failureDetail', () => {
  it('reads the message off an Error', () => {
    expect(failureDetail(notFound)).toBe('Document "page-index" not found')
  })

  it('takes a thrown string as its own reason', () => {
    expect(failureDetail('  Insufficient permissions  ')).toBe('Insufficient permissions')
  })

  // Sanity's mutator rejects with plain objects in places, and a duck-typed
  // read costs nothing next to losing the only sentence an editor gets.
  it('reads a message off a plain object that carries one', () => {
    expect(failureDetail({ message: 'mutation failed', statusCode: 409 })).toBe('mutation failed')
  })

  // The regression this exists for: `String(error)` on an object is "[object
  // Object]", which fills the one line an editor reads with noise AND hides
  // that there was no reason to give.
  it('gives nothing rather than noise for a rejection with no readable reason', () => {
    expect(failureDetail({ statusCode: 409 })).toBeUndefined()
    expect(failureDetail(undefined)).toBeUndefined()
    expect(failureDetail(null)).toBeUndefined()
    expect(failureDetail(409)).toBeUndefined()
    expect(failureDetail({ message: 42 })).toBeUndefined()
    expect(failureDetail('   ')).toBeUndefined()
    expect(failureDetail(new Error(''))).toBeUndefined()
  })
})

describe('noticeHeadline', () => {
  it('turns the console fragment into a sentence', () => {
    expect(noticeHeadline('could not remove sections[_key=="a"]')).toBe(
      'Could not remove sections[_key=="a"]',
    )
  })

  // Only the first character: the rest is a GROQ path and a field name, and
  // both are case-sensitive facts about the document.
  it('leaves the path alone', () => {
    expect(
      noticeHeadline('could not set variant on sections[_key=="aB1"].panels[_key=="cD2"]'),
    ).toBe('Could not set variant on sections[_key=="aB1"].panels[_key=="cD2"]')
  })

  it('survives an empty message', () => {
    expect(noticeHeadline('')).toBe('')
  })
})

describe('the queue', () => {
  it('starts empty', () => {
    expect(createCanvasNoticeQueue().notices()).toEqual([])
  })

  it('carries the action, the path and the reason', () => {
    const queue = createCanvasNoticeQueue()

    queue.publish('could not remove sections[_key=="a"]', notFound)

    expect(queue.notices()).toEqual([
      {
        id: expect.any(String),
        what: 'could not remove sections[_key=="a"]',
        detail: 'Document "page-index" not found',
        count: 1,
      },
    ])
  })

  it('keeps a failure with no readable reason, without inventing one', () => {
    const queue = createCanvasNoticeQueue()

    queue.publish('could not duplicate sections[_key=="a"]', { statusCode: 409 })

    expect(queue.notices()[0]).toMatchObject({ detail: undefined, count: 1 })
  })

  // The order the view reads: it is anchored at a corner and renders in order,
  // so the newest notice lands nearest the corner.
  it('arrives oldest first', () => {
    const queue = createCanvasNoticeQueue()

    queue.publish('could not remove a', notFound)
    queue.publish('could not remove b', notFound)

    expect(queue.notices().map((notice) => notice.what)).toEqual([
      'could not remove a',
      'could not remove b',
    ])
  })

  it('gives every notice its own id, identical messages included', () => {
    const queue = createCanvasNoticeQueue()

    queue.publish('could not remove a', notFound)
    queue.publish('could not remove a', stoppedActor)

    const [first, second] = queue.notices()
    expect(first!.id).not.toBe(second!.id)
  })
})

describe('a repeated failure', () => {
  // An editor clicking Remove three times against a dead mutator has ONE
  // problem, and three identical cards say so three times while pushing
  // everything else off the corner.
  it('counts rather than stacks', () => {
    const queue = createCanvasNoticeQueue()

    queue.publish('could not remove sections[_key=="a"]', stoppedActor)
    queue.publish('could not remove sections[_key=="a"]', stoppedActor)
    queue.publish('could not remove sections[_key=="a"]', stoppedActor)

    expect(queue.notices()).toHaveLength(1)
    expect(queue.notices()[0]).toMatchObject({ count: 3 })
  })

  // A different Error INSTANCE carrying the same message is the same failure:
  // the mutator throws a fresh Error per rejection.
  it('is the same failure when the message matches, instance or not', () => {
    const queue = createCanvasNoticeQueue()

    queue.publish('could not remove a', new Error('Document not found'))
    queue.publish('could not remove a', new Error('Document not found'))

    expect(queue.notices()).toHaveLength(1)
  })

  // Two rejections of the same action for different reasons are two things to
  // know, so identity is the message AND the reason.
  it('is a new notice when the reason changes', () => {
    const queue = createCanvasNoticeQueue()

    queue.publish('could not remove a', notFound)
    queue.publish('could not remove a', stoppedActor)

    expect(queue.notices().map((notice) => notice.detail)).toEqual([
      'Document "page-index" not found',
      'Event "mutate" was sent to stopped actor',
    ])
  })

  // A stack that reorders under a pointer reaching for a dismiss button is a
  // stack that dismisses the wrong thing.
  it('keeps its place rather than jumping to the newest slot', () => {
    const queue = createCanvasNoticeQueue()

    queue.publish('could not remove a', notFound)
    queue.publish('could not remove b', notFound)
    queue.publish('could not remove a', notFound)

    expect(queue.notices().map((notice) => notice.what)).toEqual([
      'could not remove a',
      'could not remove b',
    ])
    expect(queue.notices()[0]).toMatchObject({ count: 2 })
  })

  it('keeps its id, so the row the editor is looking at does not remount', () => {
    const queue = createCanvasNoticeQueue()

    queue.publish('could not remove a', notFound)
    const id = queue.notices()[0]!.id
    queue.publish('could not remove a', notFound)

    expect(queue.notices()[0]!.id).toBe(id)
  })
})

describe('the limit', () => {
  it('holds three', () => {
    expect(CANVAS_NOTICE_LIMIT).toBe(3)
  })

  // The oldest goes, because the newest is the one the editor's last click
  // produced.
  it('drops the oldest rather than covering the page', () => {
    const queue = createCanvasNoticeQueue({ limit: 3 })

    for (const what of ['a', 'b', 'c', 'd']) queue.publish(`could not remove ${what}`, notFound)

    expect(queue.notices().map((notice) => notice.what)).toEqual([
      'could not remove b',
      'could not remove c',
      'could not remove d',
    ])
  })

  // A repeat is not an arrival: three of the same failure must not evict two
  // other outstanding ones.
  it('is not spent by repeats', () => {
    const queue = createCanvasNoticeQueue({ limit: 3 })

    queue.publish('could not remove a', notFound)
    queue.publish('could not remove b', notFound)
    for (let i = 0; i < 5; i += 1) queue.publish('could not remove a', notFound)

    expect(queue.notices().map((notice) => notice.what)).toEqual([
      'could not remove a',
      'could not remove b',
    ])
  })
})

describe('dismissal', () => {
  it('takes one notice and leaves the rest', () => {
    const queue = createCanvasNoticeQueue()
    queue.publish('could not remove a', notFound)
    queue.publish('could not remove b', notFound)

    queue.dismiss(queue.notices()[0]!.id)

    expect(queue.notices().map((notice) => notice.what)).toEqual(['could not remove b'])
  })

  it('takes them all at once', () => {
    const queue = createCanvasNoticeQueue()
    queue.publish('could not remove a', notFound)
    queue.publish('could not remove b', notFound)

    queue.clear()

    expect(queue.notices()).toEqual([])
  })

  // A dismissed failure that happens again is news, not a repeat of something
  // on screen.
  it('lets the same failure return as a new notice', () => {
    const queue = createCanvasNoticeQueue()
    queue.publish('could not remove a', notFound)
    const id = queue.notices()[0]!.id

    queue.dismiss(id)
    queue.publish('could not remove a', notFound)

    expect(queue.notices()).toHaveLength(1)
    expect(queue.notices()[0]).toMatchObject({ count: 1 })
    expect(queue.notices()[0]!.id).not.toBe(id)
  })

  it('ignores an id it does not hold', () => {
    const queue = createCanvasNoticeQueue()
    queue.publish('could not remove a', notFound)

    queue.dismiss('canvas-notice-nope')

    expect(queue.notices()).toHaveLength(1)
  })
})

describe('what a subscriber sees', () => {
  it('is told on every change, and stops being told once it unsubscribes', () => {
    const queue = createCanvasNoticeQueue()
    const listener = vi.fn()
    const unsubscribe = queue.subscribe(listener)

    queue.publish('could not remove a', notFound)
    queue.publish('could not remove a', notFound)
    queue.dismiss(queue.notices()[0]!.id)
    queue.publish('could not remove b', notFound)
    queue.clear()
    expect(listener).toHaveBeenCalledTimes(5)

    unsubscribe()
    queue.publish('could not remove c', notFound)
    expect(listener).toHaveBeenCalledTimes(5)
  })

  // THE INFINITE-RENDER GUARD. `useSyncExternalStore` compares snapshots by
  // reference and re-renders forever when the getter returns a new array every
  // call — including the empty one, which is what a page with nothing wrong
  // reads on every single render.
  it('reads the same snapshot twice when nothing has changed', () => {
    const queue = createCanvasNoticeQueue()
    expect(queue.notices()).toBe(queue.notices())

    queue.publish('could not remove a', notFound)
    expect(queue.notices()).toBe(queue.notices())

    queue.clear()
    expect(queue.notices()).toBe(queue.notices())
  })

  it('is not woken by a dismissal that changes nothing', () => {
    const queue = createCanvasNoticeQueue()
    queue.publish('could not remove a', notFound)
    const listener = vi.fn()
    queue.subscribe(listener)

    queue.dismiss('canvas-notice-nope')
    expect(listener).not.toHaveBeenCalled()

    queue.clear()
    queue.clear()
    expect(listener).toHaveBeenCalledOnce()
  })

  it('survives a listener that unsubscribes itself mid-notification', () => {
    const queue = createCanvasNoticeQueue()
    const second = vi.fn()
    const unsubscribeFirst = queue.subscribe(() => unsubscribeFirst())
    queue.subscribe(second)

    queue.publish('could not remove a', notFound)

    expect(second).toHaveBeenCalledOnce()
  })
})

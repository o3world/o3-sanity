import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { COOKIE_NOTICE_COOKIE, CookieNotice } from './CookieNotice'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function forget() {
  document.cookie = `${COOKIE_NOTICE_COOKIE}=; max-age=0; path=/`
}

/** The notice-only banner the WordPress site shows; it informs and blocks nothing (OWSW-28). */
const meta = {
  title: 'Chrome/CookieNotice',
  component: CookieNotice,
  parameters: { layout: 'fullscreen' },
  beforeEach: () => {
    forget()
    return forget
  },
} satisfies Meta<typeof CookieNotice>

export default meta
type Story = StoryObj<typeof meta>

/** Chromium's `cookieStore` reports `path` and `expires`; the DOM typings only declare the spec's name and value. */
type ChromiumCookie = { value?: string; path?: string; expires?: number | null }

async function expectAcceptedFor30Days() {
  const cookie = (await window.cookieStore.get(COOKIE_NOTICE_COOKIE)) as ChromiumCookie | null
  await expect(cookie?.value).toBe('true')
  await expect(cookie?.path).toBe('/')
  await expect(Math.abs(cookie!.expires! - (Date.now() + THIRTY_DAYS_MS))).toBeLessThan(60_000)
}

export const FirstVisit: Story = {
  play: async ({ canvasElement }) => {
    const notice = await within(canvasElement).findByRole('region', { name: 'Cookie notice' })
    await expect(notice).toHaveTextContent(
      'We use cookies to enhance your experience with our site and to analyze the performance of our marketing efforts.',
    )
    await expect(getComputedStyle(notice).position).toBe('fixed')
    await expect(getComputedStyle(notice).bottom).toBe('0px')

    await userEvent.click(within(notice).getByRole('button', { name: 'Accept' }))
    await waitFor(() => expect(notice).not.toBeInTheDocument())
    await expectAcceptedFor30Days()
  },
}

/** The × accepts too, and is labelled Close. */
export const CloseAccepts: Story = {
  play: async ({ canvasElement }) => {
    const notice = await within(canvasElement).findByRole('region', { name: 'Cookie notice' })
    await userEvent.click(within(notice).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(notice).not.toBeInTheDocument())
    await expectAcceptedFor30Days()
  },
}

export const KeyboardAccept: Story = {
  play: async ({ canvasElement }) => {
    const notice = await within(canvasElement).findByRole('region', { name: 'Cookie notice' })
    await userEvent.tab()
    await expect(within(notice).getByRole('button', { name: 'Accept' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(notice).not.toBeInTheDocument())
    await expectAcceptedFor30Days()
  },
}

/** Accepted here or on the WordPress site — the cookie is the same one — so nothing renders. */
export const AlreadyAccepted: Story = {
  beforeEach: () => {
    document.cookie = `${COOKIE_NOTICE_COOKIE}=true; path=/`
  },
  play: async ({ canvasElement }) => {
    // Give the post-hydration read its chance to (wrongly) show the notice.
    await new Promise((resolve) => setTimeout(resolve, 100))
    await expect(
      within(canvasElement).queryByRole('region', { name: 'Cookie notice' }),
    ).not.toBeInTheDocument()
  },
}

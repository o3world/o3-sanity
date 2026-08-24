import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Embed } from './Embed'

/**
 * A pasted video URL, rendered as a 16:9 iframe.
 *
 * The block's real work is `toEmbedSrc` — a YouTube or Vimeo **page** URL is
 * what an editor actually pastes, and neither is embeddable as-is. The three
 * URL stories below are the shapes that rewrite differs on, so a change to
 * that function shows up here as a black box rather than a video.
 *
 * The iframe's `title` falls back to "Embedded media" when there is no
 * caption. That fallback is an accessibility requirement, not a nicety — an
 * untitled iframe is an axe violation, so `NoCaption` is the story that keeps
 * it honest.
 *
 * These stories hit the network. A blocked or offline run leaves an empty
 * player box, which is fine: what is under test is the frame and the title,
 * not YouTube.
 */
const meta = {
  title: 'Content/Blocks/Base/Embed',
  component: Embed,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Embed>

export default meta
type Story = StoryObj<typeof meta>

/** A `youtube.com/watch?v=` page URL — rewritten to `/embed/<id>`. */
export const YouTube: Story = {
  args: {
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    caption: 'Big Buck Bunny, standing in for a case-study film.',
  },
}

/** The `youtu.be/<id>` short form — the same rewrite by a different path. */
export const YouTubeShortLink: Story = {
  args: { url: 'https://youtu.be/aqz-KE-bpKQ', caption: 'The short-link form.' },
}

/** A Vimeo page URL — rewritten to `player.vimeo.com/video/<id>`. */
export const Vimeo: Story = {
  args: { url: 'https://vimeo.com/76979871', caption: 'Vimeo’s own demo reel.' },
}

/** No caption: the iframe still needs a title, and takes the fallback. */
export const NoCaption: Story = {
  args: { url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' },
}

/**
 * An already-embeddable URL passes straight through — the escape hatch for a
 * provider `toEmbedSrc` has never heard of.
 */
export const PassThrough: Story = {
  args: {
    url: 'https://player.vimeo.com/video/76979871',
    caption: 'Already a player URL; nothing to rewrite.',
  },
}

/** No URL — the block renders nothing rather than an empty 16:9 hole. */
export const NoUrl: Story = {
  args: { url: undefined, caption: 'This caption should not appear.' },
}

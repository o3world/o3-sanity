import { expect, it } from 'vitest'

import { toEmbedSrc } from './embedSrc'

it('rewrites YouTube and Vimeo page URLs to their players and passes the rest through', () => {
  const urls = [
    'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    'https://m.youtube.com/watch?v=aqz-KE-bpKQ',
    'https://youtu.be/aqz-KE-bpKQ',
    'https://vimeo.com/76979871',
    'https://player.vimeo.com/video/76979871',
    'https://www.youtube.com/@blender',
    'https://vimeo.com/channels/staffpicks',
    'not a url',
  ]
  expect(Object.fromEntries(urls.map((url) => [url, toEmbedSrc(url)]))).toEqual({
    'https://www.youtube.com/watch?v=aqz-KE-bpKQ': 'https://www.youtube.com/embed/aqz-KE-bpKQ',
    'https://m.youtube.com/watch?v=aqz-KE-bpKQ': 'https://www.youtube.com/embed/aqz-KE-bpKQ',
    'https://youtu.be/aqz-KE-bpKQ': 'https://www.youtube.com/embed/aqz-KE-bpKQ',
    'https://vimeo.com/76979871': 'https://player.vimeo.com/video/76979871',
    // Already a player URL, and pages with no video id: nothing to rewrite.
    'https://player.vimeo.com/video/76979871': 'https://player.vimeo.com/video/76979871',
    'https://www.youtube.com/@blender': 'https://www.youtube.com/@blender',
    'https://vimeo.com/channels/staffpicks': 'https://vimeo.com/channels/staffpicks',
    'not a url': 'not a url',
  })
})

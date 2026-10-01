import type { MetadataRoute } from 'next'

/**
 * What a phone shows when the site is saved to its home screen. The icons are
 * the file-convention ones beside this file, and black is the chrome every
 * page opens on.
 *
 * The name is a literal rather than Site Settings' title: reading settings
 * reads the draft-mode cookie, which would render this route on demand.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'O3',
    short_name: 'O3',
    start_url: '/',
    display: 'browser',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}

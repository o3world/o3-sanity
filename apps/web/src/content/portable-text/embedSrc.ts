/**
 * Best-effort translation of a pasted video URL into an iframe-embeddable
 * src. YouTube and Vimeo page URLs get rewritten to their player origins;
 * anything else (already-embeddable oEmbed URLs included) passes through.
 */
export function toEmbedSrc(url: string): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      return `https://www.youtube.com/embed${parsed.pathname}`
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = parsed.searchParams.get('v')
      if (id) return `https://www.youtube.com/embed/${id}`
      return url
    }
    if (host === 'vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`
      return url
    }
    return url
  } catch {
    return url
  }
}

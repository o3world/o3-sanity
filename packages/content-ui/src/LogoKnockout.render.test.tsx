import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { LogoKnockout } from './LogoKnockout'

/** A real asset id — `@sanity/image-url` parses the trailing `WxH` and rejects anything looser. */
const LOGO = 'image-1111111111111111111111111111111111111111-1200x297-png'

const aLogo = () => ({
  _type: 'image' as const,
  asset: { _type: 'reference' as const, _ref: LOGO },
})

describe('LogoKnockout', () => {
  /**
   * The bug (#233). The knockout was drawn as a CSS `mask-image` pointing at
   * `cdn.sanity.io`, and a mask image is fetched in CORS mode: Chromium sends
   * an `Origin` header, Sanity's CDN answers 403 for an origin the project has
   * not registered, and the browser fails the request. So the three case-study
   * logos on the homepage were `net::ERR_FAILED` in Storybook on every run,
   * while the same assets in the logo wall — ordinary `<img>` elements, no
   * `Origin` header — returned 200 beside them.
   *
   * An `<img>` cannot be CORS-blocked, so the shape comes from the artwork's
   * own alpha and the white comes from a filter.
   */
  it('fetches the artwork as an image, so no CORS check stands between it and the CDN', () => {
    const html = renderToStaticMarkup(<LogoKnockout source={aLogo()} alt="Ironman" />)
    expect(html).toMatch(/<img[^>]*\ssrc="[^"]*cdn\.sanity\.io[^"]*"/)
    expect(html).not.toMatch(/mask/i)
  })

  it('paints it as one flat white shape, whatever colours the artwork carries', () => {
    const html = renderToStaticMarkup(<LogoKnockout source={aLogo()} alt="Ironman" />)
    expect(html).toContain('brightness-0')
    expect(html).toContain('invert')
  })

  it('asks the CDN for twice the rendered width, so the logo stays sharp', () => {
    const html = renderToStaticMarkup(<LogoKnockout source={aLogo()} alt="" width={185} />)
    expect(html.replace(/&amp;/g, '&')).toContain('w=370')
  })

  it('fits the whole logo in the box, flush left', () => {
    const html = renderToStaticMarkup(<LogoKnockout source={aLogo()} alt="" />)
    expect(html).toContain('object-contain')
    expect(html).toContain('object-left')
  })

  it('names the client for a screen reader, and is silent when it has no name to give', () => {
    expect(renderToStaticMarkup(<LogoKnockout source={aLogo()} alt="Ironman" />)).toContain(
      'alt="Ironman"',
    )
    expect(renderToStaticMarkup(<LogoKnockout source={aLogo()} alt="" />)).toContain('alt=""')
  })

  it('puts the caller’s className on the box, where the drop shadow belongs', () => {
    const html = renderToStaticMarkup(
      <LogoKnockout source={aLogo()} alt="" className="drop-shadow-md" />,
    )
    expect(/<span[^>]*drop-shadow-md/.test(html)).toBe(true)
  })

  it('renders nothing for an empty field, and nothing for a non-image asset', () => {
    expect(renderToStaticMarkup(<LogoKnockout source={null} alt="" />)).toBe('')
    expect(renderToStaticMarkup(<LogoKnockout source={{ asset: undefined }} alt="" />)).toBe('')
    const file = {
      _type: 'image' as const,
      asset: { _type: 'reference' as const, _ref: 'file-9c8ea5c5347c47f89d4e15d97281277-webp' },
    }
    expect(() => renderToStaticMarkup(<LogoKnockout source={file} alt="" />)).not.toThrow()
    expect(renderToStaticMarkup(<LogoKnockout source={file} alt="" />)).toBe('')
  })
})

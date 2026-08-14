import { describe, expect, it } from 'vitest'

import { DEFAULT_PRESENTATION_TOOL_NAME, presentationHref, safeReturnPath } from './paths'

describe('safeReturnPath', () => {
  it('keeps a same-origin path, query and all', () => {
    expect(safeReturnPath('/insights?page=3')).toBe('/insights?page=3')
    expect(safeReturnPath('/')).toBe('/')
  })

  it('refuses anything a browser would resolve off-origin', () => {
    expect(safeReturnPath('//evil.example')).toBe('/')
    expect(safeReturnPath('/\\evil.example')).toBe('/')
    expect(safeReturnPath('https://evil.example')).toBe('/')
    expect(safeReturnPath('javascript:alert(1)')).toBe('/')
    expect(safeReturnPath('insights')).toBe('/')
  })

  it('refuses header smuggling and missing input', () => {
    expect(safeReturnPath('/ok\r\nSet-Cookie: a=b')).toBe('/')
    expect(safeReturnPath(null)).toBe('/')
    expect(safeReturnPath(undefined)).toBe('/')
  })
})

describe('presentationHref', () => {
  it('opens the presentation tool on a given page', () => {
    expect(presentationHref({ studioUrl: '/studio', previewPath: '/work/acme' })).toBe(
      '/studio/presentation?preview=%2Fwork%2Facme',
    )
  })

  it('names the tool from its route name, which a Studio may rename', () => {
    expect(presentationHref({ studioUrl: '/studio', previewPath: '/', toolName: 'preview' })).toBe(
      '/studio/preview?preview=%2F',
    )
    expect(DEFAULT_PRESENTATION_TOOL_NAME).toBe('presentation')
  })

  it('carries the query string, because ?page=3 is part of where the editor was', () => {
    expect(presentationHref({ studioUrl: '/studio', previewPath: '/insights?page=3' })).toBe(
      '/studio/presentation?preview=%2Finsights%3Fpage%3D3',
    )
  })

  it('does not double the slash when the studio url carries one', () => {
    expect(presentationHref({ studioUrl: '/studio/', previewPath: '/' })).toBe(
      '/studio/presentation?preview=%2F',
    )
  })

  it('sanitises the preview path, so the link cannot point off-origin', () => {
    expect(presentationHref({ studioUrl: '/studio', previewPath: '//evil.example' })).toBe(
      '/studio/presentation?preview=%2F',
    )
  })
})

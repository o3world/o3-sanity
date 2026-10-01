import { describe, expect, it } from 'vitest'

import { gtmContainerFor } from './gtmContainer'

describe('gtmContainerFor', () => {
  it('loads the configured container for a published visitor', () => {
    expect(gtmContainerFor({ isDraft: false, gtmId: 'GTM-NVZN5M' })).toBe('GTM-NVZN5M')
  })

  it('loads nothing in draft mode, where Presentation previews the live site', () => {
    expect(gtmContainerFor({ isDraft: true, gtmId: 'GTM-NVZN5M' })).toBeUndefined()
  })

  it('loads nothing where no container is configured', () => {
    expect(gtmContainerFor({ isDraft: false, gtmId: undefined })).toBeUndefined()
  })
})

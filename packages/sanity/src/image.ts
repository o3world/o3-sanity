import createImageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'
import { clientConfig } from './client'

const builder = createImageUrlBuilder({
  projectId: clientConfig.projectId,
  dataset: clientConfig.dataset,
})

export function urlForImage(source: SanityImageSource) {
  return builder.image(source).auto('format').fit('max')
}

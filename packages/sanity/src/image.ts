import createImageUrlBuilder from '@sanity/image-url'
import { clientConfig } from './client'

export type SanityImageSource = Parameters<ReturnType<typeof createImageUrlBuilder>['image']>[0]

const builder = createImageUrlBuilder({
  projectId: clientConfig.projectId,
  dataset: clientConfig.dataset,
})

export function urlForImage(source: SanityImageSource) {
  return builder.image(source).auto('format').fit('max')
}

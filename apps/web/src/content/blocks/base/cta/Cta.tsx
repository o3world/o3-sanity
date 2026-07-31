import { CtaLink } from '@/content/CtaLink'
import type { BaseProps } from '@/content/blocks/sectionTypes'

type CtaProps = BaseProps<'cta'>

/**
 * Base block: the shared `cta` object placed directly in a layoutSection
 * column. The block's fields ARE the cta fields, so it forwards itself.
 */
export function Cta(props: CtaProps) {
  return <CtaLink cta={props} />
}

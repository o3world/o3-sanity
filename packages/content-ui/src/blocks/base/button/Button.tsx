import type { BaseProps } from '@o3/content-runtime/blocks'

import { ButtonLink } from '../../../ButtonLink'

type ButtonProps = BaseProps<'button'>

/**
 * Base block: the shared `button` object placed directly in a layoutSection
 * column. The block's fields ARE the button fields, so it forwards itself.
 */
export function Button(props: ButtonProps) {
  return <ButtonLink button={props} />
}

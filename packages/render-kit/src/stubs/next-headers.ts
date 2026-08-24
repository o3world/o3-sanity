/**
 * Stands in for `next/headers` in the `render` test layer. `draftMode()` is
 * what `Blocks` reads to choose the server renderer or the Presentation
 * client renderer, so a test can exercise either path by flipping this.
 */
let draftEnabled = false

export function __setDraftMode(enabled: boolean): void {
  draftEnabled = enabled
}

export async function draftMode(): Promise<{
  isEnabled: boolean
  enable: () => void
  disable: () => void
}> {
  return { isEnabled: draftEnabled, enable: () => {}, disable: () => {} }
}

export async function headers(): Promise<Headers> {
  return new Headers()
}

export async function cookies(): Promise<{ get: () => undefined; getAll: () => never[] }> {
  return { get: () => undefined, getAll: () => [] }
}

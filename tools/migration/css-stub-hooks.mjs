/** The load hook `css-stub-loader.mjs` registers — see that file's comment. */
import { URL } from 'node:url'

export async function load(url, context, nextLoad) {
  if (new URL(url).pathname.endsWith('.css')) {
    return { format: 'module', source: 'export default {}', shortCircuit: true }
  }
  return nextLoad(url, context)
}

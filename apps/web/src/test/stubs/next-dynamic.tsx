import { lazy, type ComponentType } from 'react'

/**
 * Stands in for `next/dynamic` in the `render` test layer.
 *
 * The document view registry loads each View through `next/dynamic` so it
 * stays out of the bundle until a route renders it. Outside Next's build there
 * is no loadable manifest, so the real `dynamic()` resolves to nothing and
 * every view renders empty — a silent blank page rather than an error.
 *
 * `React.lazy` is the honest equivalent here: the streaming renderer awaits it
 * (that is what `onAllReady` waits for), so the registry's real indirection is
 * exercised and the actual View component renders.
 */
export default function dynamic<P extends object>(
  loader: () => Promise<ComponentType<P>>,
  options?: { ssr?: boolean },
): ComponentType<P> {
  // `ssr: false` means "never render on the server" — mirror that rather than
  // rendering something production would not.
  if (options?.ssr === false) return () => null
  return lazy(async () => ({ default: await loader() }))
}

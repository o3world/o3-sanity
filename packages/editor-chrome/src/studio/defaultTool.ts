/**
 * Which tool a Studio opens on.
 *
 * There is no `defaultTool` option in `sanity@6.8`. The default is resolved
 * positionally: `resolveUrlStateWithDefaultTool` takes the **first** entry of
 * the resolved `tools` array, and Sanity's own "Tools common patterns" guide
 * names sorting that array as the way to configure it. Plugin-contributed
 * tools come first, in plugin order, then anything in the config's own `tools`
 * array — so a plugin cannot set the default for a Studio that also registers
 * tools, and the config is the honest place for this to live.
 *
 * The same array orders the nav bar and seeds intent resolution (a cold `edit`
 * intent with no `mode` param goes to the first tool that accepts it). Reorder
 * the menu independently with `studio.components.toolMenu` if the two should
 * disagree.
 */
export function defaultToolFirst<T extends { name: string }>(
  tools: readonly T[],
  toolName: string,
): T[] {
  const target = tools.find((tool) => tool.name === toolName)
  if (!target) return [...tools]
  return [target, ...tools.filter((tool) => tool !== target)]
}

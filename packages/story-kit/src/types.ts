/**
 * Strip Sanity system fields to match the registry's BlockComponentSlot prop
 * contract (`Omit<…, '_key' | '_type' | 'scheduling'>`). The omitted trio here
 * mirrors the TYPE contract block components are written against, not the
 * dispatch spread — so a fixture pasted straight out of a dataset document
 * renders through the same component as one authored as props.
 */
export function toProps<T extends object>(data: T): Omit<T, '_type' | '_key' | 'scheduling'> {
  const { _type, _key, scheduling, ...rest } = data as T & {
    _type?: unknown
    _key?: unknown
    scheduling?: unknown
  }
  void _type
  void _key
  void scheduling
  return rest as Omit<T, '_type' | '_key' | 'scheduling'>
}

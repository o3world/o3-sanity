import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

/**
 * The chrome's slice of Site Settings, named once so the four components below
 * agree on it. `navItems` is a union since #243 — a member is a plain button
 * or a `navGroup` — and everything here narrows on `_type`.
 */
export type Settings = NonNullable<SITE_SETTINGS_QUERY_RESULT>

export type NavItem = NonNullable<Settings['navItems']>[number]
export type NavGroup = Extract<NavItem, { _type: 'navGroup' }>
export type NavGroupItem = NonNullable<NavGroup['items']>[number]
export type NavButton = Settings['primaryButton']

export const isNavGroup = (item: NavItem): item is NavGroup => item._type === 'navGroup'

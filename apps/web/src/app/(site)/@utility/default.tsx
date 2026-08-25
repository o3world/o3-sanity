/**
 * Every interior route: no strip. Home (`2250:1453`) is the only frame that
 * draws one, and a slot with nothing to render renders nothing.
 */
export default function NoUtilityNav() {
  return null
}

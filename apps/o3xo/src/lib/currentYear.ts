/**
 * The year the footer's copyright line prints (#266).
 *
 * `new Date()` in a prerendered component is a build error under Cache
 * Components: a static shell has no "now" to read. Inside a cached function
 * it is legal — the value is captured with the entry and lives as long as it
 * does.
 *
 * It takes the site-wide profile deliberately, and the profile is a year.
 * A route's revalidation window is the shortest one anything in it asks for,
 * so a `cacheLife('days')` here would put all 322 routes on a daily
 * regeneration schedule to keep one number honest — trading the whole site's
 * cost model against a value that is wrong for a few days each January at
 * worst. A deploy is part of every cache key, so in practice the year is as
 * fresh as the last release.
 */
export async function currentYear(): Promise<number> {
  'use cache'
  return new Date().getFullYear()
}

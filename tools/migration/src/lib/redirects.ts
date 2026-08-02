/**
 * The redirect map, read off the live WordPress (#24).
 *
 * Two plugins own redirects on this site and both are active, so both are
 * exported and merged:
 *
 * - **Redirection** (`{prefix}redirection_items`) — 290 rows, every one a
 *   plain 301 from one path to another. This is the map the ticket names.
 * - **Yoast SEO Premium** — 55 more, kept in two options rather than a table
 *   (`wpseo-premium-redirects-export-plain` / `-regex`). They are invisible to
 *   Redirection's own export and carry the `/services/*` chains ADR 0013 is
 *   about, so exporting only the plugin the ticket names would have missed the
 *   half the redesign actually has to answer for.
 *
 * Exported raw: normalization, chain resolution and the decision about what
 * each one should point at on the new site are `map/redirects.ts`, so this
 * file stays a faithful record of what WordPress says today.
 */

/**
 * One row of the Redirection plugin's table.
 *
 * `url` is taken rather than `match_url` **deliberately**: Redirection strips
 * the query string into `match_url`, so the row `/?resource_type=ebook` is
 * stored with `match_url = "/"`. Reading that column turns one dead ebook link
 * into a 301 on the homepage.
 */
export interface WpRedirectionRow {
  readonly source: string
  readonly target: string | null
  readonly code: string
  readonly regex: string
  readonly status: string
  readonly group_name: string | null
}

/** One entry of Yoast Premium's redirect option. */
export interface WpYoastRedirect {
  readonly url: string
  readonly type: number
}

export interface WpRedirectExport {
  readonly home: string
  readonly redirection: WpRedirectionRow[]
  readonly yoastPlain: Record<string, WpYoastRedirect>
  readonly yoastRegex: Record<string, WpYoastRedirect>
}

/**
 * Read both plugins' stores in one round trip.
 *
 * Every row is returned, `status` included, rather than filtered in SQL: the
 * `WHERE status = "enabled"` this wants cannot be written here (a snippet may
 * contain no single quotes, and escaping double quotes inside the query string
 * is worse than filtering 290 rows in TypeScript). Exporting the disabled ones
 * too also means the committed file records what an editor turned off.
 */
export const REDIRECTS_PHP = `
global $wpdb;
$rows = $wpdb->get_results("SELECT r.url AS source, r.action_data AS target, r.action_code AS code, r.regex AS regex, r.status AS status, g.name AS group_name FROM {$wpdb->prefix}redirection_items r LEFT JOIN {$wpdb->prefix}redirection_groups g ON g.id = r.group_id ORDER BY r.id", ARRAY_A);
$plain = get_option("wpseo-premium-redirects-export-plain", array());
$regex = get_option("wpseo-premium-redirects-export-regex", array());
echo json_encode(array("home" => home_url(), "redirection" => $rows, "yoastPlain" => (object) $plain, "yoastRegex" => (object) $regex));
`

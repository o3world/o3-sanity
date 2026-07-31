/**
 * The Yoast half of extraction — one PHP fragment, reused by every post type
 * (#26). Perspectives use it today; pages (#18) and case studies (#21) get
 * complete SEO by dropping `yoastPhp()` into their own `wp eval` snippet
 * instead of re-deciding which meta keys matter.
 *
 * The fragment reads Yoast's **presentation API** (`YoastSEO()->meta`) rather
 * than raw postmeta, for the same reason extraction runs ACF's `get_fields()`
 * rather than reassembling flexible content by hand (ADR 0002): template
 * expansion (`%%title%% %%sep%% %%sitename%%`), the site-wide OG image
 * fallback, and robots defaults are Yoast's rules, and reimplementing them in
 * TypeScript would be a second, drifting copy.
 *
 * It emits raw *and* resolved values side by side, because the two answer
 * different questions:
 *
 * - `*Override` — did an editor set this on this document? Only overrides
 *   migrate into `seo` (see `map/seo.ts`); the resolved values are site-wide
 *   defaults wearing a per-document disguise, and freezing 272 copies of them
 *   into the dataset is exactly what this split prevents.
 * - `*Rendered` — what does WordPress actually serve today? This is the
 *   parity reference: `canonicalRendered` is what `map/paths.ts` checks the
 *   new URL against, and `titleRendered` is what a reviewer diffs
 *   view-source against.
 *
 * Constraint inherited from `wpEval`: no single quotes anywhere in the PHP,
 * and no non-ASCII (it crosses a remote shell) — hence the `\u{…}` escapes.
 */

/**
 * PHP expression producing the seo array for a post. `idExpr` is a PHP
 * expression for the post id — usually `$p->ID` inside the caller's loop.
 *
 * The OG image reads the attachment id first (it survives URL changes) and
 * falls back to the stored URL: six years of editing left ids pointing at
 * deleted attachments, and a missing attachment must not become a silent null.
 */
export function yoastPhp(idExpr: string): string {
  return `(function ($id) {
  $m = YoastSEO()->meta->for_post($id);
  $ogRaw = (string) get_post_meta($id, "_yoast_wpseo_opengraph-image", true);
  $ogId = (int) get_post_meta($id, "_yoast_wpseo_opengraph-image-id", true);
  $ogImage = null;
  if ($ogRaw !== "" || $ogId > 0) {
    $url = $ogId > 0 ? wp_get_attachment_url($ogId) : "";
    if (!$url) { $url = $ogRaw; }
    if ($url) {
      $ogImage = ["url" => $url, "alt" => $ogId > 0 ? (string) get_post_meta($ogId, "_wp_attachment_image_alt", true) : ""];
    }
  }
  $robots = is_array($m->robots) ? $m->robots : [];
  return [
    "titleOverride" => (string) get_post_meta($id, "_yoast_wpseo_title", true),
    "titleRendered" => (string) $m->title,
    "descriptionOverride" => (string) get_post_meta($id, "_yoast_wpseo_metadesc", true),
    "descriptionRendered" => (string) $m->meta_description,
    "canonicalOverride" => (string) get_post_meta($id, "_yoast_wpseo_canonical", true),
    "canonicalRendered" => (string) $m->canonical,
    "noIndex" => isset($robots["index"]) && $robots["index"] === "noindex",
    "noFollow" => isset($robots["follow"]) && $robots["follow"] === "nofollow",
    "ogImage" => $ogImage,
    "twitterImageOverride" => (string) get_post_meta($id, "_yoast_wpseo_twitter-image", true),
  ];
})(${idExpr})`
}

/** PHP expression for the site-wide Yoast defaults — one record, extracted once. */
export const YOAST_SITE_PHP = `(function () {
  $titles = get_option("wpseo_titles", []);
  $social = get_option("wpseo_social", []);
  $sepKey = isset($titles["separator"]) ? $titles["separator"] : "sc-dash";
  $seps = ["sc-dash" => "-", "sc-ndash" => "\\u{2013}", "sc-mdash" => "\\u{2014}", "sc-colon" => ":", "sc-middot" => "\\u{00B7}", "sc-bull" => "\\u{2022}", "sc-star" => "*", "sc-smstar" => "\\u{22C6}", "sc-pipe" => "|", "sc-tilde" => "~", "sc-laquo" => "\\u{00AB}", "sc-raquo" => "\\u{00BB}", "sc-lt" => "<", "sc-gt" => ">"];
  return [
    "siteName" => get_bloginfo("name"),
    "siteUrl" => home_url(),
    "separator" => isset($seps[$sepKey]) ? $seps[$sepKey] : "-",
    "description" => get_bloginfo("description"),
    "ogDefaultImage" => isset($social["og_default_image"]) ? (string) $social["og_default_image"] : "",
    "twitterSite" => isset($social["twitter_site"]) ? (string) $social["twitter_site"] : "",
    "twitterCardType" => isset($social["twitter_card_type"]) ? (string) $social["twitter_card_type"] : "summary_large_image",
  ];
})()`

/** Per-document Yoast facts, as `yoastPhp()` emits them. */
export interface WpSeo {
  /** `_yoast_wpseo_title` — empty unless an editor overrode the title. */
  readonly titleOverride: string
  /** The `<title>` WordPress serves, templates expanded and site name appended. */
  readonly titleRendered: string
  readonly descriptionOverride: string
  readonly descriptionRendered: string
  /** `_yoast_wpseo_canonical` — unset across this whole site, but extracted for completeness. */
  readonly canonicalOverride: string
  /** The canonical URL WordPress serves. The path-parity reference. */
  readonly canonicalRendered: string
  readonly noIndex: boolean
  readonly noFollow: boolean
  /** Per-document OG image override only — never Yoast's site-wide default. */
  readonly ogImage: { readonly url: string; readonly alt?: string } | null
  readonly twitterImageOverride: string
}

/** Site-wide Yoast defaults, as `YOAST_SITE_PHP` emits them. */
export interface WpSiteSeo {
  readonly siteName: string
  readonly siteUrl: string
  /** The rendered separator character (Yoast stores `sc-pipe`; we store `|`). */
  readonly separator: string
  readonly description: string
  readonly ogDefaultImage: string
  readonly twitterSite: string
  readonly twitterCardType: string
}

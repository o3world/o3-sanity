/**
 * Site chrome extraction (#19): the nav menus and the ACF options page that
 * hold everything wrapping the content — menus, socials, contact details, the
 * boilerplate "about" paragraph.
 *
 * Same rule as `yoast.ts`: the snippet is flattened to one line before it is
 * sent, so no single quotes and no `//` comments (`wpEval` rejects both).
 */

/** PHP expression producing every registered nav menu, keyed by slug. */
export const MENUS_PHP = `(function () {
  $out = [];
  foreach (get_terms(["taxonomy" => "nav_menu", "hide_empty" => false]) as $menu) {
    $items = wp_get_nav_menu_items($menu->term_id);
    $out[$menu->slug] = [
      "name" => $menu->name,
      "items" => array_map(function ($i) {
        return ["title" => $i->title, "url" => $i->url, "type" => $i->type, "object" => $i->object, "parent" => (int) $i->menu_item_parent];
      }, is_array($items) ? $items : []),
    ];
  }
  return $out;
})()`

/**
 * PHP expression for the ACF options page — the theme's real "site settings".
 * `social_media` here (LinkedIn + Instagram) is the source of truth for
 * socials, not Yoast's `wpseo_social`: Yoast holds a Facebook page and a
 * Twitter handle the redesign does not show, while ACF holds exactly the two
 * the prototype's footer lists.
 */
export const SITE_OPTIONS_PHP = `(function () {
  $o = function_exists("get_fields") ? get_fields("option") : [];
  if (!is_array($o)) { $o = []; }
  $social = [];
  if (isset($o["social_media"]) && is_array($o["social_media"])) {
    foreach ($o["social_media"] as $s) {
      $channel = isset($s["social_channel"]) ? $s["social_channel"] : [];
      $social[] = [
        "label" => is_array($channel) && isset($channel["label"]) ? (string) $channel["label"] : "",
        "key" => is_array($channel) && isset($channel["value"]) ? (string) $channel["value"] : "",
        "url" => isset($s["social_url"]) ? (string) $s["social_url"] : "",
      ];
    }
  }
  $phone = isset($o["phone"]) && is_array($o["phone"]) ? $o["phone"] : [];
  return [
    "about" => isset($o["about_o3"]) ? (string) $o["about_o3"] : "",
    "address" => isset($o["address"]) ? (string) $o["address"] : "",
    "email" => isset($o["email"]) ? (string) $o["email"] : "",
    "phone" => isset($phone["international"]) ? (string) $phone["international"] : "",
    "social" => $social,
  ];
})()`

export interface WpMenuItem {
  readonly title: string
  readonly url: string
  /** `post_type` for an internal page, `custom` for a hand-entered URL. */
  readonly type: string
  readonly object: string
  readonly parent: number
}

export interface WpMenu {
  readonly name: string
  readonly items: readonly WpMenuItem[]
}

export interface WpSocialLink {
  readonly label: string
  readonly key: string
  readonly url: string
}

export interface WpSiteOptions {
  readonly about: string
  readonly address: string
  readonly email: string
  readonly phone: string
  readonly social: readonly WpSocialLink[]
}

/** The whole chrome extract, as `data/extract/site/chrome.json` stores it. */
export interface WpChrome {
  readonly menus: Readonly<Record<string, WpMenu>>
  readonly options: WpSiteOptions
}

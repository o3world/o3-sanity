/**
 * Extract → data/extract/<type>/<slug>.json
 *
 * Runs ACF's own get_fields() on the live site via `terminus wp eval`
 * (ADR 0002) so flexible-content reconstruction is ACF's job, not ours.
 *
 *   pnpm --filter @o3/migration extract -- --posts 5          # N most recent posts
 *   pnpm --filter @o3/migration extract -- --posts all        # every published post
 *   pnpm --filter @o3/migration extract -- --slugs a-post,b   # exactly these, by slug
 */
import { join } from 'node:path'

import { MANIFEST_PATH, recordRun } from './lib/manifest'
import { stripRenderNonces } from './lib/nonces'
import { EXTRACT_DIR, writeJson } from './lib/paths'
import { SOURCE, wpEval } from './lib/wp'
import { MENUS_PHP, SITE_OPTIONS_PHP, type WpChrome } from './lib/chrome'
import { YOAST_SITE_PHP, yoastPhp, type WpSeo, type WpSiteSeo } from './lib/yoast'
import { REDIRECTS_PHP, type WpRedirectExport } from './lib/redirects'

type WpPost = {
  wpId: number
  slug: string
  title: string
  dateGmt: string
  modifiedGmt: string
  authorId: number
  categoryIds: number[]
  excerpt: string
  featuredImage: { url: string; alt: string } | null
  seo: WpSeo
  fields: Record<string, unknown>
}

/** Extract types this run touched, so the manifest records only those. */
const touched = new Set<string>()
const startedAt = new Date().toISOString()

/**
 * Write one extracted record.
 *
 * `_meta` carries the type and nothing else: `source` and `extractedAt` are
 * facts about the run, and live in `_manifest.json` instead — a timestamp in
 * every file meant a re-extract rewrote all 361 of them whether or not
 * WordPress had changed a word. `stripRenderNonces` removes the one remaining
 * per-render value, so re-extracting unchanged content is a genuine no-op.
 */
function writeRecord(type: string, path: string, record: Record<string, unknown>): void {
  touched.add(type)
  writeJson(path, stripRenderNonces({ _meta: { type }, ...record }))
}

type WpPage = {
  wpId: number
  slug: string
  path: string
  title: string
  parentSlug: string | null
  seo: WpSeo
  fields: Record<string, unknown>
}

type WpCaseStudy = {
  wpId: number
  slug: string
  path: string
  title: string
  headline: string
  dateGmt: string
  featuredImage: { url: string; alt: string } | null
  seo: WpSeo
  fields: Record<string, unknown>
}

type WpVenture = {
  wpId: number
  slug: string
  path: string
  title: string
  headline: string
  featuredImage: { url: string; alt: string } | null
  seo: WpSeo
  fields: Record<string, unknown>
}

type WpUser = { wpId: number; slug: string; name: string; email: string; bio: string }
type WpTeamMember = {
  wpId: number
  slug: string
  name: string
  jobTitle: string
  bio: string
  photo: string
  email: string
  linkedin: string
}
type WpCategory = { wpId: number; slug: string; name: string; count: number }

const args = process.argv.slice(2)
const postsArg = args.includes('--posts') ? args[args.indexOf('--posts') + 1] : '5'
const slugsArg = (args.includes('--slugs') ? args[args.indexOf('--slugs') + 1] : '') ?? ''
const BATCH = 20

/**
 * `--slugs` names posts explicitly instead of taking the N most recent. The
 * sample set is otherwise "whatever WordPress published last", which is a
 * poor proof for anything rare — the six posts carrying a per-document OG
 * image override (#26) are all years old. It is also how you re-extract one
 * document after fixing its source without touching the other 271.
 */
const slugs = slugsArg
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function slugFilterPhp(): string {
  if (slugs.length === 0) return ''
  if (slugs.some((s) => !/^[a-z0-9_-]+$/i.test(s))) {
    throw new Error(`--slugs takes plain WordPress slugs; got ${JSON.stringify(slugsArg)}`)
  }
  return `, "post_name__in" => [${slugs.map((s) => `"${s}"`).join(', ')}]`
}

function extractPosts() {
  const wanted = slugs.length > 0 ? slugs.length : postsArg === 'all' ? Infinity : Number(postsArg)
  let offset = 0
  let total = 0
  while (total < wanted) {
    const n = Math.min(BATCH, wanted - total)
    const batch = wpEval<WpPost[]>(
      `$posts = get_posts(["post_type" => "post", "post_status" => "publish", "numberposts" => ${n}, "offset" => ${offset}, "orderby" => "date", "order" => "DESC"${slugFilterPhp()}]);
$out = [];
foreach ($posts as $p) {
  $thumb = get_post_thumbnail_id($p->ID);
  $out[] = [
    "wpId" => $p->ID,
    "slug" => $p->post_name,
    "title" => $p->post_title,
    "dateGmt" => $p->post_date_gmt,
    "modifiedGmt" => $p->post_modified_gmt,
    "authorId" => (int) $p->post_author,
    "categoryIds" => array_map("intval", wp_get_post_categories($p->ID)),
    "excerpt" => $p->post_excerpt,
    "featuredImage" => $thumb ? ["url" => wp_get_attachment_url($thumb), "alt" => (string) get_post_meta($thumb, "_wp_attachment_image_alt", true)] : null,
    "seo" => ${yoastPhp('$p->ID')},
    "fields" => get_fields($p->ID),
  ];
}
echo json_encode($out, JSON_PARTIAL_OUTPUT_ON_ERROR);`,
    )
    if (batch.length === 0) break
    for (const post of batch) {
      writeRecord('perspective', join(EXTRACT_DIR, 'perspective', `${post.slug}.json`), {
        ...post,
      })
    }
    total += batch.length
    offset += batch.length
    console.log(`extracted ${total} posts…`)
    if (batch.length < n) break
  }
  return total
}

/**
 * The `page` CPT (#18). **Every** published page is extracted, not just the
 * keepers: the decision about which pages migrate rather than going
 * greenfield is made from this evidence, so it has to be in the repo to be
 * reviewable — and #23 needs the rest as source material for its seeds.
 * `map/page.ts` holds the keeper list.
 *
 * `path` is the URL WordPress serves, which is what the new slug must match
 * (#26). Service pages are children of `solutions`, so their path is
 * multi-segment and their slug carries the prefix (ADR 0001).
 */
function extractPages() {
  const pages = wpEval<WpPage[]>(
    `$out = [];
foreach (get_posts(["post_type" => "page", "post_status" => "publish", "numberposts" => -1]) as $p) {
  $parent = $p->post_parent ? get_post($p->post_parent) : null;
  $out[] = [
    "wpId" => $p->ID,
    "slug" => $p->post_name,
    "path" => str_replace(home_url(), "", get_permalink($p->ID)),
    "title" => $p->post_title,
    "parentSlug" => $parent ? $parent->post_name : null,
    "seo" => ${yoastPhp('$p->ID')},
    "fields" => get_fields($p->ID),
  ];
}
echo json_encode($out, JSON_PARTIAL_OUTPUT_ON_ERROR);`,
  )
  for (const page of pages) {
    writeRecord('page', join(EXTRACT_DIR, 'page', `${page.slug}.json`), {
      ...page,
    })
  }
  return pages.length
}

/**
 * The `work` CPT — the 20 case studies (#21).
 *
 * Extraction is **verbatim and unmapped**, unlike every other type here. A
 * case study's ACF is four levels of nested flexible content
 * (`flexible_content[].column[].content[]`) laid out for a page that no
 * longer exists, and the new `caseStudy` is a structured document — client,
 * narrative headline, stats, story, deliverables. There is no mechanical
 * transform between those two shapes, which is the whole reason the pipeline
 * has a translate track (ADR 0002's addendum): the restructuring is Claude
 * Code's job, working from this JSON and `rules/caseStudy.md`.
 *
 * So this writes what `get_fields()` returns and nothing else. Anything that
 * looks like a mapping decision belongs in the rules file, where a human
 * reviews it.
 */
function extractCaseStudies() {
  const studies = wpEval<WpCaseStudy[]>(
    `$out = [];
foreach (get_posts(["post_type" => "work", "post_status" => "publish", "numberposts" => -1, "orderby" => "date", "order" => "DESC"]) as $p) {
  $thumb = get_post_thumbnail_id($p->ID);
  $f = get_fields($p->ID);
  $out[] = [
    "wpId" => $p->ID,
    "slug" => $p->post_name,
    "path" => str_replace(home_url(), "", get_permalink($p->ID)),
    "title" => $p->post_title,
    "headline" => is_array($f) && isset($f["headline"]) ? (string) $f["headline"] : "",
    "dateGmt" => $p->post_date_gmt,
    "featuredImage" => $thumb ? ["url" => wp_get_attachment_url($thumb), "alt" => (string) get_post_meta($thumb, "_wp_attachment_image_alt", true)] : null,
    "seo" => ${yoastPhp('$p->ID')},
    "fields" => $f,
  ];
}
echo json_encode($out, JSON_PARTIAL_OUTPUT_ON_ERROR);`,
  )
  for (const study of studies) {
    writeRecord('caseStudy', join(EXTRACT_DIR, 'caseStudy', `${study.slug}.json`), {
      ...study,
    })
  }
  return studies.length
}

function extractUsers() {
  const users = wpEval<WpUser[]>(
    `$out = [];
foreach (get_users() as $u) {
  $out[] = ["wpId" => $u->ID, "slug" => $u->user_nicename, "name" => $u->display_name, "email" => $u->user_email, "bio" => (string) get_user_meta($u->ID, "description", true)];
}
echo json_encode($out);`,
  )
  for (const u of users) {
    writeRecord('person', join(EXTRACT_DIR, 'person', `${u.slug}.json`), {
      ...u,
    })
  }
  return users.length
}

/**
 * The `team` CPT (#17). Two jobs, not one:
 *
 * - It is the only place WordPress keeps a person's role and headshot. A WP
 *   *user* carries a display name and an empty bio; everything else is here.
 * - It is the **only byline**. Posts carry an ACF `author` field pointing at a
 *   team post, and on 39 of the 40 posts that have one it names someone other
 *   than `post_author` — the WP account is just whoever published, and #32
 *   established that the live site shows it to a reader nowhere. A post with
 *   no ACF author therefore migrates with no author at all.
 *
 * `post_status => any` because six of the referenced team posts are no longer
 * published; a former employee is still the author of what they wrote.
 */
function extractTeam() {
  const team = wpEval<WpTeamMember[]>(
    `$out = [];
foreach (get_posts(["post_type" => "team", "post_status" => "any", "numberposts" => -1]) as $p) {
  $f = get_fields($p->ID);
  $headshot = is_array($f) && isset($f["headshot"]) && is_array($f["headshot"]) && isset($f["headshot"]["url"]) ? $f["headshot"]["url"] : "";
  $thumb = get_post_thumbnail_id($p->ID);
  $out[] = [
    "wpId" => $p->ID,
    "slug" => $p->post_name,
    "name" => $p->post_title,
    "jobTitle" => is_array($f) && isset($f["job_title"]) ? (string) $f["job_title"] : "",
    "bio" => is_array($f) && isset($f["short_bio"]) ? (string) $f["short_bio"] : "",
    "photo" => $headshot !== "" ? $headshot : ($thumb ? (string) wp_get_attachment_url($thumb) : ""),
    "email" => is_array($f) && isset($f["email"]) ? (string) $f["email"] : "",
    "linkedin" => is_array($f) && isset($f["linkedin"]) ? (string) $f["linkedin"] : "",
  ];
}
echo json_encode($out);`,
  )
  for (const member of team) {
    // Unpublished team posts can have an empty `post_name`; the id keeps the
    // filename unique so a draft cannot overwrite a colleague.
    writeRecord('team', join(EXTRACT_DIR, 'team', `${member.slug || `id-${member.wpId}`}.json`), {
      ...member,
    })
  }
  return team.length
}

/**
 * The `ventures` CPT — REC Philly and Urvin (#23, found by #24).
 *
 * A fourth post type nobody had looked at. `ventures-sitemap.xml` lists two
 * live URLs (`/ventures/rec-philly/`, `/ventures/urvin/`) that no extraction
 * covered, because the extractor pulls `post_type => page` and these are not
 * pages — the same shape of miss ADR 0013 records for `services`. They surfaced
 * in #24's sitemap diff, which is exactly what that diff is for.
 *
 * Extracted verbatim like `work`: the ACF is the same nested flexible content,
 * and what it becomes is a seeding decision made against `data/seed/page/`.
 * A third venture (`fanup`) is a draft and is not extracted.
 */
function extractVentures() {
  const ventures = wpEval<WpVenture[]>(
    `$out = [];
foreach (get_posts(["post_type" => "ventures", "post_status" => "publish", "numberposts" => -1]) as $p) {
  $thumb = get_post_thumbnail_id($p->ID);
  $f = get_fields($p->ID);
  $out[] = [
    "wpId" => $p->ID,
    "slug" => $p->post_name,
    "path" => str_replace(home_url(), "", get_permalink($p->ID)),
    "title" => $p->post_title,
    "headline" => is_array($f) && isset($f["headline"]) ? (string) $f["headline"] : "",
    "featuredImage" => $thumb ? ["url" => wp_get_attachment_url($thumb), "alt" => (string) get_post_meta($thumb, "_wp_attachment_image_alt", true)] : null,
    "seo" => ${yoastPhp('$p->ID')},
    "fields" => $f,
  ];
}
echo json_encode($out, JSON_PARTIAL_OUTPUT_ON_ERROR);`,
  )
  for (const venture of ventures) {
    writeRecord('venture', join(EXTRACT_DIR, 'venture', `${venture.slug}.json`), {
      ...venture,
    })
  }
  return ventures.length
}

function extractCategories() {
  const cats = wpEval<WpCategory[]>(
    `$out = [];
foreach (get_categories(["hide_empty" => false]) as $c) {
  $out[] = ["wpId" => $c->term_id, "slug" => $c->slug, "name" => $c->name, "count" => $c->count];
}
echo json_encode($out);`,
  )
  for (const c of cats) {
    writeRecord('category', join(EXTRACT_DIR, 'category', `${c.slug}.json`), {
      ...c,
    })
  }
  return cats.length
}

/**
 * The site-wide Yoast defaults, extracted once. Two consumers: `map/seo.ts`
 * needs the separator + site name to strip the suffix Yoast's title template
 * appends, and Site Settings' `defaultSeo` (#19) is populated from the same
 * record rather than re-reading WordPress.
 */
function extractSiteSeo() {
  const site = wpEval<WpSiteSeo>(`echo json_encode(${YOAST_SITE_PHP});`)
  writeRecord('siteSeo', join(EXTRACT_DIR, 'site', 'seo.json'), {
    ...site,
  })
  return site
}

/**
 * The site chrome (#19): nav menus and the ACF options page. Everything that
 * wraps the content and belongs to the `siteSettings` singleton.
 */
function extractChrome() {
  const chrome = wpEval<WpChrome>(
    `echo json_encode(["menus" => ${MENUS_PHP}, "options" => ${SITE_OPTIONS_PHP}]);`,
  )
  writeRecord('siteChrome', join(EXTRACT_DIR, 'site', 'chrome.json'), {
    ...chrome,
  })
  return Object.keys(chrome.menus).length
}

/**
 * The redirect map (#24) — both plugins, raw. See `lib/redirects.ts` for why
 * there are two and why the `url` column is the one that matters.
 *
 * Runnable on its own (`extract -- --redirects`) because it is the one
 * extraction with no content in it: re-reading 290 redirect rows should not
 * mean re-reading 272 post bodies.
 */
function extractRedirects() {
  const map = wpEval<WpRedirectExport>(REDIRECTS_PHP)
  writeRecord('redirects', join(EXTRACT_DIR, 'site', 'redirects.json'), {
    ...map,
  })
  return map
}

if (args.includes('--ventures')) {
  console.log(`done: ${extractVentures()} ventures → ${EXTRACT_DIR}/venture`)
} else if (args.includes('--redirects')) {
  const map = extractRedirects()
  console.log(
    `done: ${map.redirection.length} Redirection rows + ${Object.keys(map.yoastPlain).length} ` +
      `Yoast plain + ${Object.keys(map.yoastRegex).length} Yoast regex → ${EXTRACT_DIR}/site/redirects.json`,
  )
} else {
  const site = extractSiteSeo()
  const nMenus = extractChrome()
  const nPosts = extractPosts()
  const nPages = extractPages()
  const nCases = extractCaseStudies()
  const nUsers = extractUsers()
  const nTeam = extractTeam()
  const nCats = extractCategories()
  const nVentures = extractVentures()
  const redirects = extractRedirects()
  console.log(
    `done: ${nPosts} posts, ${nPages} pages, ${nCases} case studies, ${nVentures} ventures, ` +
      `${nUsers} users, ${nTeam} team, ${nCats} categories, ${nMenus} menus, ` +
      `${redirects.redirection.length} redirects, site seo (${site.siteName}) → ${EXTRACT_DIR}`,
  )
}

// Last, and only for the types this run actually wrote — `--redirects` must
// not claim it re-read the posts. Everything above is unchanged on disk when
// WordPress is unchanged, so this is usually the only file in the diff.
recordRun(SOURCE, [...touched], startedAt)
console.log(`  run recorded for ${[...touched].sort().join(', ')} → ${MANIFEST_PATH}`)

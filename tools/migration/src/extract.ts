/**
 * Extract → data/extract/<type>/<slug>.json
 *
 * Runs ACF's own get_fields() on the live site via `terminus wp eval`
 * (ADR 0002) so flexible-content reconstruction is ACF's job, not ours.
 *
 *   pnpm --filter @o3/migration extract -- --posts 5   # N most recent posts
 *   pnpm --filter @o3/migration extract -- --posts all # every published post
 */
import { join } from 'node:path'

import { EXTRACT_DIR, writeJson } from './lib/paths'
import { SOURCE, wpEval } from './lib/wp'

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
  yoast: { title: string; description: string }
  fields: Record<string, unknown>
}

type WpUser = { wpId: number; slug: string; name: string; bio: string }
type WpCategory = { wpId: number; slug: string; name: string; count: number }

const args = process.argv.slice(2)
const postsArg = args.includes('--posts') ? args[args.indexOf('--posts') + 1] : '5'
const BATCH = 20

function extractPosts() {
  const wanted = postsArg === 'all' ? Infinity : Number(postsArg)
  let offset = 0
  let total = 0
  while (total < wanted) {
    const n = Math.min(BATCH, wanted - total)
    const batch = wpEval<WpPost[]>(
      `$posts = get_posts(["post_type" => "post", "post_status" => "publish", "numberposts" => ${n}, "offset" => ${offset}, "orderby" => "date", "order" => "DESC"]);
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
    "yoast" => ["title" => (string) get_post_meta($p->ID, "_yoast_wpseo_title", true), "description" => (string) get_post_meta($p->ID, "_yoast_wpseo_metadesc", true)],
    "fields" => get_fields($p->ID),
  ];
}
echo json_encode($out, JSON_PARTIAL_OUTPUT_ON_ERROR);`,
    )
    if (batch.length === 0) break
    for (const post of batch) {
      writeJson(join(EXTRACT_DIR, 'perspective', `${post.slug}.json`), {
        _meta: { type: 'perspective', source: SOURCE, extractedAt: new Date().toISOString() },
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

function extractUsers() {
  const users = wpEval<WpUser[]>(
    `$out = [];
foreach (get_users() as $u) {
  $out[] = ["wpId" => $u->ID, "slug" => $u->user_nicename, "name" => $u->display_name, "bio" => (string) get_user_meta($u->ID, "description", true)];
}
echo json_encode($out);`,
  )
  for (const u of users) {
    writeJson(join(EXTRACT_DIR, 'person', `${u.slug}.json`), {
      _meta: { type: 'person', source: SOURCE, extractedAt: new Date().toISOString() },
      ...u,
    })
  }
  return users.length
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
    writeJson(join(EXTRACT_DIR, 'category', `${c.slug}.json`), {
      _meta: { type: 'category', source: SOURCE, extractedAt: new Date().toISOString() },
      ...c,
    })
  }
  return cats.length
}

const nPosts = extractPosts()
const nUsers = extractUsers()
const nCats = extractCategories()
console.log(`done: ${nPosts} posts, ${nUsers} users, ${nCats} categories → ${EXTRACT_DIR}`)

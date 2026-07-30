# WordPress content inventory of o3world.com

Research for [issue #3](https://github.com/o3world/o3-sanity/issues/3). All data gathered
**from the live site only** (no infra access) on **2026-07-30**, via the public WordPress REST
API, Yoast sitemaps, robots.txt, and rendered pages. Every number below is reproducible from
the exact endpoints listed in [Endpoints used](#endpoints-used).

## Site basics

| Fact | Value | Source |
| --- | --- | --- |
| Site name / tagline | "O3" / "Digital experience consultants" | `GET /wp-json/` |
| WordPress version | 7.0 | `<meta name="generator" content="WordPress 7.0" />` on `/` |
| Front page | Static page, ID 10456 (`page_on_front`) | `GET /wp-json/` |
| Timezone | America/New_York | `GET /wp-json/` |
| REST API | Fully open for read (no auth needed for posts/pages/media/terms/users) | verified by requests below |
| robots.txt | Allows everything; points to `sitemap_index.xml` (Yoast) | `GET /robots.txt` |

## Post types and counts

`GET /wp-json/wp/v2/types` exposes only core types (`post`, `page`, `attachment`, plus WP
internals: `nav_menu_item`, `wp_block`, `wp_template`, `wp_template_part`, `wp_global_styles`,
`wp_navigation`, `wp_font_family`, `wp_font_face`). Three **custom post types are hidden from
REST** (`GET /wp-json/wp/v2/work` returns 404) but are proven to exist by their dedicated Yoast
sitemaps and live URLs: `work`, `services`, `ventures`.

| Type | Count | How counted |
| --- | ---: | --- |
| `post` ("Perspectives" blog) | **272** | `X-WP-Total` on `GET /wp-json/wp/v2/posts?per_page=1` (matches 272 URLs in `post-sitemap.xml`) |
| `page` | **22** | `X-WP-Total` on `GET /wp-json/wp/v2/pages?per_page=1` (21 in `page-sitemap.xml`; one page presumably noindexed) |
| `attachment` (media) | **1,058** total / **819** anonymously listable | `X-WP-Total` on `GET /wp-json/wp/v2/media?per_page=1`; paginating all 11 pages returns 819 items (~239 attachments are filtered for anonymous users, likely parented to draft/private content) |
| `work` (case studies, CPT) | **20** | `work-sitemap.xml` URL count (not in REST) |
| `services` (CPT) | **24** | `services-sitemap.xml` URL count (not in REST) |
| `ventures` (CPT) | **2** | `ventures-sitemap.xml` URL count (not in REST) |
| Users (authors) | **8** | `X-WP-Total` on `GET /wp-json/wp/v2/users?per_page=1` |

**Total public content documents: ~340** (272 posts + 22 pages + 20 work + 24 services + 2 ventures).

## Taxonomies

`GET /wp-json/wp/v2/taxonomies` exposes only `category` and `post_tag` (both attached to
`post` only), plus WP internals (`nav_menu`, `wp_pattern_category`). No custom taxonomies are
visible; the CPTs appear untaxonomized (or their taxonomies are also hidden from REST).

### Categories — 11 terms (`GET /wp-json/wp/v2/categories?per_page=100&_fields=name,slug,count`)

| Category | Slug | Post count |
| --- | --- | ---: |
| Events | `conferences-events` | 110 |
| Innovation | `innovation` | 74 |
| Life at O3 | `life-at-o3` | 51 |
| Customer Experience | `customer-experience` | 45 |
| Uncategorized | `uncategorized` | 45 |
| Accessibility | `accessibility` | 34 |
| AI | `artificial-intelligence-ai` | 34 |
| Technology | `technology` | 32 |
| Research | `research` | 18 |
| Design | `design` | 15 |
| 1682 Conference | `1682-conference` | 2 |

(Counts sum to more than 272 because posts carry multiple categories.)

### Tags — 25 terms (`GET /wp-json/wp/v2/tags?per_page=100&_fields=name,slug,count`)

Tags are barely used: 22 of 25 terms have exactly **1** post; the busiest (`ai`,
`ai-integration`, `o3`) have **2**. All tag usage is on recent posts (AI/CMS-migration topics:
`sanity-cms`, `headless-cms`, `cms-migration`, `vibe-coding`, `lovable`, `aeo`, `geo`, `llmo`, etc.).

## Media

From paginating `GET /wp-json/wp/v2/media?per_page=100&page={1..11}&_fields=mime_type,source_url`
(819 of 1,058 items visible anonymously; per-page item counts were 70–95, i.e. WP filters some
attachments per page for unauthenticated requests):

| MIME type | Count |
| --- | ---: |
| image/jpeg | 455 |
| image/png | 225 |
| image/svg+xml | 101 |
| image/webp | 13 |
| application/pdf | 11 |
| image/avif | 6 |
| video/mp4 | 6 |
| image/heic | 1 |
| application/zip | 1 |

- **Hosting: 100% first-party.** All 819 `source_url`s are on `www.o3world.com`
  (`/wp-content/uploads/...`). No CDN/offload (S3, Cloudinary, etc.).
- Rendered pages serve responsive `srcset` variants incl. `@2x` crops and WebP.
- Sitemaps reference 363 images total (post: 321, page: 18, work: 20, services: 2, ventures: 2).
- ~792 of visible media are images; video is negligible (6 mp4), documents minimal (11 PDFs).

## Plugin / theme fingerprints

From `GET /wp-json/` `namespaces`, asset paths in rendered HTML (`/`, `/work/vertex/`, a
`/perspectives/...` article), and REST response shapes:

| Fingerprint | Evidence |
| --- | --- |
| **Custom theme `o3world`** (Tailwind CSS) | `wp-content/themes/o3world` asset paths; utility classes (`space-y-4`, `md:text-[30px]`, `text-brand-red`) throughout markup |
| **ACF (Advanced Custom Fields)** | `"acf": []` key on REST post objects; content rendered as theme "module" sections (see next section) |
| **Yoast SEO** (`yoast/v1`) | robots.txt block, sitemap XSL, `yoast_head` in REST, JSON-LD (`WebSite`, `WebPage`, `BreadcrumbList`, `Person`, `ImageObject`) |
| **Relevanssi** (`relevanssi/v1`) | namespace + `_relevanssi_*` meta keys on every post |
| **Redirection** (`redirection/v1`) | namespace |
| **Search & Filter Pro** | `wp-content/plugins/search-filter-pro` assets on `/` and article pages |
| **Gravity Forms** + Zero Spam | `wp-content/plugins/gravityforms`, `gravity-forms-zero-spam` assets on article pages |
| **Cookie Notice** | `wp-content/plugins/cookie-notice` assets |
| **Duplicate Post** (`duplicate-post/v1`) | namespace |
| **Simple Page Ordering** (`simple-page-ordering/v1`) | namespace |
| **Regenerate Thumbnails** (`regenerate-thumbnails/v1`) | namespace |
| **Google Tag Manager** | `googletagmanager.com/gtm.js` + noscript iframe |
| **No page builder** | zero Elementor/Divi/Beaver/WPBakery/Fusion class fingerprints; no `wp-block-*` classes in post content either |

## Critical finding: post/page bodies are NOT in `post_content`

Every one of the 20 most recent posts (`GET /wp-json/wp/v2/posts?per_page=20&_fields=id,slug,content,excerpt`)
and **all 22 pages** return an **empty** `content.rendered` and `excerpt.rendered`. The `acf`
key on REST responses is an empty array (no field groups exposed to REST). Rendered pages are
built from theme "module" sections (`class="modules"` / `class="module"` wrappers, `title-block`
components), i.e. **content lives in ACF flexible-content fields that are invisible to the
anonymous REST API**.

Consequence: a live-site-only migration cannot pull structured body content from `wp/v2` — it
would require one of: (a) WP admin access (WP All Export / DB dump / WP-CLI), (b) enabling
ACF "Show in REST" or an authenticated custom endpoint, or (c) scraping the rendered HTML of
each of the ~340 URLs.

## Sitemap section breakdown

`sitemap_index.xml` (Yoast) → 5 child sitemaps, ~339 URLs total:

| Sitemap | URLs | URL pattern / notes |
| --- | ---: | --- |
| `post-sitemap.xml` | 272 | all under `/perspectives/{slug}/` (blog) |
| `page-sitemap.xml` | 21 | `/`, `/about/`, `/contact/`, `/careers/`, `/work/` (listing), `/perspectives/` (listing), `/ventures/` (listing), `/solutions/` + 3 `/solutions/{slug}/` landing pages, `/services/`→(none; services are CPT), legal (`/privacy-policy/`, `/accessibility-statement/`), event/campaign pages (`/1682-conference-ai-innovation/`, `/1682-photos/`, `/acquia-o3/`, `/lunch-and-learn-...`, `/conversing-with-the-future-...`), `/community-engagement/`, `/sitecore/`, one person page (`/mike-gadsby-chief-innovation-officer/`) |
| `work-sitemap.xml` | 20 | `/work/{slug}/` case studies (Vertex, La Colombe, Linode, SEI ×2, Best Egg, AmeriGas, IRONMAN, etc.) |
| `services-sitemap.xml` | 24 | `/services/{slug}/` service detail pages (UX audit, accessibility, AI consulting, CRO, etc.) |
| `ventures-sitemap.xml` | 2 | `/ventures/{slug}/` (REC Philly, Urvin) |

## Implications for a simplified Sanity schema and migration sizing

- **Five document types cover everything**: `perspective` (blog post, 272), `caseStudy` (20),
  `service` (24), `venture` (2), and `page` (~22, several of which are one-off
  campaign/landing pages that could become a modular `page` type or be dropped). Plus
  `author`/`teamMember` (8 WP users) and `category`.
- **One taxonomy matters.** Keep `category` (11 terms; consider merging `uncategorized` away).
  Tags are 25 terms used once or twice — fold into categories or drop; not worth a schema type.
- **Modular content model maps naturally.** The site already renders ACF flexible-content
  "modules"; the Sanity equivalent is an array of typed blocks. But the module definitions are
  not observable from outside — an authenticated export or per-page HTML scrape is required to
  learn/populate them (see critical finding above). Budget for this as the main migration cost;
  the metadata (titles, slugs, dates, categories, authors, featured images, Yoast SEO fields via
  `yoast_head_json`) is all freely available from REST today.
- **Migration sizing**: ~340 documents, ~1,060 media assets (~90%+ images, all self-hosted
  under `/wp-content/uploads/` — a simple crawl-and-upload to Sanity's asset pipeline; 11 PDFs
  and 6 mp4s as file assets; 101 SVGs may need `image` vs `file` handling). No external media
  hosts to worry about. 272 of 340 docs are blog posts, so the perspective type dominates
  effort-per-schema.
- **SEO parity checklist** from fingerprints: Yoast meta/OG (available as `yoast_head_json` in
  REST), Redirection plugin implies an existing redirect map worth exporting before cutover,
  and Yoast sitemaps/robots must be reproduced.

## Endpoints used

All fetched 2026-07-30 with plain `curl` (some with `-A "Mozilla/5.0"`; no auth):

- `https://www.o3world.com/wp-json/` — site meta, namespaces
- `https://www.o3world.com/wp-json/wp/v2/types` and `/wp-json/wp/v2/taxonomies`
- `https://www.o3world.com/wp-json/wp/v2/{posts,pages,media,categories,tags,users}?per_page=1` — `X-WP-Total` headers
- `https://www.o3world.com/wp-json/wp/v2/media?per_page=100&page={1..11}&_fields=mime_type,source_url`
- `https://www.o3world.com/wp-json/wp/v2/categories?per_page=100&_fields=name,slug,count` (same for `tags`)
- `https://www.o3world.com/wp-json/wp/v2/posts?per_page=20&_fields=id,slug,content,excerpt`
- `https://www.o3world.com/wp-json/wp/v2/pages?per_page=22&_fields=slug,content`
- `https://www.o3world.com/wp-json/wp/v2/work` — 404 (CPT hidden from REST)
- `https://www.o3world.com/robots.txt`, `/sitemap.xml` → `sitemap_index.xml`, and the 5 child sitemaps (`post|page|work|services|ventures-sitemap.xml`)
- Rendered HTML: `https://www.o3world.com/`, `/work/vertex/`, `/perspectives/we-replaced-a-35000-saas-tool-in-527-prompts/`

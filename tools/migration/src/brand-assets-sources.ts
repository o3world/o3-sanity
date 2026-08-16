/**
 * WHERE EACH PARTNER'S MARK COMES FROM, AND ON WHAT BASIS WE USE IT.
 *
 * One row per borrowed file. `brand-assets.ts` re-fetches every row and reports
 * what the vendor has changed; the bytes stay committed so `load` never depends
 * on a vendor's CDN being up (see that file for why).
 *
 * Two facts about these URLs that the next person will otherwise learn the hard
 * way. **Several carry a content hash** — Lovable's `-BboAsRf2`, Sanity's
 * `.QY6ZQ2w3` — so a routine site rebuild on the vendor's side 404s the URL
 * without changing the image at all. A failing run means "find the new URL",
 * not "the asset is gone". And **none of these three vendors publishes a
 * conventional press kit of square product imagery**, which is why every row
 * here is a logo mark: the wordmarks are 3.6:1 or wider and crop to nonsense in
 * the panel's 1:1 slot.
 *
 * The `terms` field is what the vendor actually publishes, not our reading of
 * it. Where it is thin, that is the finding.
 */
export interface BrandAsset {
  /** Repo-relative destination — what a seed's `_localSrc` points at. */
  readonly file: string
  readonly vendor: string
  readonly url: string
  /** Where on the vendor's site the URL was found, for the next person. */
  readonly source: string
  /** What the vendor publishes about third-party use of the mark. */
  readonly terms: string
}

export const BRAND_ASSETS: readonly BrandAsset[] = [
  {
    /**
     * The gradient heart, 1883x1920 on transparent — the only one of the three
     * that is a real press asset at a real size. Lovable's `/brand` page is a
     * press-contact stub that points here; the hub is a single-page app, so the
     * path came out of its JS bundle rather than its HTML.
     */
    file: 'tools/migration/data/seed/assets/plat-lovable-mark.png',
    vendor: 'Lovable',
    url: 'https://lovablebrand.lovable.app/assets/logomark-color-2x-BboAsRf2.png',
    source: 'https://lovablebrand.lovable.app/brand/logo (linked from https://lovable.dev/brand)',
    terms:
      'No trademark or attribution clause published. The brand hub lists: use approved colors only, keep clear space, do not stretch, recolor, add effects, or place on busy backgrounds.',
  },
  {
    /**
     * The triangle on black, off `assets.vercel.com` rather than the press zip:
     * the zip's icon is 2310x2000 and would need letterboxing to sit square,
     * and this endpoint is Cloudinary, so `w_800` is a supported transform
     * rather than an upscale we did ourselves.
     */
    file: 'tools/migration/data/seed/assets/plat-vercel-mark.png',
    vendor: 'Vercel',
    url: 'https://assets.vercel.com/image/upload/w_800,q_auto/front/favicon/vercel/apple-touch-icon-256x256.png',
    source: 'https://vercel.com/design/brand → https://vercel.com/geist/brands',
    terms:
      'Permitted: truthfully describing the products and technologies you use. Prohibited: marks in marketing collateral, modified marks, or any use implying sponsorship or endorsement. Requires the attribution line "Vercel, the Vercel design, Next.js and related marks, designs and logos are trademarks or registered trademarks of Vercel, Inc."',
  },
  {
    /**
     * NOT from sanity.io: they publish no brand page (/brand, /press,
     * /media-kit and /brand-guidelines all 404), the `sanity-io/logos` repo was
     * archived in July 2026, and the marks now ship only as React components in
     * `sanity-io/ui`. Every square file on sanity.io itself is a 180 or 192px
     * favicon, too small for the 790px slot. This is the org avatar from
     * Sanity's own GitHub organization — the real monogram at 460px, and the
     * largest official square mark that exists publicly.
     */
    file: 'tools/migration/data/seed/assets/plat-sanity-mark.png',
    vendor: 'Sanity',
    url: 'https://avatars.githubusercontent.com/u/17177659?s=800',
    source: 'https://github.com/sanity-io (org avatar) — sanity.io publishes no brand assets',
    terms:
      'Strictest of the three, and the one to get sign-off on. Sanity ToS 9.4: "Subscriber may not use Sanity\'s names, trademarks, trade names, service marks, insignia, or logos (“Marks”) without Sanity\'s prior written consent." No nominative-use carve-out is published.',
  },
]

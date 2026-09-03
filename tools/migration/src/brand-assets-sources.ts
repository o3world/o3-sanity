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
  /**
   * Centre the fetched mark on the partner strip's canvas before writing it
   * (`lib/logoCanvas.ts`). Set on every row that lands in a `logoWallSection`
   * tile, because that tile draws its artwork `w-full` and a 2:1 mark beside
   * an 8.8:1 one would otherwise draw three times its height.
   */
  readonly fit?: 'partner-strip'
}

/**
 * WHERE THE PARTNER-STRIP MARKS COME FROM.
 *
 * Fifteen of the rows below are the customer logo bar on sanity.io itself, and
 * that is deliberate rather than convenient. The strip they fill sits under
 * "Trusted brands using Sanity" on `/partners/sanity`, so the claim and the
 * artwork want the same source: every mark here is one Sanity publishes as its
 * own customer. Taking them off a press kit each would put us a generation
 * ahead of, or behind, the list we are quoting.
 *
 * They are also the only set that is already a set. Each is trimmed to its own
 * bounding box and drawn in Sanity's near-black (#1B1D27 / #272A2E) on
 * transparent, which is what the tile's `grayscale` and the bone surface both
 * want — a full-colour press PNG would need a knockout and a trim before it
 * could sit in the row.
 *
 * One property of these URLs to know. They are content-addressed: the hash in
 * the filename IS the file, so a mark Sanity redraws gets a new URL and this
 * one keeps serving the old bytes rather than changing under us. The drift
 * report will therefore never fire on this group; what goes stale is the
 * *list*, and the way to check it is to re-read sanity.io's logo bar.
 */
const SANITY_LOGO_BAR =
  'https://www.sanity.io/ (customer logo bar) and https://www.sanity.io/customers'

const SANITY_LOGO_BAR_TERMS =
  'Each mark belongs to the brand named, not to Sanity. Nominative use only —' +
  ' naming brands that use Sanity, on a page about our Sanity practice. No' +
  ' brand here publishes a licence covering this; none of the marks may be' +
  ' recoloured, restyled or used to imply endorsement, and any brand asking is' +
  ' removed from the strip rather than argued with.'

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
  {
    file: 'tools/migration/data/seed/assets/partner-puma.svg',
    vendor: 'PUMA',
    url: 'https://cdn.sanity.io/images/3do82whm/next/eeaa028ff98b13b53852fe2cc9de7bd882604ef7-61x36.svg',
    source: SANITY_LOGO_BAR,
    terms: SANITY_LOGO_BAR_TERMS,
    fit: 'partner-strip',
  },
  {
    file: 'tools/migration/data/seed/assets/partner-figma.svg',
    vendor: 'Figma',
    url: 'https://cdn.sanity.io/images/3do82whm/next/68281c639e338a3752f561ae72a321abc6067a89-67x32.svg',
    source: SANITY_LOGO_BAR,
    terms: SANITY_LOGO_BAR_TERMS,
    fit: 'partner-strip',
  },
  {
    file: 'tools/migration/data/seed/assets/partner-arcteryx.svg',
    vendor: "Arc'teryx",
    url: 'https://cdn.sanity.io/images/3do82whm/next/5afdf09b0d2e1d412ff66531206f625fc89d7568-139x32.svg',
    source: SANITY_LOGO_BAR,
    terms: SANITY_LOGO_BAR_TERMS,
    fit: 'partner-strip',
  },
  {
    file: 'tools/migration/data/seed/assets/partner-pinterest.svg',
    vendor: 'Pinterest',
    url: 'https://cdn.sanity.io/images/3do82whm/next/e2c2894ffe26d29a16e4951666da6bd8b74336b1-124x30.svg',
    source: SANITY_LOGO_BAR,
    terms: SANITY_LOGO_BAR_TERMS,
    fit: 'partner-strip',
  },
  {
    file: 'tools/migration/data/seed/assets/partner-shopify.svg',
    vendor: 'Shopify',
    url: 'https://cdn.sanity.io/images/3do82whm/next/43be86359947cdf8f90c88ec87abdca9f9e11fef-106x36.svg',
    source: SANITY_LOGO_BAR,
    terms: SANITY_LOGO_BAR_TERMS,
    fit: 'partner-strip',
  },
  {
    file: 'tools/migration/data/seed/assets/partner-loom.svg',
    vendor: 'Loom',
    url: 'https://cdn.sanity.io/images/3do82whm/next/91a8d15ffae047c01af7d22c173609b1d336c094-122x36.svg',
    source: SANITY_LOGO_BAR,
    terms: SANITY_LOGO_BAR_TERMS,
    fit: 'partner-strip',
  },
  {
    file: 'tools/migration/data/seed/assets/partner-anthropic.svg',
    vendor: 'Anthropic',
    url: 'https://cdn.sanity.io/images/3do82whm/next/6708b94d3f1898c0ee134446547b7316da4b8680-125x32.svg',
    source: SANITY_LOGO_BAR,
    terms: SANITY_LOGO_BAR_TERMS,
    fit: 'partner-strip',
  },
  {
    file: 'tools/migration/data/seed/assets/partner-replit.svg',
    vendor: 'Replit',
    url: 'https://cdn.sanity.io/images/3do82whm/next/a71ff8b1111c402c1f9e53b7f935fc22a46a8635-140x32.svg',
    source: SANITY_LOGO_BAR,
    terms: SANITY_LOGO_BAR_TERMS,
    fit: 'partner-strip',
  },
  {
    file: 'tools/migration/data/seed/assets/partner-athenahealth.svg',
    vendor: 'athenahealth',
    url: 'https://cdn.sanity.io/images/3do82whm/next/0b97644080fbb21135171bc696614de2b377a777-422x48.svg',
    source: SANITY_LOGO_BAR,
    terms: SANITY_LOGO_BAR_TERMS,
    fit: 'partner-strip',
  },
  {
    file: 'tools/migration/data/seed/assets/partner-frontier.svg',
    vendor: 'Frontier',
    url: 'https://cdn.sanity.io/images/3do82whm/next/cb47ce83ad77319cfa192868c0bddffafe9e98d5-325x44.svg',
    source: SANITY_LOGO_BAR,
    terms: SANITY_LOGO_BAR_TERMS,
    fit: 'partner-strip',
  },
  {
    file: 'tools/migration/data/seed/assets/partner-samsung.svg',
    vendor: 'Samsung',
    url: 'https://cdn.sanity.io/images/3do82whm/next/14c1267f7f08db829f9239587bc0030ca03c0b3f-325x50.svg',
    source: SANITY_LOGO_BAR,
    terms: SANITY_LOGO_BAR_TERMS,
    fit: 'partner-strip',
  },
  {
    file: 'tools/migration/data/seed/assets/partner-siemens.svg',
    vendor: 'Siemens',
    url: 'https://cdn.sanity.io/images/3do82whm/next/2e6d47f6a1da3a65755f9e7ef2e850658f2d7a71-321x52.svg',
    source: SANITY_LOGO_BAR,
    terms: SANITY_LOGO_BAR_TERMS,
    fit: 'partner-strip',
  },
  {
    file: 'tools/migration/data/seed/assets/partner-moma.svg',
    vendor: 'MoMA',
    url: 'https://cdn.sanity.io/images/3do82whm/next/8999d05556824a6802734991cd927f92d5f08523-119x32.svg',
    source: SANITY_LOGO_BAR,
    terms: SANITY_LOGO_BAR_TERMS,
    fit: 'partner-strip',
  },
  {
    file: 'tools/migration/data/seed/assets/partner-nordstrom.svg',
    vendor: 'Nordstrom',
    url: 'https://cdn.sanity.io/images/3do82whm/next/1ee03162ff8802bdb949eb6c9a60088f0c94d5c2-383x48.svg',
    source: SANITY_LOGO_BAR,
    terms: SANITY_LOGO_BAR_TERMS,
    fit: 'partner-strip',
  },
  {
    file: 'tools/migration/data/seed/assets/partner-nike.svg',
    vendor: 'Nike',
    url: 'https://cdn.sanity.io/images/3do82whm/next/44149304b3991592a14651fad15d6569eeed4ab3-92x32.svg',
    source: SANITY_LOGO_BAR,
    terms: SANITY_LOGO_BAR_TERMS,
    fit: 'partner-strip',
  },
]

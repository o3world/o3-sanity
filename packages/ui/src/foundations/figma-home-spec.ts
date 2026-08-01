/**
 * The O3DX visual exploration, extracted.
 *
 * SOURCE: Figma "O3DX- Visual exploration" → page Home, frame `Home`
 * (node 1680:2134, 1440×9573). Every value below was read off that frame via
 * the Figma MCP servers — none of it is inferred, rounded to taste, or
 * carried over from prototype/*.dc.html.
 *
 * WHY THIS IS DATA AND NOT TOKENS
 *
 * `@o3/tailwind-config` is extracted from the HTML prototype. This Figma file
 * is a LATER, DIFFERENT generation of the same design, and most of what it
 * specifies contradicts the prototype rather than extending it: a fixed px
 * type ramp instead of fluid clamps, display weight 400 instead of 300,
 * square corners instead of 6/16px radii, a 96px page gutter instead of 24px,
 * and gradient fills the prototype has none of.
 *
 * Merging that in silently would have retuned every shipped section block, so
 * the extraction lives here as data and renders in Storybook under
 * `Foundations/` — high enough fidelity to review and adopt from, with zero
 * effect on what the site currently renders. `drift` (bottom of this file)
 * lists every place the two generations disagree; that list IS the adoption
 * decision. The one piece already promoted to real tokens is the gradient
 * set, in `packages/tailwind-config/tokens/gradient.css`, because it collides
 * with nothing.
 *
 * Figma variable names are quoted verbatim (`text/tertiary`, `Layout/Layout
 * 128`) so a value can be traced back to the file.
 */

/** The Figma file + frame everything here was read from. */
export const FIGMA_SOURCE = {
  fileKey: 'RvraLJaZ0zWm8UaD5AJf43',
  name: 'O3DX- Visual exploration',
  frame: 'Home',
  nodeId: '1680-2134',
  width: 1440,
  height: 9573,
} as const

/** Deep-link a node for `parameters.design` (the addon-designs Figma tab). */
export function figmaUrl(nodeId: string): string {
  return `https://www.figma.com/design/${FIGMA_SOURCE.fileKey}/O3DX--Visual-exploration?node-id=${nodeId.replace(':', '-')}`
}

/* ── Color ─────────────────────────────────────────────────────────────────── */

export interface ColorSpec {
  name: string
  value: string
  /** The Figma variable name, when the fill was bound to one. */
  variable?: string
  role: string
  /** Nearest existing token in @o3/tailwind-config, if any. */
  token?: string
}

/**
 * Solid fills. The exploration runs on FOUR neutrals, not the prototype's
 * three: #0A0A0A carries almost all the ink weight (headings, dark buttons,
 * card bases) while #030303 survives only inside gradient stops.
 */
export const colors: readonly ColorSpec[] = [
  {
    name: 'ink',
    value: '#0A0A0A',
    variable: 'color/grey/4',
    role: 'The dominant dark: every section headline on a light band, the solid dark button, the quote attribution base. Effectively the design’s black.',
    token: 'ink-soft (#0A0A0B)',
  },
  {
    name: 'ink-deep',
    value: '#030303',
    role: 'Reserved for gradient stops and the footer band — the scrims, the statement text fade, the brand glow base. Rarely a flat fill.',
    token: 'ink (#030303)',
  },
  {
    name: 'surface',
    value: '#F0F0F0',
    role: 'The warm-neutral light band: partners/intro, the pull quote, the perspectives row. The design’s equivalent of "bone".',
    token: 'bone (#EFEEEC)',
  },
  {
    name: 'white',
    value: '#FFFFFF',
    variable: 'color/white/solid',
    role: 'The plain light band (platforms, ways-to-work), the light button fill, and all copy on dark.',
    token: 'white',
  },
  {
    name: 'text-default',
    value: '#232323',
    variable: 'text/default',
    role: 'Body copy and perspectives-card titles on light bands. Also `icons/default`.',
    token: 'fg (#232323)',
  },
  {
    name: 'text-tertiary',
    value: '#636363',
    variable: 'text/tertiary',
    role: 'The neutral eyebrow ("OUR PARTNERS") and perspectives-card meta ("3 MINS · 7/27/26").',
    token: 'fg-muted (#6E6E6E)',
  },
  {
    name: 'text-faint',
    value: '#A3A3A3',
    role: 'Footer legal row — privacy, accessibility, copyright.',
    token: 'fg-inverse-muted (#A4A4A4)',
  },
  {
    name: 'surface-muted',
    value: '#D3D3D3',
    variable: 'bg/button/secondary',
    role: 'The circular carousel controls beside the perspectives heading (Icon / Surface).',
  },
  {
    name: 'brand',
    value: '#EB1000',
    variable: 'Jawn/Primary/Phillies',
    role: 'Used ONCE on the whole page as a flat fill — the three footer link-group headers. Everywhere else the red arrives as the brand glow gradient.',
    token: 'brand (#EB1000)',
  },
]

/**
 * Copy on dark bands is white at an alpha, never a solid grey — the prototype
 * uses solid `fg-inverse-muted` for the same job.
 */
export const alphaOnInk: readonly ColorSpec[] = [
  {
    name: 'on-ink',
    value: 'rgba(255, 255, 255, 0.92)',
    variable: 'color/white/ 92%',
    role: 'The CTA band headline ("The best partnerships don’t have an end date.").',
  },
  {
    name: 'on-ink-muted',
    value: 'rgba(255, 255, 255, 0.65)',
    role: 'Case-study stat labels ("NRR") beside the 48px figure.',
  },
  {
    name: 'on-ink-subtle',
    value: 'rgba(255, 255, 255, 0.6)',
    variable: 'color/white/ 60%',
    role: 'The CTA band subhead.',
  },
  {
    name: 'orbit-stroke',
    value: 'rgba(255, 255, 255, 0.2)',
    role: 'The 2px orbital arc drawn behind the footer.',
  },
]

/**
 * The same trick in reverse — the one place the design tints ink instead of
 * reaching for a grey. Kept apart from `alphaOnInk` because it is only legible
 * on a light band.
 */
export const alphaOnLight: readonly ColorSpec[] = [
  {
    name: 'quote-attribution',
    value: 'rgba(10, 10, 10, 0.5)',
    role: 'The pull-quote attribution — ink at half strength, not a grey.',
  },
]

/* ── Gradients ─────────────────────────────────────────────────────────────── */

export interface GradientSpec {
  name: string
  /** The CSS custom property in tokens/gradient.css. */
  token: string
  value: string
  role: string
  nodeId: string
}

/** These ARE landed as tokens — see packages/tailwind-config/tokens/gradient.css. */
export const gradients: readonly GradientSpec[] = [
  {
    name: 'statement',
    token: '--gradient-statement',
    value: 'linear-gradient(180deg, #030303 0%, rgba(3, 3, 3, 0.4) 100%)',
    role: 'Background-clipped onto the 64px statement headlines so the copy fades as it descends. The exploration’s signature treatment.',
    nodeId: '1864:2393',
  },
  {
    name: 'card-scrim',
    token: '--gradient-card-scrim',
    value: 'linear-gradient(90deg, rgba(3, 3, 3, 1) 26%, rgba(3, 3, 3, 0) 79%)',
    role: 'Horizontal scrim over case-study card photography, holding the left copy column legible.',
    nodeId: '1883:3555',
  },
  {
    name: 'card-veil',
    token: '--gradient-card-veil',
    value: 'linear-gradient(180deg, rgba(3, 3, 3, 0) 0%, rgba(3, 3, 3, 0.75) 90%)',
    role: 'Vertical scrim on the perspectives cards, weighting the bottom where the label sits.',
    nodeId: '1734:1725',
  },
  {
    name: 'brand-glow',
    token: '--gradient-brand-glow',
    value:
      'radial-gradient(circle at 115% 24%, rgba(235, 16, 0, 0.5) 0%, rgba(3, 3, 3, 0) 100%), radial-gradient(circle at 0% 0%, rgba(114, 8, 0, 1) 0%, rgba(3, 3, 3, 1) 65%)',
    role: 'Figma variable `Gradient/Red/1`. Two stacked radials — the ember card in the perspectives row, and how brand red reaches the page at scale.',
    nodeId: '1734:1737',
  },
  {
    name: 'surface-wash',
    token: '--gradient-surface-wash',
    value: 'linear-gradient(0deg, #ffffff 0%, #f0f0f0 100%)',
    role: 'Light bands wash rather than sit flat, so consecutive sections separate without a rule.',
    nodeId: '1683:2657',
  },
  {
    name: 'surface-wash-angled',
    token: '--gradient-surface-wash-angled',
    value: 'linear-gradient(188deg, #ffffff 85%, #f0f0f0 100%)',
    role: 'The 188° variant behind the case-study card stack.',
    nodeId: '1683:2661',
  },
  {
    name: 'ink-fade',
    token: '--gradient-ink-fade',
    value: 'linear-gradient(0deg, rgba(3, 3, 3, 1) 0%, rgba(3, 3, 3, 0) 100%)',
    role: 'An 87px bleed strip fading the CTA band into the ink footer.',
    nodeId: '1928:6596',
  },
]

/* ── Typography ────────────────────────────────────────────────────────────── */

export interface TypeSpec {
  name: string
  size: number
  /** As authored in Figma — `1.2em`, `24px`, `64.8px`. */
  lineHeight: string
  letterSpacing: string
  weight: number
  style: string
  uppercase?: boolean
  role: string
  nodeId: string
}

/**
 * Figtree throughout, at a FIXED px ramp — the exploration has no fluid
 * clamps, and display weight is 400 (Regular), not the prototype's 300.
 * Line-height is 1.2em almost everywhere.
 *
 * (Figma's `Interactive/Large` variable still says Inter; every button that
 * consumes it renders Figtree Medium, so the variable's family is stale.)
 */
export const typeScale: readonly TypeSpec[] = [
  {
    name: 'statement',
    size: 64,
    lineHeight: '1.2em',
    letterSpacing: '0',
    weight: 400,
    style: 'Regular',
    role: 'The two full-width statements — partners intro and pull quote. Always filled with --gradient-statement, never a solid.',
    nodeId: '1864:2393',
  },
  {
    name: 'cta',
    size: 60,
    lineHeight: '64.8px',
    letterSpacing: '-0.0233em',
    weight: 400,
    style: 'Regular',
    role: 'The CTA band headline, centered on ink at 92% white.',
    nodeId: '1680:2088',
  },
  {
    name: 'headline',
    size: 48,
    lineHeight: '1.2em',
    letterSpacing: '0',
    weight: 400,
    style: 'Regular',
    role: 'Every section headline: "Most firms ship what you asked for.", "The platforms we go deep on", "The thinking behind the work.", the footer statement.',
    nodeId: '1683:2659',
  },
  {
    name: 'stat',
    size: 48,
    lineHeight: 'normal',
    letterSpacing: '-0.0208em',
    weight: 400,
    style: 'Regular',
    role: 'The case-study headline figure ("89% → 114%").',
    nodeId: '1883:3564',
  },
  {
    name: 'attribution',
    size: 36,
    lineHeight: '1.5em',
    letterSpacing: '0',
    weight: 400,
    style: 'Regular',
    role: 'The pull-quote attribution, at 50% ink.',
    nodeId: '1683:2144',
  },
  {
    name: 'numeral',
    size: 36,
    lineHeight: '31.29px',
    letterSpacing: '-0.0262em',
    weight: 400,
    style: 'Regular',
    role: 'The 01/02/03 rail beside the ways-to-work column — the active numeral is reversed out of a 48px ink chip.',
    nodeId: '1744:1786',
  },
  {
    name: 'narrative',
    size: 28,
    lineHeight: '1.2em',
    letterSpacing: '-0.0286em',
    weight: 400,
    style: 'Regular',
    role: 'The case-study problem statement inside the card, white on the scrim.',
    nodeId: '1883:3562',
  },
  {
    name: 'lead',
    size: 24,
    lineHeight: '1.2em',
    letterSpacing: '-0.0333em',
    weight: 400,
    style: 'Regular',
    role: 'The standfirst paragraph beside a section headline, and the CTA subhead.',
    nodeId: '1762:2123',
  },
  {
    name: 'body-lg',
    size: 24,
    lineHeight: '27.9px',
    letterSpacing: '0',
    weight: 400,
    style: 'Regular',
    role: 'Platform descriptions and perspectives-card titles — same size as `lead`, but tracked normally and set tighter.',
    nodeId: '1762:2133',
  },
  {
    name: 'platform',
    size: 24,
    lineHeight: 'normal',
    letterSpacing: '-0.0333em',
    weight: 500,
    style: 'Medium',
    role: 'The platform rail labels (Sanity, …); inactive entries drop to 50% opacity.',
    nodeId: '1762:2138',
  },
  {
    name: 'button',
    size: 18,
    lineHeight: '24px',
    letterSpacing: '0',
    weight: 500,
    style: 'Medium',
    role: 'Every button label, both sizes, both fills.',
    nodeId: '1868:3262',
  },
  {
    name: 'eyebrow-lg',
    size: 18,
    lineHeight: '1.2em',
    letterSpacing: '0.1em',
    weight: 700,
    style: 'Bold',
    uppercase: true,
    role: 'The section eyebrow ("OUR PARTNERS") — NEUTRAL #636363, not brand red.',
    nodeId: '1864:2392',
  },
  {
    name: 'eyebrow',
    size: 16,
    lineHeight: '1.2em',
    letterSpacing: '0.1em',
    weight: 700,
    style: 'Bold',
    uppercase: true,
    role: 'The case-study card category ("HEALTHCARE"), white on the scrim.',
    nodeId: '1883:3561',
  },
  {
    name: 'stat-label',
    size: 16,
    lineHeight: 'normal',
    letterSpacing: '0',
    weight: 400,
    style: 'Regular',
    role: 'The unit beside a stat ("NRR"), at 65% white.',
    nodeId: '1883:3565',
  },
  {
    name: 'nav-header',
    size: 14,
    lineHeight: 'normal',
    letterSpacing: '0.07em',
    weight: 600,
    style: 'SemiBold',
    uppercase: true,
    role: 'Footer link-group headers — the one flat use of brand red on the page.',
    nodeId: '1680:2104',
  },
  {
    name: 'nav-link',
    size: 14,
    lineHeight: 'normal',
    letterSpacing: '0',
    weight: 400,
    style: 'Regular',
    role: 'Footer navigation links, white.',
    nodeId: '1680:2105',
  },
  {
    name: 'meta',
    size: 13,
    lineHeight: '1.2em',
    letterSpacing: '0.1em',
    weight: 700,
    style: 'Bold',
    uppercase: true,
    role: 'The perspectives-card meta row ("3 MINS · 7/27/26").',
    nodeId: '1683:2490',
  },
  {
    name: 'legal',
    size: 12,
    lineHeight: '14px',
    letterSpacing: '0',
    weight: 400,
    style: 'Regular',
    role: 'The footer legal row.',
    nodeId: '1680:2121',
  },
]

/* ── Layout ────────────────────────────────────────────────────────────────── */

/**
 * The page gutter is 96px (Figma `Section/section-margin-left`), giving a
 * 1248px content column at the 1440px design width — not the prototype's
 * 24px gutter and 1240px max-width.
 */
export const layout = {
  designWidth: 1440,
  gutter: 96,
  contentWidth: 1248,
} as const

export interface SectionRhythmSpec {
  section: string
  padding: string
  gap: string
  surface: string
  nodeId: string
}

/**
 * Section padding is asymmetric and hand-tuned per band — there is no single
 * `--spacing-section-y` equivalent. 128px and 192px do most of the work.
 */
export const sectionRhythm: readonly SectionRhythmSpec[] = [
  {
    section: 'Partners / intro',
    padding: '96px 96px 128px',
    gap: '96px',
    surface: '#F0F0F0',
    nodeId: '1864:2390',
  },
  {
    section: 'Case studies — heading',
    padding: '96px 96px 0',
    gap: '64px',
    surface: 'surface-wash',
    nodeId: '1683:2657',
  },
  {
    section: 'Case studies — cards',
    padding: '96px',
    gap: '48px',
    surface: 'surface-wash-angled',
    nodeId: '1683:2661',
  },
  {
    section: 'Pull quote',
    padding: '192px 96px',
    gap: '128px',
    surface: '#F0F0F0',
    nodeId: '1683:2137',
  },
  {
    section: 'Platforms',
    padding: '128px 96px 192px',
    gap: '128px',
    surface: '#FFFFFF',
    nodeId: '1762:2149',
  },
  {
    section: 'Perspectives',
    padding: '96px 0',
    gap: '48px',
    surface: '#F0F0F0',
    nodeId: '1683:2467',
  },
  {
    section: 'Footer',
    padding: '96px 96px 16px',
    gap: '128px',
    surface: '#030303',
    nodeId: '1680:2096',
  },
]

/**
 * The spacing steps the frame actually uses, in order. 8 and 12 are bound to
 * Figma element-padding variables; 128 is `Layout/Layout 128`.
 */
export const spacingScale = [4, 8, 12, 16, 20, 24, 32, 48, 64, 96, 128, 164, 192] as const

/**
 * Element padding, as Figma variables — the button paddings below are built
 * from these.
 */
export const elementPadding = {
  none: 0,
  xxs: 4,
  xs: 8,
  s: 12,
  l: 20,
} as const

/* ── Radius ────────────────────────────────────────────────────────────────── */

/**
 * The exploration is SQUARE. Buttons, case-study cards, perspectives cards
 * and media frames all carry radius 0 — against the prototype's 6px buttons
 * and 16px cards. The only curves on the page are the 5.8px inner chip of the
 * carousel control and the 787.77px lozenge masking a card pattern, both of
 * which are shapes rather than a corner style.
 */
export const radius = {
  button: 0,
  card: 0,
  media: 0,
  /** Figma variable `radius-small` — declared in the file, unused on Home. */
  declaredSmall: 4,
  /** Icon / Soft, the inner chip of the 58px carousel control. */
  iconChip: 5.8,
} as const

/* ── Button ────────────────────────────────────────────────────────────────── */

/**
 * Figma component set `Button / Solid` (136:754). Two sizes × two fills, a
 * trailing `arrow_forward` from Material Symbols Outlined at 20px, and no
 * radius. The label is 18/24 Figtree Medium in every combination.
 */
export const button = {
  sizes: {
    /** Size=Base — hero, CTA band, in-card. */
    base: { padding: '8px 20px', gap: 8 },
    /** Size=Large — section headers, platform cards. */
    large: { padding: '12px 20px', gap: 8 },
  },
  fills: {
    /** On light bands. */
    dark: { background: '#0A0A0A', label: '#FFFFFF' },
    /** On ink bands and over card scrims. */
    light: { background: '#FFFFFF', label: '#0A0A0A' },
  },
  label: { size: 18, lineHeight: '24px', weight: 500, style: 'Medium' },
  icon: { family: 'Material Symbols Outlined', glyph: 'arrow_forward', size: 20 },
  radius: 0,
  nodeId: '1868:3262',
} as const

/* ── Drift ─────────────────────────────────────────────────────────────────── */

export interface DriftSpec {
  concern: string
  /** What @o3/tailwind-config ships today (from the HTML prototype). */
  current: string
  /** What the Figma exploration specifies. */
  figma: string
  /** What adopting the Figma value would cost. */
  impact: string
}

/**
 * Every place the two generations disagree. This is the adoption decision —
 * nothing here has been applied to the token package.
 */
export const drift: readonly DriftSpec[] = [
  {
    concern: 'Display weight',
    current: '300 (Light), baked into every text-display-* / text-hero token',
    figma: '400 (Regular) at every display size',
    impact: 'Retunes every heading on the site. One-line change per type token.',
  },
  {
    concern: 'Type scale',
    current:
      'Fluid clamps — text-hero clamp(2.6rem, 4.6vw, 4.8rem), display-xl clamp(38px, 5vw, 72px)',
    figma: 'Fixed px ramp at 1440: 64 / 60 / 48 / 36 / 28 / 24 / 18 / 16 / 14 / 13 / 12',
    impact:
      'Figma specifies desktop only, so the responsive story has to be re-derived rather than read off. Keeping the clamps and re-anchoring their max values is the cheaper path.',
  },
  {
    concern: 'Display line-height',
    current: '1.05 (display-xl) → 1.3 (display-md)',
    figma: '1.2em nearly everywhere',
    impact: 'Loosens the largest headings, tightens the smallest.',
  },
  {
    concern: 'Corner radius',
    current: '--radius-btn 6px, --radius-card 16px',
    figma: '0 on buttons, cards, and media',
    impact: 'Cosmetic but pervasive — 25 call sites across rounded-btn / rounded-card.',
  },
  {
    concern: 'Eyebrow',
    current: '12px / 0.14em / 700, brand red (tone="brand" is the default)',
    figma: '16–18px / 0.1em / 700, neutral #636363; brand red appears only in the footer',
    impact:
      'Changes the loudest recurring accent on the page. 52 eyebrow call sites, and the Eyebrow component’s default tone would flip from brand to muted.',
  },
  {
    concern: 'Light surface',
    current: 'bone #EFEEEC, flat',
    figma: '#F0F0F0, and often a wash to white rather than flat',
    impact:
      'The hex shift is imperceptible; the wash is not. Needs SectionShell to accept a gradient surface.',
  },
  {
    concern: 'Dark surface',
    current: 'ink #030303 for bands, ink-soft #0A0A0B lifted',
    figma: '#0A0A0A carries the ink weight; #030303 survives mainly in gradient stops',
    impact: 'Effectively swaps which of the two darks is the default.',
  },
  {
    concern: 'Copy on dark',
    current: 'Solid greys — fg-inverse-muted #A4A4A4',
    figma: 'White at alpha — 0.92 / 0.65 / 0.6',
    impact: 'Alpha composites over the photography behind it; solid grey does not.',
  },
  {
    concern: 'Section rhythm',
    current: 'One token — clamp(120px, 14vw, 200px) vertical, 24px gutter',
    figma: 'Hand-tuned asymmetric padding per band (96/128/192 top-bottom), 96px gutter',
    impact:
      'The single-token model cannot express it. Either SectionShell grows a rhythm variant or the design accepts one value.',
  },
  {
    concern: 'Container',
    current: '1240px (section) / 1100px (content)',
    figma: '1248px — the 1440 design width less two 96px gutters',
    impact: '8px. Adopt or ignore.',
  },
  {
    concern: 'Button',
    current: '15px / 600 label, 6px radius, brand-red default fill',
    figma: '18px / 500 label, square, solid #0A0A0A or #FFFFFF — no red button on the page',
    impact:
      'The brand variant is the Button component’s default; the exploration never uses a red button.',
  },
  {
    concern: 'Gradients',
    current: 'None — the prototype has no gradient fills',
    figma: 'Seven, including background-clipped statement text and the brand glow',
    impact: 'ADOPTED — the one purely additive part. See tokens/gradient.css.',
  },
]

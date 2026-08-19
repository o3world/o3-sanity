import type { SVGProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@o3/ui/lib/utils'

/**
 * The lockup's geometry, per layout — exported from the `O3XO` component set
 * (`4212:374`, Logos canvas `4212:229`), which is the source of record for
 * this mark.
 *
 * `word` is "O3"; `mark` is "XO" — the four-pointed star and the ring, the
 * mark proper. They are held apart because the Color axis paints them apart:
 * `2 color` is a white word beside an accent mark.
 *
 * The plate is a box around the same drawing, so its inset is derived rather
 * than declared: half the difference on each axis, which is the 40 a side the
 * kit's own padding sets.
 */
const LAYOUTS = {
  /** `4212:373`, 390.85 × 120; plated, `4212:385` at 471 × 200. */
  horizontal: {
    box: { width: 391, height: 120 },
    plate: { width: 471, height: 200 },
    word: [
      'M0 59.9971C0 87.5654 22.4333 110 50 110C77.5667 110 100 87.5712 100 59.9971C100 32.4231 77.5725 10 50 10C22.4275 10 0 32.4288 0 59.9971ZM79.8707 59.9971C79.8707 76.4665 66.4742 89.8753 50 89.8753C33.5258 89.8753 20.1294 76.4723 20.1294 59.9971C20.1294 43.522 33.5316 30.1247 50 30.1247C66.4684 30.1247 79.8707 43.522 79.8707 59.9971Z',
      'M138.344 110C132.649 110 127.505 109.171 122.912 107.514C118.319 105.764 114.461 103.324 111.338 100.193C108.307 96.9705 106.194 93.1952 105 88.8674L122.361 83.7569C123.004 84.8619 123.877 86.2431 124.979 87.9006C126.081 89.4659 127.597 90.8011 129.526 91.9061C131.455 93.011 133.981 93.5635 137.104 93.5635C141.697 93.5635 145.326 92.3204 147.99 89.8343C150.745 87.256 152.123 83.9411 152.123 79.8895C152.123 77.1271 151.434 74.6869 150.056 72.5691C148.678 70.4512 146.428 68.8398 143.305 67.7348C140.273 66.5378 136.278 65.9392 131.317 65.9392H125.53V50.4696H131.317C137.747 50.4696 142.524 49.3646 145.647 47.1547C148.77 44.9448 150.332 41.9061 150.332 38.0387C150.332 35.8287 149.781 33.849 148.678 32.0994C147.576 30.3499 146.015 28.9687 143.994 27.9558C141.973 26.9429 139.63 26.4365 136.967 26.4365C135.221 26.4365 133.43 26.7587 131.593 27.4033C129.756 27.9558 128.056 28.9226 126.495 30.3039C125.025 31.593 123.831 33.4807 122.912 35.9668L105.827 30.8563C107.113 26.3444 109.317 22.5691 112.441 19.5304C115.656 16.3996 119.468 14.0516 123.877 12.4862C128.286 10.8287 132.833 10 137.518 10C143.489 10 148.862 11.151 153.639 13.453C158.415 15.663 162.182 18.7477 164.937 22.7072C167.693 26.6667 169.071 31.2247 169.071 36.3812C169.071 41.4457 167.647 45.7735 164.8 49.3646C162.044 52.8637 158.324 55.6722 153.639 57.7901C158.967 60.2762 163.192 63.5912 166.315 67.7348C169.438 71.7864 171 76.5746 171 82.0994C171 87.9006 169.484 92.919 166.453 97.1547C163.422 101.298 159.426 104.475 154.466 106.685C149.505 108.895 144.132 110 138.344 110Z',
    ],
    mark: [
      'M254.568 59.996L296 120L236 78.5732L176 120L217.432 59.996L176 -7.62939e-06L236 41.4268L296 -7.62939e-06L254.568 59.996Z',
      'M290.847 59.9971C290.847 87.5654 313.281 110 340.847 110C368.414 110 390.847 87.5712 390.847 59.9971C390.847 32.4231 368.42 10 340.847 10C313.275 10 290.847 32.4288 290.847 59.9971ZM370.718 59.9971C370.718 76.4665 357.322 89.8753 340.847 89.8753C324.373 89.8753 310.977 76.4723 310.977 59.9971C310.977 43.522 324.379 30.1247 340.847 30.1247C357.316 30.1247 370.718 43.522 370.718 59.9971Z',
    ],
  },
  /**
   * `4212:435`, 139.24 square — the SVG export rounds its box out to 140 × 141
   * and that is the box these paths are drawn in. Plated, `4212:413` at 200
   * square.
   */
  stacked: {
    box: { width: 140, height: 141 },
    plate: { width: 200, height: 200 },
    word: [
      'M5.08536 33.7224C5.08536 51.948 19.9161 66.7796 38.1406 66.7796C56.3651 66.7796 71.1958 51.9518 71.1958 33.7224C71.1958 15.4931 56.3689 0.66911 38.1406 0.66911C19.9123 0.66911 5.08536 15.4969 5.08536 33.7224ZM57.8882 33.7224C57.8882 44.6104 49.0318 53.475 38.1406 53.475C27.2494 53.475 18.393 44.6142 18.393 33.7224C18.393 22.8307 27.2533 13.9737 38.1406 13.9737C49.028 13.9737 57.8882 22.8307 57.8882 33.7224Z',
      'M101.171 66.3921C97.4412 66.3921 94.0721 65.8507 91.064 64.7678C88.056 63.6247 85.5292 62.0304 83.4837 59.9849C81.4984 57.8793 80.1146 55.4126 79.3325 52.585L90.7031 49.2461C91.1242 49.968 91.6957 50.8704 92.4177 51.9533C93.1396 52.9761 94.1323 53.8484 95.3957 54.5704C96.6591 55.2923 98.3135 55.6533 100.359 55.6533C103.367 55.6533 105.743 54.8411 107.488 53.2167C109.293 51.5322 110.195 49.3664 110.195 46.7193C110.195 44.9144 109.744 43.3202 108.842 41.9364C107.939 40.5527 106.465 39.4999 104.42 38.778C102.435 37.9959 99.8175 37.6048 96.5688 37.6048H92.7786V27.4977H96.5688C100.78 27.4977 103.909 26.7757 105.954 25.3319C108 23.888 109.022 21.9026 109.022 19.3759C109.022 17.932 108.661 16.6385 107.939 15.4954C107.217 14.3524 106.195 13.4499 104.871 12.7882C103.548 12.1264 102.013 11.7955 100.269 11.7955C99.1257 11.7955 97.9525 12.0061 96.7493 12.4272C95.5461 12.7882 94.4331 13.4199 93.4103 14.3223C92.4478 15.1645 91.6657 16.3979 91.064 18.0222L79.874 14.6833C80.7163 11.7353 82.1601 9.26871 84.2056 7.28338C86.3113 5.23789 88.808 3.70377 91.6957 2.68102C94.5835 1.59812 97.5615 1.05666 100.63 1.05666C104.54 1.05666 108.06 1.80868 111.188 3.31272C114.316 4.75659 116.783 6.77201 118.588 9.35896C120.393 11.9459 121.295 14.9239 121.295 18.2929C121.295 21.6018 120.363 24.4294 118.498 26.7757C116.693 29.0619 114.256 30.8968 111.188 32.2805C114.677 33.9049 117.445 36.0707 119.49 38.778C121.536 41.4251 122.559 44.5535 122.559 48.1632C122.559 51.9533 121.566 55.2322 119.581 57.9996C117.595 60.7069 114.978 62.7824 111.73 64.2263C108.481 65.6702 104.961 66.3921 101.171 66.3921Z',
    ],
    mark: [
      'M48.4452 107.274L69.9452 138.411L38.8098 116.914L7.67427 138.411L29.1743 107.274L7.67427 76.1402L38.8098 97.6376L69.9452 76.1402L48.4452 107.274Z',
      'M68.6531 107.274C68.6531 125.499 83.4839 140.331 101.708 140.331C119.933 140.331 134.764 125.503 134.764 107.274C134.764 89.0444 119.937 74.2204 101.708 74.2204C83.4801 74.2204 68.6531 89.0482 68.6531 107.274ZM121.456 107.274C121.456 118.162 112.6 127.026 101.708 127.026C90.8172 127.026 81.9607 118.166 81.9607 107.274C81.9607 96.3819 90.821 87.5249 101.708 87.5249C112.596 87.5249 121.456 96.3819 121.456 107.274Z',
    ],
  },
} as const

/**
 * Figma axis `Color`, on the word — one cva per painted part, because the axis
 * moves two inks at once and an SVG paints per element.
 *
 * `#030303` is a literal on purpose: it is the kit's logo black
 * (`VariableID:4212:299`), and O3XO's palette has no role at that value —
 * `ink` is #111827 and `ink-deep` is #000000.
 */
const wordVariants = cva('', {
  variants: {
    color: {
      twoColor: 'fill-white',
      white: 'fill-white',
      black: 'fill-[#030303]',
    },
  },
  defaultVariants: { color: 'twoColor' },
})

/** The same axis on the XO mark, where `2 color` earns its name. */
const markVariants = cva('', {
  variants: {
    color: {
      twoColor: 'fill-accent',
      white: 'fill-white',
      black: 'fill-[#030303]',
    },
  },
  defaultVariants: { color: 'twoColor' },
})

/**
 * The same axis on the plate — the surface each ink needs behind it. `#E5E7EB`
 * is `surface-muted`'s value, but the plate is the kit's own fill
 * (`VariableID:4404:4546`) rather than a surface role this mark resolves.
 */
const plateVariants = cva('', {
  variants: {
    color: {
      twoColor: 'fill-[#030303]',
      white: 'fill-[#030303]',
      black: 'fill-[#e5e7eb]',
    },
  },
  defaultVariants: { color: 'twoColor' },
})

export interface O3xoMarkProps
  extends
    Omit<SVGProps<SVGSVGElement>, 'color' | 'width' | 'height'>,
    VariantProps<typeof wordVariants> {
  /** Figma axis `Layout`. */
  layout?: keyof typeof LAYOUTS
  /** Figma axis `Background` — the plate is part of the mark, not of the chrome around it. */
  background?: boolean
  /**
   * Rendered height in px, of whatever box is drawn — the lockup's, or the
   * plate's when there is one. Width follows the box's proportion, because a
   * horizontal lockup squeezed into a square is a different logo.
   */
  height?: number
}

/**
 * O3XO's brand mark — the word O3XO, "O3" beside the star-and-ring "XO".
 *
 * It lives in this app rather than in `packages/ui` because its 2-color
 * variant paints the mark in `accent`, a role only O3XO's token package
 * declares; a shared component naming it renders yellow on an O3 page, which
 * `brand-token-seam.test.ts` fails the suite over (#222, ADR 0028). The app
 * hands this to the shared chrome and to its own hero binding (#228).
 *
 * Decorative: every call site puts it inside a link or a lockup that carries
 * the accessible name.
 */
export function O3xoMark({
  layout = 'horizontal',
  color,
  background = false,
  height = 64,
  className,
  ...rest
}: O3xoMarkProps) {
  const geometry = LAYOUTS[layout]
  const box = background ? geometry.plate : geometry.box
  const inset = {
    x: (geometry.plate.width - geometry.box.width) / 2,
    y: (geometry.plate.height - geometry.box.height) / 2,
  }

  return (
    <svg
      width={Math.round(((height * box.width) / box.height) * 100) / 100}
      height={height}
      viewBox={`0 0 ${box.width} ${box.height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={cn('block shrink-0', className)}
      {...rest}
    >
      {background ? (
        <rect width={box.width} height={box.height} className={plateVariants({ color })} />
      ) : null}
      <g transform={background ? `translate(${inset.x} ${inset.y})` : undefined}>
        {geometry.word.map((d, i) => (
          <path key={`word-${i}`} d={d} className={wordVariants({ color })} />
        ))}
        {geometry.mark.map((d, i) => (
          <path key={`mark-${i}`} d={d} className={markVariants({ color })} />
        ))}
      </g>
    </svg>
  )
}

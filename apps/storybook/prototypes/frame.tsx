/**
 * Renders one page of a captured prototype in an iframe, under a strip that
 * says what it is and — more importantly — what it isn't.
 *
 * The label is not decoration. A prototype in the Storybook sidebar sits two
 * clicks from the real component set, and Storybook's whole affordance is
 * "this is the current system". These pages are neither current nor the
 * system: Figma is the design source of record (AGENTS.md → Design source of
 * record, map #33). Every frame therefore carries its date and its status.
 */
export type PrototypeFrameProps = {
  /** Directory name under `apps/storybook/prototypes/` — also the URL segment. */
  set: string
  /** File within the set, e.g. `index.html`. */
  page: string
  /** Human name for this page, used as the iframe's accessible title. */
  label: string
  /** When the artifact was captured, e.g. `July 2026`. */
  captured: string
}

export function PrototypeFrame({ set, page, label, captured }: PrototypeFrameProps) {
  // Root-relative: `staticDirs` in .storybook/main.ts mounts each set at
  // `/prototypes/<set>`, so this resolves the same in `storybook dev` and in
  // the built static bundle.
  const src = `/prototypes/${set}/${page}`

  return (
    <div className="flex h-screen flex-col">
      <div className="border-line text-fg-muted flex shrink-0 items-center gap-3 border-b bg-white px-4 py-2 text-xs">
        <span className="text-fg font-medium">{label}</span>
        <span>Captured {captured}</span>
        <span>Snapshot — not a source of record</span>
        <a href={src} target="_blank" rel="noreferrer" className="text-fg ml-auto underline">
          Open standalone ↗
        </a>
      </div>
      <iframe src={src} title={`${label} prototype`} className="min-h-0 flex-1 border-0" />
    </div>
  )
}

/**
 * Shared `parameters` for every prototype story.
 *
 * Prototype stories are not in the test run: each meta carries
 * `tags: ['!test']`, because a story that mounts nothing but an iframe of a
 * frozen capture has nothing of this repo's to fail. `a11y.test` is off for
 * the same captures because axe traverses same-origin iframes, so a prototype
 * story run as a test would report the artifact's own violations as this
 * repo's. These are frozen captures we do not edit — fixing them would mean
 * editing a historical record. Components keep the rule.
 */
export const prototypeParameters = {
  layout: 'fullscreen',
  a11y: { test: 'off' },
} as const

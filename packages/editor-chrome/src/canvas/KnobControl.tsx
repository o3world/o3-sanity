import type { ComponentType } from 'react'
import type { ResolvedKnob } from '@o3/block-spec'

import { viewportShiftX } from './dock'
import { OptionGlyph, type OptionGlyphs } from './OptionGlyph'

/**
 * ONE KNOB ON THE HOVER BAR — a trigger that says what the value is now, and a
 * menu of the values it could be.
 *
 * Fully controlled, so everything it shows is a prop and a test can render it
 * open. The one thing it decides is which option carries the check mark, and it
 * decides that from `current` — the SAME `resolveKnobValue` result the trigger
 * label reads. Every surface reading one resolution is what stops the trigger
 * and the check mark from disagreeing about what is set.
 */

/** The menu's own ground. Near-black rather than the bar's orange: the menu is
 *  a list to read, and a saturated fill behind eight rows of small text is not.
 *  It is still Studio chrome, so it is a literal colour and not a brand token —
 *  same argument as `CanvasToolbarView`. Shared with the knob menu (#110), so
 *  the two menus on this canvas are visibly one kind of thing. */
export const MENU_COLOR = '#1c1917'

/**
 * Slide an opened dropdown back inside the viewport, measured.
 *
 * #109 shipped this as a fixed right-alignment rule and flagged it: correct
 * while the bar is docked at the band's right corner, wrong the moment the bar
 * CLAMPS near the left edge, where right-alignment opens the menu leftwards off
 * the band. A panel pushed outside the iframe is not merely clipped — the
 * pointer reaching for it leaves the frame, the overlay drops the hover, and
 * the menu closes under the cursor.
 *
 * A transform rather than a repositioned `right`, so the class-driven alignment
 * stays the layout and this stays a correction on top of it. Measured once when
 * the panel mounts: the bar's horizontal dock is scroll-invariant, so nothing
 * that happens afterwards moves it sideways.
 */
function clampIntoViewport(el: HTMLDivElement | null): void {
  const win = el?.ownerDocument.defaultView
  if (!el || !win) return
  const shift = viewportShiftX(el.getBoundingClientRect(), win.innerWidth)
  el.style.transform = shift === 0 ? '' : `translateX(${shift}px)`
}

export interface KnobControlProps {
  knob: ResolvedKnob
  /** Is this knob's menu the open one? The bar owns that, so only one can be. */
  open: boolean
  onToggle: () => void
  onPick: (value: string) => void
  /** Name → drawing, for a knob whose options describe themselves as glyphs. */
  glyphs?: OptionGlyphs
}

export function KnobControl({ knob: resolved, open, onToggle, onPick, glyphs }: KnobControlProps) {
  const { knob, current } = resolved
  // `KnobIcon` is structural — `(props: never) => unknown` — because
  // `@o3/block-spec` has zero dependencies and cannot name `react`. Narrowing
  // it to a component is this package's job, and this is where it happens.
  const Icon = knob.icon as ComponentType<{ className?: string }> | undefined

  // The trigger says the AXIS as well as the value. Labelling it with the
  // value alone is what the prior art shipped and had to undo: three controls
  // in a row all reading "Default" name nothing, and two neighbouring knobs
  // whose values truncate to the same word ("Full width" / "Full") read as
  // duplicates of each other.
  const label = `${knob.title}: ${current.title}${current.isDefault ? ' (inherited)' : ''}`

  return (
    <div className="relative flex">
      <button
        type="button"
        data-testid="canvas-knob"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={knob.description ? `${label} — ${knob.description}` : label}
        className="flex items-center gap-1 px-2 py-1 hover:bg-white/15 focus:bg-white/15 focus:outline-none"
      >
        {Icon ? <Icon className="h-3 w-3 shrink-0" /> : null}
        <span className="text-[9px] font-semibold uppercase tracking-wide opacity-75">
          {knob.title}
        </span>
        {/* Dimmed when inherited. "Unset" and "explicitly the default" draw the
            same page, so the title is the default's own either way — this is
            the only thing on the bar that says which one an editor is looking
            at. */}
        <span
          data-testid="canvas-knob-value"
          className={`max-w-24 truncate text-[11px] font-semibold ${
            current.isDefault ? 'opacity-70' : ''
          }`}
        >
          {current.title}
        </span>
        <span aria-hidden="true" className="text-[8px] opacity-75">
          ▾
        </span>
      </button>
      {open ? (
        // `pt-1` and not a margin, for the same reason the bar spaces itself
        // with padding: the overlay drops the hover the moment the pointer
        // crosses ground that is not chrome, and a margin here is a strip the
        // pointer cannot survive on its way down into the menu.
        //
        // Right-aligned by default, because the bar is docked at the BAND's
        // top-right corner — and then CLAMPED by measurement, because that
        // default stops being right the moment the bar itself clamps near the
        // left edge of the viewport.
        <div
          ref={clampIntoViewport}
          data-testid="canvas-knob-menu"
          role="menu"
          aria-label={knob.title}
          className="absolute right-0 top-full z-10 pt-1"
        >
          <div
            style={{ background: MENU_COLOR }}
            className="min-w-36 rounded-[3px] py-1 text-white shadow-md"
          >
            {knob.options.map((option) => {
              const checked = option.value === current.value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={checked}
                  onClick={() => onPick(option.value)}
                  className={`flex w-full items-center gap-1.5 whitespace-nowrap px-2 py-1 text-left text-[11px] hover:bg-white/15 focus:bg-white/15 focus:outline-none ${
                    checked ? 'font-semibold' : ''
                  }`}
                >
                  <span aria-hidden="true" className="w-2.5 shrink-0 text-[9px]">
                    {checked ? '✓' : ''}
                  </span>
                  <OptionGlyph knob={knob} value={option.value} glyphs={glyphs} />
                  <span className="grow">{option.title}</span>
                  {option.value === knob.initialValue ? (
                    <span className="text-[9px] italic opacity-60">default</span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

import type { ReactNode } from 'react'

import { cn } from '../lib/utils'

/**
 * The wiring a control needs to be announced correctly — handed to the render
 * prop rather than left for each call site to reassemble. Every one of these
 * has been a real bug in a hand-rolled form: a label pointing at nothing, an
 * error nobody hears, a required field a screen reader calls optional.
 */
export interface FormFieldControl {
  id: string
  name: string
  required: boolean
  /**
   * Alongside the native `required`, not instead of it. The native attribute
   * is the one browsers act on; `aria-required` is the one that survives a
   * form submitted with `noValidate`, and it is what the live Gravity form
   * this replaces already emits.
   */
  'aria-required': boolean
  'aria-invalid': boolean
  /** The note and/or the error, whichever exist — space-separated ids. */
  'aria-describedby': string | undefined
}

export interface FormFieldProps {
  /** Doubles as the control's `name`; ids are derived from it. */
  name: string
  label: string
  required?: boolean
  /** Quieter line under the label — what to type, not why. */
  note?: string
  /** The validation message. Its presence IS the invalid state. */
  error?: string
  /** Extra classes on the field wrapper (the grid cell it occupies). */
  className?: string
  children: (control: FormFieldControl) => ReactNode
}

/**
 * The shared control skin: a white box with a hairline round it, radius 6.
 *
 * Figma 2960:7799: 44px control, 15px horizontal padding and 16/20 text.
 * The field label is 14/20 above it; the mobile frame keeps those dimensions.
 *
 * Exported because the three controls a form draws (`input`, `textarea`,
 * `select`) are native elements, not components — there is nothing to wrap
 * them in that would earn its own file, and native is the accessible default
 * on a phone.
 *
 * The colours are fixed rather than `currentColor`: `2960:7794` puts every
 * control inside a white card, so there is no dark ground for the roles to
 * invert against.
 */
export const FIELD_CONTROL_CLASS =
  'w-full rounded-[6px] border border-line bg-white px-[15px] py-[11px] text-[16px]/5 text-fg transition-colors duration-(--duration-hover) ease-out placeholder:text-fg-muted hover:border-fg-muted focus:border-fg focus:outline-none focus-visible:outline-none aria-[invalid=true]:border-brand'

/**
 * One labelled control: label, optional note, the control itself, and the
 * validation message beneath it.
 *
 * **A render prop, not `children`**, because the accessible name and the
 * error announcement are the whole point of the component. Passing an
 * `<input>` in as an ordinary child would leave the caller to repeat `id`,
 * `aria-invalid` and `aria-describedby` on every field, which is exactly the
 * repetition that goes stale one field at a time.
 *
 * The required marker is an asterisk plus an off-screen word: the asterisk
 * is the convention sighted users read, and on its own it is punctuation a
 * screen reader may or may not voice. `aria-required` on the control carries
 * the state; this carries the label.
 */
export function FormField({
  name,
  label,
  required = false,
  note,
  error,
  className,
  children,
}: FormFieldProps) {
  const id = `field-${name}`
  const noteId = note ? `${id}-note` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [noteId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('relative flex flex-col gap-2', className)}>
      {/* Figma 2960:7798: Figtree 600 14/20, 8px above the control. */}
      <label htmlFor={id} className="text-fg text-[14px]/5 font-semibold">
        {label}
        {required ? (
          <>
            <span aria-hidden="true"> *</span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </label>

      {note ? (
        <p id={noteId} className="text-legal text-current/60">
          {note}
        </p>
      ) : null}

      {children({
        id,
        name,
        required,
        'aria-required': required,
        'aria-invalid': Boolean(error),
        'aria-describedby': describedBy,
      })}

      {/* Out of flow, in the 24px gap below every field, so an error never
          moves the layout. The gap holds one 14px line, so messages must fit
          on one line at the narrowest column. */}
      <p id={errorId} role="alert" className="text-legal text-brand absolute left-0 top-full mt-1">
        {error}
      </p>
    </div>
  )
}

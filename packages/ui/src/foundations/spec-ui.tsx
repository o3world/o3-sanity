/**
 * Presentation helpers for the `Foundations/` stories.
 *
 * Not part of the design system — these render the extracted Figma spec
 * (figma-home-spec.ts) as browsable reference pages, so they are deliberately
 * plain and are not exported from the package index.
 *
 * Not a `.stories.tsx` file, so Storybook's glob ignores it.
 */
import type { ReactNode } from 'react'

import { cn } from '../lib/utils'

/** A Foundations page: title, standfirst, and stacked sections. */
export function Page({
  title,
  intro,
  children,
}: {
  title: string
  intro: ReactNode
  children: ReactNode
}) {
  return (
    <div className="text-fg bg-white font-sans">
      <div className="mx-auto max-w-[1100px] px-10 py-16">
        <header className="border-line mb-16 border-b pb-10">
          <p className="eyebrow text-fg-subtle mb-4">O3DX visual exploration</p>
          <h2 className="text-[44px] font-normal leading-[1.15] tracking-[-0.02em]">{title}</h2>
          <div className="text-fg-muted mt-5 max-w-[68ch] text-[17px] leading-[1.6]">{intro}</div>
        </header>
        <div className="flex flex-col gap-16">{children}</div>
      </div>
    </div>
  )
}

/** One titled block within a page. */
export function Section({
  title,
  note,
  children,
}: {
  title: string
  note?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-[24px] font-normal leading-[1.2] tracking-[-0.01em]">{title}</h3>
        {note ? (
          <p className="text-fg-muted max-w-[68ch] text-[15px] leading-[1.6]">{note}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

/**
 * A callout for the things a reader would otherwise get wrong — e.g. that a
 * value on the page is NOT what the token package ships.
 */
export function Callout({ children }: { children: ReactNode }) {
  return (
    <p className="border-brand text-fg bg-bone/60 max-w-[72ch] border-l-2 py-3 pl-5 text-[15px] leading-[1.6]">
      {children}
    </p>
  )
}

/** Monospace value chip — hexes, tokens, CSS. */
export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <code className={cn('font-mono text-[12.5px] tabular-nums tracking-tight', className)}>
      {children}
    </code>
  )
}

/** A bordered table. Headers carry scope so the a11y pass stays clean. */
export function SpecTable({
  columns,
  children,
}: {
  columns: readonly string[]
  children: ReactNode
}) {
  return (
    <div className="border-line overflow-x-auto border">
      <table className="w-full border-collapse text-left text-[14px]">
        <thead>
          <tr className="border-line bg-bone/50 border-b">
            {columns.map((c) => (
              <th
                key={c}
                scope="col"
                className="text-fg px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em]"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

/** A table row; every cell aligns to the top so long prose doesn't center. */
export function Row({ children }: { children: ReactNode }) {
  return (
    <tr className="border-line border-b last:border-b-0 [&>td]:px-4 [&>td]:py-3">{children}</tr>
  )
}

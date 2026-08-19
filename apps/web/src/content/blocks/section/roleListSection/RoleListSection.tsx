import { DisplayHeading, Eyebrow, SectionShell } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { fieldAttr } from '@o3/content-runtime/data-attribute'

import { Mark, markProps } from '@/content/blocks/base/mark/Mark'
import { ButtonLink } from '@/content/ButtonLink'
import { resolveSurface } from '@/content/blocks/surface'

type RoleListSectionProps = SectionProps<'roleListSection'>

/**
 * Section block: the About frame's Careers band (`1925:6061`) — #56.
 *
 * ```
 * 128px 0, gap 65
 *   header  padding-left 96, gap 8   18px eyebrow | 48px heading in 486
 *   rows    padding 0 96
 *     row   48px 0, space-between, 1px hairline at rgba(0,0,0,0.55)
 *       left   disc 70 | eyebrow 16px at 60% ink · title 36px in 521
 *       right  Button / Solid Size=Large, "Apply" + arrow_forward
 * ```
 *
 * **#46 asked whether Careers is a section of About or its own route. The
 * frame answers section**, and this block is that answer: the rows live on the
 * About document, not behind `/careers`.
 *
 * The first row carries no top padding in the frame — the header's 65px gap
 * already sets it off — so the rule is drawn under every row and the top pad
 * skipped on the first.
 *
 * ⚠️ The frame's Apply buttons are `Button / Solid Size=Large` with the fill
 * **overridden on the instance** to `#D3D3D3` (`--color-surface-muted`). That
 * is an instance override, not a variant of the component set, so it is
 * recorded here rather than added as a fourth `button.variant` — the same call
 * `docs/figma-components.md` makes about the rest of `Button`'s divergence.
 * The fill stays the editor's, via `button.variant`.
 */
export function RoleListSection({ eyebrow, heading, roles, surface, loc }: RoleListSectionProps) {
  const items = roles ?? []
  const onInk = resolveSurface(surface, 'roleListSection') === 'ink'

  return (
    <SectionShell surface={resolveSurface(surface, 'roleListSection')} top="md" bottom="md">
      <div className="flex flex-col gap-10 lg:gap-16">
        {eyebrow || heading ? (
          <header data-sanity={fieldAttr(loc, 'heading')} className="flex flex-col gap-2">
            {eyebrow ? <Eyebrow size="lg">{eyebrow}</Eyebrow> : null}
            {heading ? <DisplayHeading className="lg:max-w-121.5">{heading}</DisplayHeading> : null}
          </header>
        ) : null}

        <ul className="flex flex-col">
          {items.map((role) => (
            <li
              key={role._key}
              className="flex flex-col gap-6 border-b border-[rgba(0,0,0,0.55)] pb-8 pt-8 first:pt-0 sm:flex-row sm:items-center sm:justify-between lg:gap-8 lg:pb-12 lg:pt-12 lg:first:pt-0"
            >
              <div className="flex items-center gap-8">
                <Mark {...markProps(role.mark)} onInk={onInk} className="w-17.5" />
                <div className="flex flex-col justify-center gap-2">
                  {role.eyebrow ? (
                    // 16px/0.1em bold at 60% ink — `--text-eyebrow` in
                    // `--color-fg-quiet`'s register, which is why this is
                    // `Eyebrow` with a tone the cva set does not carry.
                    <Eyebrow className="text-fg-quiet">{role.eyebrow}</Eyebrow>
                  ) : null}
                  {role.heading ? (
                    <DisplayHeading as="h3" level="lg" className="tracking-[-0.0222em]">
                      {role.heading}
                    </DisplayHeading>
                  ) : null}
                </div>
              </div>
              {role.button ? (
                <div className="shrink-0">
                  <ButtonLink button={role.button} size="large" />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  )
}

// Its own subpath, not the barrel: `@sanity/icons` v5 dropped PresentationIcon
// from the root entry (the icon still exists) and leaves a `never`-typed
// deprecation stub behind, so the barrel import typechecks and fails at runtime.
import { PresentationIcon } from '@sanity/icons/Presentation'
import type { DocumentActionComponent, SanityDocument } from 'sanity'
import { useRouter } from 'sanity/router'

import { DEFAULT_PRESENTATION_TOOL_NAME } from '../paths'
import type { EditorChromeOptions, PreviewPathDoc } from './options'

/**
 * "Open in Presentation" — the door back out of structure mode.
 *
 * The mirror image of Presentation's own `openInStructure` field action, and
 * built the same way on purpose: **navigate by intent, never by URL**. Inside
 * the Studio the router owns the address bar, so `navigateIntent('edit', …)`
 * lets Sanity pick the tool and encode the state; hand-building
 * `/studio/presentation/...` would fight it. `presentationHref` is for links
 * from outside the Studio, where there is no router to ask.
 *
 * Three of the intent params are load-bearing (`sanity@6.8`,
 * `getIntentState` + `canHandleEditIntent` in `sanity/presentation`):
 *
 * - `mode: 'presentation'` is what makes Presentation win. Both tools return a
 *   bare `true` for an edit intent carrying only `id` and `type`, and the
 *   winner of a tie is whichever sits earlier in the resolved `tools` array —
 *   so without a mode this action would land in whichever tool happened to be
 *   first. With it, structure scores 0 and Presentation scores 1.
 * - `presentation: <toolName>` addresses *this* Presentation tool, for a
 *   Studio that registers more than one.
 * - `preview` is the page to load in the preview frame. It survives as a
 *   search param (`preservedSearchParamKeys`) and defaults to `/` if omitted,
 *   which is the wrong page every time but the first.
 */
export function createOpenInPresentationAction(
  options: EditorChromeOptions,
): DocumentActionComponent {
  const toolName = options.presentationToolName ?? DEFAULT_PRESENTATION_TOOL_NAME

  const OpenInPresentation: DocumentActionComponent = ({
    id,
    type,
    draft,
    published,
    onComplete,
  }) => {
    const { navigateIntent } = useRouter()

    // The draft is what an editor is looking at, so it decides the URL: a slug
    // edited but not yet published should preview at its new address.
    const previewPath = options.previewPath({ _type: type, slug: readSlug(draft ?? published) })

    return {
      icon: PresentationIcon,
      label: 'Open in Presentation',
      disabled: previewPath === null,
      title:
        previewPath === null
          ? 'Give this document a slug and it gets a page to preview'
          : undefined,
      onHandle: () => {
        if (previewPath === null) return
        navigateIntent('edit', {
          id,
          type,
          mode: 'presentation',
          presentation: toolName,
          preview: previewPath,
        })
        onComplete()
      },
    }
  }

  OpenInPresentation.displayName = 'OpenInPresentation'
  return OpenInPresentation
}

/** `SanityDocument` is an open record, so the slug arrives as `unknown`. */
function readSlug(doc: SanityDocument | null): PreviewPathDoc['slug'] {
  const slug = (doc as { slug?: unknown } | null)?.slug
  if (typeof slug !== 'object' || slug === null) return null
  return slug as { current?: string }
}

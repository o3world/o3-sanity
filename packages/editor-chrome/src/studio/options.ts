/**
 * What a host project has to tell this plugin: which documents have URLs, and
 * how to build one.
 *
 * Kept apart from the plugin itself so the action can import the shape without
 * importing `sanity` — a plugin module pulls the whole Studio barrel in with
 * it, and the type is all a consumer's `sanity.config.ts` needs to name.
 */

/** The shape a routable document is read as — the raw Studio value, not a projection. */
export interface PreviewPathDoc {
  _type: string
  slug?: { current?: string } | null
}

export interface EditorChromeOptions {
  /** Document types that get the "Open in Presentation" action (`ROUTABLE_TYPES`). */
  types: readonly string[]
  /**
   * The site path this document is served at, or `null` when it has none yet.
   *
   * `null` is the honest answer for a document whose slug is still empty — the
   * action goes disabled rather than sending an editor to a page that will
   * 404. Reuse the app's own link builder here; a second route table is a
   * second place for the URLs to drift.
   */
  previewPath: (doc: PreviewPathDoc) => string | null
  /** The presentation tool's route name, if the Studio renamed it. */
  presentationToolName?: string
}

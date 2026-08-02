# Research: how skills and the Sanity MCP reach Claude Desktop today

Resolves [#65](https://github.com/o3world/o3-sanity/issues/65). Parent map: [#63](https://github.com/o3world/o3-sanity/issues/63).

Researched 2026-08-02 against primary sources only: Anthropic help center / claude.com for Claude
Desktop and Skills; sanity.io/docs (including dated changelog entries through July 2026) for the
Sanity MCP server. Question 3 was verified **empirically** against this project's deployed schema
(`naorcr6k` / `production`) through the live `mcp.sanity.io` server.

---

## 1. Skills in Claude Desktop

**Delivery is account-level ZIP upload through Claude's settings UI — not filesystem, not per-device.**

- Skills are available on Free, Pro, Max, Team, and Enterprise plans and require **code execution
  to be enabled** (Settings > Capabilities). Custom skills are uploaded at **Customize > Skills**
  ("Upload a skill") as a **ZIP file**.
- Packaging: the ZIP must contain the skill folder **as its root** (not nested), the folder name
  must match the skill name, and the folder must contain a `skill.md` (SKILL.md) with YAML
  frontmatter: `name` (max 64 chars) and `description` (max 200 chars). The description is what
  Claude uses to decide when to invoke the skill.
- A skill **may be a directory**, not just a single file: additional reference files (e.g.
  `REFERENCE.md`), executable scripts (Python, Node.js), and resource folders (logos, fonts,
  assets) are explicitly supported. Dependencies must be pre-installed in the execution
  environment; skills cannot install packages at runtime.
- **Update story: manual re-upload of the modified ZIP.** There is no documented auto-sync from a
  repo. Two distribution paths beyond self-upload: (a) Team/Enterprise owners can **provision
  skills org-wide** via Organization Settings > Skills; (b) users can **share skills** with
  colleagues — shared skills appear grayed out until enabled, and when the creator updates a
  shared skill, "recipients automatically get the updated version."
- **Desktop-specific caveat (honest finding):** the help-center articles describe the claude.ai
  settings surface and list claude.ai web, Microsoft 365 add-ins, Claude Code, and the API — they
  do **not** name the Desktop app explicitly. Skills are account-scoped settings that the Desktop
  app shares with claude.ai (same Customize > Skills surface), and Anthropic's connector directory
  material treats web/desktop/mobile as one "Claude apps" surface, but there is no documented
  Desktop-only installation mechanism. The filesystem path (`~/.claude/skills/`,
  `.claude/skills/`) is **Claude Code only**.

Sources:

- https://support.claude.com/en/articles/12512180-use-skills-in-claude
- https://support.claude.com/en/articles/12512198-how-to-create-custom-skills
- https://support.claude.com/en/articles/13119606-provision-and-manage-skills-for-your-organization

## 2. Sanity MCP in Claude Desktop

**Sanity ships an official connector in Claude's connector directory; underneath it is the hosted
remote MCP server at `https://mcp.sanity.io`.**

- The official listing at https://claude.com/connectors/sanity supports **Claude web, Desktop,
  mobile, Claude Code, and the API**. Install from the directory (or add as a custom connector
  with the URL), then authenticate. Sanity's MCP server hit GA as a remote server on
  **2025-12-11 (v2.6.0)**, and a Claude Desktop / claude.ai connection bug was explicitly fixed in
  **v2.8.0 (2025-12-19)** — Desktop support is deliberate, not incidental.
- **Auth:** OAuth by default — you log in with your Sanity account and tool calls act as you, with
  your role/permissions; OAuth sessions typically expire after ~7 days. Alternatively a Sanity API
  token via an `Authorization: Bearer sk...` header (Claude's custom-connector dialog supports up
  to four request headers); with a token, calls are scoped to that token's role. Note: Claude
  web/Desktop custom connectors connect **from Anthropic's cloud infrastructure**, not the local
  machine — fine here because `mcp.sanity.io` is public.
- **Scoping:** project and dataset are **not pinned at connect time**. Every content tool takes a
  `resource: {projectId, dataset}` parameter per call; what you can actually reach is bounded by
  the OAuth user's (or token's) permissions. Discovery tools (`list_organizations`,
  `list_projects`, `list_datasets`) let the agent find the right resource.
- **Tools exposed** (same remote server on every client, per sanity.io/docs/ai/mcp-server):
  schema — `get_schema`, `list_workspace_schemas`, `deploy_schema`, `deploy_studio`; content —
  `query_documents` (GROQ), `get_document`, `create_documents`, `create_version`,
  `patch_documents`, `publish_documents`, `unpublish_documents`, `discard_drafts`,
  `version_discard`; releases — `create_release`, `list_releases`; images — `generate_image`,
  `transform_image` (consume Sanity AI credits); search — `semantic_search`,
  `list_embeddings_indices`; project admin — `list_organizations`, `list_projects`,
  `create_project`, `get_project_studios`, `add_cors_origin`, `list_datasets`, `create_dataset`,
  `update_dataset`, `whoami`, `run_sanity_cli`; guidance — `search_docs`, `read_docs`,
  `list_sanity_rules`, `get_sanity_rules`, `give_sanity_feedback`. Sanity notes the set "may vary
  as we release updates."

Sources:

- https://www.sanity.io/docs/ai/mcp-server (current; changelog entries dated through 2026-07-23)
- https://claude.com/connectors/sanity
- https://www.sanity.io/docs/changelog/f3d7ca92-1183-48db-80be-26d026337e1e.md (v2.8.0, Claude Desktop fix)
- https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp

## 3. Schema surface: does `get_schema` carry `description` strings?

**Yes — empirically confirmed against this repo's deployed schema, with one important shape caveat.**

Verified 2026-08-02 via the live `mcp.sanity.io` server against `naorcr6k`/`production`:

- `get_schema` **without** a `type` argument returns a compact overview (type names, field
  names/types, reference graph) — **no descriptions**.
- `get_schema` with a specific `type` (tested `heroSection`) returns full field definitions
  including the **verbatim `description` strings** from our schema source — e.g. the `variant`
  field came back with "Orbital is the Home opener — the full sphere band with the bone dome.
  Band is the interior-page hero…" exactly as written in
  `packages/sanity/src/schemas/blocks/section.ts`. Also surfaced: validation rules
  (required/min/max), `options.list` values, `initialValue`, conditional `hidden`, and titles.
- Requesting an unknown type returns an error that **lists all valid type names**, so type
  discovery is robust even from the error path.

Implication: **schema descriptions can carry per-block AI guidance** — the map's hybrid
architecture bet holds. But the guidance is only visible after a **per-type** `get_schema` call;
an agent that stops at the overview never sees it. Any skill we ship should instruct Claude to
fetch the full type definition for each section type before authoring it.

Sources: live tool calls (this session); tool contract at https://www.sanity.io/docs/ai/mcp-server

## 4. Write capabilities from Desktop: drafts via MCP

**Draft creation and patching are first-class and draft-safe by design; the sharp edges are
portable text (JSON-only now) and assets (reference-only, no upload).**

- `create_documents` creates **drafts** (`drafts.*`) by default; pass `releaseId` to create
  release versions (`versions.<releaseId>.*`) instead. Content is structured JSON matching the
  schema. Bulk creation in one call.
- `patch_documents` applies `@sanity/client` patch operations — `set`, `setIfMissing`, `unset`,
  `inc`, `dec`, `insert` (before/after/replace with `_key` selectors), `diffMatchPatch` — up to
  25 documents per call, transactional per document (all patches succeed or fail together), with
  optional `ifRevisionId` optimistic locking. **Published content is never modified directly**:
  patching a published ID edits/creates the draft. Publishing is a separate explicit step
  (`publish_documents`); deletion is deliberately two-step (`unpublish_documents` then
  `discard_drafts`).
- **Portable text:** authored as raw portable-text JSON in `create_documents`/`patch_documents`
  content. The Markdown convenience tools (`create_documents_from_markdown`,
  `patch_document_from_markdown`, added v2.9.0 on 2026-01-08) were **removed in v2.21.0
  (2026-06-10)** in the "streamlined document tools" consolidation — don't design around them.
- **Assets:** image fields must reference an **existing asset document ID**
  (`{"asset": {"_type": "reference", "_ref": "image-..."}}`). There is **no file-upload tool** in
  the MCP server. Existing image assets are queryable via GROQ
  (`query_documents` on `sanity.imageAsset`), so "pick from the media library" works;
  "upload this new image" from Desktop does not, except via `generate_image` /
  `transform_image` (async AI generation, consumes Sanity AI credits).
- v2.8.0 (2025-12-19) specifically improved draft-reference normalization and image-array
  handling in patches.

Sources:

- https://www.sanity.io/docs/ai/mcp-server (tool contracts, verified against live tool schemas this session)
- https://www.sanity.io/docs/changelog/1eedb392-7826-4227-8648-951d1dfb6875.md (v2.9.0)
- https://www.sanity.io/docs/changelog/b5f403cd-020c-48d7-84b1-63fcb5e6b482.md (v2.21.0, Markdown tools removed)
- https://www.sanity.io/docs/changelog/f3d7ca92-1183-48db-80be-26d026337e1e.md (v2.8.0)

## 5. Recent Sanity AI guidance that changes the picture

- **Sanity rules are served through the MCP itself**: `list_sanity_rules` / `get_sanity_rules`
  expose ~24 best-practice rules (`schema`, `groq`, `portable-text`, `page-builder`, `migration`,
  `image`, `nextjs`, …). Any Desktop session with the connector already has baseline Sanity
  authoring guidance available without us shipping it.
- **Official Sanity agent skills** exist in the open Agent Skills format (agentskills.io):
  `npx skills add sanity-io/agent-toolkit` (dev best practices, content modeling, SEO,
  migration — the MCP's old `migration_guide` tool was removed in favor of the
  `sanity-migration` skill). These target filesystem-based clients (Claude Code, Cursor); for
  Desktop they'd need to be zipped and uploaded like any custom skill.
- **Sanity Context** (sanity.io/docs/ai/sanity-context + sanity-context-patterns) is a newer,
  separate hosted MCP surface: schema-aware **read-only** access to one dataset at
  `api.sanity.io/v2026-03-03/agent-context/<project>/<dataset>/<slug>`, configured by a **Context
  document in Studio** holding `instructions` and a `groqFilter`. Sanity's stated best practice:
  "The schema tells the agent what fields exist. The instructions tell it how your business
  actually uses them" — i.e. Sanity now officially endorses **Studio-editable agent guidance as
  content**, complementary to schema descriptions. Aimed at embedded/site assistants rather than
  Desktop editing, but the pattern is directly relevant to where our per-block guidance lives.
- Recommended agent patterns from the same doc: keep behavior/voice in the system prompt and
  retrieval/domain guidance in instructions; low tool counts route better; structural scoping
  (filters) beats prompt-only scoping.

Sources:

- https://www.sanity.io/docs/ai/skills
- https://www.sanity.io/docs/ai/sanity-context-patterns
- https://www.sanity.io/docs/ai/mcp-server

## What this changes for the map (#63)

- **The core bet holds.** Per-block AI guidance in schema `description` strings does reach a
  Desktop-connected agent through `get_schema` — verbatim, with validation and option lists as a
  bonus. Nothing contradicts the hybrid architecture.
- **One shape constraint:** descriptions only appear on **per-type** `get_schema` calls, never in
  the overview. The skill must explicitly direct Claude to fetch each section type's full
  definition before authoring it, or the guidance is silently invisible.
- **Skill delivery to Desktop is the weak link, not MCP.** It's a manual ZIP upload per account
  (or org-wide provisioning on Team/Enterprise — we're not there). No repo-to-Desktop sync
  exists; skill updates mean re-upload. The map should treat the Desktop skill as a
  low-churn artifact and keep volatile guidance in schema descriptions (deploy-time) rather than
  in the skill (upload-time).
- **Portable text must be authored as JSON** — the Markdown authoring tools are gone (v2.21.0).
  Any body-copy authoring flow in the map should assume raw portable-text JSON via
  `create_documents`/`patch_documents`.
- **No asset upload from Desktop.** Image workflows are: reference existing assets (queryable via
  GROQ) or AI-generate (`generate_image`, costs credits). If the map assumed "drop an image into
  the chat and it lands in Sanity," that path doesn't exist today.
- **Watch Sanity Context.** Studio-editable `instructions` as an official guidance channel is a
  credible future complement (or competitor) to schema-description guidance — read-only today,
  so it doesn't replace the Desktop editing story, but it's the same idea Sanity is now blessing.

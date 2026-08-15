---
name: o3-authoring
description: Draft or revise o3world.com content in Sanity — insights (blog posts), case studies, and pages. Use whenever asked to write, draft, or edit O3 World site content from an idea or notes.
---

# O3 authoring

Turn a vague idea into a publishable-quality Sanity **draft** in the O3 voice.
This skill is a bootstrap: the knowledge lives in Sanity, not here. Fetch it
before writing.

This skill owns o3world.com site copy. If a plain-technical-English editing
skill is also installed, it is for engineering prose — READMEs, commits, docs —
and its register is not the brand's; the voice guide you fetch below wins on
anything that reaches the site.

The Sanity tools arrive via the Sanity MCP server (Claude Code, preconfigured
by this plugin) or the Sanity connector (Claude Desktop) — the workflow is
identical. If no Sanity tools are available, stop and say so: in Claude Code
run `/mcp` to authenticate the `sanity` server; in Desktop connect the
connector. Auth is always the human's own — never ask for tokens.

Every Sanity tool call uses `resource: {projectId: "naorcr6k", dataset: "production"}`.

## Before writing anything

1. **Fetch the live guidance.** Query `*[_type == "guidance"]{key, title, body}`
   with the query tool. `body` is raw markdown — read it as written.
   `key == "o3-voice"` is the voice guide: follow it over your defaults, every
   time. `key == "o3-brand"` is the brand foundation behind it — source
   material for claims, never copy to paste. `key == "o3-slop"` is the machine
   tells the voice guide's revision pass sends you to; read it before you
   revise, and read it first when the job is auditing a draft rather than
   writing one. If no guidance documents exist, say so and stop — never
   improvise the voice.
2. **Fetch the schema per type.** Before authoring any document type or
   section block, call `get_schema` for that **specific type**. The no-type
   overview omits field descriptions, and the descriptions carry required
   authoring guidance. Never compose a section you haven't fetched.
3. **Fetch exemplars.** Query 1–2 recently published documents of the same
   type as reference for structure and register. Content migrated from
   WordPress predates the current voice — treat it as subject-matter
   reference, never as a voice model.

## Hard rules

- **Drafts only.** `create_documents` (drafts by default) and
  `patch_documents`. Never `publish_documents`, `unpublish_documents`,
  `discard_drafts`, or schema/project admin tools. A human publishes in
  Studio.
- **Never invent facts.** Real names, numbers, outcomes, and quotes come from
  the human. For case studies, interview until you have them; gaps stay gaps
  and go in the handoff summary.
- **Imagery:** reference existing image assets (query
  `*[_type == "sanity.imageAsset"]` with filters) when one genuinely fits;
  otherwise leave the field empty and list what's needed in the handoff
  summary. Never call `generate_image`.
- **Portable text is raw JSON** — build block arrays by hand to match the
  schema; there are no markdown convenience tools.

## Workflow

1. **Intake.** Ask the two or three questions that pin down audience, the one
   point the piece makes, and which content type fits.
2. **Outline in chat.** Get a nod before touching Sanity.
3. **Draft.** Create the document as a draft. Slugs are lowercase-hyphenated;
   check for collisions first.
4. **Iterate.** Share the draft's path (e.g. `/insights/{slug}`) for
   preview, and apply reactions with `patch_documents`.
5. **Hand off.** End with a summary: what was created (document ID and path),
   imagery needed per empty slot, facts still unverified, and anything the
   human must do before publishing.

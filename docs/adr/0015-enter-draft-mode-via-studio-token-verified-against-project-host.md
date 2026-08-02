# 0015. Enter draft mode via the Studio's localStorage token, verified against the project host

- **Status:** Accepted
- **Date:** 2026-08-02
- **Deciders:** nicklewisatx + Claude
- **Related:** issue #60, `apps/web/src/sanity/draftModeRoutes.ts`, `apps/web/src/sanity/draftPreview.ts`

## Context

The preview switcher (#60) lets an editor flip any site page between published and draft content without going through the Presentation tool. Draft mode exposes every unpublished document in the dataset, so it must never be enabled on the browser's say-so — but the repo has no site auth system, so the only credential an editor holds is their session with the embedded Studio at `/studio`. The switcher needed a way to turn "has a Studio session" into a server-verified authorization.

## Decision

We will enable draft mode only via a `POST` to `/api/draft-mode/enable` carrying the token the same-origin embedded Studio stores in `localStorage` (`__studio_auth_token_<projectId>`), which the route verifies server-side against the **project-scoped** users endpoint `https://<projectId>.api.sanity.io/<apiVersion>/users/me`. The check requires `response.ok` **and** a non-empty `id` **and** a non-empty `roles[]`, and fails closed on anything unexpected. Leaving draft mode (`GET /api/draft-mode/disable`) is deliberately unauthenticated — it only ever shows the caller less — with `?to=` sanitised to a same-origin path.

## Alternatives considered

### A next-sanity primitive

- **Pros:** Supported surface; survives Studio-internals changes; less code to own.
- **Cons:** No such primitive exists in next-sanity 13.2. `defineEnableDraftMode`'s `GET` requires a `sanity-preview-secret` that only the Presentation tool can mint, and `next-sanity/hooks` offers no session-detection or enable helper for a plain site tab.
- **Why not:** The primitive we'd want doesn't exist; the closest one is structurally tied to Presentation.

### Verify against the global `api.sanity.io` users/me

- **Pros:** No per-project host construction; one well-known endpoint.
- **Cons:** Returns `200` for _any_ Sanity user anywhere — identity, not membership of this project. Worse, an **unauthenticated** request returns `200 {}` rather than a 401, so a naive `response.ok` check fails open (verified live against project `naorcr6k`).
- **Why not:** It cannot answer the actual question ("may this caller read this project's drafts?"), and its response shape invites a fail-open bug. The project host rejects a foreign token with `SIO-401-AWH "Session does not match project host"`, which is exactly the membership check needed.

## Consequences

- **Positive:** Editors get one-click draft preview on any page with zero cost to anonymous visitors (a single localStorage read, no network, no extra scripts). Forged, expired, or foreign-project tokens get a 401 and no cookie. The disable path works with no JavaScript.
- **Negative:** We depend on Studio internals — the `__studio_auth_token_<projectId>` key is verbatim from `sanity@6.8.0`'s `getAuthTokenStorageKey()`. A Studio upgrade that changes it fails quiet (the chip stops offering itself); the key is pinned in one place (`draftPreview.ts`) with provenance.
- **Risks / open questions:** A cookie-authenticated standalone Studio (e.g. `*.sanity.studio`) leaves no localStorage token, so the switcher would never appear for its users — fine while the Studio stays embedded and same-origin. The `roles[]` requirement is belt-and-braces and was only tested with a robot token; if a legitimate editor is ever rejected, that is the condition to relax (it fails closed today).

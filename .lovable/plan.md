# Plan — AcidTest full site + Docs (MCP & CLI)

## Scope
Keep every existing section on `/` untouched (Hero, Marquee, Hunt, Protocol, LiveDemo, FinalCta, Footer) and `/playground` untouched. Add a new full **Docs** page with a prominent **MCP & CLI** section, and wire the nav so the whole site is browsable end-to-end.

## What changes

### 1. New route: `src/routes/docs.tsx`
Full-page docs, same dark carbon shell, PillNav on top, Footer at bottom. Sections in order:

1. **Docs Hero** — `§ 04 — Field Manual`, H1 "Operating the Acid Test", short kicker, jump links (Quickstart · CLI · MCP · Frameworks · API).
2. **Quickstart** — 3 folder-tab cards: Install → Authenticate → Generate first suite (each with a mini `CodeTyper`, reusing the existing component).
3. **CLI** — split layout:
   - Left: copy explaining `acidtest` CLI (init, generate, run, watch, ci), flag table (`--framework`, `--story`, `--out`, `--ci`, `--headed`).
   - Right: tabbed `CodeTyper` with three snippets (`npm i -g acidtest`, `acidtest generate "…user story…" --framework playwright`, `acidtest ci --report junit`). Tabs reuse the LiveDemo tab styling.
4. **MCP (Model Context Protocol)** — the headline new section:
   - Intro: what the AcidTest MCP server exposes (`generate_suite`, `list_frameworks`, `lint_story`, `explain_failure`) so Claude/Cursor/ChatGPT can drive test synthesis.
   - Two folder-tab cards side-by-side: **Connect from Claude Desktop** (JSON config snippet) and **Connect from Cursor / Codex** (URL + header snippet), each with copy button via `CodeTyper`.
   - Tool reference table: tool name · description · input · output (4 rows).
   - Callout strip with acid glow: "Bring your own MCP client — streams over HTTPS, OAuth 2.1".
5. **Frameworks** — 3 compact cards (Playwright / Cypress / Selenium) linking to `/playground`.
6. **API reference teaser** — one card with `POST /v1/suites` curl example.
7. Reuses existing `<FinalCta />` + `<Footer />`.

`head()` sets unique title/description/og for `/docs`.

### 2. Nav wiring — `src/components/site/PillNav.tsx`
Replace the placeholder `to: "/"` entries with real anchors so every section is reachable:
- Product → `/#top`
- Frameworks → `/#protocol`
- Pricing → `/#cta`
- Docs → `/docs`
- Playground → `/playground` (already correct)

Add matching `id` attributes to the existing section wrappers **only** where missing (`top` on Hero root, `protocol` on Protocol, `cta` on FinalCta). No visual changes.

### 3. Small shared bits
- New `src/components/site/DocsMcp.tsx`, `DocsCli.tsx`, `DocsQuickstart.tsx` under `src/components/site/` to keep `docs.tsx` clean.
- Reuse `CodeTyper`, `folder-tab`, `folder-tab-solid`, `label-mono`, `acid-glow`, section-gap rhythm already in `styles.css`. No new CSS tokens.

## Non-goals
- No backend, no real CLI, no real MCP server — snippets are illustrative copy.
- No edits to Hero, Marquee, Hunt, Protocol, LiveDemo, FinalCta, Footer internals, or `/playground`.
- No new fonts, colors, or animation primitives.

## Files
- add `src/routes/docs.tsx`
- add `src/components/site/DocsQuickstart.tsx`
- add `src/components/site/DocsCli.tsx`
- add `src/components/site/DocsMcp.tsx`
- edit `src/components/site/PillNav.tsx` (links only)
- edit `src/components/site/Hero.tsx`, `Protocol.tsx`, `FinalCta.tsx` (add anchor `id`s only)

## Acceptance
- `/docs` renders with all 6 sections; MCP section is the visual anchor with two config cards + tool table.
- PillNav links navigate to real sections/pages on every viewport.
- Landing page is byte-identical in behavior; no regressions in Hunt/LiveDemo animations.

# Plan — Threat Detection, auth wiring, Login page

## Scope
Add one new landing-page section ("Threat Detection"), a dedicated `/login` route with Google + GitHub buttons, and wire the "Start Free" CTAs to it. Enable Lovable Cloud, add a `profiles` table with an auto-create trigger, and register a lightweight auth listener. Every existing section (Hero, Marquee, Hunt, Protocol, LiveDemo, FinalCta, Footer, Docs, Playground) stays untouched.

## 1. Threat Detection section (client-side mock)

New component `src/components/site/ThreatDetection.tsx`, inserted on `/` **between LiveDemo and FinalCta** (keeps existing rhythm).

Layout: split panel inside a `folder-tab`.
- **Left — Test source picker**: two tabs
  - "Generated suite" — auto-loads the latest generated code from LiveDemo (via a tiny module-level cache in `generators.ts`, no state coupling), read-only preview.
  - "Paste your own" — editable textarea (font-mono, JetBrains) for user-supplied Playwright/Cypress/Selenium code, framework detected by a simple keyword sniff (`test(` / `describe(` / `cy.` / `By.`).
- **Right — Threat console**:
  - Acid "▶ Run threat scan" button (disabled while running).
  - Terminal-styled log area that streams synthesized lines with staggered `setTimeout` (60fps): `[00:00] loading harness…` → `[00:01] resolving 3 scenarios…` → per-scenario `PASS`/`FAIL` chips.
  - Summary bar at bottom: `3 scanned · 2 PASS · 1 FAIL · 480ms` with acid glow.
  - Deterministic mock: hash the input string → seeded RNG → stable pass/fail pattern (so the same code always yields the same verdict; feels real).
- Section id `#threat`, `§ 04 — Threat Detection` label, section spacing matches existing rhythm.
- `prefers-reduced-motion`: skip the stream, render final state.
- No backend, no persistence.

Add to `/docs` a short "Threat Detection" note under the frameworks section linking to `/#threat`.

## 2. Login page + auth

### Cloud + schema
- Enable Lovable Cloud (`supabase--enable`).
- Enable Google via `supabase--configure_social_auth` in the same turn.
- Migration:
  - `create table public.profiles (id uuid pk references auth.users on delete cascade, email text, display_name text, avatar_url text, created_at timestamptz default now())`
  - `GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated; GRANT ALL ... TO service_role;`
  - RLS enabled + policies: `select/update using auth.uid() = id`.
  - Trigger `handle_new_user()` (SECURITY DEFINER) on `auth.users` insert → inserts a profile row with email/display_name/avatar from `raw_user_meta_data`.

### `src/routes/login.tsx` (public, SSR-safe)
Full-viewport dark shell with a centered `folder-tab` card:
- Acid `§ 05 — Access` label, H1 "Enter the lab.", kicker copy.
- **Google button** — calls `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`.
- **GitHub button** — calls `supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: window.location.origin } })`. Include a small helper line: "GitHub requires enabling the provider in your Supabase dashboard → Authentication → Providers." (per Cloud limitations we already flagged).
- Optional email/password toggle (collapsed by default) — email + password, `signInWithPassword` + `signUp` with `emailRedirectTo: window.location.origin`.
- Error surface region.
- `head()` sets unique title + og.
- If already signed in (root context), redirect to `/` on mount.

### `src/routes/__root.tsx`
Add a single `supabase.auth.onAuthStateChange` listener filtered to `SIGNED_IN | SIGNED_OUT | USER_UPDATED` → `router.invalidate()` (+ `queryClient.invalidateQueries()` when not SIGNED_OUT). Do NOT introduce a `_authenticated/` layout — no route currently needs to be gated.

### CTA wiring (route to login)
- `PillNav.tsx` "Start Free" pill → `<Link to="/login">`.
- `FinalCta.tsx` "Start synthesizing →" → `<Link to="/login">`.
- Hero primary CTA (if it points to `#demo` as "Start" style) — leave hero's existing "Run the Acid Test" untouched; only change the top-nav "Start Free" and final CTA per user request.

### Signed-in affordance (required same-turn)
`PillNav.tsx` reads session from a tiny `useSession()` hook (`onAuthStateChange` + `getUser`). When signed in, the "Start Free" pill becomes an avatar chip with initials + a dropdown containing "Sign out" (calls `supabase.auth.signOut()` then navigates to `/`). Prevents the "clicked Sign in, nothing happens" bug.

## 3. "Build remaining sections"
Interpreting this as: make sure the whole product story reads end-to-end. Current landing already has Hero → Marquee → Hunt → Protocol → LiveDemo → FinalCta → Footer. The new Threat Detection slots between LiveDemo and FinalCta. Docs page keeps Quickstart → CLI → MCP → Frameworks → API → CTA. No additional sections are needed unless you name one — flag if you had something specific in mind (e.g. Pricing table, Testimonials, FAQ).

## Files
- add `src/components/site/ThreatDetection.tsx`
- add `src/hooks/use-session.ts`
- add `src/routes/login.tsx`
- add migration for `profiles` + trigger + RLS + grants
- edit `src/components/site/generators.ts` (export latest snapshot)
- edit `src/components/site/PillNav.tsx` (Start Free → /login, signed-in chip)
- edit `src/components/site/FinalCta.tsx` (CTA → /login)
- edit `src/routes/index.tsx` (insert `<ThreatDetection />`)
- edit `src/routes/__root.tsx` (auth listener + head unchanged)
- edit `src/routes/docs.tsx` (small "Threat Detection" link under Frameworks)

## Non-goals
- No `_authenticated/` subtree, no protected routes (nothing to protect yet).
- No real test execution — mock only.
- No changes to Hero, Marquee, Hunt, Protocol, LiveDemo internals, Playground, or existing Docs sections.
- Enabling the GitHub provider inside Supabase is a manual step for you after Cloud is enabled; the button ships wired correctly and shows a helpful message until you toggle it on.

## Acceptance
- `/login` renders with Google + GitHub (+ optional email) and redirects home on success.
- Signed-in user sees an avatar chip in the nav with working Sign out; sign-in state persists across reloads.
- New Threat Detection section appears on `/` between LiveDemo and FinalCta, streams a deterministic PASS/FAIL log for both generated and pasted code, and respects reduced motion.
- `profiles` row is created automatically on first sign-in for every provider.

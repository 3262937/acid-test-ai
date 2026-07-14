# AcidTest — Logo consistency + UX polish

## What I found

### 1. Logo is inconsistent
Three different treatments in the app right now:

| Location | Current | |
|---|---|---|
| Top nav (`PillNav.tsx`) | `Acid·Test` — bold, no italic, dot separator, plain ink color | ❌ off-brand |
| Login page (`login.tsx:110`) | `AcidTest` — italic, acid-green | ✅ matches your reference |
| Footer (`FinalCta.tsx:30`) | `AcidTest` — italic, acid-green | ✅ matches |
| 404 page | no wordmark | — |

Your uploaded screenshot confirms the italic acid-green `AcidTest` is the intended mark.

### 2. Smooth-UX issues worth fixing in the same pass
- No global smooth-scroll for the `#protocol` / `#pricing` hash links used by PillNav → jumps abruptly.
- Nav lacks a scrolled state (background stays the same translucency → hard to read over bright hero glow when scrolled).
- No shared `<Logo>` component, so any future tweak forces edits in 3 files (root cause of the drift).
- Focus rings missing on the round avatar button and pill nav links → keyboard users get no feedback.
- Reduced-motion is respected in Hero but not in `CodeTyper` scroll interval / marquee → good to align.

### 3. Remaining functional work still open from earlier turns
- GitHub OAuth: `/login` correctly disables the button and shows the amber banner, but there's no follow-up task tracked. Not code-actionable until you migrate — leave as-is.
- API keys + rate limit: shipped. No known gaps.
- No sitemap.xml / robots.txt yet (SEO polish, optional).

## Plan

### Step 1 — Create a single source of truth for the wordmark
New file `src/components/site/Logo.tsx`:

```tsx
// Renders the canonical italic acid-green AcidTest wordmark.
// size: "sm" (nav ~15px), "md" (login ~24px), "lg" (footer ~18px)
export function Logo({ size = "sm" }: { size?: "sm" | "md" | "lg" }) { … }
```

Uses `font-display font-bold italic text-acid tracking-tight` with size-driven `text-*` class. Wrapped in a `<span>` so callers control the surrounding `<Link>`.

### Step 2 — Swap the three call sites to `<Logo>`
- `PillNav.tsx:42-44` → `<Link to="/"><Logo size="sm" /></Link>`
- `routes/login.tsx:109-113` → `<Link to="/"><Logo size="md" /></Link>`
- `FinalCta.tsx:30` → `<Logo size="lg" />`

Result: every wordmark is italic acid-green `AcidTest`, matching your screenshot.

### Step 3 — Smooth-UX polish (small, presentation-only)
- `src/styles.css`: add `html { scroll-behavior: smooth; }` inside a `@media (prefers-reduced-motion: no-preference)` block so hash-link jumps glide.
- `PillNav.tsx`: add a `scrolled` state via `useEffect` + `scrollY > 24`, toggling a denser background class (`bg-[rgba(10,10,11,0.9)]` + a hairline border) for readability over the hero.
- Add `focus-visible:outline focus-visible:outline-2 focus-visible:outline-acid/60 focus-visible:outline-offset-2` to the avatar button and the pill nav links.

### Step 4 — Verify
- `bunx tsgo --noEmit`
- Playwright screenshot of `/`, `/login`, `/account` at 1280×1800 to confirm the wordmark is identical everywhere and the nav densifies on scroll.

## Out of scope (call out, don't do)
- GitHub OAuth wiring — blocked on your Supabase migration; the amber banner already communicates this.
- Sitemap/robots, favicon variants — separate SEO task if you want it later.
- Any backend / rate-limit changes — feature is already shipped.

## Files touched
- **New**: `src/components/site/Logo.tsx`
- **Edit**: `src/components/site/PillNav.tsx`, `src/components/site/FinalCta.tsx`, `src/routes/login.tsx`, `src/styles.css`

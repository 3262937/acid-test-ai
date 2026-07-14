## Goal

Two parallel tracks:
1. **Mirror the AcidTest project codebase to GitHub** via Lovable's built-in Git sync.
2. **Let signed-in users push generated test suites from the Playground / Saved tests page to a GitHub repo they own**.

---

## Track 1 — Project backup to GitHub (Lovable Git sync)

### What you do in the Lovable UI

Lovable handles the two-way sync; I cannot click the connection flow for you.

1. Open the project in the Lovable editor.
2. Click the **Plus (+)** menu in the chat input → **GitHub → Connect project**.
3. Authorize the Lovable GitHub App.
4. Pick the GitHub account/organization and create the repository.
5. Once connected, every commit I make in this editor pushes to GitHub and every GitHub push syncs back.

### What I will prepare in code

- `README.md` — project overview, stack, local dev commands, env vars needed.
- `LICENSE` — MIT license for the project.
- `.github/workflows/ci.yml` — build + typecheck on PR/push.
- Polish `.gitignore` if anything sensitive is missing.

These files make the exported repo useful and professional, but they do not trigger the sync itself.

---

## Track 2 — In-app "Push to GitHub" export

### 1. Connector setup

Link the workspace **GitHub API** connector to this project so server code can call the GitHub REST API through Lovable's gateway.

- Connector: `github` (gateway-backed).
- Required env vars after linking: `LOVABLE_API_KEY` + `GITHUB_API_KEY`.

### 2. Database schema

New `public.user_github_settings` table:

```text
id            uuid pk default gen_random_uuid()
user_id       uuid -> auth.users(id) on delete cascade
repo_full_name text  -- e.g. "myorg/acidtest-suites"
branch        text  -- default "main"
base_path     text  -- e.g. "tests/"
created_at    timestamptz default now()
updated_at    timestamptz default now()
```

- GRANT SELECT/INSERT/UPDATE/DELETE to `authenticated`.
- Enable RLS.
- Policy: users can only CRUD their own row (`auth.uid() = user_id`).

### 3. Server functions

Create `src/lib/github-export.functions.ts`:

- `getUserGitHubSettings()` — fetch or create the user's settings row.
- `saveUserGitHubSettings(data)` — update repo/branch/base_path.
- `pushTestToGitHub(data)` — authenticated only.
  - Inputs: `title`, `framework`, `code`, optional `filename`.
  - Reads settings; falls back to defaults.
  - Calls GitHub gateway `PUT /repos/{owner}/{repo}/contents/{path}` with a generated filename like `{slug}-{framework}.{ext}`.
  - Returns the GitHub HTML URL of the created file.

### 4. UI components

- `GitHubExportDialog` — reusable modal for:
  - Repo input (`owner/repo`).
  - Branch input (default `main`).
  - Base path input (default `acidtest-suites/`).
  - "Save settings" + "Push now" buttons.
  - Success state with a link to the created file/commit.
- Add a **GitHub** icon button next to **Save** in:
  - `src/components/site/LiveDemo.tsx`
  - `src/routes/playground.tsx`
  - `src/routes/saved.tsx` (per-test row)
- Show a toast on success with the commit URL.

### 5. Error handling

- If no connector is linked, show a message explaining the setup.
- Surface GitHub API errors (rate limit, permission, missing repo) in the dialog.

---

## Files to create / edit

### New files
- `README.md`
- `LICENSE`
- `.github/workflows/ci.yml`
- `src/lib/github-export.functions.ts`
- `src/components/site/GitHubExportDialog.tsx`
- `supabase/migrations/<timestamp>_add_user_github_settings.sql`

### Edited files
- `src/routes/playground.tsx` — add GitHub export button.
- `src/components/site/LiveDemo.tsx` — add GitHub export button.
- `src/routes/saved.tsx` — add per-test GitHub export button.
- `.gitignore` — review/polish.

---

## Out of scope

- GitHub OAuth per app user (the connector uses the workspace owner's token; if each end user needs their own repo access, that requires a separate OAuth flow — let me know if you want that instead).
- Automatic two-way sync of generated tests back into AcidTest.
- Branch/PR creation; first version commits directly to the configured branch.

---

## Open question before I start

For the in-app export, do you want the workspace GitHub connector to act on **your** GitHub account (the project owner), or do you need each AcidTest end user to authorize their own GitHub account? The first is faster; the second requires per-user OAuth and a different architecture.
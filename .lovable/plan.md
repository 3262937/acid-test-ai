# API Keys for CLI / MCP with Usage Metering

Let users mint personal API keys from the Account page, then use them from a CLI or MCP client to hit our HTTP API. Every request is metered.

## User flow

1. Signed-in user goes to **Account → API Keys**.
2. Clicks **Create key**, gives it a label (e.g. "laptop CLI").
3. Sees the full key **once** (`lv_live_...`) with a copy button. After that only the prefix + last 4 chars are visible.
4. Can revoke any key at any time.
5. A **Usage** panel shows requests in the last 24h / 7d / 30d, and per-key totals.

## Public API (what the key unlocks)

Two `/api/public/*` endpoints, authenticated by `Authorization: Bearer lv_live_...`:

- `GET  /api/public/v1/tests` — list caller's saved tests
- `POST /api/public/v1/tests` — save a new test (title, story, framework, code)

Each request:
- Verifies the key (hash lookup), rejects revoked/unknown keys with 401.
- Loads the owning `user_id`, scopes DB access to that user via service role.
- Increments `api_keys.last_used_at` and inserts a row into `api_usage`.

## Data model (new tables)

```text
api_keys
  id uuid pk
  user_id uuid  → auth.users
  label text
  prefix text            -- "lv_live_abcd" (shown in UI)
  last4 text             -- last 4 chars
  key_hash text unique   -- sha256(full key)
  created_at, last_used_at, revoked_at

api_usage
  id bigserial pk
  api_key_id uuid → api_keys
  user_id uuid
  endpoint text          -- "GET /v1/tests"
  status_code int
  created_at timestamptz
  -- indexed on (user_id, created_at) and (api_key_id, created_at)
```

RLS: users can `SELECT`/`INSERT`/`UPDATE` (revoke) their own `api_keys`; users can `SELECT` their own `api_usage`. All writes from the public API go through service role after the bearer token is verified.

## Server functions (signed-in users)

- `listApiKeys()` — rows for current user (never returns hash or full key).
- `createApiKey({ label })` — generates `lv_live_<32 random bytes base62>`, stores `sha256`, returns the plaintext exactly once.
- `revokeApiKey({ id })` — sets `revoked_at`.
- `getUsageSummary({ range })` — counts from `api_usage` for the current user.

## Public API routes

`src/routes/api/public/v1/tests.ts` — `GET` and `POST` handlers that:
1. Extract bearer token, sha256 it, look up in `api_keys` where `revoked_at is null`.
2. On miss → 401. On hit → run query as that `user_id` via service role.
3. Log to `api_usage`, bump `last_used_at`.

Rate limiting: soft cap of 60 req/min per key enforced by counting recent `api_usage` rows; over the cap returns 429.

## UI

- New section on `/account` (or a dedicated `/account/api-keys` route): keys table (label, prefix…last4, created, last used, Revoke) + "Create key" dialog + one-time reveal modal.
- Usage panel: three number cards (24h / 7d / 30d) and a small per-key breakdown table.

## Docs snippet

Short curl example on the same page:

```bash
curl https://<your-app>/api/public/v1/tests \
  -H "Authorization: Bearer lv_live_..."
```

## Out of scope for this pass

- No MCP server implementation yet — this delivers the HTTP API + keys that an MCP server (or CLI) would call. Wiring an actual MCP server can be a follow-up.
- No per-plan quotas / billing — metering only.
- No key rotation UI beyond "revoke + create new".

Approve and I'll build it.

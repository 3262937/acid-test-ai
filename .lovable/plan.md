
# Credits + Stripe Checkout

First feature in the roadmap. Users buy credit packs / subscribe on the Pricing page, Stripe handles the payment, a webhook credits their account, and the app shows their balance and deducts credits when they generate a test suite.

## Scope

- Turn on Lovable's built-in Stripe payments (no keys needed from you).
- Add a `credits` ledger backed by Supabase (balance + every debit/credit as a row).
- Wire the existing Pricing section buttons to real Stripe checkout sessions.
- Show current balance in the top nav after login.
- Deduct 1 credit per test-suite generation in Playground / LiveDemo.
- Success page (`/success`) already exists — repurpose as the post-checkout landing.

## User flow

```text
Pricing page → click "Buy" → Stripe Checkout (hosted) → pay
        ↓
   Stripe webhook → server route → insert credit_ledger row (+N)
        ↓
   /success page → shows "N credits added" + new balance
        ↓
   Playground "Generate" → server fn debits 1 credit → returns suite
```

## Database (one migration)

Three tables in `public`:

- **credit_packages** — catalog of what's for sale (name, stripe_price_id, credits, price_cents, kind: `one_time` | `subscription`, tier). Seeded with the 6 SKUs from the Pricing UI (3 tiers + 3 top-ups). Public SELECT.
- **credit_ledger** — append-only. Every purchase, monthly subscription grant, and generation debit is one row (user_id, delta, reason, stripe_event_id unique, metadata, created_at). RLS: user reads own rows; writes only via service role.
- **user_credits** — cached balance per user (user_id PK, balance int, updated_at). Kept in sync by a DB trigger on `credit_ledger`. RLS: user reads own.

Plus a `stripe_customers` table (user_id ↔ stripe_customer_id) so we can link webhook events back to users, and a `debit_credits(_amount, _reason)` SECURITY DEFINER function that atomically checks balance and inserts a debit (used by the Playground server fn).

## Payments setup

1. Run `recommend_payment_provider` to confirm Stripe fits (digital SaaS — expected to pass).
2. Enable seamless Stripe via `enable_stripe_payments` (test mode immediately, no API keys).
3. Create the 6 products/prices via the batch product tool that appears after enabling. Each gets a Stripe `tax_code` for SaaS.
4. Default tax handling: **full compliance handling** (`managed_payments`) — digital SaaS, best UX for global buyers.

## Server functions (`src/lib/billing.functions.ts`)

- `createCheckoutSession({ packageId })` — auth-required. Looks up the price, ensures a `stripe_customer` row for the user, creates a Stripe Checkout Session with `success_url=/success?session_id=...`, `cancel_url=/pricing`, returns `url`.
- `getMyCredits()` — auth-required. Reads `user_credits` for the current user.
- `debitCredit({ reason })` — auth-required. Calls the `debit_credits` RPC.

## Public webhook route (`src/routes/api/public/stripe/webhook.ts`)

- Verifies Stripe signature (raw body + `STRIPE_WEBHOOK_SECRET`).
- Handles `checkout.session.completed` (one-time top-up + first subscription payment) and `invoice.paid` (recurring monthly grants).
- Looks up the package by `price_id`, inserts a `credit_ledger` row with `stripe_event_id` for idempotency. Trigger updates the cached balance.
- Handles `customer.subscription.deleted` → mark subscription inactive (no more grants).

## UI changes

- **Pricing.tsx** — each "Get started / Choose" button becomes a form-submit that calls `createCheckoutSession` and redirects to Stripe.
- **PillNav.tsx** — when signed in, show a small pill on the right: `⚡ 42 credits`, links to Pricing.
- **success.tsx** — read `?session_id`, poll `getMyCredits()` for a couple seconds until the webhook lands, then show "N credits added, new balance: X".
- **LiveDemo / Playground "Generate" button** — before generating, call `debitCredit`; on `insufficient_credits`, show an inline toast "Out of credits" with a link to Pricing.

## Secrets

- `STRIPE_WEBHOOK_SECRET` — you'll add this after Stripe is enabled and I give you the webhook URL. I'll request it via the secret form at that step.
- Stripe API key itself is managed by Lovable (seamless integration).

## Technical notes

- Credits never expire in v1 (the UI copy says "expire after 12 months" — we'll leave that as a future job, not enforce it now).
- Ledger design means we can always recompute the true balance from history if the cache drifts.
- Webhook is idempotent via `unique(stripe_event_id)` — safe to receive duplicate events.
- All monetary amounts stored as integer cents.

## Out of scope (later features in your roadmap)

- Saving generated tests to a table (feature #2).
- Profile/account page (feature #3).
- API keys for CLI/MCP with usage metering (feature #4).
- Enabling GitHub OAuth in Supabase (feature #5).

## Build order

1. Migration for the 4 tables + trigger + `debit_credits` RPC.
2. `recommend_payment_provider` → `enable_stripe_payments`.
3. Create the 6 Stripe products.
4. Server fns + webhook route.
5. Wire Pricing buttons, nav balance pill, Playground debit, success page.
6. End-to-end test in Stripe test mode (card `4242 4242 4242 4242`).

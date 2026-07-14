# AcidTest

AI-powered test synthesis for QA engineers.

Paste a user story, pick a framework, and AcidTest breeds runnable test suites covering the happy path, invalid input, and edge cases. Supports 16+ multi-language QA frameworks including Playwright, Cypress, Selenium, Appium, Espresso, XCUITest, RestAssured, Postman, Robot Framework, Cucumber, JUnit, and TestNG.

## Stack

- **Frontend / framework**: [TanStack Start](https://tanstack.com/start) (React 19 + Vite 7)
- **Styling**: Tailwind CSS v4
- **Backend / auth / database**: Lovable Cloud (Supabase)
- **Payments**: Stripe
- **AI generation**: Lovable AI Gateway + optional BYO OpenAI / Anthropic keys
- **Deployment**: Cloudflare edge via Lovable

## Local development

Requirements:

- Node.js 20+ or Bun 1+
- A Lovable Cloud project with Supabase credentials

```bash
# Install dependencies
bun install

# Start the dev server
bun dev
```

The dev server runs at `http://localhost:8080`.

## Environment variables

The following variables are injected automatically by Lovable Cloud. For local development, copy them from your project settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `STRIPE_SANDBOX_API_KEY` / `STRIPE_WEBHOOK_SECRET` (for payments)
- `USER_API_KEY_ENC_SECRET` (for encrypting BYO AI keys)
- `LOVABLE_API_KEY` (for AI gateway and standard connectors)

Never commit secrets to the repository.

## Project structure

```text
src/
  components/site/   # Landing page sections and shared UI
  components/ui/     # shadcn/ui primitives
  hooks/             # React hooks (session, credits, profile, mobile)
  integrations/      # Supabase client, auth middleware, Lovable helpers
  lib/               # Server functions and shared utilities
  routes/            # TanStack file-based routes
  styles.css         # Tailwind v4 theme and custom tokens
supabase/migrations/ # Database migrations
```

## Scripts

| Script          | Description               |
| --------------- | ------------------------- |
| `bun dev`       | Start the Vite dev server |
| `bun build`     | Production build          |
| `bun build:dev` | Development build         |
| `bun lint`      | Run ESLint                |
| `bun format`    | Run Prettier              |

## License

MIT — see [LICENSE](./LICENSE).

import { createFileRoute, Link } from "@tanstack/react-router";
import { PillNav } from "@/components/site/PillNav";
import { DocsQuickstart } from "@/components/site/DocsQuickstart";
import { DocsCli } from "@/components/site/DocsCli";
import { DocsMcp } from "@/components/site/DocsMcp";
import { CodeTyper } from "@/components/site/CodeTyper";
import { FinalCta, Footer } from "@/components/site/FinalCta";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
  head: () => ({
    meta: [
      { title: "Docs — AcidTest field manual" },
      {
        name: "description",
        content:
          "Operate AcidTest from the CLI, wire it into Claude and Cursor via MCP, and generate Playwright, Cypress and Selenium suites from user stories.",
      },
      { property: "og:title", content: "AcidTest Docs — CLI · MCP · Frameworks" },
      {
        property: "og:description",
        content:
          "Terminal-native test synthesis, MCP tools for Claude/Cursor/Codex, and framework reference.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const JUMPS = [
  ["Quickstart", "#quickstart"],
  ["CLI", "#cli"],
  ["MCP", "#mcp"],
  ["Frameworks", "#frameworks"],
  ["API", "#api"],
];

const FRAMEWORKS = [
  {
    name: "Playwright",
    body: "TypeScript specs with @playwright/test — trace viewer, retries, sharding out of the box.",
  },
  {
    name: "Cypress",
    body: "Component + e2e specs with cy.* commands, network stubs, and time-travel debugging.",
  },
  {
    name: "Selenium",
    body: "WebDriver flows in TS or Python — grid-ready with explicit waits and Page Objects.",
  },
];

const API = `curl -X POST https://api.acidtest.dev/v1/suites \\
  -H "Authorization: Bearer $ACIDTEST_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "story": "User resets password via email link",
    "framework": "playwright",
    "priority": ["p0","p1"]
  }'

# → 201 Created
# {
#   "suiteId": "sut_9f3a1c",
#   "files": [{ "path": "password-reset.spec.ts", "bytes": 2183 }],
#   "scenarios": 3,
#   "assertions": 12
# }`;

function DocsPage() {
  return (
    <main className="relative min-h-screen bg-carbon text-ink">
      <PillNav />

      <section className="mx-auto max-w-[1200px] px-6 pb-16 pt-40 md:pt-48">
        <div className="label-mono mb-3 text-acid">§ 04 — Field Manual</div>
        <h1 className="font-display text-5xl font-bold tracking-[-0.02em] md:text-7xl">
          Operating the <span className="italic text-acid">Acid Test.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-ink">
          Everything you need to run AcidTest from a terminal, a CI pipeline,
          or the belly of an AI agent — install to first passing suite in
          under five minutes.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          {JUMPS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-ink transition-colors hover:border-acid/40 hover:text-acid"
            >
              {label}
            </a>
          ))}
        </div>
      </section>

      <DocsQuickstart />
      <DocsCli />
      <DocsMcp />

      <section id="frameworks" className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
        <div className="mb-10">
          <div className="label-mono mb-3 text-acid">§ 04 — Frameworks</div>
          <h2 className="font-display text-4xl font-bold tracking-[-0.02em] md:text-5xl">
            Three runners. One synthesis.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {FRAMEWORKS.map((f) => (
            <div key={f.name} className="folder-tab p-6 pt-8">
              <div className="label-mono mb-2 text-acid">Runner</div>
              <div className="mb-3 font-display text-2xl font-semibold">{f.name}</div>
              <p className="text-sm text-muted-ink">{f.body}</p>
              <Link
                to="/playground"
                className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest text-acid hover:underline"
              >
                Try in playground →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section id="api" className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
        <div className="mb-10">
          <div className="label-mono mb-3 text-acid">§ 05 — HTTP API</div>
          <h2 className="font-display text-4xl font-bold tracking-[-0.02em] md:text-5xl">
            REST, if you must.
          </h2>
          <p className="mt-4 max-w-xl text-muted-ink">
            Prefer curl over MCP? The same synthesis engine is a single POST
            away. Rate limits scale with plan.
          </p>
        </div>
        <CodeTyper code={API} filename="POST /v1/suites" />
      </section>

      <FinalCta />
      <Footer />
    </main>
  );
}

import { CodeTyper } from "./CodeTyper";

const CLAUDE = `{
  "mcpServers": {
    "acidtest": {
      "url": "https://mcp.acidtest.dev/v1",
      "transport": "http",
      "auth": {
        "type": "oauth",
        "issuer": "https://acidtest.dev/oauth"
      }
    }
  }
}`;

const CURSOR = `# ~/.cursor/mcp.json — or Codex settings
{
  "acidtest": {
    "url": "https://mcp.acidtest.dev/v1",
    "headers": {
      "Authorization": "Bearer $ACIDTEST_TOKEN"
    }
  }
}

# then in chat:
# > @acidtest generate_suite story="checkout: apply expired coupon"`;

const TOOLS = [
  {
    name: "generate_suite",
    desc: "Synthesize a runnable test suite from a user story.",
    input: "{ story, framework, priority? }",
    output: "{ files[], scenarios, assertions }",
  },
  {
    name: "list_frameworks",
    desc: "Enumerate supported frameworks and versions.",
    input: "{}",
    output: "{ frameworks[] }",
  },
  {
    name: "lint_story",
    desc: "Score story clarity and flag ambiguous acceptance criteria.",
    input: "{ story }",
    output: "{ score, issues[] }",
  },
  {
    name: "explain_failure",
    desc: "Diagnose a failing test run and propose a minimal patch.",
    input: "{ trace, suiteId }",
    output: "{ diagnosis, patch, confidence }",
  },
];

export function DocsMcp() {
  return (
    <section id="mcp" className="relative mx-auto max-w-[1200px] px-6 py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_20%,rgba(169,145,255,0.10),transparent_55%),radial-gradient(circle_at_90%_80%,rgba(197,239,87,0.08),transparent_55%)]" />
      <div className="mb-10">
        <div className="label-mono mb-3 text-acid">§ 03 — MCP</div>
        <h2 className="font-display text-4xl font-bold tracking-[-0.02em] md:text-5xl">
          Model Context Protocol.
        </h2>
        <p className="mt-4 max-w-2xl text-muted-ink">
          Expose AcidTest as a first-class tool to Claude, Cursor, Codex, and any MCP client. Test
          synthesis becomes a callable — your agent drafts stories, generates suites, and diagnoses
          failures inline.
        </p>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-xl font-semibold">Claude Desktop</span>
            <span className="label-mono">claude_desktop_config.json</span>
          </div>
          <CodeTyper code={CLAUDE} filename="claude_desktop_config.json" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-xl font-semibold">Cursor / Codex</span>
            <span className="label-mono">mcp.json</span>
          </div>
          <CodeTyper code={CURSOR} filename="mcp.json" />
        </div>
      </div>

      <div className="folder-tab p-6 pt-8">
        <div className="label-mono mb-4 text-acid">Tool reference</div>
        <div className="overflow-x-auto rounded-md border border-white/5">
          <table className="w-full min-w-[720px] text-left font-mono text-[12.5px]">
            <thead className="bg-white/[0.02] text-muted-ink">
              <tr>
                <th className="px-3 py-2 font-normal">Tool</th>
                <th className="px-3 py-2 font-normal">Description</th>
                <th className="px-3 py-2 font-normal">Input</th>
                <th className="px-3 py-2 font-normal">Output</th>
              </tr>
            </thead>
            <tbody>
              {TOOLS.map((t) => (
                <tr key={t.name} className="border-t border-white/5 align-top">
                  <td className="px-3 py-3 text-acid">{t.name}</td>
                  <td className="px-3 py-3 text-ink/85">{t.desc}</td>
                  <td className="px-3 py-3 text-muted-ink">{t.input}</td>
                  <td className="px-3 py-3 text-muted-ink">{t.output}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-lg border border-acid/30 bg-[rgba(197,239,87,0.04)] p-6 md:flex-row md:items-center">
        <div>
          <div className="label-mono mb-1 text-acid">Bring your own client</div>
          <div className="font-display text-lg">
            Streamable HTTP · OAuth 2.1 · Dynamic Client Registration
          </div>
        </div>
        <a
          href="#quickstart"
          className="inline-flex items-center gap-2 rounded-md bg-acid px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_24px_-4px_rgba(197,239,87,0.6)] transition-all hover:shadow-[0_0_40px_-2px_rgba(197,239,87,0.9)]"
        >
          Read the spec →
        </a>
      </div>
    </section>
  );
}

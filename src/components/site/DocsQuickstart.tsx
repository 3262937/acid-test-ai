import { CodeTyper } from "./CodeTyper";

const STEPS = [
  {
    n: "01",
    title: "Install",
    file: "shell",
    code: `# npm
npm i -g acidtest

# or with pnpm / bun
pnpm add -g acidtest
bun add -g acidtest`,
  },
  {
    n: "02",
    title: "Authenticate",
    file: "shell",
    code: `acidtest login
# Opens https://acidtest.dev/cli in your browser
# → paste the one-time code, done.
acidtest whoami
# ✓ signed in as qa+specimen@acidtest.dev`,
  },
  {
    n: "03",
    title: "Generate your first suite",
    file: "shell",
    code: `acidtest generate \\
  --story "User resets password via email link" \\
  --framework playwright \\
  --out ./tests

# ✓ 3 scenarios · 12 assertions · 480ms
# → tests/password-reset.spec.ts`,
  },
];

export function DocsQuickstart() {
  return (
    <section id="quickstart" className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
      <div className="mb-10">
        <div className="label-mono mb-3 text-acid">§ 01 — Quickstart</div>
        <h2 className="font-display text-4xl font-bold tracking-[-0.02em] md:text-5xl">
          Three commands to first suite.
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.n} className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-5xl font-bold text-acid/80">{s.n}</span>
              <span className="font-display text-xl font-semibold">{s.title}</span>
            </div>
            <CodeTyper code={s.code} filename={s.file} />
          </div>
        ))}
      </div>
    </section>
  );
}

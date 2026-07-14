import { useState } from "react";
import { CodeTyper } from "./CodeTyper";

type Cmd = "init" | "generate" | "ci";

const SNIPPETS: Record<Cmd, { file: string; code: string }> = {
  init: {
    file: "acidtest init",
    code: `acidtest init
# ? Framework › playwright / cypress / selenium
# ? Test dir  › ./tests
# ? CI mode   › github-actions
# ✓ wrote acidtest.config.ts
# ✓ wrote .github/workflows/acidtest.yml`,
  },
  generate: {
    file: "acidtest generate",
    code: `acidtest generate \\
  --story "Retry storm resolves to one ledger entry" \\
  --framework playwright \\
  --priority p0,p1 \\
  --out ./tests/ledger

# scanning intent .......... ✓
# breeding scenarios ....... ✓ 5
# lowering assertions ...... ✓ 21
# writing files ............ ✓
# → tests/ledger/retry-storm.spec.ts`,
  },
  ci: {
    file: "acidtest ci",
    code: `acidtest ci --report junit --shard 2/4

# ▶ playwright · 128 tests · 4 shards
# shard 2/4 · 32 tests · headed=false
# ✓ 30 passed  ✗ 2 failed
# → reports/junit.xml
# exit 1`,
  },
};

const FLAGS = [
  ["--framework", "playwright | cypress | selenium", "Target runner"],
  ["--story", "string | @file", "User story text or path"],
  ["--out", "path", "Output directory (default ./tests)"],
  ["--priority", "p0,p1,p2", "Filter generated scenarios"],
  ["--ci", "boolean", "Non-interactive, machine-readable output"],
  ["--headed", "boolean", "Run generated suite with UI"],
];

export function DocsCli() {
  const [tab, setTab] = useState<Cmd>("generate");
  return (
    <section id="cli" className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
      <div className="mb-10">
        <div className="label-mono mb-3 text-acid">§ 02 — CLI</div>
        <h2 className="font-display text-4xl font-bold tracking-[-0.02em] md:text-5xl">
          <span className="italic text-acid">acidtest</span> — terminal-native.
        </h2>
        <p className="mt-4 max-w-xl text-muted-ink">
          A single binary. Local-first synthesis, offline replay, and a CI mode that speaks JUnit,
          GitHub, and TAP fluently.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="folder-tab p-6 pt-8">
          <div className="label-mono mb-4 text-acid">Flags</div>
          <div className="overflow-hidden rounded-md border border-white/5">
            <table className="w-full text-left font-mono text-[12.5px]">
              <thead className="bg-white/[0.02] text-muted-ink">
                <tr>
                  <th className="px-3 py-2 font-normal">Flag</th>
                  <th className="px-3 py-2 font-normal">Type</th>
                  <th className="px-3 py-2 font-normal">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {FLAGS.map(([f, t, p]) => (
                  <tr key={f} className="border-t border-white/5">
                    <td className="px-3 py-2 text-acid">{f}</td>
                    <td className="px-3 py-2 text-ink/80">{t}</td>
                    <td className="px-3 py-2 text-muted-ink">{p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="mb-3 flex gap-1 rounded-md border border-white/6 bg-[rgba(16,17,18,0.72)] p-1 backdrop-blur">
            {(Object.keys(SNIPPETS) as Cmd[]).map((c) => (
              <button
                key={c}
                onClick={() => setTab(c)}
                className={`flex-1 rounded px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${
                  tab === c ? "bg-acid text-[#0a0a0a]" : "text-muted-ink hover:text-ink"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <CodeTyper key={tab} code={SNIPPETS[tab].code} filename={SNIPPETS[tab].file} />
        </div>
      </div>
    </section>
  );
}

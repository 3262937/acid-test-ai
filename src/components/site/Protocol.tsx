import { ClipboardList, Network, TerminalSquare } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: ClipboardList,
    title: "Paste your user story",
    body: "Drop in Jira tickets, PR descriptions, or raw feature specs. The LLM parses intent and identifies the critical pathways instantly.",
  },
  {
    n: "02",
    icon: Network,
    title: "AI breeds scenarios",
    body: "Comprehensive test matrices: happy paths, edge cases, and catastrophic failure modes — every dark corner explored.",
  },
  {
    n: "03",
    icon: TerminalSquare,
    title: "Export runnable suites",
    body: "One click exports fully typed, executable test files for your framework of choice. Copy, paste, run, hunt.",
  },
];

export function Protocol() {
  return (
    <section id="protocol" className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
      <div className="mb-14">
        <div className="label-mono mb-3 text-acid">§ 02 — Protocol</div>
        <h2 className="font-display text-4xl font-bold tracking-[-0.02em] md:text-5xl">
          The Synthesis Protocol.
        </h2>
        <p className="mt-3 max-w-xl text-muted-ink">
          From natural language to executable hunting grounds.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="folder-tab group relative p-8 pt-10 transition-all duration-300 hover:-translate-y-1 hover:acid-glow"
          >
            <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-carbon/70 text-acid transition-colors group-hover:bg-acid/10">
              <s.icon size={18} strokeWidth={1.5} />
            </div>
            <div className="label-mono mb-2 text-acid">{s.n}</div>
            <h3 className="mb-3 font-display text-xl font-semibold">{s.title}</h3>
            <p className="text-[14px] leading-relaxed text-muted-ink">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

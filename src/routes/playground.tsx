import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Bookmark } from "lucide-react";
import { PillNav } from "@/components/site/PillNav";
import { Footer } from "@/components/site/FinalCta";
import { CodeTyper } from "@/components/site/CodeTyper";
import { generateCode, type Framework } from "@/components/site/generators";
import { useSession } from "@/hooks/use-session";
import { saveTest } from "@/lib/saved-tests.functions";

const ALL: Framework[] = ["Playwright", "Cypress", "Selenium"];
const EXTRA = ["Jest", "Vitest", "Mocha", "Puppeteer", "Appium"];


export const Route = createFileRoute("/playground")({
  component: Playground,
  head: () => ({
    meta: [
      { title: "Playground — AcidTest" },
      { name: "description", content: "Generate runnable test suites from a user story." },
      { property: "og:title", content: "AcidTest Playground" },
      { property: "og:description", content: "Try the test synthesis engine." },
    ],
    links: [{ rel: "canonical", href: "/playground" }],
  }),
});

function Playground() {
  const [story, setStory] = useState(
    "As a shopper, I want to apply a discount code at checkout so my order total updates before I pay.",
  );
  const [fw, setFw] = useState<Framework>("Playwright");
  const [runKey, setRunKey] = useState(0);
  const [visible, setVisible] = useState(true);

  const cases = [
    { id: "TC-001", prio: "P0", title: "Valid discount code updates total live" },
    { id: "TC-002", prio: "P1", title: "Expired code shows inline error, cart unchanged" },
    { id: "TC-003", prio: "P2", title: "Stacked codes reject with generic message" },
  ];

  function run() {
    setVisible(false);
    setRunKey((k) => k + 1);
    setTimeout(() => setVisible(true), 60);
  }

  return (
    <main className="relative min-h-screen bg-carbon text-ink">
      <PillNav />
      <section className="mx-auto max-w-[1200px] px-6 pt-40 pb-16 md:pt-48">
        <div className="mb-10">
          <div className="label-mono mb-3 text-acid">§ Playground</div>
          <h1 className="font-display text-4xl font-bold tracking-[-0.02em] md:text-5xl">
            Synthesize a suite.
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
          <div className="folder-tab space-y-4 p-6 pt-8">
            <label className="label-mono block text-acid">User Story</label>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={8}
              className="w-full resize-none rounded-md border border-white/10 bg-carbon/60 p-3 font-mono text-[13px] leading-relaxed text-ink outline-none focus:border-acid/50 focus:ring-2 focus:ring-acid/30"
            />
            <label className="label-mono block text-acid">Framework</label>
            <select
              value={fw}
              onChange={(e) => setFw(e.target.value as Framework)}
              className="w-full rounded-md border border-white/10 bg-carbon/60 p-3 font-mono text-[13px] text-ink outline-none focus:border-acid/50"
            >
              {ALL.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
              {EXTRA.map((f) => (
                <option key={f} value={f} disabled>{f} (soon)</option>
              ))}
            </select>
            <button
              onClick={run}
              className="w-full rounded-md bg-acid px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_28px_-4px_rgba(197,239,87,0.6)] transition-all hover:shadow-[0_0_44px_-2px_rgba(197,239,87,0.85)]"
            >
              ▶ Generate suite
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {cases.map((c, i) => (
                <motion.div
                  key={`${runKey}-${c.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={visible ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.15, duration: 0.4 }}
                  className="folder-tab p-4 pt-6"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="label-mono">{c.id} · {c.prio}</span>
                    <span className="rounded bg-acid px-2 py-0.5 font-mono text-[10px] font-bold text-[#0a0a0a]">
                      PASS
                    </span>
                  </div>
                  <p className="text-[13px] leading-snug">{c.title}</p>
                </motion.div>
              ))}
            </div>
            <CodeTyper
              key={`${fw}-${runKey}`}
              code={generateCode(fw, story)}
              filename={`generated.${fw.toLowerCase()}.ts`}
            />
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

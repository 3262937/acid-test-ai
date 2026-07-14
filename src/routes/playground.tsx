import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Bookmark, Zap } from "lucide-react";
import { PillNav } from "@/components/site/PillNav";
import { Footer } from "@/components/site/FinalCta";
import { CodeTyper } from "@/components/site/CodeTyper";
import { BuyCreditsDialog } from "@/components/site/BuyCreditsDialog";
import { generateCode, type Framework } from "@/components/site/generators";
import { useSession } from "@/hooks/use-session";
import { useCredits } from "@/hooks/use-credits";
import { saveTest } from "@/lib/saved-tests.functions";

const ALL: Framework[] = ["Playwright", "Cypress", "Selenium"];
const EXTRA = ["Jest", "Vitest", "Mocha", "Puppeteer", "Appium"];
const FREE_TRY_KEY = "acidtest_free_try_used";

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
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const { user } = useSession();
  const navigate = useNavigate();
  const { balance, consume, refresh } = useCredits();
  const save = useServerFn(saveTest);

  const cases = [
    { id: "TC-001", prio: "P0", title: "Valid discount code updates total live" },
    { id: "TC-002", prio: "P1", title: "Expired code shows inline error, cart unchanged" },
    { id: "TC-003", prio: "P2", title: "Stacked codes reject with generic message" },
  ];

  async function run() {
    if (!user) {
      const used = typeof window !== "undefined" && localStorage.getItem(FREE_TRY_KEY) === "1";
      if (used) {
        toast.error("Free preview used", {
          description: "Sign in to keep generating.",
          action: { label: "Sign in", onClick: () => navigate({ to: "/login" }) },
        });
        return;
      }
      if (typeof window !== "undefined") localStorage.setItem(FREE_TRY_KEY, "1");
      toast.success("That was your free try", {
        description: "Sign in to get 3 more credits.",
      });
    } else {
      const res = await consume();
      if (!res.ok) {
        toast.error("Out of credits", {
          description: "Buy a pack to keep generating.",
          action: { label: "Buy credits", onClick: () => setBuyOpen(true) },
        });
        return;
      }
    }
    setVisible(false);
    setRunKey((k) => k + 1);
    setTimeout(() => setVisible(true), 60);
  }

  async function handleSave() {
    if (!user) {
      toast.error("Sign in to save tests");
      return;
    }
    setSaving(true);
    try {
      const code = generateCode(fw, story);
      const title = story.trim().slice(0, 80) || `${fw} test`;
      await save({ data: { title, story, framework: fw, code } });
      toast.success("Saved", { description: "Find it under Saved tests." });
    } catch (e) {
      toast.error("Save failed", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-carbon text-ink">
      <PillNav />
      <section className="mx-auto max-w-[1200px] px-6 pt-40 pb-16 md:pt-48">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="label-mono mb-3 text-acid">§ Playground</div>
            <h1 className="font-display text-4xl font-bold tracking-[-0.02em] md:text-5xl">
              Synthesize a suite.
            </h1>
            {user ? (
              <p className="mt-3 text-sm text-muted-ink">
                Credits: <span className="font-mono text-acid">{balance ?? "—"}</span> · 1 per generation.{" "}
                <button onClick={() => setBuyOpen(true)} className="text-acid hover:underline">
                  Buy more →
                </button>
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted-ink">
                1 free preview.{" "}
                <Link to="/login" className="text-acid hover:underline">
                  Sign in
                </Link>{" "}
                for 3 welcome credits.
              </p>
            )}
          </div>
          <Link
            to="/saved"
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-ink transition-all hover:border-acid/40 hover:text-acid"
          >
            <Bookmark size={12} />
            Saved
          </Link>
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-acid px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_28px_-4px_rgba(197,239,87,0.6)] transition-all hover:shadow-[0_0_44px_-2px_rgba(197,239,87,0.85)]"
            >
              <Zap size={12} /> Generate suite (1 credit)
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-ink transition-all hover:border-acid/40 hover:text-acid disabled:opacity-50"
              title={user ? "Save this test" : "Sign in to save"}
            >
              <Bookmark size={12} />
              {saving ? "Saving…" : "Save this test"}
            </button>
          </div>


          <div className="space-y-4">
            {visible ? (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {cases.map((c, i) => (
                    <motion.div
                      key={`${runKey}-${c.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
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
              </>
            ) : (
              <div className="folder-tab flex h-[520px] flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="label-mono text-acid">§ Awaiting input</div>
                <p className="max-w-md text-sm text-muted-ink">
                  Hit <span className="font-mono text-ink">Generate suite</span> to synthesize test cases and runnable {fw} code from your story.
                </p>
                <p className="font-mono text-[11px] text-muted-ink">
                  {user ? "Each generation costs 1 credit." : "1 free preview, then sign in."}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      <BuyCreditsDialog open={buyOpen} onClose={() => setBuyOpen(false)} onSuccess={refresh} />
      <Footer />
    </main>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Bookmark, Upload, Zap } from "lucide-react";
import { PillNav } from "@/components/site/PillNav";
import { Footer } from "@/components/site/FinalCta";
import { CodeTyper } from "@/components/site/CodeTyper";
import { BuyCreditsDialog } from "@/components/site/BuyCreditsDialog";
import { generateCode, FRAMEWORK_META, type Framework } from "@/components/site/generators";
import { FrameworkPicker } from "@/components/site/FrameworkPicker";
import { useSession } from "@/hooks/use-session";
import { useCredits } from "@/hooks/use-credits";
import { saveTest } from "@/lib/saved-tests.functions";
import { listUserKeys, type Provider } from "@/lib/user-keys.functions";
import { generateWithUserKey, parseUploadedFile } from "@/lib/ai-generate.functions";

const FREE_TRY_KEY = "acidtest_free_try_used";

type Engine = "lovable" | "openai" | "anthropic";

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
  const [engine, setEngine] = useState<Engine>("lovable");
  const [runKey, setRunKey] = useState(0);
  const [visible, setVisible] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [savedProviders, setSavedProviders] = useState<Provider[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const { user } = useSession();
  const navigate = useNavigate();
  const { balance, consume, refresh } = useCredits();
  const save = useServerFn(saveTest);
  const genByo = useServerFn(generateWithUserKey);
  const parseFile = useServerFn(parseUploadedFile);
  const listKeys = useServerFn(listUserKeys);

  useEffect(() => {
    if (!user) {
      setSavedProviders([]);
      return;
    }
    void listKeys()
      .then((rows) => setSavedProviders(rows.map((r) => r.provider)))
      .catch(() => setSavedProviders([]));
  }, [user, listKeys]);

  const cases = [
    { id: "TC-001", prio: "P0", title: "Valid discount code updates total live" },
    { id: "TC-002", prio: "P1", title: "Expired code shows inline error, cart unchanged" },
    { id: "TC-003", prio: "P2", title: "Stacked codes reject with generic message" },
  ];

  async function run() {
    if (generating) return;

    // BYO path: use user's key, no credit consumed.
    if (engine !== "lovable") {
      if (!user) {
        toast.error("Sign in required", { description: "Save your key in Account first." });
        return;
      }
      if (!savedProviders.includes(engine)) {
        toast.error(`No ${engine === "openai" ? "OpenAI" : "Claude"} key`, {
          description: "Add it in Account → Bring your own AI.",
          action: { label: "Account", onClick: () => navigate({ to: "/account" }) },
        });
        return;
      }
      setGenerating(true);
      try {
        const res = await genByo({ data: { provider: engine, story, framework: fw } });
        if ("error" in res) {
          toast.error("Generation failed", { description: res.error });
          return;
        }
        setGeneratedCode(res.code);
        setVisible(false);
        setRunKey((k) => k + 1);
        setTimeout(() => setVisible(true), 60);
      } finally {
        setGenerating(false);
      }
      return;
    }

    // Lovable credits path (existing behaviour)
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
          description: "Buy a pack or switch to your own key.",
          action: { label: "Buy credits", onClick: () => setBuyOpen(true) },
        });
        return;
      }
    }
    setGeneratedCode(generateCode(fw, story));
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
      const code = generatedCode || generateCode(fw, story);
      const title = story.trim().slice(0, 80) || `${fw} test`;
      await save({ data: { title, story, framework: fw, code } });
      toast.success("Saved", { description: "Find it under Saved tests." });
    } catch (e) {
      toast.error("Save failed", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!user) {
      toast.error("Sign in to upload documents");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", { description: "Max 5 MB." });
      return;
    }
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const base64 = arrayBufferToBase64(buf);
      const res = await parseFile({ data: { filename: file.name, base64 } });
      if ("error" in res) {
        toast.error("Parse failed", { description: res.error });
        return;
      }
      const clean = res.text.trim();
      if (!clean) {
        toast.error("Empty document");
        return;
      }
      setStory(clean.slice(0, 4000));
      toast.success("Loaded", { description: `${file.name} → user story` });
    } catch (err) {
      toast.error("Upload failed", { description: (err as Error).message });
    } finally {
      setUploading(false);
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
            <div className="flex items-center justify-between">
              <label className="label-mono block text-acid">User Story</label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-ink transition-all hover:border-acid/40 hover:text-acid disabled:opacity-50"
                title="Upload .docx / .xlsx / .csv / .txt"
              >
                <Upload size={11} />
                {uploading ? "Parsing…" : "Upload doc"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.md,.docx,.xlsx,.xls,.csv"
                onChange={handleFile}
                className="hidden"
              />
            </div>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={8}
              className="w-full resize-none rounded-md border border-white/10 bg-carbon/60 p-3 font-mono text-[13px] leading-relaxed text-ink outline-none focus:border-acid/50 focus:ring-2 focus:ring-acid/30"
            />

            <label className="label-mono block text-acid">Engine</label>
            <div className="grid grid-cols-3 gap-2">
              {(["lovable", "openai", "anthropic"] as Engine[]).map((e) => {
                const disabled =
                  e !== "lovable" && (!user || !savedProviders.includes(e as Provider));
                const label = e === "lovable" ? "Credits" : e === "openai" ? "OpenAI" : "Claude";
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEngine(e)}
                    disabled={disabled}
                    title={
                      disabled
                        ? user
                          ? "Add key in Account → Bring your own AI"
                          : "Sign in and add a key"
                        : ""
                    }
                    className={`rounded-md border px-2 py-2 font-mono text-[11px] uppercase tracking-widest transition-all ${
                      engine === e
                        ? "border-acid/60 bg-acid/10 text-acid"
                        : "border-white/10 bg-white/[0.02] text-muted-ink hover:text-ink"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="font-mono text-[10px] text-muted-ink">
              {engine === "lovable"
                ? "Uses 1 credit per generation."
                : "Runs on your key — no credit charged."}
            </p>

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
              disabled={generating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-acid px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_28px_-4px_rgba(197,239,87,0.6)] transition-all hover:shadow-[0_0_44px_-2px_rgba(197,239,87,0.85)] disabled:opacity-60"
            >
              <Zap size={12} />
              {generating
                ? "Generating…"
                : engine === "lovable"
                  ? "Generate suite (1 credit)"
                  : `Generate with ${engine === "openai" ? "OpenAI" : "Claude"}`}
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
                  code={generatedCode || generateCode(fw, story)}
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
                  {engine === "lovable"
                    ? user
                      ? "Each generation costs 1 credit."
                      : "1 free preview, then sign in."
                    : `Runs on your ${engine === "openai" ? "OpenAI" : "Claude"} key.`}
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

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(bin);
}

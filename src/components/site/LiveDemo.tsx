import { useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Bookmark, Upload, Zap } from "lucide-react";
import { CodeTyper } from "./CodeTyper";
import { BuyCreditsDialog } from "./BuyCreditsDialog";
import { generateCode, FRAMEWORK_META, type Framework } from "./generators";
import { FrameworkPicker } from "./FrameworkPicker";
import { useSession } from "@/hooks/use-session";
import { useCredits } from "@/hooks/use-credits";
import { saveTest } from "@/lib/saved-tests.functions";
import { parseUploadedFile } from "@/lib/ai-generate.functions";

const DEFAULT_STORY =
  "As a registered user, I want to reset my password via email link, so that I can regain access to my account.";
const FREE_TRY_KEY = "acidtest_free_try_used";

export function LiveDemo() {
  const { user } = useSession();
  const navigate = useNavigate();
  const { balance, consume, refresh } = useCredits();
  const save = useServerFn(saveTest);
  const parseFile = useServerFn(parseUploadedFile);
  const [story, setStory] = useState(DEFAULT_STORY);
  const [fw, setFw] = useState<Framework>("Playwright");
  const [runKey, setRunKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const code = generateCode(fw, story);

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
      const bytes = new Uint8Array(buf);
      let bin = "";
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
      }
      const base64 = btoa(bin);
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


  async function handleGenerate() {
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
      setRevealed(true);
      setRunKey((k) => k + 1);
      toast.success("That was your free try", {
        description: "Sign in to get 3 more credits.",
      });
      return;
    }

    const res = await consume();
    if (!res.ok) {
      toast.error("Out of credits", {
        description: "Buy a pack to keep generating.",
        action: { label: "Buy credits", onClick: () => setBuyOpen(true) },
      });
      return;
    }
    setRevealed(true);
    setRunKey((k) => k + 1);
  }

  async function handleSave() {
    if (!user) {
      toast.error("Sign in to save tests");
      return;
    }
    setSaving(true);
    try {
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
    <>
      <section id="demo" className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="label-mono mb-3 text-acid">§ 03 — Live Culture</div>
            <h2 className="font-display text-4xl font-bold tracking-[-0.02em] md:text-5xl">
              Watch it hunt, live.
            </h2>
            {!user ? (
              <p className="mt-3 text-sm text-muted-ink">
                1 free preview. <Link to="/login" className="text-acid hover:underline">Sign in</Link> for 3 welcome credits and to save your tests.
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted-ink">
                Credits: <span className="font-mono text-acid">{balance ?? "—"}</span> · 1 credit per generation.
                {balance !== null && balance < 3 && (
                  <>
                    {" "}
                    <button onClick={() => setBuyOpen(true)} className="text-acid hover:underline">
                      Buy more →
                    </button>
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="folder-tab p-6 pt-8">
            <div className="mb-3 flex items-center justify-between">
              <label className="label-mono block text-acid">User Story · Input</label>
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
              rows={7}
              className="w-full resize-none rounded-md border border-white/10 bg-carbon/60 p-4 font-mono text-[13px] leading-relaxed text-ink outline-none focus:border-acid/50 focus:ring-2 focus:ring-acid/30"
            />

            <div className="mt-4 flex items-center justify-between">
              <div className="label-mono">{story.trim().split(/\s+/).length} tokens</div>
              <button
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 rounded-md bg-acid px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_24px_-4px_rgba(197,239,87,0.6)] transition-all hover:shadow-[0_0_40px_-2px_rgba(197,239,87,0.85)]"
              >
                <Zap size={12} /> Generate (1 credit)
              </button>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-start gap-2">
              <div className="flex-1">
                <FrameworkPicker value={fw} onChange={setFw} />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-ink transition-all hover:border-acid/40 hover:text-acid disabled:opacity-50"
                title={user ? "Save this test" : "Sign in to save"}
              >
                <Bookmark size={12} />
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
            {revealed ? (
              <CodeTyper
                key={`${fw}-${runKey}`}
                code={code}
                filename={`password-reset.${FRAMEWORK_META[fw].ext}`}
              />
            ) : (
              <div className="folder-tab-solid flex h-[440px] flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="label-mono text-acid">§ Awaiting input</div>
                <p className="max-w-sm text-sm text-muted-ink">
                  Hit <span className="font-mono text-ink">Generate</span> to synthesize a runnable {fw} spec from your story.
                </p>
                <p className="font-mono text-[11px] text-muted-ink">
                  {user ? "1 credit per run." : "1 free preview, then sign in."}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      <BuyCreditsDialog open={buyOpen} onClose={() => setBuyOpen(false)} onSuccess={refresh} />
    </>
  );
}

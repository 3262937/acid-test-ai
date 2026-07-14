import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2, Copy, Check, Bookmark, Github } from "lucide-react";
import { PillNav } from "@/components/site/PillNav";
import { Footer } from "@/components/site/FinalCta";
import { GitHubExportDialog } from "@/components/site/GitHubExportDialog";
import { useSession } from "@/hooks/use-session";
import { listSavedTests, deleteSavedTest, type SavedTest } from "@/lib/saved-tests.functions";

export const Route = createFileRoute("/saved")({
  component: SavedPage,
  head: () => ({
    meta: [
      { title: "Saved tests — AcidTest" },
      { name: "description", content: "Your saved generated test suites." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function SavedPage() {
  const { user, ready } = useSession();
  const navigate = useNavigate();
  const fetchList = useServerFn(listSavedTests);
  const del = useServerFn(deleteSavedTest);
  const [items, setItems] = useState<SavedTest[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [ghTest, setGhTest] = useState<SavedTest | null>(null);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
  }, [ready, user, navigate]);

  async function refresh() {
    try {
      const res = await fetchList();
      setItems(res.items);
    } catch (e) {
      toast.error("Failed to load", { description: (e as Error).message });
    }
  }

  useEffect(() => {
    if (user) void refresh();
  }, [user]);

  async function handleDelete(id: string) {
    const prev = items;
    setItems((it) => it?.filter((x) => x.id !== id) ?? null);
    try {
      await del({ data: { id } });
      toast.success("Deleted");
    } catch (e) {
      setItems(prev);
      toast.error("Delete failed", { description: (e as Error).message });
    }
  }

  function copy(id: string, code: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <main className="relative min-h-screen bg-carbon text-ink">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_10%,rgba(197,239,87,0.10),transparent_60%)]" />
      <PillNav />
      <section className="mx-auto max-w-[1100px] px-6 pt-40 pb-16 md:pt-48">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="label-mono mb-3 text-acid">§ Saved</div>
            <h1 className="font-display text-4xl font-bold tracking-[-0.02em] md:text-5xl">
              Your saved tests
            </h1>
          </div>
          <Link
            to="/playground"
            className="inline-flex items-center justify-center rounded-md bg-acid px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_24px_-4px_rgba(197,239,87,0.6)] transition-all hover:shadow-[0_0_40px_-2px_rgba(197,239,87,0.9)]"
          >
            + Generate
          </Link>
        </div>

        {items === null ? (
          <p className="font-mono text-[12px] text-muted-ink">Loading…</p>
        ) : items.length === 0 ? (
          <div className="folder-tab flex flex-col items-center gap-3 p-14 pt-16 text-center">
            <Bookmark size={28} className="text-acid" />
            <h2 className="font-display text-xl font-semibold">Nothing saved yet</h2>
            <p className="max-w-md text-sm text-muted-ink">
              Generate a suite in the playground and hit Save to keep it here.
            </p>
            <Link
              to="/playground"
              className="mt-2 inline-flex items-center justify-center rounded-md border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-ink transition-all hover:border-acid/40 hover:text-acid"
            >
              Open playground →
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((t) => {
              const open = openId === t.id;
              return (
                <li key={t.id} className="folder-tab p-5 pt-7">
                  <div className="flex items-start justify-between gap-4">
                    <button
                      onClick={() => setOpenId(open ? null : t.id)}
                      className="flex-1 text-left"
                    >
                      <div className="label-mono mb-1 text-acid">
                        {t.framework} · {new Date(t.created_at).toLocaleString()}
                      </div>
                      <h3 className="font-display text-lg font-semibold tracking-[-0.01em]">
                        {t.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-ink">{t.story}</p>
                    </button>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => copy(t.id, t.code)}
                        className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/[0.02] px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-ink transition-colors hover:border-acid/40 hover:text-acid"
                      >
                        {copiedId === t.id ? <Check size={12} /> : <Copy size={12} />}
                        {copiedId === t.id ? "Copied" : "Copy"}
                      </button>
                      <button
                        onClick={() => setGhTest(t)}
                        className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/[0.02] px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-ink transition-colors hover:border-acid/40 hover:text-acid"
                        title="Push to GitHub"
                      >
                        <Github size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/[0.02] px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-ink transition-colors hover:border-red-400/40 hover:text-red-300"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {open && (
                    <pre className="mt-4 max-h-[360px] overflow-auto rounded-md border border-white/10 bg-carbon/80 p-4 font-mono text-[12px] leading-relaxed text-ink/90">
                      <code>{t.code}</code>
                    </pre>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {ghTest && (
        <GitHubExportDialog
          open={!!ghTest}
          onClose={() => setGhTest(null)}
          title={ghTest.title}
          framework={ghTest.framework as import("@/components/site/generators").Framework}
          code={ghTest.code}
        />
      )}
      <Footer />
    </main>
  );
}

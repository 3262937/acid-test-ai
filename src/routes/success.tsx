import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PillNav } from "@/components/site/PillNav";
import { useSession } from "@/hooks/use-session";
import { getMyCredits } from "@/lib/billing.functions";

export const Route = createFileRoute("/success")({
  component: SuccessPage,
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Success — AcidTest" },
      { name: "description", content: "Your action completed successfully." },
      { property: "og:title", content: "Success — AcidTest" },
      { property: "og:description", content: "All green. Nothing exploded." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function SuccessPage() {
  const { session_id } = Route.useSearch();
  const { user, ready } = useSession();
  const fetchCredits = useServerFn(getMyCredits);
  const [balance, setBalance] = useState<number | null>(null);
  const [pollingDone, setPollingDone] = useState(false);

  useEffect(() => {
    if (!ready || !user || !session_id) return;
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      // Poll for up to ~15s while the webhook lands and credits are granted.
      while (!cancelled && attempts < 15) {
        attempts += 1;
        try {
          const res = await fetchCredits();
          if (!cancelled) setBalance(res.balance);
        } catch {}
        await new Promise((r) => setTimeout(r, 1000));
      }
      if (!cancelled) setPollingDone(true);
    }
    void poll();
    return () => {
      cancelled = true;
    };
  }, [ready, user, session_id, fetchCredits]);

  return (
    <main className="relative min-h-screen bg-carbon text-ink">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_20%,rgba(197,239,87,0.14),transparent_60%)]" />
      <PillNav />
      <section className="mx-auto flex min-h-screen max-w-[560px] flex-col items-center justify-center px-6 text-center">
        <div className="folder-tab w-full p-10 pt-14">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-acid/15 ring-1 ring-acid/40">
            <CheckCircle2 size={32} className="text-acid" />
          </div>
          <div className="label-mono mt-6 text-acid">§ 200 — OK</div>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.02em] md:text-5xl">
            Payment <span className="italic text-acid">received.</span>
          </h1>
          <p className="mt-3 text-muted-ink">
            {session_id
              ? "Your credits are being added — this usually takes a couple of seconds."
              : "Your action completed successfully. Nothing exploded."}
          </p>

          {session_id && (
            <div className="mt-6 flex items-center justify-center gap-2 rounded-md border border-acid/30 bg-acid/5 px-4 py-3 font-mono text-[12px] text-acid">
              <Zap size={14} />
              {balance === null
                ? "Waiting for confirmation…"
                : `${balance.toLocaleString()} credits available`}
              {!pollingDone && balance === null && (
                <span className="ml-2 h-2 w-2 animate-pulse rounded-full bg-acid" />
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/playground"
              className="inline-flex items-center justify-center rounded-md bg-acid px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_24px_-4px_rgba(197,239,87,0.6)] transition-all hover:shadow-[0_0_40px_-2px_rgba(197,239,87,0.9)]"
            >
              Start generating →
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/[0.03] px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-ink transition-all hover:border-acid/40 hover:text-acid"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

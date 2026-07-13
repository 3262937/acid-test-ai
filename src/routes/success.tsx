import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { PillNav } from "@/components/site/PillNav";

export const Route = createFileRoute("/success")({
  component: SuccessPage,
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
            All <span className="italic text-acid">green.</span>
          </h1>
          <p className="mt-3 text-muted-ink">
            Your action completed successfully. Nothing exploded.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md bg-acid px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_24px_-4px_rgba(197,239,87,0.6)] transition-all hover:shadow-[0_0_40px_-2px_rgba(197,239,87,0.9)]"
            >
              Back to home →
            </Link>
            <Link
              to="/playground"
              className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/[0.03] px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-ink transition-all hover:border-acid/40 hover:text-acid"
            >
              Open playground
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

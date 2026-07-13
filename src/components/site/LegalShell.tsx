import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PillNav } from "@/components/site/PillNav";
import { Footer } from "@/components/site/FinalCta";

export function LegalShell({
  section,
  title,
  updated,
  children,
}: {
  section: string;
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-screen bg-carbon text-ink">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(197,239,87,0.08),transparent_55%),radial-gradient(circle_at_90%_100%,rgba(169,145,255,0.08),transparent_55%)]" />
      <PillNav />
      <section className="mx-auto max-w-[900px] px-6 pb-24 pt-36 md:pt-44">
        <Link to="/" className="label-mono transition-colors hover:text-acid">
          ← Back
        </Link>
        <div className="mt-8">
          <div className="label-mono mb-3 text-acid">{section}</div>
          <h1 className="font-display text-4xl font-bold tracking-[-0.02em] md:text-6xl">
            {title}
          </h1>
          {updated && (
            <p className="mt-3 font-mono text-[11px] text-muted-ink">
              Last updated · {updated}
            </p>
          )}
        </div>
        <article className="prose-legal mt-12">{children}</article>
      </section>
      <Footer />
    </main>
  );
}

export function Sec({ id, heading, children }: { id: string; heading: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-10 first:mt-0">
      <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-ink md:text-3xl">
        {heading}
      </h2>
      <div className="mt-3 space-y-4 text-[15px] leading-relaxed text-muted-ink">{children}</div>
    </section>
  );
}

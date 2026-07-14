import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function FinalCta() {
  return (
    <section id="cta" className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
      <div className="folder-tab relative overflow-hidden p-12 pt-16 text-center md:p-20 md:pt-20">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_100%,rgba(197,239,87,0.14),transparent_60%)]" />
        <div className="label-mono mb-4 text-acid">§ 06 — Enroll</div>
        <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold tracking-[-0.02em] md:text-6xl">
          No bug survives the <span className="italic text-acid">acid test.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-muted-ink">
          Join QA teams automating the tedious and focusing on the complex.
        </p>
        <Link
          to="/login"
          className="mt-10 inline-flex items-center gap-2 rounded-md bg-acid px-7 py-3.5 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_40px_-4px_rgba(197,239,87,0.7)] transition-all hover:shadow-[0_0_60px_-2px_rgba(197,239,87,0.95)]"
        >
          Start synthesizing →
        </Link>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row">
        <Logo size="lg" />
        <div className="flex flex-wrap justify-center gap-6 label-mono">
          <Link className="hover:text-acid" to="/privacy">
            Privacy
          </Link>
          <Link className="hover:text-acid" to="/terms">
            Terms
          </Link>
          <Link className="hover:text-acid" to="/security">
            Security
          </Link>
          <Link className="hover:text-acid" to="/faq">
            FAQ
          </Link>
          <Link className="hover:text-acid" to="/status">
            Status
          </Link>
        </div>
        <span className="label-mono">© 2026 AcidTest AI</span>
      </div>
    </footer>
  );
}

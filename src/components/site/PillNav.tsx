import { Link } from "@tanstack/react-router";

const links: { label: string; to: string; hash?: string }[] = [
  { label: "Product", to: "/" },
  { label: "Frameworks", to: "/", hash: "protocol" },
  { label: "Pricing", to: "/", hash: "cta" },
  { label: "Docs", to: "/docs" },
  { label: "Playground", to: "/playground" },
];

export function PillNav() {
  return (
    <div className="fixed top-6 left-1/2 z-50 w-[min(1200px,calc(100%-32px))] -translate-x-1/2">
      <nav className="flex items-center justify-between rounded-full border border-white/6 bg-[rgba(16,17,18,0.72)] px-3 py-2 backdrop-blur-xl">
        <Link to="/" className="pl-4 pr-2">
          <span className="text-acid font-display text-xl font-bold italic tracking-tight">
            AcidTest
          </span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              hash={l.hash}
              className="label-mono text-[11px] transition-colors hover:text-acid"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <a
          href="#demo"
          className="rounded-full bg-acid px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-[#0a0a0a] transition-all hover:shadow-[0_0_24px_rgba(197,239,87,0.5)]"
        >
          Start Free
        </a>
      </nav>
    </div>
  );
}

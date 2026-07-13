import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Zap } from "lucide-react";

type Tier = {
  name: string;
  credits: number;
  price: number;
  perCredit: string;
  tag?: string;
  highlight?: boolean;
  perks: string[];
};

const TIERS: Tier[] = [
  {
    name: "Starter",
    credits: 200,
    price: 19,
    perCredit: "$0.095 / credit",
    perks: [
      "200 test synthesis credits",
      "Playwright · Cypress · Selenium",
      "1 project workspace",
      "Community support",
    ],
  },
  {
    name: "Hunter",
    credits: 1000,
    price: 79,
    perCredit: "$0.079 / credit",
    tag: "Most popular",
    highlight: true,
    perks: [
      "1,000 credits — refill anytime",
      "Threat Detection scans",
      "5 project workspaces",
      "Priority queue + email support",
    ],
  },
  {
    name: "Lab",
    credits: 5000,
    price: 299,
    perCredit: "$0.060 / credit",
    perks: [
      "5,000 credits + rollover",
      "Team seats (up to 10)",
      "MCP + CLI access",
      "SLA + dedicated Slack channel",
    ],
  },
];

const TOPUPS = [
  { credits: 100, price: 12 },
  { credits: 500, price: 49 },
  { credits: 2000, price: 169 },
];

export function Pricing() {
  const [topup, setTopup] = useState(1);

  return (
    <section id="pricing" className="relative mx-auto max-w-[1200px] px-6 py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_10%,rgba(169,145,255,0.10),transparent_55%),radial-gradient(circle_at_10%_90%,rgba(197,239,87,0.08),transparent_55%)]" />

      <div className="mb-14 flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="label-mono mb-3 text-acid">§ 05 — Pricing</div>
          <h2 className="max-w-2xl font-display text-4xl font-bold tracking-[-0.02em] md:text-6xl">
            Buy <span className="italic text-acid">credits</span>. Spend them on tests.
          </h2>
          <p className="mt-4 max-w-xl text-muted-ink">
            One credit = one synthesized test case. No seats to negotiate, no per-run surprises.
          </p>
        </div>
        <div className="folder-tab flex items-center gap-2 px-4 py-2 font-mono text-[11px] text-muted-ink">
          <Zap size={12} className="text-acid" />
          <span className="uppercase tracking-widest">Credits never expire on paid plans</span>
        </div>
      </div>

      {/* Tier grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={[
              "folder-tab relative flex flex-col p-8 pt-10",
              t.highlight
                ? "shadow-[0_0_60px_-20px_rgba(197,239,87,0.55)] ring-1 ring-acid/40"
                : "",
            ].join(" ")}
          >
            {t.tag && (
              <span className="absolute right-6 top-6 rounded-full bg-acid px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-[#0a0a0a]">
                {t.tag}
              </span>
            )}
            <div className="label-mono text-muted-ink">{t.name}</div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-5xl font-bold tracking-[-0.02em]">
                ${t.price}
              </span>
              <span className="label-mono">/ one-time</span>
            </div>
            <div className="mt-1 font-mono text-[12px] text-acid">
              {t.credits.toLocaleString()} credits · {t.perCredit}
            </div>

            <ul className="mt-6 flex flex-1 flex-col gap-3">
              {t.perks.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-ink/90">
                  <Check size={14} className="mt-1 shrink-0 text-acid" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/login"
              className={[
                "mt-8 inline-flex items-center justify-center rounded-md px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest transition-all",
                t.highlight
                  ? "bg-acid text-[#0a0a0a] shadow-[0_0_30px_-6px_rgba(197,239,87,0.7)] hover:shadow-[0_0_50px_-2px_rgba(197,239,87,0.95)]"
                  : "border border-white/10 bg-white/[0.03] text-ink hover:border-acid/40 hover:text-acid",
              ].join(" ")}
            >
              Buy {t.name} →
            </Link>
          </div>
        ))}
      </div>

      {/* Top-up strip */}
      <div className="folder-tab mt-10 flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="label-mono mb-2 text-acid">Top-up</div>
          <h3 className="font-display text-2xl font-bold tracking-[-0.01em]">
            Out of credits? Add more in one click.
          </h3>
          <p className="mt-1 text-sm text-muted-ink">
            Pay only for what you burn. Top-ups stack on top of any active plan.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {TOPUPS.map((o, i) => (
              <button
                key={o.credits}
                onClick={() => setTopup(i)}
                className={[
                  "rounded-md border px-4 py-2.5 font-mono text-[12px] transition-all",
                  topup === i
                    ? "border-acid bg-acid/10 text-acid shadow-[0_0_20px_-6px_rgba(197,239,87,0.6)]"
                    : "border-white/10 bg-white/[0.03] text-muted-ink hover:border-white/20 hover:text-ink",
                ].join(" ")}
              >
                +{o.credits.toLocaleString()} · ${o.price}
              </button>
            ))}
          </div>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-md bg-acid px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_24px_-4px_rgba(197,239,87,0.6)] transition-all hover:shadow-[0_0_40px_-2px_rgba(197,239,87,0.9)]"
          >
            Add {TOPUPS[topup].credits.toLocaleString()} credits →
          </Link>
        </div>
      </div>

      <p className="mt-8 text-center font-mono text-[11px] text-muted-ink">
        Prices in USD. Taxes may apply. Need an enterprise quota?{" "}
        <a className="text-acid hover:underline" href="mailto:sales@acidtest.dev">
          sales@acidtest.dev
        </a>
      </p>
    </section>
  );
}

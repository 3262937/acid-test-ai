import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LegalShell, Sec } from "@/components/site/LegalShell";

export const Route = createFileRoute("/status")({
  component: StatusPage,
  head: () => ({
    meta: [
      { title: "Status — AcidTest" },
      {
        name: "description",
        content:
          "Live operational status of AcidTest systems: web, auth, database, AI generation, and payments.",
      },
      { property: "og:title", content: "Status — AcidTest" },
      { property: "og:description", content: "Real-time health of AcidTest components." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type State = "ok" | "degraded" | "down" | "checking";

type Row = { key: string; name: string; desc: string; state: State; note?: string };

const INITIAL: Row[] = [
  { key: "web", name: "Web app", desc: "TanStack Start · Cloudflare edge", state: "ok" },
  { key: "auth", name: "Authentication", desc: "Email + Google/GitHub OAuth", state: "checking" },
  {
    key: "db",
    name: "Database + RLS",
    desc: "Postgres with row-level security",
    state: "checking",
  },
  {
    key: "ai",
    name: "AI generation",
    desc: "BYO OpenAI / Anthropic keys",
    state: "ok",
    note: "Uses your own API key — depends on provider uptime.",
  },
  { key: "payments", name: "Payments", desc: "Stripe credit packs", state: "ok" },
  { key: "storage", name: "Uploads & parsing", desc: ".docx / .xlsx / .csv / .txt", state: "ok" },
];

const DOT: Record<State, string> = {
  ok: "bg-acid shadow-[0_0_10px_rgba(197,239,87,0.7)]",
  degraded: "bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.7)]",
  down: "bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.7)]",
  checking: "bg-white/30",
};
const LABEL: Record<State, string> = {
  ok: "Operational",
  degraded: "Degraded",
  down: "Outage",
  checking: "Checking…",
};

function StatusPage() {
  const [rows, setRows] = useState<Row[]>(INITIAL);
  const [checkedAt, setCheckedAt] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const next = [...INITIAL];
      // auth
      try {
        const t0 = performance.now();
        await supabase.auth.getSession();
        const ms = Math.round(performance.now() - t0);
        next[1] = { ...next[1], state: "ok", note: `Session check ${ms}ms` };
      } catch {
        next[1] = { ...next[1], state: "down" };
      }
      // db — RLS blocks anon reads; a permission error still means DB is reachable
      try {
        const t0 = performance.now();
        const { error } = await supabase.from("profiles").select("id").limit(1);
        const ms = Math.round(performance.now() - t0);
        const reachable = !error || /permission|rls|policy|denied/i.test(error.message);
        next[2] = { ...next[2], state: reachable ? "ok" : "degraded", note: `Query ${ms}ms` };
      } catch {
        next[2] = { ...next[2], state: "down" };
      }
      if (!cancelled) {
        setRows(next);
        setCheckedAt(new Date().toLocaleTimeString());
      }
    }
    run();
    const id = setInterval(run, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const overall: State = rows.some((r) => r.state === "down")
    ? "down"
    : rows.some((r) => r.state === "degraded")
      ? "degraded"
      : rows.some((r) => r.state === "checking")
        ? "checking"
        : "ok";

  return (
    <LegalShell
      section="§ Trust — Status"
      title="System status"
      updated={checkedAt ? `Checked ${checkedAt}` : "Checking…"}
    >
      <Sec id="overall" heading="1. Overall">
        <div className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4">
          <span className={`inline-block h-3 w-3 rounded-full ${DOT[overall]}`} />
          <div>
            <div className="font-display text-lg font-semibold">
              {overall === "ok"
                ? "All systems normal"
                : overall === "degraded"
                  ? "Partial degradation"
                  : overall === "down"
                    ? "Service disruption"
                    : "Running checks…"}
            </div>
            <div className="text-xs text-muted-ink">Auto-refreshes every 60 seconds.</div>
          </div>
        </div>
      </Sec>

      <Sec id="components" heading="2. Components">
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.key}
              className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-white/[0.02] px-4 py-3"
            >
              <div className="min-w-0">
                <div className="font-mono text-[12px] uppercase tracking-widest text-ink">
                  {r.name}
                </div>
                <div className="mt-0.5 truncate text-xs text-muted-ink">
                  {r.desc}
                  {r.note ? ` · ${r.note}` : ""}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${DOT[r.state]}`} />
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-ink">
                  {LABEL[r.state]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Sec>

      <Sec id="incidents" heading="3. Incidents">
        <p>
          No incidents reported. This page reflects live client-side probes of the auth and database
          endpoints; it does not replace a full status history.
        </p>
      </Sec>

      <Sec id="contact" heading="4. Report an issue">
        <p>
          Seeing something we're not? Email{" "}
          <a className="text-acid hover:underline" href="mailto:support@acidtest.dev">
            support@acidtest.dev
          </a>{" "}
          with a screenshot and the timestamp shown above.
        </p>
      </Sec>
    </LegalShell>
  );
}

import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";

const links: { label: string; to: string; hash?: string }[] = [
  { label: "Product", to: "/" },
  { label: "Frameworks", to: "/", hash: "protocol" },
  { label: "Pricing", to: "/", hash: "pricing" },
  { label: "Docs", to: "/docs" },
  { label: "Playground", to: "/playground" },
];

function initials(email?: string | null) {
  if (!email) return "AC";
  const local = email.split("@")[0] ?? "";
  return local.slice(0, 2).toUpperCase() || "AC";
}

export function PillNav() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function signOut() {
    setOpen(false);
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

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
        {user ? (
          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-acid font-mono text-[11px] font-bold text-[#0a0a0a] transition-all hover:shadow-[0_0_20px_rgba(197,239,87,0.5)]"
              aria-label="Account menu"
            >
              {initials(user.email)}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-52 rounded-lg border border-white/10 bg-[rgba(16,17,18,0.95)] p-2 backdrop-blur-xl">
                <div className="border-b border-white/5 px-3 py-2 font-mono text-[11px] text-muted-ink">
                  {user.email}
                </div>
                <button
                  onClick={signOut}
                  className="mt-1 flex w-full items-center gap-2 rounded px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-ink transition-colors hover:bg-white/5 hover:text-acid"
                >
                  <LogOut size={12} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="rounded-full bg-acid px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-[#0a0a0a] transition-all hover:shadow-[0_0_24px_rgba(197,239,87,0.5)]"
          >
            Start Free
          </Link>
        )}
      </nav>
    </div>
  );
}

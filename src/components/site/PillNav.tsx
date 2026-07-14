import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogOut, Bookmark, User as UserIcon } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";

const links: { label: string; to: string; hash?: string }[] = [
  { label: "Product", to: "/" },
  { label: "Frameworks", to: "/", hash: "protocol" },
  { label: "Pricing", to: "/", hash: "pricing" },
  { label: "Docs", to: "/docs" },
  { label: "Playground", to: "/playground" },
];

function initialsOf(name?: string | null, email?: string | null) {
  const source = (name?.trim() || email?.split("@")[0] || "AC").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  const chars = parts.length >= 2 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
  return chars.toUpperCase();
}

export function PillNav() {
  const { user } = useSession();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function signOut() {
    setOpen(false);
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const displayName = profile?.display_name || profile?.email || user?.email || "";
  const initials = initialsOf(profile?.display_name, profile?.email ?? user?.email);
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <div className="fixed top-6 left-1/2 z-50 w-[min(1200px,calc(100%-32px))] -translate-x-1/2">
      <nav className="flex items-center justify-between rounded-full border border-white/6 bg-[rgba(16,17,18,0.72)] px-3 py-2 backdrop-blur">
        <Link to="/" className="pl-3 pr-2 font-display text-[15px] font-bold tracking-tight">
          Acid<span className="text-acid">·</span>Test
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              hash={l.hash}
              className="rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-ink transition-colors hover:text-acid"
            >
              {l.label}
            </Link>
          ))}
        </div>
        {user ? (
          <div className="flex items-center gap-2">
            <Link
              to="/saved"
              className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] font-semibold text-ink transition-all hover:border-acid/40 hover:text-acid"
            >
              <Bookmark size={12} />
              Saved
            </Link>
            <div className="relative">
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-acid font-mono text-[11px] font-bold text-[#0a0a0a] transition-all hover:shadow-[0_0_20px_rgba(197,239,87,0.5)]"
                aria-label="Account menu"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  initials
                )}
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-60 rounded-lg border border-white/10 bg-[rgba(16,17,18,0.95)] p-2 backdrop-blur-xl">
                  <div className="border-b border-white/5 px-3 py-2 font-mono text-[11px] text-muted-ink">
                    <div className="truncate text-ink">{displayName}</div>
                    {profile?.email && profile.email !== displayName && (
                      <div className="truncate">{profile.email}</div>
                    )}
                  </div>
                  <Link
                    to="/account"
                    onClick={() => setOpen(false)}
                    className="mt-1 flex w-full items-center gap-2 rounded px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-ink transition-colors hover:bg-white/5 hover:text-acid"
                  >
                    <UserIcon size={12} />
                    Account
                  </Link>
                  <Link
                    to="/saved"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-ink transition-colors hover:bg-white/5 hover:text-acid"
                  >
                    <Bookmark size={12} />
                    Saved tests
                  </Link>
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

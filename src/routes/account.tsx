import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { LogOut, Save, User as UserIcon } from "lucide-react";
import { PillNav } from "@/components/site/PillNav";
import { Footer } from "@/components/site/FinalCta";
import { useSession } from "@/hooks/use-session";
import { useProfile } from "@/hooks/use-profile";
import { updateMyProfile } from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account")({
  component: AccountPage,
  head: () => ({
    meta: [
      { title: "Account — AcidTest" },
      { name: "description", content: "Manage your AcidTest profile." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function initialsOf(name: string | null | undefined, email: string | null | undefined) {
  const source = (name?.trim() || email?.split("@")[0] || "AC").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  const chars =
    parts.length >= 2
      ? parts[0][0] + parts[1][0]
      : source.slice(0, 2);
  return chars.toUpperCase();
}

function AccountPage() {
  const { user, ready } = useSession();
  const navigate = useNavigate();
  const { profile, refresh } = useProfile();
  const update = useServerFn(updateMyProfile);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
  }, [ready, user, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    }
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await update({ data: { display_name: displayName, avatar_url: avatarUrl } });
      toast.success("Profile updated");
      void refresh();
    } catch (err) {
      toast.error("Update failed", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const initials = initialsOf(profile?.display_name, profile?.email ?? user?.email);

  return (
    <main className="relative min-h-screen bg-carbon text-ink">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_10%,rgba(197,239,87,0.10),transparent_60%)]" />
      <PillNav />
      <section className="mx-auto max-w-[820px] px-6 pt-40 pb-16 md:pt-48">
        <div className="mb-8">
          <div className="label-mono mb-3 text-acid">§ Account</div>
          <h1 className="font-display text-4xl font-bold tracking-[-0.02em] md:text-5xl">
            Your profile
          </h1>
        </div>

        <div className="folder-tab p-8 pt-10">
          <div className="mb-8 flex items-center gap-5">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="h-20 w-20 rounded-full border border-white/10 bg-black/40 object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-acid font-display text-2xl font-bold text-[#0a0a0a]">
                {initials}
              </div>
            )}
            <div>
              <div className="font-display text-xl font-semibold">
                {profile?.display_name || profile?.email || user?.email || "—"}
              </div>
              <div className="font-mono text-[12px] text-muted-ink">
                {profile?.email ?? user?.email}
              </div>
              {profile?.created_at && (
                <div className="mt-1 font-mono text-[11px] text-muted-ink">
                  Joined {new Date(profile.created_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSave} className="grid gap-5">
            <div>
              <label className="label-mono mb-2 block text-acid">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={80}
                placeholder="How should we address you?"
                className="w-full rounded-md border border-white/10 bg-carbon/60 p-3 font-mono text-[13px] text-ink outline-none focus:border-acid/50 focus:ring-2 focus:ring-acid/30"
              />
            </div>
            <div>
              <label className="label-mono mb-2 block text-acid">Avatar URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-md border border-white/10 bg-carbon/60 p-3 font-mono text-[13px] text-ink outline-none focus:border-acid/50 focus:ring-2 focus:ring-acid/30"
              />
              <p className="mt-1 font-mono text-[11px] text-muted-ink">
                Paste a link to a square image (from Gravatar, GitHub, etc.).
              </p>
            </div>
            <div>
              <label className="label-mono mb-2 block text-acid">Email</label>
              <input
                type="email"
                value={profile?.email ?? user?.email ?? ""}
                disabled
                className="w-full cursor-not-allowed rounded-md border border-white/10 bg-white/[0.02] p-3 font-mono text-[13px] text-muted-ink"
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-acid px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_24px_-4px_rgba(197,239,87,0.6)] transition-all hover:shadow-[0_0_40px_-2px_rgba(197,239,87,0.9)] disabled:opacity-50"
              >
                <Save size={12} />
                {saving ? "Saving…" : "Save changes"}
              </button>
              <div className="flex gap-2">
                <Link
                  to="/saved"
                  className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-ink transition-all hover:border-acid/40 hover:text-acid"
                >
                  <UserIcon size={12} />
                  Saved tests
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-ink transition-all hover:border-red-400/40 hover:text-red-300"
                >
                  <LogOut size={12} />
                  Sign out
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
      <Footer />
    </main>
  );
}

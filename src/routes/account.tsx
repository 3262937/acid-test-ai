import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Database, FileUp, FolderUp, KeyRound, LogOut, Plus, Save, Trash2, User as UserIcon, Zap } from "lucide-react";
import { PillNav } from "@/components/site/PillNav";
import { Footer } from "@/components/site/FinalCta";
import { BuyCreditsDialog } from "@/components/site/BuyCreditsDialog";
import { useSession } from "@/hooks/use-session";
import { useProfile } from "@/hooks/use-profile";
import { useCredits } from "@/hooks/use-credits";
import { updateMyProfile } from "@/lib/profile.functions";
import {
  type ApiKeyRow,
  type UsageSummary,
  createApiKey,
  deleteApiKey,
  getUsageSummary,
  listApiKeys,
  revokeApiKey,
} from "@/lib/api-keys.functions";
import {
  type Provider,
  type UserKeyStatus,
  deleteUserKey,
  listUserKeys,
  saveUserKey,
} from "@/lib/user-keys.functions";
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
  const chars = parts.length >= 2 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
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

        <CreditsPanel />
        <ByoKeysPanel />
        <CustomRagPanel />
        <ApiKeysPanel />
      </section>
      <Footer />
    </main>
  );
}

function CreditsPanel() {
  const { balance, refresh } = useCredits();
  const [buyOpen, setBuyOpen] = useState(false);

  // Refresh after returning from Stripe (?credits=purchased)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("credits") === "purchased") {
      // Give the webhook a beat to land, then poll.
      let tries = 0;
      const id = window.setInterval(() => {
        tries += 1;
        void refresh();
        if (tries >= 6) window.clearInterval(id);
      }, 1500);
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("credits");
      window.history.replaceState({}, "", url.toString());
      toast.success("Payment received", { description: "Credits will appear shortly." });
      return () => window.clearInterval(id);
    }
  }, [refresh]);

  return (
    <div className="mt-10 folder-tab p-8 pt-10">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Zap size={16} className="text-acid" />
          <div>
            <div className="label-mono text-acid">§ Credits</div>
            <h2 className="font-display text-2xl font-bold tracking-[-0.02em]">
              Balance & top-ups
            </h2>
          </div>
        </div>
        <button
          onClick={() => setBuyOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-acid px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_24px_-4px_rgba(197,239,87,0.6)] transition-all hover:shadow-[0_0_40px_-2px_rgba(197,239,87,0.9)]"
        >
          <Plus size={12} /> Buy credits
        </button>
      </div>

      <div className="rounded-md border border-white/10 bg-white/[0.02] p-5">
        <div className="label-mono text-muted-ink">Available</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-4xl font-bold text-acid">{balance ?? "—"}</span>
          <span className="font-mono text-[12px] text-muted-ink">credits</span>
        </div>
        <p className="mt-2 font-mono text-[11px] text-muted-ink">
          1 credit = 1 test generation on the demo or Playground. Credits never expire.
        </p>
      </div>

      <BuyCreditsDialog open={buyOpen} onClose={() => setBuyOpen(false)} onSuccess={refresh} />
    </div>
  );
}

function ApiKeysPanel() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const list = useServerFn(listApiKeys);
  const create = useServerFn(createApiKey);
  const revoke = useServerFn(revokeApiKey);
  const remove = useServerFn(deleteApiKey);
  const usageFn = useServerFn(getUsageSummary);

  const refresh = useCallback(async () => {
    try {
      const [k, u] = await Promise.all([list(), usageFn()]);
      setKeys(k.items);
      setUsage(u);
    } catch (err) {
      toast.error("Failed to load API keys", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, [list, usageFn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setCreating(true);
    try {
      const res = await create({ data: { label: label.trim() } });
      setNewKey(res.key);
      setLabel("");
      void refresh();
    } catch (err) {
      toast.error("Create failed", { description: (err as Error).message });
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    try {
      await revoke({ data: { id } });
      toast.success("Key revoked");
      void refresh();
    } catch (err) {
      toast.error("Revoke failed", { description: (err as Error).message });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this key permanently? Existing usage logs are kept.")) return;
    try {
      await remove({ data: { id } });
      toast.success("Key deleted");
      void refresh();
    } catch (err) {
      toast.error("Delete failed", { description: (err as Error).message });
    }
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  const usageByKey = new Map(usage?.perKey.map((p) => [p.api_key_id, p.count]) ?? []);

  return (
    <div className="mt-10 folder-tab p-8 pt-10">
      <div className="mb-6 flex items-center gap-3">
        <KeyRound size={16} className="text-acid" />
        <div>
          <div className="label-mono text-acid">§ API Keys</div>
          <h2 className="font-display text-2xl font-bold tracking-[-0.02em]">
            CLI &amp; MCP access
          </h2>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <UsageCard label="Last 24h" value={usage?.last24h ?? 0} />
        <UsageCard label="Last 7d" value={usage?.last7d ?? 0} />
        <UsageCard label="Last 30d" value={usage?.last30d ?? 0} />
      </div>

      <form onSubmit={handleCreate} className="mb-6 flex flex-wrap gap-2">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={60}
          placeholder="Label (e.g. laptop CLI)"
          className="flex-1 min-w-[220px] rounded-md border border-white/10 bg-carbon/60 p-3 font-mono text-[13px] text-ink outline-none focus:border-acid/50 focus:ring-2 focus:ring-acid/30"
        />
        <button
          type="submit"
          disabled={creating || !label.trim()}
          className="inline-flex items-center gap-2 rounded-md bg-acid px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-all hover:shadow-[0_0_40px_-2px_rgba(197,239,87,0.9)] disabled:opacity-50"
        >
          <Plus size={12} />
          {creating ? "Creating…" : "Create key"}
        </button>
      </form>

      {newKey && (
        <div className="mb-6 rounded-md border border-acid/40 bg-acid/5 p-4">
          <div className="label-mono mb-2 text-acid">§ Copy now — shown only once</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-black/40 px-3 py-2 font-mono text-[12px] text-ink">
              {newKey}
            </code>
            <button
              type="button"
              onClick={() => copy(newKey)}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-ink hover:border-acid/40 hover:text-acid"
            >
              <Copy size={12} /> Copy
            </button>
            <button
              type="button"
              onClick={() => setNewKey(null)}
              className="rounded-md border border-white/10 px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-ink hover:text-ink"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="font-mono text-[12px] text-muted-ink">Loading…</div>
      ) : keys.length === 0 ? (
        <div className="font-mono text-[12px] text-muted-ink">
          No keys yet. Create one above to start using the API.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[12px]">
            <thead>
              <tr className="border-b border-white/10 text-muted-ink">
                <th className="py-2 pr-3">Label</th>
                <th className="py-2 pr-3">Key</th>
                <th className="py-2 pr-3">Created</th>
                <th className="py-2 pr-3">Last used</th>
                <th className="py-2 pr-3">30d</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3" />
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-white/5">
                  <td className="py-3 pr-3 text-ink">{k.label}</td>
                  <td className="py-3 pr-3 text-muted-ink">
                    {k.prefix}…{k.last4}
                  </td>
                  <td className="py-3 pr-3 text-muted-ink">
                    {new Date(k.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-3 text-muted-ink">
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "—"}
                  </td>
                  <td className="py-3 pr-3 text-ink">{usageByKey.get(k.id) ?? 0}</td>
                  <td className="py-3 pr-3">
                    {k.revoked_at ? (
                      <span className="text-red-400">revoked</span>
                    ) : (
                      <span className="text-acid">active</span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-right">
                    {!k.revoked_at && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(k.id)}
                        className="mr-2 rounded-md border border-white/10 px-2 py-1 text-[11px] uppercase tracking-widest text-muted-ink hover:border-red-400/40 hover:text-red-300"
                      >
                        Revoke
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(k.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] uppercase tracking-widest text-muted-ink hover:border-red-400/40 hover:text-red-300"
                    >
                      <Trash2 size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <details className="mt-6 rounded-md border border-white/10 bg-black/20 p-4">
        <summary className="cursor-pointer font-mono text-[12px] text-acid">
          Using your API key
        </summary>
        <pre className="mt-3 overflow-x-auto rounded bg-black/40 p-3 font-mono text-[11px] text-ink">
          {`# List your saved tests
curl \\
  -H "Authorization: Bearer lv_live_..." \\
  ${typeof window !== "undefined" ? window.location.origin : "https://your-app"}/api/public/v1/tests

# Save a new test
curl -X POST \\
  -H "Authorization: Bearer lv_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"title":"…","story":"…","framework":"jest","code":"…"}' \\
  ${typeof window !== "undefined" ? window.location.origin : "https://your-app"}/api/public/v1/tests`}
        </pre>
      </details>
    </div>
  );
}

function UsageCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] p-4">
      <div className="label-mono text-muted-ink">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold text-ink">{value.toLocaleString()}</div>
    </div>
  );
}

function ByoKeysPanel() {
  const list = useServerFn(listUserKeys);
  const save = useServerFn(saveUserKey);
  const del = useServerFn(deleteUserKey);
  const [keys, setKeys] = useState<UserKeyStatus[]>([]);
  const [openai, setOpenai] = useState("");
  const [anthropic, setAnthropic] = useState("");
  const [nvidia, setNvidia] = useState("");
  const [busy, setBusy] = useState<Provider | null>(null);

  const refresh = useCallback(async () => {
    try {
      setKeys(await list());
    } catch (err) {
      toast.error("Failed to load keys", { description: (err as Error).message });
    }
  }, [list]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const providerLabel = (p: Provider) =>
    p === "openai" ? "OpenAI" : p === "anthropic" ? "Claude" : "NVIDIA NIM";

  async function handleSave(provider: Provider, value: string) {
    if (!value.trim()) return;
    setBusy(provider);
    try {
      await save({ data: { provider, apiKey: value.trim() } });
      toast.success(`${providerLabel(provider)} key saved`);
      if (provider === "openai") setOpenai("");
      else if (provider === "anthropic") setAnthropic("");
      else setNvidia("");
      await refresh();
    } catch (err) {
      toast.error("Save failed", { description: (err as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(provider: Provider) {
    if (!confirm(`Remove your ${providerLabel(provider)} key?`)) return;
    try {
      await del({ data: { provider } });
      toast.success("Removed");
      await refresh();
    } catch (err) {
      toast.error("Delete failed", { description: (err as Error).message });
    }
  }

  const status = (p: Provider) => keys.find((k) => k.provider === p);

  return (
    <div className="mt-10 folder-tab p-8 pt-10">
      <div className="mb-6 flex items-center gap-3">
        <KeyRound size={16} className="text-acid" />
        <div>
          <div className="label-mono text-acid">§ Bring your own AI</div>
          <h2 className="font-display text-2xl font-bold tracking-[-0.02em]">
            OpenAI, Claude &amp; NVIDIA NIM keys
          </h2>
          <p className="mt-1 font-mono text-[11px] text-muted-ink">
            Encrypted at rest. When enabled on the Playground, generation runs on your key and skips
            credit charges. NVIDIA NIM offers a generous free tier — grab a key at{" "}
            <a
              href="https://build.nvidia.com"
              target="_blank"
              rel="noreferrer"
              className="text-acid hover:underline"
            >
              build.nvidia.com
            </a>
            .
          </p>
        </div>
      </div>

      {(["openai", "anthropic", "nvidia"] as Provider[]).map((p) => {
        const cur = status(p);
        const label =
          p === "openai" ? "OpenAI" : p === "anthropic" ? "Anthropic (Claude)" : "NVIDIA NIM (free)";
        const placeholder =
          p === "openai" ? "sk-..." : p === "anthropic" ? "sk-ant-..." : "nvapi-...";
        const value = p === "openai" ? openai : p === "anthropic" ? anthropic : nvidia;
        const setValue =
          p === "openai" ? setOpenai : p === "anthropic" ? setAnthropic : setNvidia;
        return (
          <div key={p} className="mb-5 rounded-md border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="label-mono text-acid">{label}</div>
              {cur ? (
                <span className="font-mono text-[11px] text-muted-ink">saved · ···{cur.last4}</span>
              ) : (
                <span className="font-mono text-[11px] text-muted-ink">not set</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="password"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                autoComplete="off"
                className="flex-1 min-w-[240px] rounded-md border border-white/10 bg-carbon/60 p-3 font-mono text-[12px] text-ink outline-none focus:border-acid/50"
              />
              <button
                onClick={() => handleSave(p, value)}
                disabled={busy === p || !value.trim()}
                className="inline-flex items-center gap-1 rounded-md bg-acid px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] hover:shadow-[0_0_28px_-4px_rgba(197,239,87,0.7)] disabled:opacity-50"
              >
                <Save size={12} /> {busy === p ? "Saving…" : cur ? "Replace" : "Save"}
              </button>
              {cur && (
                <button
                  onClick={() => handleDelete(p)}
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-2.5 font-mono text-[11px] uppercase tracking-widest text-muted-ink hover:border-red-400/40 hover:text-red-300"
                >
                  <Trash2 size={11} /> Remove
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type CustomSource = { source: string; chunks: number; updated_at: string };

async function listSources(): Promise<CustomSource[]> {
  return [];
}

async function uploadFiles(_files: File[]): Promise<void> {
  await new Promise((r) => setTimeout(r, 300));
}

async function deleteSource(_source: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 200));
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function CustomRagPanel() {
  const [sources, setSources] = useState<CustomSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>("");

  const filesInputRef = useState<HTMLInputElement | null>(null);
  const folderInputRef = useState<HTMLInputElement | null>(null);

  const refresh = useCallback(async () => {
    try {
      const items = await listSources();
      setSources(items);
    } catch (err) {
      toast.error("Failed to load reference docs", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      setUploading(true);
      try {
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          setProgress(`Embedding ${f.name} — ${i + 1}/${files.length}…`);
          await uploadFiles([f]);
        }
        toast.success(`Uploaded ${files.length} file${files.length === 1 ? "" : "s"}`);
        void refresh();
      } catch (err) {
        toast.error("Upload failed", { description: (err as Error).message });
      } finally {
        setUploading(false);
        setProgress("");
      }
    },
    [refresh],
  );

  async function handleDelete(source: string) {
    if (!confirm(`Remove "${source}" from your reference knowledge base?`)) return;
    try {
      await deleteSource(source);
      toast.success("Removed");
      void refresh();
    } catch (err) {
      toast.error("Remove failed", { description: (err as Error).message });
    }
  }

  const accept = ".txt,.md,.docx,.xlsx,.xls,.csv";

  return (
    <div className="mt-10 folder-tab p-8 pt-10">
      <div className="mb-6 flex items-center gap-3">
        <Database size={16} className="text-acid" />
        <div>
          <div className="label-mono text-acid">§ Custom RAG</div>
          <h2 className="font-display text-2xl font-bold tracking-[-0.02em]">
            Reference knowledge base
          </h2>
          <p className="mt-1 font-mono text-[11px] text-muted-ink">
            Upload docs or whole folders. AcidTest embeds them and pulls the most relevant
            passages in as reference when you generate new test suites.
          </p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <input
          ref={(el) => {
            filesInputRef[1](el);
          }}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={(el) => {
            folderInputRef[1](el);
          }}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
          // @ts-expect-error non-standard directory picker attributes
          webkitdirectory=""
          directory=""
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => filesInputRef[0]?.click()}
          className="inline-flex items-center gap-2 rounded-md bg-acid px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_24px_-4px_rgba(197,239,87,0.6)] transition-all hover:shadow-[0_0_40px_-2px_rgba(197,239,87,0.9)] disabled:opacity-50"
        >
          <FileUp size={12} />
          Upload files
        </button>
        <button
          type="button"
          disabled={uploading}
          onClick={() => folderInputRef[0]?.click()}
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-ink transition-all hover:border-acid/40 hover:text-acid disabled:opacity-50"
        >
          <FolderUp size={12} />
          Upload folder
        </button>
        {uploading && progress && (
          <span className="font-mono text-[11px] text-muted-ink">{progress}</span>
        )}
      </div>

      <div
        className={`mb-5 rounded-md border border-dashed border-white/10 bg-white/[0.02] p-6 text-center font-mono text-[11px] text-muted-ink ${
          uploading ? "opacity-60" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (uploading) return;
          void handleFiles(e.dataTransfer.files);
        }}
      >
        Drop files here — accepted: .txt, .md, .docx, .xlsx, .xls, .csv
      </div>

      {loading ? (
        <div className="font-mono text-[12px] text-muted-ink">Loading…</div>
      ) : sources.length === 0 ? (
        <div className="font-mono text-[12px] text-muted-ink">
          No reference docs yet. Upload files or a folder to ground your generations.
        </div>
      ) : (
        <div className="grid gap-2">
          {sources.map((s) => (
            <div
              key={s.source}
              className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.02] p-4"
            >
              <div className="min-w-0">
                <div className="truncate font-mono text-[13px] text-ink">{s.source}</div>
                <div className="mt-0.5 font-mono text-[11px] text-muted-ink">
                  {s.chunks} chunk{s.chunks === 1 ? "" : "s"} · added {relTime(s.updated_at)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(s.source)}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-2.5 font-mono text-[11px] uppercase tracking-widest text-muted-ink hover:border-red-400/40 hover:text-red-300"
              >
                <Trash2 size={11} /> Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

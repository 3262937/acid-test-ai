import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Github, Check, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getUserGitHubSettings,
  saveUserGitHubSettings,
  pushTestToGitHub,
  type GitHubSettings,
} from "@/lib/github-export.functions";
import { type Framework } from "./generators";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  framework: Framework;
  code: string;
  filename?: string;
}

export function GitHubExportDialog({ open, onClose, title, framework, code, filename }: Props) {
  const fetchSettings = useServerFn(getUserGitHubSettings);
  const saveSettings = useServerFn(saveUserGitHubSettings);
  const push = useServerFn(pushTestToGitHub);

  const [settings, setSettings] = useState<GitHubSettings>({
    repo_full_name: "",
    branch: "main",
    base_path: "acidtest-suites/",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [result, setResult] = useState<{ url: string; commit: string } | null>(null);

  useEffect(() => {
    if (!open) {
      setResult(null);
      return;
    }
    setLoading(true);
    fetchSettings()
      .then((s) => {
        if (s) setSettings(s);
      })
      .catch(() => {
        // leave defaults
      })
      .finally(() => setLoading(false));
  }, [open, fetchSettings]);

  async function handleSave() {
    setSaving(true);
    try {
      await saveSettings({ data: settings });
      toast.success("GitHub settings saved");
    } catch (e) {
      toast.error("Failed to save settings", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function handlePush() {
    setPushing(true);
    try {
      const res = await push({
        data: { title, framework, code, filename },
      });
      setResult(res);
      toast.success("Pushed to GitHub");
    } catch (e) {
      toast.error("Push failed", { description: (e as Error).message });
    } finally {
      setPushing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-white/10 bg-carbon text-ink sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Github size={18} className="text-acid" />
            Export to GitHub
          </DialogTitle>
          <DialogDescription className="text-muted-ink">
            Push this {framework} suite to a repository you own.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 rounded-md border border-acid/30 bg-acid/10 px-3 py-2 text-acid">
              <Check size={16} />
              <span className="font-mono text-[12px]">Pushed successfully</span>
            </div>
            <a
              href={result.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[12px] text-ink transition-colors hover:border-acid/40 hover:text-acid"
            >
              <ExternalLink size={14} />
              Open file on GitHub
            </a>
            <Button onClick={onClose} className="w-full bg-acid text-[#0a0a0a] hover:bg-acid/90">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-ink">
                <Loader2 size={16} className="animate-spin" />
                <span className="font-mono text-[12px]">Loading settings…</span>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="gh-repo" className="label-mono text-muted-ink">
                    Repository
                  </Label>
                  <Input
                    id="gh-repo"
                    value={settings.repo_full_name}
                    onChange={(e) => setSettings((s) => ({ ...s, repo_full_name: e.target.value }))}
                    placeholder="owner/repo"
                    className="border-white/10 bg-carbon/60 font-mono text-[12px] text-ink placeholder:text-muted-ink focus-visible:ring-acid/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="gh-branch" className="label-mono text-muted-ink">
                      Branch
                    </Label>
                    <Input
                      id="gh-branch"
                      value={settings.branch}
                      onChange={(e) => setSettings((s) => ({ ...s, branch: e.target.value }))}
                      placeholder="main"
                      className="border-white/10 bg-carbon/60 font-mono text-[12px] text-ink placeholder:text-muted-ink focus-visible:ring-acid/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gh-path" className="label-mono text-muted-ink">
                      Base path
                    </Label>
                    <Input
                      id="gh-path"
                      value={settings.base_path}
                      onChange={(e) => setSettings((s) => ({ ...s, base_path: e.target.value }))}
                      placeholder="acidtest-suites/"
                      className="border-white/10 bg-carbon/60 font-mono text-[12px] text-ink placeholder:text-muted-ink focus-visible:ring-acid/30"
                    />
                  </div>
                </div>

                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3">
                  <div className="label-mono mb-1 text-acid">File preview</div>
                  <div className="font-mono text-[11px] text-muted-ink">
                    {settings.base_path || ""}
                    {filename || "<generated>"}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 border-white/10 bg-white/[0.03] font-mono text-[11px] uppercase tracking-widest text-ink hover:border-acid/40 hover:text-acid disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Github size={14} />}
                    {saving ? "Saving…" : "Save settings"}
                  </Button>
                  <Button
                    onClick={handlePush}
                    disabled={pushing || !settings.repo_full_name.trim()}
                    className="flex-1 bg-acid font-mono text-[11px] uppercase tracking-widest text-[#0a0a0a] hover:bg-acid/90 disabled:opacity-50"
                  >
                    {pushing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ExternalLink size={14} />
                    )}
                    {pushing ? "Pushing…" : "Push now"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

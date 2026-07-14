import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { FRAMEWORK_META, type Framework } from "@/components/site/generators";

export type GitHubSettings = {
  repo_full_name: string;
  branch: string;
  base_path: string;
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/github";

function gatewayHeaders() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const githubKey = process.env.GITHUB_API_KEY;
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!githubKey)
    throw new Error(
      "GITHUB_API_KEY is not configured. Link the GitHub connector in project settings.",
    );
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": githubKey,
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function filenameFor(framework: Framework, title: string): string {
  const slug = slugify(title) || "generated";
  const ext = FRAMEWORK_META[framework].ext;
  const short = FRAMEWORK_META[framework].short.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return `${slug}.${short}.${ext}`;
}

async function getFileSha(repo: string, branch: string, path: string): Promise<string | undefined> {
  const res = await fetch(`${GATEWAY_URL}/repos/${repo}/contents/${path}?ref=${branch}`, {
    method: "GET",
    headers: gatewayHeaders(),
  });
  if (!res.ok) return undefined;
  const json = (await res.json()) as { sha?: string };
  return json.sha;
}

export const getUserGitHubSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GitHubSettings | null> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_github_settings")
      .select("repo_full_name, branch, base_path")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as GitHubSettings | null;
  });

export const saveUserGitHubSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: GitHubSettings) => {
    const repo = data.repo_full_name.trim();
    if (!repo) throw new Error("Repository is required");
    if (!/^[^/]+\/[^/]+$/.test(repo)) throw new Error("Repository must be owner/repo");
    const branch = (data.branch || "main").trim();
    let base = (data.base_path || "").trim();
    if (base && !base.endsWith("/")) base += "/";
    return { repo_full_name: repo, branch, base_path: base };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("user_github_settings")
      .upsert({ user_id: userId, ...data }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const pushTestToGitHub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { title: string; framework: Framework; code: string; filename?: string }) => {
      if (!data.title.trim()) throw new Error("Title is required");
      if (!data.framework.trim()) throw new Error("Framework is required");
      if (!data.code.trim()) throw new Error("Code is required");
      return {
        title: data.title.trim().slice(0, 200),
        framework: data.framework as Framework,
        code: data.code,
        filename: data.filename?.trim(),
      };
    },
  )
  .handler(async ({ data, context }): Promise<{ url: string; commit: string }> => {
    const { supabase, userId } = context;
    const { data: settings, error } = await supabase
      .from("user_github_settings")
      .select("repo_full_name, branch, base_path")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!settings)
      throw new Error("GitHub settings not configured. Set a repo in Account → GitHub export.");

    const { repo_full_name, branch, base_path } = settings as GitHubSettings;
    const filename = data.filename || filenameFor(data.framework, data.title);
    const path = `${base_path}${filename}`;
    const message = `test(acidtest): add ${data.framework} suite — ${data.title}`;
    const content = Buffer.from(data.code, "utf8").toString("base64");

    const sha = await getFileSha(repo_full_name, branch, path);

    const body: Record<string, string> = {
      message,
      content,
      branch,
    };
    if (sha) body.sha = sha;

    const res = await fetch(`${GATEWAY_URL}/repos/${repo_full_name}/contents/${path}`, {
      method: "PUT",
      headers: gatewayHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub API ${res.status}: ${text}`);
    }

    const json = (await res.json()) as {
      content?: { html_url?: string };
      commit?: { html_url?: string; message?: string };
    };

    return {
      url: json.content?.html_url || `https://github.com/${repo_full_name}/blob/${branch}/${path}`,
      commit: json.commit?.html_url || json.commit?.message || message,
    };
  });

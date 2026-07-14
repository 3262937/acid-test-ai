import { createFileRoute } from "@tanstack/react-router";

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type AuthedKey = { id: string; user_id: string };

async function authenticate(request: Request): Promise<
  { ok: true; key: AuthedKey } | { ok: false; response: Response }
> {
  const auth = request.headers.get("authorization") ?? "";
  const match = auth.match(/^Bearer\s+(lv_live_[A-Za-z0-9]+)$/);
  if (!match) {
    return {
      ok: false,
      response: json({ error: "missing_or_invalid_bearer_token" }, 401),
    };
  }
  const hash = await sha256Hex(match[1]);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .select("id,user_id,revoked_at")
    .eq("key_hash", hash)
    .maybeSingle();
  if (error || !data || data.revoked_at) {
    return { ok: false, response: json({ error: "invalid_api_key" }, 401) };
  }
  return { ok: true, key: { id: data.id as string, user_id: data.user_id as string } };
}

async function meter(key: AuthedKey, endpoint: string, status_code: number) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await Promise.all([
    supabaseAdmin
      .from("api_usage")
      .insert({ api_key_id: key.id, user_id: key.user_id, endpoint, status_code }),
    supabaseAdmin
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", key.id),
  ]);
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateBuckets = new Map<string, number[]>();

function checkRateLimit(keyId: string): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const hits = (rateBuckets.get(keyId) ?? []).filter((t) => t > cutoff);
  if (hits.length >= RATE_LIMIT_MAX) {
    const retryAfter = Math.max(1, Math.ceil((hits[0] + RATE_LIMIT_WINDOW_MS - now) / 1000));
    rateBuckets.set(keyId, hits);
    return { ok: false, retryAfter };
  }
  hits.push(now);
  rateBuckets.set(keyId, hits);
  if (rateBuckets.size > 10_000) {
    for (const [k, v] of rateBuckets) {
      const kept = v.filter((t) => t > cutoff);
      if (kept.length === 0) rateBuckets.delete(k);
      else rateBuckets.set(k, kept);
    }
  }
  return { ok: true };
}

function rateLimitResponse(retryAfter: number): Response {
  return json(
    {
      error: "rate_limit_exceeded",
      message: `Too many requests. Limit is ${RATE_LIMIT_MAX} requests per minute per API key.`,
      retry_after_seconds: retryAfter,
    },
    429,
    {
      "Retry-After": String(retryAfter),
      "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
      "X-RateLimit-Remaining": "0",
    },
  );
}

export const Route = createFileRoute("/api/public/v1/tests")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await authenticate(request);
        if (!auth.ok) return auth.response;
        const rl = checkRateLimit(auth.key.id);
        if (!rl.ok) {
          void meter(auth.key, "GET /v1/tests", 429);
          return rateLimitResponse(rl.retryAfter);
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("saved_tests")
          .select("id,title,story,framework,code,created_at")
          .eq("user_id", auth.key.user_id)
          .order("created_at", { ascending: false });
        const status = error ? 500 : 200;
        void meter(auth.key, "GET /v1/tests", status);
        if (error) return json({ error: error.message }, 500);
        return json({ items: data ?? [] });
      },
      POST: async ({ request }) => {
        const auth = await authenticate(request);
        if (!auth.ok) return auth.response;
        const rl = checkRateLimit(auth.key.id);
        if (!rl.ok) {
          void meter(auth.key, "POST /v1/tests", 429);
          return rateLimitResponse(rl.retryAfter);
        }


        let body: unknown;
        try {
          body = await request.json();
        } catch {
          void meter(auth.key, "POST /v1/tests", 400);
          return json({ error: "invalid_json" }, 400);
        }
        const b = body as Record<string, unknown>;
        const title = typeof b?.title === "string" ? b.title.trim() : "";
        const story = typeof b?.story === "string" ? b.story.trim() : "";
        const framework = typeof b?.framework === "string" ? b.framework.trim() : "";
        const code = typeof b?.code === "string" ? b.code : "";
        if (!title || !story || !framework || !code) {
          void meter(auth.key, "POST /v1/tests", 422);
          return json({ error: "missing_fields", required: ["title", "story", "framework", "code"] }, 422);
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("saved_tests")
          .insert({
            user_id: auth.key.user_id,
            title: title.slice(0, 200),
            story: story.slice(0, 5000),
            framework: framework.slice(0, 40),
            code: code.slice(0, 200_000),
          })
          .select("id,title,story,framework,code,created_at")
          .single();
        const status = error ? 500 : 201;
        void meter(auth.key, "POST /v1/tests", status);
        if (error) return json({ error: error.message }, 500);
        return json({ item: data }, 201);
      },
    },
  },
});

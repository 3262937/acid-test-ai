import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ApiKeyRow = {
  id: string;
  label: string;
  prefix: string;
  last4: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export type UsageSummary = {
  last24h: number;
  last7d: number;
  last30d: number;
  perKey: { api_key_id: string; count: number }[];
};

function randomKey(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return `lv_live_${out}`;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const listApiKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ items: ApiKeyRow[] }> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("api_keys")
      .select("id,label,prefix,last4,created_at,last_used_at,revoked_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: (data ?? []) as ApiKeyRow[] };
  });

export const createApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { label: string }) => {
    const label = (data.label ?? "").trim();
    if (!label) throw new Error("label required");
    if (label.length > 60) throw new Error("label too long");
    return { label };
  })
  .handler(async ({ data, context }): Promise<{ id: string; key: string; row: ApiKeyRow }> => {
    const { supabase, userId } = context;
    const key = randomKey();
    const key_hash = await sha256Hex(key);
    const prefix = key.slice(0, 12); // "lv_live_XXXX"
    const last4 = key.slice(-4);

    const { data: row, error } = await supabase
      .from("api_keys")
      .insert({ user_id: userId, label: data.label, prefix, last4, key_hash })
      .select("id,label,prefix,last4,created_at,last_used_at,revoked_at")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string, key, row: row as ApiKeyRow };
  });

export const revokeApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.id)) throw new Error("invalid id");
    return data;
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.id)) throw new Error("invalid id");
    return data;
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("api_keys")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getUsageSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UsageSummary> => {
    const { supabase, userId } = context;
    const now = Date.now();
    const d1 = new Date(now - 24 * 3600 * 1000).toISOString();
    const d7 = new Date(now - 7 * 24 * 3600 * 1000).toISOString();
    const d30 = new Date(now - 30 * 24 * 3600 * 1000).toISOString();

    const [{ count: c1 }, { count: c7 }, { count: c30 }, { data: recent }] = await Promise.all([
      supabase.from("api_usage").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", d1),
      supabase.from("api_usage").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", d7),
      supabase.from("api_usage").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", d30),
      supabase.from("api_usage").select("api_key_id").eq("user_id", userId).gte("created_at", d30),
    ]);

    const perKeyMap = new Map<string, number>();
    for (const r of (recent ?? []) as { api_key_id: string }[]) {
      perKeyMap.set(r.api_key_id, (perKeyMap.get(r.api_key_id) ?? 0) + 1);
    }
    const perKey = Array.from(perKeyMap.entries()).map(([api_key_id, count]) => ({ api_key_id, count }));

    return { last24h: c1 ?? 0, last7d: c7 ?? 0, last30d: c30 ?? 0, perKey };
  });

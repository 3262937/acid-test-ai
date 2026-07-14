import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Provider = "openai" | "anthropic";

export type UserKeyStatus = { provider: Provider; last4: string; updated_at: string };

export const listUserKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UserKeyStatus[]> => {
    const { supabase, userId } = context;
    const { data, error } = await (
      supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (
              col: string,
              v: string,
            ) => Promise<{ data: UserKeyStatus[] | null; error: { message: string } | null }>;
          };
        };
      }
    )
      .from("user_api_keys")
      .select("provider, key_last4, updated_at")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      provider: r.provider as Provider,
      last4: (r as unknown as { key_last4: string }).key_last4,
      updated_at: r.updated_at,
    }));
  });

export const saveUserKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { provider: Provider; apiKey: string }) => {
    if (!["openai", "anthropic"].includes(data.provider)) throw new Error("Invalid provider");
    const k = data.apiKey.trim();
    if (k.length < 20) throw new Error("Key looks too short");
    if (data.provider === "openai" && !k.startsWith("sk-"))
      throw new Error("OpenAI keys start with sk-");
    if (data.provider === "anthropic" && !k.startsWith("sk-ant-"))
      throw new Error("Anthropic keys start with sk-ant-");
    return { provider: data.provider, apiKey: k };
  })
  .handler(async ({ data, context }) => {
    const { encryptUserKey } = await import("@/lib/user-key-crypto.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ciphertext = encryptUserKey(data.apiKey);
    const last4 = data.apiKey.slice(-4);
    const { error } = await (
      supabaseAdmin as unknown as {
        from: (t: string) => {
          upsert: (
            row: Record<string, unknown>,
            opts: { onConflict: string },
          ) => Promise<{ error: { message: string } | null }>;
        };
      }
    )
      .from("user_api_keys")
      .upsert(
        {
          user_id: context.userId,
          provider: data.provider,
          key_ciphertext: ciphertext,
          key_last4: last4,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" },
      );
    if (error) throw new Error(error.message);
    return { ok: true, last4 };
  });

export const deleteUserKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { provider: Provider }) => {
    if (!["openai", "anthropic"].includes(data.provider)) throw new Error("Invalid provider");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await (
      supabase as unknown as {
        from: (t: string) => {
          delete: () => {
            eq: (
              col: string,
              v: string,
            ) => {
              eq: (col: string, v: string) => Promise<{ error: { message: string } | null }>;
            };
          };
        };
      }
    )
      .from("user_api_keys")
      .delete()
      .eq("user_id", userId)
      .eq("provider", data.provider);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

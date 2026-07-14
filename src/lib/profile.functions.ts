import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ profile: Profile }> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,display_name,avatar_url,created_at")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Profile not found");
    return { profile: data as Profile };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { display_name?: string; avatar_url?: string }) => {
    const out: { display_name?: string; avatar_url?: string | null } = {};
    if (typeof data.display_name === "string") {
      const trimmed = data.display_name.trim();
      if (trimmed.length > 80) throw new Error("Display name too long");
      out.display_name = trimmed || "";
    }
    if (typeof data.avatar_url === "string") {
      const trimmed = data.avatar_url.trim();
      if (trimmed && !/^https?:\/\//i.test(trimmed)) {
        throw new Error("Avatar URL must start with http(s)://");
      }
      if (trimmed.length > 500) throw new Error("Avatar URL too long");
      out.avatar_url = trimmed || null;
    }
    return out;
  })
  .handler(async ({ data, context }): Promise<{ profile: Profile }> => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", userId)
      .select("id,email,display_name,avatar_url,created_at")
      .single();
    if (error) throw new Error(error.message);
    return { profile: row as Profile };
  });

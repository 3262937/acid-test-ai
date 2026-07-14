import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SavedTest = {
  id: string;
  title: string;
  story: string;
  framework: string;
  code: string;
  created_at: string;
};

export const listSavedTests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ items: SavedTest[] }> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("saved_tests")
      .select("id,title,story,framework,code,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: (data ?? []) as SavedTest[] };
  });

export const saveTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { title: string; story: string; framework: string; code: string }) => {
    if (!data.title.trim()) throw new Error("title required");
    if (!data.story.trim()) throw new Error("story required");
    if (!data.framework.trim()) throw new Error("framework required");
    if (!data.code.trim()) throw new Error("code required");
    return {
      title: data.title.slice(0, 200),
      story: data.story.slice(0, 5000),
      framework: data.framework.slice(0, 40),
      code: data.code.slice(0, 200_000),
    };
  })
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("saved_tests")
      .insert({ user_id: userId, ...data })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const deleteSavedTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.id)) throw new Error("invalid id");
    return data;
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("saved_tests")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

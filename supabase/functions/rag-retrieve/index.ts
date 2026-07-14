// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// deno-lint-ignore no-explicit-any
const session = new (globalThis as any).Supabase.ai.Session("gte-small");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { query, k } = await req.json();
    if (typeof query !== "string" || !query.trim()) {
      return json({ chunks: [] });
    }

    const embedding = await session.run(query, { mean_pool: true, normalize: true });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.rpc("match_kb_documents", {
      query_embedding: embedding,
      match_count: typeof k === "number" && k > 0 ? Math.min(k, 20) : 5,
    });

    if (error) {
      console.error("match_kb_documents error", error);
      return json({ chunks: [] });
    }

    const chunks = (data ?? []).map((r: any) => ({
      content: r.content,
      source: r.source,
      similarity: r.similarity,
    }));
    return json({ chunks });
  } catch (e) {
    console.error("rag-retrieve error", e);
    return json({ chunks: [] });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Provider } from "@/lib/user-keys.functions";

import { FRAMEWORKS, type Framework } from "@/components/site/generators";

function buildPrompt(story: string, framework: Framework) {
  return `You are a senior QA engineer. Generate a runnable ${framework} test suite in the framework's native language for the following user story.
Return ONLY the code, no markdown fences, no commentary.

USER STORY:
${story}

Requirements:
- 3 test cases covering happy path, invalid input, edge case.
- Use realistic selectors / assertions idiomatic to ${framework}.
- Include a short header comment describing the spec.`;
}

async function callOpenAI(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { choices: { message: { content: string } }[] };
  return json.choices[0]?.message?.content ?? "";
}

async function callAnthropic(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { content: { text: string }[] };
  return json.content.map((c) => c.text).join("");
}

export const generateWithUserKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { provider: Provider; story: string; framework: Framework }) => {
    if (!["openai", "anthropic"].includes(data.provider)) throw new Error("Invalid provider");
    if (!FRAMEWORKS.includes(data.framework)) throw new Error("Invalid framework");
    const s = data.story.trim();
    if (s.length < 5) throw new Error("Story too short");
    if (s.length > 4000) throw new Error("Story too long");
    return { ...data, story: s };
  })
  .handler(async ({ data, context }): Promise<{ code: string } | { error: string }> => {
    const { decryptUserKey } = await import("@/lib/user-key-crypto.server");
    const { supabase, userId } = context;
    const { data: row, error } = await (supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (col: string, v: string) => {
            eq: (col: string, v: string) => {
              maybeSingle: () => Promise<{ data: { key_ciphertext: string } | null; error: { message: string } | null }>;
            };
          };
        };
      };
    })
      .from("user_api_keys")
      .select("key_ciphertext")
      .eq("user_id", userId)
      .eq("provider", data.provider)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { error: `No ${data.provider} key saved. Add one in Account.` };

    try {
      const apiKey = decryptUserKey(row.key_ciphertext);
      const prompt = buildPrompt(data.story, data.framework);
      const code =
        data.provider === "openai"
          ? await callOpenAI(apiKey, prompt)
          : await callAnthropic(apiKey, prompt);
      return { code: code.trim() };
    } catch (e) {
      return { error: (e as Error).message };
    }
  });

export const parseUploadedFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { filename: string; base64: string }) => {
    if (!data.filename || !data.base64) throw new Error("Missing file");
    if (data.base64.length > 8_000_000) throw new Error("File too large (max ~6 MB)");
    return data;
  })
  .handler(async ({ data }): Promise<{ text: string } | { error: string }> => {
    try {
      const buf = Buffer.from(data.base64, "base64");
      const lower = data.filename.toLowerCase();
      if (lower.endsWith(".txt") || lower.endsWith(".md")) {
        return { text: buf.toString("utf8").slice(0, 20_000) };
      }
      if (lower.endsWith(".docx")) {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer: buf });
        return { text: result.value.slice(0, 20_000) };
      }
      if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv")) {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(buf, { type: "buffer" });
        const lines: string[] = [];
        for (const name of wb.SheetNames) {
          lines.push(`# Sheet: ${name}`);
          const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name]);
          lines.push(csv);
        }
        return { text: lines.join("\n").slice(0, 20_000) };
      }
      return { error: "Unsupported file type. Use .txt, .md, .docx, .xlsx, .xls, or .csv." };
    } catch (e) {
      return { error: (e as Error).message };
    }
  });

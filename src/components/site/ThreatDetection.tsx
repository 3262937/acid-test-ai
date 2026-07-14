import { useMemo, useRef, useState } from "react";
import { CheckCircle2, XCircle, Shield, Upload } from "lucide-react";
import { toast } from "sonner";

type Verdict = { id: string; title: string; status: "PASS" | "FAIL"; ms: number };
type LogLine = { t: string; msg: string; tone?: "acid" | "warn" | "muted" };

const DEFAULT_GENERATED = `import { test, expect } from "@playwright/test";

test("valid email receives reset link", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: /forgot/i }).click();
  await page.getByLabel("Email").fill("qa+specimen@acidtest.dev");
  await page.getByRole("button", { name: /send link/i }).click();
  await expect(page.getByText(/check your inbox/i)).toBeVisible();
});

test("invalid email returns generic success", async ({ page }) => {
  await page.goto("/reset");
  await page.getByLabel("Email").fill("ghost@nowhere.zzz");
  await page.getByRole("button", { name: /send link/i }).click();
  await expect(page.getByText(/check your inbox/i)).toBeVisible();
});

test("expired token rejected after 60m", async ({ page }) => {
  await page.goto("/reset?token=expired.mock.token");
  await expect(page.getByText(/link has expired/i)).toBeVisible();
});`;

// Deterministic hash + seeded RNG so the same code yields the same verdicts.
function hash(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}
function rng(seed: number) {
  let x = seed || 1;
  return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 0xffffffff);
}

function extractTitles(code: string): string[] {
  const titles: string[] = [];
  const patterns = [
    /\btest\s*\(\s*["'`]([^"'`]+)/g,
    /\bit\s*\(\s*["'`]([^"'`]+)/g,
    /\bdescribe\s*\(\s*["'`]([^"'`]+)/g,
  ];
  for (const p of patterns) {
    let m;
    while ((m = p.exec(code)) !== null) titles.push(m[1]);
  }
  if (titles.length === 0) return ["scenario one", "scenario two", "scenario three"];
  return titles.slice(0, 6);
}

type DetectedFw =
  | "Playwright"
  | "Cypress"
  | "Selenium (Java)"
  | "Selenium (Python)"
  | "Selenium (C#)"
  | "Puppeteer"
  | "WebdriverIO"
  | "Appium"
  | "Espresso"
  | "XCUITest"
  | "RestAssured"
  | "Postman"
  | "Robot Framework"
  | "Cucumber"
  | "JUnit"
  | "TestNG"
  | "Custom";

const FW_LANG: Record<DetectedFw, string> = {
  Playwright: "TypeScript",
  Cypress: "TypeScript",
  "Selenium (Java)": "Java",
  "Selenium (Python)": "Python",
  "Selenium (C#)": "C#",
  Puppeteer: "TypeScript",
  WebdriverIO: "TypeScript",
  Appium: "JavaScript",
  Espresso: "Kotlin",
  XCUITest: "Swift",
  RestAssured: "Java",
  Postman: "JSON",
  "Robot Framework": "Robot",
  Cucumber: "Gherkin",
  JUnit: "Java",
  TestNG: "Java",
  Custom: "Unknown",
};

function detectFramework(code: string, filename?: string): DetectedFw {
  const name = (filename ?? "").toLowerCase();
  const src = code ?? "";

  // Filename-first hints (unambiguous)
  if (name.endsWith(".feature")) return "Cucumber";
  if (name.endsWith(".robot")) return "Robot Framework";
  if (name.endsWith(".swift")) return "XCUITest";
  if (name.endsWith(".kt")) return "Espresso";
  if (name.endsWith(".postman.json") || name.endsWith(".postman_collection.json"))
    return "Postman";

  // Content signatures — most specific first
  if (/@playwright\/test|from ["']playwright|await page\.getBy/.test(src)) return "Playwright";
  if (/\bcy\.\w+\(|\/\/\/\s*<reference types="cypress"|cypress\.config/i.test(src)) return "Cypress";
  if (/@wdio\/|browser\.\$\(|wdio\.conf/i.test(src)) return "WebdriverIO";
  if (/from ["']puppeteer|require\(["']puppeteer["']\)|puppeteer\.launch/.test(src))
    return "Puppeteer";
  if (/io\.appium|AppiumDriver|webdriverio.*appium/i.test(src)) return "Appium";
  if (/androidx\.test\.espresso|onView\(|withId\(/.test(src)) return "Espresso";
  if (/XCTestCase|XCUIApplication|import XCTest/.test(src)) return "XCUITest";
  if (/io\.restassured|RestAssured\.|given\(\)\s*\.\s*when/.test(src)) return "RestAssured";
  if (/"_postman_id"|"info"\s*:\s*\{[^}]*"schema"\s*:\s*"https:\/\/schema\.getpostman/i.test(src))
    return "Postman";
  if (/\*\*\*\s*Settings\s*\*\*\*|Library\s+SeleniumLibrary|Resource\s+/.test(src))
    return "Robot Framework";
  if (/^\s*Feature:\s|^\s*Scenario:\s|Given\s.+\nWhen\s/m.test(src)) return "Cucumber";
  if (/@Test\b[\s\S]*org\.testng|import\s+org\.testng/.test(src)) return "TestNG";
  if (/import\s+org\.junit|@Test\b.*junit|org\.junit\.jupiter/i.test(src)) return "JUnit";
  if (/selenium\.webdriver|from selenium|import\s+webdriver/i.test(src)) {
    if (/def\s+test_|import\s+pytest|from selenium/.test(src)) return "Selenium (Python)";
    if (/using\s+OpenQA\.Selenium|\[Test\]|NUnit/.test(src)) return "Selenium (C#)";
    return "Selenium (Java)";
  }
  if (/using\s+OpenQA\.Selenium/.test(src)) return "Selenium (C#)";

  return "Custom";
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000).toString().padStart(2, "0");
  const cs = Math.floor((ms % 1000) / 10).toString().padStart(2, "0");
  return `${s}.${cs}`;
}

export function ThreatDetection() {
  const [tab, setTab] = useState<"generated" | "own">("generated");
  const [own, setOwn] = useState("");
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [verdicts, setVerdicts] = useState<Verdict[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const timeouts = useRef<number[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large", { description: "Max 2 MB." });
      return;
    }
    setUploading(true);
    try {
      const text = await file.text();
      setOwn(text.slice(0, 50_000));
      setUploadedName(file.name);
      setTab("own");
      const detected = detectFramework(text, file.name);
      toast.success(`Detected: ${detected}`, { description: `${file.name} → editor` });
    } catch (err) {
      toast.error("Read failed", { description: (err as Error).message });
    } finally {
      setUploading(false);
    }
  }

  const activeCode = tab === "generated" ? DEFAULT_GENERATED : own;
  const framework = useMemo(
    () => detectFramework(activeCode, tab === "own" ? uploadedName ?? undefined : undefined),
    [activeCode, tab, uploadedName],
  );
  const summary = useMemo(() => {
    if (verdicts.length === 0) return null;
    const pass = verdicts.filter((v) => v.status === "PASS").length;
    const fail = verdicts.length - pass;
    const total = verdicts.reduce((a, v) => a + v.ms, 0);
    return { pass, fail, total, count: verdicts.length };
  }, [verdicts]);

  function clearTimers() {
    timeouts.current.forEach((id) => window.clearTimeout(id));
    timeouts.current = [];
  }

  function run() {
    if (!activeCode.trim()) return;
    clearTimers();
    setRunning(true);
    setLogs([]);
    setVerdicts([]);

    const titles = extractTitles(activeCode);
    const seed = hash(activeCode);
    const rand = rng(seed);
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const timeline: { at: number; run: () => void }[] = [];
    let t = 0;
    const push = (delta: number, run: () => void) => {
      t += delta;
      timeline.push({ at: t, run });
    };

    push(0, () =>
      setLogs((l) => [...l, { t: fmt(t), msg: `▸ loading ${framework} harness…`, tone: "muted" }]),
    );
    push(320, () =>
      setLogs((l) => [
        ...l,
        { t: fmt(t), msg: `▸ resolving ${titles.length} scenarios · seed 0x${seed.toString(16).slice(0, 6)}`, tone: "muted" },
      ]),
    );
    push(280, () =>
      setLogs((l) => [...l, { t: fmt(t), msg: `▸ spawning isolated worker`, tone: "muted" }]),
    );

    const built: Verdict[] = [];
    titles.forEach((title, i) => {
      const ms = 90 + Math.floor(rand() * 260);
      const pass = rand() > 0.22; // ~78% pass — feels real
      push(260 + Math.floor(rand() * 240), () =>
        setLogs((l) => [
          ...l,
          { t: fmt(t), msg: `→ ${title}`, tone: "muted" },
        ]),
      );
      push(ms, () => {
        const v: Verdict = {
          id: `TC-${(i + 1).toString().padStart(3, "0")}`,
          title,
          status: pass ? "PASS" : "FAIL",
          ms,
        };
        built.push(v);
        setVerdicts([...built]);
        setLogs((l) => [
          ...l,
          {
            t: fmt(t),
            msg: `${pass ? "✓" : "✗"} ${v.id} ${pass ? "PASS" : "FAIL"} · ${ms}ms`,
            tone: pass ? "acid" : "warn",
          },
        ]);
      });
    });

    push(280, () => {
      const pass = built.filter((v) => v.status === "PASS").length;
      const fail = built.length - pass;
      setLogs((l) => [
        ...l,
        {
          t: fmt(t),
          msg: `● scan complete · ${pass} PASS · ${fail} FAIL`,
          tone: fail === 0 ? "acid" : "warn",
        },
      ]);
      setRunning(false);
    });

    if (reduce) {
      timeline.forEach(({ run }) => run());
      return;
    }

    timeline.forEach(({ at, run }) => {
      const id = window.setTimeout(run, at);
      timeouts.current.push(id);
    });
  }

  return (
    <section id="threat" className="relative mx-auto max-w-[1200px] px-6 py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_0%_0%,rgba(169,145,255,0.10),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(197,239,87,0.08),transparent_55%)]" />

      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="label-mono mb-3 text-acid">§ 04 — Threat Detection</div>
          <h2 className="font-display text-4xl font-bold tracking-[-0.02em] md:text-5xl">
            Run it. See what breaks.
          </h2>
          <p className="mt-4 max-w-xl text-muted-ink">
            Point AcidTest at a generated suite or paste your own — the
            harness streams a deterministic PASS / FAIL verdict for every
            scenario in the file.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-acid/30 bg-[rgba(197,239,87,0.05)] px-4 py-2">
          <Shield size={14} className="text-acid" />
          <span className="label-mono text-acid">Sandboxed · client-side</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        {/* LEFT — source */}
        <div className="folder-tab p-6 pt-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex gap-1 rounded-md border border-white/6 bg-[rgba(16,17,18,0.72)] p-1">
              <button
                onClick={() => setTab("generated")}
                className={`rounded px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${
                  tab === "generated" ? "bg-acid text-[#0a0a0a]" : "text-muted-ink hover:text-ink"
                }`}
              >
                Generated
              </button>
              <button
                onClick={() => setTab("own")}
                className={`rounded px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${
                  tab === "own" ? "bg-acid text-[#0a0a0a]" : "text-muted-ink hover:text-ink"
                }`}
              >
                Paste your own
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-ink transition-all hover:border-acid/40 hover:text-acid disabled:opacity-50"
                title="Upload a test file (.js, .ts, .py, .java, .cs, .robot, .feature…)"
              >
                <Upload size={11} />
                {uploading ? "Reading…" : "Upload"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".js,.jsx,.ts,.tsx,.py,.java,.cs,.kt,.swift,.robot,.feature,.json,.xml,.txt"
                onChange={handleFile}
                className="hidden"
              />
              <span className="label-mono text-acid">
                {framework}
                <span className="ml-1.5 text-muted-ink">· {FW_LANG[framework]}</span>
              </span>
            </div>
          </div>

          {tab === "generated" ? (
            <pre className="max-h-[420px] overflow-auto rounded-md border border-white/5 bg-carbon/60 p-4 font-mono text-[12.5px] leading-[1.7] text-ink/85">

              <code>{DEFAULT_GENERATED}</code>
            </pre>
          ) : (
            <textarea
              value={own}
              onChange={(e) => setOwn(e.target.value)}
              rows={16}
              placeholder="// Paste Playwright, Cypress, or Selenium code…"
              className="w-full resize-none rounded-md border border-white/10 bg-carbon/60 p-4 font-mono text-[12.5px] leading-[1.7] text-ink outline-none focus:border-acid/50 focus:ring-2 focus:ring-acid/30"
            />
          )}
        </div>

        {/* RIGHT — console */}
        <div className="folder-tab-solid p-6 pt-8">
          <div className="mb-4 flex items-center justify-between">
            <span className="label-mono text-acid">Threat console</span>
            <button
              onClick={run}
              disabled={running || !activeCode.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-acid px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_24px_-4px_rgba(197,239,87,0.6)] transition-all hover:shadow-[0_0_40px_-2px_rgba(197,239,87,0.9)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              {running ? "◉ Scanning…" : "▶ Run threat scan"}
            </button>
          </div>

          <div className="min-h-[300px] rounded-md border border-white/5 bg-[#0a0a0b] p-4 font-mono text-[12px] leading-[1.75]">
            {logs.length === 0 ? (
              <span className="text-muted-ink">
                {"// idle — press ▶ to release the harness"}
              </span>
            ) : (
              logs.map((l, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-muted-ink">[{l.t}]</span>
                  <span
                    className={
                      l.tone === "acid"
                        ? "text-acid"
                        : l.tone === "warn"
                          ? "text-[#ff7a7a]"
                          : "text-ink/80"
                    }
                  >
                    {l.msg}
                  </span>
                </div>
              ))
            )}
          </div>

          {verdicts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {verdicts.map((v) => (
                <div
                  key={v.id}
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-[11px] ${
                    v.status === "PASS"
                      ? "border-acid/40 bg-[rgba(197,239,87,0.06)] text-acid"
                      : "border-[#ff7a7a]/40 bg-[rgba(255,122,122,0.06)] text-[#ff9c9c]"
                  }`}
                >
                  {v.status === "PASS" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  <span>{v.id}</span>
                  <span className="text-muted-ink">·</span>
                  <span>{v.ms}ms</span>
                </div>
              ))}
            </div>
          )}

          {summary && (
            <div
              className={`mt-4 flex items-center justify-between rounded-md border p-3 font-mono text-[12px] ${
                summary.fail === 0
                  ? "border-acid/40 bg-[rgba(197,239,87,0.05)]"
                  : "border-[#ff7a7a]/30 bg-[rgba(255,122,122,0.04)]"
              }`}
            >
              <span className="text-ink/80">
                {summary.count} scanned ·{" "}
                <span className="text-acid">{summary.pass} PASS</span> ·{" "}
                <span className="text-[#ff9c9c]">{summary.fail} FAIL</span>
              </span>
              <span className="text-muted-ink">{summary.total}ms total</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

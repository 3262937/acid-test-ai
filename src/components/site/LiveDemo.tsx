import { useState } from "react";
import { CodeTyper } from "./CodeTyper";
import { generateCode, type Framework } from "./generators";

const FRAMEWORKS: Framework[] = ["Playwright", "Cypress", "Selenium"];
const DEFAULT_STORY =
  "As a registered user, I want to reset my password via email link, so that I can regain access to my account.";

export function LiveDemo() {
  const [story, setStory] = useState(DEFAULT_STORY);
  const [fw, setFw] = useState<Framework>("Playwright");
  const [runKey, setRunKey] = useState(0);
  const code = generateCode(fw, story);

  return (
    <section id="demo" className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
      <div className="mb-10">
        <div className="label-mono mb-3 text-acid">§ 03 — Live Culture</div>
        <h2 className="font-display text-4xl font-bold tracking-[-0.02em] md:text-5xl">
          Watch it hunt, live.
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="folder-tab p-6 pt-8">
          <label className="label-mono mb-3 block text-acid">User Story · Input</label>
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={7}
            className="w-full resize-none rounded-md border border-white/10 bg-carbon/60 p-4 font-mono text-[13px] leading-relaxed text-ink outline-none focus:border-acid/50 focus:ring-2 focus:ring-acid/30"
          />
          <div className="mt-4 flex items-center justify-between">
            <div className="label-mono">
              {story.trim().split(/\s+/).length} tokens · ready
            </div>
            <button
              onClick={() => setRunKey((k) => k + 1)}
              className="inline-flex items-center gap-2 rounded-md bg-acid px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_24px_-4px_rgba(197,239,87,0.6)] transition-all hover:shadow-[0_0_40px_-2px_rgba(197,239,87,0.85)]"
            >
              ▶ Generate
            </button>
          </div>
        </div>

        <div>
          <div className="mb-3 flex gap-1 rounded-md border border-white/6 bg-[rgba(16,17,18,0.72)] p-1 backdrop-blur">
            {FRAMEWORKS.map((f) => (
              <button
                key={f}
                onClick={() => setFw(f)}
                className={`flex-1 rounded px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${
                  fw === f
                    ? "bg-acid text-[#0a0a0a]"
                    : "text-muted-ink hover:text-ink"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <CodeTyper
            key={`${fw}-${runKey}`}
            code={code}
            filename={`password-reset.${fw === "Playwright" ? "spec.ts" : fw === "Cypress" ? "cy.ts" : "test.ts"}`}
          />
        </div>
      </div>
    </section>
  );
}

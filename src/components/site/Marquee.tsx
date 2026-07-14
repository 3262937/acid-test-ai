const FRAMEWORKS = [
  "Playwright",
  "Cypress",
  "Selenium",
  "Jest",
  "Vitest",
  "Mocha",
  "Puppeteer",
  "Appium",
];

export function Marquee() {
  const items = [...FRAMEWORKS, ...FRAMEWORKS];
  return (
    <section className="relative overflow-hidden border-y border-white/5 py-8">
      <div className="marquee-track flex w-max gap-16 whitespace-nowrap">
        {items.map((f, i) => (
          <div key={i} className="flex items-center gap-16">
            <span className="font-mono text-[13px] tracking-[0.32em] uppercase text-muted-ink transition-colors hover:text-acid">
              {f}
            </span>
            <span className="text-acid/40">·</span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-carbon to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-carbon to-transparent" />
    </section>
  );
}

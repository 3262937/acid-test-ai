import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PillNav } from "@/components/site/PillNav";
import { Footer } from "@/components/site/FinalCta";

export const Route = createFileRoute("/faq")({
  component: FaqPage,
  head: () => ({
    meta: [
      { title: "FAQ — AcidTest" },
      {
        name: "description",
        content: "Answers to the most common questions about AcidTest, credits, and coverage.",
      },
      { property: "og:title", content: "FAQ — AcidTest" },
      { property: "og:description", content: "The most-asked questions, answered." },
    ],
  }),
});

const FAQS = [
  {
    q: "What exactly is a credit?",
    a: "One credit = one synthesized test case. Threat Detection scans, MCP calls, and CLI runs all draw from the same pool.",
  },
  {
    q: "Do credits expire?",
    a: "Credits on paid plans do not expire. Free trial credits reset monthly.",
  },
  {
    q: "Which test frameworks are supported?",
    a: "Playwright, Cypress, and Selenium out of the box. You can paste your own test file into Threat Detection to check any of them.",
  },
  {
    q: "Do you run my tests for me?",
    a: "No — AcidTest synthesizes runnable test code. You execute it in your own CI or locally. Threat Detection is a static, client-side scan.",
  },
  {
    q: "Can I use my own OpenAI/Anthropic key?",
    a: "Not today. All synthesis routes through our managed model gateway so pricing stays predictable in credits.",
  },
  {
    q: "How do I sign in with GitHub?",
    a: "Click Continue with GitHub on the login page. If the button reports the provider is disabled, ask your workspace owner to enable GitHub in the backend auth settings.",
  },
  {
    q: "Can I delete my data?",
    a: "Yes. Use the account menu to delete your account; we purge profile and synthesized suites within 30 days.",
  },
  {
    q: "How do I contact support?",
    a: "Email support@acidtest.dev — we reply within one business day on paid plans.",
  },
];

function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <main className="relative min-h-screen bg-carbon text-ink">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_0%,rgba(197,239,87,0.09),transparent_55%),radial-gradient(circle_at_10%_100%,rgba(169,145,255,0.09),transparent_55%)]" />
      <PillNav />
      <section className="mx-auto max-w-[900px] px-6 pb-24 pt-36 md:pt-44">
        <Link to="/" className="label-mono transition-colors hover:text-acid">
          ← Back
        </Link>
        <div className="mt-8">
          <div className="label-mono mb-3 text-acid">§ Help — FAQ</div>
          <h1 className="font-display text-4xl font-bold tracking-[-0.02em] md:text-6xl">
            Questions, <span className="italic text-acid">answered.</span>
          </h1>
          <p className="mt-4 max-w-xl text-muted-ink">
            Everything QA teams ask us in the first five minutes.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="folder-tab overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-display text-lg font-semibold tracking-[-0.01em]">
                    {f.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-acid transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-white/5 px-6 py-5 text-[15px] leading-relaxed text-muted-ink">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="folder-tab mt-12 p-8 text-center">
          <p className="text-muted-ink">Still stuck?</p>
          <a
            href="mailto:support@acidtest.dev"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-acid px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_24px_-4px_rgba(197,239,87,0.6)] transition-all hover:shadow-[0_0_40px_-2px_rgba(197,239,87,0.9)]"
          >
            Talk to us →
          </a>
        </div>
      </section>
      <Footer />
    </main>
  );
}

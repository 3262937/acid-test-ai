import { createFileRoute } from "@tanstack/react-router";
import { PillNav } from "@/components/site/PillNav";
import { Hero } from "@/components/site/Hero";
import { Hunt } from "@/components/site/Hunt";
import { Marquee } from "@/components/site/Marquee";
import { Protocol } from "@/components/site/Protocol";
import { LiveDemo } from "@/components/site/LiveDemo";
import { ThreatDetection } from "@/components/site/ThreatDetection";
import { Pricing } from "@/components/site/Pricing";
import { FinalCta, Footer } from "@/components/site/FinalCta";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "AcidTest — Every bug meets its acid test" },
      {
        name: "description",
        content:
          "AI-powered test synthesis for QA engineers. Paste a user story, get runnable Playwright, Cypress and Selenium suites in seconds.",
      },
      { property: "og:title", content: "AcidTest — Every bug meets its acid test" },
      {
        property: "og:description",
        content: "Paste a user story. Get runnable Playwright, Cypress and Selenium suites.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

function Index() {
  return (
    <main className="relative min-h-screen bg-carbon text-ink">
      <PillNav />
      <Hero />
      <Marquee />
      <Hunt />
      <Protocol />
      <LiveDemo />
      <ThreatDetection />
      <Pricing />
      <FinalCta />
      <Footer />
    </main>
  );
}

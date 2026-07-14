import { createFileRoute } from "@tanstack/react-router";
import { LegalShell, Sec } from "@/components/site/LegalShell";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — AcidTest" },
      {
        name: "description",
        content: "How AcidTest collects, uses, and protects your data.",
      },
      { property: "og:title", content: "Privacy Policy — AcidTest" },
      { property: "og:description", content: "How AcidTest handles your data." },
    ],
  }),
});

function PrivacyPage() {
  return (
    <LegalShell section="§ Legal — Privacy" title="Privacy Policy" updated="July 13, 2026">
      <Sec id="intro" heading="1. Introduction">
        <p>
          AcidTest ("we", "us") builds AI-assisted test synthesis tools for QA engineers. This page
          explains what data we collect, why we collect it, and the controls you have. This page is
          maintained by the AcidTest team to answer common privacy questions and is not a legal
          certification.
        </p>
      </Sec>
      <Sec id="collect" heading="2. Data we collect">
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <strong className="text-ink">Account data:</strong> email, display name, and avatar from
            your chosen sign-in provider (Google, GitHub, or email).
          </li>
          <li>
            <strong className="text-ink">Product data:</strong> user stories you paste and the test
            suites we synthesize on your behalf.
          </li>
          <li>
            <strong className="text-ink">Telemetry:</strong> minimal request logs and error traces
            used to keep the service healthy.
          </li>
        </ul>
      </Sec>
      <Sec id="use" heading="3. How we use it">
        <p>
          We use your data to run and improve the service, respond to support requests, and prevent
          abuse. We do not sell your data or use your synthesized test code to train third-party
          models.
        </p>
      </Sec>
      <Sec id="retention" heading="4. Retention">
        <p>
          You can delete your account at any time from the account menu. On deletion we purge your
          profile and generated suites within 30 days from active systems.
        </p>
      </Sec>
      <Sec id="contact" heading="5. Contact">
        <p>
          Questions or requests:{" "}
          <a className="text-acid hover:underline" href="mailto:privacy@acidtest.dev">
            privacy@acidtest.dev
          </a>
          .
        </p>
      </Sec>
    </LegalShell>
  );
}

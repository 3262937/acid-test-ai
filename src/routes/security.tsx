import { createFileRoute } from "@tanstack/react-router";
import { LegalShell, Sec } from "@/components/site/LegalShell";

export const Route = createFileRoute("/security")({
  component: SecurityPage,
  head: () => ({
    meta: [
      { title: "Security — AcidTest" },
      {
        name: "description",
        content: "How AcidTest protects credentials, data, and infrastructure.",
      },
      { property: "og:title", content: "Security — AcidTest" },
      { property: "og:description", content: "Controls that keep the lab locked." },
    ],
  }),
});

function SecurityPage() {
  return (
    <LegalShell section="§ Trust — Security" title="Security" updated="July 13, 2026">
      <Sec id="overview" heading="1. Overview">
        <p>
          This page is maintained by the AcidTest team to describe controls currently
          enabled in the product. It is not an independent certification.
        </p>
      </Sec>
      <Sec id="access" heading="2. Access & authentication">
        <ul className="ml-5 list-disc space-y-2">
          <li>OAuth sign-in with Google and GitHub, plus optional email + password.</li>
          <li>Sessions are stored in httpOnly-compatible browser storage and rotated on refresh.</li>
          <li>Row-level security policies scope every profile row to its owner.</li>
        </ul>
      </Sec>
      <Sec id="data" heading="3. Data handling">
        <p>
          Data in transit is protected with TLS 1.2+. Managed database and object storage
          providers encrypt data at rest. We minimize the data we store to what's needed
          to run the product.
        </p>
      </Sec>
      <Sec id="infra" heading="4. Infrastructure">
        <p>
          The app runs on a globally distributed edge runtime. Server functions execute in
          isolated workers with least-privilege secrets injected per environment.
        </p>
      </Sec>
      <Sec id="report" heading="5. Report a vulnerability">
        <p>
          Please email{" "}
          <a className="text-acid hover:underline" href="mailto:security@acidtest.dev">
            security@acidtest.dev
          </a>{" "}
          with steps to reproduce. We respond within 2 business days and coordinate
          disclosure with reporters acting in good faith.
        </p>
      </Sec>
    </LegalShell>
  );
}

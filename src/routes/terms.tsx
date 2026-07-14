import { createFileRoute } from "@tanstack/react-router";
import { LegalShell, Sec } from "@/components/site/LegalShell";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms of Service — AcidTest" },
      { name: "description", content: "Terms governing the use of AcidTest." },
      { property: "og:title", content: "Terms of Service — AcidTest" },
      { property: "og:description", content: "The rules of the lab." },
    ],
  }),
});

function TermsPage() {
  return (
    <LegalShell section="§ Legal — Terms" title="Terms of Service" updated="July 13, 2026">
      <Sec id="acceptance" heading="1. Acceptance">
        <p>
          By creating an account or using AcidTest you agree to these terms. If you don't agree,
          don't use the service.
        </p>
      </Sec>
      <Sec id="account" heading="2. Your account">
        <p>
          You are responsible for the security of your credentials and everything that happens under
          your account. Notify us immediately of any unauthorized use.
        </p>
      </Sec>
      <Sec id="credits" heading="3. Credits & billing">
        <p>
          Credits are prepaid units consumed by test synthesis and Threat Detection scans. Purchased
          credits are non-refundable except where required by law and do not expire on paid plans.
        </p>
      </Sec>
      <Sec id="acceptable" heading="4. Acceptable use">
        <ul className="ml-5 list-disc space-y-2">
          <li>No scanning or testing systems you don't own or aren't authorized to test.</li>
          <li>No attempts to reverse-engineer, resell, or overload the service.</li>
          <li>No submission of unlawful, harmful, or infringing content.</li>
        </ul>
      </Sec>
      <Sec id="liability" heading="5. Warranty & liability">
        <p>
          AcidTest is provided "as is". To the maximum extent permitted by law, we disclaim implied
          warranties and limit aggregate liability to the amount you paid us in the prior 12 months.
        </p>
      </Sec>
      <Sec id="changes" heading="6. Changes">
        <p>
          We may update these terms. Material changes will be announced in-app or by email at least
          14 days before they take effect.
        </p>
      </Sec>
    </LegalShell>
  );
}

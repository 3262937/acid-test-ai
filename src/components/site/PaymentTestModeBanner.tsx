const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full bg-red-950/50 border-b border-red-800/50 px-4 py-2 text-center font-mono text-[11px] uppercase tracking-widest text-red-200">
        Live checkout not configured — complete go-live in your Lovable project to accept real payments.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center font-mono text-[11px] uppercase tracking-widest text-amber-200">
        Test mode — all payments in the preview use Stripe test cards.{" "}
        <a
          href="https://docs.lovable.dev/features/payments#test-and-live-environments"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-acid"
        >
          Learn more
        </a>
      </div>
    );
  }
  return null;
}

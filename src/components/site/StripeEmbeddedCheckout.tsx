import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { useServerFn } from "@tanstack/react-start";
import { createCheckoutSession } from "@/lib/billing.functions";
import { useCallback } from "react";

export function StripeEmbeddedCheckoutInline({
  priceId,
  returnUrl,
}: {
  priceId: string;
  returnUrl: string;
}) {
  const createSession = useServerFn(createCheckoutSession);
  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const res = await createSession({
      data: { priceId, returnUrl, environment: getStripeEnvironment() },
    });
    if ("error" in res) throw new Error(res.error);
    if (!res.clientSecret) throw new Error("Stripe did not return a client secret");
    return res.clientSecret;
  }, [priceId, returnUrl, createSession]);

  return (
    <div id="checkout" className="rounded-lg overflow-hidden">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}

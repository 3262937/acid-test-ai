import { loadStripe, type Stripe } from "@stripe/stripe-js";

type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function getStripeEnvironment(): StripeEnv {
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (clientToken?.startsWith("pk_live_")) return "live";
  throw new Error(
    "Payments are not configured for this build. Complete Stripe go-live in your Lovable project to enable checkout.",
  );
}

let stripePromise: Promise<Stripe | null> | null = null;
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    getStripeEnvironment(); // throws if unconfigured
    stripePromise = loadStripe(clientToken as string);
  }
  return stripePromise;
}

export const CREDIT_PACKS = [
  { id: "credits_50", credits: 50, price: "$5", tag: "Starter" },
  { id: "credits_200", credits: 200, price: "$15", tag: "Best value" },
  { id: "credits_1000", credits: 1000, price: "$50", tag: "Team" },
] as const;

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

type CheckoutResult = { clientSecret: string } | { error: string };

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId: string },
): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");

  const found = await stripe.customers.search({
    query: `metadata['userId']:'${options.userId}'`,
    limit: 1,
  });
  if (found.data.length) return found.data[0].id;

  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const c = existing.data[0];
      if (c.metadata?.userId !== options.userId) {
        await stripe.customers.update(c.id, {
          metadata: { ...c.metadata, userId: options.userId },
        });
      }
      return c.id;
    }
  }

  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    metadata: { userId: options.userId },
  });
  return created.id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { priceId: string; returnUrl: string; environment: StripeEnv }) => {
      if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
      return data;
    },
  )
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    try {
      const { userId, supabase } = context;
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email ?? undefined;

      const stripe = createStripeClient(data.environment);

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      if (!prices.data.length) throw new Error("Price not found");
      const stripePrice = prices.data[0];
      const isRecurring = stripePrice.type === "recurring";

      const customerId = await resolveOrCreateCustomer(stripe, { email, userId });

      let description: string | undefined;
      if (!isRecurring) {
        const productId =
          typeof stripePrice.product === "string"
            ? stripePrice.product
            : stripePrice.product.id;
        const product = await stripe.products.retrieve(productId);
        description = product.name;
      }

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: isRecurring ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        ...(!isRecurring && { payment_intent_data: { description } }),
        metadata: { userId, packageId: data.priceId },
        ...(isRecurring && {
          subscription_data: { metadata: { userId, packageId: data.priceId } },
        }),
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

type CreditsResult = { balance: number };

export const getMyCredits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CreditsResult> => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();
    return { balance: (data?.balance as number | undefined) ?? 0 };
  });

type DebitResult = { balance: number } | { error: "insufficient_credits" | string };

export const debitCredit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { amount?: number; reason: string }) => ({
    amount: data.amount ?? 1,
    reason: data.reason,
  }))
  .handler(async ({ data, context }): Promise<DebitResult> => {
    const { supabase } = context;
    const { data: newBalance, error } = await supabase.rpc("debit_credits", {
      _amount: data.amount,
      _reason: data.reason,
    });
    if (error) {
      if (error.message?.includes("insufficient_credits")) {
        return { error: "insufficient_credits" };
      }
      return { error: error.message ?? "debit failed" };
    }
    return { balance: (newBalance as number | null) ?? 0 };
  });

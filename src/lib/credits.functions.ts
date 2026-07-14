import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

type Balance = { balance: number };

export const getCreditBalance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Balance> => {
    const { supabase, userId } = context;
    const { data } = await (supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (col: string, v: string) => {
            maybeSingle: () => Promise<{ data: { balance: number } | null }>;
          };
        };
      };
    })
      .from("credits")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();
    return { balance: data?.balance ?? 0 };
  });

export const spendCredit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ balance: number } | { error: "insufficient" }> => {
    const { supabase } = context;
    const { data, error } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: number | null; error: { message: string } | null }>)("consume_credit", { _amount: 1 });
    if (error) throw new Error(error.message);
    const newBalance = data as number;
    if (newBalance === -1) return { error: "insufficient" };
    return { balance: newBalance };
  });

type CheckoutResult = { clientSecret: string } | { error: string };

export const createCreditsCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { priceId: string; returnUrl: string; environment: StripeEnv }) => {
      if (!/^credits_(50|200|1000)$/.test(data.priceId)) {
        throw new Error("Invalid priceId");
      }
      return data;
    },
  )
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    try {
      const stripe = createStripeClient(data.environment);
      const { userId, claims } = context;
      const email = (claims.email as string | undefined) ?? undefined;

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      if (!prices.data.length) throw new Error("Price not found");
      const stripePrice = prices.data[0];

      // Resolve or create customer with metadata.userId
      let customerId: string | undefined;
      const found = await stripe.customers.search({
        query: `metadata['userId']:'${userId}'`,
        limit: 1,
      });
      if (found.data.length) {
        customerId = found.data[0].id;
      } else if (email) {
        const existing = await stripe.customers.list({ email, limit: 1 });
        if (existing.data.length) {
          customerId = existing.data[0].id;
          if (existing.data[0].metadata?.userId !== userId) {
            await stripe.customers.update(customerId, {
              metadata: { ...existing.data[0].metadata, userId },
            });
          }
        }
      }
      if (!customerId) {
        const created = await stripe.customers.create({
          ...(email && { email }),
          metadata: { userId },
        });
        customerId = created.id;
      }

      const productId =
        typeof stripePrice.product === "string"
          ? stripePrice.product
          : stripePrice.product.id;
      const product = await stripe.products.retrieve(productId);

      const creditsMap: Record<string, number> = {
        credits_50: 50,
        credits_200: 200,
        credits_1000: 1000,
      };
      const credits = creditsMap[data.priceId];

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        payment_intent_data: { description: product.name },
        metadata: {
          userId,
          credits: String(credits),
          priceId: data.priceId,
        },
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

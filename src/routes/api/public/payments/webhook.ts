import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

// Package id → credits granted per purchase / per billing period.
const CREDITS_BY_PACKAGE: Record<string, number> = {
  starter: 200,
  hunter: 1000,
  lab: 5000,
  topup_100: 100,
  topup_500: 500,
  topup_2000: 2000,
};

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

function priceLookupKey(price: any): string | null {
  return price?.lookup_key ?? price?.metadata?.lovable_external_id ?? null;
}

async function grantCredits(opts: {
  userId: string;
  packageId: string;
  eventId: string;
  reason: string;
  metadata?: Record<string, unknown>;
}) {
  const credits = CREDITS_BY_PACKAGE[opts.packageId];
  if (!credits) {
    console.warn("Unknown packageId, skipping credit grant:", opts.packageId);
    return;
  }
  const { error } = await getSupabase().from("credit_ledger").insert({
    user_id: opts.userId,
    delta: credits,
    reason: opts.reason,
    stripe_event_id: opts.eventId,
    metadata: { packageId: opts.packageId, ...(opts.metadata ?? {}) },
  });
  if (error && !error.message?.includes("duplicate key")) {
    console.error("credit_ledger insert failed:", error);
  }
}

async function upsertSubscription(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;
  const item = subscription.items?.data?.[0];
  const priceId = priceLookupKey(item?.price) ?? item?.price?.id;
  const productId =
    typeof item?.price?.product === "string"
      ? item.price.product
      : item?.price?.product?.id ?? "";
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id,
      product_id: productId,
      price_id: priceId,
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
}

async function handleCheckoutCompleted(session: any, eventId: string) {
  // One-time top-ups: grant credits immediately.
  if (session.mode !== "payment") return;
  const userId = session.metadata?.userId;
  const packageId = session.metadata?.packageId;
  if (!userId || !packageId) return;
  await grantCredits({
    userId,
    packageId,
    eventId,
    reason: `topup:${packageId}`,
    metadata: { session_id: session.id },
  });
}

async function handleInvoicePaid(invoice: any, eventId: string) {
  // Subscription billing (initial + renewals) — grant this period's credits.
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;
  const line = invoice.lines?.data?.find((l: any) => l.type === "subscription")
    ?? invoice.lines?.data?.[0];
  const packageId = priceLookupKey(line?.price);
  const userId =
    invoice.subscription_details?.metadata?.userId ??
    invoice.metadata?.userId ??
    line?.metadata?.userId;
  if (!userId || !packageId) return;
  await grantCredits({
    userId,
    packageId,
    eventId,
    reason: `subscription:${packageId}`,
    metadata: { invoice_id: invoice.id, period_end: line?.period?.end ?? null },
  });
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  const object = event.data.object;

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(object, (event as any).id ?? object.id);
      break;
    case "invoice.paid":
    case "invoice.payment_succeeded":
      await handleInvoicePaid(object, (event as any).id ?? object.id);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSubscription(object, env);
      break;
    case "customer.subscription.deleted":
      await getSupabase()
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", object.id)
        .eq("environment", env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});

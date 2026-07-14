import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

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

async function handleCheckoutCompleted(session: Record<string, unknown>, env: StripeEnv) {
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const userId = metadata.userId;
  const credits = Number(metadata.credits ?? 0);
  const sessionId = session.id as string;
  if (!userId || !credits || !sessionId) {
    console.error("checkout.session.completed missing metadata", { userId, credits, sessionId });
    return;
  }
  const idempotencyKey = `stripe:${env}:${sessionId}`;
  const { error } = await getSupabase().rpc("add_credits", {
    _user_id: userId,
    _amount: credits,
    _reason: `purchase:${metadata.priceId ?? "unknown"}`,
    _idempotency_key: idempotencyKey,
  });
  if (error) console.error("add_credits failed", error);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object, env);
      break;
    default:
      console.log("Unhandled webhook event:", event.type);
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

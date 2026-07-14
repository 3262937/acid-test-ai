import { useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useServerFn } from "@tanstack/react-start";
import { X, Zap } from "lucide-react";
import { toast } from "sonner";
import { CREDIT_PACKS, getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCreditsCheckout } from "@/lib/credits.functions";

export function BuyCreditsDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const create = useServerFn(createCreditsCheckout);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const fetchClientSecret = async (): Promise<string> => {
    if (!selected) throw new Error("No pack selected");
    setLoading(true);
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}?credits=purchased`;
      const res = await create({
        data: { priceId: selected, returnUrl, environment: getStripeEnvironment() },
      });
      if ("error" in res) throw new Error(res.error);
      if (!res.clientSecret) throw new Error("No client secret returned");
      return res.clientSecret;
    } catch (e) {
      toast.error("Checkout failed", { description: (e as Error).message });
      setSelected(null);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-lg border border-white/10 bg-carbon shadow-2xl">
        <button
          onClick={() => {
            setSelected(null);
            onClose();
            onSuccess?.();
          }}
          className="absolute right-4 top-4 z-10 rounded-md border border-white/10 bg-white/[0.03] p-2 text-muted-ink hover:border-acid/40 hover:text-acid"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {!selected ? (
          <div className="p-8 pt-10">
            <div className="mb-6">
              <div className="label-mono mb-2 text-acid">§ Buy Credits</div>
              <h2 className="font-display text-2xl font-bold tracking-[-0.02em]">
                Pick a pack. Credits never expire.
              </h2>
              <p className="mt-1 text-sm text-muted-ink">1 credit = 1 test generation.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {CREDIT_PACKS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className="group rounded-md border border-white/10 bg-white/[0.02] p-5 text-left transition-all hover:border-acid/50 hover:bg-white/[0.04]"
                >
                  <div className="label-mono mb-2 text-acid">{p.tag}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl font-bold text-ink">{p.credits}</span>
                    <span className="font-mono text-[11px] text-muted-ink">credits</span>
                  </div>
                  <div className="mt-2 font-display text-xl font-semibold text-ink">{p.price}</div>
                  <div className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-ink group-hover:text-acid">
                    <Zap size={10} /> Select
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4">
            {loading && (
              <div className="p-8 text-center font-mono text-[12px] text-muted-ink">
                Loading checkout…
              </div>
            )}
            <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}
      </div>
    </div>
  );
}

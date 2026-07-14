import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyCredits } from "@/lib/billing.functions";
import { useSession } from "./use-session";

export function useCredits() {
  const { user } = useSession();
  const fetchCredits = useServerFn(getMyCredits);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setBalance(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchCredits();
      setBalance(res.balance);
    } catch {
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [user, fetchCredits]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { balance, loading, refresh };
}

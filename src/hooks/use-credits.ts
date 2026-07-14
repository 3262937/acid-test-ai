import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCreditBalance, spendCredit } from "@/lib/credits.functions";
import { useSession } from "./use-session";

export function useCredits() {
  const { user } = useSession();
  const getBalance = useServerFn(getCreditBalance);
  const spend = useServerFn(spendCredit);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setBalance(null);
      return;
    }
    setLoading(true);
    try {
      const res = await getBalance();
      setBalance(res.balance);
    } catch {
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [user, getBalance]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const consume = useCallback(async () => {
    const res = await spend();
    if ("error" in res) return { ok: false as const, reason: res.error };
    setBalance(res.balance);
    return { ok: true as const, balance: res.balance };
  }, [spend]);

  return { balance, loading, refresh, consume };
}

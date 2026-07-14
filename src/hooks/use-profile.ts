import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, type Profile } from "@/lib/profile.functions";
import { useSession } from "./use-session";

export function useProfile() {
  const { user } = useSession();
  const fetchProfile = useServerFn(getMyProfile);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchProfile();
      setProfile(res.profile);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { profile, loading, refresh, setProfile };
}

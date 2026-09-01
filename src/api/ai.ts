import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useOnline } from "@/lib/network";

export type AiQuota = {
  calls: number;
  limit: number;
  remaining: number;
};

/**
 * How many AI generations are left today.
 *
 * The number used to arrive only *with* a successful generation, so the user
 * met the daily cap by hitting it. This asks before spending anything.
 *
 * Only fetched while online: generating needs the network anyway, and a
 * persisted count from yesterday would be a confident wrong answer.
 */
export function useAiQuota() {
  const online = useOnline();

  return useQuery({
    queryKey: ["ai-quota"],
    enabled: online,
    // the count moves on every generation, so don't serve it from cache
    staleTime: 0,
    gcTime: 0,
    retry: false,
    queryFn: async (): Promise<AiQuota> => {
      const { data, error } = await supabase.rpc("get_ai_quota");
      if (error) throw error;
      return data as unknown as AiQuota;
    },
  });
}

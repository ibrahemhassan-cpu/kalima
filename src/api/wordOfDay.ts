import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { CACHE_MAX_AGE } from "@/lib/queryCache";
import type { CefrLevel } from "@/lib/database.types";

export type WordOfDay = {
  entry_id: string;
  lemma: string;
  ipa: string | null;
  audio_url: string | null;
  cefr_level: CefrLevel | null;
  ar_preview: string;
  en_definition: string;
  memory_tip_ar: string | null;
};

/**
 * One word a day, picked at the user's level from words they don't have yet.
 *
 * Kalima had no reason to be opened on a day with nothing due — which is
 * exactly the day people stop coming back. The pick is deterministic per
 * (user, local day), so it doesn't shuffle on every refetch, and it survives
 * in the cache so it still shows up with no connection.
 *
 * `null` is a real answer: it means the user already owns every entry we
 * could offer, and the card should disappear rather than repeat itself.
 */
export function useWordOfDay() {
  return useQuery({
    queryKey: ["word-of-day"],
    // the server pins it to the day; an hour is plenty to stop refetch churn
    staleTime: 60 * 60 * 1000,
    gcTime: CACHE_MAX_AGE,
    queryFn: async (): Promise<WordOfDay | null> => {
      const { data, error } = await supabase.rpc("get_word_of_day");
      if (error) throw error;
      return (data as unknown as WordOfDay | null) ?? null;
    },
  });
}

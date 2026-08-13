import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { DueWord, ReviewMode, ReviewResult } from "@/lib/database.types";

export function useDueWords(limit = 40) {
  return useQuery({
    queryKey: ["due-words", limit],
    staleTime: 0,
    queryFn: async (): Promise<DueWord[]> => {
      const { data, error } = await supabase.rpc("get_due_words", {
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as unknown as DueWord[];
    },
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      userWordId: string;
      rating: 0 | 1 | 2 | 3;
      mode?: ReviewMode;
      msTaken?: number;
    }): Promise<ReviewResult> => {
      const { data, error } = await supabase.rpc("submit_review", {
        p_user_word_id: vars.userWordId,
        p_rating: vars.rating,
        p_mode: vars.mode ?? "flashcard",
        p_ms_taken: vars.msTaken ?? null,
        p_is_correct: vars.rating >= 2,
        // idempotency key — safe to retry on flaky networks
        p_client_id: `${vars.userWordId}:${Date.now()}`,
      });
      if (error) throw error;
      return data as unknown as ReviewResult;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["home-summary"] });
      void qc.invalidateQueries({ queryKey: ["my-words"] });
    },
  });
}

/**
 * What each rating button promises the user, in plain language.
 * Mirrors the SM-2 logic in 0003_functions.sql closely enough to be honest
 * without round-tripping to the server.
 */
export function previewInterval(
  w: Pick<DueWord, "status" | "interval_days" | "ease_factor" | "repetitions">,
  rating: 0 | 1 | 2 | 3,
): { minutes?: number; days?: number } {
  const learning = w.status === "new" || w.status === "learning";

  if (learning) {
    if (rating <= 1) return { minutes: 10 };
    // first "good" moves to the 1-day step, second graduates
    return w.repetitions === 0 && w.interval_days === 0
      ? { minutes: 1440 }
      : { days: rating === 3 ? 5 : 3 };
  }

  if (rating === 0) return { minutes: 10 };

  const base = Math.max(w.interval_days, 1);
  const mult = rating === 1 ? 1.2 : rating === 2 ? w.ease_factor : w.ease_factor * 1.3;
  return { days: Math.min(365, Math.max(1, Math.round(base * mult))) };
}

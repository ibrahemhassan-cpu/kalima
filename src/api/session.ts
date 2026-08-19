import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, SUPABASE_URL } from "@/lib/supabase";
import { CACHE_MAX_AGE } from "@/lib/queryCache";
import type {
  CefrLevel,
  Example,
  ReviewMode,
  ReviewResult,
  Sense,
  WordStatus,
} from "@/lib/database.types";

/** One card in a session — the server already picked the mode for us. */
export type SessionItem = {
  user_word_id: string;
  entry_id: string;
  lemma: string;
  ipa: string | null;
  audio_url: string | null;
  cefr_level: CefrLevel | null;
  senses: Sense[];
  examples: Example[];
  memory_tip_ar: string | null;
  status: WordStatus;
  repetitions: number;
  interval_days: number;
  ease_factor: number;
  due_at: string;
  mode: ReviewMode;
  question_id: string | null;
  prompt: string | null;
  prompt_hint: string | null;
  difficulty: number | null;
  /** already shuffled server-side; the correct answer is not marked */
  options: string[];
};

export function useSessionItems(limit = 20) {
  return useQuery({
    queryKey: ["session-items", limit],
    /**
     * Always refetch when online — the due list moves every few minutes.
     * But it must survive on disk: with gcTime 0 this was never persisted,
     * so "start review" on the metro opened an empty session, which is the
     * one thing the offline work exists to prevent.
     */
    staleTime: 0,
    gcTime: CACHE_MAX_AGE,
    queryFn: async (): Promise<SessionItem[]> => {
      const { data, error } = await supabase.rpc("get_session_items", {
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as unknown as SessionItem[];
    },
  });
}

export type QuizResult = ReviewResult & {
  correct: boolean;
  correct_answer: string;
  explanation_ar: string | null;
  rating: number;
};

export function useSubmitAnswer() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      userWordId: string;
      questionId: string;
      answer: string;
      msTaken: number;
    }): Promise<QuizResult> => {
      const { data, error } = await supabase.rpc("submit_quiz_answer", {
        p_user_word_id: vars.userWordId,
        p_question_id: vars.questionId,
        p_answer: vars.answer,
        p_ms_taken: vars.msTaken,
        p_client_id: `${vars.questionId}:${Date.now()}`,
      });
      if (error) throw error;
      return data as unknown as QuizResult;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["home-summary"] });
      void qc.invalidateQueries({ queryKey: ["my-words"] });
    },
  });
}

/**
 * Quietly fills the question bank for words added before it existed.
 * Fire-and-forget: the user never waits on it.
 */
export async function backfillQuestions() {
  const { data } = await supabase.rpc("entries_missing_questions", {
    p_limit: 3,
  });
  const missing = (data ?? []) as { entry_id: string }[];
  if (missing.length === 0) return;

  const { data: auth } = await supabase.auth.getSession();
  const token = auth.session?.access_token;
  if (!token) return;

  for (const row of missing) {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/generate-questions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entry_id: row.entry_id }),
      });
    } catch {
      // offline or rate limited — try again next session
    }
  }
}

/** Words the user can tap to add, checked against the dictionary. */
export type LookupRow = {
  lemma: string;
  entry_id: string | null;
  ar_preview: string | null;
  cefr_level: CefrLevel | null;
  already_mine: boolean | null;
};

export function useLookupWords(words: string[]) {
  const key = [...words].sort().join(",");
  return useQuery({
    queryKey: ["lookup-words", key],
    enabled: words.length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<LookupRow[]> => {
      const { data, error } = await supabase.rpc("lookup_words", {
        p_words: words,
      });
      if (error) throw error;
      return (data ?? []) as unknown as LookupRow[];
    },
  });
}

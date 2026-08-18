import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Example, ReviewMode, ReviewResult, Sense } from "@/lib/database.types";

/**
 * One question in a single-word quiz.
 *
 * Same shape the session cards use, minus the SRS state — a focused quiz
 * doesn't schedule anything per question. The whole quiz lands as one review
 * at the end (see `useFinishWordQuiz`), so answering six questions can't fling
 * the interval six steps forward.
 */
export type QuizQuestion = {
  question_id: string;
  entry_id: string;
  lemma: string;
  ipa: string | null;
  audio_url: string | null;
  senses: Sense[];
  examples: Example[];
  mode: ReviewMode;
  prompt: string | null;
  prompt_hint: string | null;
  difficulty: number | null;
  /** already shuffled server-side; the correct answer is not marked */
  options: string[];
};

export function useWordQuiz(userWordId?: string, limit = 6) {
  return useQuery({
    queryKey: ["word-quiz", userWordId, limit],
    enabled: !!userWordId,
    staleTime: 0,
    gcTime: 0,
    queryFn: async (): Promise<QuizQuestion[]> => {
      const { data, error } = await supabase.rpc("get_word_quiz", {
        p_user_word_id: userWordId!,
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as unknown as QuizQuestion[];
    },
  });
}

export type AnswerCheck = {
  correct: boolean;
  correct_answer: string;
  explanation_ar: string | null;
};

/** Grades one answer. Deliberately has no effect on scheduling. */
export function useCheckAnswer() {
  return useMutation({
    mutationFn: async (vars: {
      questionId: string;
      answer: string;
    }): Promise<AnswerCheck> => {
      const { data, error } = await supabase.rpc("check_quiz_answer", {
        p_question_id: vars.questionId,
        p_answer: vars.answer,
      });
      if (error) throw error;
      return data as unknown as AnswerCheck;
    },
  });
}

export type QuizOutcome = ReviewResult & {
  correct: number;
  total: number;
  accuracy: number;
  rating: number;
  /** 0 → 1 toward the two real mastery conditions: 60-day interval, 6 reps */
  mastery: number;
  repetitions: number;
  lapses: number;
};

export function useFinishWordQuiz() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      userWordId: string;
      correct: number;
      total: number;
      msTotal: number;
      lastMode: ReviewMode;
    }): Promise<QuizOutcome> => {
      const { data, error } = await supabase.rpc("finish_word_quiz", {
        p_user_word_id: vars.userWordId,
        p_correct: vars.correct,
        p_total: vars.total,
        p_ms_total: vars.msTotal,
        p_mode: vars.lastMode,
        p_client_id: `quiz:${vars.userWordId}:${Date.now()}`,
      });
      if (error) throw error;
      return data as unknown as QuizOutcome;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["word", vars.userWordId] });
      void qc.invalidateQueries({ queryKey: ["my-words"] });
      void qc.invalidateQueries({ queryKey: ["home-summary"] });
      void qc.invalidateQueries({ queryKey: ["due-words"] });
    },
  });
}

/**
 * The same 0→1 scale `finish_word_quiz` returns, for screens that only have
 * the word row. Mirrors the mastery test in srs_next: 60-day interval and
 * six repetitions, weighted 60/40.
 */
export function masteryOf(word: {
  interval_days: number;
  repetitions: number;
}): number {
  return Math.min(
    1,
    (Math.min(word.interval_days, 60) / 60) * 0.6 +
      (Math.min(word.repetitions, 6) / 6) * 0.4,
  );
}

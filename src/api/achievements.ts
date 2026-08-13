import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import type { Achievement, HomeSummary } from "@/lib/database.types";

export type AchievementRow = Achievement & {
  earned_at: string | null;
  /** 0 → 1 toward unlocking, for the ones still locked */
  progress: number;
};

/** Mirrors the thresholds in check_achievements() so the bar means something. */
const TARGET: Record<string, (s: HomeSummary) => [number, number]> = {
  first_word: (s) => [s.total_words, 1],
  words_10: (s) => [s.total_words, 10],
  words_50: (s) => [s.total_words, 50],
  words_100: (s) => [s.total_words, 100],
  words_500: (s) => [s.total_words, 500],
  mastered_10: (s) => [s.mastered_words, 10],
  mastered_50: (s) => [s.mastered_words, 50],
  streak_3: (s) => [s.current_streak, 3],
  streak_7: (s) => [s.current_streak, 7],
  streak_30: (s) => [s.current_streak, 30],
  streak_100: (s) => [s.current_streak, 100],
  level_5: (s) => [s.level, 5],
  level_10: (s) => [s.level, 10],
};

export function useAchievements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["achievements", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AchievementRow[]> => {
      const [catalog, mine, summary] = await Promise.all([
        supabase.from("achievements").select("*").order("sort_order"),
        supabase.from("user_achievements").select("code, earned_at"),
        supabase.rpc("get_home_summary"),
      ]);

      if (catalog.error) throw catalog.error;

      const earnedRows = (mine.data ?? []) as {
        code: string;
        earned_at: string;
      }[];
      const earned = new Map(earnedRows.map((r) => [r.code, r.earned_at]));
      const s = summary.data as unknown as HomeSummary | null;

      return (catalog.data as Achievement[]).map((a) => {
        const at = earned.get(a.code) ?? null;
        let progress = at ? 1 : 0;

        if (!at && s && TARGET[a.code]) {
          const [have, need] = TARGET[a.code]!(s);
          progress = Math.max(0, Math.min(0.99, have / need));
        }
        return { ...a, earned_at: at, progress };
      });
    },
  });
}

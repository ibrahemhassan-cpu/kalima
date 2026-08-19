import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CefrLevel } from "@/lib/database.types";

/**
 * Packs carry a theme token, never a colour value — rule #4 in the README.
 * The screen maps it through `useTheme().colors`.
 */
export type PackAccent = "brand" | "accent" | "success" | "danger" | "warning";

export type TopicPack = {
  pack_id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  /** Ionicons glyph name */
  icon: string;
  accent: PackAccent;
  cefr_level: CefrLevel | null;
  word_count: number;
  /** how many of them already exist in the shared dictionary */
  ready_count: number;
  owned_count: number;
  /** 0 = exactly their level · positive = harder · negative = easier */
  level_gap: number;
};

/** Two steps above their level is where a pack stops being encouraging. */
export function isTooHard(pack: TopicPack): boolean {
  return pack.level_gap >= 2;
}

export type PackWord = {
  lemma: string;
  /** null while the word hasn't been generated into the dictionary yet */
  entry_id: string | null;
  ar_preview: string | null;
  cefr_level: CefrLevel | null;
  already_mine: boolean;
};

export function useTopicPacks() {
  return useQuery({
    queryKey: ["topic-packs"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<TopicPack[]> => {
      const { data, error } = await supabase.rpc("list_topic_packs");
      if (error) throw error;
      return (data ?? []) as unknown as TopicPack[];
    },
  });
}

export function usePackWords(packId?: string) {
  return useQuery({
    queryKey: ["pack-words", packId],
    enabled: !!packId,
    queryFn: async (): Promise<PackWord[]> => {
      const { data, error } = await supabase.rpc("get_pack_words", {
        p_pack_id: packId!,
      });
      if (error) throw error;
      return (data ?? []) as unknown as PackWord[];
    },
  });
}

export type AddPackResult = {
  added: number;
  /** words the dictionary doesn't have yet — they still need one generation each */
  missing: number;
};

/**
 * Adds every word of the pack that is already in the shared dictionary.
 * Costs nothing and returns instantly; words still missing are reported so the
 * screen can tell the user they'll be generated one tap at a time.
 */
export function useAddPackWords() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (packId: string): Promise<AddPackResult> => {
      const { data, error } = await supabase.rpc("add_pack_words", {
        p_pack_id: packId,
      });
      if (error) throw error;
      return data as unknown as AddPackResult;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["topic-packs"] });
      void qc.invalidateQueries({ queryKey: ["pack-words"] });
      void qc.invalidateQueries({ queryKey: ["my-words"] });
      void qc.invalidateQueries({ queryKey: ["home-summary"] });
      void qc.invalidateQueries({ queryKey: ["due-words"] });
    },
  });
}

/** Pack titles live in the database in both languages, like achievements do. */
export function packTitle(pack: TopicPack, lang: string): string {
  return lang.startsWith("ar") ? pack.title_ar : pack.title_en;
}

export function packSubtitle(pack: TopicPack, lang: string): string {
  return lang.startsWith("ar") ? pack.subtitle_ar : pack.subtitle_en;
}

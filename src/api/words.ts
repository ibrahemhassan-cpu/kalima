import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, SUPABASE_URL } from "@/lib/supabase";
import { isOnline } from "@/lib/network";
import type {
  DictionaryEntry,
  MyWordRow,
  SearchResult,
  WordStatus,
} from "@/lib/database.types";

// ═══════════════════════════════════════════════════════════
// نداء Edge Function: توليد/جلب الكلمة
// ═══════════════════════════════════════════════════════════

export type EnrichResponse = {
  entry: DictionaryEntry;
  cached: boolean;
  user_word_id: string | null;
  ai_remaining?: number;
};

export class EnrichError extends Error {
  code: string;
  /** spelling suggestions the model offered when the word wasn't recognised */
  didYouMean: string[];

  constructor(code: string, messageAr: string, didYouMean: string[] = []) {
    super(messageAr);
    this.code = code;
    this.didYouMean = didYouMean;
  }
}

export async function enrichWord(
  word: string,
  add = false,
): Promise<EnrichResponse> {
  /**
   * Generating a word is the one thing in Kalima that genuinely cannot work
   * offline — the explanation comes from the server. Checking first turns a
   * thirty-second timeout into an immediate, honest answer.
   */
  if (!isOnline()) {
    throw new EnrichError("offline", "مفيش اتصال بالإنترنت");
  }

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new EnrichError("unauthenticated", "لازم تسجّل دخول الأول");

  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/enrich-word`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ word, add }),
    });
  } catch {
    throw new EnrichError("network", "مفيش اتصال بالإنترنت");
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new EnrichError(
      body?.error ?? "unknown",
      body?.message_ar ?? "حصل خطأ. جرّب تاني",
      body?.did_you_mean ?? [],
    );
  }
  return body as EnrichResponse;
}

// ═══════════════════════════════════════════════════════════
// اقتراحات فورية من الكاش أثناء الكتابة
// ═══════════════════════════════════════════════════════════

export function useDictionarySearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ["dict-search", q.toLowerCase()],
    enabled: q.length >= 2,
    staleTime: 5 * 60_000,
    // one entry per prefix typed — don't let them pile up in memory either
    gcTime: 5 * 60_000,
    queryFn: async (): Promise<SearchResult[]> => {
      const { data, error } = await supabase.rpc("search_dictionary", {
        p_query: q,
        p_limit: 6,
      });
      if (error) throw error;
      return (data ?? []) as unknown as SearchResult[];
    },
  });
}

// ═══════════════════════════════════════════════════════════
// إضافة كلمة لمكتبة المستخدم
// ═══════════════════════════════════════════════════════════

export function useAddWord() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { entryId: string; note?: string }) => {
      const { data, error } = await supabase.rpc("add_word", {
        p_entry_id: vars.entryId,
        p_note: vars.note ?? null,
      });
      if (error) throw error;
      return data as unknown as { user_word_id: string; created: boolean };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-words"] });
      void qc.invalidateQueries({ queryKey: ["home-summary"] });
      void qc.invalidateQueries({ queryKey: ["dict-search"] });
      // a word can be added from inside a pack, so its progress moves too
      void qc.invalidateQueries({ queryKey: ["topic-packs"] });
      void qc.invalidateQueries({ queryKey: ["pack-words"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════
// قائمة كلماتي
// ═══════════════════════════════════════════════════════════

export type WordFilter =
  | "all"
  | "learning"
  | "mastered"
  | "hard"
  | "favorite"
  | "archived";
export type WordSort = "recent" | "alpha" | "hardest";

export function useMyWords(opts: {
  filter: WordFilter;
  search: string;
  sort: WordSort;
}) {
  return useQuery({
    queryKey: ["my-words", opts.filter, opts.search.trim(), opts.sort],
    queryFn: async (): Promise<MyWordRow[]> => {
      const { data, error } = await supabase.rpc("list_my_words", {
        p_filter: opts.filter,
        p_search: opts.search.trim() || null,
        p_sort: opts.sort,
        p_limit: 100,
        p_offset: 0,
      });
      if (error) throw error;
      return (data ?? []) as unknown as MyWordRow[];
    },
  });
}

// ═══════════════════════════════════════════════════════════
// تفاصيل كلمة واحدة
// ═══════════════════════════════════════════════════════════

export type WordDetail = {
  id: string;
  status: WordStatus;
  repetitions: number;
  lapses: number;
  ease_factor: number;
  interval_days: number;
  due_at: string;
  last_review_at: string | null;
  mastered_at: string | null;
  personal_note: string | null;
  /** the user's own fix for a wrong AI translation; null = use the entry's */
  custom_translation: string | null;
  is_favorite: boolean;
  created_at: string;
  entry: DictionaryEntry;
};

export function useWordDetail(userWordId?: string) {
  return useQuery({
    queryKey: ["word", userWordId],
    enabled: !!userWordId,
    queryFn: async (): Promise<WordDetail> => {
      const { data, error } = await supabase
        .from("user_words")
        .select("*, entry:dictionary_entries(*)")
        .eq("id", userWordId!)
        .single();
      if (error) throw error;
      return data as unknown as WordDetail;
    },
  });
}

export function useUpdateWord(userWordId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (patch: {
      personal_note?: string | null;
      custom_translation?: string | null;
      is_favorite?: boolean;
      status?: WordStatus;
    }) => {
      const { data, error } = await supabase
        .from("user_words")
        .update(patch)
        .eq("id", userWordId!)
        .select("*, entry:dictionary_entries(*)")
        .single();
      if (error) throw error;
      return data as unknown as WordDetail;
    },
    onSuccess: (data, patch) => {
      qc.setQueryData(["word", userWordId], data);
      void qc.invalidateQueries({ queryKey: ["my-words"] });

      /**
       * A corrected translation changes what the quiz accepts as the right
       * answer — see answer_for_user() in 0010. Questions already in a cache
       * still carry the old option, so drop them; a favourite toggle doesn't
       * need any of this.
       */
      if (patch.custom_translation !== undefined) {
        void qc.invalidateQueries({ queryKey: ["word-quiz", userWordId] });
        void qc.invalidateQueries({ queryKey: ["session-items"] });
        void qc.invalidateQueries({ queryKey: ["due-words"] });
        // screens that look a word up by entry rather than by user_word
        void qc.invalidateQueries({
          queryKey: ["custom-translation", data.entry.id],
        });
      }
    },
  });
}

export function useDeleteWord() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (userWordId: string) => {
      const { error } = await supabase
        .from("user_words")
        .delete()
        .eq("id", userWordId);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-words"] });
      void qc.invalidateQueries({ queryKey: ["home-summary"] });
    },
  });
}

/**
 * The caller's own correction for a dictionary entry, if they own it.
 *
 * Screens that show a word by entry rather than by user_word — the related
 * word sheet, for one — otherwise print the dictionary text and contradict
 * an edit the user already made. RLS scopes the row to them, so no user id
 * is needed here.
 */
export function useCustomTranslation(entryId?: string) {
  return useQuery({
    queryKey: ["custom-translation", entryId],
    enabled: !!entryId,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from("user_words")
        .select("custom_translation")
        .eq("entry_id", entryId!)
        .maybeSingle();
      if (error) throw error;
      return (data?.custom_translation as string | null) ?? null;
    },
  });
}

// ═══════════════════════════════════════════════════════════
// أرشفة كلمة
//
// «بلّغ عن خطأ» كان بيكتب في جدول محدش بيقراه — وعد بفعل ميحصلش. اتشال
// لصالح تعديل الترجمة مباشرةً (custom_translation فوق)، وهو اللي المستخدم
// عايزه أصلًا. والأرشفة هنا بتدّيه مخرج من الكلمة اللي مش عايزها من غير
// ما يمسح تقدّمه فيها.
// ═══════════════════════════════════════════════════════════

export function useSetArchived() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { userWordId: string; archived: boolean }) => {
      const { data, error } = await supabase.rpc("set_word_archived", {
        p_user_word_id: vars.userWordId,
        p_archived: vars.archived,
      });
      if (error) throw error;
      return data as unknown as { status: WordStatus; archived: boolean };
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["word", vars.userWordId] });
      void qc.invalidateQueries({ queryKey: ["my-words"] });
      void qc.invalidateQueries({ queryKey: ["home-summary"] });
      // an archived word leaves the queue; a restored one rejoins it
      void qc.invalidateQueries({ queryKey: ["due-words"] });
      void qc.invalidateQueries({ queryKey: ["session-items"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════
// أدوات عرض
// ═══════════════════════════════════════════════════════════

type Translate = (key: string, opts?: Record<string, unknown>) => string;

/** "in 4 days" / "in an hour" / "due now" — localised via the `due.*` keys. */
export function formatDue(dueAt: string, t: Translate): string {
  const diffMs = new Date(dueAt).getTime() - Date.now();
  if (diffMs <= 0) return t("due.now");

  const mins = Math.round(diffMs / 60_000);
  if (mins < 60) return t("due.minutes", { count: mins });

  const hours = Math.round(mins / 60);
  if (hours < 24) {
    return hours === 1 ? t("due.hour") : t("due.hours", { count: hours });
  }

  const days = Math.round(hours / 24);
  if (days < 30) {
    return days === 1 ? t("due.tomorrow") : t("due.days", { count: days });
  }

  const months = Math.round(days / 30);
  return months === 1 ? t("due.month") : t("due.months", { count: months });
}

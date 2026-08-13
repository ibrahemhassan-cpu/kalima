/**
 * أنواع قاعدة البيانات — مكتوبة يدويًا للأجزاء التي نستخدمها.
 *
 * لتوليدها كاملة من المشروع الفعلي:
 *   npx supabase gen types typescript --project-id aujupuljlpwelevvuqwm > src/lib/database.types.ts
 */

export type WordStatus =
  | "new"
  | "learning"
  | "review"
  | "mastered"
  | "leech"
  | "archived";

export type ReviewMode =
  | "flashcard"
  | "mcq_en_ar"
  | "mcq_ar_en"
  | "listening"
  | "fill_blank"
  | "typing";

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type Sense = {
  pos: string;
  en_definition: string;
  ar_definition: string;
  ar_translations: string[];
  /** short phrase that tells this sense apart, e.g. "in a money context" */
  disambiguator_ar?: string;
};

export type Example = {
  en: string;
  ar: string;
  sense_index?: number;
};

export type DictionaryEntry = {
  id: string;
  lemma: string;
  lemma_norm: string;
  ipa: string | null;
  audio_url: string | null;
  cefr_level: CefrLevel | null;
  frequency_rank: number | null;
  senses: Sense[];
  examples: Example[];
  synonyms: string[];
  antonyms: string[];
  collocations: string[];
  confusable_with: string[];
  memory_tip_ar: string | null;
  source: "gemini" | "dictionary_api" | "manual" | "seed";
  model_version: string | null;
  is_verified: boolean;
  is_flagged: boolean;
  created_at: string;
};

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  native_language: string;
  cefr_level: CefrLevel;
  daily_goal: number;
  reminder_time: string;
  reminder_enabled: boolean;
  timezone: string;
  theme: "light" | "dark" | "system";
  ui_language: "ar" | "en";
  font_scale: "sm" | "md" | "lg" | "xl";
  simple_mode: boolean;
  autoplay_audio: boolean;
  accepted_terms_at: string | null;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UserStats = {
  user_id: string;
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_goal_date: string | null;
  streak_freezes: number;
  total_words: number;
  mastered_words: number;
};

export type Achievement = {
  code: string;
  title_ar: string;
  title_en: string;
  desc_ar: string;
  desc_en: string;
  icon: string;
  xp_reward: number;
  sort_order: number;
};

// ── مخرجات دوال الـ RPC ────────────────────────────────────

export type DueWord = {
  user_word_id: string;
  entry_id: string;
  lemma: string;
  ipa: string | null;
  audio_url: string | null;
  cefr_level: CefrLevel | null;
  senses: Sense[];
  examples: Example[];
  synonyms: string[];
  antonyms: string[];
  memory_tip_ar: string | null;
  status: WordStatus;
  repetitions: number;
  interval_days: number;
  ease_factor: number;
  due_at: string;
  personal_note: string | null;
  is_favorite: boolean;
};

export type MyWordRow = {
  user_word_id: string;
  entry_id: string;
  lemma: string;
  ipa: string | null;
  audio_url: string | null;
  cefr_level: CefrLevel | null;
  ar_preview: string;
  status: WordStatus;
  repetitions: number;
  lapses: number;
  interval_days: number;
  due_at: string;
  is_favorite: boolean;
  created_at: string;
  total_count: number;
};

export type SearchResult = {
  entry_id: string;
  lemma: string;
  cefr_level: CefrLevel | null;
  ar_preview: string;
  already_mine: boolean;
};

export type HomeSummary = {
  due_count: number;
  next_due_at: string | null;
  today_reviews: number;
  daily_goal: number;
  goal_met: boolean;
  total_words: number;
  mastered_words: number;
  total_xp: number;
  level: number;
  xp_this_level: number;
  xp_to_next: number;
  current_streak: number;
  longest_streak: number;
  streak_freezes: number;
};

export type ReviewResult = {
  duplicate?: boolean;
  xp_gained: number;
  goal_bonus: number;
  total_xp: number;
  level: number;
  current_streak: number;
  today_reviews: number;
  daily_goal: number;
  goal_met: boolean;
  status: WordStatus;
  due_at: string;
  interval_days: number;
  mastered_now: boolean;
  new_badges: string[];
};

// ── الشكل الذي يتوقعه supabase-js ──────────────────────────

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      dictionary_entries: {
        Row: DictionaryEntry;
        Insert: Partial<DictionaryEntry>;
        Update: Partial<DictionaryEntry>;
      };
      user_stats: {
        Row: UserStats;
        Insert: Partial<UserStats>;
        Update: Partial<UserStats>;
      };
      achievements: {
        Row: Achievement;
        Insert: Partial<Achievement>;
        Update: Partial<Achievement>;
      };
      user_achievements: {
        Row: { user_id: string; code: string; earned_at: string };
        Insert: { user_id: string; code: string };
        Update: never;
      };
      word_reports: {
        Row: {
          id: string;
          user_id: string | null;
          entry_id: string;
          reason: string;
          note: string | null;
          status: string;
          created_at: string;
        };
        Insert: { entry_id: string; reason: string; note?: string; user_id: string };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_home_summary: { Args: Record<string, never>; Returns: HomeSummary };
      get_due_words: { Args: { p_limit?: number }; Returns: DueWord[] };
      list_my_words: {
        Args: {
          p_filter?: string;
          p_search?: string | null;
          p_sort?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: MyWordRow[];
      };
      search_dictionary: {
        Args: { p_query: string; p_limit?: number };
        Returns: SearchResult[];
      };
      add_word: {
        Args: { p_entry_id: string; p_note?: string | null; p_source?: string };
        Returns: { user_word_id: string; created: boolean };
      };
      submit_review: {
        Args: {
          p_user_word_id: string;
          p_rating: number;
          p_mode?: ReviewMode;
          p_ms_taken?: number | null;
          p_is_correct?: boolean | null;
          p_client_id?: string | null;
        };
        Returns: ReviewResult;
      };
      sync_reviews: {
        Args: { p_batch: unknown };
        Returns: { applied: number; skipped: number };
      };
    };
    Enums: {
      word_status: WordStatus;
      review_mode: ReviewMode;
    };
    CompositeTypes: Record<string, never>;
  };
};

-- ═══════════════════════════════════════════════════════════
-- Kalima — 0001_init.sql
-- الجداول والأنواع والفهارس
-- ═══════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── الأنواع ────────────────────────────────────────────────
do $$ begin
  create type public.word_status as enum
    ('new','learning','review','mastered','leech','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.review_mode as enum
    ('flashcard','mcq_en_ar','mcq_ar_en','listening','fill_blank','typing');
exception when duplicate_object then null; end $$;

-- ── دالة تحديث updated_at ──────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ═══════════════ 1. البروفايل ═══════════════
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  display_name      text        not null default 'متعلّم',
  avatar_url        text,
  native_language   text        not null default 'ar',
  cefr_level        text        not null default 'A2'
                      check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  daily_goal        int         not null default 10
                      check (daily_goal between 3 and 100),
  reminder_time     time        not null default '19:00',
  reminder_enabled  boolean     not null default true,
  timezone          text        not null default 'Africa/Cairo',
  theme             text        not null default 'system'
                      check (theme in ('light','dark','system')),
  ui_language       text        not null default 'ar'
                      check (ui_language in ('ar','en')),
  font_scale        text        not null default 'md'
                      check (font_scale in ('sm','md','lg','xl')),
  simple_mode       boolean     not null default false,
  autoplay_audio    boolean     not null default true,
  accepted_terms_at timestamptz,
  onboarded_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ═══════════════ 2. القاموس المشترك (كاش الـ AI) ═══════════════
create table if not exists public.dictionary_entries (
  id              uuid        primary key default gen_random_uuid(),
  lemma           text        not null,
  lemma_norm      text        not null unique,
  ipa             text,
  audio_url       text,
  cefr_level      text        check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  frequency_rank  int,
  senses          jsonb       not null default '[]'::jsonb,
  examples        jsonb       not null default '[]'::jsonb,
  synonyms        text[]      not null default '{}',
  antonyms        text[]      not null default '{}',
  collocations    text[]      not null default '{}',
  confusable_with text[]      not null default '{}',
  memory_tip_ar   text,
  source          text        not null default 'gemini'
                    check (source in ('gemini','dictionary_api','manual','seed')),
  model_version   text,
  is_verified     boolean     not null default false,
  is_flagged      boolean     not null default false,
  created_at      timestamptz not null default now(),
  constraint senses_is_array   check (jsonb_typeof(senses)   = 'array'),
  constraint examples_is_array check (jsonb_typeof(examples) = 'array')
);

-- فهرس البحث بالبادئة (search-as-you-type). btree كفاية ولا يحتاج امتداد،
-- على عكس pg_trgm اللي بيتثبّت في سكيما مختلفة على Supabase.
create index if not exists dict_lemma_prefix_idx
  on public.dictionary_entries (lemma_norm text_pattern_ops);
create index if not exists dict_level_idx
  on public.dictionary_entries (cefr_level, frequency_rank)
  where not is_flagged;

comment on column public.dictionary_entries.senses is
  '[{ pos, en_definition, ar_definition, ar_translations[] }]';
comment on column public.dictionary_entries.examples is
  '[{ en, ar, sense_index }]';

-- ═══════════════ 3. كلمات المستخدم + حالة SRS ═══════════════
create table if not exists public.user_words (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  entry_id         uuid        not null references public.dictionary_entries(id)
                                 on delete restrict,
  status           public.word_status not null default 'new',
  ease_factor      real        not null default 2.5  check (ease_factor between 1.3 and 3.0),
  interval_days    real        not null default 0    check (interval_days >= 0),
  repetitions      int         not null default 0    check (repetitions >= 0),
  lapses           int         not null default 0    check (lapses >= 0),
  learning_step    int         not null default 0,
  due_at           timestamptz not null default now(),
  last_review_at   timestamptz,
  mastered_at      timestamptz,
  personal_note    text        check (char_length(personal_note) <= 500),
  personal_example text        check (char_length(personal_example) <= 500),
  is_favorite      boolean     not null default false,
  tags             text[]      not null default '{}',
  source           text        not null default 'manual'
                     check (source in ('manual','word_of_day','suggested','import')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, entry_id)
);

create index if not exists uw_due_idx
  on public.user_words (user_id, due_at)
  where status <> 'archived';
create index if not exists uw_status_idx
  on public.user_words (user_id, status);
create index if not exists uw_created_idx
  on public.user_words (user_id, created_at desc);

drop trigger if exists user_words_touch on public.user_words;
create trigger user_words_touch before update on public.user_words
  for each row execute function public.touch_updated_at();

-- ═══════════════ 4. سجل المراجعات (مصدر الحقيقة) ═══════════════
create table if not exists public.reviews (
  id            bigserial   primary key,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  user_word_id  uuid        not null references public.user_words(id) on delete cascade,
  rating        smallint    not null check (rating between 0 and 3),
  mode          public.review_mode not null,
  is_correct    boolean,
  ms_taken      int         check (ms_taken is null or ms_taken between 0 and 600000),
  prev_interval real,
  new_interval  real,
  reviewed_at   timestamptz not null default now(),
  client_id     text
);

create index if not exists reviews_user_time_idx
  on public.reviews (user_id, reviewed_at desc);
create index if not exists reviews_word_idx
  on public.reviews (user_word_id, reviewed_at desc);
create unique index if not exists reviews_client_uniq
  on public.reviews (user_id, client_id) where client_id is not null;

-- ═══════════════ 5. الجلسات ═══════════════
create table if not exists public.study_sessions (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  kind          text        not null check (kind in ('review','quiz')),
  total_items   int         not null default 0,
  correct_items int         not null default 0,
  xp_earned     int         not null default 0,
  duration_ms   int,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz
);
create index if not exists sessions_user_idx
  on public.study_sessions (user_id, started_at desc);

-- ═══════════════ 6. النشاط اليومي والإحصائيات ═══════════════
create table if not exists public.daily_activity (
  user_id       uuid    not null references auth.users(id) on delete cascade,
  activity_date date    not null,
  reviews_count int     not null default 0,
  words_added   int     not null default 0,
  xp            int     not null default 0,
  goal_met      boolean not null default false,
  primary key (user_id, activity_date)
);
create index if not exists activity_date_idx
  on public.daily_activity (user_id, activity_date desc);

create table if not exists public.user_stats (
  user_id          uuid        primary key references auth.users(id) on delete cascade,
  total_xp         int         not null default 0,
  level            int         not null default 1,
  current_streak   int         not null default 0,
  longest_streak   int         not null default 0,
  last_goal_date   date,
  streak_freezes   int         not null default 2 check (streak_freezes >= 0),
  freezes_reset_on date,
  total_words      int         not null default 0,
  mastered_words   int         not null default 0,
  updated_at       timestamptz not null default now()
);

-- ═══════════════ 7. الإنجازات ═══════════════
create table if not exists public.achievements (
  code       text primary key,
  title_ar   text not null,
  title_en   text not null,
  desc_ar    text not null,
  desc_en    text not null,
  icon       text not null,
  xp_reward  int  not null default 0,
  sort_order int  not null default 0
);

create table if not exists public.user_achievements (
  user_id   uuid        not null references auth.users(id) on delete cascade,
  code      text        not null references public.achievements(code) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, code)
);

-- ═══════════════ 8. تشغيلية ═══════════════
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null default current_date,
  calls   int  not null default 0,
  primary key (user_id, day)
);

create table if not exists public.word_reports (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references auth.users(id) on delete set null,
  entry_id   uuid        not null references public.dictionary_entries(id) on delete cascade,
  reason     text        not null
               check (reason in ('wrong_translation','bad_example','offensive','other')),
  note       text        check (char_length(note) <= 1000),
  status     text        not null default 'open'
               check (status in ('open','reviewed','fixed','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.deletion_requests (
  user_id      uuid        primary key,
  email        text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

-- ═══════════════ 9. حاويات التخزين ═══════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pronunciations', 'pronunciations', true, 1048576,
        array['audio/mpeg','audio/mp3','audio/wav'])
on conflict (id) do nothing;

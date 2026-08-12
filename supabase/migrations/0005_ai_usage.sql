-- ═══════════════════════════════════════════════════════════
-- Kalima — 0005_ai_usage.sql
-- حد استخدام الـ AI اليومي + البحث في القاموس
-- ═══════════════════════════════════════════════════════════

-- ── عدّاد نداءات الـ AI ────────────────────────────────────
-- تُستدعى من Edge Function بصلاحية service_role فقط.
create or replace function public.bump_ai_usage(
  p_user  uuid,
  p_limit int default 30
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day   date;
  v_calls int;
begin
  v_day := public.user_today(p_user);

  insert into public.ai_usage as au (user_id, day, calls)
  values (p_user, v_day, 1)
  on conflict (user_id, day) do update
    set calls = au.calls + 1
  returning au.calls into v_calls;

  return jsonb_build_object(
    'calls',     v_calls,
    'limit',     p_limit,
    'remaining', greatest(0, p_limit - v_calls),
    'allowed',   v_calls <= p_limit
  );
end $$;

-- لا أحد يستدعيها من العميل — service_role فقط
revoke execute on function public.bump_ai_usage(uuid, int)
  from public, anon, authenticated;

-- ── التراجع عن العدّ لو فشل نداء Gemini ────────────────────
create or replace function public.refund_ai_usage(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.ai_usage
    set calls = greatest(0, calls - 1)
    where user_id = p_user and day = public.user_today(p_user);
end $$;

revoke execute on function public.refund_ai_usage(uuid)
  from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════
-- بحث فوري في القاموس (اقتراحات أثناء الكتابة)
-- ═══════════════════════════════════════════════════════════
create or replace function public.search_dictionary(
  p_query text,
  p_limit int default 8
)
returns table (
  entry_id     uuid,
  lemma        text,
  cefr_level   text,
  ar_preview   text,
  already_mine boolean
)
language sql
stable
set search_path = ''
as $$
  select de.id,
         de.lemma,
         de.cefr_level,
         coalesce(de.senses -> 0 -> 'ar_translations' ->> 0, ''),
         exists (select 1 from public.user_words uw
                  where uw.user_id = auth.uid() and uw.entry_id = de.id)
  from public.dictionary_entries de
  where not de.is_flagged
    and de.lemma_norm like lower(trim(coalesce(p_query, ''))) || '%'
    and length(trim(coalesce(p_query, ''))) >= 2
  order by
    case when de.lemma_norm = lower(trim(p_query)) then 0 else 1 end,
    coalesce(de.frequency_rank, 999999),
    de.lemma_norm
  limit least(greatest(coalesce(p_limit, 8), 1), 20);
$$;

grant execute on function public.search_dictionary(text, int) to authenticated;

-- ═══════════════════════════════════════════════════════════
-- قائمة كلمات المستخدم مع الفلاتر (لشاشة "كلماتي")
-- ═══════════════════════════════════════════════════════════
create or replace function public.list_my_words(
  p_filter text default 'all',   -- all · learning · mastered · hard · favorite
  p_search text default null,
  p_sort   text default 'recent', -- recent · alpha · hardest
  p_limit  int  default 50,
  p_offset int  default 0
)
returns table (
  user_word_id  uuid,
  entry_id      uuid,
  lemma         text,
  ipa           text,
  audio_url     text,
  cefr_level    text,
  ar_preview    text,
  status        public.word_status,
  repetitions   int,
  lapses        int,
  interval_days real,
  due_at        timestamptz,
  is_favorite   boolean,
  created_at    timestamptz,
  total_count   bigint
)
language sql
stable
set search_path = ''
as $$
  with base as (
    select uw.id  as user_word_id,
           de.id  as entry_id,
           de.lemma, de.ipa, de.audio_url, de.cefr_level,
           coalesce(de.senses -> 0 -> 'ar_translations' ->> 0, '') as ar_preview,
           uw.status, uw.repetitions, uw.lapses, uw.interval_days,
           uw.due_at, uw.is_favorite, uw.created_at
    from public.user_words uw
    join public.dictionary_entries de on de.id = uw.entry_id
    where uw.user_id = auth.uid()
      and uw.status <> 'archived'
      and (
        p_filter = 'all'
        or (p_filter = 'learning' and uw.status in ('new','learning','review'))
        or (p_filter = 'mastered' and uw.status = 'mastered')
        or (p_filter = 'hard'     and (uw.status = 'leech' or uw.lapses >= 3))
        or (p_filter = 'favorite' and uw.is_favorite)
      )
      and (
        p_search is null or trim(p_search) = ''
        or de.lemma_norm like lower(trim(p_search)) || '%'
        or de.senses::text like '%' || trim(p_search) || '%'
      )
  )
  select b.*, count(*) over () as total_count
  from base b
  order by
    case when p_sort = 'alpha'   then b.lemma end asc,
    case when p_sort = 'hardest' then b.lapses end desc,
    b.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

grant execute on function public.list_my_words(text, text, text, int, int) to authenticated;

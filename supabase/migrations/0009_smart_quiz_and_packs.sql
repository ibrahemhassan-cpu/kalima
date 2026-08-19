-- ═══════════════════════════════════════════════════════════
-- Kalima — 0009_smart_quiz_and_packs.sql
--
--   1. المشتّتات تيجي من كلمات المستخدم نفسه
--   2. الحزم بتترتّب حسب مستواه
--   3. دروع الستريك بقت ظاهرة
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- 1. مشتّتات من مكتبة المستخدم
--
-- Gemini بيولّد ٣ مشتّتات مع الكلمة، فالسؤال بيختبر «تعرف الكلمة دي؟».
-- لما المشتّتات تيجي من **كلمات المستخدم التانية القريبة منها**، السؤال
-- بيختبر «بتفرّق بين الكلمتين اللي بتخلط بينهم؟» — ودي المشكلة الحقيقية
-- في تعلّم المفردات، مش معرفة الكلمة معزولة.
--
-- القرب مُعرَّف بحاجتين متاحتين في الداتا خلاص: نفس مستوى CEFR، وأن تكون
-- الكلمة نشطة عند المستخدم. بنرجع للمشتّتات المولّدة لو مكتبته لسه صغيرة.
-- ═══════════════════════════════════════════════════════════
create or replace function public.smart_distractors(
  p_user       uuid,
  p_entry      uuid,
  p_kind       public.review_mode,
  p_answer     text,
  p_want       int default 3
)
returns text[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_level text;
  v_out   text[];
begin
  -- البطاقة والكتابة مالهمش خيارات أصلًا
  if p_kind not in ('mcq_en_ar', 'mcq_ar_en', 'listening', 'fill_blank') then
    return '{}'::text[];
  end if;

  select de.cefr_level into v_level
  from public.dictionary_entries de where de.id = p_entry;

  -- ── نافذة مرشّحين محدودة ──────────────────────────────────
  -- ORDER BY random() على المكتبة كلها مرة لكل كلمة مستحقّة كان بيرتّب
  -- عشرات الآلاف من الصفوف في الجلسة الواحدة. بناخد ٤٠ مرشّحًا عبر الفهرس
  -- الموجود (user_id, created_at desc) وبعدين نعشوئ جوّاهم — النتيجة
  -- متنوّعة بنفس القدر، والتكلفة ثابتة مهما كبرت المكتبة.
  with pool as (
    select de.id,
           de.lemma,
           coalesce(de.senses -> 0 -> 'ar_translations' ->> 0, '') as ar,
           de.cefr_level
    from public.user_words uw
    join public.dictionary_entries de on de.id = uw.entry_id
    where uw.user_id = p_user
      and uw.entry_id <> p_entry
      and uw.status <> 'archived'
    order by
      case when de.cefr_level = v_level then 0 else 1 end,
      uw.created_at desc
    limit 40
  )
  select array_agg(x) into v_out from (
    select x from (
      select case when p_kind = 'mcq_en_ar' then ar else lemma end as x
      from pool
    ) c
    where c.x <> ''
      and lower(btrim(c.x)) <> lower(btrim(coalesce(p_answer, '')))
    group by c.x
    order by random()
    limit greatest(p_want, 1)
  ) s;

  -- مكتبة أصغر من ٣ كلمات مناسبة → المشتّتات المولّدة أحسن من خيارات ناقصة
  if v_out is null or array_length(v_out, 1) < p_want then
    return '{}'::text[];
  end if;

  return v_out;
end $$;

revoke execute on function public.smart_distractors(uuid, uuid, public.review_mode, text, int)
  from public, anon;

-- ── المُنسّق بيستخدمها، وبيرجع للمولّدة لو مرجّعتش حاجة ──
create or replace function public.get_session_items(p_limit int default 20)
returns table (
  user_word_id  uuid,
  entry_id      uuid,
  lemma         text,
  ipa           text,
  audio_url     text,
  cefr_level    text,
  senses        jsonb,
  examples      jsonb,
  memory_tip_ar text,
  status        public.word_status,
  repetitions   int,
  interval_days real,
  ease_factor   real,
  due_at        timestamptz,
  mode          public.review_mode,
  question_id   uuid,
  prompt        text,
  prompt_hint   text,
  difficulty    smallint,
  options       text[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  return query
  with due as (
    select uw.*, de.lemma, de.ipa, de.audio_url, de.cefr_level,
           de.senses, de.examples, de.memory_tip_ar
    from public.user_words uw
    join public.dictionary_entries de on de.id = uw.entry_id
    where uw.user_id = v_user
      and uw.status <> 'archived'
      and uw.due_at <= now()
    order by
      case when uw.status = 'leech'                   then 0
           when uw.due_at < now() - interval '3 days' then 1
           when uw.status in ('new', 'learning')      then 2
           else 3 end,
      uw.due_at asc
    limit least(greatest(coalesce(p_limit, 20), 1), 60)
  ),
  allowed as (
    select d.id as uw_id, m.kind
    from due d
    cross join lateral (
      select unnest(
        case
          when d.repetitions = 0 then
            array['flashcard']::public.review_mode[]
          when d.repetitions <= 2 then
            array['mcq_en_ar','mcq_ar_en']::public.review_mode[]
          else
            array['mcq_en_ar','mcq_ar_en','listening','fill_blank']::public.review_mode[]
        end
      ) as kind
    ) m
    where m.kind <> all (public.last_modes(d.id, 1))
  ),
  candidates as (
    select a.uw_id, a.kind,
           q.id  as qid, q.prompt, q.prompt_hint, q.difficulty,
           q.distractors, q.answer,
           case when a.kind = 'flashcard' then 1 else 0 end as fallback_rank,
           random() as r
    from allowed a
    join due d on d.id = a.uw_id
    left join lateral (
      select eq.*
      from public.entry_questions eq
      where eq.entry_id = d.entry_id and eq.kind = a.kind
      order by abs(eq.difficulty - least(3, greatest(1, (d.repetitions / 3) + 1))),
               random()
      limit 1
    ) q on true
    where a.kind = 'flashcard' or q.id is not null
  ),
  picked as (
    select distinct on (c.uw_id) c.*
    from candidates c
    order by c.uw_id, c.fallback_rank, c.r
  )
  select d.id, d.entry_id, d.lemma, d.ipa, d.audio_url, d.cefr_level,
         d.senses, d.examples, d.memory_tip_ar,
         d.status, d.repetitions, d.interval_days, d.ease_factor, d.due_at,
         coalesce(p.kind, 'flashcard'::public.review_mode),
         p.qid, p.prompt, p.prompt_hint, p.difficulty,
         case
           when p.qid is null then '{}'::text[]
           else (
             select array_agg(o order by random())
             from unnest(
               array_append(
                 -- كلماته هو أولًا، والمولّدة احتياطي
                 coalesce(
                   nullif(
                     public.smart_distractors(v_user, d.entry_id, p.kind, p.answer, 3),
                     '{}'::text[]
                   ),
                   p.distractors
                 ),
                 p.answer
               )
             ) o
           )
         end
  from due d
  left join picked p on p.uw_id = d.id
  order by
    case when d.status = 'leech'                   then 0
         when d.due_at < now() - interval '3 days' then 1
         when d.status in ('new', 'learning')      then 2
         else 3 end,
    d.due_at asc;
end $$;

grant execute on function public.get_session_items(int) to authenticated;

-- ── نفس المعاملة لامتحان الكلمة الواحدة ──
create or replace function public.get_word_quiz(
  p_user_word_id uuid,
  p_limit        int default 6
)
returns table (
  question_id uuid,
  entry_id    uuid,
  lemma       text,
  ipa         text,
  audio_url   text,
  senses      jsonb,
  examples    jsonb,
  mode        public.review_mode,
  prompt      text,
  prompt_hint text,
  difficulty  smallint,
  options     text[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user  uuid := auth.uid();
  v_entry uuid;
begin
  if v_user is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  select uw.entry_id into v_entry
  from public.user_words uw
  where uw.id = p_user_word_id and uw.user_id = v_user;

  if v_entry is null then
    raise exception 'word not found' using errcode = 'P0002';
  end if;

  return query
  with pool as (
    select eq.*,
           row_number() over (partition by eq.kind order by random()) as per_kind
    from public.entry_questions eq
    where eq.entry_id = v_entry
      and eq.kind = any (
        array['mcq_en_ar','mcq_ar_en','listening','fill_blank']::public.review_mode[]
      )
  ),
  picked as (
    select * from pool
    order by per_kind, random()
    limit least(greatest(coalesce(p_limit, 6), 1), 12)
  )
  select p.id, v_entry, de.lemma, de.ipa, de.audio_url, de.senses, de.examples,
         p.kind, p.prompt, p.prompt_hint, p.difficulty,
         (select array_agg(o order by random())
          from unnest(
            array_append(
              coalesce(
                nullif(
                  public.smart_distractors(v_user, v_entry, p.kind, p.answer, 3),
                  '{}'::text[]
                ),
                p.distractors
              ),
              p.answer
            )
          ) o)
  from picked p
  cross join public.dictionary_entries de
  where de.id = v_entry
  order by p.difficulty, random();
end $$;

grant execute on function public.get_word_quiz(uuid, int) to authenticated;

-- ═══════════════════════════════════════════════════════════
-- 2. الحزم بترتّب حسب مستوى المستخدم
--
-- حزمة B2 في وش مبتدئ A1 = يضيفها، يفشل فيها، يسيب التطبيق.
-- بنرجّع مسافة رقمية عن مستواه عشان الواجهة ترتّب وتحذّر.
-- ═══════════════════════════════════════════════════════════
-- level_gap عمود جديد في المخرجات، وPostgres ما بيسمحش بتغيير شكل الإرجاع
-- بـ create or replace — لازم تتشال الأول.
drop function if exists public.list_topic_packs();

create function public.list_topic_packs()
returns table (
  pack_id     uuid,
  slug        text,
  title_ar    text,
  title_en    text,
  subtitle_ar text,
  subtitle_en text,
  icon        text,
  accent      text,
  cefr_level  text,
  word_count  int,
  ready_count int,
  owned_count int,
  /** 0 = مستواه بالظبط · موجب = أصعب · سالب = أسهل */
  level_gap   int
)
language sql
stable
set search_path = ''
as $$
  with me as (
    select coalesce(
      array_position(array['A1','A2','B1','B2','C1','C2'],
                     (select p.cefr_level from public.profiles p where p.id = auth.uid())),
      2
    ) as rank
  )
  select p.id, p.slug, p.title_ar, p.title_en, p.subtitle_ar, p.subtitle_en,
         p.icon, p.accent, p.cefr_level,
         count(pw.lemma)::int,
         count(de.id)::int,
         count(uw.id)::int,
         coalesce(
           array_position(array['A1','A2','B1','B2','C1','C2'], p.cefr_level),
           (select rank from me)
         ) - (select rank from me)
  from public.topic_packs p
  left join public.pack_words pw
    on pw.pack_id = p.id
  left join public.dictionary_entries de
    on de.lemma_norm = pw.lemma and not de.is_flagged
  left join public.user_words uw
    on uw.entry_id = de.id
   and uw.user_id = auth.uid()
   and uw.status <> 'archived'
  where p.is_active
  group by p.id
  -- الأقرب لمستواه أولًا، والأسهل قبل الأصعب عند التساوي
  order by abs(coalesce(
             array_position(array['A1','A2','B1','B2','C1','C2'], p.cefr_level),
             (select rank from me)
           ) - (select rank from me)),
           p.sort_order;
$$;

grant execute on function public.list_topic_packs() to authenticated;

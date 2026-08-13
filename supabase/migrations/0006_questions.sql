-- ═══════════════════════════════════════════════════════════
-- Kalima — 0006_questions.sql
-- بنك أسئلة مولّد بالـ AI + مُنسّق جلسة يمنع التكرار
-- ═══════════════════════════════════════════════════════════

-- ── بنك الأسئلة ────────────────────────────────────────────
-- الأسئلة تُولّد مرة واحدة لكل كلمة في القاموس المشترك،
-- تمامًا مثل تعريف الكلمة — فالتكلفة تُدفع مرة واحدة للأبد.
create table if not exists public.entry_questions (
  id             uuid primary key default gen_random_uuid(),
  entry_id       uuid not null references public.dictionary_entries(id) on delete cascade,
  kind           public.review_mode not null,
  difficulty     smallint not null default 2 check (difficulty between 1 and 3),
  -- نص السؤال: جملة بها فراغ، أو الترجمة العربية، أو تعريف إنجليزي
  prompt         text not null,
  prompt_hint    text,
  -- الخيارات الخاطئة فقط. الإجابة الصحيحة في عمود answer وما تُرسَل للعميل أبدًا
  distractors    text[] not null default '{}',
  answer         text not null,
  explanation_ar text,
  source         text not null default 'gemini',
  created_at     timestamptz not null default now()
);

create index if not exists eq_entry_kind_idx
  on public.entry_questions (entry_id, kind);
-- فهرس عادي (مش دالّي) عشان PostgREST يقدر يستخدمه كـ conflict target
create unique index if not exists eq_unique_prompt
  on public.entry_questions (entry_id, kind, prompt);

alter table public.entry_questions enable row level security;
grant select on public.entry_questions to authenticated;

drop policy if exists eq_select on public.entry_questions;
create policy eq_select on public.entry_questions
  for select to authenticated using (true);
-- لا سياسة كتابة: التوليد عبر Edge Function بصلاحية service_role فقط

-- ── تتبّع الأنواع المستخدمة لكل كلمة ───────────────────────
-- يمنع تكرار نفس نوع السؤال مرّتين وراء بعض.
create or replace function public.last_modes(p_user_word_id uuid, p_n int default 2)
returns public.review_mode[]
language sql
stable
set search_path = ''
as $$
  select coalesce(array_agg(m order by rn), '{}')
  from (
    select r.mode as m, row_number() over (order by r.reviewed_at desc) as rn
    from public.reviews r
    where r.user_word_id = p_user_word_id
    order by r.reviewed_at desc
    limit greatest(p_n, 1)
  ) s;
$$;

-- ═══════════════════════════════════════════════════════════
-- مُنسّق الجلسة
--
-- القواعد:
--   • الأنواع تُفتَح تدريجيًّا مع نضج الكلمة
--   • الكتابة لا تُطلب إلا من المستوى B1 فأعلى
--   • النوع المستخدم في آخر مراجعة مستبعَد
--   • الأنواع التي لها سؤال جاهز مفضّلة، وإلا نرجع للبطاقة
-- ═══════════════════════════════════════════════════════════
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
  -- مخلوطة، وبدون تمييز للإجابة الصحيحة
  options       text[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user  uuid := auth.uid();
  v_level text;
  v_adv   boolean;
begin
  if v_user is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  select p.cefr_level into v_level from public.profiles p where p.id = v_user;
  v_adv := coalesce(v_level, 'A2') in ('B1', 'B2', 'C1', 'C2');

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
  -- الأنواع المسموحة لكل كلمة حسب نضجها
  allowed as (
    select d.id as uw_id,
           m.kind
    from due d
    cross join lateral (
      select unnest(
        case
          when d.repetitions = 0 then array['flashcard']::public.review_mode[]
          when d.repetitions <= 2 then array['flashcard','mcq_en_ar']::public.review_mode[]
          when d.repetitions <= 4 then array['flashcard','mcq_en_ar','mcq_ar_en','listening']::public.review_mode[]
          when v_adv then array['mcq_en_ar','mcq_ar_en','listening','fill_blank','typing','flashcard']::public.review_mode[]
          else array['mcq_en_ar','mcq_ar_en','listening','fill_blank','flashcard']::public.review_mode[]
        end
      ) as kind
    ) m
    where m.kind <> all (public.last_modes(d.id, 1))
  ),
  -- اربط كل نوع مسموح بسؤال متاح (البطاقة لا تحتاج سؤالًا)
  candidates as (
    select a.uw_id,
           a.kind,
           q.id  as qid,
           q.prompt,
           q.prompt_hint,
           q.difficulty,
           q.distractors,
           q.answer,
           -- فضّل الأنواع التفاعلية على البطاقة العادية
           case when a.kind = 'flashcard' then 1 else 0 end as fallback_rank,
           random() as r
    from allowed a
    join due d on d.id = a.uw_id
    left join lateral (
      select eq.*
      from public.entry_questions eq
      where eq.entry_id = d.entry_id
        and eq.kind = a.kind
      order by
        -- طابِق الصعوبة مع نضج الكلمة
        abs(eq.difficulty - least(3, greatest(1, (d.repetitions / 3) + 1))),
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
         p.qid,
         p.prompt,
         p.prompt_hint,
         p.difficulty,
         case
           when p.qid is null then '{}'::text[]
           else (
             select array_agg(o order by random())
             from unnest(array_append(p.distractors, p.answer)) o
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
revoke execute on function public.last_modes(uuid, int) from public, anon;

-- ═══════════════════════════════════════════════════════════
-- تصحيح الإجابة على السيرفر
--
-- الإجابة الصحيحة لا تغادر قاعدة البيانات أبدًا، فلا يمكن
-- قراءتها من الشبكة. التقييم يُشتق من الصحة وزمن الاستجابة.
-- ═══════════════════════════════════════════════════════════
create or replace function public.submit_quiz_answer(
  p_user_word_id uuid,
  p_question_id  uuid,
  p_answer       text,
  p_ms_taken     int  default null,
  p_client_id    text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user    uuid := auth.uid();
  v_q       public.entry_questions%rowtype;
  v_correct boolean;
  v_rating  smallint;
  v_result  jsonb;
begin
  if v_user is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  select * into v_q from public.entry_questions where id = p_question_id;
  if not found then
    raise exception 'question not found' using errcode = 'P0002';
  end if;

  -- مقارنة متسامحة: تتجاهل حالة الأحرف والمسافات وعلامات الترقيم الطرفية
  v_correct := lower(btrim(coalesce(p_answer, ''), ' .!?,;:')) =
               lower(btrim(v_q.answer, ' .!?,;:'));

  -- اشتقاق التقييم:
  --   غلط            → 0
  --   صح لكن بطيء     → 1  (أكثر من 12 ثانية)
  --   صح              → 2
  --   صح وسريع        → 3  (أقل من 4 ثوانٍ)
  v_rating := case
    when not v_correct then 0
    when p_ms_taken is null then 2
    when p_ms_taken > 12000 then 1
    when p_ms_taken < 4000 then 3
    else 2
  end;

  v_result := public.submit_review(
    p_user_word_id,
    v_rating,
    v_q.kind,
    p_ms_taken,
    v_correct,
    p_client_id
  );

  return v_result || jsonb_build_object(
    'correct',        v_correct,
    'correct_answer', v_q.answer,
    'explanation_ar', v_q.explanation_ar,
    'rating',         v_rating
  );
end $$;

grant execute on function public.submit_quiz_answer(uuid, uuid, text, int, text)
  to authenticated;

-- ═══════════════════════════════════════════════════════════
-- الكلمات التي ما زالت بلا بنك أسئلة (للتوليد الكسول)
-- ═══════════════════════════════════════════════════════════
create or replace function public.entries_missing_questions(p_limit int default 5)
returns table (entry_id uuid, lemma text)
language sql
stable
set search_path = ''
as $$
  select distinct de.id, de.lemma
  from public.user_words uw
  join public.dictionary_entries de on de.id = uw.entry_id
  where uw.user_id = auth.uid()
    and uw.status <> 'archived'
    and uw.repetitions >= 1
    and not exists (
      select 1 from public.entry_questions eq where eq.entry_id = de.id
    )
  limit least(greatest(coalesce(p_limit, 5), 1), 20);
$$;

grant execute on function public.entries_missing_questions(int) to authenticated;

-- ═══════════════════════════════════════════════════════════
-- هل الكلمة موجودة في مكتبة المستخدم؟ (للمرادفات القابلة للضغط)
-- ═══════════════════════════════════════════════════════════
create or replace function public.lookup_words(p_words text[])
returns table (
  lemma        text,
  entry_id     uuid,
  ar_preview   text,
  cefr_level   text,
  already_mine boolean
)
language sql
stable
set search_path = ''
as $$
  select w.w,
         de.id,
         coalesce(de.senses -> 0 -> 'ar_translations' ->> 0, ''),
         de.cefr_level,
         exists (
           select 1 from public.user_words uw
           where uw.user_id = auth.uid() and uw.entry_id = de.id
         )
  from unnest(p_words) as w(w)
  left join public.dictionary_entries de
    on de.lemma_norm = lower(btrim(w.w)) and not de.is_flagged;
$$;

grant execute on function public.lookup_words(text[]) to authenticated;

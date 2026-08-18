-- ═══════════════════════════════════════════════════════════
-- Kalima — 0008_quiz_and_reminders.sql
--
--   1. الأسئلة كلها بالاختيار — الكتابة اتشالت
--   2. امتحان كلمة واحدة: عدة أسئلة → تقييم واحد → مراجعة واحدة
--   3. أكتر من موعد تذكير في اليوم
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- 1. مُنسّق الجلسة — أنواع بالاختيار فقط
--
-- الكتابة (typing) اتشالت خالص. الباقي كله بيتجاوب بضغطة على
-- الإجابة الصحيحة، والتنوّع بقى في **صيغة السؤال** مش في طريقة
-- الإجابة: إنجليزي→عربي · عربي→إنجليزي · استماع · جملة ناقصة.
--
-- والتنوّع بقى بيفتح أبدرى: من المراجعة الأولى بعد التعرّف.
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
  -- الأنواع المسموحة لكل كلمة حسب نضجها — كلها بالاختيار
  allowed as (
    select d.id as uw_id,
           m.kind
    from due d
    cross join lateral (
      select unnest(
        case
          -- أول لقاء بالكلمة: بطاقة تنقلب. ما ينفعش نمتحنه في حاجة ما شافهاش
          when d.repetitions = 0 then
            array['flashcard']::public.review_mode[]
          -- بعد كده اختيار من متعدد بالاتجاهين
          when d.repetitions <= 2 then
            array['mcq_en_ar','mcq_ar_en']::public.review_mode[]
          -- ثم يدخل الاستماع والجملة الناقصة
          else
            array['mcq_en_ar','mcq_ar_en','listening','fill_blank']::public.review_mode[]
        end
      ) as kind
    ) m
    where m.kind <> all (public.last_modes(d.id, 1))
  ),
  candidates as (
    select a.uw_id,
           a.kind,
           q.id  as qid,
           q.prompt,
           q.prompt_hint,
           q.difficulty,
           q.distractors,
           q.answer,
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

-- ═══════════════════════════════════════════════════════════
-- 2. امتحان كلمة واحدة
--
-- المستخدم يختار كلمة ويمتحن فيها لوحدها. بنجيب له كل أسئلتها
-- المتاحة بتنويع الأنواع، وفي الآخر **مراجعة واحدة** بتقييم
-- مشتق من نسبة إجاباته الصحيحة — مش مراجعة لكل سؤال، وإلا
-- امتحان من ٦ أسئلة كان هيقفز بموعد المراجعة قفزة غير حقيقية.
-- ═══════════════════════════════════════════════════════════
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
           -- سؤال واحد من كل نوع الأول، وبعدين التاني من كل نوع…
           row_number() over (partition by eq.kind order by random()) as per_kind
    from public.entry_questions eq
    where eq.entry_id = v_entry
      and eq.kind = any (
        array['mcq_en_ar','mcq_ar_en','listening','fill_blank']::public.review_mode[]
      )
  ),
  picked as (
    select *
    from pool
    order by per_kind, random()
    limit least(greatest(coalesce(p_limit, 6), 1), 12)
  )
  select p.id,
         v_entry,
         de.lemma,
         de.ipa,
         de.audio_url,
         de.senses,
         de.examples,
         p.kind,
         p.prompt,
         p.prompt_hint,
         p.difficulty,
         (select array_agg(o order by random())
          from unnest(array_append(p.distractors, p.answer)) o)
  from picked p
  cross join public.dictionary_entries de
  where de.id = v_entry
  -- من الأسهل للأصعب
  order by p.difficulty, random();
end $$;

grant execute on function public.get_word_quiz(uuid, int) to authenticated;

-- ── تصحيح سؤال بدون أي أثر على الجدولة ─────────────────────
-- الإجابة الصحيحة تفضل في قاعدة البيانات زي ما هي؛ اللي بيرجع
-- للعميل هو نتيجة المقارنة بس. الجدولة بتتحرك مرة واحدة في
-- finish_word_quiz تحت.
create or replace function public.check_quiz_answer(
  p_question_id uuid,
  p_answer      text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_q       public.entry_questions%rowtype;
  v_correct boolean;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  select * into v_q from public.entry_questions where id = p_question_id;
  if not found then
    raise exception 'question not found' using errcode = 'P0002';
  end if;

  -- نفس المقارنة المتسامحة اللي في submit_quiz_answer
  v_correct := lower(btrim(coalesce(p_answer, ''), ' .!?,;:')) =
               lower(btrim(v_q.answer, ' .!?,;:'));

  return jsonb_build_object(
    'correct',        v_correct,
    'correct_answer', v_q.answer,
    'explanation_ar', v_q.explanation_ar
  );
end $$;

grant execute on function public.check_quiz_answer(uuid, text) to authenticated;

-- ── إنهاء الامتحان: تقييم واحد ومراجعة واحدة ───────────────
create or replace function public.finish_word_quiz(
  p_user_word_id uuid,
  p_correct      int,
  p_total        int,
  p_ms_total     int  default null,
  p_mode         public.review_mode default 'mcq_en_ar',
  p_client_id    text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user    uuid := auth.uid();
  v_acc     real;
  v_rating  smallint;
  v_res     jsonb;
  v_uw      public.user_words%rowtype;
  v_mastery real;
begin
  if v_user is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  if not exists (select 1 from public.user_words
                  where id = p_user_word_id and user_id = v_user) then
    raise exception 'word not found' using errcode = 'P0002';
  end if;

  if coalesce(p_total, 0) < 1 then
    raise exception 'empty quiz' using errcode = '22023';
  end if;

  v_acc := least(1.0, greatest(0.0,
             coalesce(p_correct, 0)::real / p_total::real));

  --   أقل من النص      → نسيها
  --   أقل من ٨٠٪       → بصعوبة
  --   غلطة واحدة       → تذكّرها
  --   كله صح           → سهلة
  v_rating := case
    when v_acc < 0.5 then 0
    when v_acc < 0.8 then 1
    when v_acc < 1.0 then 2
    else 3
  end;

  -- كله صح لكن ببطء (أكتر من ١٠ ثواني للسؤال) مش «سهلة»
  if v_rating = 3
     and p_ms_total is not null
     and p_ms_total > p_total * 10000 then
    v_rating := 2;
  end if;

  v_res := public.submit_review(
    p_user_word_id,
    v_rating,
    p_mode,
    p_ms_total,
    v_acc >= 0.5,
    p_client_id
  );

  select * into v_uw from public.user_words where id = p_user_word_id;

  -- «وصلت لفين» — مشتقة من نفس شرطَي الإتقان في srs_next:
  -- فاصل ٦٠ يوم و٦ مراجعات ناجحة.
  v_mastery := least(1.0,
      (least(v_uw.interval_days, 60.0) / 60.0) * 0.6
    + (least(v_uw.repetitions, 6)::real / 6.0) * 0.4);

  return v_res || jsonb_build_object(
    'correct',     coalesce(p_correct, 0),
    'total',       p_total,
    'accuracy',    v_acc,
    'rating',      v_rating,
    'mastery',     v_mastery,
    'repetitions', v_uw.repetitions,
    'lapses',      v_uw.lapses
  );
end $$;

grant execute on function public.finish_word_quiz(uuid, int, int, int, public.review_mode, text)
  to authenticated;

-- ═══════════════════════════════════════════════════════════
-- 3. أكتر من موعد تذكير
--
-- reminder_time القديم بيفضل مكانه عشان أي عميل قديم ما يقعش،
-- وبيتحدّث دايمًا بأول موعد في المصفوفة.
-- ═══════════════════════════════════════════════════════════
alter table public.profiles
  add column if not exists reminder_times time[];

update public.profiles
  set reminder_times = array[reminder_time]
  where reminder_times is null;

alter table public.profiles
  alter column reminder_times set default array['19:00']::time[];
alter table public.profiles
  alter column reminder_times set not null;

alter table public.profiles drop constraint if exists profiles_reminder_times_len;
alter table public.profiles add constraint profiles_reminder_times_len
  check (array_length(reminder_times, 1) between 1 and 6);

-- خلّي reminder_time دايمًا = أول موعد، عشان مصدر حقيقة واحد
create or replace function public.sync_reminder_time()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.reminder_times is not null and array_length(new.reminder_times, 1) >= 1 then
    new.reminder_time := (select min(t) from unnest(new.reminder_times) t);
  end if;
  return new;
end $$;

drop trigger if exists profiles_sync_reminder on public.profiles;
create trigger profiles_sync_reminder
  before insert or update of reminder_times on public.profiles
  for each row execute function public.sync_reminder_time();

revoke execute on function public.sync_reminder_time() from public, anon;

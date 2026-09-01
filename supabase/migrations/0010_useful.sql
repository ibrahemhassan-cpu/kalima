-- ═══════════════════════════════════════════════════════════
-- Kalima — 0010_useful.sql
--
--   1. المستخدم يقدر يصلّح الترجمة الغلط (أخطر مخاطر المشروع)
--   2. يقدر يأرشف كلمة بدل ما يمسحها
--   3. يشوف رصيد الـ AI قبل ما يخلص مش بعده
--   4. كلمة اليوم — سبب يفتح التطبيق في يوم مفيهوش مراجعات
--
-- ── أي تعريف بيتلغي بإيه ──────────────────────────────────
-- الملف ده بيعيد تعريف دوال موجودة عشان يغيّر سطر أو اتنين فيها. النسخة
-- اللي هنا هي المعتمدة، واللي في الملفات القديمة تاريخ. لو هتعدّل واحدة
-- منهم، عدّل هنا:
--
-- ── بتلغي تعريفًا أقدم ──
--   check_quiz_answer    يلغي 0008
--   submit_quiz_answer   يلغي 0006
--   get_session_items    يلغي 0009 (اللي ألغى 0008 اللي ألغى 0006)
--   get_word_quiz        يلغي 0009 (اللي ألغى 0008)
--   smart_distractors    يلغي 0009
--   list_my_words        يلغي 0005
--   srs_next             يلغي 0003
--   check_achievements   يلغي 0003
--   bump_ai_usage        يلغي 0005
--
-- ── جديدة هنا ──
--   answer_for_user · prompt_for_user · set_word_archived ·
--   like_escape · get_ai_quota · get_word_of_day ·
--   refresh_word_counts · user_words_count_touch
--   جداول: app_settings
--   أعمدة: user_words.custom_translation · user_words.pre_archive_status ·
--          achievements.is_active
--   تريجرز: user_words_counts_ins · user_words_counts_del
--
-- ملحوظة: القايمة دي بايظت مرة قبل كده لأنها اتكتبت وبعدين اتضافت دوال
-- تحتها من غير ما تتحدّث. لو ضفت تعريف تحت، ضيفه هنا في نفس اللحظة —
-- ولو الملفات دي كبرت أكتر، الحل الصح مش قايمة أصلًا: نقل الدوال لمجلد
-- منفصل بيتعاد تطبيقه بالكامل كل مرة، بدل ما كل تعديل ينسخ الدالة من
-- أول وجديد ويسيب نسخة تانية ورا.
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- 1. ترجمة المستخدم الخاصة
--
-- القاموس مشترك بين كل المستخدمين — ده أصل الكاش اللي بيوفّر نداءات الـ AI.
-- فتعديل `dictionary_entries` كان هيغيّر الكلمة عند كل الناس عشان واحد
-- شايف إن الترجمة غلط. التصحيح بيتخزّن على صف المستخدم نفسه: هو يشوف
-- تصحيحه، والباقي يشوفوا الأصل.
-- ═══════════════════════════════════════════════════════════
alter table public.user_words
  add column if not exists custom_translation text
    check (char_length(custom_translation) <= 200);

comment on column public.user_words.custom_translation is
  'تصحيح المستخدم لترجمة الكلمة. NULL = استخدم ترجمة القاموس.';

-- ── الإجابة الصحيحة من وجهة نظر هذا المستخدم ──────────────
--
-- لو صحّح الترجمة، لازم الامتحان يقبل تصحيحه. من غير الدالة دي كان
-- هيصحّح الترجمة وبعدين الامتحان يقوله إن تصحيحه غلط.
--
-- mcq_en_ar بس. الأنواع التانية إجابتها **الكلمة الإنجليزية نفسها**:
--   mcq_ar_en  → السؤال عربي والإجابة الكلمة
--   fill_blank → الفراغ بيتملّى بالكلمة
--   listening  → بيسمع الكلمة ويختار كتابتها، والمشتّتات كلمات إنجليزية
--                متقاربة صوتيًّا (their/there) — راجع gemini.ts
-- لو حطّينا الترجمة العربية مكان أي منهم، الإجابة الصحيحة تبقى النص
-- العربي الوحيد وسط كلمات إنجليزية: تتحلّ من غير ما يسمع.
create or replace function public.answer_for_user(
  p_user   uuid,
  p_entry  uuid,
  p_kind   public.review_mode,
  p_answer text
)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_kind = 'mcq_en_ar' then
      coalesce(
        nullif(btrim((select uw.custom_translation
                        from public.user_words uw
                       where uw.user_id = p_user and uw.entry_id = p_entry)), ''),
        p_answer
      )
    else p_answer
  end;
$$;

revoke execute on function public.answer_for_user(uuid, uuid, public.review_mode, text)
  from public, anon;

-- ── ونفس المنطق للسؤال نفسه ───────────────────────────────
--
-- mcq_ar_en معكوس mcq_en_ar: الـ prompt هو الترجمة العربية والإجابة هي
-- الكلمة الإنجليزية. فاللي صحّح ترجمة كان بيتسأل «أي كلمة تعني <الترجمة
-- اللي رفضها>؟» — سؤال مبني على النص اللي هو شطبه بنفسه.
--
-- fill_blank مستثنى عن قصد: الـ prompt_hint بتاعه ترجمة **جملة** كاملة،
-- مش ترجمة الكلمة، فمفيش حاجة نحطها مكانها.
create or replace function public.prompt_for_user(
  p_user   uuid,
  p_entry  uuid,
  p_kind   public.review_mode,
  p_prompt text
)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_kind = 'mcq_ar_en' then
      coalesce(
        nullif(btrim((select uw.custom_translation
                        from public.user_words uw
                       where uw.user_id = p_user and uw.entry_id = p_entry)), ''),
        p_prompt
      )
    else p_prompt
  end;
$$;

revoke execute on function public.prompt_for_user(uuid, uuid, public.review_mode, text)
  from public, anon;

-- ── التصحيح مقبول في الامتحان ─────────────────────────────
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
  v_user    uuid := auth.uid();
  v_expect  text;
  v_correct boolean;
begin
  if v_user is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  select * into v_q from public.entry_questions where id = p_question_id;
  if not found then
    raise exception 'question not found' using errcode = 'P0002';
  end if;

  v_expect := public.answer_for_user(v_user, v_q.entry_id, v_q.kind, v_q.answer);

  -- نفس المقارنة المتسامحة اللي في submit_quiz_answer، بس بتقبل
  -- الأصل والتصحيح — عشان اللي صحّح الترجمة ميتعاقبش على تصحيحه.
  v_correct :=
    lower(btrim(coalesce(p_answer, ''), ' .!?,;:')) = lower(btrim(v_expect,   ' .!?,;:'))
    or
    lower(btrim(coalesce(p_answer, ''), ' .!?,;:')) = lower(btrim(v_q.answer, ' .!?,;:'));

  return jsonb_build_object(
    'correct',        v_correct,
    'correct_answer', v_expect,
    'explanation_ar', v_q.explanation_ar
  );
end $$;

grant execute on function public.check_quiz_answer(uuid, text) to authenticated;

-- ── ونفس الشيء في جلسة المراجعة ───────────────────────────
--
-- ده المسار اللي بيأثّر على الجدولة فعلًا. من غيره كان اللي يصحّح ترجمة
-- يختار تصحيحه في الجلسة، يتحسب غلط، وينزل مستوى الكلمة عنده — عقاب
-- على إنه صحّح.
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
  v_expect  text;
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

  v_expect := public.answer_for_user(v_user, v_q.entry_id, v_q.kind, v_q.answer);

  -- مقارنة متسامحة: تتجاهل حالة الأحرف والمسافات وعلامات الترقيم الطرفية،
  -- وتقبل ترجمة القاموس وتصحيح المستخدم على السواء
  v_correct :=
    lower(btrim(coalesce(p_answer, ''), ' .!?,;:')) = lower(btrim(v_expect,   ' .!?,;:'))
    or
    lower(btrim(coalesce(p_answer, ''), ' .!?,;:')) = lower(btrim(v_q.answer, ' .!?,;:'));

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
    'correct_answer', v_expect,
    'explanation_ar', v_q.explanation_ar,
    'rating',         v_rating
  );
end $$;

grant execute on function public.submit_quiz_answer(uuid, uuid, text, int, text)
  to authenticated;

-- ── والخيارات المعروضة تعرض تصحيحه ────────────────────────
--
-- custom_translation عمود جديد في المخرجات: البطاقة في المراجعة كانت
-- بتعرض ترجمة القاموس دايمًا، فاللي يصحّح ترجمة يلاقيها غلط تاني في أهم
-- شاشة عنده. تغيير شكل الإرجاع محتاج drop الأول.
drop function if exists public.get_session_items(int);

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
  options       text[],
  /** تصحيح المستخدم للترجمة، لو عمل واحد. NULL = ترجمة القاموس */
  custom_translation text
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
         p.qid, a.prm, p.prompt_hint, p.difficulty,
         case
           when p.qid is null then '{}'::text[]
           else (
             select array_agg(o order by random())
             from unnest(
               array_append(
                 -- array_remove مرتين: تصحيح المستخدم عشان المشتّت ما يتكرّرش،
                 -- وترجمة القاموس الأصلية عشان check_quiz_answer بتقبلها هي
                 -- كمان — فلو فضلت بين الخيارات يبقى للسؤال إجابتين صح
                 array_remove(
                   array_remove(
                     -- كلماته هو أولًا، والمولّدة احتياطي
                     coalesce(
                       nullif(
                         public.smart_distractors(v_user, d.entry_id, p.kind, a.ans, 3),
                         '{}'::text[]
                       ),
                       p.distractors
                     ),
                     a.ans
                   ),
                   p.answer
                 ),
                 a.ans
               )
             ) o
           )
         end,
         d.custom_translation
  from due d
  left join picked p on p.uw_id = d.id
  left join lateral (
    select public.answer_for_user(v_user, d.entry_id, p.kind, p.answer) as ans,
           public.prompt_for_user(v_user, d.entry_id, p.kind, p.prompt) as prm
  ) a on true
  order by
    case when d.status = 'leech'                   then 0
         when d.due_at < now() - interval '3 days' then 1
         when d.status in ('new', 'learning')      then 2
         else 3 end,
    d.due_at asc;
end $$;

grant execute on function public.get_session_items(int) to authenticated;

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
         p.kind, a.prm, p.prompt_hint, p.difficulty,
         (select array_agg(o order by random())
          from unnest(
            array_append(
              -- الأصل والتصحيح الاتنين بيتشالوا من المشتّتات — الاتنين
              -- مقبولين في التصحيح، فوجود أي منهم كخيار = إجابتين صح
              array_remove(
                array_remove(
                  coalesce(
                    nullif(
                      public.smart_distractors(v_user, v_entry, p.kind, a.ans, 3),
                      '{}'::text[]
                    ),
                    p.distractors
                  ),
                  a.ans
                ),
                p.answer
              ),
              a.ans
            )
          ) o)
  from picked p
  cross join public.dictionary_entries de
  cross join lateral (
    select public.answer_for_user(v_user, v_entry, p.kind, p.answer) as ans,
           public.prompt_for_user(v_user, v_entry, p.kind, p.prompt) as prm
  ) a
  where de.id = v_entry
  order by p.difficulty, random();
end $$;

grant execute on function public.get_word_quiz(uuid, int) to authenticated;

-- ═══════════════════════════════════════════════════════════
-- عدّادات المكتبة
--
-- نفس الاستعلامين اللي في apply_activity، مستخرجين عشان أي مسار يغيّر
-- عدد الكلمات يقدر ينادي عليهم من غير ما يعيد كتابة apply_activity كلها.
-- معرّفة هنا قبل أول اللي بينده عليها، مش تحت في آخر الملف.
-- ═══════════════════════════════════════════════════════════
create or replace function public.refresh_word_counts(p_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.user_stats set
    total_words    = (select count(*) from public.user_words
                        where user_id = p_user and status <> 'archived'),
    mastered_words = (select count(*) from public.user_words
                        where user_id = p_user and status = 'mastered'),
    updated_at     = now()
  where user_id = p_user;
$$;

revoke execute on function public.refresh_word_counts(uuid) from public, anon;

-- ═══════════════════════════════════════════════════════════
-- 2. أرشفة كلمة
--
-- الحالة 'archived' كانت موجودة في الـ enum من أول يوم وكل استعلام
-- بيستثنيها — بس مفيش أي زرار في التطبيق بيوصلها. يعني الكلمة اللي
-- المستخدم مش عايزها دلوقتي بتفضل في طابوره للأبد، ومالوش غير الحذف
-- اللي بيمسح تقدّمه فيها. الأرشفة بتوقّفها من غير ما تضيّع الشغل.
-- ═══════════════════════════════════════════════════════════
-- الحالة اللي كانت قبل الأرشفة، عشان الرجوع يرجّعها بالظبط.
--
-- البديل كان إعادة اشتقاق الحالة من lapses/repetitions/interval — وده معناه
-- نسخة تانية من عتبات srs_next (٨ تعثّرات، ٦ مراجعات، ٦٠ يوم) تسكن هنا
-- وتسكت لو العتبات اتغيّرت هناك. الحفظ أبسط وأصدق: الكلمة بترجع leech لو
-- كانت leech، وmastered لو كانت mastered.
alter table public.user_words
  add column if not exists pre_archive_status public.word_status;

create or replace function public.set_word_archived(
  p_user_word_id uuid,
  p_archived     boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user   uuid := auth.uid();
  v_row    public.user_words%rowtype;
  v_status public.word_status;
begin
  if v_user is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  -- for update: نفس سبب submit_review. من غيره ضغطتين سريعتين على
  -- أرشفة/رجوع ممكن الاتنين يقروا نفس اللقطة، والتانية تكتب
  -- pre_archive_status من حالة الأولى دهستها خلاص.
  select * into v_row
  from public.user_words uw
  where uw.id = p_user_word_id and uw.user_id = v_user
  for update;

  if not found then
    raise exception 'word not found' using errcode = 'P0002';
  end if;

  if p_archived then
    v_status := 'archived';

    update public.user_words
       set status             = v_status,
           -- الحالة الحالية دايمًا، مش coalesce على قيمة قديمة: srs_next
           -- بقت بتحافظ على 'archived'، فحالة الصف موثوقة. الاستثناء
           -- الوحيد أرشفة كلمة مؤرشفة أصلًا — ساعتها نسيب المحفوظ.
           pre_archive_status = case
             when v_row.status = 'archived' then pre_archive_status
             else v_row.status
           end
     where id = p_user_word_id and user_id = v_user;
  else
    -- الجدولة نفسها مبتتلمسش: لو رجعت كلمة كانت لسه بدري، تفضل بدري.
    v_status := coalesce(
      v_row.pre_archive_status,
      -- صف اتأرشف قبل وجود العمود ده: أضعف افتراض آمن
      case when v_row.repetitions = 0 then 'new' else 'review' end
    );

    update public.user_words
       set status             = v_status,
           pre_archive_status = null
     where id = p_user_word_id and user_id = v_user;
  end if;

  -- total_words/mastered_words محفوظين في user_stats وبيتحسبوا جوّه
  -- apply_activity وبس — يعني مع المراجعة. من غير النداء ده، أرشفة ٢٠
  -- كلمة ما تحرّكش رقم البروفايل لحد ما المستخدم يعمل مراجعة بالصدفة،
  -- و«كلماتي» (اللي بتستثني المؤرشف) تقول رقم تاني خالص.
  perform public.refresh_word_counts(v_user);

  return jsonb_build_object('status', v_status, 'archived', p_archived);
end $$;

grant execute on function public.set_word_archived(uuid, boolean) to authenticated;

-- ── البحث يعامل ما يكتبه المستخدم كنص، لا كنمط ────────────
--
-- الاستعلامات كانت بتحقن p_search في LIKE مباشرةً، فمين يكتب % يطابق كل
-- حاجة ومين يكتب _ يطابق أي حرف. مش ثغرة حقن (البارامتر مربوط) لكنه بحث
-- بيكدب على اللي بيكتبه.
create or replace function public.like_escape(p_text text)
returns text
language sql
immutable
set search_path = ''
as $$
  select replace(replace(replace(coalesce(p_text, ''),
    '\', '\\'), '%', '\%'), '_', '\_');
$$;

grant execute on function public.like_escape(text) to authenticated;

-- ── والأرشيف قابل للتصفّح، وإلا بقى حفرة سوداء ────────────
create or replace function public.list_my_words(
  p_filter text default 'all',   -- all · learning · mastered · hard · favorite · archived
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
           -- تصحيح المستخدم بيسبق ترجمة القاموس في كل مكان بيتعرض فيه
           coalesce(
             nullif(btrim(uw.custom_translation), ''),
             de.senses -> 0 -> 'ar_translations' ->> 0,
             ''
           ) as ar_preview,
           uw.status, uw.repetitions, uw.lapses, uw.interval_days,
           uw.due_at, uw.is_favorite, uw.created_at
    from public.user_words uw
    join public.dictionary_entries de on de.id = uw.entry_id
    where uw.user_id = auth.uid()
      and case
            when p_filter = 'archived' then uw.status =  'archived'
            else                            uw.status <> 'archived'
          end
      and (
        p_filter in ('all', 'archived')
        or (p_filter = 'learning' and uw.status in ('new','learning','review'))
        or (p_filter = 'mastered' and uw.status = 'mastered')
        or (p_filter = 'hard'     and (uw.status = 'leech' or uw.lapses >= 3))
        or (p_filter = 'favorite' and uw.is_favorite)
      )
      and (
        p_search is null or trim(p_search) = ''
        or de.lemma_norm like public.like_escape(lower(trim(p_search))) || '%'
        or de.senses::text like '%' || public.like_escape(trim(p_search)) || '%'
        or coalesce(uw.custom_translation, '')
             like '%' || public.like_escape(trim(p_search)) || '%'
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

-- ═══════════════════════════════════════════════════════════
-- 3. رصيد الـ AI — يتشاف قبل ما يخلص
--
-- `bump_ai_usage` بترجع الرصيد، بس هي service_role فقط وبتترمي مع أول
-- توليد ناجح. يعني المستخدم كان بيكتشف السقف لما يصطدم بيه. دي نسخة
-- للقراءة فقط بيقدر العميل يناديها من غير ما تستهلك حاجة.
--
-- ملاحظة: p_limit لازم يفضل مطابق لـ AI_DAILY_LIMIT في الـ Edge Function.
-- الرقم ده للعرض بس — السيرفر لسه هو مصدر الحقيقة، والعميل بيتعامل مع
-- خطأ rate_limited عادي لو الاتنين اختلفوا.
-- ═══════════════════════════════════════════════════════════
-- إعدادات يكتبها السيرفر ويقراها السيرفر. مفيش أي صلاحية للعميل عليها:
-- get_ai_quota دالة security definer فبتقرا منها نيابةً عنه.
create table if not exists public.app_settings (
  key        text primary key,
  int_value  int,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;
revoke all on public.app_settings from public, anon, authenticated;

create or replace function public.get_ai_quota(p_limit int default 30)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'calls',     s.c,
    'limit',     s.lim,
    'remaining', greatest(0, s.lim - s.c)
  )
  from (
    select
      coalesce((
        select au.calls
        from public.ai_usage au
        where au.user_id = auth.uid()
          and au.day     = public.user_today(auth.uid())
      ), 0) as c,
      -- الحد اللي الـ Edge Function نفسها سجّلته آخر مرة ولّدت فيها لأي
      -- مستخدم. p_limit احتياطي لقاعدة لسه ما ولّدتش حاجة أبدًا.
      coalesce((
        select st.int_value
        from public.app_settings st
        where st.key = 'ai_daily_limit'
      ), p_limit) as lim
  ) s
  where auth.uid() is not null;
$$;

grant execute on function public.get_ai_quota(int) to authenticated;

-- ═══════════════════════════════════════════════════════════
-- 4. كلمة اليوم
--
-- التطبيق مالوش سبب يتفتح في يوم مفيهوش مراجعات مستحقّة — ودي بالظبط
-- الأيام اللي بيتسرّب فيها الناس. كلمة واحدة من مستواه، مش عنده، وثابتة
-- طول اليوم: نفس الكلمة لو فتح التطبيق خمس مرات.
--
-- md5(id || seed) بيدّي ترتيب ثابت لليوم من غير ما نخزّن اختيار في جدول
-- ولا نحسب COUNT الأول. الـ seed فيه اليوم بتوقيت المستخدم نفسه.
-- ═══════════════════════════════════════════════════════════
create or replace function public.get_word_of_day()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_ladder constant text[] := array['A1','A2','B1','B2','C1','C2'];
  v_user   uuid := auth.uid();
  v_level  text;
  v_pos    int;
  v_near   text[];
  v_seed   text;
  v_e      public.dictionary_entries%rowtype;
begin
  if v_user is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  select p.cefr_level into v_level from public.profiles p where p.id = v_user;
  v_seed := v_user::text || ':' || public.user_today(v_user)::text;

  -- الجيران المباشرين **من غير مستواه**: الاحتياطي مبيشتغلش غير لما
  -- استعلام المستوى نفسه يرجع فاضي، فإعادة فحصه شغل متأكدين إنه مالوش لازمة.
  v_pos := coalesce(array_position(v_ladder, v_level), 2);
  select array_agg(x) into v_near
  from unnest(
    v_ladder[greatest(1, v_pos - 1):least(array_length(v_ladder, 1), v_pos + 1)]
  ) x
  where x is distinct from v_level;

  -- من مستواه أولًا.
  --
  -- الترتيب بـ md5 عشوائي ثابت لليوم، بس مفيش فهرس يقدر يخدمه — فلو
  -- رتّبنا القاموس كله بيه، ده مسح وفرز كامل. والقاموس هو كاش الـ AI
  -- المشترك: بيكبر بكل كلمة أي مستخدم ولّدها، من غير سقف.
  --
  -- بناخد نافذة مرشّحين محدودة الأول عبر dict_level_idx
  -- (cefr_level, frequency_rank) where not is_flagged — وده كمان بيقدّم
  -- الكلمات الشائعة، وهي الأولى بالتعلّم — وبعدين نعشوئ جوّاها.
  with cand as (
    select de.id
    from public.dictionary_entries de
    where not de.is_flagged
      and de.cefr_level = v_level
      and jsonb_array_length(de.senses) > 0
      and not exists (
        select 1 from public.user_words uw
        where uw.user_id = v_user and uw.entry_id = de.id
      )
    order by de.frequency_rank nulls last
    limit 200
  )
  select de.* into v_e
  from cand
  join public.dictionary_entries de on de.id = cand.id
  order by md5(de.id::text || v_seed)
  limit 1;

  -- خلصت كلمات مستواه؟ المستويات المجاورة — مش «أي مستوى».
  -- شيل شرط cefr_level خالص وdict_level_idx ما بيخدمش الترتيب، فبيرجع
  -- الفرز الكامل للقاموس اللي بنهرب منه. والمستوى المجاور أنفع للمتعلّم
  -- من كلمة C2 عشوائية.
  if not found then
    with cand as (
      select de.id
      from public.dictionary_entries de
      where not de.is_flagged
        and de.cefr_level = any (v_near)
        and jsonb_array_length(de.senses) > 0
        and not exists (
          select 1 from public.user_words uw
          where uw.user_id = v_user and uw.entry_id = de.id
        )
      order by de.frequency_rank nulls last
      limit 200
    )
    select de.* into v_e
    from cand
    join public.dictionary_entries de on de.id = cand.id
    order by md5(de.id::text || v_seed)
    limit 1;
  end if;

  -- عنده القاموس كله — الكارت بيختفي بدل ما يعيد كلمة عنده
  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'entry_id',      v_e.id,
    'lemma',         v_e.lemma,
    'ipa',           v_e.ipa,
    'audio_url',     v_e.audio_url,
    'cefr_level',    v_e.cefr_level,
    'ar_preview',    coalesce(v_e.senses -> 0 -> 'ar_translations' ->> 0, ''),
    'en_definition', coalesce(v_e.senses -> 0 ->> 'en_definition', ''),
    'memory_tip_ar', v_e.memory_tip_ar
  );
end $$;

grant execute on function public.get_word_of_day() to authenticated;

-- ═══════════════════════════════════════════════════════════
-- 5. المشتّتات تحترم تصحيحات المستخدم كمان
--
-- smart_distractors بتسحب الترجمة العربية من القاموس مباشرةً، فالكلمة
-- اللي المستخدم صحّحها بتظهر بترجمتها القديمة لما تتستخدم كمشتّت — نفس
-- الكلمة بوجهين في شاشتين. وأسوأ: لو تصحيحه صادف الإجابة الصحيحة لسؤال
-- تاني، يبقى خياره صح ومتحسب غلط.
--
-- uw موجودة في الـ CTE خلاص، فالتصحيح على بُعد coalesce واحد.
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
  if p_kind not in ('mcq_en_ar', 'mcq_ar_en', 'listening', 'fill_blank') then
    return '{}'::text[];
  end if;

  select de.cefr_level into v_level
  from public.dictionary_entries de where de.id = p_entry;

  with pool as (
    select de.id,
           de.lemma,
           coalesce(
             nullif(btrim(uw.custom_translation), ''),
             de.senses -> 0 -> 'ar_translations' ->> 0,
             ''
           ) as ar,
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

  if v_out is null or array_length(v_out, 1) < p_want then
    return '{}'::text[];
  end if;

  return v_out;
end $$;

revoke execute on function public.smart_distractors(uuid, uuid, public.review_mode, text, int)
  from public, anon;

-- ═══════════════════════════════════════════════════════════
-- 6. الأرشفة تصمد أمام المراجعة
--
-- srs_next هي نقطة القرار الوحيدة لحالة الكلمة، فالحارس هنا بيغطّي كل
-- المسارات — امتحان الكلمة الواحدة، وإعادة مزامنة الأوفلاين، وأي نداء
-- جاي — بدل ما نحرس كل مدخل على حدة.
--
-- نسخة طبق الأصل من 0003 عدا الحارس في الآخر.
-- ═══════════════════════════════════════════════════════════
create or replace function public.srs_next(
  p_status  public.word_status,
  p_ease    real,
  p_interval real,
  p_reps    int,
  p_lapses  int,
  p_step    int,
  p_rating  smallint,
  p_now     timestamptz default now()
)
returns public.srs_result
language plpgsql
volatile
as $$
declare
  r         public.srs_result;
  v_fuzz    real;
  v_mult    real;
  v_steps   constant int[] := array[10, 1440];   -- دقائق: 10 دقايق ثم يوم
  v_leech   constant int   := 8;
begin
  r.ease_factor   := p_ease;
  r.interval_days := p_interval;
  r.repetitions   := p_reps;
  r.lapses        := p_lapses;
  r.learning_step := p_step;
  r.status        := p_status;

  v_fuzz := 0.95 + (random() * 0.10)::real;   -- يمنع تكدّس المراجعات في نفس اليوم

  -- ── مرحلة التعلّم ────────────────────────────────────────
  if p_status in ('new', 'learning') then
    if p_rating >= 2 then
      r.learning_step := p_step + 1;

      if r.learning_step >= array_length(v_steps, 1) then
        -- تخرّجت إلى المراجعة
        r.status        := 'review';
        r.interval_days := case when p_rating = 3 then 5.0 else 3.0 end;
        r.repetitions   := p_reps + 1;
        r.learning_step := 0;
        r.due_at        := p_now + (r.interval_days::text || ' days')::interval;
      else
        r.status := 'learning';
        r.due_at := p_now + (v_steps[r.learning_step + 1]::text || ' minutes')::interval;
      end if;
    else
      -- نسيها أو صعبة ⇒ ارجع لأول خطوة
      r.status        := 'learning';
      r.learning_step := 0;
      r.due_at        := p_now + (v_steps[1]::text || ' minutes')::interval;
    end if;

  -- ── مرحلة المراجعة ──────────────────────────────────────
  else
    if p_rating = 0 then
      -- نسيها: لا نصفّر الفترة تمامًا (ده محبط) بل نقلّصها
      r.lapses        := p_lapses + 1;
      r.ease_factor   := greatest(1.3::real, p_ease - 0.20::real);
      r.interval_days := greatest(1.0::real, p_interval * 0.4::real);
      r.status        := case when r.lapses >= v_leech then 'leech'::public.word_status
                              else 'learning'::public.word_status end;
      r.learning_step := 0;
      r.due_at        := p_now + (v_steps[1]::text || ' minutes')::interval;
    else
      r.repetitions := p_reps + 1;

      -- تعديل معامل السهولة: صعبة −0.14 · تمام 0 · سهلة +0.10
      r.ease_factor := least(3.0::real, greatest(1.3::real,
        p_ease + (0.1 - (3 - p_rating) * (0.08 + (3 - p_rating) * 0.02))::real));

      v_mult := case p_rating
                  when 1 then 1.2::real
                  when 2 then r.ease_factor
                  else        r.ease_factor * 1.3::real
                end;

      r.interval_days := least(365.0::real,
                           greatest(1.0::real,
                             greatest(p_interval, 1.0::real) * v_mult * v_fuzz));
      r.status := 'review';
      r.due_at := p_now + (r.interval_days::text || ' days')::interval;
    end if;
  end if;

  -- ── الإتقان ─────────────────────────────────────────────
  if r.status = 'review' and r.interval_days >= 60 and r.repetitions >= 6 then
    r.status := 'mastered';
  end if;

  -- ── الكلمة المؤرشفة موقوفة ───────────────────────────────
  -- المراجعة ممكن توصلها من غير ما المستخدم يقصد: إعادة مزامنة أوفلاين
  -- لمراجعة اتسجّلت قبل الأرشفة، أو شاشة قديمة لسه فاتحة. من غير السطر ده
  -- كانت بتعدّي على فرع «المراجعة» وترجع 'review' — فالكلمة اللي المستخدم
  -- أوقفها ترجع طابوره لوحدها. الجدولة تتقدّم عادي، الحالة هي اللي بتثبت.
  if p_status = 'archived' then
    r.status := 'archived';
  end if;

  return r;
end $$;

-- ═══════════════════════════════════════════════════════════
-- 8. حد الـ AI اليومي يتقال مرة واحدة
--
-- الحد الحقيقي عايش في AI_DAILY_LIMIT جوّه الـ Edge Function، وget_ai_quota
-- كانت بتخمّنه بـ default = 30. لو الاتنين اختلفوا، الرقم اللي المستخدم
-- بيشوفه بيكدب — وهي دي بالظبط الحاجة اللي الميزة اتعملت عشانها.
--
-- bump_ai_usage بتاخد الحد من الـ Edge Function خلاص، فبتسجّله. والقراءة
-- بتاخد آخر حد معروف بدل ما تخمّن.
-- ═══════════════════════════════════════════════════════════
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

  -- الحد الفعلي عايش في AI_DAILY_LIMIT جوّه الـ Edge Function، وهي بتمرّره
  -- هنا. بنسجّله في مكان واحد عام — مش عمود لكل يوم لكل مستخدم — عشان
  -- get_ai_quota تقرا الحد الحالي، مش حد اتسجّل في يوم فات.
  -- الشرط مهم: من غيره كل توليد لأي مستخدم بياخد قفل على نفس الصف الواحد
  -- ده عشان يكتب فيه رقم مش اتغيّر، ويسيب صف ميت للـ autovacuum.
  insert into public.app_settings as st (key, int_value)
  values ('ai_daily_limit', p_limit)
  on conflict (key) do update
    set int_value = excluded.int_value, updated_at = now()
    where st.int_value is distinct from excluded.int_value;

  return jsonb_build_object(
    'calls',     v_calls,
    'limit',     p_limit,
    'remaining', greatest(0, p_limit - v_calls),
    'allowed',   v_calls <= p_limit
  );
end $$;

revoke execute on function public.bump_ai_usage(uuid, int)
  from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════
-- 9. شارات المستوى اتقفلت
--
-- level_5 و level_10 بيكافئوا على «المستوى»، والمستوى اتشال من كل شاشة
-- في التطبيق. فبقى فيه شريط تقدّم بيملا ناحية رقم المستخدم مش شايفه في
-- أي مكان، ولحظة الشارة ممكن تقوله «وصلت للمستوى ٥» عن حاجة مالهاش وجود.
--
-- بنقفلهم بدل ما نمسحهم: الصفوف اللي اتكسبت بتفضل في user_achievements،
-- فلو المستوى رجع للواجهة يومًا الشارات ترجع معاه.
-- ═══════════════════════════════════════════════════════════
alter table public.achievements
  add column if not exists is_active boolean not null default true;

update public.achievements
   set is_active = false
 where code in ('level_5', 'level_10');

-- ═══════════════════════════════════════════════════════════
-- 10. الشارات المتقاعدة تبطّل تتمنح
--
-- نسخة طبق الأصل من 0003 عدا الانضمام لـ achievements.is_active.
-- ═══════════════════════════════════════════════════════════
create or replace function public.check_achievements(p_user uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_st  public.user_stats%rowtype;
  v_new text[] := '{}';
begin
  select * into v_st from public.user_stats where user_id = p_user;
  if not found then return v_new; end if;

  with cand(code, ok) as (
    values
      ('first_word'::text,  v_st.total_words    >= 1),
      ('words_10',          v_st.total_words    >= 10),
      ('words_50',          v_st.total_words    >= 50),
      ('words_100',         v_st.total_words    >= 100),
      ('words_500',         v_st.total_words    >= 500),
      ('mastered_10',       v_st.mastered_words >= 10),
      ('mastered_50',       v_st.mastered_words >= 50),
      ('streak_3',          v_st.current_streak >= 3),
      ('streak_7',          v_st.current_streak >= 7),
      ('streak_30',         v_st.current_streak >= 30),
      ('streak_100',        v_st.current_streak >= 100),
      ('level_5',           v_st.level          >= 5),
      ('level_10',          v_st.level          >= 10)
  ),
  ins as (
    insert into public.user_achievements (user_id, code)
    -- الانضمام للكتالوج بيقفل الشارات المتقاعدة عند الكتابة، مش عند
    -- العرض بس: من غيره level_5/level_10 يفضلوا يتمنحوا ويدّوا XP لشارة
    -- مفيش شاشة بتعرضها، وnew_badges ترجّع كود التطبيق هيرميه.
    -- شرط مبني على الداتا، فمفيش قايمة أكواد تتصان هنا.
    select p_user, c.code
    from cand c
    join public.achievements a on a.code = c.code and a.is_active
    where c.ok
    on conflict (user_id, code) do nothing
    returning code
  )
  select coalesce(array_agg(code), '{}') into v_new from ins;

  if array_length(v_new, 1) > 0 then
    update public.user_stats
      set total_xp = total_xp + coalesce(
            (select sum(a.xp_reward) from public.achievements a
              where a.code = any(v_new)), 0)
      where user_id = p_user;
    update public.user_stats
      set level = floor(sqrt(total_xp / 100.0))::int + 1
      where user_id = p_user;
  end if;

  return v_new;
end $$;

-- ═══════════════════════════════════════════════════════════
-- 11. عدد الكلمات يفضل صح مهما كان المسار
--
-- الأرشفة بتنادي refresh_word_counts صراحةً، لكن add_word وحذف الكلمة
-- من العميل ما كانوش بيلمسوا user_stats خالص — فنفس البيانات القديمة
-- اللي ظهرت مع الأرشفة كانت بتظهر مع الإضافة والحذف كمان.
--
-- تريجر على الإدخال والحذف بيغطّي التلاتة على عمق واحد بدل ما نرقّع كل
-- مسار لوحده. على مستوى الجملة مش الصف: إضافة حزمة بتدخل ٢٤ كلمة مرة
-- واحدة، وده بيخلّيها حساب واحد بدل ٢٤.
--
-- التحديث (تغيير الحالة) مش داخل هنا عن قصد: submit_review بتغيّر الحالة
-- في كل مراجعة، وapply_activity بتحسب العدّادات بعدها خلاص.
-- ═══════════════════════════════════════════════════════════
create or replace function public.user_words_count_touch()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  if tg_op = 'INSERT' then
    for r in select distinct user_id from new_rows loop
      perform public.refresh_word_counts(r.user_id);
    end loop;
  else
    for r in select distinct user_id from old_rows loop
      perform public.refresh_word_counts(r.user_id);
    end loop;
  end if;
  return null;
end $$;

drop trigger if exists user_words_counts_ins on public.user_words;
create trigger user_words_counts_ins
  after insert on public.user_words
  referencing new table as new_rows
  for each statement execute function public.user_words_count_touch();

drop trigger if exists user_words_counts_del on public.user_words;
create trigger user_words_counts_del
  after delete on public.user_words
  referencing old table as old_rows
  for each statement execute function public.user_words_count_touch();

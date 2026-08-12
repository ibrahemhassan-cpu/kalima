-- ═══════════════════════════════════════════════════════════
-- Kalima — 0003_functions.sql
-- خوارزمية SM-2 ودوال الـ RPC
-- كل منطق التعلّم هنا في قاعدة البيانات — لا في التطبيق.
-- ═══════════════════════════════════════════════════════════

-- ── إنشاء البروفايل تلقائيًا عند التسجيل ───────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(coalesce(new.email, 'متعلّم'), '@', 1)
    )
  )
  on conflict (id) do nothing;

  insert into public.user_stats (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── تاريخ "اليوم" بتوقيت المستخدم ──────────────────────────
create or replace function public.user_today(p_user uuid)
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select (now() at time zone coalesce(
           (select p.timezone from public.profiles p where p.id = p_user),
           'UTC'))::date;
$$;

-- ═══════════════════════════════════════════════════════════
-- خوارزمية SM-2 المعدّلة
-- ═══════════════════════════════════════════════════════════
do $$ begin
  create type public.srs_result as (
    status        public.word_status,
    ease_factor   real,
    interval_days real,
    repetitions   int,
    lapses        int,
    learning_step int,
    due_at        timestamptz
  );
exception when duplicate_object then null; end $$;

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

  return r;
end $$;

-- ═══════════════════════════════════════════════════════════
-- تحديث النشاط اليومي والستريك والـ XP
-- ═══════════════════════════════════════════════════════════
create or replace function public.apply_activity(
  p_user    uuid,
  p_reviews int,
  p_words   int,
  p_xp      int
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today     date;
  v_goal      int;
  v_act       public.daily_activity%rowtype;
  v_st        public.user_stats%rowtype;
  v_bonus     int := 0;
  v_streak_up boolean := false;
begin
  select coalesce(p.daily_goal, 10) into v_goal
    from public.profiles p where p.id = p_user;
  v_goal  := coalesce(v_goal, 10);
  v_today := public.user_today(p_user);

  insert into public.daily_activity as da
         (user_id, activity_date, reviews_count, words_added, xp)
  values (p_user, v_today, p_reviews, p_words, p_xp)
  on conflict (user_id, activity_date) do update
    set reviews_count = da.reviews_count + excluded.reviews_count,
        words_added   = da.words_added   + excluded.words_added,
        xp            = da.xp            + excluded.xp
  returning * into v_act;

  -- تحقّق الهدف اليومي لأول مرة النهاردة؟
  if not v_act.goal_met and v_act.reviews_count >= v_goal then
    update public.daily_activity set goal_met = true
      where user_id = p_user and activity_date = v_today;
    v_bonus     := 25;
    v_streak_up := true;
  end if;

  select * into v_st from public.user_stats where user_id = p_user for update;
  if not found then
    insert into public.user_stats (user_id) values (p_user)
      on conflict (user_id) do nothing;
    select * into v_st from public.user_stats where user_id = p_user for update;
  end if;

  -- تجديد الدروع أول كل شهر
  if v_st.freezes_reset_on is null or v_st.freezes_reset_on <= v_today then
    v_st.streak_freezes   := 2;
    v_st.freezes_reset_on := (date_trunc('month', v_today::timestamp)
                              + interval '1 month')::date;
  end if;

  if v_streak_up then
    if v_st.last_goal_date = v_today then
      null;                                            -- اتحسب خلاص
    elsif v_st.last_goal_date = v_today - 1 then
      v_st.current_streak := v_st.current_streak + 1;  -- استمرار طبيعي
    elsif v_st.last_goal_date = v_today - 2 and v_st.streak_freezes > 0 then
      v_st.streak_freezes := v_st.streak_freezes - 1;  -- درع أنقذ يوم غياب
      v_st.current_streak := v_st.current_streak + 1;
    else
      v_st.current_streak := 1;                        -- بداية جديدة
    end if;
    v_st.last_goal_date := v_today;
    v_st.longest_streak := greatest(v_st.longest_streak, v_st.current_streak);
  end if;

  v_st.total_xp := v_st.total_xp + p_xp + v_bonus;
  v_st.level    := floor(sqrt(v_st.total_xp / 100.0))::int + 1;

  update public.user_stats set
    total_xp         = v_st.total_xp,
    level            = v_st.level,
    current_streak   = v_st.current_streak,
    longest_streak   = v_st.longest_streak,
    last_goal_date   = v_st.last_goal_date,
    streak_freezes   = v_st.streak_freezes,
    freezes_reset_on = v_st.freezes_reset_on,
    total_words      = (select count(*) from public.user_words
                          where user_id = p_user and status <> 'archived'),
    mastered_words   = (select count(*) from public.user_words
                          where user_id = p_user and status = 'mastered'),
    updated_at       = now()
  where user_id = p_user;

  return jsonb_build_object(
    'xp_gained',      p_xp + v_bonus,
    'goal_bonus',     v_bonus,
    'total_xp',       v_st.total_xp,
    'level',          v_st.level,
    'current_streak', v_st.current_streak,
    'today_reviews',  v_act.reviews_count,
    'daily_goal',     v_goal,
    'goal_met',       v_act.reviews_count >= v_goal
  );
end $$;

-- ═══════════════════════════════════════════════════════════
-- الإنجازات
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
    select p_user, c.code from cand c where c.ok
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
-- RPC: تسجيل مراجعة
-- ═══════════════════════════════════════════════════════════
create or replace function public.submit_review(
  p_user_word_id uuid,
  p_rating       smallint,
  p_mode         public.review_mode default 'flashcard',
  p_ms_taken     int     default null,
  p_is_correct   boolean default null,
  p_client_id    text    default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user        uuid := auth.uid();
  v_uw          public.user_words%rowtype;
  v_res         public.srs_result;
  v_xp          int;
  v_mastered    boolean;
  v_activity    jsonb;
  v_new_badges  text[];
begin
  if v_user is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;
  if p_rating is null or p_rating < 0 or p_rating > 3 then
    raise exception 'rating must be 0..3' using errcode = '22023';
  end if;

  select * into v_uw from public.user_words
    where id = p_user_word_id and user_id = v_user
    for update;
  if not found then
    raise exception 'word not found' using errcode = 'P0002';
  end if;

  -- منع الازدواج عند مزامنة الأوفلاين
  if p_client_id is not null and exists (
       select 1 from public.reviews
        where user_id = v_user and client_id = p_client_id) then
    return jsonb_build_object('duplicate', true);
  end if;

  v_res := public.srs_next(v_uw.status, v_uw.ease_factor, v_uw.interval_days,
                           v_uw.repetitions, v_uw.lapses, v_uw.learning_step,
                           p_rating);

  v_mastered := (v_res.status = 'mastered' and v_uw.status <> 'mastered');

  update public.user_words set
    status        = v_res.status,
    ease_factor   = v_res.ease_factor,
    interval_days = v_res.interval_days,
    repetitions   = v_res.repetitions,
    lapses        = v_res.lapses,
    learning_step = v_res.learning_step,
    due_at        = v_res.due_at,
    last_review_at = now(),
    mastered_at   = case when v_mastered then now() else mastered_at end
  where id = v_uw.id;

  insert into public.reviews (user_id, user_word_id, rating, mode, is_correct,
                              ms_taken, prev_interval, new_interval, client_id)
  values (v_user, v_uw.id, p_rating, p_mode,
          coalesce(p_is_correct, p_rating >= 2), p_ms_taken,
          v_uw.interval_days, v_res.interval_days, p_client_id);

  v_xp := case when p_rating = 0 then 2
               when p_rating = 3 then 15
               else 10 end;
  if v_mastered then v_xp := v_xp + 50; end if;

  v_activity   := public.apply_activity(v_user, 1, 0, v_xp);
  v_new_badges := public.check_achievements(v_user);

  return v_activity || jsonb_build_object(
    'status',        v_res.status,
    'due_at',        v_res.due_at,
    'interval_days', round(v_res.interval_days::numeric, 2),
    'mastered_now',  v_mastered,
    'new_badges',    to_jsonb(v_new_badges)
  );
end $$;

-- ═══════════════════════════════════════════════════════════
-- RPC: مزامنة مراجعات الأوفلاين دفعة واحدة
-- ═══════════════════════════════════════════════════════════
create or replace function public.sync_reviews(p_batch jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item    jsonb;
  v_applied int := 0;
  v_skipped int := 0;
  v_last    jsonb := '{}'::jsonb;
begin
  if jsonb_typeof(p_batch) <> 'array' then
    raise exception 'batch must be a json array' using errcode = '22023';
  end if;

  for v_item in select * from jsonb_array_elements(p_batch) loop
    begin
      v_last := public.submit_review(
        (v_item ->> 'user_word_id')::uuid,
        (v_item ->> 'rating')::smallint,
        coalesce((v_item ->> 'mode')::public.review_mode, 'flashcard'),
        (v_item ->> 'ms_taken')::int,
        (v_item ->> 'is_correct')::boolean,
        v_item ->> 'client_id'
      );
      if coalesce((v_last ->> 'duplicate')::boolean, false)
        then v_skipped := v_skipped + 1;
        else v_applied := v_applied + 1;
      end if;
    exception when others then
      v_skipped := v_skipped + 1;
    end;
  end loop;

  return jsonb_build_object('applied', v_applied, 'skipped', v_skipped,
                            'stats', v_last);
end $$;

-- ═══════════════════════════════════════════════════════════
-- RPC: إضافة كلمة لمكتبة المستخدم
-- ═══════════════════════════════════════════════════════════
create or replace function public.add_word(
  p_entry_id uuid,
  p_note     text default null,
  p_source   text default 'manual'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_id   uuid;
  v_new  boolean := true;
begin
  if v_user is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  select id into v_id from public.user_words
    where user_id = v_user and entry_id = p_entry_id;

  if found then
    v_new := false;
  else
    insert into public.user_words (user_id, entry_id, personal_note, source, due_at)
    values (v_user, p_entry_id, p_note, p_source, now())
    returning id into v_id;

    perform public.apply_activity(v_user, 0, 1, 5);
    perform public.check_achievements(v_user);
  end if;

  return jsonb_build_object('user_word_id', v_id, 'created', v_new);
end $$;

-- ═══════════════════════════════════════════════════════════
-- قراءة: الكلمات المستحقة
-- ═══════════════════════════════════════════════════════════
create or replace function public.get_due_words(p_limit int default 40)
returns table (
  user_word_id  uuid,
  entry_id      uuid,
  lemma         text,
  ipa           text,
  audio_url     text,
  cefr_level    text,
  senses        jsonb,
  examples      jsonb,
  synonyms      text[],
  antonyms      text[],
  memory_tip_ar text,
  status        public.word_status,
  repetitions   int,
  interval_days real,
  ease_factor   real,
  due_at        timestamptz,
  personal_note text,
  is_favorite   boolean
)
language sql
stable
set search_path = ''
as $$
  select uw.id, de.id, de.lemma, de.ipa, de.audio_url, de.cefr_level,
         de.senses, de.examples, de.synonyms, de.antonyms, de.memory_tip_ar,
         uw.status, uw.repetitions, uw.interval_days, uw.ease_factor,
         uw.due_at, uw.personal_note, uw.is_favorite
  from public.user_words uw
  join public.dictionary_entries de on de.id = uw.entry_id
  where uw.user_id = auth.uid()
    and uw.status <> 'archived'
    and uw.due_at <= now()
  order by
    case when uw.status = 'leech'                          then 0
         when uw.due_at < now() - interval '3 days'        then 1
         when uw.status in ('new', 'learning')             then 2
         else 3 end,
    uw.due_at asc
  limit least(greatest(coalesce(p_limit, 40), 1), 100);
$$;

-- ═══════════════════════════════════════════════════════════
-- قراءة: ملخّص الشاشة الرئيسية في نداء واحد
-- ═══════════════════════════════════════════════════════════
create or replace function public.get_home_summary()
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_user  uuid := auth.uid();
  v_today date;
  v_goal  int;
  v_st    public.user_stats%rowtype;
  v_done  int;
  v_due   int;
  v_next  timestamptz;
begin
  if v_user is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  v_today := public.user_today(v_user);

  select coalesce(p.daily_goal, 10) into v_goal
    from public.profiles p where p.id = v_user;
  v_goal := coalesce(v_goal, 10);

  select * into v_st from public.user_stats where user_id = v_user;

  select coalesce(da.reviews_count, 0) into v_done
    from public.daily_activity da
    where da.user_id = v_user and da.activity_date = v_today;
  v_done := coalesce(v_done, 0);

  select count(*) into v_due from public.user_words
    where user_id = v_user and status <> 'archived' and due_at <= now();

  select min(due_at) into v_next from public.user_words
    where user_id = v_user and status <> 'archived' and due_at > now();

  return jsonb_build_object(
    'due_count',       v_due,
    'next_due_at',     v_next,
    'today_reviews',   v_done,
    'daily_goal',      v_goal,
    'goal_met',        v_done >= v_goal,
    'total_words',     coalesce(v_st.total_words, 0),
    'mastered_words',  coalesce(v_st.mastered_words, 0),
    'total_xp',        coalesce(v_st.total_xp, 0),
    'level',           coalesce(v_st.level, 1),
    'xp_this_level',   coalesce(v_st.total_xp, 0)
                         - (power(coalesce(v_st.level, 1) - 1, 2) * 100)::int,
    'xp_to_next',      (power(coalesce(v_st.level, 1), 2) * 100)::int
                         - coalesce(v_st.total_xp, 0),
    'current_streak',  coalesce(v_st.current_streak, 0),
    'longest_streak',  coalesce(v_st.longest_streak, 0),
    'streak_freezes',  coalesce(v_st.streak_freezes, 0)
  );
end $$;

-- ═══════════════════════════════════════════════════════════
-- الصلاحيات على الدوال
-- ═══════════════════════════════════════════════════════════
revoke execute on function public.apply_activity(uuid, int, int, int)   from public, anon;
revoke execute on function public.check_achievements(uuid)              from public, anon;
revoke execute on function public.srs_next(public.word_status, real, real, int, int, int, smallint, timestamptz) from public, anon;
revoke execute on function public.user_today(uuid)                      from public, anon;
revoke execute on function public.handle_new_user()                     from public, anon;

grant execute on function public.submit_review(uuid, smallint, public.review_mode, int, boolean, text) to authenticated;
grant execute on function public.sync_reviews(jsonb)                    to authenticated;
grant execute on function public.add_word(uuid, text, text)             to authenticated;
grant execute on function public.get_due_words(int)                     to authenticated;
grant execute on function public.get_home_summary()                     to authenticated;
grant execute on function public.user_today(uuid)                       to authenticated;

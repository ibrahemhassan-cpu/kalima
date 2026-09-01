-- ═══════════════════════════════════════════════════════════
-- Kalima — 0007_packs.sql
-- حزم المواضيع لتبويب «استكشاف»
--
-- الحزمة قائمة كلمات مُنسّقة يدويًّا (سفر · شغل · صحة · تكنولوجيا …).
-- بتتخزّن كـ lemma نصّي مش entry_id، عشان الحزمة تفضل صالحة حتى لو
-- الكلمة لسه ما اتولّدتش في القاموس المشترك. الوصل بيتم وقت القراءة
-- على dictionary_entries.lemma_norm.
-- ═══════════════════════════════════════════════════════════

create table if not exists public.topic_packs (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title_ar    text not null,
  title_en    text not null,
  subtitle_ar text not null default '',
  subtitle_en text not null default '',
  -- اسم أيقونة من Ionicons
  icon        text not null default 'albums',
  -- مفتاح لون من الثيم، مش قيمة hex — القاعدة #4: ممنوع أي لون خارج theme/colors.ts
  accent      text not null default 'brand'
                check (accent in ('brand','accent','success','danger','warning')),
  cefr_level  text check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  sort_order  int not null default 100,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.pack_words (
  pack_id    uuid not null references public.topic_packs(id) on delete cascade,
  -- بصيغتها المُطبّعة (حروف صغيرة) عشان توصل بـ dictionary_entries.lemma_norm
  lemma      text not null,
  sort_order int not null default 0,
  primary key (pack_id, lemma)
);

create index if not exists pack_words_lemma_idx on public.pack_words (lemma);

alter table public.topic_packs enable row level security;
alter table public.pack_words  enable row level security;

grant select on public.topic_packs to authenticated;
grant select on public.pack_words  to authenticated;

drop policy if exists packs_select on public.topic_packs;
create policy packs_select on public.topic_packs
  for select to authenticated using (is_active);

drop policy if exists pack_words_select on public.pack_words;
create policy pack_words_select on public.pack_words
  for select to authenticated using (true);
-- لا سياسة كتابة: محتوى الحزم يُدار بالميجريشن وحدها

-- مصدر جديد للكلمة: أُضيفت من حزمة
alter table public.user_words drop constraint if exists user_words_source_check;
alter table public.user_words add constraint user_words_source_check
  check (source in ('manual','word_of_day','suggested','import','pack'));

-- ═══════════════════════════════════════════════════════════
-- قراءة: كل الحزم مع تقدّم المستخدم فيها
--
--   word_count  كم كلمة في الحزمة
--   ready_count كم واحدة منها جاهزة في القاموس (الباقي يحتاج توليد)
--   owned_count كم واحدة في مكتبة المستخدم بالفعل
-- ═══════════════════════════════════════════════════════════
-- 0009 بيضيف level_gap لشكل الإرجاع، وPostgres ما بيسمحش بتغيير شكل
-- الإرجاع بـ create or replace. لو الميجريشن دي اتعادت على قاعدة فيها
-- نسخة 0009 خلاص — مثلًا اتشغّلت يدويًّا في SQL Editor قبل ما تتسجّل في
-- تاريخ الميجريشن — الاستبدال بيفشل بـ 42P13. الإسقاط الأول بيخلّي
-- إعادة التشغيل تنجح في الحالتين: قاعدة فاضية وقاعدة متقدّمة.
drop function if exists public.list_topic_packs();

create or replace function public.list_topic_packs()
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
  owned_count int
)
language sql
stable
set search_path = ''
as $$
  select p.id, p.slug, p.title_ar, p.title_en, p.subtitle_ar, p.subtitle_en,
         p.icon, p.accent, p.cefr_level,
         count(pw.lemma)::int,
         count(de.id)::int,
         count(uw.id)::int
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
  order by p.sort_order, p.slug;
$$;

grant execute on function public.list_topic_packs() to authenticated;

-- ═══════════════════════════════════════════════════════════
-- قراءة: كلمات حزمة واحدة
--
-- الكلمة اللي لسه مش في القاموس بترجع بـ entry_id = null — الواجهة
-- بتفتحها بالشيت وقتها فتتولّد عند الطلب.
-- ═══════════════════════════════════════════════════════════
create or replace function public.get_pack_words(p_pack_id uuid)
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
  select pw.lemma,
         de.id,
         coalesce(de.senses -> 0 -> 'ar_translations' ->> 0, ''),
         de.cefr_level,
         exists (select 1 from public.user_words uw
                  where uw.user_id = auth.uid()
                    and uw.entry_id = de.id
                    and uw.status <> 'archived')
  from public.pack_words pw
  left join public.dictionary_entries de
    on de.lemma_norm = pw.lemma and not de.is_flagged
  where pw.pack_id = p_pack_id
  order by pw.sort_order, pw.lemma;
$$;

grant execute on function public.get_pack_words(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════
-- كتابة: أضِف كل كلمات الحزمة الجاهزة دفعة واحدة
--
-- بتضيف اللي في القاموس بس — مفيش أي نداء AI هنا، فالعملية فورية
-- ومجانية. الكلمات الناقصة بترجع في العدّاد عشان الواجهة تقول للمستخدم
-- إنها هتتولّد لما يفتحها واحدة واحدة.
-- ═══════════════════════════════════════════════════════════
create or replace function public.add_pack_words(p_pack_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user    uuid := auth.uid();
  v_added   int  := 0;
  v_missing int  := 0;
begin
  if v_user is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  if not exists (select 1 from public.topic_packs
                  where id = p_pack_id and is_active) then
    raise exception 'pack not found' using errcode = 'P0002';
  end if;

  with ready as (
    select de.id as entry_id
    from public.pack_words pw
    join public.dictionary_entries de
      on de.lemma_norm = pw.lemma and not de.is_flagged
    where pw.pack_id = p_pack_id
  ),
  ins as (
    insert into public.user_words (user_id, entry_id, source, due_at)
    select v_user, r.entry_id, 'pack', now()
    from ready r
    on conflict (user_id, entry_id) do nothing
    returning 1
  )
  select count(*)::int into v_added from ins;

  select count(*)::int into v_missing
  from public.pack_words pw
  left join public.dictionary_entries de
    on de.lemma_norm = pw.lemma and not de.is_flagged
  where pw.pack_id = p_pack_id and de.id is null;

  if v_added > 0 then
    -- نفس محاسبة add_word: 5 نقاط للكلمة
    perform public.apply_activity(v_user, 0, v_added, 5 * v_added);
    perform public.check_achievements(v_user);
  end if;

  return jsonb_build_object('added', v_added, 'missing', v_missing);
end $$;

grant execute on function public.add_pack_words(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════
-- محتوى الحزم
-- ═══════════════════════════════════════════════════════════
insert into public.topic_packs
  (slug, title_ar, title_en, subtitle_ar, subtitle_en, icon, accent, cefr_level, sort_order)
values
  ('travel',   'السفر',            'Travel',
   'المطار والفندق وكل ما في الطريق', 'Airports, hotels and everything on the way',
   'airplane', 'brand',   'A2', 10),

  ('work',     'العمل',            'Work',
   'الاجتماعات والعقود وزملاء المكتب', 'Meetings, contracts and the people you work with',
   'briefcase', 'accent', 'B1', 20),

  ('health',   'الصحة والطب',      'Health',
   'العيادة والصيدلية وما بينهما',     'The clinic, the pharmacy and everything between',
   'medkit', 'danger',    'B1', 30),

  ('tech',     'التكنولوجيا',      'Technology',
   'كلمات لا غنى عنها أمام أي شاشة',   'The words you meet in front of any screen',
   'hardware-chip', 'success', 'B1', 40),

  ('daily',    'الحياة اليومية',   'Daily life',
   'البيت والسوق والطريق للشغل',       'Home, the market and the way to work',
   'home', 'warning',     'A2', 50),

  ('study',    'الدراسة',          'Study',
   'المحاضرات والامتحانات والأبحاث',   'Lectures, exams and research',
   'school', 'brand',     'B2', 60)
on conflict (slug) do update set
  title_ar    = excluded.title_ar,
  title_en    = excluded.title_en,
  subtitle_ar = excluded.subtitle_ar,
  subtitle_en = excluded.subtitle_en,
  icon        = excluded.icon,
  accent      = excluded.accent,
  cefr_level  = excluded.cefr_level,
  sort_order  = excluded.sort_order,
  is_active   = true;

with data(slug, words) as (
  values
    ('travel', array[
      'airport','passport','luggage','boarding','departure','arrival',
      'customs','itinerary','reservation','currency','souvenir','sightseeing',
      'delay','terminal','aisle','journey','destination','accommodation',
      'landmark','ferry','voyage','backpack','visa','guidebook']),

    ('work', array[
      'meeting','deadline','colleague','salary','promotion','resume',
      'interview','invoice','client','manager','teamwork','contract',
      'negotiate','presentation','budget','feedback','workload','overtime',
      'freelance','recruit','resign','agenda','supervisor','internship']),

    ('health', array[
      'symptom','diagnosis','prescription','pharmacy','treatment','surgery',
      'appointment','allergy','infection','vaccine','injury','recovery',
      'nurse','clinic','fever','painkiller','bandage','dose',
      'wound','therapy','chronic','checkup','ambulance','swelling']),

    ('tech', array[
      'software','hardware','download','upload','browser','password',
      'database','network','algorithm','encryption','backup','firewall',
      'bandwidth','server','device','update','storage','wireless',
      'interface','debug','dashboard','plugin','glitch','subscription']),

    ('daily', array[
      'grocery','laundry','neighbor','rent','chore','errand',
      'commute','breakfast','garbage','sidewalk','receipt','wallet',
      'umbrella','alarm','blanket','faucet','drawer','shelf',
      'towel','pillow','cupboard','hallway','kettle','broom']),

    ('study', array[
      'assignment','lecture','semester','scholarship','thesis','curriculum',
      'tuition','research','exam','degree','essay','syllabus',
      'tutor','campus','seminar','plagiarism','citation','transcript',
      'enrollment','dormitory','faculty','midterm','textbook','revision'])
)
insert into public.pack_words (pack_id, lemma, sort_order)
select p.id, w.lemma, w.ord::int
from data d
join public.topic_packs p on p.slug = d.slug
cross join lateral unnest(d.words) with ordinality as w(lemma, ord)
on conflict (pack_id, lemma) do update set sort_order = excluded.sort_order;

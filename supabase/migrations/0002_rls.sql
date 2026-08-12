-- ═══════════════════════════════════════════════════════════
-- Kalima — 0002_rls.sql
-- تفعيل Row Level Security والصلاحيات
-- كل جدول مقفول افتراضيًا. ما يمر إلا ما سُمح به صراحةً.
-- ═══════════════════════════════════════════════════════════

-- ── 1. تفعيل RLS على كل جدول (كل واحد ببيانه) ──────────────
alter table public.profiles           enable row level security;
alter table public.dictionary_entries enable row level security;
alter table public.user_words         enable row level security;
alter table public.reviews            enable row level security;
alter table public.study_sessions     enable row level security;
alter table public.daily_activity     enable row level security;
alter table public.user_stats         enable row level security;
alter table public.achievements       enable row level security;
alter table public.user_achievements  enable row level security;
alter table public.ai_usage           enable row level security;
alter table public.word_reports       enable row level security;
alter table public.deletion_requests  enable row level security;

-- ── 2. الصلاحيات الأساسية ──────────────────────────────────
grant usage on schema public to anon, authenticated;

-- anon (غير مسجّل) لا يلمس أي جدول إطلاقًا
revoke all on all tables in schema public from anon;

-- المستخدم المسجّل: صلاحيات على مستوى الجدول، والـ RLS يفلتر الصفوف
grant select, insert, update, delete on public.user_words        to authenticated;
grant select, insert                 on public.reviews           to authenticated;
grant select, insert, update         on public.study_sessions    to authenticated;
grant select, update                 on public.profiles          to authenticated;
grant select                         on public.dictionary_entries to authenticated;
grant select                         on public.daily_activity    to authenticated;
grant select                         on public.user_stats        to authenticated;
grant select                         on public.achievements      to authenticated;
grant select                         on public.user_achievements to authenticated;
grant select                         on public.ai_usage          to authenticated;
grant select, insert                 on public.word_reports      to authenticated;

grant usage, select on sequence public.reviews_id_seq to authenticated;

-- ملاحظة: daily_activity و user_stats و user_achievements للقراءة فقط من العميل.
-- الكتابة فيها تتم حصريًا عبر دوال security definer في 0003 — منعًا لتزوير النقاط.

-- ── 3. السياسات ────────────────────────────────────────────

-- profiles: كل مستخدم يقرأ ويعدّل بروفايله فقط
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
-- لا سياسة insert: البروفايل يُنشأ بالـ trigger عند التسجيل
-- لا سياسة delete: الحذف يتم عبر حذف الحساب

-- dictionary_entries: قراءة للجميع المسجّلين، لا كتابة من العميل نهائيًا
drop policy if exists dict_select on public.dictionary_entries;
create policy dict_select on public.dictionary_entries
  for select to authenticated using (not is_flagged);

-- user_words: ملكية كاملة لصفوف المستخدم
drop policy if exists uw_select on public.user_words;
create policy uw_select on public.user_words
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists uw_insert on public.user_words;
create policy uw_insert on public.user_words
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists uw_update on public.user_words;
create policy uw_update on public.user_words
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists uw_delete on public.user_words;
create policy uw_delete on public.user_words
  for delete to authenticated using ((select auth.uid()) = user_id);

-- reviews: قراءة وإضافة فقط. لا تعديل ولا حذف — السجل غير قابل للتلاعب
drop policy if exists reviews_select on public.reviews;
create policy reviews_select on public.reviews
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- study_sessions
drop policy if exists sessions_select on public.study_sessions;
create policy sessions_select on public.study_sessions
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists sessions_insert on public.study_sessions;
create policy sessions_insert on public.study_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists sessions_update on public.study_sessions;
create policy sessions_update on public.study_sessions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- daily_activity · user_stats · user_achievements · ai_usage: قراءة فقط
drop policy if exists activity_select on public.daily_activity;
create policy activity_select on public.daily_activity
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists stats_select on public.user_stats;
create policy stats_select on public.user_stats
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists ua_select on public.user_achievements;
create policy ua_select on public.user_achievements
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists ai_usage_select on public.ai_usage;
create policy ai_usage_select on public.ai_usage
  for select to authenticated using ((select auth.uid()) = user_id);

-- achievements: كتالوج عام للمسجّلين
drop policy if exists achievements_select on public.achievements;
create policy achievements_select on public.achievements
  for select to authenticated using (true);

-- word_reports: المستخدم يبلّغ ويشوف بلاغاته
drop policy if exists reports_select on public.word_reports;
create policy reports_select on public.word_reports
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists reports_insert on public.word_reports;
create policy reports_insert on public.word_reports
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- deletion_requests: لا سياسات ⇒ لا وصول من العميل (service_role فقط)

-- ── 4. سياسات التخزين ──────────────────────────────────────
-- المسار المتفق عليه: avatars/<user_id>/<filename>

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects
  for select to public using (bucket_id = 'avatars');

drop policy if exists "avatars own write" on storage.objects;
create policy "avatars own write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars own update" on storage.objects;
create policy "avatars own update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars own delete" on storage.objects;
create policy "avatars own delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "pronunciations public read" on storage.objects;
create policy "pronunciations public read" on storage.objects
  for select to public using (bucket_id = 'pronunciations');
-- الكتابة في pronunciations لـ service_role فقط (Edge Functions)

-- ── 5. تصفير الصلاحيات الافتراضية للجداول المستقبلية ───────
alter default privileges in schema public revoke all on tables from anon;

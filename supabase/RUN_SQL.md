# تشغيل ملفات الـ SQL — الخطوة 4

## الطريقة (SQL Editor — بدون تثبيت أي حاجة)

في لوحة Supabase → **SQL Editor** → **New query** → الصق محتوى كل ملف → **Run**.

**بالترتيب ده بالظبط، وواحد ورا التاني:**

| # | الملف | بيعمل إيه | المتوقع |
|---|---|---|---|
| 1 | `0001_init.sql` | الأنواع + 12 جدول + الفهارس + حاويات التخزين | `Success. No rows returned` |
| 2 | `0002_rls.sql` | تفعيل RLS + الصلاحيات + 20 سياسة | `Success. No rows returned` |
| 3 | `0003_functions.sql` | SM-2 + كل دوال الـ RPC + trigger التسجيل | `Success. No rows returned` |
| 4 | `0004_seed_achievements.sql` | 13 إنجاز | `Success. No rows returned` |

> ⚠️ لو ملف فشل، **متكملش**. ابعتلي نص الخطأ كامل وأصلحه.

الملفات كلها **idempotent** — يعني تقدر تعيد تشغيلها من غير ضرر لو حصلت مشكلة في النص.

---

## التحقق بعد التشغيل

الصق ده في SQL Editor:

```sql
-- 1) كل الجداول موجودة و RLS مفعّل عليها؟
select tablename,
       rowsecurity as rls_enabled,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = t.tablename) as policies
from pg_tables t
where schemaname = 'public'
order by tablename;
```

**المتوقع:** 12 صف، وعمود `rls_enabled` كله `true`.
جدول `deletion_requests` هو الوحيد اللي `policies = 0` — وده مقصود (service_role بس).

```sql
-- 2) الدوال اتعملت؟
select routine_name, security_type
from information_schema.routines
where routine_schema = 'public'
order by routine_name;
```

**المتوقع:** `add_word`, `apply_activity`, `check_achievements`, `get_due_words`,
`get_home_summary`, `handle_new_user`, `srs_next`, `submit_review`,
`sync_reviews`, `touch_updated_at`, `user_today`.

```sql
-- 3) الإنجازات اتزرعت؟
select count(*) from public.achievements;   -- المتوقع: 13
```

```sql
-- 4) اختبار خوارزمية SM-2 من غير أي مستخدم
select rating,
       (r).status,
       round((r).interval_days::numeric, 2) as days,
       (r).repetitions as reps,
       round((r).ease_factor::numeric, 2)   as ease
from (
  select g as rating,
         public.srs_next('review'::public.word_status, 2.5, 10.0, 3, 0, 0, g::smallint) as r
  from generate_series(0, 3) g
) s;
```

**المتوقع تقريبًا:**

| rating | status | days | reps | ease |
|---|---|---|---|---|
| 0 (نسيها) | learning | 4.00 | 3 | 2.30 |
| 1 (صعبة) | review | ~12 | 4 | 2.36 |
| 2 (تمام) | review | ~25 | 4 | 2.50 |
| 3 (سهلة) | review | ~34 | 4 | 2.60 |

الأرقام بتتغير شوية كل تشغيل بسبب الـ fuzz (±5%) — وده مقصود عشان المراجعات ما تتكدّسش في يوم واحد.

---

## اختبار حقيقي بمستخدم (اختياري بس مفيد)

1. **Authentication → Users → Add user** → إيميل وباسورد وهمية → `Auto Confirm User`
2. اتأكد إن الـ trigger اشتغل:

```sql
select p.display_name, s.level, s.current_streak, s.streak_freezes
from public.profiles p
join public.user_stats s on s.user_id = p.id;
```

لازم يطلع صف واحد بمستوى 1. **لو مافيش صف، الـ trigger مشتغلش** — قولّي.

3. جرّب دورة كاملة (شغّلها كتلة واحدة):

```sql
do $$
declare
  v_user  uuid;
  v_entry uuid;
  v_uw    uuid;
begin
  select id into v_user from auth.users order by created_at desc limit 1;

  insert into public.dictionary_entries (lemma, lemma_norm, ipa, cefr_level, senses, examples, memory_tip_ar, source)
  values ('resilient', 'resilient', '/rɪˈzɪliənt/', 'B2',
    '[{"pos":"adjective","en_definition":"able to recover quickly","ar_definition":"قادر على التعافي بسرعة","ar_translations":["مرن","صامد"]}]'::jsonb,
    '[{"en":"She is remarkably resilient.","ar":"هي مرنة بشكل ملحوظ.","sense_index":0}]'::jsonb,
    'افتكر السيليكون — بيرجع لشكله', 'manual')
  on conflict (lemma_norm) do update set lemma = excluded.lemma
  returning id into v_entry;

  insert into public.user_words (user_id, entry_id) values (v_user, v_entry)
  on conflict (user_id, entry_id) do update set updated_at = now()
  returning id into v_uw;

  perform public.apply_activity(v_user, 1, 1, 15);
  perform public.check_achievements(v_user);

  raise notice 'user=% word=%', v_user, v_uw;
end $$;

select total_xp, level, total_words, current_streak from public.user_stats;
select code from public.user_achievements;
```

**المتوقع:** `total_words = 1` و `total_xp > 0` وإنجاز `first_word` ظهر.

> ملاحظة: `submit_review` نفسها ما تتنفذش من SQL Editor لأنها بتعتمد على `auth.uid()`
> اللي بييجي من الـ JWT. هنختبرها من التطبيق في المرحلة الجاية.

4. **نضّف بعد الاختبار:**

```sql
delete from public.user_words;
delete from public.user_achievements;
delete from public.daily_activity;
update public.user_stats set total_xp = 0, level = 1, total_words = 0,
       current_streak = 0, longest_streak = 0, last_goal_date = null;
delete from public.dictionary_entries where source = 'manual';
```

---

## بعد ما تخلص

قولّي **"الـ SQL اشتغل"** وأبدأ فورًا في:

- Edge Function `enrich-word` (Gemini + التحقق بـ Zod)
- مشروع Expo: الثيم والـ RTL والترجمات ومكتبة الكومبوننتس

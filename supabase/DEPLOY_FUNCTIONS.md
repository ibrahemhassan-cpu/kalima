# نشر واختبار الـ Edge Functions

> **إمتى تعمل الكلام ده؟**
>
> مش دلوقتي. الـ Edge Functions محتاجة لإضافة الكلمات بالـ AI — وده المرحلة 2.
> شاشة فحص النظام الحالية شغالة من غيرها تمامًا.
>
> **الترتيب الصح:**
> 1. شغّل التطبيق الأول (`README.md`) واتأكد إن شاشة الفحص كلها خضرا ✅
> 2. بعدين ارجع للملف ده

---

## 0-ب. شغّل `0006_questions.sql` كمان

بعد `0005`، شغّل `0006_questions.sql` في SQL Editor. بيضيف:

- `entry_questions` — بنك أسئلة مولّد بالـ AI، مشترك بين كل المستخدمين
- `get_session_items` — مُنسّق الجلسة اللي بيختار نوع سؤال مختلف كل مرة
- `submit_quiz_answer` — تصحيح على السيرفر (الإجابة الصحيحة ما بتوصلش للتطبيق أبدًا)
- `entries_missing_questions` · `lookup_words`

تحقّق:

```sql
select routine_name from information_schema.routines
where routine_schema='public'
  and routine_name in ('get_session_items','submit_quiz_answer',
                       'entries_missing_questions','lookup_words','last_modes');
-- المتوقع: 5 صفوف

select count(*) from public.entry_questions;  -- 0 دلوقتي، هتزيد مع كل كلمة جديدة
```

ولازم تنشر الدالة الجديدة كمان:

```powershell
npx eas-cli@latest --version   # (غير مطلوب، ده مجرد فاصل)
npx supabase functions deploy generate-questions
```

---

## 0. شغّل `0005_ai_usage.sql` الأول

نفس الطريقة السابقة: **SQL Editor** → الصق → Run.

بيضيف:

- `bump_ai_usage` / `refund_ai_usage` — عدّاد نداءات Gemini (service_role فقط)
- `search_dictionary` — اقتراحات فورية أثناء الكتابة
- `list_my_words` — قائمة "كلماتي" بالفلاتر والبحث والترتيب

تحقّق:

```sql
select routine_name from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('bump_ai_usage','refund_ai_usage','search_dictionary','list_my_words');
-- المتوقع: 4 صفوف
```

---

## 1. تثبيت Supabase CLI

> ⚠️ **متعملش `npm install -g supabase`.** Supabase شالت دعم التثبيت العام
> بسبب مشاكل الـ PATH والصلاحيات على ويندوز. استخدم واحدة من دول:

### الطريقة الموصى بها: حزمة داخل المشروع

من **PowerShell** في مجلد `Desktop\kalima`:

```powershell
npm install --save-dev supabase
npx supabase --version
```

كده الـ CLI بقى جزء من المشروع، و`npx supabase` هيلاقيه دايمًا بدون مشاكل PATH.

### بديل: Scoop (لو بتفضّل أداة على مستوى النظام)

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

## 2. تسجيل الدخول والربط

```powershell
npx supabase login
```

هيفتحلك المتصفح عشان توافق، وبعدها يرجع للتيرمنال لوحده.

```powershell
npx supabase link --project-ref aujupuljlpwelevvuqwm
```

هيطلب منك **Database password** — دي اللي حفظتها وقت إنشاء المشروع.

> **مهم:** ما تستخدمش `supabase db push`. إحنا طبّقنا الميجريشن يدويًا من SQL Editor،
> فالـ CLI مش عارف بيها وممكن يحاول يعيدها. هنستخدمه لنشر الـ functions بس.
> لما نجهّز الريبو على git هرتّبلك موضوع الميجريشن بالتواريخ صح.

## 3. حط مفتاح Gemini

```powershell
npx supabase secrets set GEMINI_API_KEY=المفتاح_بتاعك_هنا
```

اختياري — لو عايز تغيّر الحد اليومي (الافتراضي 30 كلمة جديدة لكل مستخدم):

```powershell
npx supabase secrets set AI_DAILY_LIMIT=30
```

تأكّد:

```powershell
npx supabase secrets list
```

> `SUPABASE_URL` و `SUPABASE_ANON_KEY` و `SUPABASE_SERVICE_ROLE_KEY` بيتحطّوا
> تلقائيًا في بيئة الـ Edge Functions. متضيفهمش بنفسك.

## 4. النشر

من المجلد اللي فيه فولدر `supabase`:

```powershell
npx supabase functions deploy enrich-word
npx supabase functions deploy generate-questions
npx supabase functions deploy delete-account
```

**بديل من غير CLI:** لوحة Supabase → **Edge Functions** → **Deploy a new function** →
والصق الملفات. بس الطريقة دي أصعب مع الملفات المتعددة (`gemini.ts` و `_shared/cors.ts`).
الـ CLI أريح بكتير.

---

## 5. الاختبار

### 5.1 هات access token لمستخدم

استخدم المستخدم التجريبي اللي عملته قبل كده (أو اعمل واحد من **Authentication → Users**).

في PowerShell:

```powershell
$SUPA = "https://aujupuljlpwelevvuqwm.supabase.co"
$ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1anVwdWxqbHB3ZWxldnZ1cXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTEwNzEsImV4cCI6MjEwMjAyNzA3MX0.GP4JMoG2Tw7JWVbSccqPRxc2rweKwJBqynZq_RpBsbw"

$login = Invoke-RestMethod -Method Post `
  -Uri "$SUPA/auth/v1/token?grant_type=password" `
  -Headers @{ apikey = $ANON; "Content-Type" = "application/json" } `
  -Body '{"email":"ايميل_المستخدم_التجريبي","password":"الباسورد"}'

$TOKEN = $login.access_token
$TOKEN.Substring(0,20)   # للتأكد إنه جه
```

### 5.2 جرّب كلمة جديدة

```powershell
$r = Invoke-RestMethod -Method Post `
  -Uri "$SUPA/functions/v1/enrich-word" `
  -Headers @{ Authorization = "Bearer $TOKEN"; "Content-Type" = "application/json" } `
  -Body '{"word":"resilient","add":true}'

$r.cached                      # False في أول مرة
$r.entry.lemma                 # resilient
$r.entry.ipa                   # /rɪˈzɪliənt/
$r.entry.senses[0].ar_translations
$r.entry.memory_tip_ar
$r.entry.audio_url
$r.ai_remaining                # 29
```

**أول نداء بياخد 3–6 ثواني.** كرّر نفس الأمر تاني:

```powershell
$r2 = Invoke-RestMethod -Method Post `
  -Uri "$SUPA/functions/v1/enrich-word" `
  -Headers @{ Authorization = "Bearer $TOKEN"; "Content-Type" = "application/json" } `
  -Body '{"word":"resilient"}'

$r2.cached                     # True — ودلوقتي أقل من نص ثانية
```

**لو `cached = True` في المرة التانية، يبقى قلب النظام كله شغّال.**

### 5.3 اختبارات الحالات الشاذة

| المدخل | المتوقع |
|---|---|
| `{"word":"asdkjhasd"}` | 404 · `not_a_word` · "ما لقيناش الكلمة دي" |
| `{"word":"مرحبا"}` | 400 · `not_english` |
| `{"word":"123"}` | 400 · `not_english` |
| `{"word":""}` | 400 · `empty` |
| بدون `Authorization` | 401 |
| 31 كلمة جديدة في يوم | 429 · `rate_limited` |

```powershell
# مثال: كلمة مش موجودة
try {
  Invoke-RestMethod -Method Post -Uri "$SUPA/functions/v1/enrich-word" `
    -Headers @{ Authorization = "Bearer $TOKEN"; "Content-Type" = "application/json" } `
    -Body '{"word":"asdkjhasd"}'
} catch {
  $_.ErrorDetails.Message      # {"error":"not_a_word","message_ar":"..."}
}
```

### 5.4 تحقق من الداتابيز

```sql
select lemma, cefr_level, ipa, audio_url is not null as has_audio,
       jsonb_array_length(senses) as senses, source, model_version
from public.dictionary_entries order by created_at desc limit 5;

select * from public.ai_usage;     -- calls = عدد النداءات الفعلية للـ AI
select count(*) from public.user_words;
```

### 5.5 اللوجز

لو حاجة فشلت: **Edge Functions → enrich-word → Logs**. رسائل `console.error`
بتوضّح بالظبط سبب فشل Gemini.

---

## 6. اختبار حذف الحساب

> ⚠️ **بيحذف المستخدم نهائيًا.** استخدم حساب تجريبي مش حسابك.

```powershell
Invoke-RestMethod -Method Post -Uri "$SUPA/functions/v1/delete-account" `
  -Headers @{ Authorization = "Bearer $TOKEN"; "Content-Type" = "application/json" } `
  -Body '{"confirm":"حذف"}'
```

بعدها اتأكد إن المستخدم اختفى من **Authentication → Users**، وإن الجداول اتنضّفت:

```sql
select count(*) from public.user_words;     -- 0
select count(*) from public.profiles;       -- 0
select count(*) from public.dictionary_entries;  -- ثابت (الكلمات بتفضل — مقصود)
```

---

## بعد ما تخلص

قولّي **"الـ functions شغالة"** وأبدأ في مشروع Expo:
الثيم والألوان، دعم RTL، الترجمات، مكتبة الكومبوننتس، وأول شاشة شغّالة على تليفونك.

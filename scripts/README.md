# بذر القاموس

## ليه؟

أول مستخدم يبحث عن كلمة بينتظر 3–6 ثواني بينما Gemini بيولّدها. كل اللي بعده
بياخدوها فورًا من الكاش. بذر الكلمات الشائعة مسبقًا معناه إن **تقريبًا محدش
هينتظر**، وإن استهلاك حصة الـ AI اليومية هيفضل شبه صفر.

فيه كمان فايدة تانية: بنك الأسئلة بيتولّد مع كل كلمة، فالمراجعات بتبقى جاهزة
من اللحظة الأولى.

---

## قبل ما تبدأ

**1. مستخدم مخصّص للبذر.** الدالة محمية بمصادقة عن قصد، فمحتاج حساب.
اعمل واحد من **Authentication → Users** مع `Auto Confirm User`.

**2. ارفع الحد اليومي مؤقتًا** — الافتراضي 30 كلمة/يوم وهيوقفك بسرعة:

```powershell
npx supabase secrets set AI_DAILY_LIMIT=2000
npx supabase functions deploy enrich-word
```

> ⚠️ **رجّعه بعد ما تخلص:** `npx supabase secrets set AI_DAILY_LIMIT=30`
> ثم أعد النشر. الحد ده هو اللي بيمنع أي مستخدم من استنزاف حصتك.

**3. ملف الإعدادات.** اعمل `.env.seed` في جذر المشروع:

```
SUPABASE_URL=https://aujupuljlpwelevvuqwm.supabase.co
SUPABASE_ANON_KEY=مفتاح_anon
SEED_EMAIL=seed@example.com
SEED_PASSWORD=كلمة_المرور
```

> `.env.seed` و`.seed-progress.json` مستبعدين من git.

---

## التشغيل

```powershell
node scripts/seed-dictionary.mjs scripts/words-core.txt
```

`words-core.txt` فيه **1644 كلمة** مختارة من نطاق A2–C1 — دي اللي متعلّم عربي
بيقابلها فعلًا في القراءة والأفلام والشغل.

### خيارات

```powershell
# جرّب 20 كلمة الأول عشان تتأكد إن كل حاجة تمام
node scripts/seed-dictionary.mjs scripts/words-core.txt --limit 20

# سرّع لو حسابك مدفوع (الافتراضي 7 ثواني بين الكلمات)
node scripts/seed-dictionary.mjs scripts/words-core.txt --delay 2000
```

### الاستئناف

السكربت بيحفظ تقدّمه في `.seed-progress.json` كل 10 كلمات. لو وقف لأي سبب —
انقطاع نت، حد معدّل، إغلاق الكمبيوتر — شغّله تاني وهيكمّل من مكانه بالظبط.

### الوقت المتوقع

| الحالة | التقدير |
|---|---|
| الطبقة المجانية (7 ثواني/كلمة) | ~3 ساعات لكل 1644 كلمة |
| مع حساب مدفوع (2 ثانية) | ~55 دقيقة |

سيبه شغال في الخلفية. الكلمات اللي في الكاش خلاص بتعدي فورًا بدون انتظار.

---

## قوائم أكبر

لو حبيت توسّع، أفضل المصادر المجانية:

- **NGSL** (New General Service List) — أشيع 2800 كلمة تغطّي ~92% من النصوص العامة
- **NAWL** — قائمة المفردات الأكاديمية، مفيدة للطلبة
- **Oxford 5000** — مصنّفة بمستويات CEFR

نزّل أي قائمة كملف نصي (كلمة في كل سطر) ومرّرها للسكربت. بيتجاهل التكرار
والأسطر غير الصالحة تلقائيًا، وبيتخطّى أي كلمة موجودة في الكاش.

---

## التحقق

```sql
select count(*) as words from public.dictionary_entries;
select count(*) as questions from public.entry_questions;

-- توزيع المستويات
select cefr_level, count(*) from public.dictionary_entries
group by cefr_level order by cefr_level;

-- كلمات بدون أسئلة (لازم تقرب من الصفر)
select count(*) from public.dictionary_entries de
where not exists (select 1 from public.entry_questions q where q.entry_id = de.id);
```

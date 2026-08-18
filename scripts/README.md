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

### كلمات حزم المواضيع

`words-packs.txt` فيه **144 كلمة** — دي كلمات الحزم الستة اللي في تبويب
«استكشاف» (`0007_packs.sql`). 19 منها موجودة أصلًا في `words-core.txt`،
فالباقي ~125 كلمة يعني ~15 دقيقة على الطبقة المجانية:

```powershell
node scripts/seed-dictionary.mjs scripts/words-packs.txt
```

**ابذرها قبل ما تعرض الحزم لمستخدم حقيقي.** الحزمة اللي كلماتها في القاموس
بتتضاف كلها بضغطة واحدة وفورًا؛ الكلمة الناقصة لازم تتولّد لما المستخدم
يفتحها، فبتحسب من حدّه اليومي وبتاخد 3–6 ثواني.

تحقّق من الجاهزية:

```sql
select p.slug,
       count(*) as words,
       count(de.id) as ready
from public.topic_packs p
join public.pack_words pw on pw.pack_id = p.id
left join public.dictionary_entries de on de.lemma_norm = pw.lemma
group by p.slug order by p.slug;
```

### الاستئناف

السكربت بيحفظ تقدّمه في `.seed-progress.json` كل 10 كلمات. لو وقف لأي سبب —
انقطاع نت، حد معدّل، إغلاق الكمبيوتر — شغّله تاني وهيكمّل من مكانه بالظبط.

### لما يقول «Gemini throttled»

429 بتيجي من مصدرين مختلفين تمامًا، والسكربت بيفرّق بينهم:

| الرسالة | السبب | الحل |
|---|---|---|
| `وصلت لحد N كلمة النهاردة` | حدّنا إحنا (`AI_DAILY_LIMIT`) | ارفعه وأعِد نشر `enrich-word` |
| `Gemini throttled` | جوجل هي اللي رافضة | شوف تحت |

اعرف السبب الحقيقي من **Supabase Dashboard → Edge Functions → enrich-word →
Logs**، ودوّر على سطر `gemini failed: gemini 429:`. جوّاه رسالة جوجل نفسها:

- فيها **PerMinute** → سرعة زيادة. زوّد المهلة: `--delay 12000`
- فيها **PerDay** → حصتك اليومية خلصت. الطبقة المجانية لـ `gemini-2.5-flash`
  محدودة بعدد طلبات في اليوم (حوالي ٢٥٠)، وبتتصفّر منتصف الليل بتوقيت المحيط
  الهادئ. استنى بكرة، أو فعّل الفوترة في Google AI Studio — الـ ١٤٤ كلمة كلها
  بتكلّف سنتات.

السكربت بيوقف لوحده بعد ٣ كلمات ورا بعض بترفضهم جوجل، بدل ما يفضل مستني
ساعات. اللي اتعمل محفوظ — شغّله تاني في أي وقت وهيكمّل من مكانه.

> **البذر مش شرط عشان الحزم تشتغل.** الكلمة اللي لسه ما اتولّدتش بتظهر
> بعلامة ✨ وبتتولّد لما المستخدم يفتحها. البذر بيخلّي «أضِف الحزمة» فوري
> ومجاني، بس الميزة شغالة من غيره.

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

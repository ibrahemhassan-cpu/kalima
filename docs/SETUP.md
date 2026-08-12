# Kalima — تقسيم المهام وقائمة الإعداد

## القاعدة العامة

| أنا (Claude) | أنت |
|---|---|
| **كل الكود**: ملفات SQL، سياسات RLS، دوال RPC، الـ Edge Functions، تطبيق React Native كامل، سكربت بذر الكلمات، ملفات الإعداد | **الضغط على الزراير في اللوحات** — أي حاجة محتاجة حسابك الشخصي أو كارت الدفع |

أنا ما عنديش وصول لحساب Supabase بتاعك. بكتب الملفات كاملة، وإنت تلصقها أو تعمل `push` بأمر واحد.

---

## أ. Gemini API — أول حاجة، 3 دقايق

> ⚠️ **اشتراك Google AI Pro مش بيدّي API access للتطبيقات.** هو اشتراك استهلاكي (تطبيق Gemini، 2TB تخزين، حدود أعلى في AI Studio Playground). بيدّي رصيد API شهري محدود داخل AI Studio، بس ده مش بديل لمفتاح مشروع.
>
> وكمان **ما ينفعش أستخدم مفتاح من عندي** — التطبيق بتاعك هيشتغل على سيرفر Supabase بتاعك ومحتاج مفتاح مربوط بحسابك.

**الخبر الحلو:** المفتاح المجاني كفاية تمامًا وما بيطلبش كارت.

1. روح [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. سجّل دخول بنفس حساب Google اللي عليه الاشتراك
3. **Create API key** → اختر مشروع أو اعمل واحد جديد
4. انسخ المفتاح واحفظه في مكان آمن

- [ ] عندي `GEMINI_API_KEY`

> 🔒 **متبعتش المفتاح في الشات.** هديك أمر تحطه بيه في Supabase مباشرة.

---

## ب. Supabase — 15 دقيقة

### 1. المشروع

1. [supabase.com](https://supabase.com) → Sign up (بحساب GitHub أسهل)
2. **New project**
   - Name: `kalima`
   - Database password: ولّد واحدة قوية و**احفظها** (مش هتشوفها تاني)
   - Region: **`eu-central-1` (Frankfurt)** — أقل latency للشرق الأوسط
   - Plan: Free
3. استنى ~2 دقيقة لحد ما يجهز

- [ ] المشروع شغّال
- [ ] كلمة مرور الداتابيز محفوظة

### 2. المفاتيح — دي اللي أنا محتاجها منك

**Settings → API**

- [ ] `Project URL` → شكلها `https://xxxxx.supabase.co` — **ابعتهالي**
- [ ] `anon public` key → **ابعتهالي** (دي عامة بطبيعتها، آمنة مع RLS)
- [ ] `service_role` key → **متبعتهاش لحد، ولا تحطها في التطبيق.** هتستخدمها في مكان واحد بس هقولك عليه

### 3. المصادقة

**Authentication → Sign In / Providers**

- [ ] Email: مفعّل
- [ ] **Confirm email**: مفعّل
- [ ] Minimum password length: `8`
- [ ] Google / Apple: **سيبهم دلوقتي** — محتاجين إعداد طويل، هنعملهم في المرحلة 1

**Authentication → URL Configuration**

- [ ] Site URL: `kalima://`
- [ ] Redirect URLs: أضف `kalima://auth-callback` و `exp://localhost:8081`

**Authentication → Attack Protection**

- [ ] فعّل **Leaked password protection** (بيمنع كلمات المرور المسربة)

### 4. تشغيل الـ SQL

هبعتلك ملفات SQL مرقّمة. طريقتين:

**الطريقة السهلة (للبداية):** SQL Editor في اللوحة → New query → الصق الملف → Run. بالترتيب.

**الطريقة الاحترافية (لما نكبر):**
```bash
npm i -g supabase
supabase login
supabase link --project-ref <ref-من-الرابط>
supabase db push
```

- [ ] قررت أنهي طريقة

### 5. الأسرار (Secrets) — بعد ما أبعتلك أول Edge Function

```bash
supabase secrets set GEMINI_API_KEY=المفتاح_بتاعك
```

أو من اللوحة: **Edge Functions → Secrets → Add new secret**

- [ ] `GEMINI_API_KEY` متحطّط

---

## ج. جهازك — 20 دقيقة

- [ ] **Node.js 20 LTS+** → [nodejs.org](https://nodejs.org) · تأكد: `node -v`
- [ ] **Git** → `git --version`
- [ ] محرر كود — VS Code
- [ ] **Expo Go** على تليفونك (App Store / Play Store) — هتشغّل التطبيق عليه فورًا بدون بناء
- [ ] حساب Expo مجاني → [expo.dev](https://expo.dev)
- [ ] `npm i -g eas-cli` ثم `eas login`

> Android Studio و Xcode **مش مطلوبين** في البداية — Expo Go كفاية لحد ما نوصل لمرحلة البناء الفعلي.

---

## د. مؤجَّل لحد قرب الإطلاق (المرحلة 6)

- [ ] **Apple Developer Program** — 99$/سنة · التسجيل بياخد 1–3 أيام، ابدأه قبل الإطلاق بأسبوعين
- [ ] **Google Play Console** — 25$ مرة واحدة · محتاج 12 مختبِر لمدة 14 يوم قبل النشر العام
- [ ] استضافة صفحتي الخصوصية والشروط (GitHub Pages مجاني — أنا هكتب محتواهم)
- [ ] حساب Sentry مجاني لتتبّع الأخطاء

---

## هـ. اللي أنا هعمله بالكامل

- كل ملفات الـ SQL: الجداول، الـ enums، الـ indexes، سياسات RLS، الـ triggers، دوال SM-2 و `submit_review` و `recalc_streak`
- الـ Edge Functions بالكامل: `enrich-word`, `generate-quiz`, `word-of-the-day`, `delete-account`
- التطبيق كامل: كل شاشة، كل كومبوننت، الثيم، الـ RTL، الترجمات، الإشعارات، الأوفلاين
- سكربت بذر أول 3000 كلمة
- ملفات `app.json` و `eas.json` والأيقونات وشاشة البداية
- نصوص سياسة الخصوصية والشروط بالعربي والإنجليزي
- أوامر النشر خطوة بخطوة

---

## و. الترتيب المقترح دلوقتي

1. اعمل مفتاح Gemini ← 3 دقايق
2. اعمل مشروع Supabase وابعتلي `Project URL` + `anon key` ← 15 دقيقة
3. ثبّت Node و Expo Go ← 20 دقيقة
4. قولّي "خلصت" وأنا أبدأ المرحلة 0

**الألوان:** ماشيين بالأزرق/البنفسجي الحالي كـ placeholder. كل الألوان في ملف واحد `src/theme/colors.ts` — تغييرها بعدين تعديل سطرين ومش بيمس أي كود تاني.

---

**مصادر:** [Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key) · [Google AI plans](https://ai.google.dev/gemini-api/docs/google-ai-plans)

# كلمة · Kalima

تطبيق حفظ الكلمات الإنجليزية بالمراجعة المتباعدة والذكاء الاصطناعي.
React Native (Expo) · Supabase · Gemini.

---

## التشغيل لأول مرة

افتح **PowerShell** في مجلد المشروع (`Desktop\kalima`) ونفّذ بالترتيب:

### 1. الحزم الأساسية

```powershell
npm install
```

### 2. باقي الحزم عبر Expo

> استخدم `npx expo install` مش `npm install` — Expo بيختار الإصدار المتوافق مع SDK 57 تلقائيًا.
> ده بيمنع 90% من مشاكل "الحزمة دي مش شغالة".

```powershell
npx expo install expo-router expo-constants expo-linking expo-status-bar expo-splash-screen expo-localization expo-secure-store expo-speech expo-haptics expo-image expo-updates expo-system-ui

npx expo install react-native-safe-area-context react-native-screens react-native-gesture-handler react-native-reanimated react-native-url-polyfill @react-native-async-storage/async-storage @expo/vector-icons

npx expo install expo-image-picker expo-file-system expo-sharing

npm install @supabase/supabase-js @tanstack/react-query zustand i18next react-i18next base64-arraybuffer
```

### 3. متغيرات البيئة

انسخ `.env.example` باسم `.env`:

```powershell
Copy-Item .env.example .env
notepad .env
```

واملأ `EXPO_PUBLIC_SUPABASE_ANON_KEY` بمفتاح anon من لوحة Supabase.

### 4. شغّل

```powershell
npx expo start -c
```

> `-c` بيمسح الكاش — مهم بعد أي تعديل في `.env`.

هيظهر لك **QR code**. امسحه من تليفونك.
(التليفون والكمبيوتر لازم يكونوا على نفس شبكة الواي فاي.)

> ⚠️ **لو Expo Go قال «حدّث النسخة» أو «آخر نسخة هي SDK 54»:**
> Expo Go بيدعم إصدار SDK واحد بس، والنسخة المتاحة لجهازك أقدم من مشروعنا.
> الحل هو **Development Build** — اتبع [`docs/DEV_BUILD.md`](docs/DEV_BUILD.md).
> كنت هتحتاجه بعدين على أي حال عشان الأيقونة وشاشة البداية والمكتبات النيتف.

---

## المتوقع على الشاشة

التطبيق دلوقتي فيه تدفق كامل. جرّبه بالترتيب ده:

### 1. حساب جديد

| الخطوة | المتوقع |
|---|---|
| شاشة الترحيب | لوجو كلمة + 3 مميزات + زرارين |
| «ابدأ دلوقتي» | فورم فيه اسم وإيميل وكلمة مرور |
| اكتب كلمة مرور أقل من 8 حروف | رسالة عربية تحت الحقل |
| سجّل بإيميل حقيقي | شاشة «بصّ في بريدك» |
| اضغط رابط التفعيل من إيميلك | ارجع للتطبيق وسجّل دخول |

### 2. شاشات الترحيب (بتظهر مرة واحدة بس)

اختار مستواك → هدفك اليومي → وقت التذكير → «يلا نبدأ».
بيتحفظوا في جدول `profiles` مع منطقتك الزمنية.

### 3. التطبيق

| التبويب | المتوقع |
|---|---|
| الرئيسية | اسمك، ستريك، شريط تقدّم الهدف، وإحصائيات حقيقية من `get_home_summary` |
| كلماتي / المراجعة / اكتشف | شاشات مؤقتة (المرحلة 2 و3 و4) |
| حسابي | صورتك واسمك ومستواك، وروابط الإعدادات والقانوني |

### 4. إضافة كلمة بالـ AI ⭐

> ⚠️ **لازم تنشر `enrich-word` الأول** — اتبع `supabase/DEPLOY_FUNCTIONS.md`.
> من غيرها زر «هات الكلمة» هيرجّع خطأ.

| الخطوة | المتوقع |
|---|---|
| اضغط «أضف كلمة» من الرئيسية أو زر `+` في كلماتي | شاشة إدخال بلوحة مفاتيح إنجليزية |
| اكتب `resilient` واضغط «هات الكلمة» | شاشة تحميل 3–6 ثواني |
| النتيجة | بادج «اتولّدت دلوقتي» + الترجمة والأمثلة والنطق وحيلة الحفظ |
| اضغط 🔊 | تسمع الكلمة |
| اكتب ملاحظة واحفظ | ترجع للشاشة السابقة والكلمة ظهرت |
| **اكتب نفس الكلمة تاني** | بادج **«من القاموس — فوري»** وأقل من نص ثانية |
| اكتب أول حرفين من كلمة موجودة | اقتراحات فورية تحت زر البحث |
| اكتب `asdkjhasd` | «ما لقيناش الكلمة دي في الإنجليزي» |
| اكتب كلمة عربية | «اكتب كلمة إنجليزية بحروف إنجليزية بس» |

**اختبار الكاش هو الأهم.** لو المرة التانية طلعت «من القاموس — فوري»، يبقى نظام
توفير تكلفة الـ AI شغال زي ما اتصمم.

### 5. كلماتي وتفاصيل الكلمة

- **الفلاتر:** الكل / بتتعلمها / متقنة / صعبة عليك / المفضلة
- **البحث** بيدوّر في الكلمة الإنجليزية وفي الترجمة العربية
- **الترتيب:** الأحدث / أبجدي / الأصعب (بيختفي في الوضع المبسّط)
- **اسحب لتحت** عشان تحدّث القائمة
- **افتح كلمة:** ⭐ للمفضلة · 🚩 بلاغ عن خطأ · 🗑 حذف · ملاحظة شخصية · مقاييس التقدّم

### 6. اختبارات مهمة

- **الإعدادات ← المظهر:** بدّل الثيم وحجم الخط. **الوضع المبسّط** بيكبّر كل حاجة ويخفي تبويب «اكتشف»
- **الإعدادات ← تعديل البيانات:** غيّر اسمك وارفع صورة
- **سياسة الخصوصية والشروط:** نصوص كاملة بالعربي
- **الإعدادات ← الحساب:** «نزّل بياناتي» بيطلّع ملف JSON. وحذف الحساب موجود بس **محتاج نشر `delete-account` الأول** (`supabase/DEPLOY_FUNCTIONS.md`)
- **اقفل التطبيق وافتحه:** لازم يفضل مسجّل دخول (الجلسة في SecureStore)

### التحقق من قاعدة البيانات

```sql
select display_name, cefr_level, daily_goal, reminder_time, timezone, onboarded_at
from public.profiles;

-- الكلمات اللي اتولّدت
select lemma, cefr_level, ipa, audio_url is not null as has_audio,
       jsonb_array_length(senses) as senses, source
from public.dictionary_entries order by created_at desc;

-- استهلاك الـ AI الفعلي (لازم يقل عن عدد الإضافات بفضل الكاش)
select * from public.ai_usage;

-- مكتبة المستخدم
select de.lemma, uw.status, uw.due_at, uw.personal_note
from public.user_words uw join public.dictionary_entries de on de.id = uw.entry_id;
```

---

## حل المشاكل

| المشكلة | الحل |
|---|---|
| `ناقص EXPO_PUBLIC_SUPABASE_URL` | ملف `.env` مش موجود أو فاضي. اعمله وأعد التشغيل بـ `-c` |
| «فشل الاتصال» في بادج السيرفر | اتأكد من الرابط في `.env` ومن الإنترنت |
| فشل تسجيل الدخول | اعمل مستخدم من **Authentication → Users** مع `Auto Confirm User` |
| `get_home_summary` فشلت | يبقى `0003_functions.sql` ماتشغّلش. راجع `supabase/RUN_SQL.md` |
| بادج الاتجاه بيقول LTR | طبيعي أول مرة على iOS. اقفل التطبيق وافتحه تاني |
| خطأ في Reanimated / worklets | `npx expo install react-native-worklets` ثم `npx expo start -c` |
| `Cannot find module 'babel-preset-expo'` | `npm install` تاني — الحزمة بتيجي مع `expo` |
| `Unable to resolve @/...` | تأكد إن `tsconfig.json` فيه `paths` وأعد تشغيل الخادم |
| عالق على شاشة التحميل | غالبًا `profiles` ماتعملش للمستخدم. راجع trigger `on_auth_user_created` في `0003_functions.sql` |
| «Email not confirmed» | افتح رابط التفعيل من إيميلك، أو فعّل المستخدم يدويًا من Authentication → Users |
| شاشات الترحيب بتظهر كل مرة | `onboarded_at` ماتحفظش — شوف اللوج لأي خطأ في `update profiles` |
| رفع الصورة بيفشل | تأكد إن `0002_rls.sql` اتشغّل (سياسات storage جوّاه) |

---

## هيكل المشروع

```
kalima/
├── app/                    شاشات expo-router (كل ملف = شاشة)
│   ├── _layout.tsx         المزوّدات: Query · Theme · SafeArea
│   └── index.tsx           فحص النظام (مؤقت)
├── src/
│   ├── components/ui/      Text · Button · Card · Input · Screen · Badge · SpeakButton
│   ├── features/tts.ts     النطق الصوتي
│   ├── i18n/               ar.json · en.json · أدوات RTL
│   ├── lib/                عميل Supabase · أنواع قاعدة البيانات
│   ├── store/              إعدادات المستخدم (zustand + AsyncStorage)
│   └── theme/              الألوان · الخطوط · المسافات · ThemeProvider
├── supabase/
│   ├── migrations/         0001 → 0005 (مطبّقة بالفعل)
│   ├── functions/          enrich-word · delete-account
│   ├── RUN_SQL.md
│   └── DEPLOY_FUNCTIONS.md
├── docs/
│   ├── PLAN.md             الخطة التقنية الكاملة
│   └── SETUP.md            تقسيم المهام
└── assets/                 الأيقونات واللوجو
```

---

## قواعد ثابتة في الكود

1. **ممنوع `marginLeft` / `right` / `paddingLeft`** — استخدم `Start` و `End` بدلًا منها، وإلا الواجهة هتتكسر في RTL.
2. **الكلمة الإنجليزية دايمًا `ltr`** — استخدم `<Text ltr>` أو `english` في `Input`.
3. **أي عنصر قابل للضغط ≥ 48dp** — `minTouch` من `useTheme()`.
4. **الألوان من `useTheme().colors` فقط** — ممنوع أي hex في الكومبوننتس.
5. **مفتاح Gemini ما يقربش من التطبيق** — مكانه أسرار Supabase بس.
6. **منطق SRS في Postgres** — التطبيق بينادي `submit_review` وبس.

---

## الخطوة الجاية

المرحلة 1: المصادقة الحقيقية (تسجيل/دخول/Google/Apple)، شاشات الـ Onboarding، والبروفايل.

# قائمة ما قبل البناء

> **`expo prebuild` مش مطلوب.** EAS بيعمله على السيرفر بنفسه. إنت بس بتعمل commit
> وتطلب البناء. (`prebuild` محليًّا محتاج Android Studio ومساحة ~10 جيجا، وما فيش
> داعي له طالما بتبني سحابيًّا.)

اتبع الترتيب ده بالظبط — كل خطوة بتعتمد على اللي قبلها.

---

## 1. الحزم الجديدة

```powershell
npx expo install expo-blur expo-linear-gradient expo-notifications expo-sqlite
npm install @gorhom/bottom-sheet
```

## 2. قاعدة البيانات

في **SQL Editor**، شغّل `supabase/migrations/0006_questions.sql`.

```sql
-- تحقّق
select routine_name from information_schema.routines
where routine_schema='public'
  and routine_name in ('get_session_items','submit_quiz_answer',
                       'entries_missing_questions','lookup_words','last_modes');
-- المتوقع: 5 صفوف
```

## 3. الـ Edge Functions

`enrich-word` **اتغيّرت** (بقت تولّد بنك الأسئلة)، و`generate-questions` **جديدة**:

```powershell
npx supabase functions deploy enrich-word
npx supabase functions deploy generate-questions
```

## 4. الفحص السريع ⭐

**دي أهم خطوة.** كل بناء بياخد 15 دقيقة — خطأ نوع واحد يضيّعهم كلهم.
الفحص ده بياخد 20 ثانية:

```powershell
npm run preflight
```

بيشغّل حاجتين:
- `tsc --noEmit` — يمسك أي خطأ TypeScript
- `expo install --check` — يمسك أي حزمة إصدارها مش متوافق مع SDK 57

**متبنيش قبل ما الاتنين ينضفوا.** لو ظهر أي خطأ ابعتهولي.

اختياري لكن مفيد:

```powershell
npm run doctor
```

## 5. الـ commit

EAS بيبني من git، مش من الملفات اللي على جهازك:

```powershell
git add -A
git commit -m "feat: quiz bank, notifications, achievements, offline queue"
```

## 6. البناء

```powershell
npm run build:preview
```

اختصار لـ `eas build --profile preview --platform android`.

بعد ~15 دقيقة: امسح الـ QR من كاميرا التليفون، نزّل الـ APK، ثبّته.
**التطبيق هيشتغل لوحده — مش محتاج الكمبيوتر ولا Metro ولا نفس الشبكة.**

---

## بعد التثبيت — جولة سريعة

| # | جرّب | شوف إيه |
|---|---|---|
| 1 | سجّل دخول | الشكل الجديد كله: زجاج، تدرّجات، حركة نابضة على كل ضغطة |
| 2 | زر `EN / ع` فوق | اللغة بتتبدّل **فورًا** بدون إعادة تشغيل |
| 3 | أضف `resilient` | 3–6 ثواني، ثم الكارت الكامل |
| 4 | أضف `resilient` تاني | بادج «من القاموس — فوري» في أقل من نص ثانية |
| 5 | أضف `recieve` | «هل تقصد receive؟» |
| 6 | أضف `bank` | «أي معنى صادفته؟» |
| 7 | اضغط أي مرادف | شيت بمعاينة الكلمة وزر إضافة |
| 8 | ابدأ المراجعة | بطاقة تنقلب ثلاثي الأبعاد + أربع أزرار كل واحد مكتوب تحته موعد الرجوع |
| 9 | راجع نفس الكلمة مرتين | **نوع سؤال مختلف في كل مرة** |
| 10 | خلّص جلسة | شاشة نتيجة بأرقام بتعدّ، ثم شيت الإشعارات |
| 11 | حسابي ← الإنجازات | 13 شارة بأشرطة تقدّم |
| 12 | اقفل الواي فاي وراجع | بيكمّل عادي؛ افتح النت وارجع للتطبيق → بيتزامن لوحده |
| 13 | الإعدادات ← وضع مبسّط | كل حاجة بتكبر وتبويب «استكشاف» بيختفي |
| 14 | الإعدادات ← غامق | الزجاج بيتحوّل لداكن والتباين بيفضل مظبوط |

---

## لو البناء فشل

| الرسالة | السبب والحل |
|---|---|
| `npm ci ... not in sync` | شغّل `npm install` واعمل commit للـ `package-lock.json` |
| `Cannot find module 'expo-blur'` | نسيت خطوة 1 |
| خطأ TypeScript | كان المفروض `npm run preflight` يمسكه — ابعتلي النص |
| `Gradle build failed` | افتح اللوج الكامل على expo.dev وابعتلي آخر 30 سطر |
| التطبيق بيفتح ويقفل | متغيّرات البيئة — اتأكد إن `eas.json` فيه `EXPO_PUBLIC_SUPABASE_*` في قسم `base` |

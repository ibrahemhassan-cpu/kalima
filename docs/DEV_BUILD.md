# Development Build — بديل Expo Go

## المشكلة

Expo Go تطبيق واحد بيدعم **إصدار SDK واحد بس** في المرة. النسخة اللي على تليفونك
واقفة عند SDK 54، ومشروعنا على SDK 57. مسح التطبيق وإعادة تنزيله مش هيحل حاجة —
لأن دي أحدث نسخة متاحة لجهازك من المتجر.

## الحل

**Development Build**: نسخة APK مبنية من مشروعك أنت، فيها بالظبط الحزم اللي إحنا
مستخدمينها. بتتثبّت مكان Expo Go وبتشتغل بنفس الطريقة — تفتحها وتمسح QR وتشوف
تعديلاتك فورًا.

**مميزات إضافية كنت هتحتاجها بعدين على أي حال:**

- الأيقونة واسم التطبيق الحقيقيين بدل أيقونة Expo
- شاشة البداية المخصصة
- `expo-secure-store` بيشتغل على الـ Keychain الحقيقي
- أي مكتبة نيتف نضيفها مستقبلًا

> ⚠️ **مهم:** بعد ما تعمل الـ build، أي حزمة جديدة نضيفها فيها كود نيتف بتحتاج
> build جديد. أما تعديلات الكود العادية (شاشات، ألوان، منطق) فبتظهر فورًا بدون
> إعادة بناء.

---

## الطريقة أ: EAS Build — سحابي، من غير Android Studio ⭐

أسهل طريقة على ويندوز. البناء بيحصل على سيرفرات Expo وإنت بتنزّل الـ APK.

### 1. الحزم

```powershell
npx expo install expo-dev-client
```

> ⚠️ **ما تثبّتش `eas-cli` ولا `supabase` ولا `@expo/ngrok` كـ devDependencies.**
> سيرفر البناء بيثبّت كل الـ devDependencies، والأدوات دي:
> - بتبطّئ البناء بمئات الحزم بلا داعٍ
> - `eas-cli` بيجرّ حزمة محتاجة TypeScript 5.x فبتتعارض مع الجذر وبيفشل `npm ci`
>
> استخدمها بـ `npx` من غير تثبيت: `npx eas-cli@latest` و `npx supabase@latest`.

### 2. تسجيل الدخول

```powershell
npx eas-cli@latest login
```

لو معندكش حساب Expo، اعمل واحد مجاني من [expo.dev](https://expo.dev).

### 3. اربط المشروع

```powershell
npx eas-cli@latest init
```

بيسألك تعمل مشروع جديد — وافق. هيحط `projectId` في `app.json` تلقائيًا.

### 4. ابنِ

```powershell
npx eas-cli@latest build --profile development --platform android
```

> 📌 **EAS بيبني من آخر git commit، مش من الملفات اللي على جهازك.**
> أي تعديل لازم تعمله commit قبل البناء، وإلا هيبني نسخة قديمة.

- أول مرة هيسألك يولّد **Android Keystore** — جاوب `y` (Expo بيحفظه ويأمّنه لك)
- البناء بياخد **10–20 دقيقة** حسب الزحمة على الطبقة المجانية
- في الآخر بيديك **رابط ورمز QR** لتنزيل الـ APK

### 5. ثبّت على التليفون

امسح الـ QR من التليفون أو افتح الرابط ونزّل الـ APK.
أندرويد هيحذّرك من "مصدر غير معروف" — اسمح بالتثبيت.

### 6. شغّل

```powershell
npx expo start --dev-client -c
```

افتح **تطبيق كلمة** على تليفونك (مش Expo Go) وامسح الـ QR.

---

## الطريقة ب: بناء محلي — أسرع بس محتاج إعداد

لو هتفضل تبني كتير، ده أسرع بكتير على المدى الطويل (دقيقتين بدل 15).

### المتطلبات

1. **Android Studio** من [developer.android.com/studio](https://developer.android.com/studio)
2. أثناء التثبيت اختار: `Android SDK` · `Android SDK Platform` · `Android Virtual Device`
3. **JDK 17** — بييجي مع Android Studio عادة
4. متغيّر البيئة `ANDROID_HOME`:

```powershell
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
```

اقفل PowerShell وافتحه تاني.

### البناء

وصّل التليفون بكابل USB مع تفعيل **USB Debugging** (من خيارات المطوّر)، وبعدين:

```powershell
npx expo install expo-dev-client
npx expo run:android
```

بيبني ويثبّت ويشغّل على التليفون مباشرة.

---

## أنهي طريقة تختار؟

| | EAS Build | بناء محلي |
|---|---|---|
| إعداد أولي | 5 دقايق | ساعة تقريبًا (تنزيل Android Studio) |
| وقت كل بناء | 10–20 دقيقة | 2–5 دقايق |
| مساحة على الجهاز | صفر | ~10 جيجا |
| iOS | ✅ بدون ماك | ❌ محتاج ماك |

**التوصية:** ابدأ بـ **EAS Build** دلوقتي عشان تشوف التطبيق شغال على تليفونك النهاردة.
لو لقيت نفسك بتبني كل يوم، ثبّت Android Studio بعدين.

---

## الحل الأخير: تنزيل المشروع لـ SDK 54

ما بنصحش بيه — بتخسر سنة كاملة من التحسينات، وهتضطر ترجع تحدّث قبل النشر على
المتاجر لأنهم بيطلبوا إصدارات حديثة. بس لو محتاج تشوف حاجة بسرعة النهاردة:

```powershell
npm install expo@~54.0.0
npx expo install --fix
npx expo start -c
```

> لو عملت كده وقررت ترجع، `npm install expo@~57.0.0` ثم `npx expo install --fix`.

---

## مشاكل شائعة

| المشكلة | الحل |
|---|---|
| `eas: command not found` | استخدم `npx eas-cli@latest` |
| **`npm ci can only install packages when package.json and package-lock.json are in sync`** | اللوك مش متطابق مع package.json. شغّل `npm install` ثم **اعمل commit للملفين** وأعد البناء |
| `Missing: <pkg>@x.y.z from lock file` | نفس السبب فوق. لو الحزمة `typescript`، تأكد إن مفيش `eas-cli` في devDependencies |
| البناء بيبني نسخة قديمة | EAS بيقرا من git. اعمل `git add -A && git commit` قبل البناء |
| البناء فشل عند Gradle | شوف اللوج الكامل على expo.dev — غالبًا تعارض إصدارات، شغّل `npx expo install --fix` |
| التطبيق بيفتح ويقفل فورًا | ملف `.env` ناقص. متغيّرات `EXPO_PUBLIC_` بتتحط وقت البناء |
| «Unable to connect» بعد فتح الـ dev build | تأكد إنك شغّلت `npx expo start --dev-client` مش `npx expo start` |
| نفد رصيد البناء المجاني | البناء المحلي مالوش حد |

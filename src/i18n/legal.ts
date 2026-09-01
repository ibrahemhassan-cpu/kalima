/**
 * Privacy policy and terms, in both languages.
 *
 * These live here rather than in ar.json/en.json because they're long-form
 * prose with structure, not interface strings — and because a legal document
 * has to be readable and reviewable as one piece.
 *
 * ⚖️ The Arabic text is the authoritative version. The English is a
 * convenience translation, and says so in `note`. If you ever want both to
 * carry equal legal weight, have a lawyer review the pair first.
 */

export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "bullet"; label?: string; text: string }
  | { kind: "email" };

export type LegalSection = { title: string; blocks: LegalBlock[] };

export type LegalDoc = {
  /** shown under the title */
  note?: string;
  sections: LegalSection[];
};

export const LAST_UPDATED = { ar: "17 أغسطس 2026", en: "17 August 2026" };
export const CONTACT_EMAIL = "hibrahem266@gmail.com";

const p = (text: string): LegalBlock => ({ kind: "p", text });
const strong = (text: string): LegalBlock => ({ kind: "strong", text });
const b = (text: string, label?: string): LegalBlock => ({
  kind: "bullet",
  text,
  label,
});
const email: LegalBlock = { kind: "email" };

// ═══════════════════════════════════════════════════════════
// الخصوصية
// ═══════════════════════════════════════════════════════════
const privacyAr: LegalDoc = {
  sections: [
    {
      title: "الخلاصة",
      blocks: [
        p(
          "بنجمع أقل قدر ممكن من البيانات: إيميلك واسمك والكلمات اللي بتضيفها. ما بنبيعش بياناتك لأي حد، وما بنعرضش إعلانات. تقدر تنزّل بياناتك أو تمسح حسابك بالكامل من داخل التطبيق في أي وقت.",
        ),
      ],
    },
    {
      title: "البيانات اللي بنجمعها",
      blocks: [
        b("الإيميل، الاسم، وصورة البروفايل لو رفعتها.", "بيانات الحساب:"),
        b(
          "الكلمات اللي بتضيفها، ملاحظاتك الشخصية عليها، سجل مراجعاتك، نقاطك، ومستواك.",
          "بيانات التعلّم:",
        ),
        b(
          "الثيم، حجم الخط، اللغة، هدفك اليومي، ومواعيد التذكير.",
          "إعدادات التطبيق:",
        ),
        b(
          "نوع الجهاز ونظام التشغيل وتقارير الأعطال — لإصلاح المشاكل فقط.",
          "بيانات تقنية:",
        ),
        p(
          "ما بنجمعش موقعك الجغرافي ولا جهات اتصالك ولا صورك (غير الصورة اللي تختار ترفعها بنفسك).",
        ),
      ],
    },
    {
      title: "ليه بنجمعها",
      blocks: [
        b("عشان نحفظ تقدّمك ويظهر على أي جهاز تسجّل دخول منه."),
        b("عشان نحسب مواعيد المراجعة والستريك بتوقيتك المحلي."),
        b("عشان نظبط صعوبة الشرح على مستواك في الإنجليزي."),
        b("عشان نبعتلك التذكير في المواعيد اللي اخترتها لو مفعّل."),
      ],
    },
    {
      title: "مين بيشوف بياناتك",
      blocks: [
        p(
          "بياناتك محمية بسياسات أمان على مستوى الصف (Row Level Security) — يعني كل مستخدم يقدر يقرا صفوفه هو بس، حتى لو حاول غير كده.",
        ),
        p("بنستعين بالخدمات دي، وكل واحدة بتشوف الجزء اللي تحتاجه بس:"),
        b(
          "تخزين قاعدة البيانات والمصادقة والملفات. البيانات مخزّنة على خوادم في أوروبا (فرانكفورت).",
          "Supabase —",
        ),
        b(
          "لما تضيف كلمة جديدة، الكلمة نفسها بس بتتبعت لخوادم Google عشان نولّد الترجمة والأمثلة. ما بنبعتش إيميلك ولا اسمك ولا أي بيانات تعرّفك. الكلمة الواحدة بتتولّد مرة واحدة وبتتخزّن عندنا، فالكلمات الشائعة ما بتوصلش لـ Google أصلًا.",
          "Google Gemini —",
        ),
        b("تحديثات التطبيق وتقارير الأعطال.", "Expo —"),
        p("ما بنبيعش بياناتك ولا بنأجّرها ولا بنشاركها لأغراض إعلانية. أبدًا."),
      ],
    },
    {
      title: "المحتوى المولّد بالـ AI",
      blocks: [
        p(
          "الترجمات والتعريفات والأمثلة وحيل الحفظ والأسئلة في التطبيق مولّدة آليًا بالذكاء الاصطناعي. بنبذل مجهود إنها تبقى دقيقة، لكنها ممكن تحتوي أخطاء. لو لقيت ترجمة غلط، تقدر تصحّحها بنفسك من شاشة الكلمة — والتصحيح بيبان لك إنت بس. ما تعتمدش عليها في سياقات حسّاسة زي الترجمة القانونية أو الطبية.",
        ),
      ],
    },
    {
      title: "مدة الاحتفاظ",
      blocks: [
        p(
          "بنحتفظ ببياناتك طول ما حسابك موجود. لما تحذف حسابك، بيتمسح كل شيء مرتبط بيك فورًا ونهائيًا.",
        ),
        p(
          "الكلمات اللي اتولّدت بالـ AI بتفضل في قاموسنا المشترك بعد الحذف، لكنها مجهولة المصدر تمامًا ومش مربوطة بيك بأي شكل — زي مدخل في قاموس عادي.",
        ),
      ],
    },
    {
      title: "حقوقك",
      blocks: [
        b(
          "«الإعدادات ← الحساب ← نزّل بياناتي» بيديك ملف JSON بكل حاجة.",
          "الاطلاع والتصدير:",
        ),
        b("تقدر تغيّر اسمك وصورتك وإعداداتك في أي وقت.", "التعديل:"),
        b("«الإعدادات ← الحساب ← حذف الحساب». الحذف فوري ونهائي.", "الحذف:"),
        b("راسلنا على الإيميل تحت.", "الاعتراض والشكوى:"),
      ],
    },
    {
      title: "الأمان",
      blocks: [
        p(
          "الاتصال بالسيرفر مشفّر بالكامل (HTTPS). توكن الجلسة على جهازك متخزّن في الـ Keychain على آيفون والـ Keystore على أندرويد — مش في تخزين عادي. كلمات المرور مخزّنة مشفّرة عند Supabase وإحنا نفسنا ما بنشوفهاش.",
        ),
      ],
    },
    {
      title: "الأطفال",
      blocks: [
        p(
          "التطبيق مش موجّه لمن هم دون 13 سنة، وما بنجمعش بيانات عنهم عن قصد. لو كنت ولي أمر واكتشفت إن طفلك عمل حساب، راسلنا وهنمسحه فورًا.",
        ),
      ],
    },
    {
      title: "تغييرات على السياسة",
      blocks: [
        p(
          "لو غيّرنا حاجة جوهرية، هنبلّغك داخل التطبيق قبل ما التغيير يسري. تاريخ آخر تحديث دايمًا مكتوب فوق.",
        ),
      ],
    },
    {
      title: "تواصل معانا",
      blocks: [p("لأي سؤال أو طلب يخص بياناتك:"), email],
    },
  ],
};

const privacyEn: LegalDoc = {
  note: "This English text is a translation provided for convenience. The Arabic version is the authoritative one.",
  sections: [
    {
      title: "In short",
      blocks: [
        p(
          "We collect as little as we can: your email, your name, and the words you add. We don't sell your data to anyone and we don't show ads. You can download your data or erase your account completely from inside the app at any time.",
        ),
      ],
    },
    {
      title: "What we collect",
      blocks: [
        b("Your email, your name, and a profile photo if you upload one.", "Account data:"),
        b(
          "The words you add, your personal notes on them, your review history, your points, and your level.",
          "Learning data:",
        ),
        b(
          "Theme, text size, language, your daily goal, and your reminder times.",
          "App settings:",
        ),
        b(
          "Device model, operating system, and crash reports — to fix problems, nothing else.",
          "Technical data:",
        ),
        p(
          "We do not collect your location, your contacts, or your photos (other than the one you choose to upload yourself).",
        ),
      ],
    },
    {
      title: "Why we collect it",
      blocks: [
        b("To keep your progress and show it on any device you sign in from."),
        b("To work out review times and your streak in your local timezone."),
        b("To pitch the explanations at your level of English."),
        b("To send reminders at the times you picked, if you enabled them."),
      ],
    },
    {
      title: "Who can see your data",
      blocks: [
        p(
          "Your data is protected by Row Level Security — every user can read only their own rows, even if they try otherwise.",
        ),
        p("We rely on these services, and each sees only the part it needs:"),
        b(
          "Database storage, authentication and files. Data is stored on servers in Europe (Frankfurt).",
          "Supabase —",
        ),
        b(
          "When you add a new word, only the word itself is sent to Google's servers so we can generate the translation and examples. We never send your email, your name, or anything that identifies you. Each word is generated once and stored with us, so common words never reach Google at all.",
          "Google Gemini —",
        ),
        b("App updates and crash reports.", "Expo —"),
        p(
          "We do not sell your data, rent it, or share it for advertising. Ever.",
        ),
      ],
    },
    {
      title: "AI-generated content",
      blocks: [
        p(
          "The translations, definitions, examples, memory hooks and questions in the app are generated automatically by AI. We work to keep them accurate, but they may contain mistakes. If a translation is wrong you can correct it yourself from the word screen — your correction is visible only to you. Don't rely on them in sensitive contexts such as legal or medical translation.",
        ),
      ],
    },
    {
      title: "How long we keep it",
      blocks: [
        p(
          "We keep your data for as long as your account exists. When you delete your account, everything tied to you is erased immediately and permanently.",
        ),
        p(
          "Words generated by the AI stay in our shared dictionary after deletion, but they are fully anonymous and not linked to you in any way — like an entry in an ordinary dictionary.",
        ),
      ],
    },
    {
      title: "Your rights",
      blocks: [
        b(
          "Settings → Account → Download my data gives you a JSON file with everything.",
          "Access and export:",
        ),
        b("You can change your name, photo and settings at any time.", "Correction:"),
        b(
          "Settings → Account → Delete account. Deletion is immediate and permanent.",
          "Deletion:",
        ),
        b("Write to us at the email below.", "Objections and complaints:"),
      ],
    },
    {
      title: "Security",
      blocks: [
        p(
          "The connection to the server is fully encrypted (HTTPS). Your session token is stored in the Keychain on iPhone and the Keystore on Android — not in ordinary storage. Passwords are stored hashed by Supabase and we never see them ourselves.",
        ),
      ],
    },
    {
      title: "Children",
      blocks: [
        p(
          "The app is not intended for anyone under 13, and we do not knowingly collect data about them. If you are a parent and discover your child has created an account, write to us and we'll erase it right away.",
        ),
      ],
    },
    {
      title: "Changes to this policy",
      blocks: [
        p(
          "If we change something material, we'll tell you inside the app before it takes effect. The last-updated date is always shown above.",
        ),
      ],
    },
    {
      title: "Contact us",
      blocks: [p("For any question or request about your data:"), email],
    },
  ],
};

// ═══════════════════════════════════════════════════════════
// الشروط
// ═══════════════════════════════════════════════════════════
const termsAr: LegalDoc = {
  sections: [
    {
      title: "١. الخدمة",
      blocks: [
        p(
          "«كلمة» تطبيق لتعلّم مفردات اللغة الإنجليزية بنظام المراجعة المتباعدة. بتضيف الكلمات اللي بتنساها، والتطبيق بيولّد شرحها بالذكاء الاصطناعي ويفكّرك بيها في المواعيد المناسبة.",
        ),
        p(
          "استخدامك للتطبيق يعني موافقتك على الشروط دي. لو مش موافق على أي بند، من فضلك ما تستخدمش التطبيق.",
        ),
      ],
    },
    {
      title: "٢. الأهلية",
      blocks: [
        p(
          "لازم يكون عمرك 13 سنة على الأقل. لو أقل من 18، لازم يكون عندك موافقة ولي أمرك.",
        ),
      ],
    },
    {
      title: "٣. حسابك",
      blocks: [
        b("أنت مسؤول عن سرية كلمة المرور وعن كل نشاط يتم من حسابك."),
        b("لازم تدّي بيانات صحيحة عند التسجيل."),
        b("حساب واحد للشخص الواحد."),
        b("بلّغنا فورًا لو شكّيت إن حد دخل على حسابك."),
      ],
    },
    {
      title: "٤. الاستخدام المقبول",
      blocks: [
        p("ممنوع إنك:"),
        b("تكتب في الملاحظات محتوى مسيء أو غير قانوني أو ينتهك حقوق غيرك."),
        b("تستخدم التطبيق بشكل آلي (bots / scripts) أو تحاول تستنزف موارد الخدمة."),
        b("تحاول تتحايل على حدود الاستخدام أو توصل لبيانات مستخدمين تانيين."),
        b("تعمل هندسة عكسية للتطبيق أو تحاول تخترقه أو تختبر ثغراته بدون إذن مكتوب."),
        b("تستخدم مولّد الشرح لأي غرض غير تعلّم المفردات."),
      ],
    },
    {
      title: "٥. المحتوى المولّد بالذكاء الاصطناعي",
      blocks: [
        p("الترجمات والتعريفات والأمثلة وحيل الحفظ والأسئلة مولّدة آليًا."),
        strong("إحنا ما بنضمنش دقتها أو اكتمالها أو خلوّها من الأخطاء."),
        p(
          "ما تعتمدش على مخرجات التطبيق في أي سياق حسّاس — ترجمة قانونية أو طبية أو رسمية أو أي قرار مهم. المسؤولية عن التحقق من المعلومة تقع عليك.",
        ),
        p("لو لقيت ترجمة غلط، تقدر تصحّحها بنفسك من شاشة الكلمة، والتصحيح بيتحفظ على نسختك من الكلمة وحدها."),
      ],
    },
    {
      title: "٦. المحتوى بتاعك",
      blocks: [
        p(
          "ملاحظاتك الشخصية وأمثلتك اللي بتكتبها ملكك أنت. إحنا بنخزّنها عشان نعرض لك إياها وبس، وما بنستخدمهاش لأي غرض تاني ولا بنشاركها مع حد.",
        ),
        p(
          "الكلمات اللي بتضيفها بتتحوّل لمدخل في قاموسنا المشترك عشان أي مستخدم تاني ياخدها من غير ما نستهلك موارد جديدة. المدخل ده مجهول المصدر ومش مربوط بيك.",
        ),
      ],
    },
    {
      title: "٧. حدود الاستخدام",
      blocks: [
        p(
          "فيه حد يومي لعدد الكلمات الجديدة اللي تقدر تولّدها بالـ AI، عشان الخدمة تفضل متاحة ومجانية للجميع. مراجعة كلماتك المحفوظة مالهاش أي حد.",
        ),
      ],
    },
    {
      title: "٨. توفّر الخدمة",
      blocks: [
        p(
          "بنحاول التطبيق يشتغل طول الوقت، لكن إحنا ما بنضمنش إنه هيكون متاح بدون انقطاع. ممكن نوقف الخدمة مؤقتًا للصيانة أو نغيّر مميزاتها أو نوقفها نهائيًا — وفي الحالة الأخيرة هنبلّغك مقدمًا بوقت كافي عشان تنزّل بياناتك.",
        ),
      ],
    },
    {
      title: "٩. إنهاء الحساب",
      blocks: [
        p("تقدر تحذف حسابك في أي لحظة من «الإعدادات ← الحساب». الحذف نهائي وفوري."),
        p(
          "وإحنا نقدر نوقف حسابك لو خالفت الشروط دي بشكل جسيم أو متكرر، بعد تنبيهك لما يكون ده ممكنًا.",
        ),
      ],
    },
    {
      title: "١٠. إخلاء المسؤولية",
      blocks: [
        p(
          "التطبيق مقدّم «كما هو» بدون أي ضمانات صريحة أو ضمنية. إحنا مش مسؤولين عن أي خسارة مباشرة أو غير مباشرة ناتجة عن استخدامك للتطبيق أو الاعتماد على محتواه.",
        ),
      ],
    },
    {
      title: "١١. تعديل الشروط",
      blocks: [
        p(
          "ممكن نعدّل الشروط دي. لو التعديل جوهري، هنبلّغك داخل التطبيق. استمرارك في الاستخدام بعد التعديل يعني موافقتك عليه.",
        ),
      ],
    },
    { title: "١٢. تواصل معانا", blocks: [email] },
  ],
};

const termsEn: LegalDoc = {
  note: "This English text is a translation provided for convenience. The Arabic version is the authoritative one.",
  sections: [
    {
      title: "1. The service",
      blocks: [
        p(
          "Kalima is an app for learning English vocabulary using spaced repetition. You add the words you keep forgetting, the app generates their explanation with AI, and reminds you of them at the right moments.",
        ),
        p(
          "Using the app means you accept these terms. If you don't agree with any of them, please don't use the app.",
        ),
      ],
    },
    {
      title: "2. Eligibility",
      blocks: [
        p(
          "You must be at least 13 years old. If you're under 18, you need your guardian's consent.",
        ),
      ],
    },
    {
      title: "3. Your account",
      blocks: [
        b("You are responsible for keeping your password secret and for all activity on your account."),
        b("You must give accurate information when you register."),
        b("One account per person."),
        b("Tell us immediately if you suspect someone has accessed your account."),
      ],
    },
    {
      title: "4. Acceptable use",
      blocks: [
        p("You may not:"),
        b("Write abusive or unlawful content in your notes, or content that infringes anyone's rights."),
        b("Use the app through automation (bots or scripts), or try to drain the service's resources."),
        b("Try to get around usage limits, or reach other users' data."),
        b("Reverse-engineer the app, attempt to breach it, or probe it for vulnerabilities without written permission."),
        b("Use the explanation generator for any purpose other than learning vocabulary."),
      ],
    },
    {
      title: "5. AI-generated content",
      blocks: [
        p(
          "The translations, definitions, examples, memory hooks and questions are generated automatically.",
        ),
        strong(
          "We do not guarantee that they are accurate, complete, or free of errors.",
        ),
        p(
          "Do not rely on the app's output in any sensitive context — legal, medical or official translation, or any important decision. Verifying the information is your responsibility.",
        ),
        p(
          "If a translation is wrong you can correct it yourself from the word screen; the correction is saved against your copy of the word alone.",
        ),
      ],
    },
    {
      title: "6. Your content",
      blocks: [
        p(
          "The personal notes and examples you write are yours. We store them only to show them back to you; we don't use them for anything else and we don't share them with anyone.",
        ),
        p(
          "Words you add become an entry in our shared dictionary so any other user can get them without spending fresh resources. That entry is anonymous and not linked to you.",
        ),
      ],
    },
    {
      title: "7. Usage limits",
      blocks: [
        p(
          "There is a daily cap on how many new words you can generate with the AI, so the service stays available and free for everyone. Reviewing the words you've already saved is never capped.",
        ),
      ],
    },
    {
      title: "8. Availability",
      blocks: [
        p(
          "We try to keep the app running all the time, but we don't guarantee uninterrupted availability. We may pause the service for maintenance, change its features, or discontinue it — and in that last case we'll give you enough notice to download your data.",
        ),
      ],
    },
    {
      title: "9. Ending your account",
      blocks: [
        p(
          "You can delete your account at any moment from Settings → Account. Deletion is permanent and immediate.",
        ),
        p(
          "We may suspend your account if you breach these terms seriously or repeatedly, after warning you where that's possible.",
        ),
      ],
    },
    {
      title: "10. Disclaimer",
      blocks: [
        p(
          'The app is provided "as is" without warranties of any kind, express or implied. We are not liable for any direct or indirect loss arising from your use of the app or reliance on its content.',
        ),
      ],
    },
    {
      title: "11. Changes to these terms",
      blocks: [
        p(
          "We may amend these terms. If an amendment is material, we'll tell you inside the app. Continuing to use the app afterwards means you accept it.",
        ),
      ],
    },
    { title: "12. Contact us", blocks: [email] },
  ],
};

export const legalDocs = {
  ar: { privacy: privacyAr, terms: termsAr },
  en: { privacy: privacyEn, terms: termsEn },
} as const;

export function legalFor(
  lang: string,
  doc: "privacy" | "terms",
): { content: LegalDoc; lastUpdated: string } {
  const key = lang.startsWith("ar") ? "ar" : "en";
  return { content: legalDocs[key][doc], lastUpdated: LAST_UPDATED[key] };
}

import React from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Screen, Text } from "@/components/ui";
import { Header } from "@/components/ui";
import { Bullet, P, Section } from "@/components/LegalText";

export const LAST_UPDATED = "12 أغسطس 2026";
export const CONTACT_EMAIL = "hibrahem266@gmail.com";

export default function Privacy() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Screen scroll>
      <Header title={t("profile.privacy")} onBack={() => router.back()} language={false} />
      <Text variant="caption" tone="faint">
        آخر تحديث: {LAST_UPDATED}
      </Text>

      <Section title="الخلاصة">
        <P>
          بنجمع أقل قدر ممكن من البيانات: إيميلك واسمك والكلمات اللي بتضيفها. ما
          بنبيعش بياناتك لأي حد، وما بنعرضش إعلانات. تقدر تنزّل بياناتك أو تمسح
          حسابك بالكامل من داخل التطبيق في أي وقت.
        </P>
      </Section>

      <Section title="البيانات اللي بنجمعها">
        <Bullet>
          <Text variant="bodyStrong">بيانات الحساب:</Text> الإيميل، الاسم، وصورة
          البروفايل لو رفعتها.
        </Bullet>
        <Bullet>
          <Text variant="bodyStrong">بيانات التعلّم:</Text> الكلمات اللي بتضيفها،
          ملاحظاتك الشخصية عليها، سجل مراجعاتك، نقاطك، ومستواك.
        </Bullet>
        <Bullet>
          <Text variant="bodyStrong">إعدادات التطبيق:</Text> الثيم، حجم الخط، اللغة،
          هدفك اليومي، ووقت التذكير.
        </Bullet>
        <Bullet>
          <Text variant="bodyStrong">بيانات تقنية:</Text> نوع الجهاز ونظام التشغيل
          وتقارير الأعطال — لإصلاح المشاكل فقط.
        </Bullet>
        <P>
          ما بنجمعش موقعك الجغرافي ولا جهات اتصالك ولا صورك (غير الصورة اللي تختار
          ترفعها بنفسك).
        </P>
      </Section>

      <Section title="ليه بنجمعها">
        <Bullet>عشان نحفظ تقدّمك ويظهر على أي جهاز تسجّل دخول منه.</Bullet>
        <Bullet>عشان نحسب مواعيد المراجعة والستريك بتوقيتك المحلي.</Bullet>
        <Bullet>عشان نظبط صعوبة الشرح على مستواك في الإنجليزي.</Bullet>
        <Bullet>عشان نبعتلك التذكير اليومي لو مفعّله.</Bullet>
      </Section>

      <Section title="مين بيشوف بياناتك">
        <P>
          بياناتك محمية بسياسات أمان على مستوى الصف (Row Level Security) — يعني كل
          مستخدم يقدر يقرا صفوفه هو بس، حتى لو حاول غير كده.
        </P>
        <P>بنستعين بالخدمات دي، وكل واحدة بتشوف الجزء اللي تحتاجه بس:</P>
        <Bullet>
          <Text variant="bodyStrong">Supabase</Text> — تخزين قاعدة البيانات
          والمصادقة والملفات. البيانات مخزّنة على خوادم في أوروبا (فرانكفورت).
        </Bullet>
        <Bullet>
          <Text variant="bodyStrong">Google Gemini</Text> — لما تضيف كلمة جديدة،
          <Text variant="bodyStrong"> الكلمة نفسها بس</Text> بتتبعت لخوادم Google
          عشان نولّد الترجمة والأمثلة. ما بنبعتش إيميلك ولا اسمك ولا أي بيانات
          تعرّفك. الكلمة الواحدة بتتولّد مرة واحدة وبتتخزّن عندنا، فالكلمات الشائعة
          ما بتوصلش لـ Google أصلًا.
        </Bullet>
        <Bullet>
          <Text variant="bodyStrong">Expo</Text> — تحديثات التطبيق وتقارير الأعطال.
        </Bullet>
        <P>ما بنبيعش بياناتك ولا بنأجّرها ولا بنشاركها لأغراض إعلانية. أبدًا.</P>
      </Section>

      <Section title="المحتوى المولّد بالـ AI">
        <P>
          الترجمات والتعريفات والأمثلة وحيل الحفظ في التطبيق مولّدة آليًا بالذكاء
          الاصطناعي. بنبذل مجهود إنها تبقى دقيقة، لكنها ممكن تحتوي أخطاء. تقدر تعدّل
          أي حقل بنفسك أو تبلّغنا عن خطأ. ما تعتمدش عليها في سياقات حسّاسة زي
          الترجمة القانونية أو الطبية.
        </P>
      </Section>

      <Section title="مدة الاحتفاظ">
        <P>
          بنحتفظ ببياناتك طول ما حسابك موجود. لما تحذف حسابك، بيتمسح كل شيء مرتبط
          بيك فورًا ونهائيًا.
        </P>
        <P>
          الكلمات اللي اتولّدت بالـ AI بتفضل في قاموسنا المشترك بعد الحذف، لكنها
          مجهولة المصدر تمامًا ومش مربوطة بيك بأي شكل — زي مدخل في قاموس عادي.
        </P>
      </Section>

      <Section title="حقوقك">
        <Bullet>
          <Text variant="bodyStrong">الاطلاع والتصدير:</Text> «الإعدادات ← الحساب ←
          نزّل بياناتي» بيديك ملف JSON بكل حاجة.
        </Bullet>
        <Bullet>
          <Text variant="bodyStrong">التعديل:</Text> تقدر تغيّر اسمك وصورتك وإعداداتك
          في أي وقت.
        </Bullet>
        <Bullet>
          <Text variant="bodyStrong">الحذف:</Text> «الإعدادات ← الحساب ← حذف الحساب».
          الحذف فوري ونهائي.
        </Bullet>
        <Bullet>
          <Text variant="bodyStrong">الاعتراض والشكوى:</Text> راسلنا على الإيميل تحت.
        </Bullet>
      </Section>

      <Section title="الأمان">
        <P>
          الاتصال بالسيرفر مشفّر بالكامل (HTTPS). توكن الجلسة على جهازك متخزّن في
          الـ Keychain على آيفون والـ Keystore على أندرويد — مش في تخزين عادي. كلمات
          المرور مخزّنة مشفّرة عند Supabase وإحنا نفسنا ما بنشوفهاش.
        </P>
      </Section>

      <Section title="الأطفال">
        <P>
          التطبيق مش موجّه لمن هم دون 13 سنة، وما بنجمعش بيانات عنهم عن قصد. لو كنت
          ولي أمر واكتشفت إن طفلك عمل حساب، راسلنا وهنمسحه فورًا.
        </P>
      </Section>

      <Section title="تغييرات على السياسة">
        <P>
          لو غيّرنا حاجة جوهرية، هنبلّغك داخل التطبيق قبل ما التغيير يسري. تاريخ آخر
          تحديث دايمًا مكتوب فوق.
        </P>
      </Section>

      <Section title="تواصل معانا">
        <P>لأي سؤال أو طلب يخص بياناتك:</P>
        <Text variant="body" tone="brand" ltr>
          {CONTACT_EMAIL}
        </Text>
      </Section>
    </Screen>
  );
}

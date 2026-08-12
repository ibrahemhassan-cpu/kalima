import { I18nManager, Platform } from "react-native";
import * as Updates from "expo-updates";
import i18n from "./index";
import type { UILanguage } from "@/store/settings";

export const isRTL = () => I18nManager.isRTL;

/**
 * React Native يحتاج إعادة تحميل كاملة لتبديل اتجاه الواجهة.
 * نستدعي هذه الدالة فقط عند تغيير اللغة من الإعدادات.
 */
export async function applyLanguage(lang: UILanguage) {
  await i18n.changeLanguage(lang);
  const shouldBeRTL = lang === "ar";

  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);

    if (__DEV__) {
      // في وضع التطوير أعد التحميل يدويًا من قائمة المطوّر
      console.warn("[rtl] direction changed — reload the app to apply");
      return;
    }
    try {
      await Updates.reloadAsync();
    } catch {
      // إعادة التحميل غير متاحة (Expo Go مثلًا) — سيُطبَّق عند الفتح القادم
    }
  }
}

/**
 * الكلمة الإنجليزية يجب أن تبقى LTR دائمًا حتى داخل واجهة عربية،
 * وإلا تتحرك علامات الترقيم لمكان غلط.
 */
export const ltrText = {
  writingDirection: "ltr" as const,
  textAlign: (I18nManager.isRTL ? "right" : "left") as "right" | "left",
};

/** اقلب الأيقونات الاتجاهية (سهم رجوع، سهم التالي) في وضع RTL */
export const flipForRTL = {
  transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }],
};

/** أندرويد يحتاج تفعيل RTL على مستوى النظام مرة واحدة */
export function ensureRTLAllowed() {
  if (Platform.OS === "android") {
    I18nManager.allowRTL(true);
  }
}

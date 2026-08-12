import type { TextStyle } from "react-native";

/**
 * أربع درجات لحجم الخط يختارها المستخدم من الإعدادات.
 * الأساس 17pt — أكبر من المعتاد عمدًا لأن التطبيق موجّه لكل الأعمار.
 */
export const fontScales = { sm: 0.9, md: 1, lg: 1.15, xl: 1.32 } as const;
export type FontScaleName = keyof typeof fontScales;

export const fontScaleLabels: Record<FontScaleName, string> = {
  sm: "صغير",
  md: "عادي",
  lg: "كبير",
  xl: "كبير جدًا",
};

export type TypeScale = {
  display: TextStyle;
  word: TextStyle;
  title: TextStyle;
  heading: TextStyle;
  body: TextStyle;
  bodyStrong: TextStyle;
  label: TextStyle;
  caption: TextStyle;
};

export function makeTypography(scale: number): TypeScale {
  const s = (n: number) => Math.round(n * scale);
  return {
    display: { fontSize: s(34), lineHeight: s(44), fontWeight: "700" },
    /** الكلمة الإنجليزية في شاشة التفاصيل والكروت */
    word: { fontSize: s(32), lineHeight: s(42), fontWeight: "700" },
    title: { fontSize: s(24), lineHeight: s(34), fontWeight: "700" },
    heading: { fontSize: s(19), lineHeight: s(28), fontWeight: "600" },
    body: { fontSize: s(17), lineHeight: s(28), fontWeight: "400" },
    bodyStrong: { fontSize: s(17), lineHeight: s(28), fontWeight: "600" },
    label: { fontSize: s(15), lineHeight: s(22), fontWeight: "600" },
    caption: { fontSize: s(13), lineHeight: s(20), fontWeight: "400" },
  };
}

/**
 * الحد الأدنى لأي عنصر قابل للضغط.
 * 48dp هو المعيار في Material و WCAG — ولا نتنازل عنه.
 */
export const MIN_TOUCH = 48;

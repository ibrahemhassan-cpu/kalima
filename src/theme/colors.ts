/**
 * ألوان كلمة.
 * كل الألوان هنا وبس. تغيير الهوية بعدين = تعديل هذا الملف فقط.
 */

export const palette = {
  brand: "#3B5BFF",
  brandDark: "#2843C8",
  accent: "#FF9F1C", // الستريك والإنجازات فقط
  success: "#16A34A",
  danger: "#E03B3B",
  warning: "#D97706",
} as const;

export type Colors = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textFaint: string;

  brand: string;
  brandDark: string;
  brandSoft: string;
  onBrand: string;

  accent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  onDanger: string;
  warning: string;

  /** ألوان أزرار التقييم الأربعة: نسيت · صعبة · تمام · سهلة */
  rating: readonly [string, string, string, string];

  overlay: string;
};

export const light: Colors = {
  bg: "#FFFFFF",
  surface: "#F5F7FC",
  surfaceAlt: "#EDF1F9",
  border: "#DCE3EF",
  borderStrong: "#C3CEE2",
  text: "#0F1729",
  textMuted: "#5B6779",
  textFaint: "#8B96A8",

  brand: palette.brand,
  brandDark: palette.brandDark,
  brandSoft: "#E8ECFF",
  onBrand: "#FFFFFF",

  accent: palette.accent,
  accentSoft: "#FFF2DE",
  success: palette.success,
  successSoft: "#E4F6EA",
  danger: palette.danger,
  dangerSoft: "#FCE9E9",
  onDanger: "#FFFFFF",
  warning: palette.warning,

  rating: ["#E03B3B", "#D97706", "#16A34A", "#3B5BFF"],

  overlay: "rgba(15, 23, 41, 0.45)",
};

export const dark: Colors = {
  bg: "#0B1120",
  surface: "#151C2E",
  surfaceAlt: "#1E2739",
  border: "#2A3550",
  borderStrong: "#3B4763",
  text: "#E9EEF9",
  textMuted: "#9AA7BD",
  textFaint: "#6C7A93",

  brand: "#6C86FF", // أفتح للتباين على خلفية غامقة
  brandDark: "#4C6BFF",
  brandSoft: "#1B2440",
  onBrand: "#0B1120",

  accent: "#FFB347",
  accentSoft: "#33270F",
  success: "#34C76A",
  successSoft: "#12301E",
  danger: "#FF6B6B",
  dangerSoft: "#331717",
  onDanger: "#1A0B0B",
  warning: "#F0A93B",

  rating: ["#FF6B6B", "#F0A93B", "#34C76A", "#6C86FF"],

  overlay: "rgba(0, 0, 0, 0.6)",
};

export const themes = { light, dark } as const;
export type ThemeName = keyof typeof themes;

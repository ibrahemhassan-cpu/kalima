import type { TextStyle } from "react-native";

/** Four text sizes the user picks in settings. */
export const fontScales = { sm: 0.92, md: 1, lg: 1.14, xl: 1.3 } as const;
export type FontScaleName = keyof typeof fontScales;

export type TypeScale = {
  display: TextStyle;
  word: TextStyle;
  title: TextStyle;
  heading: TextStyle;
  body: TextStyle;
  bodyStrong: TextStyle;
  label: TextStyle;
  caption: TextStyle;
  micro: TextStyle;
};

export function makeTypography(scale: number): TypeScale {
  const s = (n: number) => Math.round(n * scale);
  return {
    // Tight tracking on large type is the modern tell.
    display: { fontSize: s(36), lineHeight: s(42), fontWeight: "700", letterSpacing: -1 },
    word: { fontSize: s(34), lineHeight: s(40), fontWeight: "700", letterSpacing: -0.8 },
    title: { fontSize: s(26), lineHeight: s(32), fontWeight: "700", letterSpacing: -0.5 },
    heading: { fontSize: s(19), lineHeight: s(26), fontWeight: "600", letterSpacing: -0.2 },
    body: { fontSize: s(16), lineHeight: s(25), fontWeight: "400" },
    bodyStrong: { fontSize: s(16), lineHeight: s(25), fontWeight: "600" },
    label: { fontSize: s(14), lineHeight: s(20), fontWeight: "600" },
    caption: { fontSize: s(13), lineHeight: s(19), fontWeight: "400" },
    micro: { fontSize: s(11), lineHeight: s(15), fontWeight: "600", letterSpacing: 0.6 },
  };
}

/** Minimum hit area for anything tappable. Never compromise this. */
export const MIN_TOUCH = 48;

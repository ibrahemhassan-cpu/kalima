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

/**
 * No `letterSpacing` anywhere, on purpose.
 *
 * Arabic is a joined script: negative tracking pulls connected glyphs into
 * each other and positive tracking breaks the joins outright. Tight tracking
 * is a Latin-display convention, and this interface is Arabic first — README
 * rule 9 forbids it, and the rule has to hold here or every screen inherits
 * the violation from the scale itself.
 *
 * Weight and size carry the hierarchy instead.
 */
export function makeTypography(scale: number): TypeScale {
  const s = (n: number) => Math.round(n * scale);
  return {
    display: { fontSize: s(36), lineHeight: s(44), fontWeight: "700" },
    word: { fontSize: s(34), lineHeight: s(42), fontWeight: "700" },
    title: { fontSize: s(26), lineHeight: s(34), fontWeight: "700" },
    heading: { fontSize: s(19), lineHeight: s(27), fontWeight: "600" },
    body: { fontSize: s(16), lineHeight: s(25), fontWeight: "400" },
    bodyStrong: { fontSize: s(16), lineHeight: s(25), fontWeight: "600" },
    label: { fontSize: s(14), lineHeight: s(21), fontWeight: "600" },
    caption: { fontSize: s(13), lineHeight: s(20), fontWeight: "400" },
    micro: { fontSize: s(11), lineHeight: s(16), fontWeight: "600" },
  };
}

/** Minimum hit area for anything tappable. Never compromise this. */
export const MIN_TOUCH = 48;

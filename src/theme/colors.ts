/**
 * Kalima design tokens.
 *
 * Aesthetic: near-monochrome canvas, one confident accent, translucent
 * surfaces, generous radii. Everything lives here — no hex outside this file.
 */

export type Colors = {
  // canvas
  bg: string;
  bgTop: string;
  bgBottom: string;

  // surfaces
  glass: string;
  glassStrong: string;
  solid: string;
  raised: string;
  sunken: string;

  // hairlines
  border: string;
  borderStrong: string;

  // type
  text: string;
  textMuted: string;
  textFaint: string;

  // accent
  brand: string;
  brandAlt: string;
  brandSoft: string;
  brandBorder: string;
  onBrand: string;

  // semantic
  accent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  onDanger: string;
  warning: string;
  warningSoft: string;

  /** forgot · hard · good · easy */
  rating: readonly [string, string, string, string];
  ratingSoft: readonly [string, string, string, string];

  // chips / badges state presets matching design system
  chipNewBg: string;
  chipNewFg: string;
  chipHardBg: string;
  chipHardFg: string;
  chipReviewBg: string;
  chipReviewFg: string;
  chipLearnedBg: string;
  chipLearnedFg: string;

  overlay: string;
  /** blur tint for expo-blur */
  blurTint: "light" | "dark";
  shadowColor: string;
};

export const light: Colors = {
  bg: "#F6F7FB",
  bgTop: "#FFFFFF",
  bgBottom: "#EFF1F8",

  glass: "rgba(255,255,255,0.72)",
  glassStrong: "rgba(255,255,255,0.90)",
  solid: "#FFFFFF",
  raised: "#FFFFFF",
  sunken: "#ECEEF5",

  border: "rgba(11,13,20,0.07)",
  borderStrong: "rgba(11,13,20,0.14)",

  text: "#0B0D14",
  textMuted: "#5C6373",
  textFaint: "#98A0B2",

  brand: "#5B5BF5",
  brandAlt: "#8B5CF6",
  brandSoft: "rgba(91,91,245,0.10)",
  brandBorder: "rgba(91,91,245,0.22)",
  onBrand: "#FFFFFF",

  accent: "#FF8A3D",
  accentSoft: "rgba(255,138,61,0.12)",
  success: "#10B981",
  successSoft: "rgba(16,185,129,0.12)",
  danger: "#F43F5E",
  dangerSoft: "rgba(244,63,94,0.10)",
  onDanger: "#FFFFFF",
  warning: "#E08600",
  warningSoft: "rgba(224,134,0,0.12)",

  rating: ["#F43F5E", "#FF8A3D", "#10B981", "#5B5BF5"],
  ratingSoft: [
    "rgba(244,63,94,0.10)",
    "rgba(255,138,61,0.12)",
    "rgba(16,185,129,0.12)",
    "rgba(91,91,245,0.10)",
  ],

  chipNewBg: "rgba(91,91,245,0.10)",
  chipNewFg: "#5B5BF5",
  chipHardBg: "rgba(255,138,61,0.12)",
  chipHardFg: "#FF8A3D",
  chipReviewBg: "rgba(59,130,246,0.12)",
  chipReviewFg: "#3B82F6",
  chipLearnedBg: "rgba(16,185,129,0.12)",
  chipLearnedFg: "#10B981",

  overlay: "rgba(11,13,20,0.42)",
  blurTint: "light",
  shadowColor: "#0B0D14",
};

export const dark: Colors = {
  bg: "#08090E",
  bgTop: "#12141C",
  bgBottom: "#08090E",

  glass: "rgba(255,255,255,0.06)",
  glassStrong: "rgba(255,255,255,0.10)",
  solid: "#12141C",
  raised: "#171A24",
  sunken: "#0D0F16",

  border: "rgba(255,255,255,0.09)",
  borderStrong: "rgba(255,255,255,0.16)",

  text: "#F2F4FA",
  textMuted: "#9BA3B6",
  textFaint: "#666E80",

  brand: "#8080FF",
  brandAlt: "#A78BFA",
  brandSoft: "rgba(128,128,255,0.18)",
  brandBorder: "rgba(128,128,255,0.32)",
  onBrand: "#FFFFFF",

  accent: "#FF9F5A",
  accentSoft: "rgba(255,159,90,0.16)",
  success: "#34D399",
  successSoft: "rgba(52,211,153,0.16)",
  danger: "#FB7185",
  dangerSoft: "rgba(251,113,133,0.16)",
  onDanger: "#FFFFFF",
  warning: "#FBBF24",
  warningSoft: "rgba(251,191,36,0.16)",

  rating: ["#FB7185", "#FF9F5A", "#34D399", "#8080FF"],
  ratingSoft: [
    "rgba(251,113,133,0.16)",
    "rgba(255,159,90,0.16)",
    "rgba(52,211,153,0.16)",
    "rgba(128,128,255,0.18)",
  ],

  chipNewBg: "rgba(128,128,255,0.18)",
  chipNewFg: "#8080FF",
  chipHardBg: "rgba(255,159,90,0.18)",
  chipHardFg: "#FF9F5A",
  chipReviewBg: "rgba(96,165,250,0.18)",
  chipReviewFg: "#60A5FA",
  chipLearnedBg: "rgba(52,211,153,0.18)",
  chipLearnedFg: "#34D399",

  overlay: "rgba(0,0,0,0.66)",
  blurTint: "dark",
  shadowColor: "#000000",
};

export const themes = { light, dark } as const;
export type ThemeName = keyof typeof themes;

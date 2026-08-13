import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { useSettings } from "@/store/settings";
import { type Colors, themes } from "./colors";
import { makeShadows, radius, type Shadows, spacing, spring } from "./spacing";
import {
  fontScales,
  makeTypography,
  MIN_TOUCH,
  type TypeScale,
} from "./typography";

export type Theme = {
  colors: Colors;
  type: TypeScale;
  spacing: typeof spacing;
  radius: typeof radius;
  shadow: Shadows;
  spring: typeof spring;
  isDark: boolean;
  simpleMode: boolean;
  minTouch: number;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const pref = useSettings((s) => s.theme);
  const fontScale = useSettings((s) => s.fontScale);
  const simpleMode = useSettings((s) => s.simpleMode);

  const isDark = pref === "system" ? systemScheme === "dark" : pref === "dark";

  const value = useMemo<Theme>(() => {
    // Simple mode bumps one step up the scale.
    const bumped: Record<string, number> = {
      sm: fontScales.md,
      md: fontScales.lg,
      lg: fontScales.xl,
      xl: fontScales.xl,
    };
    const scale = simpleMode
      ? (bumped[fontScale] ?? fontScales.lg)
      : fontScales[fontScale];

    const colors = isDark ? themes.dark : themes.light;

    return {
      colors,
      type: makeTypography(scale),
      spacing,
      radius,
      shadow: makeShadows(colors.shadowColor, isDark),
      spring,
      isDark,
      simpleMode,
      minTouch: MIN_TOUCH,
    };
  }, [isDark, fontScale, simpleMode]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

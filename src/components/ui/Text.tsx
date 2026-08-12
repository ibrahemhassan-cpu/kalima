import React from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import type { TypeScale } from "@/theme/typography";

type Tone = "default" | "muted" | "faint" | "brand" | "success" | "danger" | "onBrand";

export type TextProps = RNTextProps & {
  variant?: keyof TypeScale;
  tone?: Tone;
  center?: boolean;
  /** للكلمات الإنجليزية داخل واجهة عربية — يمنع انقلاب علامات الترقيم */
  ltr?: boolean;
};

export function Text({
  variant = "body",
  tone = "default",
  center,
  ltr,
  style,
  ...rest
}: TextProps) {
  const { colors, type } = useTheme();

  const toneColor: Record<Tone, string> = {
    default: colors.text,
    muted: colors.textMuted,
    faint: colors.textFaint,
    brand: colors.brand,
    success: colors.success,
    danger: colors.danger,
    onBrand: colors.onBrand,
  };

  return (
    <RNText
      // نحترم إعداد حجم الخط في النظام لكن بسقف يمنع كسر التخطيط
      maxFontSizeMultiplier={1.6}
      style={[
        type[variant],
        { color: toneColor[tone] },
        center && { textAlign: "center" },
        ltr && { writingDirection: "ltr" },
        style,
      ]}
      {...rest}
    />
  );
}

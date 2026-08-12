import React from "react";
import {
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

export type CardProps = {
  children: React.ReactNode;
  onPress?: () => void;
  tone?: "surface" | "bg" | "brand";
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Card({
  children,
  onPress,
  tone = "surface",
  padded = true,
  style,
  accessibilityLabel,
}: CardProps) {
  const { colors, radius, spacing, shadow } = useTheme();

  const bg = {
    surface: colors.surface,
    bg: colors.bg,
    brand: colors.brandSoft,
  }[tone];

  const base: StyleProp<ViewStyle> = [
    {
      backgroundColor: bg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: padded ? spacing.lg : 0,
    },
    shadow.card,
    style,
  ];

  if (!onPress) return <View style={base}>{children}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, { opacity: pressed ? 0.9 : 1 }]}
    >
      {children}
    </Pressable>
  );
}

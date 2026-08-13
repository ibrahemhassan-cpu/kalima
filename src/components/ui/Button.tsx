import React from "react";
import { ActivityIndicator, type ViewStyle, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "./Text";
import { Touchable } from "./Touchable";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  iconEnd?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconEnd,
  loading,
  disabled,
  fullWidth,
  style,
}: ButtonProps) {
  const { colors, radius, spacing, shadow, minTouch } = useTheme();
  const off = disabled || loading;

  const height = size === "lg" ? 56 : size === "sm" ? minTouch - 8 : minTouch;
  const padX = size === "lg" ? spacing.xl : spacing.lg;

  const fg = {
    primary: colors.onBrand,
    secondary: colors.text,
    ghost: colors.brand,
    danger: colors.onDanger,
  }[variant];

  const shell: ViewStyle = {
    minHeight: height,
    paddingHorizontal: padX,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: fullWidth ? "stretch" : "flex-start",
    overflow: "hidden",
    ...(style ?? {}),
  };

  const label = (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
    >
      {icon ? <Ionicons name={icon} size={19} color={fg} /> : null}
      <Text
        variant={size === "lg" ? "heading" : "bodyStrong"}
        style={{ color: fg }}
      >
        {title}
      </Text>
      {iconEnd ? <Ionicons name={iconEnd} size={19} color={fg} /> : null}
    </View>
  );

  const body = loading ? <ActivityIndicator color={fg} /> : label;

  // Primary gets the gradient + coloured glow.
  if (variant === "primary") {
    return (
      <Touchable
        onPress={onPress}
        disabled={off}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: !!off, busy: !!loading }}
        style={[shell, shadow.brand]}
      >
        <LinearGradient
          colors={[colors.brand, colors.brandAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          }}
        />
        {body}
      </Touchable>
    );
  }

  const bg = {
    secondary: colors.glassStrong,
    ghost: "transparent",
    danger: colors.danger,
  }[variant as "secondary" | "ghost" | "danger"];

  return (
    <Touchable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={[
        shell,
        {
          backgroundColor: bg,
          borderWidth: variant === "secondary" ? 1 : 0,
          borderColor: colors.border,
        },
        variant === "danger" ? shadow.sm : undefined,
      ]}
    >
      {body}
    </Touchable>
  );
}

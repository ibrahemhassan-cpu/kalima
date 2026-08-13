import React, { useState } from "react";
import {
  I18nManager,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "./Text";

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  /** English-only field: forces LTR and disables autocorrect */
  english?: boolean;
  size?: "md" | "lg";
};

export function Input({
  label,
  error,
  hint,
  english,
  size = "md",
  style,
  ...rest
}: InputProps) {
  const { colors, radius, spacing, type, minTouch, spring } = useTheme();
  const [focused, setFocused] = useState(false);
  const ring = useSharedValue(0);

  const ringStyle = useAnimatedStyle(() => ({
    borderWidth: 1 + ring.value,
    borderColor: error
      ? colors.danger
      : ring.value > 0.5
        ? colors.brand
        : colors.border,
  }));

  return (
    <View style={{ gap: spacing.sm }}>
      {label ? (
        <Text variant="label" tone="muted">
          {label}
        </Text>
      ) : null}

      <Animated.View
        style={[
          ringStyle,
          {
            borderRadius: radius.md,
            backgroundColor: colors.glassStrong,
            overflow: "hidden",
          },
        ]}
      >
        <TextInput
          onFocus={(e) => {
            setFocused(true);
            ring.value = withSpring(1, spring.snappy);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            ring.value = withSpring(0, spring.snappy);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={colors.textFaint}
          maxFontSizeMultiplier={1.6}
          accessibilityLabel={label}
          autoCapitalize={english ? "none" : rest.autoCapitalize}
          autoCorrect={english ? false : rest.autoCorrect}
          selectionColor={colors.brand}
          style={[
            size === "lg" ? type.heading : type.body,
            {
              minHeight: size === "lg" ? 60 : minTouch,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              color: colors.text,
              textAlign: english ? "left" : I18nManager.isRTL ? "right" : "left",
              writingDirection: english ? "ltr" : undefined,
            },
            style,
          ]}
          {...rest}
        />
      </Animated.View>

      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="faint">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

import React, { useState } from "react";
import {
  I18nManager,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "./Text";

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  /** حقول الكلمة الإنجليزية — تفرض اتجاه LTR ولوحة مفاتيح إنجليزية */
  english?: boolean;
};

export function Input({
  label,
  error,
  hint,
  english,
  style,
  ...rest
}: InputProps) {
  const { colors, radius, spacing, type, minTouch } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.danger
    : focused
      ? colors.brand
      : colors.border;

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? (
        <Text variant="label" tone="muted">
          {label}
        </Text>
      ) : null}

      <TextInput
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        placeholderTextColor={colors.textFaint}
        maxFontSizeMultiplier={1.6}
        accessibilityLabel={label}
        autoCapitalize={english ? "none" : rest.autoCapitalize}
        autoCorrect={english ? false : rest.autoCorrect}
        style={[
          type.body,
          {
            minHeight: minTouch,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderRadius: radius.md,
            borderWidth: focused ? 2 : 1,
            borderColor,
            backgroundColor: colors.bg,
            color: colors.text,
            textAlign: english ? "left" : I18nManager.isRTL ? "right" : "left",
            writingDirection: english ? "ltr" : undefined,
          },
          style,
        ]}
        {...rest}
      />

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

import React from "react";
import { I18nManager, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "@/components/ui/Text";

export function AuthHeader({
  title,
  onBack,
  subtitle,
}: {
  title: string;
  onBack?: () => void;
  subtitle?: string;
}) {
  const { colors, spacing, minTouch } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="رجوع"
            onPress={onBack}
            hitSlop={8}
            style={{
              width: minTouch,
              height: minTouch,
              alignItems: "center",
              justifyContent: "center",
              marginStart: -spacing.md,
            }}
          >
            <Ionicons
              name={I18nManager.isRTL ? "chevron-forward" : "chevron-back"}
              size={26}
              color={colors.text}
            />
          </Pressable>
        ) : null}
        {title ? <Text variant="title">{title}</Text> : null}
      </View>

      {subtitle ? (
        <Text variant="body" tone="muted">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

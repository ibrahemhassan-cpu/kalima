import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeProvider";
import { Text, Touchable } from "@/components/ui";
import { passwordStrength } from "@/features/auth/errors";

/** Inline error banner shared by every auth screen. */
export function FormError({ message }: { message?: string | null }) {
  const { colors, spacing, radius } = useTheme();
  if (!message) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={{
        flexDirection: "row",
        gap: spacing.sm,
        alignItems: "center",
        backgroundColor: colors.dangerSoft,
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.danger + "33",
      }}
    >
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
      <Text variant="caption" tone="danger" style={{ flex: 1 }}>
        {message}
      </Text>
    </Animated.View>
  );
}

/** Show/hide toggle placed under a password field. */
export function RevealToggle({
  shown,
  onToggle,
}: {
  shown: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Touchable onPress={onToggle} haptic="select" scaleTo={0.94}>
      <Text variant="caption" tone="brand">
        {shown ? t("auth.hide") : t("auth.show")}
      </Text>
    </Touchable>
  );
}

/** Four-segment strength meter — appears only once typing starts. */
export function StrengthMeter({ value }: { value: string }) {
  const { colors, spacing } = useTheme();
  if (!value) return null;

  const score = passwordStrength(value);
  const tone =
    score <= 1 ? colors.danger : score === 2 ? colors.warning : colors.success;

  return (
    <Animated.View
      entering={FadeInDown.duration(240)}
      style={{ flexDirection: "row", gap: 4, marginTop: spacing.xs }}
    >
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            backgroundColor: i < score ? tone : colors.sunken,
          }}
        />
      ))}
    </Animated.View>
  );
}

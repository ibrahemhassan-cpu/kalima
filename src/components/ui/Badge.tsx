import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "./Text";
import type { WordStatus } from "@/lib/database.types";

type Tone = "neutral" | "brand" | "success" | "danger" | "accent";

export function Badge({
  label,
  tone = "neutral",
  icon,
}: {
  label: string;
  tone?: Tone;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { colors, radius, spacing } = useTheme();

  const map: Record<Tone, { bg: string; fg: string; bd: string }> = {
    neutral: { bg: colors.sunken, fg: colors.textMuted, bd: colors.border },
    brand: { bg: colors.brandSoft, fg: colors.brand, bd: colors.brandBorder },
    success: { bg: colors.successSoft, fg: colors.success, bd: "transparent" },
    danger: { bg: colors.dangerSoft, fg: colors.danger, bd: "transparent" },
    accent: { bg: colors.accentSoft, fg: colors.warning, bd: "transparent" },
  };
  const c = map[tone];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        backgroundColor: c.bg,
        borderColor: c.bd,
        borderWidth: 1,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.md,
        paddingVertical: 5,
        alignSelf: "flex-start",
      }}
    >
      {icon ? <Ionicons name={icon} size={13} color={c.fg} /> : null}
      <Text variant="caption" style={{ color: c.fg, fontWeight: "600" }}>
        {label}
      </Text>
    </View>
  );
}

/** Status is conveyed by icon + text, never colour alone. */
export function StatusBadge({ status }: { status: WordStatus }) {
  const { t } = useTranslation();

  const map: Record<
    WordStatus,
    { tone: Tone; icon: keyof typeof Ionicons.glyphMap }
  > = {
    new: { tone: "brand", icon: "sparkles-outline" },
    learning: { tone: "brand", icon: "school-outline" },
    review: { tone: "neutral", icon: "repeat-outline" },
    mastered: { tone: "success", icon: "checkmark-circle-outline" },
    leech: { tone: "danger", icon: "alert-circle-outline" },
    archived: { tone: "neutral", icon: "archive-outline" },
  };

  return (
    <Badge
      label={t(`status.${status}`)}
      tone={map[status].tone}
      icon={map[status].icon}
    />
  );
}

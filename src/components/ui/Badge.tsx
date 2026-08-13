import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "./Text";
import type { WordStatus } from "@/lib/database.types";

type Tone =
  | "neutral"
  | "brand"
  | "success"
  | "danger"
  | "accent"
  | "chipNew"
  | "chipHard"
  | "chipReview"
  | "chipLearned";

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
    chipNew: { bg: colors.chipNewBg, fg: colors.chipNewFg, bd: "transparent" },
    chipHard: { bg: colors.chipHardBg, fg: colors.chipHardFg, bd: "transparent" },
    chipReview: { bg: colors.chipReviewBg, fg: colors.chipReviewFg, bd: "transparent" },
    chipLearned: { bg: colors.chipLearnedBg, fg: colors.chipLearnedFg, bd: "transparent" },
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
        borderWidth: c.bd === "transparent" ? 0 : 1,
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

/** Status is conveyed by icon + text, matching design system chips. */
export function StatusBadge({ status }: { status: WordStatus }) {
  const { t } = useTranslation();

  const map: Record<
    WordStatus,
    { tone: Tone; icon: keyof typeof Ionicons.glyphMap }
  > = {
    new: { tone: "chipNew", icon: "sparkles" },
    learning: { tone: "brand", icon: "school" },
    review: { tone: "chipReview", icon: "time" },
    mastered: { tone: "chipLearned", icon: "checkmark-circle" },
    leech: { tone: "chipHard", icon: "flame" },
    archived: { tone: "neutral", icon: "archive" },
  };

  return (
    <Badge
      label={t(`status.${status}`)}
      tone={map[status].tone}
      icon={map[status].icon}
    />
  );
}

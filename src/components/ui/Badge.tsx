import React from "react";
import { View } from "react-native";
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

  const map: Record<Tone, { bg: string; fg: string }> = {
    neutral: { bg: colors.surfaceAlt, fg: colors.textMuted },
    brand: { bg: colors.brandSoft, fg: colors.brand },
    success: { bg: colors.successSoft, fg: colors.success },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    accent: { bg: colors.accentSoft, fg: colors.warning },
  };
  const { bg, fg } = map[tone];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        backgroundColor: bg,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        alignSelf: "flex-start",
      }}
    >
      {icon ? <Ionicons name={icon} size={14} color={fg} /> : null}
      <Text variant="caption" style={{ color: fg, fontWeight: "600" }}>
        {label}
      </Text>
    </View>
  );
}

/** حالة الكلمة تُبلَّغ بأيقونة ونص — لا باللون وحده */
export function StatusBadge({ status }: { status: WordStatus }) {
  const map: Record<
    WordStatus,
    { label: string; tone: Tone; icon: keyof typeof Ionicons.glyphMap }
  > = {
    new: { label: "جديدة", tone: "brand", icon: "sparkles-outline" },
    learning: { label: "بتتعلمها", tone: "brand", icon: "school-outline" },
    review: { label: "في المراجعة", tone: "neutral", icon: "repeat-outline" },
    mastered: { label: "متقنة", tone: "success", icon: "checkmark-circle-outline" },
    leech: { label: "صعبة عليك", tone: "danger", icon: "alert-circle-outline" },
    archived: { label: "مؤرشفة", tone: "neutral", icon: "archive-outline" },
  };
  const cfg = map[status];
  return <Badge label={cfg.label} tone={cfg.tone} icon={cfg.icon} />;
}

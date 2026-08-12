import React from "react";
import { I18nManager, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { StatusBadge, Text } from "@/components/ui";
import { speak } from "@/features/tts";
import type { MyWordRow } from "@/lib/database.types";
import { formatDue } from "@/api/words";

export function WordCard({
  row,
  onPress,
}: {
  row: MyWordRow;
  onPress: () => void;
}) {
  const { colors, spacing, radius, minTouch } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${row.lemma}، ${row.ar_preview}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
      })}
    >
      <View style={{ flex: 1, gap: spacing.xs }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Text variant="heading" ltr>
            {row.lemma}
          </Text>
          {row.is_favorite ? (
            <Ionicons name="star" size={16} color={colors.accent} />
          ) : null}
        </View>

        <Text variant="body" tone="muted" numberOfLines={1}>
          {row.ar_preview || "—"}
        </Text>

        <View
          style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
        >
          <StatusBadge status={row.status} />
          <Text variant="caption" tone="faint">
            {formatDue(row.due_at)}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`اسمع نطق ${row.lemma}`}
        hitSlop={8}
        onPress={() => speak(row.lemma)}
        style={{
          width: minTouch,
          height: minTouch,
          borderRadius: radius.pill,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.brandSoft,
        }}
      >
        <Ionicons name="volume-high" size={20} color={colors.brand} />
      </Pressable>

      <Ionicons
        name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"}
        size={18}
        color={colors.textFaint}
      />
    </Pressable>
  );
}

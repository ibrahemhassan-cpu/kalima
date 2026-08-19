import React from "react";
import { I18nManager, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { PRESS_SCALE_SMALL } from "@/theme/motion";
import { StatusBadge, Text, Touchable } from "@/components/ui";
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
  const { colors, spacing, radius, shadow, minTouch, isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <Touchable
      accessibilityRole="button"
      accessibilityLabel={`${row.lemma}, ${row.ar_preview}`}
      onPress={onPress}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          padding: spacing.lg,
          borderRadius: radius.lg,
          // shadow in light, hairline in dark — never both
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
        shadow.sm,
      ]}
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
            {formatDue(row.due_at, t)}
          </Text>
        </View>
      </View>

      <Touchable
        haptic="select"
        accessibilityRole="button"
        accessibilityLabel={t("a11y.listenTo", { word: row.lemma })}
      scaleTo={PRESS_SCALE_SMALL}
        hitSlop={8}
        onPress={() => speak(row.lemma)}
        style={{
          width: minTouch - 4,
          height: minTouch - 4,
          borderRadius: radius.pill,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.brandSoft,
        }}
      >
        <Ionicons name="volume-high" size={19} color={colors.brand} />
      </Touchable>

      <Ionicons
        name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"}
        size={18}
        color={colors.textFaint}
      />
    </Touchable>
  );
}

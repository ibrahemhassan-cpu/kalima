import React, { useRef } from "react";
import { I18nManager, View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { PRESS_SCALE_SMALL } from "@/theme/motion";
import { StatusBadge, Text, Touchable } from "@/components/ui";
import { speak } from "@/features/tts";
import type { MyWordRow } from "@/lib/database.types";
import { formatDue } from "@/api/words";
import { ICON_CHEVRON_FORWARD } from "@/i18n/rtl";

export function WordCard({
  row,
  onPress,
  onArchive,
  onDelete,
}: {
  row: MyWordRow;
  onPress: () => void;
  /** swipe one way to archive — the caller confirms */
  onArchive?: () => void;
  /** swipe the other way to delete — the caller confirms */
  onDelete?: () => void;
}) {
  const { colors, spacing, radius, shadow, minTouch, isDark } = useTheme();
  const { t } = useTranslation();
  const swipe = useRef<SwipeableMethods>(null);

  const card = (
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
        name={ICON_CHEVRON_FORWARD}
        size={18}
        color={colors.textFaint}
      />
    </Touchable>
  );

  if (!onArchive && !onDelete) return card;

  /**
   * The panel behind the card while it is being dragged.
   *
   * It only has to read as "this is what letting go does" — the action fires
   * from the swipe itself, so there is nothing here to tap.
   */
  const panel = (
    tone: string,
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    align: "flex-start" | "flex-end",
  ) => (
    <View
      style={{
        flex: 1,
        backgroundColor: tone,
        borderRadius: radius.lg,
        justifyContent: "center",
        alignItems: align,
        paddingHorizontal: spacing.xl,
        gap: 4,
      }}
    >
      <Ionicons name={icon} size={22} color={colors.onBrand} />
      <Text variant="micro" style={{ color: colors.onBrand, fontWeight: "700" }}>
        {label}
      </Text>
    </View>
  );

  return (
    <ReanimatedSwipeable
      ref={swipe}
      friction={2}
      leftThreshold={72}
      rightThreshold={72}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={
        onArchive
          ? () =>
              panel(
                colors.brand,
                "archive",
                t("word.archive"),
                I18nManager.isRTL ? "flex-end" : "flex-start",
              )
          : undefined
      }
      renderRightActions={
        onDelete
          ? () =>
              panel(
                colors.danger,
                "trash",
                t("common.delete"),
                I18nManager.isRTL ? "flex-start" : "flex-end",
              )
          : undefined
      }
      /**
       * Fire on release and snap shut straight away: the confirm sheet is the
       * decision point, so leaving the row hanging open behind it would ask
       * twice and leave the list looking half-acted-on if the user cancels.
       */
      onSwipeableOpen={(direction) => {
        swipe.current?.close();
        if (direction === "left") onArchive?.();
        else onDelete?.();
      }}
    >
      {card}
    </ReanimatedSwipeable>
  );
}

import React, { useRef } from "react";
import { View } from "react-native";
import * as Haptics from "expo-haptics";
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

/**
 * How far a row travels on a swipe.
 *
 * Short on purpose: the gesture is a nudge that raises a confirm, not a drag
 * that performs the action, so the card should never leave its lane.
 */
const SWIPE_PANEL = 96;

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

  // an archived row swipes back the other way, so say so on the panel
  const archiveLabel = t(
    row.status === "archived" ? "word.restore" : "word.archive",
  );

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
  ) => (
    <View
      style={{
        // a fixed width, not flex: the drag is clamped to whatever the panel
        // measures, so "flex: 1" let the card be dragged clear off the row
        width: SWIPE_PANEL,
        backgroundColor: tone,
        borderRadius: radius.lg,
        justifyContent: "center",
        alignItems: "center",
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
      // trips well before the panel is fully out, so a short drag is enough
      leftThreshold={SWIPE_PANEL / 2}
      rightThreshold={SWIPE_PANEL / 2}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={
        onArchive
          ? () => panel(colors.brand, "archive", archiveLabel)
          : undefined
      }
      renderRightActions={
        onDelete ? () => panel(colors.danger, "trash", t("common.delete")) : undefined
      }
      /**
       * onSwipeableOpen reports the direction the card *moved*, not the side
       * whose panel appeared — dragging right gives "right" while revealing
       * the left panel. Reading it the other way had each swipe raising the
       * other one's confirm.
       *
       * The action fires on release rather than after the open animation, so
       * the tick and the sheet arrive together and the row is already on its
       * way back. The confirm is the decision point; leaving the row hanging
       * open behind it would ask twice.
       */
      onSwipeableWillOpen={(direction) => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (direction === "right") onArchive?.();
        else onDelete?.();
      }}
      onSwipeableOpen={() => swipe.current?.close()}
    >
      {card}
    </ReanimatedSwipeable>
  );
}

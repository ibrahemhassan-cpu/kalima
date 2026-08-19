import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";

import { useTheme } from "@/theme/ThemeProvider";
import { useOnline } from "@/lib/network";
import { usePendingReviews } from "@/lib/offline";
import { Text } from "./Text";

/**
 * The one line that turns "the app is broken" into "I have no signal".
 *
 * Rendered by every Screen, so no screen can forget it. It states the fact and
 * what still works — the app is showing your saved copy, and anything you
 * answer now is being kept for later.
 */
export function OfflineBar() {
  const { colors, spacing, radius } = useTheme();
  const { t } = useTranslation();
  const online = useOnline();
  const pending = usePendingReviews();

  // Online with nothing waiting is the normal case: say nothing at all.
  if (online && pending === 0) return null;

  const syncing = online && pending > 0;
  const fg = syncing ? colors.brand : colors.warning;
  const bg = syncing ? colors.brandSoft : colors.warningSoft;

  return (
    <Animated.View entering={FadeInUp.duration(220)} exiting={FadeOutUp.duration(160)}>
      <View
        accessibilityRole="alert"
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          borderRadius: radius.md,
          backgroundColor: bg,
        }}
      >
        <Ionicons
          name={syncing ? "sync-outline" : "cloud-offline-outline"}
          size={16}
          color={fg}
        />
        <Text variant="caption" style={{ color: fg, flex: 1 }}>
          {syncing
            ? t("offline.queued", { count: pending })
            : t("offline.working")}
        </Text>
      </View>
    </Animated.View>
  );
}

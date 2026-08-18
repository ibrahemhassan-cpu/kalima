import React, { useCallback, useEffect, useState } from "react";
import { AppState, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import {
  Button,
  ChoiceList,
  Header,
  ListGroup,
  ListRow,
  Screen,
  Surface,
  Text,
} from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { useSettings } from "@/store/settings";
import { requestPermission } from "@/features/notifications";
import {
  hasOverlayPermission,
  isOverlaySupported,
  openOverlaySettings,
} from "@modules/word-overlay";

const INTERVALS = [15, 30, 60, 120];

/**
 * One feature, two shapes.
 *
 * Android with the overlay permission gets a card floating over other apps.
 * Everywhere else — iOS always, Android without the permission — the same
 * words arrive as notifications instead. iOS has no API for drawing over
 * another app, so that is the whole of what the platform allows.
 */
export default function OverlaySetting() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();

  const enabled = useSettings((s) => s.overlayEnabled);
  const interval = useSettings((s) => s.overlayInterval);
  const setEnabled = useSettings((s) => s.setOverlayEnabled);
  const setInterval = useSettings((s) => s.setOverlayInterval);

  const canFloat = isOverlaySupported();
  const [granted, setGranted] = useState(() => hasOverlayPermission());

  // The overlay permission is granted in system settings, so re-read it every
  // time the app comes back rather than assuming the trip succeeded.
  const refresh = useCallback(() => setGranted(hasOverlayPermission()), []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const floating = canFloat && granted;

  return (
    <Screen scroll>
      <Header
        title={t("overlay.title")}
        subtitle={t("overlay.subtitle")}
        onBack={() => router.back()}
      />

      {/* what this device will actually do */}
      <Surface tone="glass" radiusKey="xl">
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <Ionicons
            name={floating ? "albums-outline" : "notifications-outline"}
            size={20}
            color={colors.brand}
          />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="bodyStrong">
              {floating ? t("overlay.modeFloating") : t("overlay.modeNotification")}
            </Text>
            <Text variant="caption" tone="muted">
              {floating
                ? t("overlay.modeFloatingBody")
                : canFloat
                  ? t("overlay.modeNotificationAndroid")
                  : t("overlay.modeNotificationIos")}
            </Text>
          </View>
        </View>
      </Surface>

      {/* offered only where a floating card is possible at all */}
      {canFloat && !granted ? (
        <Surface tone="brand" radiusKey="xl">
          <View style={{ gap: spacing.md }}>
            <Text variant="bodyStrong">{t("overlay.permissionTitle")}</Text>
            <Text variant="caption" tone="muted">
              {t("overlay.permissionBody")}
            </Text>
            <Button
              title={t("overlay.grant")}
              fullWidth
              icon="open-outline"
              onPress={async () => {
                await openOverlaySettings();
              }}
            />
          </View>
        </Surface>
      ) : null}

      <ListGroup>
        <ListRow
          icon="albums-outline"
          title={t("overlay.enable")}
          toggle={{
            value: enabled,
            onChange: async (v) => {
              // the notification path needs the notification permission
              if (v && !floating && !(await requestPermission())) return;
              setEnabled(v);
            },
          }}
          last
        />
      </ListGroup>

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" tone="muted">
          {t("overlay.every")}
        </Text>
        <ChoiceList<number>
          options={INTERVALS.map((m) => ({
            key: m,
            title: t("overlay.minutes", { count: m }),
          }))}
          value={interval}
          onChange={setInterval}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: spacing.md,
          padding: spacing.lg,
          borderRadius: radius.lg,
          backgroundColor: colors.sunken,
        }}
      >
        <Ionicons
          name={floating ? "battery-half-outline" : "moon-outline"}
          size={18}
          color={colors.textFaint}
        />
        <Text variant="caption" tone="faint" style={{ flex: 1 }}>
          {floating ? t("overlay.batteryNote") : t("overlay.quietNote")}
        </Text>
      </View>
    </Screen>
  );
}

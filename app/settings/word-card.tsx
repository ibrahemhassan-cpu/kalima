import React, { useCallback, useEffect, useState } from "react";
import { AppState, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import {
  ChoiceList,
  Header,
  ListGroup,
  ListRow,
  Screen,
  Surface,
  Text,
} from "@/components/ui";
import { WordGlassCard } from "@/components/word/WordGlassCard";
import { useTheme } from "@/theme/ThemeProvider";
import { useSettings } from "@/store/settings";
import { useMyWords } from "@/api/words";
import { requestPermission } from "@/features/notifications";
import { speak } from "@/features/tts";
import { isWidgetSupported, widgetsPlaced } from "@modules/word-widget";
import { useGoBack } from "@/lib/navigation";

const INTERVALS = [15, 30, 60, 120];

/**
 * Two ways the same word reaches you: a card on the home screen, and optional
 * notifications. The widget is placed from the launcher, not from here, so the
 * screen shows what it looks like and says where to find it.
 */
export default function WordCardSetting() {
  const router = useRouter();
  const goBack = useGoBack();
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();

  const enabled = useSettings((s) => s.overlayEnabled);
  const interval = useSettings((s) => s.overlayInterval);
  const setEnabled = useSettings((s) => s.setOverlayEnabled);
  const setInterval = useSettings((s) => s.setOverlayInterval);

  const { data: words } = useMyWords({ filter: "all", search: "", sort: "recent" });
  const sample = words?.[0];

  const canWidget = isWidgetSupported();
  const [placed, setPlaced] = useState(() => widgetsPlaced());

  // Widgets are added and removed outside the app, so re-read on every return.
  const refresh = useCallback(() => setPlaced(widgetsPlaced()), []);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return (
    <Screen scroll>
      <Header
        title={t("card.settingsTitle")}
        subtitle={t("card.settingsSubtitle")}
        onBack={() => goBack()}
      />

{/*
        A preview of the style, not a pixel mock. No IPA here because the widget
        drops it — at widget size it reads as noise.
      */}
      <WordGlassCard
        compact
        lemma={sample?.lemma ?? "serenity"}
        translation={sample?.ar_preview ?? t("card.sampleMeaning")}
        onSpeak={() => speak(sample?.lemma ?? "serenity")}
      />

      {canWidget ? (
        <Surface tone={placed > 0 ? "glass" : "brand"} radiusKey="xl">
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Ionicons
              name={placed > 0 ? "checkmark-circle" : "add-circle-outline"}
              size={20}
              color={placed > 0 ? colors.success : colors.brand}
            />
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="bodyStrong">
                {placed > 0
                  ? t("card.widgetPlaced", { count: placed })
                  : t("card.widgetHowTitle")}
              </Text>
              <Text variant="caption" tone="muted">
                {placed > 0 ? t("card.widgetTapHint") : t("card.widgetHowBody")}
              </Text>
            </View>
          </View>
        </Surface>
      ) : (
        <Surface tone="glass" radiusKey="xl">
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Ionicons name="phone-portrait-outline" size={20} color={colors.textFaint} />
            <Text variant="caption" tone="muted" style={{ flex: 1 }}>
              {t("card.widgetUnavailable")}
            </Text>
          </View>
        </Surface>
      )}

      {/* the notification companion — the widget is passive, this isn't */}
      <ListGroup title={t("card.notifyGroup")}>
        <ListRow
          icon="notifications-outline"
          title={t("card.notifyEnable")}
          subtitle={t("card.notifyHint")}
          toggle={{
            value: enabled,
            onChange: async (v) => {
              if (v && !(await requestPermission())) return;
              setEnabled(v);
            },
          }}
          last
        />
      </ListGroup>

      {enabled ? (
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
      ) : null}

      <View
        style={{
          flexDirection: "row",
          gap: spacing.md,
          padding: spacing.lg,
          borderRadius: radius.lg,
          backgroundColor: colors.sunken,
        }}
      >
        <Ionicons name="moon-outline" size={18} color={colors.textFaint} />
        <Text variant="caption" tone="faint" style={{ flex: 1 }}>
          {t("overlay.quietNote")}
        </Text>
      </View>
    </Screen>
  );
}

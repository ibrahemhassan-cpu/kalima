import React, { useMemo } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import {
  Badge,
  Header,
  Screen,
  Surface,
  Text,
  Touchable,
} from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { useProfile, useUpdateProfile } from "@/api/profile";
import { formatHour, REMINDER_HOURS } from "@/features/onboarding/store";
import { MAX_REMINDERS } from "@/features/notifications";

const pad = (h: number) => `${String(h).padStart(2, "0")}:00:00`;

/**
 * Pick as many times of day as you like, up to MAX_REMINDERS.
 * Tapping a chosen hour removes it — except the last one, because a reminder
 * list with nothing in it should be expressed by turning reminders off, not by
 * an empty list that silently never fires.
 */
export default function ReminderSetting() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors, spacing, radius, minTouch } = useTheme();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const selected = useMemo(() => {
    const times =
      profile?.reminder_times && profile.reminder_times.length > 0
        ? profile.reminder_times
        : [profile?.reminder_time ?? "19:00:00"];
    return times
      .map((v) => Number(String(v).slice(0, 2)))
      .filter((h) => Number.isFinite(h))
      .sort((a, b) => a - b);
  }, [profile?.reminder_times, profile?.reminder_time]);

  const full = selected.length >= MAX_REMINDERS;

  function toggle(hour: number) {
    const on = selected.includes(hour);
    if (on && selected.length === 1) return; // never leave it empty
    if (!on && full) return;

    const next = on
      ? selected.filter((h) => h !== hour)
      : [...selected, hour].sort((a, b) => a - b);

    update.mutate({
      reminder_times: next.map(pad),
      reminder_enabled: true,
    });
  }

  return (
    <Screen scroll>
      <Header
        title={t("settings.reminderTime")}
        subtitle={t("settings.reminderTimesHint")}
        onBack={() => router.back()}
      />

      <Surface tone="glass" radiusKey="xl">
        <View style={{ gap: spacing.sm }}>
          <Text variant="label" tone="muted">
            {t("settings.chosenTimes")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {selected.map((h) => (
              <Badge
                key={h}
                label={formatHour(h, i18n.language)}
                tone="brand"
                icon="notifications"
              />
            ))}
          </View>
          <Text variant="micro" tone="faint">
            {full
              ? t("settings.remindersFull", { count: MAX_REMINDERS })
              : t("settings.remindersCount", {
                  count: selected.length,
                  max: MAX_REMINDERS,
                })}
          </Text>
        </View>
      </Surface>

      <View style={{ gap: spacing.sm }}>
        {REMINDER_HOURS.map((h) => {
          const on = selected.includes(h);
          const locked = (on && selected.length === 1) || (!on && full);

          return (
            <Touchable
              key={h}
              onPress={() => toggle(h)}
              disabled={locked}
              haptic="select"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on, disabled: locked }}
              accessibilityLabel={formatHour(h, i18n.language)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
                minHeight: minTouch,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                borderRadius: radius.lg,
                borderWidth: on ? 2 : 1,
                borderColor: on ? colors.brand : colors.border,
                backgroundColor: on ? colors.brandSoft : colors.glassStrong,
              }}
            >
              <Ionicons
                name={on ? "checkmark-circle" : "ellipse-outline"}
                size={22}
                color={on ? colors.brand : colors.textFaint}
              />
              <Text
                variant="bodyStrong"
                style={{ flex: 1, color: on ? colors.brand : colors.text }}
              >
                {formatHour(h, i18n.language)}
              </Text>
            </Touchable>
          );
        })}
      </View>
    </Screen>
  );
}

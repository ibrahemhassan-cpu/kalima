import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import {
  Button,
  Header,
  ProgressDots,
  Screen,
  Surface,
  Text,
  Touchable,
} from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import {
  formatHour,
  REMINDER_HOURS,
  useOnboarding,
} from "@/features/onboarding/store";
import { deviceTimezone, useUpdateProfile } from "@/api/profile";
import { useSettings } from "@/store/settings";

export default function ReminderStep() {
  const { colors, spacing, radius, minTouch } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const { level, dailyGoal, reminderHour, reminderEnabled, setReminder, reset } =
    useOnboarding();
  const setSimpleMode = useSettings((s) => s.setSimpleMode);
  const update = useUpdateProfile();
  const [error, setError] = useState<string | null>(null);

  async function finish() {
    setError(null);
    try {
      await update.mutateAsync({
        cefr_level: level ?? "A2",
        daily_goal: dailyGoal ?? 10,
        reminder_enabled: reminderEnabled,
        reminder_time: `${String(reminderHour ?? 19).padStart(2, "0")}:00:00`,
        timezone: deviceTimezone(),
        onboarded_at: new Date().toISOString(),
        accepted_terms_at: new Date().toISOString(),
      });
      reset();
      router.replace("/(tabs)");
    } catch {
      setError(t("onboarding.saveFailed"));
    }
  }

  return (
    <Screen scroll>
      <Header onBack={() => router.back()} />
      <ProgressDots total={3} index={2} />

      <View style={{ gap: spacing.sm, paddingTop: spacing.lg }}>
        <Text variant="title">{t("onboarding.reminderTitle")}</Text>
        <Text variant="body" tone="muted">
          {t("onboarding.reminderSubtitle")}
        </Text>
      </View>

      <Surface tone="glass" radiusKey="xl">
        <View style={{ gap: spacing.lg }}>
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.brand} />
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {reminderEnabled
                ? formatHour(reminderHour ?? 19, i18n.language)
                : t("onboarding.reminderOff")}
            </Text>
            <Touchable
              haptic="select"
              onPress={() => setReminder(reminderHour, !reminderEnabled)}
              scaleTo={0.94}
            >
              <Text variant="label" tone="brand">
                {reminderEnabled ? t("onboarding.turnOff") : t("onboarding.turnOn")}
              </Text>
            </Touchable>
          </View>

          {reminderEnabled ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm, paddingVertical: 2 }}
            >
              {REMINDER_HOURS.map((h) => {
                const active = h === reminderHour;
                return (
                  <Touchable
                    key={h}
                    haptic="select"
                    onPress={() => setReminder(h, true)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    style={{
                      minHeight: minTouch - 6,
                      justifyContent: "center",
                      paddingHorizontal: spacing.lg,
                      borderRadius: radius.pill,
                      borderWidth: active ? 1.5 : 1,
                      borderColor: active ? colors.brand : colors.border,
                      backgroundColor: active ? colors.brandSoft : colors.glassStrong,
                    }}
                  >
                    <Text
                      variant="label"
                      style={{ color: active ? colors.brand : colors.textMuted }}
                    >
                      {formatHour(h, i18n.language)}
                    </Text>
                  </Touchable>
                );
              })}
            </ScrollView>
          ) : null}
        </View>
      </Surface>

      <Surface tone="brand" radiusKey="xl">
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <Ionicons name="accessibility-outline" size={22} color={colors.brand} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text variant="bodyStrong">{t("onboarding.simpleTitle")}</Text>
            <Text variant="caption" tone="muted">
              {t("onboarding.simpleBody")}
            </Text>
            <Touchable
              haptic="select"
              onPress={() => setSimpleMode(true)}
              style={{ paddingVertical: spacing.sm }}
            >
              <Text variant="label" tone="brand">
                {t("onboarding.simpleAction")}
              </Text>
            </Touchable>
          </View>
        </View>
      </Surface>

      {error ? (
        <Text variant="caption" tone="danger" center>
          {error}
        </Text>
      ) : null}

      <Button
        title={t("onboarding.finish")}
        size="lg"
        fullWidth
        iconEnd="arrow-forward"
        loading={update.isPending}
        onPress={finish}
      />
    </Screen>
  );
}

import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Button,
  Card,
  ProgressDots,
  Screen,
  Text,
} from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { formatHour, useOnboarding } from "@/features/onboarding/store";
import { AuthHeader } from "@/features/auth/AuthHeader";
import { deviceTimezone, useUpdateProfile } from "@/api/profile";
import { useSettings } from "@/store/settings";

const HOURS = [7, 9, 12, 15, 17, 19, 20, 21, 22];

export default function ReminderStep() {
  const { colors, spacing, radius, minTouch } = useTheme();
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
      setError("ما قدرناش نحفظ إعداداتك. اتأكد من الإنترنت وجرّب تاني");
    }
  }

  return (
    <Screen scroll>
      <AuthHeader title="" onBack={() => router.back()} />
      <ProgressDots total={3} index={2} />

      <View style={{ gap: spacing.sm, paddingTop: spacing.lg }}>
        <Text variant="title">نفكّرك امتى؟</Text>
        <Text variant="body" tone="muted">
          تذكير واحد في اليوم في الوقت اللي يناسبك. تقدر تقفله من الإعدادات.
        </Text>
      </View>

      <Card>
        <View style={{ gap: spacing.lg }}>
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.brand} />
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {reminderEnabled ? formatHour(reminderHour ?? 19) : "التذكير مقفول"}
            </Text>
            <Text
              variant="label"
              tone="brand"
              accessibilityRole="button"
              onPress={() => setReminder(reminderHour, !reminderEnabled)}
            >
              {reminderEnabled ? "اقفله" : "شغّله"}
            </Text>
          </View>

          {reminderEnabled ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {HOURS.map((h) => {
                const active = h === reminderHour;
                return (
                  <Text
                    key={h}
                    variant="label"
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    onPress={() => setReminder(h, true)}
                    style={{
                      minHeight: minTouch,
                      lineHeight: minTouch,
                      paddingHorizontal: spacing.lg,
                      borderRadius: radius.pill,
                      overflow: "hidden",
                      textAlign: "center",
                      borderWidth: active ? 2 : 1,
                      borderColor: active ? colors.brand : colors.border,
                      backgroundColor: active ? colors.brandSoft : colors.bg,
                      color: active ? colors.brand : colors.textMuted,
                    }}
                  >
                    {formatHour(h)}
                  </Text>
                );
              })}
            </ScrollView>
          ) : null}
        </View>
      </Card>

      <Card tone="brand">
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <Ionicons name="accessibility-outline" size={24} color={colors.brand} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text variant="bodyStrong">محتاج خط أكبر وخيارات أقل؟</Text>
            <Text variant="caption" tone="muted">
              الوضع المبسّط بيكبّر كل حاجة ويخفي التفاصيل المتقدّمة. مناسب جدًا لو
              التطبيق لحد كبير في السن.
            </Text>
            <Text
              variant="label"
              tone="brand"
              accessibilityRole="button"
              onPress={() => setSimpleMode(true)}
              style={{ paddingVertical: spacing.sm }}
            >
              فعّل الوضع المبسّط
            </Text>
          </View>
        </View>
      </Card>

      {error ? (
        <Text variant="caption" tone="danger" center>
          {error}
        </Text>
      ) : null}

      <Button
        title="يلا نبدأ"
        size="lg"
        fullWidth
        loading={update.isPending}
        onPress={finish}
      />
    </Screen>
  );
}

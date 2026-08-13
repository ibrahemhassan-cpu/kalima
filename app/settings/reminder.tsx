import React from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ChoiceList, Header, Screen } from "@/components/ui";
import { useProfile, useUpdateProfile } from "@/api/profile";
import { formatHour, REMINDER_HOURS } from "@/features/onboarding/store";

export default function ReminderSetting() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const current = Number((profile?.reminder_time ?? "19:00:00").slice(0, 2));

  return (
    <Screen scroll>
      <Header
        title={t("settings.reminderTime")}
        subtitle={t("settings.reminderHint")}
        onBack={() => router.back()}
      />
      <ChoiceList<number>
        options={REMINDER_HOURS.map((h) => ({
          key: h,
          title: formatHour(h, i18n.language),
        }))}
        value={current}
        onChange={(h) =>
          update.mutate({
            reminder_time: `${String(h).padStart(2, "0")}:00:00`,
            reminder_enabled: true,
          })
        }
      />
    </Screen>
  );
}

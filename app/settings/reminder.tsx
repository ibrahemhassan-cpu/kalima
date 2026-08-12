import React from "react";
import { useRouter } from "expo-router";
import { ChoiceList, Screen } from "@/components/ui";
import { AuthHeader } from "@/features/auth/AuthHeader";
import { useProfile, useUpdateProfile } from "@/api/profile";
import { formatHour } from "@/features/onboarding/store";

const HOURS = [7, 9, 12, 15, 17, 19, 20, 21, 22];

export default function ReminderSetting() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const current = Number((profile?.reminder_time ?? "19:00:00").slice(0, 2));

  return (
    <Screen scroll>
      <AuthHeader
        title="وقت التذكير"
        subtitle="تذكير واحد في اليوم — مش أكتر"
        onBack={() => router.back()}
      />
      <ChoiceList<number>
        options={HOURS.map((h) => ({ key: h, title: formatHour(h) }))}
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

import React from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ChoiceList, Header, Screen } from "@/components/ui";
import { useProfile, useUpdateProfile } from "@/api/profile";
import { goalOptions } from "@/features/onboarding/store";
import { useGoBack } from "@/lib/navigation";

export default function GoalSetting() {
  const router = useRouter();
  const goBack = useGoBack();
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  return (
    <Screen scroll>
      <Header
        title={t("settings.dailyGoal")}
        subtitle={t("settings.dailyGoalHint")}
        onBack={() => goBack()}
      />
      <ChoiceList<number>
        options={goalOptions(t)}
        value={profile?.daily_goal ?? null}
        onChange={(v) => update.mutate({ daily_goal: v })}
      />
    </Screen>
  );
}

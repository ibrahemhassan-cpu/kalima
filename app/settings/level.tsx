import React from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ChoiceList, Header, Screen } from "@/components/ui";
import { useProfile, useUpdateProfile } from "@/api/profile";
import { levelOptions } from "@/features/onboarding/store";
import type { CefrLevel } from "@/lib/database.types";

export default function LevelSetting() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  return (
    <Screen scroll>
      <Header
        title={t("settings.myLevel")}
        subtitle={t("settings.myLevelHint")}
        onBack={() => router.back()}
      />
      <ChoiceList<CefrLevel>
        options={levelOptions(t)}
        value={profile?.cefr_level ?? null}
        onChange={(v) => update.mutate({ cefr_level: v })}
      />
    </Screen>
  );
}

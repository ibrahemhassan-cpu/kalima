import React from "react";
import { useRouter } from "expo-router";
import { ChoiceList, Screen } from "@/components/ui";
import { AuthHeader } from "@/features/auth/AuthHeader";
import { useProfile, useUpdateProfile } from "@/api/profile";
import { LEVELS } from "@/features/onboarding/store";
import type { CefrLevel } from "@/lib/database.types";

export default function LevelSetting() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  return (
    <Screen scroll>
      <AuthHeader
        title="مستواي في الإنجليزي"
        subtitle="بنظبط بيه صعوبة الشرح والأمثلة اللي بيولّدها الـ AI"
        onBack={() => router.back()}
      />
      <ChoiceList<CefrLevel>
        options={LEVELS.map((l) => ({
          key: l.key,
          title: l.title,
          subtitle: l.subtitle,
        }))}
        value={profile?.cefr_level ?? null}
        onChange={(v) => update.mutate({ cefr_level: v })}
      />
    </Screen>
  );
}

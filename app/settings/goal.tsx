import React from "react";
import { useRouter } from "expo-router";
import { ChoiceList, Screen } from "@/components/ui";
import { AuthHeader } from "@/features/auth/AuthHeader";
import { useProfile, useUpdateProfile } from "@/api/profile";
import { GOALS } from "@/features/onboarding/store";

export default function GoalSetting() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  return (
    <Screen scroll>
      <AuthHeader
        title="الهدف اليومي"
        subtitle="الستريك بيتحقق لما توصل للهدف — مش بمجرد فتح التطبيق"
        onBack={() => router.back()}
      />
      <ChoiceList<number>
        options={GOALS.map((g) => ({
          key: g.key,
          title: g.title,
          subtitle: g.subtitle,
        }))}
        value={profile?.daily_goal ?? null}
        onChange={(v) => update.mutate({ daily_goal: v })}
      />
    </Screen>
  );
}

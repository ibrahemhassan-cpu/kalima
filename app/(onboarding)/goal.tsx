import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Button, ChoiceList, Header, ProgressDots, Screen, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { goalOptions, useOnboarding } from "@/features/onboarding/store";

export default function GoalStep() {
  const { spacing } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const dailyGoal = useOnboarding((s) => s.dailyGoal);
  const setDailyGoal = useOnboarding((s) => s.setDailyGoal);

  return (
    <Screen scroll>
      <Header onBack={() => router.back()} />
      <ProgressDots total={3} index={1} />

      <View style={{ gap: spacing.sm, paddingTop: spacing.lg }}>
        <Text variant="title">{t("onboarding.goalTitle")}</Text>
        <Text variant="body" tone="muted">
          {t("onboarding.goalSubtitle")}
        </Text>
      </View>

      <ChoiceList
        options={goalOptions(t)}
        value={dailyGoal}
        onChange={setDailyGoal}
      />

      <Button
        title={t("common.next")}
        size="lg"
        fullWidth
        iconEnd="arrow-forward"
        disabled={!dailyGoal}
        onPress={() => router.push("/(onboarding)/reminder")}
      />
    </Screen>
  );
}

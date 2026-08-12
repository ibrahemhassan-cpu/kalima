import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Button, ChoiceList, ProgressDots, Screen, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { GOALS, useOnboarding } from "@/features/onboarding/store";
import { AuthHeader } from "@/features/auth/AuthHeader";

export default function GoalStep() {
  const { spacing } = useTheme();
  const router = useRouter();
  const dailyGoal = useOnboarding((s) => s.dailyGoal);
  const setDailyGoal = useOnboarding((s) => s.setDailyGoal);

  return (
    <Screen scroll>
      <AuthHeader title="" onBack={() => router.back()} />
      <ProgressDots total={3} index={1} />

      <View style={{ gap: spacing.sm, paddingTop: spacing.lg }}>
        <Text variant="title">عايز تراجع كام كلمة في اليوم؟</Text>
        <Text variant="body" tone="muted">
          الاستمرار أهم من العدد. ابدأ بحاجة تقدر تلتزم بيها فعلًا.
        </Text>
      </View>

      <ChoiceList
        options={GOALS.map((g) => ({
          key: g.key,
          title: g.title,
          subtitle: g.subtitle,
        }))}
        value={dailyGoal}
        onChange={setDailyGoal}
      />

      <Button
        title="التالي"
        size="lg"
        fullWidth
        disabled={!dailyGoal}
        onPress={() => router.push("/(onboarding)/reminder")}
      />
    </Screen>
  );
}

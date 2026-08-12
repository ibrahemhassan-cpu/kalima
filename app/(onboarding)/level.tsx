import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Button, ChoiceList, ProgressDots, Screen, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { LEVELS, useOnboarding } from "@/features/onboarding/store";

export default function LevelStep() {
  const { spacing } = useTheme();
  const router = useRouter();
  const level = useOnboarding((s) => s.level);
  const setLevel = useOnboarding((s) => s.setLevel);

  return (
    <Screen scroll>
      <ProgressDots total={3} index={0} />

      <View style={{ gap: spacing.sm, paddingTop: spacing.lg }}>
        <Text variant="title">مستواك في الإنجليزي إيه؟</Text>
        <Text variant="body" tone="muted">
          هنستخدمه عشان نظبط صعوبة الشرح والأمثلة. تقدر تغيّره في أي وقت.
        </Text>
      </View>

      <ChoiceList
        options={LEVELS.map((l) => ({
          key: l.key,
          title: l.title,
          subtitle: l.subtitle,
        }))}
        value={level}
        onChange={setLevel}
      />

      <Button
        title="التالي"
        size="lg"
        fullWidth
        disabled={!level}
        onPress={() => router.push("/(onboarding)/goal")}
      />
    </Screen>
  );
}

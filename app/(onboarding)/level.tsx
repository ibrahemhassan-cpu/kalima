import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Button, ChoiceList, Header, ProgressDots, Screen, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { levelOptions, useOnboarding } from "@/features/onboarding/store";

export default function LevelStep() {
  const { spacing } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const level = useOnboarding((s) => s.level);
  const setLevel = useOnboarding((s) => s.setLevel);

  return (
    <Screen scroll>
      <Header />
      <ProgressDots total={3} index={0} />

      <View style={{ gap: spacing.sm, paddingTop: spacing.lg }}>
        <Text variant="title">{t("onboarding.levelTitle")}</Text>
        <Text variant="body" tone="muted">
          {t("onboarding.levelSubtitle")}
        </Text>
      </View>

      <ChoiceList options={levelOptions(t)} value={level} onChange={setLevel} />

      <Button
        title={t("common.next")}
        size="lg"
        fullWidth
        iconEnd="arrow-forward"
        disabled={!level}
        onPress={() => router.push("/(onboarding)/goal")}
      />
    </Screen>
  );
}

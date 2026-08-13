import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ChoiceList, Header, Screen, Surface, Text } from "@/components/ui";
import { useSettings } from "@/store/settings";
import { fontScales, type FontScaleName } from "@/theme/typography";
import { useTheme } from "@/theme/ThemeProvider";

const LABEL: Record<FontScaleName, string> = {
  sm: "settings.fontSm",
  md: "settings.fontMd",
  lg: "settings.fontLg",
  xl: "settings.fontXl",
};

export default function FontSetting() {
  const router = useRouter();
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const fontScale = useSettings((s) => s.fontScale);
  const setFontScale = useSettings((s) => s.setFontScale);

  return (
    <Screen scroll>
      <Header title={t("settings.fontSize")} onBack={() => router.back()} />

      <Surface tone="glass" radiusKey="xl">
        <View style={{ gap: spacing.sm }}>
          <Text variant="micro" tone="faint">
            {t("settings.preview").toUpperCase()}
          </Text>
          <Text variant="word" ltr>
            resilient
          </Text>
          <Text variant="body">مرن · صامد</Text>
          <Text variant="caption" tone="muted">
            She is remarkably resilient.
          </Text>
        </View>
      </Surface>

      <ChoiceList<FontScaleName>
        options={(Object.keys(fontScales) as FontScaleName[]).map((k) => ({
          key: k,
          title: t(LABEL[k]),
        }))}
        value={fontScale}
        onChange={setFontScale}
      />
    </Screen>
  );
}

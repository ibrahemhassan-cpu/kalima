import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Card, ChoiceList, Screen, Text } from "@/components/ui";
import { AuthHeader } from "@/features/auth/AuthHeader";
import { useSettings } from "@/store/settings";
import { fontScaleLabels, type FontScaleName } from "@/theme/typography";
import { useTheme } from "@/theme/ThemeProvider";

export default function FontSetting() {
  const router = useRouter();
  const { spacing } = useTheme();
  const fontScale = useSettings((s) => s.fontScale);
  const setFontScale = useSettings((s) => s.setFontScale);

  return (
    <Screen scroll>
      <AuthHeader title="حجم الخط" onBack={() => router.back()} />

      <Card>
        <View style={{ gap: spacing.sm }}>
          <Text variant="caption" tone="faint">
            معاينة
          </Text>
          <Text variant="word" ltr>
            resilient
          </Text>
          <Text variant="body">مرن · صامد · سريع التعافي</Text>
          <Text variant="caption" tone="muted">
            هي مرنة بشكل ملحوظ.
          </Text>
        </View>
      </Card>

      <ChoiceList<FontScaleName>
        options={(Object.keys(fontScaleLabels) as FontScaleName[]).map((k) => ({
          key: k,
          title: fontScaleLabels[k],
        }))}
        value={fontScale}
        onChange={setFontScale}
      />
    </Screen>
  );
}

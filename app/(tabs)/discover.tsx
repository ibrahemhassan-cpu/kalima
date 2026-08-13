import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Header, Screen, Surface, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

export default function Discover() {
  const { colors, spacing, radius } = useTheme();
  const { t } = useTranslation();

  return (
    <Screen>
      <Header title={t("tabs.discover")} />
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.lg,
        }}
      >
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: radius.xl,
            backgroundColor: colors.sunken,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="compass-outline" size={40} color={colors.textFaint} />
        </View>
        <Surface tone="glass" radiusKey="xl">
          <Text variant="body" tone="muted" center>
            {t("home.nothingYetSubtitle")}
          </Text>
        </Surface>
      </View>
    </Screen>
  );
}

import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

/** شاشة مؤقتة للتبويبات اللي لسه ما اتبنتش */
export function Placeholder({
  icon,
  title,
  body,
  phase,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  phase: string;
}) {
  const { colors, spacing, radius } = useTheme();

  return (
    <Screen>
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
            width: 88,
            height: 88,
            borderRadius: radius.xl,
            backgroundColor: colors.sunken,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon} size={44} color={colors.textFaint} />
        </View>
        <Text variant="title" center>
          {title}
        </Text>
        <Text variant="body" tone="muted" center>
          {body}
        </Text>
        <Text variant="caption" tone="faint" center>
          {phase}
        </Text>
      </View>
    </Screen>
  );
}

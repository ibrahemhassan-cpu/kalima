import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="heading">{title}</Text>
      <View style={{ gap: spacing.sm }}>{children}</View>
    </View>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <Text variant="body" tone="muted">
      {children}
    </Text>
  );
}

export function Bullet({ children }: { children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: spacing.sm }}>
      <Text variant="body" tone="muted">
        ·
      </Text>
      <Text variant="body" tone="muted" style={{ flex: 1 }}>
        {children}
      </Text>
    </View>
  );
}

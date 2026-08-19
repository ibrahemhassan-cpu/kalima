import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { Button } from "./Button";
import { Text } from "./Text";

/**
 * What a screen shows when it has nothing to show.
 *
 * The zero state is the first thing a new user meets and the thing an app that
 * was rushed always forgets. Every one of them here says what's missing, why,
 * and the single next thing to do about it.
 */
export function EmptyState({
  icon,
  title,
  body,
  action,
  tone = "neutral",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap };
  /** `offline` when the thing is missing because there's no connection */
  tone?: "neutral" | "offline";
}) {
  const { colors, spacing, radius } = useTheme();

  const fg = tone === "offline" ? colors.warning : colors.textFaint;
  const bg = tone === "offline" ? colors.warningSoft : colors.sunken;

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.lg,
        paddingVertical: spacing.xxxl,
        paddingHorizontal: spacing.lg,
      }}
    >
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: radius.xl,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={38} color={fg} />
      </View>

      <View style={{ gap: spacing.xs, alignItems: "center" }}>
        <Text variant="heading" center>
          {title}
        </Text>
        {/* a share of the screen, so the measure holds at every text size */}
        {body ? (
          <Text variant="body" tone="muted" center style={{ maxWidth: "88%" }}>
            {body}
          </Text>
        ) : null}
      </View>

      {action ? (
        <Button
          title={action.label}
          size="lg"
          icon={action.icon}
          onPress={action.onPress}
        />
      ) : null}
    </View>
  );
}

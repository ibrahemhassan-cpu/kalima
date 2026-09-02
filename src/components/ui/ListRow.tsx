import React from "react";
import { Pressable, Switch, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { Elevated } from "./Elevated";
import { Text } from "./Text";
import { ICON_CHEVRON_FORWARD } from "@/i18n/rtl";

export type ListRowProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  /** لو موجود، الصف يبقى مفتاح تشغيل/إيقاف */
  toggle?: { value: boolean; onChange: (v: boolean) => void };
  last?: boolean;
};

export function ListRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  danger,
  toggle,
  last,
}: ListRowProps) {
  const { colors, spacing, minTouch } = useTheme();
  const tint = danger ? colors.danger : colors.textMuted;

  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        minHeight: minTouch + 8,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      {icon ? <Ionicons name={icon} size={22} color={tint} /> : null}

      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body" tone={danger ? "danger" : "default"}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="faint">
            {subtitle}
          </Text>
        ) : null}
      </View>

      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onChange}
          trackColor={{ false: colors.borderStrong, true: colors.brand }}
          thumbColor={colors.bg}
          accessibilityLabel={title}
        />
      ) : (
        <>
          {value ? (
            // never take more than half the row from the title beside it
            <Text
              variant="body"
              tone="muted"
              numberOfLines={1}
              style={{ flexShrink: 1, maxWidth: "55%" }}
            >
              {value}
            </Text>
          ) : null}
          {onPress ? (
            <Ionicons
              name={ICON_CHEVRON_FORWARD}
              size={20}
              color={colors.textFaint}
            />
          ) : null}
        </>
      )}
    </View>
  );

  if (!onPress || toggle) return content;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.sunken : "transparent",
      })}
    >
      {content}
    </Pressable>
  );
}

export function ListGroup({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const { colors, spacing, radius, shadow, isDark } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {title ? (
        <Text variant="label" tone="muted" style={{ paddingHorizontal: spacing.xs }}>
          {title}
        </Text>
      ) : null}
      <Elevated
        radius={radius.lg}
        shadow={shadow.sm}
        fill={colors.card}
        style={{
          // shadow separates in light, hairline separates in dark
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
        }}
      >
        {children}
      </Elevated>
    </View>
  );
}

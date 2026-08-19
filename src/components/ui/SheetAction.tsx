import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "./Text";
import { Touchable } from "./Touchable";
import { Button } from "./Button";

/** A single row inside a bottom sheet. */
export function SheetAction({
  icon,
  label,
  sublabel,
  onPress,
  danger,
  selected,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
  selected?: boolean;
}) {
  const { colors, spacing, radius, minTouch } = useTheme();
  const tint = danger ? colors.danger : selected ? colors.brand : colors.text;

  return (
    <Touchable
      onPress={onPress}
      haptic="select"
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        minHeight: minTouch + 6,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        backgroundColor: selected
          ? colors.brandSoft
          : danger
            ? colors.dangerSoft
            : colors.glassStrong,
        borderWidth: 1,
        borderColor: selected ? colors.brandBorder : colors.border,
      }}
    >
      {icon ? <Ionicons name={icon} size={20} color={tint} /> : null}
      <View style={{ flex: 1, gap: 1 }}>
        <Text variant="bodyStrong" style={{ color: tint }}>
          {label}
        </Text>
        {sublabel ? (
          <Text variant="caption" tone="faint">
            {sublabel}
          </Text>
        ) : null}
      </View>
      {selected ? (
        <Ionicons name="checkmark-circle" size={20} color={colors.brand} />
      ) : null}
    </Touchable>
  );
}

/** Destructive confirmation body — pair with <Sheet>. */
export function ConfirmBody({
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  loading,
  danger = true,
}: {
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  danger?: boolean;
}) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.xs }}>
        <Text variant="heading">{title}</Text>
        {body ? (
          <Text variant="body" tone="muted">
            {body}
          </Text>
        ) : null}
      </View>
      <View style={{ gap: spacing.sm }}>
        <Button
          title={confirmLabel}
          variant={danger ? "danger" : "primary"}
          size="lg"
          fullWidth
          loading={loading}
          onPress={onConfirm}
        />
        <Button
          title={cancelLabel}
          variant="secondary"
          size="lg"
          fullWidth
          onPress={onCancel}
        />
      </View>
    </View>
  );
}

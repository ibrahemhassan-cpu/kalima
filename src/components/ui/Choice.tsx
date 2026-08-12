import React from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "./Text";

export type ChoiceOption<T extends string | number> = {
  key: T;
  title: string;
  subtitle?: string;
};

/**
 * قائمة اختيار كبيرة الأهداف — تُستخدم في الـ Onboarding والإعدادات.
 * الاختيار يتبلّغ بعلامة صح ونص، مش باللون وحده.
 */
export function ChoiceList<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (key: T) => void;
}) {
  const { colors, spacing, radius, minTouch } = useTheme();

  return (
    <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={String(o.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.subtitle ? `${o.title}. ${o.subtitle}` : o.title}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(o.key);
            }}
            style={({ pressed }) => ({
              minHeight: minTouch + 12,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
              borderRadius: radius.md,
              borderWidth: active ? 2 : 1,
              borderColor: active ? colors.brand : colors.border,
              backgroundColor: active ? colors.brandSoft : colors.surface,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong" tone={active ? "brand" : "default"}>
                {o.title}
              </Text>
              {o.subtitle ? (
                <Text variant="caption" tone="muted">
                  {o.subtitle}
                </Text>
              ) : null}
            </View>

            <Ionicons
              name={active ? "checkmark-circle" : "ellipse-outline"}
              size={24}
              color={active ? colors.brand : colors.textFaint}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

/** نقاط تقدّم الـ Onboarding */
export function ProgressDots({ total, index }: { total: number; index: number }) {
  const { colors, spacing } = useTheme();
  return (
    <View
      accessibilityLabel={`الخطوة ${index + 1} من ${total}`}
      style={{ flexDirection: "row", gap: spacing.xs, justifyContent: "center" }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === index ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i <= index ? colors.brand : colors.border,
          }}
        />
      ))}
    </View>
  );
}

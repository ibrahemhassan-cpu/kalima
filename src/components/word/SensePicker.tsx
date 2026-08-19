import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Surface, Text, Touchable } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import type { Sense } from "@/lib/database.types";

/**
 * A word like "bank" or "light" means several things. Asking which one the
 * user actually met — instead of dumping all senses on them — is the
 * difference between a dictionary and a study tool.
 *
 * Only shown when there really is more than one sense.
 */
export function SensePicker({
  senses,
  selected,
  onSelect,
}: {
  senses: Sense[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  const { colors, spacing, radius, minTouch } = useTheme();
  const { t } = useTranslation();

  if (senses.length < 2) return null;

  return (
    <Animated.View entering={FadeInDown.duration(320).springify().damping(18)}>
      <Surface tone="glass" elevation="md" radiusKey="xl">
        <View style={{ gap: spacing.md }}>
          <View
            style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}
          >
            <Ionicons name="help-circle" size={19} color={colors.brand} />
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {t("word.whichMeaning")}
            </Text>
          </View>

          <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
            {senses.map((s, i) => {
              const active = i === selected;
              return (
                <Touchable
                  key={i}
                  haptic="select"
                  onPress={() => onSelect(i)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={s.ar_translations.join(", ")}
                  style={{
                    minHeight: minTouch,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    borderRadius: radius.md,
                    // no hairline on the inactive rows: a bordered box inside
                    // a bordered card is what reads as a stray inner outline
                    borderWidth: active ? 1.5 : 0,
                    borderColor: active ? colors.brand : "transparent",
                    backgroundColor: active ? colors.brandSoft : colors.sunken,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong" tone={active ? "brand" : "default"}>
                      {s.ar_translations.join(" · ")}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={2}>
                      {s.disambiguator_ar || s.ar_definition}
                    </Text>
                    <Text variant="micro" tone="faint" ltr>
                      {s.pos.toUpperCase()}
                    </Text>
                  </View>
                  <Ionicons
                    name={active ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={active ? colors.brand : colors.textFaint}
                  />
                </Touchable>
              );
            })}
          </View>

          <Text variant="caption" tone="faint">
            {t("word.whichMeaningHint")}
          </Text>
        </View>
      </Surface>
    </Animated.View>
  );
}

/** Offered when the model thinks the input was a typo. */
export function DidYouMean({
  suggestions,
  onPick,
}: {
  suggestions: string[];
  onPick: (word: string) => void;
}) {
  const { colors, spacing, radius, minTouch } = useTheme();
  const { t } = useTranslation();

  if (suggestions.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.duration(300).springify().damping(18)}>
      <Surface tone="glass" radiusKey="xl">
        <View style={{ gap: spacing.md }}>
          <View
            style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}
          >
            <Ionicons name="bulb-outline" size={18} color={colors.warning} />
            <Text variant="bodyStrong">{t("word.didYouMean")}</Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {suggestions.map((s) => (
              <Touchable
                key={s}
                haptic="select"
                onPress={() => onPick(s)}
                accessibilityRole="button"
                accessibilityLabel={s}
                style={{
                  minHeight: minTouch - 8,
                  justifyContent: "center",
                  paddingHorizontal: spacing.lg,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: colors.brandBorder,
                  backgroundColor: colors.brandSoft,
                }}
              >
                <Text variant="bodyStrong" tone="brand" ltr>
                  {s}
                </Text>
              </Touchable>
            ))}
          </View>
        </View>
      </Surface>
    </Animated.View>
  );
}

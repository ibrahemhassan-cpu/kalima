import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeProvider";
import { Text, Touchable } from "@/components/ui";
import { previewInterval } from "@/api/review";
import type { DueWord } from "@/lib/database.types";

const RATINGS = [0, 1, 2, 3] as const;
const KEYS = ["forgot", "hard", "good", "easy"] as const;

/**
 * Four buttons, each showing when the word will come back.
 * Telling the user the consequence up front is what makes SRS feel fair
 * instead of arbitrary.
 */
export function RatingBar({
  word,
  onRate,
  disabled,
}: {
  word: DueWord;
  onRate: (rating: 0 | 1 | 2 | 3) => void;
  disabled?: boolean;
}) {
  const { colors, spacing, radius, minTouch } = useTheme();
  const { t } = useTranslation();

  function whenLabel(rating: 0 | 1 | 2 | 3) {
    const p = previewInterval(word, rating);
    if (p.minutes != null) {
      return p.minutes >= 1440
        ? t("due.tomorrow")
        : t("due.minutes", { count: p.minutes });
    }
    const d = p.days ?? 1;
    if (d === 1) return t("due.tomorrow");
    if (d >= 30) {
      const m = Math.round(d / 30);
      return m === 1 ? t("due.month") : t("due.months", { count: m });
    }
    return t("due.days", { count: d });
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(320).springify().damping(18)}
      style={{ flexDirection: "row", gap: spacing.sm }}
    >
      {RATINGS.map((r, i) => (
        <Touchable
          key={r}
          disabled={disabled}
          haptic={r === 0 ? "medium" : "light"}
          onPress={() => onRate(r)}
          accessibilityRole="button"
          accessibilityLabel={`${t(`review.${KEYS[i]}`)} — ${whenLabel(r)}`}
          style={{
            flex: 1,
            minHeight: minTouch + 20,
            paddingVertical: spacing.md,
            borderRadius: radius.md,
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            backgroundColor: colors.ratingSoft[i],
            borderWidth: 1,
            borderColor: colors.rating[i] + "33",
          }}
        >
          <Text
            variant="label"
            style={{ color: colors.rating[i] }}
            numberOfLines={1}
          >
            {t(`review.${KEYS[i]}`)}
          </Text>
          <Text variant="micro" tone="faint" numberOfLines={1}>
            {whenLabel(r)}
          </Text>
        </Touchable>
      ))}
    </Animated.View>
  );
}

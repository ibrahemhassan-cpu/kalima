import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/theme/ThemeProvider";
import { Badge, SpeakButton, Surface, Text, Touchable } from "@/components/ui";
import { speak } from "@/features/tts";
import type { DueWord } from "@/lib/database.types";

/**
 * A real 3D flip — both faces are mounted and rotated on Y, so the card has
 * physical thickness rather than cross-fading.
 */
export function FlipCard({
  word,
  flipped,
  onFlip,
  autoplay,
}: {
  word: DueWord;
  flipped: boolean;
  onFlip: () => void;
  autoplay: boolean;
}) {
  const { colors, spacing, radius, shadow, spring } = useTheme();
  const { t } = useTranslation();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(flipped ? 1 : 0, {
      damping: 16,
      stiffness: 110,
      mass: 0.9,
    });
  }, [flipped, progress]);

  // Speak the word each time a new card lands.
  useEffect(() => {
    if (autoplay) speak(word.lemma);
  }, [word.user_word_id, autoplay, word.lemma]);

  const front = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(progress.value, [0, 1], [0, 180])}deg` },
    ],
    opacity: progress.value < 0.5 ? 1 : 0,
  }));

  const back = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(progress.value, [0, 1], [180, 360])}deg` },
    ],
    opacity: progress.value >= 0.5 ? 1 : 0,
  }));

  const face = {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: "hidden" as const,
  };

  const primary = word.senses[0];
  const example = word.examples[0];

  return (
    <Touchable
      onPress={onFlip}
      haptic="medium"
      scaleTo={0.99}
      accessibilityRole="button"
      accessibilityLabel={t("a11y.flipCard")}
      style={{ flex: 1, minHeight: 340 }}
    >
      {/* FRONT — the English word */}
      <Animated.View style={[face, front]}>
        <Surface
          tone="glass"
          elevation="lg"
          radiusKey="xxl"
          padded={spacing.xl}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.lg,
            }}
          >
            {word.cefr_level ? (
              <Badge label={word.cefr_level} tone="neutral" />
            ) : null}

            <Text variant="word" ltr center>
              {word.lemma}
            </Text>

            {word.ipa ? (
              <Text variant="caption" tone="faint" ltr>
                {word.ipa}
              </Text>
            ) : null}

            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <SpeakButton word={word.lemma} />
              <SpeakButton word={word.lemma} slow size="sm" />
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.xs,
              opacity: 0.6,
            }}
          >
            <Ionicons name="hand-left-outline" size={15} color={colors.textFaint} />
            <Text variant="caption" tone="faint">
              {t("review.tapToReveal")}
            </Text>
          </View>
        </Surface>
      </Animated.View>

      {/* BACK — the meaning */}
      <Animated.View style={[face, back]}>
        <Surface
          tone="glass"
          elevation="lg"
          radiusKey="xxl"
          padded={spacing.xl}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, gap: spacing.lg, justifyContent: "center" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
              }}
            >
              <Text variant="heading" ltr style={{ flex: 1 }}>
                {word.lemma}
              </Text>
              <SpeakButton word={word.lemma} size="sm" />
            </View>

            {primary ? (
              <View
                style={{
                  backgroundColor: colors.brandSoft,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  gap: spacing.xs,
                }}
              >
                <Text variant="title" tone="brand">
                  {primary.ar_translations.join(" · ")}
                </Text>
                <Text variant="body" tone="muted">
                  {primary.ar_definition}
                </Text>
              </View>
            ) : null}

            {example ? (
              <View
                style={{
                  gap: spacing.xs,
                  paddingStart: spacing.md,
                  borderStartWidth: 3,
                  borderStartColor: colors.borderStrong,
                }}
              >
                <Text variant="body" ltr>
                  {example.en}
                </Text>
                <Text variant="caption" tone="muted">
                  {example.ar}
                </Text>
              </View>
            ) : null}

            {word.memory_tip_ar ? (
              <View
                style={{
                  flexDirection: "row",
                  gap: spacing.sm,
                  alignItems: "flex-start",
                }}
              >
                <Ionicons name="bulb-outline" size={17} color={colors.accent} />
                <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                  {word.memory_tip_ar}
                </Text>
              </View>
            ) : null}
          </View>
        </Surface>
      </Animated.View>
    </Touchable>
  );
}

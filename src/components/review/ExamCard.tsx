import React, { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/theme/ThemeProvider";
import { Badge, Button, SpeakButton, Surface, Text, Touchable } from "@/components/ui";
import { BLANK, type ExamStep } from "@/features/exam/buildExam";

export type ExamAnswer = {
  given: string;
  correct: boolean;
  expected: string;
} | null;

/**
 * One question of a single-word exam.
 *
 * A step with options renders them; the one without takes a typed answer.
 * Only the last question is typed, and it shows the word's letter pattern, so
 * the exam asks what you remember rather than how well you spell on a phone.
 */
export function ExamCard({
  step,
  answered,
  onAnswer,
  disabled,
}: {
  step: ExamStep;
  answered: ExamAnswer;
  onAnswer: (value: string) => void;
  disabled?: boolean;
}) {
  const { colors, spacing, radius, type, minTouch, spring } = useTheme();
  const { t } = useTranslation();
  const [typed, setTyped] = useState("");
  const shake = useSharedValue(0);

  useEffect(() => {
    setTyped("");
  }, [step.prompt, step.kind]);

  useEffect(() => {
    if (answered && !answered.correct) {
      shake.value = withSequence(
        withTiming(-8, { duration: 55 }),
        withTiming(8, { duration: 55 }),
        withTiming(-5, { duration: 55 }),
        withSpring(0, spring.snappy),
      );
    }
  }, [answered, shake, spring.snappy]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const title = t(`exam.${step.kind}`);

  return (
    <View style={{ flex: 1, gap: spacing.md }}>
      <Surface tone="glass" elevation="lg" radiusKey="xxl" padded={spacing.xl}>
        <View style={{ gap: spacing.lg, minHeight: 180, justifyContent: "center" }}>
          <View style={{ flexDirection: "row" }}>
            <Badge label={title} tone="neutral" icon="school-outline" />
          </View>

          {step.kind === "listening" ? (
            <View style={{ alignItems: "center", gap: spacing.md }}>
              <SpeakButton word={step.prompt} size="lg" />
              <SpeakButton word={step.prompt} slow size="sm" />
            </View>
          ) : step.kind === "usage" ? (
            <Text variant="heading" ltr>
              {step.prompt.split(BLANK).map((part, i, all) => (
                <Text key={i} variant="heading" ltr>
                  {part}
                  {i < all.length - 1 ? (
                    <Text
                      variant="heading"
                      style={{ color: colors.brand, backgroundColor: colors.brandSoft }}
                    >
                      {"  " + BLANK + "  "}
                    </Text>
                  ) : null}
                </Text>
              ))}
            </Text>
          ) : (
            <Text
              variant={step.kind === "spell" ? "word" : "heading"}
              center={step.kind === "spell"}
              // the spell prompt is the Arabic meaning; everything else is English
              ltr={step.kind !== "spell"}
            >
              {step.prompt}
            </Text>
          )}

          {step.hint && step.kind !== "spell" ? (
            <Text variant="caption" tone="faint">
              {step.hint}
            </Text>
          ) : null}
        </View>
      </Surface>

      {step.options ? (
        <View style={{ gap: spacing.sm }}>
          {step.options.map((opt) => {
            const isChosen = answered?.given === opt;
            const isAnswer = answered?.expected === opt;
            let bg = colors.glassStrong;
            let border = colors.border;
            let fg = colors.text;
            let icon: keyof typeof Ionicons.glyphMap | null = null;

            if (answered) {
              if (isAnswer) {
                bg = colors.successSoft;
                border = colors.success;
                fg = colors.success;
                icon = "checkmark-circle";
              } else if (isChosen) {
                bg = colors.dangerSoft;
                border = colors.danger;
                fg = colors.danger;
                icon = "close-circle";
              } else {
                bg = "transparent";
              }
            }

            return (
              <Touchable
                key={opt}
                onPress={() => onAnswer(opt)}
                disabled={disabled || !!answered}
                haptic="light"
                accessibilityRole="button"
                accessibilityLabel={opt}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                  minHeight: minTouch + 12,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderRadius: radius.lg,
                  borderWidth: answered && (isAnswer || isChosen) ? 2 : 1,
                  borderColor: border,
                  backgroundColor: bg,
                }}
              >
                <Text variant="bodyStrong" ltr style={{ flex: 1, color: fg }} numberOfLines={2}>
                  {opt}
                </Text>
                {icon ? (
                  <Animated.View entering={FadeIn.duration(180)}>
                    <Ionicons name={icon} size={22} color={fg} />
                  </Animated.View>
                ) : null}
              </Touchable>
            );
          })}
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          {/*
            The letter pattern turns a spelling trap into a memory test: a
            learner who knows exactly what the word means still can't produce
            it from a blank box on a phone keyboard.
          */}
          {step.hint && step.kind === "spell" && !answered ? (
            <Text
              variant="heading"
              center
              ltr
              style={{ color: colors.brand, letterSpacing: 2 }}
            >
              {step.hint}
            </Text>
          ) : null}

          <Animated.View style={shakeStyle}>
            <TextInput
              value={answered ? answered.given : typed}
              onChangeText={setTyped}
              editable={!disabled && !answered}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
              placeholder={t("exam.typeHere")}
              placeholderTextColor={colors.textFaint}
              selectionColor={colors.brand}
              returnKeyType="done"
              onSubmitEditing={() => typed.trim() && onAnswer(typed)}
              style={[
                type.title,
                {
                  textAlign: "center",
                  writingDirection: "ltr",
                  color: answered
                    ? answered.correct
                      ? colors.success
                      : colors.danger
                    : colors.text,
                  minHeight: 68,
                  borderRadius: radius.lg,
                  borderWidth: 1.5,
                  borderColor: answered
                    ? answered.correct
                      ? colors.success
                      : colors.danger
                    : colors.border,
                  backgroundColor: colors.glassStrong,
                  paddingHorizontal: spacing.lg,
                },
              ]}
            />
          </Animated.View>

          {!answered ? (
            <Button
              title={t("common.confirm")}
              size="lg"
              fullWidth
              disabled={typed.trim().length === 0}
              onPress={() => onAnswer(typed)}
            />
          ) : null}
        </View>
      )}

      {answered ? (
        <Animated.View entering={FadeInDown.duration(280).springify().damping(18)}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: spacing.md,
              padding: spacing.lg,
              borderRadius: radius.lg,
              backgroundColor: answered.correct ? colors.successSoft : colors.dangerSoft,
            }}
          >
            <Ionicons
              name={answered.correct ? "checkmark-circle" : "information-circle"}
              size={22}
              color={answered.correct ? colors.success : colors.danger}
            />
            <Text
              variant="bodyStrong"
              style={{ flex: 1, color: answered.correct ? colors.success : colors.danger }}
            >
              {answered.correct
                ? t("quiz.correct")
                : t("quiz.wrong", { answer: answered.expected })}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

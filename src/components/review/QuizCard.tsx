import React, { useEffect, useMemo, useState } from "react";
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
import { duration } from "@/theme/motion";
import { Badge, Button, SpeakButton, Surface, Text, Touchable } from "@/components/ui";
import { speak } from "@/features/tts";
import type { SessionItem } from "@/api/session";

export type AnswerState = {
  chosen: string;
  correct: boolean;
  correctAnswer: string;
  explanation?: string | null;
} | null;

/**
 * Everything a question needs to be rendered — no SRS state.
 * Both the review session and the single-word quiz satisfy this.
 */
export type QuizCardItem = Pick<
  SessionItem,
  | "mode"
  | "question_id"
  | "lemma"
  | "ipa"
  | "prompt"
  | "prompt_hint"
  | "difficulty"
  | "options"
>;

/**
 * One question, whatever its kind. The prompt changes shape per mode but the
 * answer surface stays consistent so the interaction never feels unfamiliar.
 */
export function QuizCard({
  item,
  answered,
  onAnswer,
  disabled,
}: {
  item: QuizCardItem;
  answered: AnswerState;
  onAnswer: (value: string) => void;
  disabled?: boolean;
}) {
  const { colors, spacing, radius } = useTheme();
  const { t } = useTranslation();
  const [typed, setTyped] = useState("");

  useEffect(() => {
    setTyped("");
  }, [item.question_id]);

  // Listening mode plays automatically — the audio *is* the question.
  useEffect(() => {
    if (item.mode === "listening") speak(item.lemma);
  }, [item.question_id, item.mode, item.lemma]);

  const kindLabel = useMemo(() => {
    switch (item.mode) {
      case "mcq_en_ar":
        return t("quiz.chooseTranslation");
      case "mcq_ar_en":
        return t("quiz.chooseWord");
      case "listening":
        return t("quiz.listenAndChoose");
      case "fill_blank":
        return t("quiz.fillBlank");
      case "typing":
        return t("quiz.typeWord");
      default:
        return "";
    }
  }, [item.mode, t]);

  return (
    <View style={{ flex: 1, gap: spacing.md }}>
      <Surface tone="glass" elevation="lg" radiusKey="xxl" padded={spacing.xl}>
        <View style={{ gap: spacing.lg, minHeight: 200, justifyContent: "center" }}>
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
          >
            <Badge label={kindLabel} tone="neutral" icon="help-circle-outline" />
            {item.difficulty ? <DifficultyDots level={item.difficulty} /> : null}
          </View>

          <PromptBody item={item} />
        </View>
      </Surface>

      {item.mode === "typing" ? (
        <TypingAnswer
          value={typed}
          onChange={setTyped}
          answered={answered}
          disabled={disabled}
          onSubmit={() => onAnswer(typed)}
        />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {item.options.map((opt, i) => (
            <Animated.View
              key={opt}
              entering={FadeIn.duration(duration.normal)}
            >
              <OptionButton
                label={opt}
                ltr={item.mode !== "mcq_en_ar"}
                answered={answered}
                disabled={disabled || !!answered}
                onPress={() => onAnswer(opt)}
              />
            </Animated.View>
          ))}
        </View>
      )}

      {answered ? <Feedback answered={answered} /> : null}
    </View>
  );
}

// ── prompt ────────────────────────────────────────────────
function PromptBody({ item }: { item: QuizCardItem }) {
  const { colors, spacing, radius } = useTheme();

  if (item.mode === "listening") {
    return (
      <View style={{ alignItems: "center", gap: spacing.lg }}>
        <SpeakButton word={item.lemma} size="lg" />
        <SpeakButton word={item.lemma} slow size="sm" />
      </View>
    );
  }

  if (item.mode === "fill_blank") {
    const parts = (item.prompt ?? "").split("____");
    return (
      <View style={{ gap: spacing.md }}>
        {/* leading comes from the variant; a fixed one clamps under the glyphs at large sizes */}
        <Text variant="heading" ltr>
          {parts[0]}
          <Text
            variant="heading"
            style={{
              color: colors.brand,
              backgroundColor: colors.brandSoft,
              letterSpacing: 2,
            }}
          >
            {"  ____  "}
          </Text>
          {parts[1] ?? ""}
        </Text>
        {item.prompt_hint ? (
          <Text variant="caption" tone="muted">
            {item.prompt_hint}
          </Text>
        ) : null}
      </View>
    );
  }

  const isArabicPrompt = item.mode === "mcq_ar_en";

  return (
    <View style={{ gap: spacing.sm, alignItems: "center" }}>
      <Text variant="word" center ltr={!isArabicPrompt}>
        {item.prompt ?? item.lemma}
      </Text>
      {item.mode === "mcq_en_ar" && item.ipa ? (
        <Text variant="caption" tone="faint" ltr>
          {item.ipa}
        </Text>
      ) : null}
      {item.mode === "typing" && item.prompt_hint ? (
        <Text variant="caption" tone="muted" center>
          {item.prompt_hint}
        </Text>
      ) : null}
    </View>
  );
}

// ── option ────────────────────────────────────────────────
function OptionButton({
  label,
  ltr,
  answered,
  disabled,
  onPress,
}: {
  label: string;
  ltr: boolean;
  answered: AnswerState;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors, spacing, radius, minTouch, shadow } = useTheme();

  const isChosen = answered?.chosen === label;
  const isAnswer = answered?.correctAnswer === label;

  let bg = colors.glassStrong;
  let border = colors.border;
  let fg = colors.text;
  let icon: keyof typeof Ionicons.glyphMap | null = null;
  let shadowStyle = undefined;

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
      onPress={onPress}
      disabled={disabled}
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        {
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
        },
        shadowStyle,
      ]}
    >
      <Text
        variant="bodyStrong"
        ltr={ltr}
        style={{ flex: 1, color: fg }}
        numberOfLines={2}
      >
        {label}
      </Text>
      {icon ? (
        <Animated.View entering={FadeIn.duration(180)}>
          <Ionicons name={icon} size={22} color={fg} />
        </Animated.View>
      ) : null}
    </Touchable>
  );
}

// ── typing ────────────────────────────────────────────────
function TypingAnswer({
  value,
  onChange,
  answered,
  disabled,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  answered: AnswerState;
  disabled?: boolean;
  onSubmit: () => void;
}) {
  const { colors, spacing, radius, type, spring } = useTheme();
  const { t } = useTranslation();
  const shake = useSharedValue(0);

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

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const border = answered
    ? answered.correct
      ? colors.success
      : colors.danger
    : colors.border;

  return (
    <View style={{ gap: spacing.md }}>
      <Animated.View style={style}>
        <TextInput
          value={value}
          onChangeText={onChange}
          editable={!disabled && !answered}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          placeholder="…"
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.brand}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          style={[
            type.title,
            {
              textAlign: "center",
              writingDirection: "ltr",
              color: colors.text,
              minHeight: 68,
              borderRadius: radius.lg,
              borderWidth: 1.5,
              borderColor: border,
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
          disabled={value.trim().length === 0}
          onPress={onSubmit}
        />
      ) : null}
    </View>
  );
}

// ── feedback ──────────────────────────────────────────────
function Feedback({ answered }: { answered: NonNullable<AnswerState> }) {
  const { colors, spacing, radius } = useTheme();
  const { t } = useTranslation();

  return (
    <Animated.View entering={FadeInDown.duration(280).springify().damping(18)}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: spacing.md,
          padding: spacing.lg,
          borderRadius: radius.lg,
          backgroundColor: answered.correct
            ? colors.successSoft
            : colors.dangerSoft,
        }}
      >
        <Ionicons
          name={answered.correct ? "checkmark-circle" : "information-circle"}
          size={22}
          color={answered.correct ? colors.success : colors.danger}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            variant="bodyStrong"
            style={{ color: answered.correct ? colors.success : colors.danger }}
          >
            {answered.correct
              ? t("quiz.correct")
              : t("quiz.wrong", { answer: answered.correctAnswer })}
          </Text>
          {answered.explanation ? (
            <Text variant="caption" tone="muted">
              {answered.explanation}
            </Text>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

function DifficultyDots({ level }: { level: number }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 3, alignItems: "center" }}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: i <= level ? colors.textFaint : colors.sunken,
          }}
        />
      ))}
    </View>
  );
}

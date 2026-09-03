import React, { useMemo, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";

import {
  Badge,
  Button,
  Header,
  ProgressBar,
  Screen,
  SkeletonCard,
  Surface,
  Text,
  useCountUp,
} from "@/components/ui";
import { ExamCard, type ExamAnswer } from "@/components/review/ExamCard";
import { buildExam, sameAnswer } from "@/features/exam/buildExam";
import { useTheme } from "@/theme/ThemeProvider";
import { useWordDetail } from "@/api/words";
import { ICON_FORWARD } from "@/i18n/rtl";
import { useGoBack } from "@/lib/navigation";
import {
  useFinishWordQuiz,
  type QuizOutcome,
} from "@/api/quiz";

/**
 * Quiz on a single word.
 *
 * Every question is answered by choosing. The whole run lands as one review
 * at the end, rated by how many you got right — so you can drill a word as
 * often as you like without the schedule pretending you've mastered it.
 */
export default function WordQuiz() {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const goBack = useGoBack();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: word, isLoading } = useWordDetail(id);
  const finish = useFinishWordQuiz();

  /**
   * Built once per word, from data the screen already has.
   *
   * The exam used to come from the shared question bank — the same
   * multiple-choice cards the review session uses. On a screen you opened by
   * tapping "rent", "which of these is rent?" is not a question. Every step
   * here asks you to produce the word instead, so the answer is never on
   * screen to be picked out.
   */
  const steps = useMemo(
    () => (word ? buildExam(word.entry, word.custom_translation) : []),
    [word],
  );

  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<ExamAnswer>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [outcome, setOutcome] = useState<QuizOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startedAt = useRef(Date.now());
  const total = steps.length;
  const current = steps[index];

  /**
   * Graded here rather than on the server.
   *
   * The bank's answers stay server-side because a review question must not
   * ship its own answer. This exam has no such secret: the answer is the word
   * you chose to be tested on, and you are looking at its name in the header.
   * Grading locally makes it instant and works with no connection.
   */
  function answer(value: string) {
    if (!current || answered) return;
    const correct = sameAnswer(value, current.answer);
    setAnswered({ given: value.trim(), correct, expected: current.answer });
    if (correct) setCorrectCount((c) => c + 1);
    void Haptics.notificationAsync(
      correct
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning,
    );
  }

  async function next() {
    if (steps.length === 0) return;

    if (index + 1 < steps.length) {
      setIndex((i) => i + 1);
      setAnswered(null);
      return;
    }

    // last one — settle the whole exam as a single review
    try {
      const res = await finish.mutateAsync({
        userWordId: id!,
        correct: correctCount,
        total: steps.length,
        msTotal: Date.now() - startedAt.current,
        // every step is produced from memory, which is what typing means here
        lastMode: "typing",
      });
      setOutcome(res);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError(t("errors.generic"));
    }
  }

  function restart() {
    setIndex(0);
    setAnswered(null);
    setCorrectCount(0);
    setOutcome(null);
    setError(null);
    startedAt.current = Date.now();
  }

  // ── result ───────────────────────────────────────────────
  if (outcome) {
    return (
      <QuizResult
        outcome={outcome}
        lemma={word?.entry.lemma ?? ""}
        onRetry={restart}
        onDone={() => goBack()}
      />
    );
  }

  // ── loading ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <Screen>
        <Header onBack={() => goBack()} language={false} />
        <SkeletonCard lines={4} />
      </Screen>
    );
  }

  // ── nothing to build an exam from ────────────────────────
  if (steps.length === 0) {
    return (
      <Screen>
        <Header
          title={word?.entry.lemma ?? ""}
          onBack={() => goBack()}
          language={false}
        />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.lg,
          }}
        >
          <Ionicons name="help-circle-outline" size={54} color={colors.textFaint} />
          <Text variant="body" tone="muted" center>
            {t("quiz.noQuestions")}
          </Text>
          <Text variant="caption" tone="faint" center>
            {t("quiz.noQuestionsHint")}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title={word?.entry.lemma ?? ""}
        onBack={() => goBack()}
        language={false}
        right={
          <Badge
            label={t("review.progress", { current: index + 1, total })}
            tone="neutral"
          />
        }
      />

      <ProgressBar
        value={total > 0 ? (index + (answered ? 1 : 0)) / total : 0}
        height={6}
        label={t("a11y.progressOf", { done: index + 1, total })}
      />

      {current ? (
        <ExamCard step={current} answered={answered} onAnswer={answer} />
      ) : null}

      {error ? (
        <Text variant="caption" tone="danger" center>
          {error}
        </Text>
      ) : null}

      {answered ? (
        <Button
          title={index + 1 < total ? t("common.next") : t("quiz.seeResult")}
          size="lg"
          fullWidth
          icon={ICON_FORWARD}
          loading={finish.isPending}
          onPress={next}
        />
      ) : null}
    </Screen>
  );
}

// ── result ──────────────────────────────────────────────────
function QuizResult({
  outcome,
  lemma,
  onRetry,
  onDone,
}: {
  outcome: QuizOutcome;
  lemma: string;
  onRetry: () => void;
  onDone: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const { t } = useTranslation();

  const pct = Math.round(outcome.accuracy * 100);
  const shown = useCountUp(pct);
  const masteryPct = Math.round(outcome.mastery * 100);

  const tone = useMemo(() => {
    if (outcome.accuracy >= 1) return colors.success;
    if (outcome.accuracy >= 0.5) return colors.brand;
    return colors.danger;
  }, [outcome.accuracy, colors]);

  /** The four rating buttons a manual review would have shown. */
  const ratingLabel = ["review.forgot", "review.hard", "review.good", "review.easy"][
    outcome.rating
  ] as string;

  return (
    <Screen scroll>
      <Header language={false} />

      <Animated.View entering={FadeIn.duration(260)}>
        <Surface tone="glass" elevation="lg" radiusKey="xxl" padded={spacing.xl}>
          <View style={{ alignItems: "center", gap: spacing.lg }}>
            <Text variant="title" ltr>
              {lemma}
            </Text>

            <Text variant="display" style={{ color: tone }}>
              {shown}%
            </Text>

            <Text variant="body" tone="muted" center>
              {t("quiz.scoreOf", {
                correct: outcome.correct,
                total: outcome.total,
              })}
            </Text>

            <Badge
              label={t(ratingLabel)}
              tone={outcome.rating >= 2 ? "success" : "accent"}
              icon={outcome.rating >= 2 ? "checkmark-circle" : "refresh"}
            />
          </View>
        </Surface>
      </Animated.View>

      {/* where you've got to with this word */}
      <Surface tone="glass" radiusKey="xl">
        <View style={{ gap: spacing.md }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text variant="label" tone="muted">
              {t("quiz.mastery")}
            </Text>
            <Text variant="bodyStrong" tone="brand">
              {masteryPct}%
            </Text>
          </View>

          <ProgressBar
            value={outcome.mastery}
            tone={outcome.mastery >= 1 ? "success" : "brand"}
            label={t("quiz.mastery")}
          />

          <Text variant="micro" tone="faint">
            {t("quiz.masteryHint")}
          </Text>

          <View style={{ height: 1, backgroundColor: colors.border }} />

          <Row
            icon="repeat-outline"
            label={t("word.reviews")}
            value={String(outcome.repetitions)}
          />
          <Row
            icon="alert-circle-outline"
            label={t("word.lapses")}
            value={String(outcome.lapses)}
          />
          <Row
            icon="time-outline"
            label={t("quiz.nextReview")}
            value={t("due.daysShort", {
              count: Math.max(1, Math.round(outcome.interval_days)),
            })}
          />
        </View>
      </Surface>

      {outcome.mastered_now ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            padding: spacing.lg,
            borderRadius: radius.lg,
            backgroundColor: colors.successSoft,
          }}
        >
          <Ionicons name="ribbon" size={22} color={colors.success} />
          <Text variant="bodyStrong" style={{ color: colors.success }}>
            {t("review.masteredNow")}
          </Text>
        </View>
      ) : null}

      <Button
        title={t("quiz.retry")}
        size="lg"
        fullWidth
        variant="secondary"
        icon="refresh"
        onPress={onRetry}
      />
      <Button
        title={t("common.done")}
        size="lg"
        fullWidth
        icon="checkmark"
        onPress={onDone}
      />
    </Screen>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: spacing.xs,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Ionicons name={icon} size={17} color={colors.textFaint} />
        <Text variant="body" tone="muted">
          {label}
        </Text>
      </View>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut, SlideInRight } from "react-native-reanimated";

import { Badge, ProgressBar, Screen, Text, Touchable } from "@/components/ui";
import { Sheet, type SheetRef } from "@/components/ui/Sheet";
import { ConfirmBody } from "@/components/ui/SheetAction";
import { FlipCard } from "@/components/review/FlipCard";
import { RatingBar } from "@/components/review/RatingBar";
import { QuizCard, type AnswerState } from "@/components/review/QuizCard";
import { useTheme } from "@/theme/ThemeProvider";
import { PRESS_SCALE_SMALL } from "@/theme/motion";
import { useSettings } from "@/store/settings";
import { useSubmitReview } from "@/api/review";
import {
  backfillQuestions,
  type SessionItem,
  useSessionItems,
  useSubmitAnswer,
} from "@/api/session";
import { queueReview } from "@/lib/offline";
import type { DueWord, ReviewResult } from "@/lib/database.types";
import { useGoBack } from "@/lib/navigation";

type Tally = {
  reviewed: number;
  correct: number;
  streak: number;
  goalMet: boolean;
  badges: string[];
  mastered: number;
};

/** How long the answer feedback stays on screen before auto-advancing. */
const FEEDBACK_MS = { correct: 900, wrong: 2600 } as const;

export default function ReviewSession() {
  const { colors, spacing, radius, minTouch } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const goBack = useGoBack();
  const autoplay = useSettings((s) => s.autoplayAudio);

  const { data: queue, isLoading } = useSessionItems(20);
  const submitReview = useSubmitReview();
  const submitAnswer = useSubmitAnswer();

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answered, setAnswered] = useState<AnswerState>(null);
  const shownAt = useRef(Date.now());
  const exitSheet = useRef<SheetRef>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tally = useRef<Tally>({
    reviewed: 0,
    correct: 0,
    streak: 0,
    goalMet: false,
    badges: [],
    mastered: 0,
  });

  const total = queue?.length ?? 0;
  const current = queue?.[index];

  // Top up the question bank in the background while the user works.
  useEffect(() => {
    void backfillQuestions();
  }, []);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const finish = useCallback(() => {
    const q = tally.current;
    router.replace({
      pathname: "/session/result",
      params: {
        reviewed: String(q.reviewed),
        correct: String(q.correct),
        streak: String(q.streak),
        goalMet: q.goalMet ? "1" : "0",
        mastered: String(q.mastered),
        badges: q.badges.join(","),
      },
    });
  }, [router]);

  const advance = useCallback(() => {
    if (index >= total - 1) {
      finish();
      return;
    }
    setAnswered(null);
    setFlipped(false);
    setIndex((i) => i + 1);
    shownAt.current = Date.now();
  }, [index, total, finish]);

  // ── flashcard path ───────────────────────────────────────
  const rateCard = useCallback(
    async (rating: 0 | 1 | 2 | 3) => {
      if (!current) return;
      const ms = Date.now() - shownAt.current;
      const q = tally.current;
      q.reviewed += 1;
      if (rating >= 2) q.correct += 1;

      const promise = submitReview
        .mutateAsync({
          userWordId: current.user_word_id,
          rating,
          mode: "flashcard",
          msTaken: ms,
        })
        .then((res) => applyResult(q, res as ReviewResult))
        .catch(() =>
          // offline — keep it locally and replay on the next connection
          queueReview({
            client_id: `${current.user_word_id}:${Date.now()}`,
            user_word_id: current.user_word_id,
            rating,
            mode: "flashcard",
            is_correct: rating >= 2,
            ms_taken: ms,
            reviewed_at: new Date().toISOString(),
          }),
        );

      if (index >= total - 1) {
        await promise;
        finish();
      } else {
        advance();
      }
    },
    [current, index, total, submitReview, advance, finish],
  );

  // ── quiz path ────────────────────────────────────────────
  const answerQuestion = useCallback(
    async (value: string) => {
      if (!current?.question_id || answered) return;
      const ms = Date.now() - shownAt.current;

      try {
        const res = await submitAnswer.mutateAsync({
          userWordId: current.user_word_id,
          questionId: current.question_id,
          answer: value,
          msTaken: ms,
        });

        const q = tally.current;
        q.reviewed += 1;
        if (res.correct) q.correct += 1;
        applyResult(q, res);

        setAnswered({
          chosen: value,
          correct: res.correct,
          correctAnswer: res.correct_answer,
          explanation: res.explanation_ar,
        });

        void Haptics.notificationAsync(
          res.correct
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Error,
        );

        advanceTimer.current = setTimeout(
          advance,
          res.correct ? FEEDBACK_MS.correct : FEEDBACK_MS.wrong,
        );
      } catch {
        // network hiccup — let them try again rather than losing the card
      }
    },
    [current, answered, submitAnswer, advance],
  );

  function confirmExit() {
    if (tally.current.reviewed === 0) {
      goBack();
      return;
    }
    exitSheet.current?.open();
  }

  if (isLoading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </Screen>
    );
  }

  if (!current) {
    return (
      <Screen>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.lg,
          }}
        >
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          <Text variant="title" center>
            {t("review.nothingDueTitle")}
          </Text>
          <Touchable onPress={() => goBack()}>
            <Text variant="bodyStrong" tone="brand">
              {t("review.backHome")}
            </Text>
          </Touchable>
        </View>
      </Screen>
    );
  }

  const isQuiz = current.mode !== "flashcard" && !!current.question_id;

  return (
    <Screen padded glow={false}>
      {/* progress */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <Touchable
          onPress={confirmExit}
      scaleTo={PRESS_SCALE_SMALL}
          accessibilityRole="button"
          accessibilityLabel={t("review.endSession")}
          style={{
            width: minTouch - 8,
            height: minTouch - 8,
            borderRadius: radius.pill,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.glassStrong,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </Touchable>

        <View style={{ flex: 1 }}>
          <ProgressBar
            value={index / Math.max(total, 1)}
            label={t("a11y.progressOf", { done: index, total })}
          />
        </View>

        <Text variant="label" tone="muted">
          {t("review.progress", { current: index + 1, total })}
        </Text>
      </View>

      {/* card */}
      <Animated.View
        key={`${current.user_word_id}-${current.mode}`}
        entering={SlideInRight.duration(280).springify().damping(20)}
        exiting={FadeOut.duration(120)}
        style={{ flex: 1 }}
      >
        {isQuiz ? (
          <QuizCard
            item={current}
            answered={answered}
            onAnswer={answerQuestion}
            disabled={submitAnswer.isPending}
          />
        ) : (
          <FlipCard
            word={toDueWord(current)}
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
            autoplay={autoplay}
          />
        )}
      </Animated.View>

      {/* flashcard rating */}
      {!isQuiz ? (
        flipped ? (
          <RatingBar word={toDueWord(current)} onRate={rateCard} />
        ) : (
          <View style={{ minHeight: minTouch + 20, justifyContent: "center" }}>
            <Text variant="caption" tone="faint" center>
              {t("review.tapToReveal")}
            </Text>
          </View>
        )
      ) : answered ? (
        <Animated.View entering={FadeIn.duration(200)}>
          <Touchable onPress={advance} haptic="light">
            <Text variant="label" tone="brand" center>
              {t("common.next")} →
            </Text>
          </Touchable>
        </Animated.View>
      ) : (
        <View style={{ minHeight: 24 }} />
      )}

      <Sheet ref={exitSheet}>
        <ConfirmBody
          title={t("sheet.endSessionTitle")}
          body={t("review.endConfirmBody")}
          confirmLabel={t("review.endSession")}
          cancelLabel={t("common.cancel")}
          onCancel={() => exitSheet.current?.close()}
          onConfirm={() => {
            exitSheet.current?.close();
            finish();
          }}
        />
      </Sheet>
    </Screen>
  );
}

/** FlipCard predates the session composer and speaks the older shape. */
function toDueWord(i: SessionItem): DueWord {
  return {
    user_word_id: i.user_word_id,
    entry_id: i.entry_id,
    lemma: i.lemma,
    ipa: i.ipa,
    audio_url: i.audio_url,
    cefr_level: i.cefr_level,
    senses: i.senses,
    examples: i.examples,
    synonyms: [],
    antonyms: [],
    memory_tip_ar: i.memory_tip_ar,
    status: i.status,
    repetitions: i.repetitions,
    interval_days: i.interval_days,
    ease_factor: i.ease_factor,
    due_at: i.due_at,
    personal_note: null,
    is_favorite: false,
    custom_translation: i.custom_translation,
  };
}

function applyResult(q: Tally, res: ReviewResult) {
  if (!res || res.duplicate) return;
  q.streak = res.current_streak ?? q.streak;
  q.goalMet = q.goalMet || !!res.goal_met;
  if (res.mastered_now) q.mastered += 1;
  if (res.new_badges?.length) q.badges.push(...res.new_badges);
}

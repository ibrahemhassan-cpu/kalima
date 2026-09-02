import React, { useMemo } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import {
  Badge,
  Button,
  CircularProgress,
  EmptyState,
  Header,
  Screen,
  SkeletonCard,
  Surface,
  Text,
} from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { useDueWords } from "@/api/review";
import { formatDue } from "@/api/words";
import { supabase } from "@/lib/supabase";
import type { HomeSummary } from "@/lib/database.types";
import { useRefreshAll } from "@/lib/refresh";

export default function ReviewTab() {
  const { colors, spacing } = useTheme();
  const { refreshing, onRefresh } = useRefreshAll();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: due, isLoading } = useDueWords(40);
  const { data: summary } = useQuery({
    queryKey: ["home-summary"],
    queryFn: async (): Promise<HomeSummary> => {
      const { data, error } = await supabase.rpc("get_home_summary");
      if (error) throw error;
      return data as unknown as HomeSummary;
    },
  });

  const count = due?.length ?? 0;
  const total = summary?.total_words ?? 0;
  const doneCount = summary?.today_reviews ?? 0;
  const totalCount = summary?.daily_goal ?? 10;
  const streak = summary?.current_streak ?? 0;

  /** What's actually in the queue right now — the three numbers add up to it. */
  const queue = useMemo(() => {
    const list = due ?? [];
    return {
      fresh: list.filter((w) => w.status === "new").length,
      review: list.filter((w) =>
        ["learning", "review", "mastered"].includes(w.status),
      ).length,
      hard: list.filter((w) => w.status === "leech").length,
    };
  }, [due]);

  return (
    <Screen scroll tabBar onRefresh={onRefresh} refreshing={refreshing}>
      <Header
        title={t("review.title")}
        right={
          streak > 0 ? (
            <Badge
              label={t("home.streak", { count: streak })}
              tone="accent"
              icon="flame"
            />
          ) : null
        }
      />

      {isLoading ? (
        <View style={{ gap: spacing.lg }}>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={3} />
        </View>
      ) : total === 0 ? (
        <EmptyState
          icon="book-outline"
          title={t("review.emptyTitle")}
          body={t("review.emptyBody")}
          action={{
            label: t("home.addWord"),
            icon: "add",
            onPress: () => router.push("/add-word"),
          }}
        />
      ) : count === 0 ? (
        <EmptyState
          icon="checkmark-done-outline"
          title={t("review.nothingDueTitle")}
          body={t("review.nothingDueBody", {
            when: summary?.next_due_at
              ? formatDue(summary.next_due_at, t)
              : t("due.tomorrow"),
          })}
        />
      ) : (
        <>
          {/* today against the daily goal */}
          <Surface tone="glass" elevation="lg" radiusKey="xxl" padded={spacing.xl}>
            <View style={{ alignItems: "center", gap: spacing.lg }}>
              <CircularProgress
                current={doneCount}
                total={totalCount}
                size={180}
                strokeWidth={14}
                title={t("home.todayProgress")}
                label={t("home.wordsReviewed")}
              />

              <Button
                title={count > 0 ? t("home.startReview") : t("home.addWord")}
                size="lg"
                fullWidth
                icon={count > 0 ? "play" : "add"}
                onPress={() =>
                  count > 0 ? router.push("/session/review") : router.push("/add-word")
                }
              />
            </View>
          </Surface>

          {/* what the queue is actually made of — the three add up to `count` */}
          <Surface tone="glass" radiusKey="xl">
            <View style={{ gap: spacing.md }}>
              <Text variant="label" tone="muted">
                {t("review.queueTitle")}
              </Text>

              <View style={{ gap: spacing.sm }}>
                <PlanRow
                  icon="sparkles-outline"
                  label={t("status.new")}
                  val={queue.fresh}
                  color={colors.brand}
                />
                <PlanRow
                  icon="repeat-outline"
                  label={t("review.title")}
                  val={queue.review}
                  color={colors.accent}
                />
                <PlanRow
                  icon="flame-outline"
                  label={t("status.leech")}
                  val={queue.hard}
                  color={colors.danger}
                />
              </View>
            </View>
          </Surface>

          {/* lifetime numbers, so the queue card stays about today */}
          <Surface tone="glass" radiusKey="xl">
            <View style={{ gap: spacing.md }}>
              <Text variant="label" tone="muted">
                {t("review.overview")}
              </Text>

              <View style={{ gap: spacing.sm }}>
                <PlanRow
                  icon="library-outline"
                  label={t("home.statWords")}
                  val={summary?.total_words ?? 0}
                  color={colors.brand}
                />
                <PlanRow
                  icon="ribbon-outline"
                  label={t("home.statMastered")}
                  val={summary?.mastered_words ?? 0}
                  color={colors.success}
                />
                <PlanRow
                  icon="flame-outline"
                  label={t("profile.statStreak")}
                  val={summary?.longest_streak ?? 0}
                  color={colors.accent}
                />
              </View>
            </View>
          </Surface>

          {/* Due Words Preview List */}
          {due && due.length > 0 ? (
            <Surface tone="glass" radiusKey="xl">
              <View style={{ gap: spacing.md }}>
                <Text variant="label" tone="muted">
                  {t("review.dueList")}
                </Text>
                {due.slice(0, 5).map((w) => (
                  <View
                    key={w.user_word_id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.md,
                    }}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: colors.brand,
                      }}
                    />
                    <Text variant="body" ltr style={{ flex: 1 }}>
                      {w.lemma}
                    </Text>
                    <Text variant="caption" tone="faint">
                      {formatDue(w.due_at, t)}
                    </Text>
                  </View>
                ))}
              </View>
            </Surface>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function PlanRow({
  icon,
  label,
  val,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  val: number;
  color: string;
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          flex: 1,
        }}
      >
        <Ionicons name={icon} size={18} color={color} />
        {/* the label yields; the number is the whole point of the row */}
        <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
          {label}
        </Text>
      </View>
      <Text variant="bodyStrong" tone="muted">
        {val}
      </Text>
    </View>
  );
}

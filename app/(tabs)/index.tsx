import React from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";

import {
  Button,
  EmptyState,
  LanguageToggle,
  ProgressBar,
  Screen,
  Surface,
  Text,
  Touchable,
  useCountUp,
  usePulse,
} from "@/components/ui";
import { WordCard } from "@/components/word/WordCard";
import { PackChip } from "@/components/packs/PackCard";
import { useTheme } from "@/theme/ThemeProvider";
import { useSettings } from "@/store/settings";
import { useOnline } from "@/lib/network";
import { useProfile } from "@/api/profile";
import { useTopicPacks } from "@/api/packs";
import { useMyWords } from "@/api/words";
import { supabase } from "@/lib/supabase";
import type { HomeSummary } from "@/lib/database.types";

export default function Home() {
  const { colors, spacing, radius, shadow } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const simpleMode = useSettings((s) => s.simpleMode);
  const online = useOnline();
  const { data: profile } = useProfile();

  const { data: summary } = useQuery({
    queryKey: ["home-summary"],
    queryFn: async (): Promise<HomeSummary> => {
      const { data, error } = await supabase.rpc("get_home_summary");
      if (error) throw error;
      return data as unknown as HomeSummary;
    },
  });

  const { data: recent, isPending: loadingWords } = useMyWords({
    filter: "all",
    search: "",
    sort: "recent",
  });
  const { data: packs } = useTopicPacks();

  /**
   * A brand-new account has nothing to summarise. Showing a streak of zero, a
   * goal bar at zero and three zero stats reads as a broken app rather than an
   * empty one — so before any of that exists, the screen asks for one word.
   */
  const nothingYet = summary != null && summary.total_words === 0;

  /**
   * No summary and no connection means we genuinely don't know the numbers.
   * Rendering the dashboard anyway fills every slot from `?? 0` — a zero
   * streak and a 0/10 goal presented as fact. Say we can't reach the server
   * instead; everything already saved is still one tap away below.
   */
  const unknown = summary == null && !online;

  const goal = summary?.daily_goal ?? profile?.daily_goal ?? 10;
  const done = summary?.today_reviews ?? 0;
  const due = summary?.due_count ?? 0;
  const total = summary?.total_words ?? 0;
  const pct = goal > 0 ? done / goal : 0;

  const streak = summary?.current_streak ?? 0;

  return (
    <Screen scroll tabBar>
      {/* header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          marginBottom: spacing.xs,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="caption" tone="muted">
            {t("home.greeting")}
          </Text>
          <Text variant="title" numberOfLines={1} style={{ fontWeight: "700" }}>
            {profile?.display_name ?? "—"}
          </Text>
        </View>

        <LanguageToggle compact />
      </View>

      {unknown ? (
        <EmptyState
          tone="offline"
          icon="cloud-offline-outline"
          title={t("errors.offlineTitle")}
          body={t("errors.offlineBody")}
        />
      ) : null}

      {nothingYet ? (
        <EmptyState
          icon="sparkles-outline"
          title={t("home.emptyTitle")}
          body={t("home.emptyBody")}
          action={{
            label: t("home.addWord"),
            icon: "add",
            onPress: () => router.push("/add-word"),
          }}
        />
      ) : null}

      {!nothingYet && !unknown ? (
      <>
      {/* streak hero card matching mockup */}
      <Surface tone="glass" elevation="md" radiusKey="xl" padded={spacing.lg}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ gap: 4 }}>
            {/* no letterSpacing / uppercase here: both mangle Arabic script */}
            <Text variant="micro" tone="muted">
              {t("home.currentStreak")}
            </Text>
            <Text variant="display" style={{ fontWeight: "800" }}>
              {t("home.streak", { count: streak })}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            {/*
              Shields exist in the database, refill every month and already
              protect the streak — the user simply had no way to know. One is
              worth showing; zero is worth showing too, so the number means
              something when it changes.
            */}
            {(summary?.streak_freezes ?? 0) > 0 ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 5,
                  borderRadius: radius.pill,
                  backgroundColor: colors.brandSoft,
                }}
                accessibilityLabel={t("home.shieldsA11y", {
                  count: summary?.streak_freezes ?? 0,
                })}
              >
                <Ionicons name="shield-checkmark" size={14} color={colors.brand} />
                <Text variant="caption" tone="brand" style={{ fontWeight: "700" }}>
                  {summary?.streak_freezes ?? 0}
                </Text>
              </View>
            ) : null}

                    <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.accentSoft,
              borderWidth: 1,
              borderColor: "rgba(255,138,61,0.22)",
            }}
          >
            <Ionicons name="flame" size={30} color={colors.accent} />
          </View>
                  </View>
        </View>
      </Surface>

      {(summary?.streak_freezes ?? 0) > 0 ? (
        <Text variant="micro" tone="faint" style={{ marginTop: spacing.xs }}>
          {t("home.shieldsHint", { count: summary?.streak_freezes ?? 0 })}
        </Text>
      ) : null}

      {/* today's progress summary card */}
      <Surface
        tone="glass"
        elevation="lg"
        radiusKey="xxl"
        padded={spacing.xl}
      >
        <View style={{ gap: spacing.lg }}>
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}
          >
            <View
              style={[
                {
                  width: 62,
                  height: 62,
                  borderRadius: radius.lg,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                },
                due > 0 ? shadow.brand : undefined,
              ]}
            >
              {due > 0 ? (
                <LinearGradient
                  colors={[colors.brand, colors.brandAlt]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: "absolute", inset: 0 }}
                />
              ) : (
                <View
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: colors.successSoft,
                  }}
                />
              )}
              <Ionicons
                name={due > 0 ? "layers" : "checkmark"}
                size={28}
                color={due > 0 ? colors.onBrand : colors.success}
              />
            </View>

            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="micro" tone="muted">
                {t("home.todayProgress")}
              </Text>
              <Text variant="title" style={{ fontWeight: "700" }}>
                {done} <Text variant="heading" tone="muted">/ {goal}</Text>{" "}
                <Text variant="caption" tone="faint">
                  {t("home.wordsReviewed")}
                </Text>
              </Text>
            </View>
          </View>

          <ProgressBar
            value={pct}
            tone={pct >= 1 ? "success" : "brand"}
            label={t("a11y.progressOf", { done, total: goal })}
          />

          <Button
            title={due > 0 ? t("home.startReview") : t("home.addWord")}
            size="lg"
            fullWidth
            icon={due > 0 ? "play" : "add"}
            onPress={() =>
              due > 0 ? router.push("/session/review") : router.push("/add-word")
            }
          />
        </View>
      </Surface>

      {/* stats summary grid */}
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <Stat label={t("home.statWords")} value={total} icon="library-outline" />
        <Stat
          label={t("home.statMastered")}
          value={summary?.mastered_words ?? 0}
          icon="ribbon-outline"
        />
        <Stat
          label={t("home.statLevel")}
          value={summary?.level ?? 1}
          icon="trending-up-outline"
        />
      </View>

      {/* recent words */}
      {recent && recent.length > 0 ? (
        <View style={{ gap: spacing.md }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text variant="label" tone="muted">
              {t("home.recent")}
            </Text>
            <Touchable
              onPress={() => router.push("/(tabs)/words")}
              haptic="select"
            >
              <Text variant="label" tone="brand">
                {t("common.seeAll")}
              </Text>
            </Touchable>
          </View>

          <View style={{ gap: spacing.sm }}>
            {recent.slice(0, 3).map((w) => (
              <WordCard
                key={w.user_word_id}
                row={w}
                onPress={() => router.push(`/word/${w.user_word_id}`)}
              />
            ))}
          </View>
        </View>
      ) : null}

      </>
      ) : null}

      {/* topic packs — the way into Discover; simple mode hides it by design */}
      {!simpleMode && packs && packs.length > 0 ? (
        <View style={{ gap: spacing.md }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text variant="label" tone="muted">
              {t("packs.title")}
            </Text>
            <Touchable
              onPress={() => router.push("/(tabs)/discover")}
              haptic="select"
            >
              <Text variant="label" tone="brand">
                {t("common.seeAll")}
              </Text>
            </Touchable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm, paddingEnd: spacing.lg }}
          >
            {packs.slice(0, 6).map((p) => (
              <PackChip
                key={p.pack_id}
                pack={p}
                onPress={() => router.push(`/pack/${p.pack_id}`)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* quick add word button */}
      <Touchable
        accessibilityRole="button"
        accessibilityLabel={t("a11y.addWord")}
        onPress={() => router.push("/add-word")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          minHeight: 56,
          borderRadius: radius.lg,
          borderWidth: 1.5,
          borderStyle: "dashed",
          borderColor: colors.borderStrong,
        }}
      >
        <Ionicons name="add-circle-outline" size={21} color={colors.brand} />
        <Text variant="bodyStrong" tone="brand">
          {t("home.addWord")}
        </Text>
      </Touchable>
    </Screen>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Surface tone="glass" radiusKey="lg" padded={spacing.lg} style={{ flex: 1 }}>
      <View style={{ alignItems: "center", gap: spacing.xs, backgroundColor: "transparent" }}>
        <Ionicons name={icon} size={19} color={colors.textFaint} />
        <Text variant="heading">{value}</Text>
        <Text variant="micro" tone="faint" numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Surface>
  );
}

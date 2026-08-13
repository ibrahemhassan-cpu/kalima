import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";

import {
  Button,
  Enter,
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
import { useTheme } from "@/theme/ThemeProvider";
import { useProfile } from "@/api/profile";
import { useMyWords } from "@/api/words";
import { supabase } from "@/lib/supabase";
import type { HomeSummary } from "@/lib/database.types";

export default function Home() {
  const { colors, spacing, radius, shadow } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: profile } = useProfile();

  const { data: summary } = useQuery({
    queryKey: ["home-summary"],
    queryFn: async (): Promise<HomeSummary> => {
      const { data, error } = await supabase.rpc("get_home_summary");
      if (error) throw error;
      return data as unknown as HomeSummary;
    },
  });

  const { data: recent } = useMyWords({ filter: "all", search: "", sort: "recent" });

  const goal = summary?.daily_goal ?? profile?.daily_goal ?? 10;
  const done = summary?.today_reviews ?? 0;
  const due = summary?.due_count ?? 0;
  const total = summary?.total_words ?? 0;
  const pct = goal > 0 ? done / goal : 0;

  const streak = summary?.current_streak ?? 0;
  const streakShown = useCountUp(streak);
  const flame = usePulse(streak > 0);

  return (
    <Screen scroll>
      {/* header */}
      <Enter>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="caption" tone="muted">
              {t("home.greeting")}
            </Text>
            <Text variant="title" numberOfLines={1}>
              {profile?.display_name ?? "—"}
            </Text>
          </View>

          <LanguageToggle compact />

          <Animated.View
            style={flame}
            accessibilityLabel={t("a11y.streakDays", { count: streak })}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs,
                backgroundColor: colors.accentSoft,
                paddingHorizontal: spacing.md,
                paddingVertical: 7,
                borderRadius: radius.pill,
              }}
            >
              <Ionicons name="flame" size={17} color={colors.accent} />
              <Text variant="bodyStrong" style={{ color: colors.warning }}>
                {streakShown}
              </Text>
            </View>
          </Animated.View>
        </View>
      </Enter>

      {/* hero */}
      <Enter index={1}>
        <Surface
          tone="glass"
          elevation="lg"
          radiusKey="xxl"
          padded={spacing.xl}
          bordered
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
                <Text variant="heading">
                  {due > 0
                    ? t("home.dueCount", { count: due })
                    : total > 0
                      ? t("home.allDone")
                      : t("home.nothingYet")}
                </Text>
                <Text variant="caption" tone="muted">
                  {due > 0
                    ? t("home.dueSubtitle")
                    : total > 0
                      ? t("home.allDoneSubtitle")
                      : t("home.nothingYetSubtitle")}
                </Text>
              </View>
            </View>

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
      </Enter>

      {/* daily goal */}
      <Enter index={2}>
        <Surface tone="glass" radiusKey="xl">
          <View style={{ gap: spacing.md }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text variant="label" tone="muted">
                {t("home.dailyGoal")}
              </Text>
              <Text
                variant="bodyStrong"
                tone={pct >= 1 ? "success" : "default"}
              >
                {done} / {goal}
              </Text>
            </View>

            <ProgressBar
              value={pct}
              tone={pct >= 1 ? "success" : "brand"}
              label={t("a11y.progressOf", { done, total: goal })}
            />

            {pct >= 1 ? (
              <Text variant="caption" tone="success">
                {t("home.goalReached")}
              </Text>
            ) : null}
          </View>
        </Surface>
      </Enter>

      {/* stats */}
      <Enter index={3}>
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
      </Enter>

      {/* recent */}
      {recent && recent.length > 0 ? (
        <Enter index={4}>
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
                scaleTo={0.94}
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
        </Enter>
      ) : null}

      {/* add */}
      <Enter index={5}>
        <Touchable
          accessibilityRole="button"
          accessibilityLabel={t("a11y.addWord")}
          onPress={() => router.push("/add-word")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            minHeight: 58,
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
      </Enter>
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
  const shown = useCountUp(value);
  return (
    <Surface tone="glass" radiusKey="lg" padded={spacing.lg} style={{ flex: 1 }}>
      <View style={{ alignItems: "center", gap: spacing.xs }}>
        <Ionicons name={icon} size={19} color={colors.textFaint} />
        <Text variant="heading">{shown}</Text>
        <Text variant="micro" tone="faint" numberOfLines={1}>
          {label.toUpperCase()}
        </Text>
      </View>
    </Surface>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { I18nManager, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

import {
  Badge,
  Button,
  Screen,
  Surface,
  Text,
  Touchable,
} from "@/components/ui";
import { Sheet, type SheetRef } from "@/components/ui/Sheet";
import { useTheme } from "@/theme/ThemeProvider";
import { useProfile } from "@/api/profile";
import { useDueWords } from "@/api/review";
import { useAchievements } from "@/api/achievements";
import {
  hasPermission,
  requestPermission,
  syncReminders,
} from "@/features/notifications";
import { parseReminderTimes } from "@/features/notifications/useReminders";

export default function SessionResult() {
  const { colors, spacing, radius, shadow } = useTheme();
  const { t, i18n } = useTranslation();
  // startsWith, not ===: the detected language can carry a region ("en-US")
  const isEn = !i18n.language.startsWith("ar");
  const router = useRouter();
  const p = useLocalSearchParams<Record<string, string>>();

  const reviewed = Number(p.reviewed ?? 0);
  const correct = Number(p.correct ?? 0);
  const streak = Number(p.streak ?? 0);
  const goalMet = p.goalMet === "1";
  const mastered = Number(p.mastered ?? 0);
  const badgeCodes = (p.badges ?? "").split(",").filter(Boolean);

  const accuracy = reviewed > 0 ? Math.round((correct / reviewed) * 100) : 0;

  /**
   * submit_review has always returned new_badges, and this screen has always
   * parsed them — into a variable nothing rendered. So a badge unlocked in
   * total silence, and the only way to find out was to go digging in
   * Profile → Achievements. This is the moment it was earned; it says so here.
   *
   * The catalog is cached and persisted, so the titles are available offline
   * too. If it somehow isn't loaded, the row is skipped rather than showing a
   * bare code.
   */
  const { data: catalog } = useAchievements({
    enabled: badgeCodes.length > 0,
  });
  const earnedNow = badgeCodes
    .map((code) => catalog?.find((a) => a.code === code))
    .filter((a): a is NonNullable<typeof a> => !!a);

  const { data: profile } = useProfile();
  // only offer another round when there is genuinely something left
  const { data: due } = useDueWords(40);
  const stillDue = due?.length ?? 0;
  const permSheet = useRef<SheetRef>(null);
  const [asked, setAsked] = useState(false);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  // Ask for notifications only after real work is done — acceptance is far
  // higher here than on a cold first launch.
  useEffect(() => {
    if (asked || reviewed === 0) return;
    let alive = true;
    void hasPermission().then((granted) => {
      if (!alive || granted) return;
      setAsked(true);
      setTimeout(() => permSheet.current?.open(), 1400);
    });
    return () => {
      alive = false;
    };
  }, [asked, reviewed]);

  async function enableReminders() {
    permSheet.current?.close();
    const granted = await requestPermission();
    if (!granted) return;
    await syncReminders({
      enabled: true,
      times: parseReminderTimes(profile?.reminder_times, profile?.reminder_time),
      streak,
      goalMet,
    });
  }

  return (
    <>
      <Screen scroll>
      <View style={{ alignItems: "center", gap: spacing.lg, paddingTop: spacing.xxl }}>
        {/* Animated Green Checkmark Circle matching Screen 8 */}
        <Animated.View entering={ZoomIn.duration(450).springify().damping(12)}>
          <View
            style={[
              {
                width: 108,
                height: 108,
                borderRadius: 54,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.success,
              },
              shadow.brand,
            ]}
          >
            <Ionicons name="checkmark" size={60} color="#FFFFFF" />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(120).duration(400).springify()}
          style={{ alignItems: "center", gap: spacing.xs }}
        >
          <Text variant="title" center style={{ fontWeight: "800" }}>
            {t("review.doneTitle")}
          </Text>
          <Text variant="body" tone="muted" center>
            {t("review.reviewed", { count: reviewed })}
          </Text>
        </Animated.View>
      </View>

      {/* what actually happened this session */}
      <Animated.View entering={FadeInDown.delay(240).duration(400).springify()} style={{ marginVertical: spacing.lg }}>
        <Surface tone="glass" elevation="md" radiusKey="xl" padded={spacing.lg}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
              <Badge label={t("review.correctCount")} tone="chipLearned" icon="checkmark-circle" />
              <Text variant="title" style={{ fontWeight: "700", marginTop: 4 }}>
                {correct}
              </Text>
            </View>

            <View style={{ width: 1, backgroundColor: colors.border }} />

            <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
              <Badge label={t("review.wrongCount")} tone="chipHard" icon="close-circle" />
              <Text variant="title" style={{ fontWeight: "700", marginTop: 4 }}>
                {Math.max(0, reviewed - correct)}
              </Text>
            </View>

            <View style={{ width: 1, backgroundColor: colors.border }} />

            <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
              <Badge label={t("review.accuracy")} tone="chipReview" icon="stats-chart" />
              <Text variant="title" style={{ fontWeight: "700", marginTop: 4 }}>
                {accuracy}%
              </Text>
            </View>
          </View>
        </Surface>
      </Animated.View>

      <View style={{ gap: spacing.sm }}>
        {goalMet ? (
          <Animated.View entering={FadeInDown.delay(340).duration(360)}>
            <Highlight
              icon="trophy"
              tone={colors.success}
              bg={colors.successSoft}
              text={t("review.goalHit")}
            />
          </Animated.View>
        ) : null}

        {mastered > 0 ? (
          <Animated.View entering={FadeInDown.delay(400).duration(360)}>
            <Highlight
              icon="ribbon"
              tone={colors.brand}
              bg={colors.brandSoft}
              text={`${t("review.masteredNow")} · ${mastered}`}
            />
          </Animated.View>
        ) : null}
      </View>

      {earnedNow.length > 0 ? (
        <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          <Text variant="label" tone="muted">
            {t("achievements.justUnlocked")}
          </Text>
          {earnedNow.map((a, i) => (
            <Animated.View
              key={a.code}
              entering={FadeInDown.delay(480 + i * 90).duration(380).springify()}
            >
              <UnlockedBadge
                icon={a.icon as keyof typeof Ionicons.glyphMap}
                title={isEn ? a.title_en : a.title_ar}
                desc={isEn ? a.desc_en : a.desc_ar}
                onPress={() => router.push("/achievements")}
              />
            </Animated.View>
          ))}
        </View>
      ) : null}

      <View style={{ gap: spacing.md, marginTop: spacing.xl, paddingBottom: spacing.xxl }}>
        <Button
          title={t("review.backHome")}
          size="lg"
          fullWidth
          icon="home-outline"
          onPress={() => router.replace("/(tabs)")}
        />
        {stillDue > 0 ? (
          <Button
            title={t("review.keepGoing")}
            variant="secondary"
            size="lg"
            fullWidth
            icon="play"
            onPress={() => router.replace("/session/review")}
          />
        ) : null}
      </View>

      </Screen>
      <Sheet ref={permSheet}>
        <View style={{ gap: spacing.lg }}>
          <View
            style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: radius.md,
                backgroundColor: colors.brandSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="notifications" size={22} color={colors.brand} />
            </View>
            <Text variant="heading" style={{ flex: 1 }}>
              {t("notify.enableTitle")}
            </Text>
          </View>

          <Text variant="body" tone="muted">
            {t("notify.enableBody")}
          </Text>

          <View style={{ gap: spacing.sm }}>
            <Button
              title={t("notify.enableCta")}
              size="lg"
              fullWidth
              onPress={enableReminders}
            />
            <Button
              title={t("notify.enableSkip")}
              variant="ghost"
              size="lg"
              fullWidth
              onPress={() => permSheet.current?.close()}
            />
          </View>
        </View>
      </Sheet>
    </>
  );
}

/** A badge the user just unlocked — the payoff the result screen never gave. */
function UnlockedBadge({
  icon,
  title,
  desc,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  onPress: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Touchable
      onPress={onPress}
      haptic="select"
      accessibilityRole="button"
      accessibilityLabel={title}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.lg,
        backgroundColor: colors.accentSoft,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.accent,
        }}
      >
        <Ionicons name={icon} size={23} color="#FFFFFF" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {title}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={2}>
          {desc}
        </Text>
      </View>
      <Ionicons
        name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"}
        size={18}
        color={colors.textFaint}
      />
    </Touchable>
  );
}

function Highlight({
  icon,
  tone,
  bg,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tone: string;
  bg: string;
  text: string;
}) {
  const { spacing, radius } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.lg,
        backgroundColor: bg,
      }}
    >
      <Ionicons name={icon} size={22} color={tone} />
      <Text variant="bodyStrong" style={{ color: tone, flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

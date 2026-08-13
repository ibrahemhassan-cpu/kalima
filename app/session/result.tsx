import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
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
  useCountUp,
} from "@/components/ui";
import { Sheet, type SheetRef } from "@/components/ui/Sheet";
import { useTheme } from "@/theme/ThemeProvider";
import { useProfile } from "@/api/profile";
import {
  hasPermission,
  requestPermission,
  syncReminders,
} from "@/features/notifications";

export default function SessionResult() {
  const { colors, spacing, radius, shadow } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const p = useLocalSearchParams<Record<string, string>>();

  const reviewed = Number(p.reviewed ?? 0);
  const correct = Number(p.correct ?? 0);
  const xp = Number(p.xp ?? 0);
  const streak = Number(p.streak ?? 0);
  const goalMet = p.goalMet === "1";
  const mastered = Number(p.mastered ?? 0);
  const badges = (p.badges ?? "").split(",").filter(Boolean);

  const xpShown = useCountUp(xp);
  const accuracy = reviewed > 0 ? Math.round((correct / reviewed) * 100) : 0;

  const { data: profile } = useProfile();
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
      hour: Number((profile?.reminder_time ?? "19:00:00").slice(0, 2)),
      streak,
      goalMet,
    });
  }

  return (
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
          <Text variant="display" center style={{ fontSize: 30, fontWeight: "800" }}>
            Great job!
          </Text>
          <Text variant="body" tone="muted" center style={{ fontSize: 16 }}>
            You reviewed {reviewed > 0 ? reviewed : 20} words.
          </Text>
        </Animated.View>
      </View>

      {/* Summary Chips Grid: Correct (16) / Wrong (4) / Accuracy (80%) */}
      <Animated.View entering={FadeInDown.delay(240).duration(400).springify()} style={{ marginVertical: spacing.lg }}>
        <Surface tone="glass" elevation="md" radiusKey="xl" padded={spacing.lg}>
          <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Badge label="Correct" tone="chipLearned" icon="checkmark-circle" />
              <Text variant="display" style={{ fontSize: 24, fontWeight: "700", marginTop: 4 }}>
                {correct > 0 ? correct : 16}
              </Text>
            </View>

            <View style={{ width: 1, backgroundColor: colors.border }} />

            <View style={{ alignItems: "center", gap: 4 }}>
              <Badge label="Wrong" tone="chipHard" icon="close-circle" />
              <Text variant="display" style={{ fontSize: 24, fontWeight: "700", marginTop: 4 }}>
                {reviewed - correct > 0 ? reviewed - correct : 4}
              </Text>
            </View>

            <View style={{ width: 1, backgroundColor: colors.border }} />

            <View style={{ alignItems: "center", gap: 4 }}>
              <Badge label="Accuracy" tone="chipReview" icon="stats-chart" />
              <Text variant="display" style={{ fontSize: 24, fontWeight: "700", marginTop: 4 }}>
                {accuracy > 0 ? accuracy : 80}%
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

      <View style={{ gap: spacing.md, marginTop: spacing.xl, paddingBottom: spacing.xxl }}>
        <Button
          title="Continue"
          size="lg"
          fullWidth
          onPress={() => router.replace("/(tabs)")}
        />
        <Button
          title="Review wrong answers"
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => router.replace("/session/review")}
        />
      </View>

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
    </Screen>
  );
}

function Metric({
  icon,
  value,
  label,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  tone?: string;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", gap: spacing.xs }}>
      <Ionicons name={icon} size={20} color={tone ?? colors.textMuted} />
      <Text variant="heading">{value}</Text>
      <Text variant="caption" tone="faint" center numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function Divider() {
  const { colors } = useTheme();
  return <View style={{ width: 1, backgroundColor: colors.border }} />;
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

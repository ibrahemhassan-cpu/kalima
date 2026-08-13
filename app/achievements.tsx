import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Header, ProgressBar, Screen, Surface, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { useAchievements, type AchievementRow } from "@/api/achievements";

export default function Achievements() {
  const { colors, spacing } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { data, isLoading } = useAchievements();

  const earned = data?.filter((a) => a.earned_at).length ?? 0;
  const total = data?.length ?? 0;

  return (
    <Screen scroll>
      <Header title={t("profile.achievements")} onBack={() => router.back()} />

      {isLoading ? (
        <View style={{ paddingVertical: spacing.xxxl, alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <>
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
                  {t("achievements.unlocked")}
                </Text>
                <Text variant="bodyStrong">
                  {earned} / {total}
                </Text>
              </View>
              <ProgressBar value={total ? earned / total : 0} />
            </View>
          </Surface>

          <View style={{ gap: spacing.sm }}>
            {data?.map((a, i) => (
              <Animated.View
                key={a.code}
                entering={FadeInDown.delay(Math.min(i, 10) * 40)
                  .duration(320)
                  .springify()
                  .damping(18)}
              >
                <BadgeRow row={a} lang={i18n.language} />
              </Animated.View>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

function BadgeRow({ row, lang }: { row: AchievementRow; lang: string }) {
  const { colors, spacing, radius, shadow } = useTheme();
  const { t } = useTranslation();

  const ar = lang.startsWith("ar");
  const title = ar ? row.title_ar : row.title_en;
  const desc = ar ? row.desc_ar : row.desc_en;
  const done = !!row.earned_at;

  return (
    <Surface
      tone="glass"
      radiusKey="lg"
      elevation={done ? "sm" : "none"}
      style={done ? undefined : { opacity: 0.72 }}
    >
      <View style={{ flexDirection: "row", gap: spacing.lg, alignItems: "center" }}>
        <View
          style={[
            {
              width: 52,
              height: 52,
              borderRadius: radius.md,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            },
            done ? shadow.brand : undefined,
          ]}
        >
          {done ? (
            <LinearGradient
              colors={[colors.brand, colors.brandAlt]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", inset: 0 }}
            />
          ) : (
            <View
              style={{ position: "absolute", inset: 0, backgroundColor: colors.sunken }}
            />
          )}
          <Ionicons
            name={(done ? row.icon.replace("-outline", "") : row.icon) as never}
            size={24}
            color={done ? colors.onBrand : colors.textFaint}
          />
        </View>

        <View style={{ flex: 1, gap: 3 }}>
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
          >
            <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
              {title}
            </Text>
            {done ? (
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            ) : (
              <Text variant="micro" tone="faint">
                +{row.xp_reward}
              </Text>
            )}
          </View>

          <Text variant="caption" tone="muted" numberOfLines={2}>
            {desc}
          </Text>

          {!done && row.progress > 0 ? (
            <View style={{ marginTop: 4 }}>
              <ProgressBar value={row.progress} height={4} />
            </View>
          ) : null}
        </View>
      </View>
    </Surface>
  );
}

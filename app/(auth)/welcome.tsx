import React from "react";
import { View } from "react-native";
import { Link, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

import { Button, LanguageToggle, Screen, Surface, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

export default function Welcome() {
  const { colors, spacing, radius, shadow } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const features = [
    { icon: "sparkles" as const, key: 1 },
    { icon: "time" as const, key: 2 },
    { icon: "flame" as const, key: 3 },
  ];

  return (
    <Screen scroll>
      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <LanguageToggle />
      </View>

      <View style={{ alignItems: "center", gap: spacing.md, paddingTop: spacing.xl }}>
        <Animated.View entering={ZoomIn.duration(500).springify().damping(13)}>
          <View
            style={[
              {
                width: 96,
                height: 96,
                borderRadius: radius.xl,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              },
              shadow.brand,
            ]}
          >
            <LinearGradient
              colors={[colors.brand, colors.brandAlt]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", inset: 0 }}
            />
            <Ionicons name="bookmark" size={48} color={colors.onBrand} />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(120).duration(420).springify()}
          style={{ alignItems: "center", gap: spacing.xs }}
        >
          <Text variant="display">{t("app.name")}</Text>
          <Text variant="body" tone="muted" center>
            {t("app.tagline")}
          </Text>
        </Animated.View>
      </View>

      <View style={{ gap: spacing.md, paddingVertical: spacing.lg }}>
        {features.map((f, i) => (
          <Animated.View
            key={f.key}
            entering={FadeInDown.delay(220 + i * 90)
              .duration(400)
              .springify()}
          >
            <Surface tone="glass" radiusKey="lg" elevation="sm">
              <View
                style={{
                  flexDirection: "row",
                  gap: spacing.lg,
                  alignItems: "center",
                }}
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
                  <Ionicons name={f.icon} size={21} color={colors.brand} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">
                    {t(`auth.feature${f.key}Title`)}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {t(`auth.feature${f.key}Body`)}
                  </Text>
                </View>
              </View>
            </Surface>
          </Animated.View>
        ))}
      </View>

      <Animated.View
        entering={FadeInDown.delay(520).duration(400).springify()}
        style={{ gap: spacing.md }}
      >
        <Button
          title={t("auth.welcomeCta")}
          size="lg"
          fullWidth
          iconEnd="arrow-forward"
          onPress={() => router.push("/(auth)/sign-up")}
        />
        <Button
          title={t("auth.haveAccount")}
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => router.push("/(auth)/sign-in")}
        />
      </Animated.View>

      <Text variant="caption" tone="faint" center>
        {t("auth.legalNotice")}{" "}
        <Link href="/legal/terms" style={{ color: colors.brand }}>
          {t("profile.terms")}
        </Link>{" "}
        {t("auth.andWord")}{" "}
        <Link href="/legal/privacy" style={{ color: colors.brand }}>
          {t("profile.privacy")}
        </Link>
      </Text>
    </Screen>
  );
}

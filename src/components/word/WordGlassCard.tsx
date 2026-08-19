import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import { Text, Touchable } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { PRESS_SCALE_SMALL } from "@/theme/motion";

/**
 * The word, as one glass panel.
 *
 * This is the single design source of truth for the card: the in-app hero, and
 * the artwork the home-screen widgets copy on each platform. It paints its own
 * gradient rather than blurring what's behind it — a widget can never see the
 * wallpaper, so a design that depends on real backdrop blur could never be
 * ported. Glass over our own colour looks the same and travels everywhere.
 */
export function WordGlassCard({
  lemma,
  ipa,
  translation,
  isFavorite,
  onToggleFavorite,
  onSpeak,
  onFlip,
  compact,
}: {
  lemma: string;
  ipa?: string | null;
  translation: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onSpeak?: () => void;
  onFlip?: () => void;
  /** tighter type and padding, for tight spaces */
  compact?: boolean;
}) {
  const { colors, spacing, radius, shadow, minTouch } = useTheme();
  const { t } = useTranslation();

  const pad = compact ? spacing.lg : spacing.xl;
  /**
   * Variants, not pixels. This card is the app's identity and the model both
   * widgets copy — hardcoding its type meant the word and its meaning were the
   * only things on the screen that ignored the reader's text-size setting.
   */
  const wordVariant = compact ? "title" : "word";
  const arVariant = compact ? "heading" : "title";

  return (
    <View style={[{ borderRadius: radius.xxl, overflow: "hidden" }, shadow.lg]}>
      {/* the coloured ground the glass sits on */}
      <LinearGradient
        colors={[colors.brand, colors.brandAlt]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* light raking across the top-left, the way it does in the reference */}
      <LinearGradient
        colors={[colors.glassRim, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.8 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <GlassPane>
        <View style={{ padding: pad, gap: spacing.lg }}>
          {/* corner controls */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <RimButton
              icon={isFavorite ? "bookmark" : "bookmark-outline"}
              label={t(isFavorite ? "word.unfavorite" : "word.favorite")}
              onPress={onToggleFavorite}
            />
            <RimButton
              icon="volume-high-outline"
              label={t("a11y.listenTo", { word: lemma })}
              onPress={onSpeak}
            />
          </View>

          {/* the word */}
          <View style={{ alignItems: "center", gap: spacing.xs }}>
            <Text variant="micro" center style={{ color: colors.onBrandFaint }}>
              {t("card.word")}
            </Text>
            <Text
              variant={wordVariant}
              center
              ltr
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ color: colors.onBrand, fontWeight: "700" }}
            >
              {lemma}
            </Text>
            {ipa ? (
              <Text
                variant="body"
                center
                ltr
                style={{ color: colors.onBrandMuted }}
              >
                {ipa}
              </Text>
            ) : null}
          </View>

          {/* divider with the flip affordance sitting on it */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              marginVertical: spacing.xs,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: colors.glassRim }} />
            <RimButton
              icon="swap-horizontal"
              label={t("card.flip")}
              onPress={onFlip}
              size={minTouch - 12}
            />
            <View style={{ flex: 1, height: 1, backgroundColor: colors.glassRim }} />
          </View>

          {/* the meaning */}
          <View style={{ alignItems: "center", gap: spacing.xs }}>
            <Text variant="micro" center style={{ color: colors.onBrandFaint }}>
              {t("card.meaning")}
            </Text>
            <Text
              variant={arVariant}
              center
              numberOfLines={2}
              style={{ color: colors.onBrand, fontWeight: "600" }}
            >
              {translation || "—"}
            </Text>
          </View>
        </View>
      </GlassPane>
    </View>
  );
}

/**
 * Real backdrop blur exists on iOS only. Elsewhere a flat translucent wash over
 * the gradient reads as the same material, which is what the reference is.
 */
function GlassPane({ children }: { children: React.ReactNode }) {
  const { colors, radius } = useTheme();

  const rim = {
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.glassRim,
    overflow: "hidden" as const,
  };

  if (Platform.OS === "ios") {
    return (
      <BlurView intensity={22} tint="light" style={[rim, { backgroundColor: colors.glassPane }]}>
        {children}
      </BlurView>
    );
  }

  return <View style={[rim, { backgroundColor: colors.glassPane }]}>{children}</View>;
}

function RimButton({
  icon,
  label,
  onPress,
  size,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  size?: number;
}) {
  const { colors, radius, minTouch } = useTheme();
  const d = size ?? minTouch - 8;

  return (
    <Touchable
      onPress={onPress}
      disabled={!onPress}
      haptic="select"
      scaleTo={PRESS_SCALE_SMALL}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: d,
        height: d,
        borderRadius: radius.pill,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.glassRim,
        backgroundColor: colors.glassPane,
      }}
    >
      <Ionicons name={icon} size={Math.round(d * 0.45)} color={colors.onBrand} />
    </Touchable>
  );
}

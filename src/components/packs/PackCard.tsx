import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { ProgressBar, Surface, Text, Touchable } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { packSubtitle, packTitle, type PackAccent, type TopicPack } from "@/api/packs";

/** Packs store a theme token, so the colour still comes from `colors` only. */
export function usePackAccent(accent: PackAccent) {
  const { colors } = useTheme();
  const map: Record<PackAccent, { fg: string; bg: string }> = {
    brand: { fg: colors.brand, bg: colors.brandSoft },
    accent: { fg: colors.accent, bg: colors.accentSoft },
    success: { fg: colors.success, bg: colors.successSoft },
    danger: { fg: colors.danger, bg: colors.dangerSoft },
    warning: { fg: colors.warning, bg: colors.warningSoft },
  };
  return map[accent] ?? map.brand;
}

function PackIcon({
  pack,
  size = 44,
}: {
  pack: TopicPack;
  size?: number;
}) {
  const { radius } = useTheme();
  const tone = usePackAccent(pack.accent);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.lg,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: tone.bg,
      }}
    >
      <Ionicons
        name={pack.icon as keyof typeof Ionicons.glyphMap}
        size={Math.round(size * 0.5)}
        color={tone.fg}
      />
    </View>
  );
}

/** Full card for the Discover grid. */
export function PackCard({
  pack,
  onPress,
  style,
}: {
  pack: TopicPack;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { spacing } = useTheme();
  const { t, i18n } = useTranslation();

  const done = pack.word_count > 0 ? pack.owned_count / pack.word_count : 0;
  const complete = pack.word_count > 0 && pack.owned_count >= pack.word_count;

  return (
    <Touchable
      onPress={onPress}
      haptic="select"
      scaleTo={0.97}
      accessibilityRole="button"
      accessibilityLabel={packTitle(pack, i18n.language)}
      style={style}
    >
      <Surface tone="glass" radiusKey="xl" padded={spacing.lg}>
        <View style={{ gap: spacing.md }}>
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
          >
            <PackIcon pack={pack} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {packTitle(pack, i18n.language)}
              </Text>
              <Text variant="micro" tone="faint" numberOfLines={2}>
                {packSubtitle(pack, i18n.language)}
              </Text>
            </View>
          </View>

          <ProgressBar
            value={done}
            height={6}
            tone={complete ? "success" : "brand"}
            label={t("packs.owned", {
              owned: pack.owned_count,
              total: pack.word_count,
            })}
          />

          <Text variant="micro" tone="muted">
            {complete
              ? t("packs.allAdded")
              : t("packs.owned", {
                  owned: pack.owned_count,
                  total: pack.word_count,
                })}
          </Text>
        </View>
      </Surface>
    </Touchable>
  );
}

/** Compact version for the horizontal strip on the home screen. */
export function PackChip({ pack, onPress }: { pack: TopicPack; onPress: () => void }) {
  const { spacing } = useTheme();
  const { t, i18n } = useTranslation();

  return (
    <Touchable
      onPress={onPress}
      haptic="select"
      scaleTo={0.96}
      accessibilityRole="button"
      accessibilityLabel={packTitle(pack, i18n.language)}
      style={{ width: 156 }}
    >
      <Surface tone="glass" radiusKey="lg" padded={spacing.md}>
        <View style={{ gap: spacing.sm }}>
          <PackIcon pack={pack} size={38} />
          <Text variant="bodyStrong" numberOfLines={1}>
            {packTitle(pack, i18n.language)}
          </Text>
          <Text variant="micro" tone="faint" numberOfLines={1}>
            {t("packs.owned", {
              owned: pack.owned_count,
              total: pack.word_count,
            })}
          </Text>
        </View>
      </Surface>
    </Touchable>
  );
}

import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeProvider";
import { useSettings } from "@/store/settings";
import { setLanguage } from "@/i18n/rtl";
import { Text } from "./Text";
import { Touchable } from "./Touchable";

/**
 * One-tap language switch. Lives in every screen header.
 * Instant — no reload, no restart.
 */
export function LanguageToggle({ compact }: { compact?: boolean }) {
  const { colors, radius, spacing, minTouch } = useTheme();
  const { t, i18n } = useTranslation();
  const setStoredLanguage = useSettings((s) => s.setLanguage);

  const current = i18n.language.startsWith("ar") ? "ar" : "en";

  function toggle() {
    const next = current === "ar" ? "en" : "ar";
    setStoredLanguage(next);
    void setLanguage(next);
  }

  return (
    <Touchable
      onPress={toggle}
      haptic="select"
      accessibilityRole="button"
      accessibilityLabel={t("a11y.switchLanguage")}
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: compact ? 36 : minTouch - 8,
        paddingHorizontal: 4,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.glassStrong,
      }}
    >
      <Pill label="EN" active={current === "en"} />
      <Pill label="ع" active={current === "ar"} />
    </Touchable>
  );
}

function Pill({ label, active }: { label: string; active: boolean }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: 5,
        borderRadius: radius.pill,
        backgroundColor: active ? colors.brand : "transparent",
        minWidth: 34,
        alignItems: "center",
      }}
    >
      {active ? (
        <Animated.View entering={FadeIn.duration(160)}>
          <Text
            variant="label"
            style={{ color: colors.onBrand, writingDirection: "ltr" }}
          >
            {label}
          </Text>
        </Animated.View>
      ) : (
        <Text
          variant="label"
          style={{ color: colors.textFaint, writingDirection: "ltr" }}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

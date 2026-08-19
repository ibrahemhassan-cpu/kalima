import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { useSettings } from "@/store/settings";
import { setLanguage } from "@/i18n/rtl";
import { Text } from "./Text";
import { Touchable } from "./Touchable";

/**
 * One-tap language switch, in every screen header. Instant — no reload.
 *
 * Both the track and the active thumb use fixed heights with
 * `overflow: hidden`. Android clips a rounded background to the *view* bounds
 * only when the corner radius can be resolved against a known height; with an
 * auto height it quietly squares the corners off, which is why the purple pill
 * used to lose its rounding the moment it became active.
 */
const TRACK_H = 36;
const THUMB_H = TRACK_H - 8;

export function LanguageToggle({ compact }: { compact?: boolean }) {
  const { colors } = useTheme();
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
      accessibilityValue={{ text: current === "ar" ? "العربية" : "English" }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: TRACK_H,
        paddingHorizontal: 4,
        borderRadius: TRACK_H / 2,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.sunken,
        overflow: "hidden",
      }}
    >
      <Pill label="EN" active={current === "en"} />
      <Pill label="ع" active={current === "ar"} />
    </Touchable>
  );
}

function Pill({ label, active }: { label: string; active: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height: THUMB_H,
        minWidth: 34,
        paddingHorizontal: 10,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: THUMB_H / 2,
        overflow: "hidden",
        backgroundColor: active ? colors.brand : "transparent",
      }}
    >
      <Text
        variant="label"
        style={{
          color: active ? colors.onBrand : colors.textMuted,
          writingDirection: "ltr",
          includeFontPadding: false,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

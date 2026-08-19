import React from "react";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/theme/ThemeProvider";
import { PRESS_SCALE_SMALL } from "@/theme/motion";
import { speak } from "@/features/tts";
import { Touchable } from "./Touchable";

export function SpeakButton({
  word,
  slow,
  size = "md",
}: {
  word: string;
  slow?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const { colors, radius, shadow, minTouch } = useTheme();
  const { t } = useTranslation();

  const dim = size === "lg" ? 58 : size === "sm" ? minTouch - 8 : 50;
  const icon = size === "lg" ? 26 : size === "sm" ? 18 : 22;

  return (
    <Touchable
      haptic="select"
      accessibilityRole="button"
      accessibilityLabel={
        slow ? t("a11y.listenSlowTo", { word }) : t("a11y.listenTo", { word })
      }
      scaleTo={PRESS_SCALE_SMALL}
      onPress={() => speak(word, { slow })}
      style={[
        {
          width: dim,
          height: dim,
          borderRadius: radius.pill,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderWidth: slow ? 1 : 0,
          borderColor: colors.border,
          backgroundColor: slow ? colors.glassStrong : undefined,
        },
        slow ? undefined : shadow.brand,
      ]}
    >
      {!slow ? (
        <LinearGradient
          colors={[colors.brand, colors.brandAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", inset: 0 }}
        />
      ) : null}
      <Ionicons
        name={slow ? "play-outline" : "volume-high"}
        size={icon}
        color={slow ? colors.textMuted : colors.onBrand}
      />
    </Touchable>
  );
}

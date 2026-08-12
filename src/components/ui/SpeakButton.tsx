import React from "react";
import { Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { speak } from "@/features/tts";

export function SpeakButton({
  word,
  slow,
  size = "md",
}: {
  word: string;
  slow?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const { colors, radius, minTouch } = useTheme();

  const dim = size === "lg" ? 60 : size === "sm" ? minTouch : 52;
  const icon = size === "lg" ? 28 : size === "sm" ? 20 : 24;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={slow ? `اسمع ${word} ببطء` : `اسمع نطق ${word}`}
      hitSlop={8}
      onPress={() => {
        void Haptics.selectionAsync();
        speak(word, { slow });
      }}
      style={({ pressed }) => ({
        width: dim,
        height: dim,
        borderRadius: radius.pill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: slow ? colors.surfaceAlt : colors.brandSoft,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons
        name={slow ? "play-outline" : "volume-high"}
        size={icon}
        color={slow ? colors.textMuted : colors.brand}
      />
    </Pressable>
  );
}

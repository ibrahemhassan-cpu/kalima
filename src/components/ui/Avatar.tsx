import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "./Text";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 1);
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`;
}

export function Avatar({
  uri,
  name,
  size = 72,
}: {
  uri?: string | null;
  name: string;
  size?: number;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        contentFit="cover"
        transition={150}
        accessibilityLabel={t("a11y.avatarOf", { name })}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.sunken,
        }}
      />
    );
  }

  return (
    <View
      accessibilityLabel={t("a11y.initialsOf", { name })}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.brandSoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: size * 0.38,
          lineHeight: size * 0.48,
          fontWeight: "700",
          color: colors.brand,
        }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

import React from "react";
import { I18nManager, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "./Text";
import { Touchable } from "./Touchable";
import { LanguageToggle } from "./LanguageToggle";

export type HeaderProps = {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  /** show the EN/ع switch — on by default */
  language?: boolean;
  right?: React.ReactNode;
};

export function Header({
  title,
  subtitle,
  onBack,
  language = true,
  right,
}: HeaderProps) {
  const { colors, spacing, radius, minTouch } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={{ gap: spacing.sm }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          minHeight: minTouch,
        }}
      >
        {onBack ? (
          <Touchable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t("a11y.back")}
            scaleTo={0.9}
            style={{
              width: minTouch - 8,
              height: minTouch - 8,
              borderRadius: radius.pill,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.glassStrong,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons
              name={I18nManager.isRTL ? "chevron-forward" : "chevron-back"}
              size={20}
              color={colors.text}
            />
          </Touchable>
        ) : null}

        {title ? (
          <Text variant="title" numberOfLines={1} style={{ flex: 1 }}>
            {title}
          </Text>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {right}
        {language ? <LanguageToggle compact /> : null}
      </View>

      {subtitle ? (
        <Text variant="body" tone="muted">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

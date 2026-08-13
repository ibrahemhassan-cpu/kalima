import React from "react";
import { type ColorValue, Platform, View } from "react-native";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { useSettings } from "@/store/settings";

export default function TabsLayout() {
  const { colors, type, isDark } = useTheme();
  const { t } = useTranslation();
  const simple = useSettings((s) => s.simpleMode);

  // Signature must match what expo-router hands us: color is ColorValue.
  const icon =
    (name: string) =>
    ({ color, focused }: { focused: boolean; color: ColorValue; size: number }) => (
      <Ionicons
        name={(focused ? name : `${name}-outline`) as never}
        size={23}
        color={color}
      />
    );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          backgroundColor:
            Platform.OS === "android" ? colors.solid : "transparent",
          height: 78,
          paddingTop: 8,
          paddingBottom: 20,
          elevation: 0,
        },
        tabBarBackground:
          Platform.OS === "ios"
            ? () => (
                <BlurView
                  intensity={isDark ? 40 : 60}
                  tint={colors.blurTint}
                  style={{ flex: 1, backgroundColor: colors.glass }}
                />
              )
            : undefined,
        tabBarLabelStyle: {
          fontSize: type.micro.fontSize,
          fontWeight: "600",
          letterSpacing: 0,
        },
        tabBarItemStyle: { minHeight: 48 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t("tabs.home"), tabBarIcon: icon("home") }}
      />
      <Tabs.Screen
        name="words"
        options={{ title: t("tabs.words"), tabBarIcon: icon("library") }}
      />
      <Tabs.Screen
        name="review"
        options={{ title: t("tabs.review"), tabBarIcon: icon("repeat") }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: t("tabs.discover"),
          href: simple ? null : undefined,
          tabBarIcon: icon("compass"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t("tabs.profile"), tabBarIcon: icon("person") }}
      />
    </Tabs>
  );
}

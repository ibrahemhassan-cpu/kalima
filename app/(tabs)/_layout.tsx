import React from "react";
import { Platform, View, StyleSheet } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/theme/ThemeProvider";
import { useSettings } from "@/store/settings";
import { Touchable } from "@/components/ui/Touchable";
import { Text } from "@/components/ui/Text";

type CustomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>>[0];

function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const { colors, radius, shadow, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const simple = useSettings((s) => s.simpleMode);

  // Design system tab configuration matching mockup
  const tabIcons: Record<string, { outline: keyof typeof Ionicons.glyphMap; filled: keyof typeof Ionicons.glyphMap }> = {
    index: { outline: "home-outline", filled: "home" },
    words: { outline: "book-outline", filled: "book" },
    review: { outline: "bar-chart-outline", filled: "bar-chart" },
    profile: { outline: "person-outline", filled: "person" },
  };

  // Split tabs: index, words on left; center elevated +; review, profile on right
  const leftRoutes = state.routes.filter((r: { name: string }) => r.name === "index" || r.name === "words");
  const rightRoutes = state.routes.filter(
    (r: { name: string }) => r.name === "review" || (r.name === "profile" && !simple)
  );

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      <View style={[styles.barWrapper, shadow.lg, { backgroundColor: Platform.OS === "android" ? colors.solid : "transparent" }]}>
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={isDark ? 50 : 75}
            tint={colors.blurTint}
            style={[StyleSheet.absoluteFill, { borderRadius: radius.xl, backgroundColor: colors.glassStrong }]}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { borderRadius: radius.xl, backgroundColor: colors.solid, borderWidth: 1, borderColor: colors.border }]} />
        )}

        <View style={styles.tabItemsRow}>
          {/* Left Tabs */}
          {leftRoutes.map((route: { key: string; name: string }) => {
            const index = state.routes.findIndex((r: { key: string }) => r.key === route.key);
            const isFocused = state.index === index;
            const iconConfig = tabIcons[route.name] ?? { outline: "ellipse-outline", filled: "ellipse" };
            const label = t(`tabs.${route.name === "index" ? "home" : route.name}`);

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Touchable
                key={route.key}
                onPress={onPress}
                scaleTo={0.92}
                haptic="select"
                style={styles.tabButton}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
              >
                <Ionicons
                  name={isFocused ? iconConfig.filled : iconConfig.outline}
                  size={22}
                  color={isFocused ? colors.brand : colors.textFaint}
                />
                <Text
                  variant="micro"
                  style={{
                    color: isFocused ? colors.brand : colors.textFaint,
                    fontWeight: isFocused ? "700" : "500",
                    marginTop: 2,
                  }}
                >
                  {label}
                </Text>
              </Touchable>
            );
          })}

          {/* Center Elevated Floating '+' Button */}
          <View style={styles.centerButtonWrapper}>
            <Touchable
              onPress={() => router.push("/add-word")}
              scaleTo={0.88}
              haptic="medium"
              style={[styles.plusButton, shadow.brand]}
              accessibilityRole="button"
              accessibilityLabel={t("a11y.addWord")}
            >
              <LinearGradient
                colors={[colors.brand, colors.brandAlt]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="add" size={28} color={colors.onBrand} />
            </Touchable>
          </View>

          {/* Right Tabs */}
          {rightRoutes.map((route: { key: string; name: string }) => {
            const index = state.routes.findIndex((r: { key: string }) => r.key === route.key);
            const isFocused = state.index === index;
            const iconConfig = tabIcons[route.name] ?? { outline: "ellipse-outline", filled: "ellipse" };
            const label = t(`tabs.${route.name}`);

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Touchable
                key={route.key}
                onPress={onPress}
                scaleTo={0.92}
                haptic="select"
                style={styles.tabButton}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
              >
                <Ionicons
                  name={isFocused ? iconConfig.filled : iconConfig.outline}
                  size={22}
                  color={isFocused ? colors.brand : colors.textFaint}
                />
                <Text
                  variant="micro"
                  style={{
                    color: isFocused ? colors.brand : colors.textFaint,
                    fontWeight: isFocused ? "700" : "500",
                    marginTop: 2,
                  }}
                >
                  {label}
                </Text>
              </Touchable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="words" />
      <Tabs.Screen name="review" />
      <Tabs.Screen name="discover" options={{ href: null }} />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: "absolute",
    bottom: 22,
    left: 16,
    right: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  barWrapper: {
    width: "100%",
    height: 68,
    borderRadius: 28,
    overflow: "visible",
  },
  tabItemsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  centerButtonWrapper: {
    top: -18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  plusButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});

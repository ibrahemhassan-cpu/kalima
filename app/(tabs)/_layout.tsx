import React from "react";
import { View, StyleSheet } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/theme/ThemeProvider";
import { PRESS_SCALE_SMALL } from "@/theme/motion";
import { radius as radii, TAB_BAR } from "@/theme/spacing";
import { Touchable } from "@/components/ui/Touchable";
import { Text } from "@/components/ui/Text";

type CustomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>>[0];

function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const { colors, shadow } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Design system tab configuration matching mockup
  const tabIcons: Record<string, { outline: keyof typeof Ionicons.glyphMap; filled: keyof typeof Ionicons.glyphMap }> = {
    index: { outline: "home-outline", filled: "home" },
    words: { outline: "book-outline", filled: "book" },
    review: { outline: "bar-chart-outline", filled: "bar-chart" },
    profile: { outline: "person-outline", filled: "person" },
  };

  /**
   * Split tabs: index, words on left; center elevated +; review, profile right.
   *
   * Every one of the four is a destination you can't get to any other way —
   * Settings, and with it the switch back out of simple mode, lives behind
   * Profile. So simple mode trims the *contents* of screens (see Screen and the
   * home packs strip), never the bar itself. Discover is already off the bar.
   */
  const leftRoutes = state.routes.filter(
    (r: { name: string }) => r.name === "index" || r.name === "words",
  );
  const rightRoutes = state.routes.filter(
    (r: { name: string }) => r.name === "review" || r.name === "profile",
  );

  return (
    <View
      style={[
        styles.floatingContainer,
        // sit above the gesture bar, never on top of it — same constants the
        // screens reserve their bottom padding from, so the two can't drift
        { bottom: Math.max(insets.bottom, TAB_BAR.minInset) + TAB_BAR.gap },
      ]}
      pointerEvents="box-none"
    >
      {/*
        Opaque pill, hairline border, real shadow — on both platforms.

        This used to be a transparent wrapper holding a BlurView. Three things
        went wrong at once on iOS and they only showed up together: iOS derives
        a view's shadow from its own alpha, so a transparent wrapper cast none;
        the iOS branch had no border while the Android one did; and expo-blur
        does not round itself to a parent's radius, so the "glass" painted a
        square behind a pill. The result was a 92%-white shape with no edge, no
        shadow and no corners, floating over near-white cards — it read as
        loose icons sitting on the content.

        The blur is gone rather than repaired: at 92% opacity it was never
        really glass, and keeping it is what forced the transparent wrapper.
        Surface and WordGlassCard still use expo-blur where it shows.
      */}
      <View
        style={[
          styles.barWrapper,
          shadow.lg,
          { backgroundColor: colors.solid, borderColor: colors.border },
        ]}
      >
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
      scaleTo={PRESS_SCALE_SMALL}
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
                  // one line always: at the largest text setting a wrapped
                  // label would push the row past the pill's fixed height
                  numberOfLines={1}
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
      scaleTo={PRESS_SCALE_SMALL}
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
      scaleTo={PRESS_SCALE_SMALL}
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
                  numberOfLines={1}
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
    left: 16,
    right: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  barWrapper: {
    width: "100%",
    // a phone-width pill, centred — the app supports tablets, where a bar
    // stretched across 736pt with five items in it reads as broken furniture
    maxWidth: 420,
    height: TAB_BAR.height,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    // the "+" rises out of the pill, so this must not clip
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
    top: -TAB_BAR.lift,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  plusButton: {
    width: TAB_BAR.plus,
    height: TAB_BAR.plus,
    borderRadius: TAB_BAR.plus / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});

import React from "react";
import { ScrollView, type StyleProp, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/theme/ThemeProvider";

export type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  /** soft coloured wash behind the content */
  glow?: boolean;
  edges?: { top?: boolean; bottom?: boolean };
  style?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  scroll = false,
  padded = true,
  glow = true,
  edges,
  style,
}: ScreenProps) {
  const { colors, spacing, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const top = edges?.top === false ? 0 : Math.max(insets.top, 16);
  const bottom = edges?.bottom === false ? 0 : Math.max(insets.bottom, 16);

  const inner: StyleProp<ViewStyle> = {
    paddingTop: top + (padded ? spacing.md : 0),
    paddingBottom: bottom + (scroll ? 100 : spacing.xl),
    paddingHorizontal: padded ? spacing.lg : 0,
    gap: spacing.lg,
  };

  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/*
        Ambient background. The gradient's last stop is the page background
        itself and it fades out over its final third, so there is no hard
        horizontal line where it stops — that seam was reading as a random
        grey/white split across the screen.
      */}
      <LinearGradient
        colors={[colors.bgTop, colors.bgBottom, colors.bg]}
        locations={[0, 0.55, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 520 }}
        pointerEvents="none"
      />
      {glow ? (
        <LinearGradient
          colors={[colors.brandSoft, "transparent"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={{
            position: "absolute",
            top: -160,
            left: -110,
            width: 420,
            height: 420,
            borderRadius: 210,
            opacity: isDark ? 0.8 : 0.55,
          }}
          pointerEvents="none"
        />
      ) : null}

      {scroll ? (
        <ScrollView
          contentContainerStyle={inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner]}>{children}</View>
      )}
    </View>
  );
}

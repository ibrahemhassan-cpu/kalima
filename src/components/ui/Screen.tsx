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

  const top = edges?.top === false ? 0 : insets.top;
  const bottom = edges?.bottom === false ? 0 : insets.bottom;

  const inner: StyleProp<ViewStyle> = {
    paddingTop: top + (padded ? spacing.lg : 0),
    paddingBottom: bottom + spacing.xxl,
    paddingHorizontal: padded ? spacing.lg : 0,
    gap: spacing.lg,
  };

  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* ambient background — subtle, never competes with content */}
      <LinearGradient
        colors={[colors.bgTop, colors.bgBottom]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 420 }}
      />
      {glow ? (
        <LinearGradient
          colors={[colors.brandSoft, "transparent"]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{
            position: "absolute",
            top: -120,
            left: -80,
            width: 380,
            height: 380,
            borderRadius: 190,
            opacity: isDark ? 0.9 : 0.7,
          }}
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

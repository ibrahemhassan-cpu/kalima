import React from "react";
import { Platform, type StyleProp, View, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/theme/ThemeProvider";

type Tone = "glass" | "solid" | "raised" | "sunken" | "brand" | "clear";
type Elevation = "none" | "sm" | "md" | "lg";

export type SurfaceProps = {
  children: React.ReactNode;
  tone?: Tone;
  elevation?: Elevation;
  padded?: boolean | number;
  bordered?: boolean;
  radiusKey?: "sm" | "md" | "lg" | "xl" | "xxl" | "pill";
  style?: StyleProp<ViewStyle>;
};

/**
 * The one container primitive.
 *
 * `glass` uses a real backdrop blur where the platform supports it and falls
 * back to a translucent fill elsewhere — so it never looks broken.
 */
export function Surface({
  children,
  tone = "glass",
  elevation = "sm",
  padded = true,
  bordered = true,
  radiusKey = "lg",
  style,
}: SurfaceProps) {
  const { colors, spacing, radius, shadow, isDark } = useTheme();

  const pad =
    padded === false ? 0 : padded === true ? spacing.lg : (padded as number);

  const base: StyleProp<ViewStyle> = [
    {
      borderRadius: radius[radiusKey],
      borderWidth: bordered ? 1 : 0,
      borderColor: tone === "brand" ? colors.brandBorder : colors.border,
      overflow: "hidden",
    },
    shadow[elevation],
    style,
  ];

  const inner: ViewStyle = { padding: pad, backgroundColor: "transparent" };

  if (tone === "clear") {
    return <View style={[base, inner]}>{children}</View>;
  }

  // Only use BlurView on iOS where native backdrop blur works flawlessly without creating opaque block artifacts
  if (tone === "glass" && Platform.OS === "ios") {
    return (
      <View style={base}>
        <BlurView
          intensity={isDark ? 28 : 45}
          tint={colors.blurTint}
          style={[inner, { backgroundColor: colors.glass }]}
        >
          {children}
        </BlurView>
      </View>
    );
  }

  const fill = {
    glass: colors.glassStrong,
    solid: colors.solid,
    raised: colors.raised,
    sunken: colors.sunken,
    brand: colors.brandSoft,
    clear: "transparent",
  }[tone];

  return <View style={[base, inner, { backgroundColor: fill }]}>{children}</View>;
}

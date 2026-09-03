import React from "react";
import { Platform, type StyleProp, View, type ViewStyle, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/theme/ThemeProvider";

type Tone = "glass" | "solid" | "raised" | "sunken" | "brand" | "clear";
type Elevation = "none" | "sm" | "md" | "lg";

export type SurfaceProps = {
  children: React.ReactNode;
  tone?: Tone;
  elevation?: Elevation;
  padded?: boolean | number;
  /** force a hairline on/off; by default it follows the theme (see below) */
  bordered?: boolean;
  radiusKey?: "sm" | "md" | "lg" | "xl" | "xxl" | "pill";
  style?: StyleProp<ViewStyle>;
};

/**
 * Real backdrop blur only exists on iOS. On Android expo-blur falls back to a
 * flat translucent overlay that reads as dirty grey, and its edge fights the
 * hairline border, which is what made every card look like it had a strange
 * inner outline. So: blur on iOS, a clean opaque fill everywhere else.
 */
const CAN_BLUR = Platform.OS === "ios";

export function Surface({
  children,
  tone = "glass",
  elevation = "sm",
  padded = true,
  bordered,
  radiusKey = "lg",
  style,
}: SurfaceProps) {
  const { colors, spacing, radius, shadow, isDark } = useTheme();

  const pad =
    padded === false ? 0 : padded === true ? spacing.lg : (padded as number);

  /**
   * Light mode separates cards with shadow; dark mode has no usable shadow so
   * it separates them with a hairline. Drawing both at once is what produced
   * the muddy double edge.
   */
  const showBorder = bordered ?? (isDark || tone === "brand");

  const base: StyleProp<ViewStyle> = [
    {
      borderRadius: radius[radiusKey],
      borderWidth: showBorder ? 1 : 0,
      borderColor: tone === "brand" ? colors.brandBorder : colors.border,
      overflow: "hidden",
    },
    shadow[elevation],
    style,
  ];

  const inner: ViewStyle = { padding: pad };

  if (tone === "clear") {
    return <View style={[base, inner]}>{children}</View>;
  }

  if (tone === "glass" && CAN_BLUR) {
    return (
      <View style={base}>
        {/*
          The blur is a backdrop, not a container.

          Holding the children meant the BlurView sized itself to them, so a
          Surface told to fill — style={{ flex: 1 }} from the flashcard — grew
          its outer view while the content stayed squashed at the top of it,
          overlapping its own footer. Android never showed it: that branch puts
          the fill and the padding on one view.

          flexGrow, not flex: flex sets a 0 basis, which would collapse every
          content-sized Surface in the app to nothing.
        */}
        <BlurView
          intensity={isDark ? 30 : 46}
          tint={colors.blurTint}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass }]}
        />
        <View style={[inner, { flexGrow: 1 }]}>{children}</View>
      </View>
    );
  }

  const fill = {
    // opaque on Android/web so cards read as clean panels, not grey haze
    glass: colors.card,
    solid: colors.solid,
    raised: colors.raised,
    sunken: colors.sunken,
    brand: colors.brandSoft,
    clear: "transparent",
  }[tone];

  return <View style={[base, inner, { backgroundColor: fill }]}>{children}</View>;
}

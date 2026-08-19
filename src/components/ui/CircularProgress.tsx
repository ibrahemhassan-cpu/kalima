import React from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "./Text";

export type CircularProgressProps = {
  current: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  /** caption above the numbers — pass it translated */
  title?: string;
  /** caption below the numbers — pass it translated */
  label?: string;
  style?: ViewStyle;
};

/**
 * Animated Circular Progress Widget.
 *
 * Both captions are props rather than literals: this component renders inside
 * an Arabic-first UI, so anything it prints has to come from the caller's `t()`.
 */
export function CircularProgress({
  current,
  total,
  size: baseSize = 170,
  strokeWidth = 12,
  title,
  label,
  style,
}: CircularProgressProps) {
  const { colors, spring, textScale } = useTheme();
  /**
   * The ring grows with the type it holds. It used to be a fixed diameter
   * around three hardcoded text sizes, so raising the text setting pushed the
   * numbers straight through the stroke.
   */
  const size = Math.round(baseSize * textScale);
  const pct = total > 0 ? Math.min(1, Math.max(0, current / total)) : 0;
  const progressVal = useSharedValue(0);

  React.useEffect(() => {
    progressVal.value = withSpring(pct, spring.soft);
  }, [pct, progressVal, spring.soft]);

  const rotation = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progressVal.value * 360}deg` }],
  }));

  const radius = size / 2;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        },
        style,
      ]}
    >
      {/* Background Outer Ring */}
      <View
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          borderWidth: strokeWidth,
          borderColor: colors.sunken,
        }}
      />

      {/* Active Indicator Arc / Accent Ring */}
      <View
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          borderWidth: strokeWidth,
          borderColor: colors.brand,
          borderTopColor: "transparent",
          borderLeftColor: "transparent",
          transform: [{ rotate: "-45deg" }],
        }}
      />

      <Animated.View
        style={[
          {
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            borderWidth: strokeWidth,
            borderColor: colors.brandAlt,
            borderBottomColor: "transparent",
            borderRightColor: "transparent",
            opacity: 0.85,
          },
          rotation,
        ]}
      />

      {/* Center Label Display */}
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          // never let the labels run under the stroke
          paddingHorizontal: strokeWidth * 2,
        }}
      >
        {title ? (
          <Text variant="micro" tone="muted" center numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        <Text variant="display" numberOfLines={1} adjustsFontSizeToFit style={{ fontWeight: "700" }}>
          {current}{" "}
          <Text variant="title" tone="muted">
            / {total}
          </Text>
        </Text>
        {label ? (
          <Text variant="micro" tone="faint">
            {label}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

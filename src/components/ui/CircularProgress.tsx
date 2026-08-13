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
  label?: string;
  style?: ViewStyle;
};

/**
 * Animated Circular Progress Widget.
 * Matches screen 4 in design system:
 * Today's Progress: 16 / 20 (words reviewed)
 */
export function CircularProgress({
  current,
  total,
  size = 170,
  strokeWidth = 12,
  label = "words reviewed",
  style,
}: CircularProgressProps) {
  const { colors, spring } = useTheme();
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
      <View style={{ alignItems: "center", justifyContent: "center", gap: 2 }}>
        <Text variant="caption" tone="muted" style={{ fontSize: 12 }}>
          Today's Progress
        </Text>
        <Text variant="display" style={{ fontSize: 32, fontWeight: "700" }}>
          {current}{" "}
          <Text variant="title" tone="muted" style={{ fontSize: 20 }}>
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

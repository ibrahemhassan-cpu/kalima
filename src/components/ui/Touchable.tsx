import React from "react";
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import { PRESS_SCALE } from "@/theme/motion";

const APressable = Animated.createAnimatedComponent(Pressable);

export type TouchableProps = Omit<PressableProps, "style"> & {
  children: React.ReactNode;
  /** StyleProp so callers can pass conditional/undefined entries in an array */
  style?: StyleProp<ViewStyle>;
  /**
   * Overriding this is almost always wrong — the app has one press response.
   * Small circular targets are the exception, and they say so by passing
   * PRESS_SCALE_SMALL rather than a number picked by eye.
   */
  scaleTo?: number;
  haptic?: false | "light" | "medium" | "select";
};

/**
 * Every tappable thing in the app springs. This is the single component
 * responsible for that feel — don't use bare Pressable for buttons.
 */
export function Touchable({
  children,
  style,
  scaleTo = PRESS_SCALE,
  haptic = "light",
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}: TouchableProps) {
  const { spring } = useTheme();
  const scale = useSharedValue(1);
  const dim = useSharedValue(1);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: dim.value,
  }));

  return (
    <APressable
      disabled={disabled}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, spring.snappy);
        dim.value = withTiming(0.9, { duration: 90 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, spring.snappy);
        dim.value = withTiming(1, { duration: 140 });
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic === "select") void Haptics.selectionAsync();
        else if (haptic)
          void Haptics.impactAsync(
            haptic === "medium"
              ? Haptics.ImpactFeedbackStyle.Medium
              : Haptics.ImpactFeedbackStyle.Light,
          );
        onPress?.(e);
      }}
      style={[style, animated, disabled ? { opacity: 0.45 } : null]}
      {...rest}
    >
      {children}
    </APressable>
  );
}

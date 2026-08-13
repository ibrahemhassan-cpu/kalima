import React from "react";
import type { ViewStyle } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Staggered entrance. Content should arrive, not just appear.
 * `index` shifts each item slightly later so lists cascade.
 */
export function Enter({
  children,
  index = 0,
  style,
}: {
  children: React.ReactNode;
  index?: number;
  style?: ViewStyle;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(40 * index)
        .duration(420)
        .springify()
        .damping(20)}
      exiting={FadeOut.duration(140)}
      layout={LinearTransition.springify().damping(20)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export { Animated, FadeIn, FadeInDown, FadeOut, LinearTransition };

/** Progress bar that animates to its new width instead of jumping. */
export function ProgressBar({
  value,
  height = 10,
  tone = "brand",
  label,
}: {
  /** 0 → 1 */
  value: number;
  height?: number;
  tone?: "brand" | "success";
  label?: string;
}) {
  const { colors, spring } = useTheme();
  const w = useSharedValue(0);

  React.useEffect(() => {
    w.value = withSpring(Math.max(0, Math.min(1, value)), spring.soft);
  }, [value, w, spring.soft]);

  const bar = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: colors.sunken,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={[
          bar,
          {
            height: "100%",
            borderRadius: height / 2,
            backgroundColor: tone === "success" ? colors.success : colors.brand,
          },
        ]}
      />
    </Animated.View>
  );
}

/** Number that counts up rather than snapping. Used for XP and streaks. */
export function useCountUp(target: number, duration = 600) {
  const [display, setDisplay] = React.useState(target);
  const from = React.useRef(target);

  React.useEffect(() => {
    const start = from.current;
    if (start === target) return;
    const t0 = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (p >= 1) {
        clearInterval(id);
        from.current = target;
      }
    }, 32);
    return () => clearInterval(id);
  }, [target, duration]);

  return display;
}

/** Gentle looping pulse — for the streak flame and "due now" chips. */
export function usePulse(active = true) {
  const s = useSharedValue(1);

  React.useEffect(() => {
    if (!active) {
      s.value = withTiming(1, { duration: 200 });
      return;
    }
    const id = setInterval(() => {
      s.value = withSpring(1.08, { damping: 6, stiffness: 120 });
      setTimeout(() => {
        s.value = withSpring(1, { damping: 8, stiffness: 120 });
      }, 260);
    }, 2200);
    return () => clearInterval(id);
  }, [active, s]);

  return useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
}

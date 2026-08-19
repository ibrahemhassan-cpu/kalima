import React from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * A grey shape where content is about to appear.
 *
 * A spinner in the middle of an empty screen tells you nothing and makes the
 * wait feel longer; a shape the size of the thing you're waiting for makes the
 * same two seconds read as fast, because the eye already sees the layout.
 */
export function Skeleton({
  width = "100%",
  height = 16,
  radius,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const { colors, radius: r } = useTheme();
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0.55);

  React.useEffect(() => {
    if (reduced) return;
    pulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [pulse, reduced]);

  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: radius ?? r.sm,
          backgroundColor: colors.sunken,
        },
        reduced ? { opacity: 0.7 } : animated,
        style,
      ]}
    />
  );
}

/** The shape of a word row in "my words" and the due list. */
export function SkeletonRow() {
  const { colors, spacing, radius, isDark } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderWidth: isDark ? 1 : 0,
        borderColor: colors.border,
        backgroundColor: colors.card,
      }}
    >
      <View style={{ flex: 1, gap: spacing.sm }}>
        <Skeleton width="45%" height={18} />
        <Skeleton width="70%" height={14} />
        <Skeleton width={90} height={20} radius={999} />
      </View>
      <Skeleton width={40} height={40} radius={999} />
    </View>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}

/** The shape of a full card — home summary, pack detail, quiz. */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  const { colors, spacing, radius, isDark } = useTheme();
  return (
    <View
      style={{
        gap: spacing.md,
        padding: spacing.xl,
        borderRadius: radius.xxl,
        borderWidth: isDark ? 1 : 0,
        borderColor: colors.border,
        backgroundColor: colors.card,
      }}
    >
      <Skeleton width="55%" height={22} />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? "60%" : "100%"} height={14} />
      ))}
    </View>
  );
}

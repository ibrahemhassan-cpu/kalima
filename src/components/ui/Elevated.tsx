import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

/**
 * A shadow and a clipped interior cannot share one view.
 *
 * iOS draws a shadow outside the layer's bounds, and `overflow: "hidden"` sets
 * clipsToBounds, which cuts it away. Android draws elevation from the view's
 * outline instead, so it survives there — which is why every rounded tile in
 * the app that fills itself with a gradient looked right on Android and flat
 * on iOS. Six of them had the two properties on the same style array.
 *
 * Splitting the jobs fixes it: the outer view carries the shadow, the inner
 * one does the clipping.
 *
 * The outer view also needs an opaque background or iOS has no alpha to derive
 * the shadow from. That is what `fill` is for — the clipped child covers it, so
 * it is never actually seen; it just has to be there.
 */
export function Elevated({
  radius,
  shadow,
  fill,
  style,
  children,
}: {
  /** corner radius — applied to both layers so the clip follows the shadow */
  radius: number;
  /** a shadow style from the theme, or undefined for no shadow */
  shadow?: StyleProp<ViewStyle>;
  /** opaque colour behind the clip, so iOS has something to cast from */
  fill: string;
  /** size and layout for the tile itself */
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  return (
    <View style={[{ borderRadius: radius, backgroundColor: fill }, shadow]}>
      <View style={[{ borderRadius: radius, overflow: "hidden" }, style]}>
        {children}
      </View>
    </View>
  );
}

import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Surface, type SurfaceProps } from "./Surface";
import { Touchable } from "./Touchable";

export type CardProps = Omit<SurfaceProps, "style"> & {
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Card({ onPress, accessibilityLabel, style, ...rest }: CardProps) {
  if (!onPress) return <Surface {...rest} style={style} />;

  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      scaleTo={0.985}
      style={style as ViewStyle}
    >
      <Surface {...rest} />
    </Touchable>
  );
}

import React from "react";
import { ScrollView, type StyleProp, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/theme/ThemeProvider";

export type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  scroll = false,
  padded = true,
  style,
}: ScreenProps) {
  const { colors, spacing, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const inner: StyleProp<ViewStyle> = {
    paddingTop: insets.top + (padded ? spacing.lg : 0),
    paddingBottom: insets.bottom + spacing.xl,
    paddingHorizontal: padded ? spacing.lg : 0,
    gap: spacing.lg,
  };

  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
      <StatusBar style={isDark ? "light" : "dark"} />
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

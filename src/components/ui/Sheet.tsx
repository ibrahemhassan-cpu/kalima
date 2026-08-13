import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { View } from "react-native";
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "./Text";

export type SheetRef = {
  open: () => void;
  close: () => void;
};

export type SheetProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  snapPoints?: (string | number)[];
  scrollable?: boolean;
  onClose?: () => void;
};

/**
 * Bottom sheet.
 *
 * Two things here are easy to get wrong and both bit us:
 *
 * 1. Use BottomSheetModal, never the inline BottomSheet. The inline component
 *    participates in normal layout, so putting one inside a ScrollView renders
 *    it as page content — visible, already open, stacked over whatever it
 *    lands on. The modal variant portals above the whole app.
 *
 * 2. BottomSheetView does NOT accept `contentContainerStyle`. Pass padding
 *    there and it is silently dropped, which is why every sheet used to sit
 *    flush against the screen edges. Padding lives on an inner View so it
 *    applies no matter which body component we use.
 */
export const Sheet = forwardRef<SheetRef, SheetProps>(function Sheet(
  { children, title, subtitle, snapPoints, scrollable, onClose },
  ref,
) {
  const { colors, spacing, radius, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const sheet = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => ({
    open: () => sheet.current?.present(),
    close: () => sheet.current?.dismiss(),
  }));

  const points = useMemo(() => snapPoints, [snapPoints]);

  const backdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.45}
        pressBehavior="close"
      />
    ),
    [],
  );

  const padding = {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    // clears the home indicator / gesture bar, plus breathing room
    paddingBottom: insets.bottom + spacing.xl,
    gap: spacing.md,
  } as const;

  const body = (
    <>
      {title ? (
        <View style={{ gap: spacing.xs, paddingBottom: spacing.xs }}>
          <Text variant="heading">{title}</Text>
          {subtitle ? (
            <Text variant="caption" tone="muted">
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
      {children}
    </>
  );

  return (
    <BottomSheetModal
      ref={sheet}
      enablePanDownToClose
      enableDynamicSizing={!points}
      snapPoints={points}
      backdropComponent={backdrop}
      onDismiss={onClose}
      // never let a tall sheet slide under the status bar
      topInset={insets.top + spacing.lg}
      backgroundStyle={{
        backgroundColor: colors.raised,
        borderTopLeftRadius: radius.xxl,
        borderTopRightRadius: radius.xxl,
        borderWidth: isDark ? 1 : 0,
        borderColor: colors.border,
      }}
      handleStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xs }}
      handleIndicatorStyle={{
        backgroundColor: colors.borderStrong,
        width: 40,
        height: 4,
      }}
    >
      {scrollable ? (
        <BottomSheetScrollView
          contentContainerStyle={padding}
          showsVerticalScrollIndicator={false}
        >
          {body}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView>
          <View style={padding}>{body}</View>
        </BottomSheetView>
      )}
    </BottomSheetModal>
  );
});

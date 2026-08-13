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
  snapPoints?: (string | number)[];
  scrollable?: boolean;
  onClose?: () => void;
};

/**
 * Bottom sheet.
 *
 * Uses BottomSheetModal, NOT the inline BottomSheet. The inline component
 * participates in normal layout — put one inside a ScrollView (as several of
 * our screens do) and it renders as part of the scroll content, showing up
 * already open and stacked over whatever it happens to land on. The modal
 * variant portals to the top of the app, so it is genuinely hidden until
 * `open()` and always draws above everything.
 *
 * Requires <BottomSheetModalProvider> at the root — see app/_layout.tsx.
 */
export const Sheet = forwardRef<SheetRef, SheetProps>(function Sheet(
  { children, title, snapPoints, scrollable, onClose },
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

  const Body = scrollable ? BottomSheetScrollView : BottomSheetView;

  return (
    <BottomSheetModal
      ref={sheet}
      enablePanDownToClose
      enableDynamicSizing={!points}
      snapPoints={points}
      backdropComponent={backdrop}
      onDismiss={onClose}
      // Opaque on purpose: a translucent sheet over a busy screen is the
      // number one way these end up looking muddy.
      backgroundStyle={{
        backgroundColor: colors.raised,
        borderTopLeftRadius: radius.xxl,
        borderTopRightRadius: radius.xxl,
        borderWidth: isDark ? 1 : 0,
        borderColor: colors.border,
      }}
      handleIndicatorStyle={{
        backgroundColor: colors.borderStrong,
        width: 40,
        height: 4,
      }}
    >
      <Body
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
          paddingTop: spacing.sm,
          gap: spacing.md,
        }}
      >
        {title ? (
          <View style={{ paddingBottom: spacing.xs }}>
            <Text variant="heading">{title}</Text>
          </View>
        ) : null}
        {children}
      </Body>
    </BottomSheetModal>
  );
});

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { View } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
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
  /** percentages or fixed points; defaults to content height */
  snapPoints?: (string | number)[];
  scrollable?: boolean;
  onClose?: () => void;
};

/**
 * The app's only modal surface. Bottom sheets beat centered dialogs on phones:
 * reachable with a thumb, dismissible with a swipe, and they keep context visible.
 */
export const Sheet = forwardRef<SheetRef, SheetProps>(function Sheet(
  { children, title, snapPoints, scrollable, onClose },
  ref,
) {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const sheet = useRef<BottomSheet>(null);

  useImperativeHandle(ref, () => ({
    open: () => sheet.current?.expand(),
    close: () => sheet.current?.close(),
  }));

  const points = useMemo(() => snapPoints, [snapPoints]);

  const backdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  const Body = scrollable ? BottomSheetScrollView : BottomSheetView;

  return (
    <BottomSheet
      ref={sheet}
      index={-1}
      enablePanDownToClose
      enableDynamicSizing={!points}
      snapPoints={points}
      backdropComponent={backdrop}
      onClose={onClose}
      backgroundStyle={{
        backgroundColor: colors.raised,
        borderTopLeftRadius: radius.xxl,
        borderTopRightRadius: radius.xxl,
      }}
      handleIndicatorStyle={{
        backgroundColor: colors.borderStrong,
        width: 40,
        height: 4,
      }}
      style={{
        // matches the elevated look of the rest of the app
        shadowColor: colors.shadowColor,
        shadowOpacity: 0.2,
        shadowRadius: 30,
        shadowOffset: { width: 0, height: -8 },
        elevation: 24,
      }}
    >
      <Body
        style={{ flex: scrollable ? 1 : undefined }}
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
    </BottomSheet>
  );
});

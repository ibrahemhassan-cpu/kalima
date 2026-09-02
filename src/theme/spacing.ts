export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/**
 * The floating tab bar's geometry, in one place.
 *
 * Three files need these numbers: the bar draws itself from them, and both
 * Screen and the Words list reserve room from them. They used to be written
 * out separately — 88 here, "68 + 12" spelled again in the bar — so the
 * reserved room and the room actually taken could drift apart silently, and
 * the "+" button's overhang was never counted at all.
 */
export const TAB_BAR = {
  /** the pill itself */
  height: 68,
  /** the centre "+" that rises out of it */
  plus: 56,
  /** gap between the pill and the bottom safe-area edge */
  gap: 12,
  /** how far the "+" is shifted up out of the pill (its `top` offset) */
  lift: 18,
  /**
   * Floor for insets.bottom under the pill. A device with no home indicator
   * reports 0, and the pill should not sit flush against the glass.
   */
  minInset: 8,
} as const;

/**
 * How far the "+" actually rises above the pill's top edge.
 *
 * Not the same as `lift`: the button is centred in the pill first, which
 * already insets it by half the height difference, so it clears the top by
 * the lift minus that inset.
 */
export const TAB_BAR_OVERHANG =
  TAB_BAR.lift - (TAB_BAR.height - TAB_BAR.plus) / 2;

/**
 * Vertical room the bar occupies above the bottom safe-area inset —
 * pill + gap + the part of the "+" that sticks out above it.
 */
export const TAB_BAR_HEIGHT =
  TAB_BAR.height + TAB_BAR.gap + TAB_BAR_OVERHANG;

/**
 * Bottom padding a screen inside (tabs) needs so its last element clears the
 * bar on any device, with `extra` of visible breathing room beneath it.
 *
 * Derived from the same constants the bar positions itself with, so the two
 * cannot disagree: with a home indicator (inset 34) it reserves 142 against
 * 126 taken; with none (inset 0) it reserves 116 against 100. The visible
 * clearance is `extra` on every device, which is the point.
 */
export function tabBarClearance(insetBottom: number, extra = 16): number {
  return Math.max(insetBottom, TAB_BAR.minInset) + TAB_BAR_HEIGHT + extra;
}

/** Generous radii — the single biggest lever on "modern vs dated". */
export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
  pill: 999,
} as const;

/**
 * Layered shadows. A single hard shadow reads as 2010s;
 * two soft stacked layers read as depth.
 */
export function makeShadows(color: string, isDark: boolean) {
  const o = isDark ? 0.6 : 1;
  return {
    none: {},
    sm: {
      shadowColor: color,
      shadowOpacity: 0.05 * o,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    md: {
      shadowColor: color,
      shadowOpacity: 0.07 * o,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    lg: {
      shadowColor: color,
      shadowOpacity: 0.11 * o,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: 14 },
      elevation: 8,
    },
    card: {
      shadowColor: color,
      shadowOpacity: isDark ? 0.35 : 0.07,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    raised: {
      shadowColor: color,
      shadowOpacity: isDark ? 0.45 : 0.11,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
    },
    brand: {
      shadowColor: "#5B5BF5",
      shadowOpacity: isDark ? 0.45 : 0.28,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
  } as const;
}

export type Shadows = ReturnType<typeof makeShadows>;

/** Spring config used across every press + transition. */
export const spring = {
  snappy: { damping: 16, stiffness: 240, mass: 0.7 },
  soft: { damping: 22, stiffness: 150, mass: 0.9 },
  bounce: { damping: 12, stiffness: 180, mass: 0.8 },
} as const;

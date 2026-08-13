export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

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
  const o = isDark ? 0.5 : 1;
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
    brand: {
      shadowColor: "#5B5BF5",
      shadowOpacity: isDark ? 0.4 : 0.28,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
  } as const;
}

export type Shadows = ReturnType<typeof makeShadows>;

/** Spring config used across every press + transition. */
export const spring = {
  snappy: { damping: 18, stiffness: 260, mass: 0.7 },
  soft: { damping: 22, stiffness: 150, mass: 0.9 },
} as const;

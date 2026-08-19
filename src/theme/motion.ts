/**
 * The app's motion language, in one place.
 *
 * The rule everything here serves: **motion explains a change, it never
 * decorates a screen.** A card that was already there when you arrived does
 * not animate in. A number that did not change does not count up. Something
 * moves because you did something, or because the thing itself changed.
 *
 * Before this file the app had ten different press scales between 0.88 and
 * 0.99 and thirty-three entrance animations — which is what "animated by
 * whoever wrote that screen that day" looks like.
 */

/** The only press response in the app. Barely visible, always the same. */
export const PRESS_SCALE = 0.97;

/** A slightly firmer press for small circular targets, where 0.97 reads as nothing. */
export const PRESS_SCALE_SMALL = 0.93;

export const duration = {
  /** state flips: a toggle, a colour, an icon swap */
  instant: 120,
  /** the standard: something appeared, moved or resized */
  normal: 220,
  /** deliberate arrivals — a result, a sheet, the first paint of a screen */
  slow: 380,
} as const;


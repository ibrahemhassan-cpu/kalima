import { I18nManager, Platform } from "react-native";
import * as Updates from "expo-updates";
import i18n, { type UILanguage } from "./index";

export const isRTL = () => I18nManager.isRTL;

/**
 * Switching direction needs a full reload in React Native.
 *
 * We avoid forcing RTL layout entirely and instead keep the layout LTR while
 * translating the copy. That means the toggle is *instant* — no reload, no
 * jarring restart — which matters a lot for a one-tap language button.
 *
 * Arabic text still renders right-to-left inside each Text node, which is what
 * actually matters for readability. Full mirrored layout is available behind
 * `applyMirroredLayout` for users who want it from Settings.
 */
export async function setLanguage(lang: UILanguage) {
  await i18n.changeLanguage(lang);
}

/** Opt-in full layout mirroring. Requires a reload. */
export async function applyMirroredLayout(enabled: boolean) {
  if (I18nManager.isRTL === enabled) return;
  I18nManager.allowRTL(enabled);
  I18nManager.forceRTL(enabled);

  if (__DEV__) {
    console.warn("[rtl] direction changed — reload to apply");
    return;
  }
  try {
    await Updates.reloadAsync();
  } catch {
    // Not available (dev client / Expo Go) — applies on next cold start.
  }
}

/**
 * English words must stay LTR even inside Arabic copy, otherwise punctuation
 * jumps to the wrong side.
 */
export const ltrText = { writingDirection: "ltr" as const };

/**
 * Direction-aware glyphs.
 *
 * A "next" arrow has to point the way the reader moves, and Ionicons names
 * are physical: arrow-forward always points right. Nine call sites needed the
 * flip and only four did it, so a next button pointed backwards on any device
 * that resolved to RTL — which is device- and platform-dependent here, since
 * ensureRTLAllowed only opts Android in.
 *
 * Read once at module load: I18nManager.isRTL is fixed for the process, and a
 * change requires a reload anyway.
 */
const rtl = I18nManager.isRTL;

/** Onward, in the reading direction. */
export const ICON_FORWARD = rtl ? "arrow-back" : "arrow-forward";
/** Back, against the reading direction. */
export const ICON_BACK = rtl ? "arrow-forward" : "arrow-back";
/** The chevron on a row that drills in. */
export const ICON_CHEVRON_FORWARD = rtl ? "chevron-back" : "chevron-forward";
/** The chevron on a back button. */
export const ICON_CHEVRON_BACK = rtl ? "chevron-forward" : "chevron-back";

export function ensureRTLAllowed() {
  if (Platform.OS === "android") I18nManager.allowRTL(true);
}

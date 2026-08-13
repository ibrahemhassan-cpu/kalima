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

export function ensureRTLAllowed() {
  if (Platform.OS === "android") I18nManager.allowRTL(true);
}

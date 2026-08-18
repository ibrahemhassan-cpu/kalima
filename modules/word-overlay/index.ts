import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

export type OverlayCard = {
  word: string;
  translation: string;
};

type WordOverlayNative = {
  isSupported: () => boolean;
  hasPermission: () => boolean;
  isRunning: () => boolean;
  openPermissionSettings: () => Promise<void>;
  start: (
    intervalMinutes: number,
    cards: OverlayCard[],
    notificationTitle: string,
    notificationBody: string,
  ) => Promise<void>;
  setCards: (cards: OverlayCard[]) => Promise<void>;
  stop: () => Promise<void>;
};

/**
 * Optional on purpose: the module has no iOS implementation, and a JS-only
 * Expo Go client has no native side at all. Every export below degrades to a
 * no-op rather than throwing, so screens can call them unguarded.
 */
const native = requireOptionalNativeModule<WordOverlayNative>("WordOverlay");

/**
 * A floating card over other apps exists only on Android. iOS provides no API
 * for drawing outside your own app, so this is false there and the feature is
 * hidden rather than broken.
 */
export function isOverlaySupported(): boolean {
  return Platform.OS === "android" && native != null;
}

/** Granted by hand in system settings — Android shows no runtime dialog. */
export function hasOverlayPermission(): boolean {
  if (!isOverlaySupported()) return false;
  try {
    return native!.hasPermission();
  } catch {
    return false;
  }
}

export function isOverlayRunning(): boolean {
  if (!isOverlaySupported()) return false;
  try {
    return native!.isRunning();
  } catch {
    return false;
  }
}

export async function openOverlaySettings(): Promise<void> {
  if (!isOverlaySupported()) return;
  await native!.openPermissionSettings();
}

export async function startOverlay(opts: {
  intervalMinutes: number;
  cards: OverlayCard[];
  notificationTitle: string;
  notificationBody: string;
}): Promise<void> {
  if (!isOverlaySupported() || opts.cards.length === 0) return;
  await native!.start(
    opts.intervalMinutes,
    opts.cards,
    opts.notificationTitle,
    opts.notificationBody,
  );
}

export async function setOverlayCards(cards: OverlayCard[]): Promise<void> {
  if (!isOverlaySupported() || cards.length === 0) return;
  await native!.setCards(cards);
}

export async function stopOverlay(): Promise<void> {
  if (!isOverlaySupported()) return;
  await native!.stop();
}

import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

export type WidgetCard = {
  word: string;
  translation: string;
  ipa: string;
  /** user_word id — tapping the widget opens this word */
  id: string;
};

type WordWidgetNative = {
  isSupported: () => boolean;
  placedCount: () => number;
  setDeck: (cards: WidgetCard[]) => Promise<void>;
  refresh: () => Promise<void>;
};

/**
 * Optional on purpose: a build made before this module existed has no native
 * side at all, and then every call below is a no-op instead of a crash — so
 * screens can call them unguarded.
 */
const native = requireOptionalNativeModule<WordWidgetNative>("WordWidget");

export function isWidgetSupported(): boolean {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return false;
  if (native == null) return false;
  try {
    return native.isSupported();
  } catch {
    return false;
  }
}

/**
 * How many widgets the user has placed on their home screen.
 *
 * Android can answer exactly. iOS only answers asynchronously, so it reports 0
 * — treat that as "unknown", never as "none placed".
 */
export function widgetsPlaced(): number {
  if (!isWidgetSupported()) return 0;
  try {
    return native!.placedCount();
  } catch {
    return 0;
  }
}

export async function setWidgetDeck(cards: WidgetCard[]): Promise<void> {
  if (!isWidgetSupported()) return;
  await native!.setDeck(cards);
}

export async function refreshWidget(): Promise<void> {
  if (!isWidgetSupported()) return;
  await native!.refresh();
}

import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useTranslation } from "react-i18next";

import { useSettings } from "@/store/settings";
import { useMyWords } from "@/api/words";
import {
  cancelWordCards,
  scheduleWordCards,
  type WordCard,
} from "@/features/notifications/wordCards";
import {
  hasOverlayPermission,
  isOverlaySupported,
  setOverlayCards,
  startOverlay,
  stopOverlay,
} from "@modules/word-overlay";

/** How many words to cycle through before repeating. */
const DECK_SIZE = 40;

/**
 * Which shape the word card takes on this device.
 *
 *   overlay       a real floating card over other apps — Android, permission granted
 *   notification  one scheduled notification per word — iOS, and Android without
 *                 the permission. iOS gives no app any way to draw over another,
 *                 so this is as close as that platform allows.
 *   none          the feature is off, or there are no words to show yet
 */
export type CardMode = "overlay" | "notification" | "none";

export function cardModeFor(enabled: boolean): CardMode {
  if (!enabled) return "none";
  if (isOverlaySupported() && hasOverlayPermission()) return "overlay";
  return "notification";
}

/**
 * Keeps the word card in step with the user's settings and library.
 * Mounted once from the root layout, next to useReminders.
 */
export function useWordOverlay(enabled: boolean) {
  const { t } = useTranslation();
  const overlayEnabled = useSettings((s) => s.overlayEnabled);
  const interval = useSettings((s) => s.overlayInterval);

  // Only words the user actually saved; a card for a word you never added
  // would be noise, not a reminder.
  const { data: words } = useMyWords({
    filter: "all",
    search: "",
    sort: "recent",
  });

  const lastKey = useRef("");
  // bumped on foreground so the effect re-runs and tops the schedule back up
  const [wake, setWake] = useState(0);

  useEffect(() => {
    const on = enabled && overlayEnabled;

    if (!on) {
      if (lastKey.current === "off") return;
      lastKey.current = "off";
      void stopOverlay();
      void cancelWordCards();
      return;
    }

    const deck: WordCard[] = (words ?? [])
      .slice(0, DECK_SIZE)
      .map((w) => ({ word: w.lemma, translation: w.ar_preview }))
      .filter((c) => c.word.length > 0);

    if (deck.length === 0) {
      if (lastKey.current === "empty") return;
      lastKey.current = "empty";
      void stopOverlay();
      void cancelWordCards();
      return;
    }

    // The overlay permission is granted outside the app, so re-read it rather
    // than trust whatever was true when the toggle was flipped.
    const mode = cardModeFor(true);

    if (mode === "overlay") {
      const key = ["overlay", interval, deck.map((c) => c.word).join(",")].join("|");
      if (key === lastKey.current) return;

      const sameInterval = lastKey.current.startsWith(`overlay|${interval}|`);
      lastKey.current = key;

      // stop any notification cards left over from before the permission
      void cancelWordCards();

      if (sameInterval) {
        void setOverlayCards(deck);
      } else {
        void startOverlay({
          intervalMinutes: interval,
          cards: deck,
          notificationTitle: t("overlay.serviceTitle"),
          notificationBody: t("overlay.serviceBody"),
        });
      }
      return;
    }

    // notification path — reschedule on every wake so it never runs dry
    lastKey.current = ["notify", interval, wake].join("|");
    void stopOverlay();
    void scheduleWordCards({ cards: deck, intervalMinutes: interval });
  }, [enabled, overlayEnabled, interval, words, wake, t]);

  // Coming back from the permission screen, or from a day away, should take
  // effect at once.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      lastKey.current = "";
      setWake((n) => n + 1);
    });
    return () => sub.remove();
  }, []);
}

import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { useSettings } from "@/store/settings";
import { useMyWords } from "@/api/words";
import { cancelWordCards, scheduleWordCards } from "@/features/notifications/wordCards";
import { isWidgetSupported, setWidgetDeck, type WidgetCard } from "@modules/word-widget";

/** How many words to cycle through before repeating. */
const DECK_SIZE = 40;

/**
 * The word card feature, both halves of it.
 *
 *   widget         gets the deck and then runs itself — it advances on the
 *                  system's half-hourly update and on its own next button,
 *                  with no app involvement at all
 *   notifications  optional, opt-in, and the only half that reaches someone
 *                  who never looks at their home screen
 *
 * Mounted once from the root layout, next to useReminders.
 */
export function useWordWidget(enabled: boolean) {
  const notifyEnabled = useSettings((s) => s.overlayEnabled);
  const interval = useSettings((s) => s.overlayInterval);

  // Only words the user actually saved; a card for a word you never added
  // would be noise, not a reminder.
  const { data: words } = useMyWords({
    filter: "all",
    search: "",
    sort: "recent",
  });

  const lastDeck = useRef("");
  const lastNotify = useRef("");
  // bumped on foreground so the notification schedule gets topped back up
  const [wake, setWake] = useState(0);

  const deck: WidgetCard[] = (words ?? [])
    .slice(0, DECK_SIZE)
    .filter((w) => w.lemma.length > 0)
    .map((w) => ({
      word: w.lemma,
      translation: w.ar_preview || "",
      ipa: w.ipa || "",
      id: w.user_word_id,
    }));

  const deckKey = deck.map((c) => c.word).join(",");

  // ── the widget ──────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !isWidgetSupported() || deck.length === 0) return;
    if (deckKey === lastDeck.current) return;

    lastDeck.current = deckKey;
    void setWidgetDeck(deck);
    // deck is derived from deckKey, so keying the effect on the latter is enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, deckKey]);

  // ── the notifications ───────────────────────────────────
  useEffect(() => {
    const on = enabled && notifyEnabled;

    if (!on || deck.length === 0) {
      if (lastNotify.current === "off") return;
      lastNotify.current = "off";
      void cancelWordCards();
      return;
    }

    const key = [interval, wake, deckKey].join("|");
    if (key === lastNotify.current) return;
    lastNotify.current = key;

    void scheduleWordCards({
      cards: deck.map((c) => ({ word: c.word, translation: c.translation })),
      intervalMinutes: interval,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, notifyEnabled, interval, deckKey, wake]);

  // A word added elsewhere, or a day away, should take effect on return.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      lastDeck.current = "";
      setWake((n) => n + 1);
    });
    return () => sub.remove();
  }, []);
}

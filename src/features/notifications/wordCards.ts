import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import i18n from "@/i18n";
import { hasPermission } from "./index";

export type WordCard = { word: string; translation: string };

/**
 * iOS keeps at most 64 pending local notifications per app, and the daily
 * reminders already claim a handful. Staying well under that leaves room for
 * them and for anything added later.
 */
const MAX_CARDS = 48;

/** Nobody wants a vocabulary card at 3am. */
const WAKING_FROM = 8;
const WAKING_TO = 22;

const cardId = (i: number) => `kalima-card-${i}`;

async function cancel(id: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // wasn't scheduled
  }
}

export async function cancelWordCards() {
  await Promise.all(Array.from({ length: MAX_CARDS }, (_, i) => cancel(cardId(i))));
}

/**
 * The next `count` moments, `intervalMinutes` apart, skipping the night.
 * Anything that lands after the waking window jumps to the next morning.
 */
export function nextSlots(
  count: number,
  intervalMinutes: number,
  from: Date = new Date(),
): Date[] {
  const out: Date[] = [];
  const cursor = new Date(from.getTime());

  while (out.length < count) {
    cursor.setTime(cursor.getTime() + intervalMinutes * 60_000);

    const hour = cursor.getHours();
    if (hour >= WAKING_TO) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(WAKING_FROM, 0, 0, 0);
    } else if (hour < WAKING_FROM) {
      cursor.setHours(WAKING_FROM, 0, 0, 0);
    }

    out.push(new Date(cursor.getTime()));
  }

  return out;
}

/**
 * Schedules one notification per upcoming slot, each carrying a different word.
 *
 * A single repeating trigger would be cheaper, but its content is fixed — you'd
 * see the same word forever. One-shot notifications are what make the word
 * actually change. They're topped up every time the app comes to the
 * foreground, and running out after a day or two of not opening the app is
 * fine: someone who stopped using the app shouldn't keep being buzzed.
 */
export async function scheduleWordCards(opts: {
  cards: WordCard[];
  intervalMinutes: number;
}): Promise<number> {
  await cancelWordCards();

  if (opts.cards.length === 0) return 0;
  if (!(await hasPermission())) return 0;

  const slots = nextSlots(MAX_CARDS, opts.intervalMinutes);

  for (const [i, when] of slots.entries()) {
    const card = opts.cards[i % opts.cards.length]!;

    await Notifications.scheduleNotificationAsync({
      identifier: cardId(i),
      content: {
        title: card.word,
        body: card.translation || i18n.t("overlay.cardFallbackBody"),
        ...(Platform.OS === "android" ? { channelId: "reminders" } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
      },
    });
  }

  return slots.length;
}

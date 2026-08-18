import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import i18n from "@/i18n";

/**
 * Every reminder is scheduled on-device. No push server, no tokens, no cost,
 * and nothing about the user's study habits leaves the phone.
 */

const IDS = {
  daily: "kalima-daily",
  streak: "kalima-streak-risk",
  comeback: "kalima-comeback",
} as const;

/** The user may pick several times a day; each gets its own identifier. */
export const MAX_REMINDERS = 6;
const dailyId = (i: number) => `${IDS.daily}-${i}`;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("reminders", {
    name: "Reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 180],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function hasPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

/**
 * Ask *after* the first finished session, never on first launch.
 * Acceptance rates differ by several times between those two moments.
 */
export async function requestPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return true;
  if (!current.canAskAgain) return false;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

async function cancel(id: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // wasn't scheduled
  }
}

async function cancelDailies() {
  // the pre-0008 single reminder plus every slot we might have used
  await cancel(IDS.daily);
  await Promise.all(
    Array.from({ length: MAX_REMINDERS }, (_, i) => cancel(dailyId(i))),
  );
}

export async function cancelAll() {
  await cancelDailies();
  await Promise.all([cancel(IDS.streak), cancel(IDS.comeback)]);
}

export type ReminderTime = { hour: number; minute: number };

/**
 * Daily nudges at every time the user picked.
 *
 * Rescheduling always clears the whole set first: a removed time must actually
 * stop firing, and expo keeps a notification alive until its id is cancelled.
 */
export async function scheduleDailyTimes(times: ReminderTime[]) {
  await cancelDailies();
  if (!(await hasPermission())) return;

  const slots = times.slice(0, MAX_REMINDERS);

  for (const [i, at] of slots.entries()) {
    await Notifications.scheduleNotificationAsync({
      identifier: dailyId(i),
      content: {
        title: i18n.t("notify.dailyTitle"),
        body: i18n.t("notify.dailyBody"),
        ...(Platform.OS === "android" ? { channelId: "reminders" } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: at.hour,
        minute: at.minute,
      },
    });
  }
}

/**
 * Late-evening save. Scheduled only when the goal is still unmet, and
 * cancelled the moment it's reached — nobody should be told their streak is
 * at risk after they've already done the work.
 */
export async function scheduleStreakRisk(streak: number) {
  await cancel(IDS.streak);
  if (streak < 2 || !(await hasPermission())) return;

  await Notifications.scheduleNotificationAsync({
    identifier: IDS.streak,
    content: {
      title: i18n.t("notify.streakTitle", { count: streak }),
      body: i18n.t("notify.streakBody"),
      ...(Platform.OS === "android" ? { channelId: "reminders" } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 30,
    },
  });
}

export async function clearStreakRisk() {
  await cancel(IDS.streak);
}

/** One gentle message after three quiet days, then silence. */
export async function scheduleComeback() {
  await cancel(IDS.comeback);
  if (!(await hasPermission())) return;

  await Notifications.scheduleNotificationAsync({
    identifier: IDS.comeback,
    content: {
      title: i18n.t("notify.comebackTitle"),
      body: i18n.t("notify.comebackBody"),
      ...(Platform.OS === "android" ? { channelId: "reminders" } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60 * 60 * 24 * 3,
      repeats: false,
    },
  });
}

/**
 * Single entry point called whenever settings or progress change, so the
 * scheduled set always matches reality.
 */
export async function syncReminders(opts: {
  enabled: boolean;
  times: ReminderTime[];
  streak: number;
  goalMet: boolean;
}) {
  await ensureChannel();

  if (!opts.enabled || !(await hasPermission())) {
    await cancelAll();
    return;
  }

  await scheduleDailyTimes(opts.times);
  await scheduleComeback();

  if (opts.goalMet) await clearStreakRisk();
  else await scheduleStreakRisk(opts.streak);
}

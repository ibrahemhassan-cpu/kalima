import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useProfile } from "@/api/profile";
import { supabase } from "@/lib/supabase";
import { flushQueue } from "@/lib/offline";
import { syncReminders, type ReminderTime } from "./index";
import type { HomeSummary } from "@/lib/database.types";

/**
 * `reminder_times` arrives as Postgres `time` strings ("09:00:00").
 * Falls back to the single pre-0008 column so a profile that predates the
 * migration still gets its one reminder.
 */
export function parseReminderTimes(
  times: string[] | null | undefined,
  fallback: string | null | undefined,
): ReminderTime[] {
  const raw = times && times.length > 0 ? times : [fallback ?? "19:00:00"];

  const parsed = raw
    .map((t) => {
      const [h, m] = String(t).split(":");
      return { hour: Number(h), minute: Number(m ?? 0) };
    })
    .filter((t) => Number.isFinite(t.hour) && Number.isFinite(t.minute));

  return parsed.length > 0 ? parsed : [{ hour: 19, minute: 0 }];
}

/**
 * Keeps scheduled reminders in step with the user's settings and progress,
 * and drains the offline queue whenever the app returns to the foreground.
 *
 * Mounted once, from the root layout.
 */
export function useReminders(enabled: boolean) {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const { i18n } = useTranslation();
  const lastKey = useRef("");

  // Reschedule only when something that affects the schedule actually changed.
  useEffect(() => {
    if (!enabled || !profile) return;

    const times = parseReminderTimes(
      profile.reminder_times,
      profile.reminder_time,
    );
    const summary = qc.getQueryData<HomeSummary>(["home-summary"]);

    const key = [
      profile.reminder_enabled,
      times.map((t) => `${t.hour}:${t.minute}`).join(","),
      summary?.current_streak ?? 0,
      summary?.goal_met ?? false,
      i18n.language,
    ].join("|");

    if (key === lastKey.current) return;
    lastKey.current = key;

    void syncReminders({
      enabled: profile.reminder_enabled,
      times,
      streak: summary?.current_streak ?? 0,
      goalMet: summary?.goal_met ?? false,
    });
  }, [enabled, profile, qc, i18n.language]);

  // Drain the offline queue on mount and on every foreground.
  useEffect(() => {
    if (!enabled) return;

    async function drain() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      const res = await flushQueue();
      if (res.applied > 0) {
        void qc.invalidateQueries({ queryKey: ["home-summary"] });
        void qc.invalidateQueries({ queryKey: ["my-words"] });
      }
    }

    void drain();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void drain();
    });
    return () => sub.remove();
  }, [enabled, qc]);
}

import { create } from "zustand";
import type { CefrLevel } from "@/lib/database.types";

type OnboardingDraft = {
  level: CefrLevel | null;
  dailyGoal: number | null;
  reminderHour: number | null;
  reminderEnabled: boolean;

  setLevel: (v: CefrLevel) => void;
  setDailyGoal: (v: number) => void;
  setReminder: (hour: number | null, enabled: boolean) => void;
  reset: () => void;
};

/** In-memory draft — written to the profile on the final step. */
export const useOnboarding = create<OnboardingDraft>((set) => ({
  level: null,
  dailyGoal: null,
  reminderHour: 19,
  reminderEnabled: true,

  setLevel: (level) => set({ level }),
  setDailyGoal: (dailyGoal) => set({ dailyGoal }),
  setReminder: (reminderHour, reminderEnabled) =>
    set({ reminderHour, reminderEnabled }),
  reset: () =>
    set({ level: null, dailyGoal: null, reminderHour: 19, reminderEnabled: true }),
}));

export const LEVEL_KEYS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
export const GOAL_VALUES = [5, 10, 20, 40] as const;
export const REMINDER_HOURS = [7, 9, 12, 15, 17, 19, 20, 21, 22];

type Translate = (key: string, opts?: Record<string, unknown>) => string;

export function levelOptions(t: Translate) {
  return LEVEL_KEYS.map((key) => ({
    key,
    title: t(`onboarding.level${key}`),
    subtitle: t(`onboarding.level${key}Sub`),
  }));
}

export function goalOptions(t: Translate) {
  return GOAL_VALUES.map((key) => ({
    key: key as number,
    title: t(`onboarding.goal${key}`),
    subtitle: t(`onboarding.goal${key}Sub`),
  }));
}

/** 24h number → localised clock label. */
export function formatHour(h: number, lang: string): string {
  const d = new Date();
  d.setHours(h, 0, 0, 0);
  try {
    return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return `${h}:00`;
  }
}

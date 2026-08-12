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

/** مسودة مؤقتة في الذاكرة — تُحفظ في البروفايل في آخر خطوة */
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

export const LEVELS: { key: CefrLevel; title: string; subtitle: string }[] = [
  { key: "A1", title: "مبتدئ خالص", subtitle: "بعرف كلمات بسيطة زي الأرقام والألوان" },
  { key: "A2", title: "مبتدئ", subtitle: "بفهم جمل قصيرة وبعرف أعرّف عن نفسي" },
  { key: "B1", title: "متوسط", subtitle: "بتكلّم في مواضيع يومية وبفهم أغلب الكلام" },
  { key: "B2", title: "فوق المتوسط", subtitle: "بقرا مقالات وبتابع أفلام من غير ترجمة" },
  { key: "C1", title: "متقدّم", subtitle: "بتعامل مع نصوص أكاديمية ومهنية" },
  { key: "C2", title: "شبه أصلي", subtitle: "بفهم كل حاجة تقريبًا" },
];

export const GOALS: { key: number; title: string; subtitle: string }[] = [
  { key: 5, title: "5 كلمات في اليوم", subtitle: "دقيقتين — مناسب لو وقتك ضيّق" },
  { key: 10, title: "10 كلمات في اليوم", subtitle: "5 دقايق — الأكثر اختيارًا" },
  { key: 20, title: "20 كلمة في اليوم", subtitle: "10 دقايق — لو عايز تتقدّم بسرعة" },
  { key: 40, title: "40 كلمة في اليوم", subtitle: "20 دقيقة — للجادّين جدًا" },
];

export function formatHour(h: number): string {
  const period = h < 12 ? "صباحًا" : "مساءً";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:00 ${period}`;
}

import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { ListGroup, ListRow, Screen, Text } from "@/components/ui";
import { AuthHeader } from "@/features/auth/AuthHeader";
import { useTheme } from "@/theme/ThemeProvider";
import { useSettings } from "@/store/settings";
import { useProfile, useUpdateProfile } from "@/api/profile";
import { fontScaleLabels } from "@/theme/typography";
import { formatHour } from "@/features/onboarding/store";
import { applyLanguage } from "@/i18n/rtl";

const THEME_LABEL = { light: "فاتح", dark: "غامق", system: "حسب النظام" } as const;
const LEVEL_LABEL = {
  A1: "مبتدئ خالص",
  A2: "مبتدئ",
  B1: "متوسط",
  B2: "فوق المتوسط",
  C1: "متقدّم",
  C2: "شبه أصلي",
} as const;

export default function Settings() {
  const { spacing } = useTheme();
  const router = useRouter();
  const s = useSettings();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const reminderHour = Number((profile?.reminder_time ?? "19:00:00").slice(0, 2));

  return (
    <Screen scroll>
      <AuthHeader title="الإعدادات" onBack={() => router.back()} />

      <ListGroup title="المظهر">
        <ListRow
          icon="contrast-outline"
          title="الثيم"
          value={THEME_LABEL[s.theme]}
          onPress={() => router.push("/settings/theme")}
        />
        <ListRow
          icon="text-outline"
          title="حجم الخط"
          value={fontScaleLabels[s.fontScale]}
          onPress={() => router.push("/settings/font")}
        />
        <ListRow
          icon="accessibility-outline"
          title="وضع مبسّط"
          subtitle="خط أكبر وخيارات أقل"
          toggle={{ value: s.simpleMode, onChange: s.setSimpleMode }}
        />
        <ListRow
          icon="language-outline"
          title="لغة الواجهة"
          value={s.language === "ar" ? "العربية" : "English"}
          onPress={() => {
            const next = s.language === "ar" ? "en" : "ar";
            s.setLanguage(next);
            void applyLanguage(next);
          }}
          last
        />
      </ListGroup>

      <ListGroup title="التعلّم">
        <ListRow
          icon="flag-outline"
          title="الهدف اليومي"
          value={`${profile?.daily_goal ?? 10} كلمة`}
          onPress={() => router.push("/settings/goal")}
        />
        <ListRow
          icon="school-outline"
          title="مستواي في الإنجليزي"
          value={LEVEL_LABEL[profile?.cefr_level ?? "A2"]}
          onPress={() => router.push("/settings/level")}
        />
        <ListRow
          icon="volume-high-outline"
          title="تشغيل النطق تلقائيًا"
          toggle={{ value: s.autoplayAudio, onChange: s.setAutoplayAudio }}
          last
        />
      </ListGroup>

      <ListGroup title="الإشعارات">
        <ListRow
          icon="notifications-outline"
          title="تذكير يومي"
          toggle={{
            value: profile?.reminder_enabled ?? true,
            onChange: (v) => update.mutate({ reminder_enabled: v }),
          }}
        />
        <ListRow
          icon="time-outline"
          title="وقت التذكير"
          value={formatHour(reminderHour)}
          onPress={() => router.push("/settings/reminder")}
          last
        />
      </ListGroup>

      <ListGroup title="الحساب">
        <ListRow
          icon="person-outline"
          title="تعديل البيانات"
          onPress={() => router.push("/settings/profile")}
        />
        <ListRow
          icon="download-outline"
          title="نزّل بياناتي"
          subtitle="كل كلماتك وتقدّمك في ملف واحد"
          onPress={() => router.push("/settings/account")}
        />
        <ListRow
          icon="trash-outline"
          title="حذف الحساب"
          danger
          onPress={() => router.push("/settings/account")}
          last
        />
      </ListGroup>

      <View style={{ height: spacing.xl }} />
      <Text variant="caption" tone="faint" center>
        كلمة · الإصدار 0.1.0
      </Text>
    </Screen>
  );
}

import React from "react";
import { useRouter } from "expo-router";
import { ChoiceList, Screen } from "@/components/ui";
import { AuthHeader } from "@/features/auth/AuthHeader";
import { useSettings, type ThemePref } from "@/store/settings";

export default function ThemeSetting() {
  const router = useRouter();
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);

  return (
    <Screen scroll>
      <AuthHeader title="الثيم" onBack={() => router.back()} />
      <ChoiceList<ThemePref>
        options={[
          { key: "light", title: "فاتح" },
          { key: "dark", title: "غامق" },
          {
            key: "system",
            title: "حسب النظام",
            subtitle: "يتغيّر تلقائيًا مع إعدادات تليفونك",
          },
        ]}
        value={theme}
        onChange={setTheme}
      />
    </Screen>
  );
}

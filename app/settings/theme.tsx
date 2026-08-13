import React from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ChoiceList, Header, Screen } from "@/components/ui";
import { useSettings, type ThemePref } from "@/store/settings";

export default function ThemeSetting() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);

  return (
    <Screen scroll>
      <Header title={t("settings.theme")} onBack={() => router.back()} />
      <ChoiceList<ThemePref>
        options={[
          { key: "light", title: t("settings.themeLight") },
          { key: "dark", title: t("settings.themeDark") },
          {
            key: "system",
            title: t("settings.themeSystem"),
            subtitle: t("settings.themeSystemHint"),
          },
        ]}
        value={theme}
        onChange={setTheme}
      />
    </Screen>
  );
}

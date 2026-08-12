import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FontScaleName } from "@/theme/typography";

export type ThemePref = "light" | "dark" | "system";
export type UILanguage = "ar" | "en";

type SettingsState = {
  theme: ThemePref;
  language: UILanguage;
  fontScale: FontScaleName;
  /** وضع مبسّط: كروت أكبر، خيارات أقل، بدون إحصائيات متقدمة */
  simpleMode: boolean;
  autoplayAudio: boolean;
  hydrated: boolean;

  setTheme: (v: ThemePref) => void;
  setLanguage: (v: UILanguage) => void;
  setFontScale: (v: FontScaleName) => void;
  setSimpleMode: (v: boolean) => void;
  setAutoplayAudio: (v: boolean) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      language: "ar",
      fontScale: "md",
      simpleMode: false,
      autoplayAudio: true,
      hydrated: false,

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setFontScale: (fontScale) => set({ fontScale }),
      setSimpleMode: (simpleMode) => set({ simpleMode }),
      setAutoplayAudio: (autoplayAudio) => set({ autoplayAudio }),
    }),
    {
      name: "kalima-settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ theme, language, fontScale, simpleMode, autoplayAudio }) => ({
        theme,
        language,
        fontScale,
        simpleMode,
        autoplayAudio,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setTheme(state.theme);
        useSettings.setState({ hydrated: true });
      },
    },
  ),
);

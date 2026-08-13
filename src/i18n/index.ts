import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./ar.json";
import en from "./en.json";

export const resources = {
  en: { translation: en },
  ar: { translation: ar },
} as const;

export type UILanguage = keyof typeof resources;

/** English is the default. Arabic is one tap away from any screen header. */
i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en", "ar"],
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;

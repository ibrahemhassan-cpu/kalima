import React from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Header, Screen } from "@/components/ui";
import { LegalDocument } from "@/components/LegalText";

export default function Privacy() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Screen scroll>
      {/*
        The language switch stays available here on purpose: this is one of the
        few screens a user may need to read in the other language, and it's
        reachable before signing in.
      */}
      <Header title={t("profile.privacy")} onBack={() => router.back()} />
      <LegalDocument doc="privacy" />
    </Screen>
  );
}

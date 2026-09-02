import React from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Header, Screen } from "@/components/ui";
import { LegalDocument } from "@/components/LegalText";
import { useGoBack } from "@/lib/navigation";

export default function Privacy() {
  const router = useRouter();
  const goBack = useGoBack();
  const { t } = useTranslation();

  return (
    <Screen scroll>
      {/*
        The language switch stays available here on purpose: this is one of the
        few screens a user may need to read in the other language, and it's
        reachable before signing in.
      */}
      <Header title={t("profile.privacy")} onBack={() => goBack()} />
      <LegalDocument doc="privacy" />
    </Screen>
  );
}

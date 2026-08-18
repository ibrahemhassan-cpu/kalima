import React from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Header, Screen } from "@/components/ui";
import { LegalDocument } from "@/components/LegalText";

export default function Terms() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Screen scroll>
      <Header title={t("profile.terms")} onBack={() => router.back()} />
      <LegalDocument doc="terms" />
    </Screen>
  );
}

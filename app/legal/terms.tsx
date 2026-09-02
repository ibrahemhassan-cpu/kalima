import React from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Header, Screen } from "@/components/ui";
import { LegalDocument } from "@/components/LegalText";
import { useGoBack } from "@/lib/navigation";

export default function Terms() {
  const router = useRouter();
  const goBack = useGoBack();
  const { t } = useTranslation();

  return (
    <Screen scroll>
      <Header title={t("profile.terms")} onBack={() => goBack()} />
      <LegalDocument doc="terms" />
    </Screen>
  );
}

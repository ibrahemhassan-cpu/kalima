import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";

import { Button, Header, Input, Screen, Surface, Text } from "@/components/ui";
import { FormError } from "@/components/auth/AuthForm";
import { useTheme } from "@/theme/ThemeProvider";
import { supabase, SUPABASE_URL } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import { useSignOut } from "@/features/auth/actions";
import { useGoBack } from "@/lib/navigation";

export default function AccountSettings() {
  const { colors, spacing, radius } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const goBack = useGoBack();
  const { user, session } = useAuth();
  const signOut = useSignOut();

  const CONFIRM = t("settings.deleteConfirmWord");

  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function exportData() {
    setExporting(true);
    setStatus(null);
    setError(null);
    try {
      const [profile, words, reviews, stats, badges] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).single(),
        supabase.from("user_words").select("*"),
        supabase.from("reviews").select("*"),
        supabase.from("user_stats").select("*").eq("user_id", user!.id).single(),
        supabase.from("user_achievements").select("*"),
      ]);

      const payload = {
        exported_at: new Date().toISOString(),
        profile: profile.data,
        words: words.data,
        reviews: reviews.data,
        stats: stats.data,
        achievements: badges.data,
      };

      // expo-file-system SDK 54+ API: File / Paths instead of documentDirectory
      const file = new File(Paths.document, "kalima-data.json");
      if (file.exists) file.delete();
      file.create();
      file.write(JSON.stringify(payload, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: "application/json" });
      } else {
        setStatus(file.uri);
      }
    } catch {
      setError(t("settings.exportFailed"));
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    setError(null);
    if (confirm.trim().toUpperCase() !== CONFIRM.toUpperCase()) {
      setError(t("settings.deleteMismatch"));
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session!.access_token}`,
          "Content-Type": "application/json",
        },
        // the function accepts either language's confirmation word
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      if (!res.ok) throw new Error("failed");

      signOut.mutate();
    } catch {
      setError(t("settings.deleteFailed"));
    } finally {
      setBusy(false);
    }
  }

  const armed = confirm.trim().toUpperCase() === CONFIRM.toUpperCase();

  return (
    <Screen scroll>
      <Header title={t("profile.account")} onBack={() => goBack()} />

      <Surface tone="glass" radiusKey="xl">
        <View style={{ gap: spacing.md }}>
          <Text variant="heading">{t("settings.exportData")}</Text>
          <Text variant="caption" tone="muted">
            {t("settings.exportHint")}
          </Text>
          <Button
            title={t("settings.exportPrepare")}
            variant="secondary"
            icon="download-outline"
            loading={exporting}
            onPress={exportData}
          />
        </View>
      </Surface>

      <Surface tone="glass" radiusKey="xl">
        <View style={{ gap: spacing.md }}>
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
          >
            <Ionicons name="warning" size={20} color={colors.danger} />
            <Text variant="heading" tone="danger">
              {t("settings.deleteHeading")}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.dangerSoft,
              padding: spacing.md,
              borderRadius: radius.md,
              gap: spacing.xs,
            }}
          >
            <Text variant="caption" tone="danger">
              {t("settings.deleteWarn1")}
            </Text>
            <Text variant="caption" tone="danger">
              {t("settings.deleteWarn2")}
            </Text>
          </View>

          <Text variant="caption" tone="muted">
            {t("settings.deleteExportFirst")}
          </Text>

          <Input
            label={t("settings.deleteConfirmLabel")}
            value={confirm}
            onChangeText={setConfirm}
            placeholder={CONFIRM}
            autoCorrect={false}
            autoCapitalize="characters"
          />

          <FormError message={error} />

          <Button
            title={t("settings.deleteButton")}
            variant="danger"
            size="lg"
            fullWidth
            loading={busy}
            disabled={!armed}
            onPress={deleteAccount}
          />
        </View>
      </Surface>

      {status ? (
        <Text variant="caption" tone="muted" center ltr>
          {status}
        </Text>
      ) : null}
    </Screen>
  );
}

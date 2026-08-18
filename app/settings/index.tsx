import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Button,
  Header,
  Input,
  ListGroup,
  ListRow,
  Screen,
  Text,
} from "@/components/ui";
import { Sheet, type SheetRef } from "@/components/ui/Sheet";
import { useTheme } from "@/theme/ThemeProvider";
import { useSettings } from "@/store/settings";
import { useProfile, useUpdateProfile } from "@/api/profile";
import { useAuth } from "@/features/auth/AuthProvider";
import { formatHour } from "@/features/onboarding/store";
import { requestPermission, syncReminders } from "@/features/notifications";
import { parseReminderTimes } from "@/features/notifications/useReminders";
import {
  biometricAvailable,
  clearQuickLogin,
  enableQuickLogin,
} from "@/features/auth/biometric";

export default function Settings() {
  const { spacing } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const s = useSettings();
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const update = useUpdateProfile();

  const reminderTimes = parseReminderTimes(
    profile?.reminder_times,
    profile?.reminder_time,
  );
  const reminderLabel = reminderTimes
    .map((r) => formatHour(r.hour, i18n.language))
    .join(" · ");
  const level = profile?.cefr_level ?? "A2";

  const quickSheet = React.useRef<SheetRef>(null);
  const [password, setPassword] = React.useState("");
  const [pwError, setPwError] = React.useState<string | null>(null);
  const [pwBusy, setPwBusy] = React.useState(false);

  async function confirmQuickLogin() {
    const email = user?.email;
    if (!email) return;
    setPwBusy(true);
    setPwError(null);
    try {
      const res = await enableQuickLogin(
        { email, password },
        t("auth.quickPrompt_fingerprint"),
      );
      if (res.ok) {
        quickSheet.current?.close();
        setPassword("");
        return;
      }
      setPwError(
        t(res.reason === "password" ? "errors.wrongCredentials" : "auth.quickFailed"),
      );
    } finally {
      setPwBusy(false);
    }
  }

  // hidden entirely on a device with no enrolled fingerprint or face
  const [canQuick, setCanQuick] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    void biometricAvailable().then((ok) => {
      if (alive) setCanQuick(ok);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Screen scroll>
      <Header title={t("settings.title")} onBack={() => router.back()} />

      <ListGroup title={t("settings.appearance")}>
        <ListRow
          icon="contrast-outline"
          title={t("settings.theme")}
          value={t(
            s.theme === "light"
              ? "settings.themeLight"
              : s.theme === "dark"
                ? "settings.themeDark"
                : "settings.themeSystem",
          )}
          onPress={() => router.push("/settings/theme")}
        />
        <ListRow
          icon="text-outline"
          title={t("settings.fontSize")}
          value={t(`settings.font${s.fontScale[0]!.toUpperCase()}${s.fontScale[1]}`)}
          onPress={() => router.push("/settings/font")}
        />
        <ListRow
          icon="accessibility-outline"
          title={t("settings.simpleMode")}
          subtitle={t("settings.simpleModeHint")}
          toggle={{ value: s.simpleMode, onChange: s.setSimpleMode }}
          last
        />
      </ListGroup>

      <ListGroup title={t("settings.learning")}>
        <ListRow
          icon="flag-outline"
          title={t("settings.dailyGoal")}
          value={String(profile?.daily_goal ?? 10)}
          onPress={() => router.push("/settings/goal")}
        />
        <ListRow
          icon="school-outline"
          title={t("settings.myLevel")}
          value={t(`onboarding.level${level}`)}
          onPress={() => router.push("/settings/level")}
        />
        <ListRow
          icon="volume-high-outline"
          title={t("settings.autoplayAudio")}
          toggle={{ value: s.autoplayAudio, onChange: s.setAutoplayAudio }}
          last
        />
      </ListGroup>

      <ListGroup title={t("settings.notifications")}>
        <ListRow
          icon="notifications-outline"
          title={t("settings.dailyReminder")}
          toggle={{
            value: profile?.reminder_enabled ?? true,
            onChange: async (v) => {
              if (v && !(await requestPermission())) return;
              update.mutate({ reminder_enabled: v });
              await syncReminders({
                enabled: v,
                times: reminderTimes,
                streak: 0,
                goalMet: false,
              });
            },
          }}
        />
        <ListRow
          icon="time-outline"
          title={t("settings.reminderTime")}
          value={reminderLabel}
          onPress={() => router.push("/settings/reminder")}
        />
        {/* home-screen widget, plus the optional word notifications */}
        <ListRow
          icon="albums-outline"
          title={t("card.settingsTitle")}
          value={
            s.overlayEnabled
              ? t("overlay.minutes", { count: s.overlayInterval })
              : t("onboarding.turnOff")
          }
          onPress={() => router.push("/settings/word-card")}
          last
        />
      </ListGroup>

      <ListGroup title={t("profile.account")}>
        {canQuick ? (
          <ListRow
            icon="finger-print-outline"
            title={t("settings.quickLogin")}
            subtitle={t("settings.quickLoginHint")}
            toggle={{
              value: s.quickLogin,
              onChange: async (v) => {
                if (!v) {
                  await clearQuickLogin();
                  return;
                }
                // Turning it on needs the password — it's what gets stored, and
                // asking for it here doubles as proof it's really you.
                setPwError(null);
                setPassword("");
                quickSheet.current?.open();
              },
            }}
          />
        ) : null}
        <ListRow
          icon="person-outline"
          title={t("profile.editProfile")}
          onPress={() => router.push("/settings/profile")}
        />
        <ListRow
          icon="download-outline"
          title={t("settings.exportData")}
          subtitle={t("settings.exportHint")}
          onPress={() => router.push("/settings/account")}
        />
        <ListRow
          icon="trash-outline"
          title={t("settings.deleteAccount")}
          danger
          onPress={() => router.push("/settings/account")}
          last
        />
      </ListGroup>

      <View style={{ height: spacing.lg }} />
      <Text variant="caption" tone="faint" center>
        {t("app.version", { v: "0.1.0" })}
      </Text>

      <Sheet ref={quickSheet} title={t("settings.quickLogin")}>
        <View style={{ gap: spacing.lg }}>
          <Text variant="body" tone="muted">
            {t("settings.quickLoginConfirm")}
          </Text>

          <Input
            label={t("auth.password")}
            english
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            error={pwError ?? undefined}
            returnKeyType="go"
            onSubmitEditing={confirmQuickLogin}
          />

          <Button
            title={t("common.confirm")}
            size="lg"
            fullWidth
            icon="finger-print-outline"
            disabled={password.length < 8}
            loading={pwBusy}
            onPress={confirmQuickLogin}
          />
        </View>
      </Sheet>
    </Screen>
  );
}

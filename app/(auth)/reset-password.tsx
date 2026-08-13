import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Animated, { ZoomIn } from "react-native-reanimated";

import { Button, Header, Input, Screen, Surface, Text } from "@/components/ui";
import { FormError, RevealToggle, StrengthMeter } from "@/components/auth/AuthForm";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/features/auth/AuthProvider";
import { useUpdatePassword } from "@/features/auth/actions";
import { authErrorKey, validatePassword } from "@/features/auth/errors";

/**
 * Reached by tapping the reset link in the email. The deep-link hook has
 * already exchanged the token for a session by the time we render.
 */
export default function ResetPassword() {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ expired?: string }>();
  const update = useUpdatePassword();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const expired = params.expired === "1" || !session;

  async function submit() {
    const e = validatePassword(password, t);
    setFieldError(e);
    setFormError(null);
    if (e) return;
    if (password !== confirm) {
      setFormError(t("auth.passwordsDiffer"));
      return;
    }

    try {
      await update.mutateAsync(password);
      setDone(true);
    } catch (err) {
      setFormError(t(authErrorKey((err as Error).message)));
    }
  }

  if (expired && !done) {
    return (
      <Screen scroll>
        <Header onBack={() => router.replace("/(auth)/welcome")} />
        <View
          style={{ alignItems: "center", gap: spacing.lg, paddingTop: spacing.xxl }}
        >
          <View
            style={{
              width: 92,
              height: 92,
              borderRadius: 46,
              backgroundColor: colors.dangerSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="time-outline" size={44} color={colors.danger} />
          </View>
          <Text variant="title" center>
            {t("auth.linkExpired")}
          </Text>
          <Text variant="body" tone="muted" center>
            {t("auth.linkExpiredBody")}
          </Text>
          <Button
            title={t("auth.forgotTitle")}
            size="lg"
            fullWidth
            onPress={() => router.replace("/(auth)/forgot-password")}
          />
        </View>
      </Screen>
    );
  }

  if (done) {
    return (
      <Screen scroll>
        <View
          style={{ alignItems: "center", gap: spacing.lg, paddingTop: spacing.xxxl }}
        >
          <Animated.View entering={ZoomIn.duration(420).springify().damping(13)}>
            <View
              style={{
                width: 92,
                height: 92,
                borderRadius: 46,
                backgroundColor: colors.successSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="checkmark" size={46} color={colors.success} />
            </View>
          </Animated.View>
          <Text variant="title" center>
            {t("auth.resetDone")}
          </Text>
          <Text variant="body" tone="muted" center>
            {t("auth.resetDoneBody")}
          </Text>
          <Button
            title={t("review.keepGoing")}
            size="lg"
            fullWidth
            onPress={() => router.replace("/(tabs)")}
          />
        </View>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen scroll>
        <Header title={t("auth.resetTitle")} subtitle={t("auth.resetSubtitle")} />

        <Surface tone="glass" radiusKey="xl" elevation="md">
          <View style={{ gap: spacing.lg }}>
            <View>
              <Input
                label={t("auth.newPassword")}
                english
                value={password}
                onChangeText={setPassword}
                error={fieldError ?? undefined}
                secureTextEntry={!show}
                autoComplete="new-password"
                textContentType="newPassword"
              />
              <StrengthMeter value={password} />
              <View style={{ marginTop: spacing.sm, alignSelf: "flex-start" }}>
                <RevealToggle shown={show} onToggle={() => setShow((v) => !v)} />
              </View>
            </View>

            <Input
              label={t("auth.confirmPassword")}
              english
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!show}
              returnKeyType="go"
              onSubmitEditing={submit}
            />

            <FormError message={formError} />

            <Button
              title={t("auth.resetCta")}
              size="lg"
              fullWidth
              loading={update.isPending}
              onPress={submit}
            />
          </View>
        </Surface>
      </Screen>
    </KeyboardAvoidingView>
  );
}

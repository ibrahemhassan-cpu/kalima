import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Animated, { ZoomIn } from "react-native-reanimated";

import { Button, Header, Input, Screen, Surface, Text, Touchable } from "@/components/ui";
import { FormError, RevealToggle, StrengthMeter } from "@/components/auth/AuthForm";
import { useTheme } from "@/theme/ThemeProvider";
import { useResendConfirmation, useSignUp } from "@/features/auth/actions";
import {
  authErrorKey,
  validateEmail,
  validateName,
  validatePassword,
} from "@/features/auth/errors";

export default function SignUp() {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const signUp = useSignUp();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit() {
    const next = {
      name: validateName(name, t) ?? undefined,
      email: validateEmail(email, t) ?? undefined,
      password: validatePassword(password, t) ?? undefined,
    };
    setErrors(next);
    setFormError(null);
    if (next.name || next.email || next.password) return;

    try {
      const res = await signUp.mutateAsync({ name, email, password });
      if (res.needsConfirmation) setSent(true);
      // otherwise RouteGate takes over
    } catch (e) {
      setFormError(t(authErrorKey((e as Error).message)));
    }
  }

  if (sent) return <ConfirmSent email={email.trim()} />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen scroll>
        <Header title={t("auth.signUp")} onBack={() => router.back()} />

        <Surface tone="glass" radiusKey="xl" elevation="md">
          <View style={{ gap: spacing.lg }}>
            <Input
              label={t("auth.name")}
              value={name}
              onChangeText={setName}
              error={errors.name}
              autoComplete="name"
              textContentType="name"
              placeholder={t("auth.namePlaceholder")}
              returnKeyType="next"
            />

            <Input
              label={t("auth.email")}
              english
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              placeholder="you@example.com"
              returnKeyType="next"
            />

            <View>
              <Input
                label={t("auth.password")}
                english
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                hint={errors.password ? undefined : t("auth.passwordHint")}
                secureTextEntry={!show}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={submit}
              />
              <StrengthMeter value={password} />
              <View style={{ marginTop: spacing.sm, alignSelf: "flex-start" }}>
                <RevealToggle shown={show} onToggle={() => setShow((v) => !v)} />
              </View>
            </View>

            <FormError message={formError} />

            <Button
              title={t("auth.signUp")}
              size="lg"
              fullWidth
              loading={signUp.isPending}
              onPress={submit}
            />
          </View>
        </Surface>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: spacing.xs,
            alignItems: "center",
          }}
        >
          <Text variant="body" tone="muted">
            {t("auth.haveAccount")}
          </Text>
          <Touchable
            haptic="select"
            scaleTo={0.94}
            onPress={() => router.replace("/(auth)/sign-in")}
          >
            <Text variant="bodyStrong" tone="brand">
              {t("auth.signInInstead")}
            </Text>
          </Touchable>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

/** Post-signup state with a throttled resend. */
function ConfirmSent({ email }: { email: string }) {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const resend = useResendConfirmation();

  const [cooldown, setCooldown] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function doResend() {
    try {
      await resend.mutateAsync(email);
      setNote(t("auth.resent"));
      setCooldown(45);
    } catch (e) {
      setNote(t(authErrorKey((e as Error).message)));
    }
  }

  return (
    <Screen scroll>
      <Header />
      <View style={{ alignItems: "center", gap: spacing.lg, paddingTop: spacing.xl }}>
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
            <Ionicons name="mail-open-outline" size={44} color={colors.success} />
          </View>
        </Animated.View>

        <Text variant="title" center>
          {t("auth.checkEmailTitle")}
        </Text>
        <Text variant="body" tone="muted" center>
          {t("auth.checkEmailBody", { email })}
        </Text>
        <Text variant="caption" tone="faint" center>
          {t("auth.checkSpam")}
        </Text>

        {note ? (
          <Text variant="caption" tone="brand" center>
            {note}
          </Text>
        ) : null}

        <View style={{ gap: spacing.md, alignSelf: "stretch" }}>
          <Button
            title={t("auth.signIn")}
            size="lg"
            fullWidth
            onPress={() => router.replace("/(auth)/sign-in")}
          />
          <Button
            title={
              cooldown > 0
                ? t("auth.resendWait", { count: cooldown })
                : t("auth.resend")
            }
            variant="secondary"
            size="lg"
            fullWidth
            disabled={cooldown > 0}
            loading={resend.isPending}
            onPress={doResend}
          />
        </View>
      </View>
    </Screen>
  );
}

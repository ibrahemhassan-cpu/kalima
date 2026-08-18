import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Ionicons } from "@expo/vector-icons";

import { Button, Header, Input, Screen, Surface, Text, Touchable } from "@/components/ui";
import { FormError, RevealToggle } from "@/components/auth/AuthForm";
import { useTheme } from "@/theme/ThemeProvider";
import { useSignIn } from "@/features/auth/actions";
import {
  authErrorKey,
  validateEmail,
  validatePassword,
} from "@/features/auth/errors";
import {
  biometricAvailable,
  biometricLabel,
  clearQuickLogin,
  hasStoredCredentials,
  quickSignIn,
} from "@/features/auth/biometric";

export default function SignIn() {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const signIn = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Offered only when the device can scan *and* something was stored here by a
  // previous sign-in — otherwise the button would promise what it can't deliver.
  const [canQuick, setCanQuick] = useState(false);
  const [kind, setKind] = useState<"face" | "fingerprint">("fingerprint");
  const [quickBusy, setQuickBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [ok, stored, label] = await Promise.all([
        biometricAvailable(),
        hasStoredCredentials(),
        biometricLabel(),
      ]);
      if (!alive) return;
      setCanQuick(ok && stored);
      setKind(label);
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function quick() {
    setFormError(null);
    setQuickBusy(true);
    try {
      const res = await quickSignIn(t(`auth.quickPrompt_${kind}`));
      if (res.ok) return; // RouteGate takes it from here

      // A cancelled scan says nothing and leaves the button ready to tap again.
      if (res.reason === "invalid" || res.reason === "missing") {
        // the stored password no longer works — stop offering it
        await clearQuickLogin();
        setCanQuick(false);
        setFormError(t("auth.quickExpired"));
      }
    } finally {
      setQuickBusy(false);
    }
  }

  async function submit() {
    const next = {
      email: validateEmail(email, t) ?? undefined,
      password: validatePassword(password, t) ?? undefined,
    };
    setErrors(next);
    setFormError(null);
    if (next.email || next.password) return;

    try {
      await signIn.mutateAsync({ email, password });
      // RouteGate handles navigation once the session lands.
    } catch (e) {
      setFormError(t(authErrorKey((e as Error).message)));
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen scroll>
        <Header
          title={t("auth.signIn")}
          subtitle={t("auth.signInSubtitle")}
          onBack={() => router.back()}
        />

        {canQuick ? (
          <View style={{ gap: spacing.md, alignItems: "center" }}>
            {/*
              A big round target rather than only a bar: if the system prompt
              never appears, or the user dismisses it by accident, this stays on
              screen and re-opens it on every tap.
            */}
            <Touchable
              onPress={quick}
              disabled={quickBusy}
              haptic="medium"
              scaleTo={0.92}
              accessibilityRole="button"
              accessibilityLabel={t(`auth.quickSignIn_${kind}`)}
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.brandSoft,
                borderWidth: 2,
                borderColor: colors.brandBorder,
              }}
            >
              {quickBusy ? (
                <ActivityIndicator color={colors.brand} />
              ) : (
                <Ionicons
                  name={kind === "face" ? "scan-outline" : "finger-print"}
                  size={42}
                  color={colors.brand}
                />
              )}
            </Touchable>

            <Button
              title={t(`auth.quickSignIn_${kind}`)}
              size="lg"
              fullWidth
              variant="secondary"
              icon={kind === "face" ? "scan-outline" : "finger-print-outline"}
              loading={quickBusy}
              onPress={quick}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.sm,
              }}
            >
              <Ionicons name="ellipse" size={4} color={colors.textFaint} />
              <Text variant="caption" tone="faint">
                {t("auth.orPassword")}
              </Text>
              <Ionicons name="ellipse" size={4} color={colors.textFaint} />
            </View>
          </View>
        ) : null}

        <Surface tone="glass" radiusKey="xl" elevation="md">
          <View style={{ gap: spacing.lg }}>
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
                secureTextEntry={!show}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={submit}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: spacing.sm,
                }}
              >
                <RevealToggle shown={show} onToggle={() => setShow((v) => !v)} />
                <Touchable
                  haptic="select"
                  scaleTo={0.94}
                  onPress={() => router.push("/(auth)/forgot-password")}
                >
                  <Text variant="caption" tone="brand">
                    {t("auth.forgot")}
                  </Text>
                </Touchable>
              </View>
            </View>

            <FormError message={formError} />

            <Button
              title={t("auth.signIn")}
              size="lg"
              fullWidth
              loading={signIn.isPending}
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
            {t("auth.noAccount")}
          </Text>
          <Touchable
            haptic="select"
            scaleTo={0.94}
            onPress={() => router.replace("/(auth)/sign-up")}
          >
            <Text variant="bodyStrong" tone="brand">
              {t("auth.createOne")}
            </Text>
          </Touchable>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

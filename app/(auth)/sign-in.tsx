import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Button, Header, Input, Screen, Surface, Text, Touchable } from "@/components/ui";
import { FormError, RevealToggle } from "@/components/auth/AuthForm";
import { useTheme } from "@/theme/ThemeProvider";
import { useSignIn } from "@/features/auth/actions";
import {
  authErrorKey,
  validateEmail,
  validatePassword,
} from "@/features/auth/errors";

export default function SignIn() {
  const { spacing } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const signIn = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

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

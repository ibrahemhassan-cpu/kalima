import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Animated, { ZoomIn } from "react-native-reanimated";

import { Button, Header, Input, Screen, Surface, Text } from "@/components/ui";
import { FormError } from "@/components/auth/AuthForm";
import { useTheme } from "@/theme/ThemeProvider";
import { useRequestPasswordReset } from "@/features/auth/actions";
import { authErrorKey, validateEmail } from "@/features/auth/errors";
import { useGoBack } from "@/lib/navigation";

export default function ForgotPassword() {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const goBack = useGoBack();
  const request = useRequestPasswordReset();

  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit() {
    const e = validateEmail(email, t);
    setFieldError(e);
    setFormError(null);
    if (e) return;

    try {
      await request.mutateAsync(email);
      setSent(true);
    } catch (err) {
      setFormError(t(authErrorKey((err as Error).message)));
    }
  }

  if (sent) {
    return (
      <Screen scroll>
        <Header onBack={() => goBack()} />
        <View
          style={{ alignItems: "center", gap: spacing.lg, paddingTop: spacing.xxl }}
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
              <Ionicons name="send-outline" size={42} color={colors.success} />
            </View>
          </Animated.View>

          <Text variant="title" center>
            {t("auth.linkSentTitle")}
          </Text>
          <Text variant="body" tone="muted" center>
            {t("auth.linkSentBody")}
          </Text>

          <Button
            title={t("auth.backToSignIn")}
            size="lg"
            fullWidth
            onPress={() => router.replace("/(auth)/sign-in")}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Header
        title={t("auth.forgotTitle")}
        subtitle={t("auth.forgotSubtitle")}
        onBack={() => goBack()}
      />

      <Surface tone="glass" radiusKey="xl" elevation="md">
        <View style={{ gap: spacing.lg }}>
          <Input
            label={t("auth.email")}
            english
            value={email}
            onChangeText={setEmail}
            error={fieldError ?? undefined}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            placeholder="you@example.com"
            returnKeyType="go"
            onSubmitEditing={submit}
          />
          <FormError message={formError} />
          <Button
            title={t("auth.sendLink")}
            size="lg"
            fullWidth
            loading={request.isPending}
            onPress={submit}
          />
        </View>
      </Surface>
    </Screen>
  );
}

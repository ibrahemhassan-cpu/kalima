import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Input, Screen, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { supabase } from "@/lib/supabase";
import { authErrorAr, validateEmail, validatePassword } from "@/features/auth/errors";
import { AuthHeader } from "@/features/auth/AuthHeader";

export default function SignIn() {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const next = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(next);
    setFormError(null);
    if (next.email || next.password) return;

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);

    if (error) setFormError(authErrorAr(error.message));
    // النجاح: حارس التوجيه في _layout.tsx هينقلك لوحده
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen scroll>
        <AuthHeader
          title="تسجيل الدخول"
          subtitle="أهلًا بيك تاني"
          onBack={() => router.back()}
        />

        <Card>
          <View style={{ gap: spacing.lg }}>
            <Input
              label="الإيميل"
              english
              value={email}
              onChangeText={setEmail}
              error={errors.email ?? undefined}
              keyboardType="email-address"
              autoComplete="email"
              placeholder="you@example.com"
              returnKeyType="next"
            />

            <View>
              <Input
                label="كلمة المرور"
                english
                value={password}
                onChangeText={setPassword}
                error={errors.password ?? undefined}
                secureTextEntry={!show}
                autoComplete="current-password"
                returnKeyType="done"
                onSubmitEditing={submit}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: spacing.xs,
                }}
              >
                <Text
                  variant="caption"
                  tone="brand"
                  accessibilityRole="button"
                  onPress={() => setShow((v) => !v)}
                >
                  {show ? "إخفاء" : "إظهار"}
                </Text>
                <Text
                  variant="caption"
                  tone="brand"
                  accessibilityRole="button"
                  onPress={() => router.push("/(auth)/forgot-password")}
                >
                  نسيت كلمة المرور؟
                </Text>
              </View>
            </View>

            {formError ? (
              <View
                style={{
                  flexDirection: "row",
                  gap: spacing.sm,
                  alignItems: "center",
                  backgroundColor: colors.dangerSoft,
                  padding: spacing.md,
                  borderRadius: 12,
                }}
              >
                <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
                <Text variant="caption" tone="danger" style={{ flex: 1 }}>
                  {formError}
                </Text>
              </View>
            ) : null}

            <Button
              title="دخول"
              size="lg"
              fullWidth
              loading={busy}
              onPress={submit}
            />
          </View>
        </Card>

        <View
          style={{ flexDirection: "row", justifyContent: "center", gap: spacing.xs }}
        >
          <Text variant="body" tone="muted">
            معندكش حساب؟
          </Text>
          <Text
            variant="bodyStrong"
            tone="brand"
            accessibilityRole="button"
            onPress={() => router.replace("/(auth)/sign-up")}
          >
            اعمل واحد
          </Text>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

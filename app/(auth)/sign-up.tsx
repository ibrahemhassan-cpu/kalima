import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Input, Screen, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { supabase } from "@/lib/supabase";
import {
  authErrorAr,
  validateEmail,
  validateName,
  validatePassword,
} from "@/features/auth/errors";
import { AuthHeader } from "@/features/auth/AuthHeader";

export default function SignUp() {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    const next = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(next);
    setFormError(null);
    if (next.name || next.email || next.password) return;

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    });
    setBusy(false);

    if (error) {
      setFormError(authErrorAr(error.message));
      return;
    }

    // لو تفعيل الإيميل مفعّل، مفيش جلسة لحد ما يضغط الرابط
    if (!data.session) setSent(true);
  }

  if (sent) {
    return (
      <Screen scroll>
        <AuthHeader title="" onBack={() => router.back()} />
        <View style={{ alignItems: "center", gap: spacing.lg, paddingTop: spacing.xxl }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: colors.successSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="mail-outline" size={44} color={colors.success} />
          </View>
          <Text variant="title" center>
            بصّ في بريدك
          </Text>
          <Text variant="body" tone="muted" center>
            بعتنا رابط تفعيل على {email.trim()}. اضغط عليه وارجع سجّل دخول.
          </Text>
          <Text variant="caption" tone="faint" center>
            ما وصلكش؟ شوف مجلد الـ spam.
          </Text>
          <Button
            title="تسجيل الدخول"
            size="lg"
            fullWidth
            onPress={() => router.replace("/(auth)/sign-in")}
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
        <AuthHeader title="إنشاء حساب" onBack={() => router.back()} />

        <Card>
          <View style={{ gap: spacing.lg }}>
            <Input
              label="اسمك"
              value={name}
              onChangeText={setName}
              error={errors.name ?? undefined}
              autoComplete="name"
              placeholder="أحمد"
              returnKeyType="next"
            />

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
                hint="8 حروف على الأقل"
                secureTextEntry={!show}
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={submit}
              />
              <Text
                variant="caption"
                tone="brand"
                onPress={() => setShow((v) => !v)}
                accessibilityRole="button"
                style={{ marginTop: spacing.xs, alignSelf: "flex-start" }}
              >
                {show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              </Text>
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
              title="إنشاء الحساب"
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
            عندك حساب؟
          </Text>
          <Text
            variant="bodyStrong"
            tone="brand"
            accessibilityRole="button"
            onPress={() => router.replace("/(auth)/sign-in")}
          >
            سجّل دخول
          </Text>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

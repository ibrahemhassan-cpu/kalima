import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Input, Screen, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { supabase } from "@/lib/supabase";
import { authErrorAr, validateEmail } from "@/features/auth/errors";
import { AuthHeader } from "@/features/auth/AuthHeader";

export default function ForgotPassword() {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    const e = validateEmail(email);
    setError(e);
    if (e) return;

    setBusy(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: "kalima://reset-password",
    });
    setBusy(false);

    // بنعرض نفس الرسالة سواء الإيميل موجود أو لأ —
    // عشان محدش يستخدم الشاشة دي عشان يعرف مين مسجّل عندنا
    if (err && !err.message.toLowerCase().includes("not found")) {
      setError(authErrorAr(err.message));
      return;
    }
    setSent(true);
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
            بعتنا الرابط
          </Text>
          <Text variant="body" tone="muted" center>
            لو الإيميل ده مسجّل عندنا، هيوصله رابط لتغيير كلمة المرور.
          </Text>
          <Button
            title="رجوع لتسجيل الدخول"
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
      <AuthHeader
        title="نسيت كلمة المرور"
        subtitle="اكتب إيميلك وهنبعتلك رابط تغيّرها منه"
        onBack={() => router.back()}
      />

      <Card>
        <View style={{ gap: spacing.lg }}>
          <Input
            label="الإيميل"
            english
            value={email}
            onChangeText={setEmail}
            error={error ?? undefined}
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <Button
            title="ابعت الرابط"
            size="lg"
            fullWidth
            loading={busy}
            onPress={submit}
          />
        </View>
      </Card>
    </Screen>
  );
}

import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Input, Screen, Text } from "@/components/ui";
import { AuthHeader } from "@/features/auth/AuthHeader";
import { useTheme } from "@/theme/ThemeProvider";
import { supabase, SUPABASE_URL } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";

export default function AccountSettings() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { user, session } = useAuth();

  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // ── تصدير البيانات (GDPR) ────────────────────────────────
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

      const path = `${FileSystem.documentDirectory}kalima-data.json`;
      await FileSystem.writeAsStringAsync(path, JSON.stringify(payload, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: "application/json" });
      } else {
        setStatus(`اتحفظ الملف: ${path}`);
      }
    } catch {
      setError("ما قدرناش نجهّز الملف. جرّب تاني");
    } finally {
      setExporting(false);
    }
  }

  // ── حذف الحساب (متطلب إلزامي من Apple) ───────────────────
  async function deleteAccount() {
    setError(null);
    if (confirm.trim() !== "حذف") {
      setError("اكتب كلمة «حذف» بالظبط للتأكيد");
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
        body: JSON.stringify({ confirm: "حذف" }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message_ar ?? "فشل الحذف");
      }

      await supabase.auth.signOut();
      // حارس التوجيه هيرجّعك لشاشة الترحيب لوحده
    } catch (e) {
      setError(
        e instanceof Error && e.message !== "فشل الحذف"
          ? e.message
          : "ما قدرناش نحذف الحساب. لو المشكلة استمرت راسلنا",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll>
      <AuthHeader title="الحساب" onBack={() => router.back()} />

      {/* تصدير */}
      <Card>
        <View style={{ gap: spacing.md }}>
          <Text variant="heading">نزّل بياناتك</Text>
          <Text variant="caption" tone="muted">
            ملف JSON فيه كل كلماتك وسجل مراجعاتك وإحصائياتك.
          </Text>
          <Button
            title="جهّز الملف"
            variant="secondary"
            icon="download-outline"
            loading={exporting}
            onPress={exportData}
          />
        </View>
      </Card>

      {/* حذف */}
      <Card>
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Ionicons name="warning-outline" size={22} color={colors.danger} />
            <Text variant="heading" tone="danger">
              حذف الحساب
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.dangerSoft,
              padding: spacing.md,
              borderRadius: 12,
              gap: spacing.xs,
            }}
          >
            <Text variant="caption" tone="danger">
              هيتمسح نهائيًا: حسابك، كل كلماتك، تقدّمك، نقاطك، والستريك.
            </Text>
            <Text variant="caption" tone="danger">
              مفيش رجوع، ومفيش نسخة احتياطية.
            </Text>
          </View>

          <Text variant="caption" tone="muted">
            لو عايز تحتفظ ببياناتك، نزّلها الأول من فوق.
          </Text>

          <Input
            label="اكتب كلمة «حذف» للتأكيد"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="حذف"
            autoCorrect={false}
          />

          {error ? (
            <Text variant="caption" tone="danger">
              {error}
            </Text>
          ) : null}

          <Button
            title="احذف حسابي نهائيًا"
            variant="danger"
            size="lg"
            fullWidth
            loading={busy}
            disabled={confirm.trim() !== "حذف"}
            onPress={deleteAccount}
          />
        </View>
      </Card>

      {status ? (
        <Text variant="caption" tone="muted" center>
          {status}
        </Text>
      ) : null}
    </Screen>
  );
}

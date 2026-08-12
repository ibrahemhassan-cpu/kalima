import React from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Card, ListGroup, ListRow, Screen, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { useProfile } from "@/api/profile";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import type { HomeSummary } from "@/lib/database.types";

export default function ProfileTab() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const { data: summary } = useQuery({
    queryKey: ["home-summary"],
    queryFn: async (): Promise<HomeSummary> => {
      const { data, error } = await supabase.rpc("get_home_summary");
      if (error) throw error;
      return data as unknown as HomeSummary;
    },
  });

  function confirmSignOut() {
    Alert.alert("تسجيل الخروج", "متأكد إنك عايز تخرج؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "خروج",
        style: "destructive",
        onPress: () => void supabase.auth.signOut(),
      },
    ]);
  }

  const name = profile?.display_name ?? "متعلّم";

  return (
    <Screen scroll>
      {/* البطاقة الشخصية */}
      <Card>
        <View style={{ alignItems: "center", gap: spacing.md }}>
          <Avatar uri={profile?.avatar_url} name={name} size={88} />
          <View style={{ alignItems: "center", gap: 2 }}>
            <Text variant="title">{name}</Text>
            <Text variant="caption" tone="faint" ltr>
              {user?.email}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              backgroundColor: colors.brandSoft,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: 999,
            }}
          >
            <Text variant="label" tone="brand">
              المستوى {summary?.level ?? 1}
            </Text>
            <Text variant="caption" tone="brand">
              · {summary?.total_xp ?? 0} نقطة
            </Text>
          </View>
        </View>
      </Card>

      {/* إحصائيات */}
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <MiniStat label="كلمة" value={summary?.total_words ?? 0} />
        <MiniStat label="متقنة" value={summary?.mastered_words ?? 0} />
        <MiniStat label="أطول ستريك" value={summary?.longest_streak ?? 0} />
      </View>

      <ListGroup title="الحساب">
        <ListRow
          icon="person-outline"
          title="تعديل البيانات"
          subtitle="الاسم والصورة"
          onPress={() => router.push("/settings/profile")}
        />
        <ListRow
          icon="settings-outline"
          title="الإعدادات"
          onPress={() => router.push("/settings")}
          last
        />
      </ListGroup>

      <ListGroup title="عن التطبيق">
        <ListRow
          icon="shield-checkmark-outline"
          title="سياسة الخصوصية"
          onPress={() => router.push("/legal/privacy")}
        />
        <ListRow
          icon="document-text-outline"
          title="شروط الاستخدام"
          onPress={() => router.push("/legal/terms")}
          last
        />
      </ListGroup>

      <ListGroup>
        <ListRow
          icon="log-out-outline"
          title="تسجيل الخروج"
          onPress={confirmSignOut}
          danger
          last
        />
      </ListGroup>

      <Text variant="caption" tone="faint" center>
        كلمة · الإصدار 0.1.0
      </Text>
    </Screen>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        gap: 2,
        paddingVertical: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text variant="heading">{value}</Text>
      <Text variant="caption" tone="faint">
        {label}
      </Text>
    </View>
  );
}

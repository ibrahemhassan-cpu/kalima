import React from "react";
import { View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Screen, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

export default function Welcome() {
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();

  const features = [
    {
      icon: "sparkles-outline" as const,
      title: "اكتب الكلمة وبس",
      body: "الترجمة والمعنى والأمثلة والنطق بيجوا لوحدهم",
    },
    {
      icon: "repeat-outline" as const,
      title: "مراجعة في الوقت المظبوط",
      body: "بنفكّرك بالكلمة قبل ما تنساها بالظبط",
    },
    {
      icon: "flame-outline" as const,
      title: "خمس دقايق في اليوم",
      body: "ستريك يومي يخليك مكمّل من غير ما تحس",
    },
  ];

  return (
    <Screen scroll>
      <View style={{ alignItems: "center", gap: spacing.md, paddingTop: spacing.xxl }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: radius.xl,
            backgroundColor: colors.brand,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="bookmark" size={46} color={colors.onBrand} />
        </View>

        <Text variant="display">كلمة</Text>
        <Text variant="body" tone="muted" center>
          احفظ الكلمة مرة واحدة، وما تنساهاش تاني
        </Text>
      </View>

      <View style={{ gap: spacing.lg, paddingVertical: spacing.xl }}>
        {features.map((f) => (
          <View
            key={f.title}
            style={{ flexDirection: "row", gap: spacing.lg, alignItems: "flex-start" }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: radius.md,
                backgroundColor: colors.brandSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={f.icon} size={24} color={colors.brand} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong">{f.title}</Text>
              <Text variant="caption" tone="muted">
                {f.body}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ gap: spacing.md }}>
        <Button
          title="ابدأ دلوقتي"
          size="lg"
          fullWidth
          onPress={() => router.push("/(auth)/sign-up")}
        />
        <Button
          title="عندي حساب"
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => router.push("/(auth)/sign-in")}
        />
      </View>

      <Text variant="caption" tone="faint" center>
        بإنشاء حساب أنت موافق على{" "}
        <Link href="/legal/terms" style={{ color: colors.brand }}>
          شروط الاستخدام
        </Link>{" "}
        و{" "}
        <Link href="/legal/privacy" style={{ color: colors.brand }}>
          سياسة الخصوصية
        </Link>
      </Text>
    </Screen>
  );
}

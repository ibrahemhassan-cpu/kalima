import React from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { Button, Card, Screen, Text } from "@/components/ui";
import { WordCard } from "@/components/word/WordCard";
import { useTheme } from "@/theme/ThemeProvider";
import { useProfile } from "@/api/profile";
import { useMyWords } from "@/api/words";
import { supabase } from "@/lib/supabase";
import type { HomeSummary } from "@/lib/database.types";

export default function Home() {
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();
  const { data: profile } = useProfile();

  const { data: summary } = useQuery({
    queryKey: ["home-summary"],
    queryFn: async (): Promise<HomeSummary> => {
      const { data, error } = await supabase.rpc("get_home_summary");
      if (error) throw error;
      return data as unknown as HomeSummary;
    },
  });

  const { data: recent } = useMyWords({
    filter: "all",
    search: "",
    sort: "recent",
  });

  const goal = summary?.daily_goal ?? profile?.daily_goal ?? 10;
  const done = summary?.today_reviews ?? 0;
  const due = summary?.due_count ?? 0;
  const pct = Math.min(1, goal > 0 ? done / goal : 0);

  return (
    <Screen scroll>
      {/* الترويسة */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ gap: 2, flex: 1 }}>
          <Text variant="caption" tone="muted">
            أهلًا
          </Text>
          <Text variant="title" numberOfLines={1}>
            {profile?.display_name ?? "متعلّم"}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
            backgroundColor: colors.accentSoft,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radius.pill,
          }}
          accessibilityLabel={`ستريك ${summary?.current_streak ?? 0} يوم`}
        >
          <Ionicons name="flame" size={18} color={colors.accent} />
          <Text variant="bodyStrong" style={{ color: colors.warning }}>
            {summary?.current_streak ?? 0}
          </Text>
        </View>
      </View>

      {/* الدعوة الأساسية */}
      <Card tone={due > 0 ? "brand" : "surface"}>
        <View style={{ gap: spacing.md }}>
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
          >
            <Ionicons
              name={due > 0 ? "repeat" : "checkmark-circle"}
              size={28}
              color={due > 0 ? colors.brand : colors.success}
            />
            <View style={{ flex: 1 }}>
              <Text variant="heading">
                {due > 0 ? `${due} كلمة مستنياك` : "خلّصت مراجعة النهاردة"}
              </Text>
              <Text variant="caption" tone="muted">
                {due > 0
                  ? "خمس دقايق وتخلص"
                  : summary?.next_due_at
                    ? "ارجع بكرة، أو أضف كلمة جديدة"
                    : "أضف كلمات عشان نبدأ"}
              </Text>
            </View>
          </View>

          <Button
            title={due > 0 ? "ابدأ المراجعة" : "أضف كلمة جديدة"}
            size="lg"
            fullWidth
            icon={due > 0 ? "play" : "add"}
            onPress={() =>
              due > 0 ? router.push("/(tabs)/review") : router.push("/add-word")
            }
          />
        </View>
      </Card>

      {/* تقدّم اليوم */}
      <Card>
        <View style={{ gap: spacing.md }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text variant="heading">هدف النهاردة</Text>
            <Text variant="bodyStrong" tone={pct >= 1 ? "success" : "muted"}>
              {done} / {goal}
            </Text>
          </View>

          <View
            accessibilityRole="progressbar"
            accessibilityLabel={`أنجزت ${done} من ${goal}`}
            style={{
              height: 12,
              borderRadius: 6,
              backgroundColor: colors.surfaceAlt,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${pct * 100}%`,
                height: "100%",
                backgroundColor: pct >= 1 ? colors.success : colors.brand,
              }}
            />
          </View>

          {pct >= 1 ? (
            <Text variant="caption" tone="success">
              حققت هدفك النهاردة — الستريك في أمان
            </Text>
          ) : null}
        </View>
      </Card>

      {/* إحصائيات */}
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <Stat label="كلماتك" value={summary?.total_words ?? 0} icon="library-outline" />
        <Stat
          label="متقنة"
          value={summary?.mastered_words ?? 0}
          icon="checkmark-circle-outline"
        />
        <Stat label="المستوى" value={summary?.level ?? 1} icon="star-outline" />
      </View>

      {/* آخر الكلمات */}
      {recent && recent.length > 0 ? (
        <View style={{ gap: spacing.md }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text variant="heading">آخر ما أضفت</Text>
            <Text
              variant="label"
              tone="brand"
              accessibilityRole="button"
              onPress={() => router.push("/(tabs)/words")}
            >
              شوف الكل
            </Text>
          </View>

          {recent.slice(0, 3).map((w) => (
            <WordCard
              key={w.user_word_id}
              row={w}
              onPress={() => router.push(`/word/${w.user_word_id}`)}
            />
          ))}
        </View>
      ) : null}

      {/* زر إضافة سريع */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="أضف كلمة جديدة"
        onPress={() => router.push("/add-word")}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          minHeight: 56,
          borderRadius: radius.lg,
          borderWidth: 2,
          borderStyle: "dashed",
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Ionicons name="add-circle-outline" size={22} color={colors.brand} />
        <Text variant="bodyStrong" tone="brand">
          أضف كلمة جديدة
        </Text>
      </Pressable>
    </Screen>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        gap: spacing.xs,
        alignItems: "center",
        paddingVertical: spacing.lg,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
      }}
    >
      <Ionicons name={icon} size={22} color={colors.textMuted} />
      <Text variant="heading">{value}</Text>
      <Text variant="caption" tone="faint">
        {label}
      </Text>
    </View>
  );
}

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { Input, Text } from "@/components/ui";
import { WordCard } from "@/components/word/WordCard";
import { useTheme } from "@/theme/ThemeProvider";
import { useSettings } from "@/store/settings";
import {
  useMyWords,
  type WordFilter,
  type WordSort,
} from "@/api/words";

const FILTERS: { key: WordFilter; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "learning", label: "بتتعلمها" },
  { key: "mastered", label: "متقنة" },
  { key: "hard", label: "صعبة عليك" },
  { key: "favorite", label: "المفضلة" },
];

const SORTS: { key: WordSort; label: string }[] = [
  { key: "recent", label: "الأحدث" },
  { key: "alpha", label: "أبجدي" },
  { key: "hardest", label: "الأصعب" },
];

export default function Words() {
  const { colors, spacing, radius, isDark, minTouch } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const simple = useSettings((s) => s.simpleMode);

  const [filter, setFilter] = useState<WordFilter>("all");
  const [sort, setSort] = useState<WordSort>("recent");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isRefetching, refetch } = useMyWords({
    filter,
    search: debounced,
    sort,
  });

  const total = data?.[0]?.total_count ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* ترويسة ثابتة */}
      <View
        style={{
          paddingTop: insets.top + spacing.lg,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
          gap: spacing.md,
          backgroundColor: colors.bg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text variant="title">كلماتي</Text>
          {total > 0 ? (
            <Text variant="caption" tone="faint">
              {total} كلمة
            </Text>
          ) : null}
        </View>

        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="دوّر على كلمة"
          returnKeyType="search"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {FILTERS.map((f) => {
            const active = f.key === filter;
            return (
              <Chip
                key={f.key}
                label={f.label}
                active={active}
                onPress={() => setFilter(f.key)}
              />
            );
          })}
        </ScrollView>

        {!simple ? (
          <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
            <Ionicons name="swap-vertical-outline" size={16} color={colors.textFaint} />
            {SORTS.map((s) => (
              <Text
                key={s.key}
                variant="caption"
                accessibilityRole="button"
                accessibilityState={{ selected: s.key === sort }}
                onPress={() => setSort(s.key)}
                style={{
                  color: s.key === sort ? colors.brand : colors.textFaint,
                  fontWeight: s.key === sort ? "600" : "400",
                  paddingVertical: spacing.xs,
                  paddingHorizontal: spacing.sm,
                }}
              >
                {s.label}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      {/* القائمة */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.user_word_id}
          contentContainerStyle={{
            padding: spacing.lg,
            gap: spacing.md,
            paddingBottom: insets.bottom + 100,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.brand}
            />
          }
          renderItem={({ item }) => (
            <WordCard
              row={item}
              onPress={() => router.push(`/word/${item.user_word_id}`)}
            />
          )}
          ListEmptyComponent={
            <Empty
              hasSearch={!!debounced || filter !== "all"}
              onAdd={() => router.push("/add-word")}
            />
          }
        />
      )}

      {/* زر الإضافة العائم */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="أضف كلمة جديدة"
        onPress={() => router.push("/add-word")}
        style={({ pressed }) => ({
          position: "absolute",
          bottom: insets.bottom + spacing.lg,
          insetInlineEnd: spacing.lg,
          width: 60,
          height: 60,
          borderRadius: radius.pill,
          backgroundColor: colors.brand,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.85 : 1,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        })}
      >
        <Ionicons name="add" size={32} color={colors.onBrand} />
      </Pressable>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors, spacing, radius, minTouch } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        minHeight: minTouch - 8,
        justifyContent: "center",
        paddingHorizontal: spacing.lg,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: active ? colors.brand : colors.border,
        backgroundColor: active ? colors.brandSoft : colors.bg,
      }}
    >
      <Text
        variant="label"
        style={{ color: active ? colors.brand : colors.textMuted }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Empty({
  hasSearch,
  onAdd,
}: {
  hasSearch: boolean;
  onAdd: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.md,
        paddingVertical: spacing.xxxl,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: radius.xl,
          backgroundColor: colors.surfaceAlt,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={hasSearch ? "search-outline" : "library-outline"}
          size={40}
          color={colors.textFaint}
        />
      </View>
      <Text variant="heading" center>
        {hasSearch ? "مفيش نتائج" : "لسه ما أضفتش كلمات"}
      </Text>
      <Text variant="body" tone="muted" center>
        {hasSearch
          ? "جرّب كلمة تانية أو غيّر الفلتر"
          : "أول كلمة تضيفها هتلاقيها هنا"}
      </Text>
      {!hasSearch ? (
        <Text
          variant="bodyStrong"
          tone="brand"
          accessibilityRole="button"
          onPress={onAdd}
          style={{ paddingVertical: spacing.md }}
        >
          أضف أول كلمة
        </Text>
      ) : null}
    </View>
  );
}

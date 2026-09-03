import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";

import { Input, SkeletonList, Text, Touchable } from "@/components/ui";
import { Sheet, type SheetRef } from "@/components/ui/Sheet";
import { ConfirmBody, SheetAction } from "@/components/ui/SheetAction";
import { WordCard } from "@/components/word/WordCard";
import { useTheme } from "@/theme/ThemeProvider";
import { useOnline } from "@/lib/network";
import { actionError as actionError_ } from "@/lib/errors";
import { duration } from "@/theme/motion";
import { useSettings } from "@/store/settings";
import {
  useDeleteWord,
  useMyWords,
  useSetArchived,
  type WordFilter,
  type WordSort,
} from "@/api/words";
import type { MyWordRow } from "@/lib/database.types";
import { tabBarClearance } from "@/theme/spacing";
import { useRefreshAll } from "@/lib/refresh";

const FILTERS: WordFilter[] = [
  "all",
  "learning",
  "mastered",
  "hard",
  "favorite",
  // last on purpose: the archive is somewhere you go looking, not a daily view
  "archived",
];
const SORTS: WordSort[] = ["recent", "alpha", "hardest"];

const FILTER_KEY: Record<WordFilter, string> = {
  all: "words.filterAll",
  learning: "words.filterLearning",
  mastered: "words.filterMastered",
  hard: "words.filterHard",
  favorite: "words.filterFavorite",
  archived: "words.filterArchived",
};
const SORT_KEY: Record<WordSort, string> = {
  recent: "words.sortRecent",
  alpha: "words.sortAlpha",
  hardest: "words.sortHardest",
};

export default function Words() {
  const { colors, spacing, radius, shadow, isDark, minTouch } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const simple = useSettings((s) => s.simpleMode);

  const sheet = useRef<SheetRef>(null);
  const confirmSheet = useRef<SheetRef>(null);

  const archive = useSetArchived();
  const remove = useDeleteWord();

  /** the row a swipe is asking about, and which way it was swiped */
  const [pending, setPending] = useState<
    { row: MyWordRow; kind: "archive" | "delete" } | null
  >(null);

  /**
   * A failed archive used to be silent: the row stayed put and nothing said
   * why, which reads exactly like "the button doesn't work".
   */
  const [actionError, setActionError] = useState<string | null>(null);
  const failed = (e: unknown) => setActionError(actionError_(e, t));

  function ask(row: MyWordRow, kind: "archive" | "delete") {
    /**
     * Restoring is the undo of an archive and costs nothing, so it just
     * happens — asking twice to put a word back is friction, not safety.
     */
    if (kind === "archive" && row.status === "archived") {
      setActionError(null);
      archive
        .mutateAsync({ userWordId: row.user_word_id, archived: false })
        .catch((e) => failed(e));
      return;
    }
    setPending({ row, kind });
    confirmSheet.current?.open();
  }

  async function confirmPending() {
    if (!pending) return;
    const { row, kind } = pending;
    setActionError(null);
    try {
      if (kind === "archive") {
        await archive.mutateAsync({ userWordId: row.user_word_id, archived: true });
      } else {
        await remove.mutateAsync(row.user_word_id);
      }
    } catch (e) {
      failed(e);
    } finally {
      confirmSheet.current?.close();
      setPending(null);
    }
  }
  const [filter, setFilter] = useState<WordFilter>("all");
  const [sort, setSort] = useState<WordSort>("recent");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const { refreshing, onRefresh } = useRefreshAll();

  const { data, isLoading } = useMyWords({
    filter,
    search: debounced,
    sort,
  });

  const total = data?.[0]?.total_count ?? 0;
  const filtered = filter !== "all" || sort !== "recent";

  const header = useMemo(
    () => (
      /**
        * Opaque, because this header is sticky.
        *
        * It had padding and nothing else, so once the list scrolled the word
        * rows slid underneath the title, the search field and the filter
        * button and showed straight through them.
        *
        * bgTop is the colour the page gradient starts at, so at rest the bar
        * is invisible against it; the hairline only earns its keep once
        * content has scrolled under.
        */
      <View
        style={{
          paddingTop: insets.top + spacing.lg,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
          gap: spacing.md,
          backgroundColor: colors.bgTop,
          borderBottomWidth: StyleSheet.hairlineWidth,
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
          <View
            style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.sm }}
          >
            <Text variant="title">
              {t(filter === "archived" ? "words.filterArchived" : "words.title")}
            </Text>
            {total > 0 ? (
              <Text variant="caption" tone="faint">
                {t("words.count", { count: total })}
              </Text>
            ) : null}
          </View>

          {/* one tap in, one tap back out */}
          <Touchable
            onPress={() => setFilter(filter === "archived" ? "all" : "archived")}
            haptic="select"
            accessibilityRole="button"
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Ionicons
              name={filter === "archived" ? "arrow-undo-outline" : "archive-outline"}
              size={15}
              color={filter === "archived" ? colors.brand : colors.textMuted}
            />
            <Text
              variant="caption"
              tone={filter === "archived" ? "brand" : "muted"}
            >
              {t(filter === "archived" ? "words.filterAll" : "words.filterArchived")}
            </Text>
          </Touchable>
        </View>

        {actionError ? (
          <Touchable
            onPress={() => setActionError(null)}
            haptic="select"
            accessibilityRole="button"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radius.md,
              backgroundColor: colors.dangerSoft,
            }}
          >
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text variant="caption" tone="danger" style={{ flex: 1 }}>
              {actionError}
            </Text>
            <Ionicons name="close" size={15} color={colors.danger} />
          </Touchable>
        ) : null}

        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder={t("words.searchPlaceholder")}
              returnKeyType="search"
            />
          </View>

          <Touchable
            onPress={() => sheet.current?.open()}
            haptic="select"
            accessibilityRole="button"
            accessibilityLabel={t("sheet.filters")}
            style={{
              width: minTouch,
              height: minTouch,
              borderRadius: radius.md,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: filtered ? colors.brandSoft : colors.glassStrong,
              borderWidth: 1,
              borderColor: filtered ? colors.brandBorder : colors.border,
            }}
          >
            <Ionicons
              name="options-outline"
              size={21}
              color={filtered ? colors.brand : colors.textMuted}
            />
            {filtered ? (
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  insetInlineEnd: 8,
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: colors.brand,
                }}
              />
            ) : null}
          </Touchable>
        </View>
      </View>
    ),
    [insets.top, spacing, t, total, search, filtered, filter, actionError, colors, radius, minTouch],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <LinearGradient
        colors={[colors.bgTop, colors.bgBottom]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 320 }}
      />

      {isLoading ? (
        <>
          {header}
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <SkeletonList count={6} />
          </View>
        </>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.user_word_id}
          ListHeaderComponent={header}
          stickyHeaderIndices={[0]}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            gap: spacing.sm,
            // clear the floating tab bar — same helper Screen uses, so this
            // hand-rolled list stays in step with every other tab screen
            paddingBottom: tabBarClearance(insets.bottom),
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              // the whole screen, not just this list — the header counts and
              // the filters read from queries of their own
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brand}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeIn.duration(duration.normal)}>
              <WordCard
                row={item}
                onPress={() => router.push(`/word/${item.user_word_id}`)}
                onArchive={() => ask(item, "archive")}
                onDelete={() => ask(item, "delete")}
              />
            </Animated.View>
          )}
          ListEmptyComponent={
            <Empty
              filtered={!!debounced || filtered}
              onAdd={() => router.push("/add-word")}
            />
          }
        />
      )}



      {/* filter + sort sheet */}
      <Sheet ref={sheet} title={t("sheet.filters")}>
        <Text variant="label" tone="muted">
          {t("sheet.filterBy")}
        </Text>
        {FILTERS.map((f) => (
          <SheetAction
            key={f}
            label={t(FILTER_KEY[f])}
            selected={filter === f}
            onPress={() => {
              setFilter(f);
              sheet.current?.close();
            }}
          />
        ))}

        {!simple ? (
          <>
            <Text variant="label" tone="muted" style={{ marginTop: spacing.sm }}>
              {t("sheet.sortBy")}
            </Text>
            {SORTS.map((s) => (
              <SheetAction
                key={s}
                label={t(SORT_KEY[s])}
                selected={sort === s}
                onPress={() => {
                  setSort(s);
                  sheet.current?.close();
                }}
              />
            ))}
          </>
        ) : null}
      </Sheet>

      {/* one sheet for both swipes — the copy is what changes */}
      <Sheet ref={confirmSheet}>
        <ConfirmBody
          title={t(
            pending?.kind === "delete"
              ? "sheet.deleteWordTitle"
              : "word.archive",
          )}
          body={t(
            pending?.kind === "delete" ? "word.deleteBody" : "word.archiveBody",
            { word: pending?.row.lemma ?? "" },
          )}
          confirmLabel={t(
            pending?.kind === "delete" ? "common.delete" : "word.archive",
          )}
          cancelLabel={t("common.cancel")}
          danger={pending?.kind === "delete"}
          loading={archive.isPending || remove.isPending}
          onCancel={() => {
            confirmSheet.current?.close();
            setPending(null);
          }}
          onConfirm={confirmPending}
        />
      </Sheet>
    </View>
  );
}

function Empty({ filtered, onAdd }: { filtered: boolean; onAdd: () => void }) {
  const offline = !useOnline();
  const { colors, spacing, radius } = useTheme();
  const { t } = useTranslation();

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
          width: 84,
          height: 84,
          borderRadius: radius.xl,
          backgroundColor: colors.sunken,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={
            offline
              ? "cloud-offline-outline"
              : filtered
                ? "search-outline"
                : "library-outline"
          }
          size={38}
          color={colors.textFaint}
        />
      </View>
      <Text variant="heading" center>
        {offline
          ? t("errors.offlineTitle")
          : filtered
            ? t("words.noResultsTitle")
            : t("words.emptyTitle")}
      </Text>
      <Text variant="body" tone="muted" center>
        {offline
          ? t("errors.offlineBody")
          : filtered
            ? t("words.noResultsBody")
            : t("words.emptyBody")}
      </Text>
      {!filtered && !offline ? (
        <Touchable onPress={onAdd} style={{ paddingVertical: spacing.md }}>
          <Text variant="bodyStrong" tone="brand">
            {t("words.emptyAction")}
          </Text>
        </Touchable>
      ) : null}
    </View>
  );
}

import React, { useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import {
  Badge,
  Button,
  Header,
  ProgressBar,
  Screen,
  SkeletonList,
  Surface,
  Text,
  Touchable,
} from "@/components/ui";
import {
  RelatedWordSheet,
  type RelatedSheetRef,
} from "@/components/word/RelatedWordSheet";
import { usePackAccent } from "@/components/packs/PackCard";
import { useTheme } from "@/theme/ThemeProvider";
import {
  packSubtitle,
  packTitle,
  useAddPackWords,
  usePackWords,
  useTopicPacks,
} from "@/api/packs";

export default function PackDetail() {
  const { colors, spacing, radius, minTouch } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const sheet = useRef<RelatedSheetRef>(null);
  const [addedCount, setAddedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: packs } = useTopicPacks();
  const pack = packs?.find((p) => p.pack_id === id);
  const { data: words, isLoading } = usePackWords(id);
  const addPack = useAddPackWords();

  const tone = usePackAccent(pack?.accent ?? "brand");

  const { mine, ready, pending } = useMemo(() => {
    const list = words ?? [];
    return {
      mine: list.filter((w) => w.already_mine).length,
      // in the dictionary already, so adding them is instant and free
      ready: list.filter((w) => w.entry_id && !w.already_mine).length,
      // still needs one generation each — done from the sheet, one tap at a time
      pending: list.filter((w) => !w.entry_id).length,
    };
  }, [words]);

  const total = words?.length ?? pack?.word_count ?? 0;
  const complete = total > 0 && mine >= total;

  async function addAll() {
    if (!id) return;
    setError(null);
    try {
      const res = await addPack.mutateAsync(id);
      setAddedCount(res.added);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError(t("packs.addFailed"));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  return (
    <Screen scroll>
      <Header
        title={pack ? packTitle(pack, i18n.language) : ""}
        subtitle={pack ? packSubtitle(pack, i18n.language) : undefined}
        onBack={() => router.back()}
      />

      {/* progress + bulk add */}
      <Surface tone="glass" elevation="md" radiusKey="xxl" padded={spacing.xl}>
        <View style={{ gap: spacing.lg }}>
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
          >
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: radius.lg,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: tone.bg,
              }}
            >
              <Ionicons
                name={
                  (pack?.icon ?? "albums") as keyof typeof Ionicons.glyphMap
                }
                size={26}
                color={tone.fg}
              />
            </View>

            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="bodyStrong">
                {t("packs.count", { count: total })}
              </Text>
              <Text variant="caption" tone="muted">
                {t("packs.owned", { owned: mine, total })}
              </Text>
            </View>

            {pack?.cefr_level ? (
              <Badge label={pack.cefr_level} tone="neutral" />
            ) : null}
          </View>

          <ProgressBar
            value={total > 0 ? mine / total : 0}
            tone={complete ? "success" : "brand"}
            label={t("packs.owned", { owned: mine, total })}
          />

          {complete ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.sm,
                paddingVertical: spacing.sm,
              }}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text variant="bodyStrong" style={{ color: colors.success }}>
                {t("packs.allAdded")}
              </Text>
            </View>
          ) : (
            <Button
              title={
                ready > 0
                  ? t("packs.addAllReady", { count: ready })
                  : t("packs.addAll")
              }
              size="lg"
              fullWidth
              icon="add"
              disabled={ready === 0}
              loading={addPack.isPending}
              onPress={addAll}
            />
          )}

          {addedCount !== null ? (
            <Text variant="caption" tone="brand" center>
              {t("packs.added", { count: addedCount })}
            </Text>
          ) : null}

          {error ? (
            <Text variant="caption" tone="danger" center>
              {error}
            </Text>
          ) : null}

          {pending > 0 ? (
            <View
              style={{
                flexDirection: "row",
                gap: spacing.sm,
                alignItems: "center",
              }}
            >
              <Ionicons
                name="sparkles-outline"
                size={16}
                color={colors.textFaint}
              />
              <Text variant="micro" tone="faint" style={{ flex: 1 }}>
                {t("packs.pending", { count: pending })}
              </Text>
            </View>
          ) : null}
        </View>
      </Surface>

      {/* the words themselves */}
      {isLoading ? (
        <View style={{ paddingVertical: spacing.xxxl, alignItems: "center" }}>
          <SkeletonList count={6} />
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {(words ?? []).map((w) => (
            <Touchable
              key={w.lemma}
              haptic="select"
              accessibilityRole="button"
              accessibilityLabel={t("a11y.addRelated", { word: w.lemma })}
              onPress={() => sheet.current?.open(w.lemma)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
                minHeight: minTouch,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.glassStrong,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong" ltr>
                  {w.lemma}
                </Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {w.ar_preview || t("packs.notReady")}
                </Text>
              </View>

              {w.already_mine ? (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.success}
                />
              ) : (
                <Ionicons
                  name={w.entry_id ? "add-circle-outline" : "sparkles-outline"}
                  size={22}
                  color={w.entry_id ? colors.brand : colors.textFaint}
                />
              )}
            </Touchable>
          ))}
        </View>
      )}

      <RelatedWordSheet ref={sheet} />
    </Screen>
  );
}

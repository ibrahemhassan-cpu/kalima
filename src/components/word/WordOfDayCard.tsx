import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { Badge, Button, SpeakButton, Surface, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { useAddWord } from "@/api/words";
import { isOnline } from "@/lib/network";
import type { WordOfDay } from "@/api/wordOfDay";
import { ICON_FORWARD } from "@/i18n/rtl";

/**
 * One new word a day, on the home screen.
 *
 * Kalima had nothing to offer on a day with no reviews due — which is the day
 * a habit actually breaks. This is a single, low-commitment thing to do: read
 * it, hear it, and either take it or leave it.
 *
 * The card deliberately keeps showing the same word after it's added. The
 * server would happily hand back a different one (it excludes words you own),
 * but swapping the card out from under someone who just acted on it reads as
 * a glitch — and turns one calm suggestion into an endless feed.
 */
export function WordOfDayCard({
  word,
  onOpen,
}: {
  word: WordOfDay;
  onOpen: (userWordId: string) => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const { t } = useTranslation();
  const add = useAddWord();
  const [addedId, setAddedId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  /**
   * Home stays mounted in its tab, so if the day rolls over while the app is
   * open the query hands us a different word in the same component. Without
   * this reset, "Open word" would still be pointing at yesterday's row —
   * navigating to a word other than the one on screen.
   */
  useEffect(() => {
    setAddedId(null);
    setFailed(false);
  }, [word.entry_id]);

  return (
    <Surface tone="glass" elevation="md" radiusKey="xxl" padded={spacing.lg}>
      <View style={{ gap: spacing.md }}>
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: radius.sm,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={[colors.brand, colors.brandAlt]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", inset: 0 }}
            />
            <Ionicons name="sunny" size={17} color={colors.onBrand} />
          </View>
          <Text variant="label" tone="muted" style={{ flex: 1 }}>
            {t("home.wordOfDay")}
          </Text>
          {word.cefr_level ? (
            <Badge label={word.cefr_level} tone="neutral" />
          ) : null}
        </View>

        <View
          style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="heading" ltr numberOfLines={2}>
              {word.lemma}
            </Text>
          </View>
          <SpeakButton word={word.lemma} />
        </View>

        {word.ar_preview ? (
          <Text variant="bodyStrong" tone="brand" numberOfLines={2}>
            {word.ar_preview}
          </Text>
        ) : null}

        {word.en_definition ? (
          <Text variant="caption" tone="muted" ltr numberOfLines={3}>
            {word.en_definition}
          </Text>
        ) : null}

        {addedId ? (
          <Button
            title={t("home.wordOfDayOpen")}
            variant="secondary"
            fullWidth
            icon={ICON_FORWARD}
            onPress={() => onOpen(addedId)}
          />
        ) : (
          <Button
            title={t("home.wordOfDayAdd")}
            fullWidth
            icon="add"
            loading={add.isPending}
            onPress={async () => {
              try {
                setFailed(false);
                const res = await add.mutateAsync({ entryId: word.entry_id });
                setAddedId(res.user_word_id);
              } catch {
                // offlineFirst mutations reject offline rather than queue
                setFailed(true);
              }
            }}
          />
        )}

        {failed ? (
          <Text variant="micro" tone="danger" center>
            {t(isOnline() ? "errors.generic" : "errors.network")}
          </Text>
        ) : null}
      </View>
    </Surface>
  );
}

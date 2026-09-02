import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import Animated, { FadeIn } from "react-native-reanimated";

import { Badge, Button, SpeakButton, Text } from "@/components/ui";
import { Sheet, type SheetRef } from "@/components/ui/Sheet";
import { useTheme } from "@/theme/ThemeProvider";
import {
  EnrichError,
  enrichWord,
  useAddWord,
  useCustomTranslation,
  type EnrichResponse,
} from "@/api/words";

export type RelatedSheetRef = { open: (word: string) => void };

/**
 * Tap any synonym, antonym or confusable and get a compact preview with a
 * one-tap add. Looks the word up on demand — cached words come back instantly,
 * new ones cost one generation.
 */
export const RelatedWordSheet = forwardRef<RelatedSheetRef>(
  function RelatedWordSheet(_props, ref) {
    const { colors, spacing, radius } = useTheme();
    const { t } = useTranslation();
    const qc = useQueryClient();
    const sheet = useRef<SheetRef>(null);
    const addWord = useAddWord();

    const [word, setWord] = useState("");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<EnrichResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [added, setAdded] = useState(false);

    /**
     * The user's own correction wins over the dictionary text here too.
     *
     * entry.id only arrives with the enrichWord response, so this can't run
     * in parallel with it. Rather than print the dictionary text and swap it
     * a moment later, the block below waits for this to settle — the lookup
     * is a single indexed row right after a network call that already took
     * far longer.
     */
    const { data: myTranslation, isFetching: loadingMine } =
      useCustomTranslation(data?.entry.id);

    useImperativeHandle(ref, () => ({
      open: (w: string) => {
        setWord(w);
        setData(null);
        setError(null);
        setAdded(false);
        sheet.current?.open();
        void load(w);
      },
    }));

    async function load(w: string) {
      setLoading(true);
      try {
        const res = await enrichWord(w, false);
        setData(res);
      } catch (e) {
        setError((e as EnrichError).message);
      } finally {
        setLoading(false);
      }
    }

    async function add() {
      if (!data) return;
      await addWord.mutateAsync({ entryId: data.entry.id });
      void qc.invalidateQueries({ queryKey: ["home-summary"] });
      setAdded(true);
    }

    const primary = data?.entry.senses[0];
    const mine = !!data?.user_word_id || added;

    return (
      <Sheet ref={sheet}>
        <View style={{ gap: spacing.lg, minHeight: 190 }}>
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="title" ltr>
                {data?.entry.lemma ?? word}
              </Text>
            </View>
            <SpeakButton word={data?.entry.lemma ?? word} size="sm" />
          </View>

          {loading ? (
            <View style={{ paddingVertical: spacing.xl, alignItems: "center", gap: spacing.md }}>
              <ActivityIndicator color={colors.brand} />
              <Text variant="caption" tone="faint">
                {t("word.preparing")}
              </Text>
            </View>
          ) : error ? (
            <View
              style={{
                flexDirection: "row",
                gap: spacing.sm,
                alignItems: "center",
                backgroundColor: colors.dangerSoft,
                padding: spacing.md,
                borderRadius: radius.md,
              }}
            >
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text variant="caption" tone="danger" style={{ flex: 1 }}>
                {error}
              </Text>
            </View>
          ) : data ? (
            <Animated.View entering={FadeIn.duration(220)} style={{ gap: spacing.md }}>
              <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
                {data.entry.cefr_level ? (
                  <Badge label={data.entry.cefr_level} tone="neutral" />
                ) : null}
                <Badge
                  label={data.cached ? t("word.fromCache") : t("word.freshlyGenerated")}
                  tone={data.cached ? "success" : "brand"}
                  icon={data.cached ? "flash-outline" : "sparkles-outline"}
                />
              </View>

              {primary && !loadingMine ? (
                <View
                  style={{
                    backgroundColor: colors.brandSoft,
                    borderRadius: radius.lg,
                    padding: spacing.lg,
                    gap: spacing.xs,
                  }}
                >
                  <Text variant="heading" tone="brand">
                    {myTranslation?.trim()
                      ? myTranslation.trim()
                      : primary.ar_translations.join(" · ")}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {primary.ar_definition}
                  </Text>
                </View>
              ) : null}

              {data.entry.examples[0] ? (
                <View
                  style={{
                    paddingStart: spacing.md,
                    borderStartWidth: 3,
                    borderStartColor: colors.borderStrong,
                    gap: 2,
                  }}
                >
                  <Text variant="caption" ltr>
                    {data.entry.examples[0].en}
                  </Text>
                  <Text variant="caption" tone="faint">
                    {data.entry.examples[0].ar}
                  </Text>
                </View>
              ) : null}

              {mine ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: spacing.sm,
                    paddingVertical: spacing.md,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text variant="bodyStrong" style={{ color: colors.success }}>
                    {t("word.alreadyYours")}
                  </Text>
                </View>
              ) : (
                <Button
                  title={t("word.saveWord")}
                  size="lg"
                  fullWidth
                  icon="add"
                  loading={addWord.isPending}
                  onPress={add}
                />
              )}
            </Animated.View>
          ) : null}
        </View>
      </Sheet>
    );
  },
);

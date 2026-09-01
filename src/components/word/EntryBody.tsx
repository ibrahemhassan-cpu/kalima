import React, { useRef } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { PRESS_SCALE_SMALL } from "@/theme/motion";
import { Badge, SpeakButton, Surface, Text, Touchable } from "@/components/ui";
import {
  RelatedWordSheet,
  type RelatedSheetRef,
} from "@/components/word/RelatedWordSheet";
import { speak } from "@/features/tts";
import type { DictionaryEntry } from "@/lib/database.types";

/**
 * Shared between the add screen and the detail screen so a word looks
 * identical wherever you meet it.
 */
export function EntryBody({
  entry,
  override,
}: {
  entry: DictionaryEntry;
  /**
   * The user's own fix for the primary translation. The dictionary row is
   * shared between everyone, so a correction lives on their word instead —
   * this is where it gets shown.
   */
  override?: string | null;
}) {
  const { colors, spacing, radius } = useTheme();
  const { t } = useTranslation();
  const related = useRef<RelatedSheetRef>(null);
  const primary = entry.senses[0];
  const corrected = override?.trim() ? override.trim() : null;

  return (
    <View style={{ gap: spacing.md }}>
      <Surface tone="glass" elevation="md" radiusKey="xxl" padded={spacing.xl}>
        <View style={{ gap: spacing.lg }}>
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="word" ltr>
                {entry.lemma}
              </Text>
              {entry.ipa ? (
                <Text variant="caption" tone="faint" ltr>
                  {entry.ipa}
                </Text>
              ) : null}
            </View>
            <SpeakButton word={entry.lemma} />
            <SpeakButton word={entry.lemma} slow size="sm" />
          </View>

          {entry.cefr_level ? <Badge label={entry.cefr_level} tone="neutral" /> : null}

          {primary ? (
            <View
              style={{
                backgroundColor: colors.brandSoft,
                padding: spacing.lg,
                borderRadius: radius.lg,
                gap: spacing.xs,
              }}
            >
              <Text variant="heading" tone="brand">
                {corrected ?? primary.ar_translations.join(" · ")}
              </Text>
              <Text variant="body" tone="muted">
                {primary.ar_definition}
              </Text>
              {corrected ? (
                <View style={{ flexDirection: "row", marginTop: spacing.xs }}>
                  <Badge
                    label={t("word.yourEdit")}
                    tone="neutral"
                    icon="create-outline"
                  />
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </Surface>

      {entry.memory_tip_ar ? (
        <Surface tone="brand" radiusKey="xl">
          <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.md,
                backgroundColor: colors.accentSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="bulb" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="micro" tone="faint">
                {t("word.memoryTip")}
              </Text>
              <Text variant="body" style={{ color: colors.text }}>
                {entry.memory_tip_ar}
              </Text>
            </View>
          </View>
        </Surface>
      ) : null}

      {entry.examples.length > 0 ? (
        <Section title={t("word.examples")}>
          <View style={{ gap: spacing.lg }}>
            {entry.examples.map((ex, i) => (
              <View
                key={i}
                style={{
                  gap: spacing.xs,
                  paddingStart: spacing.md,
                  borderStartWidth: 3,
                  borderStartColor: colors.brandBorder,
                  backgroundColor: "transparent",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                    backgroundColor: "transparent",
                  }}
                >
                  <Text variant="body" ltr style={{ flex: 1 }}>
                    {ex.en}
                  </Text>
                  <Touchable
                    haptic="select"
      scaleTo={PRESS_SCALE_SMALL}
                    hitSlop={8}
                    onPress={() => speak(ex.en)}
                    accessibilityRole="button"
                    accessibilityLabel={t("a11y.listenExample")}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.brandSoft,
                    }}
                  >
                    <Ionicons
                      name="volume-medium-outline"
                      size={18}
                      color={colors.brand}
                    />
                  </Touchable>
                </View>
                <Text variant="caption" tone="muted">
                  {ex.ar}
                </Text>
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      {entry.senses.length > 1 ? (
        <Section title={t("word.otherMeanings")}>
          <View style={{ gap: spacing.lg }}>
            {entry.senses.slice(1).map((s, i) => (
              <View key={i} style={{ gap: 2, backgroundColor: "transparent" }}>
                <Text variant="bodyStrong">{s.ar_translations.join(" · ")}</Text>
                <Text variant="caption" tone="muted">
                  {s.ar_definition}
                </Text>
                <Text variant="micro" tone="faint" ltr style={{ textTransform: "uppercase" }}>
                  {s.pos}
                </Text>
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      {entry.synonyms.length > 0 ||
      entry.antonyms.length > 0 ||
      entry.confusable_with.length > 0 ? (
        <Section title={t("word.related")}>
          <View style={{ gap: spacing.lg }}>
            {entry.synonyms.length > 0 ? (
              <Chips
                label={t("word.synonyms")}
                words={entry.synonyms}
                tone="success"
                onWord={(w) => related.current?.open(w)}
              />
            ) : null}
            {entry.antonyms.length > 0 ? (
              <Chips
                label={t("word.antonyms")}
                words={entry.antonyms}
                tone="danger"
                onWord={(w) => related.current?.open(w)}
              />
            ) : null}
            {entry.confusable_with.length > 0 ? (
              <Chips
                label={t("word.confusedWith")}
                words={entry.confusable_with}
                tone="accent"
                onWord={(w) => related.current?.open(w)}
              />
            ) : null}
          </View>
        </Section>
      ) : null}

      <RelatedWordSheet ref={related} />
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { spacing } = useTheme();
  return (
    <Surface tone="glass" radiusKey="xl">
      <View style={{ gap: spacing.md }}>
        <Text variant="micro" tone="faint">
          {title}
        </Text>
        {children}
      </View>
    </Surface>
  );
}

function Chips({
  label,
  words,
  tone,
  onWord,
}: {
  label: string;
  words: string[];
  tone: "success" | "danger" | "accent";
  onWord: (word: string) => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const { t } = useTranslation();

  const c = {
    success: { bg: colors.successSoft, fg: colors.success },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    accent: { bg: colors.accentSoft, fg: colors.warning },
  }[tone];

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {words.map((w) => (
          <Touchable
            key={w}
            haptic="select"
            onLongPress={() => speak(w)}
            onPress={() => onWord(w)}
            accessibilityRole="button"
            accessibilityLabel={t("a11y.addRelated", { word: w })}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: c.bg,
              paddingStart: spacing.md,
              paddingEnd: spacing.sm,
              paddingVertical: 7,
              borderRadius: radius.pill,
            }}
          >
            <Text
              variant="caption"
              ltr
              style={{ color: c.fg, fontWeight: "600" }}
            >
              {w}
            </Text>
            <Ionicons name="add-circle" size={14} color={c.fg} />
          </Touchable>
        ))}
      </View>
    </View>
  );
}

import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { Badge, Card, SpeakButton, Text } from "@/components/ui";
import { speak } from "@/features/tts";
import type { DictionaryEntry } from "@/lib/database.types";

/**
 * جسم الكلمة — يُستخدم في شاشة الإضافة وشاشة التفاصيل بنفس الشكل،
 * عشان المستخدم يشوف نفس الحاجة في المكانين.
 */
export function EntryBody({ entry }: { entry: DictionaryEntry }) {
  const { colors, spacing, radius } = useTheme();
  const primary = entry.senses[0];

  return (
    <View style={{ gap: spacing.lg }}>
      {/* الكلمة والنطق */}
      <Card>
        <View style={{ gap: spacing.md }}>
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="word" ltr>
                {entry.lemma}
              </Text>
              {entry.ipa ? (
                <Text variant="caption" tone="faint" ltr>
                  {entry.ipa}
                </Text>
              ) : null}
            </View>
            <SpeakButton word={entry.lemma} size="lg" />
            <SpeakButton word={entry.lemma} slow size="sm" />
          </View>

          {entry.cefr_level ? (
            <Badge label={`مستوى ${entry.cefr_level}`} tone="neutral" />
          ) : null}

          {/* الترجمة — أبرز عنصر في الشاشة */}
          {primary ? (
            <View
              style={{
                backgroundColor: colors.brandSoft,
                padding: spacing.lg,
                borderRadius: radius.md,
                gap: spacing.xs,
              }}
            >
              <Text variant="heading" tone="brand">
                {primary.ar_translations.join(" · ")}
              </Text>
              <Text variant="body" tone="muted">
                {primary.ar_definition}
              </Text>
            </View>
          ) : null}
        </View>
      </Card>

      {/* حيلة الحفظ */}
      {entry.memory_tip_ar ? (
        <Card tone="brand">
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Ionicons name="bulb-outline" size={22} color={colors.brand} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="label" tone="brand">
                حيلة للحفظ
              </Text>
              <Text variant="body">{entry.memory_tip_ar}</Text>
            </View>
          </View>
        </Card>
      ) : null}

      {/* الأمثلة */}
      {entry.examples.length > 0 ? (
        <Section title="أمثلة">
          <View style={{ gap: spacing.md }}>
            {entry.examples.map((ex, i) => (
              <View
                key={i}
                style={{
                  gap: spacing.xs,
                  paddingStart: spacing.md,
                  borderStartWidth: 3,
                  borderStartColor: colors.border,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                  }}
                >
                  <Text variant="body" ltr style={{ flex: 1 }}>
                    {ex.en}
                  </Text>
                  <Ionicons
                    name="volume-medium-outline"
                    size={20}
                    color={colors.textMuted}
                    onPress={() => speak(ex.en)}
                    accessibilityRole="button"
                    accessibilityLabel="اسمع المثال"
                    suppressHighlighting
                  />
                </View>
                <Text variant="caption" tone="muted">
                  {ex.ar}
                </Text>
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      {/* معانٍ إضافية */}
      {entry.senses.length > 1 ? (
        <Section title="معانٍ تانية">
          <View style={{ gap: spacing.md }}>
            {entry.senses.slice(1).map((s, i) => (
              <View key={i} style={{ gap: 2 }}>
                <Text variant="bodyStrong">{s.ar_translations.join(" · ")}</Text>
                <Text variant="caption" tone="muted">
                  {s.ar_definition}
                </Text>
                <Text variant="caption" tone="faint" ltr>
                  {s.pos}
                </Text>
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      {/* مرادفات وأضداد */}
      {entry.synonyms.length > 0 || entry.antonyms.length > 0 ? (
        <Section title="كلمات مرتبطة">
          <View style={{ gap: spacing.md }}>
            {entry.synonyms.length > 0 ? (
              <WordChips label="مرادفات" words={entry.synonyms} tone="success" />
            ) : null}
            {entry.antonyms.length > 0 ? (
              <WordChips label="أضداد" words={entry.antonyms} tone="danger" />
            ) : null}
            {entry.confusable_with.length > 0 ? (
              <WordChips
                label="بتتلخبط مع"
                words={entry.confusable_with}
                tone="accent"
              />
            ) : null}
          </View>
        </Section>
      ) : null}
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
    <Card>
      <View style={{ gap: spacing.md }}>
        <Text variant="heading">{title}</Text>
        {children}
      </View>
    </Card>
  );
}

function WordChips({
  label,
  words,
  tone,
}: {
  label: string;
  words: string[];
  tone: "success" | "danger" | "accent";
}) {
  const { colors, spacing, radius } = useTheme();
  const map = {
    success: { bg: colors.successSoft, fg: colors.success },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    accent: { bg: colors.accentSoft, fg: colors.warning },
  }[tone];

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="label" tone="muted">
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {words.map((w) => (
          <Text
            key={w}
            variant="caption"
            ltr
            accessibilityRole="button"
            accessibilityLabel={`اسمع ${w}`}
            onPress={() => speak(w)}
            style={{
              backgroundColor: map.bg,
              color: map.fg,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radius.pill,
              overflow: "hidden",
              fontWeight: "600",
            }}
          >
            {w}
          </Text>
        ))}
      </View>
    </View>
  );
}

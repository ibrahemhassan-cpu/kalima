import React, { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import {
  Badge,
  Button,
  Header,
  Input,
  Screen,
  Surface,
  Text,
  Touchable,
} from "@/components/ui";
import { EntryBody } from "@/components/word/EntryBody";
import { DidYouMean, SensePicker } from "@/components/word/SensePicker";
import { useTheme } from "@/theme/ThemeProvider";
import {
  type EnrichError,
  enrichWord,
  type EnrichResponse,
  useAddWord,
  useDictionarySearch,
} from "@/api/words";

type Phase = "input" | "loading" | "result";

export default function AddWord() {
  const { colors, spacing, radius, minTouch } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const addWord = useAddWord();

  const [phase, setPhase] = useState<Phase>("input");
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [result, setResult] = useState<EnrichResponse | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [didYouMean, setDidYouMean] = useState<string[]>([]);
  const [senseIndex, setSenseIndex] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 250);
    return () => clearTimeout(id);
  }, [term]);

  const { data: suggestions } = useDictionarySearch(
    phase === "input" ? debounced : "",
  );

  async function lookup(word: string) {
    setError(null);
    setErrorCode(null);
    setDidYouMean([]);
    setSenseIndex(0);
    setPhase("loading");
    try {
      const res = await enrichWord(word, false);
      setResult(res);
      setPhase("result");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      const err = e as EnrichError;
      setError(err.message);
      setErrorCode(err.code ?? null);
      setDidYouMean(err.didYouMean ?? []);
      setPhase("input");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  async function save() {
    if (!result) return;
    try {
      const chosen = result.entry.senses[senseIndex];
      const prefix =
        senseIndex > 0 && chosen
          ? `${chosen.ar_translations.join(" · ")}`
          : "";
      const combined = [prefix, note.trim()].filter(Boolean).join(" — ");

      await addWord.mutateAsync({
        entryId: result.entry.id,
        note: combined || undefined,
      });
      void qc.invalidateQueries({ queryKey: ["home-summary"] });
      void qc.invalidateQueries({ queryKey: ["due-words"] });
      router.back();
    } catch {
      setError(t("errors.generic"));
    }
  }

  // ── loading ──────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <Screen>
        <Header onBack={() => setPhase("input")} language={false} />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.lg,
          }}
        >
          <ActivityIndicator size="large" color={colors.brand} />
          <Text variant="title" ltr center>
            {term.trim()}
          </Text>
          <Text variant="body" tone="muted" center>
            {t("word.preparing")}
          </Text>
          <Text variant="caption" tone="faint" center>
            {t("word.preparingHint")}
          </Text>
        </View>
      </Screen>
    );
  }

  // ── result ───────────────────────────────────────────────
  if (phase === "result" && result) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Screen scroll>
          <Header
            language={false}
            onBack={() => {
              setPhase("input");
              setResult(null);
              setNote("");
            }}
          />

          <Animated.View entering={FadeIn.duration(240)}>
            {result.cached ? (
              <Badge
                label={t("word.fromCache")}
                tone="success"
                icon="flash-outline"
              />
            ) : (
              <Badge
                label={`${t("word.freshlyGenerated")} · ${t("word.remainingToday", {
                  count: result.ai_remaining ?? 0,
                })}`}
                tone="brand"
                icon="sparkles-outline"
              />
            )}
          </Animated.View>

          <SensePicker
            senses={result.entry.senses}
            selected={senseIndex}
            onSelect={setSenseIndex}
          />

          <Animated.View entering={FadeInDown.duration(380).springify().damping(18)}>
            <EntryBody entry={result.entry} />
          </Animated.View>

          <Surface tone="glass" radiusKey="xl">
            <Input
              label={`${t("word.myNote")} · ${t("common.optional")}`}
              value={note}
              onChangeText={setNote}
              placeholder={t("word.notePlaceholder")}
              multiline
              numberOfLines={3}
              style={{ minHeight: 92, textAlignVertical: "top" }}
            />
          </Surface>

          {error ? (
            <Text variant="caption" tone="danger" center>
              {error}
            </Text>
          ) : null}

          <Button
            title={t("word.saveWord")}
            size="lg"
            fullWidth
            icon="bookmark-outline"
            loading={addWord.isPending}
            onPress={save}
          />
        </Screen>
      </KeyboardAvoidingView>
    );
  }

  // ── input ────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen scroll>
        <Header
          title={t("word.addTitle")}
          subtitle={t("word.addSubtitle")}
          onBack={() => router.back()}
        />

        <Input
          english
          size="lg"
          value={term}
          onChangeText={(v) => {
            setTerm(v);
            setError(null);
          }}
          placeholder={t("word.placeholder")}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={() => term.trim().length >= 2 && lookup(term)}
          error={error ?? undefined}
        />

        <DidYouMean
          suggestions={didYouMean}
          onPick={(w) => {
            setTerm(w);
            void lookup(w);
          }}
        />

        {errorCode === "rate_limited" ? (
          <Surface tone="brand" radiusKey="lg">
            <Text variant="caption" tone="muted">
              {t("errors.rateLimitedHint")}
            </Text>
          </Surface>
        ) : null}

        <Button
          title={t("word.saveWord")}
          size="lg"
          fullWidth
          icon="bookmark-outline"
          disabled={term.trim().length < 2}
          onPress={() => lookup(term)}
        />

        {/* Recent Words List matching Screen 2 in Design System */}
        {(!suggestions || suggestions.length === 0) ? (
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            <Text variant="micro" tone="muted" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
              Recent
            </Text>
            {[
              { word: "Serendipity", pos: "Noun" },
              { word: "Eloquent", pos: "Adjective" },
              { word: "Meticulous", pos: "Adjective" },
              { word: "Ineffable", pos: "Adjective" },
            ].map((item, i) => (
              <Animated.View
                key={item.word}
                entering={FadeInDown.delay(i * 50).duration(260)}
              >
                <Touchable
                  haptic="select"
                  scaleTo={0.98}
                  onPress={() => {
                    setTerm(item.word);
                    void lookup(item.word);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    borderRadius: radius.md,
                    backgroundColor: colors.glassStrong,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ gap: 2 }}>
                    <Text variant="bodyStrong" ltr style={{ fontWeight: "600" }}>
                      {item.word}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {item.pos}
                    </Text>
                  </View>
                  <Ionicons name="bookmark-outline" size={19} color={colors.textFaint} />
                </Touchable>
              </Animated.View>
            ))}
          </View>
        ) : null}

        {suggestions && suggestions.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="micro" tone="faint">
              {t("word.inDictionary").toUpperCase()}
            </Text>
            {suggestions.map((s, i) => (
              <Animated.View
                key={s.entry_id}
                entering={FadeInDown.delay(i * 40).duration(280)}
              >
                <Touchable
                  haptic="select"
                  scaleTo={0.985}
                  accessibilityRole="button"
                  accessibilityLabel={`${s.lemma}, ${s.ar_preview}`}
                  onPress={() => {
                    setTerm(s.lemma);
                    void lookup(s.lemma);
                  }}
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
                  <Ionicons name="flash" size={17} color={colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" ltr>
                      {s.lemma}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {s.ar_preview}
                    </Text>
                  </View>
                  {s.already_mine ? (
                    <Badge
                      label={t("word.alreadyYours")}
                      tone="neutral"
                      icon="checkmark-outline"
                    />
                  ) : null}
                </Touchable>
              </Animated.View>
            ))}
          </View>
        ) : null}

        <View
          style={{
            flexDirection: "row",
            gap: spacing.md,
            paddingHorizontal: spacing.xs,
          }}
        >
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.textFaint}
          />
          <Text variant="caption" tone="faint" style={{ flex: 1 }}>
            {t("word.aiDisclaimer")}
          </Text>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  I18nManager,
  KeyboardAvoidingView,
  Platform,
  View,
} from "react-native";
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
import { duration } from "@/theme/motion";
import { useOnline } from "@/lib/network";
import {
  type EnrichError,
  enrichWord,
  type EnrichResponse,
  useAddWord,
  useDictionarySearch,
  useCustomTranslation,
  useMyWords,
} from "@/api/words";
import { useAiQuota } from "@/api/ai";
import { ICON_CHEVRON_FORWARD } from "@/i18n/rtl";

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

  // asked before anything is spent, not reported after the fact
  const { data: quota } = useAiQuota();

  /**
   * Looking a word up again is a normal way to re-read one you already own.
   * Without this the screen prints the AI translation the user explicitly
   * replaced, with no sign it was ever edited.
   */
  const { data: myTranslation } = useCustomTranslation(result?.entry.id);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 250);
    return () => clearTimeout(id);
  }, [term]);

  const { data: suggestions } = useDictionarySearch(
    phase === "input" ? debounced : "",
  );
  const online = useOnline();
  const { data: recent } = useMyWords({
    filter: "all",
    search: "",
    sort: "recent",
  });

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
      /**
       * Only a generation spends quota — enrich-word returns from the shared
       * dictionary before it ever charges (see its step 3). Without this the
       * note keeps showing the count from when the screen opened, because
       * going back to the input phase re-renders rather than remounts.
       */
      if (!res.cached) void qc.invalidateQueries({ queryKey: ["ai-quota"] });
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
            <EntryBody entry={result.entry} override={myTranslation} />
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

        {!online ? (
          <Surface tone="glass" radiusKey="lg">
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <Ionicons
                name="cloud-offline-outline"
                size={20}
                color={colors.warning}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">{t("errors.offlineTitle")}</Text>
                <Text variant="caption" tone="muted">
                  {t("errors.offlineAdd")}
                </Text>
              </View>
            </View>
          </Surface>
        ) : null}

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

        {online && quota ? <QuotaNote remaining={quota.remaining} /> : null}

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
          disabled={!online || term.trim().length < 2}
          onPress={() => lookup(term)}
        />

        {/* the user's own last few words — a shortcut back into them */}
        {(!suggestions || suggestions.length === 0) && recent && recent.length > 0 ? (
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            <Text variant="micro" tone="muted">
              {t("home.recent")}
            </Text>
            {recent.slice(0, 4).map((item, i) => (
              <Animated.View
                key={item.user_word_id}
                entering={FadeIn.duration(duration.normal)}
              >
                <Touchable
                  haptic="select"
                  accessibilityRole="button"
                  accessibilityLabel={`${item.lemma}, ${item.ar_preview}`}
                  onPress={() => router.push(`/word/${item.user_word_id}`)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: minTouch,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    borderRadius: radius.md,
                    backgroundColor: colors.glassStrong,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ gap: 2, flex: 1 }}>
                    <Text variant="bodyStrong" ltr style={{ fontWeight: "600" }}>
                      {item.lemma}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {item.ar_preview}
                    </Text>
                  </View>
                  <Ionicons
                    name={ICON_CHEVRON_FORWARD}
                    size={19}
                    color={colors.textFaint}
                    style={{
                      transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }],
                    }}
                  />
                </Touchable>
              </Animated.View>
            ))}
          </View>
        ) : null}

        {suggestions && suggestions.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="micro" tone="faint">
              {t("word.inDictionary")}
            </Text>
            {suggestions.map((s, i) => (
              <Animated.View
                key={s.entry_id}
                entering={FadeIn.duration(duration.normal)}
              >
                <Touchable
                  haptic="select"
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

/**
 * How many brand-new words are left today.
 *
 * The count only ever appeared *after* a successful generation, so the user
 * discovered the cap by hitting it. The wording matters twice over: the limit
 * is on AI generation, and a word already in the shared dictionary never
 * reaches the model. So at zero remaining, looking up a known word still
 * works — which is why nothing here disables the button.
 */
function QuotaNote({ remaining }: { remaining: number }) {
  const { colors, spacing, radius } = useTheme();
  const { t } = useTranslation();

  const spent = remaining <= 5;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
        backgroundColor: spent ? colors.warningSoft : colors.sunken,
      }}
    >
      <Ionicons
        name={remaining <= 0 ? "hourglass-outline" : "sparkles-outline"}
        size={15}
        color={spent ? colors.warning : colors.textMuted}
        style={{ marginTop: 2 }}
      />
      <Text variant="micro" tone="muted" style={{ flex: 1 }}>
        {remaining <= 0
          ? t("word.quotaOut")
          : t("word.quotaLeft", { count: remaining })}
      </Text>
    </View>
  );
}

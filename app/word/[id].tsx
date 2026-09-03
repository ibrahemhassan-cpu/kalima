import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import {
  Badge,
  Button,
  Header,
  Input,
  ProgressBar,
  Screen,
  SkeletonCard,
  StatusBadge,
  Surface,
  Text,
  Touchable,
} from "@/components/ui";
import { Sheet, type SheetRef } from "@/components/ui/Sheet";
import { ConfirmBody, SheetAction } from "@/components/ui/SheetAction";
import { EntryBody } from "@/components/word/EntryBody";
import { WordGlassCard } from "@/components/word/WordGlassCard";
import { useTheme } from "@/theme/ThemeProvider";
import { PRESS_SCALE_SMALL } from "@/theme/motion";
import {
  formatDue,
  useDeleteWord,
  useSetArchived,
  useUpdateWord,
  useWordDetail,
} from "@/api/words";
import { useSettings } from "@/store/settings";
import { masteryOf } from "@/api/quiz";
import { actionError } from "@/lib/errors";
import { speak } from "@/features/tts";
import { useGoBack } from "@/lib/navigation";

export default function WordDetail() {
  const { id, speak: speakParam } = useLocalSearchParams<{
    id: string;
    speak?: string;
  }>();
  const { colors, spacing, radius, minTouch } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const goBack = useGoBack();

  const simple = useSettings((s) => s.simpleMode);

  const { data: word, isLoading, error } = useWordDetail(id);
  const update = useUpdateWord(id);
  const remove = useDeleteWord();
  const archive = useSetArchived();

  const actions = useRef<SheetRef>(null);
  const editSheet = useRef<SheetRef>(null);
  const deleteSheet = useRef<SheetRef>(null);

  const [note, setNote] = useState("");
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(
    null,
  );

  /** the translation being edited in the sheet, separate from what's saved */
  const [draft, setDraft] = useState("");

  const say = (text: string) => setStatus({ text, ok: true });

  /**
   * Mutations here run with networkMode "offlineFirst" (queryCache.ts), so
   * offline they reject rather than queue. Without this the promise rejected
   * unhandled and the screen said nothing at all — the archive silently
   * didn't happen, the correction was silently lost.
   */
  const complain = (e: unknown) =>
    setStatus({ text: actionError(e, t), ok: false });

  useEffect(() => {
    if (word && !dirty) setNote(word.personal_note ?? "");
  }, [word, dirty]);

  const dictTranslation =
    word?.entry.senses[0]?.ar_translations.join(" · ") ?? "";
  const shownTranslation = word?.custom_translation?.trim()
    ? word.custom_translation.trim()
    : dictTranslation;

  function openEditor() {
    setDraft(shownTranslation);
    actions.current?.close();
    setTimeout(() => editSheet.current?.open(), 260);
  }

  async function saveTranslation(value: string | null) {
    try {
      await update.mutateAsync({ custom_translation: value });
      editSheet.current?.close();
      say(t(value ? "word.editSaved" : "word.editReset"));
    } catch (e) {
      // the sheet stays open, so the text they typed is still there to retry
      complain(e);
    }
  }

  async function setArchived(archived: boolean) {
    try {
      await archive.mutateAsync({ userWordId: word!.id, archived });
      say(t(archived ? "word.archived" : "word.restored"));
    } catch (e) {
      complain(e);
    }
  }

  /**
   * The iOS widget's speaker button lands here with ?speak=1.
   * iOS forbids a widget from playing audio itself, so the widget opens the
   * app and the app does the speaking. Guarded so it fires once per arrival.
   */
  const spoken = useRef(false);
  useEffect(() => {
    if (speakParam !== "1" || !word || spoken.current) return;
    spoken.current = true;
    speak(word.entry.lemma);
  }, [speakParam, word]);

  if (isLoading) {
    return (
      <Screen scroll>
        <Header onBack={() => goBack()} language={false} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={4} />
      </Screen>
    );
  }

  if (error || !word) {
    return (
      <Screen>
        <Header onBack={() => goBack()} />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.md,
          }}
        >
          <Ionicons name="alert-circle-outline" size={48} color={colors.textFaint} />
          <Text variant="body" tone="muted">
            {t("errors.notFound")}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen scroll>
        <Header
          onBack={() => goBack()}
          language={false}
          right={
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <RoundBtn
                icon={word.is_favorite ? "star" : "star-outline"}
                color={word.is_favorite ? colors.accent : colors.textMuted}
                label={t(word.is_favorite ? "word.unfavorite" : "word.favorite")}
                onPress={() => update.mutate({ is_favorite: !word.is_favorite })}
              />
              <RoundBtn
                icon="ellipsis-horizontal"
                color={colors.textMuted}
                label={t("sheet.wordActions")}
                onPress={() => actions.current?.open()}
              />
            </View>
          }
        />

        <WordGlassCard
          lemma={word.entry.lemma}
          translation={shownTranslation}
          isFavorite={word.is_favorite}
          onToggleFavorite={() =>
            update.mutate({ is_favorite: !word.is_favorite })
          }
          onSpeak={() => speak(word.entry.lemma)}
        />

        <EntryBody entry={word.entry} override={word.custom_translation} />

        {word.status === "archived" ? (
          <Surface tone="glass" radiusKey="xl">
            <View
              style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}
            >
              <Ionicons name="archive" size={20} color={colors.textMuted} />
              <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                {t("word.archivedNotice")}
              </Text>
              <Button
                title={t("word.restore")}
                variant="secondary"
                loading={archive.isPending}
                onPress={() => setArchived(false)}
              />
            </View>
          </Surface>
        ) : null}

        {/* progress */}
        <Surface tone="glass" radiusKey="xl">
          <View style={{ gap: spacing.md }}>
            <Text variant="heading">{t("word.progress")}</Text>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
            >
              <StatusBadge status={word.status} />
              <Badge
                label={formatDue(word.due_at, t)}
                tone="neutral"
                icon="time-outline"
              />
            </View>

            {!simple ? (
              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <Metric label={t("word.reviews")} value={word.repetitions} />
                <Metric label={t("word.lapses")} value={word.lapses} />
                <Metric
                  label={t("word.interval")}
                  value={
                    word.interval_days < 1
                      ? t("due.lessThanDay")
                      : t("due.daysShort", {
                          count: Math.round(word.interval_days),
                        })
                  }
                />
              </View>
            ) : null}

            {/* how far this one word has actually got */}
            <View style={{ gap: spacing.sm }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text variant="label" tone="muted">
                  {t("quiz.mastery")}
                </Text>
                <Text variant="bodyStrong" tone="brand">
                  {Math.round(masteryOf(word) * 100)}%
                </Text>
              </View>
              <ProgressBar
                value={masteryOf(word)}
                tone={masteryOf(word) >= 1 ? "success" : "brand"}
                label={t("quiz.mastery")}
              />
              <Text variant="micro" tone="faint">
                {t("quiz.masteryHint")}
              </Text>
            </View>

            {word.status === "leech" ? (
              <View
                style={{
                  backgroundColor: colors.dangerSoft,
                  padding: spacing.md,
                  borderRadius: radius.md,
                }}
              >
                <Text variant="caption" tone="danger">
                  {t("word.leechHint")}
                </Text>
              </View>
            ) : null}

            <Button
              title={t("quiz.testMe")}
              variant="secondary"
              fullWidth
              icon="help-circle-outline"
              onPress={() => router.push(`/quiz/${word.id}`)}
            />
          </View>
        </Surface>

        {/* personal note */}
        <Surface tone="glass" radiusKey="xl">
          <View style={{ gap: spacing.md }}>
            <Input
              label={t("word.myNote")}
              value={note}
              onChangeText={(v) => {
                setNote(v);
                setDirty(true);
                setStatus(null);
              }}
              placeholder={t("word.notePlaceholder")}
              multiline
              numberOfLines={3}
              style={{ minHeight: 92, textAlignVertical: "top" }}
            />
            {dirty ? (
              <Button
                title={t("word.saveNote")}
                variant="secondary"
                fullWidth
                loading={update.isPending}
                onPress={async () => {
                  try {
                    await update.mutateAsync({
                      personal_note: note.trim() || null,
                    });
                    setDirty(false);
                    say(t("common.saved"));
                  } catch (e) {
                    complain(e);
                  }
                }}
              />
            ) : null}
          </View>
        </Surface>

        {status ? (
          <Text
            variant="caption"
            tone={status.ok ? "muted" : "danger"}
            center
          >
            {status.text}
          </Text>
        ) : null}

        {/* Bottom Actions Bar matching Screen 3 of Design System */}
        <View
          style={{
            flexDirection: "row",
            gap: spacing.md,
            marginTop: spacing.md,
            paddingBottom: spacing.xl,
          }}
        >
          <View style={{ flex: 1 }}>
            <Button
              title={t("sheet.wordActions")}
              variant="secondary"
              size="lg"
              fullWidth
              icon="ellipsis-horizontal"
              onPress={() => actions.current?.open()}
            />
          </View>
          <View style={{ flex: 1 }}>
            {/*
              This used to say "Practice" and start a whole review session of
              other words. On a screen about one word, that's the wrong verb
              and the wrong destination — it quizzes *this* word now.

              An archived word is paused, so practice isn't the thing to lead
              with; bringing it back is. Practising it stays available in the
              progress card above, and no longer un-archives it either way.
            */}
            {word.status === "archived" ? (
              <Button
                title={t("word.restore")}
                variant="primary"
                size="lg"
                fullWidth
                icon="refresh-outline"
                loading={archive.isPending}
                onPress={() => setArchived(false)}
              />
            ) : (
              <Button
                title={t("quiz.testMe")}
                variant="primary"
                size="lg"
                fullWidth
                icon="help-circle-outline"
                onPress={() => router.push(`/quiz/${word.id}`)}
              />
            )}
          </View>
        </View>
      </Screen>

      {/* ── sheets ── */}
      <Sheet ref={actions} title={t("sheet.wordActions")}>
        <SheetAction
          icon={word.is_favorite ? "star" : "star-outline"}
          label={t(word.is_favorite ? "word.unfavorite" : "word.favorite")}
          onPress={() => {
            update.mutate({ is_favorite: !word.is_favorite });
            actions.current?.close();
          }}
        />
        <SheetAction
          icon="create-outline"
          label={t("word.editTranslation")}
          sublabel={t("word.editTranslationHint")}
          onPress={openEditor}
        />
        <SheetAction
          icon={word.status === "archived" ? "refresh-outline" : "archive-outline"}
          label={t(word.status === "archived" ? "word.restore" : "word.archive")}
          sublabel={t(
            word.status === "archived" ? "word.restoreHint" : "word.archiveHint",
          )}
          onPress={() => {
            actions.current?.close();
            void setArchived(word.status !== "archived");
          }}
        />
        <SheetAction
          icon="trash-outline"
          label={t("common.delete")}
          danger
          onPress={() => {
            actions.current?.close();
            setTimeout(() => deleteSheet.current?.open(), 260);
          }}
        />
      </Sheet>

      {/*
        This used to be "report an error", which wrote a row into a table
        nothing ever read — a button that promised an action that never came.
        The user's actual goal was a correct translation, so they just make
        one. It's theirs alone: the dictionary entry is shared cache.
      */}
      <Sheet ref={editSheet} title={t("word.editTranslation")}>
        <View style={{ gap: spacing.md }}>
          <Text variant="caption" tone="muted">
            {t("word.editTranslationBody")}
          </Text>

          <Input
            label={t("word.translationLabel")}
            value={draft}
            onChangeText={setDraft}
            placeholder={dictTranslation}
            maxLength={200}
            multiline
            style={{ minHeight: 64, textAlignVertical: "top" }}
          />

          <View
            style={{
              backgroundColor: colors.sunken,
              padding: spacing.md,
              borderRadius: radius.md,
              gap: 2,
            }}
          >
            <Text variant="micro" tone="faint">
              {t("word.originalTranslation")}
            </Text>
            <Text variant="caption" tone="muted">
              {dictTranslation || "—"}
            </Text>
          </View>

          <Button
            title={t("common.save")}
            size="lg"
            fullWidth
            loading={update.isPending}
            disabled={draft.trim().length === 0}
            onPress={() => saveTranslation(draft.trim())}
          />
          {word.custom_translation ? (
            <Button
              title={t("word.resetTranslation")}
              variant="ghost"
              size="lg"
              fullWidth
              onPress={() => saveTranslation(null)}
            />
          ) : null}
        </View>
      </Sheet>

      <Sheet ref={deleteSheet}>
        <ConfirmBody
          title={t("sheet.deleteWordTitle")}
          body={t("word.deleteBody", { word: word.entry.lemma })}
          confirmLabel={t("common.delete")}
          cancelLabel={t("common.cancel")}
          loading={remove.isPending}
          onCancel={() => deleteSheet.current?.close()}
          onConfirm={async () => {
            await remove.mutateAsync(word.id);
            deleteSheet.current?.close();
            goBack();
          }}
        />
      </Sheet>
    </KeyboardAvoidingView>
  );
}

function RoundBtn({
  icon,
  color,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  onPress: () => void;
}) {
  const { colors, radius, minTouch } = useTheme();
  return (
    <Touchable
      onPress={onPress}
      haptic="select"
      scaleTo={PRESS_SCALE_SMALL}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: minTouch - 8,
        height: minTouch - 8,
        borderRadius: radius.pill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.glassStrong,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Ionicons name={icon} size={19} color={color} />
    </Touchable>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        gap: 2,
        paddingVertical: spacing.md,
        backgroundColor: colors.sunken,
        borderRadius: radius.md,
      }}
    >
      <Text variant="bodyStrong">{value}</Text>
      <Text variant="micro" tone="faint" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

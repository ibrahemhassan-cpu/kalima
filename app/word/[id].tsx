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
  Screen,
  StatusBadge,
  Surface,
  Text,
  Touchable,
} from "@/components/ui";
import { Sheet, type SheetRef } from "@/components/ui/Sheet";
import { ConfirmBody, SheetAction } from "@/components/ui/SheetAction";
import { EntryBody } from "@/components/word/EntryBody";
import { useTheme } from "@/theme/ThemeProvider";
import {
  formatDue,
  useDeleteWord,
  useReportWord,
  useUpdateWord,
  useWordDetail,
} from "@/api/words";

export default function WordDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius, minTouch } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: word, isLoading, error } = useWordDetail(id);
  const update = useUpdateWord(id);
  const remove = useDeleteWord();
  const report = useReportWord();

  const actions = useRef<SheetRef>(null);
  const reportSheet = useRef<SheetRef>(null);
  const deleteSheet = useRef<SheetRef>(null);

  const [note, setNote] = useState("");
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (word && !dirty) setNote(word.personal_note ?? "");
  }, [word, dirty]);

  if (isLoading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </Screen>
    );
  }

  if (error || !word) {
    return (
      <Screen>
        <Header onBack={() => router.back()} />
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
          onBack={() => router.back()}
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

        <EntryBody entry={word.entry} />

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

            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <Metric label={t("word.reviews")} value={word.repetitions} />
              <Metric label={t("word.lapses")} value={word.lapses} />
              <Metric
                label={t("word.interval")}
                value={
                  word.interval_days < 1
                    ? t("due.lessThanDay")
                    : t("due.daysShort", { count: Math.round(word.interval_days) })
                }
              />
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
                  await update.mutateAsync({ personal_note: note.trim() || null });
                  setDirty(false);
                  setStatus(t("common.saved"));
                }}
              />
            ) : null}
          </View>
        </Surface>

        {status ? (
          <Text variant="caption" tone="muted" center>
            {status}
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
              title="Edit"
              variant="secondary"
              size="lg"
              fullWidth
              onPress={() => actions.current?.open()}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Practice"
              variant="primary"
              size="lg"
              fullWidth
              icon="play"
              onPress={() => router.push("/session/review")}
            />
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
          icon="flag-outline"
          label={t("word.reportTitle")}
          sublabel={t("word.reportSubtitle")}
          onPress={() => {
            actions.current?.close();
            setTimeout(() => reportSheet.current?.open(), 260);
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

      <Sheet ref={reportSheet} title={t("word.reportTitle")}>
        <Text variant="caption" tone="muted">
          {t("word.reportSubtitle")}
        </Text>
        <SheetAction
          icon="language-outline"
          label={t("word.reportTranslation")}
          onPress={() => {
            report.mutate({
              entryId: word.entry.id,
              reason: "wrong_translation",
            });
            reportSheet.current?.close();
            setStatus(t("word.reportThanks"));
          }}
        />
        <SheetAction
          icon="chatbox-outline"
          label={t("word.reportExample")}
          onPress={() => {
            report.mutate({ entryId: word.entry.id, reason: "bad_example" });
            reportSheet.current?.close();
            setStatus(t("word.reportThanks"));
          }}
        />
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
            router.back();
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
      scaleTo={0.9}
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
        {String(label).toUpperCase()}
      </Text>
    </View>
  );
}

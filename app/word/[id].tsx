import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  Badge,
  Button,
  Card,
  Input,
  Screen,
  StatusBadge,
  Text,
} from "@/components/ui";
import { AuthHeader } from "@/features/auth/AuthHeader";
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
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();

  const { data: word, isLoading, error } = useWordDetail(id);
  const update = useUpdateWord(id);
  const remove = useDeleteWord();
  const report = useReportWord();

  const [note, setNote] = useState("");
  const [noteDirty, setNoteDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (word && !noteDirty) setNote(word.personal_note ?? "");
  }, [word, noteDirty]);

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
        <AuthHeader title="" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md }}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textFaint} />
          <Text variant="body" tone="muted">
            ما لقيناش الكلمة دي
          </Text>
        </View>
      </Screen>
    );
  }

  function confirmDelete() {
    Alert.alert(
      "حذف الكلمة",
      `هتتشال «${word!.entry.lemma}» من مكتبتك مع كل تقدّمك فيها. متأكد؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "احذف",
          style: "destructive",
          onPress: async () => {
            await remove.mutateAsync(word!.id);
            router.back();
          },
        },
      ],
    );
  }

  function reportProblem() {
    Alert.alert("إيه المشكلة؟", "هنراجعها ونصلّحها للجميع", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "الترجمة غلط",
        onPress: () => {
          report.mutate({ entryId: word!.entry.id, reason: "wrong_translation" });
          setStatus("شكرًا، وصلنا البلاغ");
        },
      },
      {
        text: "المثال مش مظبوط",
        onPress: () => {
          report.mutate({ entryId: word!.entry.id, reason: "bad_example" });
          setStatus("شكرًا، وصلنا البلاغ");
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen scroll>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <AuthHeader title="" onBack={() => router.back()} />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <IconBtn
              icon={word.is_favorite ? "star" : "star-outline"}
              color={word.is_favorite ? colors.accent : colors.textMuted}
              label={word.is_favorite ? "شيل من المفضلة" : "ضيف للمفضلة"}
              onPress={() => update.mutate({ is_favorite: !word.is_favorite })}
            />
            <IconBtn
              icon="flag-outline"
              color={colors.textMuted}
              label="بلّغ عن خطأ"
              onPress={reportProblem}
            />
            <IconBtn
              icon="trash-outline"
              color={colors.danger}
              label="احذف الكلمة"
              onPress={confirmDelete}
            />
          </View>
        </View>

        <EntryBody entry={word.entry} />

        {/* التقدّم */}
        <Card>
          <View style={{ gap: spacing.md }}>
            <Text variant="heading">تقدّمك</Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <StatusBadge status={word.status} />
              <Badge
                label={formatDue(word.due_at)}
                tone="neutral"
                icon="time-outline"
              />
            </View>

            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <Metric label="مراجعات" value={word.repetitions} />
              <Metric label="نسيتها" value={word.lapses} />
              <Metric
                label="الفترة"
                value={
                  word.interval_days < 1
                    ? "< يوم"
                    : `${Math.round(word.interval_days)} يوم`
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
                  الكلمة دي بتتنسي منك كتير. جرّب تكتب ملاحظة شخصية تربطها بحاجة
                  تفتكرها — ده بيساعد جدًا.
                </Text>
              </View>
            ) : null}
          </View>
        </Card>

        {/* الملاحظة الشخصية */}
        <Card>
          <View style={{ gap: spacing.md }}>
            <Input
              label="ملاحظتي"
              value={note}
              onChangeText={(v) => {
                setNote(v);
                setNoteDirty(true);
                setStatus(null);
              }}
              placeholder="أي حاجة تفكّرك بالكلمة"
              multiline
              numberOfLines={3}
              style={{ minHeight: 90, textAlignVertical: "top" }}
            />
            {noteDirty ? (
              <Button
                title="احفظ الملاحظة"
                variant="secondary"
                fullWidth
                loading={update.isPending}
                onPress={async () => {
                  await update.mutateAsync({ personal_note: note.trim() || null });
                  setNoteDirty(false);
                  setStatus("اتحفظت");
                }}
              />
            ) : null}
          </View>
        </Card>

        {status ? (
          <Text variant="caption" tone="muted" center>
            {status}
          </Text>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function IconBtn({
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
    <Ionicons
      name={icon}
      size={22}
      color={color}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      suppressHighlighting
      style={{
        width: minTouch,
        height: minTouch,
        lineHeight: minTouch,
        textAlign: "center",
        borderRadius: radius.pill,
        backgroundColor: colors.surfaceAlt,
        overflow: "hidden",
      }}
    />
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
        backgroundColor: colors.surfaceAlt,
        borderRadius: radius.md,
      }}
    >
      <Text variant="bodyStrong">{value}</Text>
      <Text variant="caption" tone="faint">
        {label}
      </Text>
    </View>
  );
}

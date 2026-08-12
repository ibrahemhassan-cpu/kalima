import React, { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";

import { Badge, Button, Card, Input, Screen, Text } from "@/components/ui";
import { AuthHeader } from "@/features/auth/AuthHeader";
import { EntryBody } from "@/components/word/EntryBody";
import { useTheme } from "@/theme/ThemeProvider";
import {
  EnrichError,
  enrichWord,
  useAddWord,
  useDictionarySearch,
  type EnrichResponse,
} from "@/api/words";

type Phase = "input" | "loading" | "result";

export default function AddWord() {
  const { colors, spacing, radius, minTouch } = useTheme();
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

  // اقتراحات من الكاش أثناء الكتابة
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 250);
    return () => clearTimeout(t);
  }, [term]);
  const { data: suggestions } = useDictionarySearch(
    phase === "input" ? debounced : "",
  );

  async function lookup(word: string) {
    setError(null);
    setErrorCode(null);
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
      setPhase("input");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  async function save() {
    if (!result) return;
    try {
      await addWord.mutateAsync({
        entryId: result.entry.id,
        note: note.trim() || undefined,
      });
      void qc.invalidateQueries({ queryKey: ["home-summary"] });
      router.back();
    } catch {
      setError("ما قدرناش نحفظ الكلمة. جرّب تاني");
    }
  }

  // ── حالة التحميل ─────────────────────────────────────────
  if (phase === "loading") {
    return (
      <Screen>
        <AuthHeader title="" onBack={() => setPhase("input")} />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.lg,
          }}
        >
          <ActivityIndicator size="large" color={colors.brand} />
          <Text variant="title" ltr>
            {term.trim()}
          </Text>
          <Text variant="body" tone="muted" center>
            بنجهّز الترجمة والأمثلة والنطق...
          </Text>
          <Text variant="caption" tone="faint" center>
            ممكن تاخد شوية لو الكلمة جديدة علينا
          </Text>
        </View>
      </Screen>
    );
  }

  // ── حالة النتيجة ─────────────────────────────────────────
  if (phase === "result" && result) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Screen scroll>
          <AuthHeader
            title=""
            onBack={() => {
              setPhase("input");
              setResult(null);
              setNote("");
            }}
          />

          {result.cached ? (
            <Badge label="من القاموس — فوري" tone="success" icon="flash-outline" />
          ) : (
            <Badge
              label={`اتولّدت دلوقتي · فاضلك ${result.ai_remaining ?? "?"} النهاردة`}
              tone="brand"
              icon="sparkles-outline"
            />
          )}

          <EntryBody entry={result.entry} />

          <Card>
            <View style={{ gap: spacing.md }}>
              <Input
                label="ملاحظتي (اختياري)"
                value={note}
                onChangeText={setNote}
                placeholder="أي حاجة تفكّرك بالكلمة"
                multiline
                numberOfLines={3}
                style={{ minHeight: 90, textAlignVertical: "top" }}
              />
            </View>
          </Card>

          {error ? (
            <Text variant="caption" tone="danger" center>
              {error}
            </Text>
          ) : null}

          <Button
            title="احفظ الكلمة"
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

  // ── حالة الإدخال ─────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen scroll>
        <AuthHeader
          title="أضف كلمة"
          subtitle="اكتب أي كلمة إنجليزية وإحنا نجيبلك الباقي"
          onBack={() => router.back()}
        />

        <Input
          english
          value={term}
          onChangeText={(v) => {
            setTerm(v);
            setError(null);
          }}
          placeholder="resilient"
          autoFocus
          returnKeyType="search"
          onSubmitEditing={() => term.trim() && lookup(term)}
          error={error ?? undefined}
          style={{ fontSize: 22, minHeight: 62 }}
        />

        {errorCode === "rate_limited" ? (
          <Card tone="brand">
            <Text variant="caption" tone="muted">
              الحد اليومي بيحمي الخدمة من الاستنزاف عشان تفضل مجانية. مراجعة كلماتك
              المحفوظة مالهاش أي حد.
            </Text>
          </Card>
        ) : null}

        <Button
          title="هات الكلمة"
          size="lg"
          fullWidth
          icon="sparkles-outline"
          disabled={term.trim().length < 2}
          onPress={() => lookup(term)}
        />

        {/* اقتراحات من الكاش */}
        {suggestions && suggestions.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="label" tone="muted">
              موجودة عندنا خلاص
            </Text>
            {suggestions.map((s) => (
              <Pressable
                key={s.entry_id}
                accessibilityRole="button"
                accessibilityLabel={`${s.lemma}، ${s.ar_preview}`}
                onPress={() => {
                  setTerm(s.lemma);
                  void lookup(s.lemma);
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                  minHeight: minTouch,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
                })}
              >
                <Ionicons name="flash-outline" size={18} color={colors.success} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" ltr>
                    {s.lemma}
                  </Text>
                  <Text variant="caption" tone="muted" numberOfLines={1}>
                    {s.ar_preview}
                  </Text>
                </View>
                {s.already_mine ? (
                  <Badge label="عندك" tone="neutral" icon="checkmark-outline" />
                ) : null}
              </Pressable>
            ))}
          </View>
        ) : null}

        <Card>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
            <Text variant="caption" tone="muted" style={{ flex: 1 }}>
              الترجمات مولّدة بالذكاء الاصطناعي وممكن تحتوي أخطاء. تقدر تبلّغنا عن أي
              خطأ من شاشة الكلمة.
            </Text>
          </View>
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
}

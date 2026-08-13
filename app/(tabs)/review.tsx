import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { Button, Enter, Header, Screen, Surface, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { useDueWords } from "@/api/review";
import { formatDue } from "@/api/words";

export default function ReviewTab() {
  const { colors, spacing, radius, shadow } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: due, isLoading, refetch } = useDueWords(40);
  const count = due?.length ?? 0;

  return (
    <Screen scroll>
      <Header title={t("review.title")} />

      {isLoading ? (
        <View style={{ paddingVertical: spacing.xxxl, alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : count > 0 ? (
        <Enter>
          <Surface tone="glass" elevation="lg" radiusKey="xxl" padded={spacing.xl}>
            <View style={{ alignItems: "center", gap: spacing.lg }}>
              <View
                style={[
                  {
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  },
                  shadow.brand,
                ]}
              >
                <LinearGradient
                  colors={[colors.brand, colors.brandAlt]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: "absolute", inset: 0 }}
                />
                <Text variant="display" style={{ color: colors.onBrand }}>
                  {count}
                </Text>
              </View>

              <View style={{ alignItems: "center", gap: spacing.xs }}>
                <Text variant="title" center>
                  {t("home.dueCount", { count })}
                </Text>
                <Text variant="body" tone="muted" center>
                  {t("home.dueSubtitle")}
                </Text>
              </View>

              <Button
                title={t("home.startReview")}
                size="lg"
                fullWidth
                icon="play"
                onPress={() => router.push("/session/review")}
              />
            </View>
          </Surface>
        </Enter>
      ) : (
        <Enter>
          <Surface tone="glass" elevation="md" radiusKey="xxl" padded={spacing.xl}>
            <View style={{ alignItems: "center", gap: spacing.lg }}>
              <View
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.successSoft,
                }}
              >
                <Ionicons name="checkmark" size={44} color={colors.success} />
              </View>
              <Text variant="title" center>
                {t("review.nothingDueTitle")}
              </Text>
              <Text variant="body" tone="muted" center>
                {t("home.allDoneSubtitle")}
              </Text>
              <Button
                title={t("home.addWord")}
                variant="secondary"
                size="lg"
                fullWidth
                icon="add"
                onPress={() => router.push("/add-word")}
              />
            </View>
          </Surface>
        </Enter>
      )}

      {count > 0 ? (
        <Enter index={1}>
          <Surface tone="glass" radiusKey="xl">
            <View style={{ gap: spacing.md }}>
              <Text variant="label" tone="muted">
                {t("home.recent")}
              </Text>
              {due!.slice(0, 5).map((w) => (
                <View
                  key={w.user_word_id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.brand,
                    }}
                  />
                  <Text variant="body" ltr style={{ flex: 1 }}>
                    {w.lemma}
                  </Text>
                  <Text variant="caption" tone="faint">
                    {formatDue(w.due_at, t)}
                  </Text>
                </View>
              ))}
            </View>
          </Surface>
        </Enter>
      ) : null}
    </Screen>
  );
}

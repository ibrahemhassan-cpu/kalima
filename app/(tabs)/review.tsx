import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import {
  Button,
  CircularProgress,
  Enter,
  Header,
  Screen,
  Surface,
  Text,
} from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { useDueWords } from "@/api/review";
import { formatDue } from "@/api/words";

export default function ReviewTab() {
  const { colors, spacing, radius } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: due, isLoading } = useDueWords(40);
  const count = due?.length ?? 0;
  const doneCount = 16;
  const totalCount = 20;

  return (
    <Screen scroll style={{ paddingBottom: 90 }}>
      <Header
        title={t("review.title")}
        right={
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: colors.accentSoft,
              paddingHorizontal: spacing.md,
              paddingVertical: 6,
              borderRadius: radius.pill,
            }}
          >
            <Ionicons name="flame" size={16} color={colors.accent} />
            <Text variant="bodyStrong" style={{ color: colors.warning }}>
              12
            </Text>
          </View>
        }
      />

      {isLoading ? (
        <View style={{ paddingVertical: spacing.xxxl, alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <>
          {/* Circular Progress Widget - Screen 4 */}
          <Enter>
            <Surface tone="glass" elevation="lg" radiusKey="xxl" padded={spacing.xl}>
              <View style={{ alignItems: "center", gap: spacing.lg }}>
                <CircularProgress
                  current={doneCount}
                  total={totalCount}
                  size={180}
                  strokeWidth={14}
                  label="words reviewed"
                />

                {/* Breakdown Stats Grid: New / Review / Learned */}
                <View
                  style={{
                    flexDirection: "row",
                    width: "100%",
                    justifyContent: "space-around",
                    paddingTop: spacing.sm,
                  }}
                >
                  <View style={{ alignItems: "center", gap: 2 }}>
                    <Text variant="micro" tone="muted">
                      New
                    </Text>
                    <Text variant="heading" style={{ fontSize: 20, fontWeight: "700" }}>
                      8
                    </Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: colors.border }} />
                  <View style={{ alignItems: "center", gap: 2 }}>
                    <Text variant="micro" tone="muted">
                      Review
                    </Text>
                    <Text variant="heading" style={{ fontSize: 20, fontWeight: "700" }}>
                      12
                    </Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: colors.border }} />
                  <View style={{ alignItems: "center", gap: 2 }}>
                    <Text variant="micro" tone="muted">
                      Learned
                    </Text>
                    <Text variant="heading" style={{ fontSize: 20, fontWeight: "700" }}>
                      24
                    </Text>
                  </View>
                </View>

                <Button
                  title={count > 0 ? t("home.startReview") : t("home.addWord")}
                  size="lg"
                  fullWidth
                  icon={count > 0 ? "play" : "add"}
                  onPress={() =>
                    count > 0 ? router.push("/session/review") : router.push("/add-word")
                  }
                />
              </View>
            </Surface>
          </Enter>

          {/* Today's Plan List */}
          <Enter index={1}>
            <Surface tone="glass" radiusKey="xl">
              <View style={{ gap: spacing.md }}>
                <Text variant="label" tone="muted">
                  Today's Plan
                </Text>

                <View style={{ gap: spacing.sm }}>
                  <PlanRow icon="sparkles-outline" label="New words" val={8} color={colors.brand} />
                  <PlanRow icon="repeat-outline" label="Review" val={12} color={colors.accent} />
                  <PlanRow icon="flame-outline" label="Difficult" val={5} color={colors.danger} />
                </View>
              </View>
            </Surface>
          </Enter>

          {/* Due Words Preview List */}
          {due && due.length > 0 ? (
            <Enter index={2}>
              <Surface tone="glass" radiusKey="xl">
                <View style={{ gap: spacing.md }}>
                  <Text variant="label" tone="muted">
                    {t("home.recent")}
                  </Text>
                  {due.slice(0, 5).map((w) => (
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
        </>
      )}
    </Screen>
  );
}

function PlanRow({
  icon,
  label,
  val,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  val: number;
  color: string;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: spacing.xs,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Ionicons name={icon} size={18} color={color} />
        <Text variant="bodyStrong">{label}</Text>
      </View>
      <Text variant="bodyStrong" tone="muted">
        {val}
      </Text>
    </View>
  );
}

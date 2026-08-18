import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { Enter, Header, Screen, Surface, Text } from "@/components/ui";
import { PackCard } from "@/components/packs/PackCard";
import { useTheme } from "@/theme/ThemeProvider";
import { useTopicPacks } from "@/api/packs";

export default function Discover() {
  const { colors, spacing, radius } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: packs, isLoading } = useTopicPacks();

  return (
    <Screen scroll tabBar>
      <Header
        title={t("packs.discoverTitle")}
        subtitle={t("packs.discoverSubtitle")}
      />

      {isLoading ? (
        <View style={{ paddingVertical: spacing.xxxl, alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : !packs || packs.length === 0 ? (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.lg,
            paddingVertical: spacing.xxxl,
          }}
        >
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: radius.xl,
              backgroundColor: colors.sunken,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="compass-outline" size={40} color={colors.textFaint} />
          </View>
          <Surface tone="glass" radiusKey="xl">
            <Text variant="body" tone="muted" center>
              {t("packs.empty")}
            </Text>
          </Surface>
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          {packs.map((pack, i) => (
            <Enter key={pack.pack_id} index={i}>
              <PackCard
                pack={pack}
                onPress={() => router.push(`/pack/${pack.pack_id}`)}
              />
            </Enter>
          ))}
        </View>
      )}
    </Screen>
  );
}

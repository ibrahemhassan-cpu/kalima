import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import {
  EmptyState,
  Header,
  Screen,
  SkeletonCard,
  Text,
} from "@/components/ui";
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
          <SkeletonCard lines={2} />
        </View>
      ) : !packs || packs.length === 0 ? (
        <EmptyState
          icon="compass-outline"
          title={t("packs.empty")}
          body={t("packs.discoverSubtitle")}
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {packs.map((pack) => (
            <PackCard
              key={pack.pack_id}
              pack={pack}
              onPress={() => router.push(`/pack/${pack.pack_id}`)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

import React, { useRef } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";

import {
  Avatar,
  Enter,
  Header,
  ListGroup,
  ListRow,
  ProgressBar,
  Screen,
  Surface,
  Text,
  useCountUp,
} from "@/components/ui";
import { Sheet, type SheetRef } from "@/components/ui/Sheet";
import { ConfirmBody } from "@/components/ui/SheetAction";
import { useTheme } from "@/theme/ThemeProvider";
import { useProfile } from "@/api/profile";
import { useAuth } from "@/features/auth/AuthProvider";
import { useSignOut } from "@/features/auth/actions";
import { supabase } from "@/lib/supabase";
import type { HomeSummary } from "@/lib/database.types";

export default function ProfileTab() {
  const { colors, spacing, radius } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const signOut = useSignOut();
  const sheet = useRef<SheetRef>(null);

  const { data: summary } = useQuery({
    queryKey: ["home-summary"],
    queryFn: async (): Promise<HomeSummary> => {
      const { data, error } = await supabase.rpc("get_home_summary");
      if (error) throw error;
      return data as unknown as HomeSummary;
    },
  });

  const name = profile?.display_name ?? "—";
  const level = summary?.level ?? 1;
  const xp = useCountUp(summary?.total_xp ?? 0);

  const inLevel = summary?.xp_this_level ?? 0;
  const span = Math.max(1, (summary?.xp_to_next ?? 0) + inLevel);

  return (
    <>
      <Screen scroll>
      <Header title={t("tabs.profile")} />

      <Enter>
        <Surface tone="glass" elevation="lg" radiusKey="xxl" padded={spacing.xl}>
          <View style={{ alignItems: "center", gap: spacing.md }}>
            <View
              style={{
                padding: 3,
                borderRadius: radius.pill,
                overflow: "hidden",
              }}
            >
              <LinearGradient
                colors={[colors.brand, colors.brandAlt]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: "absolute", inset: 0 }}
              />
              <Avatar uri={profile?.avatar_url} name={name} size={92} />
            </View>

            <View style={{ alignItems: "center", gap: 2 }}>
              <Text variant="title">{name}</Text>
              <Text variant="caption" tone="faint" ltr>
                {user?.email}
              </Text>
            </View>

            <View style={{ alignSelf: "stretch", gap: spacing.sm }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text variant="label" tone="brand">
                  {t("profile.level", { level })}
                </Text>
                <Text variant="caption" tone="muted">
                  {t("profile.xp", { count: xp })}
                </Text>
              </View>
              <ProgressBar value={inLevel / span} height={8} />
            </View>
          </View>
        </Surface>
      </Enter>

      <Enter index={1}>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <MiniStat label={t("profile.statWords")} value={summary?.total_words ?? 0} />
          <MiniStat
            label={t("profile.statMastered")}
            value={summary?.mastered_words ?? 0}
          />
          <MiniStat
            label={t("profile.statStreak")}
            value={summary?.longest_streak ?? 0}
          />
        </View>
      </Enter>

      <Enter index={2}>
        <ListGroup title={t("profile.account")}>
          <ListRow
            icon="person-outline"
            title={t("profile.editProfile")}
            subtitle={t("profile.editProfileHint")}
            onPress={() => router.push("/settings/profile")}
          />
          <ListRow
            icon="trophy-outline"
            title={t("profile.achievements")}
            onPress={() => router.push("/achievements")}
          />
          <ListRow
            icon="settings-outline"
            title={t("profile.settings")}
            onPress={() => router.push("/settings")}
            last
          />
        </ListGroup>
      </Enter>

      <Enter index={3}>
        <ListGroup title={t("profile.about")}>
          <ListRow
            icon="shield-checkmark-outline"
            title={t("profile.privacy")}
            onPress={() => router.push("/legal/privacy")}
          />
          <ListRow
            icon="document-text-outline"
            title={t("profile.terms")}
            onPress={() => router.push("/legal/terms")}
            last
          />
        </ListGroup>
      </Enter>

      <Enter index={4}>
        <ListGroup>
          <ListRow
            icon="log-out-outline"
            title={t("common.signOut")}
            onPress={() => sheet.current?.open()}
            danger
            last
          />
        </ListGroup>
      </Enter>

      <Text variant="caption" tone="faint" center>
        {t("app.version", { v: "0.1.0" })}
      </Text>

      </Screen>

      <Sheet ref={sheet}>
        <ConfirmBody
          title={t("sheet.signOutTitle")}
          body={t("sheet.signOutBody")}
          confirmLabel={t("common.signOut")}
          cancelLabel={t("common.cancel")}
          loading={signOut.isPending}
          onCancel={() => sheet.current?.close()}
          onConfirm={() => {
            sheet.current?.close();
            signOut.mutate();
          }}
        />
      </Sheet>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  const { spacing } = useTheme();
  const shown = useCountUp(value);
  return (
    <Surface tone="glass" radiusKey="lg" padded={spacing.lg} style={{ flex: 1 }}>
      <View style={{ alignItems: "center", gap: 2 }}>
        <Text variant="heading">{shown}</Text>
        <Text variant="micro" tone="faint" center numberOfLines={2}>
          {label.toUpperCase()}
        </Text>
      </View>
    </Surface>
  );
}

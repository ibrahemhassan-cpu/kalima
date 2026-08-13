import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { LinearGradient } from "expo-linear-gradient";

import { Avatar, Button, Header, Input, Screen, Surface, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { useProfile, useUpdateProfile } from "@/api/profile";
import { validateName } from "@/features/auth/errors";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";

export default function EditProfile() {
  const { colors, spacing, radius } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const [name, setName] = useState(profile?.display_name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setStatus(t("profile.photoPermission"));
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (res.canceled || !res.assets[0]?.base64) return;

    setUploading(true);
    setStatus(null);
    try {
      const asset = res.assets[0];
      const ext = asset.mimeType?.includes("png") ? "png" : "jpg";
      const path = `${user!.id}/avatar_${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, decode(asset.base64!), {
          contentType: asset.mimeType ?? "image/jpeg",
          upsert: true,
        });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await update.mutateAsync({ avatar_url: data.publicUrl });
      setStatus(t("common.saved"));
    } catch {
      setStatus(t("profile.photoFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function saveName() {
    const e = validateName(name, t);
    setError(e);
    setStatus(null);
    if (e) return;

    try {
      await update.mutateAsync({ display_name: name.trim() });
      setStatus(t("common.saved"));
    } catch {
      setStatus(t("profile.saveFailed"));
    }
  }

  return (
    <Screen scroll>
      <Header title={t("profile.editProfile")} onBack={() => router.back()} />

      <Surface tone="glass" radiusKey="xxl" elevation="md" padded={spacing.xl}>
        <View style={{ alignItems: "center", gap: spacing.lg }}>
          <View style={{ padding: 3, borderRadius: radius.pill, overflow: "hidden" }}>
            <LinearGradient
              colors={[colors.brand, colors.brandAlt]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", inset: 0 }}
            />
            <Avatar
              uri={profile?.avatar_url}
              name={profile?.display_name ?? "—"}
              size={104}
            />
          </View>
          <Button
            title={t("profile.changePhoto")}
            variant="secondary"
            icon="camera-outline"
            loading={uploading}
            onPress={pickAvatar}
          />
        </View>
      </Surface>

      <Surface tone="glass" radiusKey="xl">
        <View style={{ gap: spacing.lg }}>
          <Input
            label={t("profile.yourName")}
            value={name}
            onChangeText={setName}
            error={error ?? undefined}
            placeholder={t("auth.namePlaceholder")}
          />
          <Input
            label={t("auth.email")}
            english
            value={user?.email ?? ""}
            editable={false}
            hint={t("profile.emailLocked")}
          />
          <Button
            title={t("common.save")}
            size="lg"
            fullWidth
            loading={update.isPending}
            onPress={saveName}
          />
        </View>
      </Surface>

      {status ? (
        <Text variant="caption" tone="muted" center>
          {status}
        </Text>
      ) : null}
    </Screen>
  );
}

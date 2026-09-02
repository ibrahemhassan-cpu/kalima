import React, { useRef, useState } from "react";
import { Image, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import {
  Avatar,
  Button,
  Header,
  Input,
  Screen,
  Surface,
  Text,
  Touchable,
} from "@/components/ui";
import { Sheet, type SheetRef } from "@/components/ui/Sheet";
import { SheetAction } from "@/components/ui/SheetAction";
import { useTheme } from "@/theme/ThemeProvider";
import { useProfile, useUpdateProfile } from "@/api/profile";
import { validateName } from "@/features/auth/errors";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import { useGoBack } from "@/lib/navigation";

export default function EditProfile() {
  const { colors, spacing, radius } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const goBack = useGoBack();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const [name, setName] = useState(profile?.display_name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const photoSheet = useRef<SheetRef>(null);
  const viewSheet = useRef<SheetRef>(null);

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

  const hasPhoto = !!profile?.avatar_url;

  return (
    <>
      <Screen scroll>
      <Header title={t("profile.editProfile")} onBack={() => goBack()} />

      <Surface tone="glass" radiusKey="xxl" elevation="md" padded={spacing.xl}>
        <View style={{ alignItems: "center", gap: spacing.lg }}>
          {/*
            The photo is its own control now.

            A full-width "Change photo" button under the avatar said out loud
            what a small camera badge says by sitting there — and it offered
            only one of the two things you want from a photo. Tapping the badge
            asks which.
          */}
          <Touchable
            onPress={() => photoSheet.current?.open()}
            haptic="select"
            accessibilityRole="button"
            accessibilityLabel={t("profile.photoActions")}
            style={{ borderRadius: radius.pill }}
          >
            <View
              style={{ padding: 3, borderRadius: radius.pill, overflow: "hidden" }}
            >
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

            {/* the badge sits on the rim, bottom-centre, and never clips */}
            <View
              style={{
                position: "absolute",
                bottom: -4,
                alignSelf: "center",
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.brand,
                borderWidth: 3,
                borderColor: colors.card,
              }}
            >
              <Ionicons
                name={uploading ? "hourglass-outline" : "camera"}
                size={17}
                color={colors.onBrand}
              />
            </View>
          </Touchable>
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

      <Sheet ref={photoSheet} title={t("profile.photoActions")}>
        {hasPhoto ? (
          <SheetAction
            icon="expand-outline"
            label={t("profile.viewPhoto")}
            onPress={() => {
              photoSheet.current?.close();
              setTimeout(() => viewSheet.current?.open(), 260);
            }}
          />
        ) : null}
        <SheetAction
          icon="image-outline"
          label={t(hasPhoto ? "profile.changePhoto" : "profile.addPhoto")}
          onPress={() => {
            photoSheet.current?.close();
            void pickAvatar();
          }}
        />
      </Sheet>

      <Sheet ref={viewSheet}>
        <View style={{ alignItems: "center", gap: spacing.lg }}>
          {/*
            The stored avatar is a square crop, so a square frame shows all of
            it with nothing cut off — which is the point of "view".
          */}
          <Image
            source={{ uri: profile?.avatar_url ?? undefined }}
            style={{
              width: "100%",
              aspectRatio: 1,
              borderRadius: radius.xl,
              backgroundColor: colors.sunken,
            }}
            resizeMode="cover"
            accessibilityLabel={t("profile.viewPhoto")}
          />
          <Button
            title={t("profile.changePhoto")}
            variant="secondary"
            fullWidth
            icon="image-outline"
            onPress={() => {
              viewSheet.current?.close();
              void pickAvatar();
            }}
          />
        </View>
      </Sheet>
    </>
  );
}

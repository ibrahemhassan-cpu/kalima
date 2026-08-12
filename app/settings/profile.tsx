import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { Avatar, Button, Card, Input, Screen, Text } from "@/components/ui";
import { AuthHeader } from "@/features/auth/AuthHeader";
import { useTheme } from "@/theme/ThemeProvider";
import { useProfile, useUpdateProfile } from "@/api/profile";
import { validateName } from "@/features/auth/errors";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";

export default function EditProfile() {
  const { spacing } = useTheme();
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
      setStatus("محتاجين إذن الوصول للصور عشان تغيّر صورتك");
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
      setStatus("اتغيّرت الصورة");
    } catch {
      setStatus("ما قدرناش نرفع الصورة. جرّب تاني");
    } finally {
      setUploading(false);
    }
  }

  async function saveName() {
    const e = validateName(name);
    setError(e);
    setStatus(null);
    if (e) return;

    try {
      await update.mutateAsync({ display_name: name.trim() });
      setStatus("اتحفظ");
    } catch {
      setStatus("ما قدرناش نحفظ. اتأكد من الإنترنت");
    }
  }

  return (
    <Screen scroll>
      <AuthHeader title="تعديل البيانات" onBack={() => router.back()} />

      <Card>
        <View style={{ alignItems: "center", gap: spacing.md }}>
          <Avatar
            uri={profile?.avatar_url}
            name={profile?.display_name ?? "متعلّم"}
            size={104}
          />
          <Button
            title="غيّر الصورة"
            variant="secondary"
            icon="camera-outline"
            loading={uploading}
            onPress={pickAvatar}
          />
        </View>
      </Card>

      <Card>
        <View style={{ gap: spacing.lg }}>
          <Input
            label="اسمك"
            value={name}
            onChangeText={setName}
            error={error ?? undefined}
            placeholder="أحمد"
          />
          <Input
            label="الإيميل"
            english
            value={user?.email ?? ""}
            editable={false}
            hint="الإيميل ما ينفعش يتغيّر حاليًا"
          />
          <Button
            title="احفظ"
            size="lg"
            fullWidth
            loading={update.isPending}
            onPress={saveName}
          />
        </View>
      </Card>

      {status ? (
        <Text variant="caption" tone="muted" center>
          {status}
        </Text>
      ) : null}
    </Screen>
  );
}

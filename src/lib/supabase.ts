import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import type { Database } from "./database.types";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "ناقص EXPO_PUBLIC_SUPABASE_URL أو EXPO_PUBLIC_SUPABASE_ANON_KEY.\n" +
      "انسخ .env.example إلى .env واملأ القيم، ثم أعد تشغيل الخادم بـ: npx expo start -c",
  );
}

/**
 * توكن الجلسة في SecureStore (Keychain على iOS و Keystore على أندرويد)
 * مش في AsyncStorage.
 *
 * SecureStore له حد 2048 بايت للقيمة، والجلسة أحيانًا تتخطاه،
 * فنقسّمها على أجزاء.
 */
const CHUNK = 1800;

const SecureAdapter = {
  async getItem(key: string) {
    const head = await SecureStore.getItemAsync(`${key}_0`);
    if (head === null) return null;

    let value = head;
    let i = 1;
    while (true) {
      const part = await SecureStore.getItemAsync(`${key}_${i}`);
      if (part === null) break;
      value += part;
      i += 1;
    }
    return value;
  },

  async setItem(key: string, value: string) {
    // نظّف الأجزاء القديمة أولًا
    await SecureAdapter.removeItem(key);
    const parts = Math.ceil(value.length / CHUNK);
    for (let i = 0; i < parts; i += 1) {
      await SecureStore.setItemAsync(
        `${key}_${i}`,
        value.slice(i * CHUNK, (i + 1) * CHUNK),
      );
    }
  },

  async removeItem(key: string) {
    let i = 0;
    while (true) {
      const part = await SecureStore.getItemAsync(`${key}_${i}`);
      if (part === null) break;
      await SecureStore.deleteItemAsync(`${key}_${i}`);
      i += 1;
    }
  },
};

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage: Platform.OS === "web" ? AsyncStorage : SecureAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const SUPABASE_URL = url;

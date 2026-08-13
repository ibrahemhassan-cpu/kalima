import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

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

/**
 * Deliberately untyped.
 *
 * A hand-written `Database` generic has to mirror every table, view, function
 * and relationship exactly, or supabase-js silently degrades every argument to
 * `never` and every RPC call stops compiling. Keeping the client loose and
 * casting each result to our own domain types (see database.types.ts) gives the
 * same safety at the call site without a type surface we have to maintain.
 *
 * To switch to fully generated types later:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/db.generated.ts
 * then add the generic back.
 */
export const supabase = createClient(url, anonKey, {
  auth: {
    storage: Platform.OS === "web" ? AsyncStorage : SecureAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Supabase's auto-refresh timer keeps running while the app is backgrounded,
 * which burns battery and fires refreshes nobody is waiting for. React Native
 * apps are expected to drive it from AppState instead.
 *
 * Without this, users who leave the app for a few hours come back to an
 * expired session and a confusing bounce to the sign-in screen.
 */
AppState.addEventListener("change", (state) => {
  if (state === "active") void supabase.auth.startAutoRefresh();
  else void supabase.auth.stopAutoRefresh();
});

export const SUPABASE_URL = url;

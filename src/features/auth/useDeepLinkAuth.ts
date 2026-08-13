import { useEffect, useRef } from "react";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

/**
 * Supabase email links land on `kalima://…` with the tokens in the URL
 * fragment (`#access_token=…&type=recovery`). React Native never parses that
 * for us, so we do it by hand and establish the session.
 *
 * Without this, tapping "reset password" in an email opens the app and
 * nothing happens — one of the most common Supabase + Expo bugs.
 */
export function useDeepLinkAuth() {
  const router = useRouter();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    async function handle(url: string | null) {
      if (!url || handled.current === url) return;
      handled.current = url;

      const fragment = url.split("#")[1];
      const query = url.split("?")[1]?.split("#")[0];
      const params = new URLSearchParams(fragment ?? query ?? "");

      const errorCode = params.get("error_code") ?? params.get("error");
      if (errorCode) {
        router.replace("/(auth)/reset-password?expired=1");
        return;
      }

      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      const type = params.get("type");

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (error) {
          router.replace("/(auth)/reset-password?expired=1");
          return;
        }
        if (type === "recovery") {
          router.replace("/(auth)/reset-password");
        }
        return;
      }

      // PKCE style: ?code=…
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && type === "recovery") {
          router.replace("/(auth)/reset-password");
        }
      }
    }

    void Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener("url", (e) => void handle(e.url));
    return () => sub.remove();
  }, [router]);
}

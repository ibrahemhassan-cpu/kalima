import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";

import "@/i18n";
import { ensureRTLAllowed } from "@/i18n/rtl";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";
import { useSettings } from "@/store/settings";
import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { useDeepLinkAuth } from "@/features/auth/useDeepLinkAuth";
import { useProfile } from "@/api/profile";
import { useReminders } from "@/features/notifications/useReminders";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 2, refetchOnWindowFocus: false },
  },
});

export default function RootLayout() {
  useEffect(() => {
    ensureRTLAllowed();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider>
              <RouteGate />
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * حارس التوجيه.
 *
 *   مش مسجّل دخول            → (auth)
 *   مسجّل بس ما كمّلش الترحيب → (onboarding)
 *   جاهز                     → (tabs)
 */
function RouteGate() {
  const { session, initializing } = useAuth();
  const hydrated = useSettings((s) => s.hydrated);
  const { data: profile, isLoading: loadingProfile } = useProfile();

  const segments = useSegments();
  const router = useRouter();

  useDeepLinkAuth();
  useReminders(!!session);

  const waitingForProfile = !!session && loadingProfile;
  const ready = !initializing && hydrated && !waitingForProfile;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;

    const group = segments[0];
    const inAuth = group === "(auth)";
    const inOnboarding = group === "(onboarding)";

    if (!session) {
      if (!inAuth) router.replace("/(auth)/welcome");
      return;
    }

    if (profile && !profile.onboarded_at) {
      if (!inOnboarding) router.replace("/(onboarding)/level");
      return;
    }

    if (inAuth || inOnboarding) router.replace("/(tabs)");
  }, [ready, session, profile, segments, router]);

  if (!ready) return <Booting />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="add-word"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="word/[id]" />
      <Stack.Screen name="session" options={{ animation: "fade" }} />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="settings" options={{ presentation: "card" }} />
      <Stack.Screen name="legal" options={{ presentation: "card" }} />
    </Stack>
  );
}

function Booting() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.bg,
      }}
    >
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );
}

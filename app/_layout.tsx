import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import * as SplashScreen from "expo-splash-screen";

import "@/i18n";
import { ensureRTLAllowed } from "@/i18n/rtl";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { useSettings } from "@/store/settings";
import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { useDeepLinkAuth } from "@/features/auth/useDeepLinkAuth";
import { useProfile } from "@/api/profile";
import { useReminders } from "@/features/notifications/useReminders";
import { useWordWidget } from "@/features/widget/useWordWidget";
import {
  CACHE_MAX_AGE,
  persister,
  queryClient,
  shouldPersist,
} from "@/lib/queryCache";
import { startNetworkWatch, useOnline } from "@/lib/network";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SplashGate } from "@/components/brand/SplashGate";

void SplashScreen.preventAutoHideAsync();



export default function RootLayout() {
  useEffect(() => {
    ensureRTLAllowed();
  }, []);

  // feeds the device's connection into React Query's online manager
  useEffect(() => startNetworkWatch(), []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: CACHE_MAX_AGE,
            // settled, successful, and not one of the unbounded search keys
            dehydrateOptions: {
              shouldDehydrateQuery: (q) =>
                q.state.status === "success" && shouldPersist(q.queryKey),
            },
          }}
        >
          <AuthProvider>
            <ThemeProvider>
              {/* portals every bottom sheet above the whole app */}
              <BottomSheetModalProvider>
                {/*
                  Inside ThemeProvider and i18n so the fallback screen can be
                  themed and translated — a crash screen in the wrong language
                  on a white background is barely better than the white screen.
                */}
                <ErrorBoundary>
                  <RouteGate />
                </ErrorBoundary>
              </BottomSheetModalProvider>
            </ThemeProvider>
          </AuthProvider>
        </PersistQueryClientProvider>
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

  const online = useOnline();
  const segments = useSegments();
  const router = useRouter();

  useDeepLinkAuth();
  useReminders(!!session);
  useWordWidget(!!session);

  /**
   * Offline with nothing cached, the profile query pauses rather than fails —
   * and waiting on a paused query would hold the splash screen open forever.
   * Offline we route on what we already know and let the profile arrive later.
   */
  const waitingForProfile = !!session && loadingProfile && online;
  const ready = !initializing && hydrated && !waitingForProfile;

  useEffect(() => {
    if (!ready) return;

    const group = segments[0];
    const inAuth = group === "(auth)";
    const inOnboarding = group === "(onboarding)";
    /**
     * Privacy and Terms must be reachable *before* signing in — the sign-up
     * screen links to them. Without this exemption the guard bounced the user
     * straight back to Welcome and the links looked broken.
     */
    const isPublic = group === "legal";

    if (!session) {
      if (!inAuth && !isPublic) router.replace("/(auth)/welcome");
      return;
    }

    if (profile && !profile.onboarded_at) {
      if (!inOnboarding && !isPublic) router.replace("/(onboarding)/level");
      return;
    }

    if (inAuth || inOnboarding) router.replace("/(tabs)");
  }, [ready, session, profile, segments, router]);

  return (
    <SplashGate ready={ready}>
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="add-word"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="word/[id]" />
      <Stack.Screen name="pack/[id]" />
      <Stack.Screen name="quiz/[id]" />
      <Stack.Screen name="session" options={{ animation: "fade" }} />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="settings" options={{ presentation: "card" }} />
      {/* legal slides up like a sheet — it's a detour, not a destination */}
      <Stack.Screen
        name="legal"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
    </Stack>
    </SplashGate>
  );
}


import { useCallback } from "react";
import { useRouter } from "expo-router";

/**
 * Back, with somewhere to land.
 *
 * `router.back()` only works when this screen has history behind it. Both
 * widgets deep-link straight to `kalima:///word/<id>`, so opening the app from
 * one puts you on the word screen as the *first* route — and the back button
 * then did nothing but log:
 *
 *   The action 'GO_BACK' was not handled by any navigator
 *
 * A notification or any future link has the same shape. Falling back to the
 * tabs gives the arrow something to do; the route guard in app/_layout.tsx
 * redirects from there if the session isn't ready, so this is safe to use on
 * the auth and onboarding screens too.
 */
export function useGoBack(fallback = "/(tabs)") {
  const router = useRouter();

  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback as never);
  }, [router, fallback]);
}

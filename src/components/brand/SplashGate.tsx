import React from "react";
import { StyleSheet, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import Animated, { FadeOut } from "react-native-reanimated";

import { AnimatedLogo } from "./AnimatedLogo";
import { SPLASH_BACKGROUND } from "@/theme/colors";
import { duration } from "@/theme/motion";

/**
 * Covers the app until it is genuinely ready, and hands over on the logo.
 *
 * The native splash is a still image and can't animate, so it does one job:
 * bridge the black frames before React mounts. The moment it does, we hide it
 * and this takes over with the same mark on the same ground — the seam is
 * invisible — then assembles it while the session and cache load behind.
 *
 * It never waits *only* on the animation, and never leaves *only* when the data
 * lands. Both have to be true, so a fast launch still reads as deliberate and a
 * slow one never strands anyone on a finished animation.
 */
export function SplashGate({
  ready,
  children,
}: {
  ready: boolean;
  children: React.ReactNode;
}) {
  const [played, setPlayed] = React.useState(false);

  // Swap the still image for the animated one as early as we can.
  React.useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {});
  }, []);

  const done = ready && played;

  return (
    <View style={{ flex: 1 }}>
      {/*
        Nothing below mounts until the session is known. Rendering the whole
        navigator behind the cover meant Home fired its queries before we knew
        whether anyone was signed in — every cold start made three requests
        that a signed-out user would never be allowed to make.

        Children mount while the cover is still opaque, so they are painted
        before it fades rather than popping in behind it.
      */}
      {ready ? children : null}

      {!done ? (
        <Animated.View
          exiting={FadeOut.duration(duration.slow)}
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              // the one colour app.json also paints, so the handover is seamless
              backgroundColor: SPLASH_BACKGROUND,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <AnimatedLogo size={132} onDone={() => setPlayed(true)} />
        </Animated.View>
      ) : null}
    </View>
  );
}

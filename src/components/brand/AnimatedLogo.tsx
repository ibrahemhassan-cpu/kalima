import React from "react";
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const APath = Animated.createAnimatedComponent(Path);
const AG = Animated.createAnimatedComponent(G);

/** Length of the stem path, for the draw-on. */
const STEM_LENGTH = 126;

/**
 * The mark, assembling itself.
 *
 * The order is the meaning, not decoration: the card arrives, the bookmark is
 * placed on it, then a stem grows out of the bookmark and puts out two leaves.
 * That is the product in one gesture — a word you save is a thing you plant.
 * It runs once, on launch, and never again.
 */
export function AnimatedLogo({
  size = 132,
  onDone,
}: {
  size?: number;
  onDone?: () => void;
}) {
  const reduced = useReducedMotion();

  const card = useSharedValue(reduced ? 1 : 0);
  const mark = useSharedValue(reduced ? 1 : 0);
  const stem = useSharedValue(reduced ? 0 : STEM_LENGTH);
  const leafR = useSharedValue(reduced ? 1 : 0);
  const leafL = useSharedValue(reduced ? 1 : 0);

  /**
   * Held in a ref so the effect below never lists it as a dependency.
   * Callers naturally pass an inline arrow, which is a new identity on every
   * render — with it in the deps the whole assembly restarted from zero each
   * time the parent re-rendered, which during startup is several times.
   */
  const done = React.useRef(onDone);
  done.current = onDone;

  React.useEffect(() => {
    if (reduced) {
      done.current?.();
      return;
    }

    const ease = Easing.out(Easing.cubic);

    card.value = withTiming(1, { duration: 340, easing: ease });
    mark.value = withDelay(180, withTiming(1, { duration: 300, easing: ease }));
    stem.value = withDelay(400, withTiming(0, { duration: 380, easing: ease }));
    leafR.value = withDelay(640, withTiming(1, { duration: 260, easing: ease }));
    leafL.value = withDelay(740, withTiming(1, { duration: 260, easing: ease }));

    const id = setTimeout(() => done.current?.(), 1100);
    return () => clearTimeout(id);
  }, [reduced, card, mark, stem, leafR, leafL]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: card.value,
    transform: [{ scale: 0.88 + card.value * 0.12 }],
  }));

  // the bookmark unrolls downward from where it is pinned
  const markProps = useAnimatedProps(() => ({
    opacity: mark.value,
    scaleY: mark.value,
  }));

  const stemProps = useAnimatedProps(() => ({
    strokeDashoffset: stem.value,
  }));

  const leafRProps = useAnimatedProps(() => ({
    opacity: leafR.value,
    scale: leafR.value,
  }));

  const leafLProps = useAnimatedProps(() => ({
    opacity: leafL.value,
    scale: leafL.value,
  }));

  return (
    <Animated.View style={cardStyle}>
      <Svg width={size} height={size} viewBox="0 0 512 512">
        <Defs>
          <LinearGradient id="kalimaBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#5B5BF5" />
            <Stop offset="100%" stopColor="#8B5CF6" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="512" height="512" rx="116" fill="url(#kalimaBg)" />

        {/* the bookmark */}
        <APath
          animatedProps={markProps}
          origin="256, 128"
          fill="#FFFFFF"
          d="M168 157c0-16 13-29 29-29h118c16 0 29 13 29 29v243c0 6.6-7.4 10.5-12.9 6.8L256 358.5l-75.1 48.3c-5.5 3.7-12.9-.2-12.9-6.8V157z"
        />

        {/* the stem, drawing upward from its base */}
        <APath
          animatedProps={stemProps}
          d="M256 322V196"
          stroke="#4257F5"
          strokeWidth={15}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={STEM_LENGTH}
        />

        {/* the leaves, opening off the stem */}
        <AG animatedProps={leafRProps} originX={262} originY={240}>
          <Path fill="#4257F5" d="M258 250 Q318.6 253.6 330 194 Q269.4 190.4 258 250 Z" />
        </AG>
        <AG animatedProps={leafLProps} originX={250} originY={272}>
          <Path fill="#4257F5" d="M254 289 Q241.7 237.7 189 241 Q201.3 292.3 254 289 Z" />
        </AG>
      </Svg>
    </Animated.View>
  );
}

/**
 * ARCTIC AURORA BACKGROUND COMPONENT
 * Renders an atmospheric, slowly undulating two-color Northern Lights effect
 * across the upper 20-30% of the viewport.
 * 
 * Strict specifications:
 * - Exactly two chromatic colors per palette from AURORA_PALETTES
 * - Reanimated UI-thread transforms with zero JS re-renders per frame
 * - Lifecycle pause on AppState inactive / Screen unfocused
 * - Native Reduced Motion support with peaceful static atmospheric fallback
 * - Natural bottom fade into #0D0E10 canvas
 * - pointerEvents="none" to prevent touch interception
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  AppState,
  AppStateStatus,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Path,
} from 'react-native-svg';
import {
  AURORA_PALETTES,
  AuroraSection,
  AuroraPalette,
} from '../../design/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AURORA_HEIGHT = 280;

interface AuroraBackgroundProps {
  section?: AuroraSection;
  palette?: AuroraPalette;
  intensity?: 'subtle' | 'standard' | 'off';
  height?: number;
  isFocused?: boolean;
  children?: React.ReactNode;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  section = 'home',
  palette: customPalette,
  intensity = 'standard',
  height = AURORA_HEIGHT,
  isFocused = true,
  children,
}) => {
  const activePalette = customPalette || AURORA_PALETTES[section] || AURORA_PALETTES.home;

  const [reduceMotion, setReduceMotion] = useState(false);
  const [appActive, setAppActive] = useState(true);

  // Reanimated shared values for UI-thread animation
  const primaryTranslateX = useSharedValue(0);
  const primaryTranslateY = useSharedValue(0);
  const primaryScale = useSharedValue(1);
  const primaryOpacity = useSharedValue(intensity === 'subtle' ? 0.45 : 0.75);

  const secondaryTranslateX = useSharedValue(0);
  const secondaryTranslateY = useSharedValue(0);
  const secondaryScale = useSharedValue(1);
  const secondaryOpacity = useSharedValue(intensity === 'subtle' ? 0.35 : 0.65);

  // Check system reduce-motion setting
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      sub?.remove();
    };
  }, []);

  // Monitor AppState to pause animations when in background
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      setAppActive(nextState === 'active');
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
    };
  }, []);

  const shouldAnimate = !reduceMotion && appActive && isFocused && intensity !== 'off';

  useEffect(() => {
    if (!shouldAnimate) {
      cancelAnimation(primaryTranslateX);
      cancelAnimation(primaryTranslateY);
      cancelAnimation(primaryScale);
      cancelAnimation(primaryOpacity);

      cancelAnimation(secondaryTranslateX);
      cancelAnimation(secondaryTranslateY);
      cancelAnimation(secondaryScale);
      cancelAnimation(secondaryOpacity);

      primaryTranslateX.value = 0;
      primaryTranslateY.value = 0;
      primaryScale.value = 1;

      secondaryTranslateX.value = 0;
      secondaryTranslateY.value = 0;
      secondaryScale.value = 1;
      return;
    }

    const baseOpacityPrimary = intensity === 'subtle' ? 0.45 : 0.8;
    const baseOpacitySecondary = intensity === 'subtle' ? 0.35 : 0.7;

    // Primary wave loop (18-22 seconds)
    primaryTranslateX.value = withRepeat(
      withTiming(20, { duration: 18000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    primaryTranslateY.value = withRepeat(
      withTiming(14, { duration: 22000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    primaryScale.value = withRepeat(
      withTiming(1.08, { duration: 20000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    primaryOpacity.value = withRepeat(
      withTiming(baseOpacityPrimary * 0.8, { duration: 16000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Secondary wave loop (22-26 seconds counter-flow)
    secondaryTranslateX.value = withRepeat(
      withTiming(-22, { duration: 24000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    secondaryTranslateY.value = withRepeat(
      withTiming(-12, { duration: 20000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    secondaryScale.value = withRepeat(
      withTiming(0.94, { duration: 26000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    secondaryOpacity.value = withRepeat(
      withTiming(baseOpacitySecondary * 0.85, { duration: 19000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    return () => {
      cancelAnimation(primaryTranslateX);
      cancelAnimation(primaryTranslateY);
      cancelAnimation(primaryScale);
      cancelAnimation(primaryOpacity);

      cancelAnimation(secondaryTranslateX);
      cancelAnimation(secondaryTranslateY);
      cancelAnimation(secondaryScale);
      cancelAnimation(secondaryOpacity);
    };
  }, [shouldAnimate, intensity]);

  const animatedPrimaryStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: primaryTranslateX.value },
      { translateY: primaryTranslateY.value },
      { scale: primaryScale.value },
    ],
    opacity: primaryOpacity.value,
  }));

  const animatedSecondaryStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: secondaryTranslateX.value },
      { translateY: secondaryTranslateY.value },
      { scale: secondaryScale.value },
    ],
    opacity: secondaryOpacity.value,
  }));

  if (intensity === 'off') {
    return (
      <View style={[styles.root, { backgroundColor: '#0D0E10' }]}>
        {children}
      </View>
    );
  }

  const svgWidth = Math.max(SCREEN_WIDTH, 400);

  return (
    <View style={styles.root}>
      {/* Background Aurora Lighting Canvas */}
      <View
        pointerEvents="none"
        style={[styles.auroraContainer, { height }]}
      >
        {/* Primary Color Wave Layer */}
        <Animated.View style={[StyleSheet.absoluteFill, animatedPrimaryStyle]}>
          <Svg height={height} width={svgWidth * 1.2} style={styles.svgShiftPrimary}>
            <Defs>
              <RadialGradient
                id={`prim-grad-${section}`}
                cx="35%"
                cy="15%"
                rx="65%"
                ry="45%"
                fx="35%"
                fy="15%"
              >
                <Stop offset="0%" stopColor={activePalette.primary} stopOpacity="0.85" />
                <Stop offset="50%" stopColor={activePalette.primary} stopOpacity="0.4" />
                <Stop offset="100%" stopColor="#0D0E10" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Path
              d={`M0,0 L${svgWidth * 1.2},0 L${svgWidth * 1.2},${height * 0.8} Q${svgWidth * 0.6},${height * 1.05} 0,${height * 0.75} Z`}
              fill={`url(#prim-grad-${section})`}
            />
          </Svg>
        </Animated.View>

        {/* Secondary Color Wave Layer */}
        <Animated.View style={[StyleSheet.absoluteFill, animatedSecondaryStyle]}>
          <Svg height={height} width={svgWidth * 1.2} style={styles.svgShiftSecondary}>
            <Defs>
              <RadialGradient
                id={`sec-grad-${section}`}
                cx="65%"
                cy="25%"
                rx="60%"
                ry="45%"
                fx="65%"
                fy="25%"
              >
                <Stop offset="0%" stopColor={activePalette.secondary} stopOpacity="0.8" />
                <Stop offset="55%" stopColor={activePalette.secondary} stopOpacity="0.3" />
                <Stop offset="100%" stopColor="#0D0E10" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Path
              d={`M0,0 L${svgWidth * 1.2},0 L${svgWidth * 1.2},${height * 0.7} Q${svgWidth * 0.5},${height * 0.6} 0,${height * 0.85} Z`}
              fill={`url(#sec-grad-${section})`}
            />
          </Svg>
        </Animated.View>

        {/* Atmospheric Bottom Melt Layer — guarantees 100% natural transition into #0D0E10 */}
        <Svg height={height} width={svgWidth * 1.2} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={`melt-grad-${section}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#0D0E10" stopOpacity="0" />
              <Stop offset="55%" stopColor="#0D0E10" stopOpacity="0.1" />
              <Stop offset="85%" stopColor="#0D0E10" stopOpacity="0.75" />
              <Stop offset="100%" stopColor="#0D0E10" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={svgWidth * 1.2} height={height} fill={`url(#melt-grad-${section})`} />
        </Svg>
      </View>

      {/* Screen Content Layer */}
      <View style={styles.contentLayer} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0E10',
  },
  auroraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 0,
    elevation: 0,
  },
  contentLayer: {
    flex: 1,
    zIndex: 1,
    elevation: 1,
  },
  svgShiftPrimary: {
    position: 'absolute',
    top: -20,
    left: -30,
  },
  svgShiftSecondary: {
    position: 'absolute',
    top: -15,
    left: -10,
  },
});

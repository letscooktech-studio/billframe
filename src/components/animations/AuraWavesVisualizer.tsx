/**
 * AMBIENT HOLOGRAPHIC AURA WAVES & VISOR VISUALIZER
 * 
 * Implements the 6-layer cognitive motion architecture:
 * 1. Ambient Holographic Aura Waves (smooth pulsing cyan/teal radial gradient aura)
 * 2. Holographic Visor Scanline (thinking/searching sweep animation)
 * 3. Analytical Lens with Pulsing Focus
 * 4. Multi-Frequency Wave Equalizer Bars
 * 5. Microphone Soundwave Pulse Waves
 * 6. Reasoning Shimmer Wave
 * 
 * Works seamlessly across iOS, Android, and Web using standard React Native Animated & SVG.
 */

import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Easing,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Rect,
  Circle,
  Line,
  G,
} from 'react-native-svg';

export interface AuraWavesVisualizerProps {
  isProcessing: boolean;
  isThinking?: boolean;
  isStreaming?: boolean;
  height?: number;
}

export const AuraWavesVisualizer: React.FC<AuraWavesVisualizerProps> = ({
  isProcessing,
  isThinking = false,
  isStreaming = false,
  height = 130,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const activeWidth = Math.min(windowWidth, 900);

  // 1. Ambient Aura Scale and Opacity
  const auraScale = useRef(new Animated.Value(1.0)).current;
  const auraOpacity = useRef(new Animated.Value(0.12)).current;

  // 2. Visor Scanline Sweep Y Position
  const scanlineY = useRef(new Animated.Value(15)).current;

  // 3. Analytical Lens Scale and Opacity
  const lensScale = useRef(new Animated.Value(0.85)).current;
  const lensOpacity = useRef(new Animated.Value(0.55)).current;

  // 4. Equalizer Bars Height Interpolations
  const bar1 = useRef(new Animated.Value(12)).current;
  const bar2 = useRef(new Animated.Value(24)).current;
  const bar3 = useRef(new Animated.Value(32)).current;
  const bar4 = useRef(new Animated.Value(10)).current;

  // 5. Soundwave Pulse Concentric Rings
  const waveRadius = useRef(new Animated.Value(0)).current;
  const waveOpacity = useRef(new Animated.Value(0.8)).current;

  // Master visibility fade
  const containerOpacity = useRef(new Animated.Value(isProcessing ? 1 : 0)).current;

  // Handle processing transition
  useEffect(() => {
    Animated.timing(containerOpacity, {
      toValue: isProcessing ? 1 : 0,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isProcessing, containerOpacity]);

  // Dynamic Aura Waves Loop
  useEffect(() => {
    let auraLoop: Animated.CompositeAnimation | null = null;
    if (isProcessing) {
      auraLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(auraScale, {
              toValue: 1.08,
              duration: 850,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(auraScale, {
              toValue: 1.0,
              duration: 850,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(auraOpacity, {
              toValue: 0.65,
              duration: 850,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(auraOpacity, {
              toValue: 0.35,
              duration: 850,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      auraLoop.start();
    } else {
      auraScale.setValue(1.0);
      auraOpacity.setValue(0.1);
    }

    return () => {
      if (auraLoop) auraLoop.stop();
    };
  }, [isProcessing, auraScale, auraOpacity]);

  // Holographic Visor Scanline Sweep Loop
  useEffect(() => {
    let scanLoop: Animated.CompositeAnimation | null = null;
    if (isProcessing) {
      scanLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanlineY, {
            toValue: height - 20,
            duration: 1900,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(scanlineY, {
            toValue: 15,
            duration: 1900,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      );
      scanLoop.start();
    } else {
      scanlineY.setValue(15);
    }

    return () => {
      if (scanLoop) scanLoop.stop();
    };
  }, [isProcessing, height, scanlineY]);

  // Analytical Lens Pulsing Focus Loop
  useEffect(() => {
    let lensLoop: Animated.CompositeAnimation | null = null;
    if (isProcessing) {
      lensLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(lensScale, {
              toValue: 1.18,
              duration: 575,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(lensScale, {
              toValue: 0.85,
              duration: 575,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(lensOpacity, {
              toValue: 1.0,
              duration: 575,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(lensOpacity, {
              toValue: 0.55,
              duration: 575,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      lensLoop.start();
    } else {
      lensScale.setValue(1.0);
      lensOpacity.setValue(0.5);
    }

    return () => {
      if (lensLoop) lensLoop.stop();
    };
  }, [isProcessing, lensScale, lensOpacity]);

  // Multi-Frequency Equalizer Bars Animation Loop
  useEffect(() => {
    let eqLoop: Animated.CompositeAnimation | null = null;
    if (isProcessing) {
      eqLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(bar1, { toValue: 36, duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
            Animated.timing(bar1, { toValue: 18, duration: 200, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
            Animated.timing(bar1, { toValue: 12, duration: 200, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.delay(100),
            Animated.timing(bar2, { toValue: 48, duration: 375, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
            Animated.timing(bar2, { toValue: 28, duration: 175, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
            Animated.timing(bar2, { toValue: 24, duration: 200, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.delay(200),
            Animated.timing(bar3, { toValue: 16, duration: 225, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
            Animated.timing(bar3, { toValue: 44, duration: 425, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
            Animated.timing(bar3, { toValue: 32, duration: 200, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.delay(300),
            Animated.timing(bar4, { toValue: 24, duration: 350, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
            Animated.timing(bar4, { toValue: 14, duration: 150, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
            Animated.timing(bar4, { toValue: 10, duration: 200, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
          ]),
        ])
      );
      eqLoop.start();
    } else {
      bar1.setValue(12);
      bar2.setValue(24);
      bar3.setValue(32);
      bar4.setValue(10);
    }

    return () => {
      if (eqLoop) eqLoop.stop();
    };
  }, [isProcessing, bar1, bar2, bar3, bar4]);

  // Soundwave Concentric Pulse Loop
  useEffect(() => {
    let waveLoop: Animated.CompositeAnimation | null = null;
    if (isProcessing) {
      waveLoop = Animated.loop(
        Animated.parallel([
          Animated.timing(waveRadius, {
            toValue: 1,
            duration: 1700,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(waveOpacity, {
            toValue: 0,
            duration: 1700,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      waveLoop.start();
    } else {
      waveRadius.setValue(0);
      waveOpacity.setValue(0);
    }

    return () => {
      if (waveLoop) waveLoop.stop();
    };
  }, [isProcessing, waveRadius, waveOpacity]);

  if (!isProcessing) {
    return null;
  }

  const waveScale1 = waveRadius.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.8],
  });

  const waveScale2 = waveRadius.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 2.2],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          height,
          opacity: containerOpacity,
        },
      ]}
    >
      {/* 1. Ambient Holographic Aura Waves (Radial Gradient Glow) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: auraOpacity,
            transform: [{ scale: auraScale }],
          },
        ]}
      >
        <Svg width="100%" height={height} viewBox={`0 0 ${activeWidth} ${height}`}>
          <Defs>
            <RadialGradient
              id="ambientAuraGrad"
              cx="50%"
              cy="25%"
              rx="60%"
              ry="75%"
              fx="50%"
              fy="25%"
            >
              <Stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.55" />
              <Stop offset="35%" stopColor="#10B981" stopOpacity="0.25" />
              <Stop offset="70%" stopColor="#38BDF8" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#0D0E10" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width={activeWidth}
            height={height}
            fill="url(#ambientAuraGrad)"
          />
        </Svg>
      </Animated.View>

      {/* 2. Holographic Visor Scanline Sweep */}
      <Animated.View
        style={[
          styles.scanlineContainer,
          {
            transform: [{ translateY: scanlineY }],
          },
        ]}
      >
        <Svg width="100%" height="4" viewBox={`0 0 ${activeWidth} 4`}>
          <Defs>
            <LinearGradient id="scanlineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#2DD4BF" stopOpacity="0" />
              <Stop offset="20%" stopColor="#2DD4BF" stopOpacity="0.75" />
              <Stop offset="50%" stopColor="#38BDF8" stopOpacity="0.95" />
              <Stop offset="80%" stopColor="#10B981" stopOpacity="0.75" />
              <Stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Line
            x1="0"
            y1="2"
            x2={activeWidth}
            y2="2"
            stroke="url(#scanlineGrad)"
            strokeWidth="2.5"
          />
        </Svg>
      </Animated.View>

      {/* 3 & 4. Analytical Lens & Multi-Frequency Wave Equalizer Bars */}
      <View style={styles.hudOverlayRow}>
        {/* Analytical Lens with Pulsing Focus */}
        <View style={styles.lensContainer}>
          <View style={styles.lensOuterRing}>
            <View style={styles.lensInnerDark}>
              <Animated.View
                style={[
                  styles.lensPupil,
                  {
                    transform: [{ scale: lensScale }],
                    opacity: lensOpacity,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Multi-Frequency Wave Equalizer Bars */}
        <View style={styles.equalizerRow}>
          <Animated.View style={[styles.eqBar, { height: bar1 }]} />
          <Animated.View style={[styles.eqBar, { height: bar2 }]} />
          <Animated.View style={[styles.eqBar, { height: bar3 }]} />
          <Animated.View style={[styles.eqBar, { height: bar4 }]} />
        </View>

        {/* 5. Concentric Soundwave Pulse Rings */}
        <View style={styles.micPulseContainer}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                borderColor: '#10B981',
                transform: [{ scale: waveScale1 }],
                opacity: waveOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseRing,
              {
                borderColor: '#38BDF8',
                transform: [{ scale: waveScale2 }],
                opacity: waveOpacity,
              },
            ]}
          />
          <View style={styles.pulseCoreDot} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  scanlineContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  hudOverlayRow: {
    position: 'absolute',
    top: 14,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  lensContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lensOuterRing: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lensInnerDark: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#04120C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lensPupil: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2DD4BF',
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  equalizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    gap: 3.5,
  },
  eqBar: {
    width: 3.5,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  micPulseContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  pulseCoreDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
});

/**
 * ANIMATED PROCESSING ICON COMPONENT
 * Master Interactive Icon Animation for Form Fields & Action States
 * 
 * Features:
 * 1. Buttery-smooth hardware-accelerated continuous rotation (900ms loop).
 * 2. Breathing halo scale pulse for active processing feedback.
 * 3. Spring overshoot burst transition for 'success' state (scale 0 -> 1.2 -> 1.0).
 * 4. Micro-jitter spring shake for 'error' state (translateX: -4 -> 4 -> -2 -> 2 -> 0).
 * 5. Cross-fade interpolation between idle icon and animated states.
 * 6. Full multi-platform compatibility (iOS, Android, Web).
 */

import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Check, AlertCircle } from 'lucide-react-native';

export type ProcessingState = 'idle' | 'loading' | 'success' | 'error';

export interface AnimatedProcessingIconProps {
  state?: ProcessingState;
  size?: number;
  strokeWidth?: number;
  color?: string;
  glowColor?: string;
  successColor?: string;
  errorColor?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedProcessingIcon({
  state = 'idle',
  size = 20,
  strokeWidth = 2.5,
  color = '#818CF8',
  glowColor = '#4F46E5',
  successColor = '#22C55E',
  errorColor = '#EF4444',
  children,
  style,
}: AnimatedProcessingIconProps) {
  // Animation drivers
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successScaleAnim = useRef(new Animated.Value(0)).current;
  const errorShakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(state === 'idle' ? 1 : 0)).current;

  // Spin & Pulse Loop
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (state === 'loading') {
      spinAnim.setValue(0);
      spinLoopRef.current = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinLoopRef.current.start();

      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoopRef.current.start();
    } else {
      spinLoopRef.current?.stop();
      pulseLoopRef.current?.stop();
      spinAnim.setValue(0);
      pulseAnim.setValue(1);
    }

    return () => {
      spinLoopRef.current?.stop();
      pulseLoopRef.current?.stop();
    };
  }, [state, spinAnim, pulseAnim]);

  // Success Pop Animation
  useEffect(() => {
    if (state === 'success') {
      successScaleAnim.setValue(0);
      Animated.spring(successScaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [state, successScaleAnim]);

  // Error Shake Animation
  useEffect(() => {
    if (state === 'error') {
      errorShakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(errorShakeAnim, { toValue: -4, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShakeAnim, { toValue: -3, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShakeAnim, { toValue: 3, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [state, errorShakeAnim]);

  // Smooth Crossfade
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: state === 'idle' ? 1 : 0,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [state, fadeAnim]);

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * 0.35; // 65% arc visible

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* ── Idle State (Default Children) ── */}
      {state === 'idle' && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, { opacity: fadeAnim }]}>
          {children}
        </Animated.View>
      )}

      {/* ── Loading / Processing State ── */}
      {state === 'loading' && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.center,
            {
              transform: [{ rotate: spinInterpolation }, { scale: pulseAnim }],
            },
          ]}
        >
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
              <LinearGradient id="procGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={color} stopOpacity="1" />
                <Stop offset="60%" stopColor={glowColor} stopOpacity="0.8" />
                <Stop offset="100%" stopColor={color} stopOpacity="0.1" />
              </LinearGradient>
            </Defs>
            {/* Subtle background track */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Luminous rotating arc */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#procGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </Animated.View>
      )}

      {/* ── Success State ── */}
      {state === 'success' && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.center,
            {
              transform: [{ scale: successScaleAnim }],
            },
          ]}
        >
          <View
            style={[
              styles.statusCircle,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                borderColor: successColor,
              },
            ]}
          >
            <Check size={size * 0.65} color={successColor} strokeWidth={3} />
          </View>
        </Animated.View>
      )}

      {/* ── Error State ── */}
      {state === 'error' && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.center,
            {
              transform: [{ translateX: errorShakeAnim }],
            },
          ]}
        >
          <View
            style={[
              styles.statusCircle,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                borderColor: errorColor,
              },
            ]}
          >
            <AlertCircle size={size * 0.65} color={errorColor} strokeWidth={2.5} />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
});

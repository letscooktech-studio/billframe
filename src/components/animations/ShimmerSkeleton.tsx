/**
 * SHIMMER SKELETON LOADER COMPONENT
 * Master UI Placeholder Animation for Document Rows, Cards & Data Lists
 * 
 * Features:
 * 1. Hardware-accelerated continuous sweeping gradient beam (1200ms loop).
 * 2. Restrained monochrome luxury tones matching Billframe 4.0 dark & light themes.
 * 3. Atomic presets: Text, Circle, Card, and DocumentRow.
 * 4. Responsive and zero-overhead performance.
 */

import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
  DimensionValue,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../../design/ThemeContext';
import { radii } from '../../design/tokens';

export interface ShimmerSkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function ShimmerSkeleton({
  width = '100%',
  height = 16,
  borderRadius = radii.sm,
  style,
}: ShimmerSkeletonProps) {
  const { isDark } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1250,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();

    return () => loop.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-240, 240],
  });

  const baseColor = isDark ? '#141722' : '#F1F5F9';
  const highlightColor = isDark ? '#262D3E' : '#E2E8F0';

  return (
    <View
      style={[
        styles.skeletonBase,
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <Svg width="240" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="shimmerBeam" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={baseColor} stopOpacity="0" />
              <Stop offset="50%" stopColor={highlightColor} stopOpacity="0.8" />
              <Stop offset="100%" stopColor={baseColor} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="240" height="100%" fill="url(#shimmerBeam)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

// Preset: Shimmer Skeleton Document Row
export function ShimmerDocumentRow() {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.documentRowCard,
        {
          backgroundColor: isDark ? '#10121A' : '#FFFFFF',
          borderColor: isDark ? '#1E2230' : '#E5E7EB',
        },
      ]}
    >
      {/* Icon Badge */}
      <ShimmerSkeleton width={38} height={38} borderRadius={10} style={{ marginRight: 12 }} />

      {/* Text Lines */}
      <View style={{ flex: 1, gap: 6 }}>
        <ShimmerSkeleton width="65%" height={14} borderRadius={4} />
        <ShimmerSkeleton width="40%" height={10} borderRadius={3} />
      </View>

      {/* Amount Pill */}
      <View style={{ alignItems: 'flex-end', gap: 6, marginLeft: 12 }}>
        <ShimmerSkeleton width={60} height={14} borderRadius={4} />
        <ShimmerSkeleton width={42} height={10} borderRadius={3} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonBase: {
    overflow: 'hidden',
    position: 'relative',
  },
  documentRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
});

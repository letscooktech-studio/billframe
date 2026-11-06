import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

export const AmbientBottomGlow: React.FC = () => {
  const { width } = useWindowDimensions();
  const height = 360;

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient
            id="bottomAura"
            cx="50%"
            cy="100%"
            rx="60%"
            ry="70%"
            fx="50%"
            fy="100%"
          >
            <Stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.45" />
            <Stop offset="40%" stopColor="#0F172A" stopOpacity="0.25" />
            <Stop offset="80%" stopColor="#020617" stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#bottomAura)" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
});

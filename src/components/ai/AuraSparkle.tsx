import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Path } from 'react-native-svg';

export interface AuraSparkleProps {
  size?: number;
}

export const AuraSparkle: React.FC<AuraSparkleProps> = ({ size = 44 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Defs>
          <LinearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FB7185" />
            <Stop offset="30%" stopColor="#F59E0B" />
            <Stop offset="55%" stopColor="#38BDF8" />
            <Stop offset="85%" stopColor="#818CF8" />
            <Stop offset="100%" stopColor="#34D399" />
          </LinearGradient>
          <RadialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgba(56, 189, 248, 0.4)" />
            <Stop offset="100%" stopColor="transparent" />
          </RadialGradient>
        </Defs>

        {/* Ambient backing glow */}
        <Path
          d="M 24 0 C 24 13.25 13.25 24 0 24 C 13.25 24 24 34.75 24 48 C 24 34.75 34.75 24 48 24 C 34.75 24 24 13.25 24 0 Z"
          fill="url(#sparkGrad)"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
});

/**
 * ACCESSIBLE COUNTRY FLAG BADGE
 * Renders high-fidelity vector flags with zero external network or image assets.
 * TalkBack-compliant accessibility label announces the country name.
 */

import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { getCountryFlagEmoji } from '../../data/geography/flags';

interface CountryFlagProps {
  iso2: string;
  countryName?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function CountryFlag({ iso2, countryName, size = 'md', style }: CountryFlagProps) {
  const emoji = getCountryFlagEmoji(iso2);
  const fontSize = size === 'sm' ? 16 : size === 'lg' ? 26 : 20;

  return (
    <View
      style={[styles.container, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={countryName ? `${countryName} flag` : `${iso2} flag`}
    >
      <Text style={[styles.flagText, { fontSize }]}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagText: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

/**
 * UPI QR CODE COMPONENT
 * Renders an offline-generated QR code cleanly using react-native-svg.
 * Fully compliant with ISO/IEC 18004 4-module quiet zone specification
 * ensuring immediate detection by Google Lens, PhonePe, Paytm, and BHIM.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { QrCodeGenerator } from '../../domain/payments/upi/QrCodeGenerator';

interface UpiQrCodeProps {
  readonly value: string;
  readonly size?: number;
  readonly color?: string;
  readonly backgroundColor?: string;
  readonly style?: ViewStyle;
}

export const UpiQrCode: React.FC<UpiQrCodeProps> = ({
  value,
  size = 180,
  color = '#000000',
  backgroundColor = '#FFFFFF',
  style,
}) => {
  const { pathData, matrixSize } = useMemo(() => {
    if (!value) {
      return { pathData: '', matrixSize: 21 };
    }
    const matrix = QrCodeGenerator.generateMatrix(value);
    const path = QrCodeGenerator.generateSvgPath(matrix);
    return { pathData: path, matrixSize: matrix.length };
  }, [value]);

  if (!value || !pathData) {
    return null;
  }

  // Mandatory 4-module quiet zone per ISO/IEC 18004
  const margin = 4;
  const totalSize = matrixSize + margin * 2;

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor }, style]}>
      <Svg
        viewBox={`${-margin} ${-margin} ${totalSize} ${totalSize}`}
        width={size}
        height={size}
      >
        <Rect x={-margin} y={-margin} width={totalSize} height={totalSize} fill={backgroundColor} />
        <Path d={pathData} fill={color} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

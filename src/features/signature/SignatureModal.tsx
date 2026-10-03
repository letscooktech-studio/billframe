/**
 * DIGITAL SIGNATURE MODAL
 * Offline-first on-device signature capture sheet for Estimate acceptance.
 * Captures touch gesture strokes with PanResponder, renders live vector paths via react-native-svg,
 * and serializes to self-contained SVG data URIs for compliance and PDF inclusion.
 */

import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  PanResponder,
  useColorScheme,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { X, RotateCcw, Check, PenTool } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';

export interface Point {
  x: number;
  y: number;
}

export interface SignatureModalProps {
  visible: boolean;
  estimateNumber: string;
  customerName?: string;
  onConfirm: (signatureUri: string, signerName: string) => Promise<void> | void;
  onClose: () => void;
}

export function strokesToSvgDataUri(strokes: Point[][], width: number, height: number): string {
  const paths = strokes
    .filter((s) => s.length > 0)
    .map((stroke) => {
      const d = stroke.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '');
      return `<path d="${d.trim()}" fill="none" stroke="#090A0C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />`;
    })
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${paths}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function SignatureModal({
  visible,
  estimateNumber,
  customerName = '',
  onConfirm,
  onClose,
}: SignatureModalProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [signerName, setSignerName] = useState(customerName);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 320, height: 180 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to strokes for synchronous PanResponder access
  const strokesRef = useRef<Point[][]>([]);
  const currentStrokeRef = useRef<Point[]>([]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const pt = { x: locationX, y: locationY };
        currentStrokeRef.current = [pt];
        setCurrentStroke([pt]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const pt = { x: locationX, y: locationY };
        currentStrokeRef.current = [...currentStrokeRef.current, pt];
        setCurrentStroke([...currentStrokeRef.current]);
      },
      onPanResponderRelease: () => {
        if (currentStrokeRef.current.length > 0) {
          const next = [...strokesRef.current, currentStrokeRef.current];
          strokesRef.current = next;
          setStrokes(next);
        }
        currentStrokeRef.current = [];
        setCurrentStroke([]);
      },
    })
  ).current;

  function handleClear() {
    strokesRef.current = [];
    currentStrokeRef.current = [];
    setStrokes([]);
    setCurrentStroke([]);
    setError(null);
  }

  async function handleConfirm() {
    if (strokes.length === 0 && currentStroke.length === 0) {
      setError('Please provide a signature on the pad.');
      return;
    }
    if (!signerName.trim()) {
      setError('Signer name is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const allStrokes = currentStroke.length > 0 ? [...strokes, currentStroke] : strokes;
      const uri = strokesToSvgDataUri(allStrokes, canvasDimensions.width, canvasDimensions.height);
      await onConfirm(uri, signerName.trim());
      handleClear();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save signature.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function onLayoutCanvas(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setCanvasDimensions({ width: Math.round(width), height: Math.round(height) });
    }
  }

  // Generate SVG path for a stroke
  function strokeToD(pts: Point[]) {
    if (pts.length === 0) return '';
    return pts.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '');
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.borderSubtle }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PenTool size={18} color={theme.brandAnchor} />
              <View>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Client Signature</Text>
                <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
                  Accept {estimateNumber}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close signature sheet"
            >
              <X color={theme.textPrimary} size={22} />
            </Pressable>
          </View>

          <View style={styles.content}>
            {error && <Text style={[styles.errorText, { color: theme.statusDanger }]}>{error}</Text>}

            {/* Signer Name Input */}
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Signer Full Name *</Text>
            <TextInput
              style={[
                styles.input,
                { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary },
              ]}
              placeholder="e.g. Jane Doe"
              placeholderTextColor={theme.textMuted}
              value={signerName}
              onChangeText={setSignerName}
              accessibilityLabel="Signer full name"
            />

            {/* Signature Pad Area */}
            <View style={styles.padHeader}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Sign Below *</Text>
              <Pressable
                onPress={handleClear}
                hitSlop={8}
                style={styles.clearBtn}
                accessibilityRole="button"
                accessibilityLabel="Clear signature"
              >
                <RotateCcw size={14} color={theme.brandAnchor} />
                <Text style={[styles.clearBtnText, { color: theme.brandAnchor }]}>Clear</Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.canvasContainer,
                { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle },
              ]}
              onLayout={onLayoutCanvas}
              {...panResponder.panHandlers}
            >
              <Svg width={canvasDimensions.width} height={canvasDimensions.height} style={StyleSheet.absoluteFill}>
                {strokes.map((stroke, i) => (
                  <Path
                    key={i}
                    d={strokeToD(stroke)}
                    fill="none"
                    stroke={theme.textPrimary}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
                {currentStroke.length > 0 && (
                  <Path
                    d={strokeToD(currentStroke)}
                    fill="none"
                    stroke={theme.textPrimary}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </Svg>

              {strokes.length === 0 && currentStroke.length === 0 && (
                <View style={styles.watermark} pointerEvents="none">
                  <Text style={[styles.watermarkText, { color: theme.textMuted }]}>
                    Draw signature with finger or stylus
                  </Text>
                  <View style={[styles.signLine, { backgroundColor: theme.borderSubtle }]} />
                </View>
              )}
            </View>

            <Text style={[styles.legalDisclaimer, { color: theme.textMuted }]}>
              By signing above, client acknowledges receipt and acceptance of estimate {estimateNumber}.
            </Text>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.cancelBtn, { borderColor: theme.borderSubtle }]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={[styles.cancelBtnText, { color: theme.textPrimary }]}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.confirmBtn,
                  { backgroundColor: theme.brandAnchor, opacity: isSubmitting ? 0.7 : 1 },
                ]}
                onPress={handleConfirm}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Confirm and accept estimate"
              >
                <Check size={18} color={theme.brandAnchorText} />
                <Text style={[styles.confirmBtnText, { color: theme.brandAnchorText }]}>
                  {isSubmitting ? 'Accepting...' : 'Sign & Accept'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingBottom: spacing.xxl,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 12,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    marginTop: 2,
  },
  input: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.input.fontSize,
  },
  padHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  canvasContainer: {
    height: 180,
    width: '100%',
    borderRadius: radii.sm,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  watermark: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  watermarkText: {
    fontSize: 12,
    marginBottom: 8,
  },
  signLine: {
    height: 1,
    width: '100%',
  },
  legalDisclaimer: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radii.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

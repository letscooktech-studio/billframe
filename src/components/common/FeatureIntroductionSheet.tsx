/**
 * FEATURE INTRODUCTION SHEET & TWO-COLOR ATMOSPHERIC GRADIENT ENGINE
 * Master Implementation matching user reference images:
 * - media_1791999525663_3b399809.jpg (Template Studio)
 * - media_1791999526640_6888eebf.jpg (Clients)
 * - media_1791999527664_ff14f4ee.jpg (Payments & UPI)
 * - media_1791999528744_509e759f.jpg (Documents)
 * 
 * Features:
 * 1. Half-middle height (~52% screen height) for executive prominence.
 * 2. Full-screen dimmed & blurred backdrop (backdrop-filter: blur(20px)) focusing attention on the feature.
 * 3. 12 dedicated feature palettes using exact sampled electric plasma colors:
 *    - template_studio: Midnight Indigo-Blue (#080C1E) with Electric Cyan-Violet plasma stream (#D9F6FF -> #77A2FF -> #624CD3).
 *    - clients: Midnight Dark Teal (#061011) with Neon Turquoise-Mint stream (#D4FFFF -> #79FFF3 -> #076D58).
 *    - payments: Midnight Cobalt (#080A1C) with Vibrant Cobalt-Indigo stream (#DAF8FF -> #95A1FF -> #4F46E5).
 *    - documents: Midnight Violet-Slate (#090B18) with Sapphire-Violet stream (#DAF0FF -> #69A1FF -> #5450C1).
 * 4. Layered hardware-accelerated SVG with glowing fluid light ribbon & atmospheric bloom.
 * 5. Feature highlights list with themed bullet accents.
 * 6. High-contrast solid white pill CTA button (#FFFFFF background, #000000 text, ArrowRight).
 * 7. Dismissible via backdrop tap, top-right X, or CTA, with persistent first-use state via SettingsRepository.
 * 8. Touch targets >= 48dp on all interactive elements.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Path,
} from 'react-native-svg';
import { X, ArrowRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsRepository } from '../../data/repositories/SettingsRepository';
import { MIN_TOUCH_TARGET } from '../../design/tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface FeaturePalette {
  primary: string;
  secondary: string;
  bg?: string;
  coreHighlight?: string;
  stream?: string;
  diffuse?: string;
  border?: string;
  accentText?: string;
}

export const FEATURE_PALETTES: Record<string, FeaturePalette> = {
  template_studio: {
    primary: '#4841C8',
    secondary: '#AAA1ED',
    bg: '#080C1E',
    coreHighlight: '#D9F6FF',
    stream: '#77A2FF',
    diffuse: '#17244E',
    border: '#1E2540',
    accentText: '#939AFF',
  },
  clients: {
    primary: '#087F78',
    secondary: '#78D7C9',
    bg: '#061011',
    coreHighlight: '#D4FFFF',
    stream: '#79FFF3',
    diffuse: '#032028',
    border: '#102B2D',
    accentText: '#79FFF3',
  },
  payments: {
    primary: '#173C8C',
    secondary: '#6DAAF5',
    bg: '#080A1C',
    coreHighlight: '#DAF8FF',
    stream: '#95A1FF',
    diffuse: '#182B4C',
    border: '#1A2244',
    accentText: '#95A1FF',
  },
  documents: {
    primary: '#234ED8',
    secondary: '#839DF6',
    bg: '#090B18',
    coreHighlight: '#DAF0FF',
    stream: '#69A1FF',
    diffuse: '#0E183B',
    border: '#1C2346',
    accentText: '#91ADFF',
  },
  collections: {
    primary: '#9E603B',
    secondary: '#EDB788',
    bg: '#140C08',
    coreHighlight: '#FFF1E6',
    stream: '#FDBA74',
    diffuse: '#381E12',
    border: '#331B10',
    accentText: '#FDBA74',
  },
  reports: {
    primary: '#435575',
    secondary: '#A5B7D0',
    bg: '#090E16',
    coreHighlight: '#E0F2FE',
    stream: '#7DD3FC',
    diffuse: '#0C243B',
    border: '#132B45',
    accentText: '#7DD3FC',
  },
  hr: {
    primary: '#654A7A',
    secondary: '#B6A5D4',
    bg: '#11091A',
    coreHighlight: '#FAE8FF',
    stream: '#E879F9',
    diffuse: '#341445',
    border: '#2C113D',
    accentText: '#E879F9',
  },
  projects: {
    primary: '#235D50',
    secondary: '#93B8A3',
    bg: '#06120D',
    coreHighlight: '#ECFDF5',
    stream: '#6EE7B7',
    diffuse: '#0E3321',
    border: '#123825',
    accentText: '#6EE7B7',
  },
  inventory: {
    primary: '#344D5E',
    secondary: '#85BAC6',
    bg: '#0A1116',
    coreHighlight: '#E0F7FA',
    stream: '#4DD0E1',
    diffuse: '#0D2A35',
    border: '#13323F',
    accentText: '#4DD0E1',
  },
  brand_kit: {
    primary: '#34363C',
    secondary: '#A4A9B3',
    bg: '#121214',
    coreHighlight: '#FFFFFF',
    stream: '#D4D4D8',
    diffuse: '#27272A',
    border: '#2E2E33',
    accentText: '#D4D4D8',
  },
  security: {
    primary: '#263C5B',
    secondary: '#A7B5C6',
    bg: '#080F18',
    coreHighlight: '#EFF6FF',
    stream: '#93C5FD',
    diffuse: '#132845',
    border: '#173050',
    accentText: '#93C5FD',
  },
  expenses: {
    primary: '#713E50',
    secondary: '#CF98A8',
    bg: '#16080E',
    coreHighlight: '#FFE4E6',
    stream: '#FB7185',
    diffuse: '#3B111E',
    border: '#33101C',
    accentText: '#FB7185',
  },
};

export const DEFAULT_FEATURE_HIGHLIGHTS: Record<string, string[]> = {
  template_studio: [
    'Custom branding, typography & executive letterheads',
    'Rule 46 compliant layouts matching your industry',
  ],
  clients: [
    'Complete customer & vendor profiles with GSTIN lookup',
    'Outstanding balances, ledgers & instant statements',
  ],
  payments: [
    'Direct UPI QR codes with instant zero-fee settlement',
    'Bank reconciliation, automated receipts & cash logs',
  ],
  documents: [
    '29+ legal and commercial document types ready to create',
    '100% offline generation with instant PDF export',
  ],
  collections: [
    'Receivables tracking and overdue payment reminders',
    'Automated client balance statements and follow-ups',
  ],
};

export interface FeatureIntroductionSheetProps {
  featureId: string;
  title: string;
  description: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  eyebrow?: string;
  palette?: Partial<FeaturePalette>;
  highlights?: string[];
  forceShow?: boolean;
  onDismiss?: () => void;
}

export function FeatureIntroductionSheet({
  featureId,
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  eyebrow = 'FEATURE PREVIEW',
  palette: customPalette,
  highlights: customHighlights,
  forceShow = false,
  onDismiss,
}: FeatureIntroductionSheetProps) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const storageKey = `feature_intro_dismissed_${featureId}`;

  // Check persistent first-use state
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        if (forceShow) {
          if (isMounted) {
            setVisible(true);
            setIsLoaded(true);
          }
          return;
        }

        const dismissed = await SettingsRepository.get(storageKey, '0');
        if (isMounted) {
          setVisible(dismissed !== '1');
          setIsLoaded(true);
        }
      } catch {
        if (isMounted) {
          setVisible(false);
          setIsLoaded(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [storageKey, forceShow]);

  const palette = useMemo(() => {
    const base = FEATURE_PALETTES[featureId] || FEATURE_PALETTES.documents;
    const merged = customPalette ? { ...base, ...customPalette } : base;
    return {
      primary: merged.primary,
      secondary: merged.secondary,
      bg: merged.bg || '#080C1E',
      coreHighlight: merged.coreHighlight || '#FFFFFF',
      stream: merged.stream || merged.secondary,
      diffuse: merged.diffuse || merged.primary,
      border: merged.border || 'rgba(255, 255, 255, 0.15)',
      accentText: merged.accentText || merged.secondary,
    };
  }, [customPalette, featureId]);

  const highlightsList = useMemo(() => {
    return customHighlights || DEFAULT_FEATURE_HIGHLIGHTS[featureId] || [];
  }, [customHighlights, featureId]);

  // Entrance & breathing animation values
  const slideAnim = useRef(new Animated.Value(500)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(450);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      return () => pulseLoop.stop();
    }
  }, [visible, slideAnim, backdropOpacity, pulseAnim]);

  const handleDismiss = useCallback(async () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      setVisible(false);
      try {
        await SettingsRepository.set(storageKey, '1');
      } catch {}
      if (onDismiss) {
        onDismiss();
      }
    });
  }, [slideAnim, backdropOpacity, storageKey, onDismiss]);

  const handleAction = useCallback(async () => {
    await handleDismiss();
    onPrimaryAction();
  }, [handleDismiss, onPrimaryAction]);

  if (!isLoaded || !visible) return null;

  // Half-middle height (~52% of screen height)
  const SHEET_HEIGHT = Math.max(400, Math.min(Math.round(SCREEN_HEIGHT * 0.52), 480)) + Math.max(insets.bottom, 16);
  const gradBloom = `grad_b_${featureId}`;
  const gradRibbon = `grad_r_${featureId}`;
  const gradHighlight = `grad_h_${featureId}`;

  // Electric wave control points
  const pStart = `${SCREEN_WIDTH * 0.42} ${SHEET_HEIGHT * 0.95}`;
  const pCtrl1 = `${SCREEN_WIDTH * 0.62} ${SHEET_HEIGHT * 0.72}`;
  const pMid = `${SCREEN_WIDTH * 0.75} ${SHEET_HEIGHT * 0.52}`;
  const pCtrl2 = `${SCREEN_WIDTH * 0.92} ${SHEET_HEIGHT * 0.35}`;
  const pEnd = `${SCREEN_WIDTH * 1.05} ${SHEET_HEIGHT * 0.15}`;

  const wavePath = `M ${pStart} Q ${pCtrl1}, ${pMid} T ${pEnd}`;

  return (
    <View style={styles.modalRoot} pointerEvents="box-none">
      {/* ── Full-Screen Blurred Dimmed Backdrop with Fade Transition ── */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss introduction overlay"
        />
      </Animated.View>

      {/* ── Half-Middle Bottom Sheet with Spring Slide Entrance ── */}
      <Animated.View
        style={[
          styles.container,
          {
            height: SHEET_HEIGHT,
            backgroundColor: palette.bg,
            borderColor: palette.border,
            paddingBottom: Math.max(insets.bottom, 16),
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* ── Atmospheric Plasma Gradient Wave Engine with Breathing Pulse ── */}
        <Animated.View
          style={[
            styles.atmosphereBackground,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
          pointerEvents="none"
        >
          <Svg width={SCREEN_WIDTH} height={SHEET_HEIGHT} style={StyleSheet.absoluteFill}>
            <Defs>
              {/* Diffuse atmospheric bloom on right */}
              <RadialGradient
                id={gradBloom}
                cx="82%"
                cy="42%"
                rx="68%"
                ry="58%"
                fx="82%"
                fy="42%"
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%" stopColor={palette.primary} stopOpacity="0.75" />
                <Stop offset="45%" stopColor={palette.secondary} stopOpacity="0.35" />
                <Stop offset="75%" stopColor={palette.diffuse} stopOpacity="0.15" />
                <Stop offset="100%" stopColor={palette.bg} stopOpacity="0" />
              </RadialGradient>

              {/* Luminous stream linear gradient */}
              <LinearGradient id={gradRibbon} x1="0" y1="1" x2="1" y2="0">
                <Stop offset="0%" stopColor={palette.primary} stopOpacity="0.2" />
                <Stop offset="40%" stopColor={palette.secondary} stopOpacity="0.8" />
                <Stop offset="80%" stopColor={palette.stream} stopOpacity="0.95" />
                <Stop offset="100%" stopColor={palette.coreHighlight} stopOpacity="1" />
              </LinearGradient>

              {/* Ultra-bright plasma core */}
              <LinearGradient id={gradHighlight} x1="0" y1="1" x2="1" y2="0">
                <Stop offset="0%" stopColor={palette.secondary} stopOpacity="0" />
                <Stop offset="50%" stopColor={palette.coreHighlight} stopOpacity="0.85" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.95" />
              </LinearGradient>
            </Defs>

            {/* Base Background Fill */}
            <Rect x="0" y="0" width={SCREEN_WIDTH} height={SHEET_HEIGHT} fill={palette.bg} />

            {/* Atmospheric Right-Hand Bloom */}
            <Rect x="0" y="0" width={SCREEN_WIDTH} height={SHEET_HEIGHT} fill={`url(#${gradBloom})`} />

            {/* Outer Atmospheric Glow */}
            <Path
              d={wavePath}
              stroke={palette.primary}
              strokeWidth="110"
              strokeOpacity="0.28"
              strokeLinecap="round"
              fill="none"
            />

            {/* Mid Atmospheric Fluid Stream */}
            <Path
              d={wavePath}
              stroke={`url(#${gradRibbon})`}
              strokeWidth="54"
              strokeOpacity="0.65"
              strokeLinecap="round"
              fill="none"
            />

            {/* Neon Accent Stream */}
            <Path
              d={wavePath}
              stroke={palette.stream}
              strokeWidth="22"
              strokeOpacity="0.82"
              strokeLinecap="round"
              fill="none"
            />

            {/* Intense Bright Plasma Core */}
            <Path
              d={wavePath}
              stroke={`url(#${gradHighlight})`}
              strokeWidth="7"
              strokeOpacity="0.95"
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </Animated.View>

        {/* ── Top Drag Indicator Bar ── */}
        <View style={styles.dragIndicatorWrap}>
          <View style={styles.dragIndicator} />
        </View>

        {/* ── Top-Right Dismiss Button ── */}
        <Pressable
          style={styles.closeButton}
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss introduction"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X size={18} color="#D1D5DB" strokeWidth={2.2} />
        </Pressable>

        {/* ── Content Container ── */}
        <View style={styles.contentWrap}>
          <View>
            {/* Eyebrow Kicker */}
            <Text style={[styles.eyebrow, { color: palette.accentText }]}>
              {eyebrow}
            </Text>

            {/* Feature Title */}
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>

            {/* Description */}
            <Text style={styles.description}>
              {description}
            </Text>

            {/* Highlights list */}
            {highlightsList.length > 0 && (
              <View style={styles.highlightsWrap}>
                {highlightsList.map((highlight, index) => (
                  <View key={index} style={styles.highlightRow}>
                    <View style={[styles.highlightDot, { backgroundColor: palette.accentText }]} />
                    <Text style={styles.highlightText}>{highlight}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Primary Action Button (Solid White Pill, Black Text) */}
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              { opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={handleAction}
            accessibilityRole="button"
            accessibilityLabel={`${primaryActionLabel} for ${title}`}
          >
            <Text style={styles.actionButtonText}>
              {primaryActionLabel}
            </Text>
            <ArrowRight size={18} color="#000000" strokeWidth={2.5} style={styles.actionIcon} />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2, 3, 5, 0.76)',
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        } as any)
      : {}),
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    borderTopWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.7,
    shadowRadius: 32,
    elevation: 24,
  },
  atmosphereBackground: {
    ...StyleSheet.absoluteFill,
  },
  dragIndicatorWrap: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 6,
  },
  dragIndicator: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 18,
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    justifyContent: 'space-between',
    maxWidth: 540,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#E2E8F0',
    marginBottom: 14,
  },
  highlightsWrap: {
    gap: 8,
    marginBottom: 16,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  highlightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  highlightText: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 50,
    paddingHorizontal: 24,
    borderRadius: 25,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    minHeight: MIN_TOUCH_TARGET,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  actionIcon: {
    marginLeft: 8,
  },
});

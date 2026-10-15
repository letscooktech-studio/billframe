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
  accentColor?: string;
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
    accentColor: '#8B5CF6',
    bg: '#000000',
    border: 'rgba(139, 92, 246, 0.25)',
    accentText: '#A78BFA',
  },
  clients: {
    primary: '#087F78',
    secondary: '#78D7C9',
    accentColor: '#1EC1CB',
    bg: '#000000',
    border: 'rgba(30, 193, 203, 0.25)',
    accentText: '#1EC1CB',
  },
  payments: {
    primary: '#173C8C',
    secondary: '#6DAAF5',
    accentColor: '#3B82F6',
    bg: '#000000',
    border: 'rgba(59, 130, 246, 0.25)',
    accentText: '#60A5FA',
  },
  documents: {
    primary: '#234ED8',
    secondary: '#839DF6',
    accentColor: '#2563EB',
    bg: '#000000',
    border: 'rgba(37, 99, 235, 0.25)',
    accentText: '#60A5FA',
  },
  collections: {
    primary: '#9E603B',
    secondary: '#EDB788',
    accentColor: '#F59E0B',
    bg: '#000000',
    border: 'rgba(245, 158, 11, 0.25)',
    accentText: '#FBBF24',
  },
  reports: {
    primary: '#435575',
    secondary: '#A5B7D0',
    accentColor: '#38BDF8',
    bg: '#000000',
    border: 'rgba(56, 189, 248, 0.25)',
    accentText: '#38BDF8',
  },
  hr: {
    primary: '#654A7A',
    secondary: '#B6A5D4',
    accentColor: '#D946EF',
    bg: '#000000',
    border: 'rgba(217, 70, 239, 0.25)',
    accentText: '#E879F9',
  },
  projects: {
    primary: '#235D50',
    secondary: '#93B8A3',
    accentColor: '#10B981',
    bg: '#000000',
    border: 'rgba(16, 185, 129, 0.25)',
    accentText: '#34D399',
  },
  inventory: {
    primary: '#344D5E',
    secondary: '#85BAC6',
    accentColor: '#06B6D4',
    bg: '#000000',
    border: 'rgba(6, 182, 212, 0.25)',
    accentText: '#22D3EE',
  },
  brand_kit: {
    primary: '#34363C',
    secondary: '#A4A9B3',
    accentColor: '#CBD5E1',
    bg: '#000000',
    border: 'rgba(203, 213, 225, 0.2)',
    accentText: '#E2E8F0',
  },
  security: {
    primary: '#263C5B',
    secondary: '#A7B5C6',
    accentColor: '#60A5FA',
    bg: '#000000',
    border: 'rgba(96, 165, 250, 0.25)',
    accentText: '#93C5FD',
  },
  expenses: {
    primary: '#713E50',
    secondary: '#CF98A8',
    accentColor: '#F43F5E',
    bg: '#000000',
    border: 'rgba(244, 63, 94, 0.25)',
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
    const singleColor = merged.accentColor || merged.stream || merged.secondary || merged.primary;
    return {
      primary: merged.primary,
      secondary: merged.secondary,
      singleAccent: singleColor,
      bg: merged.bg || '#000000',
      deepNavy: '#1C1C28',
      coreHighlight: merged.coreHighlight || '#FFFFFF',
      stream: merged.stream || singleColor,
      diffuse: merged.diffuse || merged.primary,
      border: merged.border || 'rgba(255, 255, 255, 0.12)',
      accentText: merged.accentText || singleColor,
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

  // Gradient IDs for SVG atmospheric lighting (Single Color + Black Gradiency)
  const baseDarkGradId = `base_dark_${featureId}`;
  const horizonAuroraId = `horizon_aurora_${featureId}`;
  const ambientBloomId = `ambient_bloom_${featureId}`;
  const softFillId = `soft_fill_${featureId}`;
  const topMeltId = `top_melt_${featureId}`;

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
        {/* ── Atmospheric 1-Color + Black Horizon Aurora Engine (Zero Lines / Zero Geometric Shapes) ── */}
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
              {/* 1. Deep Navy to Pitch Black Base Gradient (#1C1C28 from dyslove.design reference) */}
              <LinearGradient id={baseDarkGradId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#000000" stopOpacity="1" />
                <Stop offset="55%" stopColor="#070910" stopOpacity="1" />
                <Stop offset="100%" stopColor="#1C1C28" stopOpacity="1" />
              </LinearGradient>

              {/* 2. Soft Horizontal Aurora Glow (Decreased pattern matching 3rd reference: 1 color with black gradiency) */}
              <LinearGradient id={horizonAuroraId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#000000" stopOpacity="0" />
                <Stop offset="38%" stopColor="#000000" stopOpacity="0" />
                <Stop offset="65%" stopColor={palette.singleAccent} stopOpacity="0.26" />
                <Stop offset="88%" stopColor={palette.singleAccent} stopOpacity="0.52" />
                <Stop offset="100%" stopColor={palette.singleAccent} stopOpacity="0.28" />
              </LinearGradient>

              {/* 3. Diffused Right-Hand Ambient Light Pool (Completely smooth Gaussian-style blur, NO sharp lines) */}
              <RadialGradient
                id={ambientBloomId}
                cx="82%"
                cy="78%"
                rx="70%"
                ry="55%"
                fx="82%"
                fy="78%"
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%" stopColor={palette.singleAccent} stopOpacity="0.58" />
                <Stop offset="35%" stopColor={palette.singleAccent} stopOpacity="0.30" />
                <Stop offset="72%" stopColor={palette.singleAccent} stopOpacity="0.08" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </RadialGradient>

              {/* 4. Left-Center Ambient Glow for seamless horizontal continuity across the card */}
              <RadialGradient
                id={softFillId}
                cx="32%"
                cy="85%"
                rx="55%"
                ry="44%"
                fx="32%"
                fy="85%"
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%" stopColor={palette.singleAccent} stopOpacity="0.30" />
                <Stop offset="55%" stopColor={palette.singleAccent} stopOpacity="0.07" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </RadialGradient>

              {/* 5. Top Black Contrast Protection Mask: Guarantees pure solid black at top for pristine text legibility */}
              <LinearGradient id={topMeltId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#000000" stopOpacity="0.92" />
                <Stop offset="45%" stopColor="#000000" stopOpacity="0.55" />
                <Stop offset="78%" stopColor="#000000" stopOpacity="0.05" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </LinearGradient>
            </Defs>

            {/* Base Fill */}
            <Rect x="0" y="0" width={SCREEN_WIDTH} height={SHEET_HEIGHT} fill={`url(#${baseDarkGradId})`} />

            {/* Right-Hand Diffused Ambient Bloom */}
            <Rect x="0" y="0" width={SCREEN_WIDTH} height={SHEET_HEIGHT} fill={`url(#${ambientBloomId})`} />

            {/* Left-Center Soft Fill */}
            <Rect x="0" y="0" width={SCREEN_WIDTH} height={SHEET_HEIGHT} fill={`url(#${softFillId})`} />

            {/* Horizontal Aurora Horizon Band */}
            <Rect x="0" y="0" width={SCREEN_WIDTH} height={SHEET_HEIGHT} fill={`url(#${horizonAuroraId})`} />

            {/* Top Black Melt Mask */}
            <Rect x="0" y="0" width={SCREEN_WIDTH} height={SHEET_HEIGHT} fill={`url(#${topMeltId})`} />
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

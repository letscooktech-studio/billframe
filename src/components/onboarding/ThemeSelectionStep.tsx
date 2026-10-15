/**
 * THEME SELECTION ONBOARDING STEP
 * Pixel-accurate implementation matching user reference media_1791999524646_d4a0eb28.jpg.
 * 
 * Features:
 * 1. Deep pitch black background (#000000).
 * 2. Luminous royal purple-blue top nebula aura (#515DC3 / #373A6A / #181938).
 * 3. Executive typography: "Billframe" (bold white), "Invoices made simple." (soft lavender-slate).
 * 4. "Choose your theme" header with concise instruction.
 * 5. Two side-by-side aligned cards:
 *    - Dark Theme Card (#111218 container, white check badge when selected, dark miniature UI mockup).
 *    - Light Theme Card (#F0F2F6 crisp ivory container, light miniature UI mockup).
 * 6. Interactive theme selection with immediate visual update and persistence.
 * 7. Executive Continue CTA pill (#24283B background, white text + ArrowRight).
 * 8. Footer reassurance: "You can change this later in settings."
 * 9. Accessible touch targets >= 48dp.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { FileText, Check, ArrowRight } from 'lucide-react-native';
import { useTheme, ThemePreference } from '../../design/ThemeContext';
import { MIN_TOUCH_TARGET } from '../../design/tokens';

interface ThemeSelectionStepProps {
  onContinue: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const HORIZONTAL_PADDING = 20;

export function ThemeSelectionStep({ onContinue }: ThemeSelectionStepProps) {
  const { themePreference, setThemePreference, activeTheme } = useTheme();

  const handleSelect = (pref: ThemePreference) => {
    setThemePreference(pref);
  };

  const isDarkSelected = themePreference === 'dark' || (themePreference === 'system' && activeTheme === 'dark');
  const isLightSelected = themePreference === 'light' || (themePreference === 'system' && activeTheme === 'light');

  return (
    <View style={styles.container}>
      {/* ── Atmospheric Radial Nebula Glow at Top ── */}
      <View style={styles.glowContainer} pointerEvents="none">
        <Svg height="380" width={SCREEN_WIDTH}>
          <Defs>
            <RadialGradient
              id="onboardingNebula"
              cx="50%"
              cy="12%"
              rx="75%"
              ry="52%"
              fx="50%"
              fy="12%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="#515DC3" stopOpacity="0.82" />
              <Stop offset="30%" stopColor="#373A6A" stopOpacity="0.55" />
              <Stop offset="65%" stopColor="#181938" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={SCREEN_WIDTH} height="380" fill="url(#onboardingNebula)" />
        </Svg>
      </View>

      {/* ── Top Content Block ── */}
      <View>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <Text style={styles.brandTitle}>Billframe</Text>
          <Text style={styles.brandSubtitle}>Invoices made simple.</Text>
        </View>

        {/* Screen Title & Instructions */}
        <View style={styles.headingSection}>
          <Text style={styles.mainHeading}>Choose your theme</Text>
          <Text style={styles.subHeading}>
            Pick what feels right for you. You can always change it later in settings.
          </Text>
        </View>

        {/* ── Side-by-Side Theme Cards ── */}
        <View style={styles.cardsRow}>
          {/* ── Dark Theme Card ── */}
          <Pressable
            style={[
              styles.card,
              styles.darkThemeCard,
              isDarkSelected && styles.cardSelectedDark,
            ]}
            onPress={() => handleSelect('dark')}
            accessibilityRole="radio"
            accessibilityState={{ selected: isDarkSelected }}
            accessibilityLabel="Dark Theme"
          >
            {/* Radio Indicator Top-Right */}
            <View style={styles.radioContainer}>
              {isDarkSelected ? (
                <View style={styles.checkedCircleDark}>
                  <Check size={13} color="#000000" strokeWidth={3} />
                </View>
              ) : (
                <View style={styles.uncheckedCircleDark} />
              )}
            </View>

            {/* Miniature UI Mockup */}
            <View style={styles.darkMiniatureBox}>
              <View style={styles.miniatureHeaderRow}>
                <View style={styles.miniDocIconWrapDark}>
                  <FileText size={14} color="#FFFFFF" strokeWidth={2.2} />
                </View>
                <View style={styles.miniLinesCol}>
                  <View style={[styles.miniSkeletonLine, { width: 44, backgroundColor: '#4B5063' }]} />
                  <View style={[styles.miniSkeletonLine, { width: 28, backgroundColor: '#333748', marginTop: 4 }]} />
                </View>
              </View>

              <View style={styles.miniSeparatorDark} />
              <View style={[styles.miniSkeletonLine, { width: '80%', backgroundColor: '#2E3242', marginBottom: 10 }]} />

              {/* Mock Primary Button */}
              <View style={styles.miniPrimaryBtnDark}>
                <Text style={styles.miniPrimaryBtnTextDark}>Primary</Text>
              </View>

              {/* Mock Secondary Button */}
              <View style={styles.miniSecondaryBtnDark}>
                <Text style={styles.miniSecondaryBtnTextDark}>Secondary</Text>
              </View>
            </View>

            {/* Card Label & Description */}
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleDark}>Dark Theme</Text>
              <Text style={styles.cardDescDark}>
                Clean contrast for dark environments.
              </Text>
            </View>
          </Pressable>

          {/* ── Light Theme Card ── */}
          <Pressable
            style={[
              styles.card,
              styles.lightThemeCard,
              isLightSelected && styles.cardSelectedLight,
            ]}
            onPress={() => handleSelect('light')}
            accessibilityRole="radio"
            accessibilityState={{ selected: isLightSelected }}
            accessibilityLabel="Light Theme"
          >
            {/* Radio Indicator Top-Right */}
            <View style={styles.radioContainer}>
              {isLightSelected ? (
                <View style={styles.checkedCircleLight}>
                  <Check size={13} color="#FFFFFF" strokeWidth={3} />
                </View>
              ) : (
                <View style={styles.uncheckedCircleLight} />
              )}
            </View>

            {/* Miniature UI Mockup */}
            <View style={styles.lightMiniatureBox}>
              <View style={styles.miniatureHeaderRow}>
                <View style={styles.miniDocIconWrapLight}>
                  <FileText size={14} color="#111827" strokeWidth={2.2} />
                </View>
                <View style={styles.miniLinesCol}>
                  <View style={[styles.miniSkeletonLine, { width: 44, backgroundColor: '#9CA3AF' }]} />
                  <View style={[styles.miniSkeletonLine, { width: 28, backgroundColor: '#D1D5DB', marginTop: 4 }]} />
                </View>
              </View>

              <View style={styles.miniSeparatorLight} />
              <View style={[styles.miniSkeletonLine, { width: '80%', backgroundColor: '#E5E7EB', marginBottom: 10 }]} />

              {/* Mock Primary Button */}
              <View style={styles.miniPrimaryBtnLight}>
                <Text style={styles.miniPrimaryBtnTextLight}>Primary</Text>
              </View>

              {/* Mock Secondary Button */}
              <View style={styles.miniSecondaryBtnLight}>
                <Text style={styles.miniSecondaryBtnTextLight}>Secondary</Text>
              </View>
            </View>

            {/* Card Label & Description */}
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleLight}>Light Theme</Text>
              <Text style={styles.cardDescLight}>
                A bright, clean look for well-lit workspaces.
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* ── Bottom Action Area ── */}
      <View style={styles.bottomSection}>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            { opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={onContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue to workspace setup"
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} style={styles.continueIcon} />
        </Pressable>

        <Text style={styles.footerNote}>
          You can change this later in settings.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: HORIZONTAL_PADDING,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 44 : 28,
    paddingBottom: Platform.OS === 'ios' ? 36 : 28,
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA2CB',
    marginTop: 4,
    letterSpacing: 0.1,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  mainHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: 'center',
  },
  subHeading: {
    fontSize: 13,
    lineHeight: 19,
    color: '#8E92AB',
    textAlign: 'center',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: CARD_GAP,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    borderRadius: 22,
    padding: 12,
    minHeight: 290,
    justifyContent: 'space-between',
  },
  darkThemeCard: {
    backgroundColor: '#111218',
    borderColor: '#262836',
    borderWidth: 1.5,
  },
  cardSelectedDark: {
    borderColor: '#3F4460',
    shadowColor: '#515DC3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  lightThemeCard: {
    backgroundColor: '#F0F2F6',
    borderColor: '#DDE1EC',
    borderWidth: 1.5,
  },
  cardSelectedLight: {
    borderColor: '#111827',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  radioContainer: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  checkedCircleDark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckedCircleDark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#3F4460',
  },
  checkedCircleLight: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckedCircleLight: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C5C8D6',
  },
  darkMiniatureBox: {
    backgroundColor: '#181922',
    borderRadius: 14,
    padding: 10,
    borderColor: '#282A38',
    borderWidth: 1,
    marginBottom: 12,
  },
  lightMiniatureBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderColor: '#E5E7EB',
    borderWidth: 1,
    marginBottom: 12,
  },
  miniatureHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniDocIconWrapDark: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#242634',
    borderWidth: 1,
    borderColor: '#333748',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  miniDocIconWrapLight: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  miniLinesCol: {
    flex: 1,
  },
  miniSkeletonLine: {
    height: 4,
    borderRadius: 2,
  },
  miniSeparatorDark: {
    height: 1,
    backgroundColor: '#252733',
    marginVertical: 8,
  },
  miniSeparatorLight: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  miniPrimaryBtnDark: {
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  miniPrimaryBtnTextDark: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '700',
  },
  miniSecondaryBtnDark: {
    backgroundColor: 'transparent',
    borderColor: '#333748',
    borderWidth: 1,
    borderRadius: 7,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniSecondaryBtnTextDark: {
    color: '#9CA2CB',
    fontSize: 10,
    fontWeight: '600',
  },
  miniPrimaryBtnLight: {
    backgroundColor: '#111827',
    borderRadius: 7,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  miniPrimaryBtnTextLight: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  miniSecondaryBtnLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 7,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniSecondaryBtnTextLight: {
    color: '#374151',
    fontSize: 10,
    fontWeight: '600',
  },
  cardTextContainer: {
    marginTop: 2,
  },
  cardTitleDark: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescDark: {
    color: '#8C90A4',
    fontSize: 11,
    lineHeight: 15,
  },
  cardTitleLight: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescLight: {
    color: '#606475',
    fontSize: 11,
    lineHeight: 15,
  },
  bottomSection: {
    alignItems: 'center',
    paddingTop: 8,
  },
  continueButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#24283B',
    borderWidth: 1,
    borderColor: '#343B56',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: MIN_TOUCH_TARGET,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  continueIcon: {
    marginLeft: 8,
  },
  footerNote: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7082',
    textAlign: 'center',
  },
});

/**
 * BILLFRAME DESIGN TOKENS
 * Strict, restrained neutral visual system adhering to the Billframe Product Specification.
 * No gradients, no glassmorphism, no neon glows, no random floating cards.
 */

export const spacing = {
  /** 4dp */
  xs: 4,
  /** 8dp */
  sm: 8,
  /** 12dp */
  md: 12,
  /** 16dp - Standard horizontal screen margin */
  lg: 16,
  /** 20dp */
  xl: 20,
  /** 24dp */
  xxl: 24,
  /** 32dp */
  xxxl: 32,
} as const;

export const radii = {
  /** 4dp - Small tags, badges */
  xs: 4,
  /** 8dp - Inputs, standard buttons, item rows */
  sm: 8,
  /** 12dp - Containers, dialogs */
  md: 12,
  /** 16dp - Bottom sheet top corners */
  lg: 16,
  /** 20dp - Large bottom sheets, modals */
  xl: 20,
  /** 9999dp - Exclusively for status badges / pills */
  pill: 9999,
  /** 9999dp - Circular avatars / pills */
  full: 9999,
} as const;

export const typography = {
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  supporting: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  screenTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600' as const,
  },
  headingMax: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
  },
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  borderSubtle: string;
  borderFocused: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  brandAnchor: string;
  /** Text color ON a brandAnchor background. White in light mode, near-black in dark mode. */
  brandAnchorText: string;
  statusDraft: string;
  statusIssued: string;
  statusSuccess: string;
  statusWarning: string;
  statusDanger: string;
}

export const colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    background: '#F7F7F6',
    surface: '#FFFFFF',
    surfaceSecondary: '#EFEFED',
    borderSubtle: '#E5E5E3',
    borderFocused: '#171717',
    textPrimary: '#171717',
    textSecondary: '#6B6B6B',
    textMuted: '#9E9E9C',
    brandAnchor: '#171717',
    brandAnchorText: '#FFFFFF',
    statusDraft: '#6B6B6B',
    statusIssued: '#2563EB',
    statusSuccess: '#15803D',
    statusWarning: '#B45309',
    statusDanger: '#B91C1C',
  },
  dark: {
    background: '#111111',
    surface: '#181818',
    surfaceSecondary: '#222222',
    borderSubtle: '#2A2A2A',
    borderFocused: '#F5F5F5',
    textPrimary: '#F5F5F5',
    textSecondary: '#A1A1A1',
    textMuted: '#666666',
    brandAnchor: '#F5F5F5',
    brandAnchorText: '#111111',
    statusDraft: '#A1A1A1',
    statusIssued: '#3B82F6',
    statusSuccess: '#22C55E',
    statusWarning: '#F59E0B',
    statusDanger: '#EF4444',
  },
};


/** Minimum touch target size required by Android Accessibility Guidelines */
export const MIN_TOUCH_TARGET = 48;

/** Maximum form content width on expanded/tablet layouts */
export const MAX_CONTENT_WIDTH = 720;

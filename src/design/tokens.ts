/**
 * BILLFRAME DESIGN TOKENS — ARCTIC AURORA DESIGN SYSTEM
 * Frozen neutral palette, typography, spacing, and centralized Arctic Aurora color families.
 * 
 * Strict invariants:
 * - Neutral-first background and surfaces
 * - Monochrome typography and icons
 * - Exactly two chromatic colors per Aurora palette
 * - Subdued, atmospheric upper-viewport lighting
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
  /** 40dp */
  huge: 40,
} as const;

export const radii = {
  /** 4dp - Small tags, badges */
  xs: 4,
  /** 8dp - Inputs, standard buttons, item rows */
  sm: 8,
  /** 12dp - Containers, dialogs */
  md: 12,
  /** 16dp - Bottom sheet top corners, cards */
  lg: 16,
  /** 20dp - Large bottom sheets, modals */
  xl: 20,
  /** 24dp - Premium cards */
  xxl: 24,
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
  surfaceElevated: string;
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
    surfaceElevated: '#E5E5E3',
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
    background: '#0D0E10',
    surface: '#17191D',
    surfaceSecondary: '#202227',
    surfaceElevated: '#272A30',
    borderSubtle: '#303238',
    borderFocused: '#F5F5F6',
    textPrimary: '#F5F5F6',
    textSecondary: '#A8AAB0',
    textMuted: '#777B83',
    brandAnchor: '#F5F5F6',
    brandAnchorText: '#0D0E10',
    statusDraft: '#A8AAB0',
    statusIssued: '#3B82F6',
    statusSuccess: '#22C55E',
    statusWarning: '#F59E0B',
    statusDanger: '#EF4444',
  },
};

/**
 * ARCTIC AURORA COLOR FAMILIES
 * Exactly two chromatic colors per section.
 * Renders atmospheric Northern Lights lighting across the upper 20-30% of the viewport.
 */
export type AuroraSection =
  | 'home'
  | 'documents'
  | 'clients'
  | 'work'
  | 'all'
  | 'template_studio'
  | 'onboarding'
  | 'sales_billing'
  | 'purchases'
  | 'collections'
  | 'reports'
  | 'security_data';

export interface AuroraPalette {
  readonly primary: string;
  readonly secondary: string;
  readonly name: string;
}

export const AURORA_PALETTES: Record<AuroraSection, AuroraPalette> = {
  home: { primary: '#143A69', secondary: '#39335F', name: 'Arctic Blue & Slate Violet' },
  documents: { primary: '#33275E', secondary: '#514078', name: 'Deep Indigo & Muted Plum' },
  clients: { primary: '#124A50', secondary: '#2A445D', name: 'Polar Teal & Blue Gray' },
  work: { primary: '#543B2B', secondary: '#574C4A', name: 'Bronze Graphite & Muted Graphite' },
  all: { primary: '#34334F', secondary: '#50506C', name: 'Charcoal Indigo & Soft Slate Violet' },
  template_studio: { primary: '#45346F', secondary: '#244C79', name: 'Muted Amethyst & Midnight Blue' },
  onboarding: { primary: '#21446C', secondary: '#24505B', name: 'Ocean Navy & Deep Teal' },
  sales_billing: { primary: '#213D65', secondary: '#3D3E69', name: 'Deep Cobalt & Muted Indigo' },
  purchases: { primary: '#493A35', secondary: '#4C535D', name: 'Copper Slate & Steel Gray' },
  collections: { primary: '#174448', secondary: '#2E4257', name: 'Deep Petrol & Slate Navy' },
  reports: { primary: '#2B4561', secondary: '#45435F', name: 'Blue Graphite & Muted Violet' },
  security_data: { primary: '#303B45', secondary: '#374B55', name: 'Graphite & Deep Steel' },
};

/** Minimum touch target size required by Android Accessibility Guidelines */
export const MIN_TOUCH_TARGET = 48;

/** Maximum form content width on expanded/tablet layouts */
export const MAX_CONTENT_WIDTH = 720;

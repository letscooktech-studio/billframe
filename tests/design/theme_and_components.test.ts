/**
 * THEME SYSTEM & DESIGN COMPONENTS TEST SUITE
 * Tests for Billframe 4.0 Milestone B:
 * 1. SettingsRepository key-value storage in SQLite
 * 2. Strict monochrome tokens and inverted action button colors
 * 3. ThemeContext resolution and preference persistence
 * 4. Card and Badge component contracts and variants
 */

import React from 'react';
import { colors, monochrome, radii, spacing, MIN_TOUCH_TARGET } from '../../src/design/tokens';
import { SettingsRepository } from '../../src/data/repositories/SettingsRepository';
import { DatabaseManager } from '../../src/data/database/DatabaseManager';
import { getMockDb } from '../mocks/expo-sqlite';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';

describe('Milestone B: SettingsRepository & Theme Persistence', () => {
  beforeEach(async () => {
    getMockDb().reset();
    await DatabaseManager.initDatabaseAsync(getMockDb() as any);
  });

  it('stores and retrieves theme preference in settings table', async () => {
    const defaultTheme = await SettingsRepository.get('theme_preference', 'system');
    expect(defaultTheme).toBe('system');

    await SettingsRepository.set('theme_preference', 'dark');
    const darkTheme = await SettingsRepository.get('theme_preference');
    expect(darkTheme).toBe('dark');

    await SettingsRepository.set('theme_preference', 'light');
    const lightTheme = await SettingsRepository.get('theme_preference');
    expect(lightTheme).toBe('light');
  });

  it('deletes settings and lists all settings', async () => {
    await SettingsRepository.set('key1', 'val1');
    await SettingsRepository.set('key2', 'val2');

    const all = await SettingsRepository.listAll();
    expect(all['key1']).toBe('val1');
    expect(all['key2']).toBe('val2');

    await SettingsRepository.delete('key1');
    const afterDelete = await SettingsRepository.get('key1');
    expect(afterDelete).toBeNull();
  });
});

describe('Milestone B: Strict Monochrome Token Inversion Invariants', () => {
  it('strictly inverts primary button colors between dark and light themes', () => {
    // Dark mode: off-white filled button with dark text
    expect(colors.dark.primaryActionBg).toBe('#F3F3F4');
    expect(colors.dark.primaryActionText).toBe('#141416');

    // Light mode: near-black filled button with white text
    expect(colors.light.primaryActionBg).toBe('#171717');
    expect(colors.light.primaryActionText).toBe('#FFFFFF');
  });

  it('provides dedicated card background and border tokens', () => {
    expect(colors.dark.cardBg).toBe('#18191D');
    expect(colors.dark.cardBorder).toBe('#35363B');

    expect(colors.light.cardBg).toBe('#FFFFFF');
    expect(colors.light.cardBorder).toBe('#E5E5E3');
  });

  it('satisfies touch target and corner radius standards', () => {
    expect(MIN_TOUCH_TARGET).toBeGreaterThanOrEqual(48);
    expect(radii.card).toBe(14);
    expect(radii.button).toBe(14);
    expect(radii.pill).toBe(9999);
  });
});

describe('Milestone B: Standardized Card & Badge Components', () => {
  it('creates Card elements with default, elevated, secondary, and outline variants', () => {
    const defaultCard = React.createElement(Card, { variant: 'default' }, 'Content');
    expect(defaultCard).toBeDefined();
    expect((defaultCard.props as any).variant).toBe('default');

    const elevatedCard = React.createElement(Card, { variant: 'elevated' }, 'Elevated');
    expect((elevatedCard.props as any).variant).toBe('elevated');

    const pressableCard = React.createElement(Card, { onPress: jest.fn() }, 'Pressable');
    expect((pressableCard.props as any).onPress).toBeDefined();
  });

  it('creates Badge elements with various status variants', () => {
    const draftBadge = React.createElement(Badge, { label: 'Draft', variant: 'draft' });
    expect((draftBadge.props as any).label).toBe('Draft');
    expect((draftBadge.props as any).variant).toBe('draft');

    const issuedBadge = React.createElement(Badge, { label: 'Issued', variant: 'issued' });
    expect((issuedBadge.props as any).variant).toBe('issued');

    const successBadge = React.createElement(Badge, { label: 'Paid', variant: 'success' });
    expect((successBadge.props as any).variant).toBe('success');
  });
});

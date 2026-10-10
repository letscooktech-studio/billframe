/**
 * ARCTIC AURORA BACKGROUND TEST SUITE
 * Verifies the section color palettes, two-chromatic-color invariant,
 * and component state contracts.
 */

import { AURORA_PALETTES, AuroraSection } from '../../src/design/tokens';

describe('Arctic Aurora Design System & Palettes', () => {
  const sections: AuroraSection[] = [
    'home',
    'documents',
    'clients',
    'work',
    'all',
    'template_studio',
    'onboarding',
    'sales_billing',
    'purchases',
    'collections',
    'reports',
    'security_data',
  ];

  it('defines unique two-color aurora palettes for all 12 sections', () => {
    sections.forEach((section) => {
      const palette = AURORA_PALETTES[section];
      expect(palette).toBeDefined();
      expect(palette.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(palette.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      // Invariant: Two chromatic colors must not be identical
      expect(palette.primary.toLowerCase()).not.toBe(palette.secondary.toLowerCase());
    });
  });

  it('matches frozen Arctic Aurora token specifications', () => {
    expect(AURORA_PALETTES.home.primary).toBe('#143A69');
    expect(AURORA_PALETTES.home.secondary).toBe('#39335F');

    expect(AURORA_PALETTES.documents.primary).toBe('#33275E');
    expect(AURORA_PALETTES.documents.secondary).toBe('#514078');

    expect(AURORA_PALETTES.clients.primary).toBe('#124A50');
    expect(AURORA_PALETTES.clients.secondary).toBe('#2A445D');

    expect(AURORA_PALETTES.work.primary).toBe('#543B2B');
    expect(AURORA_PALETTES.work.secondary).toBe('#574C4A');

    expect(AURORA_PALETTES.all.primary).toBe('#34334F');
    expect(AURORA_PALETTES.all.secondary).toBe('#50506C');

    expect(AURORA_PALETTES.template_studio.primary).toBe('#45346F');
    expect(AURORA_PALETTES.template_studio.secondary).toBe('#244C79');
  });
});

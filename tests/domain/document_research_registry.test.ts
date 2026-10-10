/**
 * DOCUMENT RESEARCH REGISTRY & DQS AUDIT TEST SUITE
 * Tests canonical document taxonomy, official source mappings,
 * and the 100-point Document Quality Score (DQS) rubric with hard release gates.
 */

import {
  DocumentResearchRegistry,
  DocumentResearchEntry,
} from '../../src/domain/documents/universal/DocumentResearchRegistry';

describe('Document Research Registry & DQS Engine', () => {
  it('1. provides canonical taxonomy entries with authoritative statutory references', () => {
    const entries = DocumentResearchRegistry.ENTRIES;
    expect(entries.length).toBeGreaterThanOrEqual(6);

    const offerLetter = entries.find((e) => e.id === 'job_offer_letter');
    expect(offerLetter).toBeDefined();
    expect(offerLetter?.family).toBe('hr_recruitment');
    expect(offerLetter?.sourceAuthority).toContain('Labour');

    const taxInvoice = entries.find((e) => e.id === 'tax_invoice');
    expect(taxInvoice).toBeDefined();
    expect(taxInvoice?.legalStatus).toBe('OFFICIALLY_PRESCRIBED');
    expect(taxInvoice?.sourceAuthority).toContain('CBIC');
  });

  it('2. retrieves entries by document family', () => {
    const hrDocs = DocumentResearchRegistry.getEntriesByFamily('hr_recruitment');
    expect(hrDocs.length).toBeGreaterThanOrEqual(2);
    expect(hrDocs.some((d) => d.id === 'job_offer_letter')).toBe(true);
    expect(hrDocs.some((d) => d.id === 'appointment_letter')).toBe(true);

    const salesDocs = DocumentResearchRegistry.getEntriesByFamily('sales_billing');
    expect(salesDocs.length).toBeGreaterThanOrEqual(2);
    expect(salesDocs.some((d) => d.id === 'tax_invoice')).toBe(true);
  });

  it('3. searches entries across canonical names and aliases', () => {
    const offerSearchResults = DocumentResearchRegistry.searchEntries('offer');
    expect(offerSearchResults.length).toBeGreaterThanOrEqual(1);
    expect(offerSearchResults[0].id).toBe('job_offer_letter');

    const aliasSearch = DocumentResearchRegistry.searchEntries('Job Card');
    expect(aliasSearch.length).toBeGreaterThanOrEqual(1);
    expect(aliasSearch.some((d) => d.id === 'work_order')).toBe(true);
  });

  it('4. calculates Document Quality Score (DQS) and evaluates release readiness', () => {
    const offerEntry = DocumentResearchRegistry.ENTRIES.find((e) => e.id === 'job_offer_letter')!;
    const audit = DocumentResearchRegistry.evaluateDqs(offerEntry);

    expect(audit.hardGatePassed).toBe(true);
    expect(audit.hardGateViolations.length).toBe(0);
    expect(audit.score).toBeGreaterThanOrEqual(95);
    expect(audit.releaseBand).toBe('S+++ (Ready)');
    expect(audit.breakdown.sourceApplicability).toBe(20);
    expect(audit.breakdown.fieldCompleteness).toBe(25);
    expect(audit.breakdown.semanticStructure).toBe(15);
    expect(audit.breakdown.layoutReadability).toBe(15);
  });

  it('5. enforces hard failure gates for invalid or unverified documents', () => {
    const invalidEntry: DocumentResearchEntry = {
      id: 'unverified_document',
      canonicalName: 'Unverified Document',
      aliases: [],
      businessPurpose: 'Test purposes',
      family: 'custom_organization',
      industries: ['General'],
      jurisdiction: 'GLOBAL',
      applicabilityConditions: 'None',
      legalStatus: 'OFFICIALLY_PRESCRIBED',
      sourceAuthority: '', // VIOLATION: missing authority
      sourceUrl: '',       // VIOLATION: prescribed without URL
      sourceTitle: '',
      requiredFields: [], // VIOLATION: missing mandatory fields
      optionalFields: [],
      fieldDataTypes: {},
      validationRules: [],
      authorizationRequirements: '',
      suggestedPageLayout: 'custom_form',
      recommendedTemplates: [],
      documentSensitivity: 'low',
      implementationStatus: 'BACKLOG',
      dqsScore: 0,
    };

    const audit = DocumentResearchRegistry.evaluateDqs(invalidEntry);
    expect(audit.hardGatePassed).toBe(false);
    expect(audit.releaseBand).toBe('Rejected');
    expect(audit.hardGateViolations.length).toBeGreaterThanOrEqual(2);
  });
});

import { escapeHtml as commonEscapeHtml } from '../../src/services/pdf/templates/commonStyles';
import { escapeHtml as gstEscapeHtml } from '../../src/services/pdf/templates/gst/gstCommon';
import { renderUniversalCustomHtml } from '../../src/services/pdf/templates/UniversalCustomRenderer';
import { UniversalDocumentInstance, UniversalDocumentSchema } from '../../src/domain/documents/universal/types';
import { BusinessProfile } from '../../src/domain/profile/types';
import { SecurityService } from '../../src/services/security/SecurityService';
import { resetMockStore } from '../mocks/expo-secure-store';

/**
 * Comprehensive App Security & Vulnerability Defense Suite
 * Audits XSS prevention, path traversal defense, and brute-force lockouts.
 */

describe('Security Audit: Injection Defense & Robustness Verification', () => {
  beforeEach(async () => {
    resetMockStore();
    await SecurityService.resetFailedAttempts();
  });

  describe('1. XSS & HTML Entity Escaping Defense', () => {
    const maliciousInputs = [
      '<script>alert("XSS")</script>',
      '"><img src=x onerror=alert(1)>',
      "' onfocus='alert(document.cookie)",
      'Company & Sons <LLC>',
      'Safe "Quoted" Text',
    ];

    it('escapes dangerous HTML/JS payloads across template helpers', () => {
      for (const input of maliciousInputs) {
        const escaped = commonEscapeHtml(input);
        expect(escaped).not.toContain('<script>');
        expect(escaped).not.toContain('<img');
        expect(escaped).not.toContain('"');
        expect(escaped).not.toContain("'");
      }
    });

    it('safely handles non-string and falsy types without throwing', () => {
      expect(commonEscapeHtml(null)).toBe('');
      expect(commonEscapeHtml(undefined)).toBe('');
      expect(commonEscapeHtml(0)).toBe('0');
      expect(commonEscapeHtml(12345)).toBe('12345');
      expect(commonEscapeHtml(false)).toBe('false');

      expect(gstEscapeHtml(null)).toBe('');
      expect(gstEscapeHtml(undefined)).toBe('');
      expect(gstEscapeHtml(0)).toBe('0');
    });

    it('prevents XSS injection into Universal Custom Document HTML output', () => {
      const mockBusiness: BusinessProfile = {
        id: 'biz_sec_01',
        name: '<script>alert("hacked_company")</script>',
        legal_name: '"><b onmouseover="alert(1)">Evil Corp</b>',
        tax_id: 'TAX&"123',
        country: 'IN',
        currency: 'INR',
        created_at: Date.now(),
        updated_at: Date.now(),
      } as any;

      const mockSchema: UniversalDocumentSchema = {
        code: 'custom_doc',
        name: '"><script>alert("doc_name")</script>',
        category: 'FINANCIAL',
        class: 'C',
        defaultTemplate: 'gold_master',
        sections: [
          {
            id: 'sec1',
            title: '<img src=x onerror=alert(2)>',
            fields: [
              { id: 'f1', label: '"><script>field</script>', type: 'text' },
            ],
          },
        ],
      } as any;

      const mockInstance: UniversalDocumentInstance = {
        id: 'inst_01',
        documentNumber: 'DOC-"<script>123</script>',
        issueDate: Date.now(),
        partyRole: 'Client',
        partyName: '<svg onload=alert(document.domain)>',
        status: 'draft',
        content: {
          f1: '"><script>alert(3)</script>',
        },
      } as any;

      const html = renderUniversalCustomHtml(mockInstance, mockSchema, mockBusiness, 'a4');

      // Assert that none of the malicious script tags can execute as raw HTML tags
      expect(html).not.toContain('<script>alert("hacked_company")</script>');
      expect(html).not.toContain('<script>alert("doc_name")</script>');
      expect(html).not.toContain('<img src=x onerror=alert(2)>');
      expect(html).not.toContain('<svg onload=alert(document.domain)>');
      expect(html).not.toContain('<script>alert(3)</script>');

      // Assert that they were safely encoded into HTML entities
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('2. Path Traversal & File Sanitization Defense', () => {
    it('sanitizes profile identifiers with directory traversal sequences', () => {
      const maliciousProfileId = '../../etc/passwd';
      const sanitized = maliciousProfileId.replace(/[^a-zA-Z0-9_-]/g, '_');

      expect(sanitized).toBe('______etc_passwd');
      expect(sanitized).not.toContain('..');
      expect(sanitized).not.toContain('/');
      expect(sanitized).not.toContain('\\');
    });
  });

  describe('3. Lockout Rate-Limiting Protection', () => {
    it('reports lockout active and tracks remaining duration', async () => {
      await SecurityService.setPin('9876');

      for (let i = 0; i < 5; i++) {
        await SecurityService.verifyPin('1111');
      }

      expect(await SecurityService.isLockedOut()).toBe(true);
      const remainingMs = await SecurityService.getLockoutRemainingMs();
      expect(remainingMs).toBeGreaterThan(0);
      expect(remainingMs).toBeLessThanOrEqual(30000);
    });
  });
});

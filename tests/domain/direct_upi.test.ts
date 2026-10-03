/**
 * DIRECT UPI & QR CODE ENGINE TEST SUITE
 * Verifies strict VPA syntax validation, NPCI-standard URI formatting,
 * offline QR matrix generation, SVG path serialization, and security invariants.
 */

import { DirectUpiEngine } from '../../src/domain/payments/upi/DirectUpiEngine';
import { QrCodeGenerator } from '../../src/domain/payments/upi/QrCodeGenerator';

describe('Direct UPI & QR Code Engine Tests', () => {
  describe('1. NPCI VPA Validation', () => {
    test('accepts valid standard VPAs across Indian bank handles', () => {
      const validCases = [
        'merchant@okhdfcbank',
        'billframe.store@axisbank',
        'john-doe@paytm',
        'acme_consulting@icici',
        'billing@upi',
        'shop.123@ybl',
      ];

      for (const vpa of validCases) {
        const res = DirectUpiEngine.validateVpa(vpa);
        expect(res.isValid).toBe(true);
        expect(res.normalizedVpa).toBe(vpa.toLowerCase());
      }
    });

    test('rejects malformed, empty, or malicious injection VPAs', () => {
      const invalidCases = [
        '',
        '   ',
        'merchantbank', // Missing @
        'merchant@@bank', // Double @
        'merchant@bank@extra',
        'mer chant@bank', // Spaces
        'merchant&am=1000@bank', // Query param injection attempt
        'merchant?test@bank',
        'a@b', // Too short
        null as any,
        undefined as any,
      ];

      for (const vpa of invalidCases) {
        const res = DirectUpiEngine.validateVpa(vpa);
        expect(res.isValid).toBe(false);
        expect(res.error).toBeDefined();
      }
    });
  });

  describe('2. UPI URI Builder', () => {
    test('builds standard upi://pay URI with exact amount in decimal format', () => {
      const uri = DirectUpiEngine.buildUpiUri({
        vpa: 'merchant@okhdfcbank',
        payeeName: 'Acme Technologies Pvt Ltd',
        amountMinor: 145050n, // ₹1,450.50
        currency: 'INR',
        transactionNote: 'Invoice INV-0042',
        transactionRef: 'INV-0042',
      });

      expect(uri.startsWith('upi://pay?')).toBe(true);
      expect(uri).toContain('pa=merchant%40okhdfcbank');
      expect(uri).toContain('pn=Acme+Technologies+Pvt+Ltd');
      expect(uri).toContain('am=1450.50');
      expect(uri).toContain('cu=INR');
      expect(uri).toContain('tn=Invoice+INV-0042');
      expect(uri).toContain('tr=INV-0042');
    });

    test('handles round integer amounts with .00 decimals', () => {
      const uri = DirectUpiEngine.buildUpiUri({
        vpa: 'store@upi',
        payeeName: 'Super Store',
        amountMinor: 500000n, // ₹5,000.00
        currency: 'INR',
        transactionNote: 'Payment for Bill 101',
      });

      expect(uri).toContain('am=5000.00');
    });

    test('rejects zero or negative payment amounts', () => {
      expect(() =>
        DirectUpiEngine.buildUpiUri({
          vpa: 'store@upi',
          payeeName: 'Super Store',
          amountMinor: 0n,
          currency: 'INR',
          transactionNote: 'Zero payment',
        })
      ).toThrow('UPI payment amount must be greater than zero');

      expect(() =>
        DirectUpiEngine.buildUpiUri({
          vpa: 'store@upi',
          payeeName: 'Super Store',
          amountMinor: -1000n,
          currency: 'INR',
          transactionNote: 'Negative payment',
        })
      ).toThrow('UPI payment amount must be greater than zero');
    });

    test('parses and reconstructs valid UPI URIs accurately', () => {
      const original = {
        vpa: 'vendor@icici',
        payeeName: 'Vendor Name',
        amountMinor: 25000n, // ₹250.00
        currency: 'INR' as const,
        transactionNote: 'Inv 12',
        transactionRef: 'REF123',
      };

      const uri = DirectUpiEngine.buildUpiUri(original);
      const parsed = DirectUpiEngine.parseUpiUri(uri);

      expect(parsed).toBeDefined();
      expect(parsed?.vpa).toBe(original.vpa);
      expect(parsed?.payeeName).toBe(original.payeeName);
      expect(parsed?.amountMinor).toBe(original.amountMinor);
      expect(parsed?.currency).toBe('INR');
      expect(parsed?.transactionNote).toBe(original.transactionNote);
      expect(parsed?.transactionRef).toBe(original.transactionRef);
    });

    test('parses static merchant counter QR code without amount or optional fields', () => {
      // Real-world merchant sticker QR from PhonePe/GPay standee
      const staticStickerQr = 'upi://pay?pa=store@paytm&pn=City%20General%20Store&cu=INR';
      const parsed = DirectUpiEngine.parseUpiUri(staticStickerQr);

      expect(parsed).toBeDefined();
      expect(parsed?.vpa).toBe('store@paytm');
      expect(parsed?.payeeName).toBe('City General Store');
      expect(parsed?.amountMinor).toBe(0n);
      expect(parsed?.currency).toBe('INR');
    });

    test('builds open-amount static merchant counter QR when amountMinor is omitted', () => {
      const uri = DirectUpiEngine.buildUpiUri({
        vpa: 'store@paytm',
        payeeName: 'City General Store',
        currency: 'INR',
      });

      expect(uri.startsWith('upi://pay?')).toBe(true);
      expect(uri).toContain('pa=store%40paytm');
      expect(uri).toContain('pn=City+General+Store');
      expect(uri).toContain('cu=INR');
      expect(uri).not.toContain('am='); // No fixed amount, customer types any amount!
    });

    test('automatically converts foreign currency (USD) to INR using official reference rates', () => {
      const result = DirectUpiEngine.buildUpiUriWithCurrencyConversion({
        vpa: 'merchant@okhdfcbank',
        payeeName: 'Tech Services',
        sourceAmountMinor: 10000n, // $100.00 USD
        sourceCurrency: 'USD',
        transactionRef: 'INV-USD-100',
      });

      expect(result.isConverted).toBe(true);
      expect(result.inrAmountMinor).toBeDefined();
      expect(result.inrAmountMinor! > 800000n).toBe(true); // $100 > ₹8,000 INR
      expect(result.upiUri).toContain('am=');
      expect(result.conversionSummary).toContain('$100.00');
      expect(result.conversionSummary).toContain('₹');
      // Verify no duplicate currency strings in exchangeRateLabel
      expect(result.exchangeRateLabel).not.toMatch(/1 USD = 1 USD/);
      expect(result.exchangeRateLabel).not.toMatch(/INR INR/);
      expect(result.exchangeRateLabel).toBe('ECB Official Reference Rate (2026-03-31): 1 USD = 83.1797 INR');
    });
  });

  describe('3. Offline QR Code Matrix & SVG Path Generator', () => {
    test('generates valid square boolean matrix with finder patterns', () => {
      const payload = 'upi://pay?pa=test@upi&pn=Test&am=100.00&cu=INR';
      const matrix = QrCodeGenerator.generateMatrix(payload);

      expect(matrix.length).toBeGreaterThanOrEqual(21);
      expect(matrix[0].length).toBe(matrix.length); // Must be perfectly square

      // Top-Left Finder pattern check (7x7 outer border)
      // Top row of finder: (0,0) to (0,6) should be dark
      for (let c = 0; c < 7; c++) {
        expect(matrix[0][c]).toBe(true);
        expect(matrix[6][c]).toBe(true);
      }
      for (let r = 0; r < 7; r++) {
        expect(matrix[r][0]).toBe(true);
        expect(matrix[r][6]).toBe(true);
      }

      // Center of top-left finder (3x3 core) should be dark
      for (let r = 2; r <= 4; r++) {
        for (let c = 2; c <= 4; c++) {
          expect(matrix[r][c]).toBe(true);
        }
      }
    });

    test('generates valid SVG path data string for native rendering', () => {
      const payload = 'upi://pay?pa=merchant@okhdfcbank&pn=Merchant&am=500.00&cu=INR';
      const matrix = QrCodeGenerator.generateMatrix(payload);
      const svgPath = QrCodeGenerator.generateSvgPath(matrix);

      expect(typeof svgPath).toBe('string');
      expect(svgPath.length).toBeGreaterThan(100);
      expect(svgPath.startsWith('M')).toBe(true);
      expect(svgPath).toContain('h1v1h-1z');
    });

    test('generates complete inline SVG element with customizable dimensions and colors', () => {
      const payload = 'upi://pay?pa=merchant@okhdfcbank&pn=Merchant&am=500.00&cu=INR';
      const svg = QrCodeGenerator.generateSvg(payload, 150, { color: '#1e293b', backgroundColor: '#f8fafc' });

      expect(svg).toContain('<svg');
      expect(svg).toContain('width="150"');
      expect(svg).toContain('height="150"');
      expect(svg).toContain('fill="#1e293b"');
      expect(svg).toContain('background-color: #f8fafc');
    });
  });
});

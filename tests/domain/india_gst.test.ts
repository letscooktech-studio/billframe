/**
 * INDIA GST TAX ENGINE TEST SUITE
 * Verifies place-of-supply determination, UTGST for Union Territories,
 * offline HSN/SAC catalog resolution, inclusive vs exclusive rounding,
 * reverse charge detection, and multi-slab document breakdowns.
 */

import { calculateDocument } from '../../src/domain/documents/DocumentCalculator';
import { CountryPackRegistry } from '../../src/domain/tax/CountryPackRegistry';
import { IndiaGstPack, INDIA_HSN_SAC_CATALOG } from '../../src/domain/tax/packs/IndiaGstPack';
import { resolveTaxForLineItem } from '../../src/domain/tax/TaxEngine';

describe('India GST Domain Engine Tests', () => {
  const gstPack = new IndiaGstPack();

  test('1. Intra-state supply resolves to CGST (50%) + SGST (50%)', () => {
    const decision = gstPack.resolveItemTax({
      businessProfile: {
        countryIso2: 'IN',
        subdivisionCode: 'IN-KA', // Karnataka
        isTaxRegistered: true,
      },
      customer: {
        countryIso2: 'IN',
        subdivisionCode: 'IN-KA', // Karnataka
      },
      item: {
        unitPriceMinor: 100000n, // ₹1,000.00
        quantityScaled: 10000n, // 1.0 unit
        taxRateBasisPoints: 1800n, // 18%
      },
      taxType: 'exclusive',
    });

    expect(decision.supplyType).toBe('intra_state');
    expect(decision.totalTaxRateBasisPoints).toBe(1800n);
    expect(decision.taxableAmountMinor).toBe(100000n);
    expect(decision.totalTaxAmountMinor).toBe(18000n); // ₹180.00
    expect(decision.grossAmountMinor).toBe(118000n); // ₹1,180.00

    expect(decision.components.length).toBe(2);
    const cgst = decision.components.find((c) => c.code === 'CGST');
    const sgst = decision.components.find((c) => c.code === 'SGST');

    expect(cgst).toBeDefined();
    expect(cgst?.rateBasisPoints).toBe(900n);
    expect(cgst?.amountMinor).toBe(9000n); // ₹90.00

    expect(sgst).toBeDefined();
    expect(sgst?.rateBasisPoints).toBe(900n);
    expect(sgst?.amountMinor).toBe(9000n); // ₹90.00

    // Invariant: sum of components must exactly match total tax
    expect(cgst!.amountMinor + sgst!.amountMinor).toBe(decision.totalTaxAmountMinor);
  });

  test('2. Intra-state supply in Union Territory without legislature resolves to CGST + UTGST', () => {
    // Chandigarh (IN-CH) is a Union Territory without its own state legislature
    const decision = gstPack.resolveItemTax({
      businessProfile: {
        countryIso2: 'IN',
        subdivisionCode: 'IN-CH',
        isTaxRegistered: true,
      },
      customer: {
        countryIso2: 'IN',
        subdivisionCode: 'IN-CH',
      },
      item: {
        unitPriceMinor: 50000n, // ₹500.00
        quantityScaled: 20000n, // 2.0 units = ₹1,000.00
        taxRateBasisPoints: 1200n, // 12%
      },
      taxType: 'exclusive',
    });

    expect(decision.supplyType).toBe('intra_state');
    expect(decision.totalTaxAmountMinor).toBe(12000n); // ₹120.00

    const cgst = decision.components.find((c) => c.code === 'CGST');
    const utgst = decision.components.find((c) => c.code === 'UTGST');
    const sgst = decision.components.find((c) => c.code === 'SGST');

    expect(cgst).toBeDefined();
    expect(cgst?.amountMinor).toBe(6000n); // ₹60.00

    expect(utgst).toBeDefined();
    expect(utgst?.name).toBe('Union Territory GST');
    expect(utgst?.amountMinor).toBe(6000n); // ₹60.00

    expect(sgst).toBeUndefined(); // Must NOT be SGST
    expect(cgst!.amountMinor + utgst!.amountMinor).toBe(decision.totalTaxAmountMinor);
  });

  test('3. Inter-state supply resolves to 100% IGST', () => {
    // Karnataka supplier selling to Maharashtra customer
    const decision = gstPack.resolveItemTax({
      businessProfile: {
        countryIso2: 'IN',
        subdivisionCode: 'IN-KA',
      },
      customer: {
        countryIso2: 'IN',
        subdivisionCode: 'IN-MH',
      },
      item: {
        unitPriceMinor: 250000n, // ₹2,500.00
        quantityScaled: 10000n,
        taxRateBasisPoints: 1800n,
      },
      taxType: 'exclusive',
    });

    expect(decision.supplyType).toBe('inter_state');
    expect(decision.totalTaxRateBasisPoints).toBe(1800n);
    expect(decision.totalTaxAmountMinor).toBe(45000n); // ₹450.00
    expect(decision.grossAmountMinor).toBe(295000n); // ₹2,950.00

    expect(decision.components.length).toBe(1);
    expect(decision.components[0].code).toBe('IGST');
    expect(decision.components[0].amountMinor).toBe(45000n);
  });

  test('4. Export supply resolves to 0% IGST under export LUT framework', () => {
    // Indian supplier exporting software services to US customer
    const decision = gstPack.resolveItemTax({
      businessProfile: {
        countryIso2: 'IN',
        subdivisionCode: 'IN-KA',
      },
      customer: {
        countryIso2: 'US',
        subdivisionCode: 'CA',
      },
      item: {
        unitPriceMinor: 500000n, // $5,000.00 / ₹5,000.00
        quantityScaled: 10000n,
        taxRateBasisPoints: 1800n,
      },
      taxType: 'exclusive',
    });

    expect(decision.supplyType).toBe('export');
    expect(decision.totalTaxAmountMinor).toBe(0n);
    expect(decision.grossAmountMinor).toBe(500000n);
    expect(decision.components[0].code).toBe('IGST');
    expect(decision.components[0].rateBasisPoints).toBe(0n);
  });

  test('5. Tax-inclusive pricing correctly extracts base and preserves component sum equality', () => {
    // Gross = ₹1,180.00 (118000 minor) at 18% inclusive
    const decision = gstPack.resolveItemTax({
      businessProfile: {
        countryIso2: 'IN',
        subdivisionCode: 'IN-DL', // Delhi (legislative UT -> SGST)
      },
      customer: {
        countryIso2: 'IN',
        subdivisionCode: 'IN-DL',
      },
      item: {
        unitPriceMinor: 118000n,
        quantityScaled: 10000n,
        taxRateBasisPoints: 1800n,
      },
      taxType: 'inclusive',
    });

    expect(decision.grossAmountMinor).toBe(118000n);
    expect(decision.taxableAmountMinor).toBe(100000n); // ₹1,000.00
    expect(decision.totalTaxAmountMinor).toBe(18000n); // ₹180.00

    const cgst = decision.components.find((c) => c.code === 'CGST')!;
    const sgst = decision.components.find((c) => c.code === 'SGST')!;

    expect(cgst.amountMinor).toBe(9000n);
    expect(sgst.amountMinor).toBe(9000n);
    expect(cgst.amountMinor + sgst.amountMinor).toBe(decision.totalTaxAmountMinor);
  });

  test('6. Offline HSN/SAC catalog auto-resolves rate and supports prefix/keyword search', () => {
    // SAC 998314: IT design and dev -> 18%
    const itService = gstPack.resolveItemTax({
      businessProfile: { countryIso2: 'IN', subdivisionCode: 'IN-KA' },
      customer: { countryIso2: 'IN', subdivisionCode: 'IN-KA' },
      item: {
        hsnSacCode: '998314',
        unitPriceMinor: 100000n,
        quantityScaled: 10000n,
      },
      taxType: 'exclusive',
    });
    expect(itService.totalTaxRateBasisPoints).toBe(1800n);

    // HSN 4901: Printed books -> 0% (Nil)
    const books = gstPack.resolveItemTax({
      businessProfile: { countryIso2: 'IN', subdivisionCode: 'IN-KA' },
      customer: { countryIso2: 'IN', subdivisionCode: 'IN-KA' },
      item: {
        hsnSacCode: '4901',
        unitPriceMinor: 50000n,
        quantityScaled: 10000n,
      },
      taxType: 'exclusive',
    });
    expect(books.totalTaxRateBasisPoints).toBe(0n);
    expect(books.supplyType).toBe('nil_rated');

    // Search tests
    const laptopSearch = gstPack.searchHsnSac('laptop');
    expect(laptopSearch.length).toBeGreaterThan(0);
    expect(laptopSearch[0].code).toBe('8471');

    const sacSearch = gstPack.searchHsnSac('9983');
    expect(sacSearch.length).toBeGreaterThan(3);
  });

  test('7. Reverse charge is detected for legal services provided to registered business', () => {
    const decision = gstPack.resolveItemTax({
      businessProfile: { countryIso2: 'IN', subdivisionCode: 'IN-DL' },
      customer: {
        countryIso2: 'IN',
        subdivisionCode: 'IN-DL',
        isBusiness: true,
        taxId: '29ABCDE1234F1Z5',
      },
      item: {
        hsnSacCode: '998211', // Legal advisory services
        unitPriceMinor: 500000n,
        quantityScaled: 10000n,
      },
      taxType: 'exclusive',
    });

    expect(decision.reverseCharge).toBe(true);
    expect(decision.totalTaxAmountMinor).toBe(0n); // Not payable by supplier
    expect(decision.notes[0]).toContain('Reverse Charge');
  });

  test('8. Multi-line document calculation aggregates multi-component GST summaries and rate slabs', () => {
    const doc = calculateDocument({
      currency: 'INR',
      items: [
        {
          description: 'Software Architecture Consulting',
          unitPriceMinor: 1000000n, // ₹10,000.00
          quantityScaled: 10000n,
          hsnSacCode: '998314', // 18%
        },
        {
          description: 'Printed Technical Manuals',
          unitPriceMinor: 100000n, // ₹1,000.00
          quantityScaled: 10000n,
          hsnSacCode: '4901', // 0%
        },
        {
          description: 'Specialty Coffee Supplies',
          unitPriceMinor: 200000n, // ₹2,000.00
          quantityScaled: 10000n,
          hsnSacCode: '0901', // 5%
        },
      ],
      discountType: 'none',
      discountValue: 0n,
      taxType: 'exclusive',
      taxRateBasisPoints: 1800n,
      taxLabel: 'GST',
      totalPaymentsMinor: 0n,
      taxContext: {
        businessProfile: { countryIso2: 'IN', subdivisionCode: 'IN-KA' },
        customer: { countryIso2: 'IN', subdivisionCode: 'IN-KA' },
      },
    });

    // Subtotal = 10,000 + 1,000 + 2,000 = ₹13,000.00
    expect(doc.subtotal.amountMinor).toBe(1300000n);

    // Line 1 Tax (18% on ₹10,000) = ₹1,800.00 (CGST 900, SGST 900)
    // Line 2 Tax (0% on ₹1,000) = 0
    // Line 3 Tax (5% on ₹2,000) = ₹100.00 (CGST 50, SGST 50)
    // Total Tax = ₹1,900.00
    expect(doc.tax.amountMinor).toBe(190000n);
    expect(doc.grandTotal.amountMinor).toBe(1490000n); // ₹14,900.00

    expect(doc.taxSummary).toBeDefined();
    // 4 components: CGST 9%, SGST 9%, CGST 2.5%, SGST 2.5%
    expect(doc.taxSummary?.components.length).toBe(4);

    const totalCgstMinor = doc.taxSummary?.components
      .filter((c) => c.code === 'CGST')
      .reduce((acc, c) => acc + c.totalAmountMinor, 0n);
    const totalSgstMinor = doc.taxSummary?.components
      .filter((c) => c.code === 'SGST')
      .reduce((acc, c) => acc + c.totalAmountMinor, 0n);

    expect(totalCgstMinor).toBe(95000n); // ₹950.00
    expect(totalSgstMinor).toBe(95000n); // ₹950.00

    // Slabs: 0%, 5%, 18%
    expect(doc.taxSummary?.rateBreakdowns.length).toBe(3);
    const slab18 = doc.taxSummary?.rateBreakdowns.find((r) => r.rateBasisPoints === 1800n);
    expect(slab18?.taxableBaseMinor).toBe(1000000n);
    expect(slab18?.taxAmountMinor).toBe(180000n);
  });
});

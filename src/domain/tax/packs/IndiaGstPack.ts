/**
 * INDIA GST COUNTRY PACK (IN)
 * Full implementation of the Goods and Services Tax framework for India.
 * Handles Place of Supply (Intra-state CGST + SGST/UTGST vs Inter-state IGST),
 * Union Territory rules, offline HSN/SAC catalog, and integer math rounding.
 */

import { roundHalfUp } from '../../money/Money';
import { CountryPack } from '../CountryPack';
import {
  CountryPackMetadata,
  HsnSacEntry,
  SupplyType,
  TaxComponent,
  TaxContext,
  TaxDecision,
} from '../TaxTypes';

/**
 * Union Territories in India without a legislative assembly where UTGST replaces SGST.
 * (Delhi, Puducherry, and Jammu & Kashmir have legislatures and collect SGST).
 */
export const UNION_TERRITORIES_WITHOUT_LEGISLATURE = new Set([
  'IN-AN', // Andaman and Nicobar Islands
  'IN-CH', // Chandigarh
  'IN-DH', // Dadra and Nagar Haveli and Daman and Diu
  'IN-DD', // Daman and Diu (legacy code)
  'IN-DN', // Dadra and Nagar Haveli (legacy code)
  'IN-LA', // Ladakh
  'IN-LD', // Lakshadweep
]);

/**
 * Comprehensive offline catalog of high-frequency HSN and SAC codes.
 */
export const INDIA_HSN_SAC_CATALOG: readonly HsnSacEntry[] = [
  // Services (SAC) - IT, Software, Freelancing, Professional
  {
    code: '998311',
    type: 'sac',
    description: 'Management consulting services',
    category: 'Consulting & Professional Services',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '998313',
    type: 'sac',
    description: 'Information technology (IT) consulting and support services',
    category: 'IT & Software',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '998314',
    type: 'sac',
    description: 'IT design and development services (Web, Mobile, Software)',
    category: 'IT & Software',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '998315',
    type: 'sac',
    description: 'Hosting and cloud IT infrastructure provisioning services',
    category: 'IT & Software',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '998316',
    type: 'sac',
    description: 'Network management and cybersecurity services',
    category: 'IT & Software',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '998319',
    type: 'sac',
    description: 'Other information technology and software services',
    category: 'IT & Software',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '998361',
    type: 'sac',
    description: 'Advertising services and digital marketing',
    category: 'Marketing & Media',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '998363',
    type: 'sac',
    description: 'Commercial photography and video production services',
    category: 'Media & Creative',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '998391',
    type: 'sac',
    description: 'Specialty design services (Graphic, UI/UX, Interior design)',
    category: 'Design & Creative',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '998211',
    type: 'sac',
    description: 'Legal advisory and representation services',
    category: 'Legal Services',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '998221',
    type: 'sac',
    description: 'Accounting, auditing, and bookkeeping services',
    category: 'Finance & Accounting',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '998231',
    type: 'sac',
    description: 'Tax consultancy and tax return preparation services',
    category: 'Finance & Accounting',
    defaultRateBasisPoints: 1800n,
  },
  // Construction & Trades
  {
    code: '995411',
    type: 'sac',
    description: 'General construction services of residential buildings',
    category: 'Construction & Trades',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '995421',
    type: 'sac',
    description: 'General construction services of commercial buildings',
    category: 'Construction & Trades',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '995461',
    type: 'sac',
    description: 'Electrical installation, wiring and fixture services',
    category: 'Construction & Trades',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '995462',
    type: 'sac',
    description: 'Plumbing, sanitation, and drain laying services',
    category: 'Construction & Trades',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '995464',
    type: 'sac',
    description: 'Painting and decorating services',
    category: 'Construction & Trades',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '995469',
    type: 'sac',
    description: 'Other specialized installation and repair services',
    category: 'Construction & Trades',
    defaultRateBasisPoints: 1800n,
  },
  // Retail, Hospitality, Logistics
  {
    code: '996331',
    type: 'sac',
    description: 'Restaurant and food takeaway serving services',
    category: 'Hospitality & Food',
    defaultRateBasisPoints: 500n,
  },
  {
    code: '996411',
    type: 'sac',
    description: 'Freight transport services by road',
    category: 'Logistics & Transport',
    defaultRateBasisPoints: 500n,
  },
  {
    code: '997212',
    type: 'sac',
    description: 'Rental or leasing services of commercial real estate',
    category: 'Real Estate',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '998711',
    type: 'sac',
    description: 'Maintenance and repair of computers and office equipment',
    category: 'Repairs & Maintenance',
    defaultRateBasisPoints: 1800n,
  },

  // Goods (HSN) - Electronics, Hardware, Office, Retail
  {
    code: '8471',
    type: 'hsn',
    description: 'Laptops, computers, automatic data processing units',
    category: 'Electronics & Computers',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '8473',
    type: 'hsn',
    description: 'Parts and accessories for computers and printers',
    category: 'Electronics & Computers',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '8517',
    type: 'hsn',
    description: 'Smartphones, mobile phones and telecommunication apparatus',
    category: 'Electronics & Telecommunication',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '8528',
    type: 'hsn',
    description: 'Monitors, projectors, and display panels',
    category: 'Electronics & Audio Visual',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '8504',
    type: 'hsn',
    description: 'Electrical transformers, power supplies, adaptors, UPS',
    category: 'Electrical Equipment',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '8523',
    type: 'hsn',
    description: 'Solid-state storage devices, SSDs, USB drives, smart cards',
    category: 'Electronics & Storage',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '9403',
    type: 'hsn',
    description: 'Office furniture, wooden tables, ergonomic desks',
    category: 'Furniture & Decor',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '9405',
    type: 'hsn',
    description: 'Lamps and lighting fittings, LED fixtures',
    category: 'Lighting & Electrical',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '4820',
    type: 'hsn',
    description: 'Registers, account books, notebooks, paper stationery',
    category: 'Stationery & Paper',
    defaultRateBasisPoints: 1200n,
  },
  {
    code: '4901',
    type: 'hsn',
    description: 'Printed books, brochures, leaflets (Nil/Exempt)',
    category: 'Printed Books',
    defaultRateBasisPoints: 0n,
  },
  {
    code: '6109',
    type: 'hsn',
    description: 'T-shirts, singlets and vests, knitted or crocheted',
    category: 'Apparel & Textiles',
    defaultRateBasisPoints: 500n,
  },
  {
    code: '6203',
    type: 'hsn',
    description: "Men's suits, jackets, trousers, formal apparel",
    category: 'Apparel & Textiles',
    defaultRateBasisPoints: 1200n,
  },
  {
    code: '3004',
    type: 'hsn',
    description: 'Medicaments and pharmaceuticals for therapeutic use',
    category: 'Pharmaceuticals & Health',
    defaultRateBasisPoints: 1200n,
  },
  {
    code: '7318',
    type: 'hsn',
    description: 'Screws, bolts, nuts, washers of iron or steel',
    category: 'Industrial Hardware',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '6907',
    type: 'hsn',
    description: 'Ceramic tiles, vitrified flooring tiles',
    category: 'Construction Materials',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '0902',
    type: 'hsn',
    description: 'Tea leaves, green tea, whether or not flavoured',
    category: 'Food & Beverage',
    defaultRateBasisPoints: 500n,
  },
  {
    code: '0901',
    type: 'hsn',
    description: 'Coffee beans, roasted coffee, ground coffee',
    category: 'Food & Beverage',
    defaultRateBasisPoints: 500n,
  },
  {
    code: '2201',
    type: 'hsn',
    description: 'Packaged mineral water and aerated waters without sugar',
    category: 'Food & Beverage',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '2202',
    type: 'hsn',
    description: 'Aerated sweetened waters, soft drinks, energy drinks',
    category: 'Food & Beverage',
    defaultRateBasisPoints: 2800n,
    cessRateBasisPoints: 1200n, // 12% Compensation Cess
  },
  {
    code: '2402',
    type: 'hsn',
    description: 'Cigars, cheroots, cigarillos and cigarettes of tobacco',
    category: 'Tobacco & Demerit',
    defaultRateBasisPoints: 2800n,
    cessRateBasisPoints: 2500n, // 25% Compensation Cess
  },
  {
    code: '8703',
    type: 'hsn',
    description: 'Motor cars and other motor vehicles for passenger transport',
    category: 'Automotive & Vehicles',
    defaultRateBasisPoints: 2800n,
    cessRateBasisPoints: 2200n, // 22% Compensation Cess
  },
  {
    code: '2701',
    type: 'hsn',
    description: 'Coal, briquettes, ovoids and similar solid fuels',
    category: 'Energy & Fuels',
    defaultRateBasisPoints: 500n,
    cessRateBasisPoints: 400n, // ₹400/tonne or statutory cess
  },
  // Essential Services (Exempt) & Specialized Services
  {
    code: '999311',
    type: 'sac',
    description: 'Inpatient healthcare and hospital medical services (Exempt)',
    category: 'Healthcare',
    defaultRateBasisPoints: 0n,
  },
  {
    code: '999210',
    type: 'sac',
    description: 'Pre-school, primary, secondary and higher education services (Exempt)',
    category: 'Education',
    defaultRateBasisPoints: 0n,
  },
  {
    code: '997331',
    type: 'sac',
    description: 'Licensing services for the right to use computer software and IP',
    category: 'IT & Software',
    defaultRateBasisPoints: 1800n,
  },
  {
    code: '998413',
    type: 'sac',
    description: 'Internet telecommunication and broadband network access services',
    category: 'Telecommunication',
    defaultRateBasisPoints: 1800n,
  },
];

/**
 * Normalizes state codes to standardized ISO 3166-2 ('IN-XX') format.
 */
export function normalizeIndiaStateCode(code?: string | null): string {
  if (!code) return '';
  const clean = code.trim().toUpperCase();
  if (clean.startsWith('IN-')) return clean;
  if (/^[A-Z]{2}$/.test(clean)) return `IN-${clean}`;
  return clean;
}

export class IndiaGstPack implements CountryPack {
  readonly metadata: CountryPackMetadata = {
    packId: 'IN_GST',
    countryCode: 'IN',
    name: 'India Goods and Services Tax',
    version: '2026.01',
    taxSystem: 'GST',
    defaultCurrency: 'INR',
    capabilities: [
      'multi_component',
      'place_of_supply',
      'hsn_sac',
      'reverse_charge',
      'inclusive_exclusive',
    ],
    defaultRateBasisPoints: 1800n, // 18% standard rate
  };

  getHsnSacCatalog(): readonly HsnSacEntry[] {
    return INDIA_HSN_SAC_CATALOG;
  }

  searchHsnSac(query: string): readonly HsnSacEntry[] {
    const q = query.trim().toLowerCase();
    if (!q) return INDIA_HSN_SAC_CATALOG;
    return INDIA_HSN_SAC_CATALOG.filter(
      (entry) =>
        entry.code.toLowerCase().startsWith(q) ||
        entry.description.toLowerCase().includes(q) ||
        entry.category.toLowerCase().includes(q)
    );
  }

  resolveItemTax(context: TaxContext): TaxDecision {
    const { businessProfile, customer, item, taxType } = context;

    // 1. Determine rate: item override > catalog lookup > default (1800n)
    let rateBasisPoints: bigint = this.metadata.defaultRateBasisPoints;
    if (item.taxRateBasisPoints !== undefined && item.taxRateBasisPoints !== null) {
      rateBasisPoints = item.taxRateBasisPoints;
    } else if (item.hsnSacCode) {
      const match = INDIA_HSN_SAC_CATALOG.find((entry) => entry.code === item.hsnSacCode);
      if (match) {
        rateBasisPoints = match.defaultRateBasisPoints;
      }
    }

    // 2. Identify places of supply
    const supplierState = normalizeIndiaStateCode(businessProfile.subdivisionCode);
    const customerCountry = (customer?.countryIso2 || 'IN').toUpperCase();
    const customerState = normalizeIndiaStateCode(customer?.subdivisionCode);

    // Place of supply defaults to customer state, or supplier state if unknown
    const placeOfSupply = customerState || supplierState || 'IN';

    // 3. Determine supply type
    let supplyType: SupplyType = 'intra_state';
    let isExport = false;

    if (customerCountry !== 'IN' && customerCountry !== 'IND') {
      supplyType = 'export';
      isExport = true;
    } else if (!customerState || customerState === supplierState) {
      supplyType = 'intra_state';
    } else {
      supplyType = 'inter_state';
    }

    if (rateBasisPoints === 0n) {
      supplyType = 'nil_rated';
    }

    // 4. Reverse Charge detection (e.g. Legal services SAC 998211 supplied to registered business)
    const isReverseCharge = Boolean(
      item.hsnSacCode === '998211' && customer?.isBusiness && customer?.taxId
    );

    // 5. Line item base computation
    const rawQuantityScaled = item.quantityScaled > 0n ? item.quantityScaled : 10000n;
    const rawLineMinor = roundHalfUp(item.unitPriceMinor * rawQuantityScaled, 10000n);
    const discountMinor = item.discountMinor && item.discountMinor > 0n ? item.discountMinor : 0n;
    const lineNetMinor = rawLineMinor > discountMinor ? rawLineMinor - discountMinor : 0n;

    if (taxType === 'none' || rateBasisPoints === 0n || isReverseCharge) {
      return {
        packId: this.metadata.packId,
        packVersion: this.metadata.version,
        ruleId: isReverseCharge ? 'IN_GST_REVERSE_CHARGE' : 'IN_GST_ZERO',
        placeOfSupply,
        supplyType,
        reverseCharge: isReverseCharge,
        taxType,
        components: [],
        totalTaxRateBasisPoints: 0n,
        taxableAmountMinor: lineNetMinor,
        totalTaxAmountMinor: 0n,
        grossAmountMinor: lineNetMinor,
        roundingAdjustmentMinor: 0n,
        notes: isReverseCharge
          ? ['Reverse Charge: Tax is payable by recipient under Section 9(3) of CGST Act.']
          : [],
      };
    }

    // 6. Calculate Tax Amounts (Exclusive vs Inclusive)
    let taxableAmountMinor: bigint = 0n;
    let totalTaxAmountMinor: bigint = 0n;
    let grossAmountMinor: bigint = 0n;

    if (taxType === 'exclusive') {
      taxableAmountMinor = lineNetMinor;
      totalTaxAmountMinor = roundHalfUp(taxableAmountMinor * rateBasisPoints, 10000n);
      grossAmountMinor = taxableAmountMinor + totalTaxAmountMinor;
    } else {
      // Inclusive: lineNetMinor is already the gross amount
      grossAmountMinor = lineNetMinor;
      const denominator = 10000n + rateBasisPoints;
      taxableAmountMinor = roundHalfUp(grossAmountMinor * 10000n, denominator);
      totalTaxAmountMinor = grossAmountMinor - taxableAmountMinor;
    }

    // 7. Component breakdown
    const components: TaxComponent[] = [];
    let ruleId = '';

    if (isExport) {
      ruleId = 'IN_GST_EXPORT_ZERO';
      // Default export under LUT (Letter of Undertaking) is 0% IGST
      components.push({
        code: 'IGST',
        name: 'Integrated GST (Export)',
        rateBasisPoints: 0n,
        amountMinor: 0n,
      });
      totalTaxAmountMinor = 0n;
      grossAmountMinor = taxableAmountMinor;
    } else if (supplyType === 'inter_state') {
      ruleId = 'IN_GST_INTER_STATE';
      components.push({
        code: 'IGST',
        name: 'Integrated GST',
        rateBasisPoints,
        amountMinor: totalTaxAmountMinor,
      });
    } else {
      // Intra-state supply: Split 50/50 between CGST and SGST/UTGST
      const isUt = UNION_TERRITORIES_WITHOUT_LEGISLATURE.has(supplierState);
      const halfRate = rateBasisPoints / 2n;
      ruleId = isUt ? 'IN_GST_INTRA_STATE_UTGST' : 'IN_GST_INTRA_STATE_SGST';

      // Ensure exact sum invariant: component1 + component2 === totalTaxAmountMinor
      const cgstAmountMinor = roundHalfUp(totalTaxAmountMinor * 1n, 2n);
      const stateOrUtAmountMinor = totalTaxAmountMinor - cgstAmountMinor;

      components.push({
        code: 'CGST',
        name: 'Central GST',
        rateBasisPoints: halfRate,
        amountMinor: cgstAmountMinor,
      });

      if (isUt) {
        components.push({
          code: 'UTGST',
          name: 'Union Territory GST',
          rateBasisPoints: halfRate,
          amountMinor: stateOrUtAmountMinor,
          jurisdiction: supplierState,
        });
      } else {
        components.push({
          code: 'SGST',
          name: 'State GST',
          rateBasisPoints: halfRate,
          amountMinor: stateOrUtAmountMinor,
          jurisdiction: supplierState,
        });
      }
    }

    // 8. Compensation Cess calculation (for luxury / demerit goods)
    let cessRateBasisPoints = 0n;
    if (item.hsnSacCode && !isExport) {
      const match = INDIA_HSN_SAC_CATALOG.find((entry) => entry.code === item.hsnSacCode);
      if (match?.cessRateBasisPoints) {
        cessRateBasisPoints = match.cessRateBasisPoints;
      }
    }

    if (cessRateBasisPoints > 0n) {
      const cessAmountMinor = roundHalfUp(taxableAmountMinor * cessRateBasisPoints, 10000n);
      components.push({
        code: 'CESS',
        name: 'Compensation Cess',
        rateBasisPoints: cessRateBasisPoints,
        amountMinor: cessAmountMinor,
      });
      totalTaxAmountMinor += cessAmountMinor;
      grossAmountMinor += cessAmountMinor;
      rateBasisPoints += cessRateBasisPoints;
    }

    return {
      packId: this.metadata.packId,
      packVersion: this.metadata.version,
      ruleId,
      placeOfSupply,
      supplyType,
      reverseCharge: false,
      taxType,
      components,
      totalTaxRateBasisPoints: rateBasisPoints,
      taxableAmountMinor,
      totalTaxAmountMinor,
      grossAmountMinor,
      roundingAdjustmentMinor: 0n,
      notes: [],
    };
  }
}

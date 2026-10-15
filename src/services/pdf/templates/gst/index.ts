/**
 * GST TAX INVOICE TEMPLATE SUITE (5 GENUINE SELECTABLE LAYOUTS)
 * 
 * Complies with Indian CBIC Central Goods and Services Tax Rules, Rule 46:
 * - GST-01 Executive Letterhead: Consultancies, agencies, IT services (Reference 01)
 * - GST-02 Structured Ledger: Wholesale, traders, parts distributors (Reference 02)
 * - GST-03 Minimal Professional: Independent professionals, design studios (Reference 03)
 * - GST-04 Corporate B2B: Enterprise suppliers, manufacturers, contractors (Reference 04)
 * - GST-05 Trade Supply Chain: Logistics, freight, multi-item adaptive dispatch (Reference 05)
 */

import { FullDocument } from '../../../../data/repositories/DocumentRepository';
import { BusinessProfile } from '../../../../domain/profile/types';
import { TemplateCustomization } from '../../types';
import { renderGst01ExecutiveLetterheadHtml } from './gst01ExecutiveLetterhead';
import { renderGst02StructuredLedgerHtml } from './gst02StructuredLedger';
import { renderGst03MinimalProfessionalHtml } from './gst03MinimalProfessional';
import { renderGst04CorporateB2BHtml } from './gst04CorporateB2B';
import { renderGst05TradeSupplyChainHtml } from './gst05TradeSupplyChain';

export {
  renderGst01ExecutiveLetterheadHtml,
  renderGst02StructuredLedgerHtml,
  renderGst03MinimalProfessionalHtml,
  renderGst04CorporateB2BHtml,
  renderGst05TradeSupplyChainHtml,
};

export {
  amountToIndianWords,
  amountToIndianWords as numberToIndianWords,
  parseGstInvoiceData,
} from './gstCommon';

export type GstLayoutType =
  | 'gst_executive'
  | 'gst_ledger'
  | 'gst_minimal'
  | 'gst_corporate'
  | 'gst_supply_chain'
  | 'gst_01'
  | 'gst_02'
  | 'gst_03'
  | 'gst_04'
  | 'gst_05';

export interface GstLayoutMeta {
  code: GstLayoutType;
  referenceId: string;
  name: string;
  targetOrganizations: string;
  keyFeatures: string;
  category: 'executive' | 'ledger' | 'minimal' | 'corporate' | 'supply_chain';
}

export const GST_LAYOUT_DEFINITIONS: readonly GstLayoutMeta[] = [
  {
    code: 'gst_executive',
    referenceId: 'GST-01',
    name: 'Executive Letterhead',
    targetOrganizations: 'GST-registered IT agencies, design studios, marketing agencies, consultancies, engineering firms.',
    keyFeatures: 'Large organization identity, vertical divider, 3-column party info, 10-column table, generous whitespace.',
    category: 'executive',
  },
  {
    code: 'gst_ledger',
    referenceId: 'GST-02',
    name: 'Structured Ledger',
    targetOrganizations: 'Wholesalers, distributors, trading firms, parts suppliers, industrial suppliers.',
    keyFeatures: '6-compartment metadata band, boxed party panels, 11-column high-density grid, structured tax breakup.',
    category: 'ledger',
  },
  {
    code: 'gst_minimal',
    referenceId: 'GST-03',
    name: 'Minimal Professional',
    targetOrganizations: 'Independent consultants, freelance specialists, architects, boutique advisory studios.',
    keyFeatures: 'Borderless hairline typography, giant invoice number, clean stacked summary, zero visual noise.',
    category: 'minimal',
  },
  {
    code: 'gst_corporate',
    referenceId: 'GST-04',
    name: 'Corporate B2B',
    targetOrganizations: 'Enterprise vendors, Tier-1 suppliers, government contractors, corporate suppliers.',
    keyFeatures: 'Dual buyer/consignee panels, E-invoice status flag, inverted solid black Grand Total bar.',
    category: 'corporate',
  },
  {
    code: 'gst_supply_chain',
    referenceId: 'GST-05',
    name: 'Trade Supply Chain',
    targetOrganizations: 'Freight forwarders, logistics fleets, FMCG distributors, manufacturing plants.',
    keyFeatures: 'HSN in column 2, 4-column metadata strip, multi-page ledger support with running footer.',
    category: 'supply_chain',
  },
];

/**
 * Universal dispatcher for GST Tax Invoice HTML rendering
 */
export function renderGstTaxInvoiceHtml(
  doc: FullDocument,
  business: BusinessProfile,
  layoutCode: string = 'gst_executive',
  customization?: TemplateCustomization
): string {
  switch (layoutCode) {
    case 'gst_ledger':
    case 'gst_02':
      return renderGst02StructuredLedgerHtml(doc, business, customization);

    case 'gst_minimal':
    case 'gst_03':
      return renderGst03MinimalProfessionalHtml(doc, business, customization);

    case 'gst_corporate':
    case 'gst_04':
      return renderGst04CorporateB2BHtml(doc, business, customization);

    case 'gst_supply_chain':
    case 'gst_05':
      return renderGst05TradeSupplyChainHtml(doc, business, customization);

    case 'gst_executive':
    case 'gst_01':
    default:
      return renderGst01ExecutiveLetterheadHtml(doc, business, customization);
  }
}

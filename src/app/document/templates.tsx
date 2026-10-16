/**
 * DOCUMENT TEMPLATE SELECTION STUDIO — BILLFRAME LUXURY MINIMALIST ARCHITECTURE
 * 
 * Design Invariants:
 * - Complete, legally verified structures for EVERY document type:
 *   * Tax Invoice: GST Rule 46 (HSN/SAC, CGST/SGST/IGST, Reverse Charge, Bank details)
 *   * Bill of Supply: Section 31(3)(c) & Rule 49 (Mandatory Composition banner, exempt supplies, Nil tax)
 *   * Estimate / Quotation: Indian Contract Act (Scope deliverables, validity period, commercial acceptance signoff)
 *   * Credit Note: GST Rule 53 (Original invoice cross-reference, reason for note, tax reversals)
 *   * Purchase Order: Sale of Goods Act & Procurement (Vendor details, delivery site, inspection clause, PO terms)
 *   * Work Order & Contract: Master SOW & Contract Act (Deliverable milestones, weightage, dual binding signoffs)
 *   * Payment Receipt: GST Rule 52 (Settlement mode, bank UTR, invoice clearance tally, balance zero)
 * - Dynamic Organization Profile Binding: Pulls legal name, GSTIN, PAN, address, bank & UPI from BusinessProfile
 * - 5 Curated Layout Categories per document type: Executive, Ledger, Minimal, Corporate, Retail/Trade
 * - Strict Monochrome Luxury Aesthetic: Crisp white A4 canvas on dark studio (#090A0F) viewport
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Check,
  ArrowRight,
  FileText,
  Briefcase,
  RotateCcw,
  ShoppingBag,
  ClipboardList,
  Receipt,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ShieldCheck,
  Building2,
  Landmark,
  Globe,
  Truck,
  Package,
  PackageCheck,
  ScrollText,
  FileCheck,
  GraduationCap,
  Laptop,
  Users,
  Building,
  Scale,
  Shield,
  FileClock,
  Send,
} from 'lucide-react-native';
import { radii } from '../../design/tokens';
import { useTheme } from '../../design/ThemeContext';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';
import { BusinessProfile } from '../../domain/profile/types';

export type TemplateCategory = 'executive' | 'ledger' | 'minimal' | 'corporate' | 'retail';

export interface DocumentTemplateItem {
  id: string;
  code: string;
  name: string;
  tagline: string;
  category: TemplateCategory;
  categoryLabel: string;
  similarTemplateIds: string[];
}

export interface DocumentTypeConfig {
  id: string;
  title: string;
  shortName: string;
  subtitle: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  defaultTemplateId: string;
  templates: DocumentTemplateItem[];
}

export interface CountryTaxConfig {
  code: string;
  name: string;
  flag: string;
  currencySymbol: string;
  currencyCode: string;
  taxSystemName: string;
  taxIdLabel: string;
  secondaryTaxIdLabel?: string;
  defaultTaxId: string;
  defaultSecondaryTaxId?: string;
  itemCodeHeader: string;
  bankRoutingLabel: string;
  digitalPayLabel: string;
  sampleBankName: string;
  sampleAccountNo: string;
  sampleRoutingVal: string;
  sampleDigitalPayVal: string;
  sampleSubdivision: string;
  samplePartyTaxId: string;
  samplePartyStateOrRegion: string;
  samplePartyName: string;
  samplePartySubMeta: string;
  sampleSecondPartyTitle: string;
  sampleSecondPartyName: string;
  sampleSecondPartyMeta: string;
}

export const COUNTRY_TAX_CONFIGS: Record<string, CountryTaxConfig> = {
  IN: {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currencySymbol: '₹',
    currencyCode: 'INR',
    taxSystemName: 'GST',
    taxIdLabel: 'GSTIN',
    secondaryTaxIdLabel: 'PAN',
    defaultTaxId: '27AABCU9603R1ZM',
    defaultSecondaryTaxId: 'AABCU9603R',
    itemCodeHeader: 'HSN/SAC',
    bankRoutingLabel: 'IFSC',
    digitalPayLabel: 'UPI ID',
    sampleBankName: 'HDFC Bank Ltd',
    sampleAccountNo: '50200084729103',
    sampleRoutingVal: 'HDFC0000060',
    sampleDigitalPayVal: 'apextech@hdfcbank',
    sampleSubdivision: '27 (MH)',
    samplePartyTaxId: 'GSTIN: 27AABCR1234F1Z8 · PAN: AABCR1234F',
    samplePartyStateOrRegion: 'Maharashtra (27)',
    samplePartyName: 'Reliance Retail Limited',
    samplePartySubMeta: '12th Floor, Maker Chambers IV, Nariman Point, Mumbai 400021',
    sampleSecondPartyTitle: 'CONSIGNEE / SHIPPED TO',
    sampleSecondPartyName: 'Reliance Retail Central Logistics Hub',
    sampleSecondPartyMeta: 'Plot C-14, Bhiwandi Logistics Corridor, Thane, MH - 421302',
  },
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currencySymbol: '$',
    currencyCode: 'USD',
    taxSystemName: 'Sales Tax',
    taxIdLabel: 'EIN',
    secondaryTaxIdLabel: 'State Permit',
    defaultTaxId: '12-3456789',
    defaultSecondaryTaxId: 'NY-8492019',
    itemCodeHeader: 'SKU / CODE',
    bankRoutingLabel: 'ABA Routing',
    digitalPayLabel: 'ACH / Wire',
    sampleBankName: 'JPMorgan Chase Bank, N.A.',
    sampleAccountNo: '8492018241',
    sampleRoutingVal: '021000021',
    sampleDigitalPayVal: 'Corporate Wire / ACH Direct',
    sampleSubdivision: 'New York (NY)',
    samplePartyTaxId: 'EIN: 83-9201842 · Resale Permit: CA-492018',
    samplePartyStateOrRegion: 'California (CA)',
    samplePartyName: 'Apex Enterprise Solutions Inc.',
    samplePartySubMeta: '350 Fifth Avenue, Suite 4800, New York, NY 10118',
    sampleSecondPartyTitle: 'RECEIVING / FULFILLMENT CENTER',
    sampleSecondPartyName: 'Apex Global Logistics Center - Bay Area',
    sampleSecondPartyMeta: '400 Logistics Way, Oakland, CA 94607',
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currencySymbol: '£',
    currencyCode: 'GBP',
    taxSystemName: 'VAT',
    taxIdLabel: 'VAT Reg No',
    secondaryTaxIdLabel: 'Company No',
    defaultTaxId: 'GB 123 4567 89',
    defaultSecondaryTaxId: '09876543',
    itemCodeHeader: 'COMMODITY',
    bankRoutingLabel: 'Sort Code',
    digitalPayLabel: 'BACS / Faster',
    sampleBankName: 'Barclays Bank UK PLC',
    sampleAccountNo: '83920184',
    sampleRoutingVal: '20-00-00',
    sampleDigitalPayVal: 'BACS Direct Credit / Faster Payments',
    sampleSubdivision: 'England (ENG)',
    samplePartyTaxId: 'VAT: GB 987 6543 21 · CRN: 04182901',
    samplePartyStateOrRegion: 'Greater London',
    samplePartyName: 'Vanguard Enterprise Systems Ltd',
    samplePartySubMeta: '25 Bank Street, Canary Wharf, London E14 5JP',
    sampleSecondPartyTitle: 'DELIVERY DEPOT',
    sampleSecondPartyName: 'Vanguard UK Distribution Center',
    sampleSecondPartyMeta: 'Unit 4, Park Royal Logistics Park, London NW10 7HQ',
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currencySymbol: 'CA$',
    currencyCode: 'CAD',
    taxSystemName: 'GST/HST',
    taxIdLabel: 'CRA BN/GST',
    secondaryTaxIdLabel: 'PST/QST Reg',
    defaultTaxId: '123456789 RT0001',
    defaultSecondaryTaxId: '1029384756 TQ0001',
    itemCodeHeader: 'TARIFF CODE',
    bankRoutingLabel: 'Transit / Inst',
    digitalPayLabel: 'Interac e-Transfer',
    sampleBankName: 'Royal Bank of Canada (RBC)',
    sampleAccountNo: '102-938-4',
    sampleRoutingVal: '12345-003',
    sampleDigitalPayVal: 'pay@apextech.ca',
    sampleSubdivision: 'Ontario (ON)',
    samplePartyTaxId: 'CRA BN: 849201842 RT0001 · PST: ON-49201',
    samplePartyStateOrRegion: 'Ontario (ON)',
    samplePartyName: 'Maple Leaf Commercial Technologies Corp',
    samplePartySubMeta: '100 King Street West, Suite 5600, Toronto, ON M5X 1C9',
    sampleSecondPartyTitle: 'RECEIVING WAREHOUSE',
    sampleSecondPartyName: 'Greater Toronto Logistics Depot',
    sampleSecondPartyMeta: '2550 Britannia Road East, Mississauga, ON L4W 1J8',
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currencySymbol: 'AU$',
    currencyCode: 'AUD',
    taxSystemName: 'GST',
    taxIdLabel: 'ABN',
    secondaryTaxIdLabel: 'ACN',
    defaultTaxId: '12 345 678 901',
    defaultSecondaryTaxId: '345 678 901',
    itemCodeHeader: 'ITEM CODE',
    bankRoutingLabel: 'BSB Code',
    digitalPayLabel: 'PayID',
    sampleBankName: 'Commonwealth Bank of Australia',
    sampleAccountNo: '1029 3847',
    sampleRoutingVal: '062-000',
    sampleDigitalPayVal: 'billing@apextech.com.au',
    sampleSubdivision: 'NSW',
    samplePartyTaxId: 'ABN: 98 765 432 109 · ACN: 765 432 109',
    samplePartyStateOrRegion: 'New South Wales (NSW)',
    samplePartyName: 'Southern Cross Enterprises Pty Ltd',
    samplePartySubMeta: 'Level 38, 100 Barangaroo Avenue, Sydney NSW 2000',
    sampleSecondPartyTitle: 'CENTRAL DISTRIBUTION SITE',
    sampleSecondPartyName: 'Sydney Western Logistics Hub',
    sampleSecondPartyMeta: '15 Estate Drive, Eastern Creek NSW 2766',
  },
  AE: {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currencySymbol: 'AED ',
    currencyCode: 'AED',
    taxSystemName: 'VAT',
    taxIdLabel: 'TRN',
    secondaryTaxIdLabel: 'License No',
    defaultTaxId: '100 2345 6789 0003',
    defaultSecondaryTaxId: 'CN-849201',
    itemCodeHeader: 'HS CODE',
    bankRoutingLabel: 'IBAN / SWIFT',
    digitalPayLabel: 'Direct Transfer',
    sampleBankName: 'Emirates NBD Bank PJSC',
    sampleAccountNo: '0703312345678901',
    sampleRoutingVal: 'AE070331234567890123456',
    sampleDigitalPayVal: 'SWIFT: EBILAEAD',
    sampleSubdivision: 'Dubai (DXB)',
    samplePartyTaxId: 'TRN: 100 9876 5432 0003 · License: 549201',
    samplePartyStateOrRegion: 'Dubai, UAE',
    samplePartyName: 'Al Khaleej Modern Commercial LLC',
    samplePartySubMeta: 'Level 14, Al Saada Tower, DIFC, PO Box 507214, Dubai, UAE',
    sampleSecondPartyTitle: 'JAFZA LOGISTICS DEPOT',
    sampleSecondPartyName: 'Jebel Ali Free Zone Distribution Facility',
    sampleSecondPartyMeta: 'JAFZA South, Gate 4, Warehouse 18, Dubai, UAE',
  },
  DE: {
    code: 'DE',
    name: 'Germany / EU',
    flag: '🇩🇪',
    currencySymbol: '€',
    currencyCode: 'EUR',
    taxSystemName: 'MwSt',
    taxIdLabel: 'USt-IdNr',
    secondaryTaxIdLabel: 'Steuernummer',
    defaultTaxId: 'DE 123456789',
    defaultSecondaryTaxId: '21/815/08150',
    itemCodeHeader: 'ZOLLTARIF',
    bankRoutingLabel: 'IBAN / BIC',
    digitalPayLabel: 'SEPA Überweisung',
    sampleBankName: 'Deutsche Bank AG',
    sampleAccountNo: 'DE89370400440532013000',
    sampleRoutingVal: 'DEUTDEDDFXX',
    sampleDigitalPayVal: 'SEPA Instant Credit Transfer',
    sampleSubdivision: 'Berlin (BER)',
    samplePartyTaxId: 'USt-IdNr: DE 987654321 · HRB: 198274 B',
    samplePartyStateOrRegion: 'Berlin, Deutschland',
    samplePartyName: 'Bavaria Industrie & Handel GmbH',
    samplePartySubMeta: 'Friedrichstraße 180, 10117 Berlin, Deutschland',
    sampleSecondPartyTitle: 'WARENLAGER / VERSANDDEPOT',
    sampleSecondPartyName: 'Zentrallager Berlin-Brandenburg',
    sampleSecondPartyMeta: 'Am Güterverkehrszentrum 12, 14974 Ludwigsfelde',
  },
  SG: {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    currencySymbol: 'SG$',
    currencyCode: 'SGD',
    taxSystemName: 'GST',
    taxIdLabel: 'GST Reg No',
    secondaryTaxIdLabel: 'UEN',
    defaultTaxId: 'M90368192X',
    defaultSecondaryTaxId: '2021368192X',
    itemCodeHeader: 'PROD CODE',
    bankRoutingLabel: 'Bank / Branch',
    digitalPayLabel: 'PayNow UEN',
    sampleBankName: 'DBS Bank Ltd',
    sampleAccountNo: '014-902184-2',
    sampleRoutingVal: '7171 - 001',
    sampleDigitalPayVal: '2021368192X (PayNow)',
    sampleSubdivision: 'Singapore (SG)',
    samplePartyTaxId: 'GST Reg: M84920184A · UEN: 201948201K',
    samplePartyStateOrRegion: 'Singapore',
    samplePartyName: 'Marina Pacific Trading Pte Ltd',
    samplePartySubMeta: '1 Raffles Place, #44-01 One Raffles Place, Singapore 048616',
    sampleSecondPartyTitle: 'RECEIVING LOGISTICS CENTRE',
    sampleSecondPartyName: 'Tuas Logistics Megahub Pte Ltd',
    sampleSecondPartyMeta: '21 Tuas South Avenue 2, Singapore 637840',
  },
};

export const COUNTRY_TAX_OPTIONS = Object.values(COUNTRY_TAX_CONFIGS);

export const DOCUMENT_TYPE_CONFIGS: Record<string, DocumentTypeConfig> = {
  invoice: {
    id: 'invoice',
    title: 'GST Tax Invoice',
    shortName: 'Tax Invoice',
    subtitle: 'Commercial tax invoice with GST Rule 46 compliance',
    icon: FileText,
    defaultTemplateId: 'gst_executive',
    templates: [
      {
        id: 'gst_executive',
        code: 'GST-01',
        name: 'Executive Letterhead',
        tagline: 'Classic brand masthead with vertical divider and generous margins',
        category: 'executive',
        categoryLabel: 'Executive',
        similarTemplateIds: ['gst_minimal', 'gst_corporate'],
      },
      {
        id: 'gst_ledger',
        code: 'GST-02',
        name: 'Structured Ledger',
        tagline: 'High-density itemized grid with 4-compartment metadata band',
        category: 'ledger',
        categoryLabel: 'Ledger',
        similarTemplateIds: ['gst_corporate', 'gst_retail'],
      },
      {
        id: 'gst_minimal',
        code: 'GST-03',
        name: 'Minimal Professional',
        tagline: 'Clean borderless typography with hero numbering and quiet whitespace',
        category: 'minimal',
        categoryLabel: 'Minimal',
        similarTemplateIds: ['gst_executive', 'gst_ledger'],
      },
      {
        id: 'gst_corporate',
        code: 'GST-04',
        name: 'Corporate B2B',
        tagline: 'Dual buyer/consignee panels and enterprise tax breakdown block',
        category: 'corporate',
        categoryLabel: 'Corporate',
        similarTemplateIds: ['gst_executive', 'gst_retail'],
      },
      {
        id: 'gst_retail',
        code: 'GST-05',
        name: 'Trade Supply Chain',
        tagline: 'Logistics transport dispatch strip and multi-depot shipping tally',
        category: 'retail',
        categoryLabel: 'Trade',
        similarTemplateIds: ['gst_ledger', 'gst_corporate'],
      },
    ],
  },
  bill_of_supply: {
    id: 'bill_of_supply',
    title: 'Bill of Supply',
    shortName: 'Bill of Supply',
    subtitle: 'Section 31(3)(c) for composition dealers & exempt supplies',
    icon: FileSpreadsheet,
    defaultTemplateId: 'bos_executive',
    templates: [
      {
        id: 'bos_executive',
        code: 'BOS-01',
        name: 'Composition Executive',
        tagline: 'Statutory non-taxable declaration banner with classic brand masthead',
        category: 'executive',
        categoryLabel: 'Executive',
        similarTemplateIds: ['bos_minimal', 'bos_corporate'],
      },
      {
        id: 'bos_ledger',
        code: 'BOS-02',
        name: 'Structured Trade Ledger',
        tagline: 'High-density tabular grid for nil-rated and exempt trade inventory',
        category: 'ledger',
        categoryLabel: 'Ledger',
        similarTemplateIds: ['bos_retail', 'bos_corporate'],
      },
      {
        id: 'bos_minimal',
        code: 'BOS-03',
        name: 'Modern Minimalist',
        tagline: 'Clean borderless typography with compact statutory declaration banner',
        category: 'minimal',
        categoryLabel: 'Minimal',
        similarTemplateIds: ['bos_executive', 'bos_retail'],
      },
      {
        id: 'bos_corporate',
        code: 'BOS-04',
        name: 'Corporate Exempt B2B',
        tagline: 'Dual entity billing boxes for enterprise tax-exempt trade contracts',
        category: 'corporate',
        categoryLabel: 'Corporate',
        similarTemplateIds: ['bos_executive', 'bos_ledger'],
      },
      {
        id: 'bos_retail',
        code: 'BOS-05',
        name: 'Retail Counter Bill',
        tagline: 'Fast over-the-counter billing format with non-taxable retail tally',
        category: 'retail',
        categoryLabel: 'Retail',
        similarTemplateIds: ['bos_minimal', 'bos_ledger'],
      },
    ],
  },
  estimate: {
    id: 'estimate',
    title: 'Estimate / Quotation',
    shortName: 'Estimate',
    subtitle: 'Cost proposals, commercial quotes and proforma agreements',
    icon: Briefcase,
    defaultTemplateId: 'est_executive',
    templates: [
      {
        id: 'est_executive',
        code: 'EST-01',
        name: 'Executive Proposal',
        tagline: 'Scope narrative with milestone pricing schedule and signoff block',
        category: 'executive',
        categoryLabel: 'Executive',
        similarTemplateIds: ['est_minimal', 'est_corporate'],
      },
      {
        id: 'est_ledger',
        code: 'EST-02',
        name: 'Itemized Quotation',
        tagline: 'Detailed unit rates with revision versioning and validity terms',
        category: 'ledger',
        categoryLabel: 'Ledger',
        similarTemplateIds: ['est_corporate', 'est_retail'],
      },
      {
        id: 'est_minimal',
        code: 'EST-03',
        name: 'Modern Minimal Quote',
        tagline: 'Crisp borderless layout with quiet typography and acceptance terms',
        category: 'minimal',
        categoryLabel: 'Minimal',
        similarTemplateIds: ['est_executive', 'est_ledger'],
      },
      {
        id: 'est_corporate',
        code: 'EST-04',
        name: 'Commercial Proforma',
        tagline: 'Advance wire coordinates and international commercial trade numbering',
        category: 'corporate',
        categoryLabel: 'Corporate',
        similarTemplateIds: ['est_executive', 'est_ledger'],
      },
      {
        id: 'est_retail',
        code: 'EST-05',
        name: 'Quick Rate Estimate',
        tagline: 'Compact quotation tally for retail and direct service consultations',
        category: 'retail',
        categoryLabel: 'Retail',
        similarTemplateIds: ['est_minimal', 'est_ledger'],
      },
    ],
  },
  credit_note: {
    id: 'credit_note',
    title: 'Credit Note / Debit Note',
    shortName: 'Credit Note',
    subtitle: 'Sales returns, rate adjustments and customer refunds',
    icon: RotateCcw,
    defaultTemplateId: 'cn_executive',
    templates: [
      {
        id: 'cn_executive',
        code: 'CN-01',
        name: 'Executive Adjustment Memo',
        tagline: 'Formal letterhead credit memo with original invoice cross-reference',
        category: 'executive',
        categoryLabel: 'Executive',
        similarTemplateIds: ['cn_minimal', 'cn_corporate'],
      },
      {
        id: 'cn_ledger',
        code: 'CN-02',
        name: 'Tax Credit Note',
        tagline: 'Rule 53 GST invoice reversal and itemized net tax credit ledger',
        category: 'ledger',
        categoryLabel: 'Ledger',
        similarTemplateIds: ['cn_executive', 'cn_corporate'],
      },
      {
        id: 'cn_minimal',
        code: 'CN-03',
        name: 'Modern Minimal Note',
        tagline: 'Quiet typography with clean credit refund balance and reason block',
        category: 'minimal',
        categoryLabel: 'Minimal',
        similarTemplateIds: ['cn_executive', 'cn_retail'],
      },
      {
        id: 'cn_corporate',
        code: 'DN-01',
        name: 'Corporate Debit Memo',
        tagline: 'Enterprise rate revision claim and revised payable balance breakdown',
        category: 'corporate',
        categoryLabel: 'Corporate',
        similarTemplateIds: ['cn_ledger', 'cn_executive'],
      },
      {
        id: 'cn_retail',
        code: 'CN-04',
        name: 'Counter Return Slip',
        tagline: 'Fast point-of-sale customer return slip with credit voucher reference',
        category: 'retail',
        categoryLabel: 'Retail',
        similarTemplateIds: ['cn_minimal', 'cn_ledger'],
      },
    ],
  },
  purchase_order: {
    id: 'purchase_order',
    title: 'Purchase Order',
    shortName: 'Purchase Order',
    subtitle: 'Official procurement orders sent to vendors & suppliers',
    icon: ShoppingBag,
    defaultTemplateId: 'po_executive',
    templates: [
      {
        id: 'po_executive',
        code: 'PO-01',
        name: 'Executive Procurement',
        tagline: 'Formal procurement order with vendor instructions and signoff block',
        category: 'executive',
        categoryLabel: 'Executive',
        similarTemplateIds: ['po_corporate', 'po_ledger'],
      },
      {
        id: 'po_ledger',
        code: 'PO-02',
        name: 'Industrial Supply Order',
        tagline: 'Technical bill of materials, inspection criteria and delivery schedule',
        category: 'ledger',
        categoryLabel: 'Ledger',
        similarTemplateIds: ['po_executive', 'po_corporate'],
      },
      {
        id: 'po_minimal',
        code: 'PO-03',
        name: 'Modern Minimal PO',
        tagline: 'Clean procurement order with prominent PO number and concise terms',
        category: 'minimal',
        categoryLabel: 'Minimal',
        similarTemplateIds: ['po_executive', 'po_ledger'],
      },
      {
        id: 'po_corporate',
        code: 'PO-04',
        name: 'Corporate Multi-Site PO',
        tagline: 'Dual billing and warehouse shipping panels with tax tally',
        category: 'corporate',
        categoryLabel: 'Corporate',
        similarTemplateIds: ['po_executive', 'po_ledger'],
      },
      {
        id: 'po_retail',
        code: 'PO-05',
        name: 'Stock Replenishment Order',
        tagline: 'Fast restocking order tally for retail inventory and distribution',
        category: 'retail',
        categoryLabel: 'Retail',
        similarTemplateIds: ['po_ledger', 'po_minimal'],
      },
    ],
  },
  work_order: {
    id: 'work_order',
    title: 'Work Order & Contract',
    shortName: 'Work Order',
    subtitle: 'Scope of work, milestone deliverables & legal signoff',
    icon: ClipboardList,
    defaultTemplateId: 'wo_executive',
    templates: [
      {
        id: 'wo_executive',
        code: 'WO-01',
        name: 'Retainer Agreement',
        tagline: 'Formal engagement terms, milestone schedule and signature blocks',
        category: 'executive',
        categoryLabel: 'Executive',
        similarTemplateIds: ['wo_corporate', 'wo_minimal'],
      },
      {
        id: 'wo_ledger',
        code: 'WO-02',
        name: 'Technical Service Order',
        tagline: 'Scope deliverables, materials provided and completion signoff',
        category: 'ledger',
        categoryLabel: 'Ledger',
        similarTemplateIds: ['wo_corporate', 'wo_executive'],
      },
      {
        id: 'wo_minimal',
        code: 'WO-03',
        name: 'Modern Statement of Work',
        tagline: 'Clean agile deliverables list with transparent milestone billing',
        category: 'minimal',
        categoryLabel: 'Minimal',
        similarTemplateIds: ['wo_executive', 'wo_ledger'],
      },
      {
        id: 'wo_corporate',
        code: 'WO-04',
        name: 'Enterprise SOW Contract',
        tagline: 'Dual party liability, acceptance criteria and formal governance',
        category: 'corporate',
        categoryLabel: 'Corporate',
        similarTemplateIds: ['wo_executive', 'wo_ledger'],
      },
      {
        id: 'wo_retail',
        code: 'WO-05',
        name: 'Field Service Dispatch',
        tagline: 'On-site engineer report, equipment checklist and customer signoff',
        category: 'retail',
        categoryLabel: 'Retail',
        similarTemplateIds: ['wo_minimal', 'wo_ledger'],
      },
    ],
  },
  receipt: {
    id: 'receipt',
    title: 'Payment Receipt',
    shortName: 'Receipt',
    subtitle: 'Official payment acknowledgment & settlement vouchers',
    icon: Receipt,
    defaultTemplateId: 'rec_executive',
    templates: [
      {
        id: 'rec_executive',
        code: 'REC-01',
        name: 'Executive Payment Voucher',
        tagline: 'Bank UTR reference, payment mode and invoice clearance voucher',
        category: 'executive',
        categoryLabel: 'Executive',
        similarTemplateIds: ['rec_corporate', 'rec_minimal'],
      },
      {
        id: 'rec_ledger',
        code: 'REC-02',
        name: 'Account Settlement Ledger',
        tagline: 'Full balance clearance and statement account reconciliation tally',
        category: 'ledger',
        categoryLabel: 'Ledger',
        similarTemplateIds: ['rec_executive', 'rec_corporate'],
      },
      {
        id: 'rec_minimal',
        code: 'REC-03',
        name: 'Modern Payment Receipt',
        tagline: 'Quiet receipt with clean amount display and payment method badge',
        category: 'minimal',
        categoryLabel: 'Minimal',
        similarTemplateIds: ['rec_executive', 'rec_retail'],
      },
      {
        id: 'rec_corporate',
        code: 'REC-04',
        name: 'Corporate Remittance Advice',
        tagline: 'Dual entity billing details, TDS tax deduction and UTR settlement',
        category: 'corporate',
        categoryLabel: 'Corporate',
        similarTemplateIds: ['rec_executive', 'rec_ledger'],
      },
      {
        id: 'rec_retail',
        code: 'REC-05',
        name: 'Counter POS Receipt',
        tagline: 'Compact retail customer receipt slip with QR clearance stamp',
        category: 'retail',
        categoryLabel: 'Retail',
        similarTemplateIds: ['rec_minimal', 'rec_ledger'],
      },
    ],
  },
  proforma: {
    id: 'proforma',
    title: 'Proforma Commercial Invoice',
    shortName: 'Proforma Invoice',
    subtitle: 'Advance commercial wire billing and import customs declaration',
    icon: FileClock,
    defaultTemplateId: 'pi_executive',
    templates: [
      { id: 'pi_executive', code: 'PI-01', name: 'Executive Proforma', tagline: 'Classic brand masthead with advance wire coordinates and validity period', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['pi_minimal', 'pi_corporate'] },
      { id: 'pi_ledger', code: 'PI-02', name: 'Structured Milestone Proforma', tagline: 'High-density schedule of estimated deliverables and stage-gate payments', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['pi_corporate', 'pi_retail'] },
      { id: 'pi_minimal', code: 'PI-03', name: 'Modern Minimal Proforma', tagline: 'Clean borderless layout with quiet typography and advance settlement terms', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['pi_executive', 'pi_ledger'] },
      { id: 'pi_corporate', code: 'PI-04', name: 'Corporate Global Trade', tagline: 'Dual entity billing boxes with international commercial terms (Incoterms)', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['pi_executive', 'pi_retail'] },
      { id: 'pi_retail', code: 'PI-05', name: 'Advance Booking Slip', tagline: 'Compact over-the-counter booking slip with deposit acknowledgment', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['pi_minimal', 'pi_ledger'] },
    ],
  },
  export_invoice: {
    id: 'export_invoice',
    title: 'Export Commercial Invoice',
    shortName: 'Export Invoice',
    subtitle: 'International cross-border supply under LUT/Bond with foreign currency',
    icon: Globe,
    defaultTemplateId: 'exp_executive',
    templates: [
      { id: 'exp_executive', code: 'EXP-01', name: 'Global Trade Executive', tagline: 'LUT/Bond reference, port of discharge, and foreign currency bank wire', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['exp_corporate', 'exp_minimal'] },
      { id: 'exp_ledger', code: 'EXP-02', name: 'Customs Tariff Ledger', tagline: 'Itemized 8-digit HS/HTS tariff codes with net/gross weight and container tally', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['exp_corporate', 'exp_executive'] },
      { id: 'exp_minimal', code: 'EXP-03', name: 'Modern Export Minimal', tagline: 'Clean international invoice format with dual currency conversion tally', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['exp_executive', 'exp_ledger'] },
      { id: 'exp_corporate', code: 'EXP-04', name: 'Multinational Consignment', tagline: 'Port of loading, carrier flight/vessel, and destination customs clearance', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['exp_executive', 'exp_ledger'] },
      { id: 'exp_retail', code: 'EXP-05', name: 'Cross-Border Courier Bill', tagline: 'International express parcel shipping invoice with air waybill tracker', category: 'retail', categoryLabel: 'Trade', similarTemplateIds: ['exp_ledger', 'exp_minimal'] },
    ],
  },
  sales_order: {
    id: 'sales_order',
    title: 'Sales Order Confirmation',
    shortName: 'Sales Order',
    subtitle: 'Formal vendor acceptance of customer purchase order & delivery terms',
    icon: Send,
    defaultTemplateId: 'so_executive',
    templates: [
      { id: 'so_executive', code: 'SO-01', name: 'Executive Order Confirmation', tagline: 'Customer PO cross-reference with delivery schedule and commercial terms', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['so_corporate', 'so_minimal'] },
      { id: 'so_ledger', code: 'SO-02', name: 'Production Dispatch Schedule', tagline: 'Itemized batch manufacturing schedule with fulfillment milestones', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['so_executive', 'so_corporate'] },
      { id: 'so_minimal', code: 'SO-03', name: 'Modern Sales Confirmation', tagline: 'Clean borderless layout with committed dispatch dates and warranty terms', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['so_executive', 'so_ledger'] },
      { id: 'so_corporate', code: 'SO-04', name: 'Enterprise Contract Order', tagline: 'Dual entity billing and delivery panels with stage-gate delivery terms', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['so_executive', 'so_ledger'] },
      { id: 'so_retail', code: 'SO-05', name: 'Counter Order Slip', tagline: 'Fast customer order acknowledgment with pickup verification code', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['so_minimal', 'so_ledger'] },
    ],
  },
  debit_note: {
    id: 'debit_note',
    title: 'Debit Note / Debit Memo',
    shortName: 'Debit Note',
    subtitle: 'Statutory upward rate revision & supplementary invoice claims',
    icon: RotateCcw,
    defaultTemplateId: 'dn_executive',
    templates: [
      { id: 'dn_executive', code: 'DN-01', name: 'Executive Debit Memo', tagline: 'Formal supplementary claim with original invoice cross-reference', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['dn_corporate', 'dn_minimal'] },
      { id: 'dn_ledger', code: 'DN-02', name: 'Tax Revision Ledger', tagline: 'Rule 53 statutory supplementary tax claim and differential item rates', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['dn_executive', 'dn_corporate'] },
      { id: 'dn_minimal', code: 'DN-03', name: 'Modern Minimal Debit', tagline: 'Quiet typography with clean additional balance due and justification notes', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['dn_executive', 'dn_ledger'] },
      { id: 'dn_corporate', code: 'DN-04', name: 'Corporate Contract Surcharge', tagline: 'Enterprise rate revision claim and revised payable balance breakdown', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['dn_executive', 'dn_ledger'] },
      { id: 'dn_retail', code: 'DN-05', name: 'Counter Surcharge Slip', tagline: 'Fast point-of-sale customer debit slip with supplemental charge tally', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['dn_minimal', 'dn_ledger'] },
    ],
  },
  payment_voucher: {
    id: 'payment_voucher',
    title: 'Payment Voucher',
    shortName: 'Payment Voucher',
    subtitle: 'Rule 52 disbursement voucher & treasury cash/bank payout record',
    icon: Landmark,
    defaultTemplateId: 'pv_executive',
    templates: [
      { id: 'pv_executive', code: 'PV-01', name: 'Executive Disbursement Voucher', tagline: 'Treasury payment authorization with bank reference and payee signoff', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['pv_corporate', 'pv_minimal'] },
      { id: 'pv_ledger', code: 'PV-02', name: 'Expense Allocation Ledger', tagline: 'Itemized general ledger expense heads with cost center distribution', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['pv_executive', 'pv_corporate'] },
      { id: 'pv_minimal', code: 'PV-03', name: 'Modern Payout Voucher', tagline: 'Clean cash/bank payout memo with prominent settlement amount', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['pv_executive', 'pv_ledger'] },
      { id: 'pv_corporate', code: 'PV-04', name: 'Corporate Reverse Charge (RCM)', tagline: 'Section 31(3)(g) payment voucher for supplies taxable under reverse charge', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['pv_executive', 'pv_ledger'] },
      { id: 'pv_retail', code: 'PV-05', name: 'Petty Cash Voucher', tagline: 'Quick daily cash disbursement slip with recipient acknowledgment stamp', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['pv_minimal', 'pv_ledger'] },
    ],
  },
  customer_statement: {
    id: 'customer_statement',
    title: 'Customer Account Statement',
    shortName: 'Customer Statement',
    subtitle: 'Periodic billing, payments, credit adjustments & aging analysis',
    icon: ScrollText,
    defaultTemplateId: 'stmt_ledger',
    templates: [
      { id: 'stmt_executive', code: 'STMT-01', name: 'Executive Account Summary', tagline: 'Clean periodic statement masthead with opening/closing balance summary', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['stmt_ledger', 'stmt_corporate'] },
      { id: 'stmt_ledger', code: 'STMT-02', name: 'Comprehensive Running Ledger', tagline: 'Running transaction tally with chronological debits, credits, and balance', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['stmt_executive', 'stmt_corporate'] },
      { id: 'stmt_minimal', code: 'STMT-03', name: 'Modern Balance Statement', tagline: 'Quiet typography with prominent net amount due and remittance advice', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['stmt_executive', 'stmt_ledger'] },
      { id: 'stmt_corporate', code: 'STMT-04', name: 'Enterprise Aging Statement', tagline: '30-60-90+ days aging breakdown band with dual entity account reconciliation', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['stmt_ledger', 'stmt_executive'] },
      { id: 'stmt_retail', code: 'STMT-05', name: 'Customer Monthly Bill Summary', tagline: 'Compact account overview for retail charge accounts and subscriptions', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['stmt_minimal', 'stmt_ledger'] },
    ],
  },
  goods_received_note: {
    id: 'goods_received_note',
    title: 'Goods Received Note (GRN)',
    shortName: 'Goods Receipt',
    subtitle: 'Warehouse inward inventory intake & QA inspection signoff',
    icon: PackageCheck,
    defaultTemplateId: 'grn_ledger',
    templates: [
      { id: 'grn_executive', code: 'GRN-01', name: 'Executive Receiving Memo', tagline: 'Formal warehouse intake sheet with PO cross-reference and transporter details', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['grn_ledger', 'grn_corporate'] },
      { id: 'grn_ledger', code: 'GRN-02', name: 'Quality Inspection Ledger', tagline: 'Detailed ordered vs received vs accepted vs rejected item tally with QC notes', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['grn_executive', 'grn_corporate'] },
      { id: 'grn_minimal', code: 'GRN-03', name: 'Modern Inward Receipt', tagline: 'Clean inventory receiving document with prominent gate-in stamp', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['grn_executive', 'grn_ledger'] },
      { id: 'grn_corporate', code: 'GRN-04', name: 'Multi-Depot Receiving Tally', tagline: 'Warehouse bay coordinates, container seal verification, and QC signoff', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['grn_ledger', 'grn_executive'] },
      { id: 'grn_retail', code: 'GRN-05', name: 'Store Receiving Slip', tagline: 'Fast retail stock intake slip with discrepancy checklist and clerk signoff', category: 'retail', categoryLabel: 'Trade', similarTemplateIds: ['grn_minimal', 'grn_ledger'] },
    ],
  },
  packing_list: {
    id: 'packing_list',
    title: 'Packing List & Manifest',
    shortName: 'Packing List',
    subtitle: 'Shipment cargo carton count, net/gross weights & dimensions',
    icon: Package,
    defaultTemplateId: 'pl_ledger',
    templates: [
      { id: 'pl_executive', code: 'PL-01', name: 'Executive Freight Manifest', tagline: 'Formal shipment manifest with invoice reference, AWB number, and seal ID', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['pl_ledger', 'pl_corporate'] },
      { id: 'pl_ledger', code: 'PL-02', name: 'Carton Breakdown Ledger', tagline: 'Itemized box-by-box breakdown with net weight, gross weight, and CBM volume', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['pl_executive', 'pl_corporate'] },
      { id: 'pl_minimal', code: 'PL-03', name: 'Modern Shipping Slip', tagline: 'Clean borderless layout with total carton count and consignment tracker', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['pl_executive', 'pl_ledger'] },
      { id: 'pl_corporate', code: 'PL-04', name: 'Export Container Tally', tagline: 'Pallet dimensions, shipping marks, hazardous classification, and handling notes', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['pl_ledger', 'pl_executive'] },
      { id: 'pl_retail', code: 'PL-05', name: 'Courier Dispatch Slip', tagline: 'Fast parcel delivery slip with recipient address and tracking barcode', category: 'retail', categoryLabel: 'Trade', similarTemplateIds: ['pl_minimal', 'pl_ledger'] },
    ],
  },
  delivery_challan: {
    id: 'delivery_challan',
    title: 'Delivery Challan',
    shortName: 'Delivery Challan',
    subtitle: 'Rule 55 statutory movement of goods for job work, approval & transfer',
    icon: Truck,
    defaultTemplateId: 'dc_ledger',
    templates: [
      { id: 'dc_executive', code: 'DC-01', name: 'Statutory Executive Challan', tagline: 'Formal Rule 55 transport memo with vehicle registration and purpose of movement', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['dc_ledger', 'dc_corporate'] },
      { id: 'dc_ledger', code: 'DC-02', name: 'Job Work Dispatch Ledger', tagline: 'HSN code itemization with taxable values and consignee acceptance block', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['dc_executive', 'dc_corporate'] },
      { id: 'dc_minimal', code: 'DC-03', name: 'Modern Transport Memo', tagline: 'Clean logistics dispatch document with quiet typography and receiver signoff', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['dc_executive', 'dc_ledger'] },
      { id: 'dc_corporate', code: 'DC-04', name: 'Inter-Branch Stock Transfer', tagline: 'Origin and destination warehouse codes with transporter consignment note', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['dc_ledger', 'dc_executive'] },
      { id: 'dc_retail', code: 'DC-05', name: 'Local Delivery Slip', tagline: 'Rapid same-day goods dispatch memo with customer gate-in acknowledgment', category: 'retail', categoryLabel: 'Trade', similarTemplateIds: ['dc_minimal', 'dc_ledger'] },
    ],
  },
  salary_slip: {
    id: 'salary_slip',
    title: 'Salary Slip / Payslip',
    shortName: 'Salary Slip',
    subtitle: 'Monthly employee wage statement with earnings & statutory deductions',
    icon: Building2,
    defaultTemplateId: 'pay_executive',
    templates: [
      { id: 'pay_executive', code: 'PAY-01', name: 'Corporate Executive Payslip', tagline: 'Formal brand masthead with employee ID, UAN/PF, and net pay hero figure', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['pay_ledger', 'pay_corporate'] },
      { id: 'pay_ledger', code: 'PAY-02', name: 'Two-Column Component Ledger', tagline: 'Balanced earnings (Basic, HRA, Allowances) vs statutory deductions (PF, ESI, TDS)', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['pay_executive', 'pay_corporate'] },
      { id: 'pay_minimal', code: 'PAY-03', name: 'Modern Minimal Payslip', tagline: 'Crisp borderless typography with net pay in words and bank deposit record', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['pay_executive', 'pay_ledger'] },
      { id: 'pay_corporate', code: 'PAY-04', name: 'Enterprise Multi-Component', tagline: 'Detailed tax exemptions, leave balance tracker, and employer contribution tally', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['pay_executive', 'pay_ledger'] },
      { id: 'pay_retail', code: 'PAY-05', name: 'Hourly / Contractor Wage Slip', tagline: 'Shift hours worked, overtime rate, and hourly wage disbursement summary', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['pay_minimal', 'pay_ledger'] },
    ],
  },
  job_offer: {
    id: 'job_offer',
    title: 'Job Offer Letter',
    shortName: 'Job Offer',
    subtitle: 'Corporate employment agreement with designation & CTC breakdown',
    icon: Briefcase,
    defaultTemplateId: 'ofr_executive',
    templates: [
      { id: 'ofr_executive', code: 'OFR-01', name: 'Executive Appointment Offer', tagline: 'Formal corporate letterhead with designation, reporting line, and CTC breakdown', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['ofr_corporate', 'ofr_minimal'] },
      { id: 'ofr_ledger', code: 'OFR-02', name: 'Structured CTC Annexure', tagline: 'Itemized compensation breakdown with monthly vs annual fixed/variable components', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['ofr_executive', 'ofr_corporate'] },
      { id: 'ofr_minimal', code: 'OFR-03', name: 'Modern Offer Agreement', tagline: 'Clean agile offer format with acceptance deadline and joining terms', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['ofr_executive', 'ofr_ledger'] },
      { id: 'ofr_corporate', code: 'OFR-04', name: 'Enterprise Governance Offer', tagline: 'Confidentiality covenants, IP assignment clause, and dual acceptance signatures', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['ofr_executive', 'ofr_ledger'] },
      { id: 'ofr_retail', code: 'OFR-05', name: 'Contract / Associate Letter', tagline: 'Compact employment engagement letter for retail, branch, or seasonal staff', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['ofr_minimal', 'ofr_ledger'] },
    ],
  },
  experience_cert: {
    id: 'experience_cert',
    title: 'Experience & Relieving Certificate',
    shortName: 'Experience Certificate',
    subtitle: 'Formal corporate service certification & employee release memo',
    icon: FileCheck,
    defaultTemplateId: 'expcert_executive',
    templates: [
      { id: 'expcert_executive', code: 'EXC-01', name: 'Executive Service Certificate', tagline: 'Prestigious brand letterhead with service tenure, designation, and conduct endorsement', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['expcert_corporate', 'expcert_minimal'] },
      { id: 'expcert_ledger', code: 'EXC-02', name: 'Role & Responsibilities Schedule', tagline: 'Itemized key achievements, projects led, and technical contributions', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['expcert_executive', 'expcert_corporate'] },
      { id: 'expcert_minimal', code: 'EXC-03', name: 'Modern Relieving Letter', tagline: 'Clean, dignified certification with official release statement and seal', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['expcert_executive', 'expcert_ledger'] },
      { id: 'expcert_corporate', code: 'EXC-04', name: 'Enterprise Dual Clearance', tagline: 'Full and final settlement confirmation with no-dues certificate cross-reference', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['expcert_executive', 'expcert_ledger'] },
      { id: 'expcert_retail', code: 'EXC-05', name: 'Branch Service Memo', tagline: 'Compact certificate of employment for branch, store, and operational staff', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['expcert_minimal', 'expcert_ledger'] },
    ],
  },
  rent_receipt: {
    id: 'rent_receipt',
    title: 'House Rent Receipt',
    shortName: 'Rent Receipt',
    subtitle: 'Section 10(13A) HRA tax exemption receipt with landlord PAN & stamp',
    icon: Building,
    defaultTemplateId: 'rr_minimal',
    templates: [
      { id: 'rr_executive', code: 'RR-01', name: 'Executive Lease Receipt', tagline: 'Formal property masthead with tenancy agreement reference and landlord PAN', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['rr_minimal', 'rr_corporate'] },
      { id: 'rr_ledger', code: 'RR-02', name: 'Rental Schedule Ledger', tagline: 'Monthly rent, maintenance charges, utility dues, and payment transaction ref', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['rr_executive', 'rr_corporate'] },
      { id: 'rr_minimal', code: 'RR-03', name: 'Statutory Revenue Stamp Slip', tagline: 'Official Section 10(13A) HRA format with designated revenue stamp box', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['rr_executive', 'rr_retail'] },
      { id: 'rr_corporate', code: 'RR-04', name: 'Commercial Tenancy Invoice', tagline: 'Commercial office lease receipt with GST compliance and TDS deduction tally', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['rr_executive', 'rr_ledger'] },
      { id: 'rr_retail', code: 'RR-05', name: 'Residential Rent Slip', tagline: 'Quick monthly receipt slip with landlord phone, UPI ID, and tenant signoff', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['rr_minimal', 'rr_ledger'] },
    ],
  },
  student_fee_receipt: {
    id: 'student_fee_receipt',
    title: 'Student Tuition Fee Receipt',
    shortName: 'Tuition Receipt',
    subtitle: 'Academic institutional fee tally with semester breakdown & zero balance',
    icon: GraduationCap,
    defaultTemplateId: 'sfr_ledger',
    templates: [
      { id: 'sfr_executive', code: 'SFR-01', name: 'Institutional Masthead', tagline: 'Formal university/academy crest with enrollment ID, course, and semester', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['sfr_ledger', 'sfr_corporate'] },
      { id: 'sfr_ledger', code: 'SFR-02', name: 'Tuition Component Ledger', tagline: 'Itemized tuition, laboratory, library, examination, and campus facility fees', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['sfr_executive', 'sfr_corporate'] },
      { id: 'sfr_minimal', code: 'SFR-03', name: 'Modern Academic Receipt', tagline: 'Clean borderless layout with total fee paid in words and bank transaction ID', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['sfr_executive', 'sfr_ledger'] },
      { id: 'sfr_corporate', code: 'SFR-04', name: 'Sponsored / Scholarship Grant', tagline: 'Corporate education grant reconciliation with scholarship adjustments', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['sfr_executive', 'sfr_ledger'] },
      { id: 'sfr_retail', code: 'SFR-05', name: 'Campus Counter Slip', tagline: 'Instant fee payment acknowledgment with registrar stamp and barcode', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['sfr_minimal', 'sfr_ledger'] },
    ],
  },
  equipment_handover: {
    id: 'equipment_handover',
    title: 'Equipment Handover Memo',
    shortName: 'Asset Handover',
    subtitle: 'Corporate hardware custody agreement with serial tags & policy terms',
    icon: Laptop,
    defaultTemplateId: 'eq_compact',
    templates: [
      { id: 'eq_executive', code: 'EQ-01', name: 'Corporate Asset Agreement', tagline: 'Formal IT hardware allocation with asset tags, serial numbers, and custody policy', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['eq_compact', 'eq_corporate'] },
      { id: 'eq_compact', code: 'EQ-02', name: 'Hardware Schedule Ledger', tagline: 'Detailed device specs, condition assessment, accessories list, and employee signoff', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['eq_executive', 'eq_corporate'] },
      { id: 'eq_minimal', code: 'EQ-03', name: 'Modern Asset Handover', tagline: 'Clean borderless memo with serial number hero text and security covenants', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['eq_executive', 'eq_compact'] },
      { id: 'eq_corporate', code: 'EQ-04', name: 'Enterprise IT Governance', tagline: 'Data security compliance, remote work terms, and dual authorized IT signatures', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['eq_executive', 'eq_compact'] },
      { id: 'eq_retail', code: 'EQ-05', name: 'Tool & Equipment Pass', tagline: 'Field technician tool checkout memo with return inspection checklist', category: 'retail', categoryLabel: 'Trade', similarTemplateIds: ['eq_minimal', 'eq_compact'] },
    ],
  },
  meeting_minutes: {
    id: 'meeting_minutes',
    title: 'Corporate Meeting Minutes',
    shortName: 'Meeting Minutes',
    subtitle: 'Executive board & committee minutes with quorum, decisions & tasks',
    icon: Users,
    defaultTemplateId: 'mom_executive',
    templates: [
      { id: 'mom_executive', code: 'MOM-01', name: 'Executive Board Minutes', tagline: 'Formal governance masthead with meeting chairperson, attendees, and quorum verification', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['mom_ledger', 'mom_corporate'] },
      { id: 'mom_ledger', code: 'MOM-02', name: 'Action Items & Task Matrix', tagline: 'Structured matrix of resolutions adopted, task assignees, and target deadlines', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['mom_executive', 'mom_corporate'] },
      { id: 'mom_minimal', code: 'MOM-03', name: 'Modern Project Standup Minutes', tagline: 'Concise summary of key decisions, milestone progress, and immediate blockers', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['mom_executive', 'mom_ledger'] },
      { id: 'mom_corporate', code: 'MOM-04', name: 'Secretarial Governance Record', tagline: 'Companies Act secretarial standard format with formal voting outcomes and seals', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['mom_executive', 'mom_ledger'] },
      { id: 'mom_retail', code: 'MOM-05', name: 'Operations Huddle Memo', tagline: 'Quick daily operations shift review with safety notices and shift handover signoff', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['mom_minimal', 'mom_ledger'] },
    ],
  },
  site_inspection: {
    id: 'site_inspection',
    title: 'Site Inspection & Safety Report',
    shortName: 'Safety Audit',
    subtitle: 'Field engineering HSE checklist with hazard levels & auditor signoff',
    icon: ShieldCheck,
    defaultTemplateId: 'sir_ledger',
    templates: [
      { id: 'sir_executive', code: 'SIR-01', name: 'Executive Audit Certification', tagline: 'Formal site engineering inspection with project lead, date, and overall score', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['sir_ledger', 'sir_corporate'] },
      { id: 'sir_ledger', code: 'SIR-02', name: 'Checklist Compliance Ledger', tagline: 'Item-by-item safety audit (Structural, Electrical, PPE) with priority levels', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['sir_executive', 'sir_corporate'] },
      { id: 'sir_minimal', code: 'SIR-03', name: 'Modern Quality Signoff', tagline: 'Clean field report format with pass/fail badges and corrective action notes', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['sir_executive', 'sir_ledger'] },
      { id: 'sir_corporate', code: 'SIR-04', name: 'ISO / OSHA Compliance Report', tagline: 'Statutory environmental, health, and hazard classification documentation', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['sir_ledger', 'sir_executive'] },
      { id: 'sir_retail', code: 'SIR-05', name: 'Store Readiness Checklist', tagline: 'Fast daily facility opening checklist with maintenance tickets and clerk signoff', category: 'retail', categoryLabel: 'Trade', similarTemplateIds: ['sir_minimal', 'sir_ledger'] },
    ],
  },
  nda_agreement: {
    id: 'nda_agreement',
    title: 'Non-Disclosure Agreement (NDA)',
    shortName: 'Mutual NDA',
    subtitle: 'Legally binding mutual confidentiality agreement & trade secrecy covenant',
    icon: Scale,
    defaultTemplateId: 'nda_executive',
    templates: [
      { id: 'nda_executive', code: 'NDA-01', name: 'Mutual Executive NDA', tagline: 'Formal bilateral confidentiality deed with definitions, exclusions, and jurisdiction', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['nda_corporate', 'nda_minimal'] },
      { id: 'nda_ledger', code: 'NDA-02', name: 'Proprietary Schedule Deed', tagline: 'Itemized schedule of protected trade secrets, patent pending tech, and codebases', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['nda_executive', 'nda_corporate'] },
      { id: 'nda_minimal', code: 'NDA-03', name: 'Modern Fast-Track NDA', tagline: 'Clean bilateral non-disclosure agreement for tech discovery calls and contractor scoping', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['nda_executive', 'nda_ledger'] },
      { id: 'nda_corporate', code: 'NDA-04', name: 'Enterprise Commercial Contract', tagline: 'Dual entity indemnification, injunctive relief covenants, and governing court jurisdiction', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['nda_executive', 'nda_ledger'] },
      { id: 'nda_retail', code: 'NDA-05', name: 'Employee Confidentiality Memo', tagline: 'Standard employee onboarding secrecy pledge with trade secret return policy', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['nda_minimal', 'nda_ledger'] },
    ],
  },
  commercial_invoice: {
    id: 'commercial_invoice',
    title: 'Commercial Invoice',
    shortName: 'Commercial Invoice',
    subtitle: 'Standard commercial sales billing for international & non-GST B2B trade',
    icon: Globe,
    defaultTemplateId: 'ci_executive',
    templates: [
      { id: 'ci_executive', code: 'CI-01', name: 'Executive Commercial Invoice', tagline: 'Classic brand masthead with Incoterms and international wire routing', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['ci_corporate', 'ci_minimal'] },
      { id: 'ci_ledger', code: 'CI-02', name: 'Structured Itemized Ledger', tagline: 'Dense tabular grid with unit rates, package tallies, and customs commodity codes', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['ci_executive', 'ci_corporate'] },
      { id: 'ci_minimal', code: 'CI-03', name: 'Modern Minimalist Invoice', tagline: 'Clean typography with quiet whitespace and prominent commercial invoice number', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['ci_executive', 'ci_ledger'] },
      { id: 'ci_corporate', code: 'CI-04', name: 'Corporate Global Trade', tagline: 'Dual entity billing with destination port, currency parity, and payment terms', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['ci_executive', 'ci_ledger'] },
      { id: 'ci_retail', code: 'CI-05', name: 'Trade Dispatch Bill', tagline: 'Fast commercial dispatch bill with courier consignment tracking', category: 'retail', categoryLabel: 'Trade', similarTemplateIds: ['ci_minimal', 'ci_ledger'] },
    ],
  },
  invoice_cum_bill_of_supply: {
    id: 'invoice_cum_bill_of_supply',
    title: 'Invoice-cum-Bill of Supply',
    shortName: 'Invoice-cum-Bill',
    subtitle: 'Rule 46A statutory instrument for taxable & exempt mixed supplies',
    icon: FileSpreadsheet,
    defaultTemplateId: 'icb_ledger',
    templates: [
      { id: 'icb_executive', code: 'ICB-01', name: 'Executive Mixed Supply Memo', tagline: 'Statutory Rule 46A banner with distinct taxable and exempt item separation', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['icb_ledger', 'icb_corporate'] },
      { id: 'icb_ledger', code: 'ICB-02', name: 'Dual Schedule Ledger', tagline: 'Side-by-side taxable value calculation and exempt supply reconciliation tally', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['icb_executive', 'icb_corporate'] },
      { id: 'icb_minimal', code: 'ICB-03', name: 'Modern Composite Bill', tagline: 'Clean format with concise Rule 46A declaration and quiet totals band', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['icb_executive', 'icb_ledger'] },
      { id: 'icb_corporate', code: 'ICB-04', name: 'Enterprise Composite Contract', tagline: 'Dual buyer/consignee panels with multi-tier GST tax component breakdown', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['icb_executive', 'icb_ledger'] },
      { id: 'icb_retail', code: 'ICB-05', name: 'Retail Composite Counter Slip', tagline: 'Counter receipt handling mixed grocery/hardware taxable and exempt products', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['icb_minimal', 'icb_ledger'] },
    ],
  },
  cash_bill: {
    id: 'cash_bill',
    title: 'Cash Bill / Cash Memo',
    shortName: 'Cash Memo',
    subtitle: 'Over-the-counter sales memo with immediate cash settlement',
    icon: Receipt,
    defaultTemplateId: 'cb_retail',
    templates: [
      { id: 'cb_executive', code: 'CB-01', name: 'Executive Cash Bill', tagline: 'Formal cash transaction memo with cashier signature and payment seal', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['cb_minimal', 'cb_retail'] },
      { id: 'cb_ledger', code: 'CB-02', name: 'Itemized Cash Ledger', tagline: 'Structured list of counter sales items with cash tendered and change returned', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['cb_retail', 'cb_corporate'] },
      { id: 'cb_minimal', code: 'CB-03', name: 'Modern Minimal Cash Slip', tagline: 'Clean typography with paid in cash badge and zero remaining balance', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['cb_executive', 'cb_retail'] },
      { id: 'cb_corporate', code: 'CB-04', name: 'Corporate Petty Cash Sale', tagline: 'Internal petty cash sales bill with cost center billing code', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['cb_executive', 'cb_ledger'] },
      { id: 'cb_retail', code: 'CB-05', name: 'Store Cash Memo', tagline: 'High-speed counter cash memo with cashier register stamp and barcode', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['cb_minimal', 'cb_ledger'] },
    ],
  },
  pos_receipt: {
    id: 'pos_receipt',
    title: 'POS Terminal Receipt',
    shortName: 'POS Receipt',
    subtitle: 'High-speed thermal register slip with dynamic QR & barcode verification',
    icon: Receipt,
    defaultTemplateId: 'pos_retail',
    templates: [
      { id: 'pos_executive', code: 'POS-01', name: 'Executive Register Voucher', tagline: 'Premium terminal receipt with customer reward points and tax tally', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['pos_retail', 'pos_minimal'] },
      { id: 'pos_ledger', code: 'POS-02', name: 'Detailed Thermal Slip', tagline: 'High-density line-by-line item barcode tally with discounts and card approval', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['pos_retail', 'pos_corporate'] },
      { id: 'pos_minimal', code: 'POS-03', name: 'Modern Fast-Lane Receipt', tagline: 'Minimalist thermal layout with bold hero total and digital UPI QR code', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['pos_retail', 'pos_executive'] },
      { id: 'pos_corporate', code: 'POS-04', name: 'Enterprise Terminal Audit', tagline: 'Shift register audit tally with payment method split (Cash, Card, UPI)', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['pos_ledger', 'pos_executive'] },
      { id: 'pos_retail', code: 'POS-05', name: 'Counter Thermal Slip', tagline: 'Standard 80mm thermal receipt format with transaction auth and return barcode', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['pos_minimal', 'pos_ledger'] },
    ],
  },
  service_invoice: {
    id: 'service_invoice',
    title: 'Service Tax Invoice',
    shortName: 'Service Invoice',
    subtitle: 'Professional consulting & service tax billing with 6-digit SAC codes',
    icon: Briefcase,
    defaultTemplateId: 'srv_executive',
    templates: [
      { id: 'srv_executive', code: 'SRV-01', name: 'Executive Advisory Letterhead', tagline: 'Brand masthead with consulting engagement reference and professional SAC breakdown', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['srv_minimal', 'srv_corporate'] },
      { id: 'srv_ledger', code: 'SRV-02', name: 'Structured SAC Ledger', tagline: 'Itemized service deliverables, billing periods, hourly rates, and tax analysis', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['srv_corporate', 'srv_retail'] },
      { id: 'srv_minimal', code: 'SRV-03', name: 'Agency Minimalist Bill', tagline: 'Clean modern invoice for creative and tech services with quiet typography', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['srv_executive', 'srv_ledger'] },
      { id: 'srv_corporate', code: 'SRV-04', name: 'Enterprise SOW Service Invoice', tagline: 'Master Services Agreement (MSA) reference with dual tax and RCM declaration', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['srv_executive', 'srv_ledger'] },
      { id: 'srv_retail', code: 'SRV-05', name: 'Direct Consultation Slip', tagline: 'Compact service bill for walk-in professional advice and quick service fees', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['srv_minimal', 'srv_ledger'] },
    ],
  },
  milestone_invoice: {
    id: 'milestone_invoice',
    title: 'Milestone / Tranche Invoice',
    shortName: 'Milestone Invoice',
    subtitle: 'Project billing linked to SOW deliverable completion signoff',
    icon: Layers,
    defaultTemplateId: 'mst_ledger',
    templates: [
      { id: 'mst_executive', code: 'MST-01', name: 'Executive Deliverable Bill', tagline: 'Formal milestone release statement with milestone verification certificate', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['mst_corporate', 'mst_ledger'] },
      { id: 'mst_ledger', code: 'MST-02', name: 'Phase Completion Ledger', tagline: 'Detailed schedule of contract phases, weightage %, and cumulative billed sum', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['mst_executive', 'mst_corporate'] },
      { id: 'mst_minimal', code: 'MST-03', name: 'Modern Agile Sprint Invoice', tagline: 'Sprint delivery signoff with transparent acceptance criteria and milestone total', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['mst_executive', 'mst_ledger'] },
      { id: 'mst_corporate', code: 'MST-04', name: 'Enterprise Stage-Gate Draw', tagline: 'Dual entity signoff panels with project manager acceptance verification', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['mst_executive', 'mst_ledger'] },
      { id: 'mst_retail', code: 'MST-05', name: 'Project Stage Payment Slip', tagline: 'Compact milestone invoice for trade contractors and fabrication milestones', category: 'retail', categoryLabel: 'Trade', similarTemplateIds: ['mst_minimal', 'mst_ledger'] },
    ],
  },
  progress_invoice: {
    id: 'progress_invoice',
    title: 'Progress Billing Invoice',
    shortName: 'Progress Bill',
    subtitle: 'AIA G702 construction progress draw with retainage accounting',
    icon: Building2,
    defaultTemplateId: 'prg_ledger',
    templates: [
      { id: 'prg_executive', code: 'PRG-01', name: 'Executive Application for Payment', tagline: 'Formal contractor draw request with architect/engineer approval certification', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['prg_ledger', 'prg_corporate'] },
      { id: 'prg_ledger', code: 'PRG-02', name: 'AIA G702/G703 Schedule', tagline: 'Schedule of values: scheduled value, work completed, stored materials & retainage', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['prg_executive', 'prg_corporate'] },
      { id: 'prg_minimal', code: 'PRG-03', name: 'Modern Interim Contractor Bill', tagline: 'Clean progress draw format with prominent % complete and net amount payable', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['prg_executive', 'prg_ledger'] },
      { id: 'prg_corporate', code: 'PRG-04', name: 'Enterprise EPC Progress Claim', tagline: 'Multi-site construction billing with lien waiver declaration and escrow notes', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['prg_ledger', 'prg_executive'] },
      { id: 'prg_retail', code: 'PRG-05', name: 'Subcontractor Draw Memo', tagline: 'Fast trade contractor progress slip with site supervisor verification signoff', category: 'retail', categoryLabel: 'Trade', similarTemplateIds: ['prg_minimal', 'prg_ledger'] },
    ],
  },
  recurring_invoice: {
    id: 'recurring_invoice',
    title: 'Recurring Subscription Invoice',
    shortName: 'Subscription Bill',
    subtitle: 'Automated periodic SaaS subscriptions & annual maintenance contracts',
    icon: FileClock,
    defaultTemplateId: 'sub_minimal',
    templates: [
      { id: 'sub_executive', code: 'SUB-01', name: 'Executive Subscription Statement', tagline: 'Brand masthead with billing cycle dates, user seat count, and auto-pay status', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['sub_minimal', 'sub_corporate'] },
      { id: 'sub_ledger', code: 'SUB-02', name: 'Usage & Tier Breakdown', tagline: 'Itemized base plan tiers, metered overages, and annual discount reconciliation', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['sub_executive', 'sub_corporate'] },
      { id: 'sub_minimal', code: 'SUB-03', name: 'Modern SaaS Minimalist', tagline: 'Quiet typography with clean period dates, plan name, and one-click renewal link', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['sub_executive', 'sub_ledger'] },
      { id: 'sub_corporate', code: 'SUB-04', name: 'Enterprise Cloud Agreement', tagline: 'Master subscription agreement with SLA uptime commitment and dedicated support', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['sub_executive', 'sub_ledger'] },
      { id: 'sub_retail', code: 'SUB-05', name: 'Membership / AMC Bill', tagline: 'Compact recurring bill for retail memberships, fitness, and equipment maintenance', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['sub_minimal', 'sub_ledger'] },
    ],
  },
  advance_invoice: {
    id: 'advance_invoice',
    title: 'Advance Payment Invoice',
    shortName: 'Advance Voucher',
    subtitle: 'Rule 50 statutory advance receipt voucher & tax determination',
    icon: Landmark,
    defaultTemplateId: 'adv_executive',
    templates: [
      { id: 'adv_executive', code: 'ADV-01', name: 'Statutory Advance Voucher', tagline: 'CBIC Rule 50 advance receipt with tax rate breakdown and place of supply', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['adv_ledger', 'adv_corporate'] },
      { id: 'adv_ledger', code: 'ADV-02', name: 'Advance Deposit Ledger', tagline: 'Detailed advance allocation tally against upcoming milestone contracts', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['adv_executive', 'adv_corporate'] },
      { id: 'adv_minimal', code: 'ADV-03', name: 'Modern Advance Acknowledgment', tagline: 'Clean deposit receipt with bank UTR and forthcoming invoice reference', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['adv_executive', 'adv_ledger'] },
      { id: 'adv_corporate', code: 'ADV-04', name: 'Corporate Escrow / Retainer', tagline: 'Enterprise client deposit acknowledgment with legal escrow interest covenants', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['adv_executive', 'adv_ledger'] },
      { id: 'adv_retail', code: 'ADV-05', name: 'Customer Booking Deposit Slip', tagline: 'Fast retail booking deposit slip with order reservation code', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['adv_minimal', 'adv_ledger'] },
    ],
  },
  revised_tax_invoice: {
    id: 'revised_tax_invoice',
    title: 'Revised Tax Invoice',
    shortName: 'Revised Invoice',
    subtitle: 'Rule 53 statutory supplementary tax invoice against prior bills',
    icon: RotateCcw,
    defaultTemplateId: 'rev_ledger',
    templates: [
      { id: 'rev_executive', code: 'REV-01', name: 'Statutory Revised Invoice', tagline: 'Rule 53 formal revised bill with original invoice number and date cross-reference', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['rev_ledger', 'rev_corporate'] },
      { id: 'rev_ledger', code: 'REV-02', name: 'Differential Rate Ledger', tagline: 'Side-by-side comparison of original invoiced rates vs revised statutory rates', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['rev_executive', 'rev_corporate'] },
      { id: 'rev_minimal', code: 'REV-03', name: 'Modern Revised Bill', tagline: 'Quiet typography with prominent revised totals and CBIC statutory reference', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['rev_executive', 'rev_ledger'] },
      { id: 'rev_corporate', code: 'REV-04', name: 'Enterprise Contract Revision', tagline: 'Dual entity billing with contractual amendment clause and tax reconciliation', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['rev_executive', 'rev_ledger'] },
      { id: 'rev_retail', code: 'REV-05', name: 'Counter Revised Bill', tagline: 'Fast point-of-sale bill replacement with original receipt surrender record', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['rev_minimal', 'rev_ledger'] },
    ],
  },
  sales_return_note: {
    id: 'sales_return_note',
    title: 'Sales Return Note',
    shortName: 'Sales Return',
    subtitle: 'Commercial return authorization & merchandise condition triage',
    icon: RotateCcw,
    defaultTemplateId: 'srn_ledger',
    templates: [
      { id: 'srn_executive', code: 'SRN-01', name: 'Executive Return Memo', tagline: 'Formal merchandise return authorization with customer signoff and QC inspection', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['srn_ledger', 'srn_corporate'] },
      { id: 'srn_ledger', code: 'SRN-02', name: 'Return Inspection Ledger', tagline: 'Itemized condition grade (Resellable, Damaged, Defective) with credit value tally', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['srn_executive', 'srn_corporate'] },
      { id: 'srn_minimal', code: 'SRN-03', name: 'Modern RMA Note', tagline: 'Clean RMA format with barcode tracking and credit refund recommendation', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['srn_executive', 'srn_ledger'] },
      { id: 'srn_corporate', code: 'SRN-04', name: 'Enterprise Restocking Report', tagline: 'Warehouse intake coordinates, supplier warranty return pass, and ledger tally', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['srn_ledger', 'srn_executive'] },
      { id: 'srn_retail', code: 'SRN-05', name: 'Store Return Slip', tagline: 'Fast customer store return slip with instant credit note voucher reference', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['srn_minimal', 'srn_ledger'] },
    ],
  },
  invoice_aging_report: {
    id: 'invoice_aging_report',
    title: 'AR Aging Report',
    shortName: 'Aging Schedule',
    subtitle: 'Accounts receivable overdue aging bands & collection priority',
    icon: ScrollText,
    defaultTemplateId: 'age_ledger',
    templates: [
      { id: 'age_executive', code: 'AGE-01', name: 'Executive Aging Overview', tagline: 'Executive financial summary of outstanding receivables by aging buckets', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['age_ledger', 'age_corporate'] },
      { id: 'age_ledger', code: 'AGE-02', name: 'Comprehensive Aging Ledger', tagline: 'Multi-column debtor schedule: Current, 1-30, 31-60, 61-90, and 90+ days past due', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['age_executive', 'age_corporate'] },
      { id: 'age_minimal', code: 'AGE-03', name: 'Modern Aging Summary', tagline: 'Crisp overdue tally with risk status badges and priority collection tags', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['age_executive', 'age_ledger'] },
      { id: 'age_corporate', code: 'AGE-04', name: 'Enterprise Credit Risk Analysis', tagline: 'Credit limit utilization, bad-debt risk provisioning, and CFO signoff', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['age_ledger', 'age_executive'] },
      { id: 'age_retail', code: 'AGE-05', name: 'Store Credit Aging Slip', tagline: 'Compact customer credit ledger for branch and wholesale account monitoring', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['age_minimal', 'age_ledger'] },
    ],
  },
  payment_reminder: {
    id: 'payment_reminder',
    title: 'Payment Reminder Notice',
    shortName: 'Payment Reminder',
    subtitle: 'Formal overdue dunning notice with late interest calculation',
    icon: FileClock,
    defaultTemplateId: 'rem_executive',
    templates: [
      { id: 'rem_executive', code: 'REM-01', name: 'Executive Overdue Notice', tagline: 'Formal dunning letterhead with invoice schedule, accrued interest, and wire coordinates', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['rem_corporate', 'rem_minimal'] },
      { id: 'rem_ledger', code: 'REM-02', name: 'Itemized Overdue Schedule', tagline: 'List of past-due invoices with due dates, days overdue, and contractual interest rate', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['rem_executive', 'rem_corporate'] },
      { id: 'rem_minimal', code: 'REM-03', name: 'Modern Friendly Reminder', tagline: 'Courteous payment reminder with quiet typography and instant UPI QR link', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['rem_executive', 'rem_ledger'] },
      { id: 'rem_corporate', code: 'REM-04', name: 'Final Statutory Demand', tagline: 'Pre-legal collection demand with formal notice period and governing court warning', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['rem_executive', 'rem_ledger'] },
      { id: 'rem_retail', code: 'REM-05', name: 'Customer Account Due Slip', tagline: 'Quick billing reminder slip for retail credit accounts and monthly subscribers', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['rem_minimal', 'rem_ledger'] },
    ],
  },
  order_confirmation: {
    id: 'order_confirmation',
    title: 'Order Confirmation',
    shortName: 'Order Confirmation',
    subtitle: 'Binding vendor acceptance of purchase order & committed delivery dates',
    icon: Send,
    defaultTemplateId: 'oc_executive',
    templates: [
      { id: 'oc_executive', code: 'OC-01', name: 'Executive Order Acceptance', tagline: 'Formal acknowledgment of customer PO with committed production schedule', category: 'executive', categoryLabel: 'Executive', similarTemplateIds: ['oc_corporate', 'oc_minimal'] },
      { id: 'oc_ledger', code: 'OC-02', name: 'Manufacturing Tally Ledger', tagline: 'Itemized bill of materials, committed dispatch dates, and quality specifications', category: 'ledger', categoryLabel: 'Ledger', similarTemplateIds: ['oc_executive', 'oc_corporate'] },
      { id: 'oc_minimal', code: 'OC-03', name: 'Modern Order Confirmation', tagline: 'Clean order acceptance with prominent order code and delivery terms', category: 'minimal', categoryLabel: 'Minimal', similarTemplateIds: ['oc_executive', 'oc_ledger'] },
      { id: 'oc_corporate', code: 'OC-04', name: 'Enterprise Contract Acceptance', tagline: 'Dual entity signoffs with warranty covenants and dispute resolution clause', category: 'corporate', categoryLabel: 'Corporate', similarTemplateIds: ['oc_executive', 'oc_ledger'] },
      { id: 'oc_retail', code: 'OC-05', name: 'Store Order Slip', tagline: 'Fast customer order booking confirmation with pickup verification barcode', category: 'retail', categoryLabel: 'Retail', similarTemplateIds: ['oc_minimal', 'oc_ledger'] },
    ],
  },
};


/**
 * Miniature Wireframe Schematic
 * Refined, airy visual geometry with delicate hairlines.
 */
function TemplateWireframeThumbnail({
  category,
  isSelected,
}: {
  category: TemplateCategory;
  isSelected: boolean;
}) {
  const lineCol = isSelected ? '#FFFFFF' : '#71717A';
  const borderCol = isSelected ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.12)';
  const bgCol = isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)';

  return (
    <View style={[styles.wireframeBox, { borderColor: borderCol, backgroundColor: bgCol }]}>
      {category === 'executive' && (
        <View style={styles.wfInner}>
          <View style={styles.wfRowBetween}>
            <View style={[styles.wfBar, { width: '40%', height: 3, backgroundColor: lineCol }]} />
            <View style={[styles.wfDivider, { backgroundColor: lineCol }]} />
            <View style={[styles.wfBar, { width: '40%', height: 3, backgroundColor: lineCol }]} />
          </View>
          <View style={[styles.wfHairline, { backgroundColor: lineCol, marginVertical: 4 }]} />
          <View style={[styles.wfBar, { width: '55%', height: 2, backgroundColor: lineCol, opacity: 0.5, marginBottom: 3 }]} />
          <View style={[styles.wfBar, { width: '100%', height: 1.5, backgroundColor: lineCol, opacity: 0.3, marginBottom: 2.5 }]} />
          <View style={[styles.wfBar, { width: '100%', height: 1.5, backgroundColor: lineCol, opacity: 0.3, marginBottom: 2.5 }]} />
          <View style={[styles.wfBar, { width: '100%', height: 1.5, backgroundColor: lineCol, opacity: 0.3, marginBottom: 5 }]} />
          <View style={styles.wfRowBetween}>
            <View style={[styles.wfBar, { width: '25%', height: 2, backgroundColor: lineCol, opacity: 0.3 }]} />
            <View style={[styles.wfBar, { width: '35%', height: 3.5, backgroundColor: lineCol }]} />
          </View>
        </View>
      )}

      {category === 'ledger' && (
        <View style={styles.wfInner}>
          <View style={styles.wfRowBetween}>
            <View style={[styles.wfBar, { width: '45%', height: 3, backgroundColor: lineCol }]} />
            <View style={[styles.wfBar, { width: '30%', height: 3, backgroundColor: lineCol }]} />
          </View>
          <View style={[styles.wfGridBand, { borderColor: lineCol }]}>
            <View style={[styles.wfGridCell, { borderRightColor: lineCol }]} />
            <View style={[styles.wfGridCell, { borderRightColor: lineCol }]} />
            <View style={[styles.wfGridCell, { borderRightColor: lineCol }]} />
            <View style={styles.wfGridCell} />
          </View>
          <View style={[styles.wfBar, { width: '100%', height: 1.5, backgroundColor: lineCol, opacity: 0.3, marginVertical: 2.5 }]} />
          <View style={[styles.wfBar, { width: '100%', height: 1.5, backgroundColor: lineCol, opacity: 0.3, marginBottom: 2.5 }]} />
          <View style={[styles.wfBar, { width: '100%', height: 1.5, backgroundColor: lineCol, opacity: 0.3, marginBottom: 4 }]} />
          <View style={styles.wfRowBetween}>
            <View style={[styles.wfBar, { width: '25%', height: 2, backgroundColor: lineCol, opacity: 0.3 }]} />
            <View style={[styles.wfBoxOutline, { borderColor: lineCol }]} />
          </View>
        </View>
      )}

      {category === 'minimal' && (
        <View style={styles.wfInner}>
          <View style={styles.wfRowBetween}>
            <View style={[styles.wfBar, { width: '50%', height: 3, backgroundColor: lineCol }]} />
            <View style={[styles.wfBar, { width: 10, height: 6, backgroundColor: lineCol }]} />
          </View>
          <View style={{ height: 6 }} />
          <View style={[styles.wfBar, { width: '100%', height: 1, backgroundColor: lineCol, opacity: 0.3, marginBottom: 3 }]} />
          <View style={[styles.wfBar, { width: '100%', height: 1, backgroundColor: lineCol, opacity: 0.3, marginBottom: 3 }]} />
          <View style={[styles.wfBar, { width: '100%', height: 1, backgroundColor: lineCol, opacity: 0.3, marginBottom: 6 }]} />
          <View style={{ alignItems: 'flex-end' }}>
            <View style={[styles.wfBar, { width: '35%', height: 3, backgroundColor: lineCol }]} />
          </View>
        </View>
      )}

      {category === 'corporate' && (
        <View style={styles.wfInner}>
          <View style={[styles.wfBar, { width: '45%', height: 3, backgroundColor: lineCol, marginBottom: 3 }]} />
          <View style={styles.wfRowPanels}>
            <View style={[styles.wfPanel, { borderColor: lineCol }]} />
            <View style={[styles.wfPanel, { borderColor: lineCol }]} />
          </View>
          <View style={[styles.wfBar, { width: '100%', height: 1.5, backgroundColor: lineCol, opacity: 0.3, marginVertical: 3 }]} />
          <View style={[styles.wfBar, { width: '100%', height: 1.5, backgroundColor: lineCol, opacity: 0.3, marginBottom: 4 }]} />
          <View style={styles.wfRowBetween}>
            <View style={[styles.wfBar, { width: '30%', height: 2, backgroundColor: lineCol, opacity: 0.3 }]} />
            <View style={[styles.wfBar, { width: '30%', height: 3.5, backgroundColor: lineCol }]} />
          </View>
        </View>
      )}

      {category === 'retail' && (
        <View style={styles.wfInner}>
          <View style={styles.wfRowBetween}>
            <View style={[styles.wfBar, { width: '45%', height: 3, backgroundColor: lineCol }]} />
            <View style={[styles.wfDot, { backgroundColor: lineCol }]} />
          </View>
          <View style={[styles.wfStrip, { borderColor: lineCol }]}>
            <View style={[styles.wfBar, { width: '28%', height: 1.5, backgroundColor: lineCol }]} />
            <View style={[styles.wfBar, { width: '28%', height: 1.5, backgroundColor: lineCol }]} />
            <View style={[styles.wfBar, { width: '28%', height: 1.5, backgroundColor: lineCol }]} />
          </View>
          <View style={[styles.wfBar, { width: '100%', height: 1.5, backgroundColor: lineCol, opacity: 0.3, marginVertical: 2.5 }]} />
          <View style={[styles.wfBar, { width: '100%', height: 1.5, backgroundColor: lineCol, opacity: 0.3, marginBottom: 4 }]} />
          <View style={styles.wfRowBetween}>
            <View style={[styles.wfBar, { width: '25%', height: 2, backgroundColor: lineCol, opacity: 0.3 }]} />
            <View style={[styles.wfBar, { width: '35%', height: 3.5, backgroundColor: lineCol }]} />
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * Legally Structured Document Data Interface
 */
interface DocumentCanvasData {
  docTypeTag: string;
  docTitle: string;
  docNumber: string;
  issueDate: string;
  secondaryMeta: string;
  statutoryBanner?: {
    text: string;
    subtext?: string;
  } | null;
  ledgerBand: { label: string; val: string }[];
  partyTitle: string;
  partyName: string;
  partyMeta: string;
  partySubMeta?: string;
  secondaryPartyTitle?: string;
  secondaryPartyName?: string;
  secondaryPartyMeta?: string;
  retailStrip: { label: string; val: string }[];
  tableHeaders: { title: string; flex?: number; width?: number; align?: 'left' | 'center' | 'right' }[];
  tableRows: {
    cells: { text: string; flex?: number; width?: number; align?: 'left' | 'center' | 'right'; isBold?: boolean }[];
  }[];
  subtotalLabel: string;
  subtotalValue: string;
  taxRows: { label: string; val: string }[];
  totalLabel: string;
  totalAmount: string;
  amountInWords?: string;
  legalDeclaration: string;
  legalStandardBadge: string;
  showBankDetails: boolean;
  dualSignatures?: {
    primaryRole: string;
    primaryEntity: string;
    secondaryRole: string;
    secondaryEntity: string;
  } | null;
}

export default function DocumentTemplateSelectionScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ type?: string; templateId?: string }>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 880;

  // Normalized document type lookup
  const activeDocType = useMemo<string>(() => {
    const rawType = (searchParams.type || 'invoice').toLowerCase().replace('-', '_');
    if (rawType === 'challan' || rawType === 'delivery_challan') return 'delivery_challan';
    if (rawType === 'tax_invoice') return 'invoice';
    if (rawType === 'quote' || rawType === 'quotation') return 'estimate';
    if (rawType === 'bos') return 'bill_of_supply';
    if (rawType === 'po') return 'purchase_order';
    if (rawType === 'sow') return 'work_order';
    if (rawType === 'credit') return 'credit_note';
    if (rawType === 'debit' || rawType === 'dn') return 'debit_note';
    if (rawType === 'grn') return 'goods_received_note';
    if (rawType === 'pack' || rawType === 'packing') return 'packing_list';
    if (rawType === 'so') return 'sales_order';
    if (rawType === 'statement' || rawType === 'customer_account_statement') return 'customer_statement';
    if (rawType === 'salary' || rawType === 'payslip') return 'salary_slip';
    if (rawType === 'offer' || rawType === 'offer_letter' || rawType === 'job_offer_letter') return 'job_offer';
    if (rawType === 'experience' || rawType === 'experience_certificate') return 'experience_cert';
    if (rawType === 'rent') return 'rent_receipt';
    if (rawType === 'fee' || rawType === 'tuition' || rawType === 'student_fee' || rawType === 'student_fee_receipt') return 'student_fee_receipt';
    if (rawType === 'equipment' || rawType === 'asset_handover' || rawType === 'equipment_responsibility_letter') return 'equipment_handover';
    if (rawType === 'minutes' || rawType === 'mom') return 'meeting_minutes';
    if (rawType === 'inspection' || rawType === 'audit_report' || rawType === 'site_inspection_report') return 'site_inspection';
    if (rawType === 'nda' || rawType === 'confidentiality') return 'nda_agreement';
    return DOCUMENT_TYPE_CONFIGS[rawType] ? rawType : 'invoice';
  }, [searchParams.type]);

  const activeConfig = useMemo(() => {
    return DOCUMENT_TYPE_CONFIGS[activeDocType] || DOCUMENT_TYPE_CONFIGS.invoice;
  }, [activeDocType]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    if (searchParams.templateId) {
      const match = activeConfig.templates.find((t) => t.id === searchParams.templateId);
      if (match) return match.id;
    }
    return activeConfig.defaultTemplateId;
  });

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const selectedTemplate = useMemo(() => {
    return (
      activeConfig.templates.find((t) => t.id === selectedTemplateId) ||
      activeConfig.templates[0]
    );
  }, [activeConfig, selectedTemplateId]);

  const visibleTemplates = useMemo(() => {
    if (selectedCategoryFilter === 'all') return activeConfig.templates;
    return activeConfig.templates.filter((t) => t.category === selectedCategoryFilter);
  }, [activeConfig, selectedCategoryFilter]);

  const similarTemplates = useMemo(() => {
    return activeConfig.templates.filter(
      (t) => t.id !== selectedTemplate.id && selectedTemplate.similarTemplateIds.includes(t.id)
    );
  }, [activeConfig, selectedTemplate]);

  // Dynamic organization profile state
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('IN');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await BusinessProfileRepository.getActiveProfile();
        if (profile) {
          setBusinessProfile(profile);
          if (profile.country_iso2) {
            const iso = profile.country_iso2.toUpperCase();
            if (COUNTRY_TAX_CONFIGS[iso]) {
              setSelectedCountryCode(iso);
            }
          }
        }
      } catch {
        // Safe fallback to default demo credentials
      }
    };
    loadProfile();
  }, []);

  const countryCfg = useMemo(() => {
    return COUNTRY_TAX_CONFIGS[selectedCountryCode] || COUNTRY_TAX_CONFIGS.IN;
  }, [selectedCountryCode]);

  // Organization resolved credentials
  const orgLegalName = businessProfile?.legal_name || businessProfile?.name || 'Apex Technologies Pvt Ltd';
  const orgTradeName = businessProfile?.name && businessProfile?.name !== businessProfile?.legal_name ? businessProfile.name : null;
  const orgGstin = businessProfile?.tax_id || countryCfg.defaultTaxId;
  const orgPan = (orgGstin && orgGstin.length >= 12 && selectedCountryCode === 'IN') ? orgGstin.substring(2, 12) : (countryCfg.defaultSecondaryTaxId || 'AABCU9603R');
  const orgState = businessProfile?.state || countryCfg.sampleSubdivision;
  const orgStateCode = (orgGstin && orgGstin.length >= 2 && selectedCountryCode === 'IN') ? orgGstin.substring(0, 2) : '27';
  const orgAddress = [
    businessProfile?.address_line1,
    businessProfile?.address_line2,
    businessProfile?.city,
    businessProfile?.state,
    businessProfile?.postal_code,
  ].filter(Boolean).join(', ') || (selectedCountryCode === 'IN' ? '101, Maker Chambers V, Nariman Point, Mumbai 400021' : countryCfg.samplePartySubMeta);
  const orgPhone = businessProfile?.phone || '+91 98200 12345';
  const orgEmail = businessProfile?.email || 'billing@apextech.in';
  const orgBankName = businessProfile?.bank_name || countryCfg.sampleBankName;
  const orgBankAccount = businessProfile?.bank_account_number || countryCfg.sampleAccountNo;
  const orgBankIfsc = businessProfile?.bank_ifsc || countryCfg.sampleRoutingVal;
  const orgBankBranch = businessProfile?.bank_branch || 'Financial Center Branch';
  const orgUpiVpa = businessProfile?.upi_vpa || countryCfg.sampleDigitalPayVal;
  const orgSignatory = businessProfile?.signatory_name || 'Authorised Signatory';
  const orgSignatoryTitle = businessProfile?.signatory_title || 'Director / Authorized Officer';

  // Resolved dynamic statutory tax line & bank coordinates
  const orgResolvedTaxLine = useMemo(() => {
    const isProfileCountry = !businessProfile?.country_iso2 || businessProfile.country_iso2.toUpperCase() === selectedCountryCode;
    const taxId = (isProfileCountry && businessProfile?.tax_id) ? businessProfile.tax_id : countryCfg.defaultTaxId;
    const secTaxId = (isProfileCountry && selectedCountryCode === 'IN') ? orgPan : countryCfg.defaultSecondaryTaxId;

    if (countryCfg.secondaryTaxIdLabel && secTaxId) {
      return `${countryCfg.taxIdLabel}: ${taxId} · ${countryCfg.secondaryTaxIdLabel}: ${secTaxId}`;
    }
    return `${countryCfg.taxIdLabel}: ${taxId}`;
  }, [selectedCountryCode, countryCfg, businessProfile, orgPan]);

  const orgResolvedBankDetails = useMemo(() => {
    const isProfileCountry = !businessProfile?.country_iso2 || businessProfile.country_iso2.toUpperCase() === selectedCountryCode;
    return {
      bankName: (isProfileCountry && businessProfile?.bank_name) ? businessProfile.bank_name : countryCfg.sampleBankName,
      accountNo: (isProfileCountry && businessProfile?.bank_account_number) ? businessProfile.bank_account_number : countryCfg.sampleAccountNo,
      routingLabel: countryCfg.bankRoutingLabel,
      routingVal: (isProfileCountry && selectedCountryCode === 'IN' && businessProfile?.bank_ifsc) ? businessProfile.bank_ifsc : countryCfg.sampleRoutingVal,
      digitalPayLabel: countryCfg.digitalPayLabel,
      digitalPayVal: (isProfileCountry && selectedCountryCode === 'IN' && businessProfile?.upi_vpa) ? businessProfile.upi_vpa : countryCfg.sampleDigitalPayVal,
    };
  }, [selectedCountryCode, countryCfg, businessProfile]);

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'executive', label: 'Executive' },
    { key: 'minimal', label: 'Minimal' },
    { key: 'ledger', label: 'Ledger' },
    { key: 'corporate', label: 'Corporate' },
    { key: 'retail', label: 'Trade / Retail' },
  ];

  const handleCreateDocument = () => {
    if (activeDocType === 'quick-bill') {
      router.push('/quick-bill');
    } else if (
      activeDocType === 'work_order' ||
      activeDocType === 'salary_slip' ||
      activeDocType === 'job_offer' ||
      activeDocType === 'experience_cert' ||
      activeDocType === 'rent_receipt' ||
      activeDocType === 'student_fee_receipt' ||
      activeDocType === 'equipment_handover' ||
      activeDocType === 'meeting_minutes' ||
      activeDocType === 'site_inspection' ||
      activeDocType === 'nda_agreement'
    ) {
      const schemaMap: Record<string, string> = {
        work_order: 'work_order',
        salary_slip: 'salary_slip',
        job_offer: 'job_offer_letter',
        experience_cert: 'experience_certificate',
        rent_receipt: 'rent_receipt',
        student_fee_receipt: 'student_fee_receipt',
        equipment_handover: 'equipment_responsibility_letter',
        meeting_minutes: 'meeting_minutes',
        site_inspection: 'site_inspection_report',
        nda_agreement: 'nda_agreement',
      };
      router.push({
        pathname: '/templates/studio',
        params: { typeId: schemaMap[activeDocType] || activeDocType, layout: selectedTemplate.id },
      });
    } else {
      router.push({
        pathname: '/document/edit',
        params: { type: activeDocType, templateId: selectedTemplate.id },
      });
    }
  };

  /**
   * Complete, Legally Verified Document Content Generator
   * Complete, Legally Verified Document Content Generator
   * Dynamically adapts tax rules, item codes, statutory banners, currencies, and governing laws per country.
   */
  const canvasData = useMemo<DocumentCanvasData>(() => {
    const isIndia = selectedCountryCode === 'IN';
    const isUS = selectedCountryCode === 'US';
    const isUK = selectedCountryCode === 'GB';
    const isCanada = selectedCountryCode === 'CA';
    const isAus = selectedCountryCode === 'AU';
    const isUae = selectedCountryCode === 'AE';
    const isGermany = selectedCountryCode === 'DE';
    const isSingapore = selectedCountryCode === 'SG';

    const itemCodeHdr = countryCfg.itemCodeHeader;
    const sym = countryCfg.currencySymbol;

    switch (activeDocType) {
      case 'bill_of_supply': {
        const subtotalVal = isIndia ? '₹60,000.00' : isGermany ? '6.000,00 €' : `${sym}6,000.00`;
        const totalVal = subtotalVal;
        const wordsVal = isIndia
          ? 'INR Sixty Thousand Only'
          : isGermany
          ? 'EUR Sechstausend Euro'
          : `${countryCfg.currencyCode} Six Thousand Only`;
        const row1Rate = isIndia ? '₹45,000' : isGermany ? '4.500 €' : `${sym}4,500`;
        const row1Tot = row1Rate;
        const row2Rate = isIndia ? '₹15,000' : isGermany ? '1.500 €' : `${sym}1,500`;
        const row2Tot = row2Rate;

        const docTypeTag = isIndia
          ? 'SECTION 31(3)(C) · GST RULE 49'
          : isUS
          ? 'TAX EXEMPT SUPPLY · IRC FORM ST-120'
          : isUK
          ? 'ZERO-RATED VAT SUPPLY · VAT ACT 1994 SCH 8'
          : isCanada
          ? 'EXEMPT / ZERO-RATED · EXCISE TAX ACT SCH VI'
          : isAus
          ? 'GST-FREE SUPPLY · ATO SUBDIVISION 38-A'
          : isUae
          ? 'ZERO-RATED SUPPLY · FTA EXEC REG ART 45'
          : isGermany
          ? 'KLEINUNTERNEHMER / STEUERFREI · § 19 USTG'
          : 'ZERO-RATED SUPPLY · IRAS GST ACT SEC 21';

        const docTitle = isGermany ? 'STEUERFREIE RECHNUNG' : isUS ? 'TAX EXEMPT INVOICE' : 'BILL OF SUPPLY';

        const statutoryBanner = {
          text: isIndia
            ? 'COMPOSITION TAXABLE PERSON — NOT ELIGIBLE TO COLLECT TAX ON SUPPLIES'
            : isUS
            ? 'TAX-EXEMPT TRANSACTION — RESALE CERTIFICATE ON FILE (FORM ST-120)'
            : isUK
            ? 'ZERO-RATED / EXEMPT VAT SUPPLY — SCHEDULE 8 & 9 VAT ACT 1994'
            : isCanada
            ? 'ZERO-RATED / EXEMPT SUPPLY — SCHEDULE VI EXCISE TAX ACT'
            : isAus
            ? 'INPUT TAXED / GST-FREE SUPPLY UNDER ATO SUBDIVISION 38-A'
            : isUae
            ? 'ZERO-RATED FREE ZONE SUPPLY — UAE EXECUTIVE REGULATION ART 45'
            : isGermany
            ? 'STEUERFREIE LIEFERUNG / KLEINUNTERNEHMERSTATUS GEMÄSS § 19 USTG'
            : 'NON-GST REGISTERED / ZERO-RATED SUPPLY UNDER SECTION 21 GST ACT',
          subtext: isIndia
            ? 'Issued under Section 31(3)(c) of CGST Act, 2017 read with Rule 49'
            : isUS
            ? 'No sales tax charged pursuant to federal and state resale exemption certificates'
            : isUK
            ? 'Supply qualifying for statutory zero-percent rate or exemption under UK VAT Law'
            : isCanada
            ? 'Zero-rated supply under Part IX Schedule VI of the Excise Tax Act'
            : isAus
            ? 'GST-free supply pursuant to A New Tax System (GST) Act 1999 Division 38'
            : isUae
            ? 'Zero-rated supply pursuant to UAE Federal Decree-Law No. (8) on VAT Article 45'
            : isGermany
            ? 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung)'
            : 'Issued under Singapore GST Act Section 21 for zero-rated supplies',
        };

        const legalDeclaration = isIndia
          ? 'Issued in terms of Section 31(3)(c) of CGST Act, 2017 read with Rule 49. Composition taxable person cannot charge or collect any tax on supplies.'
          : isUS
          ? 'Certified tax-exempt commercial transaction. Buyer has furnished a valid state resale exemption certificate. Governed by UCC Article 2.'
          : isUK
          ? 'Issued under Value Added Tax Act 1994 Schedule 8/9. Zero-rated supply not subject to positive VAT charge.'
          : isCanada
          ? 'Issued in terms of Schedule VI of the Excise Tax Act. Certified zero-rated supply with 0% GST/HST applied.'
          : isAus
          ? 'Issued pursuant to Subdivision 38-A of A New Tax System (GST) Act 1999. GST-free supply with no tax charged.'
          : isUae
          ? 'Issued pursuant to Article 45 of UAE Federal Decree-Law No. (8) on VAT. Zero-rated supply subject to 0% VAT.'
          : isGermany
          ? 'Es wird keine Umsatzsteuer ausgewiesen, da der Aussteller der Kleinunternehmerregelung nach § 19 UStG unterliegt.'
          : 'Issued in terms of Section 21 of the Singapore GST Act for zero-rated international supplies.';

        const legalStandardBadge = isIndia
          ? 'Rule 49 & Sec 31(3)(c) Verified'
          : isUS
          ? 'IRC § 501 / ST-120 Resale Exempt'
          : isUK
          ? 'HMRC Sch 8 Zero-Rated'
          : isCanada
          ? 'CRA Schedule VI Zero-Rated'
          : isAus
          ? 'ATO Subdiv 38-A GST-Free'
          : isUae
          ? 'UAE FTA Art 45 Zero-Rated'
          : isGermany
          ? '§ 19 UStG Kleinunternehmer'
          : 'IRAS Sec 21 Zero-Rated';

        return {
          docTypeTag,
          docTitle,
          docNumber: `${selectedTemplate.code}-0089`,
          issueDate: '15 Oct 2026',
          secondaryMeta: `${countryCfg.taxSystemName}: Nil / Exempt · Supply: ${countryCfg.sampleSubdivision}`,
          statutoryBanner,
          ledgerBand: [
            { label: 'BILL NO', val: `${selectedTemplate.code}-0089` },
            { label: 'DATE', val: '15-OCT-2026' },
            { label: 'STATUS', val: 'NON-TAXABLE / EXEMPT' },
            { label: 'TAX CHARGE', val: 'NIL / 0%' },
          ],
          partyTitle: isGermany ? 'KÄUFER (ABNEHMER)' : 'BILLED TO (BUYER)',
          partyName: countryCfg.samplePartyName,
          partyMeta: countryCfg.samplePartyTaxId,
          partySubMeta: countryCfg.samplePartySubMeta,
          secondaryPartyTitle: countryCfg.sampleSecondPartyTitle,
          secondaryPartyName: countryCfg.sampleSecondPartyName,
          secondaryPartyMeta: countryCfg.sampleSecondPartyMeta,
          retailStrip: [
            { label: 'COUNTER', val: 'Counter 02' },
            { label: 'CASHIER', val: 'Staff #14' },
            { label: 'DISPATCH', val: 'Self Delivery' },
          ],
          tableHeaders: [
            { title: 'ITEM / COMMODITY', flex: 3, align: 'left' },
            { title: itemCodeHdr, width: 72, align: 'center' },
            { title: 'QTY', width: 50, align: 'center' },
            { title: 'UNIT RATE', width: 75, align: 'right' },
            { title: 'NET AMOUNT', width: 85, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Organic Cold-Pressed Groundnut Oil', flex: 3, align: 'left' },
                { text: isIndia ? '150890' : '1508.90', width: 72, align: 'center' },
                { text: '25 Tins', width: 50, align: 'center' },
                { text: row1Rate, width: 75, align: 'right' },
                { text: row1Tot, width: 85, align: 'right', isBold: true },
              ],
            },
            {
              cells: [
                { text: 'Raw Forest Wild Honey (500g Glass Pack)', flex: 3, align: 'left' },
                { text: isIndia ? '040900' : '0409.00', width: 72, align: 'center' },
                { text: '30 Jars', width: 50, align: 'center' },
                { text: row2Rate, width: 75, align: 'right' },
                { text: row2Tot, width: 85, align: 'right', isBold: true },
              ],
            },
          ],
          subtotalLabel: 'Net Goods Value',
          subtotalValue: subtotalVal,
          taxRows: [{ label: `${countryCfg.taxSystemName} (Exempt / Nil)`, val: isGermany ? '0,00 €' : `${sym}0.00` }],
          totalLabel: isGermany ? 'Gesamtbetrag (Netto = Brutto)' : 'Total Bill of Supply',
          totalAmount: totalVal,
          amountInWords: wordsVal,
          legalDeclaration,
          legalStandardBadge,
          showBankDetails: true,
        };
      }

      case 'estimate': {
        const subtotalVal = isIndia ? '₹60,000.00' : isGermany ? '6.000,00 €' : `${sym}6,000.00`;
        const row1Rate = isIndia ? '₹45,000' : isGermany ? '4.500 €' : `${sym}4,500`;
        const row2Rate = isIndia ? '₹15,000' : isGermany ? '1.500 €' : `${sym}1,500`;

        let taxRows = [{ label: 'Est. GST (18%)', val: '₹10,800.00' }];
        let totalVal = '₹70,800.00';
        let wordsVal = 'INR Seventy Thousand Eight Hundred Only (Estimated)';

        if (isUS) {
          taxRows = [{ label: 'Est. State & Local Tax (8.875%)', val: '$532.50' }];
          totalVal = '$6,532.50';
          wordsVal = 'USD Six Thousand Five Hundred Thirty-Two and 50/100 Only (Estimated)';
        } else if (isUK) {
          taxRows = [{ label: 'Est. VAT (20%)', val: '£1,200.00' }];
          totalVal = '£7,200.00';
          wordsVal = 'GBP Seven Thousand Two Hundred Pounds Only (Estimated)';
        } else if (isCanada) {
          taxRows = [{ label: 'Est. HST (13%)', val: 'CA$780.00' }];
          totalVal = 'CA$6,780.00';
          wordsVal = 'CAD Six Thousand Seven Hundred Eighty Dollars Only (Estimated)';
        } else if (isAus) {
          taxRows = [{ label: 'Est. GST (10%)', val: 'AU$600.00' }];
          totalVal = 'AU$6,600.00';
          wordsVal = 'AUD Six Thousand Six Hundred Dollars Only (Estimated)';
        } else if (isUae) {
          taxRows = [{ label: 'Est. VAT (5%)', val: 'AED 300.00' }];
          totalVal = 'AED 6,300.00';
          wordsVal = 'AED Six Thousand Three Hundred Dirhams Only (Estimated)';
        } else if (isGermany) {
          taxRows = [{ label: 'Voraussichtl. MwSt (19%)', val: '1.140,00 €' }];
          totalVal = '7.140,00 €';
          wordsVal = 'EUR Siebentausendeinhundertvierzig Euro (Kostenvoranschlag)';
        } else if (isSingapore) {
          taxRows = [{ label: 'Est. GST (9%)', val: 'SG$540.00' }];
          totalVal = 'SG$6,540.00';
          wordsVal = 'SGD Six Thousand Five Hundred Forty Dollars Only (Estimated)';
        }

        const legalDeclaration = isIndia
          ? 'This quotation is an offer to supply services on stated terms under Indian Contract Act, 1872. Acceptance constitutes a binding commercial agreement.'
          : isUS
          ? 'Formal commercial estimate submitted pursuant to UCC Article 2. Acceptance via purchase order forms a legally binding agreement under state contract law.'
          : isUK
          ? 'Commercial proposal submitted under English Law. Offer valid for 30 calendar days subject to formal written acceptance.'
          : isCanada
          ? 'Commercial estimate and pricing schedule valid for 30 days. Governed by Canadian provincial commercial contract statutes.'
          : isAus
          ? 'Quotation submitted subject to terms of engagement and Australian commercial contract principles. Valid for 30 calendar days.'
          : isUae
          ? 'Commercial quotation submitted in terms of UAE Commercial Transactions Law. Valid for 30 calendar days from issue date.'
          : isGermany
          ? 'Freibleibendes Angebot gemäß § 145 BGB. Bindungsfrist: 30 Kalendertage ab Ausstellungsdatum.'
          : 'Commercial quotation submitted under Singapore Contract Law. Valid for 30 calendar days from date of issue.';

        const legalStandardBadge = isIndia
          ? 'Contract Act 1872 Verified'
          : isUS
          ? 'UCC § 2-205 Firm Offer'
          : isUK
          ? 'English Contract Law Ready'
          : isCanada
          ? 'Commercial Quote Standard'
          : isAus
          ? 'AU Commercial Contract Ready'
          : isUae
          ? 'UAE Commercial Law Verified'
          : isGermany
          ? 'BGB § 145 Konform'
          : 'Singapore Contract Ready';

        return {
          docTypeTag: isGermany ? 'KOSTENVORANSCHLAG · BGB § 145' : 'COMMERCIAL PROPOSAL · CONTRACT LAW',
          docTitle: isGermany ? 'ANGEBOT / ESTIMATE' : 'COMMERCIAL QUOTATION & ESTIMATE',
          docNumber: `${selectedTemplate.code}-0210`,
          issueDate: '15 Oct 2026',
          secondaryMeta: 'Validity: 30 Calendar Days · Rev 1.0',
          statutoryBanner: {
            text: isGermany
              ? 'VERBINDLICHES ANGEBOT — GÜLTIG 30 KALENDERTAGE AB AUSSTELLUNG'
              : 'COMMERCIAL PROPOSAL — SUBJECT TO CLIENT ACCEPTANCE & WRITTEN PO',
            subtext: isGermany
              ? 'Kostenvoranschlag gemäß Bürgerlichem Gesetzbuch (BGB). Änderungen vorbehalten.'
              : `Offer open for 30 calendar days from issue date under ${countryCfg.name} commercial law`,
          },
          ledgerBand: [
            { label: 'QUOTE REF', val: `${selectedTemplate.code}-0210` },
            { label: 'DATE', val: '15-OCT-2026' },
            { label: 'VALIDITY', val: '30 DAYS (14-NOV)' },
            { label: 'REVISION', val: 'REV 1.0' },
          ],
          partyTitle: isGermany ? 'ANGEBOT AN (KUNDE)' : 'PREPARED FOR (PROSPECT / CLIENT)',
          partyName: countryCfg.samplePartyName,
          partyMeta: countryCfg.samplePartyTaxId,
          partySubMeta: countryCfg.samplePartySubMeta,
          secondaryPartyTitle: 'PROJECT SCOPE REF',
          secondaryPartyName: 'Enterprise Offline Invoicing & Multi-Rail Platform',
          secondaryPartyMeta: 'Milestone Delivery Model · 60 Business Days Timeline',
          retailStrip: [
            { label: 'VALIDITY', val: '30 Calendar Days' },
            { label: 'ENGAGEMENT', val: 'Fixed Price SOW' },
            { label: 'ADVANCE', val: '50% upon PO' },
          ],
          tableHeaders: [
            { title: 'DELIVERABLE & SPECIFICATION', flex: 3, align: 'left' },
            { title: 'TIMELINE', width: 70, align: 'center' },
            { title: 'UNITS', width: 44, align: 'center' },
            { title: 'RATE', width: 75, align: 'right' },
            { title: 'EST. VALUE', width: 85, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Core High-Throughput Ledger Architecture & API Schema', flex: 3, align: 'left' },
                { text: '4 Weeks', width: 70, align: 'center' },
                { text: '1 SOW', width: 44, align: 'center' },
                { text: row1Rate, width: 75, align: 'right' },
                { text: row1Rate, width: 85, align: 'right', isBold: true },
              ],
            },
            {
              cells: [
                { text: 'Automated Multi-Payment Settlement & Card Verification Pipeline', flex: 3, align: 'left' },
                { text: '2 Weeks', width: 70, align: 'center' },
                { text: '1 SOW', width: 44, align: 'center' },
                { text: row2Rate, width: 75, align: 'right' },
                { text: row2Rate, width: 85, align: 'right', isBold: true },
              ],
            },
          ],
          subtotalLabel: 'Estimated Scope Subtotal',
          subtotalValue: subtotalVal,
          taxRows,
          totalLabel: isGermany ? 'Voraussichtl. Gesamtsumme' : 'Total Estimated Value',
          totalAmount: totalVal,
          amountInWords: wordsVal,
          legalDeclaration,
          legalStandardBadge,
          showBankDetails: true,
          dualSignatures: {
            primaryRole: 'Authorized Commercial Officer',
            primaryEntity: orgLegalName,
            secondaryRole: 'Client Acceptance & Signoff',
            secondaryEntity: countryCfg.samplePartyName,
          },
        };
      }

      case 'credit_note': {
        const subtotalVal = isIndia ? '₹15,000.00' : isGermany ? '1.500,00 €' : `${sym}1,500.00`;
        const origVal = isIndia ? '₹45,000' : isGermany ? '4.500 €' : `${sym}4,500`;
        const revVal = isIndia ? '₹35,000' : isGermany ? '3.500 €' : `${sym}3,500`;
        const diffVal = isIndia ? '₹10,000' : isGermany ? '1.000 €' : `${sym}1,000`;

        const origVal2 = isIndia ? '₹15,000' : isGermany ? '1.500 €' : `${sym}1,500`;
        const revVal2 = isIndia ? '₹10,000' : isGermany ? '1.000 €' : `${sym}1,000`;
        const diffVal2 = isIndia ? '₹5,000' : isGermany ? '500 €' : `${sym}500`;

        let taxRows = [
          { label: 'CGST Reversal (9%)', val: '₹1,350.00' },
          { label: 'SGST Reversal (9%)', val: '₹1,350.00' },
        ];
        let totalVal = '₹17,700.00';
        let wordsVal = 'INR Seventeen Thousand Seven Hundred Only';

        if (isUS) {
          taxRows = [{ label: 'Sales Tax Reversal (8.875%)', val: '$133.13' }];
          totalVal = '$1,633.13';
          wordsVal = 'USD One Thousand Six Hundred Thirty-Three and 13/100 Only';
        } else if (isUK) {
          taxRows = [{ label: 'VAT Reversal (20%)', val: '£300.00' }];
          totalVal = '£1,800.00';
          wordsVal = 'GBP One Thousand Eight Hundred Pounds Only';
        } else if (isCanada) {
          taxRows = [{ label: 'HST Adjustment (13%)', val: 'CA$195.00' }];
          totalVal = 'CA$1,695.00';
          wordsVal = 'CAD One Thousand Six Hundred Ninety-Five Dollars Only';
        } else if (isAus) {
          taxRows = [{ label: 'GST Adjustment (10%)', val: 'AU$150.00' }];
          totalVal = 'AU$1,650.00';
          wordsVal = 'AUD One Thousand Six Hundred Fifty Dollars Only';
        } else if (isUae) {
          taxRows = [{ label: 'VAT Adjustment (5%)', val: 'AED 75.00' }];
          totalVal = 'AED 1,575.00';
          wordsVal = 'AED One Thousand Five Hundred Seventy-Five Dirhams Only';
        } else if (isGermany) {
          taxRows = [{ label: 'MwSt Korrektur (19%)', val: '285,00 €' }];
          totalVal = '1.785,00 €';
          wordsVal = 'EUR Eintausendsiebenhundertfünfundachtzig Euro';
        } else if (isSingapore) {
          taxRows = [{ label: 'GST Adjustment (9%)', val: 'SG$135.00' }];
          totalVal = 'SG$1,635.00';
          wordsVal = 'SGD One Thousand Six Hundred Thirty-Five Dollars Only';
        }

        const statutoryBanner = {
          text: isIndia
            ? 'STATUTORY CREDIT MEMO — ISSUED UNDER SECTION 34(1) OF CGST ACT, 2017'
            : isUS
            ? 'COMMERCIAL CREDIT MEMORANDUM & ACCOUNT ADJUSTMENT VOUCHER'
            : isUK
            ? 'VAT CREDIT NOTE — REGULATION 24 HMRC VAT REGULATIONS 1995'
            : isCanada
            ? 'STATUTORY CREDIT NOTE — SECTION 232 EXCISE TAX ACT'
            : isAus
            ? 'ADJUSTMENT NOTE — DIVISION 29 ATO GST REGULATIONS'
            : isUae
            ? 'TAX CREDIT NOTE / إشعار دائن ضريبي — FTA EXEC REGULATION ART 60'
            : isGermany
            ? 'RECHNUNGSKORREKTUR / GUTSCHRIFT GEMÄSS § 14 ABS. 4 USTG'
            : 'CREDIT NOTE — IRAS GST REGULATIONS 1993',
          subtext: `Adjustment against original Tax Invoice INV-2026-0098 dated 24-Sep-2026. Reason: Volume Rebate`,
        };

        const legalDeclaration = isIndia
          ? 'Issued pursuant to Section 34 of the CGST Act, 2017 read with Rule 53. The tax liability of the supplier and input tax credit of the recipient stands adjusted accordingly.'
          : isUS
          ? 'Issued pursuant to UCC Article 2 and federal tax accounting standards. Recipient account credited in stated amount.'
          : isUK
          ? 'Issued in accordance with Regulation 24 of the Value Added Tax Regulations 1995. Supplier and recipient VAT accounts adjusted accordingly.'
          : isCanada
          ? 'Issued pursuant to Section 232 of the Excise Tax Act. Net tax adjustment credited to recipient account.'
          : isAus
          ? 'Issued pursuant to Division 29 of A New Tax System (Goods and Services Tax) Act 1999. Recipient input tax credit adjusted.'
          : isUae
          ? 'Issued pursuant to Article 60 of the UAE VAT Executive Regulations. Stated tax adjustment accounted for to the Federal Tax Authority.'
          : isGermany
          ? 'Rechnungskorrektur gemäß § 14 Abs. 4 UStG zur ursprünglichen Rechnung. Vorsteuer- und Umsatzsteuerbeträge wurden entsprechend korrigiert.'
          : 'Issued in accordance with IRAS GST Regulations. Tax liability and input tax credits adjusted accordingly.';

        const legalStandardBadge = isIndia
          ? 'Rule 53 Credit Ledger Verified'
          : isUS
          ? 'UCC Credit Memo Standard'
          : isUK
          ? 'HMRC Reg 24 Compliant'
          : isCanada
          ? 'Excise Tax Act s. 232'
          : isAus
          ? 'ATO Div 29 Adjustment'
          : isUae
          ? 'UAE FTA Art 60 Verified'
          : isGermany
          ? '§ 14 Abs. 4 UStG Korrektur'
          : 'IRAS Credit Note Verified';

        return {
          docTypeTag: isGermany ? 'RECHNUNGSKORREKTUR · § 14 USTG' : 'CREDIT MEMO · STATUTORY ADJUSTMENT',
          docTitle: isGermany ? 'GUTSCHRIFT / CREDIT NOTE' : isUae ? 'TAX CREDIT NOTE / إشعار دائن' : 'CREDIT NOTE',
          docNumber: `${selectedTemplate.code}-0042`,
          issueDate: '15 Oct 2026',
          secondaryMeta: 'Ref Inv: INV-2026-0098 · Reason: Rate Adjustment',
          statutoryBanner,
          ledgerBand: [
            { label: 'CREDIT NOTE NO', val: `${selectedTemplate.code}-0042` },
            { label: 'DATE', val: '15-OCT-2026' },
            { label: 'ORIGINAL INV', val: 'INV-2026-0098' },
            { label: 'REASON CODE', val: '02 - POST REBATE' },
          ],
          partyTitle: isGermany ? 'GUTSCHRIFT AN (EMPFÄNGER)' : 'ISSUED TO (RECIPIENT)',
          partyName: countryCfg.samplePartyName,
          partyMeta: countryCfg.samplePartyTaxId,
          partySubMeta: `Original Tax Invoice Value: ${isIndia ? '₹70,800' : isGermany ? '7.140 €' : `${sym}6,500`} · Credit Allocation: Ledger`,
          secondaryPartyTitle: 'ORIGINAL TAX INVOICE REFERENCE',
          secondaryPartyName: 'Invoice #INV-2026-0098',
          secondaryPartyMeta: 'Dated: 24-Sep-2026 · Reason: Post-sale Volume Tier Reconciliation',
          retailStrip: [
            { label: 'REF INVOICE', val: 'INV-2026-0098' },
            { label: 'REASON CODE', val: '02 - Volume Rebate' },
            { label: 'SETTLEMENT', val: 'Ledger Credit' },
          ],
          tableHeaders: [
            { title: 'ADJUSTMENT REASON & ITEM', flex: 3, align: 'left' },
            { title: 'ORIGINAL', width: 68, align: 'right' },
            { title: 'REVISED', width: 68, align: 'right' },
            { title: 'DIFF', width: 60, align: 'right' },
            { title: 'CREDIT AMOUNT', width: 85, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Quarterly Volume Tier Adjustment (10% rebate)', flex: 3, align: 'left' },
                { text: origVal, width: 68, align: 'right' },
                { text: revVal, width: 68, align: 'right' },
                { text: diffVal, width: 60, align: 'right' },
                { text: diffVal, width: 85, align: 'right', isBold: true },
              ],
            },
            {
              cells: [
                { text: 'Service SLA Maintenance Credit (Uptime variance)', flex: 3, align: 'left' },
                { text: origVal2, width: 68, align: 'right' },
                { text: revVal2, width: 68, align: 'right' },
                { text: diffVal2, width: 60, align: 'right' },
                { text: diffVal2, width: 85, align: 'right', isBold: true },
              ],
            },
          ],
          subtotalLabel: 'Taxable Adjustment',
          subtotalValue: subtotalVal,
          taxRows,
          totalLabel: isGermany ? 'Gesamter Gutschriftsbetrag' : 'Total Net Credit Amount',
          totalAmount: totalVal,
          amountInWords: wordsVal,
          legalDeclaration,
          legalStandardBadge,
          showBankDetails: false,
        };
      }

      case 'purchase_order': {
        const subtotalVal = isIndia ? '₹60,000.00' : isGermany ? '6.000,00 €' : `${sym}6,000.00`;
        const row1Rate = isIndia ? '₹25,000' : isGermany ? '2.500 €' : `${sym}2,500`;
        const row1Tot = isIndia ? '₹50,000' : isGermany ? '5.000 €' : `${sym}5,000`;
        const row2Rate = isIndia ? '₹2,500' : isGermany ? '250 €' : `${sym}250`;
        const row2Tot = isIndia ? '₹10,000' : isGermany ? '1.000 €' : `${sym}1,000`;

        let taxRows = [{ label: 'Applicable GST (18%)', val: '₹10,800.00' }];
        let totalVal = '₹70,800.00';
        let wordsVal = 'INR Seventy Thousand Eight Hundred Only';

        if (isUS) {
          taxRows = [{ label: 'Est. Sales Tax (8.875%)', val: '$532.50' }];
          totalVal = '$6,532.50';
          wordsVal = 'USD Six Thousand Five Hundred Thirty-Two and 50/100 Only';
        } else if (isUK) {
          taxRows = [{ label: 'Applicable VAT (20%)', val: '£1,200.00' }];
          totalVal = '£7,200.00';
          wordsVal = 'GBP Seven Thousand Two Hundred Pounds Only';
        } else if (isCanada) {
          taxRows = [{ label: 'Applicable HST (13%)', val: 'CA$780.00' }];
          totalVal = 'CA$6,780.00';
          wordsVal = 'CAD Six Thousand Seven Hundred Eighty Dollars Only';
        } else if (isAus) {
          taxRows = [{ label: 'Applicable GST (10%)', val: 'AU$600.00' }];
          totalVal = 'AU$6,600.00';
          wordsVal = 'AUD Six Thousand Six Hundred Dollars Only';
        } else if (isUae) {
          taxRows = [{ label: 'Applicable VAT (5%)', val: 'AED 300.00' }];
          totalVal = 'AED 6,300.00';
          wordsVal = 'AED Six Thousand Three Hundred Dirhams Only';
        } else if (isGermany) {
          taxRows = [{ label: 'Zzgl. MwSt (19%)', val: '1.140,00 €' }];
          totalVal = '7.140,00 €';
          wordsVal = 'EUR Siebentausendeinhundertvierzig Euro';
        } else if (isSingapore) {
          taxRows = [{ label: 'Applicable GST (9%)', val: 'SG$540.00' }];
          totalVal = 'SG$6,540.00';
          wordsVal = 'SGD Six Thousand Five Hundred Forty Dollars Only';
        }

        const vendorName = isIndia
          ? 'Dell Technologies India Private Limited'
          : isUS
          ? 'Dell Technologies US Inc.'
          : isUK
          ? 'Dell Corporation Ltd'
          : isCanada
          ? 'Dell Canada Inc.'
          : isAus
          ? 'Dell Australia Pty Limited'
          : isUae
          ? 'Dell Technologies Middle East FZ-LLC'
          : isGermany
          ? 'Dell Technologies GmbH'
          : 'Dell Global B.V. (Singapore Branch)';

        const vendorTax = isIndia
          ? 'GSTIN: 29AAACD2468M1ZF · Bangalore, Karnataka (29)'
          : isUS
          ? 'EIN: 74-1234567 · Round Rock, Texas (TX)'
          : isUK
          ? 'VAT: GB 234 5678 90 · Bracknell, Berkshire'
          : isCanada
          ? 'CRA BN: 829103948 RT0001 · North York, ON'
          : isAus
          ? 'ABN: 46 003 855 561 · Frenchs Forest, NSW'
          : isUae
          ? 'TRN: 100 3829 1049 0003 · Dubai Internet City'
          : isGermany
          ? 'USt-IdNr: DE 114144321 · Frankfurt am Main'
          : 'GST Reg: M20008472X · Singapore 049483';

        const legalDeclaration = isIndia
          ? `Subject to buyer receiving inspection. Defective goods will be rejected immediately. Supplier invoice must reference PO #${selectedTemplate.code}-0418. Governed by Sale of Goods Act, 1930.`
          : isUS
          ? `Governed by Uniform Commercial Code (UCC Article 2). Goods subject to inspection and acceptance. Invoice must reference PO #${selectedTemplate.code}-0418.`
          : isUK
          ? `Governed by Sale of Goods Act 1979. All deliveries must reference PO #${selectedTemplate.code}-0418 on packaging and consignment notes.`
          : isCanada
          ? `Governed by provincial Sale of Goods legislation. Supplier invoice must reference PO #${selectedTemplate.code}-0418.`
          : isAus
          ? `Governed by Australian Sale of Goods Act. Acceptance subject to inspection. Supplier must reference PO #${selectedTemplate.code}-0418.`
          : isUae
          ? `Governed by UAE Commercial Transactions Law. Goods subject to receiving inspection. Invoice must reference PO #${selectedTemplate.code}-0418.`
          : isGermany
          ? `Es gelten die gesetzlichen Bestimmungen des HGB und BGB. Die Ware wird unter Vorbehalt der Wareneingangsprüfung angenommen. Bitte Bestell-Nr. #${selectedTemplate.code}-0418 angeben.`
          : `Governed by Singapore Sale of Goods Act (Cap. 393). Invoice must reference PO #${selectedTemplate.code}-0418.`;

        const legalStandardBadge = isIndia
          ? 'Sale of Goods Act 1930'
          : isUS
          ? 'UCC Article 2 Procurement'
          : isUK
          ? 'Sale of Goods Act 1979'
          : isCanada
          ? 'Provincial Sale of Goods'
          : isAus
          ? 'ATO Procurement Compliant'
          : isUae
          ? 'UAE Commercial Order'
          : isGermany
          ? 'HGB Wareneingang Konform'
          : 'Singapore Sale of Goods';

        return {
          docTypeTag: isGermany ? 'BESTELLSCHEIN · HGB' : isUae ? 'PURCHASE ORDER / أمر شراء' : 'COMMERCIAL PROCUREMENT ORDER',
          docTitle: isGermany ? 'BESTELLUNG / PO' : isUae ? 'PURCHASE ORDER / أمر شراء' : 'PURCHASE ORDER',
          docNumber: `${selectedTemplate.code}-0418`,
          issueDate: '15 Oct 2026',
          secondaryMeta: 'Due: 05-Nov-2026 · Net 30 Days · Door Delivery',
          statutoryBanner: {
            text: isGermany
              ? 'VERBINDLICHE BESTELLUNG — UNTERLIEGT DEN BESTIMMUNGEN DES HGB'
              : `OFFICIAL PROCUREMENT ORDER — GOVERNED BY ${countryCfg.name.toUpperCase()} COMMERCIAL LAW`,
            subtext: 'Mandatory supplier inspection: all defective materials subject to immediate rejection',
          },
          ledgerBand: [
            { label: 'PO NUMBER', val: `${selectedTemplate.code}-0418` },
            { label: 'DATE', val: '15-OCT-2026' },
            { label: 'DELIVERY DUE', val: '05-NOV-2026' },
            { label: 'PAYMENT TERMS', val: 'NET 30 DAYS' },
          ],
          partyTitle: isGermany ? 'LIEFERANT (VERKÄUFER)' : 'VENDOR / SUPPLIER',
          partyName: vendorName,
          partyMeta: vendorTax,
          partySubMeta: 'Global Enterprise Systems Supply Division',
          secondaryPartyTitle: isGermany ? 'LIEFERADRESSE / EMPFÄNGER' : 'DELIVERY & RECEIVING DEPOT',
          secondaryPartyName: `${orgLegalName} — Main Receiving Depot`,
          secondaryPartyMeta: `${orgAddress} · Logistics Bay 04`,
          retailStrip: [
            { label: 'SHIPPING METHOD', val: 'Door Delivery' },
            { label: 'DELIVERY WINDOW', val: '09:00 - 18:00' },
            { label: 'PACKAGING', val: 'Anti-Static ESD' },
          ],
          tableHeaders: [
            { title: 'ITEM CODE & SPECIFICATION', flex: 3, align: 'left' },
            { title: itemCodeHdr, width: 72, align: 'center' },
            { title: 'QTY / UNIT', width: 55, align: 'center' },
            { title: 'AGREED RATE', width: 75, align: 'right' },
            { title: 'TOTAL COMMITTED', width: 85, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Dell PowerEdge R750 Rack Server (Xeon 4314)', flex: 3, align: 'left' },
                { text: isIndia ? '847150' : '8471.50', width: 72, align: 'center' },
                { text: '2 Units', width: 55, align: 'center' },
                { text: row1Rate, width: 75, align: 'right' },
                { text: row1Tot, width: 85, align: 'right', isBold: true },
              ],
            },
            {
              cells: [
                { text: 'Cisco 10G SFP+ Optical Transceiver Module', flex: 3, align: 'left' },
                { text: isIndia ? '851762' : '8517.62', width: 72, align: 'center' },
                { text: '4 Packs', width: 55, align: 'center' },
                { text: row2Rate, width: 75, align: 'right' },
                { text: row2Tot, width: 85, align: 'right', isBold: true },
              ],
            },
          ],
          subtotalLabel: 'Procurement Subtotal',
          subtotalValue: subtotalVal,
          taxRows,
          totalLabel: isGermany ? 'Gesamtbestellwert (Brutto)' : 'Total Committed PO Value',
          totalAmount: totalVal,
          amountInWords: wordsVal,
          legalDeclaration,
          legalStandardBadge,
          showBankDetails: false,
          dualSignatures: {
            primaryRole: 'Head of Procurement',
            primaryEntity: orgLegalName,
            secondaryRole: 'Vendor Order Acceptance',
            secondaryEntity: vendorName,
          },
        };
      }

      case 'work_order': {
        const subtotalVal = isIndia ? '₹1,50,000.00' : isGermany ? '15.000,00 €' : `${sym}15,000.00`;
        const totalVal = subtotalVal;
        const wordsVal = isIndia
          ? 'INR One Lakh Fifty Thousand Only (Excl. Taxes)'
          : isGermany
          ? 'EUR Fünfzehntausend Euro (Netto)'
          : `${countryCfg.currencyCode} Fifteen Thousand Only (Excl. Taxes)`;

        const row1Rate = isIndia ? '₹45,000' : isGermany ? '4.500 €' : `${sym}4,500`;
        const row2Rate = isIndia ? '₹60,000' : isGermany ? '6.000 €' : `${sym}6,000`;
        const row3Rate = isIndia ? '₹45,000' : isGermany ? '4.500 €' : `${sym}4,500`;

        const legalDeclaration = isIndia
          ? 'Execution of this Statement of Work constitutes a binding contract under the Indian Contract Act, 1872 governed by terms of Master Agreement MSA-2025-08.'
          : isUS
          ? 'Execution of this Statement of Work constitutes a binding commercial agreement under UCC and Delaware state law governed by MSA-2025-08.'
          : isUK
          ? 'Execution of this Statement of Work constitutes a binding contract governed by English Law under Master Services Agreement MSA-2025-08.'
          : isCanada
          ? 'Execution of this Statement of Work constitutes a binding contract governed by Canadian provincial laws under MSA-2025-08.'
          : isAus
          ? 'Execution of this Statement of Work constitutes a binding agreement under Australian Contract Law governed by MSA-2025-08.'
          : isUae
          ? 'Execution of this Statement of Work constitutes a binding contract under UAE Commercial Transactions Law governed by MSA-2025-08.'
          : isGermany
          ? 'Dieser Werkvertrag unterliegt den Bestimmungen des § 631 ff. BGB sowie dem Rahmenvertrag MSA-2025-08.'
          : 'Execution of this Statement of Work constitutes a binding contract under Singapore Contract Law governed by MSA-2025-08.';

        const legalStandardBadge = isIndia
          ? 'Contract Act SOW Verified'
          : isUS
          ? 'UCC Master SOW Compliant'
          : isUK
          ? 'English Law SOW Binding'
          : isCanada
          ? 'Canadian SOW Verified'
          : isAus
          ? 'Australian SOW Compliant'
          : isUae
          ? 'UAE Commercial SOW'
          : isGermany
          ? 'BGB § 631 Werkvertrag'
          : 'Singapore SOW Verified';

        return {
          docTypeTag: isGermany ? 'WERKVERTRAG · BGB § 631' : 'STATEMENT OF WORK · MASTER SERVICES CONTRACT',
          docTitle: isGermany ? 'WERKVERTRAG / SOW' : isUae ? 'WORK ORDER / نطاق العمل' : 'WORK ORDER & STATEMENT OF WORK',
          docNumber: `${selectedTemplate.code}-0105`,
          issueDate: '15 Oct 2026',
          secondaryMeta: 'Target: 31-Dec-2026 · Master Agmt: MSA-2025-08',
          statutoryBanner: {
            text: isGermany
              ? 'RECHTSVERBINDLICHER WERKVERTRAG GEMÄSS § 631 FF. BGB'
              : `LEGALLY BINDING STATEMENT OF WORK (SOW) UNDER ${countryCfg.name.toUpperCase()} CONTRACT LAW`,
            subtext: 'Milestone deliverables schedule governed under Master Services Agreement MSA-2025-08',
          },
          ledgerBand: [
            { label: 'WORK ORDER NO', val: `${selectedTemplate.code}-0105` },
            { label: 'EFFECTIVE DATE', val: '15-OCT-2026' },
            { label: 'TARGET END', val: '31-DEC-2026' },
            { label: 'MASTER AGMT', val: 'MSA-2025-08' },
          ],
          partyTitle: isGermany ? 'AUFTRAGGEBER (KUNDE)' : 'CLIENT / ENGAGEMENT SPONSOR',
          partyName: countryCfg.samplePartyName,
          partyMeta: countryCfg.samplePartyTaxId,
          partySubMeta: 'Project: Enterprise Offline Invoicing & Multi-Rail Payment Settlement Platform',
          secondaryPartyTitle: isGermany ? 'AUFTRAGNEHMER' : 'SERVICE PROVIDER (CONTRACTOR)',
          secondaryPartyName: orgLegalName,
          secondaryPartyMeta: `${orgAddress} · ${orgResolvedTaxLine}`,
          retailStrip: [
            { label: 'PROJECT TRACK', val: 'Production v3.0' },
            { label: 'RELEASE CYCLE', val: 'Sprint 1-4' },
            { label: 'GOVERNANCE', val: 'Weekly Review' },
          ],
          tableHeaders: [
            { title: 'MILESTONE & ACCEPTANCE CRITERIA', flex: 3, align: 'left' },
            { title: 'SCHEDULE', width: 75, align: 'center' },
            { title: 'WEIGHT', width: 44, align: 'center' },
            { title: 'STATUS', width: 65, align: 'center' },
            { title: 'MILESTONE FEE', width: 85, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Milestone 1: Core Architecture, SQLite Schema & Repository Pipeline', flex: 3, align: 'left' },
                { text: '05 Nov 2026', width: 75, align: 'center' },
                { text: '30%', width: 44, align: 'center' },
                { text: 'Approved', width: 65, align: 'center' },
                { text: row1Rate, width: 85, align: 'right', isBold: true },
              ],
            },
            {
              cells: [
                { text: 'Milestone 2: Multi-Payment Settlement, QR & ISO Card Engine', flex: 3, align: 'left' },
                { text: '25 Nov 2026', width: 75, align: 'center' },
                { text: '40%', width: 44, align: 'center' },
                { text: 'In Progress', width: 65, align: 'center' },
                { text: row2Rate, width: 85, align: 'right', isBold: true },
              ],
            },
            {
              cells: [
                { text: 'Milestone 3: End-to-End Stress Verification & Production Handoff', flex: 3, align: 'left' },
                { text: '31 Dec 2026', width: 75, align: 'center' },
                { text: '30%', width: 44, align: 'center' },
                { text: 'Scheduled', width: 65, align: 'center' },
                { text: row3Rate, width: 85, align: 'right', isBold: true },
              ],
            },
          ],
          subtotalLabel: 'Fixed-Price Contract Sum',
          subtotalValue: subtotalVal,
          taxRows: [{ label: `${countryCfg.taxSystemName}`, val: `Excl. ${countryCfg.taxSystemName} (Billed Separately)` }],
          totalLabel: isGermany ? 'Gesamtvertragssumme (Netto)' : 'Total Engagement Commitment',
          totalAmount: totalVal,
          amountInWords: wordsVal,
          legalDeclaration,
          legalStandardBadge,
          showBankDetails: true,
          dualSignatures: {
            primaryRole: 'Service Provider / Lead Architect',
            primaryEntity: orgLegalName,
            secondaryRole: 'Client Authorized Signatory',
            secondaryEntity: countryCfg.samplePartyName,
          },
        };
      }

      case 'receipt': {
        const clearedVal = isIndia
          ? '₹70,800.00'
          : isGermany
          ? '7.140,00 €'
          : isUS
          ? '$6,532.50'
          : isUK
          ? '£7,200.00'
          : isCanada
          ? 'CA$6,780.00'
          : isAus
          ? 'AU$6,600.00'
          : isUae
          ? 'AED 6,300.00'
          : 'SG$6,540.00';

        const wordsVal = isIndia
          ? 'INR Seventy Thousand Eight Hundred Only (Received & Cleared)'
          : isGermany
          ? 'EUR Siebentausendeinhundertvierzig Euro (Vollständig Beglichen)'
          : isUS
          ? 'USD Six Thousand Five Hundred Thirty-Two and 50/100 Only (Cleared)'
          : `${countryCfg.currencyCode} Settled in Full (Cleared)`;

        const legalDeclaration = isIndia
          ? 'Official payment receipt issued in terms of GST Rule 52. Payment received in full and credited to bank account. Invoice INV-2026-0142 is fully discharged.'
          : isUS
          ? 'Official commercial payment receipt and discharge voucher. Funds settled in full. Stated invoice liabilities fully discharged.'
          : isUK
          ? 'Official remittance advice and payment acknowledgment. Account settled in full with zero balance outstanding.'
          : isCanada
          ? 'Official payment receipt issued in terms of Canadian commercial standards. Account settled in full.'
          : isAus
          ? 'Official payment receipt and remittance statement. GST liabilities on Invoice INV-2026-0142 fully cleared.'
          : isUae
          ? 'Official payment receipt issued pursuant to UAE commercial accounting regulations. Liabilities settled in full.'
          : isGermany
          ? 'Zahlungsquittung gemäß § 368 BGB. Der Rechnungsbetrag wurde dankend ohne Abzug empfangen. Rechnung INV-2026-0142 ist vollständig beglichen.'
          : 'Official payment receipt issued under Singapore commercial accounting standards. Cleared in full.';

        const legalStandardBadge = isIndia
          ? 'Rule 52 Payment Voucher Verified'
          : isUS
          ? 'ACH / Wire Settlement Voucher'
          : isUK
          ? 'Remittance Advice Standard'
          : isCanada
          ? 'CRA Receipt Standard'
          : isAus
          ? 'ATO Payment Advice'
          : isUae
          ? 'UAE FTA Receipt Verified'
          : isGermany
          ? '§ 368 BGB Quittung'
          : 'IRAS Payment Standard';

        return {
          docTypeTag: isGermany ? 'ZAHLUNGSBESTÄTIGUNG · § 368 BGB' : 'PAYMENT SETTLEMENT VOUCHER',
          docTitle: isGermany ? 'QUITTUNG / RECEIPT' : isUae ? 'PAYMENT RECEIPT / إيصال استلام' : 'OFFICIAL PAYMENT RECEIPT',
          docNumber: `${selectedTemplate.code}-0312`,
          issueDate: '15 Oct 2026',
          secondaryMeta: `Settled in Full · Ref: WIRE-${countryCfg.code}-99201`,
          statutoryBanner: {
            text: isGermany
              ? 'AMTLICHE ZAHLUNGSBESTÄTIGUNG — RECHNUNG VOLLSTÄNDIG BEGLICHEN'
              : `OFFICIAL PAYMENT SETTLEMENT VOUCHER — ${countryCfg.name.toUpperCase()} REVENUE COMPLIANT`,
            subtext: `Discharging liabilities against Tax Invoice INV-2026-0142. Outstanding balance: NIL`,
          },
          ledgerBand: [
            { label: 'RECEIPT NO', val: `${selectedTemplate.code}-0312` },
            { label: 'DATE', val: '15-OCT-2026' },
            { label: 'PAYMENT MODE', val: `${orgResolvedBankDetails.digitalPayLabel}` },
            { label: 'BALANCE DUE', val: isGermany ? '0,00 € (NIL)' : `${sym}0.00 (NIL)` },
          ],
          partyTitle: isGermany ? 'GEZAHLT VON (AUFTRAGGEBER)' : 'RECEIVED WITH THANKS FROM (PAYER)',
          partyName: countryCfg.samplePartyName,
          partyMeta: countryCfg.samplePartyTaxId,
          partySubMeta: 'Settlement Reference: Full Liquidation of Tax Invoice INV-2026-0142',
          secondaryPartyTitle: 'SETTLEMENT BANK COORDINATES',
          secondaryPartyName: `${orgResolvedBankDetails.bankName}`,
          secondaryPartyMeta: `A/C: ••••${orgResolvedBankDetails.accountNo.slice(-4)} · ${orgResolvedBankDetails.routingLabel}: ${orgResolvedBankDetails.routingVal}`,
          retailStrip: [
            { label: 'PAYMENT MODE', val: orgResolvedBankDetails.digitalPayLabel },
            { label: 'UTR / REF', val: `REF-${countryCfg.code}-84920` },
            { label: 'STATUS', val: 'Cleared / Settled' },
          ],
          tableHeaders: [
            { title: 'CLEARED INVOICE / REFERENCE', flex: 3, align: 'left' },
            { title: 'ORIGINAL', width: 75, align: 'right' },
            { title: 'PRIOR PAID', width: 75, align: 'right' },
            { title: 'THIS VOUCHER', width: 85, align: 'right' },
            { title: 'BALANCE', width: 70, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Tax Invoice INV-2026-0142 (Cloud Infrastructure Subscription)', flex: 3, align: 'left' },
                { text: clearedVal, width: 75, align: 'right' },
                { text: isGermany ? '0,00 €' : `${sym}0.00`, width: 75, align: 'right' },
                { text: clearedVal, width: 85, align: 'right', isBold: true },
                { text: isGermany ? '0,00 €' : `${sym}0.00`, width: 70, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Total Cleared Sum',
          subtotalValue: clearedVal,
          taxRows: [
            { label: 'Tax Deducted / Withheld', val: isGermany ? '0,00 €' : `${sym}0.00` },
            { label: 'Outstanding Balance', val: isGermany ? '0,00 € (NIL)' : `${sym}0.00 (NIL)` },
          ],
          totalLabel: isGermany ? 'Empfangener Gesamtbetrag' : 'Net Amount Received',
          totalAmount: clearedVal,
          amountInWords: wordsVal,
          legalDeclaration,
          legalStandardBadge,
          showBankDetails: true,
        };
      }

      case 'proforma': {
        const subtotalVal = isIndia ? '₹4,00,000.00' : isGermany ? '4.000,00 €' : `${sym}4,800.00`;
        const totalVal = isIndia ? '₹4,72,000.00' : isGermany ? '4.760,00 €' : `${sym}5,226.00`;
        const wordsVal = isIndia
          ? 'INR Four Lakh Seventy-Two Thousand Only'
          : isGermany
          ? 'EUR Viertausendsiebenhundertsechzig Euro'
          : `${countryCfg.currencyCode} Five Thousand Two Hundred Twenty-Six Only`;

        let taxRows = [
          { label: 'Est. CGST (9.0%)', val: '₹36,000.00' },
          { label: 'Est. SGST (9.0%)', val: '₹36,000.00' },
        ];
        if (isUS) {
          taxRows = [{ label: 'Est. Sales Tax (8.875%)', val: '$426.00' }];
        } else if (isUK) {
          taxRows = [{ label: 'Est. Standard VAT (20%)', val: '£960.00' }];
        } else if (isGermany) {
          taxRows = [{ label: 'Voraussichtliche MwSt (19%)', val: '760,00 €' }];
        }

        return {
          docTypeTag: 'COMMERCIAL PROFORMA · ADVANCE WIRE',
          docTitle: isGermany ? 'PROFORMA-RECHNUNG' : 'PROFORMA INVOICE',
          docNumber: 'PI-2026-0814',
          issueDate: '16 Oct 2026',
          secondaryMeta: `Valid: 30 Days · Supply: ${countryCfg.sampleSubdivision} · Terms: 100% Advance Wire`,
          statutoryBanner: {
            text: 'PRELIMINARY PROFORMA INVOICE — FOR ADVANCE WIRE PAYMENT & IMPORT PERMIT PURPOSES ONLY',
            subtext: 'This is not a demand for tax payment. A statutory tax invoice will be issued upon clearance of funds and dispatch.',
          },
          ledgerBand: [
            { label: 'Proforma Ref', val: 'PI-2026-0814' },
            { label: 'Issue Date', val: '16 Oct 2026' },
            { label: 'Validity Period', val: '15 Nov 2026 (30 Days)' },
            { label: 'Payment Terms', val: 'Advance Bank Wire / SWIFT' },
          ],
          partyTitle: 'PROFORMA RECIPIENT (BUYER)',
          partyName: countryCfg.samplePartyName,
          partyMeta: countryCfg.samplePartyTaxId,
          partySubMeta: countryCfg.samplePartySubMeta,
          retailStrip: [
            { label: 'Validity', val: '30 Days' },
            { label: 'Wire Mode', val: 'Advance SWIFT' },
            { label: 'Lead Time', val: '5 Business Days' },
          ],
          tableHeaders: [
            { title: 'ITEM & DESCRIPTION', flex: 3, align: 'left' },
            { title: itemCodeHdr, width: 80, align: 'left' },
            { title: 'QTY', width: 50, align: 'center' },
            { title: 'UNIT PRICE', width: 80, align: 'right' },
            { title: 'EST. AMOUNT', width: 85, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Enterprise High-Performance Server Cluster', flex: 3, align: 'left', isBold: true },
                { text: '8471 4900', width: 80, align: 'left' },
                { text: '1 Unit', width: 50, align: 'center' },
                { text: isIndia ? '₹3,50,000' : isGermany ? '3.500 €' : `${sym}4,200`, width: 80, align: 'right' },
                { text: isIndia ? '₹3,50,000' : isGermany ? '3.500 €' : `${sym}4,200`, width: 85, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'On-Site Rack Deployment & Architecture Setup', flex: 3, align: 'left' },
                { text: '9983 13', width: 80, align: 'left' },
                { text: '1 Job', width: 50, align: 'center' },
                { text: isIndia ? '₹50,000' : isGermany ? '500 €' : `${sym}600`, width: 80, align: 'right' },
                { text: isIndia ? '₹50,000' : isGermany ? '500 €' : `${sym}600`, width: 85, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Estimated Subtotal',
          subtotalValue: subtotalVal,
          taxRows,
          totalLabel: isGermany ? 'Voraussichtlicher Gesamtbetrag' : 'Total Proforma Value',
          totalAmount: totalVal,
          amountInWords: wordsVal,
          legalDeclaration: 'This commercial proforma invoice represents a binding price quotation for advance wire remittance. Delivery timeline commences upon receipt of wire transfer confirmation.',
          legalStandardBadge: 'UCC § 2-205 & Commercial Proforma Standard',
          showBankDetails: true,
        };
      }

      case 'export_invoice': {
        return {
          docTypeTag: isIndia ? 'EXPORT UNDER LUT (RULE 96A) · ZERO-RATED' : 'INTERNATIONAL COMMERCIAL EXPORT INVOICE',
          docTitle: isGermany ? 'AUSFUHR-HANDELSRECHNUNG' : 'EXPORT COMMERCIAL INVOICE',
          docNumber: 'EXP-2026-0042',
          issueDate: '16 Oct 2026',
          secondaryMeta: 'LUT Ref: AD270426001924M · Incoterms: CIF Rotterdam · Currency: USD ($)',
          statutoryBanner: {
            text: isIndia
              ? 'SUPPLY MEANT FOR EXPORT UNDER BOND OR LETTER OF UNDERTAKING (LUT) WITHOUT PAYMENT OF INTEGRATED TAX'
              : 'INTERNATIONAL COMMERCIAL EXPORT SHIPMENT — COMPLIANT WITH CUSTOMS & EXPORT CONTROL REGULATIONS',
            subtext: 'Port of Loading: Nhava Sheva (INNSA) · Port of Discharge: Rotterdam (NLRTM) · Country of Origin: India',
          },
          ledgerBand: [
            { label: 'Export Inv #', val: 'EXP-2026-0042' },
            { label: 'Shipping Bill #', val: 'SB-8492019 dt. 14-Oct-2026' },
            { label: 'Country of Destination', val: 'Netherlands (NL)' },
            { label: 'Incoterms 2020', val: 'CIF Rotterdam Gateway' },
          ],
          partyTitle: 'OVERSEAS BUYER / CONSIGNEE',
          partyName: 'Global Logistics & Trade B.V.',
          partyMeta: 'VAT/EORI: NL849201842B01 · Chamber of Commerce: 24398102',
          partySubMeta: 'Maasvlakte 2, Europaweg 900, 3199 LD Rotterdam, Netherlands',
          retailStrip: [
            { label: 'Incoterms', val: 'CIF Rotterdam' },
            { label: 'Vessel', val: 'MSC Gülsün V-241W' },
            { label: 'BL Number', val: 'MEDU901842019' },
          ],
          tableHeaders: [
            { title: 'COMMODITY DESCRIPTION', flex: 3, align: 'left' },
            { title: 'HTS / HS CODE', width: 85, align: 'left' },
            { title: 'PACKAGES', width: 60, align: 'center' },
            { title: 'FOREIGN RATE ($)', width: 85, align: 'right' },
            { title: 'TOTAL ($)', width: 85, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Industrial Embedded IoT Gateway Controllers', flex: 3, align: 'left', isBold: true },
                { text: '8517.62.00', width: 85, align: 'left' },
                { text: '10 Cartons (100 Pcs)', width: 60, align: 'center' },
                { text: '$85.00', width: 85, align: 'right' },
                { text: '$8,500.00', width: 85, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Sensor Node Interface Adapters', flex: 3, align: 'left' },
                { text: '8536.90.10', width: 85, align: 'left' },
                { text: '5 Cartons (200 Pcs)', width: 60, align: 'center' },
                { text: '$12.50', width: 85, align: 'right' },
                { text: '$2,500.00', width: 85, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'FOB Cargo Value',
          subtotalValue: '$11,000.00',
          taxRows: [
            { label: 'Ocean Freight & Insurance', val: '$1,200.00' },
            { label: 'Integrated Tax (IGST)', val: 'Zero-Rated (LUT)' },
          ],
          totalLabel: 'Total CIF Value (USD)',
          totalAmount: '$12,200.00',
          amountInWords: 'USD Twelve Thousand Two Hundred Dollars Only',
          legalDeclaration: 'We declare that this invoice shows the actual price of the goods described, that no other invoice has been or will be issued, and that all particulars are true and correct.',
          legalStandardBadge: 'FEMA 1999 & ICC Incoterms® 2020',
          showBankDetails: true,
        };
      }

      case 'sales_order': {
        const subtotalVal = isIndia ? '₹1,40,000.00' : isGermany ? '1.400,00 €' : `${sym}1,700.00`;
        const totalVal = isIndia ? '₹1,65,200.00' : isGermany ? '1.666,00 €' : `${sym}1,850.88`;
        const wordsVal = isIndia ? 'INR One Lakh Sixty-Five Thousand Two Hundred Only' : 'Commercial Sales Value in Full';

        return {
          docTypeTag: 'COMMERCIAL SALES ORDER · ORDER CONFIRMATION',
          docTitle: 'SALES ORDER CONFIRMATION',
          docNumber: 'SO-2026-0412',
          issueDate: '16 Oct 2026',
          secondaryMeta: 'Customer PO: PO-88219 · Dispatch Due: 28 Oct 2026 · Payment: Net 30',
          statutoryBanner: {
            text: 'VENDOR SALES ORDER ACKNOWLEDGMENT — CUSTOMER PURCHASE ORDER ACCEPTED',
            subtext: 'Goods scheduled for manufacturing dispatch from central logistics depot subject to agreed commercial terms.',
          },
          ledgerBand: [
            { label: 'Sales Order #', val: 'SO-2026-0412' },
            { label: 'Customer PO Ref', val: 'PO-88219' },
            { label: 'Order Date', val: '16 Oct 2026' },
            { label: 'Committed Dispatch', val: '28 Oct 2026' },
          ],
          partyTitle: 'ORDERING CUSTOMER (BILL TO)',
          partyName: countryCfg.samplePartyName,
          partyMeta: countryCfg.samplePartyTaxId,
          partySubMeta: countryCfg.samplePartySubMeta,
          retailStrip: [
            { label: 'Order Status', val: 'Confirmed' },
            { label: 'Priority', val: 'Standard' },
            { label: 'Dispatch Hub', val: 'Central Depot' },
          ],
          tableHeaders: [
            { title: 'ITEM & SPECIFICATION', flex: 3, align: 'left' },
            { title: itemCodeHdr, width: 75, align: 'left' },
            { title: 'ORDERED', width: 55, align: 'center' },
            { title: 'UNIT PRICE', width: 80, align: 'right' },
            { title: 'COMMITTED TOTAL', width: 85, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Custom Fabricated Electrical Control Panels', flex: 3, align: 'left', isBold: true },
                { text: '8537 1000', width: 75, align: 'left' },
                { text: '2 Units', width: 55, align: 'center' },
                { text: isIndia ? '₹45,000' : isGermany ? '450 €' : `${sym}550`, width: 80, align: 'right' },
                { text: isIndia ? '₹90,000' : isGermany ? '900 €' : `${sym}1,100`, width: 85, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Digital PLC Modules with Modbus Interface', flex: 3, align: 'left' },
                { text: '8538 9000', width: 75, align: 'left' },
                { text: '4 Units', width: 55, align: 'center' },
                { text: isIndia ? '₹12,500' : isGermany ? '125 €' : `${sym}150`, width: 80, align: 'right' },
                { text: isIndia ? '₹50,000' : isGermany ? '500 €' : `${sym}600`, width: 85, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Net Order Value',
          subtotalValue: subtotalVal,
          taxRows: [{ label: 'Applicable Tax Breakdown', val: isIndia ? '₹25,200.00' : `${sym}150.88` }],
          totalLabel: 'Committed Total Value',
          totalAmount: totalVal,
          amountInWords: wordsVal,
          legalDeclaration: 'We acknowledge receipt and confirm acceptance of your purchase order. Production is scheduled per committed delivery dates.',
          legalStandardBadge: 'Sale of Goods Act & UCC Order Standard',
          showBankDetails: true,
        };
      }

      case 'debit_note': {
        const subtotalVal = isIndia ? '₹25,000.00' : isGermany ? '250,00 €' : `${sym}315.00`;
        const totalVal = isIndia ? '₹29,500.00' : isGermany ? '297,50 €' : `${sym}342.96`;
        const wordsVal = isIndia ? 'INR Twenty-Nine Thousand Five Hundred Only' : 'Supplementary Amount in Full';

        return {
          docTypeTag: isIndia ? 'STATUTORY DEBIT NOTE · SECTION 34(3) CGST ACT' : 'COMMERCIAL DEBIT MEMO · RATE REVISION',
          docTitle: 'DEBIT NOTE / DEBIT MEMO',
          docNumber: 'DN-2026-0034',
          issueDate: '16 Oct 2026',
          secondaryMeta: 'Original Inv: INV-2026-0142 dt. 15-Oct-2026 · Reason: Supplementary Price Claim',
          statutoryBanner: {
            text: isIndia ? 'STATUTORY DEBIT NOTE — ISSUED UNDER SECTION 34(3) OF CGST ACT, 2017 & RULE 53' : 'COMMERCIAL DEBIT MEMO — SUPPLEMENTARY CHARGE & UPWARD RATE ADJUSTMENT',
            subtext: 'Supplementary claim for additional billable hours and escalated freight charges on original invoice.',
          },
          ledgerBand: [
            { label: 'Debit Note #', val: 'DN-2026-0034' },
            { label: 'Original Invoice #', val: 'INV-2026-0142' },
            { label: 'Inv Date', val: '15 Oct 2026' },
            { label: 'Settlement Due', val: 'Immediate / Net 15' },
          ],
          partyTitle: 'DEBITED CUSTOMER (RECIPIENT)',
          partyName: countryCfg.samplePartyName,
          partyMeta: countryCfg.samplePartyTaxId,
          partySubMeta: countryCfg.samplePartySubMeta,
          retailStrip: [
            { label: 'Reason', val: 'Rate Revision' },
            { label: 'Ref Inv', val: 'INV-0142' },
            { label: 'Term', val: 'Immediate' },
          ],
          tableHeaders: [
            { title: 'REVISION DESCRIPTION', flex: 3, align: 'left' },
            { title: 'ORIGINAL BILLED', width: 85, align: 'right' },
            { title: 'REVISED VALUE', width: 85, align: 'right' },
            { title: 'DIFFERENTIAL DEBIT', width: 95, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Engineering Consulting (Underbilled 20 hrs on Sprint 4)', flex: 3, align: 'left', isBold: true },
                { text: isIndia ? '₹1,20,000' : `${sym}1,500`, width: 85, align: 'right' },
                { text: isIndia ? '₹1,40,000' : `${sym}1,750`, width: 85, align: 'right' },
                { text: isIndia ? '₹20,000' : `${sym}250`, width: 95, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Dedicated Server Bandwidth Overage Surcharge', flex: 3, align: 'left' },
                { text: isIndia ? '₹15,000' : `${sym}200`, width: 85, align: 'right' },
                { text: isIndia ? '₹20,000' : `${sym}265`, width: 85, align: 'right' },
                { text: isIndia ? '₹5,000' : `${sym}65`, width: 95, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Total Taxable Differential',
          subtotalValue: subtotalVal,
          taxRows: [{ label: 'Supplementary Tax Adjustment (18%)', val: isIndia ? '₹4,500.00' : `${sym}27.96` }],
          totalLabel: 'Net Additional Payable',
          totalAmount: totalVal,
          amountInWords: wordsVal,
          legalDeclaration: 'Issued pursuant to Section 34(3) of CGST Act / commercial accounting standards. The taxable value and tax liability stand increased as stated.',
          legalStandardBadge: isIndia ? 'CBIC GST Rule 53' : 'UCC § 2-714 Debit Standard',
          showBankDetails: true,
        };
      }

      case 'payment_voucher': {
        const clearedVal = isIndia ? '₹49,000.00' : isGermany ? '490,00 €' : `${sym}588.00`;
        const wordsVal = isIndia ? 'INR Forty-Nine Thousand Only' : 'Disbursement in Full';

        return {
          docTypeTag: isIndia ? 'SECTION 31(3)(g) · CGST RULE 52' : 'TREASURY DISBURSEMENT VOUCHER',
          docTitle: 'PAYMENT VOUCHER',
          docNumber: 'PV-2026-0195',
          issueDate: '16 Oct 2026',
          secondaryMeta: 'Payout Mode: Bank NEFT / RTGS · Treasury Account: ...9103 · Status: Disbursed',
          statutoryBanner: {
            text: isIndia ? 'STATUTORY PAYMENT VOUCHER — ISSUED PURSUANT TO SECTION 31(3)(g) & RULE 52 OF CGST RULES, 2017' : 'OFFICIAL CORPORATE TREASURY DISBURSEMENT VOUCHER & EXPENSE RECORD',
            subtext: 'Bank Transaction Ref (UTR): HDFCN26289014920 · Disbursed from Corporate Operations Account',
          },
          ledgerBand: [
            { label: 'Voucher #', val: 'PV-2026-0195' },
            { label: 'Payout Date', val: '16 Oct 2026' },
            { label: 'Payee Category', val: 'Vendor / Supplier Disbursement' },
            { label: 'Authorization', val: 'Approved & Vouched' },
          ],
          partyTitle: 'BENEFICIARY / PAYEE',
          partyName: 'Zenith Cloud Infrastructure Labs',
          partyMeta: 'GSTIN: 27AABCT9981K1Z3 · PAN: AABCT9981K',
          partySubMeta: 'HDFC Bank A/C: 50200019284710 · IFSC: HDFC0000102 · Mumbai, MH',
          retailStrip: [
            { label: 'Payout Mode', val: 'Bank RTGS' },
            { label: 'Auth Status', val: 'Verified' },
            { label: 'Cost Center', val: 'Engineering' },
          ],
          tableHeaders: [
            { title: 'PURPOSE OF DISBURSEMENT', flex: 3, align: 'left' },
            { title: 'INVOICE REF', width: 90, align: 'left' },
            { title: 'GROSS AMOUNT', width: 85, align: 'right' },
            { title: 'TDS WITHHELD', width: 80, align: 'right' },
            { title: 'NET DISBURSED', width: 90, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Full Settlement against Invoice ZC-2026-904', flex: 3, align: 'left', isBold: true },
                { text: 'ZC-2026-904', width: 90, align: 'left' },
                { text: isIndia ? '₹50,000' : `${sym}600`, width: 85, align: 'right' },
                { text: isIndia ? '₹1,000' : `${sym}12`, width: 80, align: 'right' },
                { text: clearedVal, width: 90, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Gross Invoice Clearance',
          subtotalValue: isIndia ? '₹50,000.00' : `${sym}600.00`,
          taxRows: [{ label: 'Statutory TDS Deducted (2%)', val: isIndia ? '₹1,000.00' : `${sym}12.00` }],
          totalLabel: 'Net Payout Disbursed',
          totalAmount: clearedVal,
          amountInWords: wordsVal,
          legalDeclaration: 'Certified that the payment specified above was disbursed to the payee towards bona fide commercial obligations and accounted for in the statutory books.',
          legalStandardBadge: isIndia ? 'CBIC GST Rule 52' : 'Treasury Control Standard',
          showBankDetails: true,
          dualSignatures: {
            primaryRole: 'Prepared by (Accounts Executive)',
            primaryEntity: orgLegalName,
            secondaryRole: 'Verified & Approved (CFO / Signatory)',
            secondaryEntity: orgLegalName,
          },
        };
      }

      case 'customer_statement': {
        const outstandingVal = isIndia ? '₹49,200.00' : isGermany ? '492,00 €' : `${sym}615.00`;
        const wordsVal = isIndia ? 'INR Forty-Nine Thousand Two Hundred Only' : 'Outstanding Balance in Full';

        return {
          docTypeTag: 'ACCOUNT LEDGER · AGING STATEMENT',
          docTitle: 'CUSTOMER STATEMENT OF ACCOUNT',
          docNumber: 'STMT-2026-10',
          issueDate: '16 Oct 2026',
          secondaryMeta: `Period: 01-Oct-2026 to 16-Oct-2026 · Account: CUST-84920 · Currency: ${countryCfg.currencyCode}`,
          statutoryBanner: {
            text: 'OFFICIAL STATEMENT OF ACCOUNT — RUNNING CHRONOLOGICAL TRANSACTION TALLY',
            subtext: 'Summary of all tax invoices, payment receipts, credit adjustments, and aged outstanding receivables.',
          },
          ledgerBand: [
            { label: 'Statement Period', val: '01 Oct 2026 – 16 Oct 2026' },
            { label: 'Opening Balance', val: isIndia ? '₹0.00' : `${sym}0.00` },
            { label: 'Total Invoiced', val: isIndia ? '₹1,20,000.00' : `${sym}1,500.00` },
            { label: 'Net Outstanding Due', val: outstandingVal },
          ],
          partyTitle: 'CUSTOMER ACCOUNT',
          partyName: countryCfg.samplePartyName,
          partyMeta: countryCfg.samplePartyTaxId,
          partySubMeta: countryCfg.samplePartySubMeta,
          retailStrip: [
            { label: 'Current 0-30d', val: outstandingVal },
            { label: 'Past 31-60d', val: 'NIL' },
            { label: 'Past 90d+', val: 'NIL' },
          ],
          tableHeaders: [
            { title: 'DATE', width: 75, align: 'left' },
            { title: 'DOCUMENT REF', width: 95, align: 'left' },
            { title: 'TRANSACTION DESCRIPTION', flex: 2, align: 'left' },
            { title: 'DEBIT (+)', width: 75, align: 'right' },
            { title: 'CREDIT (-)', width: 75, align: 'right' },
            { title: 'BALANCE', width: 80, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: '01 Oct 2026', width: 75, align: 'left' },
                { text: 'INV-2026-0098', width: 95, align: 'left', isBold: true },
                { text: 'Enterprise Cloud ERP Monthly Platform Subscription', flex: 2, align: 'left' },
                { text: isIndia ? '₹70,800' : `${sym}885`, width: 75, align: 'right' },
                { text: '—', width: 75, align: 'right' },
                { text: isIndia ? '₹70,800' : `${sym}885`, width: 80, align: 'right' },
              ],
            },
            {
              cells: [
                { text: '08 Oct 2026', width: 75, align: 'left' },
                { text: 'REC-2026-0142', width: 95, align: 'left' },
                { text: 'Bank Wire Clearance (Ref: HDFC90281402)', flex: 2, align: 'left' },
                { text: '—', width: 75, align: 'right' },
                { text: isIndia ? '₹70,800' : `${sym}885`, width: 75, align: 'right' },
                { text: isIndia ? '₹0.00' : `${sym}0.00`, width: 80, align: 'right' },
              ],
            },
            {
              cells: [
                { text: '15 Oct 2026', width: 75, align: 'left' },
                { text: 'INV-2026-0142', width: 95, align: 'left', isBold: true },
                { text: 'GST Statutory Compliance & Audit Engine License', flex: 2, align: 'left' },
                { text: outstandingVal, width: 75, align: 'right' },
                { text: '—', width: 75, align: 'right' },
                { text: outstandingVal, width: 80, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Total Payments Received (-)',
          subtotalValue: isIndia ? '₹70,800.00' : `${sym}885.00`,
          taxRows: [{ label: 'Aging: 0–30 Days (Current)', val: outstandingVal }],
          totalLabel: 'Closing Outstanding Balance',
          totalAmount: outstandingVal,
          amountInWords: wordsVal,
          legalDeclaration: 'Please examine this statement of account and report any discrepancies within 7 days. Uncontested balances are deemed acknowledged and payable.',
          legalStandardBadge: 'GAAP & IFRS Statement Standard',
          showBankDetails: true,
        };
      }

      case 'goods_received_note': {
        return {
          docTypeTag: 'WAREHOUSE INVENTORY · QUALITY CONTROL',
          docTitle: 'GOODS RECEIVED NOTE (GRN)',
          docNumber: 'GRN-2026-0158',
          issueDate: '16 Oct 2026',
          secondaryMeta: 'PO Ref: PO-2026-0089 · Transporter: Blue Dart · Vehicle: MH-04-AZ-9942',
          statutoryBanner: {
            text: 'WAREHOUSE INWARD GOODS RECEIPT & QUALITY INSPECTION CLEARANCE MEMO',
            subtext: 'Physical tally of incoming inventory cartons, batch numbers, and QA acceptance verification.',
          },
          ledgerBand: [
            { label: 'GRN #', val: 'GRN-2026-0158' },
            { label: 'Receiving Bay', val: 'Bay 04 - Central Hub' },
            { label: 'Gate Pass #', val: 'GP-90184' },
            { label: 'Inspection Status', val: 'Passed QA 100%' },
          ],
          partyTitle: 'SUPPLIER / VENDOR',
          partyName: 'Continental Industrial Supply Corp',
          partyMeta: countryCfg.samplePartyTaxId,
          partySubMeta: 'Dispatch Challan: DC-84920 dt. 14-Oct-2026',
          retailStrip: [
            { label: 'Gate In Time', val: '09:45 AM' },
            { label: 'Inspected By', val: 'Er. V. Verma' },
            { label: 'Seal Verified', val: 'Intact' },
          ],
          tableHeaders: [
            { title: 'ITEM & MATERIAL DESCRIPTION', flex: 3, align: 'left' },
            { title: 'ORDERED', width: 60, align: 'center' },
            { title: 'RECEIVED', width: 60, align: 'center' },
            { title: 'ACCEPTED', width: 60, align: 'center' },
            { title: 'REJECTED', width: 60, align: 'center' },
            { title: 'QC REMARK', width: 75, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Industrial Galvanized M12 Fasteners (Grade 8.8)', flex: 3, align: 'left', isBold: true },
                { text: '5,000 Pcs', width: 60, align: 'center' },
                { text: '5,000 Pcs', width: 60, align: 'center' },
                { text: '5,000 Pcs', width: 60, align: 'center' },
                { text: '0', width: 60, align: 'center' },
                { text: 'Approved', width: 75, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'High-Temperature Silicone Gaskets (200mm)', flex: 3, align: 'left' },
                { text: '500 Pcs', width: 60, align: 'center' },
                { text: '500 Pcs', width: 60, align: 'center' },
                { text: '495 Pcs', width: 60, align: 'center' },
                { text: '5 Pcs', width: 60, align: 'center' },
                { text: '5 Defective', width: 75, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Total Material Units Received',
          subtotalValue: '5,500 Units',
          taxRows: [{ label: 'Units Accepted into Stock', val: '5,495 Units (99.9%)' }],
          totalLabel: 'Inventory Accepted Value',
          totalAmount: isIndia ? '₹85,000.00' : `${sym}1,050.00`,
          amountInWords: 'Five Thousand Four Hundred Ninety-Five Units Accepted',
          legalDeclaration: 'Goods inspected for physical transit damage and accepted into central stock inventory. Rejected units quarantined for vendor return.',
          legalStandardBadge: 'ISO 9001:2015 Warehouse Standard',
          showBankDetails: false,
          dualSignatures: {
            primaryRole: 'Received by (Store In-Charge)',
            primaryEntity: orgLegalName,
            secondaryRole: 'Inspected by (QA Lead)',
            secondaryEntity: orgLegalName,
          },
        };
      }

      case 'packing_list': {
        return {
          docTypeTag: 'FREIGHT & LOGISTICS · PACKING SLIP',
          docTitle: 'PACKING LIST & DISPATCH MANIFEST',
          docNumber: 'PL-2026-0082',
          issueDate: '16 Oct 2026',
          secondaryMeta: 'Invoice Ref: INV-2026-0142 · Total Packages: 4 Cartons · Total Weight: 142.5 kg',
          statutoryBanner: {
            text: 'OFFICIAL FREIGHT PACKING LIST & CONTAINER MANIFEST',
            subtext: 'Package-by-package inventory manifest with tare, net, and gross weight reconciliation.',
          },
          ledgerBand: [
            { label: 'Packing List #', val: 'PL-2026-0082' },
            { label: 'AWB / LR #', val: 'BLUEDART-84920194' },
            { label: 'Gross Weight', val: '142.50 kg' },
            { label: 'Total Volume', val: '0.48 CBM' },
          ],
          partyTitle: 'CONSIGNEE / DELIVERY DESTINATION',
          partyName: countryCfg.samplePartyName,
          partyMeta: countryCfg.samplePartyTaxId,
          partySubMeta: countryCfg.samplePartySubMeta,
          retailStrip: [
            { label: 'Total Cartons', val: '4 Packages' },
            { label: 'Carrier', val: 'Blue Dart Air' },
            { label: 'Dispatch Date', val: '16 Oct 2026' },
          ],
          tableHeaders: [
            { title: 'PACKAGE #', width: 65, align: 'left' },
            { title: 'CONTENTS DESCRIPTION', flex: 3, align: 'left' },
            { title: 'DIMENSIONS (CM)', width: 85, align: 'center' },
            { title: 'NET WT', width: 55, align: 'right' },
            { title: 'GROSS WT', width: 60, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Carton 1/4', width: 65, align: 'left', isBold: true },
                { text: 'Rack-Mounted Enterprise Server Chassis + Rails', flex: 3, align: 'left' },
                { text: '60 x 50 x 25 cm', width: 85, align: 'center' },
                { text: '32.0 kg', width: 55, align: 'right' },
                { text: '35.5 kg', width: 60, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Carton 2/4', width: 65, align: 'left', isBold: true },
                { text: 'Redundant Power Supply Modules (1600W x 4)', flex: 3, align: 'left' },
                { text: '40 x 30 x 20 cm', width: 85, align: 'center' },
                { text: '18.5 kg', width: 55, align: 'right' },
                { text: '20.0 kg', width: 60, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Carton 3/4', width: 65, align: 'left', isBold: true },
                { text: 'High-Density CAT6A Shielded Patch Cable Bundles', flex: 3, align: 'left' },
                { text: '50 x 40 x 30 cm', width: 85, align: 'center' },
                { text: '28.0 kg', width: 55, align: 'right' },
                { text: '31.0 kg', width: 60, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Carton 4/4', width: 65, align: 'left', isBold: true },
                { text: 'Fiber Optic Transceivers (100G QSFP28 x 16)', flex: 3, align: 'left' },
                { text: '30 x 25 x 15 cm', width: 85, align: 'center' },
                { text: '4.5 kg', width: 55, align: 'right' },
                { text: '6.0 kg', width: 60, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Net Cargo Weight',
          subtotalValue: '83.00 kg',
          taxRows: [{ label: 'Tare Packaging Weight', val: '9.50 kg' }],
          totalLabel: 'Gross Consignment Weight',
          totalAmount: '92.50 kg',
          amountInWords: 'Total Four Commercial Freight Packages',
          legalDeclaration: 'We certify that the contents of this consignment are fully and accurately described and are packed in all respects in proper condition for transport.',
          legalStandardBadge: 'IATA & Transport Logistics Standard',
          showBankDetails: false,
          dualSignatures: {
            primaryRole: 'Packed by (Logistics Officer)',
            primaryEntity: orgLegalName,
            secondaryRole: 'Verified by (Dispatch Supervisor)',
            secondaryEntity: orgLegalName,
          },
        };
      }

      case 'delivery_challan': {
        return {
          docTypeTag: isIndia ? 'STATUTORY CHALLAN · CBIC RULE 55' : 'DELIVERY CHALLAN & DISPATCH MEMO',
          docTitle: 'DELIVERY CHALLAN',
          docNumber: 'DC-2026-0044',
          issueDate: '16 Oct 2026',
          secondaryMeta: 'Purpose: Supply on Approval · Transporter: Apex Logistics · Vehicle: MH-04-AZ-9942',
          statutoryBanner: {
            text: isIndia ? 'STATUTORY DELIVERY CHALLAN — ISSUED UNDER RULE 55 OF CGST RULES, 2017' : 'DELIVERY CHALLAN & GOODS TRANSPORT DISPATCH MEMORANDUM',
            subtext: 'Transport of goods without tax invoice for demonstration, approval, or job work.',
          },
          ledgerBand: [
            { label: 'Challan #', val: 'DC-2026-0044' },
            { label: 'Nature of Transport', val: 'Supply on Approval (Rule 55(1)(c))' },
            { label: 'Vehicle Reg #', val: 'MH-04-AZ-9942' },
            { label: 'E-Way Bill #', val: 'EWB-281049201948' },
          ],
          partyTitle: 'CONSIGNEE / RECEIVING FACILITY',
          partyName: countryCfg.samplePartyName,
          partyMeta: countryCfg.samplePartyTaxId,
          partySubMeta: countryCfg.samplePartySubMeta,
          retailStrip: [
            { label: 'Movement', val: 'On Approval' },
            { label: 'Return Due', val: '30 Days' },
            { label: 'Driver', val: 'R. K. Yadav' },
          ],
          tableHeaders: [
            { title: 'DESCRIPTION OF GOODS', flex: 3, align: 'left' },
            { title: itemCodeHdr, width: 75, align: 'left' },
            { title: 'QUANTITY', width: 60, align: 'center' },
            { title: 'EST. TAXABLE VAL', width: 85, align: 'right' },
            { title: 'TAX RATE', width: 65, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Demo Enterprise Server Rack Units (Serial: APX-901)', flex: 3, align: 'left', isBold: true },
                { text: '8471 4900', width: 75, align: 'left' },
                { text: '2 Units', width: 60, align: 'center' },
                { text: isIndia ? '₹1,00,000' : `${sym}1,200`, width: 85, align: 'right' },
                { text: '18%', width: 65, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Fiber Network Multiplexer Module', flex: 3, align: 'left' },
                { text: '8517 6290', width: 75, align: 'left' },
                { text: '1 Unit', width: 60, align: 'center' },
                { text: isIndia ? '₹25,000' : `${sym}300`, width: 85, align: 'right' },
                { text: '18%', width: 65, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Total Estimated Value',
          subtotalValue: isIndia ? '₹1,25,000.00' : `${sym}1,500.00`,
          taxRows: [{ label: 'Estimated Tax Rate', val: '18.0% (Taxes applicable upon supply)' }],
          totalLabel: 'Estimated Goods Value',
          totalAmount: isIndia ? '₹1,25,000.00' : `${sym}1,500.00`,
          amountInWords: 'INR One Lakh Twenty-Five Thousand Only (Transport Only)',
          legalDeclaration: 'Issued pursuant to CBIC CGST Rule 55. Goods being transported are not for immediate sale. Tax invoice to follow upon approval or return within 6 months.',
          legalStandardBadge: isIndia ? 'CBIC GST Rule 55' : 'Commercial Dispatch Standard',
          showBankDetails: false,
          dualSignatures: {
            primaryRole: 'Dispatched by (Warehouse Officer)',
            primaryEntity: orgLegalName,
            secondaryRole: 'Received by Consignee (Signature & Stamp)',
            secondaryEntity: countryCfg.samplePartyName,
          },
        };
      }

      case 'salary_slip': {
        const netSalaryVal = isIndia ? '₹80,000.00' : isGermany ? '3.200,00 €' : `${sym}4,000.00`;
        const wordsVal = isIndia ? 'INR Eighty Thousand Only' : 'Net Take-Home Pay in Full';

        return {
          docTypeTag: 'CONFIDENTIAL PAYSLIP · EMPLOYEE COMPENSATION',
          docTitle: 'SALARY SLIP / MONTHLY PAYSLIP',
          docNumber: 'PAY-2026-10',
          issueDate: '31 Oct 2026',
          secondaryMeta: 'Pay Period: October 2026 · Days Worked: 31/31 · Status: Deposited',
          statutoryBanner: {
            text: 'CONFIDENTIAL SALARY PAYSLIP — ISSUED PURSUANT TO PAYMENT OF WAGES ACT & LABOUR REGULATIONS',
            subtext: 'Direct deposit to employee bank account · Tax deducted at source remitted to government treasury.',
          },
          ledgerBand: [
            { label: 'Employee ID', val: 'EMP-1042' },
            { label: 'Designation', val: 'Senior Platform Architect' },
            { label: 'Department', val: 'Engineering & Infrastructure' },
            { label: 'Pay Period', val: '01 Oct 2026 – 31 Oct 2026' },
          ],
          partyTitle: 'EMPLOYEE DETAILS',
          partyName: 'Aarav Sharma',
          partyMeta: 'PAN: ABCPS1234F · UAN / PF: 100984920184',
          partySubMeta: 'Bank: HDFC Bank A/C ...4820 · IFSC: HDFC0000060',
          retailStrip: [
            { label: 'Days in Month', val: '31' },
            { label: 'Days Worked', val: '31' },
            { label: 'Leave Balance', val: '14.5 Days' },
          ],
          tableHeaders: [
            { title: 'EARNINGS COMPONENT', flex: 2, align: 'left' },
            { title: 'AMOUNT', width: 75, align: 'right' },
            { title: 'DEDUCTIONS COMPONENT', flex: 2, align: 'left' },
            { title: 'DEDUCTION', width: 75, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Basic Salary', flex: 2, align: 'left', isBold: true },
                { text: isIndia ? '₹45,000.00' : `${sym}2,200.00`, width: 75, align: 'right' },
                { text: 'Provident Fund (PF Employee)', flex: 2, align: 'left' },
                { text: isIndia ? '₹5,400.00' : `${sym}260.00`, width: 75, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'House Rent Allowance (HRA)', flex: 2, align: 'left' },
                { text: isIndia ? '₹22,500.00' : `${sym}1,100.00`, width: 75, align: 'right' },
                { text: 'Professional Tax (PT)', flex: 2, align: 'left' },
                { text: isIndia ? '₹200.00' : `${sym}10.00`, width: 75, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Special Allowance', flex: 2, align: 'left' },
                { text: isIndia ? '₹17,500.00' : `${sym}850.00`, width: 75, align: 'right' },
                { text: 'Tax Deducted at Source (TDS)', flex: 2, align: 'left' },
                { text: isIndia ? '₹4,400.00' : `${sym}220.00`, width: 75, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Conveyance Allowance', flex: 2, align: 'left' },
                { text: isIndia ? '₹5,000.00' : `${sym}250.00`, width: 75, align: 'right' },
                { text: 'Voluntary Insurance / Medical', flex: 2, align: 'left' },
                { text: isIndia ? '₹0.00' : `${sym}0.00`, width: 75, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Gross Monthly Earnings',
          subtotalValue: isIndia ? '₹90,000.00' : `${sym}4,400.00`,
          taxRows: [{ label: 'Total Statutory Deductions (-)', val: isIndia ? '₹10,000.00' : `${sym}490.00` }],
          totalLabel: 'Net Take-Home Salary (Credited)',
          totalAmount: netSalaryVal,
          amountInWords: wordsVal,
          legalDeclaration: 'This is a computer-generated salary slip and requires no physical signature. Income tax deducted has been remitted to the credit of the Central Government.',
          legalStandardBadge: 'Payment of Wages Act 1936',
          showBankDetails: false,
        };
      }

      case 'job_offer': {
        const ctcVal = isIndia ? '₹24,00,000.00' : isGermany ? '75.000,00 €' : `${sym}120,000.00`;
        const wordsVal = isIndia ? 'INR Twenty-Four Lakh Only' : 'Annual Cost to Company in Full';

        return {
          docTypeTag: 'CORPORATE HR · EMPLOYMENT AGREEMENT',
          docTitle: 'FORMAL OFFER OF EMPLOYMENT',
          docNumber: 'OFR-2026-0084',
          issueDate: '16 Oct 2026',
          secondaryMeta: 'Designation: Lead Platform Architect · Proposed Start: 01 Dec 2026 · Valid: 24 Oct 2026',
          statutoryBanner: {
            text: 'PRIVATE & CONFIDENTIAL EMPLOYMENT OFFER — APEX TECHNOLOGIES GROUP',
            subtext: 'Comprehensive Cost-to-Company (CTC) compensation structure and official appointment terms.',
          },
          ledgerBand: [
            { label: 'Designation', val: 'Lead Platform Architect' },
            { label: 'Department', val: 'Core Infrastructure' },
            { label: 'Reporting Manager', val: 'VP of Engineering' },
            { label: 'Joining Date', val: '01 Dec 2026' },
          ],
          partyTitle: 'SELECTED CANDIDATE',
          partyName: 'Priya Verma',
          partyMeta: 'Email: priya.verma@example.com · Phone: +91 98200 84920',
          partySubMeta: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru, Karnataka 560103',
          retailStrip: [
            { label: 'Employment', val: 'Permanent' },
            { label: 'Probation', val: '3 Months' },
            { label: 'Notice Period', val: '60 Days' },
          ],
          tableHeaders: [
            { title: 'COMPENSATION COMPONENT (CTC)', flex: 3, align: 'left' },
            { title: 'MONTHLY', width: 90, align: 'right' },
            { title: 'ANNUAL TOTAL', width: 95, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Basic Salary (Guaranteed)', flex: 3, align: 'left', isBold: true },
                { text: isIndia ? '₹90,000' : `${sym}4,500`, width: 90, align: 'right' },
                { text: isIndia ? '₹10,80,000' : `${sym}54,000`, width: 95, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'House Rent Allowance (HRA)', flex: 3, align: 'left' },
                { text: isIndia ? '₹45,000' : `${sym}2,250`, width: 90, align: 'right' },
                { text: isIndia ? '₹5,40,000' : `${sym}27,000`, width: 95, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Special & Flexible Allowance', flex: 3, align: 'left' },
                { text: isIndia ? '₹35,000' : `${sym}1,750`, width: 90, align: 'right' },
                { text: isIndia ? '₹4,20,000' : `${sym}21,000`, width: 95, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Statutory Employer Retirals (PF & Gratuity)', flex: 3, align: 'left' },
                { text: isIndia ? '₹15,000' : `${sym}750`, width: 90, align: 'right' },
                { text: isIndia ? '₹1,80,000' : `${sym}9,000`, width: 95, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Annual Performance Incentive (Target)', flex: 3, align: 'left' },
                { text: isIndia ? '₹15,000' : `${sym}750`, width: 90, align: 'right' },
                { text: isIndia ? '₹1,80,000' : `${sym}9,000`, width: 95, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Guaranteed Fixed Base',
          subtotalValue: isIndia ? '₹22,20,000.00' : `${sym}111,000.00`,
          taxRows: [{ label: 'Target Variable / Retirals', val: isIndia ? '₹1,80,000.00' : `${sym}9,000.00` }],
          totalLabel: 'Total Annual Cost to Company (CTC)',
          totalAmount: ctcVal,
          amountInWords: wordsVal,
          legalDeclaration: 'This offer is subject to satisfactory verification of professional credentials, reference checks, and medical fitness. Please sign and return acceptance by the stated deadline.',
          legalStandardBadge: 'Indian Contract Act & Labor Laws',
          showBankDetails: false,
          dualSignatures: {
            primaryRole: 'Authorized Signatory (Head of People)',
            primaryEntity: orgLegalName,
            secondaryRole: 'Candidate Acceptance Signoff',
            secondaryEntity: 'Priya Verma',
          },
        };
      }

      case 'experience_cert': {
        return {
          docTypeTag: 'CORPORATE SERVICE · SERVICE CERTIFICATION',
          docTitle: 'EXPERIENCE & RELIEVING CERTIFICATE',
          docNumber: 'EXP-2026-0041',
          issueDate: '16 Oct 2026',
          secondaryMeta: 'Tenure: 15-Jan-2022 to 30-Sep-2026 · Department: Engineering · Conduct: Exemplary',
          statutoryBanner: {
            text: 'TO WHOMSOEVER IT MAY CONCERN — OFFICIAL SERVICE CERTIFICATION & FORMAL RELIEVING MEMO',
            subtext: 'Full and final corporate clearance confirmed. All organizational liabilities and handovers completed.',
          },
          ledgerBand: [
            { label: 'Certificate #', val: 'EXP-2026-0041' },
            { label: 'Employee ID', val: 'EMP-0814' },
            { label: 'Total Service', val: '4 Yrs, 8 Mos, 16 Days' },
            { label: 'Relieving Date', val: '30 Sep 2026 (COB)' },
          ],
          partyTitle: 'CERTIFIED EMPLOYEE',
          partyName: 'Rohan K. Nambiar',
          partyMeta: 'Employee ID: EMP-0814 · PAN: ABCPN9821K',
          partySubMeta: 'Last Held Designation: Senior Fullstack Staff Engineer',
          retailStrip: [
            { label: 'Conduct', val: 'Exemplary' },
            { label: 'No Dues', val: 'Cleared 100%' },
            { label: 'Eligible Rehire', val: 'Yes' },
          ],
          tableHeaders: [
            { title: 'CAREER MILESTONE / PROGRESSION', flex: 3, align: 'left' },
            { title: 'SERVICE PERIOD', width: 110, align: 'center' },
            { title: 'APPRAISAL RATING', width: 90, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Fullstack Software Engineer (Product Core Team)', flex: 3, align: 'left', isBold: true },
                { text: 'Jan 2022 – Jun 2023', width: 110, align: 'center' },
                { text: 'Exceeds Expectations', width: 90, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Senior Fullstack Staff Engineer (Cloud Systems Architecture)', flex: 3, align: 'left' },
                { text: 'Jul 2023 – Sep 2026', width: 110, align: 'center' },
                { text: 'Outstanding Performance', width: 90, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Tenure Status',
          subtotalValue: 'Honourably Relieved',
          taxRows: [{ label: 'Corporate Handover Status', val: 'Fully Completed & Approved' }],
          totalLabel: 'Service Verification Standing',
          totalAmount: 'EXEMPLARY STANDING',
          amountInWords: 'Certified True Service Record',
          legalDeclaration: 'During his tenure with our organization, we found him hardworking, dedicated, and sincere. He is relieved of all organizational responsibilities and we wish him success in future endeavors.',
          legalStandardBadge: 'Industrial Disputes & Employment Standard',
          showBankDetails: false,
          dualSignatures: {
            primaryRole: 'Head of Human Resources',
            primaryEntity: orgLegalName,
            secondaryRole: 'Managing Director / Partner',
            secondaryEntity: orgLegalName,
          },
        };
      }

      case 'rent_receipt': {
        const rentVal = isIndia ? '₹28,000.00' : isGermany ? '1.200,00 €' : `${sym}1,500.00`;
        const wordsVal = isIndia ? 'INR Twenty-Eight Thousand Only' : 'Monthly Rent in Full';

        return {
          docTypeTag: 'STATUTORY RECEIPT · HRA TAX EXEMPTION',
          docTitle: 'HOUSE RENT RECEIPT',
          docNumber: 'RR-2026-10',
          issueDate: '31 Oct 2026',
          secondaryMeta: 'Rent Month: October 2026 · Section 10(13A) IT Act · Revenue Stamp Affixed',
          statutoryBanner: {
            text: 'RENT RECEIPT FOR INCOME TAX HRA EXEMPTION CLAIM UNDER SECTION 10(13A) OF INCOME TAX ACT, 1961',
            subtext: 'Landlord PAN mandatory for annual rent exceeding ₹1,00,000 pursuant to CBDT circulars.',
          },
          ledgerBand: [
            { label: 'Receipt #', val: 'RR-2026-10' },
            { label: 'Rental Period', val: '01 Oct 2026 – 31 Oct 2026' },
            { label: 'Payment Mode', val: 'Online UPI / IMPS Ref: 90281402' },
            { label: 'Monthly Rent', val: rentVal },
          ],
          partyTitle: 'TENANT (PAID BY)',
          partyName: 'Siddharth Sen',
          partyMeta: 'Tenant PAN: ABCPS9018L · Phone: +91 98400 12901',
          partySubMeta: 'Premises: Flat 804, Tower B, Prestige Falcon City, Kanakapura Road, Bengaluru 560062',
          secondaryPartyTitle: 'LANDLORD (PROPERTY OWNER)',
          secondaryPartyName: 'Col. Harish Chandra (Retd.)',
          secondaryPartyMeta: 'Landlord PAN: AAAPH8492K · Phone: +91 94480 28190',
          retailStrip: [
            { label: 'Rental Month', val: 'October 2026' },
            { label: 'Payment Mode', val: 'Direct UPI' },
            { label: 'Exemption Claim', val: 'Section 10(13A)' },
          ],
          tableHeaders: [
            { title: 'RENTAL PERIOD & PREMISES DESCRIPTION', flex: 3, align: 'left' },
            { title: 'MONTH', width: 75, align: 'center' },
            { title: 'AMOUNT', width: 85, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Residential House Rent for Flat 804, Prestige Falcon City', flex: 3, align: 'left', isBold: true },
                { text: 'Oct 2026', width: 75, align: 'center' },
                { text: rentVal, width: 85, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Base Rental Amount',
          subtotalValue: rentVal,
          taxRows: [{ label: 'Maintenance Dues Outstanding', val: isIndia ? '₹0.00 (NIL)' : `${sym}0.00` }],
          totalLabel: 'Net Rent Received & Cleared',
          totalAmount: rentVal,
          amountInWords: wordsVal,
          legalDeclaration: 'Received with thanks from the tenant the sum stated above towards full rent of the residential premises for the month indicated. Governed by Transfer of Property Act 1882.',
          legalStandardBadge: 'Section 10(13A) Income Tax Act 1961',
          showBankDetails: false,
          dualSignatures: {
            primaryRole: 'Landlord / Property Owner (Signed across Revenue Stamp)',
            primaryEntity: 'Col. Harish Chandra (Retd.)',
            secondaryRole: 'Tenant Acknowledgment',
            secondaryEntity: 'Siddharth Sen',
          },
        };
      }

      case 'student_fee_receipt': {
        const feeVal = isIndia ? '₹85,000.00' : isGermany ? '2.500,00 €' : `${sym}4,250.00`;
        const wordsVal = isIndia ? 'INR Eighty-Five Thousand Only' : 'Tuition & Fees in Full';

        return {
          docTypeTag: 'ACADEMIC TUITION · INSTITUTIONAL RECEIPT',
          docTitle: 'STUDENT TUITION FEE RECEIPT',
          docNumber: 'SFR-2026-0391',
          issueDate: '16 Oct 2026',
          secondaryMeta: 'Student ID: STU-2026-4402 · Semester: III · Academic Year: 2026-2027',
          statutoryBanner: {
            text: 'OFFICIAL STUDENT ACADEMIC FEE RECEIPT — RECOGNIZED EDUCATIONAL INSTITUTION',
            subtext: 'Bank Settlement Ref: SBIN00291049281 · Account credited in full · Balance Due: NIL',
          },
          ledgerBand: [
            { label: 'Enrollment #', val: 'STU-2026-4402' },
            { label: 'Course / Degree', val: 'B.Tech Computer Science & Engg' },
            { label: 'Semester', val: 'Fall Semester (Term III)' },
            { label: 'Balance Outstanding', val: 'NIL (₹0.00)' },
          ],
          partyTitle: 'STUDENT / SCHOLAR',
          partyName: 'Ananya Mukherjee',
          partyMeta: 'Guardian: Dr. Sourav Mukherjee · Category: General Merit',
          partySubMeta: 'Department of Computer Science & Engineering · Campus Hostel: Block C, Room 214',
          retailStrip: [
            { label: 'Receipt Status', val: 'Cleared' },
            { label: 'Scholarship', val: 'Applied' },
            { label: 'Academic Year', val: '2026-27' },
          ],
          tableHeaders: [
            { title: 'FEE HEAD & ACADEMIC SERVICE', flex: 3, align: 'left' },
            { title: 'CATEGORY', width: 80, align: 'left' },
            { title: 'SCHEDULED', width: 75, align: 'right' },
            { title: 'PAID AMOUNT', width: 85, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Academic Tuition & Faculty Instruction Fee', flex: 3, align: 'left', isBold: true },
                { text: 'Tuition', width: 80, align: 'left' },
                { text: isIndia ? '₹55,000' : `${sym}2,750`, width: 75, align: 'right' },
                { text: isIndia ? '₹55,000' : `${sym}2,750`, width: 85, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Advanced Computing & AI Laboratory Access', flex: 3, align: 'left' },
                { text: 'Laboratory', width: 80, align: 'left' },
                { text: isIndia ? '₹15,000' : `${sym}750`, width: 75, align: 'right' },
                { text: isIndia ? '₹15,000' : `${sym}750`, width: 85, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Digital Library & Research Subscriptions', flex: 3, align: 'left' },
                { text: 'Library', width: 80, align: 'left' },
                { text: isIndia ? '₹8,000' : `${sym}400`, width: 75, align: 'right' },
                { text: isIndia ? '₹8,000' : `${sym}400`, width: 85, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Semester University Examination & Evaluation', flex: 3, align: 'left' },
                { text: 'Exam Fee', width: 80, align: 'left' },
                { text: isIndia ? '₹7,000' : `${sym}350`, width: 75, align: 'right' },
                { text: isIndia ? '₹7,000' : `${sym}350`, width: 85, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Gross Scheduled Fees',
          subtotalValue: feeVal,
          taxRows: [{ label: 'Institutional Grant / Concession', val: isIndia ? '₹0.00 (NIL)' : `${sym}0.00` }],
          totalLabel: 'Net Total Fee Received',
          totalAmount: feeVal,
          amountInWords: wordsVal,
          legalDeclaration: 'Certified that the fee components enumerated above have been received in full and credited to the university account. Non-transferable.',
          legalStandardBadge: 'UGC & AICTE Institutional Standard',
          showBankDetails: false,
          dualSignatures: {
            primaryRole: 'Accounts Officer / Registrar',
            primaryEntity: orgLegalName,
            secondaryRole: 'Student / Parent Acknowledgment',
            secondaryEntity: 'Ananya Mukherjee',
          },
        };
      }

      case 'equipment_handover': {
        return {
          docTypeTag: 'ASSET CUSTODY · HARDWARE ALLOCATION',
          docTitle: 'EQUIPMENT RESPONSIBILITY & HANDOVER MEMO',
          docNumber: 'EQ-2026-0129',
          issueDate: '16 Oct 2026',
          secondaryMeta: 'Asset Tag: APX-LAP-0841 · Serial: C02G9014Q8K · Condition: Brand New',
          statutoryBanner: {
            text: 'CORPORATE ASSET CUSTODY AGREEMENT & HARDWARE ALLOCATION MEMORANDUM',
            subtext: 'Hardware issued for official company business under IT Security Policy & Asset Care Agreement.',
          },
          ledgerBand: [
            { label: 'Memo #', val: 'EQ-2026-0129' },
            { label: 'Device Category', val: 'High-End Developer Laptop' },
            { label: 'Security Enrolled', val: 'MDM & FileVault Active' },
            { label: 'Custody Status', val: 'Assigned to Employee' },
          ],
          partyTitle: 'EMPLOYEE CUSTODIAN',
          partyName: 'Vikramaditya Roy',
          partyMeta: 'Employee ID: EMP-1092 · Department: Cloud Architecture',
          partySubMeta: 'Workstation B-302, Cyber City Campus, Gurugram, Haryana 122002',
          retailStrip: [
            { label: 'Handover Date', val: '16 Oct 2026' },
            { label: 'IT Ticket', val: 'IT-84920' },
            { label: 'Warranty Exp', val: 'Oct 2029' },
          ],
          tableHeaders: [
            { title: 'ASSET ITEM & SPECIFICATION', flex: 3, align: 'left' },
            { title: 'ASSET TAG', width: 85, align: 'left' },
            { title: 'SERIAL NUMBER', width: 90, align: 'left' },
            { title: 'CONDITION', width: 75, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Apple MacBook Pro 16" M3 Max (64GB RAM, 1TB NVMe)', flex: 3, align: 'left', isBold: true },
                { text: 'APX-LAP-0841', width: 85, align: 'left' },
                { text: 'C02G9014Q8K', width: 90, align: 'left' },
                { text: 'Brand New', width: 75, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Apple 140W USB-C Power Adapter + 2m MagSafe Cable', flex: 3, align: 'left' },
                { text: 'APX-ACC-0841', width: 85, align: 'left' },
                { text: 'W029104812', width: 90, align: 'left' },
                { text: 'Brand New', width: 75, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Dell 27" 4K USB-C Hub Monitor (P2723QE)', flex: 3, align: 'left' },
                { text: 'APX-MON-0412', width: 85, align: 'left' },
                { text: 'CN0842018', width: 90, align: 'left' },
                { text: 'Excellent', width: 75, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Asset Custody Count',
          subtotalValue: '3 Items Issued',
          taxRows: [{ label: 'Estimated Hardware Value', val: isIndia ? '₹3,75,000.00' : `${sym}4,500.00` }],
          totalLabel: 'Total Custody Status',
          totalAmount: 'ACTIVE CUSTODY',
          amountInWords: 'Three Official IT Assets Assigned',
          legalDeclaration: 'The employee acknowledges receipt of the listed hardware in good working condition, agrees to use it strictly for authorized company business, and undertakes to return it immediately upon separation.',
          legalStandardBadge: 'IT Asset Governance & Policy',
          showBankDetails: false,
          dualSignatures: {
            primaryRole: 'IT Operations Lead (Handed Over by)',
            primaryEntity: orgLegalName,
            secondaryRole: 'Employee Custodian (Received in Good Condition)',
            secondaryEntity: 'Vikramaditya Roy',
          },
        };
      }

      case 'meeting_minutes': {
        return {
          docTypeTag: 'CORPORATE GOVERNANCE · SECRETARIAL MINUTES',
          docTitle: 'MINUTES OF EXECUTIVE MANAGEMENT MEETING',
          docNumber: 'MOM-2026-10',
          issueDate: '16 Oct 2026',
          secondaryMeta: 'Time: 10:00 AM IST · Quorum: Valid & Present · Venue: Boardroom & VC',
          statutoryBanner: {
            text: 'OFFICIAL CORPORATE MINUTES — GOVERNED BY SECRETARIAL STANDARDS & COMPANIES ACT',
            subtext: 'Chairperson: Rajesh Mehta (Managing Director) · Secretarial Record of Resolutions & Action Items',
          },
          ledgerBand: [
            { label: 'Meeting ID', val: 'MOM-2026-10' },
            { label: 'Date & Time', val: '16-Oct-2026 @ 10:00 AM' },
            { label: 'Meeting Type', val: 'Executive Committee Review' },
            { label: 'Quorum', val: 'All 6 Members Present' },
          ],
          partyTitle: 'ATTENDEES & COMMITTEE MEMBERS',
          partyName: 'Executive Leadership Team',
          partyMeta: 'R. Mehta (MD), P. Nair (CTO), V. Singhal (CFO), S. Rao (Head Ops)',
          partySubMeta: 'Notice circulated on 09-Oct-2026 in compliance with Secretarial Standard SS-1.',
          retailStrip: [
            { label: 'Quorum', val: 'Unanimous' },
            { label: 'Meeting Type', val: 'Executive Board' },
            { label: 'Duration', val: '90 Minutes' },
          ],
          tableHeaders: [
            { title: 'AGENDA TOPIC / RESOLUTION', flex: 3, align: 'left' },
            { title: 'STATUS', width: 95, align: 'center' },
            { title: 'OWNER', width: 75, align: 'left' },
            { title: 'DUE DATE', width: 75, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Q3 Enterprise Revenue & Financial Audit Review', flex: 3, align: 'left', isBold: true },
                { text: 'Adopted', width: 95, align: 'center' },
                { text: 'V. Singhal', width: 75, align: 'left' },
                { text: '31 Oct 2026', width: 75, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Unified Document Studio & Global Tax Architecture Rollout', flex: 3, align: 'left' },
                { text: 'Approved', width: 95, align: 'center' },
                { text: 'P. Nair', width: 75, align: 'left' },
                { text: '20 Oct 2026', width: 75, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Expansion of Logistics Fulfillment Hub in Bhiwandi', flex: 3, align: 'left' },
                { text: 'Passed', width: 95, align: 'center' },
                { text: 'S. Rao', width: 75, align: 'left' },
                { text: '15 Nov 2026', width: 75, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Resolutions Adopted',
          subtotalValue: '3 Items Approved',
          taxRows: [{ label: 'Next Scheduled Meeting', val: '16 Nov 2026 @ 10:00 AM' }],
          totalLabel: 'Meeting Adjournment',
          totalAmount: 'CONCLUDED AT 11:30 AM',
          amountInWords: 'All Resolutions Adopted Unanimously',
          legalDeclaration: 'These minutes are a true and faithful record of proceedings and resolutions adopted at the meeting. Governed by the Companies Act and applicable corporate governance charters.',
          legalStandardBadge: 'Secretarial Standard SS-1 & Governance',
          showBankDetails: false,
          dualSignatures: {
            primaryRole: 'Chairperson of the Meeting',
            primaryEntity: 'Rajesh Mehta (Managing Director)',
            secondaryRole: 'Company Secretary & Compliance Officer',
            secondaryEntity: orgLegalName,
          },
        };
      }

      case 'site_inspection': {
        return {
          docTypeTag: 'FIELD ENGINEERING · HSE SAFETY AUDIT',
          docTitle: 'SITE INSPECTION & SAFETY REPORT',
          docNumber: 'SIR-2026-0048',
          issueDate: '16 Oct 2026',
          secondaryMeta: 'Site: Central Logistics Megahub · Score: 96.4% (Grade A) · Lead Auditor: Er. V. Singhal',
          statutoryBanner: {
            text: 'FIELD ENGINEERING QUALITY, HEALTH, SAFETY & ENVIRONMENT (HSE) AUDIT REPORT',
            subtext: 'Comprehensive physical inspection of facility structural integrity, electrical circuits, and fire suppression.',
          },
          ledgerBand: [
            { label: 'Audit Report #', val: 'SIR-2026-0048' },
            { label: 'Overall Compliance', val: '96.4% (Grade A)' },
            { label: 'Hazards Identified', val: '0 Critical / 2 Minor' },
            { label: 'Re-Audit Due', val: '16 Jan 2027 (Quarterly)' },
          ],
          partyTitle: 'INSPECTED FACILITY / PROJECT SITE',
          partyName: 'Apex Bhiwandi Megahub - Phase 2',
          partyMeta: 'Plot C-14, Logistics Corridor, Thane District, Maharashtra 421302',
          partySubMeta: 'Facility Area: 120,000 sq ft · Operational Shifts: 24/7',
          retailStrip: [
            { label: 'Audit Rating', val: '96.4% (Grade A)' },
            { label: 'Critical Risks', val: 'Zero' },
            { label: 'Safety Badge', val: 'Certified' },
          ],
          tableHeaders: [
            { title: 'SAFETY AUDIT PARAMETER', flex: 3, align: 'left' },
            { title: 'STANDARD', width: 75, align: 'left' },
            { title: 'FINDING', width: 75, align: 'center' },
            { title: 'SEVERITY', width: 65, align: 'right' },
            { title: 'ACTION REQUIRED', width: 85, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Primary Electrical Switchgear & Earthing Resistance', flex: 3, align: 'left', isBold: true },
                { text: 'IS 3043', width: 75, align: 'left' },
                { text: 'Compliant', width: 75, align: 'center' },
                { text: 'None', width: 65, align: 'right' },
                { text: 'Routine Check', width: 85, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Automated Fire Sprinkler Lines & Pressure Gauges', flex: 3, align: 'left' },
                { text: 'NFPA 13', width: 75, align: 'left' },
                { text: 'Compliant', width: 75, align: 'center' },
                { text: 'None', width: 65, align: 'right' },
                { text: 'Quarterly Test', width: 85, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Personal Protective Equipment (PPE) Compliance in Bay 3', flex: 3, align: 'left' },
                { text: 'OSHA 1910', width: 75, align: 'left' },
                { text: 'Observation', width: 75, align: 'center' },
                { text: 'Low', width: 65, align: 'right' },
                { text: 'Briefing', width: 85, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Emergency Exit Signage Illumination & Battery Backup', flex: 3, align: 'left' },
                { text: 'NBC 2016', width: 75, align: 'left' },
                { text: 'Observation', width: 75, align: 'center' },
                { text: 'Low', width: 65, align: 'right' },
                { text: 'Battery Replacement', width: 85, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Audit Parameters Checked',
          subtotalValue: '4 Areas Inspected',
          taxRows: [{ label: 'Facility Safety Rating', val: '96.4% — GRADE A (CERTIFIED)' }],
          totalLabel: 'Overall Audit Result',
          totalAmount: 'PASSED & CERTIFIED',
          amountInWords: 'Zero Critical Safety Violations Found',
          legalDeclaration: 'The facility was thoroughly inspected in accordance with statutory occupational health and safety standards. The overall compliance rating certifies operational fitness.',
          legalStandardBadge: 'ISO 9001 / OSHA 1910 HSE Standard',
          showBankDetails: false,
          dualSignatures: {
            primaryRole: 'Lead Inspecting HSE Auditor',
            primaryEntity: 'Er. Vikram Singhal (Lead HSE Auditor)',
            secondaryRole: 'Facility Project Site Manager',
            secondaryEntity: orgLegalName,
          },
        };
      }

      case 'nda_agreement': {
        return {
          docTypeTag: 'LEGAL CONTRACT · MUTUAL CONFIDENTIALITY',
          docTitle: 'MUTUAL NON-DISCLOSURE AGREEMENT',
          docNumber: 'NDA-2026-0032',
          issueDate: '16 Oct 2026',
          secondaryMeta: 'Term: 3 Years · Governing Law: Competent Courts · Covenants: Bilateral Confidentiality',
          statutoryBanner: {
            text: 'LEGALLY BINDING MUTUAL NON-DISCLOSURE & PROPRIETARY RIGHTS AGREEMENT',
            subtext: 'Bilateral protection of proprietary software architecture, trade secrets, customer data, and commercial models.',
          },
          ledgerBand: [
            { label: 'Agreement Ref', val: 'NDA-2026-0032' },
            { label: 'Effective Date', val: '16 Oct 2026' },
            { label: 'Protection Term', val: '3 Years from Disclosure' },
            { label: 'Governing Law', val: 'Courts of Competent Jurisdiction' },
          ],
          partyTitle: 'PARTY 1 (DISCLOSING & RECEIVING)',
          partyName: orgLegalName,
          partyMeta: orgResolvedTaxLine,
          partySubMeta: 'Represented by its Authorized Signatory',
          secondaryPartyTitle: 'PARTY 2 (DISCLOSING & RECEIVING)',
          secondaryPartyName: countryCfg.samplePartyName,
          secondaryPartyMeta: countryCfg.samplePartyTaxId,
          secondaryPartySubMeta: countryCfg.samplePartySubMeta,
          retailStrip: [
            { label: 'Term', val: '36 Months' },
            { label: 'Type', val: 'Bilateral Mutual' },
            { label: 'Remedy', val: 'Injunctive Relief' },
          ],
          tableHeaders: [
            { title: 'CONFIDENTIALITY COVENANT & CONTRACT CLAUSE', flex: 3, align: 'left' },
            { title: 'SCOPE / RESTRICTION', width: 140, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Section 1: Definition of Proprietary & Confidential Information', flex: 3, align: 'left', isBold: true },
                { text: 'Source Code, APIs, Financial Models, Customer Data', width: 140, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Section 2: Non-Disclosure & Strict Confidentiality Obligations', flex: 3, align: 'left' },
                { text: 'Need-to-Know Basis Only; Reasonable Care Standard', width: 140, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Section 3: Standard Exclusions from Confidentiality', flex: 3, align: 'left' },
                { text: 'Prior Public Knowledge, Independent Development', width: 140, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Section 4: Mandatory Return or Certified Destruction of Materials', flex: 3, align: 'left' },
                { text: 'Within 10 Days of Written Demand or Expiration', width: 140, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Section 5: Equitable Relief, Specific Performance & Injunction', flex: 3, align: 'left' },
                { text: 'Right to Seek Injunction Without Requirement of Bond', width: 140, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Bilateral Covenants',
          subtotalValue: '5 Core Protective Clauses',
          taxRows: [{ label: 'Confidentiality Validity Duration', val: '36 Months from Effective Date' }],
          totalLabel: 'Contractual Obligation',
          totalAmount: 'LEGALLY BINDING',
          amountInWords: 'Executed in Duplicate by Authorized Officers',
          legalDeclaration: 'In witness whereof, the parties hereto have executed this Mutual Non-Disclosure Agreement by their duly authorized representatives on the date first above written.',
          legalStandardBadge: 'Indian Contract Act 1872 & UCC § 2',
          showBankDetails: false,
          dualSignatures: {
            primaryRole: 'Authorized Signatory (Party 1)',
            primaryEntity: orgLegalName,
            secondaryRole: 'Authorized Signatory (Party 2)',
            secondaryEntity: countryCfg.samplePartyName,
          },
        };
      }

      case 'commercial_invoice': {
        const subtotalVal = isIndia ? '₹1,50,000.00' : isGermany ? '1.500,00 €' : `${sym}1,800.00`;
        const totalVal = subtotalVal;
        const wordsVal = isIndia ? 'INR One Lakh Fifty Thousand Only' : 'Commercial Invoice Value in Full';

        return {
          docTypeTag: 'INTERNATIONAL COMMERCIAL INVOICE · UN/EDIFACT',
          docTitle: 'COMMERCIAL INVOICE',
          docNumber: 'CI-2026-0198',
          issueDate: '16 Oct 2026',
          secondaryMeta: `Country of Origin: ${countryCfg.name} · Incoterms®: CIF · Currency: ${countryCfg.currencyCode}`,
          statutoryBanner: {
            text: 'OFFICIAL COMMERCIAL INVOICE — FOR CUSTOMS CLEARANCE & CROSS-BORDER TRADE',
            subtext: 'Certified true and correct commercial value for goods exported pursuant to international sales terms.',
          },
          ledgerBand: [
            { label: 'Invoice No', val: 'CI-2026-0198' },
            { label: 'Issue Date', val: '16-OCT-2026' },
            { label: 'Incoterms®', val: 'CIF / DDP' },
            { label: 'Payment Terms', val: 'Wire / Net 30' },
          ],
          partyTitle: 'CONSIGNEE / BUYER (IMPORTER)',
          partyName: countryCfg.samplePartyName,
          partyMeta: countryCfg.samplePartyTaxId,
          partySubMeta: countryCfg.samplePartySubMeta,
          retailStrip: [
            { label: 'Origin', val: countryCfg.code },
            { label: 'Incoterm', val: 'CIF' },
            { label: 'Freight', val: 'Prepaid' },
          ],
          tableHeaders: [
            { title: 'ITEM / COMMODITY DESCRIPTION', flex: 3, align: 'left' },
            { title: itemCodeHdr, width: 80, align: 'left' },
            { title: 'QTY', width: 50, align: 'center' },
            { title: 'UNIT PRICE', width: 75, align: 'right' },
            { title: 'TOTAL', width: 85, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Precision CNC Machined Aluminum Enclosures', flex: 3, align: 'left', isBold: true },
                { text: '7616 9990', width: 80, align: 'left' },
                { text: '100 Pcs', width: 50, align: 'center' },
                { text: isIndia ? '₹1,000' : isGermany ? '10 €' : `${sym}12`, width: 75, align: 'right' },
                { text: isIndia ? '₹1,00,000' : isGermany ? '1.000 €' : `${sym}1,200`, width: 85, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Anodized Surface Treatment & Thermal Coating', flex: 3, align: 'left' },
                { text: '9988 73', width: 80, align: 'left' },
                { text: '100 Pcs', width: 50, align: 'center' },
                { text: isIndia ? '₹500' : isGermany ? '5 €' : `${sym}6`, width: 75, align: 'right' },
                { text: isIndia ? '₹50,000' : isGermany ? '500 €' : `${sym}600`, width: 85, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'FOB Commercial Value',
          subtotalValue: subtotalVal,
          taxRows: [
            { label: 'Insurance & Freight', val: isGermany ? '0,00 €' : `${sym}0.00` },
            { label: 'Customs Valuation', val: 'Non-Taxable Supply' },
          ],
          totalLabel: 'Total Invoice Value',
          totalAmount: totalVal,
          amountInWords: wordsVal,
          legalDeclaration: 'We declare that this invoice shows the actual price of the goods described, that no other invoice has been or will be issued, and that all particulars are true and correct.',
          legalStandardBadge: 'UN/EDIFACT & ICC Incoterms® 2020',
          showBankDetails: true,
        };
      }

      case 'service_invoice': {
        const subtotalVal = isIndia ? '₹1,20,000.00' : isGermany ? '1.200,00 €' : `${sym}1,500.00`;
        const totalVal = isIndia ? '₹1,41,600.00' : isGermany ? '1.428,00 €' : `${sym}1,635.00`;
        const wordsVal = isIndia ? 'INR One Lakh Forty-One Thousand Six Hundred Only' : 'Professional Fees in Full';

        return {
          docTypeTag: isIndia ? 'CBIC GST RULE 46 (SERVICES) · SAC MANDATORY' : 'PROFESSIONAL SERVICE TAX INVOICE',
          docTitle: 'SERVICE TAX INVOICE',
          docNumber: 'SRV-2026-0084',
          issueDate: '16 Oct 2026',
          secondaryMeta: 'SAC: 998314 · Service Period: 01-Oct-2026 to 31-Oct-2026 · Reverse Charge: NO',
          statutoryBanner: {
            text: 'PROFESSIONAL SERVICE TAX INVOICE — STATUTORY CBIC GST RULE 46 COMPLIANT',
            subtext: 'Services Classified Under Heading 9983 (Information Technology & Architecture Consulting)',
          },
          ledgerBand: [
            { label: 'Service Inv #', val: 'SRV-2026-0084' },
            { label: 'Service SAC', val: '998314' },
            { label: 'Billing Period', val: 'October 2026' },
            { label: 'RCM Status', val: 'No (Forward Charge)' },
          ],
          partyTitle: 'CLIENT (BILL TO)',
          partyName: countryCfg.samplePartyName,
          partyMeta: countryCfg.samplePartyTaxId,
          partySubMeta: countryCfg.samplePartySubMeta,
          retailStrip: [
            { label: 'Discipline', val: 'IT Architecture' },
            { label: 'Delivery', val: 'Remote / On-site' },
            { label: 'Terms', val: 'Net 15 Days' },
          ],
          tableHeaders: [
            { title: 'SERVICE DELIVERABLE & SCOPE', flex: 3, align: 'left' },
            { title: 'SAC CODE', width: 75, align: 'left' },
            { title: 'EFFORT', width: 65, align: 'center' },
            { title: 'RATE / HR', width: 75, align: 'right' },
            { title: 'AMOUNT', width: 85, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Core Enterprise Cloud Architecture & Migration Oversight', flex: 3, align: 'left', isBold: true },
                { text: '998314', width: 75, align: 'left' },
                { text: '40 Hours', width: 65, align: 'center' },
                { text: isIndia ? '₹2,000' : isGermany ? '20 €' : `${sym}25`, width: 75, align: 'right' },
                { text: isIndia ? '₹80,000' : isGermany ? '800 €' : `${sym}1,000`, width: 85, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Security Audit & Compliance Hardening Review', flex: 3, align: 'left' },
                { text: '998315', width: 75, align: 'left' },
                { text: '20 Hours', width: 65, align: 'center' },
                { text: isIndia ? '₹2,000' : isGermany ? '20 €' : `${sym}25`, width: 75, align: 'right' },
                { text: isIndia ? '₹40,000' : isGermany ? '400 €' : `${sym}500`, width: 85, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Taxable Service Value',
          subtotalValue: subtotalVal,
          taxRows: [
            { label: isIndia ? 'CGST (9.0%)' : 'State / Provincial Tax', val: isIndia ? '₹10,800.00' : `${sym}67.50` },
            { label: isIndia ? 'SGST (9.0%)' : 'Federal / National Tax', val: isIndia ? '₹10,800.00' : `${sym}67.50` },
          ],
          totalLabel: 'Grand Total Payable',
          totalAmount: totalVal,
          amountInWords: wordsVal,
          legalDeclaration: 'Certified that the service descriptions, SAC codes, and statutory particulars furnished in this tax invoice are true, correct, and in accordance with applicable tax regulations.',
          legalStandardBadge: 'CBIC GST Rule 46 (Services) Verified',
          showBankDetails: true,
        };
      }

      case 'pos_receipt':
      case 'cash_bill': {
        const subtotalVal = isIndia ? '₹3,450.00' : isGermany ? '34,50 €' : `${sym}42.00`;
        const totalVal = subtotalVal;
        const wordsVal = isIndia ? 'INR Three Thousand Four Hundred Fifty Only' : 'Amount Paid in Full (Settled)';

        return {
          docTypeTag: 'POS REGISTER CHECKOUT · INSTANT SETTLEMENT',
          docTitle: activeDocType === 'pos_receipt' ? 'POINT OF SALE RECEIPT' : 'CASH BILL / CASH MEMO',
          docNumber: activeDocType === 'pos_receipt' ? 'POS-2026-1049' : 'CB-2026-0512',
          issueDate: '16 Oct 2026',
          secondaryMeta: 'Register Terminal #01 · Cashier: Counter #02 · Status: CLEARED',
          statutoryBanner: {
            text: 'OFFICIAL RETAIL CHECKOUT MEMO — TRANSACTION PAID IN FULL',
            subtext: 'Payment received across counter. Retain this slip for merchandise exchange.',
          },
          ledgerBand: [
            { label: 'Receipt No', val: 'POS-2026-1049' },
            { label: 'Register Terminal', val: 'Terminal #01' },
            { label: 'Payment Mode', val: 'Cash / Instant QR' },
            { label: 'Balance Due', val: 'NIL (₹0.00)' },
          ],
          partyTitle: 'CUSTOMER DETAILS',
          partyName: 'Walk-in Retail Shopper',
          partyMeta: 'Phone: +91 98200 XXXXX · Guest Checkout',
          retailStrip: [
            { label: 'Terminal', val: 'POS-01' },
            { label: 'Cashier', val: 'Staff #04' },
            { label: 'Time', val: '14:23 PM' },
          ],
          tableHeaders: [
            { title: 'ITEM / BARCODE', flex: 3, align: 'left' },
            { title: 'QTY', width: 45, align: 'center' },
            { title: 'RATE', width: 70, align: 'right' },
            { title: 'AMOUNT', width: 80, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Premium Matte Black Pen Stand [SKU-9921]', flex: 3, align: 'left', isBold: true },
                { text: '2 Pcs', width: 45, align: 'center' },
                { text: isIndia ? '₹950' : `${sym}12`, width: 70, align: 'right' },
                { text: isIndia ? '₹1,900' : `${sym}24`, width: 80, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Refillable Archival Gel Ink Cartridges (Pack 10)', flex: 3, align: 'left' },
                { text: '1 Set', width: 45, align: 'center' },
                { text: isIndia ? '₹1,550' : `${sym}18`, width: 70, align: 'right' },
                { text: isIndia ? '₹1,550' : `${sym}18`, width: 80, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Net Counter Total',
          subtotalValue: subtotalVal,
          taxRows: [{ label: 'Tax Included in Price', val: isIndia ? '₹526.27 (18% GST)' : `${sym}5.80` }],
          totalLabel: 'Total Paid (Settled)',
          totalAmount: totalVal,
          amountInWords: wordsVal,
          legalDeclaration: 'Thank you for your business. Exchange allowed within 7 days against original printed counter slip.',
          legalStandardBadge: 'Shops & Establishments Retail Standard',
          showBankDetails: false,
        };
      }

      case 'invoice_cum_bill_of_supply': {
        const subtotalVal = isIndia ? '₹85,000.00' : `${sym}1,100.00`;
        const totalVal = isIndia ? '₹95,800.00' : `${sym}1,210.00`;
        const wordsVal = isIndia ? 'INR Ninety-Five Thousand Eight Hundred Only' : 'Composite Value in Full';

        return {
          docTypeTag: 'CBIC GST RULE 46A · MIXED SUPPLY INSTRUMENT',
          docTitle: 'INVOICE-CUM-BILL OF SUPPLY',
          docNumber: 'ICB-2026-0042',
          issueDate: '16 Oct 2026',
          secondaryMeta: 'Single Combined Document for Taxable & Exempt Supplies under Rule 46A',
          statutoryBanner: {
            text: 'STATUTORY INVOICE-CUM-BILL OF SUPPLY — ISSUED UNDER CBIC GST RULE 46A',
            subtext: 'Composite bill providing separate itemization of taxable supplies and exempted zero-tax items.',
          },
          ledgerBand: [
            { label: 'Composite Inv #', val: 'ICB-2026-0042' },
            { label: 'Date', val: '16-OCT-2026' },
            { label: 'Taxable Total', val: isIndia ? '₹60,000.00' : `${sym}800.00` },
            { label: 'Exempt Total', val: isIndia ? '₹25,000.00' : `${sym}300.00` },
          ],
          partyTitle: 'BUYER / RECIPIENT',
          partyName: countryCfg.samplePartyName,
          partyMeta: countryCfg.samplePartyTaxId,
          partySubMeta: countryCfg.samplePartySubMeta,
          retailStrip: [
            { label: 'Supply Type', val: 'Composite' },
            { label: 'Rule', val: 'Rule 46A' },
            { label: 'Status', val: 'Standard' },
          ],
          tableHeaders: [
            { title: 'PRODUCT & SUPPLY CATEGORY', flex: 3, align: 'left' },
            { title: 'TAX STATUS', width: 85, align: 'center' },
            { title: 'QTY', width: 45, align: 'center' },
            { title: 'RATE', width: 75, align: 'right' },
            { title: 'TOTAL', width: 85, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Commercial Industrial Sensor Modules', flex: 3, align: 'left', isBold: true },
                { text: 'Taxable 18%', width: 85, align: 'center' },
                { text: '2 Pcs', width: 45, align: 'center' },
                { text: isIndia ? '₹30,000' : `${sym}400`, width: 75, align: 'right' },
                { text: isIndia ? '₹60,000' : `${sym}800`, width: 85, align: 'right' },
              ],
            },
            {
              cells: [
                { text: 'Certified Organic Packing Grain Materials', flex: 3, align: 'left' },
                { text: 'Exempt (Nil)', width: 85, align: 'center' },
                { text: '5 Bags', width: 45, align: 'center' },
                { text: isIndia ? '₹5,000' : `${sym}60`, width: 75, align: 'right' },
                { text: isIndia ? '₹25,000' : `${sym}300`, width: 85, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Subtotal (Taxable + Exempt)',
          subtotalValue: subtotalVal,
          taxRows: [
            { label: 'GST on Taxable Portion (18%)', val: isIndia ? '₹10,800.00' : `${sym}110.00` },
            { label: 'Tax on Exempt Portion (0%)', val: '₹0.00 (NIL)' },
          ],
          totalLabel: 'Invoice-cum-Bill Total',
          totalAmount: totalVal,
          amountInWords: wordsVal,
          legalDeclaration: 'Issued in accordance with CBIC CGST Rule 46A. Contains both taxable and exempted goods as detailed.',
          legalStandardBadge: 'CBIC Rule 46A Composite Standard',
          showBankDetails: true,
        };
      }

      case 'payment_reminder': {
        const overdueVal = isIndia ? '₹70,800.00' : `${sym}950.00`;
        const interestVal = isIndia ? '₹1,593.00' : `${sym}21.38`;
        const totalDueVal = isIndia ? '₹72,393.00' : `${sym}971.38`;

        return {
          docTypeTag: 'FORMAL DUNNING NOTICE · PAYMENT OVERDUE',
          docTitle: 'OVERDUE PAYMENT REMINDER NOTICE',
          docNumber: 'REM-2026-0033',
          issueDate: '16 Oct 2026',
          secondaryMeta: 'Ref Invoice: INV-2026-0112 · Overdue: 45 Days · Contractual Interest: 18% p.a.',
          statutoryBanner: {
            text: 'FORMAL NOTICE OF PAST DUE ACCOUNT — IMMEDIATE REMITTANCE REQUESTED',
            subtext: 'The invoice referenced below has matured beyond agreed credit terms. Please discharge outstanding liabilities.',
          },
          ledgerBand: [
            { label: 'Reminder Ref', val: 'REM-2026-0033' },
            { label: 'Original Invoice', val: 'INV-2026-0112' },
            { label: 'Invoice Date', val: '01-Sep-2026' },
            { label: 'Days Overdue', val: '45 Days' },
          ],
          partyTitle: 'ATTENTION: ACCOUNTS PAYABLE',
          partyName: countryCfg.samplePartyName,
          partyMeta: countryCfg.samplePartyTaxId,
          partySubMeta: countryCfg.samplePartySubMeta,
          retailStrip: [
            { label: 'Notice Level', val: 'Second Demand' },
            { label: 'Remit By', val: '23-Oct-2026' },
            { label: 'Payment Mode', val: 'Bank Wire / UPI' },
          ],
          tableHeaders: [
            { title: 'OVERDUE INVOICE PARTICULARS', flex: 3, align: 'left' },
            { title: 'INVOICED', width: 85, align: 'right' },
            { title: 'PAID', width: 70, align: 'right' },
            { title: 'OVERDUE', width: 85, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Tax Invoice INV-2026-0112 (Cloud Services & IT Infrastructure)', flex: 3, align: 'left', isBold: true },
                { text: overdueVal, width: 85, align: 'right' },
                { text: '₹0.00', width: 70, align: 'right' },
                { text: overdueVal, width: 85, align: 'right', isBold: true },
              ],
            },
          ],
          subtotalLabel: 'Principal Overdue Sum',
          subtotalValue: overdueVal,
          taxRows: [{ label: 'Contractual Late Interest (1.5%/mo)', val: interestVal }],
          totalLabel: 'Total Outstanding Remittance',
          totalAmount: totalDueVal,
          amountInWords: 'Immediate Wire Transfer Requested',
          legalDeclaration: 'Kindly note that continued delay in discharging invoices past their agreed credit maturity may result in suspension of services and escalation.',
          legalStandardBadge: 'Commercial Credit Terms Standard',
          showBankDetails: true,
        };
      }

      case 'invoice':
      default: {
        let taxRows = [
          { label: 'CGST (9.0%)', val: '₹5,400.00' },
          { label: 'SGST (9.0%)', val: '₹5,400.00' },
        ];
        let subtotalVal = '₹60,000.00';
        let totalVal = '₹70,800.00';
        let wordsVal = 'INR Seventy Thousand Eight Hundred Only';
        let row1Rate = '₹45,000';
        let row1Tot = '₹45,000';
        let row2Rate = '₹15,000';
        let row2Tot = '₹15,000';

        if (isUS) {
          subtotalVal = '$6,000.00';
          taxRows = [
            { label: 'State Sales Tax (4.00%)', val: '$240.00' },
            { label: 'City & County Tax (4.875%)', val: '$292.50' },
          ];
          totalVal = '$6,532.50';
          wordsVal = 'USD Six Thousand Five Hundred Thirty-Two and 50/100 Only';
          row1Rate = '$4,500';
          row1Tot = '$4,500';
          row2Rate = '$1,500';
          row2Tot = '$1,500';
        } else if (isUK) {
          subtotalVal = '£6,000.00';
          taxRows = [{ label: 'Standard VAT (20.0%)', val: '£1,200.00' }];
          totalVal = '£7,200.00';
          wordsVal = 'GBP Seven Thousand Two Hundred Pounds Only';
          row1Rate = '£4,500';
          row1Tot = '£4,500';
          row2Rate = '£1,500';
          row2Tot = '£1,500';
        } else if (isCanada) {
          subtotalVal = 'CA$6,000.00';
          taxRows = [{ label: 'Harmonized Sales Tax (HST 13.0%)', val: 'CA$780.00' }];
          totalVal = 'CA$6,780.00';
          wordsVal = 'CAD Six Thousand Seven Hundred Eighty Dollars Only';
          row1Rate = 'CA$4,500';
          row1Tot = 'CA$4,500';
          row2Rate = 'CA$1,500';
          row2Tot = 'CA$1,500';
        } else if (isAus) {
          subtotalVal = 'AU$6,000.00';
          taxRows = [{ label: 'Goods and Services Tax (GST 10.0%)', val: 'AU$600.00' }];
          totalVal = 'AU$6,600.00';
          wordsVal = 'AUD Six Thousand Six Hundred Dollars Only';
          row1Rate = 'AU$4,500';
          row1Tot = 'AU$4,500';
          row2Rate = 'AU$1,500';
          row2Tot = 'AU$1,500';
        } else if (isUae) {
          subtotalVal = 'AED 6,000.00';
          taxRows = [{ label: 'Value Added Tax (VAT 5.0%)', val: 'AED 300.00' }];
          totalVal = 'AED 6,300.00';
          wordsVal = 'AED Six Thousand Three Hundred Dirhams Only';
          row1Rate = 'AED 4,500';
          row1Tot = 'AED 4,500';
          row2Rate = 'AED 1,500';
          row2Tot = 'AED 1,500';
        } else if (isGermany) {
          subtotalVal = '6.000,00 €';
          taxRows = [{ label: 'Umsatzsteuer / MwSt (19.0%)', val: '1.140,00 €' }];
          totalVal = '7.140,00 €';
          wordsVal = 'EUR Siebentausendeinhundertvierzig Euro';
          row1Rate = '4.500 €';
          row1Tot = '4.500 €';
          row2Rate = '1.500 €';
          row2Tot = '1.500 €';
        } else if (isSingapore) {
          subtotalVal = 'SG$6,000.00';
          taxRows = [{ label: 'Goods and Services Tax (GST 9.0%)', val: 'SG$540.00' }];
          totalVal = 'SG$6,540.00';
          wordsVal = 'SGD Six Thousand Five Hundred Forty Dollars Only';
          row1Rate = 'SG$4,500';
          row1Tot = 'SG$4,500';
          row2Rate = 'SG$1,500';
          row2Tot = 'SG$1,500';
        }

        const docTypeTag = isIndia
          ? 'TAX INVOICE · ORIGINAL FOR RECIPIENT'
          : isUS
          ? 'COMMERCIAL SALES INVOICE · UCC ARTICLE 2'
          : isUK
          ? 'VAT INVOICE · HMRC NOTICE 700'
          : isCanada
          ? 'TAX INVOICE / FACTURE · EXCISE TAX ACT'
          : isAus
          ? 'TAX INVOICE · ATO DIVISION 29'
          : isUae
          ? 'TAX INVOICE / فاتورة ضريبية · ART 59'
          : isGermany
          ? 'RECHNUNG / TAX INVOICE · § 14 USTG'
          : 'TAX INVOICE · IRAS GST ACT';

        const docTitle = isUae
          ? 'TAX INVOICE / فاتورة ضريبية'
          : isGermany
          ? 'RECHNUNG / INVOICE'
          : isCanada
          ? 'TAX INVOICE / FACTURE'
          : 'TAX INVOICE';

        const secondaryMeta = isIndia
          ? `Net 30 Days · Supply: ${orgStateCode} (${orgState.substring(0, 2).toUpperCase()}) · RCM: No`
          : isUS
          ? `Net 30 Days · Nexus: ${countryCfg.sampleSubdivision} · Resale: No`
          : isUK
          ? `Net 30 Days · Supply: ${countryCfg.sampleSubdivision} · Reverse Charge: No`
          : `Net 30 Days · Supply: ${countryCfg.sampleSubdivision} · Standard Rated`;

        const legalDeclaration = isIndia
          ? 'Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged. Governed by GST Rule 46.'
          : isUS
          ? 'Certified that this commercial invoice is true and correct and issued pursuant to UCC Article 2 and IRC § 6011. Sales tax is remitted to state and municipal revenue authorities.'
          : isUK
          ? 'This invoice is issued under HMRC Notice 700 and Section 58 of Value Added Tax Act 1994. Valid for statutory input tax credit recovery.'
          : isCanada
          ? 'Issued in accordance with Part IX of the Excise Tax Act. The recipient may be entitled to claim an input tax credit (ITC) in respect of the tax payable.'
          : isAus
          ? 'This document is a Tax Invoice for the purposes of A New Tax System (Goods and Services Tax) Act 1999 Div 29. Recipient is eligible for GST credits.'
          : isUae
          ? 'Tax invoice issued pursuant to UAE Federal Decree-Law No. (8) of 2017 on Value Added Tax (Art 59). Stated tax is accounted for to the Federal Tax Authority.'
          : isGermany
          ? 'Rechnung enthält alle Pflichtangaben gemäß § 14 Abs. 4 UStG sowie EU-Richtlinie 2006/112/EG. Berechtigt zum Vorsteuerabzug nach § 15 UStG.'
          : 'Issued pursuant to the Singapore Goods and Services Tax Act (Cap. 117A). Tax charged is accounted for under IRAS statutory regulations.';

        const legalStandardBadge = isIndia
          ? 'Rule 46 GST Compliant'
          : isUS
          ? 'UCC § 2-201 & IRC § 6011'
          : isUK
          ? 'HMRC Notice 700 Compliant'
          : isCanada
          ? 'CRA Excise Tax Act Part IX'
          : isAus
          ? 'ATO GST Div 29 Compliant'
          : isUae
          ? 'UAE FTA Decree-Law (8) Art 59'
          : isGermany
          ? '§ 14 UStG & EU MwSt Richtlinie'
          : 'IRAS GST Act Compliant';

        return {
          docTypeTag,
          docTitle,
          docNumber: `${selectedTemplate.code}-0142`,
          issueDate: '15 Oct 2026',
          secondaryMeta,
          statutoryBanner: null,
          ledgerBand: [
            { label: 'INVOICE NO', val: `${selectedTemplate.code}-0142` },
            { label: 'DATE', val: '15-OCT-2026' },
            { label: isUS ? 'TAX NEXUS' : 'PLACE OF SUPPLY', val: countryCfg.sampleSubdivision },
            { label: 'TERMS', val: 'NET 30 DAYS' },
          ],
          partyTitle: isGermany ? 'RECHNUNGSEMPFÄNGER (KÄUFER)' : 'BILLED TO (RECIPIENT)',
          partyName: countryCfg.samplePartyName,
          partyMeta: countryCfg.samplePartyTaxId,
          partySubMeta: countryCfg.samplePartySubMeta,
          secondaryPartyTitle: countryCfg.sampleSecondPartyTitle,
          secondaryPartyName: countryCfg.sampleSecondPartyName,
          secondaryPartyMeta: countryCfg.sampleSecondPartyMeta,
          retailStrip: [
            { label: 'DISPATCH', val: 'Express Air' },
            { label: 'CARRIER', val: isUS ? 'FedEx Priority' : isUK ? 'Royal Mail Special' : isGermany ? 'DHL Express' : 'BlueDart Express' },
            { label: 'TRACKING', val: `${countryCfg.code}-902184` },
          ],
          tableHeaders: [
            { title: 'ITEM & DESCRIPTION', flex: 3, align: 'left' },
            { title: itemCodeHdr, width: 72, align: 'center' },
            { title: 'QTY', width: 44, align: 'center' },
            { title: 'RATE', width: 75, align: 'right' },
            { title: 'TAXABLE', width: 85, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Enterprise Cloud ERP Subscription', flex: 3, align: 'left' },
                { text: isIndia ? '998313' : isUS ? 'SKU-8419' : isUK ? '84713000' : isGermany ? '8471 3000' : 'EC-ERP-01', width: 72, align: 'center' },
                { text: '1 Yr', width: 44, align: 'center' },
                { text: row1Rate, width: 75, align: 'right' },
                { text: row1Tot, width: 85, align: 'right', isBold: true },
              ],
            },
            {
              cells: [
                { text: `${countryCfg.taxSystemName} Statutory Compliance & Audit Engine`, flex: 3, align: 'left' },
                { text: isIndia ? '998314' : isUS ? 'SKU-8420' : isUK ? '84713000' : isGermany ? '8471 3000' : 'TAX-AUD-02', width: 72, align: 'center' },
                { text: '1 Lic', width: 44, align: 'center' },
                { text: row2Rate, width: 75, align: 'right' },
                { text: row2Tot, width: 85, align: 'right', isBold: true },
              ],
            },
          ],
          subtotalLabel: 'Taxable Amount',
          subtotalValue: subtotalVal,
          taxRows,
          totalLabel: isGermany ? 'Gesamtbetrag (Brutto)' : 'Total Invoice Value',
          totalAmount: totalVal,
          amountInWords: wordsVal,
          legalDeclaration,
          legalStandardBadge,
          showBankDetails: true,
        };
      }
    }
  }, [
    activeDocType,
    selectedTemplate.code,
    selectedCountryCode,
    countryCfg,
    orgLegalName,
    orgTradeName,
    orgAddress,
    orgResolvedTaxLine,
    orgResolvedBankDetails,
    orgStateCode,
    orgState,
  ]);

  /* ───────────────────────────────────────────────────────────────────
     RENDER DOCUMENT CANVAS (Airy Luxury Stationery Aesthetics)
  ─────────────────────────────────────────────────────────────────── */
  const renderDocumentCanvas = () => {
    return (
      <View style={styles.documentCanvas}>
        {/* Category Header: Executive */}
        {selectedTemplate.category === 'executive' && (
          <View style={styles.execHeader}>
            <View style={styles.execLeft}>
              <Text style={styles.docBrandName}>{orgLegalName}</Text>
              {Boolean(orgTradeName) && <Text style={styles.docBrandTrade}>{orgTradeName}</Text>}
              <Text style={styles.docBrandMeta}>
                {orgResolvedTaxLine}
              </Text>
              <Text style={styles.docBrandMeta}>{orgAddress}</Text>
              <Text style={styles.docBrandMeta}>
                {orgEmail} · {orgPhone}
              </Text>
            </View>
            <View style={styles.execDivider} />
            <View style={styles.execRight}>
              <Text style={styles.docTitleMain}>{canvasData.docTitle}</Text>
              <Text style={styles.docNumberMain}>#{canvasData.docNumber}</Text>
              <Text style={styles.docDateMeta}>Date: {canvasData.issueDate}</Text>
              <Text style={styles.docSecondaryMeta}>{canvasData.secondaryMeta}</Text>
            </View>
          </View>
        )}

        {/* Category Header: Ledger */}
        {selectedTemplate.category === 'ledger' && (
          <View style={styles.ledgerHeader}>
            <View style={styles.ledgerTopRow}>
              <View>
                <Text style={styles.docBrandName}>{orgLegalName}</Text>
                <Text style={styles.docBrandMeta}>
                  {orgResolvedTaxLine} · {orgAddress}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.docTitleMain}>{canvasData.docTitle}</Text>
                <Text style={styles.ledgerSubTitleTag}>{canvasData.docTypeTag}</Text>
              </View>
            </View>

            {/* 4-Compartment Metadata Band */}
            <View style={styles.ledgerBand}>
              {canvasData.ledgerBand.map((col, idx) => (
                <View
                  key={col.label}
                  style={[
                    styles.ledgerBandCol,
                    idx === canvasData.ledgerBand.length - 1 && { borderRightWidth: 0 },
                  ]}
                >
                  <Text style={styles.ledgerBandLabel}>{col.label}</Text>
                  <Text style={styles.ledgerBandVal} numberOfLines={1}>
                    {col.val}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Category Header: Minimal */}
        {selectedTemplate.category === 'minimal' && (
          <View style={styles.minimalHeader}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={styles.docBrandName}>{orgLegalName}</Text>
              <Text style={styles.docBrandMeta}>
                {orgResolvedTaxLine} · {orgAddress}
              </Text>
              <Text style={styles.minimalDocTypeTag}>{canvasData.docTitle}</Text>
            </View>
            <View style={styles.minimalRight}>
              <Text style={styles.minimalNumber}>#{canvasData.docNumber}</Text>
              <Text style={styles.minimalDate}>{canvasData.issueDate}</Text>
              <Text style={styles.minimalSecondary}>{canvasData.secondaryMeta}</Text>
            </View>
          </View>
        )}

        {/* Category Header: Corporate */}
        {selectedTemplate.category === 'corporate' && (
          <View style={styles.corporateHeader}>
            <View style={styles.corpTopRow}>
              <View>
                <Text style={styles.docBrandName}>{orgLegalName}</Text>
                <Text style={styles.docBrandMeta}>
                  {orgResolvedTaxLine} · Region: {countryCfg.sampleSubdivision}
                </Text>
              </View>
              <View style={styles.corpTitlePill}>
                <Text style={styles.corpTitleTag}>{canvasData.docTitle}</Text>
                <Text style={styles.corpDocNumber}>#{canvasData.docNumber}</Text>
              </View>
            </View>

            {/* Dual Enterprise Party Panels */}
            <View style={styles.corpDualPanels}>
              <View style={styles.corpPanel}>
                <Text style={styles.corpPanelTag}>{canvasData.partyTitle}</Text>
                <Text style={styles.corpPartyName}>{canvasData.partyName}</Text>
                <Text style={styles.corpPartyMeta}>{canvasData.partyMeta}</Text>
                {Boolean(canvasData.partySubMeta) && (
                  <Text style={styles.corpPartySubMeta}>{canvasData.partySubMeta}</Text>
                )}
              </View>

              <View style={[styles.corpPanel, { marginLeft: 16 }]}>
                <Text style={styles.corpPanelTag}>
                  {canvasData.secondaryPartyTitle || 'TRANSACTION REFERENCE'}
                </Text>
                <Text style={styles.corpPartyName}>
                  {canvasData.secondaryPartyName || orgLegalName}
                </Text>
                <Text style={styles.corpPartyMeta}>
                  {canvasData.secondaryPartyMeta || `${canvasData.docTypeTag} · ${canvasData.issueDate}`}
                </Text>
                <Text style={styles.corpPartySubMeta}>Date: {canvasData.issueDate} · Terms: Net 30</Text>
              </View>
            </View>
          </View>
        )}

        {/* Category Header: Retail / Trade */}
        {selectedTemplate.category === 'retail' && (
          <View style={styles.supplyHeader}>
            <View style={styles.supplyTopRow}>
              <View>
                <Text style={styles.docBrandName}>{orgLegalName}</Text>
                <Text style={styles.docBrandMeta}>
                  {orgResolvedTaxLine} · {orgAddress}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.docTitleMain}>{canvasData.docTitle}</Text>
                <Text style={styles.docNumberMain}>#{canvasData.docNumber}</Text>
              </View>
            </View>

            {/* Logistics / Dispatch Metric Strip */}
            <View style={styles.supplyTransportStrip}>
              {canvasData.retailStrip.map((item, idx) => (
                <View
                  key={item.label}
                  style={[
                    styles.transportCol,
                    idx === canvasData.retailStrip.length - 1 && { borderRightWidth: 0 },
                  ]}
                >
                  <Text style={styles.transportLabel}>{item.label}</Text>
                  <Text style={styles.transportVal} numberOfLines={1}>
                    {item.val}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Statutory Legal Banner (Composition, Credit Memo, Proposal) */}
        {Boolean(canvasData.statutoryBanner) && (
          <View style={styles.statutoryBannerBox}>
            <View style={styles.statutoryIconBox}>
              <ShieldCheck size={14} color="#18181B" strokeWidth={2} />
            </View>
            <View style={styles.statutoryTextBox}>
              <Text style={styles.statutoryBannerMain}>
                {canvasData.statutoryBanner?.text}
              </Text>
              {Boolean(canvasData.statutoryBanner?.subtext) && (
                <Text style={styles.statutoryBannerSub}>
                  {canvasData.statutoryBanner?.subtext}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Party Details (For Non-Corporate Layouts) */}
        {selectedTemplate.category !== 'corporate' && (
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>{canvasData.partyTitle}</Text>
            <Text style={styles.partyName}>{canvasData.partyName}</Text>
            <Text style={styles.partyMeta}>{canvasData.partyMeta}</Text>
            {Boolean(canvasData.partySubMeta) && (
              <Text style={styles.partySubMetaText}>{canvasData.partySubMeta}</Text>
            )}
          </View>
        )}

        {/* Clean Line Items Table with Airy Padding */}
        <View style={styles.tableWrap}>
          {/* Table Header */}
          <View style={styles.tableHead}>
            {canvasData.tableHeaders.map((col, idx) => (
              <Text
                key={col.title}
                style={[
                  styles.thCell,
                  col.flex ? { flex: col.flex } : { width: col.width },
                  { textAlign: col.align || 'left' },
                ]}
              >
                {col.title}
              </Text>
            ))}
          </View>

          {/* Table Body Rows */}
          {canvasData.tableRows.map((row, rIdx) => (
            <View
              key={rIdx}
              style={[
                styles.tableRow,
                rIdx === canvasData.tableRows.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              {row.cells.map((cell, cIdx) => (
                <Text
                  key={cIdx}
                  style={[
                    cell.isBold ? styles.tdAmount : cIdx === 0 ? styles.tdDesc : styles.tdMeta,
                    cell.flex ? { flex: cell.flex } : { width: cell.width },
                    { textAlign: cell.align || 'left' },
                  ]}
                >
                  {cell.text}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {/* Totals, Financial Settlement & Signatures */}
        <View style={styles.summaryWrap}>
          {/* Left Column: Bank Coordinates or Dual Signature */}
          <View style={styles.summaryLeftCol}>
            {canvasData.showBankDetails && (
              <View style={styles.bankCoordinatesBox}>
                <View style={styles.bankTitleRow}>
                  <Landmark size={12} color="#71717A" strokeWidth={2} />
                  <Text style={styles.bankSectionTitle}>BANK SETTLEMENT WIRE</Text>
                </View>
                <Text style={styles.bankDetailLine}>
                  {orgResolvedBankDetails.bankName} · A/C: {orgResolvedBankDetails.accountNo}
                </Text>
                <Text style={styles.bankDetailLine}>
                  {orgResolvedBankDetails.routingLabel}: {orgResolvedBankDetails.routingVal}
                </Text>
                <Text style={styles.bankDetailLine}>
                  {orgResolvedBankDetails.digitalPayLabel}: {orgResolvedBankDetails.digitalPayVal}
                </Text>
              </View>
            )}

            {/* Dual Signatures for Work Order / Corporate */}
            {Boolean(canvasData.dualSignatures) && (
              <View style={styles.dualSignaturesWrap}>
                <View style={styles.dualSigBox}>
                  <View style={styles.sigLine} />
                  <Text style={styles.sigLabel}>{canvasData.dualSignatures?.primaryRole}</Text>
                  <Text style={styles.sigOrg} numberOfLines={1}>
                    {canvasData.dualSignatures?.primaryEntity}
                  </Text>
                </View>
                <View style={[styles.dualSigBox, { marginLeft: 16 }]}>
                  <View style={styles.sigLine} />
                  <Text style={styles.sigLabel}>{canvasData.dualSignatures?.secondaryRole}</Text>
                  <Text style={styles.sigOrg} numberOfLines={1}>
                    {canvasData.dualSignatures?.secondaryEntity}
                  </Text>
                </View>
              </View>
            )}

            {/* Single Signatory for Executive / Minimal / Ledger */}
            {!canvasData.dualSignatures && (
              <View style={styles.signatureBox}>
                <View style={styles.sigLine} />
                <Text style={styles.sigLabel}>{orgSignatoryTitle || 'Authorized Signatory'}</Text>
                <Text style={styles.sigOrg} numberOfLines={1}>
                  For {orgLegalName}
                </Text>
              </View>
            )}
          </View>

          {/* Right Column: Financial Breakdown Totals */}
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.subtotalLabel}>{canvasData.subtotalLabel}</Text>
              <Text style={styles.subtotalVal}>{canvasData.subtotalValue}</Text>
            </View>

            {canvasData.taxRows.map((tRow) => (
              <View key={tRow.label} style={styles.totalsRow}>
                <Text style={styles.subtotalLabel}>{tRow.label}</Text>
                <Text style={styles.subtotalVal}>{tRow.val}</Text>
              </View>
            ))}

            <View style={styles.grandTotalDivider} />

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalTitle}>{canvasData.totalLabel}</Text>
              <Text style={styles.grandTotalAmount}>{canvasData.totalAmount}</Text>
            </View>

            {Boolean(canvasData.amountInWords) && (
              <Text style={styles.amountInWordsText}>{canvasData.amountInWords}</Text>
            )}
          </View>
        </View>

        {/* Statutory Legal Declaration Footer */}
        <View style={styles.statutoryFooter}>
          <Text style={styles.statutoryFooterText}>{canvasData.legalDeclaration}</Text>
        </View>
      </View>
    );
  };

  /* ───────────────────────────────────────────────────────────────────
     RENDER TEMPLATE GALLERY (Uncluttered, Spacious Cards)
  ─────────────────────────────────────────────────────────────────── */
  const renderTemplateGallery = () => {
    return (
      <View style={styles.galleryInner}>
        {/* Category Filters */}
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {filterTabs.map((tab) => {
              const isSelected = selectedCategoryFilter === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                  onPress={() => setSelectedCategoryFilter(tab.key)}
                >
                  <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Similar Layouts — Clean Subtle Row */}
        {similarTemplates.length > 0 && (
          <View style={styles.similarStrip}>
            <Sparkles size={13} color="#A1A1AA" strokeWidth={1.75} />
            <Text style={styles.similarPrompt}>Similar styles:</Text>
            <View style={styles.similarLinks}>
              {similarTemplates.map((sim) => (
                <Pressable
                  key={sim.id}
                  style={styles.similarLinkPill}
                  onPress={() => setSelectedTemplateId(sim.id)}
                >
                  <Text style={styles.similarLinkText}>{sim.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Template Cards List */}
        <View style={styles.cardList}>
          {visibleTemplates.map((tmpl) => {
            const isSelected = tmpl.id === selectedTemplateId;
            return (
              <Pressable
                key={tmpl.id}
                style={({ pressed }) => [
                  styles.optionCard,
                  isSelected ? styles.optionCardSelected : styles.optionCardUnselected,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
                onPress={() => setSelectedTemplateId(tmpl.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                {/* Visual Thumbnail */}
                <TemplateWireframeThumbnail category={tmpl.category} isSelected={isSelected} />

                {/* Information */}
                <View style={styles.cardInfo}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardCode}>{tmpl.code}</Text>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {tmpl.name}
                    </Text>
                  </View>
                  <Text style={styles.cardTagline} numberOfLines={2}>
                    {tmpl.tagline}
                  </Text>
                </View>

                {/* Selection Indicator */}
                <View style={styles.radioSlot}>
                  {isSelected ? (
                    <View style={styles.radioActive}>
                      <Check size={13} color="#000000" strokeWidth={2.75} />
                    </View>
                  ) : (
                    <View style={styles.radioIdle} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeRoot} edges={['top', 'left', 'right']}>
      {/* ── Top Header Navigation ── */}
      <View style={styles.topHeader}>
        <Pressable
          style={styles.backTouch}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/documents');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2} />
        </Pressable>

        <View style={styles.headerTitleArea}>
          <Text style={styles.screenHeaderTitle}>{activeConfig.title}</Text>
          <Text style={styles.screenHeaderSub}>{activeConfig.templates.length} curated layouts · {canvasData.legalStandardBadge}</Text>
        </View>

        {isDesktop && (
          <Pressable style={styles.headerDraftBtn} onPress={handleCreateDocument}>
            <Text style={styles.headerDraftBtnText}>Draft Document</Text>
            <ArrowRight size={14} color="#000000" strokeWidth={2.5} />
          </Pressable>
        )}
      </View>

      {/* ── Country Jurisdiction Bar ── */}
      <View style={styles.countryBar}>
        <View style={styles.countryBarLabelWrap}>
          <Globe size={13} color="#A1A1AA" strokeWidth={2} />
          <Text style={styles.countryBarLabel}>TAX JURISDICTION</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.countryScroll}
        >
          {COUNTRY_TAX_OPTIONS.map((c) => {
            const isSelected = selectedCountryCode === c.code;
            return (
              <Pressable
                key={c.code}
                style={[styles.countryChip, isSelected && styles.countryChipActive]}
                onPress={() => setSelectedCountryCode(c.code)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${c.name} tax jurisdiction`}
              >
                <Text style={styles.countryFlag}>{c.flag}</Text>
                <Text style={[styles.countryCodeText, isSelected && styles.countryCodeTextActive]}>
                  {c.code}
                </Text>
                <Text style={[styles.countryTaxTag, isSelected && styles.countryTaxTagActive]}>
                  · {c.taxSystemName}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Main Viewport ── */}
      {isDesktop ? (
        /* DESKTOP SPLIT STUDIO */
        <View style={styles.desktopSplitWrap}>
          {/* Left Canvas Preview */}
          <View style={styles.desktopCanvasSide}>
            <View style={styles.canvasSubHeader}>
              <View style={styles.canvasDocMetaRow}>
                <Text style={styles.canvasDocTag}>
                  {selectedTemplate.code} · {selectedTemplate.name}
                </Text>
                <View style={styles.legalBadgePill}>
                  <ShieldCheck size={11} color="#A1A1AA" strokeWidth={2} />
                  <Text style={styles.legalBadgePillText}>{canvasData.legalStandardBadge}</Text>
                </View>
              </View>

              <View style={styles.canvasFormatTag}>
                <Layers size={12} color="#71717A" />
                <Text style={styles.canvasFormatText}>A4 Sheet</Text>
              </View>
            </View>

            <ScrollView
              style={styles.desktopScroll}
              contentContainerStyle={styles.desktopScrollInner}
              showsVerticalScrollIndicator={false}
            >
              {renderDocumentCanvas()}
            </ScrollView>
          </View>

          {/* Right Template Picker */}
          <View style={styles.desktopPickerSide}>
            <View style={styles.pickerTitleRow}>
              <Text style={styles.pickerHeading}>Layout Designs</Text>
            </View>

            <ScrollView
              style={styles.pickerScroll}
              contentContainerStyle={[styles.pickerScrollInner, { paddingBottom: insets.bottom + 100 }]}
              showsVerticalScrollIndicator={false}
            >
              {renderTemplateGallery()}
            </ScrollView>

            {/* Pinned Bottom Action Box */}
            <View style={[styles.pinnedActionBox, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <View style={styles.pinnedInfo}>
                <Text style={styles.pinnedName} numberOfLines={1}>
                  {selectedTemplate.code} · {selectedTemplate.name}
                </Text>
                <Text style={styles.pinnedStatus}>{canvasData.legalStandardBadge}</Text>
              </View>

              <Pressable style={styles.primaryActionBtn} onPress={handleCreateDocument}>
                <Text style={styles.primaryActionBtnText}>Create Document</Text>
                <ArrowRight size={15} color="#000000" strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        /* MOBILE STACK */
        <ScrollView
          style={styles.mobileScroll}
          contentContainerStyle={[styles.mobileScrollInner, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Canvas Subtitle */}
          <View style={styles.mobileCanvasMeta}>
            <View>
              <Text style={styles.mobileCanvasTitle}>{selectedTemplate.name}</Text>
              <Text style={styles.mobileLegalBadge}>{canvasData.legalStandardBadge}</Text>
            </View>
            <Text style={styles.mobileCanvasBadge}>{selectedTemplate.code}</Text>
          </View>

          {/* Document Sheet */}
          {renderDocumentCanvas()}

          {/* Gallery Header */}
          <View style={styles.mobileGalleryHeadingRow}>
            <Text style={styles.mobileGalleryHeading}>Choose Layout</Text>
          </View>

          {/* Template Gallery */}
          {renderTemplateGallery()}
        </ScrollView>
      )}

      {/* Mobile Floating Bottom Bar */}
      {!isDesktop && (
        <View style={[styles.mobileFloatingBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.mobileBarInfo}>
            <Text style={styles.mobileBarTitle} numberOfLines={1}>
              {selectedTemplate.code} · {selectedTemplate.name}
            </Text>
            <Text style={styles.mobileBarSubtitle}>{canvasData.legalStandardBadge}</Text>
          </View>

          <Pressable style={styles.primaryActionBtn} onPress={handleCreateDocument}>
            <Text style={styles.primaryActionBtnText}>Create Document</Text>
            <ArrowRight size={15} color="#000000" strokeWidth={2.5} />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeRoot: {
    flex: 1,
    backgroundColor: '#090A0F',
  },

  /* Top Header */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#090A0F',
  },
  backTouch: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    marginRight: 12,
  },
  headerTitleArea: {
    flex: 1,
  },
  screenHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  screenHeaderSub: {
    fontSize: 12,
    fontWeight: '400',
    color: '#71717A',
    marginTop: 2,
  },
  headerDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  headerDraftBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },

  /* Desktop Split Layout */
  desktopSplitWrap: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopCanvasSide: {
    flex: 1.25,
    backgroundColor: '#050608',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 36,
    paddingTop: 24,
  },
  canvasSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  canvasDocMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  canvasDocTag: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A1A1AA',
    letterSpacing: 0.2,
  },
  legalBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  legalBadgePillText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#A1A1AA',
  },
  canvasFormatTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  canvasFormatText: {
    fontSize: 11,
    color: '#71717A',
  },
  desktopScroll: {
    flex: 1,
  },
  desktopScrollInner: {
    alignItems: 'center',
    paddingBottom: 48,
  },
  desktopPickerSide: {
    flex: 1,
    backgroundColor: '#090A0F',
    position: 'relative',
  },
  pickerTitleRow: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 16,
  },
  pickerHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  pickerScroll: {
    flex: 1,
  },
  pickerScrollInner: {
    paddingHorizontal: 28,
  },
  pinnedActionBox: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0C0D14',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 16,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pinnedInfo: {
    flex: 1,
    marginRight: 16,
  },
  pinnedName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pinnedStatus: {
    fontSize: 11,
    color: '#A1A1AA',
    marginTop: 2,
  },

  /* Mobile Stack Layout */
  mobileScroll: {
    flex: 1,
    backgroundColor: '#090A0F',
  },
  mobileScrollInner: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  mobileCanvasMeta: {
    width: '100%',
    maxWidth: 640,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mobileCanvasTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E4E4E7',
  },
  mobileLegalBadge: {
    fontSize: 10,
    color: '#A1A1AA',
    marginTop: 2,
  },
  mobileCanvasBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: '#71717A',
  },
  mobileGalleryHeadingRow: {
    width: '100%',
    maxWidth: 640,
    paddingTop: 20,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 12,
  },
  mobileGalleryHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mobileFloatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0C0D14',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileBarInfo: {
    flex: 1,
    marginRight: 14,
  },
  mobileBarTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mobileBarSubtitle: {
    fontSize: 10,
    color: '#A1A1AA',
    marginTop: 2,
  },

  /* Document Canvas (Pure Crisp White Paper) */
  documentCanvas: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    padding: 32,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
      },
      default: {
        elevation: 6,
      },
    }),
  },

  /* Document Header Styles */
  execHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
    marginBottom: 20,
  },
  execLeft: {
    flex: 1.3,
  },
  execDivider: {
    width: 1,
    backgroundColor: '#E4E4E7',
    marginHorizontal: 16,
  },
  execRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  docBrandName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#09090B',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  docBrandTrade: {
    fontSize: 11,
    fontWeight: '500',
    color: '#52525B',
    marginBottom: 4,
  },
  docBrandMeta: {
    fontSize: 10.5,
    color: '#71717A',
    lineHeight: 15,
  },
  docTitleMain: {
    fontSize: 13,
    fontWeight: '600',
    color: '#09090B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  docNumberMain: {
    fontSize: 12,
    fontWeight: '600',
    color: '#27272A',
    marginTop: 3,
    marginBottom: 2,
  },
  docDateMeta: {
    fontSize: 10.5,
    color: '#71717A',
  },
  docSecondaryMeta: {
    fontSize: 10,
    color: '#71717A',
    marginTop: 2,
  },

  /* Ledger Anatomy */
  ledgerHeader: {
    marginBottom: 20,
  },
  ledgerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ledgerSubTitleTag: {
    fontSize: 9.5,
    color: '#71717A',
    fontWeight: '500',
    marginTop: 2,
  },
  ledgerBand: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FAFAFA',
    borderRadius: 6,
  },
  ledgerBandCol: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#E4E4E7',
  },
  ledgerBandLabel: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  ledgerBandVal: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#09090B',
  },

  /* Minimal Anatomy */
  minimalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  minimalRight: {
    alignItems: 'flex-end',
  },
  minimalDocTypeTag: {
    fontSize: 10,
    fontWeight: '600',
    color: '#52525B',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  minimalNumber: {
    fontSize: 22,
    fontWeight: '600',
    color: '#09090B',
    letterSpacing: -0.5,
  },
  minimalDate: {
    fontSize: 10.5,
    color: '#71717A',
    marginTop: 2,
  },
  minimalSecondary: {
    fontSize: 9.5,
    color: '#A1A1AA',
    marginTop: 2,
  },

  /* Corporate Anatomy */
  corporateHeader: {
    marginBottom: 20,
  },
  corpTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  corpTitlePill: {
    alignItems: 'flex-end',
  },
  corpTitleTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#09090B',
    letterSpacing: 0.8,
  },
  corpDocNumber: {
    fontSize: 10.5,
    color: '#71717A',
    marginTop: 2,
  },
  corpDualPanels: {
    flexDirection: 'row',
  },
  corpPanel: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    padding: 10,
    borderRadius: 6,
  },
  corpPanelTag: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  corpPartyName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#09090B',
    marginBottom: 2,
  },
  corpPartyMeta: {
    fontSize: 9.5,
    color: '#71717A',
    lineHeight: 13,
  },
  corpPartySubMeta: {
    fontSize: 9,
    color: '#A1A1AA',
    marginTop: 2,
  },

  /* Supply Chain Anatomy */
  supplyHeader: {
    marginBottom: 20,
  },
  supplyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  supplyTransportStrip: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 6,
  },
  transportCol: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#E4E4E7',
  },
  transportLabel: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  transportVal: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#09090B',
  },

  /* Statutory Legal Banner */
  statutoryBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 18,
    gap: 8,
  },
  statutoryIconBox: {
    width: 20,
    alignItems: 'center',
  },
  statutoryTextBox: {
    flex: 1,
  },
  statutoryBannerMain: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#18181B',
    letterSpacing: 0.2,
  },
  statutoryBannerSub: {
    fontSize: 8.5,
    color: '#52525B',
    marginTop: 1,
  },

  /* Party Details Box */
  partyBox: {
    marginBottom: 20,
  },
  partyLabel: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  partyName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#09090B',
    marginBottom: 2,
  },
  partyMeta: {
    fontSize: 10.5,
    color: '#71717A',
  },
  partySubMetaText: {
    fontSize: 9.5,
    color: '#A1A1AA',
    marginTop: 1,
  },

  /* Line Items Table */
  tableWrap: {
    marginBottom: 20,
  },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
    paddingBottom: 7,
    marginBottom: 4,
  },
  thCell: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  tdDesc: {
    fontSize: 11,
    fontWeight: '500',
    color: '#09090B',
  },
  tdMeta: {
    fontSize: 10.5,
    color: '#71717A',
  },
  tdAmount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#09090B',
  },

  /* Summary & Financial Blocks */
  summaryWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
  },
  summaryLeftCol: {
    flex: 1.2,
    marginRight: 20,
  },
  bankCoordinatesBox: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  bankTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  bankSectionTitle: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 0.5,
  },
  bankDetailLine: {
    fontSize: 9.5,
    color: '#3F3F46',
    lineHeight: 14,
  },
  dualSignaturesWrap: {
    flexDirection: 'row',
    marginTop: 8,
  },
  dualSigBox: {
    flex: 1,
  },
  signatureBox: {
    maxWidth: 180,
    marginTop: 8,
  },
  sigLine: {
    height: 1,
    backgroundColor: '#D4D4D8',
    marginBottom: 5,
  },
  sigLabel: {
    fontSize: 9,
    color: '#71717A',
  },
  sigOrg: {
    fontSize: 10,
    fontWeight: '600',
    color: '#09090B',
    marginTop: 1,
  },

  /* Totals Box */
  totalsBox: {
    width: 175,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3.5,
  },
  subtotalLabel: {
    fontSize: 10,
    color: '#71717A',
  },
  subtotalVal: {
    fontSize: 10,
    color: '#09090B',
    fontWeight: '500',
  },
  grandTotalDivider: {
    height: 1,
    backgroundColor: '#E4E4E7',
    marginVertical: 5,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  grandTotalTitle: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#09090B',
    letterSpacing: 0.3,
  },
  grandTotalAmount: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#09090B',
  },
  amountInWordsText: {
    fontSize: 8.5,
    color: '#71717A',
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'right',
  },

  /* Statutory Declaration Footer */
  statutoryFooter: {
    marginTop: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
  },
  statutoryFooterText: {
    fontSize: 8.5,
    color: '#71717A',
    lineHeight: 12,
    textAlign: 'center',
  },

  /* Gallery Inner */
  galleryInner: {
    width: '100%',
  },
  filterBar: {
    marginBottom: 16,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#A1A1AA',
  },
  filterChipTextActive: {
    color: '#000000',
    fontWeight: '600',
  },

  /* Similar Layouts Strip */
  similarStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  similarPrompt: {
    fontSize: 11,
    color: '#71717A',
  },
  similarLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  similarLinkPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  similarLinkText: {
    fontSize: 11,
    color: '#E4E4E7',
    fontWeight: '500',
  },

  /* Template Cards */
  cardList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: '#FFFFFF',
  },
  optionCardUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardInfo: {
    flex: 1,
    marginRight: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  cardCode: {
    fontSize: 10,
    fontWeight: '600',
    color: '#71717A',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  cardTagline: {
    fontSize: 11,
    fontWeight: '400',
    color: '#71717A',
    lineHeight: 16,
  },
  radioSlot: {
    marginLeft: 8,
  },
  radioActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioIdle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  /* Action Buttons */
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 9999,
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },

  /* Wireframe Micro-Render */
  wireframeBox: {
    width: 42,
    height: 56,
    borderRadius: 4,
    borderWidth: 1,
    padding: 3,
    marginRight: 12,
    justifyContent: 'center',
  },
  wfInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  wfRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wfBar: {
    borderRadius: 1,
  },
  wfDivider: {
    width: 1,
    height: 8,
  },
  wfHairline: {
    width: '100%',
    height: 1,
    opacity: 0.3,
  },
  wfGridBand: {
    flexDirection: 'row',
    borderWidth: 0.5,
    height: 7,
    marginVertical: 2,
    borderRadius: 1,
  },
  wfGridCell: {
    flex: 1,
    borderRightWidth: 0.5,
  },
  wfBoxOutline: {
    width: 14,
    height: 6,
    borderWidth: 0.5,
    borderRadius: 1,
  },
  wfRowPanels: {
    flexDirection: 'row',
    gap: 2,
  },
  wfPanel: {
    flex: 1,
    height: 8,
    borderWidth: 0.5,
    borderRadius: 1,
  },
  wfDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  wfStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 0.5,
    paddingHorizontal: 2,
    paddingVertical: 1,
    marginVertical: 2,
    borderRadius: 1,
  },

  /* Country Jurisdiction Selector Bar */
  countryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  countryBarLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  countryBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 0.8,
    marginLeft: 6,
  },
  countryScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  countryChipActive: {
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  countryFlag: {
    fontSize: 13,
    marginRight: 5,
  },
  countryCodeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4D4D8',
    marginRight: 4,
  },
  countryCodeTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  countryTaxTag: {
    fontSize: 10,
    color: '#71717A',
  },
  countryTaxTagActive: {
    color: '#3F3F46',
    fontWeight: '600',
  },
});

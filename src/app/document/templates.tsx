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
    if (rawType === 'challan' || rawType === 'delivery_challan') return 'invoice';
    if (rawType === 'tax_invoice') return 'invoice';
    if (rawType === 'quote' || rawType === 'quotation') return 'estimate';
    if (rawType === 'bos') return 'bill_of_supply';
    if (rawType === 'po') return 'purchase_order';
    if (rawType === 'sow') return 'work_order';
    if (rawType === 'debit_note' || rawType === 'credit') return 'credit_note';
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

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await BusinessProfileRepository.getActiveProfile();
        if (profile) setBusinessProfile(profile);
      } catch {
        // Safe fallback to default demo credentials
      }
    };
    loadProfile();
  }, []);

  // Organization resolved credentials
  const orgLegalName = businessProfile?.legal_name || businessProfile?.name || 'Apex Technologies Pvt Ltd';
  const orgTradeName = businessProfile?.name && businessProfile?.name !== businessProfile?.legal_name ? businessProfile.name : null;
  const orgGstin = businessProfile?.tax_id || '27AABCU9603R1ZM';
  const orgPan = (orgGstin && orgGstin.length >= 12) ? orgGstin.substring(2, 12) : 'AABCU9603R';
  const orgState = businessProfile?.state || 'Maharashtra';
  const orgStateCode = (orgGstin && orgGstin.length >= 2) ? orgGstin.substring(0, 2) : '27';
  const orgAddress = [
    businessProfile?.address_line1,
    businessProfile?.address_line2,
    businessProfile?.city,
    businessProfile?.state,
    businessProfile?.postal_code,
  ].filter(Boolean).join(', ') || '101, Maker Chambers V, Nariman Point, Mumbai 400021';
  const orgPhone = businessProfile?.phone || '+91 98200 12345';
  const orgEmail = businessProfile?.email || 'billing@apextech.in';
  const orgBankName = businessProfile?.bank_name || 'HDFC Bank Ltd';
  const orgBankAccount = businessProfile?.bank_account_number || '50200084729103';
  const orgBankIfsc = businessProfile?.bank_ifsc || 'HDFC0000060';
  const orgBankBranch = businessProfile?.bank_branch || 'Fort Branch, Mumbai';
  const orgUpiVpa = businessProfile?.upi_vpa || 'apextech@hdfcbank';
  const orgSignatory = businessProfile?.signatory_name || 'Authorised Signatory';
  const orgSignatoryTitle = businessProfile?.signatory_title || 'Director / Authorized Officer';

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
    } else if (activeDocType === 'work_order') {
      router.push({
        pathname: '/templates/studio',
        params: { typeId: 'work_order', layout: selectedTemplate.id },
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
   * Built specifically for each document type and bound to the active organization.
   */
  const canvasData = useMemo<DocumentCanvasData>(() => {
    switch (activeDocType) {
      case 'bill_of_supply':
        return {
          docTypeTag: 'SECTION 31(3)(C) · GST RULE 49',
          docTitle: 'BILL OF SUPPLY',
          docNumber: `${selectedTemplate.code}-0089`,
          issueDate: '15 Oct 2026',
          secondaryMeta: 'Composition Scheme · Supply: 27 (MH) · Tax: Nil',
          statutoryBanner: {
            text: 'COMPOSITION TAXABLE PERSON — NOT ELIGIBLE TO COLLECT TAX ON SUPPLIES',
            subtext: 'Issued under Section 31(3)(c) of CGST Act, 2017 read with Rule 49',
          },
          ledgerBand: [
            { label: 'BILL NO', val: `${selectedTemplate.code}-0089` },
            { label: 'DATE', val: '15-OCT-2026' },
            { label: 'DEALER TYPE', val: 'COMPOSITION' },
            { label: 'TAX CHARGE', val: 'NIL / EXEMPT' },
          ],
          partyTitle: 'BILLED TO (BUYER)',
          partyName: 'Maheshwari Trading Co.',
          partyMeta: 'GSTIN: 27AAACM4321E1Z3 · Maharashtra (27)',
          partySubMeta: 'Shop 42, APMC Market, Sector 19, Vashi, Navi Mumbai 400705',
          secondaryPartyTitle: 'DELIVERY LOCATION',
          secondaryPartyName: 'Maheshwari Central Godown',
          secondaryPartyMeta: 'Sector 26, Turbhe MIDC, Navi Mumbai - 400705',
          retailStrip: [
            { label: 'COUNTER', val: 'Counter 02' },
            { label: 'CASHIER', val: 'Staff #14' },
            { label: 'DISPATCH', val: 'Self Delivery' },
          ],
          tableHeaders: [
            { title: 'ITEM / COMMODITY', flex: 3, align: 'left' },
            { title: 'HSN', width: 68, align: 'center' },
            { title: 'QTY', width: 50, align: 'center' },
            { title: 'UNIT RATE', width: 75, align: 'right' },
            { title: 'NET AMOUNT', width: 85, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Organic Cold-Pressed Groundnut Oil', flex: 3, align: 'left' },
                { text: '150890', width: 68, align: 'center' },
                { text: '25 Tins', width: 50, align: 'center' },
                { text: '₹1,800', width: 75, align: 'right' },
                { text: '₹45,000', width: 85, align: 'right', isBold: true },
              ],
            },
            {
              cells: [
                { text: 'Raw Forest Wild Honey (500g Glass Pack)', flex: 3, align: 'left' },
                { text: '040900', width: 68, align: 'center' },
                { text: '30 Jars', width: 50, align: 'center' },
                { text: '₹500', width: 75, align: 'right' },
                { text: '₹15,000', width: 85, align: 'right', isBold: true },
              ],
            },
          ],
          subtotalLabel: 'Net Goods Value',
          subtotalValue: '₹60,000.00',
          taxRows: [{ label: 'GST (Exempt under Sec 10)', val: '₹0.00' }],
          totalLabel: 'Total Bill of Supply',
          totalAmount: '₹60,000.00',
          amountInWords: 'INR Sixty Thousand Only',
          legalDeclaration:
            'Issued in terms of Section 31(3)(c) of CGST Act, 2017 read with Rule 49. Composition taxable person cannot charge or collect any tax on supplies.',
          legalStandardBadge: 'Rule 49 & Sec 31(3)(c) Verified',
          showBankDetails: true,
        };

      case 'estimate':
        return {
          docTypeTag: 'COMMERCIAL PROPOSAL · CONTRACT ACT, 1872',
          docTitle: 'COMMERCIAL QUOTATION & ESTIMATE',
          docNumber: `${selectedTemplate.code}-0210`,
          issueDate: '15 Oct 2026',
          secondaryMeta: 'Validity: 30 Calendar Days · Rev 1.0',
          statutoryBanner: {
            text: 'COMMERCIAL PROPOSAL — SUBJECT TO CLIENT ACCEPTANCE & WRITTEN PO',
            subtext: 'Offer open for 30 calendar days from issue date under Indian Contract Act',
          },
          ledgerBand: [
            { label: 'QUOTE REF', val: `${selectedTemplate.code}-0210` },
            { label: 'DATE', val: '15-OCT-2026' },
            { label: 'VALIDITY', val: '30 DAYS (14-NOV)' },
            { label: 'REVISION', val: 'REV 1.0' },
          ],
          partyTitle: 'PREPARED FOR (PROSPECT / CLIENT)',
          partyName: 'Tata Digital Logistics Private Limited',
          partyMeta: 'Attn: VP Engineering & Procurement · Worli, Mumbai',
          partySubMeta: 'CIN: U72900MH2021PTC368192 · Contact: procurement@tatadigital.com',
          secondaryPartyTitle: 'PROJECT SCOPE REF',
          secondaryPartyName: 'Automated Ledger & Payments Integration Engine',
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
                { text: '₹45,000', width: 75, align: 'right' },
                { text: '₹45,000', width: 85, align: 'right', isBold: true },
              ],
            },
            {
              cells: [
                { text: 'ISO/IEC 7812 Card Verification & Automated Settlement Pipeline', flex: 3, align: 'left' },
                { text: '2 Weeks', width: 70, align: 'center' },
                { text: '1 SOW', width: 44, align: 'center' },
                { text: '₹15,000', width: 75, align: 'right' },
                { text: '₹15,000', width: 85, align: 'right', isBold: true },
              ],
            },
          ],
          subtotalLabel: 'Estimated Scope Subtotal',
          subtotalValue: '₹60,000.00',
          taxRows: [{ label: 'Est. GST (18%)', val: '₹10,800.00' }],
          totalLabel: 'Total Estimated Value',
          totalAmount: '₹70,800.00',
          amountInWords: 'INR Seventy Thousand Eight Hundred Only (Estimated)',
          legalDeclaration:
            'This quotation is an offer to supply services on the stated terms under Indian Contract Act, 1872. Acceptance constitutes a binding commercial agreement.',
          legalStandardBadge: 'Commercial Contract Ready',
          showBankDetails: true,
          dualSignatures: {
            primaryRole: 'Authorized Commercial Officer',
            primaryEntity: orgLegalName,
            secondaryRole: 'Client Acceptance & Signoff',
            secondaryEntity: 'Tata Digital Logistics Pvt Ltd',
          },
        };

      case 'credit_note':
        return {
          docTypeTag: 'SECTION 34 · GST RULE 53',
          docTitle: 'CREDIT NOTE',
          docNumber: `${selectedTemplate.code}-0042`,
          issueDate: '15 Oct 2026',
          secondaryMeta: 'Ref Inv: INV-2026-0098 · Reason: Rate Adjustment',
          statutoryBanner: {
            text: 'STATUTORY CREDIT MEMO — ISSUED UNDER SECTION 34(1) OF CGST ACT, 2017',
            subtext: 'Adjustment against original Tax Invoice INV-2026-0098 dated 24-Sep-2026',
          },
          ledgerBand: [
            { label: 'CREDIT NOTE NO', val: `${selectedTemplate.code}-0042` },
            { label: 'DATE', val: '15-OCT-2026' },
            { label: 'ORIGINAL INV', val: 'INV-2026-0098' },
            { label: 'REASON CODE', val: '02 - POST REBATE' },
          ],
          partyTitle: 'ISSUED TO (RECIPIENT)',
          partyName: 'Reliance Retail Limited',
          partyMeta: 'GSTIN: 27AABCR1234F1Z8 · Nariman Point, Mumbai',
          partySubMeta: 'Original Tax Invoice Value: ₹70,800 · Credit Allocation: Account Ledger',
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
                { text: '₹45,000', width: 68, align: 'right' },
                { text: '₹35,000', width: 68, align: 'right' },
                { text: '₹10,000', width: 60, align: 'right' },
                { text: '₹10,000', width: 85, align: 'right', isBold: true },
              ],
            },
            {
              cells: [
                { text: 'Service SLA Maintenance Credit (Uptime variance)', flex: 3, align: 'left' },
                { text: '₹15,000', width: 68, align: 'right' },
                { text: '₹10,000', width: 68, align: 'right' },
                { text: '₹5,000', width: 60, align: 'right' },
                { text: '₹5,000', width: 85, align: 'right', isBold: true },
              ],
            },
          ],
          subtotalLabel: 'Taxable Adjustment',
          subtotalValue: '₹15,000.00',
          taxRows: [
            { label: 'CGST Reversal (9%)', val: '₹1,350.00' },
            { label: 'SGST Reversal (9%)', val: '₹1,350.00' },
          ],
          totalLabel: 'Total Net Credit Amount',
          totalAmount: '₹17,700.00',
          amountInWords: 'INR Seventeen Thousand Seven Hundred Only',
          legalDeclaration:
            'Issued pursuant to Section 34 of the CGST Act, 2017 read with Rule 53. The tax liability of the supplier and input tax credit of the recipient stands adjusted accordingly.',
          legalStandardBadge: 'Rule 53 Credit Ledger Verified',
          showBankDetails: false,
        };

      case 'purchase_order':
        return {
          docTypeTag: 'COMMERCIAL PROCUREMENT ORDER · SALE OF GOODS ACT',
          docTitle: 'PURCHASE ORDER',
          docNumber: `${selectedTemplate.code}-0418`,
          issueDate: '15 Oct 2026',
          secondaryMeta: 'Due: 05-Nov-2026 · Net 30 Days · Door Delivery',
          statutoryBanner: {
            text: 'OFFICIAL PROCUREMENT ORDER — GOVERNED BY SALE OF GOODS ACT, 1930',
            subtext: 'Mandatory supplier inspection: all defective materials subject to immediate rejection',
          },
          ledgerBand: [
            { label: 'PO NUMBER', val: `${selectedTemplate.code}-0418` },
            { label: 'DATE', val: '15-OCT-2026' },
            { label: 'DELIVERY DUE', val: '05-NOV-2026' },
            { label: 'PAYMENT TERMS', val: 'NET 30 DAYS' },
          ],
          partyTitle: 'VENDOR / SUPPLIER',
          partyName: 'Dell Technologies India Private Limited',
          partyMeta: 'GSTIN: 29AAACD2468M1ZF · Bangalore, Karnataka (29)',
          partySubMeta: 'Prestige Tech Park, Marathahalli-Sarjapur Ring Road, Bengaluru 560103',
          secondaryPartyTitle: 'DELIVERY & RECEIVING DEPOT',
          secondaryPartyName: `${orgLegalName} — Main Receiving Depot`,
          secondaryPartyMeta: 'Plot 18, Logistics Corridor, Bhiwandi, Thane, MH - 421302',
          retailStrip: [
            { label: 'SHIPPING METHOD', val: 'Door Delivery' },
            { label: 'DELIVERY WINDOW', val: '09:00 - 18:00' },
            { label: 'PACKAGING', val: 'Anti-Static ESD' },
          ],
          tableHeaders: [
            { title: 'ITEM CODE & SPECIFICATION', flex: 3, align: 'left' },
            { title: 'PART / HSN', width: 70, align: 'center' },
            { title: 'QTY / UNIT', width: 55, align: 'center' },
            { title: 'AGREED RATE', width: 75, align: 'right' },
            { title: 'TOTAL COMMITTED', width: 85, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Dell PowerEdge R750 Rack Server (Xeon 4314)', flex: 3, align: 'left' },
                { text: '847150', width: 70, align: 'center' },
                { text: '2 Units', width: 55, align: 'center' },
                { text: '₹25,000', width: 75, align: 'right' },
                { text: '₹50,000', width: 85, align: 'right', isBold: true },
              ],
            },
            {
              cells: [
                { text: 'Cisco 10G SFP+ Optical Transceiver Module', flex: 3, align: 'left' },
                { text: '851762', width: 70, align: 'center' },
                { text: '4 Packs', width: 55, align: 'center' },
                { text: '₹2,500', width: 75, align: 'right' },
                { text: '₹10,000', width: 85, align: 'right', isBold: true },
              ],
            },
          ],
          subtotalLabel: 'Procurement Subtotal',
          subtotalValue: '₹60,000.00',
          taxRows: [{ label: 'Applicable GST (18%)', val: '₹10,800.00' }],
          totalLabel: 'Total Committed PO Value',
          totalAmount: '₹70,800.00',
          amountInWords: 'INR Seventy Thousand Eight Hundred Only',
          legalDeclaration:
            `Subject to buyer receiving inspection. Defective goods will be rejected immediately. Supplier invoice must reference PO #${selectedTemplate.code}-0418. Governed by Sale of Goods Act, 1930.`,
          legalStandardBadge: 'Procurement Law Compliant',
          showBankDetails: false,
          dualSignatures: {
            primaryRole: 'Head of Procurement',
            primaryEntity: orgLegalName,
            secondaryRole: 'Vendor Order Acceptance',
            secondaryEntity: 'Dell Technologies India Pvt Ltd',
          },
        };

      case 'work_order':
        return {
          docTypeTag: 'STATEMENT OF WORK · MASTER SERVICES CONTRACT',
          docTitle: 'WORK ORDER & STATEMENT OF WORK',
          docNumber: `${selectedTemplate.code}-0105`,
          issueDate: '15 Oct 2026',
          secondaryMeta: 'Target: 31-Dec-2026 · Master Agmt: MSA-2025-08',
          statutoryBanner: {
            text: 'LEGALLY BINDING STATEMENT OF WORK (SOW) UNDER INDIAN CONTRACT ACT, 1872',
            subtext: 'Milestone deliverables schedule governed under Master Services Agreement MSA-2025-08',
          },
          ledgerBand: [
            { label: 'WORK ORDER NO', val: `${selectedTemplate.code}-0105` },
            { label: 'EFFECTIVE DATE', val: '15-OCT-2026' },
            { label: 'TARGET END', val: '31-DEC-2026' },
            { label: 'MASTER AGMT', val: 'MSA-2025-08' },
          ],
          partyTitle: 'CLIENT / ENGAGEMENT SPONSOR',
          partyName: 'Reliance Retail Limited',
          partyMeta: 'GSTIN: 27AABCR1234F1Z8 · Nariman Point, Mumbai',
          partySubMeta: 'Project: Enterprise Offline Invoicing & Multi-Rail Payment Settlement Platform',
          secondaryPartyTitle: 'SERVICE PROVIDER (CONTRACTOR)',
          secondaryPartyName: orgLegalName,
          secondaryPartyMeta: `${orgAddress} · GSTIN: ${orgGstin}`,
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
                { text: '₹45,000', width: 85, align: 'right', isBold: true },
              ],
            },
            {
              cells: [
                { text: 'Milestone 2: Multi-Payment Settlement, UPI QR & ISO Card Engine', flex: 3, align: 'left' },
                { text: '25 Nov 2026', width: 75, align: 'center' },
                { text: '40%', width: 44, align: 'center' },
                { text: 'In Progress', width: 65, align: 'center' },
                { text: '₹60,000', width: 85, align: 'right', isBold: true },
              ],
            },
            {
              cells: [
                { text: 'Milestone 3: End-to-End Stress Verification & Production Handoff', flex: 3, align: 'left' },
                { text: '31 Dec 2026', width: 75, align: 'center' },
                { text: '30%', width: 44, align: 'center' },
                { text: 'Scheduled', width: 65, align: 'center' },
                { text: '₹45,000', width: 85, align: 'right', isBold: true },
              ],
            },
          ],
          subtotalLabel: 'Fixed-Price Contract Sum',
          subtotalValue: '₹1,50,000.00',
          taxRows: [{ label: 'Taxes', val: 'Excl. GST (Billed Separately)' }],
          totalLabel: 'Total Engagement Commitment',
          totalAmount: '₹1,50,000.00',
          amountInWords: 'INR One Lakh Fifty Thousand Only (Excluding GST)',
          legalDeclaration:
            'Execution of this Statement of Work constitutes a binding contract under the Indian Contract Act, 1872 governed by terms of Master Agreement MSA-2025-08.',
          legalStandardBadge: 'Contract Act SOW Verified',
          showBankDetails: true,
          dualSignatures: {
            primaryRole: 'Service Provider / Lead Architect',
            primaryEntity: orgLegalName,
            secondaryRole: 'Client Authorized Signatory',
            secondaryEntity: 'Reliance Retail Limited',
          },
        };

      case 'receipt':
        return {
          docTypeTag: 'PAYMENT SETTLEMENT VOUCHER · GST RULE 52',
          docTitle: 'OFFICIAL PAYMENT RECEIPT',
          docNumber: `${selectedTemplate.code}-0312`,
          issueDate: '15 Oct 2026',
          secondaryMeta: 'Settled in Full · UTR: UTR-HDFC-99201481239',
          statutoryBanner: {
            text: 'OFFICIAL PAYMENT SETTLEMENT VOUCHER — ISSUED UNDER GST RULE 52',
            subtext: 'Discharging liabilities against Tax Invoice INV-2026-0142. Outstanding balance: NIL',
          },
          ledgerBand: [
            { label: 'RECEIPT NO', val: `${selectedTemplate.code}-0312` },
            { label: 'DATE', val: '15-OCT-2026' },
            { label: 'PAYMENT MODE', val: 'BANK NEFT / UPI' },
            { label: 'BALANCE DUE', val: '₹0.00 (NIL)' },
          ],
          partyTitle: 'RECEIVED WITH THANKS FROM (PAYER)',
          partyName: 'Reliance Retail Limited',
          partyMeta: 'GSTIN: 27AABCR1234F1Z8 · Nariman Point, Mumbai',
          partySubMeta: 'Settlement Reference: Full Liquidation of Tax Invoice INV-2026-0142',
          secondaryPartyTitle: 'SETTLEMENT BANK COORDINATES',
          secondaryPartyName: `${orgBankName} — ${orgBankBranch}`,
          secondaryPartyMeta: `A/C: ••••${orgBankAccount.slice(-4)} · IFSC: ${orgBankIfsc}`,
          retailStrip: [
            { label: 'PAYMENT MODE', val: 'NEFT / RTGS Wire' },
            { label: 'UTR REF', val: 'HDFC99201481239' },
            { label: 'TIMESTAMP', val: '11:42:08 IST' },
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
                { text: '₹70,800', width: 75, align: 'right' },
                { text: '₹0.00', width: 75, align: 'right' },
                { text: '₹70,800', width: 85, align: 'right', isBold: true },
                { text: '₹0.00', width: 70, align: 'right' },
              ],
            },
          ],
          subtotalLabel: 'Total Cleared Sum',
          subtotalValue: '₹70,800.00',
          taxRows: [
            { label: 'TDS Withheld (194C)', val: '₹0.00' },
            { label: 'Outstanding Balance', val: '₹0.00 (NIL)' },
          ],
          totalLabel: 'Net Amount Received',
          totalAmount: '₹70,800.00',
          amountInWords: 'INR Seventy Thousand Eight Hundred Only (Received & Cleared)',
          legalDeclaration:
            'Official payment receipt issued in terms of GST Rule 52. Payment received in full and credited to bank account. Invoice INV-2026-0142 is fully discharged.',
          legalStandardBadge: 'Rule 52 Payment Voucher Verified',
          showBankDetails: true,
        };

      case 'invoice':
      default:
        return {
          docTypeTag: 'TAX INVOICE · ORIGINAL FOR RECIPIENT',
          docTitle: 'TAX INVOICE',
          docNumber: `${selectedTemplate.code}-0142`,
          issueDate: '15 Oct 2026',
          secondaryMeta: `Net 30 Days · Supply: ${orgStateCode} (${orgState.substring(0, 2).toUpperCase()}) · RCM: No`,
          statutoryBanner: null,
          ledgerBand: [
            { label: 'INVOICE NO', val: `${selectedTemplate.code}-0142` },
            { label: 'DATE', val: '15-OCT-2026' },
            { label: 'PLACE OF SUPPLY', val: `${orgStateCode} (${orgState.substring(0, 2).toUpperCase()})` },
            { label: 'TERMS', val: 'DUE 14-NOV' },
          ],
          partyTitle: 'BILLED TO (RECIPIENT)',
          partyName: 'Reliance Retail Limited',
          partyMeta: 'GSTIN: 27AABCR1234F1Z8 · PAN: AABCR1234F',
          partySubMeta: '12th Floor, Maker Chambers IV, Nariman Point, Mumbai 400021',
          secondaryPartyTitle: 'CONSIGNEE / SHIPPED TO',
          secondaryPartyName: 'Reliance Retail Central Logistics Hub',
          secondaryPartyMeta: 'Plot C-14, Bhiwandi Logistics Corridor, Thane, MH - 421302',
          retailStrip: [
            { label: 'VEHICLE', val: 'MH-04-AB-2041' },
            { label: 'CARRIER', val: 'BlueDart Express' },
            { label: 'DOCKET', val: 'BD-902184' },
          ],
          tableHeaders: [
            { title: 'ITEM & DESCRIPTION', flex: 3, align: 'left' },
            { title: 'HSN/SAC', width: 68, align: 'center' },
            { title: 'QTY', width: 44, align: 'center' },
            { title: 'RATE', width: 75, align: 'right' },
            { title: 'TAXABLE', width: 85, align: 'right' },
          ],
          tableRows: [
            {
              cells: [
                { text: 'Enterprise Cloud ERP Subscription', flex: 3, align: 'left' },
                { text: '998313', width: 68, align: 'center' },
                { text: '1 Yr', width: 44, align: 'center' },
                { text: '₹45,000', width: 75, align: 'right' },
                { text: '₹45,000', width: 85, align: 'right', isBold: true },
              ],
            },
            {
              cells: [
                { text: 'Statutory GST Audit & Compliance Module', flex: 3, align: 'left' },
                { text: '998314', width: 68, align: 'center' },
                { text: '1 Lic', width: 44, align: 'center' },
                { text: '₹15,000', width: 75, align: 'right' },
                { text: '₹15,000', width: 85, align: 'right', isBold: true },
              ],
            },
          ],
          subtotalLabel: 'Taxable Amount',
          subtotalValue: '₹60,000.00',
          taxRows: [
            { label: 'CGST (9.0%)', val: '₹5,400.00' },
            { label: 'SGST (9.0%)', val: '₹5,400.00' },
          ],
          totalLabel: 'Total Invoice Value',
          totalAmount: '₹70,800.00',
          amountInWords: 'INR Seventy Thousand Eight Hundred Only',
          legalDeclaration:
            'Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged. Governed by GST Rule 46.',
          legalStandardBadge: 'Rule 46 GST Compliant',
          showBankDetails: true,
        };
    }
  }, [
    activeDocType,
    selectedTemplate.code,
    orgLegalName,
    orgGstin,
    orgAddress,
    orgStateCode,
    orgState,
    orgBankName,
    orgBankAccount,
    orgBankIfsc,
    orgBankBranch,
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
                GSTIN: {orgGstin} · PAN: {orgPan}
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
                  GSTIN: {orgGstin} · {orgAddress}
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
                GSTIN: {orgGstin} · {orgAddress}
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
                  GSTIN: {orgGstin} · PAN: {orgPan} · State Code: {orgStateCode}
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
                  GSTIN: {orgGstin} · {orgAddress}
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
                  {orgBankName} · A/C: {orgBankAccount}
                </Text>
                <Text style={styles.bankDetailLine}>
                  IFSC: {orgBankIfsc} · Branch: {orgBankBranch}
                </Text>
                <Text style={styles.bankDetailLine}>UPI ID: {orgUpiVpa}</Text>
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
});

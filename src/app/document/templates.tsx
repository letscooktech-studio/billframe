/**
 * DOCUMENT TEMPLATE SELECTION SCREEN — BILLFRAME LUXURY BLACK & WHITE ARCHITECTURE
 * 
 * Key Highlights:
 * - Responsive Studio Layout: Side-by-side split screen on desktop (canvas on left, template gallery on right),
 *   and stacked touch-friendly studio on mobile.
 * - Removed redundant top document carousel to eliminate clutter.
 * - 5+ verified professional layouts for EVERY document type (Executive, Ledger, Minimal, Corporate, Retail/Supply).
 * - Visual Miniature Wireframe Schematics on every template card.
 * - "Similar Templates" recommendation row & category filters (Executive, Ledger, Minimal, Corporate, Trade/Retail).
 * - Instant live preview update on selection with zero scroll displacement.
 * - Crisp, high-contrast Black & White luxury typography and layout.
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
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { spacing, radii } from '../../design/tokens';
import { useTheme } from '../../design/ThemeContext';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';
import { BusinessProfile } from '../../domain/profile/types';

export type TemplateCategory = 'executive' | 'ledger' | 'minimal' | 'corporate' | 'supply_chain' | 'retail';

export interface DocumentTemplateItem {
  id: string;
  code: string;
  name: string;
  tagline: string;
  category: TemplateCategory;
  categoryLabel: string;
  similarTemplateIds: string[];
  highlights: string[];
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
        tagline: 'Formal masthead with vertical divider, serif headings & generous margins',
        category: 'executive',
        categoryLabel: 'Executive',
        similarTemplateIds: ['gst_corporate', 'gst_minimal'],
        highlights: ['Formal Brand Masthead', 'Vertical Rule Layout', 'Standard GST Tally'],
      },
      {
        id: 'gst_ledger',
        code: 'GST-02',
        name: 'Structured Ledger',
        tagline: 'High-density itemized grid with 4-compartment metadata band',
        category: 'ledger',
        categoryLabel: 'Ledger',
        similarTemplateIds: ['gst_supply_chain', 'gst_corporate'],
        highlights: ['4-Band Metadata', 'High-Density Item Grid', 'HSN/SAC Breakup'],
      },
      {
        id: 'gst_minimal',
        code: 'GST-03',
        name: 'Minimal Professional',
        tagline: 'Clean borderless typography with bold numbering & quiet whitespace',
        category: 'minimal',
        categoryLabel: 'Minimal',
        similarTemplateIds: ['gst_executive', 'gst_ledger'],
        highlights: ['Hero Numbering', 'Borderless Item List', 'Modern Swiss Aesthetic'],
      },
      {
        id: 'gst_corporate',
        code: 'GST-04',
        name: 'Corporate B2B',
        tagline: 'Dual buyer/consignee panels & enterprise tax breakdown block',
        category: 'corporate',
        categoryLabel: 'Corporate',
        similarTemplateIds: ['gst_executive', 'gst_supply_chain'],
        highlights: ['Buyer & Consignee Boxes', 'Statutory Stamp Area', 'Multi-Rate Tax Summary'],
      },
      {
        id: 'gst_supply_chain',
        code: 'GST-05',
        name: 'Trade Supply Chain',
        tagline: 'Logistics transport dispatch strip & multi-depot shipping tally',
        category: 'supply_chain',
        categoryLabel: 'Trade',
        similarTemplateIds: ['gst_ledger', 'gst_corporate'],
        highlights: ['Vehicle & LR Details', 'Warehouse Dispatch', 'Packing List Alignment'],
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
        highlights: ['Statutory Composition Notice', 'Executive Divider', 'Exempt Supply Summary'],
      },
      {
        id: 'bos_ledger',
        code: 'BOS-02',
        name: 'Structured Trade Ledger',
        tagline: 'High-density tabular grid for nil-rated & exempt trade inventory',
        category: 'ledger',
        categoryLabel: 'Ledger',
        similarTemplateIds: ['bos_retail', 'bos_corporate'],
        highlights: ['Itemized Grid', 'Nil-Rate Indicator', '4-Field Reference Band'],
      },
      {
        id: 'bos_minimal',
        code: 'BOS-03',
        name: 'Modern Minimalist',
        tagline: 'Clean borderless typography with compact statutory declaration banner',
        category: 'minimal',
        categoryLabel: 'Minimal',
        similarTemplateIds: ['bos_executive', 'bos_retail'],
        highlights: ['Compact Notice', 'Quiet Whitespace', 'Bold Document #'],
      },
      {
        id: 'bos_corporate',
        code: 'BOS-04',
        name: 'Corporate Exempt B2B',
        tagline: 'Dual entity billing boxes for enterprise tax-exempt trade contracts',
        category: 'corporate',
        categoryLabel: 'Corporate',
        similarTemplateIds: ['bos_executive', 'bos_ledger'],
        highlights: ['Dual Recipient Panels', 'Corporate Contract Ref', 'Exempt Declaration'],
      },
      {
        id: 'bos_retail',
        code: 'BOS-05',
        name: 'Retail Counter Bill',
        tagline: 'Fast over-the-counter billing format with non-taxable retail tally',
        category: 'retail',
        categoryLabel: 'Retail',
        similarTemplateIds: ['bos_minimal', 'bos_ledger'],
        highlights: ['Counter POS Layout', 'Instant Cash Tally', 'Customer Receipt Slip'],
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
        similarTemplateIds: ['est_proforma', 'est_minimal'],
        highlights: ['Milestone Pricing', 'Scope Description', 'Client Acceptance Block'],
      },
      {
        id: 'est_itemized',
        code: 'EST-02',
        name: 'Itemized Quotation',
        tagline: 'Detailed unit rates with revision versioning and validity terms',
        category: 'ledger',
        categoryLabel: 'Ledger',
        similarTemplateIds: ['est_proforma', 'est_corporate'],
        highlights: ['Unit Rate Tally', 'Validity Period', 'Revision Control'],
      },
      {
        id: 'est_minimal',
        code: 'EST-03',
        name: 'Modern Minimal Quote',
        tagline: 'Crisp borderless layout with bold total and acceptance timeline',
        category: 'minimal',
        categoryLabel: 'Minimal',
        similarTemplateIds: ['est_executive', 'est_itemized'],
        highlights: ['Clean Typography', 'Prominent Quote Total', 'Terms Summary'],
      },
      {
        id: 'est_proforma',
        code: 'EST-04',
        name: 'Commercial Proforma',
        tagline: 'Advance wire coordinates & international commercial trade numbering',
        category: 'corporate',
        categoryLabel: 'Corporate',
        similarTemplateIds: ['est_executive', 'est_itemized'],
        highlights: ['Bank Wire Details', 'Proforma Trade Stamp', 'Advance Deposit Terms'],
      },
      {
        id: 'est_corporate',
        code: 'EST-05',
        name: 'Enterprise Tender Quote',
        tagline: 'Dual buyer/consignee specification for formal procurement tenders',
        category: 'corporate',
        categoryLabel: 'Corporate',
        similarTemplateIds: ['est_proforma', 'est_executive'],
        highlights: ['Dual Entity Details', 'Tender Reference', 'Formal Authorization'],
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
        similarTemplateIds: ['cn_ledger', 'cn_corporate'],
        highlights: ['Original Invoice Cross-Ref', 'Executive Masthead', 'Net Adjustment Block'],
      },
      {
        id: 'cn_ledger',
        code: 'CN-02',
        name: 'Tax Credit Note',
        tagline: 'Rule 53 GST invoice reversal & itemized net tax credit ledger',
        category: 'ledger',
        categoryLabel: 'Ledger',
        similarTemplateIds: ['cn_executive', 'cn_corporate'],
        highlights: ['Rule 53 Compliant', 'Itemized GST Reversal', '4-Point Metadata Band'],
      },
      {
        id: 'cn_minimal',
        code: 'CN-03',
        name: 'Modern Minimal Note',
        tagline: 'Quiet typography with bold credit balance & reason for issuance',
        category: 'minimal',
        categoryLabel: 'Minimal',
        similarTemplateIds: ['cn_executive', 'cn_retail'],
        highlights: ['Hero Credit Amount', 'Reason for Credit', 'Clean Signature'],
      },
      {
        id: 'cn_corporate',
        code: 'DN-01',
        name: 'Corporate Debit Memo',
        tagline: 'Enterprise rate revision claim & revised payable balance breakdown',
        category: 'corporate',
        categoryLabel: 'Corporate',
        similarTemplateIds: ['cn_ledger', 'cn_executive'],
        highlights: ['Dual Party Panels', 'Revised Payable Balance', 'Debit Adjustment'],
      },
      {
        id: 'cn_retail',
        code: 'CN-04',
        name: 'Counter Return Slip',
        tagline: 'Fast point-of-sale customer return slip with credit voucher reference',
        category: 'retail',
        categoryLabel: 'Retail',
        similarTemplateIds: ['cn_minimal', 'cn_ledger'],
        highlights: ['POS Return Slip', 'Instant Credit Voucher', 'Store Credit Stamp'],
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
        tagline: 'Formal procurement order with vendor instructions & signoff',
        category: 'executive',
        categoryLabel: 'Executive',
        similarTemplateIds: ['po_corporate', 'po_ledger'],
        highlights: ['Vendor Instructions', 'Executive Letterhead', 'Signoff Block'],
      },
      {
        id: 'po_ledger',
        code: 'PO-02',
        name: 'Industrial Supply Order',
        tagline: 'Technical bill of materials, inspection criteria & delivery schedule',
        category: 'ledger',
        categoryLabel: 'Ledger',
        similarTemplateIds: ['po_executive', 'po_corporate'],
        highlights: ['Bill of Materials', 'Delivery Schedule', 'Technical Criteria'],
      },
      {
        id: 'po_minimal',
        code: 'PO-03',
        name: 'Modern Minimal PO',
        tagline: 'Clean procurement order with bold PO number and concise terms',
        category: 'minimal',
        categoryLabel: 'Minimal',
        similarTemplateIds: ['po_executive', 'po_ledger'],
        highlights: ['Bold PO Number', 'Concise Vendor Terms', 'Clean Table'],
      },
      {
        id: 'po_corporate',
        code: 'PO-04',
        name: 'Corporate Multi-Site PO',
        tagline: 'Dual billing & warehouse shipping panels with tax tally',
        category: 'corporate',
        categoryLabel: 'Corporate',
        similarTemplateIds: ['po_executive', 'po_ledger'],
        highlights: ['Ship-To Depot Panel', 'Enterprise Billing', 'Vendor Tax ID'],
      },
      {
        id: 'po_retail',
        code: 'PO-05',
        name: 'Stock Replenishment Order',
        tagline: 'Fast restocking order tally for retail inventory & distribution',
        category: 'retail',
        categoryLabel: 'Retail',
        similarTemplateIds: ['po_ledger', 'po_minimal'],
        highlights: ['SKU Barcode Tally', 'Fast Restock Units', 'Warehouse Bay Ref'],
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
        tagline: 'Formal engagement terms, milestone schedule & legal signature block',
        category: 'executive',
        categoryLabel: 'Executive',
        similarTemplateIds: ['wo_corporate', 'wo_minimal'],
        highlights: ['Master Retainer Terms', 'Dual Signature Blocks', 'Milestone Schedule'],
      },
      {
        id: 'wo_ledger',
        code: 'WO-02',
        name: 'Technical Service Order',
        tagline: 'Scope deliverables, materials provided & completion signoff',
        category: 'ledger',
        categoryLabel: 'Ledger',
        similarTemplateIds: ['wo_corporate', 'wo_executive'],
        highlights: ['Itemized Milestones', 'Deliverables Breakdown', 'Signoff Criteria'],
      },
      {
        id: 'wo_minimal',
        code: 'WO-03',
        name: 'Modern Statement of Work',
        tagline: 'Clean agile deliverables list with transparent hourly / milestone billing',
        category: 'minimal',
        categoryLabel: 'Minimal',
        similarTemplateIds: ['wo_executive', 'wo_ledger'],
        highlights: ['Agile Deliverables', 'Sprint Timelines', 'Modern Whitespace'],
      },
      {
        id: 'wo_corporate',
        code: 'WO-04',
        name: 'Enterprise SOW Contract',
        tagline: 'Dual party liability, acceptance criteria & formal governance',
        category: 'corporate',
        categoryLabel: 'Corporate',
        similarTemplateIds: ['wo_executive', 'wo_ledger'],
        highlights: ['Client & Vendor Panels', 'Governance Terms', 'Formal Verification'],
      },
      {
        id: 'wo_retail',
        code: 'WO-05',
        name: 'Field Service Dispatch',
        tagline: 'On-site engineer report, equipment checklist & customer signoff',
        category: 'retail',
        categoryLabel: 'Retail',
        similarTemplateIds: ['wo_minimal', 'wo_ledger'],
        highlights: ['Site Equipment Log', 'Work Performed Log', 'Customer Signoff'],
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
        tagline: 'Bank UTR reference, payment mode & invoice clearance voucher',
        category: 'executive',
        categoryLabel: 'Executive',
        similarTemplateIds: ['rec_corporate', 'rec_minimal'],
        highlights: ['Bank Transaction Seal', 'Invoice Clearance Ref', 'Formal Masthead'],
      },
      {
        id: 'rec_ledger',
        code: 'REC-02',
        name: 'Account Settlement Ledger',
        tagline: 'Full balance clearance & statement account reconciliation tally',
        category: 'ledger',
        categoryLabel: 'Ledger',
        similarTemplateIds: ['rec_executive', 'rec_corporate'],
        highlights: ['Full Balance Clearance', 'Account Statement Tally', '4-Band Grid'],
      },
      {
        id: 'rec_minimal',
        code: 'REC-03',
        name: 'Modern Payment Receipt',
        tagline: 'Ultra-clean receipt with bold amount and payment method badge',
        category: 'minimal',
        categoryLabel: 'Minimal',
        similarTemplateIds: ['rec_executive', 'rec_retail'],
        highlights: ['Hero Amount Display', 'UPI / Mode Badge', 'Clean Stamp'],
      },
      {
        id: 'rec_corporate',
        code: 'REC-04',
        name: 'Corporate Remittance Advice',
        tagline: 'Dual entity billing details, TDS tax deduction & UTR settlement',
        category: 'corporate',
        categoryLabel: 'Corporate',
        similarTemplateIds: ['rec_executive', 'rec_ledger'],
        highlights: ['Dual Entity Details', 'TDS Deduction Breakdown', 'Remittance Seal'],
      },
      {
        id: 'rec_retail',
        code: 'REC-05',
        name: 'Counter POS Receipt',
        tagline: 'Compact retail customer receipt slip with QR clearance stamp',
        category: 'retail',
        categoryLabel: 'Retail',
        similarTemplateIds: ['rec_minimal', 'rec_ledger'],
        highlights: ['POS Receipt Slip', 'UPI QR Clearance', 'Customer Copy'],
      },
    ],
  },
};

/**
 * Miniature Wireframe Schematic Thumbnail
 * Renders a high-contrast visual diagram of the layout anatomy for each template.
 */
function TemplateWireframeThumbnail({
  category,
  isSelected,
}: {
  category: TemplateCategory;
  isSelected: boolean;
}) {
  const fg = isSelected ? '#FFFFFF' : '#94A3B8';
  const borderCol = isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.25)';
  const fillCol = isSelected ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)';

  return (
    <View style={[styles.wireframeBox, { borderColor: borderCol, backgroundColor: fillCol }]}>
      {/* Executive: Top header split by vertical line */}
      {category === 'executive' && (
        <View style={styles.wfInner}>
          <View style={styles.wfExecTop}>
            <View style={[styles.wfLine, { width: '42%', height: 5, backgroundColor: fg }]} />
            <View style={[styles.wfDivider, { backgroundColor: fg }]} />
            <View style={[styles.wfLine, { width: '42%', height: 4, backgroundColor: fg }]} />
          </View>
          <View style={[styles.wfRule, { backgroundColor: fg, marginVertical: 3 }]} />
          <View style={[styles.wfLine, { width: '60%', height: 3, backgroundColor: fg, marginBottom: 2 }]} />
          <View style={[styles.wfLine, { width: '100%', height: 2, backgroundColor: fg, opacity: 0.5, marginBottom: 2 }]} />
          <View style={[styles.wfLine, { width: '100%', height: 2, backgroundColor: fg, opacity: 0.5, marginBottom: 2 }]} />
          <View style={[styles.wfLine, { width: '100%', height: 2, backgroundColor: fg, opacity: 0.5, marginBottom: 4 }]} />
          <View style={styles.wfBottomRow}>
            <View style={[styles.wfLine, { width: '30%', height: 3, backgroundColor: fg, opacity: 0.4 }]} />
            <View style={[styles.wfLine, { width: '35%', height: 5, backgroundColor: fg }]} />
          </View>
        </View>
      )}

      {/* Ledger: Top bar + 4-compartment grid band + table */}
      {category === 'ledger' && (
        <View style={styles.wfInner}>
          <View style={styles.wfLedgerTop}>
            <View style={[styles.wfLine, { width: '45%', height: 4, backgroundColor: fg }]} />
            <View style={[styles.wfLine, { width: '35%', height: 4, backgroundColor: fg }]} />
          </View>
          <View style={[styles.wfGridBand, { borderColor: fg }]}>
            <View style={[styles.wfGridCol, { borderRightColor: fg }]} />
            <View style={[styles.wfGridCol, { borderRightColor: fg }]} />
            <View style={[styles.wfGridCol, { borderRightColor: fg }]} />
            <View style={styles.wfGridCol} />
          </View>
          <View style={[styles.wfLine, { width: '100%', height: 2, backgroundColor: fg, opacity: 0.6, marginVertical: 2 }]} />
          <View style={[styles.wfLine, { width: '100%', height: 2, backgroundColor: fg, opacity: 0.6, marginBottom: 2 }]} />
          <View style={[styles.wfLine, { width: '100%', height: 2, backgroundColor: fg, opacity: 0.6, marginBottom: 3 }]} />
          <View style={styles.wfBottomRow}>
            <View style={[styles.wfLine, { width: '30%', height: 3, backgroundColor: fg, opacity: 0.4 }]} />
            <View style={[styles.wfTotalBox, { borderColor: fg }]} />
          </View>
        </View>
      )}

      {/* Minimal: Clean single lines, large number on top right */}
      {category === 'minimal' && (
        <View style={styles.wfInner}>
          <View style={styles.wfMinTop}>
            <View style={{ flex: 1 }}>
              <View style={[styles.wfLine, { width: '55%', height: 4, backgroundColor: fg, marginBottom: 2 }]} />
              <View style={[styles.wfLine, { width: '40%', height: 2, backgroundColor: fg, opacity: 0.5 }]} />
            </View>
            <View style={[styles.wfLine, { width: 14, height: 10, backgroundColor: fg }]} />
          </View>
          <View style={{ height: 6 }} />
          <View style={[styles.wfLine, { width: '100%', height: 1.5, backgroundColor: fg, opacity: 0.5, marginBottom: 3 }]} />
          <View style={[styles.wfLine, { width: '100%', height: 1.5, backgroundColor: fg, opacity: 0.5, marginBottom: 3 }]} />
          <View style={[styles.wfLine, { width: '100%', height: 1.5, backgroundColor: fg, opacity: 0.5, marginBottom: 5 }]} />
          <View style={{ alignItems: 'flex-end' }}>
            <View style={[styles.wfLine, { width: '40%', height: 4, backgroundColor: fg }]} />
          </View>
        </View>
      )}

      {/* Corporate: Dual side-by-side party boxes */}
      {category === 'corporate' && (
        <View style={styles.wfInner}>
          <View style={[styles.wfLine, { width: '50%', height: 4, backgroundColor: fg, marginBottom: 4 }]} />
          <View style={styles.wfCorpPanels}>
            <View style={[styles.wfPanel, { borderColor: fg }]} />
            <View style={[styles.wfPanel, { borderColor: fg }]} />
          </View>
          <View style={[styles.wfLine, { width: '100%', height: 2, backgroundColor: fg, opacity: 0.5, marginVertical: 3 }]} />
          <View style={[styles.wfLine, { width: '100%', height: 2, backgroundColor: fg, opacity: 0.5, marginBottom: 3 }]} />
          <View style={styles.wfBottomRow}>
            <View style={[styles.wfLine, { width: '35%', height: 3, backgroundColor: fg, opacity: 0.4 }]} />
            <View style={[styles.wfLine, { width: '35%', height: 5, backgroundColor: fg }]} />
          </View>
        </View>
      )}

      {/* Supply Chain / Trade / Retail: Transport strip or counter layout */}
      {(category === 'supply_chain' || category === 'retail') && (
        <View style={styles.wfInner}>
          <View style={styles.wfSupplyTop}>
            <View style={[styles.wfLine, { width: '45%', height: 4, backgroundColor: fg }]} />
            <View style={[styles.wfBadgeDot, { backgroundColor: fg }]} />
          </View>
          <View style={[styles.wfStrip, { borderColor: fg }]}>
            <View style={[styles.wfLine, { width: '30%', height: 2, backgroundColor: fg }]} />
            <View style={[styles.wfLine, { width: '30%', height: 2, backgroundColor: fg }]} />
            <View style={[styles.wfLine, { width: '30%', height: 2, backgroundColor: fg }]} />
          </View>
          <View style={[styles.wfLine, { width: '100%', height: 2, backgroundColor: fg, opacity: 0.5, marginVertical: 2 }]} />
          <View style={[styles.wfLine, { width: '100%', height: 2, backgroundColor: fg, opacity: 0.5, marginBottom: 3 }]} />
          <View style={styles.wfBottomRow}>
            <View style={[styles.wfLine, { width: '25%', height: 3, backgroundColor: fg, opacity: 0.4 }]} />
            <View style={[styles.wfLine, { width: '40%', height: 5, backgroundColor: fg }]} />
          </View>
        </View>
      )}
    </View>
  );
}

export default function DocumentTemplateSelectionScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ type?: string; templateId?: string }>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  // Desktop Responsive Mode
  const isDesktop = width >= 880;

  const [activeDocType] = useState<string>(() => {
    const rawType = (searchParams.type || 'invoice').toLowerCase();
    if (rawType === 'challan' || rawType === 'delivery_challan') return 'invoice';
    return DOCUMENT_TYPE_CONFIGS[rawType] ? rawType : 'invoice';
  });

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

  // Category filter in the gallery
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const selectedTemplate = useMemo(() => {
    return (
      activeConfig.templates.find((t) => t.id === selectedTemplateId) ||
      activeConfig.templates[0]
    );
  }, [activeConfig, selectedTemplateId]);

  // Filtered templates list based on category filter
  const visibleTemplates = useMemo(() => {
    if (selectedCategoryFilter === 'all') return activeConfig.templates;
    return activeConfig.templates.filter((t) => t.category === selectedCategoryFilter);
  }, [activeConfig, selectedCategoryFilter]);

  // Similar templates resolved items
  const similarTemplates = useMemo(() => {
    return activeConfig.templates.filter(
      (t) => t.id !== selectedTemplate.id && selectedTemplate.similarTemplateIds.includes(t.id)
    );
  }, [activeConfig, selectedTemplate]);

  // Organization Profile for realistic live preview
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await BusinessProfileRepository.getActiveProfile();
        if (profile) setBusinessProfile(profile);
      } catch {
        // Fallback to sample studio
      }
    };
    loadProfile();
  }, []);

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

  const orgName = businessProfile?.name || 'Apex Studio Pvt Ltd';
  const orgGstin = businessProfile?.tax_id || '27AABCU9603R1ZM';
  const orgAddress = businessProfile?.address_line1 || '101, Maker Chambers V, Nariman Point, Mumbai';

  const filterTabs = [
    { key: 'all', label: 'All Designs' },
    { key: 'executive', label: 'Executive' },
    { key: 'ledger', label: 'Ledger' },
    { key: 'minimal', label: 'Minimal' },
    { key: 'corporate', label: 'Corporate' },
    { key: 'retail', label: 'Retail / Trade' },
  ];

  /* ───────────────────────────────────────────────────────────────────
     RENDER DOCUMENT SHEET CANVAS (Used both on Desktop & Mobile)
  ─────────────────────────────────────────────────────────────────── */
  const renderDocumentCanvas = () => {
    const isComposition = activeDocType === 'bill_of_supply';
    const isReceipt = activeDocType === 'receipt';
    const isCreditNote = activeDocType === 'credit_note';

    return (
      <View style={styles.documentCanvas}>
        {/* 1. Category Header: Executive */}
        {selectedTemplate.category === 'executive' && (
          <View style={styles.execHeader}>
            <View style={styles.execLeft}>
              <Text style={styles.docBrandName}>{orgName}</Text>
              <Text style={styles.docBrandMeta}>GSTIN: {orgGstin}</Text>
              <Text style={styles.docBrandMeta}>{orgAddress}</Text>
            </View>
            <View style={styles.execDivider} />
            <View style={styles.execRight}>
              <Text style={styles.docTitleMain}>{activeConfig.shortName.toUpperCase()}</Text>
              <Text style={styles.docNumberMain}>#{selectedTemplate.code}-2026-001</Text>
              <Text style={styles.docDateMeta}>Date: 15 Oct 2026</Text>
              <Text style={styles.docDateMeta}>Terms: Net 30 Days</Text>
            </View>
          </View>
        )}

        {/* 2. Category Header: Ledger */}
        {selectedTemplate.category === 'ledger' && (
          <View style={styles.ledgerHeader}>
            <View style={styles.ledgerTopRow}>
              <Text style={styles.docBrandName}>{orgName}</Text>
              <Text style={styles.docTitleMain}>{activeConfig.shortName.toUpperCase()}</Text>
            </View>
            <View style={styles.ledgerBand}>
              <View style={styles.ledgerBandCol}>
                <Text style={styles.ledgerBandLabel}>DOC NUMBER</Text>
                <Text style={styles.ledgerBandVal}>{selectedTemplate.code}-001</Text>
              </View>
              <View style={styles.ledgerBandCol}>
                <Text style={styles.ledgerBandLabel}>DATE</Text>
                <Text style={styles.ledgerBandVal}>15-OCT-2026</Text>
              </View>
              <View style={styles.ledgerBandCol}>
                <Text style={styles.ledgerBandLabel}>STATE CODE</Text>
                <Text style={styles.ledgerBandVal}>27 (MAH)</Text>
              </View>
              <View style={[styles.ledgerBandCol, { borderRightWidth: 0 }]}>
                <Text style={styles.ledgerBandLabel}>TERMS</Text>
                <Text style={styles.ledgerBandVal}>DUE 14-NOV</Text>
              </View>
            </View>
          </View>
        )}

        {/* 3. Category Header: Minimal */}
        {selectedTemplate.category === 'minimal' && (
          <View style={styles.minimalHeader}>
            <View>
              <Text style={styles.docBrandName}>{orgName}</Text>
              <Text style={styles.docBrandMeta}>GSTIN: {orgGstin}</Text>
              <Text style={styles.docBrandMeta}>{orgAddress}</Text>
            </View>
            <View style={styles.minimalRight}>
              <Text style={styles.minimalNumber}>#001</Text>
              <Text style={styles.minimalDate}>15 Oct 2026 · Net 30</Text>
            </View>
          </View>
        )}

        {/* 4. Category Header: Corporate */}
        {selectedTemplate.category === 'corporate' && (
          <View style={styles.corporateHeader}>
            <View style={styles.corpTopRow}>
              <Text style={styles.docBrandName}>{orgName}</Text>
              <View style={styles.corpBadgePill}>
                <Text style={styles.corpBadgeText}>ORIGINAL FOR RECIPIENT</Text>
              </View>
            </View>
            <View style={styles.corpDualPanels}>
              <View style={styles.corpPanel}>
                <Text style={styles.corpPanelTag}>BUYER / RECIPIENT</Text>
                <Text style={styles.corpPartyName}>Reliance Retail Limited</Text>
                <Text style={styles.corpPartyGstin}>GSTIN: 27AABCR1234F1Z8</Text>
              </View>
              <View style={[styles.corpPanel, { marginLeft: 10 }]}>
                <Text style={styles.corpPanelTag}>CONSIGNEE / SHIP TO</Text>
                <Text style={styles.corpPartyName}>Reliance Logistics Hub</Text>
                <Text style={styles.corpPartyGstin}>Bhiwandi Depot, MH 421302</Text>
              </View>
            </View>
          </View>
        )}

        {/* 5. Category Header: Supply Chain / Retail */}
        {(selectedTemplate.category === 'supply_chain' || selectedTemplate.category === 'retail') && (
          <View style={styles.supplyHeader}>
            <View style={styles.supplyTopRow}>
              <Text style={styles.docBrandName}>{orgName}</Text>
              <Text style={styles.docTitleMain}>{activeConfig.shortName.toUpperCase()}</Text>
            </View>
            <View style={styles.supplyTransportStrip}>
              <View style={styles.transportCol}>
                <Text style={styles.transportLabel}>VEHICLE NO.</Text>
                <Text style={styles.transportVal}>MH-04-AB-2041</Text>
              </View>
              <View style={styles.transportCol}>
                <Text style={styles.transportLabel}>TRANSPORTER</Text>
                <Text style={styles.transportVal}>BlueDart Express</Text>
              </View>
              <View style={[styles.transportCol, { borderRightWidth: 0 }]}>
                <Text style={styles.transportLabel}>LR / DOCKET</Text>
                <Text style={styles.transportVal}>BD-902184</Text>
              </View>
            </View>
          </View>
        )}

        {/* Composition Mandatory Banner */}
        {isComposition && (
          <View style={styles.compDeclarationBanner}>
            <Text style={styles.compDeclarationText}>
              COMPOSITION TAXABLE PERSON — NOT ELIGIBLE TO COLLECT TAX ON SUPPLIES
            </Text>
          </View>
        )}

        {/* Credit Note Cross-Reference Box */}
        {isCreditNote && (
          <View style={styles.crossRefBox}>
            <Text style={styles.crossRefLabel}>ORIGINAL INVOICE REFERENCE:</Text>
            <Text style={styles.crossRefText}>INV-2026-084 dated 28-Sep-2026 · Reason: Rate Adjustment / Goods Return</Text>
          </View>
        )}

        {/* Party Box (Spacious & Clean, when not dual corporate panel) */}
        {selectedTemplate.category !== 'corporate' && (
          <View style={styles.partyBox}>
            <Text style={styles.partyBoxLabel}>BILLED TO:</Text>
            <Text style={styles.partyName}>Reliance Retail Limited</Text>
            <Text style={styles.partyMeta}>GSTIN: 27AABCR1234F1Z8 · Nariman Point, Mumbai, Maharashtra 400021</Text>
          </View>
        )}

        {/* High-Visibility Item Table */}
        <View style={styles.tableBlock}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableTh, { flex: 3 }]}>DESCRIPTION</Text>
            <Text style={[styles.tableTh, { width: 44, textAlign: 'center' }]}>QTY</Text>
            <Text style={[styles.tableTh, { width: 80, textAlign: 'right' }]}>RATE</Text>
            <Text style={[styles.tableTh, { width: 90, textAlign: 'right' }]}>AMOUNT</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableTd, { flex: 3, fontWeight: '700' }]}>
              Enterprise Cloud Architecture
            </Text>
            <Text style={[styles.tableTd, { width: 44, textAlign: 'center' }]}>1</Text>
            <Text style={[styles.tableTd, { width: 80, textAlign: 'right' }]}>₹45,000</Text>
            <Text style={[styles.tableTd, { width: 90, textAlign: 'right', fontWeight: '800' }]}>
              ₹45,000
            </Text>
          </View>

          <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.tableTd, { flex: 3, fontWeight: '700' }]}>
              Security & Compliance Audit
            </Text>
            <Text style={[styles.tableTd, { width: 44, textAlign: 'center' }]}>1</Text>
            <Text style={[styles.tableTd, { width: 80, textAlign: 'right' }]}>₹15,000</Text>
            <Text style={[styles.tableTd, { width: 90, textAlign: 'right', fontWeight: '800' }]}>
              ₹15,000
            </Text>
          </View>
        </View>

        {/* High-Visibility Totals & Authorized Signatory */}
        <View style={styles.bottomSummaryRow}>
          <View style={styles.signatorySide}>
            <View style={styles.signLine} />
            <Text style={styles.signatoryLabel}>Authorized Signatory</Text>
            <Text style={styles.signatoryOrg}>{orgName}</Text>
          </View>

          <View style={styles.totalsSide}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalVal}>₹60,000.00</Text>
            </View>
            {!isComposition && !isReceipt && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>GST (18%)</Text>
                <Text style={styles.totalVal}>₹10,800.00</Text>
              </View>
            )}
            <View style={styles.grandTotalBlock}>
              <Text style={styles.grandTotalLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.grandTotalVal}>
                {isComposition || isReceipt ? '₹60,000.00' : '₹70,800.00'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  /* ───────────────────────────────────────────────────────────────────
     RENDER TEMPLATE GALLERY & SIMILAR TEMPLATES
  ─────────────────────────────────────────────────────────────────── */
  const renderTemplateGallery = () => {
    return (
      <View style={styles.galleryContainer}>
        {/* ── Category Filter Tabs ── */}
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {filterTabs.map((tab) => {
              const isSelected = selectedCategoryFilter === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={[
                    styles.filterPill,
                    isSelected ? styles.filterPillSelected : styles.filterPillUnselected,
                  ]}
                  onPress={() => setSelectedCategoryFilter(tab.key)}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isSelected ? styles.filterPillTextSelected : styles.filterPillTextUnselected,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Similar Templates Feature (Direct user requirement) ── */}
        {similarTemplates.length > 0 && (
          <View style={styles.similarSection}>
            <View style={styles.similarHeader}>
              <Sparkles size={14} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.similarTitle}>SIMILAR LAYOUTS TO {selectedTemplate.code}:</Text>
            </View>
            <View style={styles.similarChipsRow}>
              {similarTemplates.map((simTmpl) => (
                <Pressable
                  key={simTmpl.id}
                  style={styles.similarChip}
                  onPress={() => setSelectedTemplateId(simTmpl.id)}
                >
                  <Text style={styles.similarChipCode}>{simTmpl.code}</Text>
                  <Text style={styles.similarChipName}>{simTmpl.name}</Text>
                  <ArrowRight size={12} color="#FFFFFF" strokeWidth={2} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── Template Cards List ── */}
        <View style={styles.templatesList}>
          {visibleTemplates.map((tmpl) => {
            const isSelected = tmpl.id === selectedTemplateId;
            return (
              <Pressable
                key={tmpl.id}
                style={({ pressed }) => [
                  styles.templateCard,
                  isSelected ? styles.templateCardSelected : styles.templateCardUnselected,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={() => setSelectedTemplateId(tmpl.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                {/* Visual Miniature Wireframe Schematic */}
                <TemplateWireframeThumbnail
                  category={tmpl.category}
                  isSelected={isSelected}
                />

                {/* Card Main Info */}
                <View style={styles.cardMain}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardBadge}>
                      <Text style={styles.cardBadgeText}>{tmpl.code}</Text>
                    </View>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{tmpl.categoryLabel}</Text>
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {tmpl.name}
                    </Text>
                  </View>

                  <Text style={styles.cardTagline} numberOfLines={2}>
                    {tmpl.tagline}
                  </Text>

                  {/* Highlights tags */}
                  <View style={styles.highlightsRow}>
                    {tmpl.highlights.slice(0, 2).map((hl, idx) => (
                      <View key={idx} style={styles.highlightPill}>
                        <Text style={styles.highlightText}>✓ {hl}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Radio Selector */}
                <View style={styles.radioArea}>
                  {isSelected ? (
                    <View style={styles.radioSelected}>
                      <Check size={14} color="#000000" strokeWidth={3} />
                    </View>
                  ) : (
                    <View style={styles.radioUnselected} />
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#000000' }]} edges={['top', 'left', 'right']}>
      {/* ── Top Header Navigation (Clean, No Redundant Options Everywhere) ── */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/documents');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {activeConfig.title}
            </Text>
            <View style={styles.headerCountBadge}>
              <Text style={styles.headerCountText}>
                {activeConfig.templates.length} Verified Layouts
              </Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {activeConfig.subtitle}
          </Text>
        </View>

        {isDesktop && (
          <Pressable
            style={styles.headerActionBtn}
            onPress={handleCreateDocument}
          >
            <Text style={styles.headerActionBtnText}>Draft Document</Text>
            <ArrowRight size={15} color="#000000" strokeWidth={2.5} />
          </Pressable>
        )}
      </View>

      {/* ── Main Viewport Layout (Desktop Split-Studio vs Mobile Stack) ── */}
      {isDesktop ? (
        /* DESKTOP SPLIT STUDIO */
        <View style={styles.desktopStudioContainer}>
          {/* Left Panel: Sticky Live Canvas Preview */}
          <View style={styles.desktopPreviewPanel}>
            <View style={styles.previewTopBar}>
              <View style={styles.previewBadge}>
                <ShieldCheck size={14} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.previewBadgeText}>{selectedTemplate.code}</Text>
              </View>
              <Text style={styles.previewCategoryLabel}>
                {selectedTemplate.name.toUpperCase()}
              </Text>
              <View style={styles.previewSpacer} />
              <View style={styles.previewFormatTag}>
                <Layers size={12} color="#94A3B8" />
                <Text style={styles.previewFormatText}>A4 Master Layout</Text>
              </View>
            </View>

            <ScrollView
              style={styles.desktopCanvasScroll}
              contentContainerStyle={styles.desktopCanvasContent}
              showsVerticalScrollIndicator={false}
            >
              {renderDocumentCanvas()}
            </ScrollView>
          </View>

          {/* Right Panel: Template Picker & Similar Layouts */}
          <View style={styles.desktopGalleryPanel}>
            <View style={styles.galleryHeaderBar}>
              <Text style={styles.galleryHeading}>
                CHOOSE TEMPLATE LAYOUT
              </Text>
              <Text style={styles.gallerySubheading}>
                Select layout to update preview instantly
              </Text>
            </View>

            <ScrollView
              style={styles.desktopGalleryScroll}
              contentContainerStyle={[
                styles.desktopGalleryContent,
                { paddingBottom: insets.bottom + 90 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {renderTemplateGallery()}
            </ScrollView>

            {/* Pinned Desktop Bottom Drawer Action */}
            <View style={[styles.desktopBottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <View style={styles.desktopBottomInfo}>
                <View style={styles.bottomBadgeRow}>
                  <View style={styles.bottomPill}>
                    <Text style={styles.bottomPillText}>{selectedTemplate.code}</Text>
                  </View>
                  <Text style={styles.bottomTemplateName} numberOfLines={1}>
                    {selectedTemplate.name}
                  </Text>
                </View>
                <Text style={styles.bottomStatusText}>
                  Rule 46 Verified • Ready to draft
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.createButton,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleCreateDocument}
              >
                <Text style={styles.createButtonText}>Create Document</Text>
                <ArrowRight size={17} color="#000000" strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        /* MOBILE STACK STUDIO */
        <ScrollView
          style={styles.mobileScrollArea}
          contentContainerStyle={[
            styles.mobileScrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Preview Bar */}
          <View style={styles.previewTopBar}>
            <View style={styles.previewBadge}>
              <ShieldCheck size={14} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.previewBadgeText}>{selectedTemplate.code}</Text>
            </View>
            <Text style={styles.previewCategoryLabel}>
              {selectedTemplate.name.toUpperCase()}
            </Text>
            <View style={styles.previewSpacer} />
            <Text style={styles.previewStatusHint}>
              Live Preview
            </Text>
          </View>

          {/* Document Sheet Canvas */}
          {renderDocumentCanvas()}

          {/* Section Divider */}
          <View style={styles.mobileSectionDivider}>
            <Text style={styles.mobileSectionTitle}>
              AVAILABLE TEMPLATES · {activeConfig.templates.length} DESIGNS
            </Text>
          </View>

          {/* Template Gallery */}
          {renderTemplateGallery()}
        </ScrollView>
      )}

      {/* ── Fixed Floating Bottom Bar (Mobile Only) ── */}
      {!isDesktop && (
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.bottomBarContent}>
            <View style={styles.bottomBarInfo}>
              <View style={styles.bottomBadgeRow}>
                <View style={styles.bottomPill}>
                  <Text style={styles.bottomPillText}>{selectedTemplate.code}</Text>
                </View>
                <Text style={styles.bottomTemplateName} numberOfLines={1}>
                  {selectedTemplate.name}
                </Text>
              </View>
              <Text style={styles.bottomStatusText}>
                Rule 46 Verified · Ready to draft
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.createButton,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleCreateDocument}
              accessibilityRole="button"
              accessibilityLabel={`Create ${activeConfig.title} with ${selectedTemplate.name}`}
            >
              <Text style={styles.createButtonText}>Create Document</Text>
              <ArrowRight size={17} color="#000000" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#000000',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  headerCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.button,
  },
  headerActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },

  /* Desktop Studio Layout */
  desktopStudioContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#000000',
  },
  desktopPreviewPanel: {
    flex: 1.25,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#08090D',
    paddingHorizontal: 28,
    paddingTop: 18,
  },
  desktopCanvasScroll: {
    flex: 1,
  },
  desktopCanvasContent: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  desktopGalleryPanel: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  galleryHeaderBar: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  galleryHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  gallerySubheading: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
  },
  desktopGalleryScroll: {
    flex: 1,
  },
  desktopGalleryContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  desktopBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0A0C12',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.7)',
      },
      default: {},
    }),
  },
  desktopBottomInfo: {
    flex: 1,
    marginRight: 16,
  },

  /* Mobile Stack Layout */
  mobileScrollArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  mobileScrollContent: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  mobileSectionDivider: {
    width: '100%',
    maxWidth: 720,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 10,
    marginBottom: 6,
  },
  mobileSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },

  /* Preview Header & Canvas */
  previewTopBar: {
    width: '100%',
    maxWidth: 720,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E2330',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 10,
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  previewCategoryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: 0.8,
  },
  previewSpacer: {
    flex: 1,
  },
  previewFormatTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  previewFormatText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  previewStatusHint: {
    fontSize: 12,
    color: '#64748B',
  },
  documentCanvas: {
    width: '100%',
    maxWidth: 680,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 24,
    marginBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.75)',
      },
      default: {
        elevation: 8,
      },
    }),
  },

  /* Category Anatomy: Executive */
  execHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#000000',
    marginBottom: 16,
  },
  execLeft: {
    flex: 1.2,
  },
  execDivider: {
    width: 1.5,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 14,
  },
  execRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  docBrandName: {
    fontSize: 19,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  docBrandMeta: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  docTitleMain: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.8,
  },
  docNumberMain: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    marginTop: 2,
    marginBottom: 3,
  },
  docDateMeta: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },

  /* Category Anatomy: Ledger */
  ledgerHeader: {
    marginBottom: 16,
  },
  ledgerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ledgerBand: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#F8FAFC',
  },
  ledgerBandCol: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRightWidth: 1.5,
    borderRightColor: '#000000',
  },
  ledgerBandLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  ledgerBandVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },

  /* Category Anatomy: Minimal */
  minimalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  minimalRight: {
    alignItems: 'flex-end',
  },
  minimalNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.5,
  },
  minimalDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  /* Category Anatomy: Corporate */
  corporateHeader: {
    marginBottom: 16,
  },
  corpTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  corpBadgePill: {
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  corpBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  corpDualPanels: {
    flexDirection: 'row',
  },
  corpPanel: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#000000',
    padding: 10,
    borderRadius: 6,
  },
  corpPanelTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  corpPartyName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 2,
  },
  corpPartyGstin: {
    fontSize: 10,
    color: '#475569',
  },

  /* Category Anatomy: Supply Chain */
  supplyHeader: {
    marginBottom: 16,
  },
  supplyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  supplyTransportStrip: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 6,
  },
  transportCol: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRightWidth: 1.5,
    borderRightColor: '#000000',
  },
  transportLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  transportVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },

  /* Specific Banners */
  compDeclarationBanner: {
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 14,
  },
  compDeclarationText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
  },
  crossRefBox: {
    backgroundColor: '#F1F5F9',
    borderLeftWidth: 3,
    borderLeftColor: '#000000',
    padding: 8,
    marginBottom: 14,
  },
  crossRefLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  crossRefText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    marginTop: 2,
  },

  /* Party Box */
  partyBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  partyBoxLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  partyName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 2,
  },
  partyMeta: {
    fontSize: 11,
    color: '#475569',
  },

  /* Item Table */
  tableBlock: {
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableTh: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableTd: {
    fontSize: 12,
    color: '#000000',
  },

  /* Bottom Summary */
  bottomSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 8,
  },
  signatorySide: {
    flex: 1,
    maxWidth: 180,
  },
  signLine: {
    height: 1.5,
    backgroundColor: '#000000',
    marginBottom: 5,
  },
  signatoryLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  signatoryOrg: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
    marginTop: 2,
  },
  totalsSide: {
    width: 175,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 11,
    color: '#475569',
  },
  totalVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  grandTotalBlock: {
    backgroundColor: '#000000',
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  grandTotalLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  grandTotalVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  /* Gallery & Filtering */
  galleryContainer: {
    width: '100%',
  },
  filterBar: {
    marginBottom: 14,
  },
  filterContent: {
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.full,
  },
  filterPillSelected: {
    backgroundColor: '#FFFFFF',
  },
  filterPillUnselected: {
    backgroundColor: '#11131A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  filterPillText: {
    fontSize: 12,
  },
  filterPillTextSelected: {
    color: '#000000',
    fontWeight: '800',
  },
  filterPillTextUnselected: {
    color: '#94A3B8',
    fontWeight: '600',
  },

  /* Similar Layouts Feature */
  similarSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radii.card,
    padding: 12,
    marginBottom: 16,
  },
  similarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  similarTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.8,
  },
  similarChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  similarChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  similarChipCode: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  similarChipName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },

  /* Template Cards */
  templatesList: {
    gap: 12,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.card,
    borderWidth: 1.5,
  },
  templateCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderColor: '#FFFFFF',
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 1px #FFFFFF, 0 6px 20px rgba(255, 255, 255, 0.08)',
      },
      default: {},
    }),
  },
  templateCardUnselected: {
    backgroundColor: '#0C0D14',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },

  /* Wireframe Thumbnail */
  wireframeBox: {
    width: 48,
    height: 64,
    borderRadius: 4,
    borderWidth: 1,
    padding: 3,
    marginRight: 14,
    justifyContent: 'center',
  },
  wfInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  wfLine: {
    borderRadius: 1,
  },
  wfDivider: {
    width: 1,
    height: '100%',
  },
  wfRule: {
    width: '100%',
    height: 1,
  },
  wfExecTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 12,
    alignItems: 'center',
  },
  wfLedgerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  wfGridBand: {
    flexDirection: 'row',
    borderWidth: 0.8,
    height: 8,
    marginVertical: 2,
  },
  wfGridCol: {
    flex: 1,
    borderRightWidth: 0.8,
  },
  wfTotalBox: {
    width: 16,
    height: 8,
    borderWidth: 0.8,
  },
  wfMinTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wfCorpPanels: {
    flexDirection: 'row',
    gap: 2,
  },
  wfPanel: {
    flex: 1,
    height: 10,
    borderWidth: 0.8,
    borderRadius: 1,
  },
  wfSupplyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  wfBadgeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  wfStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 0.8,
    paddingHorizontal: 2,
    paddingVertical: 1,
    marginVertical: 2,
  },
  wfBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  /* Card Content */
  cardMain: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardBadge: {
    backgroundColor: '#1E2330',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#CBD5E1',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  cardTagline: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 6,
  },
  highlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  highlightPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  highlightText: {
    fontSize: 10,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  radioArea: {
    marginLeft: 12,
  },
  radioSelected: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioUnselected: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#475569',
  },

  /* Floating Bottom Bar (Mobile) */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#08090D',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 14,
    paddingHorizontal: spacing.lg,
    ...Platform.select({
      web: {
        boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.8)',
      },
      default: {
        elevation: 16,
      },
    }),
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  bottomBarInfo: {
    flex: 1,
    marginRight: 14,
  },
  bottomBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  bottomPill: {
    backgroundColor: '#1E2330',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bottomPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bottomTemplateName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bottomStatusText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radii.button,
  },
  createButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
});

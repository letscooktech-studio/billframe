/**
 * DOCUMENT TEMPLATE SELECTION STUDIO — BILLFRAME LUXURY MINIMALIST ARCHITECTURE
 * 
 * Design Invariants:
 * - Generous Whitespace & Breathing Room: Airy page margins, spacious line items, soft visual breathing room.
 * - Refined Modern Typography: Clean font weights (300/400/500/600), subtle letter-spacing, zero heavy font overload.
 * - No Text Clutter: Removed noisy bullet tags, redundant badges, and text crowding.
 * - Delicate Hairline Geometry: Fine borders (#E4E4E7 / rgba(255,255,255,0.08)) instead of harsh solid black blocks.
 * - Responsive Studio: Side-by-side split canvas on desktop, elegant spacious stack on mobile.
 * - Interactive Similar Layouts: Quick, quiet chips to browse related aesthetics.
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

export default function DocumentTemplateSelectionScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ type?: string; templateId?: string }>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

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

  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await BusinessProfileRepository.getActiveProfile();
        if (profile) setBusinessProfile(profile);
      } catch {
        // Safe fallback
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

  const orgName = businessProfile?.name || 'Apex Studio';
  const orgGstin = businessProfile?.tax_id || '27AABCU9603R1ZM';
  const orgAddress = businessProfile?.address_line1 || '101, Maker Chambers V, Mumbai';

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'executive', label: 'Executive' },
    { key: 'minimal', label: 'Minimal' },
    { key: 'ledger', label: 'Ledger' },
    { key: 'corporate', label: 'Corporate' },
  ];

  /* ───────────────────────────────────────────────────────────────────
     RENDER DOCUMENT CANVAS (Airy Luxury Stationery Aesthetics)
  ─────────────────────────────────────────────────────────────────── */
  const renderDocumentCanvas = () => {
    const isComposition = activeDocType === 'bill_of_supply';
    const isReceipt = activeDocType === 'receipt';
    const isCreditNote = activeDocType === 'credit_note';

    return (
      <View style={styles.documentCanvas}>
        {/* Category Header: Executive */}
        {selectedTemplate.category === 'executive' && (
          <View style={styles.execHeader}>
            <View style={styles.execLeft}>
              <Text style={styles.docBrandName}>{orgName}</Text>
              <Text style={styles.docBrandMeta}>GSTIN: {orgGstin}</Text>
              <Text style={styles.docBrandMeta}>{orgAddress}</Text>
            </View>
            <View style={styles.execDivider} />
            <View style={styles.execRight}>
              <Text style={styles.docTitleMain}>{activeConfig.shortName}</Text>
              <Text style={styles.docNumberMain}>#{selectedTemplate.code}-001</Text>
              <Text style={styles.docDateMeta}>15 Oct 2026 · Net 30</Text>
            </View>
          </View>
        )}

        {/* Category Header: Ledger */}
        {selectedTemplate.category === 'ledger' && (
          <View style={styles.ledgerHeader}>
            <View style={styles.ledgerTopRow}>
              <Text style={styles.docBrandName}>{orgName}</Text>
              <Text style={styles.docTitleMain}>{activeConfig.shortName}</Text>
            </View>
            <View style={styles.ledgerBand}>
              <View style={styles.ledgerBandCol}>
                <Text style={styles.ledgerBandLabel}>NUMBER</Text>
                <Text style={styles.ledgerBandVal}>{selectedTemplate.code}-001</Text>
              </View>
              <View style={styles.ledgerBandCol}>
                <Text style={styles.ledgerBandLabel}>DATE</Text>
                <Text style={styles.ledgerBandVal}>15-OCT-2026</Text>
              </View>
              <View style={styles.ledgerBandCol}>
                <Text style={styles.ledgerBandLabel}>STATE</Text>
                <Text style={styles.ledgerBandVal}>27 (MH)</Text>
              </View>
              <View style={[styles.ledgerBandCol, { borderRightWidth: 0 }]}>
                <Text style={styles.ledgerBandLabel}>TERMS</Text>
                <Text style={styles.ledgerBandVal}>DUE 14-NOV</Text>
              </View>
            </View>
          </View>
        )}

        {/* Category Header: Minimal */}
        {selectedTemplate.category === 'minimal' && (
          <View style={styles.minimalHeader}>
            <View>
              <Text style={styles.docBrandName}>{orgName}</Text>
              <Text style={styles.docBrandMeta}>GSTIN: {orgGstin} · {orgAddress}</Text>
            </View>
            <View style={styles.minimalRight}>
              <Text style={styles.minimalNumber}>#001</Text>
              <Text style={styles.minimalDate}>15 Oct 2026</Text>
            </View>
          </View>
        )}

        {/* Category Header: Corporate */}
        {selectedTemplate.category === 'corporate' && (
          <View style={styles.corporateHeader}>
            <View style={styles.corpTopRow}>
              <Text style={styles.docBrandName}>{orgName}</Text>
              <Text style={styles.corpTitleTag}>{activeConfig.shortName.toUpperCase()}</Text>
            </View>
            <View style={styles.corpDualPanels}>
              <View style={styles.corpPanel}>
                <Text style={styles.corpPanelTag}>BILLED TO</Text>
                <Text style={styles.corpPartyName}>Reliance Retail Ltd</Text>
                <Text style={styles.corpPartyMeta}>GSTIN: 27AABCR1234F1Z8</Text>
              </View>
              <View style={[styles.corpPanel, { marginLeft: 16 }]}>
                <Text style={styles.corpPanelTag}>SHIPPED TO</Text>
                <Text style={styles.corpPartyName}>Reliance Logistics Hub</Text>
                <Text style={styles.corpPartyMeta}>Bhiwandi Depot, MH</Text>
              </View>
            </View>
          </View>
        )}

        {/* Category Header: Retail / Trade */}
        {selectedTemplate.category === 'retail' && (
          <View style={styles.supplyHeader}>
            <View style={styles.supplyTopRow}>
              <Text style={styles.docBrandName}>{orgName}</Text>
              <Text style={styles.docTitleMain}>{activeConfig.shortName}</Text>
            </View>
            <View style={styles.supplyTransportStrip}>
              <View style={styles.transportCol}>
                <Text style={styles.transportLabel}>VEHICLE</Text>
                <Text style={styles.transportVal}>MH-04-AB-2041</Text>
              </View>
              <View style={styles.transportCol}>
                <Text style={styles.transportLabel}>CARRIER</Text>
                <Text style={styles.transportVal}>BlueDart Express</Text>
              </View>
              <View style={[styles.transportCol, { borderRightWidth: 0 }]}>
                <Text style={styles.transportLabel}>DOCKET</Text>
                <Text style={styles.transportVal}>BD-902184</Text>
              </View>
            </View>
          </View>
        )}

        {/* Composition Statutory Banner */}
        {isComposition && (
          <View style={styles.compBanner}>
            <Text style={styles.compBannerText}>
              Composition Taxable Person — Not eligible to collect tax on supplies
            </Text>
          </View>
        )}

        {/* Credit Note Reference */}
        {isCreditNote && (
          <View style={styles.crossRefStrip}>
            <Text style={styles.crossRefText}>Ref Invoice: INV-2026-084 dated 28-Sep-2026 · Goods Return</Text>
          </View>
        )}

        {/* Billed To (Clean, generous spacing) */}
        {selectedTemplate.category !== 'corporate' && (
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>BILLED TO</Text>
            <Text style={styles.partyName}>Reliance Retail Limited</Text>
            <Text style={styles.partyMeta}>GSTIN: 27AABCR1234F1Z8 · Nariman Point, Mumbai</Text>
          </View>
        )}

        {/* Clean Line Items Table with Airy Padding */}
        <View style={styles.tableWrap}>
          <View style={styles.tableHead}>
            <Text style={[styles.thCell, { flex: 3 }]}>DESCRIPTION</Text>
            <Text style={[styles.thCell, { width: 50, textAlign: 'center' }]}>QTY</Text>
            <Text style={[styles.thCell, { width: 90, textAlign: 'right' }]}>RATE</Text>
            <Text style={[styles.thCell, { width: 100, textAlign: 'right' }]}>AMOUNT</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tdDesc, { flex: 3 }]}>Enterprise Cloud Architecture</Text>
            <Text style={[styles.tdMeta, { width: 50, textAlign: 'center' }]}>1</Text>
            <Text style={[styles.tdMeta, { width: 90, textAlign: 'right' }]}>₹45,000</Text>
            <Text style={[styles.tdAmount, { width: 100, textAlign: 'right' }]}>₹45,000</Text>
          </View>

          <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.tdDesc, { flex: 3 }]}>Security & Compliance Audit</Text>
            <Text style={[styles.tdMeta, { width: 50, textAlign: 'center' }]}>1</Text>
            <Text style={[styles.tdMeta, { width: 90, textAlign: 'right' }]}>₹15,000</Text>
            <Text style={[styles.tdAmount, { width: 100, textAlign: 'right' }]}>₹15,000</Text>
          </View>
        </View>

        {/* Totals & Signature with Airy Whitespace */}
        <View style={styles.summaryWrap}>
          <View style={styles.signatureBox}>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>Authorized Signatory</Text>
            <Text style={styles.sigOrg}>{orgName}</Text>
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.subtotalLabel}>Subtotal</Text>
              <Text style={styles.subtotalVal}>₹60,000.00</Text>
            </View>
            {!isComposition && !isReceipt && (
              <View style={styles.totalsRow}>
                <Text style={styles.subtotalLabel}>GST (18%)</Text>
                <Text style={styles.subtotalVal}>₹10,800.00</Text>
              </View>
            )}
            <View style={styles.grandTotalDivider} />
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalTitle}>Total</Text>
              <Text style={styles.grandTotalAmount}>
                {isComposition || isReceipt ? '₹60,000.00' : '₹70,800.00'}
              </Text>
            </View>
          </View>
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
          <Text style={styles.screenHeaderSub}>{activeConfig.templates.length} curated layouts</Text>
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
              <Text style={styles.canvasDocTag}>{selectedTemplate.code} · {selectedTemplate.name}</Text>
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
                <Text style={styles.pinnedStatus}>Rule 46 verified</Text>
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
            <Text style={styles.mobileCanvasTitle}>{selectedTemplate.name}</Text>
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
  canvasDocTag: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A1A1AA',
    letterSpacing: 0.2,
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
    color: '#71717A',
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

  /* Document Canvas (Paper Sheet) */
  documentCanvas: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    padding: 36,
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
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
    marginBottom: 24,
  },
  execLeft: {
    flex: 1.2,
  },
  execDivider: {
    width: 1,
    backgroundColor: '#E4E4E7',
    marginHorizontal: 20,
  },
  execRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  docBrandName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#09090B',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  docBrandMeta: {
    fontSize: 11,
    color: '#71717A',
    lineHeight: 16,
  },
  docTitleMain: {
    fontSize: 14,
    fontWeight: '600',
    color: '#09090B',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  docNumberMain: {
    fontSize: 12,
    fontWeight: '500',
    color: '#27272A',
    marginTop: 3,
    marginBottom: 3,
  },
  docDateMeta: {
    fontSize: 11,
    color: '#71717A',
  },

  /* Ledger Anatomy */
  ledgerHeader: {
    marginBottom: 22,
  },
  ledgerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: '#E4E4E7',
  },
  ledgerBandLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  ledgerBandVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#09090B',
  },

  /* Minimal Anatomy */
  minimalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 22,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  minimalRight: {
    alignItems: 'flex-end',
  },
  minimalNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#09090B',
    letterSpacing: -0.5,
  },
  minimalDate: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },

  /* Corporate Anatomy */
  corporateHeader: {
    marginBottom: 22,
  },
  corpTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  corpTitleTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 1,
  },
  corpDualPanels: {
    flexDirection: 'row',
  },
  corpPanel: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    padding: 12,
    borderRadius: 6,
  },
  corpPanelTag: {
    fontSize: 9,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  corpPartyName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#09090B',
    marginBottom: 2,
  },
  corpPartyMeta: {
    fontSize: 10,
    color: '#71717A',
  },

  /* Supply Chain Anatomy */
  supplyHeader: {
    marginBottom: 22,
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
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: '#E4E4E7',
  },
  transportLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  transportVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#09090B',
  },

  /* Banners */
  compBanner: {
    backgroundColor: '#F4F4F5',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginBottom: 20,
    alignItems: 'center',
  },
  compBannerText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#52525B',
  },
  crossRefStrip: {
    backgroundColor: '#F4F4F5',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 20,
  },
  crossRefText: {
    fontSize: 10,
    color: '#52525B',
  },

  /* Billed To */
  partyBox: {
    marginBottom: 24,
  },
  partyLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  partyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#09090B',
    marginBottom: 2,
  },
  partyMeta: {
    fontSize: 11,
    color: '#71717A',
  },

  /* Line Items Table */
  tableWrap: {
    marginBottom: 24,
  },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
    paddingBottom: 8,
    marginBottom: 4,
  },
  thCell: {
    fontSize: 9,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  tdDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: '#09090B',
  },
  tdMeta: {
    fontSize: 12,
    color: '#71717A',
  },
  tdAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#09090B',
  },

  /* Summary & Signatory */
  summaryWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 12,
  },
  signatureBox: {
    flex: 1,
    maxWidth: 160,
  },
  sigLine: {
    height: 1,
    backgroundColor: '#D4D4D8',
    marginBottom: 6,
  },
  sigLabel: {
    fontSize: 10,
    color: '#71717A',
  },
  sigOrg: {
    fontSize: 11,
    fontWeight: '600',
    color: '#09090B',
    marginTop: 2,
  },
  totalsBox: {
    width: 160,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subtotalLabel: {
    fontSize: 11,
    color: '#71717A',
  },
  subtotalVal: {
    fontSize: 11,
    color: '#09090B',
    fontWeight: '500',
  },
  grandTotalDivider: {
    height: 1,
    backgroundColor: '#E4E4E7',
    marginVertical: 6,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  grandTotalTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#09090B',
    letterSpacing: 0.5,
  },
  grandTotalAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#09090B',
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

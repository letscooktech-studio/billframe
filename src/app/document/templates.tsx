/**
 * DOCUMENT TEMPLATE SELECTION SCREEN — BILLFRAME LUXURY BLACK & WHITE ARCHITECTURE
 * 
 * Strict invariants:
 * - High-visibility black & white professional typographic hierarchy.
 * - Delivery Challan removed. Bill of Supply and all core business documents included.
 * - Live architectural preview with large, crisp, legible fonts, bold headers, and distinct structural geometry.
 * - Downside template options with high-visibility badges, bold titles, and clean radio selectors.
 * - Direct routing to document edit/build screen on selection.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
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
} from 'lucide-react-native';
import { spacing, radii, MIN_TOUCH_TARGET } from '../../design/tokens';
import { useTheme } from '../../design/ThemeContext';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';
import { BusinessProfile } from '../../domain/profile/types';

export interface DocumentTemplateItem {
  id: string;
  code: string;
  name: string;
  tagline: string;
  category: 'executive' | 'ledger' | 'minimal' | 'corporate' | 'supply_chain' | 'composition';
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
    subtitle: 'Commercial tax invoice with GST & Rule 46 compliance',
    icon: FileText,
    defaultTemplateId: 'gst_executive',
    templates: [
      {
        id: 'gst_executive',
        code: 'GST-01',
        name: 'Executive Letterhead',
        tagline: 'Classic brand masthead with vertical divider and generous margins',
        category: 'executive',
      },
      {
        id: 'gst_ledger',
        code: 'GST-02',
        name: 'Structured Ledger',
        tagline: 'High-density itemized grid with 4-compartment metadata band',
        category: 'ledger',
      },
      {
        id: 'gst_minimal',
        code: 'GST-03',
        name: 'Minimal Professional',
        tagline: 'Clean borderless typography with bold numbering & quiet whitespace',
        category: 'minimal',
      },
      {
        id: 'gst_corporate',
        code: 'GST-04',
        name: 'Corporate B2B',
        tagline: 'Dual buyer/consignee panels & enterprise tax breakdown',
        category: 'corporate',
      },
      {
        id: 'gst_supply_chain',
        code: 'GST-05',
        name: 'Trade Supply Chain',
        tagline: 'Logistics transport dispatch strip & multi-depot shipping tally',
        category: 'supply_chain',
      },
    ],
  },
  bill_of_supply: {
    id: 'bill_of_supply',
    title: 'Bill of Supply',
    shortName: 'Bill of Supply',
    subtitle: 'GST Section 31(3)(c) for composition dealers & exempt supplies',
    icon: FileSpreadsheet,
    defaultTemplateId: 'bos_standard',
    templates: [
      {
        id: 'bos_standard',
        code: 'BOS-01',
        name: 'Composition Dealer Bill',
        tagline: 'Composition levy layout with statutory non-taxable declaration',
        category: 'composition',
      },
      {
        id: 'bos_compact',
        code: 'BOS-02',
        name: 'Exempt Trade Bill',
        tagline: 'Structured commercial invoice for nil-rated & exempt trade items',
        category: 'ledger',
      },
    ],
  },
  estimate: {
    id: 'estimate',
    title: 'Estimate / Quotation',
    shortName: 'Estimate',
    subtitle: 'Cost proposals, quotations and milestone estimates',
    icon: Briefcase,
    defaultTemplateId: 'est_executive',
    templates: [
      {
        id: 'est_executive',
        code: 'EST-01',
        name: 'Executive Proposal',
        tagline: 'Scope narrative with milestone pricing schedule and signoff',
        category: 'executive',
      },
      {
        id: 'est_itemized',
        code: 'EST-02',
        name: 'Itemized Quotation',
        tagline: 'Detailed unit rates with revision versioning and validity terms',
        category: 'ledger',
      },
      {
        id: 'est_proforma',
        code: 'EST-03',
        name: 'Commercial Proforma',
        tagline: 'Advance wire coordinates & proforma commercial trade numbering',
        category: 'corporate',
      },
    ],
  },
  credit_note: {
    id: 'credit_note',
    title: 'Credit Note / Debit Note',
    shortName: 'Credit Note',
    subtitle: 'Sales returns, tax adjustments & customer refunds',
    icon: RotateCcw,
    defaultTemplateId: 'credit_tax',
    templates: [
      {
        id: 'credit_tax',
        code: 'CN-01',
        name: 'Tax Credit Note',
        tagline: 'Rule 53 GST invoice reversal & net tax credit adjustment',
        category: 'ledger',
      },
      {
        id: 'debit_memo',
        code: 'DN-01',
        name: 'Commercial Debit Memo',
        tagline: 'Rate revision claim & revised payable balance breakdown',
        category: 'corporate',
      },
    ],
  },
  purchase_order: {
    id: 'purchase_order',
    title: 'Purchase Order',
    shortName: 'Purchase Order',
    subtitle: 'Official procurement orders sent to vendors & suppliers',
    icon: ShoppingBag,
    defaultTemplateId: 'po_corporate',
    templates: [
      {
        id: 'po_corporate',
        code: 'PO-01',
        name: 'Corporate Purchase Order',
        tagline: 'Vendor shipping instructions & formal procurement authorization',
        category: 'corporate',
      },
      {
        id: 'po_supply',
        code: 'PO-02',
        name: 'Industrial Supply Order',
        tagline: 'Technical bill of materials, inspection criteria & schedule',
        category: 'supply_chain',
      },
    ],
  },
  work_order: {
    id: 'work_order',
    title: 'Work Order & Contract',
    shortName: 'Work Order',
    subtitle: 'Scope of work, milestone deliverables & legal signoff',
    icon: ClipboardList,
    defaultTemplateId: 'wo_service',
    templates: [
      {
        id: 'wo_service',
        code: 'WO-01',
        name: 'Service Work Order',
        tagline: 'Scope deliverables, materials provided & completion signoff',
        category: 'ledger',
      },
      {
        id: 'wo_contract',
        code: 'WO-02',
        name: 'Retainer Agreement',
        tagline: 'Formal engagement terms, milestone schedule & legal signature block',
        category: 'executive',
      },
    ],
  },
  receipt: {
    id: 'receipt',
    title: 'Payment Receipt',
    shortName: 'Receipt',
    subtitle: 'Official payment acknowledgment & settlement vouchers',
    icon: Receipt,
    defaultTemplateId: 'receipt_payment',
    templates: [
      {
        id: 'receipt_payment',
        code: 'REC-01',
        name: 'Payment Voucher',
        tagline: 'Bank UTR reference, payment mode & invoice clearance voucher',
        category: 'minimal',
      },
      {
        id: 'receipt_settlement',
        code: 'REC-02',
        name: 'Account Settlement',
        tagline: 'Full balance clearance & statement account reconciliation',
        category: 'corporate',
      },
    ],
  },
};

export default function DocumentTemplateSelectionScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ type?: string; templateId?: string }>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [activeDocType, setActiveDocType] = useState<string>(() => {
    const rawType = (searchParams.type || 'invoice').toLowerCase();
    // Delivery challan redirect to invoice if requested
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

  const selectedTemplate = useMemo(() => {
    return (
      activeConfig.templates.find((t) => t.id === selectedTemplateId) ||
      activeConfig.templates[0]
    );
  }, [activeConfig, selectedTemplateId]);

  // Business profile for live preview
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await BusinessProfileRepository.getActiveProfile();
        if (profile) setBusinessProfile(profile);
      } catch (err) {
        // Fallback to demo org
      }
    };
    loadProfile();
  }, []);

  const handleSelectType = (typeKey: string) => {
    setActiveDocType(typeKey);
    const cfg = DOCUMENT_TYPE_CONFIGS[typeKey];
    if (cfg) {
      setSelectedTemplateId(cfg.defaultTemplateId);
    }
  };

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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#000000' }]} edges={['top', 'left', 'right']}>
      {/* ── Top Header Navigation ── */}
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
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {activeConfig.title}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {activeConfig.subtitle}
          </Text>
        </View>
      </View>

      {/* ── Document Types Horizontal Carousel ── */}
      <View style={styles.carouselContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
        >
          {Object.values(DOCUMENT_TYPE_CONFIGS).map((cfg) => {
            const isSelected = cfg.id === activeDocType;
            return (
              <Pressable
                key={cfg.id}
                style={[
                  styles.typePill,
                  isSelected ? styles.typePillSelected : styles.typePillUnselected,
                ]}
                onPress={() => handleSelectType(cfg.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.typePillText,
                    isSelected ? styles.typePillTextSelected : styles.typePillTextUnselected,
                  ]}
                >
                  {cfg.shortName}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Main Scroll View: High-Visibility Architectural Live Preview + Downside Templates ── */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 96 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentConstrained}>
          {/* ── Section Header ── */}
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
              High-Fidelity Preview
            </Text>
          </View>

          {/* ── Architectural High-Visibility Document Sheet ── */}
          <View style={styles.documentCanvas}>
            {/* Header Anatomy: Executive */}
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
                  <Text style={styles.docNumberMain}>#DOC-2026-001</Text>
                  <Text style={styles.docDateMeta}>Date: 15 Oct 2026</Text>
                  <Text style={styles.docDateMeta}>Terms: Net 30 Days</Text>
                </View>
              </View>
            )}

            {/* Header Anatomy: Ledger */}
            {selectedTemplate.category === 'ledger' && (
              <View style={styles.ledgerHeader}>
                <View style={styles.ledgerTopRow}>
                  <Text style={styles.docBrandName}>{orgName}</Text>
                  <Text style={styles.docTitleMain}>{activeConfig.shortName.toUpperCase()}</Text>
                </View>
                <View style={styles.ledgerBand}>
                  <View style={styles.ledgerBandCol}>
                    <Text style={styles.ledgerBandLabel}>DOC NUMBER</Text>
                    <Text style={styles.ledgerBandVal}>INV-2026-001</Text>
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
                    <Text style={styles.ledgerBandLabel}>PAYMENT</Text>
                    <Text style={styles.ledgerBandVal}>DUE 14-NOV</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Header Anatomy: Minimal */}
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

            {/* Header Anatomy: Corporate */}
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
                  <View style={[styles.corpPanel, { marginLeft: 12 }]}>
                    <Text style={styles.corpPanelTag}>CONSIGNEE / SHIP TO</Text>
                    <Text style={styles.corpPartyName}>Reliance Logistics Hub</Text>
                    <Text style={styles.corpPartyGstin}>Bhiwandi Depot, MH 421302</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Header Anatomy: Supply Chain */}
            {selectedTemplate.category === 'supply_chain' && (
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

            {/* Header Anatomy: Composition Bill */}
            {selectedTemplate.category === 'composition' && (
              <View style={styles.compHeader}>
                <View style={styles.compTopRow}>
                  <Text style={styles.docBrandName}>{orgName}</Text>
                  <Text style={styles.docTitleMain}>BILL OF SUPPLY</Text>
                </View>
                <View style={styles.compDeclarationBanner}>
                  <Text style={styles.compDeclarationText}>
                    COMPOSITION TAXABLE PERSON — NOT ELIGIBLE TO COLLECT TAX ON SUPPLIES
                  </Text>
                </View>
              </View>
            )}

            {/* Billed To Box (Spacious & Clean) */}
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
                <Text style={[styles.tableTh, { width: 50, textAlign: 'center' }]}>QTY</Text>
                <Text style={[styles.tableTh, { width: 90, textAlign: 'right' }]}>RATE</Text>
                <Text style={[styles.tableTh, { width: 100, textAlign: 'right' }]}>AMOUNT</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tableTd, { flex: 3, fontWeight: '700' }]}>
                  Enterprise Cloud Architecture
                </Text>
                <Text style={[styles.tableTd, { width: 50, textAlign: 'center' }]}>1</Text>
                <Text style={[styles.tableTd, { width: 90, textAlign: 'right' }]}>₹45,000</Text>
                <Text style={[styles.tableTd, { width: 100, textAlign: 'right', fontWeight: '800' }]}>
                  ₹45,000
                </Text>
              </View>

              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.tableTd, { flex: 3, fontWeight: '700' }]}>
                  Security & Compliance Audit
                </Text>
                <Text style={[styles.tableTd, { width: 50, textAlign: 'center' }]}>1</Text>
                <Text style={[styles.tableTd, { width: 90, textAlign: 'right' }]}>₹15,000</Text>
                <Text style={[styles.tableTd, { width: 100, textAlign: 'right', fontWeight: '800' }]}>
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
                {selectedTemplate.category !== 'composition' && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>GST (18%)</Text>
                    <Text style={styles.totalVal}>₹10,800.00</Text>
                  </View>
                )}
                <View style={styles.grandTotalBlock}>
                  <Text style={styles.grandTotalLabel}>TOTAL AMOUNT</Text>
                  <Text style={styles.grandTotalVal}>
                    {selectedTemplate.category === 'composition' ? '₹60,000.00' : '₹70,800.00'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Down-Side Proper Templates Selector ── */}
          <View style={styles.selectorSection}>
            <View style={styles.selectorHeader}>
              <Text style={styles.selectorTitle}>
                CHOOSE TEMPLATE LAYOUT · {activeConfig.templates.length} VERIFIED DESIGNS
              </Text>
            </View>

            <View style={styles.templatesList}>
              {activeConfig.templates.map((tmpl) => {
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
                    <View style={styles.cardMain}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardBadge}>
                          <Text style={styles.cardBadgeText}>{tmpl.code}</Text>
                        </View>
                        <Text style={styles.cardTitle}>
                          {tmpl.name}
                        </Text>
                      </View>

                      <Text style={styles.cardTagline}>
                        {tmpl.tagline}
                      </Text>
                    </View>

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
        </View>
      </ScrollView>

      {/* ── Fixed Floating Bottom Action Bar ── */}
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
    paddingVertical: spacing.md,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  carouselContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    backgroundColor: '#000000',
  },
  carouselContent: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.full,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typePillSelected: {
    backgroundColor: '#FFFFFF',
  },
  typePillUnselected: {
    backgroundColor: '#11131A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  typePillText: {
    fontSize: 13,
  },
  typePillTextSelected: {
    color: '#000000',
    fontWeight: '800',
  },
  typePillTextUnselected: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  contentConstrained: {
    width: '100%',
    maxWidth: 720,
  },
  previewTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E2330',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 10,
  },
  previewBadgeText: {
    fontSize: 12,
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
  previewStatusHint: {
    fontSize: 12,
    color: '#64748B',
  },
  documentCanvas: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 26,
    marginBottom: 28,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.65)',
      },
      default: {
        elevation: 8,
      },
    }),
  },
  // Executive Header
  execHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 18,
    borderBottomWidth: 1.5,
    borderBottomColor: '#000000',
    marginBottom: 18,
  },
  execLeft: {
    flex: 1.2,
  },
  execDivider: {
    width: 1.5,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 16,
  },
  execRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  docBrandName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  docBrandMeta: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  docTitleMain: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.8,
  },
  docNumberMain: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
    marginTop: 3,
    marginBottom: 4,
  },
  docDateMeta: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  // Ledger Header
  ledgerHeader: {
    marginBottom: 18,
  },
  ledgerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ledgerBand: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#F8FAFC',
  },
  ledgerBandCol: {
    flex: 1,
    paddingVertical: 8,
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
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  // Minimal Header
  minimalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 18,
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  minimalRight: {
    alignItems: 'flex-end',
  },
  minimalNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.5,
  },
  minimalDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  // Corporate Header
  corporateHeader: {
    marginBottom: 18,
  },
  corpTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  corpBadgePill: {
    backgroundColor: '#000000',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 4,
  },
  corpBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
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
    padding: 12,
    borderRadius: 6,
  },
  corpPanelTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  corpPartyName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 2,
  },
  corpPartyGstin: {
    fontSize: 11,
    color: '#475569',
  },
  // Supply Chain Header
  supplyHeader: {
    marginBottom: 18,
  },
  supplyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    paddingVertical: 7,
    paddingHorizontal: 10,
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
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  // Composition Header
  compHeader: {
    marginBottom: 18,
  },
  compTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  compDeclarationBanner: {
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  compDeclarationText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
  },
  // Party Box
  partyBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    padding: 14,
    marginBottom: 18,
  },
  partyBoxLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  partyName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 2,
  },
  partyMeta: {
    fontSize: 12,
    color: '#475569',
  },
  // Table
  tableBlock: {
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableTh: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableTd: {
    fontSize: 13,
    color: '#000000',
  },
  // Bottom Summary
  bottomSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 10,
  },
  signatorySide: {
    flex: 1,
    maxWidth: 200,
  },
  signLine: {
    height: 1.5,
    backgroundColor: '#000000',
    marginBottom: 6,
  },
  signatoryLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  signatoryOrg: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    marginTop: 2,
  },
  totalsSide: {
    width: 185,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 12,
    color: '#475569',
  },
  totalVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  grandTotalBlock: {
    backgroundColor: '#000000',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  grandTotalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  grandTotalVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  // Down-Side Selector Section
  selectorSection: {
    width: '100%',
  },
  selectorHeader: {
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  selectorTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  templatesList: {
    gap: 12,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: radii.card,
    borderWidth: 1.5,
  },
  templateCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: '#FFFFFF',
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 1px #FFFFFF, 0 6px 24px rgba(255, 255, 255, 0.1)',
      },
      default: {},
    }),
  },
  templateCardUnselected: {
    backgroundColor: '#0C0D14',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cardMain: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 5,
  },
  cardBadge: {
    backgroundColor: '#1E2330',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  cardBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardTagline: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  radioArea: {
    marginLeft: 16,
  },
  radioSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioUnselected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#475569',
  },
  // Floating Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#08090D',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 16,
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
    marginRight: 16,
  },
  bottomBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  bottomPill: {
    backgroundColor: '#1E2330',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bottomPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bottomTemplateName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bottomStatusText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: radii.button,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
});

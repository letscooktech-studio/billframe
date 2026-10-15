/**
 * DOCUMENT TEMPLATE SELECTION SCREEN — BILLFRAME LUXURY ARCHITECTURE
 * 
 * Strict invariants:
 * - Monochrome & frozen neutral luxury palette (no multi-colored rainbow badges).
 * - Ultra-spacious, architectural layout canvas with generous breathing room.
 * - Minimal, confident metadata (no overwhelming walls of text or paragraphs).
 * - Live layout preview reflecting the exact structural differences of each template.
 * - Direct routing to document edit/build screen on selection.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
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
  Truck,
  RotateCcw,
  ShoppingBag,
  ClipboardList,
  Receipt,
  ShieldCheck,
  Building2,
  ChevronRight,
} from 'lucide-react-native';
import { spacing, radii, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { useTheme } from '../../design/ThemeContext';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';
import { BusinessProfile } from '../../domain/profile/types';

export interface DocumentTemplateItem {
  id: string;
  code: string;
  name: string;
  tagline: string;
  category: 'executive' | 'ledger' | 'minimal' | 'corporate' | 'supply_chain';
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
        tagline: 'Classic brand letterhead with generous executive margins',
        category: 'executive',
      },
      {
        id: 'gst_ledger',
        code: 'GST-02',
        name: 'Structured Ledger',
        tagline: 'Itemized grid with 4-compartment metadata band',
        category: 'ledger',
      },
      {
        id: 'gst_minimal',
        code: 'GST-03',
        name: 'Minimal Professional',
        tagline: 'Clean borderless typography with bold summary',
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
        tagline: 'Logistics transport strip & multi-depot shipping tally',
        category: 'supply_chain',
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
        tagline: 'Scope narrative with milestone pricing schedule',
        category: 'executive',
      },
      {
        id: 'est_itemized',
        code: 'EST-02',
        name: 'Itemized Quotation',
        tagline: 'Detailed unit rates with revision versioning',
        category: 'ledger',
      },
      {
        id: 'est_proforma',
        code: 'EST-03',
        name: 'Commercial Proforma',
        tagline: 'Advance wire instructions & proforma trade numbering',
        category: 'corporate',
      },
    ],
  },
  challan: {
    id: 'challan',
    title: 'Delivery Challan',
    shortName: 'Challan',
    subtitle: 'Goods dispatch, vehicle transfer note & transit record',
    icon: Truck,
    defaultTemplateId: 'challan_standard',
    templates: [
      {
        id: 'challan_standard',
        code: 'DC-01',
        name: 'Goods Dispatch Note',
        tagline: 'Transporter ID, vehicle number & receiver seal',
        category: 'supply_chain',
      },
      {
        id: 'challan_transfer',
        code: 'DC-02',
        name: 'Consignment Transfer',
        tagline: 'Inter-warehouse movement & gate pass record',
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
        tagline: 'Rate revision claim & revised payable breakdown',
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
        tagline: 'Vendor shipping instructions & procurement authorization',
        category: 'corporate',
      },
      {
        id: 'po_supply',
        code: 'PO-02',
        name: 'Industrial Supply Order',
        tagline: 'Technical bill of materials & delivery milestones',
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
        tagline: 'Scope deliverables, materials & customer completion signoff',
        category: 'ledger',
      },
      {
        id: 'wo_contract',
        code: 'WO-02',
        name: 'Retainer Agreement',
        tagline: 'Engagement terms, milestones & legal signature block',
        category: 'executive',
      },
    ],
  },
  receipt: {
    id: 'receipt',
    title: 'Payment Receipt',
    shortName: 'Receipt',
    subtitle: 'Payment acknowledgment & settlement vouchers',
    icon: Receipt,
    defaultTemplateId: 'receipt_payment',
    templates: [
      {
        id: 'receipt_payment',
        code: 'REC-01',
        name: 'Payment Voucher',
        tagline: 'Bank UTR reference & official settlement acknowledgment',
        category: 'minimal',
      },
      {
        id: 'receipt_settlement',
        code: 'REC-02',
        name: 'Account Settlement',
        tagline: 'Full balance clearance & statement reconciliation',
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* ── Top Header Navigation ── */}
      <View style={[styles.header, { borderBottomColor: theme.borderSubtle }]}>
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
          <ArrowLeft size={22} color={theme.textPrimary} strokeWidth={2} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {activeConfig.title}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
            {activeConfig.subtitle}
          </Text>
        </View>
      </View>

      {/* ── Document Types Horizontal Carousel ── */}
      <View style={[styles.carouselContainer, { borderBottomColor: theme.borderSubtle }]}>
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
                  isSelected
                    ? styles.typePillSelected
                    : [styles.typePillUnselected, { borderColor: theme.borderSubtle }],
                ]}
                onPress={() => handleSelectType(cfg.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.typePillText,
                    {
                      color: isSelected ? '#000000' : theme.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {cfg.shortName}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Main Scroll View: Spacious Live Preview + Clean Templates Downside ── */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentConstrained}>
          {/* ── Live Architectural Document Canvas ── */}
          <View style={styles.previewSection}>
            <View style={styles.previewTopBar}>
              <View style={styles.previewBadge}>
                <ShieldCheck size={13} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.previewBadgeText}>{selectedTemplate.code}</Text>
              </View>
              <Text style={[styles.previewCategoryLabel, { color: theme.textSecondary }]}>
                {selectedTemplate.name.toUpperCase()}
              </Text>
              <View style={styles.previewSpacer} />
              <Text style={[styles.previewStatusHint, { color: theme.textMuted }]}>
                Live Preview
              </Text>
            </View>

            {/* Architectural Document Sheet */}
            <View style={styles.documentCanvas}>
              {/* Header Anatomy according to Layout Category */}
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

              {selectedTemplate.category === 'minimal' && (
                <View style={styles.minimalHeader}>
                  <View>
                    <Text style={styles.docBrandName}>{orgName}</Text>
                    <Text style={styles.docBrandMeta}>GSTIN: {orgGstin}</Text>
                  </View>
                  <View style={styles.minimalRight}>
                    <Text style={styles.minimalNumber}>#001</Text>
                    <Text style={styles.minimalDate}>15 Oct 2026</Text>
                  </View>
                </View>
              )}

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
                      <Text style={styles.corpPartyGstin}>Bhiwandi Depot, MH</Text>
                    </View>
                  </View>
                </View>
              )}

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

              {/* Billed To Box (Spacious & Clean) */}
              {selectedTemplate.category !== 'corporate' && (
                <View style={styles.partyBox}>
                  <Text style={styles.partyBoxLabel}>BILLED TO:</Text>
                  <Text style={styles.partyName}>Reliance Retail Limited</Text>
                  <Text style={styles.partyMeta}>GSTIN: 27AABCR1234F1Z8 · Nariman Point, Mumbai, Maharashtra</Text>
                </View>
              )}

              {/* Spacious Line Items Table */}
              <View style={styles.tableBlock}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableTh, { flex: 3 }]}>DESCRIPTION</Text>
                  <Text style={[styles.tableTh, { width: 50, textAlign: 'center' }]}>QTY</Text>
                  <Text style={[styles.tableTh, { width: 80, textAlign: 'right' }]}>RATE</Text>
                  <Text style={[styles.tableTh, { width: 90, textAlign: 'right' }]}>AMOUNT</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={[styles.tableTd, { flex: 3, fontWeight: '600' }]}>
                    Enterprise Cloud Architecture
                  </Text>
                  <Text style={[styles.tableTd, { width: 50, textAlign: 'center' }]}>1</Text>
                  <Text style={[styles.tableTd, { width: 80, textAlign: 'right' }]}>₹45,000</Text>
                  <Text style={[styles.tableTd, { width: 90, textAlign: 'right', fontWeight: '700' }]}>
                    ₹45,000
                  </Text>
                </View>

                <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                  <Text style={[styles.tableTd, { flex: 3, fontWeight: '600' }]}>
                    Security & Compliance Audit
                  </Text>
                  <Text style={[styles.tableTd, { width: 50, textAlign: 'center' }]}>1</Text>
                  <Text style={[styles.tableTd, { width: 80, textAlign: 'right' }]}>₹15,000</Text>
                  <Text style={[styles.tableTd, { width: 90, textAlign: 'right', fontWeight: '700' }]}>
                    ₹15,000
                  </Text>
                </View>
              </View>

              {/* Spacious Totals & Authorized Signoff */}
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
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>GST (18%)</Text>
                    <Text style={styles.totalVal}>₹10,800.00</Text>
                  </View>
                  <View style={styles.grandTotalBlock}>
                    <Text style={styles.grandTotalLabel}>TOTAL AMOUNT</Text>
                    <Text style={styles.grandTotalVal}>₹70,800.00</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ── Down-Side Proper Templates Selector ── */}
          <View style={styles.selectorSection}>
            <View style={styles.selectorHeader}>
              <Text style={[styles.selectorTitle, { color: theme.textMuted }]}>
                AVAILABLE LAYOUTS · {activeConfig.templates.length} VERIFIED
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
                      {
                        backgroundColor: theme.surface,
                        borderColor: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.08)',
                        opacity: pressed ? 0.9 : 1,
                      },
                      isSelected && styles.templateCardSelected,
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
                        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                          {tmpl.name}
                        </Text>
                      </View>

                      <Text style={[styles.cardTagline, { color: theme.textSecondary }]}>
                        {tmpl.tagline}
                      </Text>
                    </View>

                    <View style={styles.radioArea}>
                      {isSelected ? (
                        <View style={styles.radioSelected}>
                          <Check size={12} color="#000000" strokeWidth={3} />
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
          {
            backgroundColor: theme.surfaceElevated || '#0D0F17',
            borderTopColor: theme.borderSubtle,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <View style={styles.bottomBarContent}>
          <View style={styles.bottomBarInfo}>
            <View style={styles.bottomBadgeRow}>
              <View style={styles.bottomPill}>
                <Text style={styles.bottomPillText}>{selectedTemplate.code}</Text>
              </View>
              <Text style={[styles.bottomTemplateName, { color: theme.textPrimary }]} numberOfLines={1}>
                {selectedTemplate.name}
              </Text>
            </View>
            <Text style={[styles.bottomStatusText, { color: theme.textSecondary }]}>
              Rule 46 Verified · Ready to draft
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.createButton,
              { opacity: pressed ? 0.9 : 1 },
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  carouselContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  carouselContent: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  typePillSelected: {
    backgroundColor: '#FFFFFF',
  },
  typePillUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
  },
  typePillText: {
    fontSize: 13,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  contentConstrained: {
    width: '100%',
    maxWidth: 720,
  },
  previewSection: {
    marginBottom: spacing.xl,
  },
  previewTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E2330',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  previewCategoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  previewSpacer: {
    flex: 1,
  },
  previewStatusHint: {
    fontSize: 12,
  },
  documentCanvas: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
      },
      default: {
        elevation: 6,
      },
    }),
  },
  // Executive Header
  execHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 16,
  },
  execLeft: {
    flex: 1.2,
  },
  execDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  execRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  docBrandName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  docBrandMeta: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  docTitleMain: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  docNumberMain: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
    marginBottom: 4,
  },
  docDateMeta: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  // Ledger Header
  ledgerHeader: {
    marginBottom: 16,
  },
  ledgerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ledgerBand: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  ledgerBandCol: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#0F172A',
  },
  ledgerBandLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  ledgerBandVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  // Minimal Header
  minimalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  minimalRight: {
    alignItems: 'flex-end',
  },
  minimalNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  minimalDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  // Corporate Header
  corporateHeader: {
    marginBottom: 16,
  },
  corpTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  corpBadgePill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  corpBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  corpDualPanels: {
    flexDirection: 'row',
  },
  corpPanel: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    borderRadius: 6,
  },
  corpPanelTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  corpPartyName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  corpPartyGstin: {
    fontSize: 11,
    color: '#64748B',
  },
  // Supply Chain Header
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
  },
  transportCol: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  transportLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  transportVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  // Party Box
  partyBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  partyBoxLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  partyName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  partyMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  // Table
  tableBlock: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableTh: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableTd: {
    fontSize: 12,
    color: '#1E293B',
  },
  // Bottom Summary
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
    height: 1,
    backgroundColor: '#CBD5E1',
    marginBottom: 6,
  },
  signatoryLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  signatoryOrg: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
  totalsSide: {
    width: 170,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  totalVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  grandTotalBlock: {
    backgroundColor: '#0F172A',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  grandTotalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  grandTotalVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Selector Section
  selectorSection: {
    width: '100%',
  },
  selectorHeader: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  selectorTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  templatesList: {
    gap: 10,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: radii.card,
    borderWidth: 1,
  },
  templateCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: '#FFFFFF',
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 1px #FFFFFF, 0 4px 20px rgba(255, 255, 255, 0.08)',
      },
      default: {},
    }),
  },
  cardMain: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  cardBadge: {
    backgroundColor: '#1E2330',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  cardBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardTagline: {
    fontSize: 13,
  },
  radioArea: {
    marginLeft: 14,
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  // Floating Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    paddingHorizontal: spacing.lg,
    ...Platform.select({
      web: {
        boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.5)',
      },
      default: {
        elevation: 12,
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
    marginBottom: 2,
  },
  bottomPill: {
    backgroundColor: '#1E2330',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bottomPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomTemplateName: {
    fontSize: 15,
    fontWeight: '700',
  },
  bottomStatusText: {
    fontSize: 12,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
});

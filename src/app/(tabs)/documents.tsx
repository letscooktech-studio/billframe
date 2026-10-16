/**
 * DOCUMENTS SCREEN — BILLFRAME RECOVERY 3.0
 * Unified repository for ALL business documents:
 * - Standard Commercial: Invoices, Estimates, Receipts
 * - Universal Document Studio: Job Offers, Work Orders, Salary Slips, Fee Receipts, Rent Receipts
 * 
 * Features:
 * - Unified SQLite query across documents, receipts, and universal_documents tables
 * - Standardized Monochrome Design System (SearchField, IconButton, PrimaryButton, DocumentRow)
 * - Category and lifecycle status filter chips with >= 48dp touch targets
 * - Direct creation modal & quick bill counter actions
 * - UPI payment QR and payment recording modals
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  Platform,
  useColorScheme,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  FileText,
  Plus,
  ChevronRight,
  QrCode,
  Zap,
  FilePlus2,
  X,
  Palette,
  Layers,
  Receipt,
  Briefcase,
  Menu,
  FileSpreadsheet,
  RotateCcw,
  ShoppingBag,
  ClipboardList,
  Globe,
  Package,
  PackageCheck,
  ScrollText,
  Truck,
  FileCheck,
  Scale,
  Users,
  Send,
  Building,
  GraduationCap,
  Laptop,
  Shield,
  FileClock,
  Compass,
} from 'lucide-react-native';
import {
  OrganizationPackRegistry,
  ORGANIZATION_PACKS,
  OrganizationPackDefinition,
  OrganizationSector,
  SECTOR_DEFINITIONS,
} from '../../domain/organization/OrganizationPackRegistry';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { useTheme } from '../../design/ThemeContext';
import { useNavigationDrawer } from '../../components/navigation/NavigationDrawerContext';
import { FeatureIntroductionSheet } from '../../components/common/FeatureIntroductionSheet';
import { DatabaseManager } from '../../data/database/DatabaseManager';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';
import { BusinessProfile } from '../../domain/profile/types';
import { formatMoney } from '../../domain/money/Money';
import { DocumentUpiModal } from '../../features/payments/DocumentUpiModal';
import { PaymentRecordModal } from '../../features/payments/PaymentRecordModal';
import { SearchField } from '../../components/common/SearchField';
import { IconButton } from '../../components/common/IconButton';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { EmptyState } from '../../components/common/EmptyState';
import { DocumentRow } from '../../components/common/DocumentRow';

export interface DocumentListItem {
  id: string;
  doc_type: string;
  document_number: string;
  customer_name: string;
  total_minor: number;
  balance_minor?: number;
  currency: string;
  lifecycle_status: string;
  issue_date?: number;
  is_universal?: number;
}

type DocCategoryFilter = 'all' | 'invoice' | 'estimate' | 'receipt' | 'universal';
type DocStatusFilter = 'all' | 'draft' | 'issued';

function formatDateDisplay(timestamp?: number): string {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDocTypeName(type: string): string {
  if (!type) return 'Document';
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export interface DocumentCreateOption {
  id: string;
  name: string;
  tagline: string;
  category: 'billing' | 'orders' | 'logistics' | 'finance' | 'hr' | 'legal';
  categoryLabel: string;
  badge: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  keywords: string[];
}

export const CREATE_MODAL_CATEGORIES: { key: string; label: string }[] = [
  { key: 'all', label: 'All Documents' },
  { key: 'billing', label: 'Sales & Billing (19)' },
  { key: 'orders', label: 'Orders & Quotes (4)' },
  { key: 'logistics', label: 'Logistics (4)' },
  { key: 'finance', label: 'Finance & Payments (6)' },
  { key: 'hr', label: 'HR & Payroll (3)' },
  { key: 'legal', label: 'Institutional & Legal (6)' },
];

export const DOCUMENT_CREATE_OPTIONS: DocumentCreateOption[] = [
  // ── SALES & COMMERCIAL BILLING ──
  {
    id: 'invoice',
    name: 'Tax Invoice',
    tagline: 'CBIC GST Rule 46 commercial sales billing with HSN & itemized taxes',
    category: 'billing',
    categoryLabel: 'Sales & Billing',
    badge: 'RULE 46',
    icon: FileText,
    keywords: ['tax', 'invoice', 'gst', 'bill', 'commercial', 'b2b', 'b2c', 'sales', 'rule 46'],
  },
  {
    id: 'commercial_invoice',
    name: 'Commercial Invoice',
    tagline: 'Standard non-GST & international commercial B2B sales billing with Incoterms',
    category: 'billing',
    categoryLabel: 'Sales & Billing',
    badge: 'STANDARD B2B',
    icon: Globe,
    keywords: ['commercial', 'invoice', 'international', 'b2b', 'foreign', 'non-gst', 'standard'],
  },
  {
    id: 'bill_of_supply',
    name: 'Bill of Supply',
    tagline: 'Section 31(3)(c) for composition dealers & exempt zero-tax supplies',
    category: 'billing',
    categoryLabel: 'Sales & Billing',
    badge: 'RULE 49',
    icon: FileSpreadsheet,
    keywords: ['composition', 'exempt', 'supply', 'bill of supply', 'tax-free', 'rule 49'],
  },
  {
    id: 'invoice_cum_bill_of_supply',
    name: 'Invoice-cum-Bill of Supply',
    tagline: 'CBIC GST Rule 46A statutory composite instrument for mixed taxable & exempt supplies',
    category: 'billing',
    categoryLabel: 'Sales & Billing',
    badge: 'RULE 46A',
    icon: FileSpreadsheet,
    keywords: ['composite', 'rule 46a', 'mixed', 'exempt', 'taxable', 'cum bill'],
  },
  {
    id: 'service_invoice',
    name: 'Service Tax Invoice',
    tagline: 'Professional consulting & service tax billing with 6-digit SAC codes & periods',
    category: 'billing',
    categoryLabel: 'Sales & Billing',
    badge: 'SAC SERVICE',
    icon: Briefcase,
    keywords: ['service', 'consulting', 'sac', 'agency', 'professional fee', 'service invoice'],
  },
  {
    id: 'milestone_invoice',
    name: 'Milestone / Tranche Invoice',
    tagline: 'Contractual deliverable stage-gate billing linked to verified SOW milestones',
    category: 'billing',
    categoryLabel: 'Sales & Billing',
    badge: 'SOW TRANCHE',
    icon: Layers,
    keywords: ['milestone', 'tranche', 'stage', 'phase', 'sow', 'deliverable bill'],
  },
  {
    id: 'progress_invoice',
    name: 'Progress Billing Invoice',
    tagline: 'AIA Document G702 construction progress draw with retainage accounting',
    category: 'billing',
    categoryLabel: 'Sales & Billing',
    badge: 'AIA G702',
    icon: Building,
    keywords: ['progress', 'draw', 'aia', 'construction', 'retainage', 'contractor bill'],
  },
  {
    id: 'recurring_invoice',
    name: 'Recurring Subscription Invoice',
    tagline: 'Periodic SaaS subscriptions, annual maintenance (AMC), and monthly retainers',
    category: 'billing',
    categoryLabel: 'Sales & Billing',
    badge: 'SUBSCRIPTION',
    icon: FileClock,
    keywords: ['subscription', 'recurring', 'amc', 'saas', 'retainer', 'monthly bill'],
  },
  {
    id: 'advance_invoice',
    name: 'Advance Payment Invoice',
    tagline: 'CBIC Rule 50 statutory advance receipt voucher with tax determination',
    category: 'billing',
    categoryLabel: 'Sales & Billing',
    badge: 'RULE 50',
    icon: FileCheck,
    keywords: ['advance', 'prepayment', 'deposit', 'voucher', 'rule 50', 'advance receipt'],
  },
  {
    id: 'revised_tax_invoice',
    name: 'Revised Tax Invoice',
    tagline: 'CBIC Rule 53 statutory revised invoice against previously issued instruments',
    category: 'billing',
    categoryLabel: 'Sales & Billing',
    badge: 'RULE 53',
    icon: RotateCcw,
    keywords: ['revised', 'supplementary', 'amendment', 'rule 53', 'revised invoice'],
  },
  {
    id: 'cash_bill',
    name: 'Cash Bill / Cash Memo',
    tagline: 'Over-the-counter sales memo with immediate cash settlement & zero balance',
    category: 'billing',
    categoryLabel: 'Sales & Billing',
    badge: 'CASH MEMO',
    icon: Receipt,
    keywords: ['cash', 'memo', 'counter bill', 'walk-in', 'instant bill', 'cash bill'],
  },
  {
    id: 'pos_receipt',
    name: 'POS Terminal Receipt',
    tagline: 'Thermal register checkout receipt with barcode & dynamic UPI QR payment code',
    category: 'billing',
    categoryLabel: 'Sales & Billing',
    badge: 'THERMAL POS',
    icon: Receipt,
    keywords: ['pos', 'thermal', 'register', 'checkout', 'slip', 'qr code'],
  },
  {
    id: 'sales_return_note',
    name: 'Sales Return Note',
    tagline: 'Merchandise return authorization with triage inspection & credit voucher reference',
    category: 'billing',
    categoryLabel: 'Sales & Billing',
    badge: 'RETURN RMA',
    icon: RotateCcw,
    keywords: ['sales return', 'return', 'rma', 'goods rejection', 'credit slip'],
  },
  {
    id: 'payment_reminder',
    name: 'Payment Reminder Notice',
    tagline: 'Formal dunning notice detailing overdue days, contractual interest & payment link',
    category: 'billing',
    categoryLabel: 'Sales & Billing',
    badge: 'OVERDUE',
    icon: FileClock,
    keywords: ['reminder', 'overdue', 'dunning', 'collection notice', 'late fee', 'due notice'],
  },
  {
    id: 'proforma',
    name: 'Proforma Invoice',
    tagline: 'Preliminary quotation for advance bank wire & import customs clearance',
    category: 'billing',
    categoryLabel: 'Sales & Billing',
    badge: 'PROFORMA',
    icon: FileClock,
    keywords: ['proforma', 'advance', 'wire', 'import', 'customs', 'preliminary', 'pi'],
  },
  {
    id: 'export_invoice',
    name: 'Export Invoice',
    tagline: 'Cross-border supply under LUT with foreign currencies & Incoterms® 2020',
    category: 'billing',
    categoryLabel: 'Sales & Billing',
    badge: 'FEMA / LUT',
    icon: Globe,
    keywords: ['export', 'foreign', 'lut', 'cross-border', 'cif', 'fob', 'incoterms', 'usd', 'eur'],
  },
  {
    id: 'quick-bill',
    name: 'Quick Counter Bill',
    tagline: 'Rapid 30-second POS checkout with auto-calculated QR & multi-pay card verification',
    category: 'billing',
    categoryLabel: 'Sales & Billing',
    badge: 'RAPID POS',
    icon: Zap,
    keywords: ['quick', 'pos', 'counter', 'checkout', 'qr', 'card', 'fast', 'cash'],
  },

  // ── ORDERS, QUOTES & CONTRACTS ──
  {
    id: 'estimate',
    name: 'Estimate / Quotation',
    tagline: 'Formal price proposal, itemized scope, rate validity & terms',
    category: 'orders',
    categoryLabel: 'Orders & Quotes',
    badge: 'QUOTATION',
    icon: Briefcase,
    keywords: ['quote', 'estimate', 'proposal', 'bid', 'pricing', 'cost proposal'],
  },
  {
    id: 'sales_order',
    name: 'Sales Order Confirmation',
    tagline: 'Vendor order acknowledgment committed against customer purchase order',
    category: 'orders',
    categoryLabel: 'Orders & Quotes',
    badge: 'SALES ORDER',
    icon: PackageCheck,
    keywords: ['sales order', 'order confirmation', 'so', 'po acceptance', 'booking'],
  },
  {
    id: 'order_confirmation',
    name: 'Order Confirmation',
    tagline: 'Statutory binding confirmation of customer purchase order & delivery dates',
    category: 'orders',
    categoryLabel: 'Orders & Quotes',
    badge: 'CONFIRMATION',
    icon: Send,
    keywords: ['order confirmation', 'acceptance', 'po acceptance', 'booking confirmation'],
  },
  {
    id: 'work_order',
    name: 'Work Order & Contract',
    tagline: 'Scope of work, milestone delivery schedule, SLA & service deliverables',
    category: 'orders',
    categoryLabel: 'Orders & Quotes',
    badge: 'SOW / SLA',
    icon: ClipboardList,
    keywords: ['work order', 'contract', 'sow', 'scope', 'milestone', 'service agreement'],
  },

  // ── PURCHASING & LOGISTICS ──
  {
    id: 'purchase_order',
    name: 'Purchase Order',
    tagline: 'Binding procurement contract issued to vendors with delivery specifications',
    category: 'logistics',
    categoryLabel: 'Logistics',
    badge: 'PROCUREMENT',
    icon: ShoppingBag,
    keywords: ['purchase order', 'po', 'procurement', 'vendor order', 'supplies'],
  },
  {
    id: 'goods_received_note',
    name: 'Goods Received Note (GRN)',
    tagline: 'Inward warehouse gate inspection, tally verification & quality signoff',
    category: 'logistics',
    categoryLabel: 'Logistics',
    badge: 'GATE INWARD',
    icon: Package,
    keywords: ['grn', 'goods received', 'inward', 'inspection', 'warehouse', 'receipt note'],
  },
  {
    id: 'packing_list',
    name: 'Export Packing List',
    tagline: 'Carton manifest with gross/net weight, package dimensions & dispatch counts',
    category: 'logistics',
    categoryLabel: 'Logistics',
    badge: 'MANIFEST',
    icon: ScrollText,
    keywords: ['packing list', 'manifest', 'carton', 'dispatch tally', 'cargo dimensions'],
  },
  {
    id: 'delivery_challan',
    name: 'Delivery Challan',
    tagline: 'Rule 55 statutory document for transit movement of goods without immediate sale',
    category: 'logistics',
    categoryLabel: 'Logistics',
    badge: 'RULE 55',
    icon: Truck,
    keywords: ['challan', 'delivery', 'transit', 'job work', 'consignment', 'rule 55'],
  },

  // ── PAYMENTS, ACCOUNTING & ADJUSTMENTS ──
  {
    id: 'receipt',
    name: 'Payment Receipt',
    tagline: 'Official payment discharge acknowledgment with banking & UTR reference',
    category: 'finance',
    categoryLabel: 'Finance & Payments',
    badge: 'DISCHARGE',
    icon: Receipt,
    keywords: ['receipt', 'payment receipt', 'acknowledgment', 'paid', 'cleared', 'settlement'],
  },
  {
    id: 'payment_voucher',
    name: 'Payment Voucher',
    tagline: 'Rule 52 treasury disbursement voucher with statutory TDS withholding record',
    category: 'finance',
    categoryLabel: 'Finance & Payments',
    badge: 'RULE 52',
    icon: FileCheck,
    keywords: ['voucher', 'payment voucher', 'payout', 'disbursement', 'tds', 'treasury'],
  },
  {
    id: 'credit_note',
    name: 'Credit Note',
    tagline: 'Rule 53 statutory adjustment for sales returns, volume rebates, or price corrections',
    category: 'finance',
    categoryLabel: 'Finance & Payments',
    badge: 'RULE 53',
    icon: RotateCcw,
    keywords: ['credit note', 'credit', 'sales return', 'rebate', 'adjustment', 'rule 53'],
  },
  {
    id: 'debit_note',
    name: 'Debit Note',
    tagline: 'Rule 53 supplementary charge for rate escalation, deficit, or vendor adjustment',
    category: 'finance',
    categoryLabel: 'Finance & Payments',
    badge: 'SUPPLEMENTARY',
    icon: RotateCcw,
    keywords: ['debit note', 'debit', 'supplementary', 'rate revision', 'rule 53'],
  },
  {
    id: 'customer_statement',
    name: 'Customer Account Statement',
    tagline: 'Chronological running statement of account, ledger tally & aged receivables',
    category: 'finance',
    categoryLabel: 'Finance & Payments',
    badge: 'LEDGER',
    icon: Scale,
    keywords: ['statement', 'ledger', 'account statement', 'aging', 'balance due', 'running balance'],
  },
  {
    id: 'invoice_aging_report',
    name: 'Accounts Receivable Aging Report',
    tagline: 'Multi-column debtor aging schedule: Current, 1-30, 31-60, 61-90, 90+ days past due',
    category: 'finance',
    categoryLabel: 'Finance & Payments',
    badge: 'AR AGING',
    icon: ScrollText,
    keywords: ['aging', 'ar', 'debtors', 'receivables', 'overdue', 'schedule', 'aging report'],
  },

  // ── HR & PAYROLL ──
  {
    id: 'salary_slip',
    name: 'Salary Slip / Payslip',
    tagline: 'Monthly employee compensation, basic, HRA, allowance & PF/ESI/TDS deductions',
    category: 'hr',
    categoryLabel: 'HR & Payroll',
    badge: 'PAYROLL',
    icon: Users,
    keywords: ['salary', 'payslip', 'payroll', 'wages', 'hra', 'provident fund', 'tds', 'earnings'],
  },
  {
    id: 'job_offer',
    name: 'Job Offer Letter',
    tagline: 'Official employment offer with designation, annualized CTC, and joining terms',
    category: 'hr',
    categoryLabel: 'HR & Payroll',
    badge: 'HR OFFER',
    icon: Send,
    keywords: ['offer', 'job offer', 'employment', 'ctc', 'joining letter', 'appointment'],
  },
  {
    id: 'experience_cert',
    name: 'Experience Certificate',
    tagline: 'Official service verification and relieving clearance certificate for outgoing staff',
    category: 'hr',
    categoryLabel: 'HR & Payroll',
    badge: 'SERVICE CERT',
    icon: FileText,
    keywords: ['experience', 'relieving', 'service certificate', 'clearance', 'employment verification'],
  },

  // ── INSTITUTIONAL & LEGAL ──
  {
    id: 'rent_receipt',
    name: 'Rent Receipt (HRA)',
    tagline: 'Income Tax Act Section 10(13A) residential rent claim with landlord PAN declaration',
    category: 'legal',
    categoryLabel: 'Legal & Institutional',
    badge: 'SEC 10(13A)',
    icon: Building,
    keywords: ['rent', 'hra', 'landlord', 'tenant', 'rent receipt', 'section 10(13a)', 'pan'],
  },
  {
    id: 'student_fee_receipt',
    name: 'Student Fee Receipt',
    tagline: 'Institutional tuition, laboratory, and library fee collection voucher for academies',
    category: 'legal',
    categoryLabel: 'Legal & Institutional',
    badge: 'ACADEMIC',
    icon: GraduationCap,
    keywords: ['fee', 'tuition', 'school', 'college', 'student', 'education', 'receipt'],
  },
  {
    id: 'equipment_handover',
    name: 'Equipment Responsibility Memo',
    tagline: 'Corporate IT hardware asset allocation, serial tracking & custody agreement',
    category: 'legal',
    categoryLabel: 'Legal & Institutional',
    badge: 'ASSET CUSTODY',
    icon: Laptop,
    keywords: ['equipment', 'asset handover', 'laptop', 'hardware', 'custody', 'it asset'],
  },
  {
    id: 'meeting_minutes',
    name: 'Meeting Minutes (MoM)',
    tagline: 'ICSI Secretarial Standard-1 formal board/executive proceedings & action resolutions',
    category: 'legal',
    categoryLabel: 'Legal & Institutional',
    badge: 'SS-1 MINUTES',
    icon: FileText,
    keywords: ['minutes', 'mom', 'meeting', 'resolutions', 'board', 'action items'],
  },
  {
    id: 'site_inspection',
    name: 'Site Inspection Report',
    tagline: 'ISO 9001 / OSHA 1910 workplace safety compliance inspection and hazard audit',
    category: 'legal',
    categoryLabel: 'Legal & Institutional',
    badge: 'OSHA / HSE',
    icon: Shield,
    keywords: ['inspection', 'safety', 'audit', 'site report', 'osha', 'hse', 'hazard'],
  },
  {
    id: 'nda_agreement',
    name: 'Mutual Non-Disclosure Agreement',
    tagline: 'Bilateral confidentiality contract safeguarding proprietary data & intellectual property',
    category: 'legal',
    categoryLabel: 'Legal & Institutional',
    badge: 'LEGAL NDA',
    icon: Scale,
    keywords: ['nda', 'confidentiality', 'non-disclosure', 'trade secret', 'legal contract', 'agreement'],
  },
];

export default function DocumentsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { openDrawer } = useNavigationDrawer();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<DocCategoryFilter>('all');
  const [selectedStatus, setSelectedStatus] = useState<DocStatusFilter>('all');
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [locale, setLocale] = useState('en-US');
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [upiDoc, setUpiDoc] = useState<DocumentListItem | null>(null);
  const [recordPaymentDoc, setRecordPaymentDoc] = useState<DocumentListItem | null>(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [createModalSearch, setCreateModalSearch] = useState('');
  const [createModalCategory, setCreateModalCategory] = useState('all');
  const [modalMode, setModalMode] = useState<'categories' | 'packs'>('categories');
  const [selectedPackSector, setSelectedPackSector] = useState<string>('all');
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  const activePack = useMemo(() => {
    return selectedPackId ? OrganizationPackRegistry.getPackById(selectedPackId) : null;
  }, [selectedPackId]);

  const visiblePacks = useMemo(() => {
    if (selectedPackSector === 'all') return ORGANIZATION_PACKS;
    return OrganizationPackRegistry.getPacksBySector(selectedPackSector as OrganizationSector);
  }, [selectedPackSector]);

  const filteredCreateOptions = useMemo(() => {
    let pool = DOCUMENT_CREATE_OPTIONS;

    // Filter by Organization Pack recommendations when in packs mode and a pack is selected
    if (modalMode === 'packs' && selectedPackId && activePack) {
      const recSet = new Set<string>(activePack.recommendedDocIds);
      if (recSet.has('tax_invoice')) recSet.add('invoice');
      if (recSet.has('customer_statement')) recSet.add('customer_account_statement');
      if (recSet.has('job_offer_letter')) recSet.add('job_offer');
      if (recSet.has('experience_certificate')) recSet.add('experience_cert');
      if (recSet.has('equipment_responsibility_letter')) recSet.add('equipment_handover');
      if (recSet.has('site_inspection_report')) recSet.add('site_inspection');
      pool = pool.filter((opt) => recSet.has(opt.id) || recSet.has(opt.id.replace('-', '_')));
    } else if (modalMode === 'categories' && createModalCategory !== 'all') {
      pool = pool.filter((opt) => opt.category === createModalCategory);
    }

    if (createModalSearch.trim()) {
      const query = createModalSearch.trim().toLowerCase();
      pool = pool.filter((opt) => {
        const matchesName = opt.name.toLowerCase().includes(query);
        const matchesTagline = opt.tagline.toLowerCase().includes(query);
        const matchesBadge = opt.badge.toLowerCase().includes(query);
        const matchesKeywords = opt.keywords.some((k) => k.toLowerCase().includes(query));
        return matchesName || matchesTagline || matchesBadge || matchesKeywords;
      });
    }

    return pool;
  }, [modalMode, selectedPackId, activePack, createModalCategory, createModalSearch]);

  const loadDocuments = useCallback(async () => {
    try {
      const activeProfile = await BusinessProfileRepository.getActiveProfile();
      setProfile(activeProfile);
      if (activeProfile?.default_document_locale) {
        setLocale(activeProfile.default_document_locale);
      }

      const db = await DatabaseManager.getDatabaseAsync();
      const allResults: DocumentListItem[] = [];

      // 1. Query standard documents (Invoices, Estimates, etc.)
      if (selectedType === 'all' || selectedType === 'invoice' || selectedType === 'estimate') {
        let query = `
          SELECT d.id, d.doc_type, d.document_number, COALESCE(c.name, 'Walk-in Client') AS customer_name,
                 d.total_minor, d.balance_minor, d.currency, d.lifecycle_status, d.issue_date, 0 AS is_universal
          FROM documents d
          LEFT JOIN customers c ON d.customer_id = c.id
          WHERE d.is_archived = 0
        `;
        const params: any[] = [];

        if (selectedType !== 'all') {
          query += ' AND d.doc_type = ?';
          params.push(selectedType);
        }

        if (selectedStatus === 'draft') {
          query += " AND d.lifecycle_status = 'draft'";
        } else if (selectedStatus === 'issued') {
          query += " AND d.lifecycle_status IN ('issued', 'paid')";
        }

        if (searchQuery.trim()) {
          query += ' AND (d.document_number LIKE ? OR c.name LIKE ? OR d.notes LIKE ?)';
          const wild = `%${searchQuery.trim()}%`;
          params.push(wild, wild, wild);
        }

        query += ' ORDER BY d.created_at DESC';
        const docItems = await db.getAllAsync<DocumentListItem>(query, params);
        if (docItems) allResults.push(...docItems);
      }

      // 2. Query receipts if relevant
      if (selectedType === 'all' || selectedType === 'receipt') {
        if (selectedStatus !== 'draft') {
          try {
            let rQuery = `
              SELECT r.id, 'receipt' AS doc_type, r.receipt_number AS document_number,
                     COALESCE(c.name, 'Customer') AS customer_name,
                     COALESCE(p.amount_minor, 0) AS total_minor,
                     0 AS balance_minor,
                     COALESCE(d.currency, 'INR') AS currency,
                     'paid' AS lifecycle_status,
                     r.issue_date, 0 AS is_universal
              FROM receipts r
              LEFT JOIN payments p ON r.payment_id = p.id
              LEFT JOIN documents d ON r.invoice_id = d.id
              LEFT JOIN customers c ON d.customer_id = c.id
            `;
            const rParams: any[] = [];
            if (searchQuery.trim()) {
              rQuery += ' WHERE (r.receipt_number LIKE ? OR c.name LIKE ? OR p.reference LIKE ?)';
              const wild = `%${searchQuery.trim()}%`;
              rParams.push(wild, wild, wild);
            }
            rQuery += ' ORDER BY r.issue_date DESC';
            const receiptItems = await db.getAllAsync<DocumentListItem>(rQuery, rParams);
            if (receiptItems) allResults.push(...receiptItems);
          } catch {
            // Table may not have data
          }
        }
      }

      // 3. Query universal documents (Job Offers, Work Orders, Salary Slips, Fee Receipts, etc.)
      if (selectedType === 'all' || selectedType === 'universal') {
        try {
          let uQuery = `
            SELECT u.id, u.template_id AS doc_type, u.document_number,
                   COALESCE(u.recipient_name, 'Recipient') AS customer_name,
                   COALESCE(u.total_minor, 0) AS total_minor,
                   0 AS balance_minor,
                   COALESCE(u.currency, 'INR') AS currency,
                   u.lifecycle_status,
                   u.issue_date, 1 AS is_universal
            FROM universal_documents u
            WHERE u.is_archived = 0
          `;
          const uParams: any[] = [];

          if (selectedStatus === 'draft') {
            uQuery += " AND u.lifecycle_status = 'draft'";
          } else if (selectedStatus === 'issued') {
            uQuery += " AND u.lifecycle_status IN ('issued', 'paid')";
          }

          if (searchQuery.trim()) {
            uQuery += ' AND (u.document_number LIKE ? OR u.recipient_name LIKE ? OR u.title LIKE ?)';
            const wild = `%${searchQuery.trim()}%`;
            uParams.push(wild, wild, wild);
          }

          uQuery += ' ORDER BY u.created_at DESC';
          const uItems = await db.getAllAsync<DocumentListItem>(uQuery, uParams);
          if (uItems) allResults.push(...uItems);
        } catch {
          // universal_documents may not exist in earlier mocks
        }
      }

      // Sort combined list descending by issue date
      allResults.sort((a, b) => (b.issue_date || 0) - (a.issue_date || 0));

      setDocuments(allResults);
    } catch {
      setDocuments([]);
    }
  }, [searchQuery, selectedType, selectedStatus]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [loadDocuments])
  );

  const handleDocumentPress = (item: DocumentListItem) => {
    if (item.is_universal) {
      router.push({ pathname: '/templates/studio', params: { id: item.id } });
    } else if (item.doc_type === 'receipt') {
      router.push(`/receipt/${item.id}`);
    } else {
      router.push(`/document/${item.id}`);
    }
  };

  const handleCreateChoice = (choice: string) => {
    setShowCreateSheet(false);
    setCreateModalSearch('');
    setCreateModalCategory('all');
    setSelectedPackId(null);
    setModalMode('categories');
    if (choice === 'quick-bill') {
      router.push('/quick-bill');
    } else {
      router.push({ pathname: '/document/templates', params: { type: choice } });
    }
  };

  const categories: { key: DocCategoryFilter; label: string }[] = [
    { key: 'all', label: 'All Documents' },
    { key: 'invoice', label: 'Invoices' },
    { key: 'estimate', label: 'Estimates' },
    { key: 'receipt', label: 'Receipts' },
    { key: 'universal', label: 'Studio Docs' },
  ];

  const statuses: { key: DocStatusFilter; label: string }[] = [
    { key: 'all', label: 'All Status' },
    { key: 'draft', label: 'Drafts' },
    { key: 'issued', label: 'Issued' },
  ];

  const renderItem = ({ item }: { item: DocumentListItem }) => {
    const amount = item.total_minor > 0
      ? formatMoney({ amountMinor: BigInt(item.total_minor), currency: item.currency }, locale)
      : undefined;
    const dateStr = formatDateDisplay(item.issue_date);
    const clientPart = item.customer_name && item.customer_name !== 'null' ? item.customer_name : 'No client assigned';
    const subtitle = `${formatDocTypeName(item.doc_type)} · ${clientPart}${dateStr ? ` · ${dateStr}` : ''}`;

    return (
      <DocumentRow
        title={item.document_number || formatDocTypeName(item.doc_type)}
        subtitle={subtitle}
        amountText={amount}
        statusText={item.lifecycle_status}
        onPress={() => handleDocumentPress(item)}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header Row */}
        <View style={styles.header}>
          <Pressable
            onPress={openDrawer}
            style={styles.headerMenuBtn}
            accessibilityRole="button"
            accessibilityLabel="Open navigation drawer"
            hitSlop={8}
          >
            <Menu size={22} color={theme.textPrimary} strokeWidth={2} />
          </Pressable>
          <View style={styles.headerTextCol}>
            <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Documents</Text>
            <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
              Create, manage, and keep all your business documents in one place.
            </Text>
          </View>
          <View style={styles.headerActions}>
            <IconButton
              icon={<Plus size={20} color={theme.textPrimary} />}
              onPress={() => setShowCreateSheet(true)}
              accessibilityLabel="Create a new document"
              size={44}
            />
          </View>
        </View>

        {/* Standardized Search Bar */}
        <View style={styles.searchContainer}>
          <SearchField
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search documents by number, client, note..."
            onClear={() => setSearchQuery('')}
          />
        </View>

        {/* Category Filters Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          style={styles.filterScrollView}
        >
          {categories.map((cat) => {
            const isSelected = selectedType === cat.key;
            return (
              <Pressable
                key={cat.key}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${cat.label}`}
                onPress={() => setSelectedType(cat.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? theme.primaryActionBg : theme.surfaceSecondary,
                    borderColor: isSelected ? theme.borderFocused : theme.borderDefault,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? theme.primaryActionText : theme.textSecondary },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Status Filters Bar */}
        <View style={styles.statusRow}>
          {statuses.map((st) => {
            const isSelected = selectedStatus === st.key;
            return (
              <Pressable
                key={st.key}
                accessibilityRole="button"
                accessibilityLabel={`Status ${st.label}`}
                onPress={() => setSelectedStatus(st.key)}
                style={[
                  styles.statusChip,
                  {
                    backgroundColor: isSelected ? theme.surfaceSecondary : 'transparent',
                    borderColor: isSelected ? theme.borderDefault : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    { color: isSelected ? theme.textPrimary : theme.textMuted },
                  ]}
                >
                  {st.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Documents FlatList */}
        <FlatList
          data={documents}
          keyExtractor={(item) => `${item.doc_type}_${item.id}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title={searchQuery ? 'No matching documents' : 'No documents in this view'}
              description={
                searchQuery
                  ? 'Try a different search term or clear the filter.'
                  : 'Tap + to create an invoice, estimate, receipt or studio document.'
              }
              actionLabel="+ New Document"
              onAction={() => setShowCreateSheet(true)}
            />
          }
        />
      </View>

      {/* Creation Sheet Modal */}
      <Modal
        visible={showCreateSheet}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowCreateSheet(false);
          setCreateModalSearch('');
          setCreateModalCategory('all');
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setShowCreateSheet(false);
            setCreateModalSearch('');
            setCreateModalCategory('all');
          }}
        >
          <Pressable
            style={[
              styles.sheetContainer,
              { backgroundColor: theme.surface, borderColor: theme.borderDefault },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
                  New Document
                </Text>
                <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>
                  Universal document engine: 26 statutory and enterprise business document templates
                </Text>
              </View>
              <IconButton
                icon={<X size={18} color={theme.textPrimary} />}
                onPress={() => {
                  setShowCreateSheet(false);
                  setCreateModalSearch('');
                  setCreateModalCategory('all');
                  setSelectedPackId(null);
                  setModalMode('categories');
                }}
                accessibilityLabel="Close"
                size={36}
              />
            </View>

            {/* Modal Search Field */}
            <View style={styles.modalSearchRow}>
              <SearchField
                value={createModalSearch}
                onChangeText={setCreateModalSearch}
                placeholder="Search by name, rule (e.g. 46, 55), or keyword..."
                onClear={() => setCreateModalSearch('')}
              />
            </View>

            {/* Navigation Mode Selector: Categories vs Industry Packs */}
            <View style={styles.modeToggleRow}>
              <Pressable
                onPress={() => {
                  setModalMode('categories');
                  setSelectedPackId(null);
                }}
                style={[
                  styles.modeToggleBtn,
                  {
                    backgroundColor: modalMode === 'categories' ? theme.primaryActionBg : theme.surfaceSecondary,
                    borderColor: modalMode === 'categories' ? theme.borderFocused : theme.borderDefault,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modeToggleText,
                    { color: modalMode === 'categories' ? theme.primaryActionText : theme.textSecondary },
                  ]}
                >
                  Document Categories
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setModalMode('packs')}
                style={[
                  styles.modeToggleBtn,
                  {
                    backgroundColor: modalMode === 'packs' ? theme.primaryActionBg : theme.surfaceSecondary,
                    borderColor: modalMode === 'packs' ? theme.borderFocused : theme.borderDefault,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modeToggleText,
                    { color: modalMode === 'packs' ? theme.primaryActionText : theme.textSecondary },
                  ]}
                >
                  Industry Packs (26)
                </Text>
              </Pressable>
            </View>

            {/* Categories Mode View */}
            {modalMode === 'categories' && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.modalCategoryContent}
                style={styles.modalCategoryScroll}
              >
                {CREATE_MODAL_CATEGORIES.map((cat) => {
                  const isSelected = createModalCategory === cat.key;
                  return (
                    <Pressable
                      key={cat.key}
                      accessibilityRole="button"
                      accessibilityLabel={`Filter by ${cat.label}`}
                      onPress={() => setCreateModalCategory(cat.key)}
                      style={[
                        styles.modalCategoryChip,
                        {
                          backgroundColor: isSelected ? theme.primaryActionBg : theme.surfaceSecondary,
                          borderColor: isSelected ? theme.borderFocused : theme.borderDefault,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalCategoryText,
                          { color: isSelected ? theme.primaryActionText : theme.textSecondary },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {/* Industry Packs Mode View */}
            {modalMode === 'packs' && (
              <View>
                {/* Sector Selector */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.sectorContent}
                  style={styles.sectorScroll}
                >
                  <Pressable
                    onPress={() => setSelectedPackSector('all')}
                    style={[
                      styles.sectorChip,
                      {
                        backgroundColor: selectedPackSector === 'all' ? theme.primaryActionBg : theme.surfaceSecondary,
                        borderColor: selectedPackSector === 'all' ? theme.borderFocused : theme.borderDefault,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sectorText,
                        { color: selectedPackSector === 'all' ? theme.primaryActionText : theme.textSecondary },
                      ]}
                    >
                      All Sectors
                    </Text>
                  </Pressable>
                  {SECTOR_DEFINITIONS.map((sec) => {
                    const isSel = selectedPackSector === sec.id;
                    return (
                      <Pressable
                        key={sec.id}
                        onPress={() => setSelectedPackSector(sec.id)}
                        style={[
                          styles.sectorChip,
                          {
                            backgroundColor: isSel ? theme.primaryActionBg : theme.surfaceSecondary,
                            borderColor: isSel ? theme.borderFocused : theme.borderDefault,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.sectorText,
                            { color: isSel ? theme.primaryActionText : theme.textSecondary },
                          ]}
                        >
                          {sec.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Organization Pack Chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.packContent}
                  style={styles.packScroll}
                >
                  {visiblePacks.map((pack) => {
                    const isSel = selectedPackId === pack.id;
                    return (
                      <Pressable
                        key={pack.id}
                        onPress={() => setSelectedPackId(isSel ? null : pack.id)}
                        style={[
                          styles.packChip,
                          {
                            backgroundColor: isSel ? theme.primaryActionBg : theme.surfaceSecondary,
                            borderColor: isSel ? theme.borderFocused : theme.borderDefault,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.packText,
                            { color: isSel ? theme.primaryActionText : theme.textPrimary },
                          ]}
                        >
                          {pack.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Active Pack Banner */}
                {activePack && (
                  <View
                    style={[
                      styles.packBanner,
                      { backgroundColor: theme.surfaceSecondary, borderColor: 'rgba(255, 255, 255, 0.12)' },
                    ]}
                  >
                    <View style={styles.packBannerTop}>
                      <Text style={[styles.packBannerTitle, { color: theme.textPrimary }]}>
                        {activePack.name}
                      </Text>
                      <Pressable onPress={() => setSelectedPackId(null)} hitSlop={8}>
                        <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700' }}>
                          CLEAR PACK ✕
                        </Text>
                      </Pressable>
                    </View>
                    <Text style={[styles.packBannerSector, { color: theme.textSecondary }]}>
                      {activePack.sectorLabel} · {activePack.samplePartyType}
                    </Text>
                    <Text style={[styles.packBannerDesc, { color: theme.textSecondary }]}>
                      {activePack.description}
                    </Text>
                    <View style={styles.packBannerMeta}>
                      <View style={[styles.packWorkflowBadge, { borderColor: theme.borderDefault, backgroundColor: theme.surface }]}>
                        <Text style={[styles.packWorkflowText, { color: theme.textPrimary }]}>
                          WORKFLOW: {activePack.workflowIds.join(' · ').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                      Statutory: {activePack.statutoryNotes}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Counter bar */}
            <View style={styles.modalMetaRow}>
              <Text style={[styles.modalMetaText, { color: theme.textMuted }]}>
                {activePack
                  ? `${filteredCreateOptions.length} recommended for ${activePack.name}`
                  : filteredCreateOptions.length === 1
                  ? '1 document available'
                  : `${filteredCreateOptions.length} documents available`}
              </Text>
              {createModalSearch.trim() || createModalCategory !== 'all' || selectedPackId ? (
                <Pressable
                  onPress={() => {
                    setCreateModalSearch('');
                    setCreateModalCategory('all');
                    setSelectedPackId(null);
                  }}
                  hitSlop={6}
                >
                  <Text style={[styles.modalResetText, { color: theme.textSecondary }]}>
                    Reset Filters
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {/* Options List */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {filteredCreateOptions.length === 0 ? (
                <View style={styles.modalEmptyBox}>
                  <Text style={[styles.modalEmptyTitle, { color: theme.textPrimary }]}>
                    No documents found
                  </Text>
                  <Text style={[styles.modalEmptyDesc, { color: theme.textSecondary }]}>
                    No document matches "{createModalSearch}". Try searching for invoice, salary, offer, rent, po, or clear the search.
                  </Text>
                  <Pressable
                    style={[
                      styles.modalEmptyBtn,
                      { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderDefault },
                    ]}
                    onPress={() => {
                      setCreateModalSearch('');
                      setCreateModalCategory('all');
                    }}
                  >
                    <Text style={[styles.modalEmptyBtnText, { color: theme.textPrimary }]}>
                      Clear Search Filters
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.sheetOptions}>
                  {filteredCreateOptions.map((opt) => {
                    const IconComp = opt.icon;
                    return (
                      <Pressable
                        key={opt.id}
                        style={({ pressed }) => [
                          styles.sheetOption,
                          {
                            backgroundColor: theme.surfaceSecondary,
                            borderColor: 'rgba(255, 255, 255, 0.06)',
                            opacity: pressed ? 0.82 : 1,
                          },
                        ]}
                        onPress={() => handleCreateChoice(opt.id)}
                      >
                        <View style={[styles.optionIconBox, { backgroundColor: theme.surface }]}>
                          <IconComp size={18} color={theme.textPrimary} strokeWidth={2} />
                        </View>
                        <View style={styles.optionTextBox}>
                          <View style={styles.optionTitleRow}>
                            <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
                              {opt.name}
                            </Text>
                            <View
                              style={[
                                styles.optionBadge,
                                {
                                  backgroundColor: theme.surface,
                                  borderColor: theme.borderDefault,
                                },
                              ]}
                            >
                              <Text
                                style={[styles.optionBadgeText, { color: theme.textSecondary }]}
                              >
                                {opt.badge}
                              </Text>
                            </View>
                          </View>
                          <Text
                            style={[styles.optionDesc, { color: theme.textSecondary }]}
                            numberOfLines={2}
                          >
                            {opt.tagline}
                          </Text>
                        </View>
                        <ChevronRight size={16} color={theme.textMuted} />
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Payment Modals */}
      {upiDoc && (
        <DocumentUpiModal
          visible={!!upiDoc}
          document={upiDoc}
          profile={profile}
          locale={locale}
          onClose={() => setUpiDoc(null)}
          onRecordPayment={(item) => {
            setUpiDoc(null);
            setRecordPaymentDoc(item);
          }}
        />
      )}

      {recordPaymentDoc && (
        <PaymentRecordModal
          visible={!!recordPaymentDoc}
          invoiceId={recordPaymentDoc.id}
          invoiceNumber={recordPaymentDoc.document_number}
          currency={recordPaymentDoc.currency}
          totalMinor={recordPaymentDoc.total_minor}
          balanceMinor={recordPaymentDoc.balance_minor ?? recordPaymentDoc.total_minor}
          documentLocale={locale}
          onPaymentRecorded={() => {
            setRecordPaymentDoc(null);
            loadDocuments();
          }}
          onClose={() => setRecordPaymentDoc(null)}
        />
      )}

      {/* Feature Introduction Sheet */}
      <FeatureIntroductionSheet
        featureId="documents"
        title="Documents"
        description="Create professional invoices, quotes, receipts and more — all in one place."
        primaryActionLabel="Get started"
        onPrimaryAction={() => setShowCreateSheet(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerMenuBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  headerTextCol: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    marginLeft: spacing.md,
  },
  searchContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  filterScrollView: {
    maxHeight: 46,
    marginBottom: spacing.xs,
  },
  filterScroll: {
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radii.button,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.md,
  },
  statusChip: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  sheetContainer: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.xl,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  modalSearchRow: {
    marginBottom: spacing.sm,
  },
  modalCategoryScroll: {
    maxHeight: 38,
    marginBottom: spacing.sm,
  },
  modalCategoryContent: {
    gap: 6,
    alignItems: 'center',
    paddingVertical: 2,
  },
  modalCategoryChip: {
    minHeight: 30,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCategoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
  },
  modalMetaText: {
    fontSize: 11.5,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  modalResetText: {
    fontSize: 11.5,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  modalScrollContent: {
    paddingBottom: spacing.lg,
  },
  sheetOptions: {
    gap: 10,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.card,
    borderWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
  },
  optionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionTextBox: {
    flex: 1,
    paddingRight: 8,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  optionTitle: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  optionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  optionBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  optionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  modalEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: spacing.lg,
  },
  modalEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalEmptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalEmptyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  modalEmptyBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.sm,
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  sectorScroll: {
    maxHeight: 36,
    marginBottom: 6,
  },
  sectorContent: {
    gap: 6,
    alignItems: 'center',
    paddingVertical: 2,
  },
  sectorChip: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectorText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  packScroll: {
    maxHeight: 40,
    marginBottom: 8,
  },
  packContent: {
    gap: 6,
    alignItems: 'center',
    paddingVertical: 2,
  },
  packChip: {
    minHeight: 30,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  packText: {
    fontSize: 12,
    fontWeight: '600',
  },
  packBanner: {
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  packBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  packBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  packBannerSector: {
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 4,
  },
  packBannerDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  packBannerMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  packWorkflowBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  packWorkflowText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});

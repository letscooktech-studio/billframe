/**
 * BILLFRAME CANONICAL ICON SYSTEM
 * Single source of truth for all feature icons, semantics, sizing, and stroke language.
 * Strictly uses lucide-react-native. No mixed icon sets or emoji icons.
 */

import React from 'react';
import {
  FileText,
  ClipboardList,
  Users,
  Package,
  ScanBarcode,
  ReceiptText,
  WalletCards,
  CircleDollarSign,
  ChartNoAxesCombined,
  BriefcaseBusiness,
  Clock,
  ShoppingCart,
  Truck,
  DatabaseBackup,
  ShieldCheck,
  Shield,
  Settings,
  Search,
  Zap,
  Plus,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  ChevronDown,
  Check,
  AlertCircle,
  X,
  SlidersHorizontal,
  Lock,
  Layers,
  Sparkles,
  RefreshCw,
  RotateCcw,
  Building2,
  FileCheck2,
  Share2,
  Printer,
  Calendar,
  CreditCard,
  QrCode,
  Info,
  LucideIcon,
} from 'lucide-react-native';

export const iconSizes = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export type IconSize = keyof typeof iconSizes | number;

export const iconStrokeWidth = 1.75;

export const FEATURE_ICONS: Record<string, LucideIcon> = {
  invoices: FileText,
  estimates: ClipboardList,
  customers: Users,
  inventory: Package,
  barcode: ScanBarcode,
  expenses: ReceiptText,
  payments: WalletCards,
  collections: CircleDollarSign,
  reports: ChartNoAxesCombined,
  jobs: BriefcaseBusiness,
  timesheets: Clock,
  purchases: ShoppingCart,
  suppliers: Truck,
  backup: DatabaseBackup,
  security: ShieldCheck,
  settings: Settings,
  search: Search,
  quick_bill: Zap,
  new_invoice: Plus,
  proforma: FileCheck2,
  credit_note: ReceiptText,
  delivery_challan: Truck,
  gst: Building2,
  recurring: RefreshCw,
  workspace: Layers,
  lock: Lock,
  smart_magic: Sparkles,
  share: Share2,
  print: Printer,
  calendar: Calendar,
  card: CreditCard,
  qr: QrCode,
  info: Info,
  filter: SlidersHorizontal,
  chevron_right: ChevronRight,
  chevron_down: ChevronDown,
  arrow_right: ArrowRight,
  arrow_up_right: ArrowUpRight,
  check: Check,
  alert: AlertCircle,
  close: X,
};

export interface FeatureIconProps {
  name: keyof typeof FEATURE_ICONS | string;
  size?: IconSize;
  color?: string;
  strokeWidth?: number;
}

export function FeatureIcon({
  name,
  size = 'md',
  color = '#111111',
  strokeWidth = iconStrokeWidth,
}: FeatureIconProps) {
  const IconComponent = FEATURE_ICONS[name] || FileText;
  const pixelSize = typeof size === 'number' ? size : iconSizes[size] || 20;

  return React.createElement(IconComponent, { size: pixelSize, color, strokeWidth });
}

export {
  FileText,
  ClipboardList,
  Users,
  Package,
  ScanBarcode,
  ReceiptText,
  WalletCards,
  CircleDollarSign,
  ChartNoAxesCombined,
  BriefcaseBusiness,
  Clock,
  ShoppingCart,
  Truck,
  DatabaseBackup,
  ShieldCheck,
  Shield,
  Settings,
  Search,
  Zap,
  Plus,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  ChevronDown,
  Check,
  AlertCircle,
  X,
  SlidersHorizontal,
  Lock,
  Layers,
  Sparkles,
  RefreshCw,
  RotateCcw,
  Building2,
  FileCheck2,
  Share2,
  Printer,
  Calendar,
  CreditCard,
  QrCode,
  Info,
};

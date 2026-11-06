/**
 * COPILOT ACTION SHEET
 * 
 * Elegant bottom sheet overlay modeled after modern mobile AI copilots:
 * - High-speed document operations (Preview, Print, Save HTML, Document Studio)
 * - Canonical financial & statutory template launchers
 * - Strict Billframe monochrome theme: deep dark canvas (#111215), white typography,
 *   subtle borders (#26272B), zero jarring colors.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Eye,
  Printer,
  Download,
  Sliders,
  FileText,
  Briefcase,
  Sparkles,
  Building2,
  Layers,
  Truck,
  X,
} from 'lucide-react-native';
import { ParsedDocumentDraft } from '../../services/ai/AiDocumentAgent';

export interface CopilotActionSheetProps {
  visible: boolean;
  onClose: () => void;
  activeDraft: ParsedDocumentDraft | null;
  onPreview: () => void;
  onPrint: () => void;
  onDownloadHtml: () => void;
  onOpenStudio: () => void;
  onSelectPrompt: (prompt: string) => void;
}

export const CopilotActionSheet: React.FC<CopilotActionSheetProps> = ({
  visible,
  onClose,
  activeDraft,
  onPreview,
  onPrint,
  onDownloadHtml,
  onOpenStudio,
  onSelectPrompt,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header Row */}
          <View style={styles.headerRow}>
            <Text style={styles.sheetTitle}>Document Actions</Text>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close actions"
            >
              <X size={16} color="#A5A6AB" />
            </Pressable>
          </View>

          {/* Top Squircle Quick Actions Row */}
          <View style={styles.quickActionsRow}>
            {/* Preview */}
            <Pressable
              style={({ pressed }) => [
                styles.squircleActionBtn,
                pressed && styles.actionBtnPressed,
                !activeDraft && styles.actionBtnDisabled,
              ]}
              onPress={() => {
                onClose();
                onPreview();
              }}
              disabled={!activeDraft}
              accessibilityRole="button"
              accessibilityLabel="Preview document"
            >
              <View style={styles.iconCircle}>
                <Eye size={20} color={activeDraft ? '#F5F5F6' : '#55565B'} />
              </View>
              <Text style={[styles.squircleLabel, !activeDraft && styles.labelDisabled]}>
                Preview
              </Text>
            </Pressable>

            {/* Print */}
            <Pressable
              style={({ pressed }) => [
                styles.squircleActionBtn,
                pressed && styles.actionBtnPressed,
                !activeDraft && styles.actionBtnDisabled,
              ]}
              onPress={() => {
                onClose();
                onPrint();
              }}
              disabled={!activeDraft}
              accessibilityRole="button"
              accessibilityLabel="Print document"
            >
              <View style={styles.iconCircle}>
                <Printer size={20} color={activeDraft ? '#F5F5F6' : '#55565B'} />
              </View>
              <Text style={[styles.squircleLabel, !activeDraft && styles.labelDisabled]}>
                Print
              </Text>
            </Pressable>

            {/* Save HTML */}
            <Pressable
              style={({ pressed }) => [
                styles.squircleActionBtn,
                pressed && styles.actionBtnPressed,
                !activeDraft && styles.actionBtnDisabled,
              ]}
              onPress={() => {
                onClose();
                onDownloadHtml();
              }}
              disabled={!activeDraft}
              accessibilityRole="button"
              accessibilityLabel="Save HTML"
            >
              <View style={styles.iconCircle}>
                <Download size={20} color={activeDraft ? '#F5F5F6' : '#55565B'} />
              </View>
              <Text style={[styles.squircleLabel, !activeDraft && styles.labelDisabled]}>
                Save HTML
              </Text>
            </Pressable>

            {/* Studio */}
            <Pressable
              style={({ pressed }) => [
                styles.squircleActionBtn,
                pressed && styles.actionBtnPressed,
              ]}
              onPress={() => {
                onClose();
                onOpenStudio();
              }}
              accessibilityRole="button"
              accessibilityLabel="Open Document Studio"
            >
              <View style={styles.iconCircle}>
                <Sliders size={20} color="#F5F5F6" />
              </View>
              <Text style={styles.squircleLabel}>Studio</Text>
            </Pressable>
          </View>

          {/* Active Draft Sub-banner if present */}
          {activeDraft && (
            <View style={styles.activeDraftNotice}>
              <Text style={styles.activeDraftNoticeText} numberOfLines={1}>
                Active: <Text style={{ color: '#F5F5F6', fontWeight: '700' }}>{activeDraft.documentTitle}</Text> ({activeDraft.documentNumber})
              </Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Quick Archetype & Template Launchers List */}
          <ScrollView
            style={styles.startersList}
            contentContainerStyle={styles.startersContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionHeader}>Instant Document Starters</Text>

            {/* GST Tax Invoice */}
            <Pressable
              style={({ pressed }) => [styles.starterItem, pressed && styles.starterItemPressed]}
              onPress={() => {
                onClose();
                onSelectPrompt('Draft a GST Tax Invoice for Acme Corp with 18% GST');
              }}
            >
              <View style={styles.starterIconBox}>
                <FileText size={18} color="#F5F5F6" />
              </View>
              <View style={styles.starterTextBox}>
                <Text style={styles.starterTitle}>Tax Invoice & GST</Text>
                <Text style={styles.starterDesc}>B2B & B2C invoice with statutory HSN/SAC and 18% GST</Text>
              </View>
            </Pressable>

            {/* Salary Slip */}
            <Pressable
              style={({ pressed }) => [styles.starterItem, pressed && styles.starterItemPressed]}
              onPress={() => {
                onClose();
                onSelectPrompt('Create a salary slip for John Doe, Senior Architect, basic 65,000, HRA 25,000, PF 3,600 for October 2026');
              }}
            >
              <View style={styles.starterIconBox}>
                <Briefcase size={18} color="#F5F5F6" />
              </View>
              <View style={styles.starterTextBox}>
                <Text style={styles.starterTitle}>Salary & Payslip</Text>
                <Text style={styles.starterDesc}>Statutory monthly earnings, PF deductions and net pay</Text>
              </View>
            </Pressable>

            {/* ATS Resume */}
            <Pressable
              style={({ pressed }) => [styles.starterItem, pressed && styles.starterItemPressed]}
              onPress={() => {
                onClose();
                onSelectPrompt('build me complete highest ats scoring resume for farhan noor for ai engineer');
              }}
            >
              <View style={styles.starterIconBox}>
                <Sparkles size={18} color="#F5F5F6" />
              </View>
              <View style={styles.starterTextBox}>
                <Text style={styles.starterTitle}>ATS Engineering Resume</Text>
                <Text style={styles.starterDesc}>High-impact CV optimized for applicant tracking systems</Text>
              </View>
            </Pressable>

            {/* House Rent Receipt */}
            <Pressable
              style={({ pressed }) => [styles.starterItem, pressed && styles.starterItemPressed]}
              onPress={() => {
                onClose();
                onSelectPrompt('Generate a House Rent Receipt for tenant Rahul Sharma for 28,000 INR');
              }}
            >
              <View style={styles.starterIconBox}>
                <Building2 size={18} color="#F5F5F6" />
              </View>
              <View style={styles.starterTextBox}>
                <Text style={styles.starterTitle}>House Rent Receipt</Text>
                <Text style={styles.starterDesc}>HRA tax exemption proof with revenue stamp ledger</Text>
              </View>
            </Pressable>

            {/* Commercial Quotation */}
            <Pressable
              style={({ pressed }) => [styles.starterItem, pressed && styles.starterItemPressed]}
              onPress={() => {
                onClose();
                onSelectPrompt('Draft a commercial quotation for enterprise cloud consulting with 15-day validity');
              }}
            >
              <View style={styles.starterIconBox}>
                <Layers size={18} color="#F5F5F6" />
              </View>
              <View style={styles.starterTextBox}>
                <Text style={styles.starterTitle}>Commercial Quotation</Text>
                <Text style={styles.starterDesc}>Formal sales quotation with payment terms & scope</Text>
              </View>
            </Pressable>

            {/* Delivery Challan */}
            <Pressable
              style={({ pressed }) => [styles.starterItem, pressed && styles.starterItemPressed]}
              onPress={() => {
                onClose();
                onSelectPrompt('Generate a delivery challan for 5 servers dispatch to Mumbai Data Center');
              }}
            >
              <View style={styles.starterIconBox}>
                <Truck size={18} color="#F5F5F6" />
              </View>
              <View style={styles.starterTextBox}>
                <Text style={styles.starterTitle}>Delivery Challan</Text>
                <Text style={styles.starterDesc}>Goods dispatch slip with vehicle number & e-way bill</Text>
              </View>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#111215',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#222326',
    borderBottomWidth: 0,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingHorizontal: 20,
    maxHeight: '82%',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 8,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#35363B',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F5F5F6',
    letterSpacing: 0.2,
  },
  closeButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#1E1F24',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  squircleActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18191E',
    borderWidth: 1,
    borderColor: '#26272C',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  actionBtnPressed: {
    opacity: 0.75,
    backgroundColor: '#22232A',
  },
  actionBtnDisabled: {
    opacity: 0.45,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#222328',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  squircleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F5F5F6',
  },
  labelDisabled: {
    color: '#77797F',
  },
  activeDraftNotice: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  activeDraftNoticeText: {
    fontSize: 12,
    color: '#A5A6AB',
  },
  divider: {
    height: 1,
    backgroundColor: '#202126',
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#77797F',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  startersList: {
    maxHeight: 280,
  },
  startersContent: {
    gap: 8,
    paddingBottom: 8,
  },
  starterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16171B',
    borderWidth: 1,
    borderColor: '#222327',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  starterItemPressed: {
    backgroundColor: '#1E1F24',
    borderColor: '#303138',
  },
  starterIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#222328',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starterTextBox: {
    flex: 1,
  },
  starterTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F5F5F6',
    marginBottom: 2,
  },
  starterDesc: {
    fontSize: 11,
    color: '#77797F',
    lineHeight: 15,
  },
});

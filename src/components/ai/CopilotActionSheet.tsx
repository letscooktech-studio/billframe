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
  Image as ImageIcon,
  Camera,
  Paperclip,
  Layers,
  FileText,
  Briefcase,
  Sparkles,
  Home,
  Receipt,
  Truck,
  Printer,
  Sliders,
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
          {/* Center Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Top Row: Horizontal Squircles (Photos, Camera, Files, Canvas) */}
          <View style={styles.topSquirclesRow}>
            {/* Photos */}
            <Pressable
              style={({ pressed }) => [styles.squircleItem, pressed && styles.squirclePressed]}
              onPress={() => {
                onClose();
                onSelectPrompt('Upload an invoice photo or receipt image to extract items and GST');
              }}
              accessibilityRole="button"
              accessibilityLabel="Upload Photos"
            >
              <View style={styles.squircleIconBox}>
                <ImageIcon size={24} color="#F4F4F5" />
              </View>
              <Text style={styles.squircleLabel}>Photos</Text>
            </Pressable>

            {/* Camera */}
            <Pressable
              style={({ pressed }) => [styles.squircleItem, pressed && styles.squirclePressed]}
              onPress={() => {
                onClose();
                onSelectPrompt('Scan a paper invoice or receipt using camera OCR');
              }}
              accessibilityRole="button"
              accessibilityLabel="Scan Camera"
            >
              <View style={styles.squircleIconBox}>
                <Camera size={24} color="#F4F4F5" />
              </View>
              <Text style={styles.squircleLabel}>Camera</Text>
            </Pressable>

            {/* Files */}
            <Pressable
              style={({ pressed }) => [styles.squircleItem, pressed && styles.squirclePressed]}
              onPress={() => {
                onClose();
                onSelectPrompt('Import PDF or CSV file to populate line items and ledger');
              }}
              accessibilityRole="button"
              accessibilityLabel="Attach Files"
            >
              <View style={styles.squircleIconBox}>
                <Paperclip size={24} color="#F4F4F5" />
              </View>
              <Text style={styles.squircleLabel}>Files</Text>
            </Pressable>

            {/* Canvas / Studio */}
            <Pressable
              style={({ pressed }) => [styles.squircleItem, pressed && styles.squirclePressed]}
              onPress={() => {
                onClose();
                if (activeDraft) {
                  onPreview();
                } else {
                  onOpenStudio();
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Open Document Canvas"
            >
              <View style={styles.squircleIconBox}>
                <Layers size={24} color="#F4F4F5" />
              </View>
              <Text style={styles.squircleLabel}>Canvas</Text>
            </Pressable>
          </View>

          {/* Vertical Menu Items */}
          <ScrollView
            style={styles.actionList}
            contentContainerStyle={styles.actionListContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Tax Invoice & GST */}
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
              onPress={() => {
                onClose();
                onSelectPrompt('Draft a GST Tax Invoice for Acme Corp with 18% GST');
              }}
            >
              <View style={styles.actionIconCol}>
                <FileText size={22} color="#F4F4F5" />
              </View>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionTitle}>Tax Invoice & GST</Text>
                <Text style={styles.actionDesc}>CBIC-compliant B2B & B2C invoice with statutory calculations</Text>
              </View>
            </Pressable>

            {/* Salary Slip & Payslip */}
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
              onPress={() => {
                onClose();
                onSelectPrompt('Create a salary slip for John Doe, Senior Architect, basic 65,000, HRA 25,000, PF 3,600 for October 2026');
              }}
            >
              <View style={styles.actionIconCol}>
                <Briefcase size={22} color="#F4F4F5" />
              </View>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionTitle}>Salary & Payslip</Text>
                <Text style={styles.actionDesc}>Statutory monthly earnings, PF deductions and net pay</Text>
              </View>
            </Pressable>

            {/* ATS Resume */}
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
              onPress={() => {
                onClose();
                onSelectPrompt('build me complete highest ats scoring resume for farhan noor for ai engineer');
              }}
            >
              <View style={styles.actionIconCol}>
                <Sparkles size={22} color="#F4F4F5" />
              </View>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionTitle}>ATS Engineering Resume</Text>
                <Text style={styles.actionDesc}>High-impact CV optimized for applicant tracking systems</Text>
              </View>
            </Pressable>

            {/* House Rent Receipt */}
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
              onPress={() => {
                onClose();
                onSelectPrompt('Generate a House Rent Receipt for tenant Rahul Sharma for 28,000 INR');
              }}
            >
              <View style={styles.actionIconCol}>
                <Home size={22} color="#F4F4F5" />
              </View>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionTitle}>House Rent Receipt</Text>
                <Text style={styles.actionDesc}>HRA tax exemption proof with revenue stamp ledger</Text>
              </View>
            </Pressable>

            {/* Commercial Quotation */}
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
              onPress={() => {
                onClose();
                onSelectPrompt('Draft a commercial quotation for enterprise software implementation');
              }}
            >
              <View style={styles.actionIconCol}>
                <Receipt size={22} color="#F4F4F5" />
              </View>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionTitle}>Commercial Quotation</Text>
                <Text style={styles.actionDesc}>Formal sales quotation with payment terms & scope</Text>
              </View>
            </Pressable>

            {/* Delivery Challan */}
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
              onPress={() => {
                onClose();
                onSelectPrompt('Generate an official delivery challan for 50 commercial display panels');
              }}
            >
              <View style={styles.actionIconCol}>
                <Truck size={22} color="#F4F4F5" />
              </View>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionTitle}>Delivery Challan</Text>
                <Text style={styles.actionDesc}>Goods dispatch slip with vehicle number & e-way bill</Text>
              </View>
            </Pressable>

            {/* Document Studio Canvas */}
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
              onPress={() => {
                onClose();
                onOpenStudio();
              }}
            >
              <View style={styles.actionIconCol}>
                <Sliders size={22} color="#F4F4F5" />
              </View>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionTitle}>Canvas & Studio</Text>
                <Text style={styles.actionDesc}>Code, write, or design custom financial templates</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#16171B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 8,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#52525B',
  },
  topSquirclesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  squircleItem: {
    alignItems: 'center',
    gap: 8,
  },
  squirclePressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  squircleIconBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#23242A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  squircleLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#D4D4D8',
  },
  actionList: {
    marginTop: 8,
  },
  actionListContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    gap: 16,
  },
  actionRowPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  actionIconCol: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextCol: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F4F4F5',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
});

/**
 * CUSTOM DOCUMENT BUILDER — IN-APP SCHEMA BUILDER
 * Matches Screen 4 of the Billframe specification:
 * - Top Breadcrumbs & Tabs: [Builder], [Preview], [Settings]
 * - Section 1: Document Details (Document Title *, Description)
 * - Section 2: Form Sections (List with grip handles, descriptive subtext, and + Add Section)
 * - Section 3: Field Types (2x3 interactive grid: Text Field, Text Area, Dropdown, Date, Checkbox, Number)
 * - Live schema preview in [Preview] tab
 * - Saves persistent schema to SQLite via UniversalDocumentRepository
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MoreVertical,
  FileText,
  Layers,
  Edit3,
  GripVertical,
  ChevronRight,
  Plus,
  Type,
  AlignLeft,
  List,
  Calendar,
  CheckSquare,
  Hash,
  Eye,
  Save,
  Trash2,
} from 'lucide-react-native';
import { colors, spacing, radii, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { AuroraBackground } from '../../components/common/AuroraBackground';
import { UniversalDocumentRepository } from '../../data/repositories/UniversalDocumentRepository';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';
import {
  UniversalDocumentSchema,
  UniversalSectionDefinition,
  UniversalFieldDefinition,
  UniversalFieldType,
} from '../../domain/documents/universal/types';

interface SectionDraft {
  id: string;
  title: string;
  subtitle: string;
  fields: UniversalFieldDefinition[];
}

export default function CustomDocumentBuilderScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [activeTab, setActiveTab] = useState<'builder' | 'preview' | 'settings'>('builder');

  // Document Details
  const [docTitle, setDocTitle] = useState('Equipment Responsibility Form');
  const [docDescription, setDocDescription] = useState(
    'Asset handover form for company equipment issued to employees with usage and return terms.'
  );
  const [category, setCategory] = useState<'custom' | 'hr_employment' | 'operations' | 'business_letters'>('custom');

  // Form Sections
  const [sections, setSections] = useState<SectionDraft[]>([
    {
      id: 'sec_employee',
      title: 'Employee Details',
      subtitle: 'Name, ID, Department, Contact',
      fields: [
        { id: 'f_emp_name', label: 'Employee Name', type: 'text', required: true },
        { id: 'f_emp_id', label: 'Employee ID', type: 'text', required: true },
        { id: 'f_emp_dept', label: 'Department', type: 'text' },
      ],
    },
    {
      id: 'sec_assets',
      title: 'Asset Details',
      subtitle: 'Equipment, Serial No., Condition',
      fields: [
        {
          id: 'f_asset_table',
          label: 'Equipment Inventory',
          type: 'table',
          columns: [
            { key: 'item', label: 'Item / Model', type: 'text' },
            { key: 'serial', label: 'Serial No.', type: 'text' },
            { key: 'condition', label: 'Condition', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'sec_terms',
      title: 'Usage Terms',
      subtitle: 'Guidelines and employee responsibilities',
      fields: [
        {
          id: 'f_terms_text',
          label: 'Custody Terms',
          type: 'textarea',
          defaultValue: 'Employee acknowledges receipt in good working order and agrees to company policies.',
        },
      ],
    },
    {
      id: 'sec_signatures',
      title: 'Acknowledgement & Signature',
      subtitle: 'Employee and company signature',
      fields: [
        { id: 'f_emp_sig', label: 'Employee Signature Name', type: 'signature', required: true },
        { id: 'f_co_sig', label: 'Company Signatory Name', type: 'signature', required: true },
      ],
    },
  ]);

  const [selectedSectionId, setSelectedSectionId] = useState<string>('sec_employee');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Add Section
  const handleAddSection = () => {
    const newId = `sec_${Date.now()}`;
    const newSection: SectionDraft = {
      id: newId,
      title: `Custom Section ${sections.length + 1}`,
      subtitle: 'Configure section fields',
      fields: [{ id: `f_${Date.now()}`, label: 'Field Label', type: 'text' }],
    };
    setSections((prev) => [...prev, newSection]);
    setSelectedSectionId(newId);
  };

  // Add Field to Active Section
  const handleAddFieldType = (fieldType: UniversalFieldType) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== selectedSectionId) return sec;
        const newField: UniversalFieldDefinition = {
          id: `f_${Date.now()}`,
          label: `New ${fieldType.toUpperCase()} Field`,
          type: fieldType,
          required: false,
        };
        return {
          ...sec,
          fields: [...sec.fields, newField],
          subtitle: `${sec.fields.length + 1} fields configured`,
        };
      })
    );
  };

  // Save Schema to SQLite
  const handleSaveSchema = async () => {
    if (!docTitle.trim()) {
      Alert.alert('Required Field', 'Please enter a document title.');
      return;
    }

    try {
      setIsSaving(true);
      const activeProfile = await BusinessProfileRepository.getActiveProfile();
      const profileId = activeProfile?.id || 'default_business';

      const code = docTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const compiledSections: UniversalSectionDefinition[] = sections.map((s) => ({
        id: s.id,
        title: s.title,
        fields: s.fields,
      }));

      const newSchema: UniversalDocumentSchema = {
        id: `custom_${Date.now()}`,
        code,
        name: docTitle,
        docClass: 'class_c_custom',
        category,
        description: docDescription,
        icon: 'file-text',
        defaultTemplate: 'custom_studio',
        isSystem: false,
        sections: compiledSections,
        headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
        footerConfig: { showSignatures: true, showTerms: true, showNotes: false, authorizedSignatoryLabel: 'Authorized Signatory' },
      };

      await UniversalDocumentRepository.saveCustomDocumentTypeAsync(newSchema, profileId);
      Alert.alert('Schema Created', `Custom document type "${docTitle}" has been saved.`, [
        {
          text: 'Open in Studio',
          onPress: () => router.push({ pathname: '/templates/studio', params: { typeId: newSchema.id } }),
        },
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save custom schema.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuroraBackground section="template_studio" intensity="subtle">
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={theme.textPrimary} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{docTitle || 'Custom Document'}</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Create a custom document
            </Text>
          </View>

          <Pressable style={styles.moreBtn}>
            <MoreVertical size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Top Navigation Tabs: [Builder] | [Preview] | [Settings] */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tabButton, activeTab === 'builder' && styles.tabButtonActive]}
            onPress={() => setActiveTab('builder')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'builder' && styles.tabButtonTextActive]}>
              Builder
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'preview' && styles.tabButtonActive]}
            onPress={() => setActiveTab('preview')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'preview' && styles.tabButtonTextActive]}>
              Preview
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'settings' && styles.tabButtonActive]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'settings' && styles.tabButtonTextActive]}>
              Settings
            </Text>
          </Pressable>
        </View>

        {activeTab === 'builder' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Section 1: Document Details */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <FileText size={18} color="#FFFFFF" />
                <Text style={styles.sectionTitle}>Document Details</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Document Title *</Text>
                <TextInput
                  style={styles.textInput}
                  value={docTitle}
                  onChangeText={setDocTitle}
                  placeholder="e.g. Equipment Responsibility Form"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  value={docDescription}
                  onChangeText={setDocDescription}
                  placeholder="Asset handover form for company equipment issued to employees with usage and return terms."
                  placeholderTextColor="#64748B"
                  multiline
                />
              </View>
            </View>

            {/* Section 2: Form Sections */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Layers size={18} color="#FFFFFF" />
                <View>
                  <Text style={styles.sectionTitle}>Form Sections</Text>
                  <Text style={styles.sectionSubtitle}>Add and configure the sections for this document.</Text>
                </View>
              </View>

              {/* Sections List */}
              <View style={styles.sectionsList}>
                {sections.map((sec, idx) => {
                  const isSelected = sec.id === selectedSectionId;
                  return (
                    <Pressable
                      key={sec.id}
                      style={[
                        styles.sectionItemCard,
                        isSelected && styles.sectionItemCardSelected,
                      ]}
                      onPress={() => setSelectedSectionId(sec.id)}
                    >
                      <View style={styles.sectionItemLeft}>
                        <GripVertical size={16} color="#64748B" />
                        <View>
                          <Text style={styles.sectionItemTitle}>{sec.title}</Text>
                          <Text style={styles.sectionItemSub}>{sec.subtitle}</Text>
                        </View>
                      </View>
                      <ChevronRight size={16} color={isSelected ? '#38BDF8' : '#64748B'} />
                    </Pressable>
                  );
                })}
              </View>

              {/* + Add Section Outline Button */}
              <Pressable style={styles.addSectionBtn} onPress={handleAddSection}>
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.addSectionBtnText}>Add Section</Text>
              </Pressable>
            </View>

            {/* Section 3: Field Types 2x3 Grid */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Edit3 size={18} color="#FFFFFF" />
                <View>
                  <Text style={styles.sectionTitle}>Field Types</Text>
                  <Text style={styles.sectionSubtitle}>Add fields to the selected section.</Text>
                </View>
              </View>

              <View style={styles.fieldGrid}>
                {/* 1. Text Field */}
                <Pressable
                  style={styles.fieldGridTile}
                  onPress={() => handleAddFieldType('text')}
                >
                  <Type size={18} color="#FFFFFF" />
                  <Text style={styles.fieldGridTileTitle}>Text Field</Text>
                  <Text style={styles.fieldGridTileDesc}>Single line text input</Text>
                </Pressable>

                {/* 2. Text Area */}
                <Pressable
                  style={styles.fieldGridTile}
                  onPress={() => handleAddFieldType('textarea')}
                >
                  <AlignLeft size={18} color="#FFFFFF" />
                  <Text style={styles.fieldGridTileTitle}>Text Area</Text>
                  <Text style={styles.fieldGridTileDesc}>Multi-line text input</Text>
                </Pressable>

                {/* 3. Dropdown */}
                <Pressable
                  style={styles.fieldGridTile}
                  onPress={() => handleAddFieldType('select')}
                >
                  <List size={18} color="#FFFFFF" />
                  <Text style={styles.fieldGridTileTitle}>Dropdown</Text>
                  <Text style={styles.fieldGridTileDesc}>Predefined options</Text>
                </Pressable>

                {/* 4. Date */}
                <Pressable
                  style={styles.fieldGridTile}
                  onPress={() => handleAddFieldType('date')}
                >
                  <Calendar size={18} color="#FFFFFF" />
                  <Text style={styles.fieldGridTileTitle}>Date</Text>
                  <Text style={styles.fieldGridTileDesc}>Date picker field</Text>
                </Pressable>

                {/* 5. Checkbox */}
                <Pressable
                  style={styles.fieldGridTile}
                  onPress={() => handleAddFieldType('checkbox')}
                >
                  <CheckSquare size={18} color="#FFFFFF" />
                  <Text style={styles.fieldGridTileTitle}>Checkbox</Text>
                  <Text style={styles.fieldGridTileDesc}>Single or multiple selection</Text>
                </Pressable>

                {/* 6. Number */}
                <Pressable
                  style={styles.fieldGridTile}
                  onPress={() => handleAddFieldType('number')}
                >
                  <Hash size={18} color="#FFFFFF" />
                  <Text style={styles.fieldGridTileTitle}>Number</Text>
                  <Text style={styles.fieldGridTileDesc}>Numeric input field</Text>
                </Pressable>
              </View>
            </View>

            {/* Bottom Preview Document CTA */}
            <Pressable
              style={styles.previewCtaBtn}
              onPress={() => setActiveTab('preview')}
            >
              <Eye size={16} color="#0F172A" />
              <Text style={styles.previewCtaBtnText}>Preview Document &gt;</Text>
            </Pressable>
          </ScrollView>
        )}

        {/* Preview Tab: Live Custom Document Preview */}
        {activeTab === 'preview' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.previewPaper}>
              <Text style={styles.previewDocTitle}>{docTitle.toUpperCase()}</Text>
              <Text style={styles.previewDocDesc}>{docDescription}</Text>
              <View style={styles.previewDivider} />

              {sections.map((sec) => (
                <View key={sec.id} style={styles.previewSecBlock}>
                  <Text style={styles.previewSecTitle}>{sec.title}</Text>
                  <View style={styles.previewSecFields}>
                    {sec.fields.map((f) => (
                      <View key={f.id} style={styles.previewFieldPill}>
                        <Text style={styles.previewFieldPillLabel}>{f.label}</Text>
                        <Text style={styles.previewFieldPillType}>[{f.type}]</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}

              <View style={styles.previewSignatures}>
                <View style={styles.previewSigLine} />
                <Text style={styles.previewSigLabel}>Authorized Signatory & Recipient Acceptance</Text>
              </View>
            </View>

            {/* Save Schema Button */}
            <Pressable
              style={[styles.saveSchemaBtn, isSaving && { opacity: 0.6 }]}
              onPress={handleSaveSchema}
              disabled={isSaving}
            >
              <Save size={16} color="#FFFFFF" />
              <Text style={styles.saveSchemaBtnText}>
                {isSaving ? 'Saving Schema...' : 'Save Custom Schema'}
              </Text>
            </Pressable>
          </ScrollView>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Document Category</Text>
              <View style={styles.categoryRow}>
                {(['custom', 'hr_employment', 'operations', 'business_letters'] as const).map((cat) => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryChoice,
                      category === cat && styles.categoryChoiceActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.categoryChoiceText, category === cat && styles.categoryChoiceTextActive]}>
                      {cat.replace('_', ' ').toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 8,
  },
  backBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  moreBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  tabButtonText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 40,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  sectionCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#374151',
  },
  multilineInput: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
  sectionsList: {
    gap: 8,
    marginBottom: 12,
  },
  sectionItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sectionItemCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#1E293B',
  },
  sectionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionItemTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionItemSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  addSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#374151',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  addSectionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  fieldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fieldGridTile: {
    width: '48%',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151',
    gap: 4,
  },
  fieldGridTileTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  fieldGridTileDesc: {
    color: '#94A3B8',
    fontSize: 10.5,
  },
  previewCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
  },
  previewCtaBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  previewPaper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    marginBottom: 16,
  },
  previewDocTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  previewDocDesc: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  previewDivider: {
    height: 1.5,
    backgroundColor: '#0F172A',
    marginVertical: 14,
  },
  previewSecBlock: {
    marginBottom: 14,
  },
  previewSecTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  previewSecFields: {
    gap: 6,
  },
  previewFieldPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  previewFieldPillLabel: {
    fontSize: 11.5,
    color: '#1E293B',
    fontWeight: '500',
  },
  previewFieldPillType: {
    fontSize: 10,
    color: '#64748B',
  },
  previewSignatures: {
    marginTop: 32,
    alignItems: 'center',
  },
  previewSigLine: {
    width: 200,
    height: 1,
    backgroundColor: '#0F172A',
    marginBottom: 6,
  },
  previewSigLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  saveSchemaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginBottom: 24,
  },
  saveSchemaBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  categoryChoice: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  categoryChoiceActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryChoiceText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  categoryChoiceTextActive: {
    color: '#FFFFFF',
  },
});

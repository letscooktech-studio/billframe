/**
 * UNIVERSAL DOCUMENT STUDIO & EDITOR
 * Matches Screen 2 of the Billframe specification:
 * - Dynamic Schema-Driven Form Editor supporting all 36 Gold/Black templates & custom schemas
 * - 3 Primary Tabs: [Content], [Preview], [Settings]
 * - Grouped, ergonomic form sections driven directly by document schema
 * - Full-width A4 WYSIWYG preview in [Preview] tab rendered via UniversalDocumentRenderer
 * - Zoom controls, draft persistence, document issuance, and direct PDF export
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  useColorScheme,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MoreVertical,
  User,
  Briefcase,
  FileText,
  Calendar,
  ChevronDown,
  Eye,
  Save,
  CheckCircle2,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Sparkles,
  ClipboardList,
  Check,
} from 'lucide-react-native';
import { colors, spacing, radii, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { AuroraBackground } from '../../components/common/AuroraBackground';
import { UniversalDocumentRepository } from '../../data/repositories/UniversalDocumentRepository';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';
import { UniversalDocumentSchema, UniversalDocumentInstance } from '../../domain/documents/universal/types';
import { SYSTEM_SCHEMAS } from '../../domain/documents/universal/SystemSchemas';
import { UniversalDocumentRenderer } from '../../services/pdf/UniversalDocumentRenderer';
import { PdfService } from '../../services/pdf/PdfService';
import { BusinessProfile } from '../../domain/profile/types';
import { LogoUploader } from '../../components/common/LogoUploader';

export default function DocumentStudioScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ typeId?: string; docType?: string; instanceId?: string; previewOnly?: string }>();
  const initialTypeId = params.typeId || params.docType || 'job_offer_letter';

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [activeTab, setActiveTab] = useState<'content' | 'preview' | 'settings'>(
    params.previewOnly === 'true' ? 'preview' : 'content'
  );
  const [zoomScale, setZoomScale] = useState<number>(1.0);

  // Business Profile
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);

  // Document Schema & Identity
  const [schema, setSchema] = useState<UniversalDocumentSchema>(() => {
    return (
      SYSTEM_SCHEMAS.find((s: UniversalDocumentSchema) => s.code === initialTypeId || s.id === initialTypeId) ||
      SYSTEM_SCHEMAS[0]
    );
  });

  const [instanceId] = useState<string>(() => params.instanceId || `inst_${Date.now()}`);
  const [docNumber, setDocNumber] = useState<string>('DOC-2026-001');
  const [docStatus, setDocStatus] = useState<'draft' | 'issued'>('draft');
  const [partyName, setPartyName] = useState<string>('Priya Verma');
  const [selectedLayout, setSelectedLayout] = useState<string>('gold_master');

  // Dynamic Content Form Data (Stores all schema field values key -> value)
  const [formData, setFormData] = useState<Record<string, any>>({});

  const [signatoryName, setSignatoryName] = useState<string>('Rahul Mehta');
  const [signatoryTitle, setSignatoryTitle] = useState<string>('CEO, Apex Solutions');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Initialize Default Form Data from Schema
  const initializeFormDataFromSchema = useCallback((s: UniversalDocumentSchema, existingData?: Record<string, any>) => {
    const initial: Record<string, any> = { ...existingData };

    for (const sec of s.sections) {
      for (const f of sec.fields) {
        if (initial[f.id] === undefined && f.defaultValue !== undefined) {
          initial[f.id] = f.defaultValue;
        }
      }
    }

    // Common standard fallbacks
    if (!initial.signatory_name) initial.signatory_name = 'Rahul Mehta';
    if (!initial.signatory_title) initial.signatory_title = 'CEO, Apex Solutions';

    setFormData(initial);

    // Auto-detect party name from fields
    const detectedParty =
      initial.candidate_name ||
      initial.employee_name ||
      initial.client_name ||
      initial.customer_name ||
      initial.student_name ||
      initial.recipient_name ||
      initial.tenant_name ||
      initial.donor_name ||
      initial.authorized_person_name;

    if (detectedParty) {
      setPartyName(String(detectedParty));
    }

    // Default reference number format
    const prefix = (s.code || 'DOC').substring(0, 4).toUpperCase();
    setDocNumber(`${prefix}-2026-042`);
  }, []);

  // Load Business Profile & Custom Schema if any
  const loadData = useCallback(async () => {
    try {
      const active = await BusinessProfileRepository.getActiveProfile();
      if (active) {
        setBusinessProfile(active);
        if (active.signatory_name) setSignatoryName(active.signatory_name);
        if (active.signatory_title) setSignatoryTitle(active.signatory_title);
      }

      const allSchemas = await UniversalDocumentRepository.getDocumentTypesAsync(active?.id);
      const found = allSchemas.find((s) => s.code === initialTypeId || s.id === initialTypeId);
      const activeSchema = found || SYSTEM_SCHEMAS.find((s) => s.code === initialTypeId) || SYSTEM_SCHEMAS[0];

      setSchema(activeSchema);

      // If existing instance
      if (params.instanceId) {
        const inst = await UniversalDocumentRepository.getDocumentInstanceByIdAsync(params.instanceId);
        if (inst) {
          setDocNumber(inst.documentNumber);
          setDocStatus(inst.status as any);
          if (inst.partyName) setPartyName(inst.partyName);
          if (inst.templateCode) setSelectedLayout(inst.templateCode);
          initializeFormDataFromSchema(activeSchema, inst.content);
          return;
        }
      }

      // Fresh new instance initialization
      initializeFormDataFromSchema(activeSchema);
    } catch {
      // Non-blocking
    }
  }, [initialTypeId, params.instanceId, initializeFormDataFromSchema]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update a specific field value
  const updateField = (fieldId: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [fieldId]: value };

      // Synchronize partyName if this field represents the recipient
      if (
        [
          'candidate_name',
          'employee_name',
          'client_name',
          'customer_name',
          'student_name',
          'recipient_name',
          'tenant_name',
          'donor_name',
          'authorized_person_name',
        ].includes(fieldId)
      ) {
        setPartyName(String(value));
      }

      if (fieldId === 'signatory_name') {
        setSignatoryName(String(value));
      }
      if (fieldId === 'signatory_title') {
        setSignatoryTitle(String(value));
      }

      return updated;
    });
  };

  // Compile current instance
  const currentInstance: UniversalDocumentInstance = useMemo(() => {
    const defaultBusId = businessProfile?.id || 'default_business';

    // Synchronize content with explicit top-level overrides
    const contentPayload: Record<string, any> = {
      ...formData,
      signatory_name: signatoryName,
      signatory_title: signatoryTitle,
      party_name: partyName,
    };

    return {
      id: instanceId,
      businessProfileId: defaultBusId,
      typeId: schema.id,
      docClass: schema.docClass,
      documentNumber: docNumber,
      title: schema.name,
      status: docStatus,
      issueDate: Date.now(),
      partyName,
      partyDetails: {
        email: formData.candidate_email || formData.email || '',
        phone: formData.candidate_phone || formData.phone || '',
        designation: formData.job_title || formData.designation || '',
      },
      content: contentPayload,
      templateCode: selectedLayout,
      branding: {
        brandColor: '#000000',
        secondaryColor: '#000000',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }, [
    instanceId,
    businessProfile?.id,
    schema,
    docNumber,
    docStatus,
    partyName,
    formData,
    signatoryName,
    signatoryTitle,
    selectedLayout,
  ]);

  // Live compiled HTML
  const compiledHtml = useMemo(() => {
    const dummyBiz: BusinessProfile = businessProfile || {
      id: 'biz_default',
      name: 'Apex Solutions',
      legal_name: 'Apex Solutions Pvt Ltd',
      tax_id: '29ABCDE1234F1Z5',
      default_currency: 'INR',
      default_document_locale: 'en-IN',
      address_line1: 'Flat 402, Green View Apartments',
      city: 'Bengaluru',
      state: 'Karnataka',
      postal_code: '560038',
      country: 'IN',
      country_iso2: 'IN',
      phone: '+91 98765 43210',
      email: 'hello@apexsolutions.com',
      website: 'www.apexsolutions.com',
      is_active: 1,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    return UniversalDocumentRenderer.renderHtml(currentInstance, schema, dummyBiz);
  }, [currentInstance, schema, businessProfile]);

  // Actions
  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      await UniversalDocumentRepository.saveDocumentInstanceAsync({
        ...currentInstance,
        status: 'draft',
      });
      setDocStatus('draft');
      Alert.alert('Draft Saved', `Document "${docNumber}" has been saved as draft.`);
    } catch (err: any) {
      Alert.alert('Save Error', err?.message || 'Could not save draft.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleIssueDocument = async () => {
    try {
      setIsSaving(true);
      await UniversalDocumentRepository.saveDocumentInstanceAsync({
        ...currentInstance,
        status: 'issued',
      });
      setDocStatus('issued');
      Alert.alert('Document Finalized', `Document "${docNumber}" has been finalized.`);
    } catch (err: any) {
      Alert.alert('Issue Error', err?.message || 'Could not issue document.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      await PdfService.shareUniversalDocumentPdfAsync(currentInstance, schema, businessProfile!);
    } catch (err: any) {
      Alert.alert('Export Error', err?.message || 'Could not export PDF.');
    }
  };

  return (
    <AuroraBackground section="template_studio" intensity="subtle">
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Top Bar Header */}
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
            <View style={styles.titleBadgeRow}>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                {schema.name}
              </Text>
              <View style={styles.draftBadge}>
                <Text style={styles.draftBadgeText}>{docStatus.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Ref: {docNumber} • {schema.category.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>

          <Pressable style={styles.moreBtn} onPress={() => setActiveTab('settings')}>
            <Sliders size={18} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Top 3-Tab Bar: [Content] | [Preview] | [Settings] */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tabButton, activeTab === 'content' && styles.tabButtonActive]}
            onPress={() => setActiveTab('content')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'content' && styles.tabButtonTextActive]}>
              Content
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

        {/* ── Content Tab: Schema-Driven Dynamic Form ── */}
        {activeTab === 'content' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Top Primary Details Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <FileText size={17} color="#FFFFFF" />
                <Text style={styles.sectionTitle}>Document Particulars</Text>
              </View>

              <View style={styles.twoColRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Document Number *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={docNumber}
                    onChangeText={setDocNumber}
                    placeholder="e.g. DOC-2026-001"
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Primary Recipient / Party *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={partyName}
                    onChangeText={(val) => {
                      setPartyName(val);
                      // Mirror into relevant schema fields
                      const candidateField = schema.sections.flatMap((s) => s.fields).find((f) =>
                        [
                          'candidate_name',
                          'employee_name',
                          'client_name',
                          'customer_name',
                          'student_name',
                          'recipient_name',
                          'tenant_name',
                          'donor_name',
                        ].includes(f.id)
                      );
                      if (candidateField) {
                        updateField(candidateField.id, val);
                      }
                    }}
                    placeholder="Candidate or Counterparty Name"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>
            </View>

            {/* Organization Logo & Brand Mark */}
            <LogoUploader
              logoUri={businessProfile?.logo_uri}
              profileId={businessProfile?.id}
              autoSaveProfile={true}
              onLogoChange={(newUri) => {
                setBusinessProfile((prev) => (prev ? { ...prev, logo_uri: newUri } : null));
              }}
            />

            {/* Dynamic Sections from Document Schema */}
            {schema.sections.map((sec, secIdx) => (
              <View key={sec.id || `sec_${secIdx}`} style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Briefcase size={17} color="#FFFFFF" />
                  <Text style={styles.sectionTitle}>{sec.title}</Text>
                </View>
                {sec.description && (
                  <Text style={styles.sectionDescription}>{sec.description}</Text>
                )}

                {sec.fields.map((f) => {
                  const currentVal = formData[f.id] !== undefined ? String(formData[f.id]) : (f.defaultValue ? String(f.defaultValue) : '');

                  // 1. Textarea
                  if (f.type === 'textarea') {
                    return (
                      <View key={f.id} style={styles.fieldGroup}>
                        <Text style={styles.inputLabel}>
                          {f.label} {f.required ? '*' : ''}
                        </Text>
                        <TextInput
                          style={[styles.textInput, styles.textAreaInput]}
                          value={currentVal}
                          onChangeText={(val) => updateField(f.id, val)}
                          placeholder={f.placeholder || `Enter ${f.label.toLowerCase()}...`}
                          placeholderTextColor="#64748B"
                          multiline
                          numberOfLines={4}
                        />
                      </View>
                    );
                  }

                  // 2. Select / Dropdown
                  if (f.type === 'select' && f.options && f.options.length > 0) {
                    return (
                      <View key={f.id} style={styles.fieldGroup}>
                        <Text style={styles.inputLabel}>
                          {f.label} {f.required ? '*' : ''}
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                          {f.options.map((opt) => {
                            const isSelected = currentVal === opt.value;
                            return (
                              <Pressable
                                key={opt.value}
                                style={[styles.selectOptionPill, isSelected && styles.selectOptionPillActive]}
                                onPress={() => updateField(f.id, opt.value)}
                              >
                                <Text
                                  style={[
                                    styles.selectOptionText,
                                    isSelected && styles.selectOptionTextActive,
                                  ]}
                                >
                                  {opt.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      </View>
                    );
                  }

                  // 3. Table Column Preview / Notice
                  if (f.type === 'table') {
                    return (
                      <View key={f.id} style={styles.fieldGroup}>
                        <Text style={styles.inputLabel}>
                          {f.label} (Structured Table)
                        </Text>
                        <View style={styles.tableNoticeBox}>
                          <Text style={styles.tableNoticeTitle}>Columns: {f.columns?.map((c) => c.label).join(' • ')}</Text>
                          <Text style={styles.tableNoticeSub}>
                            Populated with standard compliant rows. Full row customization previewed live on A4 canvas.
                          </Text>
                        </View>
                      </View>
                    );
                  }

                  // 4. Default Input (text, number, currency, date)
                  return (
                    <View key={f.id} style={styles.fieldGroup}>
                      <Text style={styles.inputLabel}>
                        {f.label} {f.required ? '*' : ''}
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        value={currentVal}
                        onChangeText={(val) => updateField(f.id, val)}
                        placeholder={f.placeholder || `Enter ${f.label.toLowerCase()}`}
                        placeholderTextColor="#64748B"
                        keyboardType={f.type === 'number' || f.type === 'currency' ? 'numeric' : 'default'}
                      />
                    </View>
                  );
                })}
              </View>
            ))}

            {/* Signatory Authorization Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <User size={17} color="#FFFFFF" />
                <Text style={styles.sectionTitle}>Signatory & Authorization</Text>
              </View>

              <View style={styles.twoColRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Signatory Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={signatoryName}
                    onChangeText={setSignatoryName}
                    placeholder="e.g. Rahul Mehta"
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Designation / Title</Text>
                  <TextInput
                    style={styles.textInput}
                    value={signatoryTitle}
                    onChangeText={setSignatoryTitle}
                    placeholder="e.g. CEO / Managing Director"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>
            </View>

            {/* Preview Document Button CTA */}
            <Pressable style={styles.previewCtaBtn} onPress={() => setActiveTab('preview')}>
              <FileText size={16} color="#0F172A" />
              <Text style={styles.previewCtaBtnText}>Preview Document &gt;</Text>
            </Pressable>
          </ScrollView>
        )}

        {/* ── Preview Tab: Live A4 WYSIWYG Rendering & Zoom Controls ── */}
        {activeTab === 'preview' && (
          <View style={styles.previewContainer}>
            {/* Action Bar */}
            <View style={styles.previewActionBar}>
              <View style={styles.zoomControls}>
                <Pressable
                  style={styles.zoomBtn}
                  onPress={() => setZoomScale((prev) => Math.max(0.6, prev - 0.1))}
                >
                  <ZoomOut size={16} color="#FFFFFF" />
                </Pressable>
                <Text style={styles.zoomText}>{Math.round(zoomScale * 100)}%</Text>
                <Pressable
                  style={styles.zoomBtn}
                  onPress={() => setZoomScale((prev) => Math.min(1.5, prev + 0.1))}
                >
                  <ZoomIn size={16} color="#FFFFFF" />
                </Pressable>
                <Pressable style={styles.zoomBtn} onPress={() => setZoomScale(1.0)}>
                  <Maximize2 size={16} color="#FFFFFF" />
                </Pressable>
              </View>

              <View style={styles.docActionsRight}>
                <Pressable
                  style={[styles.actionBtn, styles.saveDraftBtn]}
                  onPress={handleSaveDraft}
                  disabled={isSaving}
                >
                  <Save size={15} color="#FFFFFF" />
                  <Text style={styles.saveDraftText}>Save Draft</Text>
                </Pressable>

                <Pressable
                  style={[styles.actionBtn, styles.issueBtn]}
                  onPress={handleIssueDocument}
                  disabled={isSaving}
                >
                  <CheckCircle2 size={15} color="#FFFFFF" />
                  <Text style={styles.issueText}>Issue</Text>
                </Pressable>

                <Pressable style={[styles.actionBtn, styles.exportBtn]} onPress={handleExportPdf}>
                  <Share2 size={15} color="#0F172A" />
                  <Text style={styles.exportText}>Export PDF</Text>
                </Pressable>
              </View>
            </View>

            {/* Live Document Canvas */}
            <ScrollView
              contentContainerStyle={styles.canvasScroll}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            >
              <View style={[styles.a4PageWrapper, { transform: [{ scale: zoomScale }] }]}>
                {Platform.OS === 'web' ? (
                  <iframe
                    title="Live Document Preview"
                    srcDoc={compiledHtml}
                    style={{
                      width: '100%',
                      height: 1120,
                      border: 'none',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 8,
                    }}
                  />
                ) : (
                  <View style={styles.mobileHtmlWrapper}>
                    <Text style={styles.mobileNotice}>
                      Preview rendering on mobile device. Tap Export PDF to view or share.
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── Settings Tab: Reference number, Letterhead styling ── */}
        {activeTab === 'settings' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Document Settings</Text>

              <View style={[styles.fieldGroup, { marginTop: 12 }]}>
                <Text style={styles.inputLabel}>Document Number / Reference</Text>
                <TextInput
                  style={styles.textInput}
                  value={docNumber}
                  onChangeText={setDocNumber}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Layout Engine Standard</Text>
                <View style={styles.layoutPickerRow}>
                  <Pressable
                    style={[
                      styles.layoutOption,
                      selectedLayout === 'gold_master' && styles.layoutOptionActive,
                    ]}
                    onPress={() => setSelectedLayout('gold_master')}
                  >
                    <Text
                      style={[
                        styles.layoutOptionText,
                        selectedLayout === 'gold_master' && styles.layoutOptionTextActive,
                      ]}
                    >
                      Gold/Black Master
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.layoutOption,
                      selectedLayout === 'letterhead' && styles.layoutOptionActive,
                    ]}
                    onPress={() => setSelectedLayout('letterhead')}
                  >
                    <Text
                      style={[
                        styles.layoutOptionText,
                        selectedLayout === 'letterhead' && styles.layoutOptionTextActive,
                      ]}
                    >
                      Classic Letterhead
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <LogoUploader
                  logoUri={businessProfile?.logo_uri}
                  profileId={businessProfile?.id}
                  autoSaveProfile={true}
                  onLogoChange={(newUri) => {
                    setBusinessProfile((prev) => (prev ? { ...prev, logo_uri: newUri } : null));
                  }}
                />
                <Pressable
                  style={styles.brandingSettingsLink}
                  onPress={() => router.push('/templates/edit')}
                >
                  <Text style={styles.brandingSettingsLinkText}>
                    Advanced Brand Kit (Signatures, Corporate Stamp, Bank Details) &gt;
                  </Text>
                </Pressable>
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
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  draftBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  draftBadgeText: {
    color: '#0F172A',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
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
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabButtonTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 40,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
    gap: 14,
  },
  sectionCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionDescription: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 12,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#FFFFFF',
  },
  textAreaInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  optionsScroll: {
    flexDirection: 'row',
    marginTop: 4,
  },
  selectOptionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  selectOptionPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  selectOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  selectOptionTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  tableNoticeBox: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
  },
  tableNoticeTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 3,
  },
  tableNoticeSub: {
    fontSize: 11,
    color: '#64748B',
  },
  previewCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginTop: 4,
  },
  previewCtaBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  previewContainer: {
    flex: 1,
  },
  previewActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    flexWrap: 'wrap',
    gap: 8,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  zoomBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingHorizontal: 6,
  },
  docActionsRight: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  saveDraftBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  saveDraftText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
  issueBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  issueText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
  exportBtn: {
    backgroundColor: '#FFFFFF',
  },
  exportText: {
    color: '#0F172A',
    fontSize: 12.5,
    fontWeight: '700',
  },
  canvasScroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 60,
    alignItems: 'center',
  },
  a4PageWrapper: {
    width: '100%',
    maxWidth: 800,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  mobileHtmlWrapper: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileNotice: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
  layoutPickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  layoutOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  layoutOptionActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  layoutOptionText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  layoutOptionTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  brandingSettingsLink: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  brandingSettingsLinkText: {
    color: '#60A5FA',
    fontSize: 12.5,
    fontWeight: '600',
  },
});

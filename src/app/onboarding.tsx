/**
 * COMPULSORY ONBOARDING FLOW — 4-STEP MASTER ARCHITECTURE
 * 
 * 100% Offline-First. Zero telemetry.
 * 
 * Re-architected 4-step progressive setup:
 * 1. Workspace Type: Tailor Billframe to user's commercial model.
 * 2. Location & Jurisdiction: Country + Searchable Subdivision (No chip walls).
 * 3. Business Identity: Essential profile & invoice branding details.
 * 4. Workspace Preferences: Payment terms, operational toggles & launch confirmation.
 * 
 * Layout: Pinned bottom action dock with safe insets. Never occludes list items.
 */

import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Image,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  colors,
  spacing,
  radii,
  typography,
  MIN_TOUCH_TARGET,
  MAX_CONTENT_WIDTH,
} from '../design/tokens';
import {
  ChevronRight,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  Shield,
  Building2,
  Lock,
  Briefcase,
  Store,
  Truck,
  Wrench,
  Palette,
  Sparkles,
  X,
  CreditCard,
  FileText,
} from 'lucide-react-native';
import { BusinessProfileRepository } from '../data/repositories/BusinessProfileRepository';
import { WorkspaceRepository } from '../data/repositories/WorkspaceRepository';
import { BusinessType } from '../domain/features/FeatureRegistry';
import { COUNTRIES } from '../data/geography/countries';
import { SUBDIVISIONS } from '../data/geography/subdivisions';
import { CountryMetadata, SubdivisionMetadata } from '../data/geography/types';
import { CountryFlag } from '../components/common/CountryFlag';
import { normalizePhoneNumber } from '../data/geography/phone';
import { PaymentTermsPreset } from '../domain/documents/types';

type SalesType = 'services' | 'products' | 'both';

interface BusinessTypeOption {
  id: BusinessType;
  title: string;
  subtitle: string;
  iconName: 'briefcase' | 'wrench' | 'palette' | 'store' | 'truck' | 'building' | 'sparkles' | 'file';
}

const BUSINESS_TYPE_OPTIONS: BusinessTypeOption[] = [
  {
    id: 'freelancer',
    title: 'Freelancer / Independent Creator',
    subtitle: 'Direct client invoicing, milestone fees & project expenses',
    iconName: 'palette',
  },
  {
    id: 'service',
    title: 'Service Business / Consultant',
    subtitle: 'Professional advisory, maintenance, hourly retainers & appointments',
    iconName: 'briefcase',
  },
  {
    id: 'agency',
    title: 'Agency / Studio',
    subtitle: 'Proposals, project estimates, retainers & team billing',
    iconName: 'sparkles',
  },
  {
    id: 'contractor',
    title: 'Contractor / Trades',
    subtitle: 'Job estimates, change orders, labor & materials tracking',
    iconName: 'wrench',
  },
  {
    id: 'retail',
    title: 'Retail Store / Counter Sales',
    subtitle: 'Fast counter sales, 30s Quick Bill, product catalog & walk-ins',
    iconName: 'store',
  },
  {
    id: 'wholesale',
    title: 'Wholesale / B2B Trading',
    subtitle: 'Bulk orders, delivery notes, credit terms & client ledgers',
    iconName: 'truck',
  },
  {
    id: 'professional',
    title: 'Professional Practice',
    subtitle: 'Legal, accounting, medical, architecture & technical consulting',
    iconName: 'building',
  },
  {
    id: 'other',
    title: 'General Small Business',
    subtitle: 'Clean invoices, receipts, payment tracking & customer management',
    iconName: 'file',
  },
];

const PAYMENT_TERMS_OPTIONS: Array<{ id: PaymentTermsPreset; label: string; desc: string }> = [
  { id: 'due_on_receipt', label: 'Due on Receipt', desc: 'Payment expected immediately upon receipt' },
  { id: 'net_7', label: 'Net 7', desc: 'Payment due within 7 days of issue' },
  { id: 'net_15', label: 'Net 15', desc: 'Payment due within 15 days of issue' },
  { id: 'net_30', label: 'Net 30', desc: 'Standard business terms: due in 30 days' },
  { id: 'net_45', label: 'Net 45', desc: 'Payment due within 45 days of issue' },
  { id: 'net_60', label: 'Net 60', desc: 'Corporate terms: due in 60 days' },
];

interface OnboardingScreenProps {
  onCompleted?: () => void;
}

export default function OnboardingScreen({ onCompleted }: OnboardingScreenProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  // Active step (1 to 4)
  const [step, setStep] = useState<number>(1);

  // ── Step 1: Workspace Type ──
  const [businessType, setBusinessType] = useState<BusinessType>('freelancer');
  const [salesType, setSalesType] = useState<SalesType>('services');

  // ── Step 2: Location (Country & Subdivision) ──
  const [selectedCountry, setSelectedCountry] = useState<CountryMetadata>(() => {
    return COUNTRIES.find((c) => c.iso2 === 'IN') || COUNTRIES[0];
  });
  const [countrySearch, setCountrySearch] = useState<string>('');
  const [showCountryModal, setShowCountryModal] = useState<boolean>(false);

  const [selectedSubdivision, setSelectedSubdivision] = useState<SubdivisionMetadata | null>(() => {
    // Default to Maharashtra for India as a clean starter if IN
    return SUBDIVISIONS.find((s) => s.countryIso2 === 'IN' && s.code === 'IN-MH') || null;
  });
  const [customSubdivision, setCustomSubdivision] = useState<string>('');
  const [subdivisionSearch, setSubdivisionSearch] = useState<string>('');
  const [showSubdivisionModal, setShowSubdivisionModal] = useState<boolean>(false);

  // ── Step 3: Business Identity ──
  const [businessName, setBusinessName] = useState<string>('');
  const [legalName, setLegalName] = useState<string>('');
  const [phoneRaw, setPhoneRaw] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [addressLine, setAddressLine] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [isTaxRegistered, setIsTaxRegistered] = useState<boolean>(false);
  const [taxId, setTaxId] = useState<string>('');

  // ── Step 4: Workspace Preferences ──
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermsPreset>('net_30');
  const [trackInventory, setTrackInventory] = useState<boolean>(false);
  const [partialPayments, setPartialPayments] = useState<'often' | 'sometimes' | 'rarely'>('sometimes');
  const [directUpiEnabled, setDirectUpiEnabled] = useState<boolean>(true);

  // Operational State
  const [saving, setSaving] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  // Filter countries for country modal
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRIES;
    const q = countrySearch.trim().toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.iso2.toLowerCase().includes(q) ||
        c.iso3.toLowerCase().includes(q) ||
        c.currencyCode.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  // Subdivisions available for currently selected country
  const availableSubdivisions = useMemo(() => {
    return SUBDIVISIONS.filter((s) => s.countryIso2 === selectedCountry.iso2);
  }, [selectedCountry.iso2]);

  // Filtered subdivisions for subdivision modal
  const filteredSubdivisions = useMemo(() => {
    if (!subdivisionSearch.trim()) return availableSubdivisions;
    const q = subdivisionSearch.trim().toLowerCase();
    return availableSubdivisions.filter(
      (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    );
  }, [availableSubdivisions, subdivisionSearch]);

  // Real-time phone normalization
  const phoneValidation = useMemo(() => {
    if (!phoneRaw.trim()) return null;
    return normalizePhoneNumber(phoneRaw, selectedCountry.iso2);
  }, [phoneRaw, selectedCountry.iso2]);

  const handleSelectCountry = (country: CountryMetadata) => {
    setSelectedCountry(country);
    // Find first subdivision for this country if available
    const firstSub = SUBDIVISIONS.find((s) => s.countryIso2 === country.iso2);
    setSelectedSubdivision(firstSub || null);
    setCustomSubdivision('');
    setShowCountryModal(false);
    setCountrySearch('');
  };

  const handleSelectSubdivision = (sub: SubdivisionMetadata) => {
    setSelectedSubdivision(sub);
    setCustomSubdivision('');
    setShowSubdivisionModal(false);
    setSubdivisionSearch('');
  };

  const handleNext = () => {
    setValidationError('');
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (!businessName.trim()) {
        setValidationError('Business Name is required to issue documents.');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      handleFinish();
    }
  };

  const handleBack = () => {
    setValidationError('');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinish = async () => {
    if (saving) return;
    setSaving(true);
    setValidationError('');

    try {
      const activeProfile = await BusinessProfileRepository.getActiveProfile();
      const profileId = activeProfile?.id || 'default_business_profile';

      const subdivisionName = selectedSubdivision?.name || customSubdivision.trim() || undefined;
      const subdivisionCode = selectedSubdivision?.code || undefined;

      const phoneResult = phoneRaw.trim()
        ? normalizePhoneNumber(phoneRaw, selectedCountry.iso2)
        : null;

      // 1. Update business profile with comprehensive geography and contact details
      await BusinessProfileRepository.updateProfile({
        id: profileId,
        name: businessName.trim() || 'My Business',
        legal_name: legalName.trim() || undefined,
        country: selectedCountry.name,
        country_iso2: selectedCountry.iso2,
        subdivision_code: subdivisionCode,
        subdivision_name: subdivisionName,
        state: subdivisionName,
        city: city.trim() || undefined,
        address_line1: addressLine.trim() || undefined,
        postal_code: postalCode.trim() || undefined,
        phone_country_iso2: selectedCountry.iso2,
        phone_e164: phoneResult?.isValid ? phoneResult.e164 : phoneRaw.trim() || undefined,
        phone: phoneResult?.isValid ? phoneResult.nationalFormatted : phoneRaw.trim() || undefined,
        email: email.trim() || undefined,
        default_currency: selectedCountry.currencyCode,
        default_document_locale: selectedCountry.defaultLocale,
        default_payment_terms: paymentTerms,
        tax_id: isTaxRegistered && taxId.trim() ? taxId.trim() : undefined,
      });

      // 2. Initialize adaptive workspace preferences with atomic commit
      await WorkspaceRepository.completeOnboardingAsync({
        businessProfileId: profileId,
        businessType,
        salesType: businessType === 'retail' || businessType === 'wholesale' ? 'products' : salesType,
        isGstRegistered: isTaxRegistered,
        trackInventory,
        trackJobs: businessType === 'contractor',
        partialPayments,
        recurringBilling: businessType === 'agency' || businessType === 'service',
        adaptiveEnabled: true,
        layoutLocked: false,
        onboardingCompleted: true,
        onboardingVersion: 2,
        onboardingCompletedAt: Date.now(),
        profileVersion: 1,
        workspaceConfigVersion: 1,
        geographyDatasetVersion: '2026.01',
      });

      if (onCompleted) {
        onCompleted();
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('Setup Error', err?.message || 'Failed to complete setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderTypeIcon = (iconName: BusinessTypeOption['iconName']) => {
    const iconColor = theme.brandAnchor;
    switch (iconName) {
      case 'palette':
        return <Palette color={iconColor} size={22} />;
      case 'briefcase':
        return <Briefcase color={iconColor} size={22} />;
      case 'sparkles':
        return <Sparkles color={iconColor} size={22} />;
      case 'wrench':
        return <Wrench color={iconColor} size={22} />;
      case 'store':
        return <Store color={iconColor} size={22} />;
      case 'truck':
        return <Truck color={iconColor} size={22} />;
      case 'building':
        return <Building2 color={iconColor} size={22} />;
      default:
        return <FileText color={iconColor} size={22} />;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header / Progress Indicator */}
        <View style={[styles.topHeader, { borderBottomColor: theme.borderSubtle }]}>
          {step > 1 ? (
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back to previous step"
            >
              <ArrowLeft color={theme.textPrimary} size={22} />
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}

          <View style={styles.stepIndicatorWrap}>
            <Text style={[styles.stepIndicatorText, { color: theme.brandAnchor }]}>
              Step {step} of 4
            </Text>
            {/* Step progress bar */}
            <View style={[styles.progressBarTrack, { backgroundColor: theme.surfaceSecondary }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: theme.brandAnchor,
                    width: `${(step / 4) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Scrollable Form Body */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* STEP 1: WORKSPACE TYPE */}
          {step === 1 && (
            <View style={styles.stepSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  What best describes your business?
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  Billframe customizes document templates, quick actions, and defaults to your commercial workflow.
                </Text>
              </View>

              <View style={styles.cardsList}>
                {BUSINESS_TYPE_OPTIONS.map((item) => {
                  const isSelected = businessType === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      style={({ pressed }) => [
                        styles.personaCard,
                        {
                          backgroundColor: isSelected ? theme.surfaceSecondary : theme.surface,
                          borderColor: isSelected ? theme.brandAnchor : theme.borderSubtle,
                          borderWidth: isSelected ? 2 : 1,
                          opacity: pressed ? 0.9 : 1,
                        },
                      ]}
                      onPress={() => setBusinessType(item.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={item.title}
                    >
                      <View style={[styles.personaIconBox, { backgroundColor: theme.surface }]}>
                        {renderTypeIcon(item.iconName)}
                      </View>
                      <View style={styles.personaTextWrap}>
                        <Text style={[styles.personaTitle, { color: theme.textPrimary }]}>
                          {item.title}
                        </Text>
                        <Text style={[styles.personaSubtitle, { color: theme.textSecondary }]}>
                          {item.subtitle}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.radioCircle,
                          {
                            borderColor: isSelected ? theme.brandAnchor : theme.borderSubtle,
                            backgroundColor: isSelected ? theme.brandAnchor : 'transparent',
                          },
                        ]}
                      >
                        {isSelected && <Check color={theme.surface} size={14} strokeWidth={3} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Sovereign Guarantee Callout */}
              <View style={[styles.guaranteeBox, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                <Shield color={theme.brandAnchor} size={20} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.guaranteeTitle, { color: theme.textPrimary }]}>
                    Local-First Sovereign Privacy
                  </Text>
                  <Text style={[styles.guaranteeBody, { color: theme.textSecondary }]}>
                    Your customers, invoices, and finances are stored strictly on this device. Zero mandatory cloud accounts.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* STEP 2: LOCATION & JURISDICTION */}
          {step === 2 && (
            <View style={styles.stepSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  Where is your business located?
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  Configures your default currency, tax system, phone calling code, and legal document formats.
                </Text>
              </View>

              {/* Selected Country Selector Card */}
              <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Country *</Text>
              <Pressable
                style={[
                  styles.selectorCard,
                  { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
                ]}
                onPress={() => setShowCountryModal(true)}
                accessibilityRole="button"
                accessibilityLabel="Choose Country"
              >
                <CountryFlag iso2={selectedCountry.iso2} countryName={selectedCountry.name} size="lg" />
                <View style={styles.selectorCardInfo}>
                  <Text style={[styles.selectorCardTitle, { color: theme.textPrimary }]}>
                    {selectedCountry.name} ({selectedCountry.iso2})
                  </Text>
                  <Text style={[styles.selectorCardMeta, { color: theme.textSecondary }]}>
                    Currency: {selectedCountry.currencyCode} ({selectedCountry.currencySymbol}) • Calling: {selectedCountry.callingCode}
                  </Text>
                </View>
                <ChevronDown color={theme.textMuted} size={20} />
              </Pressable>

              {/* Subdivision Picker (Searchable Bottom Sheet / Input — NO giant wall of chips) */}
              <View style={{ marginTop: spacing.lg }}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                  {selectedCountry.subdivisionType} ({selectedCountry.name})
                </Text>

                {availableSubdivisions.length > 0 ? (
                  <Pressable
                    style={[
                      styles.selectorCard,
                      { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
                    ]}
                    onPress={() => setShowSubdivisionModal(true)}
                    accessibilityRole="button"
                    accessibilityLabel={`Choose ${selectedCountry.subdivisionType}`}
                  >
                    <View style={styles.selectorCardInfo}>
                      <Text style={[styles.selectorCardTitle, { color: theme.textPrimary }]}>
                        {selectedSubdivision ? selectedSubdivision.name : `Select ${selectedCountry.subdivisionType}`}
                      </Text>
                      {selectedSubdivision && (
                        <Text style={[styles.selectorCardMeta, { color: theme.textSecondary }]}>
                          Code: {selectedSubdivision.code}
                        </Text>
                      )}
                    </View>
                    <ChevronDown color={theme.textMuted} size={20} />
                  </Pressable>
                ) : (
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.borderSubtle,
                        color: theme.textPrimary,
                      },
                    ]}
                    placeholder={`Enter your ${selectedCountry.subdivisionType.toLowerCase()}`}
                    placeholderTextColor={theme.textMuted}
                    value={customSubdivision}
                    onChangeText={setCustomSubdivision}
                  />
                )}
              </View>

              {/* Currency & Tax Summary Badge */}
              <View style={[styles.currencySummaryBadge, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                <View style={styles.summaryBadgeItem}>
                  <Text style={[styles.summaryBadgeLabel, { color: theme.textSecondary }]}>Default Currency</Text>
                  <Text style={[styles.summaryBadgeValue, { color: theme.textPrimary }]}>
                    {selectedCountry.currencyCode} ({selectedCountry.currencySymbol})
                  </Text>
                </View>
                <View style={[styles.summaryBadgeDivider, { backgroundColor: theme.borderSubtle }]} />
                <View style={styles.summaryBadgeItem}>
                  <Text style={[styles.summaryBadgeLabel, { color: theme.textSecondary }]}>Tax Framework</Text>
                  <Text style={[styles.summaryBadgeValue, { color: theme.textPrimary }]}>
                    {selectedCountry.taxSystemName || 'Standard'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* STEP 3: BUSINESS IDENTITY */}
          {step === 3 && (
            <View style={styles.stepSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  Business Details
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  This information will be printed as your seller identity on invoices, estimates, and receipts.
                </Text>
              </View>

              {validationError ? (
                <View style={[styles.errorBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.statusDanger }]}>
                  <Text style={[styles.errorText, { color: theme.statusDanger }]}>
                    {validationError}
                  </Text>
                </View>
              ) : null}

              {/* Business Name */}
              <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                Business / Trade Name *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.borderSubtle,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="e.g. Apex Electrical Solutions"
                placeholderTextColor={theme.textMuted}
                value={businessName}
                onChangeText={(t) => {
                  setValidationError('');
                  setBusinessName(t);
                }}
              />

              {/* Legal Entity Name */}
              <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginTop: spacing.md }]}>
                Legal Entity Name (Optional)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.borderSubtle,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="e.g. Apex Solutions Pvt. Ltd."
                placeholderTextColor={theme.textMuted}
                value={legalName}
                onChangeText={setLegalName}
              />

              {/* Business Phone with Calling Code Badge */}
              <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginTop: spacing.md }]}>
                Business Phone
              </Text>
              <View style={styles.phoneInputRow}>
                <View style={[styles.callingCodeBadge, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                  <CountryFlag iso2={selectedCountry.iso2} size="sm" />
                  <Text style={[styles.callingCodeText, { color: theme.textPrimary }]}>
                    {selectedCountry.callingCode}
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.phoneInput,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.borderSubtle,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="e.g. 98765 43210"
                  placeholderTextColor={theme.textMuted}
                  value={phoneRaw}
                  onChangeText={setPhoneRaw}
                  keyboardType="phone-pad"
                />
              </View>
              {phoneValidation && phoneValidation.isValid && (
                <Text style={[styles.helperSuccess, { color: theme.statusSuccess }]}>
                  Standard format: {phoneValidation.nationalFormatted} ({phoneValidation.e164})
                </Text>
              )}

              {/* Business Email */}
              <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginTop: spacing.md }]}>
                Business Email (Optional)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.borderSubtle,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="billing@apexsolutions.com"
                placeholderTextColor={theme.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Tax Registration Toggle & Tax ID */}
              <View style={[styles.taxRegistrationCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle, marginTop: spacing.lg }]}>
                <Pressable
                  style={styles.toggleRow}
                  onPress={() => setIsTaxRegistered(!isTaxRegistered)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isTaxRegistered }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>
                      Registered for {selectedCountry.taxSystemName || 'Tax'}?
                    </Text>
                    <Text style={[styles.toggleSubtitle, { color: theme.textSecondary }]}>
                      Prints your official {selectedCountry.taxSystemName || 'Tax'} registration ID on documents
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkboxBox,
                      {
                        backgroundColor: isTaxRegistered ? theme.brandAnchor : 'transparent',
                        borderColor: isTaxRegistered ? theme.brandAnchor : theme.borderSubtle,
                      },
                    ]}
                  >
                    {isTaxRegistered && <Check color={theme.surface} size={16} strokeWidth={3} />}
                  </View>
                </Pressable>

                {isTaxRegistered && (
                  <View style={{ marginTop: spacing.md }}>
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                      {selectedCountry.iso2 === 'IN'
                        ? 'GSTIN (GST Identification Number)'
                        : selectedCountry.iso2 === 'US'
                        ? 'EIN / Sales Tax Permit Number'
                        : `${selectedCountry.taxSystemName || 'Tax'} ID`}
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: theme.surfaceSecondary,
                          borderColor: theme.borderSubtle,
                          color: theme.textPrimary,
                        },
                      ]}
                      placeholder={
                        selectedCountry.iso2 === 'IN'
                          ? 'e.g. 27AAAAA0000A1Z5'
                          : 'e.g. 12-3456789'
                      }
                      placeholderTextColor={theme.textMuted}
                      value={taxId}
                      onChangeText={setTaxId}
                      autoCapitalize="characters"
                    />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* STEP 4: WORKSPACE PREFERENCES & LAUNCH */}
          {step === 4 && (
            <View style={styles.stepSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  Workspace Preferences
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  Set your default payment expectations and optional business capabilities.
                </Text>
              </View>

              {/* Default Payment Terms */}
              <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                Default Payment Terms
              </Text>
              <View style={styles.termsList}>
                {PAYMENT_TERMS_OPTIONS.map((item) => {
                  const isSelected = paymentTerms === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.termsCard,
                        {
                          backgroundColor: isSelected ? theme.surfaceSecondary : theme.surface,
                          borderColor: isSelected ? theme.brandAnchor : theme.borderSubtle,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      onPress={() => setPaymentTerms(item.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.termsLabel, { color: theme.textPrimary }]}>{item.label}</Text>
                        <Text style={[styles.termsDesc, { color: theme.textSecondary }]}>{item.desc}</Text>
                      </View>
                      <View
                        style={[
                          styles.radioCircle,
                          {
                            borderColor: isSelected ? theme.brandAnchor : theme.borderSubtle,
                            backgroundColor: isSelected ? theme.brandAnchor : 'transparent',
                          },
                        ]}
                      >
                        {isSelected && <Check color={theme.surface} size={14} strokeWidth={3} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Optional Capabilities */}
              <View style={{ marginTop: spacing.xl }}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                  Operational Modules
                </Text>

                {/* Track Inventory */}
                <Pressable
                  style={[styles.capabilityRow, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}
                  onPress={() => setTrackInventory(!trackInventory)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.capabilityTitle, { color: theme.textPrimary }]}>Track Inventory & Catalog</Text>
                    <Text style={[styles.capabilityDesc, { color: theme.textSecondary }]}>Save reusable products, items, and unit prices</Text>
                  </View>
                  <View
                    style={[
                      styles.checkboxBox,
                      {
                        backgroundColor: trackInventory ? theme.brandAnchor : 'transparent',
                        borderColor: trackInventory ? theme.brandAnchor : theme.borderSubtle,
                      },
                    ]}
                  >
                    {trackInventory && <Check color={theme.surface} size={16} strokeWidth={3} />}
                  </View>
                </Pressable>

                {/* Direct UPI / Instant Pay */}
                {selectedCountry.iso2 === 'IN' && (
                  <Pressable
                    style={[styles.capabilityRow, { backgroundColor: theme.surface, borderColor: theme.borderSubtle, marginTop: spacing.sm }]}
                    onPress={() => setDirectUpiEnabled(!directUpiEnabled)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.capabilityTitle, { color: theme.textPrimary }]}>Direct UPI & Instant QR</Text>
                      <Text style={[styles.capabilityDesc, { color: theme.textSecondary }]}>Render offline zero-fee UPI QR codes directly on invoices</Text>
                    </View>
                    <View
                      style={[
                        styles.checkboxBox,
                        {
                          backgroundColor: directUpiEnabled ? theme.brandAnchor : 'transparent',
                          borderColor: directUpiEnabled ? theme.brandAnchor : theme.borderSubtle,
                        },
                      ]}
                    >
                      {directUpiEnabled && <Check color={theme.surface} size={16} strokeWidth={3} />}
                    </View>
                  </Pressable>
                )}
              </View>

              {/* Setup Summary Confirmation */}
              <View style={[styles.summaryCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle, marginTop: spacing.xl }]}>
                <Text style={[styles.summaryTitle, { color: theme.textPrimary }]}>Workspace Ready</Text>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryKey, { color: theme.textSecondary }]}>Business</Text>
                  <Text style={[styles.summaryVal, { color: theme.textPrimary }]}>{businessName || 'My Business'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryKey, { color: theme.textSecondary }]}>Region</Text>
                  <Text style={[styles.summaryVal, { color: theme.textPrimary }]}>
                    {selectedCountry.name} ({selectedCountry.currencyCode} • {selectedCountry.currencySymbol})
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryKey, { color: theme.textSecondary }]}>Terms</Text>
                  <Text style={[styles.summaryVal, { color: theme.textPrimary }]}>
                    {PAYMENT_TERMS_OPTIONS.find((t) => t.id === paymentTerms)?.label}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* PINNED STICKY BOTTOM ACTION DOCK (NEVER OVERLAYS LIST CONTENT) */}
        <View style={[styles.bottomActionDock, { backgroundColor: theme.surface, borderTopColor: theme.borderSubtle }]}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryCtaBtn,
              {
                backgroundColor: theme.brandAnchor,
                opacity: pressed || saving ? 0.85 : 1,
              },
            ]}
            onPress={handleNext}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={step === 4 ? 'Launch Billframe Workspace' : 'Continue'}
          >
            <Text style={[styles.primaryCtaBtnText, { color: theme.surface }]}>
              {saving ? 'Configuring Workspace...' : step === 4 ? 'Launch Billframe Workspace' : 'Continue'}
            </Text>
            {step < 4 && <ArrowRight color={theme.surface} size={18} strokeWidth={2.5} />}
          </Pressable>
        </View>

        {/* COUNTRY SEARCH BOTTOM SHEET MODAL */}
        <Modal
          visible={showCountryModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowCountryModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.sheetModalCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <View style={styles.sheetHandle}>
                <View style={[styles.handleBar, { backgroundColor: theme.borderSubtle }]} />
              </View>

              <View style={[styles.sheetHeader, { borderBottomColor: theme.borderSubtle }]}>
                <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>Select Country</Text>
                <Pressable onPress={() => setShowCountryModal(false)} hitSlop={12}>
                  <X color={theme.textPrimary} size={22} />
                </Pressable>
              </View>

              {/* Search Box */}
              <View style={[styles.modalSearchBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                <Search color={theme.textMuted} size={18} />
                <TextInput
                  style={[styles.modalSearchInput, { color: theme.textPrimary }]}
                  placeholder="Search country or currency..."
                  placeholderTextColor={theme.textMuted}
                  value={countrySearch}
                  onChangeText={setCountrySearch}
                  autoFocus
                />
              </View>

              <FlatList
                data={filteredCountries}
                keyExtractor={(item) => item.iso2}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const isSelected = item.iso2 === selectedCountry.iso2;
                  return (
                    <Pressable
                      style={({ pressed }) => [
                        styles.countryItemRow,
                        {
                          borderBottomColor: theme.borderSubtle,
                          backgroundColor: isSelected ? theme.surfaceSecondary : 'transparent',
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                      onPress={() => handleSelectCountry(item)}
                    >
                      <CountryFlag iso2={item.iso2} countryName={item.name} size="md" />
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Text style={[styles.countryItemName, { color: theme.textPrimary }]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.countryItemMeta, { color: theme.textSecondary }]}>
                          {item.currencyCode} ({item.currencySymbol}) • Calling: {item.callingCode}
                        </Text>
                      </View>
                      {isSelected && <Check color={theme.brandAnchor} size={20} strokeWidth={2.5} />}
                    </Pressable>
                  );
                }}
              />
            </View>
          </View>
        </Modal>

        {/* SUBDIVISION SEARCH BOTTOM SHEET MODAL (NO WALL OF CHIPS) */}
        <Modal
          visible={showSubdivisionModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowSubdivisionModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.sheetModalCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <View style={styles.sheetHandle}>
                <View style={[styles.handleBar, { backgroundColor: theme.borderSubtle }]} />
              </View>

              <View style={[styles.sheetHeader, { borderBottomColor: theme.borderSubtle }]}>
                <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
                  Select {selectedCountry.subdivisionType}
                </Text>
                <Pressable onPress={() => setShowSubdivisionModal(false)} hitSlop={12}>
                  <X color={theme.textPrimary} size={22} />
                </Pressable>
              </View>

              {/* Search Box */}
              <View style={[styles.modalSearchBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                <Search color={theme.textMuted} size={18} />
                <TextInput
                  style={[styles.modalSearchInput, { color: theme.textPrimary }]}
                  placeholder={`Search ${selectedCountry.subdivisionType}...`}
                  placeholderTextColor={theme.textMuted}
                  value={subdivisionSearch}
                  onChangeText={setSubdivisionSearch}
                  autoFocus
                />
              </View>

              <FlatList
                data={filteredSubdivisions}
                keyExtractor={(item) => item.code}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const isSelected = item.code === selectedSubdivision?.code;
                  return (
                    <Pressable
                      style={({ pressed }) => [
                        styles.countryItemRow,
                        {
                          borderBottomColor: theme.borderSubtle,
                          backgroundColor: isSelected ? theme.surfaceSecondary : 'transparent',
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                      onPress={() => handleSelectSubdivision(item)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.countryItemName, { color: theme.textPrimary }]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.countryItemMeta, { color: theme.textSecondary }]}>
                          {item.type} • {item.code}
                        </Text>
                      </View>
                      {isSelected && <Check color={theme.brandAnchor} size={20} strokeWidth={2.5} />}
                    </Pressable>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicatorWrap: {
    alignItems: 'center',
    width: 140,
  },
  stepIndicatorText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 130, // Generous padding ensuring content is NEVER occluded by the sticky dock
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  stepSection: {
    width: '100%',
  },
  sectionHeader: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.screenTitle.fontSize,
    fontWeight: typography.screenTitle.fontWeight,
    lineHeight: 30,
  },
  sectionSubtitle: {
    fontSize: typography.body.fontSize,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  cardsList: {
    gap: spacing.sm,
  },
  personaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  personaIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  personaTextWrap: {
    flex: 1,
  },
  personaTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  personaSubtitle: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
    lineHeight: 18,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  guaranteeTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  guaranteeBody: {
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
  },
  selectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
  },
  selectorCardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  selectorCardTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  selectorCardMeta: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  textInput: {
    height: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.body.fontSize,
  },
  currencySummaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.xl,
  },
  summaryBadgeItem: {
    flex: 1,
  },
  summaryBadgeLabel: {
    fontSize: typography.caption.fontSize,
  },
  summaryBadgeValue: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
    marginTop: 2,
  },
  summaryBadgeDivider: {
    width: 1,
    height: 32,
    marginHorizontal: spacing.md,
  },
  errorBox: {
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  callingCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radii.sm,
    height: MIN_TOUCH_TARGET,
  },
  callingCodeText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    height: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.body.fontSize,
  },
  helperSuccess: {
    fontSize: typography.caption.fontSize,
    marginTop: 4,
  },
  taxRegistrationCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  toggleSubtitle: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
    lineHeight: 18,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  termsList: {
    gap: spacing.xs,
  },
  termsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  termsLabel: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  termsDesc: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  capabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
  },
  capabilityTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  capabilityDesc: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  summaryCard: {
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  summaryTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryKey: {
    fontSize: typography.caption.fontSize,
  },
  summaryVal: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  bottomActionDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  primaryCtaBtn: {
    height: 52,
    borderRadius: radii.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  primaryCtaBtnText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheetModalCard: {
    maxHeight: '85%',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: 1,
    paddingBottom: spacing.xxl,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: radii.full,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: MIN_TOUCH_TARGET,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: typography.input.fontSize,
  },
  countryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
  },
  countryItemName: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  countryItemMeta: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
});

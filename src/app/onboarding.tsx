/**
 * ONBOARDING FLOW — COMPULSORY 5-STEP PRODUCTION SETUP
 * 
 * 100% Offline-First. Zero telemetry.
 * Configures:
 * 1. Local-first privacy commitment
 * 2. Country & geography metadata (ISO 3166-1/2, currency, calling code)
 * 3. Business profile (name, legal name, subdivision, phone normalization)
 * 4. Business type (personalization engine)
 * 5. Operational capabilities (Tax/GST, inventory, jobs, partial payments)
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
  FeatureIcon,
  ChevronRight,
  ArrowRight,
  Check,
  Search,
  Shield,
  Building2,
  Lock,
} from '../design/icons';
import { BusinessProfileRepository } from '../data/repositories/BusinessProfileRepository';
import { WorkspaceRepository } from '../data/repositories/WorkspaceRepository';
import { BusinessType } from '../domain/features/FeatureRegistry';
import { COUNTRIES } from '../data/geography/countries';
import { SUBDIVISIONS } from '../data/geography/subdivisions';
import { CountryMetadata, SubdivisionMetadata } from '../data/geography/types';
import { CountryFlag } from '../components/common/CountryFlag';
import { normalizePhoneNumber, getCallingCodeForCountry } from '../data/geography/phone';

type SalesType = 'services' | 'products' | 'both';

const BUSINESS_TYPES: Array<{ id: BusinessType; title: string; subtitle: string; icon: string }> = [
  { id: 'freelancer', title: 'Freelancer / Creator', subtitle: 'Digital services, client invoices & expenses', icon: 'invoices' },
  { id: 'service', title: 'Service Business', subtitle: 'Maintenance, consulting, repairs & appointments', icon: 'jobs' },
  { id: 'agency', title: 'Agency / Studio', subtitle: 'Estimates, project retainers & milestone billing', icon: 'reports' },
  { id: 'contractor', title: 'Contractor / Trades', subtitle: 'Jobs, materials, labor, estimates & change orders', icon: 'estimates' },
  { id: 'retail', title: 'Retail Store', subtitle: 'Counter sales, 30s Quick Bill, items & walk-in customers', icon: 'quick_bill' },
  { id: 'wholesale', title: 'Wholesale / Trading', subtitle: 'B2B bulk orders, delivery challans & client ledgers', icon: 'purchases' },
  { id: 'professional', title: 'Professional Practice', subtitle: 'Legal, medical, CA, architecture & consulting', icon: 'customers' },
  { id: 'other', title: 'Other Small Business', subtitle: 'Standard invoices, simple receipts & cash tracking', icon: 'invoices' },
];

interface OnboardingScreenProps {
  onCompleted?: () => void;
}

export default function OnboardingScreen({ onCompleted }: OnboardingScreenProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [step, setStep] = useState<number>(1);

  // Step 2: Country Selection
  const [selectedCountry, setSelectedCountry] = useState<CountryMetadata>(() => {
    return COUNTRIES.find((c) => c.iso2 === 'IN') || COUNTRIES[0];
  });
  const [countrySearch, setCountrySearch] = useState<string>('');

  // Step 3: Business Details
  const [businessName, setBusinessName] = useState<string>('');
  const [legalName, setLegalName] = useState<string>('');
  const [selectedSubdivision, setSelectedSubdivision] = useState<SubdivisionMetadata | null>(null);
  const [customSubdivision, setCustomSubdivision] = useState<string>('');
  const [phoneRaw, setPhoneRaw] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [addressLine, setAddressLine] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');

  // Step 4: Business Type & Sales
  const [businessType, setBusinessType] = useState<BusinessType>('freelancer');
  const [salesType, setSalesType] = useState<SalesType>('services');

  // Step 5: Capabilities
  const [isTaxRegistered, setIsTaxRegistered] = useState<boolean>(false);
  const [taxId, setTaxId] = useState<string>('');
  const [trackInventory, setTrackInventory] = useState<boolean>(false);
  const [trackJobs, setTrackJobs] = useState<boolean>(false);
  const [partialPayments, setPartialPayments] = useState<'often' | 'sometimes' | 'rarely'>('sometimes');
  const [recurringBilling, setRecurringBilling] = useState<boolean>(false);

  const [saving, setSaving] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  // Filter countries for Step 2
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) {
      return COUNTRIES.slice(0, 20); // Top countries first
    }
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

  // Real-time phone normalization
  const phoneValidation = useMemo(() => {
    if (!phoneRaw.trim()) return null;
    return normalizePhoneNumber(phoneRaw, selectedCountry.iso2);
  }, [phoneRaw, selectedCountry.iso2]);

  const handleSelectCountry = (country: CountryMetadata) => {
    setSelectedCountry(country);
    setSelectedSubdivision(null);
    setCustomSubdivision('');
    setCountrySearch('');
  };

  const handleStep3Continue = () => {
    setValidationError('');
    if (!businessName.trim()) {
      setValidationError('Business Name is required.');
      return;
    }
    setStep(4);
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
        name: businessName.trim(),
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
        tax_id: isTaxRegistered && taxId.trim() ? taxId.trim() : undefined,
      });

      // 2. Initialize adaptive workspace preferences with atomic commit
      await WorkspaceRepository.completeOnboardingAsync({
        businessProfileId: profileId,
        businessType,
        salesType,
        isGstRegistered: isTaxRegistered,
        trackInventory,
        trackJobs,
        partialPayments,
        recurringBilling,
        adaptiveEnabled: true,
        layoutLocked: false,
        onboardingCompleted: true,
        onboardingVersion: 1,
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
      Alert.alert('Configuration Error', err?.message || 'Failed to save setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Top Navigation & Step Indicator */}
            <View style={styles.topBar}>
              {step > 1 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to previous step"
                  onPress={() => {
                    setValidationError('');
                    setStep((s) => s - 1);
                  }}
                  style={styles.backBtn}
                >
                  <Text style={[styles.backText, { color: theme.textSecondary }]}>Back</Text>
                </Pressable>
              ) : (
                <View style={{ width: 50 }} />
              )}

              {step > 1 && (
                <Text style={[styles.stepIndicator, { color: theme.textMuted }]}>
                  Step {step} of 5
                </Text>
              )}

              <View style={{ width: 50 }} />
            </View>

            {/* STEP 1: WELCOME & LOCAL-FIRST COMMITMENT */}
            {step === 1 && (
              <View style={styles.welcomeStep}>
                <View style={styles.brandMarkContainer}>
                  <Image
                    source={require('../../assets/brand/billframe-mark.png')}
                    style={styles.brandMarkLarge}
                    resizeMode="contain"
                  />
                </View>
                <Text style={[styles.welcomeTitle, { color: theme.textPrimary }]}>
                  Billframe
                </Text>
                <Text style={[styles.welcomeTagline, { color: theme.textSecondary }]}>
                  Run your billing without the complexity.
                </Text>

                {/* Privacy Invariant Card */}
                <View style={[styles.privacyCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                  <View style={styles.privacyHeader}>
                    <Shield color={theme.brandAnchor} size={22} />
                    <Text style={[styles.privacyTitle, { color: theme.textPrimary }]}>
                      100% Local-First & Sovereign
                    </Text>
                  </View>
                  <Text style={[styles.privacyBody, { color: theme.textSecondary }]}>
                    All your financial ledgers, customer records, invoices, and preferences remain strictly on this device.
                  </Text>
                  <View style={styles.privacyBulletRow}>
                    <Lock size={14} color={theme.textMuted} />
                    <Text style={[styles.privacyBullet, { color: theme.textMuted }]}>
                      Zero external tracking. Zero cloud logins required.
                    </Text>
                  </View>
                </View>

                <View style={[styles.actionBlock, { marginTop: spacing.xl }]}>
                  <Pressable
                    style={[styles.primaryBtn, { backgroundColor: theme.brandAnchor }]}
                    accessibilityRole="button"
                    accessibilityLabel="Begin business setup"
                    onPress={() => setStep(2)}
                  >
                    <Text style={[styles.primaryBtnText, { color: theme.surface }]}>
                      Begin Business Setup
                    </Text>
                    <ArrowRight color={theme.surface} size={18} />
                  </Pressable>
                </View>
              </View>
            )}

            {/* STEP 2: COUNTRY SELECTION (OFFLINE GEOGRAPHY) */}
            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={[styles.questionHeading, { color: theme.textPrimary }]}>
                  Where is your business located?
                </Text>
                <Text style={[styles.questionSubheading, { color: theme.textSecondary }]}>
                  This configures your default currency, phone calling code, and regional tax standards.
                </Text>

                {/* Selected Country Preview Card */}
                <View style={[styles.selectedCountryCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderFocused }]}>
                  <CountryFlag iso2={selectedCountry.iso2} countryName={selectedCountry.name} size="lg" />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={[styles.selectedCountryName, { color: theme.textPrimary }]}>
                      {selectedCountry.name} ({selectedCountry.iso2})
                    </Text>
                    <Text style={[styles.selectedCountryMeta, { color: theme.textSecondary }]}>
                      Currency: {selectedCountry.currencyCode} ({selectedCountry.currencySymbol}) • Calling: {selectedCountry.callingCode}
                    </Text>
                  </View>
                  <Check color={theme.brandAnchor} size={20} strokeWidth={2.5} />
                </View>

                {/* Search Bar */}
                <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                  <Search size={18} color={theme.textMuted} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.textPrimary }]}
                    placeholder="Search country or code (e.g. India, US, UK, UAE)..."
                    placeholderTextColor={theme.textMuted}
                    value={countrySearch}
                    onChangeText={setCountrySearch}
                    autoCapitalize="words"
                  />
                </View>

                {/* Country List */}
                <View style={styles.countryList}>
                  {filteredCountries.map((c) => {
                    const isSelected = selectedCountry.iso2 === c.iso2;
                    return (
                      <Pressable
                        key={c.iso2}
                        style={[
                          styles.countryRow,
                          {
                            backgroundColor: isSelected ? theme.surfaceSecondary : theme.surface,
                            borderColor: isSelected ? theme.borderFocused : theme.borderSubtle,
                          },
                        ]}
                        onPress={() => handleSelectCountry(c)}
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${c.name}`}
                      >
                        <CountryFlag iso2={c.iso2} countryName={c.name} size="md" />
                        <Text style={[styles.countryRowName, { color: theme.textPrimary }]}>
                          {c.name}
                        </Text>
                        <Text style={[styles.countryRowCalling, { color: theme.textMuted }]}>
                          {c.callingCode}
                        </Text>
                        <Text style={[styles.countryRowCurrency, { color: theme.textSecondary }]}>
                          {c.currencyCode}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  style={[styles.primaryBtn, { backgroundColor: theme.brandAnchor, marginTop: spacing.lg }]}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm country and continue"
                  onPress={() => setStep(3)}
                >
                  <Text style={[styles.primaryBtnText, { color: theme.surface }]}>Continue</Text>
                  <ChevronRight color={theme.surface} size={18} />
                </Pressable>
              </View>
            )}

            {/* STEP 3: BUSINESS IDENTITY */}
            {step === 3 && (
              <View style={styles.stepContent}>
                <Text style={[styles.questionHeading, { color: theme.textPrimary }]}>
                  Business Details
                </Text>
                <Text style={[styles.questionSubheading, { color: theme.textSecondary }]}>
                  This information appears on your invoices, receipts, and client estimates.
                </Text>

                {validationError ? (
                  <View style={[styles.errorBox, { borderColor: theme.statusDanger, backgroundColor: theme.surfaceSecondary }]}>
                    <Text style={[styles.errorText, { color: theme.statusDanger }]}>
                      {validationError}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.formBlock}>
                  {/* Business Name */}
                  <Text style={[styles.label, { color: theme.textPrimary }]}>Business Name *</Text>
                  <TextInput
                    style={[
                      styles.input,
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
                  <Text style={[styles.label, { color: theme.textPrimary }]}>Legal Entity Name (Optional)</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.borderSubtle,
                        color: theme.textPrimary,
                      },
                    ]}
                    placeholder="e.g. Apex Solutions Private Limited"
                    placeholderTextColor={theme.textMuted}
                    value={legalName}
                    onChangeText={setLegalName}
                  />

                  {/* Subdivision Picker / Input */}
                  <Text style={[styles.label, { color: theme.textPrimary }]}>
                    {selectedCountry.subdivisionType} ({selectedCountry.name})
                  </Text>
                  {availableSubdivisions.length > 0 ? (
                    <View style={styles.subdivisionChipGrid}>
                      {availableSubdivisions.slice(0, 12).map((sub) => {
                        const isSubSelected = selectedSubdivision?.code === sub.code;
                        return (
                          <Pressable
                            key={sub.code}
                            style={[
                              styles.subdivisionChip,
                              {
                                backgroundColor: isSubSelected ? theme.brandAnchor : theme.surface,
                                borderColor: isSubSelected ? theme.brandAnchor : theme.borderSubtle,
                              },
                            ]}
                            onPress={() => {
                              setSelectedSubdivision(sub);
                              setCustomSubdivision('');
                            }}
                          >
                            <Text
                              style={[
                                styles.subdivisionChipText,
                                { color: isSubSelected ? theme.surface : theme.textPrimary },
                              ]}
                            >
                              {sub.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.borderSubtle,
                          color: theme.textPrimary,
                        },
                      ]}
                      placeholder={`Enter ${selectedCountry.subdivisionType}`}
                      placeholderTextColor={theme.textMuted}
                      value={customSubdivision}
                      onChangeText={setCustomSubdivision}
                    />
                  )}

                  {/* International Phone Input */}
                  <Text style={[styles.label, { color: theme.textPrimary }]}>Phone Number</Text>
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
                    <Text style={[styles.phoneHelperText, { color: theme.statusSuccess }]}>
                      Formatted: {phoneValidation.nationalFormatted} ({phoneValidation.e164})
                    </Text>
                  )}

                  {/* Email */}
                  <Text style={[styles.label, { color: theme.textPrimary }]}>Business Email</Text>
                  <TextInput
                    style={[
                      styles.input,
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
                </View>

                <Pressable
                  style={[styles.primaryBtn, { backgroundColor: theme.brandAnchor, marginTop: spacing.xl }]}
                  accessibilityRole="button"
                  accessibilityLabel="Continue to business type"
                  onPress={handleStep3Continue}
                >
                  <Text style={[styles.primaryBtnText, { color: theme.surface }]}>Continue</Text>
                  <ChevronRight color={theme.surface} size={18} />
                </Pressable>
              </View>
            )}

            {/* STEP 4: BUSINESS TYPE */}
            {step === 4 && (
              <View style={styles.stepContent}>
                <Text style={[styles.questionHeading, { color: theme.textPrimary }]}>
                  What describes your work?
                </Text>
                <Text style={[styles.questionSubheading, { color: theme.textSecondary }]}>
                  Billframe customizes your dashboard, quick actions, and terminology based on how you bill.
                </Text>

                <View style={styles.optionsList}>
                  {BUSINESS_TYPES.map((item) => {
                    const selected = businessType === item.id;
                    return (
                      <Pressable
                        key={item.id}
                        style={[
                          styles.optionCard,
                          {
                            backgroundColor: selected ? theme.surfaceSecondary : theme.surface,
                            borderColor: selected ? theme.borderFocused : theme.borderSubtle,
                          },
                        ]}
                        onPress={() => {
                          setBusinessType(item.id);
                          if (item.id === 'contractor' || item.id === 'service') {
                            setTrackJobs(true);
                          }
                          if (item.id === 'retail' || item.id === 'wholesale') {
                            setTrackInventory(true);
                            setSalesType('products');
                          }
                          if (item.id === 'freelancer') {
                            setSalesType('services');
                          }
                        }}
                      >
                        <View style={styles.optionIconContainer}>
                          <FeatureIcon
                            name={item.icon}
                            size="md"
                            color={selected ? theme.textPrimary : theme.textSecondary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
                            {item.title}
                          </Text>
                          <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                            {item.subtitle}
                          </Text>
                        </View>
                        {selected && (
                          <Check color={theme.textPrimary} size={18} strokeWidth={2.5} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  style={[styles.primaryBtn, { backgroundColor: theme.brandAnchor, marginTop: spacing.lg }]}
                  accessibilityRole="button"
                  accessibilityLabel="Continue to operational requirements"
                  onPress={() => setStep(5)}
                >
                  <Text style={[styles.primaryBtnText, { color: theme.surface }]}>Continue</Text>
                  <ChevronRight color={theme.surface} size={18} />
                </Pressable>
              </View>
            )}

            {/* STEP 5: OPERATIONAL CAPABILITIES */}
            {step === 5 && (
              <View style={styles.stepContent}>
                <Text style={[styles.questionHeading, { color: theme.textPrimary }]}>
                  Operational Capabilities
                </Text>
                <Text style={[styles.questionSubheading, { color: theme.textSecondary }]}>
                  Choose the features you need. You can toggle any of these later in Workspace Settings.
                </Text>

                <View style={[styles.requirementsCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                  {/* Tax / GST Registration */}
                  <Pressable
                    style={styles.toggleRow}
                    onPress={() => setIsTaxRegistered(!isTaxRegistered)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>
                        {selectedCountry.taxSystemName} Registered?
                      </Text>
                      <Text style={[styles.toggleSubtitle, { color: theme.textSecondary }]}>
                        Enables tax ID, invoice breakdowns, and tax rates
                      </Text>
                    </View>
                    <View style={[styles.checkbox, isTaxRegistered && { backgroundColor: theme.brandAnchor, borderColor: theme.brandAnchor }]}>
                      {isTaxRegistered && <Check color={theme.surface} size={14} />}
                    </View>
                  </Pressable>

                  {isTaxRegistered && (
                    <View style={[styles.taxInputSubRow, { backgroundColor: theme.surfaceSecondary }]}>
                      <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
                        {selectedCountry.iso2 === 'IN' ? 'GSTIN Number' : `${selectedCountry.taxSystemName} ID / Number`}
                      </Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.borderSubtle, color: theme.textPrimary }]}
                        placeholder={selectedCountry.iso2 === 'IN' ? '22AAAAA0000A1Z5' : 'Tax ID'}
                        placeholderTextColor={theme.textMuted}
                        autoCapitalize="characters"
                        value={taxId}
                        onChangeText={setTaxId}
                      />
                    </View>
                  )}

                  {/* Stock / Inventory */}
                  <Pressable
                    style={styles.toggleRow}
                    onPress={() => setTrackInventory(!trackInventory)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>Track Inventory & Items?</Text>
                      <Text style={[styles.toggleSubtitle, { color: theme.textSecondary }]}>
                        Stock levels, SKU units & item catalog
                      </Text>
                    </View>
                    <View style={[styles.checkbox, trackInventory && { backgroundColor: theme.brandAnchor, borderColor: theme.brandAnchor }]}>
                      {trackInventory && <Check color={theme.surface} size={14} />}
                    </View>
                  </Pressable>

                  {/* Customer Jobs / Projects */}
                  <Pressable
                    style={styles.toggleRow}
                    onPress={() => setTrackJobs(!trackJobs)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>Customer Jobs & Projects?</Text>
                      <Text style={[styles.toggleSubtitle, { color: theme.textSecondary }]}>
                        Job costing, milestone tracking & work orders
                      </Text>
                    </View>
                    <View style={[styles.checkbox, trackJobs && { backgroundColor: theme.brandAnchor, borderColor: theme.brandAnchor }]}>
                      {trackJobs && <Check color={theme.surface} size={14} />}
                    </View>
                  </Pressable>

                  {/* Partial Payments */}
                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>Accept Partial Payments?</Text>
                      <Text style={[styles.toggleSubtitle, { color: theme.textSecondary }]}>
                        Allows customer deposits and balance tracking
                      </Text>
                    </View>
                    <View style={styles.segmentGroup}>
                      {(['often', 'rarely'] as const).map((opt) => (
                        <Pressable
                          key={opt}
                          style={[
                            styles.segmentBtn,
                            partialPayments === opt && { backgroundColor: theme.brandAnchor },
                          ]}
                          onPress={() => setPartialPayments(opt)}
                        >
                          <Text
                            style={[
                              styles.segmentText,
                              { color: partialPayments === opt ? theme.surface : theme.textSecondary },
                            ]}
                          >
                            {opt === 'often' ? 'Often' : 'Rarely'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Recurring Billing */}
                  <Pressable
                    style={[styles.toggleRow, { borderBottomWidth: 0 }]}
                    onPress={() => setRecurringBilling(!recurringBilling)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>Recurring Billing & Retainers?</Text>
                      <Text style={[styles.toggleSubtitle, { color: theme.textSecondary }]}>
                        Scheduled monthly/periodic client invoices
                      </Text>
                    </View>
                    <View style={[styles.checkbox, recurringBilling && { backgroundColor: theme.brandAnchor, borderColor: theme.brandAnchor }]}>
                      {recurringBilling && <Check color={theme.surface} size={14} />}
                    </View>
                  </Pressable>
                </View>

                {/* Setup Summary Card */}
                <View style={[styles.summaryCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                  <Text style={[styles.summaryHeading, { color: theme.textSecondary }]}>WORKSPACE PROFILE SUMMARY</Text>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Business:</Text>
                    <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>{businessName || 'My Business'}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Country & Currency:</Text>
                    <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                      {selectedCountry.name} ({selectedCountry.currencyCode} {selectedCountry.currencySymbol})
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Workspace Type:</Text>
                    <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                      {BUSINESS_TYPES.find((b) => b.id === businessType)?.title}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: theme.brandAnchor, marginTop: spacing.xl },
                    saving && { opacity: 0.6 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Complete setup and open Billframe"
                  onPress={handleFinish}
                  disabled={saving}
                >
                  <Text style={[styles.primaryBtnText, { color: theme.surface }]}>
                    {saving ? 'Configuring Sovereign Workspace...' : 'Complete Setup & Launch Billframe'}
                  </Text>
                  <ArrowRight color={theme.surface} size={18} />
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    minHeight: 40,
  },
  backBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  backText: {
    fontSize: 14,
    fontWeight: '500',
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: '500',
  },
  welcomeStep: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  brandMarkContainer: {
    width: 96,
    height: 96,
    borderRadius: 22,
    backgroundColor: '#0B0B0D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  brandMarkLarge: {
    width: 72,
    height: 72,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  welcomeTagline: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  privacyCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  privacyBody: {
    fontSize: 13,
    lineHeight: 20,
  },
  privacyBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  privacyBullet: {
    fontSize: 12,
  },
  actionBlock: {
    width: '100%',
    gap: spacing.md,
  },
  stepContent: {
    paddingVertical: spacing.sm,
  },
  questionHeading: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  questionSubheading: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  selectedCountryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    marginBottom: spacing.md,
  },
  selectedCountryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedCountryMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  countryList: {
    gap: spacing.xs,
    maxHeight: 280,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
  },
  countryRowName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: spacing.md,
  },
  countryRowCalling: {
    fontSize: 12,
    marginRight: spacing.md,
  },
  countryRowCurrency: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  formBlock: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    height: MIN_TOUCH_TARGET,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
  subdivisionChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginVertical: 4,
  },
  subdivisionChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  subdivisionChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  callingCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: MIN_TOUCH_TARGET,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  callingCodeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    height: MIN_TOUCH_TARGET,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
  phoneHelperText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  optionsList: {
    gap: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
  },
  optionIconContainer: {
    marginRight: spacing.md,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  requirementsCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E3',
    minHeight: MIN_TOUCH_TARGET,
  },
  taxInputSubRow: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E3',
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#9E9E9C',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  segmentGroup: {
    flexDirection: 'row',
    backgroundColor: '#EFEFED',
    borderRadius: radii.sm,
    padding: 2,
    marginLeft: spacing.sm,
  },
  segmentBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.sm - 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: 6,
  },
  summaryHeading: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  primaryBtn: {
    height: 52,
    borderRadius: radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

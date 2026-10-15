/**
 * COMPULSORY ONBOARDING FLOW — ONBOARDING 3.0 MASTER REDESIGN
 * 
 * 100% Offline-First. Zero cloud dependency.
 * 
 * 4-Step Progressive Journey:
 * 1. Step 1: Your Work — Intent selection (Business Documents, Invoices & Billing, Operations, Complete Workspace).
 * 2. Step 2: Your Business — Organization identity (Name, Industry, Country/Currency, Subdivision, Logo, Contact).
 * 3. Step 3: Your Documents — Personalized document packs with pre-selected favorites & multi-select toggles.
 * 4. Step 4: Ready to Create — Executive monochrome live preview card with real business name, logo & instant CTAs:
 *    - "Create my first document" -> routes directly to the relevant document studio/editor.
 *    - "Explore my workspace" -> routes to dashboard.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  colors,
  spacing,
  radii,
  typography,
  MIN_TOUCH_TARGET,
  MAX_CONTENT_WIDTH,
} from '../design/tokens';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  Building2,
  Briefcase,
  Store,
  Truck,
  Wrench,
  Palette,
  Sparkles,
  X,
  CreditCard,
  FileText,
  ChevronDown,
  ShieldCheck,
  Layers,
  GraduationCap,
  HelpCircle,
} from 'lucide-react-native';
import { BusinessProfileRepository } from '../data/repositories/BusinessProfileRepository';
import { WorkspaceRepository } from '../data/repositories/WorkspaceRepository';
import {
  PrimaryIntent,
  OnboardingState,
  WorkspacePreferences,
} from '../domain/workspace/AdaptiveWorkspaceEngine';
import { BusinessType } from '../domain/features/FeatureRegistry';
import { COUNTRIES } from '../data/geography/countries';
import { SUBDIVISIONS } from '../data/geography/subdivisions';
import { CountryMetadata, SubdivisionMetadata } from '../data/geography/types';
import { CountryFlag } from '../components/common/CountryFlag';
import { normalizePhoneNumber } from '../data/geography/phone';
import { LogoUploader } from '../components/common/LogoUploader';
import {
  getRecommendedDocumentsForOnboarding,
  RecommendedDocumentItem,
  ALL_ONBOARDING_DOCUMENTS,
} from '../domain/documents/onboardingRecommendations';
import { useTheme } from '../design/ThemeContext';
import { ThemeSelectionStep } from '../components/onboarding/ThemeSelectionStep';

interface OnboardingScreenProps {
  onCompleted?: (targetRoute?: string) => void;
}

interface IntentOption {
  id: PrimaryIntent;
  title: string;
  subtitle: string;
  description: string;
  iconName: 'file' | 'card' | 'wrench' | 'sparkles';
}

const INTENT_OPTIONS: IntentOption[] = [
  {
    id: 'business_documents',
    title: 'Business Documents',
    subtitle: 'Contracts, job offers, letters, proposals & formal agreements',
    description: 'Prepares corporate letterhead, HR agreements, non-disclosure & employment documentation.',
    iconName: 'file',
  },
  {
    id: 'invoices_payments',
    title: 'Invoices & Billing',
    subtitle: 'Tax invoices, bills of supply, receipts, estimates & payment collection',
    description: 'Configures commercial sales billing, tax invoices, cash receipts and customer ledgers.',
    iconName: 'card',
  },
  {
    id: 'operations',
    title: 'Operational Documents',
    subtitle: 'Work orders, purchase orders, delivery notes, inspection logs',
    description: 'Prepares field service cards, procurement orders, dispatch challans and material records.',
    iconName: 'wrench',
  },
  {
    id: 'complete_workspace',
    title: 'Complete Workspace',
    subtitle: 'All documents, full billing suite, inventory & operations',
    description: 'Unlocks the full universal document engine with all administrative, billing, and field tools.',
    iconName: 'sparkles',
  },
];

interface BusinessTypeOption {
  id: BusinessType;
  title: string;
  subtitle: string;
}

const BUSINESS_TYPE_OPTIONS: BusinessTypeOption[] = [
  {
    id: 'freelancer',
    title: 'Freelancer / Creator',
    subtitle: 'Client projects, milestone fees & copyright contracts',
  },
  {
    id: 'service',
    title: 'Service Business / Consultant',
    subtitle: 'Professional services, retainers, client reports & invoices',
  },
  {
    id: 'agency',
    title: 'Agency / Studio / Tech',
    subtitle: 'Employment agreements, proposals, client billing & retainers',
  },
  {
    id: 'contractor',
    title: 'Contractor / Trades',
    subtitle: 'Field work orders, change orders, materials & job estimates',
  },
  {
    id: 'retail',
    title: 'Retail Store / Counter Sales',
    subtitle: 'Fast sales, bills of supply, customer receipts & walk-ins',
  },
  {
    id: 'wholesale',
    title: 'Wholesale / B2B Trading',
    subtitle: 'Bulk orders, dispatch challans, vendor POs & client ledgers',
  },
  {
    id: 'professional',
    title: 'Professional / Institution',
    subtitle: 'Legal, accounting, medical, school & academic documentation',
  },
  {
    id: 'other',
    title: 'General Business',
    subtitle: 'Standard corporate forms, billing, receipts & ledgers',
  },
];

export default function OnboardingScreen({ onCompleted }: OnboardingScreenProps) {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [isLoadingDraft, setIsLoadingDraft] = useState<boolean>(true);

  // Active step (1 to 4)
  const [step, setStep] = useState<number>(1);

  // ── Step 1: Your Work ──
  const [primaryIntent, setPrimaryIntent] = useState<PrimaryIntent>('business_documents');

  // ── Step 2: Your Business ──
  const [businessName, setBusinessName] = useState<string>('');
  const [legalName, setLegalName] = useState<string>('');
  const [businessType, setBusinessType] = useState<BusinessType>('agency');
  const [logoUri, setLogoUri] = useState<string | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<CountryMetadata>(() => {
    return COUNTRIES.find((c) => c.iso2 === 'IN') || COUNTRIES[0];
  });
  const [countrySearch, setCountrySearch] = useState<string>('');
  const [showCountryModal, setShowCountryModal] = useState<boolean>(false);

  const [selectedSubdivision, setSelectedSubdivision] = useState<SubdivisionMetadata | null>(() => {
    return SUBDIVISIONS.find((s) => s.countryIso2 === 'IN' && s.code === 'IN-MH') || null;
  });
  const [customSubdivision, setCustomSubdivision] = useState<string>('');
  const [subdivisionSearch, setSubdivisionSearch] = useState<string>('');
  const [showSubdivisionModal, setShowSubdivisionModal] = useState<boolean>(false);

  // Optional contact details
  const [showExtraContact, setShowExtraContact] = useState<boolean>(false);
  const [city, setCity] = useState<string>('');
  const [addressLine, setAddressLine] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [phoneRaw, setPhoneRaw] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [taxId, setTaxId] = useState<string>('');

  // ── Step 3: Your Documents ──
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  // Operational State
  const [saving, setSaving] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  // ── Load Draft / Restore In-Progress Onboarding ──
  useEffect(() => {
    async function loadInitialState() {
      try {
        const [profile, prefs] = await Promise.all([
          BusinessProfileRepository.getActiveProfile(),
          WorkspaceRepository.getPreferencesAsync(),
        ]);

        if (prefs) {
          if (prefs.primaryIntent) setPrimaryIntent(prefs.primaryIntent);
          if (prefs.businessType) setBusinessType(prefs.businessType);
          if (prefs.favoriteDocumentTypes && prefs.favoriteDocumentTypes.length > 0) {
            setSelectedDocIds(prefs.favoriteDocumentTypes);
          }
          if (prefs.onboardingStep && prefs.onboardingStep > 1 && prefs.onboardingState === 'in_progress') {
            setStep(prefs.onboardingStep);
          }
        }

        if (profile) {
          if (profile.name && profile.name !== 'My Business') {
            setBusinessName(profile.name);
          }
          if (profile.legal_name) setLegalName(profile.legal_name);
          if (profile.logo_uri) setLogoUri(profile.logo_uri);
          if (profile.city) setCity(profile.city);
          if (profile.address_line1) setAddressLine(profile.address_line1);
          if (profile.postal_code) setPostalCode(profile.postal_code);
          if (profile.phone) setPhoneRaw(profile.phone);
          if (profile.email) setEmail(profile.email);
          if (profile.tax_id) setTaxId(profile.tax_id);

          if (profile.country_iso2) {
            const c = COUNTRIES.find((item) => item.iso2 === profile.country_iso2);
            if (c) setSelectedCountry(c);
          }
          if (profile.subdivision_code) {
            const s = SUBDIVISIONS.find((item) => item.code === profile.subdivision_code);
            if (s) setSelectedSubdivision(s);
          } else if (profile.state) {
            setCustomSubdivision(profile.state);
          }
        }
      } catch (err) {
        // Fallback gracefully to default initial state
      } finally {
        setIsLoadingDraft(false);
      }
    }
    loadInitialState();
  }, []);

  // ── Document Recommendations ──
  const recommendations = useMemo(() => {
    return getRecommendedDocumentsForOnboarding(primaryIntent, businessType);
  }, [primaryIntent, businessType]);

  // Synchronize pre-selected document favorites when recommendation set changes
  useEffect(() => {
    if (selectedDocIds.length === 0 && recommendations.defaultSelectedIds.length > 0) {
      setSelectedDocIds(recommendations.defaultSelectedIds);
    }
  }, [recommendations]);

  // Top hero document for Step 4 Preview and primary CTA destination
  const topHeroDocument = useMemo(() => {
    if (selectedDocIds.length > 0) {
      const match = recommendations.documents.find((d) => d.id === selectedDocIds[0]);
      if (match) return match;
    }
    return recommendations.topHeroDocument;
  }, [selectedDocIds, recommendations]);

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

  const toggleDocumentFavorite = (docId: string) => {
    setSelectedDocIds((prev) => {
      if (prev.includes(docId)) {
        // Keep at least one selected document
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== docId);
      } else {
        return [...prev, docId];
      }
    });
  };

  // ── Step Navigation & In-Progress Draft Persistence ──
  const handleNext = async () => {
    setValidationError('');

    if (step === 1) {
      // Step 1: Theme Selection -> Step 2: Your Work
      WorkspaceRepository.updateOnboardingProgressAsync({
        onboardingStep: 2,
      }).catch(() => {});
      setStep(2);
    } else if (step === 2) {
      // Step 2: Your Work -> Step 3: Your Business
      WorkspaceRepository.updateOnboardingProgressAsync({
        primaryIntent,
        onboardingStep: 3,
      }).catch(() => {});
      setStep(3);
    } else if (step === 3) {
      // Step 3: Your Business -> Step 4: Your Documents
      if (!businessName.trim()) {
        setValidationError('Organization / Business Name is required.');
        return;
      }

      // Persist draft profile and step
      try {
        const activeProfile = await BusinessProfileRepository.getActiveProfile();
        const profileId = activeProfile?.id || 'default_business_profile';
        const subdivisionName = selectedSubdivision?.name || customSubdivision.trim() || undefined;

        await BusinessProfileRepository.updateProfile({
          id: profileId,
          name: businessName.trim(),
          legal_name: legalName.trim() || undefined,
          country: selectedCountry.name,
          country_iso2: selectedCountry.iso2,
          subdivision_code: selectedSubdivision?.code || undefined,
          subdivision_name: subdivisionName,
          state: subdivisionName,
          city: city.trim() || undefined,
          address_line1: addressLine.trim() || undefined,
          postal_code: postalCode.trim() || undefined,
          phone: phoneRaw.trim() || undefined,
          email: email.trim() || undefined,
          tax_id: taxId.trim() || undefined,
          logo_uri: logoUri,
          default_currency: selectedCountry.currencyCode,
          default_document_locale: selectedCountry.defaultLocale,
        });

        await WorkspaceRepository.updateOnboardingProgressAsync({
          businessType,
          onboardingStep: 4,
        });
      } catch {
        // Silently continue
      }

      setStep(4);
    } else if (step === 4) {
      // Step 4: Your Documents -> Step 5: Ready to Create
      // Ensure at least one favorite document is picked
      if (selectedDocIds.length === 0) {
        setSelectedDocIds(recommendations.defaultSelectedIds);
      }

      WorkspaceRepository.updateOnboardingProgressAsync({
        favoriteDocumentTypes: selectedDocIds.length > 0 ? selectedDocIds : recommendations.defaultSelectedIds,
        onboardingStep: 5,
      }).catch(() => {});

      setStep(5);
    }
  };

  const handleBack = () => {
    setValidationError('');
    if (step > 1) {
      const prevStep = step - 1;
      setStep(prevStep);
      WorkspaceRepository.updateOnboardingProgressAsync({
        onboardingStep: prevStep,
      }).catch(() => {});
    }
  };

  // ── Final Completion Handler ──
  const handleFinish = async (targetRoute?: string) => {
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

      // 1. Commit active business profile
      await BusinessProfileRepository.updateProfile({
        id: profileId,
        name: businessName.trim() || 'My Organization',
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
        tax_id: taxId.trim() || undefined,
        logo_uri: logoUri,
      });

      // 2. Commit workspace preferences with onboardingCompleted: true
      const finalDocIds = selectedDocIds.length > 0 ? selectedDocIds : recommendations.defaultSelectedIds;
      await WorkspaceRepository.completeOnboardingAsync({
        businessProfileId: profileId,
        businessType,
        primaryIntent,
        favoriteDocumentTypes: finalDocIds,
        selectedDocumentFamilies: [primaryIntent],
        onboardingState: 'completed',
        onboardingCompleted: true,
        onboardingVersion: 3,
        onboardingCompletedAt: Date.now(),
        onboardingStep: 4,
        adaptiveEnabled: true,
        layoutLocked: false,
      });

      // 3. Navigate directly to user destination
      if (onCompleted) {
        onCompleted(targetRoute);
      } else {
        if (targetRoute) {
          router.replace(targetRoute as any);
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (err: any) {
      Alert.alert('Workspace Setup Error', err?.message || 'Failed to complete setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderIntentIcon = (iconName: IntentOption['iconName']) => {
    switch (iconName) {
      case 'file':
        return <FileText color="#FFFFFF" size={20} />;
      case 'card':
        return <CreditCard color="#FFFFFF" size={20} />;
      case 'wrench':
        return <Wrench color="#FFFFFF" size={20} />;
      case 'sparkles':
        return <Sparkles color="#FFFFFF" size={20} />;
    }
  };

  if (isLoadingDraft) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#0D0E10' }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Initializing Workspace...</Text>
      </View>
    );
  }

  if (step === 1) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0B0B0F' : '#F9FAFB' }]} edges={['top', 'left', 'right', 'bottom']}>
        <ThemeSelectionStep onContinue={handleNext} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0D0E10' : '#FFFFFF' }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Top Header & Progress Stepper ── */}
        <View style={styles.headerBar}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>BF</Text>
            </View>
            <Text style={styles.brandTitle}>BILLFRAME</Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionBadgeText}>4.0</Text>
            </View>
          </View>

          {/* Stepper bar */}
          <View style={styles.progressRow}>
            {[2, 3, 4, 5].map((s) => (
              <View
                key={s}
                style={[
                  styles.progressSegment,
                  s <= step ? styles.progressSegmentActive : styles.progressSegmentInactive,
                ]}
              />
            ))}
          </View>
          <View style={styles.stepCounterRow}>
            <Text style={styles.stepCounterText}>
              Step {step - 1} of 4 •{' '}
              {step === 2
                ? 'Your Work'
                : step === 3
                ? 'Your Business'
                : step === 4
                ? 'Your Documents'
                : 'Ready to Create'}
            </Text>
          </View>
        </View>

        {/* ── Scrollable Body Content ── */}
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={[styles.scrollInner, { paddingBottom: insets.bottom + 110 }]}
          keyboardShouldPersistTaps="handled"
        >
          {validationError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠ {validationError}</Text>
            </View>
          ) : null}

          {/* ══════════════════════════════════════════════════════
              STEP 2: YOUR WORK (INTENT SELECTION)
             ══════════════════════════════════════════════════════ */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepHeading}>Welcome to Billframe</Text>
              <Text style={styles.stepSubtitle}>
                What would you like to create first? You can access any document type at any time.
              </Text>

              <View style={styles.optionsList}>
                {INTENT_OPTIONS.map((opt) => {
                  const isSelected = primaryIntent === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      style={[
                        styles.intentCard,
                        isSelected && styles.intentCardSelected,
                      ]}
                      onPress={() => setPrimaryIntent(opt.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <View style={styles.intentTopRow}>
                        <View style={[styles.intentIconBox, isSelected && styles.intentIconBoxSelected]}>
                          {renderIntentIcon(opt.iconName)}
                        </View>
                        <View style={styles.intentTextWrap}>
                          <Text style={[styles.intentTitle, isSelected && styles.intentTitleSelected]}>
                            {opt.title}
                          </Text>
                          <Text style={styles.intentSubtitle}>{opt.subtitle}</Text>
                        </View>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                          {isSelected && <View style={styles.radioInnerDot} />}
                        </View>
                      </View>
                      <Text style={styles.intentDescription}>{opt.description}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP 3: YOUR BUSINESS (ORGANIZATION IDENTITY)
             ══════════════════════════════════════════════════════ */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepHeading}>Organization Identity</Text>
              <Text style={styles.stepSubtitle}>
                Set up once. Automatically populates headers, footers & signatures across all documents.
              </Text>

              {/* Business Name Field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  ORGANIZATION / BUSINESS NAME <Text style={styles.reqStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={businessName}
                  onChangeText={(val) => {
                    setBusinessName(val);
                    if (validationError) setValidationError('');
                  }}
                  placeholder="e.g. Apex Engineering or Zenith Technologies"
                  placeholderTextColor="#64748B"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              {/* Business Type Selector */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>BUSINESS TYPE / COMMERCIAL MODEL</Text>
                <View style={styles.typeGrid}>
                  {BUSINESS_TYPE_OPTIONS.map((bt) => {
                    const isSelected = businessType === bt.id;
                    return (
                      <Pressable
                        key={bt.id}
                        style={[
                          styles.typeCard,
                          isSelected && styles.typeCardSelected,
                        ]}
                        onPress={() => setBusinessType(bt.id)}
                      >
                        <Text style={[styles.typeTitle, isSelected && styles.typeTitleSelected]}>
                          {bt.title}
                        </Text>
                        <Text style={styles.typeSubtitle} numberOfLines={2}>
                          {bt.subtitle}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Country & Currency Selector */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>COUNTRY & PRIMARY CURRENCY</Text>
                <Pressable
                  style={styles.pickerButton}
                  onPress={() => setShowCountryModal(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Select Country and Currency"
                >
                  <View style={styles.pickerContentRow}>
                    <CountryFlag iso2={selectedCountry.iso2} size="md" />
                    <Text style={styles.pickerMainText}>
                      {selectedCountry.name} ({selectedCountry.currencyCode}, {selectedCountry.currencySymbol})
                    </Text>
                  </View>
                  <ChevronDown size={18} color="#94A3B8" />
                </Pressable>
              </View>

              {/* Subdivision / State / Province */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>STATE / PROVINCE / SUBDIVISION</Text>
                <Pressable
                  style={styles.pickerButton}
                  onPress={() => setShowSubdivisionModal(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Select State or Province"
                >
                  <View style={styles.pickerContentRow}>
                    <Building2 size={16} color="#94A3B8" />
                    <Text style={styles.pickerMainText}>
                      {selectedSubdivision
                        ? `${selectedSubdivision.name} (${selectedSubdivision.code})`
                        : customSubdivision.trim() || 'Select State or Province (Optional)'}
                    </Text>
                  </View>
                  <ChevronDown size={18} color="#94A3B8" />
                </Pressable>
              </View>

              {/* Optional Organization Logo */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>ORGANIZATION LOGO (OPTIONAL)</Text>
                <LogoUploader
                  logoUri={logoUri}
                  onLogoChange={(newUri) => setLogoUri(newUri)}
                  autoSaveProfile={false}
                  label="Organization Brand Mark"
                  description="Displays in the executive monochrome header frame. Optional — you can upload or change anytime."
                />
              </View>

              {/* Optional Contact Toggle */}
              <Pressable
                style={styles.accordionToggle}
                onPress={() => setShowExtraContact(!showExtraContact)}
              >
                <Text style={styles.accordionToggleText}>
                  {showExtraContact ? '▲ Hide Additional Address & Contact Details' : '▼ Add Address, City, Phone & Tax ID (Optional)'}
                </Text>
              </Pressable>

              {showExtraContact && (
                <View style={styles.extraContactCard}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>CITY / TOWN</Text>
                    <TextInput
                      style={styles.textInput}
                      value={city}
                      onChangeText={setCity}
                      placeholder="e.g. Bengaluru, Mumbai, London"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>STREET ADDRESS</Text>
                    <TextInput
                      style={styles.textInput}
                      value={addressLine}
                      onChangeText={setAddressLine}
                      placeholder="e.g. 42 Tech Park, Outer Ring Road"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>POSTAL / ZIP CODE</Text>
                    <TextInput
                      style={styles.textInput}
                      value={postalCode}
                      onChangeText={setPostalCode}
                      placeholder="e.g. 560103"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>OFFICIAL PHONE</Text>
                    <TextInput
                      style={styles.textInput}
                      value={phoneRaw}
                      onChangeText={setPhoneRaw}
                      placeholder="e.g. +91 98765 43210"
                      placeholderTextColor="#64748B"
                      keyboardType="phone-pad"
                    />
                    {phoneValidation && (
                      <Text style={[styles.phoneStatusText, phoneValidation.isValid ? styles.phoneValid : styles.phoneInvalid]}>
                        {phoneValidation.isValid ? `✓ Valid (${phoneValidation.nationalFormatted})` : 'Format hint: include country code or full mobile digits'}
                      </Text>
                    )}
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>OFFICIAL EMAIL</Text>
                    <TextInput
                      style={styles.textInput}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="e.g. contact@apexengineering.com"
                      placeholderTextColor="#64748B"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>TAX ID / GSTIN / VAT NUMBER</Text>
                    <TextInput
                      style={styles.textInput}
                      value={taxId}
                      onChangeText={setTaxId}
                      placeholder="e.g. 29ABCDE1234F1Z5 or US EIN"
                      placeholderTextColor="#64748B"
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP 4: YOUR DOCUMENTS (CURATED PACKS & FAVORITES)
             ══════════════════════════════════════════════════════ */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepHeading}>Personalize Documents</Text>
              <Text style={styles.stepSubtitle}>
                Select the documents you use most frequently. Billframe keeps them pinned to your quick actions dock.
              </Text>

              {/* Selection summary pill */}
              <View style={styles.selectionCountPill}>
                <Check size={14} color="#FFFFFF" />
                <Text style={styles.selectionCountText}>
                  {selectedDocIds.length} Document{selectedDocIds.length === 1 ? '' : 's'} Selected for Rapid Creation
                </Text>
              </View>

              <View style={styles.docsList}>
                {recommendations.documents.map((doc) => {
                  const isChecked = selectedDocIds.includes(doc.id);
                  return (
                    <Pressable
                      key={doc.id}
                      style={[
                        styles.docCard,
                        isChecked && styles.docCardSelected,
                      ]}
                      onPress={() => toggleDocumentFavorite(doc.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isChecked }}
                    >
                      <View style={styles.docHeaderRow}>
                        <View style={styles.docTitleBlock}>
                          <Text style={[styles.docTitleText, isChecked && styles.docTitleTextSelected]}>
                            {doc.title}
                          </Text>
                          <View style={styles.badgeRow}>
                            <View style={styles.categoryPill}>
                              <Text style={styles.categoryPillText}>{doc.category}</Text>
                            </View>
                            <View style={styles.readyPill}>
                              <Text style={styles.readyPillText}>{doc.badge}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={[styles.checkboxSquare, isChecked && styles.checkboxSquareSelected]}>
                          {isChecked && <Check size={14} color="#0D0E10" strokeWidth={3} />}
                        </View>
                      </View>
                      <Text style={styles.docDescText}>{doc.description}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP 5: READY TO CREATE (EXECUTIVE MONOCHROME PREVIEW)
             ══════════════════════════════════════════════════════ */}
          {step === 5 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepHeading}>Your Workspace is Ready</Text>
              <Text style={styles.stepSubtitle}>
                Your organization identity is embedded into every template. Offline document creation is active.
              </Text>

              {/* Organization Summary Card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryTopRow}>
                  <View style={styles.summaryLogoBox}>
                    {logoUri ? (
                      <Image source={{ uri: logoUri }} style={styles.summaryLogoImage} resizeMode="contain" />
                    ) : (
                      <View style={styles.summaryMonogramBox}>
                        <Text style={styles.summaryMonogramText}>
                          {(businessName.trim() || 'BF').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.summaryDetailsWrap}>
                    <Text style={styles.summaryBusinessName} numberOfLines={1}>
                      {businessName.trim() || 'My Organization'}
                    </Text>
                    <Text style={styles.summaryLocationText}>
                      {[
                        city.trim(),
                        selectedSubdivision?.name || customSubdivision.trim(),
                        selectedCountry.name,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </Text>
                    <View style={styles.summaryMetaRow}>
                      <View style={styles.summaryPill}>
                        <Text style={styles.summaryPillText}>
                          Currency: {selectedCountry.currencyCode} ({selectedCountry.currencySymbol})
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Tags row */}
                <View style={styles.summaryTagsRow}>
                  <View style={styles.summaryTagItem}>
                    <Text style={styles.summaryTagText}>
                      Workflow: {INTENT_OPTIONS.find((i) => i.id === primaryIntent)?.title || 'Universal Documents'}
                    </Text>
                  </View>
                  <View style={styles.summaryTagItem}>
                    <Text style={styles.summaryTagText}>
                      {selectedDocIds.length} Pinned Templates
                    </Text>
                  </View>
                </View>
              </View>

              {/* ── Miniature A4 Document Preview Card (Executive Monochrome) ── */}
              <View style={styles.previewSectionHeader}>
                <Text style={styles.previewSectionTitle}>DOCUMENT SYSTEM LIVE PREVIEW</Text>
                <Text style={styles.previewSectionBadge}>A4 Executive Monochrome</Text>
              </View>

              <View style={styles.sheetPreviewCard}>
                {/* Header Frame */}
                <View style={styles.sheetHeader}>
                  <View style={styles.sheetLogoFrame}>
                    {logoUri ? (
                      <Image source={{ uri: logoUri }} style={styles.sheetLogoImage} resizeMode="contain" />
                    ) : (
                      <View style={styles.sheetMonogramInner}>
                        <Text style={styles.sheetMonogramStar}>✦</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.sheetOrgTextWrap}>
                    <Text style={styles.sheetOrgName}>
                      {businessName.trim() || 'ACME CORPORATION'}
                    </Text>
                    <Text style={styles.sheetOrgMeta}>
                      {[city.trim() || 'Metropolitan Center', selectedCountry.name].filter(Boolean).join(', ')}
                    </Text>
                    <Text style={styles.sheetDocMeta}>
                      REF: {topHeroDocument.code.toUpperCase()}-2026-001 • DATE: 10 OCT 2026
                    </Text>
                  </View>
                </View>

                {/* Solid Divider Line */}
                <View style={styles.sheetDivider} />

                {/* Hero Document Title */}
                <View style={styles.sheetTitleBanner}>
                  <Text style={styles.sheetDocTitleText}>
                    {topHeroDocument.title.toUpperCase()}
                  </Text>
                </View>

                {/* Structured Document Body Sample */}
                <View style={styles.sheetBody}>
                  {topHeroDocument.id === 'job_offer_letter' ? (
                    <View style={styles.sheetDocContent}>
                      <Text style={styles.sheetParagraph}>
                        Dear Aarav Sharma, we are pleased to offer you the position of Senior Engineer at{' '}
                        <Text style={styles.sheetBold}>{businessName.trim() || 'Acme Corporation'}</Text>.
                      </Text>
                      <View style={styles.sheetMiniTable}>
                        <View style={styles.sheetTableRow}>
                          <Text style={styles.sheetTableCellBold}>Annual CTC:</Text>
                          <Text style={styles.sheetTableCell}>
                            {selectedCountry.currencySymbol} 1,200,000 / year
                          </Text>
                        </View>
                        <View style={styles.sheetTableRow}>
                          <Text style={styles.sheetTableCellBold}>Joining Date:</Text>
                          <Text style={styles.sheetTableCell}>01 November 2026</Text>
                        </View>
                        <View style={styles.sheetTableRow}>
                          <Text style={styles.sheetTableCellBold}>Base Location:</Text>
                          <Text style={styles.sheetTableCell}>{city.trim() || selectedCountry.name}</Text>
                        </View>
                      </View>
                    </View>
                  ) : topHeroDocument.id === 'work_order' ? (
                    <View style={styles.sheetDocContent}>
                      <Text style={styles.sheetParagraph}>
                        Authorization for on-site services and technical execution under work order terms:
                      </Text>
                      <View style={styles.sheetMiniTable}>
                        <View style={styles.sheetTableRow}>
                          <Text style={styles.sheetTableCellBold}>Service Task:</Text>
                          <Text style={styles.sheetTableCell}>Commercial Installation & Safety Inspection</Text>
                        </View>
                        <View style={styles.sheetTableRow}>
                          <Text style={styles.sheetTableCellBold}>Estimated Hours:</Text>
                          <Text style={styles.sheetTableCell}>16 Labor Hours • Priority A</Text>
                        </View>
                        <View style={styles.sheetTableRow}>
                          <Text style={styles.sheetTableCellBold}>Assigned Lead:</Text>
                          <Text style={styles.sheetTableCell}>Field Operations Unit</Text>
                        </View>
                      </View>
                    </View>
                  ) : topHeroDocument.id === 'student_fee_receipt' ? (
                    <View style={styles.sheetDocContent}>
                      <Text style={styles.sheetParagraph}>
                        Official receipt of academic tuition fees for student semester enrollment:
                      </Text>
                      <View style={styles.sheetMiniTable}>
                        <View style={styles.sheetTableRow}>
                          <Text style={styles.sheetTableCellBold}>Student Name:</Text>
                          <Text style={styles.sheetTableCell}>Aditi Sharma (Roll # 2026-ENG-42)</Text>
                        </View>
                        <View style={styles.sheetTableRow}>
                          <Text style={styles.sheetTableCellBold}>Tuition Paid:</Text>
                          <Text style={styles.sheetTableCell}>{selectedCountry.currencySymbol} 45,000 (Clearance: Paid)</Text>
                        </View>
                        <View style={styles.sheetTableRow}>
                          <Text style={styles.sheetTableCellBold}>Term / Year:</Text>
                          <Text style={styles.sheetTableCell}>Academic Term 2026–2027</Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.sheetDocContent}>
                      <Text style={styles.sheetParagraph}>
                        Commercial tax invoice rendered for customer services and equipment supplies:
                      </Text>
                      <View style={styles.sheetMiniTable}>
                        <View style={styles.sheetTableRow}>
                          <Text style={styles.sheetTableCellBold}>Item / Scope</Text>
                          <Text style={styles.sheetTableCellBold}>Total ({selectedCountry.currencyCode})</Text>
                        </View>
                        <View style={styles.sheetTableRow}>
                          <Text style={styles.sheetTableCell}>1. Professional Advisory & Services</Text>
                          <Text style={styles.sheetTableCell}>{selectedCountry.currencySymbol} 24,000</Text>
                        </View>
                        <View style={styles.sheetTableRow}>
                          <Text style={styles.sheetTableCellBold}>Net Total Due:</Text>
                          <Text style={styles.sheetTableCellBold}>{selectedCountry.currencySymbol} 24,000</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>

                {/* Signatory Footer */}
                <View style={styles.sheetFooter}>
                  <View style={styles.sheetSignatoryLine} />
                  <Text style={styles.sheetSignatoryText}>
                    Authorized Signatory • {businessName.trim() || 'My Organization'}
                  </Text>
                  <Text style={styles.sheetWatermark}>
                    Generated 100% Offline via Billframe Intelligence Engine
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ══════════════════════════════════════════════════════
            PINNED BOTTOM ACTION DOCK
           ══════════════════════════════════════════════════════ */}
        <View style={[styles.bottomDock, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          {step > 1 && step < 5 && (
            <Pressable
              style={styles.backButton}
              onPress={handleBack}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Go back to previous step"
            >
              <ArrowLeft size={16} color="#FFFFFF" />
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          )}

          {step < 5 ? (
            <Pressable
              style={[styles.primaryButton, step === 2 && { flex: 1 }]}
              onPress={handleNext}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Continue to next step"
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
              <ArrowRight size={16} color="#0D0E10" strokeWidth={2.5} />
            </Pressable>
          ) : (
            <View style={styles.step4ActionGroup}>
              {/* Primary CTA: Launch directly into first document */}
              <Pressable
                style={({ pressed }) => [
                  styles.createDocHeroBtn,
                  pressed && { opacity: 0.85 },
                  saving && { opacity: 0.6 },
                ]}
                onPress={() => handleFinish(topHeroDocument.editorRoute)}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel={`Create my first document: ${topHeroDocument.title}`}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#0D0E10" />
                ) : (
                  <>
                    <Text style={styles.createDocHeroBtnText}>
                      Create my first document ({topHeroDocument.title})
                    </Text>
                    <ArrowRight size={16} color="#0D0E10" strokeWidth={2.5} />
                  </>
                )}
              </Pressable>

              {/* Secondary CTA: Explore dashboard */}
              <Pressable
                style={styles.exploreWorkspaceBtn}
                onPress={() => handleFinish()}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Explore my workspace"
              >
                <Text style={styles.exploreWorkspaceBtnText}>Explore my workspace</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* ══════════════════════════════════════════════════════
            COUNTRY PICKER MODAL
           ══════════════════════════════════════════════════════ */}
        <Modal
          visible={showCountryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCountryModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <SafeAreaView style={styles.modalSheet} edges={['bottom']}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Country & Currency</Text>
                <Pressable
                  style={styles.modalCloseBtn}
                  onPress={() => setShowCountryModal(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close Country Modal"
                >
                  <X size={20} color="#FFFFFF" />
                </Pressable>
              </View>

              <View style={styles.modalSearchRow}>
                <Search size={16} color="#94A3B8" />
                <TextInput
                  style={styles.modalSearchInput}
                  value={countrySearch}
                  onChangeText={setCountrySearch}
                  placeholder="Search by country, currency or code..."
                  placeholderTextColor="#64748B"
                  autoFocus={true}
                  clearButtonMode="while-editing"
                />
              </View>

              <FlatList
                data={filteredCountries}
                keyExtractor={(item) => item.iso2}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const isSelected = selectedCountry.iso2 === item.iso2;
                  return (
                    <Pressable
                      style={[styles.modalItemRow, isSelected && styles.modalItemRowSelected]}
                      onPress={() => handleSelectCountry(item)}
                    >
                      <CountryFlag iso2={item.iso2} size="md" />
                      <View style={styles.modalItemTextWrap}>
                        <Text style={[styles.modalItemTitle, isSelected && styles.modalItemTitleSelected]}>
                          {item.name}
                        </Text>
                        <Text style={styles.modalItemSub}>
                          {item.currencyCode} ({item.currencySymbol}) • Dial {item.callingCode}
                        </Text>
                      </View>
                      {isSelected && <Check size={18} color="#FFFFFF" />}
                    </Pressable>
                  );
                }}
              />
            </SafeAreaView>
          </View>
        </Modal>

        {/* ══════════════════════════════════════════════════════
            SUBDIVISION PICKER MODAL
           ══════════════════════════════════════════════════════ */}
        <Modal
          visible={showSubdivisionModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSubdivisionModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <SafeAreaView style={styles.modalSheet} edges={['bottom']}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Select State / Province ({selectedCountry.name})
                </Text>
                <Pressable
                  style={styles.modalCloseBtn}
                  onPress={() => setShowSubdivisionModal(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close State Modal"
                >
                  <X size={20} color="#FFFFFF" />
                </Pressable>
              </View>

              <View style={styles.modalSearchRow}>
                <Search size={16} color="#94A3B8" />
                <TextInput
                  style={styles.modalSearchInput}
                  value={subdivisionSearch}
                  onChangeText={setSubdivisionSearch}
                  placeholder="Search states, provinces, territories..."
                  placeholderTextColor="#64748B"
                  autoFocus={true}
                  clearButtonMode="while-editing"
                />
              </View>

              <FlatList
                data={filteredSubdivisions}
                keyExtractor={(item) => item.code}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View style={styles.emptySubdivisionWrap}>
                    <Text style={styles.emptySubdivisionText}>
                      No standard subdivisions listed for this region. You may type a custom state name:
                    </Text>
                    <TextInput
                      style={[styles.textInput, { marginTop: 12 }]}
                      value={customSubdivision}
                      onChangeText={setCustomSubdivision}
                      placeholder="Enter State or Province name"
                      placeholderTextColor="#64748B"
                    />
                    <Pressable
                      style={[styles.primaryButton, { marginTop: 12 }]}
                      onPress={() => {
                        setSelectedSubdivision(null);
                        setShowSubdivisionModal(false);
                      }}
                    >
                      <Text style={styles.primaryButtonText}>Use Custom State</Text>
                    </Pressable>
                  </View>
                }
                renderItem={({ item }) => {
                  const isSelected = selectedSubdivision?.code === item.code;
                  return (
                    <Pressable
                      style={[styles.modalItemRow, isSelected && styles.modalItemRowSelected]}
                      onPress={() => handleSelectSubdivision(item)}
                    >
                      <Building2 size={18} color="#94A3B8" />
                      <View style={styles.modalItemTextWrap}>
                        <Text style={[styles.modalItemTitle, isSelected && styles.modalItemTitleSelected]}>
                          {item.name}
                        </Text>
                        <Text style={styles.modalItemSub}>Code: {item.code}</Text>
                      </View>
                      {isSelected && <Check size={18} color="#FFFFFF" />}
                    </Pressable>
                  );
                }}
              />
            </SafeAreaView>
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
  keyboardAvoid: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },

  // ── Header Bar ──
  headerBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#202227',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  brandMark: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  brandMarkText: {
    color: '#0D0E10',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  versionBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#202227',
    borderWidth: 1,
    borderColor: '#303238',
  },
  versionBadgeText: {
    color: '#9E9EA4',
    fontSize: 10,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 4,
    borderRadius: 2,
    gap: 6,
    marginVertical: 4,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: '#FFFFFF',
  },
  progressSegmentInactive: {
    backgroundColor: '#26282E',
  },
  stepCounterRow: {
    marginTop: 4,
  },
  stepCounterText: {
    color: '#9E9EA4',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // ── Scroll Content ──
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },

  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },

  stepContainer: {
    marginBottom: spacing.xl,
  },
  stepHeading: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  stepSubtitle: {
    color: '#9E9EA4',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },

  // ── Step 1: Intents ──
  optionsList: {
    gap: spacing.md,
  },
  intentCard: {
    backgroundColor: '#16171B',
    borderColor: '#26282E',
    borderWidth: 1.5,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  intentCardSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: '#1E2026',
  },
  intentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  intentIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: '#26282E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  intentIconBoxSelected: {
    backgroundColor: '#303238',
  },
  intentTextWrap: {
    flex: 1,
  },
  intentTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  intentTitleSelected: {
    color: '#FFFFFF',
  },
  intentSubtitle: {
    color: '#9E9EA4',
    fontSize: 12,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4A4D55',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  radioCircleSelected: {
    borderColor: '#FFFFFF',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  intentDescription: {
    color: '#71747F',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },

  // ── Step 2: Form Fields ──
  fieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    color: '#9E9EA4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  reqStar: {
    color: '#EF4444',
  },
  textInput: {
    backgroundColor: '#16171B',
    borderColor: '#26282E',
    borderWidth: 1,
    borderRadius: radii.sm,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    width: '48.5%',
    backgroundColor: '#16171B',
    borderColor: '#26282E',
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: 10,
  },
  typeCardSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: '#202228',
  },
  typeTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  typeTitleSelected: {
    color: '#FFFFFF',
  },
  typeSubtitle: {
    color: '#71747F',
    fontSize: 11,
    marginTop: 3,
    lineHeight: 14,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16171B',
    borderColor: '#26282E',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pickerMainText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
  },
  accordionToggle: {
    paddingVertical: spacing.sm,
    marginVertical: spacing.xs,
  },
  accordionToggleText: {
    color: '#9E9EA4',
    fontSize: 13,
    fontWeight: '600',
  },
  extraContactCard: {
    backgroundColor: '#131418',
    borderColor: '#202227',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  phoneStatusText: {
    fontSize: 11,
    marginTop: 4,
  },
  phoneValid: {
    color: '#10B981',
  },
  phoneInvalid: {
    color: '#94A3B8',
  },

  // ── Step 3: Documents ──
  selectionCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2026',
    borderWidth: 1,
    borderColor: '#303238',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  selectionCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  docsList: {
    gap: spacing.sm,
  },
  docCard: {
    backgroundColor: '#16171B',
    borderColor: '#26282E',
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  docCardSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: '#1D1F25',
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  docTitleBlock: {
    flex: 1,
    marginRight: 12,
  },
  docTitleText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '700',
  },
  docTitleTextSelected: {
    color: '#FFFFFF',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  categoryPill: {
    backgroundColor: '#26282E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  categoryPillText: {
    color: '#9E9EA4',
    fontSize: 10,
    fontWeight: '600',
  },
  readyPill: {
    backgroundColor: '#1E293B',
    borderWidth: 0.5,
    borderColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  readyPillText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
  },
  checkboxSquare: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#4A4D55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSquareSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  docDescText: {
    color: '#71747F',
    fontSize: 12,
    lineHeight: 16,
  },

  // ── Step 4: Summary & Document Preview ──
  summaryCard: {
    backgroundColor: '#16171B',
    borderColor: '#26282E',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLogoBox: {
    width: 56,
    height: 56,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  summaryLogoImage: {
    width: '100%',
    height: '100%',
  },
  summaryMonogramBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryMonogramText: {
    color: '#0D0E10',
    fontSize: 18,
    fontWeight: '900',
  },
  summaryDetailsWrap: {
    flex: 1,
  },
  summaryBusinessName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  summaryLocationText: {
    color: '#9E9EA4',
    fontSize: 12,
    marginTop: 2,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  summaryPill: {
    backgroundColor: '#26282E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  summaryPillText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  summaryTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#26282E',
  },
  summaryTagItem: {
    backgroundColor: '#202227',
    borderWidth: 1,
    borderColor: '#303238',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  summaryTagText: {
    color: '#9E9EA4',
    fontSize: 11,
    fontWeight: '500',
  },

  // ── Miniature A4 Sheet Preview ──
  previewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewSectionTitle: {
    color: '#9E9EA4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  previewSectionBadge: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  sheetPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: 6,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sheetLogoFrame: {
    width: 44,
    height: 44,
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  sheetLogoImage: {
    width: '100%',
    height: '100%',
  },
  sheetMonogramInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetMonogramStar: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
  },
  sheetOrgTextWrap: {
    flex: 1,
  },
  sheetOrgName: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sheetOrgMeta: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '500',
  },
  sheetDocMeta: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  sheetDivider: {
    height: 2,
    backgroundColor: '#000000',
    marginBottom: 10,
  },
  sheetTitleBanner: {
    alignItems: 'center',
    marginBottom: 10,
  },
  sheetDocTitleText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sheetBody: {
    marginBottom: 12,
  },
  sheetDocContent: {
    gap: 8,
  },
  sheetParagraph: {
    color: '#1E293B',
    fontSize: 11,
    lineHeight: 15,
  },
  sheetBold: {
    fontWeight: '800',
    color: '#000000',
  },
  sheetMiniTable: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    padding: 6,
    gap: 4,
  },
  sheetTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  sheetTableCellBold: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '700',
  },
  sheetTableCell: {
    color: '#334155',
    fontSize: 10,
  },
  sheetFooter: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  sheetSignatoryLine: {
    width: 120,
    height: 1,
    backgroundColor: '#000000',
    marginBottom: 4,
  },
  sheetSignatoryText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '700',
  },
  sheetWatermark: {
    color: '#94A3B8',
    fontSize: 8,
    marginTop: 4,
  },

  // ── Bottom Dock ──
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(13, 14, 16, 0.96)',
    borderTopWidth: 1,
    borderTopColor: '#202227',
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2026',
    borderWidth: 1,
    borderColor: '#303238',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.sm,
    minHeight: MIN_TOUCH_TARGET,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radii.sm,
    minHeight: MIN_TOUCH_TARGET,
  },
  primaryButtonText: {
    color: '#0D0E10',
    fontSize: 14,
    fontWeight: '800',
    marginRight: 6,
  },

  // Step 4 Actions
  step4ActionGroup: {
    flex: 1,
    gap: 8,
  },
  createDocHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.sm,
    minHeight: 46,
  },
  createDocHeroBtnText: {
    color: '#0D0E10',
    fontSize: 14,
    fontWeight: '800',
    marginRight: 8,
  },
  exploreWorkspaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E2026',
    borderWidth: 1,
    borderColor: '#303238',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.sm,
    minHeight: 40,
  },
  exploreWorkspaceBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Modals ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#16171B',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '80%',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#26282E',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0E10',
    borderColor: '#26282E',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginVertical: 12,
  },
  modalSearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  modalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#202227',
  },
  modalItemRowSelected: {
    backgroundColor: '#202228',
  },
  modalItemTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  modalItemTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalItemTitleSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modalItemSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  emptySubdivisionWrap: {
    padding: spacing.md,
  },
  emptySubdivisionText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
});

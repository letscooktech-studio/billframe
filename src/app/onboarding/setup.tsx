/**
 * BUSINESS PROFILE & SETTINGS SCREEN
 * Setup business details, seller snapshots, currency, tax IDs, and document prefixes.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Save, Building2, Check, AlertCircle } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { DatabaseManager } from '../../data/database/DatabaseManager';
import { DirectUpiEngine } from '../../domain/payments/upi/DirectUpiEngine';
import { LogoUploader } from '../../components/common/LogoUploader';

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'SGD', 'AED'];

export default function BusinessSetupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [profileId, setProfileId] = useState('default_business_profile');
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('US');
  const [currency, setCurrency] = useState('USD');
  const [upiVpa, setUpiVpa] = useState('');
  const [upiError, setUpiError] = useState<string | null>(null);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [defaultNotes, setDefaultNotes] = useState('');
  const [defaultTerms, setDefaultTerms] = useState('');

  // Number prefixes
  const [invPrefix, setInvPrefix] = useState('INV-');
  const [estPrefix, setEstPrefix] = useState('EST-');
  const [rcpPrefix, setRcpPrefix] = useState('RCP-');

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const db = await DatabaseManager.getDatabaseAsync();
        const profile = await db.getFirstAsync<any>(
          'SELECT * FROM business_profiles WHERE is_active = 1 LIMIT 1;'
        );
        if (profile) {
          setProfileId(profile.id);
          setName(profile.name || '');
          setLegalName(profile.legal_name || '');
          setTaxId(profile.tax_id || '');
          setEmail(profile.email || '');
          setPhone(profile.phone || '');
          setAddressLine1(profile.address_line1 || '');
          setCity(profile.city || '');
          setStateVal(profile.state || '');
          setPostalCode(profile.postal_code || '');
          setCountry(profile.country || 'US');
          setCurrency(profile.default_currency || 'USD');
          setUpiVpa(profile.upi_vpa || '');
          setLogoUri(profile.logo_uri || null);
          setDefaultNotes(profile.default_notes || '');
          setDefaultTerms(profile.default_payment_terms || '');
        }

        const sequences = await db.getAllAsync<{ doc_type: string; prefix: string }>(
          'SELECT doc_type, prefix FROM number_sequences WHERE business_profile_id = ?;',
          [profile?.id || 'default_business_profile']
        );
        for (const s of sequences) {
          if (s.doc_type === 'invoice') setInvPrefix(s.prefix);
          if (s.doc_type === 'estimate') setEstPrefix(s.prefix);
          if (s.doc_type === 'receipt') setRcpPrefix(s.prefix);
        }
      } catch {
        // Non-blocking
      }
    }
    loadProfile();
  }, []);

  async function handleSave() {
    if (!name.trim()) {
      setError('Business name is required.');
      return;
    }

    if (upiVpa.trim()) {
      const vpaCheck = DirectUpiEngine.validateVpa(upiVpa.trim());
      if (!vpaCheck.isValid) {
        setError(`Invalid UPI ID: ${vpaCheck.error}`);
        return;
      }
    }

    setIsSaving(true);
    setError(null);

    try {
      const db = await DatabaseManager.getDatabaseAsync();
      const now = Date.now();

      await db.runAsync(
        `UPDATE business_profiles SET
          name = ?, legal_name = ?, tax_id = ?, email = ?, phone = ?,
          address_line1 = ?, city = ?, state = ?, postal_code = ?, country = ?,
          phone_country_iso2 = ?, phone_e164 = ?, upi_vpa = ?,
          default_currency = ?, default_notes = ?, default_payment_terms = ?,
          logo_uri = ?, updated_at = ?
         WHERE id = ?;`,
        [
          name.trim(),
          legalName.trim() || null,
          taxId.trim() || null,
          email.trim() || null,
          phone.trim() || null,
          addressLine1.trim() || null,
          city.trim() || null,
          stateVal.trim() || null,
          postalCode.trim() || null,
          country.trim() || 'US',
          country.trim() || 'US',
          phone.trim() || null,
          upiVpa.trim() || null,
          currency,
          defaultNotes.trim() || null,
          defaultTerms.trim() || null,
          logoUri || null,
          now,
          profileId,
        ]
      );

      // Update sequence prefixes
      await db.runAsync(
        'UPDATE number_sequences SET prefix = ?, updated_at = ? WHERE business_profile_id = ? AND doc_type = ?;',
        [invPrefix.trim() || 'INV-', now, profileId, 'invoice']
      );
      await db.runAsync(
        'UPDATE number_sequences SET prefix = ?, updated_at = ? WHERE business_profile_id = ? AND doc_type = ?;',
        [estPrefix.trim() || 'EST-', now, profileId, 'estimate']
      );
      await db.runAsync(
        'UPDATE number_sequences SET prefix = ?, updated_at = ? WHERE business_profile_id = ? AND doc_type = ?;',
        [rcpPrefix.trim() || 'RCP-', now, profileId, 'receipt']
      );

      router.back();
    } catch (err: any) {
      setError(err.message || 'Failed to save business settings');
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {/* Top Header */}
        <View style={[styles.topBar, { borderBottomColor: theme.borderSubtle, backgroundColor: theme.surface }]}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft color={theme.textPrimary} size={22} />
          </Pressable>
          <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>Business Profile</Text>
          <Pressable
            style={[styles.saveBtn, { backgroundColor: theme.brandAnchor, opacity: isSaving ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={isSaving}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Save business profile"
          >
            <Text style={[styles.saveBtnText, { color: theme.brandAnchorText }]}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            {error && (
              <View style={[styles.errorBox, { borderColor: theme.statusDanger, backgroundColor: theme.surfaceSecondary }]}>
                <AlertCircle color={theme.statusDanger} size={16} />
                <Text style={[styles.errorText, { color: theme.statusDanger }]}>{error}</Text>
              </View>
            )}

            {/* Business Info */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>COMPANY DETAILS</Text>

              <LogoUploader
                logoUri={logoUri}
                profileId={profileId}
                autoSaveProfile={true}
                onLogoChange={(newUri) => setLogoUri(newUri)}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Business Name *</Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                placeholder="Your Business / Trade Name"
                placeholderTextColor={theme.textMuted}
                value={name}
                onChangeText={setName}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: spacing.sm }]}>Legal Entity Name</Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                placeholder="Official Registered LLC / Corp / LLP Name"
                placeholderTextColor={theme.textMuted}
                value={legalName}
                onChangeText={setLegalName}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: spacing.sm }]}>
                Tax ID / GSTIN / VAT Number
              </Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                placeholder="e.g. EIN 12-3456789 or 27AAAAA0000A1Z5"
                placeholderTextColor={theme.textMuted}
                value={taxId}
                onChangeText={setTaxId}
              />

              <View style={[styles.row, { marginTop: spacing.sm }]}>
                <View style={styles.col}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Email</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                    placeholder="billing@company.com"
                    placeholderTextColor={theme.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Phone</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                    placeholder="+1 555-0100"
                    placeholderTextColor={theme.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: spacing.sm }]}>Address Line</Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                placeholder="Street address, Suite / Floor"
                placeholderTextColor={theme.textMuted}
                value={addressLine1}
                onChangeText={setAddressLine1}
              />

              <View style={[styles.row, { marginTop: spacing.sm }]}>
                <View style={styles.col}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>City</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                    placeholder="City"
                    placeholderTextColor={theme.textMuted}
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Postal Code</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                    placeholder="Postal Code"
                    placeholderTextColor={theme.textMuted}
                    value={postalCode}
                    onChangeText={setPostalCode}
                  />
                </View>
              </View>
            </View>

            {/* Currency selection */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DEFAULT CURRENCY</Text>
              <View style={styles.currencyGrid}>
                {SUPPORTED_CURRENCIES.map((curr) => {
                  const isSelected = currency === curr;
                  return (
                    <Pressable
                      key={curr}
                      style={[
                        styles.currencyChip,
                        {
                          borderColor: isSelected ? theme.brandAnchor : theme.borderSubtle,
                          backgroundColor: isSelected ? theme.surfaceSecondary : theme.surface,
                        },
                      ]}
                      onPress={() => setCurrency(curr)}
                    >
                      {isSelected && <Check size={14} color={theme.brandAnchor} />}
                      <Text
                        style={[
                          styles.currencyText,
                          { color: isSelected ? theme.textPrimary : theme.textSecondary, fontWeight: isSelected ? '700' : '400' },
                        ]}
                      >
                        {curr}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Direct UPI Payment Settings */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DIRECT UPI PAYMENTS (ZERO FEE)</Text>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: spacing.xs }]}>
                Merchant UPI ID / VPA
              </Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                placeholder="e.g. business@okhdfcbank or yourname@upi"
                placeholderTextColor={theme.textMuted}
                value={upiVpa}
                onChangeText={(text) => {
                  setUpiVpa(text);
                  if (text.trim() && !DirectUpiEngine.validateVpa(text.trim()).isValid) {
                    setUpiError(DirectUpiEngine.validateVpa(text.trim()).error || null);
                  } else {
                    setUpiError(null);
                  }
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {upiError ? (
                <Text style={{ color: theme.statusDanger, fontSize: 11, marginTop: 4 }}>{upiError}</Text>
              ) : (
                <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 4 }}>
                  Generates instant offline QR codes on invoices for direct bank-to-bank settlement with 0% gateway fees.
                </Text>
              )}
            </View>

            {/* Document Number Prefixes */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DOCUMENT NUMBER PREFIXES</Text>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Invoice Prefix</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                    placeholder="INV-"
                    placeholderTextColor={theme.textMuted}
                    value={invPrefix}
                    onChangeText={setInvPrefix}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Estimate Prefix</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                    placeholder="EST-"
                    placeholderTextColor={theme.textMuted}
                    value={estPrefix}
                    onChangeText={setEstPrefix}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Receipt Prefix</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                    placeholder="RCP-"
                    placeholderTextColor={theme.textMuted}
                    value={rcpPrefix}
                    onChangeText={setRcpPrefix}
                  />
                </View>
              </View>
            </View>
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
  keyboardView: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  topBarTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  saveBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radii.sm,
  },
  saveBtnText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  scrollContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    gap: spacing.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  errorText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  card: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    height: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.input.fontSize,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  col: {
    flex: 1,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  currencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  currencyText: {
    fontSize: typography.caption.fontSize,
  },
});

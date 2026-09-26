/**
 * CUSTOMER EDIT / CREATE SCREEN
 * Full form for managing customer profile, contact details, tax ID, and billing address.
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { CustomerRepository } from '../../data/repositories/CustomerRepository';

export default function CustomerEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadCustomer() {
      if (!id) return;
      try {
        const cust = await CustomerRepository.getById(id);
        if (cust) {
          setName(cust.name);
          setBusinessName(cust.business_name || '');
          setEmail(cust.email || '');
          setPhone(cust.phone || '');
          setBillingAddress(cust.billing_address || '');
          setShippingAddress(cust.shipping_address || '');
          setTaxId(cust.tax_id || '');
          setNotes(cust.notes || '');
        }
      } catch {
        // Non-blocking
      }
    }
    loadCustomer();
  }, [id]);

  async function handleSave() {
    if (!name.trim()) {
      setError('Customer name is required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (id) {
        await CustomerRepository.update(id, {
          name: name.trim(),
          businessName: businessName.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          billingAddress: billingAddress.trim() || null,
          shippingAddress: shippingAddress.trim() || null,
          country: null,
          taxId: taxId.trim() || null,
          notes: notes.trim() || null,
        });
        router.back();
      } else {
        const created = await CustomerRepository.create({
          name: name.trim(),
          businessName: businessName.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          billingAddress: billingAddress.trim() || null,
          shippingAddress: shippingAddress.trim() || null,
          country: null,
          taxId: taxId.trim() || null,
          notes: notes.trim() || null,
        });
        router.replace(`/customer/${created.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save customer');
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {/* Header */}
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
          <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>
            {id ? 'Edit Customer' : 'New Customer'}
          </Text>
          <Pressable
            style={[styles.saveBtn, { backgroundColor: theme.brandAnchor, opacity: isSaving ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={isSaving}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Save customer"
          >
            <Text style={[styles.saveBtnText, { color: theme.surface }]}>{isSaving ? 'Saving...' : 'Save'}</Text>
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

            {/* General Info */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PRIMARY CONTACT</Text>

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Full Name *</Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                placeholder="e.g. John Doe"
                placeholderTextColor={theme.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus={!id}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: spacing.sm }]}>Company / Business Name</Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                placeholder="e.g. Acme Corp"
                placeholderTextColor={theme.textMuted}
                value={businessName}
                onChangeText={setBusinessName}
              />

              <View style={[styles.row, { marginTop: spacing.sm }]}>
                <View style={styles.col}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Email</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                    placeholder="john@example.com"
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
                    placeholder="+1 555-0199"
                    placeholderTextColor={theme.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>

            {/* Addresses and Tax */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>BILLING & TAX</Text>

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Billing Address</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary },
                ]}
                placeholder="Street address, city, state, postal code..."
                placeholderTextColor={theme.textMuted}
                value={billingAddress}
                onChangeText={setBillingAddress}
                multiline
                numberOfLines={3}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: spacing.sm }]}>
                Tax ID / VAT / GSTIN
              </Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                placeholder="e.g. US123456789 or 27AAAAA0000A1Z5"
                placeholderTextColor={theme.textMuted}
                value={taxId}
                onChangeText={setTaxId}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: spacing.sm }]}>Internal Notes</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary },
                ]}
                placeholder="Internal client notes..."
                placeholderTextColor={theme.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
              />
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
  textArea: {
    height: 72,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  col: {
    flex: 1,
  },
});

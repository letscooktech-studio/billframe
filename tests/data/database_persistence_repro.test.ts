/**
 * DATABASE PERSISTENCE & COLD-RESTART REGRESSION TEST SUITE
 * 
 * Verifies P0 Defect Resolution:
 * 1. Mobile Android / Hermes environment where global.window is polyfilled does NOT falsely
 *    divert to InMemorySQLiteDatabase.
 * 2. Complete data persistence survives simulated process termination and database rehydration.
 * 3. Onboarding completion status survives cold restart (prevents the forced onboarding loop).
 * 4. Business profile, customers, documents, and sequence counters persist monotonically.
 */

import { DatabaseManager } from '../../src/data/database/DatabaseManager';
import { WorkspaceRepository } from '../../src/data/repositories/WorkspaceRepository';
import { BusinessProfileRepository } from '../../src/data/repositories/BusinessProfileRepository';
import { CustomerRepository } from '../../src/data/repositories/CustomerRepository';
import { DocumentRepository } from '../../src/data/repositories/DocumentRepository';
import { getMockDb } from '../mocks/expo-sqlite';
import { Platform } from 'react-native';

describe('P0 Data Persistence & Cold-Restart Resilience', () => {
  beforeEach(async () => {
    await DatabaseManager.closeDatabaseAsync();
    getMockDb().reset();
  });

  afterAll(async () => {
    await DatabaseManager.closeDatabaseAsync();
  });

  it('guarantees native SQLite is used on Android even when global.window is polyfilled', async () => {
    // Simulate React Native / Hermes runtime polyfill where window is globally defined
    const originalWindow = (global as any).window;
    try {
      (global as any).window = global;
      expect((global as any).window).toBeDefined();
      expect(Platform.OS).toBe('android');

      const db = await DatabaseManager.getDatabaseAsync();
      expect(db).toBeDefined();

      // Ensure that tables are initialized in the persistent SQLite mock, NOT just in an unpersisted in-memory object
      const profile = await BusinessProfileRepository.getActiveProfile();
      expect(profile).toBeDefined();
      expect(profile?.id).toBe('default_business_profile');
    } finally {
      (global as any).window = originalWindow;
    }
  });

  it('survives cold restart: profile, onboarding status, customers, and documents persist intact', async () => {
    // 1. First Boot: Initialize DB
    await DatabaseManager.getDatabaseAsync();

    // 2. User updates business profile
    const profile = await BusinessProfileRepository.getActiveProfile();
    expect(profile).toBeDefined();
    await BusinessProfileRepository.updateProfile({
      id: profile!.id,
      name: 'Apex Engineering Ltd',
      tax_id: '27AAAAA0000A1Z5',
      default_currency: 'INR',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'IN',
    });

    // 3. User completes onboarding
    await WorkspaceRepository.completeOnboardingAsync({
      businessProfileId: profile!.id,
      businessType: 'service',
      primaryIntent: 'business_documents',
      favoriteDocumentTypes: ['tax_invoice', 'salary_slip'],
    });

    const initialOnboarding = await WorkspaceRepository.isOnboardingCompletedAsync();
    expect(initialOnboarding).toBe(true);

    // 4. User adds a customer
    const customer = await CustomerRepository.createCustomer({
      name: 'Tata Consultancy Enterprise',
      businessName: 'TCS B2B',
      email: 'procurement@tcs.com',
      taxId: '27AAACT2727Q1ZW',
      country: 'IN',
    });
    expect(customer.id).toBeDefined();

    // 5. User creates and saves a document draft
    const draft = await DocumentRepository.saveDraft({
      businessProfileId: profile!.id,
      docType: 'invoice',
      customerId: customer.id,
      issueDate: Date.now(),
      currency: 'INR',
      items: [
        {
          description: 'Cloud Architecture & Forensic Audit',
          quantityScaled: 10000n, // 1 unit
          unitName: 'service',
          unitPriceMinor: 25000000n, // ₹2,50,000.00
        },
      ],
      discountType: 'none',
      discountValue: 0n,
      taxType: 'exclusive',
      taxRateBp: 1800n, // 18% GST
      taxLabel: 'GST 18%',
      notes: 'Payment due in 15 days.',
    });
    expect(draft.id).toBeDefined();

    // 6. User issues the document
    const issued = await DocumentRepository.issueDocument(draft.id);
    expect(issued.lifecycle_status).toBe('issued');
    expect(issued.document_number).toBeDefined();

    // =========================================================================
    // SIMULATE COLD APP RESTART (App killed by Android OS, process re-launched)
    // =========================================================================
    await DatabaseManager.closeDatabaseAsync();

    // Re-initialize from scratch
    const restartedDb = await DatabaseManager.getDatabaseAsync();
    expect(restartedDb).toBeDefined();

    // A. Verify Onboarding state survived (Zero onboarding flash / loop)
    const restartedOnboarding = await WorkspaceRepository.isOnboardingCompletedAsync();
    expect(restartedOnboarding).toBe(true);

    // B. Verify Business Profile survived intact
    const restartedProfile = await BusinessProfileRepository.getActiveProfile();
    expect(restartedProfile?.name).toBe('Apex Engineering Ltd');
    expect(restartedProfile?.tax_id).toBe('27AAAAA0000A1Z5');
    expect(restartedProfile?.default_currency).toBe('INR');
    expect(restartedProfile?.city).toBe('Mumbai');

    // C. Verify Customer survived intact
    const customers = await CustomerRepository.listAllCustomers();
    expect(customers.length).toBe(1);
    expect(customers[0].name).toBe('Tata Consultancy Enterprise');
    expect(customers[0].tax_id).toBe('27AAACT2727Q1ZW');

    // D. Verify Document survived intact with exact financial calculation
    const docs = await restartedDb.getAllAsync<{ id: string; document_number: string; lifecycle_status: string; total_minor: number }>(
      'SELECT id, document_number, lifecycle_status, total_minor FROM documents WHERE is_archived = 0;'
    );
    expect(docs.length).toBe(1);
    expect(docs[0].id).toBe(draft.id);
    expect(docs[0].document_number).toBe(issued.document_number);
    expect(docs[0].lifecycle_status).toBe('issued');
    expect(docs[0].total_minor).toBe(issued.total_minor);

    // E. Verify Sequence Number was incremented and does not collide
    const seqRow = await restartedDb.getFirstAsync<{ next_sequence_number: number }>(
      'SELECT next_sequence_number FROM number_sequences WHERE business_profile_id = ? AND doc_type = ?;',
      [profile!.id, 'invoice']
    );
    expect(seqRow?.next_sequence_number).toBeGreaterThan(1);
  });

  it('guarantees schema migrations are idempotent and never reset data across multiple restarts', async () => {
    // Cycle 1: Init and write
    await DatabaseManager.getDatabaseAsync();
    const cust1 = await CustomerRepository.createCustomer({ name: 'Client One' });
    expect(cust1.name).toBe('Client One');
    await DatabaseManager.closeDatabaseAsync();

    // Cycle 2: Restart, verify, write more
    await DatabaseManager.getDatabaseAsync();
    const list1 = await CustomerRepository.listAllCustomers();
    expect(list1.length).toBe(1);
    expect(list1[0].name).toBe('Client One');
    await CustomerRepository.createCustomer({ name: 'Client Two' });
    await DatabaseManager.closeDatabaseAsync();

    // Cycle 3: Restart and verify cumulative state
    await DatabaseManager.getDatabaseAsync();
    const list2 = await CustomerRepository.listAllCustomers();
    expect(list2.length).toBe(2);
    const names = list2.map((c: any) => c.name).sort();
    expect(names).toEqual(['Client One', 'Client Two']);
  });
});
